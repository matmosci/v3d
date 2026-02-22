export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;

    // Find the entity and verify ownership
    const entity = await EntityModel.findById(id);
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

    // Delete all instances associated with this entity
    await InstanceModel.deleteMany({ entity: id });

    // Delete the entity
    await EntityModel.findByIdAndDelete(id);

    return { success: true };
});
