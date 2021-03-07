import {Complex, oo, MathType} from "./math";

class ComplexProjection {
    originX: number = 300;
    originY: number = 300;
    scale: number = 100;

    project(value: Complex): number[] {
        return [value.real*this.scale+this.originX, -value.imag*this.scale+this.originY];
    }

    map(x: number, y: number): Complex {
        return new Complex((x-this.originX)/this.scale, -(y-this.originY)/this.scale);
    }
}

export class HyperbolicContext {
    context: CanvasRenderingContext2D;
    projection: ComplexProjection = new ComplexProjection();

    position: Complex | oo = null;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
    }

    polyLine(points: Iterable<Complex | oo>) {
        for(let p of points) {
            this.lineTo(p);
        }
    }

    beginShape(position: Complex | oo = null) {
        this.context.beginPath();
        if(position === null)
            this.position = null;
        else
            this.moveTo(position);
    }

    moveTo(position: Complex | oo) {
        if(position.mathtype == MathType.Infinity)
            this.position = position;
        else {
            const p = this.projection.project(position as Complex);
            this.position = position;
            this.context.moveTo(p[0], p[1]);
        }
    }

    lineTo(position: Complex | oo, segments: number = 10) {
        if(this.position == null)
            this.moveTo(position);
        else if(this.position.mathtype == MathType.Infinity) {
            if(position.mathtype == MathType.Infinity)
                return;
            const p = this.projection.project(position as Complex);
            this.position = position;
            this.context.moveTo(p[0], -5)
            this.context.lineTo(p[0], p[1]);
        } else {
            if(position.mathtype == MathType.Infinity) {
                this.context.lineTo(this.projection.project(this.position as Complex)[0], -5)
                this.position = position;
                return;
            }
            let c1 = this.position as Complex;
            let c2 = position as Complex;

            if(Math.abs(c1.real-c2.real) < 0.0000000001) { // Draw straight line between points
                let p = this.projection.project(c2);
                this.context.lineTo(p[0], p[1]);
                this.position = position;
                return;
            }

            let C = 0.5*(c1.abs2()-c2.abs2())/(c1.real-c2.real)
            let CP = this.projection.project(new Complex(C));
            c1 = c1.sub(C);
            c2 = c2.sub(C);
            let a1 = c1.arg();
            let a2 = c2.arg();
            this.context.arc(CP[0], CP[1], c1.abs()*this.projection.scale, -a1, -a2, a1<a2);

            this.position = position;
        }
    }

    stroke() {
        this.context.stroke();
    }
}