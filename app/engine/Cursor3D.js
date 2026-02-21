import {
    Object3D,
    Quaternion,
    Raycaster,
    Vector2,
    Vector3,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    CylinderGeometry,
    SpotLight,
} from "three";

class Cursor3DIndicator extends Object3D {
    constructor(ctx) {
        super();
        this.scene = ctx.scene;
        this.scene.add(this);
        this.ghostObject = new GhostObject(ctx);
        this.add(this.ghostObject);

        const whiteMaterial = new MeshBasicMaterial({ color: 0xffffff });

        const cursorRing = new Mesh(
            new RingGeometry(0.05, 0.06, 32),
            whiteMaterial
        );
        cursorRing.translateZ(0.01);
        cursorRing.layers.set(1);

        const cursorLine = new Mesh(
            new CylinderGeometry(0.005, 0.005, 0.2, 8).rotateX(Math.PI / 2),
            whiteMaterial
        );
        cursorLine.translateZ(0.099);
        cursorLine.layers.set(1);

        this.add(cursorRing);
        this.add(cursorLine);
    }
}

class GhostObject extends Object3D {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.unsubscribeFinishPlacementClick = null;
        this.unsubscribePlacementWheel = null;
        this.pickedAssetMaterial = new MeshBasicMaterial({ color: 0x0088ff, opacity: 0.5, transparent: true });
        this.pickedAssetMaterial.depthWrite = true;
        this.pickedAssetMaterial.depthTest = true;
        this.layers.set(1);
        this.rotation.x = Math.PI / 2;
    }

    clearObject() {
        this.unsubscribeFinishPlacementClick?.();
        this.unsubscribeFinishPlacementClick = null;
        this.unsubscribePlacementWheel?.();
        this.unsubscribePlacementWheel = null;
        this.clear();
        this.ctx.state.pickedAsset = null;
    }

    setObject(object) {
        this.clearObject();

        if (object) {
            const pickedObjectMaterialCache = new Map();
            this.ctx.state.pickedAsset = object.name;
            this.finishPlacementBound = this.finishPlacement.bind(this);
            this.rotatePlacementBound = this.rotatePlacement.bind(this);
            this.unsubscribeFinishPlacementClick = this.ctx.input.subscribeClick(
                this.finishPlacementBound
            );
            this.unsubscribePlacementWheel = this.ctx.input.subscribeWheel(
                this.rotatePlacementBound
            );
            this.add(object);
            this.traverse((child) => {
                child.layers.set(1);
                if (child.isMesh) {
                    pickedObjectMaterialCache.set(child.uuid, child.material);
                    child.material = this.pickedAssetMaterial.clone();
                    child.material.map = pickedObjectMaterialCache.get(child.uuid).map;
                }
            });
        };
    }

    finishPlacement(event) {
        if (!event || typeof event.button !== "number") {
            this.unsubscribeFinishPlacementClick?.();
            this.unsubscribeFinishPlacementClick = null;
            this.clearObject();
            return;
        }

        if (!this.isCanvasClick(event)) return;

        this.unsubscribeFinishPlacementClick?.();
        this.unsubscribeFinishPlacementClick = null;
        if (!this.ctx.state.pickedAsset) return;
        if (event.button === 0) {
            this.ctx.events.emit("object:placement:confirm", {
                asset: this.ctx.state.pickedAsset,
                ...this.getPlacementTransform(event.ctrlKey),
            });
        }
        this.clearObject();
    }

    getPlacementTransform(shouldSnap = false) {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();

        this.matrixWorld.decompose(position, quaternion, scale);

        if (!shouldSnap) {
            return {
                position: position.toArray(),
                quaternion: quaternion.toArray(),
                scale: scale.toArray(),
            };
        }

        const snap = this.ctx.state.placementSnap || {};
        const step = Number(snap.step) || 1;
        const axes = snap.axes || {};

        if (axes.x) position.x = Math.round(position.x / step) * step;
        if (axes.y) position.y = Math.round(position.y / step) * step;
        if (axes.z) position.z = Math.round(position.z / step) * step;

        return {
            position: position.toArray(),
            quaternion: quaternion.toArray(),
            scale: scale.toArray(),
        };
    }

    isCanvasClick(event) {
        const canvas = this.ctx.renderer?.domElement;
        if (!canvas) return false;
        if (event.target === canvas) return true;
        if (typeof event.composedPath === "function") {
            const path = event.composedPath();
            if (Array.isArray(path) && path.includes(canvas)) return true;
        }
        return false;
    }

    rotatePlacement(event) {
        if (!this.ctx.state.pickedAsset) return;
        if (!this.isCanvasClick(event)) return;
        if (!event.deltaY) return;

        event.preventDefault();

        const stepDeg = Number(this.ctx.state.placementRotationStepDeg) || 15;
        const stepRad = (stepDeg * Math.PI) / 180;
        const direction = Math.sign(event.deltaY);

        this.rotation.y += direction * stepRad;
    }
}

