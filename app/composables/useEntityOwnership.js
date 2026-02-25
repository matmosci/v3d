export function useEntityOwnership() {
    const { user } = useUserSession();
    const editor = useEditor();
    
    const isOwner = computed(() => {
        if (!user.value) return false;
        
        const context = editor.getContext();
        const entityData = context?.entityData;
        
        return entityData?.user?.toString() === user.value.id?.toString();
    });
    
    const showOwnershipWarning = () => {
        // UI warning is now shown in the page, no popup needed
        console.log('Non-owner placing temporary instance');
    };
    
    const createEntityCopy = async () => {
        const context = editor.getContext();
        const entityData = context?.entityData;
        
        if (!entityData) {
            console.error('No entity data available for copying');
            return null;
        }
        
        try {
            // Create a new entity based on current one
            const newEntity = await $fetch('/api/entities', {
                method: 'POST',
                body: {
                    name: `Copy of ${entityData.name}`,
                    description: `Forked from ${entityData.name}`,
                }
            });
            
            // Copy all instances from original entity
            const instances = await $fetch(`/api/entities/${entityData._id}/instances`);
            
            for (const instance of instances) {
                await $fetch(`/api/entities/${newEntity._id}/instances`, {
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
            
            // Navigate to the new entity
            await navigateTo(`/${newEntity._id}`);
            
            return newEntity;
        } catch (error) {
            console.error('Failed to create entity copy:', error);
            throw error; // Let caller handle the error
        }
    };
    
    const handleInstancePlacement = async (instanceData) => {
        if (isOwner.value) {
            // User owns the entity, save to server
            try {
                const context = editor.getContext();
                const entityId = context?.entity;
                
                if (!entityId) {
                    console.error('No entity loaded');
                    return false;
                }
                
                await $fetch(`/api/entities/${entityId}/instances`, {
                    method: 'POST',
                    body: instanceData
                });
                
                return true;
            } catch (error) {
                console.error('Failed to save instance:', error);
                return false;
            }
        } else {
            // User doesn't own entity, allow temporary placement without popups
            return 'temporary';
        }
    };
    
    return {
        isOwner: readonly(isOwner),
        showOwnershipWarning,
        createEntityCopy,
        handleInstancePlacement
    };
}