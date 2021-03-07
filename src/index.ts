import * as math from "./math";
import * as paint from "./painter";

function* test(t: math.oo) {
  yield math.oo;
  yield math.oo;
}

test(math.oo);

window.addEventListener("load", () => {
  let group = math.congruenceSubgroups.Gamma_0.cosetRepresentatives(4);

  const canvas = document.getElementById("testcanvas") as HTMLCanvasElement;
  const hp = new paint.HyperbolicContext(canvas.getContext("2d"));
  
  hp.strokeStyle = "#FF0000"

  let e0 = math.oo, e1 = new math.Complex(Math.cos(Math.PI/3),Math.sin(Math.PI/3)), e2 = new math.Complex(-e1.real, e1.imag)
  let dom = [e0, e1, e2, e0]

  for(let g of group) {
    hp.beginShape()
    hp.polyLine(dom.map(x => g.transform(x)))
    //hp.fill()
    hp.stroke();
  }
  let t1 = performance.now()
  hp.axis();
  console.log(performance.now()-t1)
});
