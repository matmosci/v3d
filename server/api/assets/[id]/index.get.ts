export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const asset = await AssetModel.findById(id).select('-__v -user.email').lean();
    if (!asset) {
        return createError({
            statusCode: 404,
            statusMessage: "Asset not found",
        });
    };
    return asset;
});
