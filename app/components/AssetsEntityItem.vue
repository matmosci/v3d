<template>
          <div
            class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none">
            <div class="h-full w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
                <UIcon name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
            </div>
            <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ entity.name }}</div>
            <div class="text-sm text-gray-400 ms-1 flex items-center gap-1">
              <!-- <UIcon name="i-lucide-calendar" class="w-4 h-4" /> -->
              {{ formatDate(entity.createdAt) }}
              <UButton icon="i-lucide-file-pen" variant="link" class="cursor-pointer ms-auto" @click.stop="openEntity"></UButton>
            </div>
        </div>
</template>

<script setup>
const props = defineProps({
    entity: {
        type: Object,
        required: true
    }
});

function openEntity() {
    if (!props.entity?._id) return;
    location.href = `/${props.entity._id}`;
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