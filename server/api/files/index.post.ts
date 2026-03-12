import fs from "fs";
import path from "path";
import { buildLodFilename } from '../../utils/asset-lod';

const acceptedExtensions = [".glb"];

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const directory = config.uploads.path || "./uploads";
    const { user } = await requireUserSession(event);
    const sessionUser = user as any;
    const userId = sessionUser.id || sessionUser._id;
    const query = getQuery(event);
    const folder = query.folder ? String(query.folder) : null;

    const files = await readMultipartFormData(event);
    if (!files || files.length === 0) {
        return createError({
            statusCode: 400,
            message: "No files uploaded",
        });
    }

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const assetIds = [];

    for (const file of files) {
        if (!file.filename) {
            return createError({
                statusCode: 400,
                message: "File must have a filename",
            });
        }

        const extension = file.filename.slice(file.filename.lastIndexOf("."));
        if (!acceptedExtensions.includes(extension)) {
            return createError({
                statusCode: 400,
                message: `File type ${extension} is not accepted. Accepted file types are: ${acceptedExtensions.join(", ")}`,
            });
        }

        const maxFileSizeInBytes = 100 * 1024 * 1024;

        if (file.data.length > maxFileSizeInBytes) {
            return createError({
                statusCode: 400,
                message: `File size exceeds the maximum allowed size of ${maxFileSizeInBytes / (1024 * 1024)} MB`,
            });
        }

        const asset = await FileModel.create({
            user: userId,
            originalname: file.filename,
            size: file.data.length,
            folder: folder,
        });

        const id = asset._id.toString();
        console.log(id);

        const filePath = path.join(directory, buildLodFilename(asset._id.toString(), 0));
        fs.writeFileSync(filePath, file.data);
        
        // Auto-create a logical asset entry for the uploaded file
        const entityName = file.filename.replace(/\.[^/.]+$/, ''); // Remove file extension
        const entity = await AssetModel.create({
            user: userId,
            name: entityName,
            description: `Generated from ${file.filename}`,
            folder: folder,
        });
        
        // Create an instance linking the asset to the entity
        await InstanceModel.create({
            user: userId,
            assetId: entity._id,
            sourceType: 'file',
            sourceId: asset._id,
            fileId: asset._id,
            position: [0, 0, 0],
            quaternion: [0, 0, 0, 1],
            scale: [1, 1, 1],
        });
        
        assetIds.push({
            assetId: id,
            entityId: entity._id.toString(),
            entity: entity
        });
    }

    return assetIds;
});
