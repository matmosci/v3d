<template>
    <div class="community-assets">
        <UIH1>COMMUNITY ASSETS</UIH1>
        
        <!-- Search Section -->
        <div class="mb-4">
            <div class="relative max-w-md">
                <UInput 
                    ref="searchInput"
                    v-model="searchQuery" 
                    placeholder="Search assets... (Ctrl+K)" 
                    size="lg"
                    :ui="{ icon: { trailing: { pointer: '' } } }"
                >
                    <template #leading>
                        <UIcon name="i-lucide-search" class="w-4 h-4 text-gray-400" />
                    </template>
                    <template #trailing>
                        <UButton 
                            v-if="searchQuery" 
                            @click="clearSearch" 
                            size="2xs" 
                            variant="ghost" 
                            icon="i-lucide-x"
                            class="-mr-1"
                        />
                    </template>
                </UInput>
            </div>
            
            <!-- Search Results Info -->
            <div v-if="searchQuery" class="mt-2 text-sm text-gray-500">
                {{ filteredEntities.length }} of {{ entities.length }} assets found
            </div>
        </div>
        
        <div v-if="loading" class="text-center py-8">
            <p>Loading entities...</p>
        </div>
        
        <div v-else-if="filteredEntities.length === 0 && searchQuery" class="text-center py-8">
            <UIcon name="i-lucide-search-x" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-gray-500 mb-2">No assets found matching "{{ searchQuery }}"</p>
            <UButton @click="clearSearch" size="sm" variant="ghost">Clear search</UButton>
        </div>
        
        <div v-else-if="entities.length === 0" class="text-center py-8">
            <p class="text-gray-500">No entities found in the community yet.</p>
        </div>
        
        <div v-else class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            <div v-for="entity in filteredEntities" :key="entity._id" class="flex flex-col border border-default rounded-lg bg-default overflow-hidden cursor-pointer hover:bg-elevated/25 transition-colors" @click="selectEntity(entity)">
                <div class="p-1">
                    <div class="h-32 w-full bg-black/30 rounded-md overflow-hidden">
                        <img v-if="entity.thumbnail" :src="entity.thumbnail" :alt="entity.name" class="h-full w-full object-cover object-center">
                        <div v-else class="h-full w-full flex items-center justify-center">
                            <UIcon name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
                        </div>
                    </div>
                </div>
                
                <div class="p-2">
                    <h3 class="font-medium text-sm mb-1 truncate">{{ entity.name }}</h3>
                    <p class="text-xs text-gray-400 mb-2" v-if="entity.description">{{ entity.description }}</p>
                    
                    <!-- Tags -->
                    <div v-if="entity.tags && entity.tags.length > 0" class="mb-2">
                        <div class="flex flex-wrap gap-1">
                            <UBadge v-for="tag in entity.tags.slice(0, 2)" :key="tag" size="xs" class="text-xs px-1 py-0">
                                #{{ tag }}
                            </UBadge>
                            <span v-if="entity.tags.length > 2" class="text-xs text-gray-500">
                                +{{ entity.tags.length - 2 }}
                            </span>
                        </div>
                    </div>
                    
                    <p class="text-xs text-gray-500">by {{ entity.owner?.username || 'Community User' }}</p>
                </div>
                
                <div class="flex items-center justify-between px-2 pt-0 py-1 mt-auto">
                    <div class="flex items-center gap-2">
                        <button 
                            @click.stop="toggleLike(entity._id)"
                            :class="{ 'text-blue-500': entity.userVote === 'like' }"
                            class="text-xs hover:text-blue-500 transition-colors flex items-center gap-1"
                            :disabled="votingStates[entity._id]"
                        >
                            <UIcon name="i-lucide-thumbs-up" class="w-3 h-3" />
                            {{ entity.likesCount || 0 }}
                        </button>
                        
                        <button 
                            @click.stop="toggleDislike(entity._id)"
                            :class="{ 'text-red-500': entity.userVote === 'dislike' }"
                            class="text-xs hover:text-red-500 transition-colors flex items-center gap-1"
                            :disabled="votingStates[entity._id]"
                        >
                            <UIcon name="i-lucide-thumbs-down" class="w-3 h-3" />
                            {{ entity.dislikesCount || 0 }}
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-1">
                        <UButton 
                            v-if="loggedIn" 
                            size="xs" 
                            variant="ghost"
                            class="px-1"
                            @click.stop="addToMyAssets(entity)"
                            :disabled="addingToAssets[entity._id]"
                            :loading="addingToAssets[entity._id]"
                            title="Add to my assets"
                        >
                            <UIcon name="i-lucide-plus" class="w-3 h-3" />
                        </UButton>
                        <UButton size="xs" variant="ghost" @click.stop="openEntity(entity)">Open</UButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const entities = ref([]);
