export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;

    // Find the entity and verify ownership (future: check if user has modify permissions)
    const entity = await EntityModel.findOne({ _id: id, deletedAt: null });
    if (!entity) {
        return createError({
            statusCode: 404,
            statusMessage: "Entity not found",
        });
    }

    // Check ownership - future: expand to check collaborator permissions
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
