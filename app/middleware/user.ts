export default defineNuxtRouteMiddleware((to, from) => {
    const { user } = useUserSession();

    if (!(user.value && user.value.access > 0)) {
        return createError({
            statusCode: 401,
            statusMessage: "Unauthorized: " + to.fullPath,
        });
    }
});
