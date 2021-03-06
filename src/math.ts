export enum MathType {
	Infinity = "infinity",
	Complex = "complex",
	Moebius = "moebius",
}

interface TeXable {
	toTeX(): String;
}

export type oo = { mathtype: MathType.Infinity };
export const oo: oo = { mathtype: MathType.Infinity };

export class Complex implements TeXable {
	mathtype = MathType.Complex;
	real: number;
	imag: number;

	constructor(real: number, imag: number = 0) {
		this.real = real;
		this.imag = imag;
	}

	abs2(): number {
		return this.real * this.real + this.imag * this.imag;
	}

	abs(): number {
		return Math.sqrt(this.abs2());
	}

	add(other: number | Complex): Complex {
		if (typeof other === "number") return new Complex(this.real + other, this.imag);
		else return new Complex(this.real + other.real, this.imag + other.imag);
	}

	sub(other: number | Complex): Complex {
		if (typeof other === "number") return new Complex(this.real - other, this.imag);
		else return new Complex(this.real - other.real, this.imag - other.imag);
	}

	mul(other: number | Complex): Complex {
		if (typeof other === "number") return new Complex(other * this.real, other * this.imag);
		else
			return new Complex(
				this.real * other.real - this.imag * other.imag,
				this.imag * other.real + this.real * other.imag
			);
	}

	div(other: number | Complex): Complex {
		if (typeof other === "number") return new Complex(this.real / other, this.imag / other);
		else {
			return this.mul(other.inv());
		}
	}

	inv(): Complex {
		var a2 = this.abs2();
		return new Complex(this.real / a2, -this.imag / a2);
	}

	arg() {
		var re = this.real;
		var im = this.imag;
		if (re == 0) {
			if (im > 0) return 0.5 * Math.PI;
			else if (im < 0) return 1.5 * Math.PI;
			else return 0;
		}
		if (re >= 0) {
			const phi = Math.atan((1.0 * im) / re);
			if (phi < 0) return 2 * Math.PI + phi;
			return phi;
		}
		return Math.atan((1.0 * im) / re) + Math.PI;
	}

	toTeX() {
		if (this.imag == 0) return `${this.real}`;
		else if (this.real == 0) return `${this.imag}i`;
		else return `${this.real} + ${this.imag}i`;
	}
}

export class Moebius implements TeXable {
	mathtype: MathType.Moebius;
	m: [number, number, number, number];

	constructor(m00: number, m01: number, m10: number, m11: number) {
		this.m = [m00, m01, m10, m11];
	}

	mul(other: Moebius): Moebius {
		const m1 = this.m;
		const m2 = other.m;
		return new Moebius(
			m1[0] * m2[0] + m1[1] * m2[2],
			m1[0] * m2[1] + m1[1] * m2[3],
			m1[2] * m2[0] + m1[3] * m2[2],
			m1[2] * m2[1] + m1[3] * m2[3]
		);
	}

	/* Not checked for determinant 1!!! */
	inv(): Moebius {
		const m = this.m;
		return new Moebius(m[3], -m[1], -m[2], m[0]);
	}

	transform(value: number | Complex | oo): Complex | oo {
		if (typeof value === "number") value = new Complex(value);
		else if (value.mathtype === MathType.Infinity) {
			if (this.m[2] == 0) return oo;
			return new Complex(this.m[0] / this.m[2]);
		}
		const m = this.m;
		const q = (value as Complex).mul(m[2]).add(m[3]);
		if (q.real == 0 && q.imag == 0) return oo;
		return (value as Complex).mul(m[0]).add(m[1]).div(q);
	}

	toTeX() {
		return `\\begin{pmatrix}${this.m[0]}&${this.m[1]}\\${this.m[2]}&${this.m[3]}\\end{pmatrix}`;
	}
}

export namespace congruenceSubgroups {
	class CongruenceSubgroup implements TeXable {
		indicator: (level: number, value: Moebius) => boolean;
		tex: String;

