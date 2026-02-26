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

    // Find all child folders (descendants) in a single query to collect all content
    const aggregationResult = await FolderModel.aggregate([
        {
            $match: {
                _id: folder._id,
                user: user.id,
                deletedAt: null
            }
        },
        {
            $graphLookup: {
                from: FolderModel.collection.name,
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'descendants',
                restrictSearchWithMatch: {
                    user: user.id,
                    deletedAt: null
                }
            }
        },
        {
            $project: {
                allFolderIds: {
                    $concatArrays: [['$_id'], '$descendants._id']
                }
            }
        }
    ]);

    const allFolderIds = (aggregationResult[0]?.allFolderIds) || [folder._id];
    
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