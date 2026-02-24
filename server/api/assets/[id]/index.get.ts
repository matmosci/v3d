export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const asset = await AssetModel.findOne({ _id: id, deletedAt: null }).select('-__v -user.email').lean();
    if (!asset) {
        return createError({
            statusCode: 404,
            statusMessage: "Asset not found",
        });
    };
    return asset;
});
