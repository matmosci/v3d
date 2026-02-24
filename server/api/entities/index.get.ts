export default defineEventHandler(async (event) => {
    // Public endpoint for collaborative access - all entities visible to everyone
    const entities = await EntityModel.find({ deletedAt: null })
        .select("-__v -user") // Don't expose user info for privacy
        .sort({ createdAt: -1 })
        .lean();

    return entities;
});