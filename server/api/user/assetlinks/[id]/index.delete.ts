export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const linkId = getRouterParam(event, 'id');
    
    if (!linkId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Link ID is required'
        });
    }
    
    // Find and verify ownership
    const assetLink = await AssetLinkModel.findOne({
        _id: linkId,
        user: user.id,
        deletedAt: null
    });
    
    if (!assetLink) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Asset link not found'
        });
    }
    
    // Soft delete the asset link
    assetLink.deletedAt = new Date();
    await assetLink.save();
    
    return { success: true };
});