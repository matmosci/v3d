import {
    Object3D,
    Raycaster,
    Vector2,
    Vector3,
    Mesh,
    MeshBasicMaterial,
    RingGeometry,
    CylinderGeometry,
    PointLight,
} from "three";

const whiteMaterial = new MeshBasicMaterial({ color: 0xffffff });

const cursorObject3D = new Object3D();

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

const cursorLight = new PointLight(0xffffff);
cursorLight.translateZ(1);

cursorObject3D.add(cursorRing);
cursorObject3D.add(cursorLine);
cursorObject3D.add(cursorLight);

export default class Cursor3D {
    constructor(camera, scene) {
        this.camera = camera;
        this.camera.layers.enable(1);

        this.scene = scene;
        this.scene.add(cursorObject3D);

        this.raycaster = new Raycaster(new Vector3(), new Vector3(), 0, 10);

        this.pointer = new Vector2(0, 0);
        this.direction = new Vector3();
    }

    update() {
        cursorObject3D.visible = false;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects[0] && intersects[0].face) {
            cursorObject3D.position.set(0, 0, 0);
            this.direction
                .copy(intersects[0].face.normal)
                .applyQuaternion(intersects[0].object.quaternion);
            cursorObject3D.lookAt(this.direction);
            cursorObject3D.position.copy(intersects[0].point);
            cursorObject3D.visible = true;
        } else {
        }
    }
}
