<template>
    <h1 class="text-sm mb-2">ENTITY</h1>
    <div v-if="entityData">
        <h1 class="text-xl font-bold mb-2">{{ entityData.name }}</h1>
        <p class="text-gray-500">{{ entityData.description }}</p>
    </div>
</template>

<script setup>
const route = useRoute();
const editor = useEditor();
const entityData = ref(null);

onMounted(async () => {
    // Wait for editor initialization from Viewport component
    await new Promise((resolve, reject) => {
        const checkEditor = () => {
            if (editor.getInstance()) {
                resolve();
            } else if (elapsed >= maxWait) {
                reject(new Error('Editor initialization timeout'));
            } else {
                setTimeout(() => {
                    elapsed += 50;
                    checkEditor();
                }, 50);
            }
        };
        let elapsed = 0;
        const maxWait = 10000; // 10 second timeout
        checkEditor();
    });
    // Load the entity specified in the route
    const entityId = route.params.id;

    try {
        entityData.value = await editor.loadEntity(entityId);

        // Fire entity:loaded event
        if (editor.getContext()) {
            editor.getContext().events.emit("entity:loaded", { entityId });
        }
    } catch (error) {
        console.error('Failed to load entity:', error);
    }
});

// Watch for route changes to load different entities
watch(() => route.params.id, async (newId, oldId) => {
    if (newId && newId !== oldId) {
        try {
            await editor.loadEntity(newId);

            // Fire entity:loaded event
            if (editor.getContext()) {
                editor.getContext().events.emit("entity:loaded", { entityId: newId });
            }
        } catch (error) {
            console.error('Failed to load entity:', error);
        }
    }
});
</script>