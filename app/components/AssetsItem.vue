<template>
    <div @click="selectAsset"
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-1 pb-1 h-48 flex flex-col select-none">
        <div class="h-full w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <img v-if="asset.thumbnail" :src="asset.thumbnail" alt="thumbnail" class="h-full w-full object-cover">
            <UIcon v-else name="i-lucide-image" class="text-white/30" />
        </div>
        <div class="font-medium mx-1 mt-1 overflow-x-clip text-ellipsis">{{ asset.originalname }}</div>
        <div class="flex items-center justify-between ms-1">
            <div class="text-sm text-gray-400">{{ (asset.size / 1024).toFixed(2) }} KB</div>
            <NuxtLink :to="`/assets/${asset._id}`" @click.stop>
                <UButton icon="i-lucide-eye" variant="link" class="cursor-pointer"></UButton>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
const editor = useEditor();

const props = defineProps({
    asset: {
        type: Object,
        required: true,
    },
});

function selectAsset() {
    editor.getContext().events.emit("object:placement:start", { asset: props.asset._id });
}
</script>