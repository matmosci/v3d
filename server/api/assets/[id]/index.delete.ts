export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;

    // Find the asset and verify ownership
    const asset = await AssetModel.findOne({ _id: id, deletedAt: null });
    if (!asset) {
        return createError({
            statusCode: 404,
            statusMessage: "Asset not found",
        });
    }

    if (asset.user.toString() !== user.id) {
        return createError({
            statusCode: 403,
            statusMessage: "You don't have permission to delete this asset",
        });
    }

    // Soft delete the asset
    await AssetModel.findByIdAndUpdate(id, { deletedAt: new Date() });

    return { success: true };
});