export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const linkId = getRouterParam(event, 'id');
    
    if (!linkId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Link ID is required'
        });
    }
    
    // Find the entity link
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
    
    // Resolve the target entity
    let entity = null;
    let entityStillExists = true;
    
    try {
        entity = await EntityModel.findOne({ 
            _id: entityLink.targetEntityId, 
            deletedAt: null 
        })
        .populate('user', 'username')
        .lean();
        
        if (!entity) {
            entityStillExists = false;
        }
    } catch (error) {
        entityStillExists = false;
    }
    
    // Update link validity if needed
    if (entityLink.isValid !== entityStillExists) {
        entityLink.isValid = entityStillExists;
        entityLink.lastVerified = new Date();
        await entityLink.save();
    }
    
    return {
        link: {
            _id: entityLink._id,
            targetEntityId: entityLink.targetEntityId,
            name: entityLink.name,
            description: entityLink.description,
            tags: entityLink.tags,
            isValid: entityStillExists,
            lastVerified: entityLink.lastVerified,
            createdAt: entityLink.createdAt
        },
        entity: entity,
        isValid: entityStillExists
    };
});