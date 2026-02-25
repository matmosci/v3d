<template>
    <div class="w-fit mx-auto" v-if="!loggedIn">
        <div class="w-full max-w-3xs mx-2">
            <Login />
        </div>
    </div>
    <template v-else>
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-end gap-3">
                <pre>{{ user.email }}</pre>
                <UButton @click="logout" trailing-icon="i-lucide-log-out" variant="soft" title="Logout">
                </UButton>
            </div>
            <!-- <div class="flex justify-end">[user]</div> -->
        </div>
    </template>
</template>
<script setup>
const { loggedIn, user, clear } = useUserSession();
const logout = () => {
    clear();
};
</script>