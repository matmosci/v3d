import service from '../../services/auth.service';
import { z } from 'zod'

const bodySchema = z.object({
    email: z.email(),
});

export default defineEventHandler(async (event) => {
    const { email: _email } = await readValidatedBody(event, bodySchema.parse);
    const email = _email?.trim().toLowerCase();

    if (!email) return createError({
        statusCode: 401,
        statusMessage: "Invalid email address",
    });

    const credentials = await service.createLoginToken(email);
    if (process.env.NODE_ENV === "development") console.log(credentials);
    else service.sendLoginToken(email, credentials);
    return true;
});
