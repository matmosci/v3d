<template>
  <div class="absolute top-0 bottom-0 left-0 right-0 bg-black/25 backdrop-blur-sm flex flex-col px-10">
    <div class="flex justify-between items-center py-3">
      <NuxtLink to="/" class="text-lg font-bold">V3D</NuxtLink>
      <div class="flex gap-4">
        <NuxtLink v-if="loggedIn" to="/assets" class="hover:text-gray-300 transition-colors">Assets</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/community" class="hover:text-gray-300 transition-colors">Community</NuxtLink>
      </div>
      <User />
    </div>
    <div class="h-full overflow-auto mt-3">
      <NuxtPage />
    </div>
    <div class="mt-auto text-center py-3">
        Press <UKbd>TAB</UKbd> to toggle menu
    </div>
  </div>
</template>

<script setup>
const { loggedIn } = useUserSession();
const editor = useEditor();
</script>