import * as THREE from "three";

let scene;
let renderer;
let camera;
let view;
let clock;
let cursor;

const level = useLevel();

const mode = ref("overlay");

export default function useViewport() {
  return {
    attachInstance,
    dettachInstance,
    reset,
    mode,
    view,
    cursor,
    scene,
  };
}

async function attachInstance(container) {
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

    cursor = new Cursor3D(camera, scene);
    view = ViewControls.create(camera, renderer.domElement);

    const color = 0x333333;
    scene.background = new THREE.Color(color);
    scene.fog = new THREE.FogExp2(color, 0.1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    await level.load("7f4cde04-c4b2-42d1-9ec3-140aaaf35806", scene, camera);

    const gridHelper = new THREE.GridHelper(100, 100, 0x111111, 0x111111);
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

    const noise = new NoiseVector3D();

    const object3d = new THREE.Object3D();
    object3d.position.set(0, 0, 0);
    scene.add(object3d);

    const models = [];
    const dustGeometry = new THREE.SphereGeometry(0.0025, 8, 4);
    const dustMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false,
    });

    const modelsMaxLength = 500;
    for (let i = 0; i < modelsMaxLength; i++) emitModel(models);

    function emitModel() {
      let newModel;
      const rand = Math.random();

      if (models.length >= modelsMaxLength) {
        newModel = models.shift();
      } else {
        newModel = new THREE.Mesh(dustGeometry, dustMaterial);
        const hue = 15 + Math.random() * 30;
        newModel.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
          side: 2,
        });
        newModel.layers.set(1);
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
          model.position.x + newPos.x / 1000,
          model.position.y + newPos.y / 1000,
          model.position.z + newPos.z / 1000,
        );
      });
      requestAnimationFrame(() => animate(view));
      const delta = clock.getDelta();
      view.update(delta);
      renderer.render(scene, camera);
    }
    animate(view);

    view.pointerLockControls.addEventListener("change", () => {
      cursor.update();
    });

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
