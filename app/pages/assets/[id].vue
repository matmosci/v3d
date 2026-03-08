<template>
  <div class="relative h-full w-full bg-black">
    <div ref="viewport" class="h-full w-full" />

    <div class="absolute top-3 left-3 z-10 flex items-center gap-2">
      <UButton size="sm" icon="i-lucide-arrow-left" @click="goBack" color="neutral" variant="ghost">Back</UButton>
    </div>

    <div class="absolute top-3 right-3 z-10 flex items-center gap-2">
      <div class="flex items-center gap-1 rounded bg-black/40 px-2 py-1">
        <span class="text-[11px] text-white/70">Slot</span>
        <UButton
          v-for="level in lodSlots"
          :key="level"
          size="xs"
          color="neutral"
          variant="ghost"
          :class="selectedLodLevel === level ? 'bg-white/20' : ''"
          @click="selectedLodLevel = level"
        >
          LOD{{ level }}
        </UButton>
      </div>

      <UButton size="sm" icon="i-lucide-download" @click="downloadFile" color="neutral" variant="ghost">
        Download File
      </UButton>
      <UButton size="sm" icon="i-lucide-file-up" :loading="replacingFile" @click="triggerFileInput" color="neutral" variant="ghost">
        Replace LOD{{ selectedLodLevel }}
      </UButton>
      <UButton size="sm" icon="i-lucide-image-up" :loading="savingThumbnail" @click="createThumbnail" color="neutral" variant="ghost">
        Create Thumbnail
      </UButton>
    </div>

    <div class="absolute right-3 bottom-3 z-10 rounded-lg bg-black/60 p-3 text-xs text-white min-w-64 space-y-2">
      <div class="font-medium">LOD Slots</div>
      <div v-for="level in lodSlots" :key="`slot-${level}`" class="grid grid-cols-[auto,1fr,auto] items-center gap-2">
        <span>LOD{{ level }}</span>
        <span :class="availableLodLevels.includes(level) ? 'text-emerald-300' : 'text-white/40'">
          {{ availableLodLevels.includes(level) ? 'uploaded' : 'empty' }}
        </span>
        <UInput
          v-if="level > 0"
          v-model.number="lodDistances[level]"
          type="number"
          min="0"
          size="xs"
          class="w-20"
        />
        <span v-else class="text-white/60">0</span>
      </div>
      <UButton size="xs" color="neutral" variant="soft" :loading="savingLodDistances" @click="saveLodDistances">
        Save Distances
      </UButton>
    </div>

    <!-- Hidden file input for replacement -->
    <input 
      ref="fileInput" 
      type="file" 
      accept=".glb"
      style="display: none"
      @change="handleFileSelection"
    />

    <div v-if="loading" class="absolute inset-0 z-20 grid place-items-center text-white/80 text-sm">
      Loading asset...
    </div>
    <div v-if="error" class="absolute inset-0 z-20 grid place-items-center text-red-300 text-sm">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

definePageMeta({
  middleware: "user",
});

const route = useRoute();
const router = useRouter();

const viewport = ref(null);
const loading = ref(true);
const error = ref("");
const savingThumbnail = ref(false);
const replacingFile = ref(false);
const savingLodDistances = ref(false);
const fileInput = ref(null);
const selectedLodLevel = ref(0);
const availableLodLevels = ref([]);
const lodDistances = ref([0, 20, 60, 150]);
const lodSlots = [0, 1, 2, 3];

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let frameId = null;
let resizeHandler = null;
let activeObject = null;
let activePreviewLoadToken = 0;

const goBack = () => {
  router.push("/assets");
};

const downloadFile = () => {
  window.location.href = `/api/assets/${route.params.id}/download?lod=lod${selectedLodLevel.value}`;
};

const normalizeLodDistances = (input = []) => {
  const defaults = [0, 20, 60, 150];
  const next = [...defaults];

  for (let i = 0; i < defaults.length; i++) {
    const value = Number(input?.[i]);
    if (Number.isFinite(value) && value >= 0) {
      next[i] = value;
    }
  }

  next[0] = 0;
  return next;
};

const fetchAssetMeta = async () => {
  const asset = await $fetch(`/api/assets/${route.params.id}`);
  availableLodLevels.value = Array.isArray(asset.availableLodLevels)
    ? asset.availableLodLevels
    : [0];
  lodDistances.value = normalizeLodDistances(asset.lodDistances);
};

