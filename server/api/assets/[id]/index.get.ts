export default defineEventHandler(async (event) => {
    // Public read access - no user auth required for collaborative work
    const { id } = event.context.params;
    const asset = await AssetModel.findOne({ _id: id, deletedAt: null }).select('-__v').lean();
    if (!asset) {
        return createError({
            statusCode: 404,
            statusMessage: "Asset not found",
        });
    };
    return asset;
});
