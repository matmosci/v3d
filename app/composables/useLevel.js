import { Matrix4 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const meta = ref(null);
const assets = ref(new Map());
const instances = ref([]);

export default function useLevel() {
  return {
    load,
    meta,
    assets,
    instances,
  };
};

// async function load(id = "7f4cde04-c4b2-42d1-9ec3-140aaaf35806") {
//   const { data: metaData } = await useFetch(`/api/levels/${id}`);
//   meta.value = metaData.value;
//   const { data: instancesData } = await useFetch(`/api/levels/${id}/instances`);
//   instances.value = instancesData.value;
//   return meta.value;
// };

async function load(id, scene, camera) {
  const metaData = await $fetch(`/api/levels/${id}`);
  meta.value = metaData;
  const instancesData = await $fetch(`/api/levels/${id}/instances`);
  instances.value = instancesData;

  camera.applyMatrix4(new Matrix4().fromArray(meta.value.camera.matrix));

  const assetsSet = new Set(instances.value.map((instance) => instance.asset));

  await Promise.all(
    Array.from(assetsSet).map(async (asset) => {
      const gltf = await loadGltf(`/api/assets/${asset}/data`);
      const object = gltf.scene;
      object.name = asset;
      assets.value.set(asset, object);
    })
  );

  for (const instance of instances.value) {
    const object = assets.value.get(instance.asset).clone();
    object.applyMatrix4(new Matrix4().fromArray(instance.matrix));
    scene.add(object);
  };

  return meta.value;
};

const gltf = new GLTFLoader();

function loadGltf(gltfUrl) {
  return new Promise((resolve, reject) => {
    gltf.load(
      gltfUrl,
      resolve,
      (xhr) => console.log(/*'Gltf ' + (xhr.loaded / xhr.total * 100) + '% loaded'*/),
      (error) => reject(error)
    );
  });
};
