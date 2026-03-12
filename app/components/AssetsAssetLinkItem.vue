<template>
    <div
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none relative"
        draggable="true"
        @dragstart="onDragStart"
        @contextmenu.prevent="showContextMenu"
        @click="selectAssetLink">
        
        <!-- Link indicator -->
        <div class="absolute top-1 right-1 z-10 text-muted px-1 py-0">
            <UIcon name="i-lucide-external-link" class="w-3 h-3" />
        </div>
        
        <div class="h-32 w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <img v-if="assetLink.cachedThumbnail" :src="assetLink.cachedThumbnail" alt="thumbnail"
                class="h-32 w-full object-cover object-center" draggable="false" />
            <UIcon v-else name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
        </div>
        <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ assetLink.name }}</div>
        <div class="text-sm text-gray-400 ms-1 mb-1 flex items-center justify-between">
            <span>{{ formatDate(assetLink.createdAt) }}</span>
            <!-- Validity status -->
            <span v-if="!assetLink.isValid" class="text-xs bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 px-1 rounded">
                Invalid
            </span>
            <!-- Tags indicator -->
            <span v-else-if="assetLink.tags && assetLink.tags.length > 0" class="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {{ assetLink.tags.length }} tag{{ assetLink.tags.length > 1 ? 's' : '' }}
            </span>
        </div>

        <!-- Actions Row -->
        <div v-if="!showDeleteConfirm" class="flex items-center justify-between mx-1">
            <UButton icon="i-lucide-external-link" variant="ghost" size="xs" class="text-blue-500" @click.stop="openLinkedAsset"
                title="Open linked asset" :disabled="!assetLink.isValid">
            </UButton>
            <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" class="text-red-500"
                @click.stop="showDeleteConfirm = true" title="Delete link"></UButton>
        </div>

        <!-- Delete Confirmation Row -->
        <div v-else class="flex items-center justify-between mx-1">
            <UButton variant="ghost" size="xs" class="text-gray-500" @click.stop="showDeleteConfirm = false">
                Cancel
            </UButton>
            <UButton icon="i-lucide-check" variant="ghost" size="xs" class="text-red-500" @click.stop="deleteAssetLink"
                :loading="deleting"></UButton>
        </div>
    </div>
</template>

<script setup>
const editor = useEditor();
const showDeleteConfirm = ref(false);
const deleting = ref(false);

const props = defineProps({
    assetLink: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['deleted', 'moved']);

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function selectAssetLink() {
    if (showDeleteConfirm.value || !props.assetLink.isValid) return;
    
    const context = editor.getContext();
    if (context.assetId) {
        // In editor context - place as instance using the linked asset.
        context.events.emit("object:placement:start", {
            sourceType: "asset",
            sourceId: props.assetLink.targetAssetId
        });
    } else {
        // Not in editor context - navigate to linked asset.
        location.href = `/${props.assetLink.targetAssetId}`;
    }
}

function openLinkedAsset() {
    if (!props.assetLink.isValid) return;
    // Always navigate to the linked asset.
    location.href = `/${props.assetLink.targetAssetId}`;
}

function showContextMenu(event) {
    event.stopPropagation();
    console.log('Context menu at:', event.clientX, event.clientY);
}

function onDragStart(event) {
    if (!props.assetLink.isValid) {
        event.preventDefault();
        return;
    }
    
    event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'asset-link',
        id: props.assetLink._id,
        targetAssetId: props.assetLink.targetAssetId,
        name: props.assetLink.name
    }));
    event.dataTransfer.effectAllowed = 'move';
}

async function deleteAssetLink() {
    if (deleting.value) return;

    deleting.value = true;
    try {
        await $fetch(`/api/user/assetlinks/${props.assetLink._id}`, {
            method: 'DELETE'
        });

        emit('deleted', props.assetLink._id);
    } catch (error) {
        console.error('Failed to delete asset link:', error);
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
    }
}
</script>