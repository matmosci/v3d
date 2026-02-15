import events from "../engine/EventBus";

const mode = ref("overlay");

events.on("mode:change", ({ mode: newMode }) => {
    mode.value = newMode;
});

function change(newMode) {
    mode.value = newMode;
    events.emit("mode:change", { mode: mode.value });
}

function toggle() {
    const newMode = mode.value === "overlay" ? "navigation" : "overlay";
    change(newMode);
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
    if (event.code === "Tab") {
        event.preventDefault();
        toggle();
    }
});
