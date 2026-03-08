export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const sessionUser = user as any;
    const userId = sessionUser.id || sessionUser._id;
    const { id } = getRouterParams(event);  
    const body = await readBody(event);

    // Find the asset
    const asset = await AssetModel.findOne({ 
        _id: id, 
        user: userId,
        deletedAt: null 
    });
    
    if (!asset) {
        throw createError({
            statusCode: 404,
            statusMessage: "Asset not found"
        });
    }

    // Allowed fields to update  
    const allowedFields = ['originalname', 'description', 'tags', 'lodDistances'];
    const updates: Record<string, any> = {};
    
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates[field] = body[field];
        }
    }
    
    // Clean up tags - remove empty strings and duplicates
    if (updates.tags) {
        updates.tags = [...new Set(updates.tags.filter((tag: string) => tag && tag.trim()))];
    }

    if (updates.lodDistances !== undefined) {
        if (!Array.isArray(updates.lodDistances)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'lodDistances must be an array',
            });
        }

        updates.lodDistances = updates.lodDistances
            .map((value: unknown) => Number(value))
            .map((value: number) => (Number.isFinite(value) && value >= 0 ? value : null));

        if (updates.lodDistances.some((value: number | null) => value === null)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'lodDistances must contain non-negative numbers',
            });
        }
    }

    // Update the asset
    const updatedAsset = await AssetModel.findByIdAndUpdate(
        id, 
        updates, 
        { new: true }
    ).select("-user -__v");

    return updatedAsset;
});