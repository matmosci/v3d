import {
    Mesh, Color, SphereGeometry, MeshBasicMaterial,
    TextureLoader,
    SpriteMaterial,
    Sprite,
} from "three";
import NoiseVector3D from "./NoiseVector3D";

export default class Dust {
    constructor(ctx) {
        this.scene = ctx.scene;
        this.camera = ctx.camera;
        this.objects = [];
        this.noise = new NoiseVector3D(0.1);
        this.modelsMaxLength = 1000;
        this.dustTextures = [
            new TextureLoader().load("/assets/textures/dust_01.png"),
            new TextureLoader().load("/assets/textures/dust_02.png"),
            new TextureLoader().load("/assets/textures/dust_03.png"),
            new TextureLoader().load("/assets/textures/dust_04.png"),
            new TextureLoader().load("/assets/textures/dust_05.png"),
            new TextureLoader().load("/assets/textures/dust_06.png"),
            new TextureLoader().load("/assets/textures/dust_07.png"),
            new TextureLoader().load("/assets/textures/dust_08.png"),
            new TextureLoader().load("/assets/textures/dust_09.png"),
        ];
        this.dustTexture = this.dustTextures[Math.floor(Math.random() * this.dustTextures.length)];
        this.dustSpriteMaterial = new SpriteMaterial();
        for (let i = 0; i < this.modelsMaxLength; i++) this.emit();
    }

    emit() {
        let newModel;

        if (this.objects.length >= this.modelsMaxLength) {
            newModel = this.objects.shift();
        } else {
            newModel = new Sprite(this.dustSpriteMaterial);
            const hue = 15 + Math.random() * 30;
            newModel.material = this.dustSpriteMaterial.clone();
            newModel.material.map = this.dustTextures[Math.floor(Math.random() * this.dustTextures.length)];
            newModel.material.color = new Color(`hsl(${hue}, 33%, 50%)`);
            newModel.layers.set(1);
            this.scene.add(newModel);
        }

        newModel.material.rotation = Math.random() * Math.PI * 2;
        newModel.position.set(
            this.camera.position.x + Math.random() * 8 - 4,
            this.camera.position.y + Math.random() * 8 - 4,
            this.camera.position.z + Math.random() * 8 - 4,
        );
        const rand = Math.random();
        newModel.scale.set(rand / 200 + 0.005, rand / 200 + 0.005, 1);
        this.objects.push(newModel);
    }

    update(divide = 500) {
        this.objects.forEach((model) => {
            const newPos = this.noise.get(
                model.position.x,
                model.position.y,
                model.position.z,
            );
            model.material.rotation += newPos.x / 10;
            model.position.set(
                model.position.x + newPos.x / divide,
                model.position.y + newPos.y / divide,
                model.position.z + newPos.z / divide,
            );
        });
    }
};