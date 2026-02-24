export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const entities = await EntityModel.find({ user: user.id, deletedAt: null })
        .select("-user -__v")
        .sort({ createdAt: -1 })
        .lean();

    return entities;
});
