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

    // Validate folder if provided
    if (body.folder) {
        const folder = await FolderModel.findOne({ 
            _id: body.folder, 
            user: user.id, 
            deletedAt: null 
        });
        
        if (!folder) {
            throw createError({
                statusCode: 400,
                statusMessage: "Invalid folder"
            });
        }
    }

    // Update the asset folder
    const updatedAsset = await AssetModel.findByIdAndUpdate(
        id, 
        { folder: body.folder || null }, 
        { new: true }
    ).select("-user -__v");

    return updatedAsset;
});