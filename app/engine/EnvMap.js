import { RGBELoader } from "three/addons/loaders/RGBELoader";
import { EquirectangularReflectionMapping } from 'three';

export default class EnvMap {
  constructor(ctx) {
    this.ctx = ctx;
    this.loader = new RGBELoader();
    this.loader.load("/assets/textures/vignaioli_night_1k.hdr", (hdr) => {
      hdr.mapping = EquirectangularReflectionMapping;
      this.ctx.scene.environment = hdr;
    });
  }
}