export default defineEventHandler(async (event) => {
    // Public endpoint for collaborative access - all assets visible to everyone
    const assets = await AssetModel.find({ deletedAt: null })
        .populate('user', 'email') // Include owner info for attribution
        .select("-__v")
        .sort({ createdAt: -1 })
        .lean();

    return assets;
});