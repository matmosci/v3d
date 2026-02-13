import fs from 'fs';
import path from 'path';

const directory = "./uploads";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const filePath = path.join(directory, id);
    if (!fs.existsSync(filePath)) {
        return createError({
            statusCode: 404,
            statusMessage: "File not found",
        });
    };
    const fileData = fs.readFileSync(filePath);
    return fileData;
});
