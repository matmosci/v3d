export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const assets = await AssetModel.find({ user: user.id, deletedAt: null }).select("-user -__v").lean();

    return assets;
});