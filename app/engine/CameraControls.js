import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Vector3 } from "three";
import events from "./EventBus";

class PointerLockControlsState {
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
  constructor(camera, domElement) {
    this.camera = camera;
    this.pointerLockControls = new PointerLockControls(camera, domElement);
    this.pointerLockControlsState = new PointerLockControlsState();

    this.direction = new Vector3();

    this.pointerLockControls.enabled = false;

    events.on("mode:change", ({ mode }) => {
      this.switch(mode);
    });

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
  }

  switch(mode) {
    switch (mode) {
      case "overlay":
        this.pointerLockControls.unlock();
        this.pointerLockControls.enabled = false;
        break;
      case "navigation":
        this.pointerLockControls.lock();
        this.pointerLockControls.enabled = true;
        break;
    }
  }

  update(delta) {
    this.direction.z = Number(
      this.pointerLockControlsState.moveForward -
      this.pointerLockControlsState.moveBackward,
    );
    this.direction.y = Number(
      this.pointerLockControlsState.moveUp -
      this.pointerLockControlsState.moveDown,
    );
    this.direction.x = Number(
      this.pointerLockControlsState.moveRight -
      this.pointerLockControlsState.moveLeft,
    );
    this.direction.normalize();
    this.pointerLockControls.moveRight(
      this.direction.x * delta * this.pointerLockControlsState.speed,
    );
    this.moveUp(
      this.direction.y * delta * this.pointerLockControlsState.speed,
    );
    this.pointerLockControls.moveForward(
      this.direction.z * delta * this.pointerLockControlsState.speed,
    );
  }
  moveUp(distance) {
    this.camera.position.y += distance;
  }
}

export default CameraControls;
