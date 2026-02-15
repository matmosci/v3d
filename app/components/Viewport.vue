<script setup>
import { attach, dettach, reset } from "../engine/Engine";

const container = ref(null);

onMounted(async () => {
    await attach(container.value);
    reset();
});

onBeforeUnmount(() => {
    dettach();
});

</script>

<template>
    <div ref="container"></div>
</template>

<style>
body {
    overflow: hidden;
}
</style>