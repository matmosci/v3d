<template>
    <div class="flex h-screen" @click="contextMenu.show = false">
        <!-- Folder Sidebar -->
        <div class="w-64 border-r border-default bg-default flex flex-col">
            <div class="p-4 pb-1 border-b border-default">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="font-semibold">Folders</h2>
                    <UButton @click="openCreateModal" size="xs" variant="ghost" icon="i-lucide-plus">
                        New
                    </UButton>
                </div>
            </div>

            
            <!-- Folder Tree -->
            <div class="flex-1 overflow-auto p-2">
                <!-- Root folder -->
                <div class="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors" :class="{
                    'bg-primary/10 text-primary': currentFolder === null,
                    'hover:bg-elevated/50': currentFolder !== null,
                    'bg-primary/25': isRootDragOver
                }" @click="selectFolder(null)" @dragover.prevent="onRootDragOver" @dragleave="onRootDragLeave"
                    @drop.prevent="onRootDrop">
                    <UIcon name="i-lucide-home" class="w-4 h-4" />
                    <h1 class="text-sm">Assets</h1>
                </div>
                <FolderTreeItem v-for="folder in folderTree" :key="folder._id" :folder="folder"
                    :current-folder="currentFolder" :level="0" @select="selectFolder"
                    @create-subfolder="createSubfolder" @rename="renameFolder" @delete="deleteFolder"
                    @move="handleFolderMove" @drop-item="handleDropItem" />
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Breadcrumb -->
            <div class="p-4 border-b border-default bg-default">
                <nav class="flex items-center gap-2 text-sm">
                    <UButton @click="selectFolder(null)" variant="ghost" size="xs">
                        <UIcon name="i-lucide-home" class="w-4 h-4" />
                        Assets
                    </UButton>
                    <template v-for="(folder, index) in currentPath" :key="folder._id">
                        <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-gray-400" />
                        <UButton @click="selectFolder(folder._id)" variant="ghost" size="xs">
                            {{ folder.name }}
                        </UButton>
                    </template>
                </nav>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-auto px-4">
                <!-- Built-in Tools (only show in root) -->
                <div v-if="currentFolder === null">
                    <h2 class="text-xl font-bold my-2">Built-In Tools</h2>
                    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 2xl:grid-cols-8 mb-6">
                        <BuiltInItem v-for="item in builtInItems" :key="item.sourceId" :source-id="item.sourceId"
                            :title="item.title" :icon="item.icon" />
                    </div>
                </div>

                <div class="flex items-center justify-start gap-2 my-2">
                    <h2 class="text-xl font-bold">
                        {{ currentFolder ? currentFolderName : 'Your Assets' }}
                    </h2>

                    <UButton @click="openCreateModal" size="sm" variant="ghost" icon="i-lucide-folder-plus">
                        New Folder
                    </UButton>
                </div>

                <!-- Assets Grid -->
                <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 2xl:grid-cols-8">
                    <!-- Upload and Create Options -->
                    <AssetsNewEntity @created="fetchEntities" />
                    <AssetsFileInput @uploaded="handleFileUploaded" />

                    <!-- Subfolders in current directory -->
                    <div v-for="subfolder in currentSubfolders" :key="subfolder._id"
                        class="border border-default rounded-lg bg-default hover:bg-elevated/25 cursor-pointer p-4 flex flex-col items-center justify-center transition-colors"
                        @click="selectFolder(subfolder._id)"
                        @contextmenu.prevent="showFolderContextMenu($event, subfolder)">
                        <UIcon name="i-lucide-folder" :style="{ color: subfolder.color }" class="w-8 h-8 mb-2" />
                        <span class="text-sm text-center truncate w-full">{{ subfolder.name }}</span>
                    </div>

                    <!-- Entities -->
                    <AssetsEntityItem v-for="entity in entities" :key="entity._id" :entity="entity"
                        @click="selectEntity(entity)" @deleted="removeEntity" @moved="handleEntityMoved" />
                </div>

                <!-- Empty State -->
                <div v-if="entities.length === 0 && currentSubfolders.length === 0" class="text-center py-12">
                    <UIcon name="i-lucide-folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p class="text-gray-500">No assets or folders here yet.</p>
                    <p class="text-sm text-gray-400 mt-1">Create a new asset or upload files to get started.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Folder Modal -->
    <div v-if="showCreateFolderModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click="closeModal">
        <UCard class="w-full max-w-md mx-4" @click.stop>
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-lg">Create New Folder</h3>
                    <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
                        <UIcon name="i-lucide-x" class="w-5 h-5" />
                    </button>
                </div>
            </template>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Folder Name</label>
                    <UInput v-model="newFolderName" placeholder="Enter folder name..." @keydown.enter="createFolder"
                        autofocus />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">Color</label>
                    <div class="flex gap-2">
                        <button v-for="color in folderColors" :key="color"
                            class="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                            :class="{ 'border-gray-400 ring-2 ring-gray-400': newFolderColor === color, 'border-transparent': newFolderColor !== color }"
                            :style="{ backgroundColor: color }" @click="newFolderColor = color" />
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton @click="closeModal" variant="ghost">Cancel</UButton>
                    <UButton @click="createFolder" :disabled="!newFolderName.trim()" :loading="creatingFolder">Create
                    </UButton>
                </div>
            </template>
        </UCard>

    </div>

    <!-- Context Menu Component -->
    <div v-if="contextMenu.show"
        class="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-32"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
        <button v-for="item in contextMenuItems" :key="item.key"
            class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            :class="item.class || ''" @click="handleContextMenuAction(item)">
            <UIcon :name="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
        </button>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: 'user'
});

