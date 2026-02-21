<script setup>
const test_level = "7f4cde04-c4b2-42d1-9ec3-140aaaf35806";

const editor = useEditor();
const container = ref(null);

onMounted(async () => {
    editor.init(container.value);    
    // Load the default level
    try {
        await editor.loadLevel(test_level);
    } catch (error) {
        console.error('Failed to load level:', error);
    }

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
