export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const query = getQuery(event);
    const folderId = query.folder || null;

    // Build query filter
    const filter = { 
        user: user.id, 
        deletedAt: null,
        folder: folderId
    };

    const assets = await AssetModel.find(filter)
        .select("-user -__v")
        .sort({ createdAt: -1 })
        .lean();

    return assets;
});