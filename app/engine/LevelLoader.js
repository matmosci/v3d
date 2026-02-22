import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    GridHelper,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PointLight,
    SphereGeometry,
    SpotLight,
} from "three";

export default class LevelLoader {
    constructor(ctx) {
        this.ctx = ctx;
        this.scene = this.ctx.scene;
        this.camera = this.ctx.camera;
        this.markersVisible = true;
        
        // Create grid helper
        this.gridHelper = new GridHelper(50, 50, 0x444444, 0x222222);
        this.gridHelper.name = 'gridHelper';
        this.scene.add(this.gridHelper);

        this.ctx.events.on("object:placement:start", (payload = {}) => {
            this.startUserObjectPlacement(payload);
        });
        this.ctx.events.on("object:placement:confirm", ({ sourceType, sourceId, asset, position, quaternion, scale }) => {
            this.confirmUserObjectPlacement({ sourceType, sourceId, asset }, { position, quaternion, scale });
        });
        this.ctx.events.on("object:transform:end", ({ id, position, quaternion, scale }) => {
            this.confirmUserObjectTransform(id, { position, quaternion, scale });
        });
        this.ctx.events.on("object:delete", ({ id }) => {
            this.deleteUserObjectInstance(id);
        });

        this.onToggleMarkersKeyDown = (event) => {
            if (event.repeat) return;
            this.toggleMarkerMeshesVisibility();
        };
        this.ctx.keybindings.onActionDown("toggleMarkersVisibility", this.onToggleMarkersKeyDown);
        
        this.onToggleGridKeyDown = (event) => {
            if (event.repeat) return;
            this.toggleGridHelper();
        };
        this.ctx.keybindings.onActionDown("toggleGridHelper", this.onToggleGridKeyDown);
    }

    async load(id) {
        try {
            const resMeta = await fetch(`/api/levels/${id}`);
            this.metaData = await resMeta.json();
            const resInstances = await fetch(`/api/levels/${id}/instances`);
            this.instancesData = await resInstances.json();

            await this.getAssets();

            for (const instance of this.instancesData) {
                await this.placeInstance(instance, instance);
            };

            this.applyTransform(this.camera, this.metaData.camera);
            return this.metaData;
        } catch (error) {
            alert(`Failed to load level ${id}`);
            console.error(`Failed to load level ${id}`, error);
        }
    }

