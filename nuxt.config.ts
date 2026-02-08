// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/ui", "@nuxt/icon", "nuxt-auth-utils", "nuxt-mongoose"],
    runtimeConfig: {
        session: {
            password: process.env.NUXT_SESSION_PASSWORD!,
        },
        LOGIN_TOKEN_EXPIRATION: 1000 * 60 * 10, // 10 minutes
        mailer: {
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT,
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASS,
            },
        },
        contact: {
            admin: process.env.CONTACT_ADMIN_EMAIL,
        }
    },
});