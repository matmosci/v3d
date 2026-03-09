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
    const entityLink = await EntityLinkModel.findOne({
        _id: linkId,
        user: user.id,
        deletedAt: null
    });
    
    if (!entityLink) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Entity link not found'
        });
    }
    
    // Soft delete the entity link
    entityLink.deletedAt = new Date();
    await entityLink.save();
    
    return { success: true };
});