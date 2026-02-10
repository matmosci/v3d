<template>
    <div class="grid gap-4" :class="assets.length ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'">
        <AssetsFileInput @uploaded="fetchAssets" />
        <AssetsItem v-for="asset in assets" :key="asset._id" :asset="asset" />
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const assets = ref([]);

async function fetchAssets() {
    try {
        const data = await $fetch('/api/user/assets');
        assets.value = data;
    } catch (error) {
        console.error(error);
    }
}
onMounted(() => {
    fetchAssets();
});
</script>