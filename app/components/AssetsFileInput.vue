<template>
    <UFileUpload :disabled="disabled" :preview="false" v-model="files" label="Drop .glb models" class="w-full h-48 hover:cursor-pointer"
        multiple accept=".glb" @change="uploadAssets"
        :description="files.length ? `Uploading ${files.length} files...` : ''" />
</template>

<script setup>
const files = ref([]);
const disabled = computed(() => files.value.length > 0);

const emit = defineEmits(['uploaded']);

async function uploadAssets() {
    const formData = new FormData();
    for (let i = 0; i < files.value.length; i++) {
        formData.append('files', files.value[i]);
    };
    try {
        const response = await $fetch('/api/assets', {
            method: 'POST',
            body: formData,
        });
        emit('uploaded');
    } catch (error) {
        console.error(error);
    } finally {
        files.value = [];
    }
}
</script>