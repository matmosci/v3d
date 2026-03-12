export function useCameraSaveOnThumbnail(assetId) {
    const isSaving = ref(false);
    
    const saveWithThumbnail = async (camera, thumbnailData) => {
        try {
            isSaving.value = true;
            const id = unref(assetId); // Handle both refs and plain values
            await $fetch(`/api/assets/${id}/camera`, {
                method: 'PUT',
                body: { 
                    camera,
                    thumbnail: thumbnailData
                }
            });
        } catch (error) {
            console.error('Failed to save camera position:', error);
        } finally {
            isSaving.value = false;
        }
    };
    
    return {
        isSaving: readonly(isSaving),
        saveWithThumbnail
    };
}