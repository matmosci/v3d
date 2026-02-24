<script setup>
const toast = useToast();
const editor = useEditor();
const container = ref(null);

onMounted(async () => {
    editor.init(container.value);

    // Listen for entity:loaded event to attach instance to container
    const context = editor.getContext();
    if (context) {
        context.events.on("entity:loaded", () => {
            // Attach/reattach engine to container if needed
            if (editor.getInstance()) {
                editor.getInstance().attach(container.value);
            }
        });

        // Listen for thumbnail capture events
        context.events.on("thumbnail:created", ({ thumbnail }) => {
            toast.add({
                id: "thumbnail-created",
                title: "Thumbnail created",
                description: "Thumbnail captured successfully",
                avatar: { src: thumbnail },
                timeout: 0,
                ui: {
                    default: {
                        closeButton: {
                            icon: 'i-lucide-x'
                        }
                    }
                }
            });
        });

        context.events.on("thumbnail:error", ({ error }) => {
            toast.add({
                title: "Thumbnail failed",
                description: `Failed to capture thumbnail: ${error}`,
                color: "red",
                timeout: 5000
            });
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
