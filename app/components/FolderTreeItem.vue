<template>
    <div>
        <div 
            class="flex items-center gap-2 p-1 rounded cursor-pointer transition-colors group"
            :class="{ 
                'bg-primary/10 text-primary': currentFolder === folder._id, 
                'hover:bg-elevated/50': currentFolder !== folder._id,
                'bg-primary/25': isDragOver
            }"
            :style="{ paddingLeft: `${level * 12 + 8}px` }"
            draggable="true"
            @click="$emit('select', folder._id)"
            @contextmenu.prevent="showContextMenu"
            @dragstart="onDragStart"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
        >
            <UButton 
                v-if="folder.children.length > 0"
                @click.stop="expanded = !expanded"
                size="2xs"
                variant="ghost"
                :icon="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            />
            <div v-else class="w-4" />
            
            <UIcon 
                name="i-lucide-folder" 
                :style="{ color: folder.color }" 
                class="w-4 h-4 shrink-0"
            />
            <span class="text-sm truncate flex-1">{{ folder.name }}</span>
            
            <!-- Actions (visible on hover) -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <!-- <UButton 
                    @click.stop="$emit('create-subfolder', folder._id)"
                    size="2xs"
                    variant="ghost"
                    icon="i-lucide-plus"
                    title="New Subfolder"
                    class="px-1 h-5"
                /> -->
                <UButton 
                    @click.stop="showContextMenu"
                    size="2xs"
                    variant="ghost"
                    icon="i-lucide-more-horizontal"
                    title="More options"
                    class="px-1 h-5"
                />
            </div>
        </div>
        
        <!-- Children -->
        <div v-if="expanded && folder.children.length > 0">
            <FolderTreeItem 
                v-for="child in folder.children"
                :key="child._id"
                :folder="child"
                :current-folder="currentFolder"
                :level="level + 1"
                @select="$emit('select', $event)"
                @create-subfolder="$emit('create-subfolder', $event)"
                @rename="$emit('rename', $event)"
                @delete="$emit('delete', $event)"
                @move="$emit('move', $event)"
                @drop-item="$emit('drop-item', $event)"
            />
        </div>
        
        <!-- Simple Context Menu -->
        <div v-if="contextMenu.show" 
            class="context-menu fixed bg-white dark:bg-default border border-default rounded-lg shadow-lg z-50 py-1 min-w-32"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
        >
            <button 
                @click="handleRename"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
                <UIcon name="i-lucide-edit-2" class="w-4 h-4" />
                <span>Rename</span>
            </button>
            <button 
                @click="createSubfolder"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
                <UIcon name="i-lucide-folder-plus" class="w-4 h-4" />
                <span>New Subfolder</span>
            </button>
            <button 
                @click="handleDelete"
                class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors text-red-500"
            >
                <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                <span>Delete</span>
            </button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    folder: {
        type: Object,
        required: true
    },
    currentFolder: {
        type: String,
        default: null
    },
    level: {
        type: Number,
        default: 0
    }
});

const emit = defineEmits(['select', 'create-subfolder', 'rename', 'delete', 'move', 'drop-item']);

const expanded = ref(true);
const contextMenu = ref({ show: false, x: 0, y: 0 });
const isDragOver = ref(false);

// Close context menu when clicking outside
const closeContextMenu = (event) => {
    if (contextMenu.value.show && !event.target.closest('.context-menu')) {
        contextMenu.value.show = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
    document.removeEventListener('click', closeContextMenu);
});
function showContextMenu(event) {
    event.stopPropagation();
    contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY
    };
}

function onDragStart(event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'folder',
        id: props.folder._id
    }));
}

function onDragOver(event) {
    event.preventDefault();
    isDragOver.value = true;
    event.dataTransfer.dropEffect = 'move';
}

function onDragLeave(event) {
    // Only hide drag over if we're actually leaving this element
    if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOver.value = false;
    }
}

async function onDrop(event) {
    event.preventDefault();
    isDragOver.value = false;
    
    try {
        const data = JSON.parse(event.dataTransfer.getData('application/json'));
        
        if (data.type === 'entity') {
            await $fetch(`/api/entities/${data.id}/move`, {
                method: 'PUT',
                body: { folder: props.folder._id }
            });
        } else if (data.type === 'asset') {
            await $fetch(`/api/assets/${data.id}/move`, {
                method: 'PUT',
                body: { folder: props.folder._id }
            });
        } else if (data.type === 'folder') {
            // Handle folder move
            emit('move', {
                folderId: data.id,
                targetParentId: props.folder._id
            });
        }
        
        // Emit event to parent to refresh the view
        emit('drop-item', {
            itemType: data.type,
            itemId: data.id,
            targetFolderId: props.folder._id
        });
        
    } catch (error) {
        console.error('Failed to move item:', error);
        alert('Failed to move item: ' + (error.data?.statusMessage || error.message));
    }
}

function handleRename() {
    const newName = prompt('Enter new folder name:', props.folder.name);
    if (newName && newName !== props.folder.name) {
        emit('rename', { id: props.folder._id, name: newName });
    }
    contextMenu.value.show = false;
}

function createSubfolder() {
    emit('create-subfolder', props.folder._id);
    contextMenu.value.show = false;
}

function handleDelete() {
    contextMenu.value.show = false;
    const confirmed = confirm(`Delete "${props.folder.name}"?\n\nAny content inside will be moved to "All Assets".`);
    if (confirmed) {
        emit('delete', props.folder._id);
    }
}
</script>