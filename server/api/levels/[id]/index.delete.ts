export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = event.context.params;

    // Find the level and verify ownership
    const level = await LevelModel.findById(id);
    if (!level) {
        return createError({
            statusCode: 404,
            statusMessage: "Level not found",
        });
    }

    if (level.user.toString() !== user.id) {
        return createError({
            statusCode: 403,
            statusMessage: "You don't have permission to delete this level",
        });
    }

    // Delete all instances associated with this level
    await InstanceModel.deleteMany({ level: id });

    // Delete the level
    await LevelModel.findByIdAndDelete(id);

    return { success: true };
});
