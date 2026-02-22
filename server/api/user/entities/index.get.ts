export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const entities = await EntityModel.find({ user: user.id }).select("-user -__v").lean();

    return entities;
});
