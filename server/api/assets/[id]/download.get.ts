import fs from 'fs';
import { parseLodLevel, resolveBestLodFile } from '../../../utils/asset-lod';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const directory = config.uploads.path || './uploads';
    const params = getRouterParams(event);
    const query = getQuery(event);
    const requestedLevel = parseLodLevel(query.lod, 0);
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

    const resolvedFile = resolveBestLodFile(directory, id, requestedLevel);
    if (!resolvedFile || !fs.existsSync(resolvedFile.absolutePath)) {
        throw createError({
            statusCode: 404,
            statusMessage: 'File not found',
        });
    }

    const extension = asset.originalname?.toLowerCase().endsWith('.glb') ? '.glb' : '';
    const baseName = extension ? asset.originalname.slice(0, -4) : (asset.originalname || id);
    const filename = `${baseName}-lod${resolvedFile.selectedLevel}${extension || '.glb'}`;
    const encodedFilename = encodeURIComponent(filename);

    setHeader(event, 'Content-Type', 'model/gltf-binary');
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);

    return sendStream(event, fs.createReadStream(resolvedFile.absolutePath));
});
