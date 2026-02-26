<template>
    <div
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none"
        draggable="true"
        @dragstart="onDragStart"
        @contextmenu.prevent="showContextMenu">
        <div class="h-32 w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <img v-if="entity.thumbnail" :src="entity.thumbnail" alt="thumbnail"
                class="h-32 w-full object-cover object-center" />
            <UIcon v-else name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
        </div>
        <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ entity.name }}</div>
        <div class="text-sm text-gray-400 ms-1 mb-1 flex items-center justify-between">
            <span>{{ formatDate(entity.createdAt) }}</span>
            <!-- Tags indicator -->
            <span v-if="entity.tags && entity.tags.length > 0" class="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {{ entity.tags.length }} tag{{ entity.tags.length > 1 ? 's' : '' }}
            </span>
        </div>

        <!-- Actions Row -->
        <div v-if="!showDeleteConfirm" class="flex items-center justify-between mx-1">
            <UButton icon="i-lucide-file-pen" variant="ghost" size="xs" class="text-blue-500" @click.stop="openEntity"
                title="Open">
            </UButton>
            <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" class="text-red-500"
                @click.stop="showDeleteConfirm = true" title="Delete"></UButton>
        </div>

        <!-- Delete Confirmation Row -->
        <div v-else class="flex items-center justify-between mx-1">
            <UButton variant="ghost" size="xs" class="text-gray-500" @click.stop="showDeleteConfirm = false">
                Cancel
            </UButton>
            <UButton icon="i-lucide-check" variant="ghost" size="xs" class="text-red-500" @click.stop="deleteEntity"
                :loading="deleting"></UButton>
        </div>
    </div>
</template>

<script setup>
const showDeleteConfirm = ref(false);
const deleting = ref(false);

const props = defineProps({
    entity: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['deleted', 'moved']);

function openEntity() {
    if (!props.entity?._id || showDeleteConfirm.value) return;
    location.href = `/${props.entity._id}`;
}

function showContextMenu(event) {
    event.stopPropagation();
    console.log('Context menu at:', event.clientX, event.clientY);
}

function onDragStart(event) {
    event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'entity',
        id: props.entity._id,
        name: props.entity.name
    }));
    event.dataTransfer.effectAllowed = 'move';
}

async function deleteEntity() {
    if (deleting.value) return;

    deleting.value = true;
    try {
        await $fetch(`/api/entities/${props.entity._id}`, {
            method: 'DELETE'
        });

        emit('deleted', props.entity._id);
    } catch (error) {
        console.error('Failed to delete entity:', error);
        // You might want to show a toast notification here
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}
</script>