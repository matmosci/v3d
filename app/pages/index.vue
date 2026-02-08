<template>
  <Menu v-show="mode === 'overlay'" />
  <Viewport class="absolute top-0 bottom-0 left-0 right-0 -z-1" />
</template>

<script setup>
const { mode } = useViewport();
</script>
