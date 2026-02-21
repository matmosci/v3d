import Engine from "../engine/Engine";

const mode = ref("overlay");
const selectedInstance = ref(null);
let engine = null;
let isEventsBound = false;

export default function useEditor() {
    function init(container) {
        if (!engine) engine = new Engine(container);
        if (!isEventsBound) {
            isEventsBound = true;
            engine.context.events.on("mode:disable", () => {
                mode.value = "overlay";
            });
            engine.context.events.on("mode:enable", () => {
                mode.value = "navigation";
            });
            engine.context.events.on("object:selected", (payload) => {
                selectedInstance.value = payload;
            });
            engine.context.events.on("object:deselected", () => {
                selectedInstance.value = null;
            });
        }
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

    function getSelectedInstance() {
        return selectedInstance;
    }

    function deleteSelectedInstance() {
        if (!engine) return;
        const id = selectedInstance.value?.id;
        if (!id) return;
        engine.context.events.emit("object:delete", { id });
    }

    return {
        init,
        getInstance,
        getContext,
        setMode,
        toggleMode,
        getMode,
        getSelectedInstance,
        deleteSelectedInstance,
    };
}
