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

    // Find all child folders recursively to collect all content
    const getAllChildFolderIds = async (folderId) => {
        const childFolders = await FolderModel.find({ parent: folderId, deletedAt: null }).select('_id');
        let allIds = [folderId];
        
        for (const child of childFolders) {
            const descendants = await getAllChildFolderIds(child._id);
            allIds = allIds.concat(descendants);
        }
        
        return allIds;
    };

    const allFolderIds = await getAllChildFolderIds(id);
    
    // Move all assets and entities from all these folders to root (folder: null)
    await Promise.all([
        AssetModel.updateMany(
            { folder: { $in: allFolderIds }, user: user.id, deletedAt: null },
            { folder: null }
        ),
        EntityModel.updateMany(
            { folder: { $in: allFolderIds }, user: user.id, deletedAt: null },
            { folder: null }
        )
    ]);

    // Soft delete all folders in the hierarchy
    await FolderModel.updateMany(
        { _id: { $in: allFolderIds }, user: user.id },
        { deletedAt: new Date() }
    );

    return { success: true, movedToRoot: true };
});