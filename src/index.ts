import * as math from "./math";
import * as paint from "./painter";

var group = math.congruenceSubgroups.Gamma_0.cosetRepresentatives(4);
var ctx: paint.HyperbolicContext;
var domain = [
	math.oo,
	new math.Complex(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)),
	new math.Complex(-Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)),
];

function repaint() {
	const { width, height } = ctx.context.canvas;
	ctx.context.fillRect(0, 0, width, height);

	for (let g of group) {
		ctx.beginShape();
		ctx.polyLine(domain.map((x) => g.transform(x)));
		ctx.closeShape();
		ctx.fill();
		ctx.stroke();
	}

	ctx.axis();
	ctx.annotateFrac("Re", [1, 2]);
}

window.addEventListener("load", () => {
	const canvas = document.getElementById("testcanvas") as HTMLCanvasElement;
	ctx = new paint.HyperbolicContext(canvas.getContext("2d"));
});
