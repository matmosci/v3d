<template>
    <h1 class="text-sm mb-2">ASSET</h1>
    <div v-if="entityData" class="flex items-center justify-between">
        <div>
            <h1 class="text-xl font-bold mb-2">{{ entityData.name }}</h1>
            <p class="text-gray-500">{{ entityData.description }}</p>
        </div>
        <div class="flex items-center gap-2">
            <span v-if="isSaving" class="text-xs text-blue-500">Saving camera...</span>
            <span class="text-xs text-gray-400">Press T to capture thumbnail & save camera</span>
        </div>
    </div>
</template>

<script setup>
const route = useRoute();
const editor = useEditor();
const entityData = ref(null);

// Camera save on thumbnail functionality
const { isSaving, saveWithThumbnail } = useCameraSaveOnThumbnail(computed(() => route.params.id));

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

        // Fire entity:loaded event with data
        if (editor.getContext()) {
            editor.getContext().events.emit("entity:loaded", { 
                entityId, 
                entityData: entityData.value 
            });
            
            // Listen for thumbnail creation events (KeyT press)
            editor.getContext().events.on("thumbnail:created", async ({ thumbnail }) => {
                const context = editor.getContext();
                if (context?.camera) {
                    const cameraTransform = {
                        position: context.camera.position?.toArray() || [0, 1.6, 5],
                        quaternion: context.camera.quaternion?.toArray() || [0, 0, 0, 1],
                        scale: [1, 1, 1]
                    };
                    await saveWithThumbnail(cameraTransform, thumbnail);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load entity:', error);
    }
});

// Watch for route changes to load different entities
watch(() => route.params.id, async (newId, oldId) => {
    if (newId && newId !== oldId) {
        try {
            entityData.value = await editor.loadEntity(newId);

            // Fire entity:loaded event with data
            if (editor.getContext()) {
                editor.getContext().events.emit("entity:loaded", { 
                    entityId: newId, 
                    entityData: entityData.value 
                });
            }
        } catch (error) {
            console.error('Failed to load entity:', error);
        }
    }
});
</script>