		constructor(indicator: (level: number, value: Moebius) => boolean, tex: String) {
			this.indicator = indicator;
			this.tex = tex;
		}

		findCosetIndex(level: number, list: Moebius[], value: Moebius): number {
			const xinv = value.inv();
			const ind = this.indicator;
			return list.findIndex((value: Moebius) => {
				return ind(level, value.mul(xinv));
			});
		}

		findCoset(level: number, list: Moebius[], value: Moebius): Moebius {
			const xinv = value.inv();
			const ind = this.indicator;
			return list.find((value: Moebius) => {
				return ind(level, value.mul(xinv));
			});
		}

		cosetRepresentatives(level: number): Moebius[] {
			if (!Number.isInteger(level) || level <= 0) throw "Invalid Level";

			const generators = [
				new Moebius(0, -1, 1, 0),
				new Moebius(1, 1, 0, 1),
				new Moebius(1, -1, 0, 1),
			];
			const group = this;
			const reprs = [new Moebius(1, 0, 0, 1)];

			var checks: Moebius[] = [];
			var seeds: Moebius[] = [];
			var added = [new Moebius(1, 0, 0, 1)];

			while (added.length > 0) {
				checks = seeds;
				seeds = added;
				added = [];

				for (let s of seeds) {
					for (let g of generators) {
						let n = s.mul(g);
						if (
							group.findCosetIndex(level, checks, n) == -1 &&
							group.findCosetIndex(level, added, n) == -1 &&
							group.findCosetIndex(level, seeds, n) == -1
						) {
							reprs.push(n);
							added.push(n);
						}
					}
				}
			}
			return reprs;
		}

		toTeX() {
			return this.tex;
		}
	}

	function _mod_eq(v1: number, v2: number, modulus: number) {
		return (v1 - v2) % modulus === 0;
	}

	function _gamma_0_indicator(level: number, value: Moebius) {
		return _mod_eq(value.m[2], 0, level);
	}

	function _gamma_1_indicator(level: number, value: Moebius) {
		return (
			_mod_eq(value.m[2], 0, level) &&
			(_mod_eq(value.m[0], 1, level) || _mod_eq(value.m[0], -1, level))
		);
	}

	function _gamma_indicator(level: number, value: Moebius) {
		return (
			_mod_eq(value.m[2], 0, level) &&
			_mod_eq(value.m[1], 0, level) &&
			(_mod_eq(value.m[0], 1, level) || _mod_eq(value.m[0], -1, level))
		);
	}

	export const Gamma_0 = new CongruenceSubgroup(_gamma_0_indicator, "\\Gamma_0");
	export const Gamma_1 = new CongruenceSubgroup(_gamma_1_indicator, "\\Gamma_1");
	export const Gamma = new CongruenceSubgroup(_gamma_indicator, "\\Gamma");

	const e_pi_3 = new Complex(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3));

	export type FundamentalDomain = {
		corners: (Complex | oo)[];
		findCosetOf: (value: Complex) => Moebius;
	};

	export const Domain1: FundamentalDomain = {
		corners: [oo, e_pi_3, new Complex(0.0, 1.0), new Complex(-e_pi_3.real, e_pi_3.imag)],
		findCosetOf(value: Complex, maxIter: number = 100) {
			if (value.imag <= 0) return null;

			let result = new Moebius(1, 0, 0, 1);
			let current = value;

			for (var i = 0; i < maxIter; i++) {
				if (current == oo) return result.inv();

				var n = Math.floor(current.real + 0.5);
				result = new Moebius(1, -n, 0, 1).mul(result);
				current = result.transform(value) as Complex;

				if (current.abs2() >= 1) {
					return result.inv();
				}

				result = new Moebius(0, 1, -1, 0).mul(result);
				current = result.transform(value) as Complex;
			}
			console.log("Max iterations in 'findMoebiousToFund' reached");
			return null;
		},
	};
}
