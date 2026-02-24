export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;
    const { camera, thumbnail } = await readBody(event);

    // Find the entity and verify ownership
    const entity = await EntityModel.findOne({ _id: id, deletedAt: null });
    if (!entity) {
        return createError({
            statusCode: 404,
            statusMessage: "Entity not found",
        });
    }

    if (entity.user.toString() !== user.id) {
        return createError({
            statusCode: 403,
            statusMessage: "You don't have permission to update this entity",
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
    await EntityModel.findByIdAndUpdate(id, updateData);

    return { success: true };
});