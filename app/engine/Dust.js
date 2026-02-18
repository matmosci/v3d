import { Mesh, Color, SphereGeometry, MeshBasicMaterial } from "three";
import NoiseVector3D from "./NoiseVector3D";

const dustGeometry = new SphereGeometry(0.0025, 8, 4);
const dustMaterial = new MeshBasicMaterial({
    color: 0xffffff,
    wireframe: false,
});

export default class Dust {
    constructor(ctx) {
        this.scene = ctx.scene;
        this.camera = ctx.camera;
        this.objects = [];
        this.noise = new NoiseVector3D(10);
        this.modelsMaxLength = 500;
        for (let i = 0; i < this.modelsMaxLength; i++) this.emit();
    }

    emit() {
        let newModel;
        const rand = Math.random();

        if (this.objects.length >= this.modelsMaxLength) {
            newModel = this.objects.shift();
        } else {
            newModel = new Mesh(dustGeometry, dustMaterial);
            const hue = 15 + Math.random() * 30;
            newModel.material = new MeshBasicMaterial({
                color: new Color(`hsl(${hue}, 100%, 50%)`),
                side: 2,
            });
            newModel.layers.set(1);
            this.scene.add(newModel);
        }

        newModel.position.set(
            this.camera.position.x + Math.random() * 8 - 4,
            this.camera.position.y + Math.random() * 8 - 4,
            this.camera.position.z + Math.random() * 8 - 4,
        );
        newModel.scale.set(rand, rand, rand);
        this.objects.push(newModel);
    }

    update(divide = 1000) {
        this.objects.forEach((model) => {
            const newPos = this.noise.get(
                model.position.x,
                model.position.y,
                model.position.z,
            );
            model.position.set(
                model.position.x + newPos.x / divide,
                model.position.y + newPos.y / divide,
                model.position.z + newPos.z / divide,
            );
        });
    }
};