import EventBus from "./EventBus";

export default class EngineContext {
    events = new EventBus();

    scene = null;
    renderer = null;
    camera = null;
    clock = null;
    controls = null;
    cursor = null;
    input = null;
    keybindings = null;

    instances = [];
    assets = new Map();
    entity = null;

    state = {
        enabled: false,
        pickedAsset: null,
        pickedPlacementSource: null,
        placementSnap: {
            step: 1,
            axes: {
                x: true,
                y: false,
                z: true,
            },
        },
        placementRotationStepDeg: 15,
    }
};
