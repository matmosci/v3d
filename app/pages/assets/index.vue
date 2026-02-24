<template>
    <h1 class="text-sm mb-2">ASSETS</h1>
    <h2 class="text-xl font-bold mb-2">Built-In Items</h2>
    <div class="grid gap-4 grid-cols-3 md:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-12">
        <BuiltInItem v-for="item in builtInItems" :key="item.sourceId" :source-id="item.sourceId" :title="item.title"
            :icon="item.icon" />
    </div>
    <h2 class="text-xl font-bold mt-4 mb-2">Your Assets</h2>
    <div class="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-12">
        <AssetsNewEntity @created="fetchEntities" />
        <AssetsFileInput @uploaded="handleFileUploaded" />
        <AssetsEntityItem v-for="entity in entities" :key="entity._id" :entity="entity" @click="selectEntity(entity)" @deleted="removeEntity" />
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const editor = useEditor();
const entities = ref([]);
const builtInItems = [
    { sourceId: 'primitive:box', title: 'Box', icon: 'i-lucide-box' },
    { sourceId: 'primitive:sphere', title: 'Sphere', icon: 'i-lucide-circle' },
    { sourceId: 'primitive:cylinder', title: 'Cylinder', icon: 'i-lucide-cylinder' },
    { sourceId: 'light:point', title: 'Point Light', icon: 'i-lucide-lightbulb' },
    { sourceId: 'light:spot', title: 'Spot Light', icon: 'i-lucide-cone' },
];

async function fetchEntities() {
    try {
        const data = await $fetch('/api/user/entities');
        entities.value = data;
    } catch (error) {
        console.error(error);
    }
}

async function handleFileUploaded(uploadResults) {
    // Server already created entities, just refresh the list
    await fetchEntities();
}

function selectEntity(entity) {
    const context = editor.getContext();
    if (context.entity) {
        // Already in an entity, place this entity as an instance
        context.events.emit("object:placement:start", {
            sourceType: "entity",
            sourceId: entity._id
        });
    } else {
        location.href = `/${entity._id}`;
    }
}

function removeEntity(entityId) {
    entities.value = entities.value.filter(entity => entity._id !== entityId);
}

onMounted(() => {
    fetchEntities();
    
    // Listen for thumbnail updates to refresh entity data
    const context = editor.getContext();
    if (context) {
        context.events.on("thumbnail:created", ({ thumbnail }) => {
            // Find and update the entity with the new thumbnail
            const currentEntityId = context.entity; // The currently loaded entity
            if (currentEntityId && entities.value) {
                const entityIndex = entities.value.findIndex(entity => entity._id === currentEntityId);
                if (entityIndex !== -1) {
                    // Update the entity thumbnail in the reactive array
                    entities.value[entityIndex] = {
                        ...entities.value[entityIndex],
                        thumbnail: thumbnail
                    };
                }
            }
        });
    }
});
</script>
