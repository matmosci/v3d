export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const levels = await LevelModel.find({ user: user.id }).select("-user -__v").lean();

    return levels;
});
