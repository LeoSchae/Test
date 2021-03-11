import { Complex, Moebius, congruenceSubgroups, oo } from "./math";
import { ComplexProjection, HyperbolicContext } from "./painter";

export class MoebiusCanvas {
	private pixelRatio: number;
	private _fg: HTMLCanvasElement;
	private _bg: HTMLCanvasElement;

	private fgRepaint: boolean = false;
	private bgRepaint: boolean = false;

	private mousePos: [number, number] | null = null;
	private group: Moebius[] | null = congruenceSubgroups.Gamma.cosetRepresentatives(5);
	private domain: congruenceSubgroups.FundamentalDomain = congruenceSubgroups.Domain1;

	private fgCanvas: HyperbolicContext;
	private bgCanvas: HyperbolicContext;
	private projection: ComplexProjection;

	constructor(fg: HTMLCanvasElement, bg: HTMLCanvasElement) {
		this.pixelRatio = window.devicePixelRatio;
		this._fg = fg;
		this._bg = bg;
		this.fgCanvas = new HyperbolicContext(fg.getContext("2d"));
		this.bgCanvas = new HyperbolicContext(bg.getContext("2d"));
		this.projection = this.bgCanvas.projection;
		this.fgCanvas.projection = this.projection;

		this._attachEvents(fg);
		this._fixSize();

		const c = this;
		window.addEventListener("resize", (ev) => c._fixSize());
	}

	paintFg() {
		let {
			fgCanvas: ctx,
			_fg: { width, height },
			projection,
			mousePos,
			domain,
		} = this;
		ctx.context.clearRect(0, 0, width, height);

		let m: Moebius = null;

		if (mousePos != null) m = domain.findCosetOf(projection.map(...mousePos));

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

	paintBg() {
		let {
			bgCanvas: ctx,
			_bg: { width, height },
			group,
			domain,
		} = this;

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

	zoom(direction: number, center: [number, number]) {
		this.projection.zoom(direction, center[0] * this.pixelRatio, center[1] * this.pixelRatio);
		this.requestRepaint();
	}

	translate(direction: [number, number]) {
		this.projection.translate(direction[0] * this.pixelRatio, direction[1] * this.pixelRatio);
		this.requestRepaint();
	}

	requestRepaint(fg: boolean = true, bg: boolean = true) {
		if (!(this.fgRepaint || this.bgRepaint)) {
			const c = this;
			window.requestAnimationFrame(() => c._repaint());
		}
		this.fgRepaint = this.fgRepaint || fg;
		this.bgRepaint = this.bgRepaint || bg;
	}

	private _hover(pos: [number, number] | null) {
		this.mousePos = pos;
		this.requestRepaint(true, false); // Only fg
	}

	private _repaint() {
		if (this.fgRepaint) this.paintFg();
		if (this.bgRepaint) this.paintBg();
		this.fgRepaint = false;
		this.bgRepaint = false;
	}

	private _attachEvents(element: HTMLElement) {
		const th = this;
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
			if (pEvs.length <= 1) th._hover([ev.x, ev.y]);
			else th._hover(null);
			ev.preventDefault();
		};
		let moveEv = (ev: PointerEvent) => {
			// Update trackers
			for (let i = 0; i < pEvs.length; i++)
				if (pEvs[i].pointerId == ev.pointerId) {
					pEvs[i] = ev;
					break;
				}

			if (pEvs.length <= 1) th._hover([ev.x, ev.y]);
			else th._hover(null);

			if (pEvs.length == 1) {
				// drag
				let pos: [number, number] = [ev.x, ev.y];

				if (pPos != null) {
					th.translate([pos[0] - pPos[0], pos[1] - pPos[1]]);
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
					th.translate([cen[0] - pCen[0], cen[1] - pCen[1]]);
					th.zoom(Math.log(prDiff), cen);
				}

				pCen = cen;
				pDist = diff;
				ev.preventDefault();
			}
		};
		let leaveEv = (ev: PointerEvent) => {
			if (ev.pointerType == "mouse") th._hover(null);
		};

		if (!window.PointerEvent) {
			window.addEventListener("mouseup", relEv);
			element.addEventListener("mousedown", downEv);
			element.addEventListener("mousemove", moveEv);
			element.addEventListener("mouseout", leaveEv);
		} else {
			element.addEventListener("pointerup", relEv);
			element.addEventListener("pointercancel", relEv);
			element.addEventListener("pointerdown", downEv);
			element.addEventListener("pointermove", moveEv);
			element.addEventListener("pointerleave", leaveEv);
		}

		// global events
		element.addEventListener("wheel", (ev) => {
			th.zoom(-ev.deltaY * (ev.deltaMode == 1 ? 0.03333 : 0.001), [ev.x, ev.y]);
			ev.preventDefault();
		});
	}

	private _fixSize() {
		const { _bg, _fg, pixelRatio } = this;
		_bg.width = _bg.clientWidth * pixelRatio;
		_bg.height = _bg.clientHeight * pixelRatio;
		_fg.width = _fg.clientWidth * pixelRatio;
		_fg.height = _fg.clientHeight * pixelRatio;
		this.requestRepaint();
	}
}
