export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const body = await readBody(event);
    
    const { targetAssetId, name, description, tags, folder } = body;
    
    // Validate input
    if (!targetAssetId || !name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields: targetAssetId, name'
        });
    }
    
    // Verify target entity exists and get metadata for caching
    let targetOwner = null;
    let cachedThumbnail = null;
    
    try {
        const asset = await AssetModel.findOne({ _id: targetAssetId, deletedAt: null })
            .populate('user', '_id')
            .lean();
        
        if (!asset) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Target asset not found'
            });
        }
        
        targetOwner = asset.user._id;
        cachedThumbnail = asset.thumbnail;
    } catch (error) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Error verifying target asset'
        });
    }
    
    // Check if link already exists for this user and target
    const existingLink = await AssetLinkModel.findOne({
        user: user.id,
        targetAssetId,
        deletedAt: null
    });
    
    if (existingLink) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Link to this entity already exists'
        });
    }
    
    // Create the asset link
    const assetLink = new AssetLinkModel({
        user: user.id,
        folder: folder || null,
        targetAssetId,
        targetOwner,
        name,
        description: description || '',
        tags: tags || [],
        cachedThumbnail,
        lastVerified: new Date(),
        isValid: true
    });
    
    await assetLink.save();
    
    // Return the created link without sensitive data
    const { user: _, __v, ...linkData } = assetLink.toObject();
    
    return linkData;
});