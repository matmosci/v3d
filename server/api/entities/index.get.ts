export default defineEventHandler(async (event) => {
    // Public endpoint for collaborative access - all entities visible to everyone
    const entities = await EntityModel.find({ deletedAt: null })
        .populate('user', 'email') // Include owner info for attribution
        .select("-__v")
        .sort({ createdAt: -1 })
        .lean();

    return entities;
});