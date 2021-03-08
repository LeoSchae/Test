if (!(MouseEvent.prototype as any).pointerId) (MouseEvent.prototype as any).pointerId = 0;
if (!(MouseEvent.prototype as any).pointerType) (MouseEvent.prototype as any).pointerType = "mouse";

if (!HTMLElement.prototype.releasePointerCapture)
	(function () {
		console.log("Bad Polyfill HTMLElement.releasePointerCapture");
		HTMLElement.prototype.releasePointerCapture = (id) => {};
	})();

if (!HTMLElement.prototype.setPointerCapture)
	(function () {
		console.log("Bad Polyfill HTMLElement.releasePointerCapture");
		HTMLElement.prototype.setPointerCapture = (id) => {};
	})();

if (!Number.isInteger)
	(function () {
		console.log("Polyfill Number.isInteger");
		Number.isInteger = function (value) {
			return (
				typeof value == "number" && // 7.2.6§1
				!(value !== value || value == Infinity || value == -Infinity) && // 7.2.6§2
				Math.floor(Math.abs(value)) === Math.abs(value) // 7.2.6§3
			);
		};
	})();

if (!Array.prototype.find)
	(function () {
		console.log("Polyfill Array.find");
		Array.prototype.find = function <S>(
			callback: (this: void, value: any, index: number, obj: any[]) => value is S,
			thisArg?: any
		) {
			if (!callback || typeof callback !== "function") throw TypeError();
			const size = this.length;
			const that = thisArg || this;
			for (var i = 0; i < size; i++) {
				try {
					if (!!callback.apply(that, [this[i], i, this])) {
						return this[i];
					}
				} catch (e) {
					return undefined;
				}
			}
			return undefined;
		};
	})();

if (!Array.prototype.findIndex)
	(function () {
		console.log("Polyfill Array.find");
		Array.prototype.findIndex = function <S>(
			callback: (this: void, value: any, index: number, obj: any[]) => value is S,
			thisArg?: any
		) {
			if (!callback || typeof callback !== "function") throw TypeError();
			const size = this.length;
			const that = thisArg || this;
			for (var i = 0; i < size; i++) {
				try {
					if (!!callback.apply(that, [this[i], i, this])) {
						return i;
					}
				} catch (e) {
					return -1;
				}
			}
			return -1;
		};
	})();

if (!window.requestAnimationFrame)
	window.requestAnimationFrame = (function () {
		console.log("Polyfill requestAnimationFrame");
		var fps = 60;
		var delay = 1000 / fps;
		var animationStartTime = Date.now();
		var previousCallTime = animationStartTime;

		return function requestAnimationFrame(callback: FrameRequestCallback) {
			var requestTime = Date.now();
			var timeout = Math.max(0, delay - (requestTime - previousCallTime));
			var timeToCall = requestTime + timeout;

			previousCallTime = timeToCall;

			return window.setTimeout(function onAnimationFrame() {
				callback(timeToCall - animationStartTime);
			}, timeout);
		};
	})();
