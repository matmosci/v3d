<template>
    <div @click="pickAsset"
        class="border border-default duration-150 rounded-lg bg-default hover:bg-elevated/25 cursor-pointer px-2 pb-1 h-48 flex flex-col select-none">
        <div class="font-medium">{{ asset.originalname }}</div>
        <div class="text-sm text-gray-400">{{ (asset.size / 1024).toFixed(2) }} KB</div>
        <div class="mt-auto text-end">
            <UButton icon="i-lucide-eye" variant="link" class="cursor-pointer"></UButton>
        </div>
    </div>
</template>

<script setup>
import { MeshBasicMaterial } from "three";

const pickMaterial = new MeshBasicMaterial({
    color: 0x0088ff,
    transparent: true,
    opacity: 0.5,
});

const props = defineProps({
    asset: {
        type: Object,
        required: true,
    },
});

const viewport = useViewport();
const level = useLevel();

watch(viewport.mode, () => {
    if (viewport.mode.value !== "navigation") {
        viewport.cursor.clearPick();
    }
});

async function pickAsset() {
    let pickedAsset = level.assets.value.get(props.asset._id)?.clone();
    if (!pickedAsset) {
        const gltf = await level.loadGltf(`/api/assets/${props.asset._id}/data`);
        const object = gltf.scene;
        object.name = props.asset._id;
        level.assets.value.set(object.name, object);
        pickedAsset = object.clone();
    };

    pickedAsset.traverse((child) => {
        if (child.isMesh) {
            child.layers.set(1);
            if (child.material.map) pickMaterial.map = child.material.map;
            child.material = pickMaterial;
        }
    });

    setTimeout(() => {
        viewport.cursor.pick.add(pickedAsset);
    });

    viewport.view.switch("navigation");
    viewport.mode.value = "navigation";
}
</script>