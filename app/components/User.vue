<template>
    <UButton to="/user" icon="i-lucide-user-round" class="rounded-full"
        :variant="loggedIn ? 'solid' : useRoute().path === '/user' ? 'soft' : 'ghost'"
        :color="useRoute().path === '/user' ? 'primary' : 'neutral'">
    </UButton>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>