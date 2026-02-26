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

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'tags'];
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

    // Update the entity
    const updatedEntity = await EntityModel.findByIdAndUpdate(
        id, 
        updates, 
        { new: true }
    ).select("-user -__v");

    return updatedEntity;
});