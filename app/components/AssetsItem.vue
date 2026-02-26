<template>
    <div @click="selectAsset"
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none"
        draggable="true"
        @dragstart="onDragStart"
        @contextmenu.prevent="showContextMenu">
        <div class="h-32 w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <img v-if="asset.thumbnail" :src="asset.thumbnail" alt="thumbnail" class="h-32 w-full object-cover">
            <UIcon v-else name="i-lucide-image" class="text-white/30 w-6 h-6" />
        </div>
        <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ asset.originalname }}</div>
        <div class="text-sm text-gray-400 ms-1 mb-1 flex items-center justify-between">
            <span>{{ (asset.size / 1024).toFixed(2) }} KB</span>
            <!-- Tags indicator -->
            <span v-if="asset.tags && asset.tags.length > 0" class="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {{ asset.tags.length }} tag{{ asset.tags.length > 1 ? 's' : '' }}
            </span>
        </div>

        <!-- Actions Row -->
        <div v-if="!showDeleteConfirm" class="flex items-center justify-between mx-1">
            <NuxtLink :to="`/assets/${asset._id}`" @click.stop>
                <UButton icon="i-lucide-eye" variant="ghost" size="xs" class="text-blue-500" title="View">
                </UButton>
            </NuxtLink>
            <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" class="text-red-500"
                @click.stop="showDeleteConfirm = true" title="Delete"></UButton>
        </div>

        <!-- Delete Confirmation Row -->
        <div v-else class="flex items-center justify-between mx-1">
            <UButton variant="ghost" size="xs" class="text-gray-500" @click.stop="showDeleteConfirm = false">
                Cancel
            </UButton>
            <UButton icon="i-lucide-check" variant="ghost" size="xs" class="text-red-500" @click.stop="deleteAsset"
                :loading="deleting"></UButton>
        </div>
    </div>
</template>

<script setup>
const editor = useEditor();
const { push } = useRouter();

const showDeleteConfirm = ref(false);
const deleting = ref(false);

const props = defineProps({
    asset: {
        type: Object,
        required: true,
    }
});

const emit = defineEmits(['deleted', 'moved']);

function selectAsset() {
    if (showDeleteConfirm.value) return; // Don't select if in delete mode

    const context = editor.getContext();
    if (context.entity) {
        // Already in an entity, just start placement
        context.events.emit("object:placement:start", { asset: props.asset._id });
        return;
    }
    push(`/assets/${props.asset._id}`);
}

function showContextMenu(event) {
    event.stopPropagation();
    console.log('Context menu at:', event.clientX, event.clientY);
}

function onDragStart(event) {
    event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'asset',
        id: props.asset._id,
        name: props.asset.originalname
    }));
    event.dataTransfer.effectAllowed = 'move';
}

async function deleteAsset() {
    if (deleting.value) return;

    deleting.value = true;
    try {
        await $fetch(`/api/assets/${props.asset._id}`, {
            method: 'DELETE'
        });

        emit('deleted', props.asset._id);
    } catch (error) {
        console.error('Failed to delete asset:', error);
        // You might want to show a toast notification here
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
    }
}
</script>