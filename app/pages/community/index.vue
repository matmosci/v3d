<template>
    <div class="community-assets">
        <UIH1>COMMUNITY ASSETS</UIH1>
        
        <div v-if="loading" class="text-center py-8">
            <p>Loading entities...</p>
        </div>
        
        <div v-else-if="entities.length === 0" class="text-center py-8">
            <p class="text-gray-500">No entities found in the community yet.</p>
        </div>
        
        <div v-else class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6">
            <div v-for="entity in entities" :key="entity._id" class="border border-default rounded-lg bg-default overflow-hidden cursor-pointer hover:bg-elevated/25 transition-colors" @click="selectEntity(entity)">
                <div class="h-32 w-full bg-black/30 overflow-hidden">
                    <img v-if="entity.thumbnail" :src="entity.thumbnail" :alt="entity.name" class="h-full w-full object-cover object-center">
                    <div v-else class="h-full w-full flex items-center justify-center">
                        <UIcon name="i-lucide-rotate-3d" class="text-white/30 w-6 h-6" />
                    </div>
                </div>
                
                <div class="p-3">
                    <h3 class="font-medium text-sm mb-1 truncate">{{ entity.name }}</h3>
                    <p class="text-xs text-gray-400 mb-2" v-if="entity.description">{{ entity.description }}</p>
                    <p class="text-xs text-gray-500">by Community User</p>
                </div>
                
                <div class="flex items-center justify-between p-3 pt-0">
                    <div class="flex items-center gap-2">
                        <button 
                            @click="toggleLike(entity._id)"
                            :class="{ 'text-blue-500': entity.liked }"
                            class="text-xs hover:text-blue-500 transition-colors"
                        >
                            👍 {{ entity.likes || 0 }}
                        </button>
                        
                        <button 
                            @click="toggleDislike(entity._id)"
                            :class="{ 'text-red-500': entity.disliked }"
                            class="text-xs hover:text-red-500 transition-colors"
                        >
                            👎 {{ entity.dislikes || 0 }}
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
const editor = useEditor();

// Fetch real entities from the community API
async function fetchEntities() {
    try {
        loading.value = true;
        const data = await $fetch('/api/entities');
        
        // Add local interaction state to each entity
        entities.value = data.map(entity => ({
            ...entity,
            likes: 0,
            dislikes: 0,
            liked: false,
            disliked: false
        }));
    } catch (error) {
        console.error('Failed to fetch community entities:', error);
        entities.value = [];
    } finally {
        loading.value = false;
    }
}

function toggleLike(entityId) {
    const entity = entities.value.find(e => e._id === entityId);
    if (entity) {
        if (entity.liked) {
            entity.likes--;
        } else {
            entity.likes++;
            if (entity.disliked) {
                entity.disliked = false;
                entity.dislikes--;
            }
        }
        entity.liked = !entity.liked;
    }
}

function toggleDislike(entityId) {
    const entity = entities.value.find(e => e._id === entityId);
    if (entity) {
        if (entity.disliked) {
            entity.dislikes--;
        } else {
            entity.dislikes++;
            if (entity.liked) {
                entity.liked = false;
                entity.likes--;
            }
        }
        entity.disliked = !entity.disliked;
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
        navigateTo(`/${entity._id}`);
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