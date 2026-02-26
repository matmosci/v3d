export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = getRouterParams(event);  
    const body = await readBody(event);

    // Find the asset
    const asset = await AssetModel.findOne({ 
        _id: id, 
        user: user.id, 
        deletedAt: null 
    });
    
    if (!asset) {
        throw createError({
            statusCode: 404,
            statusMessage: "Asset not found"
        });
    }

    // Allowed fields to update  
    const allowedFields = ['originalname', 'description', 'tags'];
    const updates = {};
    
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }
    
    // Clean up tags - remove empty strings and duplicates
    if (updates.tags) {
        updates.tags = [...new Set(updates.tags.filter(tag => tag && tag.trim()))];
    }

    // Update the asset
    const updatedAsset = await AssetModel.findByIdAndUpdate(
        id, 
        updates, 
        { new: true }
    ).select("-user -__v");

    return updatedAsset;
});