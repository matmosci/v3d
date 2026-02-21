<script setup>
const props = defineProps({
    selected: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(["delete", "free-transform", "update-transform"]);

const transform = reactive({
    px: 0,
    py: 0,
    pz: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    sx: 1,
    sy: 1,
    sz: 1,
});

const applySelectedToForm = () => {
    const selected = props.selected || {};
    const position = Array.isArray(selected.position) ? selected.position : [0, 0, 0];
    const rotation = Array.isArray(selected.rotation) ? selected.rotation : [0, 0, 0];
    const scale = Array.isArray(selected.scale) ? selected.scale : [1, 1, 1];

    transform.px = Number(position[0]) || 0;
    transform.py = Number(position[1]) || 0;
    transform.pz = Number(position[2]) || 0;
    transform.rx = Number(rotation[0]) || 0;
    transform.ry = Number(rotation[1]) || 0;
    transform.rz = Number(rotation[2]) || 0;
    transform.sx = Number(scale[0]) || 1;
    transform.sy = Number(scale[1]) || 1;
    transform.sz = Number(scale[2]) || 1;
};

watch(() => props.selected, applySelectedToForm, { immediate: true, deep: true });

const emitTransformUpdate = () => {
    if (!props.selected?.id) return;

    emit("update-transform", {
        position: [Number(transform.px) || 0, Number(transform.py) || 0, Number(transform.pz) || 0],
        rotation: [Number(transform.rx) || 0, Number(transform.ry) || 0, Number(transform.rz) || 0],
        scale: [Number(transform.sx) || 1, Number(transform.sy) || 1, Number(transform.sz) || 1],
    });
};
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
            <div class="pt-2">
                <span class="text-white/60">Position</span>
                <div class="grid grid-cols-3 gap-2 mt-1">
                    <input v-model.number="transform.px" type="number" step="0.1" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.py" type="number" step="0.1" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.pz" type="number" step="0.1" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                </div>
            </div>
            <div>
                <span class="text-white/60">Rotation</span>
                <div class="grid grid-cols-3 gap-2 mt-1">
                    <input v-model.number="transform.rx" type="number" step="15" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.ry" type="number" step="15" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.rz" type="number" step="15" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                </div>
            </div>
            <div>
                <span class="text-white/60">Scale</span>
                <div class="grid grid-cols-3 gap-2 mt-1">
                    <input v-model.number="transform.sx" type="number" step="0.1" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.sy" type="number" step="0.1" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.sz" type="number" step="0.1" class="w-full rounded bg-black/40 border border-white/10 px-2 py-1" @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                </div>
            </div>
            <UButton size="sm" @click="$emit('delete')">Delete</UButton>
            <UButton size="sm" @click="$emit('free-transform')">Free Transform</UButton>
        </div>
    </aside>
</template>
