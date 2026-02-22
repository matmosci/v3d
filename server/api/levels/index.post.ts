export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    const body = await readBody(event);

    // Validate required fields
    if (!body.name || !body.name.trim()) {
        return createError({
            statusCode: 400,
            statusMessage: "Level name is required",
        });
    }

    // Create new level
    const level = await LevelModel.create({
        user: user.id,
        name: body.name.trim(),
        description: body.description || '',
        camera: {
            position: body.camera?.position || [0, 1.6, 5],
            quaternion: body.camera?.quaternion || [0, 0, 0, 1],
            scale: body.camera?.scale || [1, 1, 1]
        }
    });

    return level;
});
