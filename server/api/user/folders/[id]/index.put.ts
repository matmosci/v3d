export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = getRouterParams(event);
    const body = await readBody(event);

    // Find the folder
    const folder = await FolderModel.findOne({ 
        _id: id, 
        user: user.id, 
        deletedAt: null 
    });
    
    if (!folder) {
        throw createError({
            statusCode: 404,
            statusMessage: "Folder not found"
        });
    }

    const updateData = {};

    // Update name if provided
    if (body.name !== undefined) {
        if (!body.name.trim()) {
            throw createError({
                statusCode: 400,
                statusMessage: "Folder name cannot be empty"
            });
        }
        updateData.name = body.name.trim();
    }

    // Update color if provided
    if (body.color !== undefined) {
        updateData.color = body.color;
    }

    // Update parent if provided (moving folder)
    if (body.parent !== undefined) {
        if (body.parent) {
            // Check if new parent exists and belongs to user
            const parentFolder = await FolderModel.findOne({ 
                _id: body.parent, 
                user: user.id, 
                deletedAt: null 
            });
            
            if (!parentFolder) {
                throw createError({
                    statusCode: 400,
                    statusMessage: "Invalid parent folder"
                });
            }

            // Prevent circular references
            if (body.parent === id) {
                throw createError({
                    statusCode: 400,
                    statusMessage: "Folder cannot be its own parent"
                });
            }

            // Check if the new parent is not a descendant of this folder
            const isDescendant = await checkIfDescendant(body.parent, id);
            if (isDescendant) {
                throw createError({
                    statusCode: 400,
                    statusMessage: "Cannot move folder into its own descendant"
                });
            }
        }
        updateData.parent = body.parent;
    }

    // Update the folder
    const updatedFolder = await FolderModel.findByIdAndUpdate(id, updateData, { new: true });

    return updatedFolder;
});

// Helper function to check if a folder is a descendant of another
async function checkIfDescendant(folderId, ancestorId) {
    const folder = await FolderModel.findById(folderId);
    if (!folder || !folder.parent) return false;
    
    if (folder.parent === ancestorId) return true;
    
    return await checkIfDescendant(folder.parent, ancestorId);
}