const loading = ref(true);
const votingStates = ref({});
const addingToAssets = ref({});
const searchQuery = ref('');
const searchInput = ref(null);
const editor = useEditor();
const { loggedIn, user } = useUserSession();

// Computed property for filtered entities with debounced search
const debouncedSearchQuery = ref('');

// Simple debounce implementation
let searchTimeout = null;
watch(searchQuery, (newValue) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        debouncedSearchQuery.value = newValue;
    }, 300);
}, { immediate: true });

const filteredEntities = computed(() => {
    if (!debouncedSearchQuery.value.trim()) {
        return entities.value;
    }
    
    const query = debouncedSearchQuery.value.toLowerCase().trim();
    
    return entities.value.filter(entity => {
        // Search in name
        if (entity.name && entity.name.toLowerCase().includes(query)) {
            return true;
        }
        
        // Search in description
        if (entity.description && entity.description.toLowerCase().includes(query)) {
            return true;
        }
        
        // Search in tags
        if (entity.tags && Array.isArray(entity.tags)) {
            return entity.tags.some(tag => 
                tag.toLowerCase().includes(query)
            );
        }
        
        return false;
    });
});

// Function to clear search
function clearSearch() {
    searchQuery.value = '';
    // Focus the input element within the UInput component
    nextTick(() => {
        searchInput.value?.$el?.querySelector('input')?.focus();
    });
}

// Keyboard shortcut to focus search
function handleKeyDown(event) {
    // Ctrl+K or Cmd+K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInput.value?.$el?.querySelector('input')?.focus();
    }
    
    // Escape to clear search if input is focused
    if (event.key === 'Escape' && document.activeElement === searchInput.value?.$el?.querySelector('input')) {
        clearSearch();
    }
}

// Fetch real entities from the community API
async function fetchEntities() {
    try {
        loading.value = true;
        const data = await $fetch('/api/entities');
        
        // Server now returns processed vote counts
        entities.value = data;
    } catch (error) {
        console.error('Failed to fetch community entities:', error);
        entities.value = [];
    } finally {
        loading.value = false;
    }
}

async function toggleLike(entityId) {
    if (!loggedIn.value) {
        alert('Please log in to vote');
        return;
    }
    
    await vote(entityId, 'like');
}

async function toggleDislike(entityId) {
    if (!loggedIn.value) {
        alert('Please log in to vote');
        return;
    }
    
    await vote(entityId, 'dislike');
}

async function vote(entityId, voteType) {
    const entity = entities.value.find(e => e._id === entityId);
    if (!entity || votingStates.value[entityId]) return;
    
    votingStates.value[entityId] = true;
    
    try {
        const response = await $fetch(`/api/entities/${entityId}/vote`, {
            method: 'POST',
            body: { voteType }
        });
        
        // Update the entity with new vote data
        entity.likesCount = response.likesCount;
        entity.dislikesCount = response.dislikesCount;
        entity.userVote = response.userVote;
        
    } catch (error) {
        console.error('Failed to vote:', error);
    } finally {
        votingStates.value[entityId] = false;
    }
}

async function addToMyAssets(entity) {
    if (!loggedIn.value) {
        alert('Please log in to add assets');
        return;
    }
    
    if (addingToAssets.value[entity._id]) return;
    
    addingToAssets.value[entity._id] = true;
    
    try {
        await $fetch('/api/user/entitylinks', {
            method: 'POST',
            body: {
                targetEntityId: entity._id,
                name: entity.name,
                description: entity.description,
                tags: entity.tags || []
            }
        });
        
        // Show success notification (you can replace with your toast system)
        console.log('Entity added to your assets!');
        // TODO: Add toast notification here if you have one
        
    } catch (error) {
        console.error('Failed to add entity to assets:', error);
        if (error.statusCode === 409) {
            alert('This item is already in your assets');
        } else {
            alert('Failed to add item to assets');
        }
    } finally {
        addingToAssets.value[entity._id] = false;
    }
}

function selectEntity(entity) {
    const context = editor.getContext();
    if (context?.entity) {
        // Already in an entity, place this entity as an instance
        context.events.emit("object:placement:start", {
            sourceType: "entity",
            sourceId: entity._id
        });
        return; // Don't navigate
    } else {
        // Not in an entity, navigate to it
        navigateTo(`/${entity._id}`, { external: true });
    }
}

function openEntity(entity) {
    // Always navigate to entity regardless of context
    navigateTo(`/${entity._id}`, { external: true });
}

// Fetch entities when component mounts
onMounted(() => {
    fetchEntities();
    document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
    if (searchTimeout) clearTimeout(searchTimeout);
});
</script>