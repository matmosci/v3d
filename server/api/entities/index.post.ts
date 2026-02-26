export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const body = await readBody(event);

    // Validate required fields
    if (!body.name || !body.name.trim()) {
        return createError({
            statusCode: 400,
            statusMessage: "Entity name is required",
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
            return createError({
                statusCode: 400,
                statusMessage: "Invalid folder",
            });
        }
    }

    // Create new entity
    const entity = await EntityModel.create({
        user: user.id,
        name: body.name.trim(),
        description: body.description || '',
        folder: body.folder || null,
        camera: {
            position: body.camera?.position || [0, 1.6, 5],
            quaternion: body.camera?.quaternion || [0, 0, 0, 1],
            scale: body.camera?.scale || [1, 1, 1]
        }
    });

    return entity;
});