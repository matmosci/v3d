export function useCameraSaveOnThumbnail(entityId) {
    const isSaving = ref(false);
    
    const saveWithThumbnail = async (camera, thumbnailData) => {
        try {
            isSaving.value = true;
            await $fetch(`/api/entities/${entityId}/camera`, {
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