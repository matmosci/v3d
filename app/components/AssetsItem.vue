<template>
    <div class="border border-accented/50 rounded-lg bg-elevated/75 px-1 pb-1 h-48 flex flex-col">
        <div>
            <p class="font-medium">{{ asset.originalname }}</p>
            <p class="text-sm text-gray-400">{{ (asset.size / 1024).toFixed(2) }} KB</p>
        </div>
        <div class="text-sm text-gray-500 mt-auto">{{ asset.createdAt.split('T')[0] }}</div>
    </div>
</template>

<script setup>
defineProps({
    asset: {
        type: Object,
        required: true,
    },
});
</script>