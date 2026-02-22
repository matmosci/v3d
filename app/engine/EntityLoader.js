import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
    BoxGeometry,
    ConeGeometry,
    CylinderGeometry,
    GridHelper,
    Group,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PointLight,
    Quaternion,
    SphereGeometry,
    SpotLight,
    Vector3,
} from "three";

export default class EntityLoader {
    constructor(ctx) {
        this.ctx = ctx;
        this.scene = this.ctx.scene;
        this.camera = this.ctx.camera;
        this.markersVisible = true;
        this.entityCache = new Map();
        
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
        this.ctx.events.on("object:ungroup", ({ id, recursive }) => {
            this.ungroupEntityInstance(id, !!recursive);
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
            const resMeta = await fetch(`/api/entities/${id}`);
            this.metaData = await resMeta.json();
            const resInstances = await fetch(`/api/entities/${id}/instances`);
            this.instancesData = await resInstances.json();

            await this.getAssets();

            for (const instance of this.instancesData) {
                await this.placeInstance(instance, instance);
            };

            this.applyTransform(this.camera, this.metaData.camera);
            return this.metaData;
        } catch (error) {
            alert(`Failed to load entity ${id}`);
            console.error(`Failed to load entity ${id}`, error);
        }
    }

    async getAssets() {
        await this.cacheAssetsForInstances(this.instancesData);
    }

    async cacheAssetsForInstances(instances = []) {
        const assetsSet = new Set(
            instances
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

    async resolvePlacementObject(source, visited = new Set()) {
        if (!source?.sourceType || !source?.sourceId) return null;

        if (source.sourceType === "asset") {
            if (!this.ctx.assets.has(source.sourceId)) await this.cacheAsset(source.sourceId);
            return this.ctx.assets.get(source.sourceId)?.clone() || null;
        }

        if (source.sourceType === "entity") {
            return await this.buildEntityObject(source.sourceId, visited);
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
        const visited = new Set();
        if (source?.sourceType === "entity" && this.ctx?.entity) {
            visited.add(this.ctx.entity);
        }
        const object = await this.resolvePlacementObject(source, visited);
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

        const visited = new Set();
        if (source?.sourceType === "entity" && this.ctx?.entity) {
            visited.add(this.ctx.entity);
        }
        const object = await this.resolvePlacementObject(source, visited);
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

        const res = await fetch(`/api/entities/${this.ctx.entity}/instances`, {
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

    async buildEntityObject(entityId, visited = new Set()) {
        if (!entityId) return null;
        if (visited.has(entityId)) {
            return createEntityCyclePlaceholder(entityId);
        }

        const cached = this.entityCache.get(entityId);
        if (cached) return cached.clone(true);

        const nextVisited = new Set(visited);
        nextVisited.add(entityId);

        try {
            const [metaRes, instancesRes] = await Promise.all([
                fetch(`/api/entities/${entityId}`),
                fetch(`/api/entities/${entityId}/instances`),
            ]);

            if (!metaRes.ok || !instancesRes.ok) {
                return createEntityCyclePlaceholder(entityId);
            }

            const instances = await instancesRes.json();
            await this.cacheAssetsForInstances(instances);

            const group = new Group();
            group.name = entityId;

            for (const instance of instances) {
                const child = await this.buildInstanceObject(instance, nextVisited);
                if (child) group.add(child);
            }

            this.entityCache.set(entityId, group);
            return group.clone(true);
        } catch (error) {
            console.error(`Failed to load entity contents ${entityId}`, error);
            return createEntityCyclePlaceholder(entityId);
        }
    }

    async buildInstanceObject(instance, visited) {
        const source = this.normalizeInstanceSource(instance);
        const object = await this.resolvePlacementObject(source, visited);
        if (!object) return null;
        this.applyTransform(object, instance);
        return object;
    }

    async ungroupEntityInstance(id, recursive = false) {
        if (!id) return;
        const object = this.findInstanceObjectById(id);
        if (!object) return;
        if (object.instanceSourceType !== "entity") return;

        const entityId = object.instanceSourceId;
        if (!entityId) return;

        const parentMatrix = this.composeMatrixFromTransform(this.getObjectTransform(object));
        const visited = new Set();
        if (this.ctx?.entity) visited.add(this.ctx.entity);

        const placements = await this.expandEntityInstances(entityId, parentMatrix, { recursive }, visited);
        if (!placements.length) return;

        await Promise.all(placements.map((payload) => this.createInstanceFromPayload(payload)));
        await this.deleteUserObjectInstance(id);
    }

    async expandEntityInstances(entityId, parentMatrix, options = {}, visited = new Set()) {
        if (!entityId) return [];
        if (visited.has(entityId)) return [];

        const nextVisited = new Set(visited);
        nextVisited.add(entityId);

        try {
            const instancesRes = await fetch(`/api/entities/${entityId}/instances`);
            if (!instancesRes.ok) return [];

            const instances = await instancesRes.json();
            await this.cacheAssetsForInstances(instances);

            const placements = [];
            for (const instance of instances) {
                const source = this.normalizeInstanceSource(instance);
                if (!source) continue;

                const combinedMatrix = this.combineMatrices(parentMatrix, this.composeMatrixFromTransform(instance));
                const decomposed = this.decomposeMatrix(combinedMatrix);

                if (source.sourceType === "entity" && options.recursive) {
                    const nested = await this.expandEntityInstances(
                        source.sourceId,
                        combinedMatrix,
                        options,
                        new Set(nextVisited)
                    );
                    placements.push(...nested);
                    continue;
                }

                placements.push({
                    sourceType: source.sourceType,
                    sourceId: source.sourceId,
                    asset: source.sourceType === "asset" ? source.sourceId : undefined,
                    position: decomposed.position,
                    quaternion: decomposed.quaternion,
                    scale: decomposed.scale,
                });
            }

            return placements;
        } catch (error) {
            console.error(`Failed to ungroup entity ${entityId}`, error);
            return [];
        }
    }

    async createInstanceFromPayload(payload) {
        if (!payload?.sourceType || !payload?.sourceId) return null;

        const res = await fetch(`/api/entities/${this.ctx.entity}/instances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            console.error("Failed to create instance from ungroup");
            return null;
        }

        const createdInstance = await res.json();
        await this.placeInstance(createdInstance, createdInstance);
        return createdInstance;
    }

    getObjectTransform(object) {
        return {
            position: object.position.toArray(),
            quaternion: object.quaternion.toArray(),
            scale: object.scale.toArray(),
        };
    }

    composeMatrixFromTransform(transform = {}) {
        const position = Array.isArray(transform.position) ? transform.position : [0, 0, 0];
        const quaternion = Array.isArray(transform.quaternion) ? transform.quaternion : [0, 0, 0, 1];
        const scale = Array.isArray(transform.scale) ? transform.scale : [1, 1, 1];

        const matrix = new Matrix4();
        matrix.compose(
            new Vector3(position[0], position[1], position[2]),
            new Quaternion(quaternion[0], quaternion[1], quaternion[2], quaternion[3]),
            new Vector3(scale[0], scale[1], scale[2])
        );
        return matrix;
    }

    combineMatrices(parentMatrix, childMatrix) {
        return new Matrix4().multiplyMatrices(parentMatrix, childMatrix);
    }

    decomposeMatrix(matrix) {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();
        matrix.decompose(position, quaternion, scale);
        return {
            position: position.toArray(),
            quaternion: quaternion.toArray(),
            scale: scale.toArray(),
        };
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

        const res = await fetch(`/api/entities/${this.ctx.entity}/instances/${id}`, {
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

        const res = await fetch(`/api/entities/${this.ctx.entity}/instances/${id}`, {
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
                new SphereGeometry(0.5, 16, 16),
                new MeshStandardMaterial({ color: 0xcccccc })
            );
            object.name = sourceId;
            return object;
        }
        case "primitive:cone": {
            const object = new Mesh(
                new ConeGeometry(0.5, 1, 8).translate(0, 0.5, 0),
                new MeshStandardMaterial({ color: 0xcccccc })
            );
            object.name = sourceId;
            return object;
        }
        case "primitive:cylinder": {
            const object = new Mesh(
                new CylinderGeometry(0.5, 0.5, 1, 8).translate(0, 0.5, 0),
                new MeshStandardMaterial({ color: 0xcccccc })
            );
            object.name = sourceId;
            return object;
        }
        case "primitive:point-light": {
            const object = new PointLight(0xffffff, 1, 100);
            object.name = sourceId;
            return object;
        }
        case "primitive:spot-light": {
            const object = new SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 2);
            object.name = sourceId;
            return object;
        }
        default:
            return null;
    }
}

async function loadGltf(url) {
    return new Promise((resolve, reject) => {
        gltf.load(url, (gltf) => resolve(gltf), undefined, (error) => reject(error));
    });
}

function createEntityCyclePlaceholder(entityId) {
    const group = new Group();
    group.name = entityId;
    const placeholder = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({
            color: 0xef4444,
            wireframe: true,
            transparent: true,
            opacity: 0.6,
        })
    );
    placeholder.userData.isEntityPlaceholder = true;
    group.add(placeholder);
    return group;
}
