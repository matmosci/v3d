import service from '~~/server/services/auth.service';
import { z } from 'zod'

const bodySchema = z.object({
    email: z.email(),
    token: z.string().length(4),
});

export default defineEventHandler(async (event) => {
    const { email: _email, token: _token } = await readValidatedBody(event, bodySchema.parse);
    const email = _email?.trim().toLowerCase();
    const loginToken = _token?.trim().toUpperCase();

    if (!email || !loginToken) return createError({
        statusCode: 401,
        statusMessage: "Invalid email or token",
    });

    const user = await service.getUserByLoginToken(email, loginToken);

    if (!user) return createError({
        statusCode: 401,
        statusMessage: "Invalid email or token",
    });

    await setUserSession(event, {
        user: {
            id: user._id.toString(),
            email: user.email,
            access: user.access,
        }
    });

    return true;
});
