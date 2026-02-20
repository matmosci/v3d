export default class Keybindings {
    constructor(input) {
        this.input = input;
        this.actionBindings = new Map();
        this.actionDownSubscribers = new Map();
        this.actionUpSubscribers = new Map();

        this.unsubscribeKeyDown = this.input.subscribeKeyDown((event) => {
            this.emitAction("down", event);
        });
        this.unsubscribeKeyUp = this.input.subscribeKeyUp((event) => {
            this.emitAction("up", event);
        });
    }

    bindAction(action, codes = []) {
        const normalizedCodes = Array.isArray(codes) ? codes : [codes];
        this.actionBindings.set(action, normalizedCodes);
    }

    isActive(action) {
        const codes = this.actionBindings.get(action) || [];
        return this.input.isAnyPressed(codes);
    }

    onActionDown(action, callback) {
        return this.subscribe(this.actionDownSubscribers, action, callback);
    }

    onActionUp(action, callback) {
        return this.subscribe(this.actionUpSubscribers, action, callback);
    }

    subscribe(map, action, callback) {
        if (!map.has(action)) map.set(action, new Set());
        map.get(action).add(callback);

        return () => {
            map.get(action)?.delete(callback);
        };
    }

    emitAction(type, event) {
        for (const [action, codes] of this.actionBindings.entries()) {
            if (!codes.includes(event.code)) continue;

            const subscribers =
                type === "down"
                    ? this.actionDownSubscribers.get(action)
                    : this.actionUpSubscribers.get(action);

            subscribers?.forEach((callback) => callback(event));
        }
    }

    dispose() {
        this.unsubscribeKeyDown?.();
        this.unsubscribeKeyUp?.();
        this.actionBindings.clear();
        this.actionDownSubscribers.clear();
        this.actionUpSubscribers.clear();
    }
}