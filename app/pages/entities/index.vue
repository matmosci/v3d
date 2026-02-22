<template>
    <div class="grid gap-4" :class="entities.length ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'">
        <UCard 
            class="cursor-pointer hover:bg-gray-800/50 transition-colors border-2 border-dashed border-gray-700"
            @click="createNewEntity"
        >
            <div class="flex flex-col items-center justify-center py-8">
                <UIcon name="i-lucide-plus" class="w-12 h-12 text-gray-500 mb-2" />
                <p class="text-gray-400 font-medium">Create New Entity</p>
            </div>
        </UCard>
        <UCard 
            v-for="entity in entities" 
            :key="entity._id" 
            class="cursor-pointer hover:bg-gray-800/50 transition-colors"
            @click="navigateTo(`/${entity._id}`, { external: true })"
        >
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-lg truncate">{{ entity.name }}</h3>
                    <UButton 
                        icon="i-lucide-more-vertical" 
                        variant="ghost" 
                        size="xs"
                        @click.stop="openContextMenu($event, entity)"
                    />
                </div>
            </template>
            <div class="space-y-2">
                <p v-if="entity.description" class="text-sm text-gray-400 line-clamp-2">
                    {{ entity.description }}
                </p>
                <p v-else class="text-sm text-gray-500 italic">
                    No description
                </p>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                    <span>{{ formatDate(entity.createdAt) }}</span>
                </div>
            </div>
        </UCard>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="deleteConfirmation" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="deleteConfirmation = null">
        <UCard class="w-full max-w-sm mx-4">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Delete Entity</h3>
                    <UButton icon="i-lucide-x" variant="ghost" size="xs" @click="deleteConfirmation = null" />
                </div>
            </template>
            <div class="space-y-2">
                <p class="text-sm">Are you sure you want to delete <strong>{{ deleteConfirmation?.name }}</strong>?</p>
                <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="ghost" @click="deleteConfirmation = null">
                        Cancel
                    </UButton>
                    <UButton 
                        color="red" 
                        @click="confirmDelete"
                        :loading="isDeleting"
                    >
                        Delete
                    </UButton>
                </div>
            </template>
        </UCard>
    </div>

    <!-- Create Entity Dialog -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCreateModal = false">
        <UCard class="w-full max-w-md mx-4">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Create New Entity</h3>
                    <UButton icon="i-lucide-x" variant="ghost" size="xs" @click="showCreateModal = false" />
                </div>
            </template>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Entity Name <span class="text-red-500">*</span></label>
                    <UInput 
                        v-model="newEntityName" 
                        placeholder="Enter entity name"
                        autofocus
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <UTextarea 
                        v-model="newEntityDescription" 
                        placeholder="Optional description"
                        :rows="3"
                    />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton variant="ghost" @click="showCreateModal = false">
                        Cancel
                    </UButton>
                    <UButton 
                        @click="createEntity" 
                        :disabled="!newEntityName.trim()"
                        :loading="isCreating"
                    >
                        Create
                    </UButton>
                </div>
            </template>
        </UCard>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const entities = ref([]);
const showCreateModal = ref(false);
const newEntityName = ref('');
const newEntityDescription = ref('');
const isCreating = ref(false);
const deleteConfirmation = ref(null);
const isDeleting = ref(false);

async function fetchEntities() {
    try {
        const data = await $fetch('/api/user/entities');
        entities.value = data;
    } catch (error) {
        console.error('Error fetching entities:', error);
    }
}

function createNewEntity() {
    showCreateModal.value = true;
}

async function createEntity() {
    if (!newEntityName.value.trim()) return;
    
    isCreating.value = true;
    try {
        const response = await $fetch('/api/entities', {
            method: 'POST',
            body: {
                name: newEntityName.value,
                description: newEntityDescription.value
            }
        });
        
        // Navigate to the new entity
        await navigateTo(`/${response._id}`, { external: true });
    } catch (error) {
        console.error('Error creating entity:', error);
    } finally {
        isCreating.value = false;
        showCreateModal.value = false;
        newEntityName.value = '';
        newEntityDescription.value = '';
    }
}

function openContextMenu(event, entity) {
    deleteConfirmation.value = entity;
}

async function confirmDelete() {
    if (!deleteConfirmation.value) return;
    
    isDeleting.value = true;
    try {
        await $fetch(`/api/entities/${deleteConfirmation.value._id}`, {
            method: 'DELETE'
        });
        
        // Remove from list
        entities.value = entities.value.filter(e => e._id !== deleteConfirmation.value._id);
        deleteConfirmation.value = null;
    } catch (error) {
        console.error('Error deleting entity:', error);
    } finally {
        isDeleting.value = false;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

onMounted(() => {
    fetchEntities();
});
</script>
