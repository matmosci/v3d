import fs from "fs";
import path from "path";

const acceptedExtensions = [".glb"];

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const directory = config.uploads.path || "./uploads";
    const { user } = await requireUserSession(event);
    const { id } = getRouterParams(event);

    // Find the asset and verify ownership
    const asset = await AssetModel.findOne({ 
        _id: id, 
        deletedAt: null 
    });
    
    if (!asset) {
        throw createError({
            statusCode: 404,
            statusMessage: "Asset not found"
        });
    }

    // Check ownership
    if (asset.user.toString() !== user.id) {
        throw createError({
            statusCode: 403,
            statusMessage: "You don't have permission to modify this asset"
        });
    }

    // Read the uploaded file
    const files = await readMultipartFormData(event);
    if (!files || files.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: "No file uploaded"
        });
    }

    const file = files[0];

    if (!file.filename) {
        throw createError({
            statusCode: 400,
            statusMessage: "File must have a filename"
        });
    }

    const extension = file.filename.slice(file.filename.lastIndexOf("."));
    if (!acceptedExtensions.includes(extension)) {
        throw createError({
            statusCode: 400,
            statusMessage: `File type ${extension} is not accepted. Accepted file types are: ${acceptedExtensions.join(", ")}`
        });
    }

    const maxFileSizeInBytes = 100 * 1024 * 1024;
    if (file.data.length > maxFileSizeInBytes) {
        throw createError({
            statusCode: 400,
            statusMessage: `File size exceeds the maximum allowed size of ${maxFileSizeInBytes / (1024 * 1024)} MB`
        });
    }

    // Delete the old file from disk
    const filePath = path.join(directory, asset._id.toString());
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Failed to delete old file at ${filePath}:`, error);
            // Continue anyway - we'll overwrite it
        }
    }

    // Write the new file
    fs.writeFileSync(filePath, file.data);

    // Update asset with new metadata
    const updatedAsset = await AssetModel.findByIdAndUpdate(
        id,
        {
            originalname: file.filename,
            size: file.data.length
        },
        { new: true }
    ).select("-user -__v");

    return updatedAsset;
});
