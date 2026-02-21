<template>
    <div class="grid gap-4" :class="assets.length ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-12' : 'grid-cols-1'">
        <AssetsFileInput @uploaded="fetchAssets" />
        <BuiltInItem
            v-for="item in builtInItems"
            :key="item.sourceId"
            :source-id="item.sourceId"
            :title="item.title"
            :icon="item.icon"
        />
        <AssetsItem v-for="asset in assets" :key="asset._id" :asset="asset" />
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const assets = ref([]);
const builtInItems = [
    { sourceId: 'primitive:box', title: 'Built-in Box', icon: 'i-lucide-box' },
    { sourceId: 'primitive:sphere', title: 'Built-in Sphere', icon: 'i-lucide-circle' },
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