export default class Cursor3D {
    constructor(ctx) {
        this.ctx = ctx;
        this.camera = this.ctx.camera;
        this.camera.layers.enable(1);

        this.scene = this.ctx.scene;
        this.indicator = new Cursor3DIndicator(this.ctx);

        this.raycaster = new Raycaster(new Vector3(), new Vector3(), 0, 100);

        this.pointer = new Vector2(0, 0);
        this.direction = new Vector3();

        this.light = new SpotLight(0xffffff, 20, 0, Math.PI / 6, 0.2);
        this.light.visible = true;
        this.camera.add(this.light);

        this.light.target = this.indicator;
        this.onToggleLightKeyDown = (event) => {
            if (event.repeat) return;
            this.light.visible = !this.light.visible;
        };
        this.ctx.keybindings.onActionDown("toggleCursorLight", this.onToggleLightKeyDown);

        this.ctx.events.on("object:placement:update", ({ object }) => {
            this.startPlacement(object);
        });
        this.ctx.events.on("mode:disable", () => {
            this.cancelPlacement();
        });
        this.ctx.events.on("camera:lock", () => {
            this.update();
        });
        this.ctx.events.on("camera:rotate", () => {
            this.update();
        });
        this.ctx.events.on("camera:move", () => {
            this.update();
        });

        this.onSceneClick = (event) => {
            if (this.ctx.state.pickedAsset) return;
            if (!this.isCanvasClick(event)) return;
            if (event.button !== 0) return;

            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children);
            if (!intersects[0]) {
                this.ctx.events.emit("object:deselected");
                return;
            }

            const selected = this.findInstanceRoot(intersects[0].object);
            if (!selected) {
                this.ctx.events.emit("object:deselected");
                return;
            }

            this.ctx.events.emit("object:selected", {
                id: selected.instanceId || selected.uuid,
                asset: selected.name,
            });
        };

        this.onSceneContextMenu = (event) => {
            if (!this.isCanvasClick(event)) return;
            event.preventDefault();
            this.ctx.events.emit("object:deselected");
        };

        this.ctx.input.subscribeClick(this.onSceneClick);
        this.ctx.input.subscribeContextMenu(this.onSceneContextMenu);
    }

    isCanvasClick(event) {
        const canvas = this.ctx.renderer?.domElement;
        if (!canvas) return false;
        if (event.target === canvas) return true;
        if (typeof event.composedPath === "function") {
            const path = event.composedPath();
            if (Array.isArray(path) && path.includes(canvas)) return true;
        }
        return false;
    }

    update() {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (!intersects[0] || !intersects[0].face) {
            this.indicator.rotation.x = -Math.PI / 2;
            return;
        }
        this.indicator.position.set(0, 0, 0);
        this.direction.copy(intersects[0].face.normal);
        const instanceObject = this.findInstanceRoot(intersects[0].object);
        if (instanceObject) this.direction.applyQuaternion(instanceObject.quaternion);
        else this.direction.applyQuaternion(intersects[0].object.quaternion);
        this.indicator.lookAt(this.direction);
        this.indicator.position.copy(intersects[0].point);

        const isCtrlHeld = this.ctx.input.isAnyPressed(["ControlLeft", "ControlRight"]);

        if (this.ctx.state.pickedAsset && isCtrlHeld) {
            const snap = this.ctx.state.placementSnap || {};
            const step = Number(snap.step) || 1;
            const axes = snap.axes || {};

            if (axes.x) this.indicator.position.x = Math.round(this.indicator.position.x / step) * step;
            if (axes.y) this.indicator.position.y = Math.round(this.indicator.position.y / step) * step;
            if (axes.z) this.indicator.position.z = Math.round(this.indicator.position.z / step) * step;
        }
    }

    findInstanceRoot(object) {
        if (object.isInstance) return object;
        if (!object.parent) return null;
        return this.findInstanceRoot(object.parent);
    }

    startPlacement(object) {
        this.indicator.ghostObject.setObject(object);
    }

    cancelPlacement() {
        this.indicator.ghostObject.finishPlacement({});
    }
}