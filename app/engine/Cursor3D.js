import {
    Object3D,
    Raycaster,
    Vector2,
    Vector3,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    CylinderGeometry,
    SpotLight,
} from "three";

// const whiteMaterial = new MeshBasicMaterial({ color: 0xffffff });
// const pickedAssetMaterial = new MeshBasicMaterial({ color: 0x0088ff, opacity: 0.8, transparent: true });

// const cursorObject3D = new Object3D();

// const cursorRing = new Mesh(
//     new RingGeometry(0.05, 0.06, 32),
//     whiteMaterial
// );
// cursorRing.translateZ(0.01);
// cursorRing.layers.set(1);

// const cursorLine = new Mesh(
//     new CylinderGeometry(0.005, 0.005, 0.2, 8).rotateX(Math.PI / 2),
//     whiteMaterial
// );
// cursorLine.translateZ(0.099);
// cursorLine.layers.set(1);

// cursorObject3D.add(cursorRing);
// cursorObject3D.add(cursorLine);
// const pickedObjectGroup = new Object3D();
// pickedObjectGroup.layers.set(1);
// cursorObject3D.add(pickedObjectGroup);
// pickedObjectGroup.rotation.x = Math.PI / 2;

// let pickedAsset = null;

// events.on("object:placement:update", ({ object }) => {
//     setTimeout(() => {
//         window.addEventListener("click", confirmPlacement, { once: true });
//     });
//     pickedObjectGroup.clear();
//     pickedAsset = object.name;
//     if (object) {
//         const pickedObjectMaterialCache = new Map();
//         events.emit("mode:change", { mode: "navigation" });
//         pickedObjectGroup.add(object);
//         pickedObjectGroup.traverse((child) => {
//             child.layers.set(1);
//             if (child.isMesh) {
//                 console.log(child);
//                 pickedObjectMaterialCache.set(child.uuid, child.material);
//                 child.material = pickedAssetMaterial.clone();
//                 child.material.map = pickedObjectMaterialCache.get(child.uuid).map;
//             }
//         });
//     };
// });

// function confirmPlacement() {
//     if (!pickedAsset) return;
//     events.emit("object:placement:confirm", { asset: pickedAsset, matrix: pickedObjectGroup.matrixWorld.toArray() });
//     clearPickedObject();
// }

// function clearPickedObject() {
//     pickedObjectGroup.clear();
//     pickedAsset = null;
//     window.removeEventListener("click", confirmPlacement);
// }

// events.on("mode:change", ({ mode }) => {
//     if (mode === "overlay") clearPickedObject();
// });

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
        this.pickedAssetMaterial = new MeshBasicMaterial({ color: 0x0088ff, opacity: 0.8, transparent: true });
        this.pickedAsset = null;
        this.layers.set(1);
        this.rotation.x = Math.PI / 2;
    }

    clearObject() {
        this.clear();
        console.log("Clearing ghost object, previous asset was:", this.pickedAsset);
        this.pickedAsset = null;
        window.removeEventListener("click", this.confirmPlacement);
    }

    setObject(object) {
        this.clearObject();
        if (object) {
            const pickedObjectMaterialCache = new Map();
            this.pickedAsset = object.name;
            setTimeout(() => {
                window.addEventListener("click", this.finishPlacement.bind(this), { once: true });
            });
            console.log("Setting ghost object to asset:", this.pickedAsset);
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
        if (!this.pickedAsset) return;
        if (event.button === 0) this.ctx.events.emit("object:placement:confirm", { asset: this.pickedAsset, matrix: this.matrixWorld.toArray() });
        this.clearObject();
    }
}

export default class Cursor3D {
    constructor(ctx) {
        this.camera = ctx.camera;
        this.camera.layers.enable(1);

        this.scene = ctx.scene;
        this.indicator = new Cursor3DIndicator(ctx);

        this.raycaster = new Raycaster(new Vector3(), new Vector3(), 0, 10);

        this.pointer = new Vector2(0, 0);
        this.direction = new Vector3();

        this.light = new SpotLight(0xffffff, 20, 10, Math.PI / 6, 0.1);
        this.camera.add(this.light);

        this.light.target = this.indicator;
    }

    update() {
        this.indicator.visible = false;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (!intersects[0] || !intersects[0].face) return;
        this.indicator.position.set(0, 0, 0);
        this.direction.copy(intersects[0].face.normal)
        const instanceObject = findInstanceRoot(intersects[0].object);
        if (instanceObject) this.direction.applyQuaternion(instanceObject.quaternion);
        else this.direction.applyQuaternion(intersects[0].object.quaternion);
        this.indicator.lookAt(this.direction);
        this.indicator.position.copy(intersects[0].point);
        this.indicator.visible = true;
    }
}

function findInstanceRoot(object) {
    if (object.isInstance) return object;
    if (!object.parent) return null;
    return findInstanceRoot(object.parent);
}