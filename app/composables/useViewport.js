import * as THREE from "three";
import ViewControls from "../utils/view-controls.js";

let scene;
let renderer;
let camera;
let view;
let clock;

const mode = ref("overlay");

export default function useViewport() {
  return {
    attachInstance,
    dettachInstance,
    reset,
    mode,
  };
}

function attachInstance(container) {
  if (!renderer) {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    clock = new THREE.Clock(true);

    camera = new THREE.PerspectiveCamera(
      75,
      renderer.domElement.clientWidth / renderer.domElement.clientHeight,
      0.1,
      1000,
    );
    view = ViewControls.create(camera, renderer.domElement);

    camera.position.x = 1;
    camera.position.y = 1.5;
    camera.position.z = 2;
    camera.lookAt(0, 0.8, 0);

    const color = 0x333333;
    scene.background = new THREE.Color(color);
    scene.fog = new THREE.FogExp2(color, 0.2);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    scene.add(cube);

    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x888888);
    gridHelper.position.set(0, 0, 0);
    scene.add(gridHelper);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ color: 0x444444 }),
    );
    plane.position.set(0, -0.001, 0);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const noise = new NoiseVector3D();

    const object3d = new THREE.Object3D();
    object3d.position.set(0, 0, 0);
    scene.add(object3d);

    const models = [];
    const dustGeometry = new THREE.SphereGeometry(0.005);
    const dustMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false,
    });

    const modelsMaxLength = 1000;
    for (let i = 0; i < modelsMaxLength; i++) emitModel(models);

    function emitModel() {
      let newModel;
      const rand = Math.random();

      if (models.length >= modelsMaxLength) {
        newModel = models.shift();
      } else {
        newModel = new THREE.Mesh(dustGeometry, dustMaterial);
        newModel.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(`hsl(${rand * 360}, 100%, 50%)`),
          side: 2,
        });
        object3d.add(newModel);
      }

      newModel.position.set(
        camera.position.x + Math.random() * 8 - 4,
        camera.position.y + Math.random() * 8 - 4,
        camera.position.z + Math.random() * 8 - 4,
      );
      newModel.scale.set(rand, rand, rand);
      models.push(newModel);
    }

    function animate(view) {
      emitModel(models);
      models.forEach((model) => {
        const newPos = noise.get(
          model.position.x,
          model.position.y,
          model.position.z,
        );
        model.position.set(
          model.position.x + newPos.x / 100,
          model.position.y + newPos.y / 100,
          model.position.z + newPos.z / 100,
        );
      });
      requestAnimationFrame(() => animate(view));
      const delta = clock.getDelta();
      view.update(delta);
      renderer.render(scene, camera);
    }
    animate(view);

    window.addEventListener("resize", reset);
    window.addEventListener("orientationchange", reset);
    window.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "Tab":
          event.preventDefault();
          view.switch(
            view.activeMode === "navigation" ? "overlay" : "navigation",
          );
          mode.value = view.activeMode;
          break;
      }
    });
  }

  if (container && !container.contains(renderer.domElement)) {
    container.appendChild(renderer.domElement);
  }

  return {
    scene,
    renderer,
    camera,
  };
}

function dettachInstance() {
  if (renderer?.domElement?.parentNode) {
    renderer.domElement.parentElement.removeChild(renderer.domElement);
  }
}

function reset() {
  if (renderer?.domElement?.parentElement) {
    const { clientWidth, clientHeight } = renderer.domElement.parentElement;
    renderer.setSize(clientWidth, clientHeight);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }
}
