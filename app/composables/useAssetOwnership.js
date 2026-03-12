export function useAssetOwnership() {
    const { user } = useUserSession();
    const editor = useEditor();
    
    const isOwner = computed(() => {
        if (!user.value) return false;
        
        const context = editor.getContext();
        const assetData = context?.assetData;
        
        return assetData?.user?.toString() === user.value.id?.toString();
    });
    
    const showOwnershipWarning = () => {
        // UI warning is now shown in the page, no popup needed
        console.log('Non-owner placing temporary instance');
    };
    
    const createAssetCopy = async () => {
        const context = editor.getContext();
        const assetData = context?.assetData;
        
        if (!assetData) {
            console.error('No asset data available for copying');
            return null;
        }
        
        try {
            // Create a new asset based on the current one.
            const newAsset = await $fetch('/api/assets', {
                method: 'POST',
                body: {
                    name: `Copy of ${assetData.name}`,
                    description: `Forked from ${assetData.name}`,
                }
            });
            
            // Copy all instances from the original asset.
            const instances = await $fetch(`/api/assets/${assetData._id}/instances`);
            
            for (const instance of instances) {
                await $fetch(`/api/assets/${newAsset._id}/instances`, {
                    method: 'POST',
                    body: {
                        sourceType: instance.sourceType,
                        sourceId: instance.sourceId,
                        position: instance.position,
                        quaternion: instance.quaternion,
                        scale: instance.scale
                    }
                });
            }
            
            // Navigate to the new asset.
            await navigateTo(`/${newAsset._id}`, { external: true });
            
            return newAsset;
        } catch (error) {
            console.error('Failed to create asset copy:', error);
            throw error; // Let caller handle the error
        }
    };
    
    const handleInstancePlacement = async (instanceData) => {
        if (isOwner.value) {
            // User owns the asset, save to server.
            try {
                const context = editor.getContext();
                const assetId = context?.assetId;
                
                if (!assetId) {
                    console.error('No asset loaded');
                    return null;
                }
                
                const createdInstance = await $fetch(`/api/assets/${assetId}/instances`, {
                    method: 'POST',
                    body: instanceData
                });
                
                return createdInstance; // Return the created instance with its ID
            } catch (error) {
                console.error('Failed to save instance:', error);
                return null;
            }
        } else {
            // User doesn't own the asset, allow temporary placement without popups.
            return 'temporary';
        }
    };
    
    return {
        isOwner: readonly(isOwner),
        showOwnershipWarning,
        createAssetCopy,
        handleInstancePlacement
    };
}