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

        // Find the asset
        const asset = await AssetModel.findById(id);
        if (!asset) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Asset not found'
            });
        }

        // Check if asset is deleted
        if (asset.deletedAt) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Asset not found'
            });
        }

        // Find existing vote by this user
        const existingVoteIndex = asset.votes.findIndex(vote => 
            vote.user.toString() === userId.toString()
        );

        if (existingVoteIndex !== -1) {
            const existingVote = asset.votes[existingVoteIndex];
            
            if (existingVote.type === voteType) {
                // Same vote type - remove the vote (toggle off)
                asset.votes.splice(existingVoteIndex, 1);
            } else {
                // Different vote type - change the vote
                asset.votes[existingVoteIndex].type = voteType;
                asset.votes[existingVoteIndex].createdAt = new Date();
            }
        } else {
            // No existing vote - add new vote
            asset.votes.push({
                user: userId,
                type: voteType,
                createdAt: new Date()
            });
        }

        // Save the asset
        await asset.save();

        // Calculate current vote counts and user's vote status
        const likes = asset.votes.filter(v => v.type === 'like');
        const dislikes = asset.votes.filter(v => v.type === 'dislike');
        const userVote = asset.votes.find(v => v.user.toString() === userId.toString());

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