const loadAssetPreview = async (requestedLevel = selectedLodLevel.value) => {
  const loader = new GLTFLoader();
  const token = ++activePreviewLoadToken;
  const assetId = route.params.id;

  const gltf = await new Promise((resolve, reject) => {
    loader.load(`/api/assets/${assetId}/data?lod=lod${requestedLevel}`, resolve, undefined, reject);
  });

  if (token !== activePreviewLoadToken) return;

  const object = gltf.scene;
  enforceBackfaceCulling(object);

  if (activeObject?.parent) {
    activeObject.parent.remove(activeObject);
  }

  activeObject = object;
  scene.add(activeObject);
  fitCameraToObject(activeObject);
};

const enforceBackfaceCulling = (object) => {
  object.traverse((node) => {
    if (!node.isMesh || !node.material) return;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      material.side = THREE.FrontSide;
      material.needsUpdate = true;
    }
  });
};

const fitCameraToObject = (object) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const fov = camera.fov * (Math.PI / 180);
  const distance = maxSize / (2 * Math.tan(fov / 2));

  camera.position.set(center.x + distance * 1.2, center.y + distance * 0.8, center.z + distance * 1.2);
  camera.near = 0.01;
  camera.far = Math.max(1000, distance * 20);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
};

const startRenderLoop = () => {
  const render = () => {
    controls?.update();
    renderer?.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };
  render();
};

const setup = async () => {
  try {
    const container = viewport.value;
    if (!container) return;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111315);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 1000);
    camera.position.set(2, 2, 2);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(4, 6, 4);
    scene.add(dir);

    // const grid = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
    // scene.add(grid);

    await fetchAssetMeta();
    await loadAssetPreview(selectedLodLevel.value);

    resizeHandler = () => {
      if (!renderer || !camera || !container) return;
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", resizeHandler);
    startRenderLoop();
  } catch (e) {
    console.error(e);
    error.value = "Failed to load asset preview";
  } finally {
    loading.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelection = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const file = files[0];

  // Validate file type
  if (!file.name.endsWith('.glb')) {
    error.value = "Only .glb files are supported";
    return;
  }

  try {
    replacingFile.value = true;

    const formData = new FormData();
    formData.append('file', file);

    await $fetch(`/api/assets/${route.params.id}/file`, {
      method: 'PUT',
      query: { lod: `lod${selectedLodLevel.value}` },
      body: formData,
    });

    await fetchAssetMeta();
    await loadAssetPreview(selectedLodLevel.value);
  } catch (e) {
    console.error(e);
    error.value = "Failed to replace file. Please try again.";
  } finally {
    replacingFile.value = false;
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const saveLodDistances = async () => {
  try {
    savingLodDistances.value = true;
    lodDistances.value = normalizeLodDistances(lodDistances.value);
    await $fetch(`/api/assets/${route.params.id}`, {
      method: 'PUT',
      body: {
        lodDistances: lodDistances.value,
      },
    });
  } catch (e) {
    console.error(e);
    error.value = 'Failed to save LOD distances';
  } finally {
    savingLodDistances.value = false;
  }
};

watch(selectedLodLevel, async (level) => {
  if (!scene) return;

  try {
    loading.value = true;
    await loadAssetPreview(level);
  } catch (e) {
    console.error(e);
    error.value = `Failed to load lod${level} preview`;
  } finally {
    loading.value = false;
  }
});

const createThumbnail = async () => {
  if (!renderer || !camera || !scene) return;
  const canvas = renderer.domElement;
  if (!canvas) return;

  try {
    savingThumbnail.value = true;

    const previousBackground = scene.background;
    const previousClearAlpha = renderer.getClearAlpha();
    const previousClearColor = renderer.getClearColor(new THREE.Color());

    let thumbnail = "";
    try {
      scene.background = null;
      renderer.setClearColor(previousClearColor, 0);
      renderer.render(scene, camera);

      const sourceWidth = canvas.width;
      const sourceHeight = canvas.height;
      const targetWidth = 192;
      const targetHeight = Math.max(100, Math.round((sourceHeight / sourceWidth) * targetWidth));

      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = targetWidth;
      thumbCanvas.height = targetHeight;

      const ctx = thumbCanvas.getContext("2d");
      if (!ctx) throw new Error("Failed to create thumbnail context");

      ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      thumbnail = thumbCanvas.toDataURL("image/png");
    } finally {
      scene.background = previousBackground;
      renderer.setClearColor(previousClearColor, previousClearAlpha);
    }

    await $fetch(`/api/assets/${route.params.id}/thumbnail`, {
      method: "POST",
      body: { thumbnail },
    });
    router.push("/assets");
  } catch (e) {
    console.error(e);
    error.value = "Failed to create thumbnail";
  } finally {
    savingThumbnail.value = false;
  }
};

onMounted(() => {
  setup();
});

onBeforeUnmount(() => {
  if (frameId) cancelAnimationFrame(frameId);
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  controls?.dispose?.();
  renderer?.dispose?.();
});
</script>
