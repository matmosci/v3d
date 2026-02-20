export default class InputHandler {
	constructor(target = window) {
		this.target = target;
		this.keys = new Set();
		this.keyDownSubscribers = new Set();

		this.target.addEventListener("keydown", this.onKeyDown);
		this.target.addEventListener("keyup", this.onKeyUp);
		this.target.addEventListener("blur", this.onBlur);
	}

	onKeyDown = (event) => {
		this.keys.add(event.code);
		this.keyDownSubscribers.forEach((callback) => callback(event));
	};

	onKeyUp = (event) => {
		this.keys.delete(event.code);
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

	dispose() {
		this.target.removeEventListener("keydown", this.onKeyDown);
		this.target.removeEventListener("keyup", this.onKeyUp);
		this.target.removeEventListener("blur", this.onBlur);
		this.keys.clear();
		this.keyDownSubscribers.clear();
	}
}
