<template>
    <div
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none">
        <div class="h-32 w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <img v-if="entity.thumbnail" :src="entity.thumbnail" alt="thumbnail" class="h-32 w-full object-cover object-center" />
            <UIcon v-else name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
        </div>
        <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ entity.name }}</div>
        <div class="text-sm text-gray-400 ms-1 mb-1 flex items-center gap-1">
            {{ formatDate(entity.createdAt) }}
        </div>
        
        <!-- Actions Row -->
        <div v-if="!showDeleteConfirm" class="flex items-center justify-between mx-1">
            <UButton icon="i-lucide-file-pen" variant="ghost" size="xs" class="text-blue-500" @click.stop="openEntity">
                Open
            </UButton>
            <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" class="text-red-500" @click.stop="showDeleteConfirm = true">
                Delete
            </UButton>
        </div>
        
        <!-- Delete Confirmation Row -->
        <div v-else class="flex items-center justify-between mx-1">
            <UButton variant="ghost" size="xs" class="text-gray-500" @click.stop="showDeleteConfirm = false">
                Cancel
            </UButton>
            <UButton icon="i-lucide-check" variant="ghost" size="xs" class="text-red-500" @click.stop="deleteEntity" :loading="deleting">
                OK
            </UButton>
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

const emit = defineEmits(['deleted']);

function openEntity() {
    if (!props.entity?._id || showDeleteConfirm.value) return;
    location.href = `/${props.entity._id}`;
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