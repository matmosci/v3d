import {
    Object3D,
    Quaternion,
    Euler,
    Raycaster,
    Vector2,
    Vector3,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    CylinderGeometry,
    SpotLight,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

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
        this.basePlacementRotationX = Math.PI / 2;
        this.unsubscribeFinishPlacementClick = null;
        this.unsubscribePlacementWheel = null;
        this.pickedAssetMaterial = new MeshBasicMaterial({ color: 0x0088ff, opacity: 0.5, transparent: true });
        this.pickedAssetMaterial.depthWrite = true;
        this.pickedAssetMaterial.depthTest = true;
        this.layers.set(1);
        this.resetPlacementRotation();
    }

    resetPlacementRotation() {
        this.rotation.set(this.basePlacementRotationX, 0, 0);
    }

    clearObject() {
        this.unsubscribeFinishPlacementClick?.();
        this.unsubscribeFinishPlacementClick = null;
        this.unsubscribePlacementWheel?.();
        this.unsubscribePlacementWheel = null;
        this.clear();
        this.ctx.state.pickedAsset = null;
        this.ctx.state.pickedPlacementSource = null;
    }

    setObject(object, source = null) {
        this.clearObject();

        if (object) {
            this.resetPlacementRotation();
            const pickedObjectMaterialCache = new Map();
            this.ctx.state.pickedPlacementSource = source || {
                sourceType: "asset",
                sourceId: object.name,
            };
            this.ctx.state.pickedAsset = this.ctx.state.pickedPlacementSource.sourceId;
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
        const source = this.ctx.state.pickedPlacementSource;
        if (!source?.sourceId) return;
        if (event.button === 0) {
            this.ctx.events.emit("object:placement:confirm", {
                sourceType: source.sourceType,
                sourceId: source.sourceId,
                asset: source.sourceType === "asset" ? source.sourceId : undefined,
                ...this.getPlacementTransform(event.ctrlKey),
            });
        }
        this.clearObject();
    }

    getPlacementTransform(shouldSnap = false) {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();
        const placementTarget = this.children[0] || this;

        this.updateMatrixWorld(true);
        placementTarget.matrixWorld.decompose(position, quaternion, scale);

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
        this.selectionPointer = new Vector2(0, 0);
        this.direction = new Vector3();
        this.indicatorForwardAxis = new Vector3(0, 0, 1);
        this.worldUpAxis = new Vector3(0, 1, 0);
        this.worldPosition = new Vector3();
        this.tempQuaternionA = new Quaternion();
        this.tempQuaternionB = new Quaternion();
        this.tempQuaternionC = new Quaternion();
        this.tempQuaternionD = new Quaternion();
        this.tempEuler = new Euler();
        this.selectedObject = null;
        this.freeTransformObject = null;
        this.freeTransformInitialTransform = null;
        this.freeTransformRotationOffset = null;
        this.freeTransformUserRotationY = 0;
        this.unsubscribeFreeTransformClick = null;
        this.selectedObjectMaterialCache = new Map();
        this.selectedObjectMaterial = new MeshBasicMaterial({ color: 0xff8800, opacity: 0.75, transparent: true });
        this.selectedObjectMaterial.depthWrite = true;
        this.selectedObjectMaterial.depthTest = true;

        this.orbitControls = new OrbitControls(this.camera, this.ctx.renderer.domElement);
        this.orbitControls.enabled = false;
        this.orbitControls.enableDamping = false;
        this.isOrbitInteracting = false;
        this.suppressSelectionUntil = 0;
        this.rightClickState = {
            isDown: false,
            startX: 0,
            startY: 0,
            dragged: false,
        };

        this.orbitControls.addEventListener("start", () => {
            this.isOrbitInteracting = true;
        });
        this.orbitControls.addEventListener("end", () => {
            this.isOrbitInteracting = false;
            this.suppressSelectionUntil = performance.now() + 120;
        });

        this.onMouseDown = (event) => {
            if (event.button !== 2) return;
            if (!this.isCanvasClick(event)) return;

            if (this.freeTransformObject) {
                event.preventDefault();
                this.finishFreeTransform(false);
                this.ctx.events.emit("object:deselected");
                return;
            }

            this.rightClickState.isDown = true;
            this.rightClickState.startX = event.clientX;
            this.rightClickState.startY = event.clientY;
            this.rightClickState.dragged = false;
        };

        this.onMouseMove = (event) => {
            if (!this.rightClickState.isDown) return;
            const dx = event.clientX - this.rightClickState.startX;
            const dy = event.clientY - this.rightClickState.startY;
            if ((dx * dx) + (dy * dy) > 16) this.rightClickState.dragged = true;
        };

        this.onMouseUp = (event) => {
            if (event.button !== 2) return;
            this.rightClickState.isDown = false;
        };

        this.ctx.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);

        this.onTransformSnapKeyDown = (event) => {
            if (event.code !== "ControlLeft" && event.code !== "ControlRight") return;
            this.updateTransformControlSnap();
        };
        this.onTransformSnapKeyUp = (event) => {
            if (event.code !== "ControlLeft" && event.code !== "ControlRight") return;
            this.updateTransformControlSnap();
        };
        this.ctx.input.subscribeKeyDown(this.onTransformSnapKeyDown);
        this.ctx.input.subscribeKeyUp(this.onTransformSnapKeyUp);

        this.onFreeTransformWheel = (event) => {
            if (!this.freeTransformObject) return;
            if (!event.deltaY) return;

            event.preventDefault();

            const stepDeg = Number(this.ctx.state.placementRotationStepDeg) || 15;
            const stepRad = (stepDeg * Math.PI) / 180;
            const direction = Math.sign(event.deltaY);

            this.freeTransformUserRotationY += direction * stepRad;
            this.update();
        };
        this.ctx.input.subscribeWheel(this.onFreeTransformWheel);

        this.transformControls = new TransformControls(this.camera, this.ctx.renderer.domElement);
        this.transformControls.enabled = false;
        this.transformControls.setMode("translate");
        this.updateTransformControlSnap();
        this.transformControlsHelper = this.transformControls.getHelper();
        this.transformControlsHelper.visible = false;
        this.scene.add(this.transformControlsHelper);

        this.isTransformDragging = false;
        this.transformControls.addEventListener("dragging-changed", ({ value }) => {
            this.isTransformDragging = value;
            this.orbitControls.enabled = !value && !!this.selectedObject;

            if (!value && this.selectedObject) {
                this.selectedObject.getWorldPosition(this.worldPosition);
                this.orbitControls.target.copy(this.worldPosition);
                this.orbitControls.update();

                if (!this.freeTransformObject) {
                    this.ctx.events.emit("object:transform:end", {
                        id: this.selectedObject.instanceId || this.selectedObject.uuid,
                        ...this.getObjectTransform(this.selectedObject),
                    });
                }
            }
        });
        this.transformControls.addEventListener("mouseDown", () => {
            this.orbitControls.enabled = false;
        });
        this.transformControls.addEventListener("mouseUp", () => {
            if (this.selectedObject) {
                this.selectedObject.getWorldPosition(this.worldPosition);
                this.orbitControls.target.copy(this.worldPosition);
                this.orbitControls.update();
            }
            this.orbitControls.enabled = !!this.selectedObject;
        });
        this.transformControls.addEventListener("change", () => {
            if (!this.selectedObject || this.freeTransformObject) return;
            this.emitTransformUpdate(this.selectedObject);
        });

        this.light = new SpotLight(0xffffff, 20, 0, Math.PI / 6, 0.2);
        this.light.visible = true;
        this.camera.add(this.light);

        this.light.target = this.indicator;
        this.onToggleLightKeyDown = (event) => {
            if (event.repeat) return;
            this.light.visible = !this.light.visible;
        };
        this.ctx.keybindings.onActionDown("toggleCursorLight", this.onToggleLightKeyDown);
        this.onCycleTransformModeKeyDown = (event) => {
            if (event.repeat) return;
            this.cycleTransformMode();
        };
        this.ctx.keybindings.onActionDown("cycleTransformMode", this.onCycleTransformModeKeyDown);

        this.ctx.events.on("object:placement:update", ({ object, source }) => {
            this.startPlacement(object, source || null);
        });
        this.ctx.events.on("object:free-transform", ({ id }) => {
            this.startFreeTransformById(id);
        });
        this.ctx.events.on("object:transform:set", (payload) => {
            this.applyTransformFromUi(payload);
        });
        this.ctx.events.on("mode:disable", () => {
            this.cancelPlacement();
            this.finishFreeTransform(false);
            this.ctx.events.emit("object:deselected");
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
        this.ctx.events.on("object:deselected", () => {
            this.finishFreeTransform(false);
            this.clearSelectedObjectHighlight();
        });

        this.onSceneClick = (event) => {
            if (this.ctx.state.pickedAsset) return;
            if (this.freeTransformObject) return;
            if (!this.isCanvasClick(event)) return;
            if (event.button !== 0) return;
            if (this.isTransformDragging) return;
            if (this.isOrbitInteracting) return;
            if (performance.now() < this.suppressSelectionUntil) return;

            this.raycaster.setFromCamera(this.getPointerForSelection(event), this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children);
            if (!intersects[0]) {
                this.clearSelectedObjectHighlight();
                this.ctx.events.emit("object:deselected");
                return;
            }

            const selected = this.findFirstInstanceFromIntersects(intersects);
            if (!selected) {
                this.clearSelectedObjectHighlight();
                this.ctx.events.emit("object:deselected");
                return;
            }

            this.applySelectedObjectHighlight(selected);
            this.attachObjectControls(selected);
            this.emitObjectSelected(selected);
        };

        this.onSceneContextMenu = (event) => {
            if (!this.isCanvasClick(event)) return;
            event.preventDefault();

            if (this.freeTransformObject) {
                this.finishFreeTransform(false);
                this.ctx.events.emit("object:deselected");
                return;
            }

            const shouldDeselect = !this.rightClickState.dragged;
            this.rightClickState.isDown = false;

            if (!shouldDeselect) return;
            this.clearSelectedObjectHighlight();
            this.ctx.events.emit("object:deselected");
        };

        this.ctx.input.subscribeClick(this.onSceneClick);
        this.ctx.input.subscribeContextMenu(this.onSceneContextMenu);
    }

    isCanvasOrPointerLockedEvent(event) {
        if (this.isCanvasClick(event)) return true;
        const canvas = this.ctx.renderer?.domElement;
        return !!canvas && document.pointerLockElement === canvas;
    }

    applySelectedObjectHighlight(object) {
        if (this.selectedObject === object) return;

        this.clearSelectedObjectHighlight();
        this.selectedObject = object;

        this.selectedObject.traverse((child) => {
            if (!child.isMesh) return;

            this.selectedObjectMaterialCache.set(child.uuid, child.material);

            if (Array.isArray(child.material)) {
                child.material = child.material.map((material) => {
                    const highlightMaterial = this.selectedObjectMaterial.clone();
                    highlightMaterial.map = material?.map || null;
                    return highlightMaterial;
                });
                return;
            }

            const highlightMaterial = this.selectedObjectMaterial.clone();
            highlightMaterial.map = child.material?.map || null;
            child.material = highlightMaterial;
        });
    }

    clearSelectedObjectHighlight() {
        if (!this.selectedObject) return;

        this.selectedObject.traverse((child) => {
            if (!child.isMesh) return;

            if (Array.isArray(child.material)) {
                child.material.forEach((material) => material?.dispose?.());
            } else {
                child.material?.dispose?.();
            }

            const originalMaterial = this.selectedObjectMaterialCache.get(child.uuid);
            if (originalMaterial) child.material = originalMaterial;
        });

        this.selectedObjectMaterialCache.clear();
        this.selectedObject = null;
        this.detachObjectControls();
    }

    attachObjectControls(object) {
        this.transformControlsHelper.visible = true;
        this.transformControls.enabled = true;
        this.transformControls.attach(object);
        this.updateTransformControlSnap();
        this.orbitControls.enabled = true;
        object.getWorldPosition(this.worldPosition);
        this.orbitControls.target.copy(this.worldPosition);
        this.orbitControls.update();
    }

    detachObjectControls() {
        this.orbitControls.enabled = false;
        this.transformControls.detach();
        this.transformControls.enabled = false;
        this.transformControls.setTranslationSnap(null);
        this.transformControls.setRotationSnap(null);
        this.transformControlsHelper.visible = false;
        this.isTransformDragging = false;
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

    getPointerFromEvent(event) {
        const canvas = this.ctx.renderer?.domElement;
        if (!canvas) return this.selectionPointer.set(0, 0);

        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        return this.selectionPointer.set(x, y);
    }

    getPointerForSelection(event) {
        const canvas = this.ctx.renderer?.domElement;
        if (canvas && document.pointerLockElement === canvas) {
            return this.pointer;
        }

        return this.getPointerFromEvent(event);
    }

    findFirstInstanceFromIntersects(intersects) {
        for (const hit of intersects) {
            if (this.isIgnoredRaycastObject(hit.object)) continue;
            const instance = this.findInstanceRoot(hit.object);
            if (instance) return instance;
        }
        return null;
    }

    findFirstSurfaceIntersect(intersects) {
        for (const hit of intersects) {
            if (!hit?.face) continue;
            if (this.isIgnoredRaycastObject(hit.object)) continue;
            return hit;
        }
        return null;
    }

    isIgnoredRaycastObject(object) {
        if (!object) return true;
        if (this.isDescendantOf(object, this.indicator)) return true;
        if (this.transformControlsHelper && this.isDescendantOf(object, this.transformControlsHelper)) return true;
        if (this.freeTransformObject && this.isDescendantOf(object, this.freeTransformObject)) return true;
        return false;
    }

    isDescendantOf(object, ancestor) {
        if (!object || !ancestor) return false;
        let current = object;
        while (current) {
            if (current === ancestor) return true;
            current = current.parent;
        }
        return false;
    }

    update() {
        if (this.orbitControls.enabled) this.orbitControls.update();

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        const hit = this.findFirstSurfaceIntersect(intersects);
        if (!hit) {
            this.indicator.rotation.x = -Math.PI / 2;
            return;
        }
        this.indicator.position.set(0, 0, 0);
        const isShiftHeld = this.ctx.input.isAnyPressed(["ShiftLeft", "ShiftRight"]);

        if (isShiftHeld) {
            this.direction.copy(this.worldUpAxis);
        } else {
            this.direction.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
        }

        this.tempQuaternionD.setFromUnitVectors(this.indicatorForwardAxis, this.direction);
        this.indicator.quaternion.copy(this.tempQuaternionD);

        this.indicator.position.copy(hit.point);

        const isCtrlHeld = this.ctx.input.isAnyPressed(["ControlLeft", "ControlRight"]);

        if ((this.ctx.state.pickedAsset || this.freeTransformObject) && isCtrlHeld) {
            const snap = this.ctx.state.placementSnap || {};
            const step = Number(snap.step) || 1;
            const axes = snap.axes || {};

            if (axes.x) this.indicator.position.x = Math.round(this.indicator.position.x / step) * step;
            if (axes.y) this.indicator.position.y = Math.round(this.indicator.position.y / step) * step;
            if (axes.z) this.indicator.position.z = Math.round(this.indicator.position.z / step) * step;
        }

        if (this.freeTransformObject) {
            this.freeTransformObject.position.copy(this.indicator.position);
            const targetWorldQuaternion = this.indicator.getWorldQuaternion(this.tempQuaternionA);

            if (!this.freeTransformRotationOffset) {
                const objectWorldQuaternion = this.freeTransformObject.getWorldQuaternion(this.tempQuaternionB);
                this.freeTransformRotationOffset = this.tempQuaternionC
                    .copy(targetWorldQuaternion)
                    .invert()
                    .multiply(objectWorldQuaternion)
                    .clone();
            }

            if (this.freeTransformRotationOffset) targetWorldQuaternion.multiply(this.freeTransformRotationOffset);
            if (this.freeTransformUserRotationY) {
                this.tempQuaternionD.setFromAxisAngle(this.direction.set(0, 1, 0), this.freeTransformUserRotationY);
                targetWorldQuaternion.multiply(this.tempQuaternionD);
            }

            if (this.freeTransformObject.parent) {
                const parentWorldQuaternion = this.freeTransformObject.parent.getWorldQuaternion(this.tempQuaternionB);
                parentWorldQuaternion.invert();
                this.tempQuaternionC.copy(parentWorldQuaternion).multiply(targetWorldQuaternion);
                this.freeTransformObject.quaternion.copy(this.tempQuaternionC);
            } else {
                this.freeTransformObject.quaternion.copy(targetWorldQuaternion);
            }

            this.freeTransformObject.updateMatrixWorld(true);
            this.emitTransformUpdate(this.freeTransformObject);
        }
    }

    findInstanceRoot(object) {
        if (object.isInstance) return object;
        if (!object.parent) return null;
        return this.findInstanceRoot(object.parent);
    }

    cycleTransformMode() {
        const modes = ["translate", "rotate", "scale"];
        const currentMode = this.transformControls.getMode();
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % modes.length;
        this.transformControls.setMode(modes[nextIndex]);
        this.updateTransformControlSnap();
    }

    updateTransformControlSnap() {
        const isCtrlHeld = this.ctx.input.isAnyPressed(["ControlLeft", "ControlRight"]);
        const mode = this.transformControls.getMode();

        if (!isCtrlHeld || !this.selectedObject) {
            this.transformControls.setTranslationSnap(null);
            this.transformControls.setRotationSnap(null);
            return;
        }

        const translationStep = Number(this.ctx.state.placementSnap?.step) || 1;
        const rotationStepDeg = Number(this.ctx.state.placementRotationStepDeg) || 15;
        const rotationStepRad = (rotationStepDeg * Math.PI) / 180;

        if (mode === "translate") {
            this.transformControls.setTranslationSnap(translationStep);
            this.transformControls.setRotationSnap(null);
            return;
        }

        if (mode === "rotate") {
            this.transformControls.setTranslationSnap(null);
            this.transformControls.setRotationSnap(rotationStepRad);
            return;
        }

        this.transformControls.setTranslationSnap(null);
        this.transformControls.setRotationSnap(null);
    }

    startPlacement(object, source = null) {
        this.indicator.ghostObject.setObject(object, source);
    }

    cancelPlacement() {
        this.indicator.ghostObject.finishPlacement({});
    }

    startFreeTransformById(id) {
        if (!id) return;
        const object = this.findInstanceById(id);
        if (!object) return;
        this.startFreeTransform(object);
    }

    startFreeTransform(object) {
        if (!object) return;

        this.finishFreeTransform(false);
        this.detachObjectControls();
        this.orbitControls.enabled = false;

        this.freeTransformObject = object;
        this.freeTransformInitialTransform = this.getObjectTransform(object);
        this.freeTransformRotationOffset = null;
        this.freeTransformUserRotationY = 0;
        this.suppressSelectionUntil = performance.now() + 120;

        this.unsubscribeFreeTransformClick = this.ctx.input.subscribeClick((event) => {
            if (!this.isCanvasClick(event)) return;
            if (event.button !== 0) return;
            this.finishFreeTransform(true);
        });
    }

    finishFreeTransform(confirm) {
        if (!this.freeTransformObject) return;

        this.unsubscribeFreeTransformClick?.();
        this.unsubscribeFreeTransformClick = null;

        const object = this.freeTransformObject;
        const shouldDeselect = !!confirm;
        if (!confirm && this.freeTransformInitialTransform) {
            object.position.fromArray(this.freeTransformInitialTransform.position);
            object.quaternion.fromArray(this.freeTransformInitialTransform.quaternion);
            object.scale.fromArray(this.freeTransformInitialTransform.scale);
            object.updateMatrixWorld(true);
        }

        if (confirm) {
            this.ctx.events.emit("object:transform:end", {
                id: object.instanceId || object.uuid,
                ...this.getObjectTransform(object),
            });
        }

        this.freeTransformObject = null;
        this.freeTransformInitialTransform = null;
        this.freeTransformRotationOffset = null;
        this.freeTransformUserRotationY = 0;

        if (shouldDeselect) {
            this.ctx.events.emit("object:deselected");
            return;
        }

        if (this.selectedObject) {
            this.attachObjectControls(this.selectedObject);
        }
    }

    findInstanceById(id) {
        let found = null;
        this.scene.traverse((object) => {
            if (found) return;
            if (object?.isInstance && object?.instanceId === id) found = object;
        });
        return found;
    }

    getObjectTransform(object) {
        return {
            position: object.position.toArray(),
            quaternion: object.quaternion.toArray(),
            scale: object.scale.toArray(),
        };
    }

    getObjectTransformForUi(object) {
        this.tempEuler.setFromQuaternion(object.quaternion, "YXZ");
        return {
            position: this.toRoundedArray(object.position.toArray(), 4),
            rotation: [
                this.roundValue(this.tempEuler.x * (180 / Math.PI), 3),
                this.roundValue(this.tempEuler.y * (180 / Math.PI), 3),
                this.roundValue(this.tempEuler.z * (180 / Math.PI), 3),
            ],
            scale: this.toRoundedArray(object.scale.toArray(), 4),
        };
    }

    emitObjectSelected(object) {
        this.ctx.events.emit("object:selected", {
            id: object.instanceId || object.uuid,
            asset: object.name,
            sourceType: object.instanceSourceType || "asset",
            sourceId: object.instanceSourceId || object.name,
            ...this.getObjectTransformForUi(object),
        });
    }

    emitTransformUpdate(object) {
        this.ctx.events.emit("object:transform:update", {
            id: object.instanceId || object.uuid,
            ...this.getObjectTransformForUi(object),
        });
    }

    applyTransformFromUi(payload = {}) {
        const id = payload.id;
        if (!id) return;

        const selectedId = this.selectedObject?.instanceId || this.selectedObject?.uuid;
        const target = selectedId === id ? this.selectedObject : this.findInstanceById(id);
        if (!target) return;

        const current = this.getObjectTransformForUi(target);
        const nextPosition = Array.isArray(payload.position) && payload.position.length === 3
            ? payload.position.map((value) => Number(value) || 0)
            : current.position;
        const nextRotation = Array.isArray(payload.rotation) && payload.rotation.length === 3
            ? payload.rotation.map((value) => Number(value) || 0)
            : current.rotation;
        const nextScale = Array.isArray(payload.scale) && payload.scale.length === 3
            ? payload.scale.map((value) => Number(value) || 1)
            : current.scale;

        target.position.fromArray(nextPosition);

        this.tempEuler.set(
            nextRotation[0] * (Math.PI / 180),
            nextRotation[1] * (Math.PI / 180),
            nextRotation[2] * (Math.PI / 180),
            "YXZ"
        );
        target.quaternion.setFromEuler(this.tempEuler);

        target.scale.fromArray(nextScale);

        target.updateMatrixWorld(true);

        if (target === this.selectedObject) {
            target.getWorldPosition(this.worldPosition);
            this.orbitControls.target.copy(this.worldPosition);
            this.orbitControls.update();
        }

        this.ctx.events.emit("object:transform:update", {
            id: target.instanceId || target.uuid,
            position: this.toRoundedArray(nextPosition, 4),
            rotation: this.toRoundedArray(nextRotation, 3),
            scale: this.toRoundedArray(nextScale, 4),
        });
        this.ctx.events.emit("object:transform:end", {
            id: target.instanceId || target.uuid,
            ...this.getObjectTransform(target),
        });
    }

    roundValue(value, precision = 4) {
        const factor = 10 ** precision;
        return Math.round((Number(value) || 0) * factor) / factor;
    }

    toRoundedArray(values = [], precision = 4) {
        return values.map((value) => this.roundValue(value, precision));
    }

}