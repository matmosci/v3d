<template>
    {{ route.params.id }}
</template>

<script setup>
const route = useRoute();
const editor = useEditor();

onMounted(async () => {
    // Wait for editor initialization from Viewport component
    await new Promise((resolve, reject) => {
        const checkEditor = () => {
            if (editor.getInstance()) {
                resolve();
            } else if (elapsed >= maxWait) {
                reject(new Error('Editor initialization timeout'));
            } else {
                setTimeout(() => {
                    elapsed += 50;
                    checkEditor();
                }, 50);
            }
        };
        let elapsed = 0;
        const maxWait = 10000; // 10 second timeout
        checkEditor();
    });
    // Load the level specified in the route
    const levelId = route.params.id;

    try {
        await editor.loadLevel(levelId);

        // Fire level:loaded event
        if (editor.getContext()) {
            editor.getContext().events.emit("level:loaded", { levelId });
        }
    } catch (error) {
        console.error('Failed to load level:', error);
    }
});

// Watch for route changes to load different levels
watch(() => route.params.id, async (newId, oldId) => {
    if (newId && newId !== oldId) {
        try {
            await editor.loadLevel(newId);

            // Fire level:loaded event
            if (editor.getContext()) {
                editor.getContext().events.emit("level:loaded", { levelId: newId });
            }
        } catch (error) {
            console.error('Failed to load level:', error);
        }
    }
});
</script>