<template>
    <div class="community-assets">
        <UIH1>COMMUNITY ASSETS</UIH1>
        
        <div v-if="loading" class="text-center py-8">
            <p>Loading entities...</p>
        </div>
        
        <div v-else-if="entities.length === 0" class="text-center py-8">
            <p class="text-gray-500">No entities found in the community yet.</p>
        </div>
        
        <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6">
            <div v-for="entity in entities" :key="entity._id" class="flex flex-col border border-default rounded-lg bg-default overflow-hidden cursor-pointer hover:bg-elevated/25 transition-colors" @click="selectEntity(entity)">
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
                    <p class="text-xs text-gray-500">by Community User</p>
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
                    
                    <UButton size="xs" variant="ghost" @click.stop="openEntity(entity)">Open</UButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const entities = ref([]);
const loading = ref(true);
const votingStates = ref({});
const editor = useEditor();
const { loggedIn, user } = useUserSession();

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
});
</script>