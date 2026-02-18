<script setup>
const editor = useEditor();
const container = ref(null);

onMounted(async () => {
    editor.init(container.value);

    window?.addEventListener("keydown", (event) => {
        if (event.code === "Tab") {
            event.preventDefault();
            editor.toggleMode();
        }
    });
});
</script>

<template>
    <div ref="container"></div>
</template>
