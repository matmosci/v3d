<script setup>
const container = ref(null);
const { attachInstance, dettachInstance, reset } = useViewport();

onMounted(async () => {
    const {
        scene,
        renderer,
        camera,
        controls
    } = await attachInstance(container.value);

    setColors(scene);
    reset();

    watchEffect(() => {
        setColors(scene);
    });
});

onBeforeUnmount(() => {
    dettachInstance();
});

function setColors(scene) {
    const bgColor = 0x0f172b;
    scene.background.set(bgColor);
    scene.fog.color.set(bgColor);
}
</script>

<template>
    <div ref="container"></div>
</template>

<style>
body {
    overflow: hidden;
}
</style>