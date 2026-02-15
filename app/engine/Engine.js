import * as THREE from "three";
import CameraControls from "./CameraControls";
import Cursor3D from "./Cursor3D";
import Dust from "./Dust";
import events from "./EventBus";

export let scene, renderer, camera;
export let enabled = false;

events.on("mode:change", ({ mode }) => {
    enabled = mode === "navigation";
});

export async function attach(container) {
    if (renderer) return;

    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    const clock = new THREE.Clock(true);

    camera = new THREE.PerspectiveCamera(
        75,
        renderer.domElement.clientWidth / renderer.domElement.clientHeight,
        0.1,
        1000,
    );

    const cursor = new Cursor3D(camera, scene);
    const controls = new CameraControls(camera, renderer.domElement);

    const bgColor = 0x0f172b;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x888888);
    gridHelper.layers.set(1);
    gridHelper.position.set(0, 0.001, 0);
    scene.add(gridHelper);

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x1f2937 }),
    );
    plane.position.set(0, 0, 0);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const dust = new Dust(scene, camera);

    function animate(controls) {
        dust.emit();
        dust.update();
        requestAnimationFrame(() => animate(controls));
        const delta = clock.getDelta();
        if (enabled) controls.update(delta);
        renderer.render(scene, camera);
    }
    animate(controls);

    controls.pointerLockControls.addEventListener("change", () => {
        cursor.update();
    });

    window.addEventListener("resize", reset);
    window.addEventListener("orientationchange", reset);

    if (container && !container.contains(renderer.domElement)) {
        container.appendChild(renderer.domElement);
    }
}

export function dettach() {
    if (renderer?.domElement?.parentNode) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
}

export function reset() {
    if (!renderer?.domElement?.parentElement) return;

    const { clientWidth, clientHeight } = renderer.domElement.parentElement;
    renderer.setSize(clientWidth, clientHeight);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
}
