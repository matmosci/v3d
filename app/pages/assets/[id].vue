<template>
  <div class="relative h-full w-full bg-black">
    <div ref="viewport" class="h-full w-full" />

    <div class="absolute top-3 left-3 z-10 flex items-center gap-2">
      <UButton size="sm" icon="i-lucide-arrow-left" @click="goBack">Back</UButton>
    </div>

    <div class="absolute top-3 right-3 z-10 flex items-center gap-2">
      <UButton size="sm" icon="i-lucide-image-up" :loading="savingThumbnail" @click="createThumbnail">
        Create Thumbnail
      </UButton>
    </div>

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

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let frameId = null;
let resizeHandler = null;

const goBack = () => {
  router.push("/assets");
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

    renderer = new THREE.WebGLRenderer({ antialias: true });
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

    const loader = new GLTFLoader();
    const assetId = route.params.id;

    const gltf = await new Promise((resolve, reject) => {
      loader.load(`/api/assets/${assetId}/data`, resolve, undefined, reject);
    });

    const object = gltf.scene;
    scene.add(object);
    fitCameraToObject(object);

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

const createThumbnail = async () => {
  if (!renderer || !camera || !scene) return;
  const canvas = renderer.domElement;
  if (!canvas) return;

  try {
    savingThumbnail.value = true;

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
    const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.85);

    await $fetch(`/api/assets/${route.params.id}/thumbnail`, {
      method: "POST",
      body: { thumbnail },
    });
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
