<script setup>

const editor = useEditor();
const container = ref(null);

onMounted(async () => {
    editor.init(container.value);
    
    // Listen for level:loaded event to attach instance to container
    const context = editor.getContext();
    if (context) {
        context.events.on("level:loaded", () => {
            // Attach/reattach engine to container if needed
            if (editor.getInstance()) {
                editor.getInstance().attach(container.value);
            }
        });
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
