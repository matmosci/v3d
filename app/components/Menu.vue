<template>
  <div class="absolute top-0 bottom-0 left-0 right-0 bg-black/25 backdrop-blur-sm flex flex-col px-10">
    <div class="flex justify-between items-center py-3">
      <div class="flex items-center gap-2">
        <NuxtLink to="/" class="text-lg font-bold">V3D</NuxtLink>
        <template v-if="loggedIn && currentEntity">
          /
          <NuxtLink :to="currentEntity.path" :class="$route.path === currentEntity.path ? 'border-b' : ''" class="hover:text-gray-300 transition-colors">{{ currentEntity.name }}
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

// Reactive entity state that updates when editor loads an entity
const currentEntity = ref(null);

// Watch for entity loading in editor
onMounted(async () => {
  let context = null;

  const updateEntity = (eventData) => {
    if (eventData?.entityId && eventData?.entityData) {
      currentEntity.value = {
        id: eventData.entityId,
        name: eventData.entityData.name || `Entity ${eventData.entityId.slice(0, 8)}`,
        path: `/${eventData.entityId}`
      };
    } else {
      currentEntity.value = null;
    }
  };

  // Setup cleanup handler synchronously
  onBeforeUnmount(() => {
    if (context?.events) {
      context.events.off('entity:loaded', updateEntity);
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
    context.events.on('entity:loaded', updateEntity);
  } catch (error) {
    console.warn('Failed to attach entity event listeners:', error);
  }
});
</script>