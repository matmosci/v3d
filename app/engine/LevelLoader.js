import { Matrix4 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const assets = new Map();

export default class LevelLoader {
    static async load(id, scene, camera) {
        const resMeta = await fetch(`/api/levels/${id}`);
        const metaData = await resMeta.json();
        const resInstances = await fetch(`/api/levels/${id}/instances`);
        const instancesData = await resInstances.json();

        const assetsSet = new Set(instancesData.map((instance) => instance.asset));

        await Promise.all(
            Array.from(assetsSet).map(async (asset) => {
                const gltf = await loadGltf(`/api/assets/${asset}/data`);
                const object = gltf.scene;
                object.name = asset;
                assets.set(asset, object);
            })
        );

        for (const instance of instancesData) {
            const object = assets.get(instance.asset).clone();
            object.applyMatrix4(new Matrix4().fromArray(instance.matrix));
            scene.add(object);
        };

        camera.applyMatrix4(new Matrix4().fromArray(metaData.camera.matrix));

        return metaData;

    }
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
