<template>
    <button
        type="button"
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-3 py-3 h-48 flex flex-col text-left select-none"
        @click="selectBuiltIn"
    >
        <div class="h-full w-full mt-1 rounded-md bg-black/30 overflow-hidden grid place-items-center">
            <UIcon :name="icon" class="text-white/70 size-12" />
        </div>
        <div class="font-medium mt-2 overflow-x-clip text-ellipsis">{{ title }}</div>
        <div class="text-sm text-gray-400">{{ sourceId }}</div>
    </button>
</template>

<script setup>
const editor = useEditor();

const props = defineProps({
    sourceId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: "i-lucide-box",
    },
});

function selectBuiltIn() {
    editor.getContext().events.emit("object:placement:start", {
        sourceType: "builtin",
        sourceId: props.sourceId,
    });
}
</script>
