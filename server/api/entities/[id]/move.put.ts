export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = getRouterParams(event);
    const body = await readBody(event);

    // Find the entity
    const entity = await EntityModel.findOne({ 
        _id: id, 
        user: user.id, 
        deletedAt: null 
    });
    
    if (!entity) {
        throw createError({
            statusCode: 404,
            statusMessage: "Entity not found"
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

    // Update the entity folder
    const updatedEntity = await EntityModel.findByIdAndUpdate(
        id, 
        { folder: body.folder || null }, 
        { new: true }
    ).select("-user -__v");

    return updatedEntity;
});