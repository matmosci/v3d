<template>
    <div
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none relative"
        draggable="true"
        @dragstart="onDragStart"
        @contextmenu.prevent="showContextMenu"
        @click="selectEntityLink">
        
        <!-- Link indicator -->
        <div class="absolute top-1 right-1 z-10 text-muted px-1 py-0">
            <UIcon name="i-lucide-external-link" class="w-3 h-3" />
        </div>
        
        <div class="h-32 w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <img v-if="entityLink.cachedThumbnail" :src="entityLink.cachedThumbnail" alt="thumbnail"
                class="h-32 w-full object-cover object-center" draggable="false" />
            <UIcon v-else name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
        </div>
        <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ entityLink.name }}</div>
        <div class="text-sm text-gray-400 ms-1 mb-1 flex items-center justify-between">
            <span>{{ formatDate(entityLink.createdAt) }}</span>
            <!-- Validity status -->
            <span v-if="!entityLink.isValid" class="text-xs bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 px-1 rounded">
                Invalid
            </span>
            <!-- Tags indicator -->
            <span v-else-if="entityLink.tags && entityLink.tags.length > 0" class="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
                {{ entityLink.tags.length }} tag{{ entityLink.tags.length > 1 ? 's' : '' }}
            </span>
        </div>

        <!-- Actions Row -->
        <div v-if="!showDeleteConfirm" class="flex items-center justify-between mx-1">
            <UButton icon="i-lucide-external-link" variant="ghost" size="xs" class="text-blue-500" @click.stop="openLinkedEntity"
                title="Open linked entity" :disabled="!entityLink.isValid">
            </UButton>
            <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" class="text-red-500"
                @click.stop="showDeleteConfirm = true" title="Delete link"></UButton>
        </div>

        <!-- Delete Confirmation Row -->
        <div v-else class="flex items-center justify-between mx-1">
            <UButton variant="ghost" size="xs" class="text-gray-500" @click.stop="showDeleteConfirm = false">
                Cancel
            </UButton>
            <UButton icon="i-lucide-check" variant="ghost" size="xs" class="text-red-500" @click.stop="deleteEntityLink"
                :loading="deleting"></UButton>
        </div>
    </div>
</template>

<script setup>
const editor = useEditor();
const showDeleteConfirm = ref(false);
const deleting = ref(false);

const props = defineProps({
    entityLink: {
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

function selectEntityLink() {
    if (showDeleteConfirm.value || !props.entityLink.isValid) return;
    
    const context = editor.getContext();
    if (context.entity) {
        // In entity context - place as instance using the linked entity
        context.events.emit("object:placement:start", {
            sourceType: "entity",
            sourceId: props.entityLink.targetEntityId
        });
    } else {
        // Not in entity - navigate to linked entity
        location.href = `/${props.entityLink.targetEntityId}`;
    }
}

function openLinkedEntity() {
    if (!props.entityLink.isValid) return;
    // Always navigate to the linked entity
    location.href = `/${props.entityLink.targetEntityId}`;
}

function showContextMenu(event) {
    event.stopPropagation();
    console.log('Context menu at:', event.clientX, event.clientY);
}

function onDragStart(event) {
    if (!props.entityLink.isValid) {
        event.preventDefault();
        return;
    }
    
    event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'entity-link',
        id: props.entityLink._id,
        targetEntityId: props.entityLink.targetEntityId,
        name: props.entityLink.name
    }));
    event.dataTransfer.effectAllowed = 'move';
}

async function deleteEntityLink() {
    if (deleting.value) return;

    deleting.value = true;
    try {
        await $fetch(`/api/user/entitylinks/${props.entityLink._id}`, {
            method: 'DELETE'
        });

        emit('deleted', props.entityLink._id);
    } catch (error) {
        console.error('Failed to delete entity link:', error);
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
    }
}
</script>