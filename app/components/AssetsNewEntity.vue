<template>
	<div class="h-48 cursor-pointer">
		<div 
			class="h-full w-full flex-1 bg-default border border-default flex flex-col gap-2 items-stretch justify-center rounded-lg focus-visible:outline-2 transition-[background] p-4 text-sm border-dashed data-[dragging=true]:bg-elevated/25 focus-visible:outline-primary hover:bg-elevated/25"
			@click="openCreateModal"
		>
			<div class="flex flex-col items-center justify-center text-center px-4 py-3">
				<div class="inline-flex items-center justify-center select-none rounded-full align-middle bg-elevated size-8 text-base shrink-0">
					<UIcon name="i-lucide-square-dashed" class="text-muted shrink-0" />
				</div>
				<p class="font-medium text-default mt-2">New Asset</p>
			</div>
		</div>

		<!-- Create Entity Dialog -->
		<div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeCreateModal">
			<UCard class="w-full max-w-md mx-4">
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Create New Entity</h3>
						<UButton icon="i-lucide-x" variant="ghost" size="xs" @click="closeCreateModal" />
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
						<UTextarea class="w-full"
							v-model="newEntityDescription" 
							placeholder="Optional description"
							:rows="3"
						/>
					</div>
				</div>
				<template #footer>
					<div class="flex justify-end gap-2">
						<UButton variant="ghost" @click="closeCreateModal">
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
	</div>
</template>

<script setup>
const showCreateModal = ref(false);
const newEntityName = ref('');
const newEntityDescription = ref('');
const isCreating = ref(false);

const emit = defineEmits(['created']);

function openCreateModal() {
	showCreateModal.value = true;
}

function closeCreateModal() {
	showCreateModal.value = false;
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

		emit('created', response);
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
</script>
