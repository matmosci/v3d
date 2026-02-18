import Engine from "../engine/Engine";

const mode = ref("overlay");
let engine = null;

export default function useEditor() {
    function init(container) {
        if (!engine) engine = new Engine(container);
        engine.context.events.on("mode:disable", () => {
            mode.value = "overlay";
        });
        engine.context.events.on("mode:enable", () => {
            mode.value = "navigation";
        });
    }

    function getInstance() {
        return engine;
    }

    function getContext() {
        return engine ? engine.context : null;
    }

    function setMode(newMode) {
        switch (newMode) {
            case "overlay":
                engine.context.events.emit("mode:disable");
                break;
            case "navigation":
                engine.context.events.emit("mode:enable");
                break;
        }
    }

    function toggleMode() {
        const newMode = mode.value === "overlay" ? "navigation" : "overlay";
        setMode(newMode);
    }

    function getMode() {
        return mode.value;
    }

    return {
        init,
        getInstance,
        getContext,
        setMode,
        toggleMode,
        getMode,
    };
}
