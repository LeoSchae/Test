import "./polyfills";
import * as math from "./math";
import * as paint from "./painter";

var group = math.congruenceSubgroups.Gamma.cosetRepresentatives(10);
var fgCtx: paint.HyperbolicContext;
var bgCtx: paint.HyperbolicContext;

var mouse: [number, number] | null = null;

var domain = math.congruenceSubgroups.Domain1;

function repaintFg() {
	const ctx = fgCtx;
	fgReq = false;
	const { width, height } = ctx.context.canvas;
	ctx.context.clearRect(0, 0, width, height);

	let m: math.Moebius = null;

	if (mouse != null) m = domain.findCosetOf(fgCtx.projection.map(...mouse));

	if (m != null) {
		ctx.fillStyle = "rgba(100,100,255,0.3)";
		ctx.beginShape();
		ctx.polyLine(domain.corners.map((x) => m.transform(x)));
		ctx.closeShape();
		ctx.fill();
		//ctx.stroke();
	}
	ctx.context.globalAlpha = 1;

	ctx.axis();
	ctx.annotateFrac("Re", [1, 2]);
}

function repaintBg() {
	const ctx = bgCtx;
	bgReq = false;
	const { width, height } = ctx.context.canvas;
	ctx.context.clearRect(0, 0, width, height);

	ctx.fillStyle = "rgba(255,100,100,0.5)";
	ctx.strokeStyle = "rgb(255,0,0)";

	for (let g of group) {
		ctx.beginShape();
		ctx.polyLine(domain.corners.map((x) => g.transform(x)));
		ctx.closeShape();
		ctx.fill();
		ctx.stroke();
	}
}

var fgReq = false;
var bgReq = false;

function requestRepaint(fg: boolean = true, bg: boolean = true) {
	if (!fgReq && fg) requestAnimationFrame(repaintFg);
	if (!bgReq && bg) requestAnimationFrame(repaintBg);
	fgReq = fgReq || fg;
	bgReq = bgReq || bg;
}

window.addEventListener("load", () => {
	document.getElementById("hamburger").addEventListener("click", (ev) => {
		let e = document.getElementById("tools");
		let d = e.style.display;
		if (d == "none") e.style.display = "block";
		else e.style.display = "none";
	});

	let pixelRatio = window.devicePixelRatio;

	const fgCanvas = document.getElementById("bgcanvas") as HTMLCanvasElement;
	const bgCanvas = document.getElementById("fgcanvas") as HTMLCanvasElement;

	fgCtx = new paint.HyperbolicContext(fgCanvas.getContext("2d"));
	bgCtx = new paint.HyperbolicContext(bgCanvas.getContext("2d"));
	bgCtx.projection = fgCtx.projection;
	let projection = fgCtx.projection;

	function fixSize(width: number, height: number) {
		fgCanvas.width = pixelRatio * width;
		fgCanvas.height = pixelRatio * height;
		bgCanvas.width = pixelRatio * width;
		bgCanvas.height = pixelRatio * height;
	}
	window.addEventListener("resize", (ev) => {
		fixSize(window.innerWidth, window.innerHeight);
		requestRepaint();
	});

	registerDragAndZoom(
		fgCanvas,
		(dZ, center) => {
			projection.zoom(dZ, center[0] * pixelRatio, center[1] * pixelRatio);
			requestRepaint();
		},
		(dir) => {
			projection.translate(dir[0] * pixelRatio, dir[1] * pixelRatio);
			requestRepaint();
		},
		(pos) => {
			if (pos == null) mouse = null;
			else mouse = [pos[0] * pixelRatio, pos[1] * pixelRatio];
			requestRepaint(true, false); // only fg update
		}
	);

	fixSize(window.innerWidth, window.innerHeight);
	requestRepaint();
});

function registerDragAndZoom(
	element: HTMLElement,
	zoom: (dZ: number, center: [number, number]) => void,
	scroll: (direction: [number, number]) => void,
	hover: (pos: [number, number] | null) => void
) {
	// active pointers
	let pEvs: Array<PointerEvent> = new Array();

	// old metrics
	let pDist: number | -1 = -1;
	let pPos: [number, number] | null = null;
	let pCen: [number, number] = [0, 0];

	let relEv = (ev: PointerEvent) => {
		if (ev.pointerType == "mouse" && ev.button != 0) return;

		for (let i = 0; i < pEvs.length; i++)
			if (pEvs[i].pointerId == ev.pointerId) {
				pEvs.splice(i, 1);
				element.releasePointerCapture(ev.pointerId);
				ev.preventDefault();
				break;
			}
		pDist = -1;
	};
	let downEv = (ev: PointerEvent) => {
		if (ev.pointerType == "mouse" && ev.button != 0) return;

		pEvs.push(ev);
		element.setPointerCapture(ev.pointerId);
		pPos = null;
		pDist = -1;
		if (pEvs.length <= 1) hover([ev.x, ev.y]);
		else hover(null);
		ev.preventDefault();
	};
	let moveEv = (ev: PointerEvent) => {
		// Update trackers
		for (let i = 0; i < pEvs.length; i++)
			if (pEvs[i].pointerId == ev.pointerId) {
				pEvs[i] = ev;
				break;
			}

		if (pEvs.length <= 1) hover([ev.x, ev.y]);
		else hover(null);

		if (pEvs.length == 1) {
			// drag
			let pos: [number, number] = [ev.x, ev.y];

			if (pPos != null) {
				scroll([pos[0] - pPos[0], pos[1] - pPos[1]]);
			}

			pPos = pos;
			ev.preventDefault();
		} else if (pEvs.length == 2) {
			// zoom and drag
			let { x: x1, y: y1 } = pEvs[0];
			let { x: x2, y: y2 } = pEvs[1];

			let diff = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
			let cen: [number, number] = [0.5 * (x1 + x2), 0.5 * (y1 + y2)];

			if (pDist > 0) {
				let prDiff = diff / pDist;
				scroll([cen[0] - pCen[0], cen[1] - pCen[1]]);
				zoom(Math.log(prDiff), cen);
			}

			pCen = cen;
			pDist = diff;
			ev.preventDefault();
		}
	};
	let leaveEv = (ev: PointerEvent) => {
		if (ev.pointerType == "mouse") hover(null);
	};

	if (!window.PointerEvent) {
		window.addEventListener("mouseup", relEv);
		element.addEventListener("mousedown", downEv);
		element.addEventListener("mousemove", moveEv);
		element.addEventListener("mouseout", leaveEv);
		element.addEventListener("click", (ev) => {
			console.log(ev);
		});
	}

	// global events
	element.addEventListener("wheel", (ev) => {
		zoom(-ev.deltaY * (ev.deltaMode == 1 ? 0.03333 : 0.001), [ev.x, ev.y]);
		ev.preventDefault();
	});
	element.addEventListener("pointerup", relEv);
	element.addEventListener("pointercancel", relEv);
	element.addEventListener("pointerdown", downEv);
	element.addEventListener("pointermove", moveEv);
	element.addEventListener("pointerleave", leaveEv);
}
