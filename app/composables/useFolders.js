export const useFolders = () => {
    const folders = ref([]);
    const currentFolder = ref(null);
    const loading = ref(false);

    // Fetch all folders for the user
    const fetchFolders = async () => {
        try {
            loading.value = true;
            const data = await $fetch('/api/user/folders');
            folders.value = data;
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            loading.value = false;
        }
    };

    // Create a new folder
    const createFolder = async (name, parentId = null, color = '#3b82f6') => {
        try {
            const folder = await $fetch('/api/user/folders', {
                method: 'POST',
                body: { name, parent: parentId, color }
            });
            
            folders.value.push(folder);
            return folder;
        } catch (error) {
            console.error('Failed to create folder:', error);
            throw error;
        }
    };

    // Update folder (rename, change color, move)
    const updateFolder = async (folderId, updates) => {
        try {
            const updatedFolder = await $fetch(`/api/user/folders/${folderId}`, {
                method: 'PUT',
                body: updates
            });
            
            const index = folders.value.findIndex(f => f._id === folderId);
            if (index !== -1) {
                folders.value[index] = updatedFolder;
            }
            
            return updatedFolder;
        } catch (error) {
            console.error('Failed to update folder:', error);
            throw error;
        }
    };

    // Delete folder
    const deleteFolder = async (folderId) => {
        try {
            await $fetch(`/api/user/folders/${folderId}`, {
                method: 'DELETE'
            });
            
            folders.value = folders.value.filter(f => f._id !== folderId);
        } catch (error) {
            console.error('Failed to delete folder:', error);
            throw error;
        }
    };

    // Move item (asset or entity) to folder
    const moveItem = async (itemId, itemType, targetFolderId) => {
        try {
            const endpoint = itemType === 'asset' ? 'assets' : 'entities';
            const updatedItem = await $fetch(`/api/${endpoint}/${itemId}/move`, {
                method: 'PUT',
                body: { folder: targetFolderId }
            });
            
            return updatedItem;
        } catch (error) {
            console.error('Failed to move item:', error);
            throw error;
        }
    };

    // Build folder tree structure
    const buildFolderTree = () => {
        const folderMap = new Map();
        const rootFolders = [];

        // Create map for quick lookup
        folders.value.forEach(folder => {
            folderMap.set(folder._id, { ...folder, children: [] });
        });

        // Build tree
        folders.value.forEach(folder => {
            if (folder.parent) {
                const parent = folderMap.get(folder.parent);
                if (parent) {
                    parent.children.push(folderMap.get(folder._id));
                }
            } else {
                rootFolders.push(folderMap.get(folder._id));
            }
        });

        return rootFolders;
    };

    // Get folder path breadcrumbs
    const getFolderPath = (folderId) => {
        if (!folderId) return [];
        
        const path = [];
        let currentId = folderId;
        
        while (currentId) {
            const folder = folders.value.find(f => f._id === currentId);
            if (!folder) break;
            
            path.unshift(folder);
            currentId = folder.parent;
        }
        
        return path;
    };

    return {
        folders: readonly(folders),
        currentFolder,
        loading: readonly(loading),
        fetchFolders,
        createFolder,
        updateFolder,
        deleteFolder,
        moveItem,
        buildFolderTree,
        getFolderPath
    };
};