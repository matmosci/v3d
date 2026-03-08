import { scanAvailableLodLevels } from '../../../utils/asset-lod';

export default defineEventHandler(async (event) => {
    // Public read access - no user auth required for collaborative work
    const config = useRuntimeConfig();
    const directory = config.uploads.path || './uploads';
    const { id } = event.context.params;
    const asset = await AssetModel.findOne({ _id: id, deletedAt: null }).select('-__v').lean();
    if (!asset) {
        return createError({
            statusCode: 404,
            statusMessage: "Asset not found",
        });
    };

    const availableLodLevels = scanAvailableLodLevels(directory, id);
    return {
        ...asset,
        availableLodLevels,
        lodDistances: Array.isArray(asset.lodDistances) && asset.lodDistances.length
            ? asset.lodDistances
            : [0, 20, 60, 150],
    };
});
