<template>
    <div class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none">
        <div>
            <div class="font-medium">{{ asset.originalname }}</div>
            <div class="text-sm text-gray-400">{{ (asset.size / 1024).toFixed(2) }} KB</div>
        </div>
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