export default defineEventHandler(async (event) => {
    // Get user session (optional for this public endpoint)
    const session = await getUserSession(event);
    const userId = session?.user?.id || null;

    // Public endpoint for collaborative access - all entities visible to everyone
    const entities = await EntityModel.find({ deletedAt: null })
        .select("-__v -user") // Don't expose user info for privacy
        .sort({ createdAt: -1 })
        .lean();

    // Add vote counts and user vote status to each entity
    const entitiesWithVotes = entities.map(entity => {
        const votes = entity.votes || [];
        const likes = votes.filter(v => v.type === 'like');
        const dislikes = votes.filter(v => v.type === 'dislike');
        const userVote = userId ? votes.find(v => v.user.toString() === userId.toString()) : null;

        return {
            ...entity,
            likesCount: likes.length,
            dislikesCount: dislikes.length,
            userVote: userVote ? userVote.type : null,
            votes: undefined // Remove votes array from response for cleaner payload
        };
    });

    return entitiesWithVotes;
});