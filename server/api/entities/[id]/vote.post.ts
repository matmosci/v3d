export default defineEventHandler(async (event) => {
    try {
        const { id } = getRouterParams(event);
        const { voteType } = await readBody(event);

        // Validate vote type
        if (!['like', 'dislike'].includes(voteType)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid vote type. Must be "like" or "dislike"'
            });
        }

        // Get authenticated user using Nuxt's session system
        const { user } = await requireUserSession(event);
        const userId = user.id;

        // Find the entity
        const entity = await EntityModel.findById(id);
        if (!entity) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Entity not found'
            });
        }

        // Check if entity is deleted
        if (entity.deletedAt) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Entity not found'
            });
        }

        // Find existing vote by this user
        const existingVoteIndex = entity.votes.findIndex(vote => 
            vote.user.toString() === userId.toString()
        );

        if (existingVoteIndex !== -1) {
            const existingVote = entity.votes[existingVoteIndex];
            
            if (existingVote.type === voteType) {
                // Same vote type - remove the vote (toggle off)
                entity.votes.splice(existingVoteIndex, 1);
            } else {
                // Different vote type - change the vote
                entity.votes[existingVoteIndex].type = voteType;
                entity.votes[existingVoteIndex].createdAt = new Date();
            }
        } else {
            // No existing vote - add new vote
            entity.votes.push({
                user: userId,
                type: voteType,
                createdAt: new Date()
            });
        }

        // Save the entity
        await entity.save();

        // Calculate current vote counts and user's vote status
        const likes = entity.votes.filter(v => v.type === 'like');
        const dislikes = entity.votes.filter(v => v.type === 'dislike');
        const userVote = entity.votes.find(v => v.user.toString() === userId.toString());

        return {
            success: true,
            likesCount: likes.length,
            dislikesCount: dislikes.length,
            userVote: userVote ? userVote.type : null
        };

    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        
        console.error('Vote error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to process vote'
        });
    }
});