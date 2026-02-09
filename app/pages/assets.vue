<template>
    <div class="w-fit mx-auto">
        <UFileUpload :disabled="disabled" :preview="false" v-model="files" label="Drop .glb models" class="size-48"
            multiple accept=".glb" @change="uploadAssets"
            :description="files.length ? `Uploading ${files.length} files...` : ''" />
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});
const files = ref([]);
const disabled = computed(() => files.value.length > 0);

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
        console.log(response);
    } catch (error) {
        console.error(error);
    } finally {
        files.value = [];
    }
}
</script>