    async getAssets() {
        const assetsSet = new Set(
            this.instancesData
                .map((instance) => this.normalizeInstanceSource(instance))
                .filter((source) => source && source.sourceType === "asset")
                .map((source) => source.sourceId)
        );
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

    async resolvePlacementObject(source) {
        if (!source?.sourceType || !source?.sourceId) return null;

        if (source.sourceType === "asset") {
            if (!this.ctx.assets.has(source.sourceId)) await this.cacheAsset(source.sourceId);
            return this.ctx.assets.get(source.sourceId)?.clone() || null;
        }

        return createBuiltInObject(source.sourceId);
    }

    normalizeInstanceSource(payload = {}) {
        const sourceType = typeof payload.sourceType === "string" ? payload.sourceType : "asset";
        const sourceId = typeof payload.sourceId === "string" && payload.sourceId
            ? payload.sourceId
            : (typeof payload.asset === "string" ? payload.asset : null);

        if (!sourceId) return null;
        return { sourceType, sourceId };
    }

    async placeInstance(instance, transform) {
        const source = this.normalizeInstanceSource(instance);
        const object = await this.resolvePlacementObject(source);
        if (!object) {
            console.error(`Instance source not found`, source);
            return;
        }

        object.name = source.sourceId;
        this.applyTransform(object, transform);
        object.isInstance = true;
        object.instanceId = transform?._id || object.uuid;
        object.instanceSourceType = source.sourceType;
        object.instanceSourceId = source.sourceId;
        this.applyMarkerVisibilityToObject(object);
        this.ctx.scene.add(object);
        return object;
    }

    toggleMarkerMeshesVisibility() {
        this.markersVisible = !this.markersVisible;
        this.scene.traverse((object) => {
            if (!object?.isMesh) return;
            if (!object?.userData?.isMarkerMesh) return;
            object.visible = this.markersVisible;
        });
    }

    toggleGridHelper() {
        this.gridHelper.visible = !this.gridHelper.visible;
    }

    applyMarkerVisibilityToObject(object) {
        if (!object) return;
        object.traverse((child) => {
            if (!child?.isMesh) return;
            if (!child?.userData?.isMarkerMesh) return;
            child.visible = this.markersVisible;
        });
    }

    applyTransform(object, transform = {}) {
        const position = Array.isArray(transform.position) ? transform.position : [0, 0, 0];
        const quaternion = Array.isArray(transform.quaternion) ? transform.quaternion : [0, 0, 0, 1];
        const scale = Array.isArray(transform.scale) ? transform.scale : [1, 1, 1];

        object.position.fromArray(position);
        object.quaternion.fromArray(quaternion);
        object.scale.fromArray(scale);
        object.updateMatrixWorld(true);
    }

    async startUserObjectPlacement(payload = {}) {
        const source = this.normalizeInstanceSource(payload);
        if (!source) {
            alert("Invalid placement source");
            return;
        }

        const object = await this.resolvePlacementObject(source);
        if (!object) {
            alert("Failed to load placement source");
            return;
        }

        object.name = source.sourceId;
        this.ctx.events.emit("object:placement:update", { object, source });
    }

    async confirmUserObjectPlacement(sourcePayload, transform) {
        const source = this.normalizeInstanceSource(sourcePayload);
        if (!source) {
            alert("Invalid placement source");
            return;
        }

        const res = await fetch(`/api/levels/${this.ctx.level}/instances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sourceType: source.sourceType,
                sourceId: source.sourceId,
                asset: source.sourceType === "asset" ? source.sourceId : undefined,
                ...transform,
            }),
        });

        if (!res.ok) {
            alert("Failed to place instance");
            return;
        }

        const createdInstance = await res.json();
        await this.placeInstance(createdInstance, createdInstance);
    }

    findInstanceObjectById(id) {
        let found = null;
        this.scene.traverse((object) => {
            if (found) return;
            if (object?.isInstance && object?.instanceId === id) found = object;
        });
        return found;
    }

    async deleteUserObjectInstance(id) {
        if (!id) return;

        const res = await fetch(`/api/levels/${this.ctx.level}/instances/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            if (res.status === 403) {
                alert("You are not allowed to delete this instance");
                return;
            }
            alert("Failed to delete instance");
            return;
        }

        const object = this.findInstanceObjectById(id);
        if (object?.parent) object.parent.remove(object);
        this.ctx.events.emit("object:deselected");
    }

    async confirmUserObjectTransform(id, transform) {
        if (!id) return;

        const res = await fetch(`/api/levels/${this.ctx.level}/instances/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transform),
        });

        if (!res.ok) {
            if (res.status === 403) {
                alert("You are not allowed to transform this instance");
                return;
            }
            alert("Failed to update instance transform");
            return;
        }

        const updatedInstance = await res.json();
        const object = this.findInstanceObjectById(id);
        if (object) this.applyTransform(object, updatedInstance);
    }
};

const gltf = new GLTFLoader();

function createBuiltInObject(sourceId) {
    switch (sourceId) {
        case "primitive:box": {
            const object = new Mesh(
                new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
                new MeshStandardMaterial({ color: 0xcccccc })
            );
            object.name = sourceId;
            return object;
        }
        case "primitive:sphere": {
            const object = new Mesh(
                new SphereGeometry(0.5, 24, 16).translate(0, 0.5, 0),
                new MeshStandardMaterial({ color: 0xcccccc })
            );
            object.name = sourceId;
            return object;
        }
        case "primitive:cylinder": {
            const object = new Mesh(
                new CylinderGeometry(0.5, 0.5, 1, 24).translate(0, 0.5, 0),
                new MeshStandardMaterial({ color: 0xcccccc })
            );
            object.name = sourceId;
            return object;
        }
        case "light:point": {
            const group = new Group();
            group.name = sourceId;

            const marker = new Mesh(
                new SphereGeometry(0.05, 8, 6),
                new MeshBasicMaterial({ color: 0xf59e0b, wireframe: true })
            );
            marker.userData.isMarkerMesh = true;
            const light = new PointLight(0xffffff, 3, 20);

            group.add(marker);
            group.add(light);
            return group;
        }
        case "light:spot": {
            const group = new Group();
            group.name = sourceId;

            const marker = new Mesh(
                new ConeGeometry(0.125, 0.2, 8).rotateX(Math.PI).translate(0, 0.1, 0),
                new MeshBasicMaterial({ color: 0xf59e0b, wireframe: true })
            );
            marker.userData.isMarkerMesh = true;
            marker.rotation.x = Math.PI / 2;    

            const light = new SpotLight(0xffffff, 4, 30, Math.PI / 5, 0.2);
            light.position.set(0, 0, 0);
            light.target.position.set(0, 0, 2);

            group.add(marker);
            group.add(light);
            group.add(light.target);
            return group;
        }
        default: {
            const object = new Mesh(
                new BoxGeometry(1, 1, 1),
                new MeshBasicMaterial({ color: 0xff00ff })
            );
            object.name = sourceId || "builtin:unknown";
            return object;
        }
    }
}

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
