<template>
    <h1 class="text-sm mb-2">ASSET</h1>
    <div v-if="entityData" class="flex justify-between">
        <div>
            <h2 class="text-xl font-bold mb-2">{{ entityData.name }}</h2>
            <p class="text-gray-500">{{ entityData.description }}</p>
        </div>
        <div class="flex items-center gap-2">
            <div class="flex flex-col gap-1">
                <h2 class="text-xl font-bold mb-2">Editor</h2>
                <div class="text-xs text-gray-400">
                    <UKbd>F</UKbd> Toggle Cursor Light
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>R</UKbd> Cycle Transform Mode
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>V</UKbd> Toggle Markers Visibility
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>H</UKbd> Toggle Grid Helper
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>M</UKbd> Toggle Scene Scale
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>T</UKbd> Capture Thumbnail
                </div>

                <h2 class="text-xl font-bold mb-2 mt-4">Transform</h2>
                <div class="text-xs text-gray-400">
                    <UKbd>Shift</UKbd> + <UKbd>Drag</UKbd> Snap cursor to surface
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>Ctrl</UKbd> + <UKbd>Drag</UKbd> Snap to grid during translation or 15° during rotation
                </div>


                <h2 class="text-xl font-bold mb-2 mt-4">Movement</h2>
                <div class="flex gap-1">
                    <div class="text-xs text-gray-400">
                        <UKbd>Q</UKbd>
                    </div>
                    <div class="text-xs text-gray-400">
                        <UKbd>W</UKbd>
                    </div>
                    <div class="text-xs text-gray-400">
                        <UKbd>E</UKbd>
                    </div>
                </div>
                <div class="flex gap-1">
                    <div class="text-xs text-gray-400">
                        <UKbd>A</UKbd>
                    </div>
                    <div class="text-xs text-gray-400">
                        <UKbd>S</UKbd>
                    </div>
                    <div class="text-xs text-gray-400">
                        <UKbd>D</UKbd>
                    </div>
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>Shift</UKbd>
                </div>

                <span v-if="!isSaving" class="text-xs text-blue-500 mt-5">Saving camera...</span>
            </div>
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