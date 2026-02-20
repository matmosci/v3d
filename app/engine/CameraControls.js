import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Vector3 } from "three";

class MovementIntent {
  forward = false;
  backward = false;
  left = false;
  right = false;
  up = false;
  down = false;
  sprint = false;

  get hasMovement() {
    return (
      this.forward ||
      this.backward ||
      this.left ||
      this.right ||
      this.up ||
      this.down
    );
  }
}
class InputSystem {
  constructor(intent) {
    this.intent = intent;

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  onKeyDown = (event) => {
    switch (event.code) {
      case "KeyW": this.intent.forward = true; break;
      case "KeyS": this.intent.backward = true; break;
      case "KeyA": this.intent.left = true; break;
      case "KeyD": this.intent.right = true; break;
      case "KeyE": this.intent.up = true; break;
      case "KeyQ": this.intent.down = true; break;
      case "ShiftLeft": this.intent.sprint = true; break;
    }
  };

  onKeyUp = (event) => {
    switch (event.code) {
      case "KeyW": this.intent.forward = false; break;
      case "KeyS": this.intent.backward = false; break;
      case "KeyA": this.intent.left = false; break;
      case "KeyD": this.intent.right = false; break;
      case "KeyE": this.intent.up = false; break;
      case "KeyQ": this.intent.down = false; break;
      case "ShiftLeft": this.intent.sprint = false; break;
    }
  };
}

const CameraState = {
  Disabled: 0,
  Idle: 1,
  Moving: 2,
};

export default class CameraController {
  constructor(ctx) {
    this.ctx = ctx;
    this.camera = ctx.camera;
    this.controls = new PointerLockControls(
      ctx.camera,
      ctx.renderer.domElement
    );

    this.intent = new MovementIntent();
    this.intent.reset = () => this.reset();
    this.intent.ground = () => this.ground();
    this.input = new InputSystem(this.intent);

    this.state = CameraState.Disabled;

    this.direction = new Vector3();
    this.baseSpeed = 3;
    this.sprintMultiplier = 2;

    this.ctx.events.on("mode:enable", () => {
      this.enable();
    });
    this.ctx.events.on("mode:disable", () => {
      this.disable();
    });
    this.controls.addEventListener("lock", () => { });
    this.controls.addEventListener("unlock", () => { });
    this.controls.addEventListener("change", () => {
      this.ctx.events.emit("camera:rotate");
    });
  }

  enable() {
    this.controls.lock();
    this.state = CameraState.Idle;
  }

  disable() {
    this.controls.unlock();
    this.state = CameraState.Disabled;
  }

  update(delta) {
    if (this.state === CameraState.Disabled) return;

    const hasMovement = this.intent.hasMovement;

    // --- transitions ---
    if (this.state === CameraState.Idle && hasMovement) {
      this.state = CameraState.Moving;
      this.ctx.events.emit("camera:moveStart");
    }

    if (this.state === CameraState.Moving && !hasMovement) {
      this.state = CameraState.Idle;
      this.ctx.events.emit("camera:moveEnd");
    }

    // --- execution ---
    if (this.state === CameraState.Moving) {
      this.applyMovement(delta);
    }
  }

  applyMovement(delta) {
    this.direction.set(
      Number(this.intent.right) - Number(this.intent.left),
      Number(this.intent.up) - Number(this.intent.down),
      Number(this.intent.forward) - Number(this.intent.backward)
    );

    if (this.direction.lengthSq() === 0) return;

    this.direction.normalize();

    const speed =
      this.baseSpeed *
      (this.intent.sprint ? this.sprintMultiplier : 1);

    const distance = speed * delta;

    this.controls.moveRight(this.direction.x * distance);
    this.controls.moveForward(this.direction.z * distance);
    this.camera.position.y += this.direction.y * distance;

    this.ctx.events.emit("camera:move");
  }
}