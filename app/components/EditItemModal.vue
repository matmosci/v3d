<template>
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="closeModal">
        <UCard class="bg-default rounded-lg shadow-lg max-w-md w-full mx-4" @click.stop>
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-lg">Edit {{ itemType === 'entity' ? 'Entity' : 'Asset' }}</h3>
                    <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
                        <UIcon name="i-lucide-x" class="w-5 h-5" />
                    </button>
                </div>
            </template>

            <form @submit.prevent="saveChanges" class="space-y-4">
                <!-- Name Field -->
                <div>
                    <label class="block text-sm font-medium mb-1">
                        {{ itemType === 'asset' ? 'File Name' : 'Name' }}
                    </label>
                    <UInput v-model="formData.name" :placeholder="`Enter ${itemType === 'asset' ? 'file' : ''} name...`"
                        required />
                </div>

                <!-- Description Field -->
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <!-- <textarea v-model="formData.description" placeholder="Enter description..."
                        class="w-full px-3 py-2 border rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="3"></textarea> -->
                    <UTextarea v-model="formData.description" placeholder="Enter description..." :rows="3" class="w-full" />
                </div>

                <!-- Tags Field -->
                <div>
                    <label class="block text-sm font-medium mb-1">Tags</label>
                    <div class="space-y-2">
                        <!-- Tag Input -->
                        <div class="flex gap-2">
                            <UInput v-model="newTag" placeholder="Add a tag..." @keydown.enter="addTag"
                                @keydown.comma="addTag" class="flex-1" />
                            <UButton @click="addTag" size="sm" variant="outline" icon="i-lucide-plus">
                                Add
                            </UButton>
                        </div>

                        <!-- Existing Tags -->
                        <div v-if="formData.tags.length > 0" class="flex flex-wrap gap-2">
                            <span v-for="(tag, index) in formData.tags" :key="index"
                                class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded">
                                {{ tag }}
                                <button @click="removeTag(index)" type="button"
                                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                                    <UIcon name="i-lucide-x" class="w-3 h-3" />
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </form>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton @click="closeModal" variant="ghost">Cancel</UButton>
                    <UButton @click="saveChanges" :loading="saving">Save Changes</UButton>
                </div>
            </template>
        </UCard>
    </div>
</template>

<script setup>
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    item: {
        type: Object,
        default: null
    },
    itemType: {
        type: String,
        required: true, // 'entity' or 'asset'
        validator: (value) => ['entity', 'asset'].includes(value)
    }
});

const emit = defineEmits(['close', 'saved']);

const formData = ref({
    name: '',
    description: '',
    tags: []
});

const newTag = ref('');
const saving = ref(false);

// Watch for prop changes and update form
watch(() => props.item, (newItem) => {
    if (newItem) {
        formData.value = {
            name: props.itemType === 'asset' ? newItem.originalname : newItem.name,
            description: newItem.description || '',
            tags: [...(newItem.tags || [])]
        };
    }
}, { immediate: true });

function closeModal() {
    emit('close');
    // Reset form
    formData.value = {
        name: '',
        description: '',
        tags: []
    };
    newTag.value = '';
}

function addTag(event) {
    event?.preventDefault();
    const tag = newTag.value.replace(',', '').trim();

    if (tag && !formData.value.tags.includes(tag)) {
        formData.value.tags.push(tag);
        newTag.value = '';
    }
}

function removeTag(index) {
    formData.value.tags.splice(index, 1);
}

async function saveChanges() {
    if (!props.item?._id || saving.value) return;

    try {
        saving.value = true;

        const endpoint = props.itemType === 'asset' ? 'assets' : 'entities';
        const updateData = {
            description: formData.value.description,
            tags: formData.value.tags
        };

        // Add name field with correct property name
        if (props.itemType === 'asset') {
            updateData.originalname = formData.value.name;
        } else {
            updateData.name = formData.value.name;
        }

        const updatedItem = await $fetch(`/api/${endpoint}/${props.item._id}`, {
            method: 'PUT',
            body: updateData
        });

        emit('saved', updatedItem);
        closeModal();

    } catch (error) {
        console.error('Failed to update item:', error);
        alert('Failed to save changes: ' + (error.data?.statusMessage || error.message));
    } finally {
        saving.value = false;
    }
}
</script>