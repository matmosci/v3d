<template>
  <div class="absolute top-0 bottom-0 left-0 right-0 bg-black/25 backdrop-blur-sm flex flex-col px-10">
    <div class="flex justify-between items-center py-3">
      <div class="flex items-center gap-2">
        <NuxtLink to="/" class="text-lg font-bold">V<span class="text-primary">3D</span></NuxtLink>
        <template v-if="loggedIn && currentAsset">
          /
          <NuxtLink :to="currentAsset.path" :class="$route.path === currentAsset.path ? 'border-b' : ''" class="hover:text-gray-300 transition-colors">{{ currentAsset.name }}
          </NuxtLink>
        </template>
      </div>
      <div class="flex gap-4">
        <NuxtLink v-if="loggedIn" to="/assets" :class="$route.path.startsWith('/assets') ? 'border-b' : ''" class="hover:text-gray-300 transition-colors">Assets</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/community" :class="$route.path.startsWith('/community') ? 'border-b' : ''" class="hover:text-gray-300 transition-colors">Community</NuxtLink>
      </div>
      <User />
    </div>
    <div class="h-full overflow-auto mt-3">
      <NuxtPage />
    </div>
    <div class="mt-auto text-center py-3">
      Press <UKbd>TAB</UKbd> to toggle menu
    </div>
  </div>
</template>

<script setup>
const { loggedIn } = useUserSession();
const editor = useEditor();

// Reactive asset state that updates when editor loads an asset
const currentAsset = ref(null);

// Watch for asset loading in editor
onMounted(async () => {
  let context = null;

  const updateAsset = (eventData) => {
    if (eventData?.assetId && eventData?.assetData) {
      currentAsset.value = {
        id: eventData.assetId,
        name: eventData.assetData.name || `Asset ${eventData.assetId.slice(0, 8)}`,
        path: `/${eventData.assetId}`
      };
    } else {
      currentAsset.value = null;
    }
  };

  // Setup cleanup handler synchronously
  onBeforeUnmount(() => {
    if (context?.events) {
      context.events.off('asset:loaded', updateAsset);
    }
  });

  // Wait for editor to be ready before attaching listeners
  const waitForEditor = () => {
    return new Promise((resolve) => {
      const checkEditor = () => {
        const editorContext = editor.getContext();
        if (editorContext?.events) {
          resolve(editorContext);
        } else {
          setTimeout(checkEditor, 100);
        }
      };
      checkEditor();
    });
  };

  try {
    context = await waitForEditor();
    context.events.on('asset:loaded', updateAsset);
  } catch (error) {
    console.warn('Failed to attach asset event listeners:', error);
  }
});
</script>