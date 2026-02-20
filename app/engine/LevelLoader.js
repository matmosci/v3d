import { Matrix4 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class LevelLoader {
    constructor(ctx) {
        this.ctx = ctx;
        this.scene = this.ctx.scene;
        this.camera = this.ctx.camera;

        this.ctx.events.on("object:placement:start", ({ asset }) => {
            this.startUserObjectPlacement(asset);
        });
        this.ctx.events.on("object:placement:confirm", ({ asset, matrix }) => {
            this.confirmUserObjectPlacement(asset, matrix);
        });
    }

    async load() {
        try {
            const id = this.ctx.state.project;
            const resMeta = await fetch(`/api/levels/${id}`);
            this.metaData = await resMeta.json();
            const resInstances = await fetch(`/api/levels/${id}/instances`);
            this.instancesData = await resInstances.json();

            await this.getAssets();

            for (const instance of this.instancesData) {
                this.placeInstance(instance.asset, instance.matrix);
            };

            this.camera.applyMatrix4(new Matrix4().fromArray(this.metaData.camera.matrix));
            return this.metaData;
        } catch (error) {
            alert(`Failed to load level ${id}`);
            console.error(`Failed to load level ${id}`, error);
        }
    }

    async getAssets() {
        const assetsSet = new Set(this.instancesData.map((instance) => instance.asset));
        await Promise.all(
            Array.from(assetsSet).map(async (asset) => {
                if (!this.ctx.assets.has(asset)) await this.cacheAsset(asset);
            })
        );
    }

    async cacheAsset(asset) {
        const gltf = await loadGltf(`/api/assets/${asset}/data`);
        const object = gltf.scene;
        object.name = asset;
        this.ctx.assets.set(asset, object);
    }

    placeInstance(asset, matrix) {
        const object = this.ctx.assets.get(asset)?.clone();
        if (!object) {
            console.error(`Asset ${asset} not found`);
            return;
        }
        object.applyMatrix4(new Matrix4().fromArray(matrix));
        object.isInstance = true;
        this.ctx.scene.add(object);
        return object;
    }

    async startUserObjectPlacement(asset) {
        if (this.ctx.assets.get(asset)) this.ctx.events.emit("object:placement:update", { object: this.ctx.assets.get(asset).clone() });
        else {
            const gltf = await loadGltf(`/api/assets/${asset}/data`);
            const object = gltf.scene;
            object.name = asset;
            this.ctx.assets.set(asset, object);
            this.ctx.events.emit("object:placement:update", { object: object.clone() });
        };
    }

    async confirmUserObjectPlacement(asset, matrix) {
        if (this.placeInstance(asset, matrix))
            await fetch(`/api/levels/${this.ctx.state.project}/instances`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ asset, matrix }),
            });
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