const editor = useEditor();
const { folders, currentFolder, fetchFolders, createFolder: createFolderApi, updateFolder, deleteFolder: deleteFolderApi, moveItem, buildFolderTree, getFolderPath } = useFolders();

// State
const entities = ref([]);
const showCreateFolderModal = ref(false);
const newFolderName = ref('');
const newFolderColor = ref('#3b82f6');
const creatingFolder = ref(false);
const contextMenu = ref({ show: false, x: 0, y: 0, folder: null });
const isRootDragOver = ref(false);

// Folder colors
const folderColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Built-in items
const builtInItems = [
    { sourceId: 'primitive:plane', title: 'Plane', icon: 'i-lucide-square' },
    { sourceId: 'primitive:box', title: 'Box', icon: 'i-lucide-box' },
    { sourceId: 'primitive:sphere', title: 'Sphere', icon: 'i-lucide-circle' },
    { sourceId: 'primitive:cylinder', title: 'Cylinder', icon: 'i-lucide-cylinder' },
    { sourceId: 'light:point', title: 'Point Light', icon: 'i-lucide-lightbulb' },
    { sourceId: 'light:spot', title: 'Spot Light', icon: 'i-lucide-cone' },
];

// Computed
const folderTree = computed(() => buildFolderTree());
const currentPath = computed(() => getFolderPath(currentFolder.value));
const currentFolderName = computed(() => {
    if (!currentFolder.value) return 'Your Assets';
    const folder = folders.value.find(f => f._id === currentFolder.value);
    return folder?.name || 'Unknown Folder';
});

const currentSubfolders = computed(() => {
    return folders.value.filter(f => f.parent === currentFolder.value);
});

const contextMenuItems = computed(() => [
    { key: 'rename', label: 'Rename', icon: 'i-lucide-edit-2' },
    { key: 'delete', label: 'Delete', icon: 'i-lucide-trash-2', class: 'text-red-500' }
]);

// Watch for modal state changes  
watch(showCreateFolderModal, (newValue, oldValue) => {
    console.log('Modal state changed:', { from: oldValue, to: newValue });
});

// Methods
async function fetchEntities() {
    try {
        const params = currentFolder.value ? { folder: currentFolder.value } : {};
        const data = await $fetch('/api/user/entities', { params });
        entities.value = data;
    } catch (error) {
        console.error(error);
    }
}

async function handleFileUploaded(uploadResults) {
    await fetchEntities();
}

function selectEntity(entity) {
    const context = editor.getContext();
    if (context.entity) {
        context.events.emit("object:placement:start", {
            sourceType: "entity",
            sourceId: entity._id
        });
    } else {
        location.href = `/${entity._id}`;
    }
}

function removeEntity(entityId) {
    entities.value = entities.value.filter(entity => entity._id !== entityId);
}

function selectFolder(folderId) {
    currentFolder.value = folderId;
    fetchEntities();
}

// Modal functions
function openCreateModal() {
    console.log('Opening create folder modal...', showCreateFolderModal.value);
    showCreateFolderModal.value = true;
    console.log('Modal state after setting:', showCreateFolderModal.value);
}

function closeModal() {
    showCreateFolderModal.value = false;
    newFolderName.value = '';
    newFolderColor.value = '#3b82f6';
}

