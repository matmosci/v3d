<script setup>
const props = defineProps({
    selected: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(["delete", "free-transform", "update-transform", "deselect", "ungroup"]);

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

const roundValue = (value, precision = 4) => {
    const factor = 10 ** precision;
    return Math.round((Number(value) || 0) * factor) / factor;
};

const applySelectedToForm = () => {
    const selected = props.selected || {};
    const position = Array.isArray(selected.position) ? selected.position : [0, 0, 0];
    const rotation = Array.isArray(selected.rotation) ? selected.rotation : [0, 0, 0];
    const scale = Array.isArray(selected.scale) ? selected.scale : [1, 1, 1];

    transform.px = roundValue(position[0], 4);
    transform.py = roundValue(position[1], 4);
    transform.pz = roundValue(position[2], 4);
    transform.rx = roundValue(rotation[0], 3);
    transform.ry = roundValue(rotation[1], 3);
    transform.rz = roundValue(rotation[2], 3);
    transform.sx = roundValue(scale[0], 4) || 1;
    transform.sy = roundValue(scale[1], 4) || 1;
    transform.sz = roundValue(scale[2], 4) || 1;
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

const showConfirmation = ref(false);
const recursiveUngroup = ref(false);

const confirmDelete = () => {
    if (!props.selected?.id) return;
    showConfirmation.value = true;
};

const confirmDeleteOk = () => {
    showConfirmation.value = false;
    emit("delete");
};

const cancelDelete = () => {
    showConfirmation.value = false;
};
</script>

<template>
    <aside
        class="absolute top-0 left-0 h-full w-80 bg-black/45 backdrop-blur-sm border-r border-white/10 p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-white/90">Context Menu</h3>
            <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                @click="$emit('deselect')"
            />
        </div>
        <div class="space-y-2 text-sm text-white/80 flex-1 overflow-y-auto">
            <div>
                <span class="text-white/60">Instance:</span>
                <div class="break-all">{{ selected?.id }}</div>
            </div>
            <div>
                <span class="text-white/60">Source:</span>
                <div class="break-all">{{ selected?.sourceType || 'asset' }} / {{ selected?.sourceId || selected?.asset }}</div>
            </div>
            <div class="pt-2">
                <span class="text-white/60">Position</span>
                <div class="grid grid-cols-3 gap-2 mt-1">
                    <input v-model.number="transform.px" type="number" step="0.1"
                        class="w-full rounded bg-black/40 border border-red-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.py" type="number" step="0.1"
                        class="w-full rounded bg-black/40 border border-green-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.pz" type="number" step="0.1"
                        class="w-full rounded bg-black/40 border border-blue-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                </div>
            </div>
            <div>
                <span class="text-white/60">Rotation</span>
                <div class="grid grid-cols-3 gap-2 mt-1">
                    <input v-model.number="transform.rx" type="number" step="15"
                        class="w-full rounded bg-black/40 border border-red-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.ry" type="number" step="15"
                        class="w-full rounded bg-black/40 border border-green-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.rz" type="number" step="15"
                        class="w-full rounded bg-black/40 border border-blue-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                </div>
            </div>
            <div>
                <span class="text-white/60">Scale</span>
                <div class="grid grid-cols-3 gap-2 mt-1">
                    <input v-model.number="transform.sx" type="number" step="0.1"
                        class="w-full rounded bg-black/40 border border-red-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.sy" type="number" step="0.1"
                        class="w-full rounded bg-black/40 border border-green-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                    <input v-model.number="transform.sz" type="number" step="0.1"
                        class="w-full rounded bg-black/40 border border-blue-500/70 px-2 py-1"
                        @change="emitTransformUpdate" @keyup.enter="emitTransformUpdate">
                </div>
            </div>
            <UButton size="sm" icon="i-lucide-scan-eye" @click="$emit('free-transform')">Free Transform</UButton>
            <div v-if="selected?.sourceType === 'entity'" class="pt-3 space-y-2">
                <label class="flex items-center gap-2 text-xs text-white/70">
                    <input v-model="recursiveUngroup" type="checkbox" class="accent-emerald-500" />
                    Recursive
                </label>
                <UButton
                    size="sm"
                    icon="i-lucide-split-square-vertical"
                    @click="emit('ungroup', { recursive: recursiveUngroup })"
                >
                    Ungroup Entity
                </UButton>
            </div>
        </div>
        <div class="w-fit">
            <div v-if="!showConfirmation">
                <UButton size="sm" color="error" icon="i-lucide-trash" @click="confirmDelete">
                    Delete
                </UButton>
            </div>
            <div v-else class="flex gap-2">
                <UButton size="sm" color="error" @click="confirmDeleteOk">
                    OK
                </UButton>
                <UButton size="sm" color="gray" @click="cancelDelete">
                    Cancel
                </UButton>
            </div>
        </div>
    </aside>
</template>
