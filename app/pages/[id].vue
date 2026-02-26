<template>
    <UIH1>ASSET</UIH1>
    <div v-if="entityData" class="flex justify-between gap-5">
        <div>
            <h2 class="text-xl font-bold mb-2">
                {{ entityData.name }}
                <UButton v-if="isOwner" @click="showEditModal = true" size="sm" variant="ghost" icon="i-lucide-edit-2">
                </UButton>
            </h2>
            <p class="text-gray-500">{{ entityData.description }}</p>

            <div class="mt-2">
                <div v-if="entityData.tags && entityData.tags.length > 0" class="flex flex-wrap gap-1">
                    <UBadge v-for="tag in entityData.tags" :key="tag" class="bg-warning px-1 py-0 rounded-full">
                        #{{ tag }}
                    </UBadge>
                </div>
                <div v-else class="text-gray-400 text-sm">
                    No tags
                </div>
            </div>

            <div v-if="!isOwner && loggedIn"
                class="mt-24 flex items-center gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                <UIcon name="i-lucide-alert-triangle" class="text-warning-500 w-4 h-4 shrink-0" />
                <div class="flex-1">
                    <div class="text-sm text-warning-700 dark:text-warning-300 font-medium">
                        You don't own this asset
                    </div>
                    <div class="text-xs text-warning-600 dark:text-warning-400 mt-1">
                        Changes won't be saved permanently.<br>Create your own copy to make persistent modifications.
                    </div>
                    <UButton @click="createCopy" size="xs" variant="soft" color="neutral" :loading="copyingEntity"
                        class="mt-2">
                        <UIcon name="i-lucide-copy" class="w-3 h-3 mr-1" />
                        Copy Asset
                    </UButton>
                </div>
            </div>

            <div v-if="!loggedIn"
                class="mt-24 flex items-center gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                <UIcon name="i-lucide-alert-triangle" class="text-warning-500 w-4 h-4 shrink-0" />
                <div class="flex-1">
                    <div class="text-sm text-warning-700 dark:text-warning-300 font-medium">
                        You are not logged in
                    </div>
                    <div class="text-xs text-warning-600 dark:text-warning-400 mt-1">
                        Changes won't be saved permanently.<br>Create an account and log in to make your own assets.
                    </div>
                </div>
            </div>
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
                <div class="text-xs text-gray-400">
                    <UKbd>TAB</UKbd> Toggle Menu
                </div>

                <h2 class="text-xl font-bold mb-2 mt-4">Transform</h2>
                <div class="text-xs text-gray-400">
                    Hold <UKbd>Shift</UKbd> to snap to surface in free transform
                </div>
                <div class="text-xs text-gray-400">
                    Hold <UKbd>Ctrl</UKbd> to snap moved object to grid
                </div>
                <div class="text-xs text-gray-400">
                    Hold <UKbd>Ctrl</UKbd> to snap rotation to 15°
                </div>
                <div class="text-xs text-gray-400">
                    <UKbd>Scroll</UKbd> to rotate in free transform
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

                <span v-if="isSaving" class="text-xs text-blue-500 mt-5">Saving camera...</span>
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <EditItemModal :show="showEditModal" :item="entityData" item-type="entity" @close="showEditModal = false"
        @saved="handleEntityUpdated" />
</template>

<script setup>
const route = useRoute();
const editor = useEditor();
const entityData = ref(null);
const showEditModal = ref(false);

// Camera save on thumbnail functionality
const { isSaving, saveWithThumbnail } = useCameraSaveOnThumbnail(computed(() => route.params.id));

// Entity ownership functionality
const { isOwner, createEntityCopy } = useEntityOwnership();
const { loggedIn } = useUserSession();
const copyingEntity = ref(false);

const createCopy = async () => {
    copyingEntity.value = true;
    try {
        await createEntityCopy();
        // Navigation will happen in createEntityCopy
    } catch (error) {
        console.error('Failed to create copy:', error);
    } finally {
        copyingEntity.value = false;
    }
};

function handleEntityUpdated(updatedEntity) {
    entityData.value = updatedEntity;
}

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

        // Make entity data available in editor context for ownership checks
        if (editor.getContext()) {
            editor.getContext().entityData = entityData.value;

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

            // Make entity data available in editor context for ownership checks
            if (editor.getContext()) {
                editor.getContext().entityData = entityData.value;

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