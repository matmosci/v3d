<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Map Editor'
const description = 'Map Editor built with Nuxt and Three.js'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})

const editor = useEditor();
const mode = computed(() => editor.getMode());
const selectedInstance = editor.getSelectedInstance();

</script>
<template>
  <UApp>
    <Menu v-show="mode === 'overlay'" />
    <ContextMenu v-show="selectedInstance" :selected="selectedInstance" />
    <Viewport class="absolute top-0 bottom-0 left-0 right-0 -z-1" />
  </UApp>
</template>

<style>
@import "./assets/css/main.css";
html,
body,
#__nuxt {
  height: 100%;
}
</style>