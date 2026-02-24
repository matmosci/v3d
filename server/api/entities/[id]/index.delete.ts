export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;

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
            statusMessage: "You don't have permission to delete this entity",
        });
    }

    // Soft delete the entity
    await EntityModel.findByIdAndUpdate(id, { deletedAt: new Date() });

    return { success: true };
});
