<script setup>
const props = defineProps({
    selected: {
        type: Object,
        default: null,
    },
});
</script>

<template>
    <aside class="absolute top-0 left-0 h-full w-80 bg-black/45 backdrop-blur-sm border-r border-white/10 p-4">
        <h3 class="text-sm font-semibold text-white/90 mb-3">Context Menu</h3>
        <div class="space-y-2 text-sm text-white/80">
            <div>
                <span class="text-white/60">Instance:</span>
                <div class="break-all">{{ selected?.id }}</div>
            </div>
            <div>
                <span class="text-white/60">Asset:</span>
                <div class="break-all">{{ selected?.asset }}</div>
            </div>
        </div>
    </aside>
</template>
