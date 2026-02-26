<template>
    <div>
        <div 
            class="flex items-center gap-2 p-1 rounded cursor-pointer transition-colors group"
            :class="{ 
                'bg-primary/10 text-primary': currentFolder === folder._id, 
                'hover:bg-elevated/50': currentFolder !== folder._id 
            }"
            :style="{ paddingLeft: `${level * 12 + 8}px` }"
            @click="$emit('select', folder._id)"
            @contextmenu.prevent="showContextMenu"
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
                class="w-4 h-4 flex-shrink-0"
            />
            <span class="text-sm truncate flex-1">{{ folder.name }}</span>
            
            <!-- Actions (visible on hover) -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <UButton 
                    @click.stop="$emit('create-subfolder', folder._id)"
                    size="2xs"
                    variant="ghost"
                    icon="i-lucide-plus"
                    class="w-5 h-5"
                />
                <!-- TODO fix -->
                <!-- <UButton 
                    @click.stop="showContextMenu"
                    size="2xs"
                    variant="ghost"
                    icon="i-lucide-more-horizontal"
                    class="w-5 h-5"
                /> -->
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
            />
        </div>
        
        <!-- Context Menu -->
        <ContextMenu v-if="contextMenu.show" 
            :x="contextMenu.x" 
            :y="contextMenu.y" 
            @close="contextMenu.show = false"
        >
            <div class="py-1">
                <button 
                    @click="handleRename"
                    class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                    <UIcon name="i-lucide-edit-2" class="w-4 h-4" />
                    Rename
                </button>
                <button 
                    @click="$emit('create-subfolder', folder._id); contextMenu.show = false"
                    class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                    <UIcon name="i-lucide-folder-plus" class="w-4 h-4" />
                    New Subfolder
                </button>
                <button 
                    @click="handleDelete"
                    class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-red-500"
                >
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    Delete
                </button>
            </div>
        </ContextMenu>
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

const emit = defineEmits(['select', 'create-subfolder', 'rename', 'delete', 'move']);

const expanded = ref(true);
const contextMenu = ref({ show: false, x: 0, y: 0 });

function showContextMenu(event) {
    return; // TODO fix
    contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY
    };
}

function handleRename() {
    const newName = prompt('Enter new folder name:', props.folder.name);
    if (newName && newName !== props.folder.name) {
        emit('rename', { id: props.folder._id, name: newName });
    }
    contextMenu.value.show = false;
}

function handleDelete() {
    if (confirm(`Are you sure you want to delete "${props.folder.name}"?`)) {
        emit('delete', props.folder._id);
    }
    contextMenu.value.show = false;
}
</script>