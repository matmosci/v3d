export default class InputHandler {
	constructor(target = window) {
		this.target = target;
		this.keys = new Set();
		this.keyDownSubscribers = new Set();
		this.keyUpSubscribers = new Set();
		this.clickSubscribers = new Set();
		this.wheelSubscribers = new Set();
		this.contextMenuSubscribers = new Set();

		this.target.addEventListener("keydown", this.onKeyDown);
		this.target.addEventListener("keyup", this.onKeyUp);
		this.target.addEventListener("click", this.onClick);
		this.target.addEventListener("contextmenu", this.onContextMenu);
		this.target.addEventListener("wheel", this.onWheel, { passive: false });
		this.target.addEventListener("blur", this.onBlur);
	}

	onKeyDown = (event) => {
		this.keys.add(event.code);
		this.keyDownSubscribers.forEach((callback) => callback(event));
	};

	onKeyUp = (event) => {
		this.keys.delete(event.code);
		this.keyUpSubscribers.forEach((callback) => callback(event));
	};

	onClick = (event) => {
		for (const callback of Array.from(this.clickSubscribers)) callback(event);
	};

	onContextMenu = (event) => {
		for (const callback of Array.from(this.contextMenuSubscribers)) callback(event);
	};

	onWheel = (event) => {
		for (const callback of Array.from(this.wheelSubscribers)) callback(event);
	};

	onBlur = () => {
		this.keys.clear();
	};

	isPressed(code) {
		return this.keys.has(code);
	}

	isAnyPressed(codes = []) {
		return codes.some((code) => this.keys.has(code));
	}

	subscribeKeyDown(callback) {
		this.keyDownSubscribers.add(callback);
		return () => {
			this.keyDownSubscribers.delete(callback);
		};
	}

	subscribeKeyUp(callback) {
		this.keyUpSubscribers.add(callback);
		return () => {
			this.keyUpSubscribers.delete(callback);
		};
	}

	subscribeClick(callback, options = {}) {
		if (options.once) {
			const wrapped = (event) => {
				this.clickSubscribers.delete(wrapped);
				callback(event);
			};

			this.clickSubscribers.add(wrapped);

			return () => {
				this.clickSubscribers.delete(wrapped);
			};
		}

		this.clickSubscribers.add(callback);
		return () => {
			this.clickSubscribers.delete(callback);
		};
	}

	subscribeWheel(callback) {
		this.wheelSubscribers.add(callback);
		return () => {
			this.wheelSubscribers.delete(callback);
		};
	}

	subscribeContextMenu(callback) {
		this.contextMenuSubscribers.add(callback);
		return () => {
			this.contextMenuSubscribers.delete(callback);
		};
	}

	dispose() {
		this.target.removeEventListener("keydown", this.onKeyDown);
		this.target.removeEventListener("keyup", this.onKeyUp);
		this.target.removeEventListener("click", this.onClick);
		this.target.removeEventListener("contextmenu", this.onContextMenu);
		this.target.removeEventListener("wheel", this.onWheel);
		this.target.removeEventListener("blur", this.onBlur);
		this.keys.clear();
		this.keyDownSubscribers.clear();
		this.keyUpSubscribers.clear();
		this.clickSubscribers.clear();
		this.wheelSubscribers.clear();
		this.contextMenuSubscribers.clear();
	}
}
