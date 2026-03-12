import fs from 'fs';
import { parseLodLevel, resolveBestLodFile } from '../../../utils/asset-lod';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const directory = config.uploads.path || "./uploads";
    const { id } = getRouterParams(event);
    const query = getQuery(event);
    const requestedLevel = parseLodLevel(query.lod, 0);
    const resolvedFile = resolveBestLodFile(directory, id, requestedLevel);

    if (!resolvedFile || !fs.existsSync(resolvedFile.absolutePath)) {
        return createError({
            statusCode: 404,
            statusMessage: "File not found",
        });
    };

    setHeader(event, 'X-Asset-Lod-Requested', String(requestedLevel));
    setHeader(event, 'X-Asset-Lod-Selected', String(resolvedFile.selectedLevel));

    const fileData = fs.readFileSync(resolvedFile.absolutePath);
    return fileData;
});
