export default defineNuxtRouteMiddleware((to, from) => {
    const { user } = useUserSession();

    if (!user.value) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized: " + to.fullPath,
        });
    }
});
