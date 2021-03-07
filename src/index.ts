import * as math from "./math";
import * as paint from "./painter";

var group = math.congruenceSubgroups.Gamma_0.cosetRepresentatives(30);
var fgCtx: paint.HyperbolicContext;
var bgCtx: paint.HyperbolicContext;
var projection: paint.ComplexProjection;

var mouseIn = false,
	mouseX = 0,
	mouseY = 0;

var domain = math.congruenceSubgroups.Domain1;

function repaintFg() {
	const ctx = fgCtx;
	fgReq = false;
	const { width, height } = ctx.context.canvas;
	ctx.context.clearRect(0, 0, width, height);

	let m: math.Moebius = null;

	if (mouseIn) m = domain.findCosetOf(projection.map(mouseX, mouseY));

	if (m != null) {
		ctx.fillStyle = "#3333AA55";

		ctx.beginShape();
		ctx.polyLine(domain.corners.map((x) => m.transform(x)));
		ctx.closeShape();
		ctx.fill();
		//ctx.stroke();
	}

	ctx.axis();
	ctx.annotateFrac("Re", [1, 2]);
}

function repaintBg() {
	const ctx = bgCtx;
	bgReq = false;
	const { width, height } = ctx.context.canvas;
	ctx.context.clearRect(0, 0, width, height);

	ctx.fillStyle = "#FF333355";
	ctx.strokeStyle = "#FF0000";

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
	let root = document.getElementById("root");

	root.addEventListener("resize", (ev) => {
		console.log(root.clientWidth, root.clientWidth);
	});

	const fgCanvas = document.getElementById("bgcanvas") as HTMLCanvasElement;
	const bgCanvas = document.getElementById("fgcanvas") as HTMLCanvasElement;
	fgCtx = new paint.HyperbolicContext(fgCanvas.getContext("2d"));
	bgCtx = new paint.HyperbolicContext(bgCanvas.getContext("2d"));
	bgCtx.projection = fgCtx.projection;
	projection = fgCtx.projection;

	function fixSize(width: number, height: number) {
		fgCanvas.width = width;
		fgCanvas.height = height;
		bgCanvas.width = width;
		bgCanvas.height = height;
	}

	fixSize(window.innerWidth, window.innerHeight);

	registerDragAndZoom(fgCanvas, null, null);

	var downOnCanvas = false;
	var px = 0,
		py = 0;
	fgCanvas.addEventListener("wheel", (ev) => {
		projection.zoom(-ev.deltaY * (ev.deltaMode == 1 ? 0.03333 : 0.001), ev.x, ev.y);
		ev.preventDefault();
		requestRepaint();
	});
	fgCanvas.addEventListener("mousedown", (ev) => {
		downOnCanvas = true;
		px = ev.x;
		py = ev.y;
	});
	fgCanvas.addEventListener("mousemove", (ev) => {
		mouseIn = true;
		mouseX = ev.x;
		mouseY = ev.y;
		requestRepaint(true, false);
	});
	fgCanvas.addEventListener("mouseleave", (ev) => {
		mouseIn = false;
		requestRepaint(true, false);
	});
	window.addEventListener("mouseup", (ev) => {
		downOnCanvas = false;
	});
	window.addEventListener("mousemove", (ev) => {
		if (downOnCanvas) {
			const dx = ev.x - px,
				dy = ev.y - py;
			(px = ev.x), (py = ev.y);
			projection.translate(dx, dy);
			requestRepaint();
		}
	});
	window.addEventListener("resize", (ev) => {
		fixSize(window.innerWidth, window.innerHeight);
		requestRepaint();
	});
	requestRepaint();
});

function registerDragAndZoom(
	element: HTMLElement,
	zoom: (dZ: number) => void,
	scroll: (dX: number, dY: number) => void
) {
	let pEvs: Array<PointerEvent> = new Array();
	let pDiff = -1;
	let pCen = [0, 0];

	element.addEventListener("pointerdown", (ev) => {
		pEvs.push(ev);
		console.log("down");
	});
	element.addEventListener("pointerup", (ev) => {
		for (let i = 0; i < pEvs.length; i++)
			if (pEvs[i].pointerId == ev.pointerId) {
				pEvs.splice(i, 1);
				break;
			}
		if (pEvs.length < 2) pDiff = -1;
	});
	element.addEventListener("pointermove", (ev) => {
		for (let i = 0; i < pEvs.length; i++)
			if (pEvs[i].pointerId == ev.pointerId) {
				pEvs[i] = ev;
				break;
			}
		if (pEvs.length == 2) {
			let { x: x1, y: y1 } = pEvs[0];
			let { x: x2, y: y2 } = pEvs[1];

			let diff = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
			let cen = [0.5 * (x1 + x2), 0.5 * (y1 + y2)];

			if (pDiff > 0) {
				let prDiff = diff / pDiff;
				projection.translate(cen[0] - pCen[0], cen[1] - pCen[1]);
				projection.zoom(Math.log(prDiff), cen[0], cen[1]);
				requestRepaint();
			}

			pCen = cen;
			pDiff = diff;
		}
	});
}
