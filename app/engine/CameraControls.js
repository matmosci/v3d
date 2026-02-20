import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Vector3 } from "three";
import { th } from "zod/locales";

class CameraMovement {
  constructor() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.speed = 3;

    window.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
          this.moveForward = true;
          break;
        case "KeyA":
          this.moveLeft = true;
          break;
        case "KeyS":
          this.moveBackward = true;
          break;
        case "KeyD":
          this.moveRight = true;
          break;
        case "KeyE":
          this.moveUp = true;
          break;
        case "KeyQ":
          this.moveDown = true;
          break;
        case "ShiftLeft":
          this.speed = 6;
          break;
      }
    });

    window.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
          this.moveForward = false;
          break;
        case "KeyA":
          this.moveLeft = false;
          break;
        case "KeyS":
          this.moveBackward = false;
          break;
        case "KeyD":
          this.moveRight = false;
          break;
        case "KeyE":
          this.moveUp = false;
          break;
        case "KeyQ":
          this.moveDown = false;
          break;
        case "ShiftLeft":
          this.speed = 3;
          break;
      }
    });
  }
}

class CameraControls {
  constructor(ctx) {
    this.ctx = ctx;
    this.camera = this.ctx.camera;
    this.pointerLockControls = new PointerLockControls(this.ctx.camera, this.ctx.renderer.domElement);
    this.pointerLockControls.enabled = false;
    this.cameraMovement = new CameraMovement();

    this.direction = new Vector3();


    window.addEventListener("keydown", (event) => {
      if (!this.pointerLockControls.enabled) return;
      switch (event.code) {
        case "KeyH":
          this.camera.position.x = 0;
          this.camera.position.y = 1.6;
          this.camera.position.z = 0;
          break;
        case "KeyC":
          this.camera.position.y = 1.6;
          break;
      }
    });

    this.ctx.events.on("mode:enable", () => {
      this.switch(true);
    });
    this.ctx.events.on("mode:disable", () => {
      this.switch(false);
    });
    this.pointerLockControls.addEventListener("change", () => {
      this.ctx.events.emit("camera:rotate");
    });
    this.pointerLockControls.addEventListener("lock", () => {
      this.ctx.events.emit("camera:lock");
    });
    this.pointerLockControls.addEventListener("unlock", () => {
      this.ctx.events.emit("camera:unlock");
    });
  }

  switch(enabled) {
    if (enabled) {
      this.pointerLockControls.lock();
      this.pointerLockControls.enabled = true;
    } else {
      this.pointerLockControls.unlock();
      this.pointerLockControls.enabled = false;
    }
  }

  update(delta) {
    this.direction.z = Number(
      this.cameraMovement.moveForward -
      this.cameraMovement.moveBackward,
    );
    this.direction.y = Number(
      this.cameraMovement.moveUp -
      this.cameraMovement.moveDown,
    );
    this.direction.x = Number(
      this.cameraMovement.moveRight -
      this.cameraMovement.moveLeft,
    );
    this.direction.normalize();
    this.pointerLockControls.moveRight(
      this.direction.x * delta * this.cameraMovement.speed,
    );
    this.moveUp(
      this.direction.y * delta * this.cameraMovement.speed,
    );
    this.pointerLockControls.moveForward(
      this.direction.z * delta * this.cameraMovement.speed,
    );
    if (this.direction.length() > 0) {
      this.ctx.events.emit("camera:move");
    }
  }
  moveUp(distance) {
    this.camera.position.y += distance;
  }
}

export default CameraControls;
