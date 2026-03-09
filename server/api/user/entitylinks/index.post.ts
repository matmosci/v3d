export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const body = await readBody(event);
    
    const { targetEntityId, name, description, tags, folder } = body;
    
    // Validate input
    if (!targetEntityId || !name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields: targetEntityId, name'
        });
    }
    
    // Verify target entity exists and get metadata for caching
    let targetOwner = null;
    let cachedThumbnail = null;
    
    try {
        const entity = await EntityModel.findOne({ _id: targetEntityId, deletedAt: null })
            .populate('user', '_id')
            .lean();
        
        if (!entity) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Target entity not found'
            });
        }
        
        targetOwner = entity.user._id;
        cachedThumbnail = entity.thumbnail;
    } catch (error) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Error verifying target entity'
        });
    }
    
    // Check if link already exists for this user and target
    const existingLink = await EntityLinkModel.findOne({
        user: user.id,
        targetEntityId,
        deletedAt: null
    });
    
    if (existingLink) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Link to this entity already exists'
        });
    }
    
    // Create the entity link
    const entityLink = new EntityLinkModel({
        user: user.id,
        folder: folder || null,
        targetEntityId,
        targetOwner,
        name,
        description: description || '',
        tags: tags || [],
        cachedThumbnail,
        lastVerified: new Date(),
        isValid: true
    });
    
    await entityLink.save();
    
    // Return the created link without sensitive data
    const { user: _, __v, ...linkData } = entityLink.toObject();
    
    return linkData;
});