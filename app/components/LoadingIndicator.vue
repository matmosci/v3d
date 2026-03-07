<template>
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 min-w-75">
            <div class="flex flex-col items-center gap-4">
                <!-- Spinner Icon -->
                <div class="relative">
                    <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary animate-spin" />
                </div>

                <!-- Loading Text -->
                <div class="text-center">
                    <h3 class="text-lg font-semibold mb-1">
                        {{ phase === 'downloading' ? 'Downloading Assets' : phase === 'placing' ? 'Placing Objects' : 'Loading...' }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ loaded }} / {{ total }} {{ phase === 'downloading' ? 'assets' : 'items' }} {{ phase === 'downloading' ? 'downloaded' : 'placed' }}
                    </p>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                        class="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                        :style="{ width: `${progress}%` }"
                    ></div>
                </div>

                <!-- Percentage -->
                <div class="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {{ Math.round(progress) }}%
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    editor: {
        type: Object,
        required: true
    }
});

const isLoading = ref(false);
const total = ref(0);
const loaded = ref(0);
const phase = ref('loading');

const progress = computed(() => {
    if (total.value === 0) return 0;
    return (loaded.value / total.value) * 100;
});

let listeners = [];

const onLoadingStart = (data) => {
    isLoading.value = true;
    total.value = Math.max(data.total, 1); // Show at least 1 to avoid divide by zero
    loaded.value = 0;
    phase.value = data.assetsToDownload > 0 ? 'downloading' : 'placing';
};

const onLoadingProgress = (data) => {
    total.value = data.total;
    loaded.value = data.loaded;
    if (data.phase) {
        phase.value = data.phase;
    }
};

const onLoadingComplete = () => {
    // Small delay to show 100% before hiding
    setTimeout(() => {
        isLoading.value = false;
        total.value = 0;
        loaded.value = 0;
        phase.value = 'loading';
    }, 500);
};

const onLoadingError = () => {
    isLoading.value = false;
    total.value = 0;
    loaded.value = 0;
    phase.value = 'loading';
};

const setupEventListeners = (context) => {
    if (!context) return;

    context.events.on("loading:start", onLoadingStart);
    context.events.on("loading:progress", onLoadingProgress);
    context.events.on("loading:complete", onLoadingComplete);
    context.events.on("loading:error", onLoadingError);

    // Store listeners for cleanup
    listeners = [
        { event: "loading:start", handler: onLoadingStart },
        { event: "loading:progress", handler: onLoadingProgress },
        { event: "loading:complete", handler: onLoadingComplete },
        { event: "loading:error", handler: onLoadingError }
    ];
};

const cleanupEventListeners = (context) => {
    if (!context || listeners.length === 0) return;

    listeners.forEach(({ event, handler }) => {
        context.events.off(event, handler);
    });
    listeners = [];
};

// Watch for editor context availability - improved detection
watch(() => {
    if (!props.editor) return null;
    try {
        return props.editor.getContext();
    } catch (e) {
        return null;
    }
}, (newContext, oldContext) => {
    if (oldContext?.events) {
        cleanupEventListeners(oldContext);
    }
    if (newContext?.events) {
        setupEventListeners(newContext);
    }
}, { immediate: true });

onMounted(() => {
    // Try to set up listeners immediately if context is available
    if (props.editor) {
        const context = props.editor.getContext();
        if (context?.events) {
            setupEventListeners(context);
        }
    }
    
    // Also try polling for context availability (backup method)
    const pollForContext = () => {
        if (!props.editor) return;
        const context = props.editor.getContext();
        if (context?.events && listeners.length === 0) {
            setupEventListeners(context);
        } else if (!context?.events) {
            // Try again in 100ms
            setTimeout(pollForContext, 100);
        }
    };
    
    // Start polling after a short delay
    setTimeout(pollForContext, 50);
});

onUnmounted(() => {
    if (!props.editor) return;
    const context = props.editor.getContext();
    if (context) {
        cleanupEventListeners(context);
    }
});
</script>
