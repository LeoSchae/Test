import "./polyfills";
import { MoebiusCanvas } from "./moebius";

var canvas: MoebiusCanvas;

window.addEventListener("load", () => {
	canvas = new MoebiusCanvas(
		document.getElementById("fgcanvas") as HTMLCanvasElement,
		document.getElementById("bgcanvas") as HTMLCanvasElement
	);
});