async function createFolder() {
    if (!newFolderName.value.trim()) return;

    try {
        creatingFolder.value = true;
        await createFolderApi(newFolderName.value, currentFolder.value, newFolderColor.value);
        closeModal();
    } catch (error) {
        console.error('Failed to create folder:', error);
        alert('Failed to create folder: ' + error.message);
    } finally {
        creatingFolder.value = false;
    }
}

function showFolderContextMenu(event, folder) {
    event.stopPropagation();
    contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        folder
    };
}

async function handleContextMenuAction(action) {
    const folder = contextMenu.value.folder;
    contextMenu.value.show = false;

    if (action.key === 'rename') {
        const newName = prompt('Enter new folder name:', folder.name);
        if (newName && newName !== folder.name) {
            try {
                await updateFolder(folder._id, { name: newName });
            } catch (error) {
                alert('Failed to rename folder');
            }
        }
    } else if (action.key === 'delete') {
        if (confirm(`Delete "${folder.name}"?\n\nAny content inside will be moved to "All Assets".`)) {
            try {
                await deleteFolderApi(folder._id);
                if (currentFolder.value === folder._id) {
                    currentFolder.value = folder.parent;
                    await fetchEntities();
                }
            } catch (error) {
                alert('Failed to delete folder: ' + (error.data?.statusMessage || error.message));
            }
        }
    }
}

async function handleItemMove(folderId, itemType) {
    console.log('Move item to folder:', folderId, itemType);
    // This function can be used for other move operations if needed
}

// Handle entity moved event
async function handleEntityMoved(data) {
    console.log('Entity moved:', data);
    // Refresh the current folder view to reflect the change
    await fetchEntities();
}

// Handle root folder drop zone
function onRootDragOver(event) {
    event.preventDefault();
    isRootDragOver.value = true;
    event.dataTransfer.dropEffect = 'move';
}

function onRootDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
        isRootDragOver.value = false;
    }
}

async function onRootDrop(event) {
    event.preventDefault();
    isRootDragOver.value = false;

    try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));

        if (data.type === 'entity') {
            await $fetch(`/api/entities/${data.id}/move`, {
                method: 'PUT',
                body: { folder: null }
            });
        } else if (data.type === 'asset') {
            await $fetch(`/api/assets/${data.id}/move`, {
                method: 'PUT',
                body: { folder: null }
            });
        }

        // Refresh the view
        await fetchEntities();

    } catch (error) {
        console.error('Failed to move item:', error);
        alert('Failed to move item: ' + (error.data?.statusMessage || error.message));
    }
}

// Handle drop events from folder tree
async function handleDropItem(data) {
    console.log('Item dropped:', data);
    // Refresh the current folder view after a drop
    await fetchEntities();
}

// Handle folder tree events
async function createSubfolder(parentFolderId) {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
        try {
            await createFolderApi(folderName.trim(), parentFolderId, '#3b82f6');
        } catch (error) {
            alert('Failed to create folder');
        }
    }
}

async function renameFolder(data) {
    try {
        await updateFolder(data.id, { name: data.name });
    } catch (error) {
        alert('Failed to rename folder');
    }
}

async function deleteFolder(folderId) {
    const folderToDelete = folders.value.find(f => f._id === folderId);
    const folderName = folderToDelete?.name || 'Unknown folder';

    try {
        const result = await deleteFolderApi(folderId);

        if (currentFolder.value === folderId) {
            // Navigate to parent folder or root if current folder was deleted
            currentFolder.value = folderToDelete?.parent || null;
            await fetchEntities();
        }

        // Show success message if content was moved
        if (result.movedToRoot) {
            // Optional: Show a toast notification instead of alert for better UX
            console.log(`Folder "${folderName}" deleted. Content moved to "All Assets".`);
        }

    } catch (error) {
        console.error('Failed to delete folder:', error);
        alert('Failed to delete folder: ' + (error.data?.statusMessage || error.message));
    }
}

async function handleFolderMove(data) {
    console.log('Move folder:', data);
    // Implementation for moving folders would go here
}

// Initialize
onMounted(async () => {
    await fetchFolders();
    await fetchEntities();

    // Listen for thumbnail updates
    const context = editor.getContext();
    if (context) {
        context.events.on("thumbnail:created", ({ thumbnail }) => {
            const currentEntityId = context.entity;
            if (currentEntityId && entities.value) {
                const entityIndex = entities.value.findIndex(entity => entity._id === currentEntityId);
                if (entityIndex !== -1) {
                    entities.value[entityIndex] = {
                        ...entities.value[entityIndex],
                        thumbnail: thumbnail
                    };
                }
            }
        });
    }
});
</script>