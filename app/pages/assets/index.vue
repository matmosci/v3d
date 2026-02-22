<template>
    <h2 class="text-xl font-bold mb-2">Built-In Items</h2>
    <div class="grid gap-4 grid-cols-3 md:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-12">
        <BuiltInItem v-for="item in builtInItems" :key="item.sourceId" :source-id="item.sourceId" :title="item.title"
            :icon="item.icon" />
    </div>
    <h2 class="text-xl font-bold mt-4 mb-2">Assets</h2>
    <div class="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-12">
        <AssetsFileInput @uploaded="fetchAssets" />
        <AssetsItem v-for="asset in assets" :key="asset._id" :asset="asset" />
    </div>
    <h2 class="text-xl font-bold mt-4 mb-2">Entities</h2>
    <div class="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-12">
        <AssetsNewEntity @created="fetchEntities" />
        <AssetsEntityItem v-for="entity in entities" :key="entity._id" :entity="entity" />
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const editor = useEditor();
const assets = ref([]);
const entities = ref([]);
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

async function fetchEntities() {
    try {
        const data = await $fetch('/api/user/entities');
        entities.value = data;
    } catch (error) {
        console.error(error);
    }
}

function selectEntity(entity) {
    const context = editor.getContext();
    if (context.entity) {
        // Already in an entity, place this entity as an instance
        context.events.emit("object:placement:start", {
            sourceType: "entity",
            sourceId: entity._id
        });
        return;
    }
}

onMounted(() => {
    fetchAssets();
    fetchEntities();
});
</script>
