<template>
  <UCard
    class="m-1 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950"
  >
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-white">
        Speranza Community Map
      </h1>

      <p class="mt-6 text-lg text-gray-400 leading-relaxed">
        A collaborative world-building project where the community designs,
        edits, and evolves the Speranza map together — live and online.
      </p>
    </div>

    <!-- Feature cards -->
    <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map" class="w-6 h-6 text-primary" />
            <h3 class="font-semibold text-lg">Build the World</h3>
          </div>
        </template>

        <p class="text-gray-400 text-sm leading-relaxed">
          Add locations, terrain, landmarks, and details directly on the map
          using the online editor.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-primary" />
            <h3 class="font-semibold text-lg">Create Together</h3>
          </div>
        </template>

        <p class="text-gray-400 text-sm leading-relaxed">
          Collaborate with others, discuss ideas, and shape Speranza as a
          shared community vision.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-primary" />
            <h3 class="font-semibold text-lg">Evolving Map</h3>
          </div>
        </template>

        <p class="text-gray-400 text-sm leading-relaxed">
          Speranza is never finished. The map grows and changes as new ideas
          and stories are added.
        </p>
      </UCard>
    </div>

    <!-- Footer -->
    <div class="mt-16 text-center text-sm text-gray-500">
      © Speranza Project — Built by the community
    </div>
  </UCard>
</template>

<script setup lang="ts">
// layout-controlled component
</script>
