import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const directory = config.uploads.path || './uploads';
    const params = getRouterParams(event);
    const id = params?.id;
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Asset id is required',
        });
    }

    const asset = await AssetModel.findOne({ _id: id, deletedAt: null }).select('originalname').lean();
    if (!asset) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Asset not found',
        });
    }

    const filePath = path.join(directory, id);
    if (!fs.existsSync(filePath)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'File not found',
        });
    }

    const filename = `${asset.originalname || `${id}.glb`}`;
    const encodedFilename = encodeURIComponent(filename);

    setHeader(event, 'Content-Type', 'model/gltf-binary');
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);

    return sendStream(event, fs.createReadStream(filePath));
});
