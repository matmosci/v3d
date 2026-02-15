import events from "../engine/EventBus";

const mode = ref("overlay");

function change(newMode) {
    mode.value = newMode;
    events.emit("mode:change", { mode: mode.value });   
}

function toggle() {
    change(mode.value === "overlay" ? "navigation" : "overlay");
    return mode.value;
}

export function useMode() {
    return {
        mode,
        change,
        toggle,
    };
}

window?.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "Tab":
            event.preventDefault();
            toggle();
            break;
    }
});