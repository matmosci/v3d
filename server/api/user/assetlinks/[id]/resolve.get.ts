export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const linkId = getRouterParam(event, 'id');
    
    if (!linkId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Link ID is required'
        });
    }
    
    // Find the asset link
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
    
    // Resolve the target asset
    let asset = null;
    let assetStillExists = true;
    
    try {
        asset = await AssetModel.findOne({ 
            _id: assetLink.targetAssetId,
            deletedAt: null 
        })
        .populate('user', 'username')
        .lean();
        
        if (!asset) {
            assetStillExists = false;
        }
    } catch (error) {
        assetStillExists = false;
    }
    
    // Update link validity if needed
    if (assetLink.isValid !== assetStillExists) {
        assetLink.isValid = assetStillExists;
        assetLink.lastVerified = new Date();
        await assetLink.save();
    }
    
    return {
        link: {
            _id: assetLink._id,
            targetAssetId: assetLink.targetAssetId,
            name: assetLink.name,
            description: assetLink.description,
            tags: assetLink.tags,
            isValid: assetStillExists,
            lastVerified: assetLink.lastVerified,
            createdAt: assetLink.createdAt
        },
        asset,
        isValid: assetStillExists
    };
});