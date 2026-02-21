<template>
    <div class="grid gap-4 mb-4 grid-cols-3 md:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-12">
        <BuiltInItem
            v-for="item in builtInItems"
            :key="item.sourceId"
            :source-id="item.sourceId"
            :title="item.title"
            :icon="item.icon"
        />
    </div>
    <div class="grid gap-4" :class="assets.length ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-12' : 'grid-cols-1'">
        <AssetsFileInput @uploaded="fetchAssets" />
        <AssetsItem v-for="asset in assets" :key="asset._id" :asset="asset" />
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const assets = ref([]);
const builtInItems = [
    { sourceId: 'primitive:box', title: 'Box', icon: 'i-lucide-box' },
    { sourceId: 'primitive:sphere', title: 'Sphere', icon: 'i-lucide-circle' },
    { sourceId: 'primitive:cylinder', title: 'Cylinder', icon: 'i-lucide-cylinder' },
    { sourceId: 'light:point', title: 'Point Light', icon: 'i-lucide-lightbulb' },
    { sourceId: 'light:spot', title: 'Spot Light', icon: 'i-lucide-cone' },
];

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
