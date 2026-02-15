import { Matrix4 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import events from "./EventBus";
import { scene, camera, levelId } from "./Engine";

const assets = new Map();

export default class LevelLoader {
    static async load(id) {
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
            LevelLoader.placeInstance(instance.asset, instance.matrix, scene);
        };

        camera.applyMatrix4(new Matrix4().fromArray(metaData.camera.matrix));

        return metaData;
    }
    static placeInstance(asset, matrix) {
        const object = assets.get(asset)?.clone();
        if (!object) {
            console.error(`Asset ${asset} not found`);
            return;
        }
        object.applyMatrix4(new Matrix4().fromArray(matrix));
        scene.add(object);
        return object;
    };
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

events.on("object:placement:start", async ({ asset }) => {
    if (assets.get(asset)) events.emit("object:placement:update", { object: assets.get(asset).clone() });
    else {
        const gltf = await loadGltf(`/api/assets/${asset}/data`);
        const object = gltf.scene;
        object.name = asset;
        assets.set(asset, object);
        events.emit("object:placement:update", { object: object.clone() });
    };
});

events.on("object:placement:confirm", async ({ asset, matrix }) => {
    if (LevelLoader.placeInstance(asset, matrix))
        await fetch(`/api/levels/${levelId}/instances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ asset, matrix }),
        });
});