import fs from "fs";
import path from "path";

const directory = "./uploads";
const acceptedExtensions = [".glb"];

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const files = await readMultipartFormData(event);
    if (!files || files.length === 0) {
        return createError({
            statusCode: 400,
            message: "No files uploaded",
        });
    }

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
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

        const asset = await AssetModel.create({
            user: user.id,
            originalname: file.filename,
            size: file.data.length,
        });

        const id = asset._id.toString();
        console.log(id);

        const filePath = path.join(directory, asset._id.toString());
        fs.writeFileSync(filePath, file.data);
        assetIds.push(id);
    }

    return assetIds;
});
