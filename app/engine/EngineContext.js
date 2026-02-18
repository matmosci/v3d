import EventBus from "./EventBus";

export default class EngineContext {
    events = new EventBus();

    scene = null;
    renderer = null;
    camera = null;
    clock = null;
    controls = null;
    cursor = null;

    instances = [];
    assets = new Map();

    state = {
        enabled: false,
    }
};
