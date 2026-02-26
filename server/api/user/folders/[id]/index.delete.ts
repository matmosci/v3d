export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = getRouterParams(event);

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

    // Check if folder has children (subfolders or assets/entities)
    const hasChildren = await Promise.all([
        FolderModel.countDocuments({ parent: id, deletedAt: null }),
        AssetModel.countDocuments({ folder: id, deletedAt: null }),
        EntityModel.countDocuments({ folder: id, deletedAt: null })
    ]);

    const totalChildren = hasChildren.reduce((sum, count) => sum + count, 0);
    
    if (totalChildren > 0) {
        throw createError({
            statusCode: 400,
            statusMessage: "Cannot delete folder that contains items. Please move or delete contents first."
        });
    }

    // Soft delete the folder
    await FolderModel.findByIdAndUpdate(id, { deletedAt: new Date() });

    return { success: true };
});