export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const body = await readBody(event);

    // Validate required fields
    if (!body.name || !body.name.trim()) {
        throw createError({
            statusCode: 400,
            statusMessage: "Folder name is required",
        });
    }

    // Check if parent folder exists (if provided) and belongs to user
    if (body.parent) {
        const parentFolder = await FolderModel.findOne({ 
            _id: body.parent, 
            user: user.id, 
            deletedAt: null 
        });
        
        if (!parentFolder) {
            throw createError({
                statusCode: 400,
                statusMessage: "Invalid parent folder",
            });
        }
    }

    // Create the folder
    const folder = await FolderModel.create({
        user: user.id,
        name: body.name.trim(),
        parent: body.parent || null,
        color: body.color || '#3b82f6'
    });

    return folder;
});