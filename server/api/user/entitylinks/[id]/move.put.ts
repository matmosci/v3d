export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const { id } = getRouterParams(event);
    const body = await readBody(event);

    // Ensure the link belongs to the current user.
    const entityLink = await EntityLinkModel.findOne({
        _id: id,
        user: user.id,
        deletedAt: null
    });

    if (!entityLink) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Entity link not found'
        });
    }

    // Validate folder ownership when moving into a folder.
    if (body.folder) {
        const folder = await FolderModel.findOne({
            _id: body.folder,
            user: user.id,
            deletedAt: null
        });

        if (!folder) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid folder'
            });
        }
    }

    const updatedEntityLink = await EntityLinkModel.findByIdAndUpdate(
        id,
        { folder: body.folder || null },
        { new: true }
    ).select('-user -__v');

    return updatedEntityLink;
});
