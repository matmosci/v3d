export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;
    const { camera, thumbnail } = await readBody(event);

    // Find the asset and verify ownership (future: check if user has modify permissions)
    const asset = await AssetModel.findOne({ _id: id, deletedAt: null });
    if (!asset) {
        return createError({
            statusCode: 404,
            statusMessage: "Asset not found",
        });
    }

    // Check ownership - future: expand to check collaborator permissions
    if (asset.user.toString() !== user.id) {
        return createError({
            statusCode: 403,
            statusMessage: "You don't have permission to update this asset",
        });
    }

    // Prepare update data
    const updateData = {
        camera: {
            position: camera.position || [0, 1.6, 5],
            quaternion: camera.quaternion || [0, 0, 0, 1],
            scale: camera.scale || [1, 1, 1]
        }
    };

    // Also update thumbnail if provided
    if (thumbnail) {
        updateData.thumbnail = thumbnail;
    }

    // Update camera transform and thumbnail
    await AssetModel.findByIdAndUpdate(id, updateData);

    return { success: true };
});