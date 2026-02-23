<template>
  <div
    class="p-1"
  >
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-white">
        Community Asset Editor
      </h1>

      <p class="mt-6 text-lg text-gray-400 leading-relaxed">
        A collaborative platform where communities design, create, and manage
        assets and maps together — live and online.
      </p>
    </div>

    <!-- Feature cards -->
    <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map" class="w-6 h-6 text-primary" />
            <h3 class="font-semibold text-lg">Create Assets</h3>
          </div>
        </template>

        <p class="text-gray-400 text-sm leading-relaxed">
          Design and build custom assets and maps using intuitive tools and
          the online editor.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-primary" />
            <h3 class="font-semibold text-lg">Collaborate</h3>
          </div>
        </template>

        <p class="text-gray-400 text-sm leading-relaxed">
          Work together with community members, share ideas, and build a
          shared vision.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-primary" />
            <h3 class="font-semibold text-lg">Continuous Growth</h3>
          </div>
        </template>

        <p class="text-gray-400 text-sm leading-relaxed">
          Your project evolves as new ideas and contributions are added by
          the community.
        </p>
      </UCard>
    </div>

    <!-- Footer -->
    <div class="mt-16 text-center text-sm text-gray-500">
      © Community Asset Editor — Built by the community, for the community
    </div>
  </div>
</template>

<script setup lang="ts">
// layout-controlled component
</script>
