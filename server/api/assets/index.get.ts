export default defineEventHandler(async (event) => {
    // Public endpoint for collaborative access - all assets visible to everyone
    const assets = await AssetModel.find({ deletedAt: null })
        .select("-__v -user") // Don't expose user info for privacy
        .sort({ createdAt: -1 })
        .lean();

    return assets;
});