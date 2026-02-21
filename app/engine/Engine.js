import * as THREE from "three";
import EngineContext from "./EngineContext";
import CameraControls from "./CameraControls";
import Cursor3D from "./Cursor3D";
import LevelLoader from "./LevelLoader";
import Dust from "./Dust";
import InputHandler from "./InputHandler";
import Keybindings from "./Keybindings";

export let test_level = "7f4cde04-c4b2-42d1-9ec3-140aaaf35806";

export default class Engine {
    constructor(container, project = test_level) {
        this.container = container;
        this.context = new EngineContext();
        this.context.state.project = project;
        this.systems = {};
        this.context.scene = new THREE.Scene();
        this.context.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.container.appendChild(this.context.renderer.domElement);
        this.context.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.context.renderer.setPixelRatio(window.devicePixelRatio);
        this.context.camera = new THREE.PerspectiveCamera(
            75,
            this.context.renderer.domElement.clientWidth / this.context.renderer.domElement.clientHeight,
            0.1,
            1000,
        );
        this.context.clock = new THREE.Clock(true);
        this.context.input = new InputHandler(window);
        this.context.keybindings = new Keybindings(this.context.input, () => this.context.state.enabled);
        this.registerKeybindings();

        this.context.camera.layers.enable(1);
        this.context.scene.add(this.context.camera);

        this.registerSystems();
        this.registerEvents();
        this.setupScene();

        this.animate();

        window.addEventListener("resize", this.reset.bind(this));
        window.addEventListener("orientationchange", this.reset.bind(this));
    }

    registerSystems() {
        this.systems.dust = new Dust(this.context);
        this.systems.cameraControls = new CameraControls(this.context);
        this.systems.cursor = new Cursor3D(this.context);
        this.systems.level = new LevelLoader(this.context);
    }

    registerKeybindings() {
        this.context.keybindings.bindAction("moveForward", ["KeyW"]);
        this.context.keybindings.bindAction("moveBackward", ["KeyS"]);
        this.context.keybindings.bindAction("moveLeft", ["KeyA"]);
        this.context.keybindings.bindAction("moveRight", ["KeyD"]);
        this.context.keybindings.bindAction("moveUp", ["KeyE"]);
        this.context.keybindings.bindAction("moveDown", ["KeyQ"]);
        this.context.keybindings.bindAction("sprint", ["ShiftLeft", "ShiftRight"]);
        this.context.keybindings.bindAction("toggleCursorLight", ["KeyF"]);
        this.context.keybindings.bindAction("cycleTransformMode", ["KeyT"]);
    }

    registerEvents() {
        this.context.events.on("mode:disable", () => {
            this.disable();
        });
        this.context.events.on("mode:enable", () => {
            this.enable();
        });
        this.context.events.on("object:placement:start", () => {
            this.context.events.emit("mode:enable");
        });
        // this.context.events.on("camera:unlock", () => {
        //     this.context.events.emit("mode:disable");
        // });

        // lifecycle
        // "world:ready": void

        // selection
        // "object:selected": { id: string }
        // "object:deselected": void

        // transform
        // "object:transform:start": { id: string }
        // "object:transform:update": { id: string }
        // "object:transform:end": { id: string }

        // placement
        // "object:placement:start": { asset: string }
        // "object:placement:confirm": { id: string }
        // "object:placement:cancel": void

        // networking
        // "network:object:update": { id: string }
    }

    setupScene() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.context.scene.add(ambientLight);

        const bgColor = 0x0f172b;
        this.context.scene.background = new THREE.Color(bgColor);
        this.context.scene.fog = new THREE.FogExp2(bgColor, 0.01);

        const gridHelper = new THREE.GridHelper(1000, 1000, 0x444444, 0x222222);
        gridHelper.layers.set(1);
        gridHelper.position.set(0, 0.001, 0);
        this.context.scene.add(gridHelper);

        this.systems.level.load();
    }

    enable() {
        this.context.state.enabled = true;
    }

    disable() {
        this.context.state.enabled = false;
    }

    animate() {
        this.systems.dust.emit();
        this.systems.dust.update();
        const delta = this.context.clock.getDelta();
        if (this.context.state.enabled) this.systems.cameraControls.update(delta);
        this.context.renderer.render(this.context.scene, this.context.camera);
        requestAnimationFrame(this.animate.bind(this));
    }

    reset() {
        if (!this.context.renderer?.domElement?.parentElement) return;

        const { clientWidth, clientHeight } = this.context.renderer.domElement.parentElement;
        this.context.renderer.setSize(clientWidth, clientHeight);
        this.context.camera.aspect = clientWidth / clientHeight;
        this.context.camera.updateProjectionMatrix();
    }

    attach(container) {
        this.dettach();
        container.appendChild(this.context.renderer.domElement);
    }

    dettach() {
        if (this.context.renderer?.domElement?.parentElement) {
            this.disable();
            this.context.renderer.domElement.parentElement.removeChild(this.context.renderer.domElement);
        }
    }
}
