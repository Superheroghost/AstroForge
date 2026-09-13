import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Aperture, a as Upload, c as Settings, d as Hexagon, f as Factory, g as Atom, h as Bot, i as Volume2, l as RotateCcw, m as Container, n as Waves, p as Download, r as VolumeX, s as Sun, t as X, u as Lock } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DSAfoRsb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[opacity,transform,background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:opacity-90",
			secondary: "bg-surface-2 text-fg border border-border hover:border-border-strong",
			ghost: "text-muted hover:text-fg hover:bg-surface-2",
			danger: "bg-danger text-danger-fg hover:opacity-90"
		},
		size: {
			sm: "h-9 min-h-9 px-3 text-sm rounded-sm",
			md: "h-11 min-h-11 px-4 text-sm rounded-md",
			lg: "h-12 min-h-12 px-5 text-base rounded-md",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		type: asChild ? void 0 : type,
		...props
	});
});
Button.displayName = "Button";
/**
* Mantissa-exponent scientific number for idle-game magnitudes far beyond 1e308.
* Immutable. Hot-path ops allocate one object; they never recurse or loop by
* magnitude. Mantissa is normalized to 0 or [1, 10) with sign.
*/
var LOG10 = Math.LN10;
var INV_LOG10 = 1 / LOG10;
var EXP_ABS_CAP = 0xe8d4a51000;
function clampExp(e) {
	if (e > EXP_ABS_CAP) return EXP_ABS_CAP;
	if (e < -0xe8d4a51000) return -0xe8d4a51000;
	return e;
}
var BigNumber = class BigNumber {
	m;
	e;
	constructor(mantissa, exponent = 0) {
		if (!Number.isFinite(mantissa) || mantissa === 0) {
			if (mantissa === Infinity) {
				this.m = 1;
				this.e = EXP_ABS_CAP;
				return;
			}
			if (mantissa === -Infinity) {
				this.m = -1;
				this.e = EXP_ABS_CAP;
				return;
			}
			this.m = 0;
			this.e = 0;
			return;
		}
		if (!Number.isFinite(exponent)) {
			this.m = mantissa < 0 ? -1 : 1;
			this.e = EXP_ABS_CAP;
			return;
		}
		const sign = mantissa < 0 ? -1 : 1;
		let mag = Math.abs(mantissa);
		let exp = exponent;
		const log = Math.log(mag) * INV_LOG10;
		const shift = Math.floor(log);
		mag = mag * Math.pow(10, -shift);
		exp = clampExp(exp + shift);
		if (mag >= 10) {
			mag /= 10;
			exp = clampExp(exp + 1);
		} else if (mag < 1) {
			mag *= 10;
			exp = clampExp(exp - 1);
		}
		this.m = sign * mag;
		this.e = exp;
	}
	static ZERO = new BigNumber(0, 0);
	static ONE = new BigNumber(1, 0);
	static TEN = new BigNumber(10, 0);
	static from(n) {
		if (n === 0) return BigNumber.ZERO;
		if (n === 1) return BigNumber.ONE;
		return new BigNumber(n, 0);
	}
	static fromParts(m, e) {
		return new BigNumber(m, e);
	}
	static fromJSON(raw) {
		if (raw instanceof BigNumber) return raw;
		if (typeof raw === "number") return BigNumber.from(raw);
		if (raw && typeof raw === "object" && "m" in raw && "e" in raw) {
			const rec = raw;
			return new BigNumber(Number(rec.m) || 0, Number(rec.e) || 0);
		}
		if (typeof raw === "string") return BigNumber.parse(raw);
		return BigNumber.ZERO;
	}
	static parse(text) {
		const t = text.trim();
		const sci = t.match(/^([+-]?\d+(?:\.\d+)?)e([+-]?\d+)$/i);
		if (sci) return new BigNumber(Number(sci[1]), Number(sci[2]));
		const n = Number(t);
		return Number.isFinite(n) ? BigNumber.from(n) : BigNumber.ZERO;
	}
	static min(a, b) {
		return a.lt(b) ? a : b;
	}
	static max(a, b) {
		return a.gt(b) ? a : b;
	}
	isZero() {
		return this.m === 0;
	}
	isFinite() {
		return Math.abs(this.e) < EXP_ABS_CAP;
	}
	sign() {
		return this.m === 0 ? 0 : this.m < 0 ? -1 : 1;
	}
	abs() {
		return this.m < 0 ? new BigNumber(-this.m, this.e) : this;
	}
	neg() {
		return this.m === 0 ? this : new BigNumber(-this.m, this.e);
	}
	add(other) {
		if (this.m === 0) return other;
		if (other.m === 0) return this;
		const de = this.e - other.e;
		if (de >= 16) return this;
		if (de <= -16) return other;
		if (de >= 0) return new BigNumber(this.m + other.m * Math.pow(10, -de), this.e);
		return new BigNumber(other.m + this.m * Math.pow(10, de), other.e);
	}
	sub(other) {
		if (other.m === 0) return this;
		return this.add(other.neg());
	}
	mul(other) {
		if (this.m === 0 || other.m === 0) return BigNumber.ZERO;
		return new BigNumber(this.m * other.m, this.e + other.e);
	}
	mulNum(n) {
		if (n === 0 || this.m === 0) return BigNumber.ZERO;
		if (n === 1) return this;
		return new BigNumber(this.m * n, this.e);
	}
	div(other) {
		if (other.m === 0) {
			if (this.m === 0) return BigNumber.ZERO;
			return new BigNumber(this.m < 0 ? -1 : 1, EXP_ABS_CAP);
		}
		if (this.m === 0) return BigNumber.ZERO;
		return new BigNumber(this.m / other.m, this.e - other.e);
	}
	divNum(n) {
		if (n === 0) return this.m === 0 ? BigNumber.ZERO : new BigNumber(this.sign(), EXP_ABS_CAP);
		if (this.m === 0) return BigNumber.ZERO;
		return new BigNumber(this.m / n, this.e);
	}
	/** this^exp for real exp. Negative bases with non-integer exp → 0. */
	pow(exp) {
		if (exp === 0) return BigNumber.ONE;
		if (this.m === 0) return exp > 0 ? BigNumber.ZERO : new BigNumber(1, EXP_ABS_CAP);
		if (this.m < 0 && !Number.isInteger(exp)) return BigNumber.ZERO;
		const resultLog = (Math.log(Math.abs(this.m)) * INV_LOG10 + this.e) * exp;
		if (!Number.isFinite(resultLog)) return new BigNumber(this.m < 0 && exp % 2 ? -1 : 1, EXP_ABS_CAP);
		const e = Math.floor(resultLog);
		const m = Math.pow(10, resultLog - e);
		const sign = this.m < 0 && exp % 2 !== 0 ? -1 : 1;
		return new BigNumber(sign * m, e);
	}
	sqrt() {
		return this.m < 0 ? BigNumber.ZERO : this.pow(.5);
	}
	log10() {
		if (this.m <= 0) return Number.NEGATIVE_INFINITY;
		return Math.log(this.m) * INV_LOG10 + this.e;
	}
	ln() {
		if (this.m <= 0) return Number.NEGATIVE_INFINITY;
		return Math.log(this.m) + this.e * LOG10;
	}
	floor() {
		if (this.m === 0) return this;
		if (this.e >= 15) return this;
		if (this.e < 0) return this.m >= 0 ? BigNumber.ZERO : BigNumber.from(-1);
		const v = this.toNumber();
		if (!Number.isFinite(v)) return this;
		return BigNumber.from(Math.floor(v));
	}
	cmp(other) {
		if (this.m === 0 && other.m === 0) return 0;
		const sa = this.sign();
		const sb = other.sign();
		if (sa !== sb) return sa < sb ? -1 : 1;
		if (this.e !== other.e) {
			const expCmp = this.e < other.e ? -1 : 1;
			return sa < 0 ? -expCmp : expCmp;
		}
		if (this.m === other.m) return 0;
		return this.m < other.m ? -1 : 1;
	}
	eq(other) {
		return this.cmp(other) === 0;
	}
	lt(other) {
		return this.cmp(other) < 0;
	}
	lte(other) {
		return this.cmp(other) <= 0;
	}
	gt(other) {
		return this.cmp(other) > 0;
	}
	gte(other) {
		return this.cmp(other) >= 0;
	}
	toNumber() {
		if (this.m === 0) return 0;
		if (this.e > 308) return this.m < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
		if (this.e < -308) return 0;
		return this.m * Math.pow(10, this.e);
	}
	toJSON() {
		return {
			m: this.m,
			e: this.e
		};
	}
	toSci(digits = 3) {
		if (this.m === 0) return "0";
		const d = Math.max(0, digits);
		return `${this.m.toFixed(d)}e${this.e}`;
	}
	toSuffix(digits = 2) {
		return formatSuffix(this, digits);
	}
	toString() {
		return this.toSuffix();
	}
};
var SUFFIXES = [
	"",
	"K",
	"M",
	"B",
	"T",
	"Qa",
	"Qi",
	"Sx",
	"Sp",
	"Oc",
	"No",
	"Dc",
	"Ud",
	"Dd",
	"Td",
	"Qad",
	"Qid",
	"Sxd",
	"Spd",
	"Ocd",
	"Nod",
	"Vg",
	"UVg",
	"DVg",
	"TVg",
	"QaVg",
	"QiVg",
	"SxVg",
	"SpVg",
	"OcVg",
	"NoVg",
	"Tg"
];
function formatSuffix(value, digits = 2) {
	if (value.m === 0) return "0";
	const sign = value.m < 0 ? "-" : "";
	const abs = value.abs();
	if (abs.e < 3) {
		const n = abs.toNumber();
		if (n < 10) return sign + (Number.isInteger(n) ? String(n) : n.toFixed(Math.min(2, digits)));
		if (n < 100) return sign + (Number.isInteger(n) ? String(n) : n.toFixed(1));
		return sign + Math.floor(n).toLocaleString("en-US");
	}
	const group = Math.floor(abs.e / 3);
	if (group >= SUFFIXES.length) return sign + abs.toSci(Math.max(2, digits));
	const rem = abs.e - group * 3;
	const shown = abs.m * Math.pow(10, rem);
	const suffix = SUFFIXES[group];
	let body;
	if (shown >= 100) body = shown.toFixed(0);
	else if (shown >= 10) body = shown.toFixed(Math.min(1, digits));
	else body = shown.toFixed(Math.min(2, digits));
	body = body.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
	return sign + body + suffix;
}
function formatRate(value) {
	return `${formatSuffix(value)}/s`;
}
var bn = BigNumber.from;
var TICK_DT = 1 / 15;
var SAVE_KEY = "astroforge.dyson.v1";
var SAVE_BACKUP_KEY = "astroforge.dyson.v1.bak";
var GENERATORS = [
	{
		id: "drone",
		name: "Mining Drone",
		blurb: "Autonomous prospector. Strips nickel-iron from near rocks.",
		resource: "ore",
		costResource: "ore",
		baseCost: 10,
		costMult: 1.15,
		baseProd: .6,
		unlock: { type: "start" }
	},
	{
		id: "harvester",
		name: "Asteroid Harvester",
		blurb: "Tugs entire chondrites into the foundry mouth.",
		resource: "ore",
		costResource: "ore",
		baseCost: 85,
		costMult: 1.14,
		baseProd: 4.5,
		unlock: {
			type: "generator",
			id: "drone",
			level: 8
		}
	},
	{
		id: "refinery",
		name: "Refinery Array",
		blurb: "Cracks bulk ore into lattice-perfect exo-alloy.",
		resource: "alloy",
		costResource: "ore",
		baseCost: 420,
		costMult: 1.13,
		baseProd: 1.4,
		unlock: {
			type: "research",
			id: "alloy-smelting"
		}
	},
	{
		id: "laser",
		name: "Orbital Laser",
		blurb: "Cuts high-grade veins from a silent geostationary perch.",
		resource: "alloy",
		costResource: "alloy",
		baseCost: 960,
		costMult: 1.13,
		baseProd: 9,
		unlock: {
			type: "research",
			id: "orbital-mechanics"
		}
	},
	{
		id: "siphon",
		name: "Fusion Siphon",
		blurb: "Skims coronal plasma and condenses it to usable flux.",
		resource: "energy",
		costResource: "alloy",
		baseCost: 4800,
		costMult: 1.12,
		baseProd: 12,
		unlock: {
			type: "research",
			id: "stellar-cartography"
		}
	},
	{
		id: "swarm",
		name: "Dyson Swarm Node",
		blurb: "A mirror-sat that drinks starlight and routes it home.",
		resource: "energy",
		costResource: "energy",
		baseCost: 36e3,
		costMult: 1.12,
		baseProd: 95,
		unlock: {
			type: "research",
			id: "dyson-blueprint"
		}
	},
	{
		id: "forge",
		name: "Stellar Forge",
		blurb: "Matter-works suspended in the photosphere.",
		resource: "energy",
		costResource: "energy",
		baseCost: 52e4,
		costMult: 1.11,
		baseProd: 880,
		unlock: {
			type: "research",
			id: "photospheric-foundry"
		}
	},
	{
		id: "quantum",
		name: "Quantum Array",
		blurb: "Harvests vacuum fluctuation along a closed timelike loop.",
		resource: "energy",
		costResource: "energy",
		baseCost: 84e5,
		costMult: 1.11,
		baseProd: 9200,
		unlock: {
			type: "research",
			id: "quantum-lattice"
		}
	}
];
var RESEARCH = [
	{
		id: "drone-firmware",
		name: "Drone Firmware",
		blurb: "Smarter pathing. Mining Drones produce 50% more.",
		tier: 0,
		cost: {
			resource: "ore",
			amount: 25
		},
		requires: [],
		effect: {
			type: "mult",
			scope: { gen: "drone" },
			value: 1.5
		}
	},
	{
		id: "alloy-smelting",
		name: "Alloy Smelting",
		blurb: "Unlocks the Refinery Array.",
		tier: 1,
		cost: {
			resource: "ore",
			amount: 160
		},
		requires: ["drone-firmware"],
		effect: {
			type: "unlock",
			generatorId: "refinery"
		}
	},
	{
		id: "harvest-optics",
		name: "Harvest Optics",
		blurb: "Lidar veins. All ore generators ×2.",
		tier: 1,
		cost: {
			resource: "ore",
			amount: 220
		},
		requires: ["drone-firmware"],
		effect: {
			type: "mult",
			scope: "ore",
			value: 2
		}
	},
	{
		id: "orbital-mechanics",
		name: "Orbital Mechanics",
		blurb: "Unlocks the Orbital Laser.",
		tier: 2,
		cost: {
			resource: "alloy",
			amount: 80
		},
		requires: ["alloy-smelting"],
		effect: {
			type: "unlock",
			generatorId: "laser"
		}
	},
	{
		id: "flux-catalysis",
		name: "Flux Catalysis",
		blurb: "Alloy output ×2.",
		tier: 2,
		cost: {
			resource: "alloy",
			amount: 140
		},
		requires: ["alloy-smelting"],
		effect: {
			type: "mult",
			scope: "alloy",
			value: 2
		}
	},
	{
		id: "pulse-capacitors",
		name: "Pulse Capacitors",
		blurb: "Manual mining pulse ×3.",
		tier: 2,
		cost: {
			resource: "ore",
			amount: 900
		},
		requires: ["harvest-optics"],
		effect: {
			type: "click",
			value: 3
		}
	},
	{
		id: "stellar-cartography",
		name: "Stellar Cartography",
		blurb: "Maps safe corona lanes. Unlocks Fusion Siphon.",
		tier: 3,
		cost: {
			resource: "alloy",
			amount: 720
		},
		requires: ["orbital-mechanics"],
		effect: {
			type: "unlock",
			generatorId: "siphon"
		}
	},
	{
		id: "corona-taps",
		name: "Corona Taps",
		blurb: "Energy output ×2.",
		tier: 4,
		cost: {
			resource: "energy",
			amount: 2400
		},
		requires: ["stellar-cartography"],
		effect: {
			type: "mult",
			scope: "energy",
			value: 2
		}
	},
	{
		id: "dyson-blueprint",
		name: "Dyson Blueprint",
		blurb: "The protocol's core schematic. Unlocks Swarm Nodes.",
		tier: 4,
		cost: {
			resource: "energy",
			amount: 12e3
		},
		requires: ["stellar-cartography"],
		effect: {
			type: "unlock",
			generatorId: "swarm"
		}
	},
	{
		id: "swarm-lattice",
		name: "Swarm Lattice",
		blurb: "Tighter packing. Swarm Nodes ×2.",
		tier: 5,
		cost: {
			resource: "energy",
			amount: 8e4
		},
		requires: ["dyson-blueprint"],
		effect: {
			type: "mult",
			scope: { gen: "swarm" },
			value: 2
		}
	},
	{
		id: "photospheric-foundry",
		name: "Photospheric Foundry",
		blurb: "Unlocks the Stellar Forge.",
		tier: 5,
		cost: {
			resource: "energy",
			amount: 16e4
		},
		requires: ["dyson-blueprint"],
		effect: {
			type: "unlock",
			generatorId: "forge"
		}
	},
	{
		id: "temporal-dilators",
		name: "Temporal Dilators",
		blurb: "Offline catch-up cap +8 hours.",
		tier: 5,
		cost: {
			resource: "alloy",
			amount: 24e3
		},
		requires: ["flux-catalysis"],
		effect: {
			type: "offlineHours",
			value: 8
		}
	},
	{
		id: "quantum-lattice",
		name: "Quantum Lattice",
		blurb: "Unlocks the Quantum Array.",
		tier: 6,
		cost: {
			resource: "energy",
			amount: 22e5
		},
		requires: ["photospheric-foundry"],
		effect: {
			type: "unlock",
			generatorId: "quantum"
		}
	},
	{
		id: "harmonic-resonance",
		name: "Harmonic Resonance",
		blurb: "All production ×2.",
		tier: 6,
		cost: {
			resource: "energy",
			amount: 9e6
		},
		requires: ["swarm-lattice", "quantum-lattice"],
		effect: {
			type: "mult",
			scope: "all",
			value: 2
		}
	},
	{
		id: "protocol-key",
		name: "Protocol Key",
		blurb: "Final-run amplifier. All production ×3.",
		tier: 7,
		cost: {
			resource: "energy",
			amount: 8e7
		},
		requires: ["harmonic-resonance"],
		effect: {
			type: "mult",
			scope: "all",
			value: 3
		}
	}
];
var QUARK_UPGRADES = [
	{
		id: "yield",
		name: "Quantum Yield",
		blurb: "+20% all production per rank. Survives supernova.",
		baseCost: 1,
		costMult: 1.55,
		effect: {
			type: "mult",
			value: .2
		}
	},
	{
		id: "compression",
		name: "Cost Compression",
		blurb: "−5% generator costs per rank (multiplicative).",
		baseCost: 2,
		costMult: 1.7,
		effect: {
			type: "cost",
			value: .05
		},
		max: 12
	},
	{
		id: "chronometers",
		name: "Chronometers",
		blurb: "+3 hours offline cap per rank.",
		baseCost: 2,
		costMult: 1.65,
		effect: {
			type: "offlineHours",
			value: 3
		},
		max: 16
	},
	{
		id: "amplifiers",
		name: "Pulse Amplifiers",
		blurb: "+150% mining pulse per rank.",
		baseCost: 1,
		costMult: 1.5,
		effect: {
			type: "click",
			value: 1.5
		}
	},
	{
		id: "seed-cache",
		name: "Seed Cache",
		blurb: "Start each protocol with 25× more ore per rank.",
		baseCost: 3,
		costMult: 2,
		effect: {
			type: "startOre",
			value: 25
		},
		max: 10
	}
];
var GEN_BY_ID = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
var RESEARCH_BY_ID = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));
var QUARK_BY_ID = Object.fromEntries(QUARK_UPGRADES.map((q) => [q.id, q]));
var RESOURCE_META = {
	ore: {
		label: "Scrap Ore",
		short: "Ore",
		order: 0
	},
	alloy: {
		label: "Exo-Alloy",
		short: "Alloy",
		order: 1
	},
	energy: {
		label: "Stellar Energy",
		short: "Energy",
		order: 2
	},
	quarks: {
		label: "Quarks",
		short: "Quarks",
		order: 3
	}
};
function emptyRates() {
	return {
		ore: BigNumber.ZERO,
		alloy: BigNumber.ZERO,
		energy: BigNumber.ZERO
	};
}
function createInitialState(now = Date.now()) {
	return {
		version: 1,
		resources: {
			ore: BigNumber.ZERO,
			alloy: BigNumber.ZERO,
			energy: BigNumber.ZERO,
			quarks: BigNumber.ZERO
		},
		lifetime: {
			ore: BigNumber.ZERO,
			alloy: BigNumber.ZERO,
			energy: BigNumber.ZERO
		},
		generators: {},
		research: {},
		quarkUpgrades: {},
		quarksEarned: BigNumber.ZERO,
		stats: {
			totalClicks: 0,
			prestiges: 0,
			startedAt: now,
			playTimeSec: 0,
			totalSpentOre: BigNumber.ZERO,
			biggestPulse: BigNumber.ZERO
		},
		lastActiveAt: now,
		checksum: ""
	};
}
/**
* Geometric cost of `count` purchases starting at `level`:
* Cost = Σ_{i=0}^{n-1} base × r^{level+i}
*      = base × r^level × (r^n − 1) / (r − 1)
*/
function geometricSum(baseCost, costMult, level, count) {
	if (count <= 0) return BigNumber.ZERO;
	const first = baseCost.mul(BigNumber.from(costMult).pow(level));
	if (count === 1) return first;
	if (Math.abs(costMult - 1) < 1e-12) return first.mulNum(count);
	const rn = BigNumber.from(costMult).pow(count);
	return first.mul(rn.sub(BigNumber.ONE)).divNum(costMult - 1);
}
/**
* Largest n such that geometricSum(...) ≤ money. Closed-form logarithm plus a
* two-step correction for floating-point edge error. O(1).
*/
function maxAffordable(money, baseCost, costMult, level, limit = 1e9) {
	if (money.m <= 0) return 0;
	const first = baseCost.mul(BigNumber.from(costMult).pow(level));
	if (money.lt(first)) return 0;
	if (Math.abs(costMult - 1) < 1e-12) {
		const n = Math.floor(money.div(first).toNumber());
		return Math.max(0, Math.min(limit, Number.isFinite(n) ? n : limit));
	}
	const inner = money.mulNum(costMult - 1).div(first).add(BigNumber.ONE);
	if (inner.lte(BigNumber.ZERO)) return 0;
	const raw = inner.log10() / Math.log10(costMult);
	let count = Math.floor(raw);
	if (!Number.isFinite(count) || count < 0) count = 0;
	if (count > limit) count = limit;
	while (count > 0 && geometricSum(baseCost, costMult, level, count).gt(money)) count--;
	while (count < limit && geometricSum(baseCost, costMult, level, count + 1).lte(money)) count++;
	return count;
}
/** Cost = BaseCost × (CostMultiplier)^Level  (single next unit). */
function nextCost(baseCost, costMult, level) {
	return baseCost.mul(BigNumber.from(costMult).pow(level));
}
/**
* Quarks = ⌊ 1000 × (TotalLifetimeEnergy / 10^12)^0.5 ⌋
*/
function quarksFromLifetimeEnergy(lifetimeEnergy) {
	if (lifetimeEnergy.m <= 0) return BigNumber.ZERO;
	return lifetimeEnergy.div(new BigNumber(1, 12)).sqrt().mulNum(1e3).floor();
}
/** Energy required to reach `target` total earned quarks (inverse of the prestige curve). */
function energyForQuarks(target) {
	if (target.m <= 0) return BigNumber.ZERO;
	const q = target.divNum(1e3);
	return q.mul(q).mul(new BigNumber(1, 12));
}
var MILESTONE_FIRST = 10;
var MILESTONE_SECOND = 25;
var MILESTONE_STEP = 25;
function milestoneCount(level) {
	if (level < MILESTONE_FIRST) return 0;
	if (level < MILESTONE_SECOND) return 1;
	return 2 + Math.floor((level - MILESTONE_SECOND) / MILESTONE_STEP);
}
function milestoneMultiplier(level) {
	return 2 ** milestoneCount(level);
}
function nextMilestone(level) {
	if (level < MILESTONE_FIRST) return MILESTONE_FIRST;
	if (level < MILESTONE_SECOND) return MILESTONE_SECOND;
	return MILESTONE_SECOND + (Math.floor((level - MILESTONE_SECOND) / MILESTONE_STEP) + 1) * MILESTONE_STEP;
}
function generatorLevel(state, id) {
	return state.generators[id] ?? 0;
}
function isResearchOwned(state, id) {
	return Boolean(state.research[id]);
}
function isGeneratorUnlocked(state, def) {
	const u = def.unlock;
	if (u.type === "start") return true;
	if (u.type === "generator") return generatorLevel(state, u.id) >= u.level;
	return isResearchOwned(state, u.id);
}
function isResearchAvailable(state, id) {
	if (isResearchOwned(state, id)) return false;
	const def = RESEARCH_BY_ID[id];
	if (!def) return false;
	return def.requires.every((req) => isResearchOwned(state, req));
}
function quarkLevel(state, id) {
	return state.quarkUpgrades[id] ?? 0;
}
function productionMultiplier(state) {
	let all = 1;
	let ore = 1;
	let alloy = 1;
	let energy = 1;
	const gens = {};
	let click = 1;
	let costFactor = 1;
	let offlineHours = 4;
	let startOre = bn(0);
	for (const def of RESEARCH) {
		if (!isResearchOwned(state, def.id)) continue;
		const e = def.effect;
		if (e.type === "mult") {
			if (e.scope === "all") all *= e.value;
			else if (e.scope === "ore") ore *= e.value;
			else if (e.scope === "alloy") alloy *= e.value;
			else if (e.scope === "energy") energy *= e.value;
			else gens[e.scope.gen] = (gens[e.scope.gen] ?? 1) * e.value;
		} else if (e.type === "click") click *= e.value;
		else if (e.type === "offlineHours") offlineHours += e.value;
	}
	for (const def of QUARK_UPGRADES) {
		const lv = quarkLevel(state, def.id);
		if (lv <= 0) continue;
		const e = def.effect;
		if (e.type === "mult") all *= 1 + e.value * lv;
		else if (e.type === "cost") costFactor *= (1 - e.value) ** lv;
		else if (e.type === "offlineHours") offlineHours += e.value * lv;
		else if (e.type === "click") click *= 1 + e.value * lv;
		else if (e.type === "startOre") startOre = bn(e.value).pow(lv);
	}
	if (costFactor < .4) costFactor = .4;
	if (offlineHours > 72) offlineHours = 72;
	return {
		all,
		ore,
		alloy,
		energy,
		gens,
		click,
		costFactor,
		offlineHours,
		startOre
	};
}
function computeRates(state) {
	const m = productionMultiplier(state);
	const rates = emptyRates();
	for (const def of GENERATORS) {
		const level = generatorLevel(state, def.id);
		if (level <= 0) continue;
		const genMult = (m.gens[def.id] ?? 1) * milestoneMultiplier(level);
		const resMult = def.resource === "ore" ? m.ore : def.resource === "alloy" ? m.alloy : m.energy;
		const rate = bn(def.baseProd).mulNum(level).mulNum(genMult * resMult * m.all);
		rates[def.resource] = rates[def.resource].add(rate);
	}
	return rates;
}
function pulsePower(state) {
	const m = productionMultiplier(state);
	return bn(1).mulNum(m.click);
}
function costFactor(state) {
	return productionMultiplier(state).costFactor;
}
function scaledBaseCost(state, def) {
	return bn(def.baseCost).mulNum(costFactor(state));
}
function generatorNextCost(state, def) {
	return nextCost(scaledBaseCost(state, def), def.costMult, generatorLevel(state, def.id));
}
function buyCountForMode(state, def, mode) {
	const money = state.resources[def.costResource];
	const base = scaledBaseCost(state, def);
	const level = generatorLevel(state, def.id);
	if (mode === "max") return maxAffordable(money, base, def.costMult, level);
	const n = mode;
	return geometricSum(base, def.costMult, level, n).lte(money) ? n : 0;
}
function buyCost(state, def, count) {
	if (count <= 0) return BigNumber.ZERO;
	return geometricSum(scaledBaseCost(state, def), def.costMult, generatorLevel(state, def.id), count);
}
function applyTick(state, dt) {
	if (dt <= 0) return;
	const rates = computeRates(state);
	credit(state, "ore", rates.ore.mulNum(dt));
	credit(state, "alloy", rates.alloy.mulNum(dt));
	credit(state, "energy", rates.energy.mulNum(dt));
	state.stats.playTimeSec += dt;
}
function credit(state, resource, amount) {
	if (amount.m <= 0) return;
	state.resources[resource] = state.resources[resource].add(amount);
	state.lifetime[resource] = state.lifetime[resource].add(amount);
}
function applyPulse(state) {
	const amount = pulsePower(state);
	credit(state, "ore", amount);
	state.stats.totalClicks += 1;
	if (amount.gt(state.stats.biggestPulse)) state.stats.biggestPulse = amount;
	return amount;
}
function applyBuyGenerator(state, id, mode) {
	const def = GEN_BY_ID[id];
	if (!def || !isGeneratorUnlocked(state, def)) return false;
	const count = buyCountForMode(state, def, mode);
	if (count <= 0) return false;
	const cost = buyCost(state, def, count);
	const res = def.costResource;
	if (state.resources[res].lt(cost)) return false;
	state.resources[res] = state.resources[res].sub(cost);
	if (res === "ore") state.stats.totalSpentOre = state.stats.totalSpentOre.add(cost);
	state.generators[id] = generatorLevel(state, id) + count;
	return true;
}
function applyBuyResearch(state, id) {
	const def = RESEARCH_BY_ID[id];
	if (!def || !isResearchAvailable(state, id)) return false;
	const have = state.resources[def.cost.resource];
	const cost = bn(def.cost.amount);
	if (have.lt(cost)) return false;
	state.resources[def.cost.resource] = have.sub(cost);
	state.research[id] = true;
	return true;
}
function quarkUpgradeCost(state, id) {
	const def = QUARK_BY_ID[id];
	if (!def) return BigNumber.ZERO;
	return bn(def.baseCost).mul(bn(def.costMult).pow(quarkLevel(state, id)));
}
function applyBuyQuark(state, id) {
	const def = QUARK_BY_ID[id];
	if (!def) return false;
	const lv = quarkLevel(state, id);
	if (def.max !== void 0 && lv >= def.max) return false;
	const cost = quarkUpgradeCost(state, id);
	if (state.resources.quarks.lt(cost)) return false;
	state.resources.quarks = state.resources.quarks.sub(cost);
	state.quarkUpgrades[id] = lv + 1;
	return true;
}
function pendingQuarks(state) {
	const extra = quarksFromLifetimeEnergy(state.lifetime.energy).sub(state.quarksEarned);
	return extra.m > 0 ? extra : BigNumber.ZERO;
}
function nextQuarkEnergy(state) {
	return energyForQuarks(state.quarksEarned.add(pendingQuarks(state)).add(BigNumber.ONE));
}
function canPrestige(state) {
	return pendingQuarks(state).gte(BigNumber.ONE);
}
function applyPrestige(state) {
	const gain = pendingQuarks(state);
	if (gain.lt(BigNumber.ONE)) return false;
	const quarks = state.resources.quarks.add(gain);
	const quarksEarned = state.quarksEarned.add(gain);
	const quarkUpgrades = { ...state.quarkUpgrades };
	const lifetime = { ...state.lifetime };
	const stats = {
		...state.stats,
		prestiges: state.stats.prestiges + 1,
		totalClicks: 0
	};
	const next = createInitialState(Date.now());
	next.resources.quarks = quarks;
	next.quarksEarned = quarksEarned;
	next.quarkUpgrades = quarkUpgrades;
	next.lifetime = lifetime;
	next.stats = {
		...next.stats,
		prestiges: stats.prestiges,
		startedAt: state.stats.startedAt,
		playTimeSec: state.stats.playTimeSec,
		totalSpentOre: state.stats.totalSpentOre,
		biggestPulse: state.stats.biggestPulse
	};
	const seed = productionMultiplier(next).startOre;
	if (seed.gt(BigNumber.ZERO)) {
		next.resources.ore = seed;
		next.lifetime.ore = lifetime.ore.add(seed);
	}
	Object.assign(state, next);
	return true;
}
function dysonProgress(state) {
	const swarm = generatorLevel(state, "swarm");
	const forge = generatorLevel(state, "forge");
	const quantum = generatorLevel(state, "quantum");
	const weight = swarm + forge * 1.6 + quantum * 3;
	return 1 - Math.exp(-weight / 70);
}
function researchOwnedCount(state) {
	let n = 0;
	for (const def of RESEARCH) if (isResearchOwned(state, def.id)) n++;
	return n;
}
/**
* djb2 of canonical fields. Not cryptographic — the browser is untrusted —
* but a mismatch plus a rewound clock is a strong signal to skip catch-up.
*/
function computeChecksum(state) {
	const payload = [
		state.version,
		state.resources.ore.toSci(6),
		state.resources.alloy.toSci(6),
		state.resources.energy.toSci(6),
		state.resources.quarks.toSci(6),
		state.lifetime.energy.toSci(6),
		state.stats.prestiges,
		state.lastActiveAt
	].join("|");
	let h = 5381;
	for (let i = 0; i < payload.length; i++) h = (h << 5) + h ^ payload.charCodeAt(i);
	return (h >>> 0).toString(16);
}
function sealState(state, now = Date.now()) {
	state.lastActiveAt = now;
	state.checksum = computeChecksum(state);
	return state;
}
function checksumMatches(state) {
	return state.checksum === computeChecksum(state);
}
/**
* Analytical catch-up. Production is a closed form (rate × Δt) because
* generators do not consume inputs. No per-tick loop over missed hours.
*/
function applyOfflineCatchUp(state, now = Date.now()) {
	const checksumFailed = !checksumMatches(state);
	const rawDeltaMs = now - (state.lastActiveAt || now);
	let clockAnomaly = false;
	if (rawDeltaMs < -2e3) clockAnomaly = true;
	const maxMs = Math.min(productionMultiplier(state).offlineHours, 72) * 3600 * 1e3;
	const uncappedSec = clockAnomaly ? 0 : Math.max(0, rawDeltaMs / 1e3);
	const cappedSeconds = Math.min(uncappedSec, maxMs / 1e3);
	const capped = uncappedSec > cappedSeconds + 1;
	const dysonBefore = dysonProgress(state);
	const beforeOre = state.resources.ore;
	const beforeAlloy = state.resources.alloy;
	const beforeEnergy = state.resources.energy;
	if (cappedSeconds > 0 && !checksumFailed && !clockAnomaly) applyTick(state, cappedSeconds);
	state.lastActiveAt = now;
	state.checksum = computeChecksum(state);
	if (cappedSeconds < 30) return null;
	return {
		secondsAway: clockAnomaly ? 0 : uncappedSec,
		cappedSeconds,
		capped,
		clockAnomaly,
		checksumFailed,
		gained: {
			ore: checksumFailed || clockAnomaly ? BigNumber.ZERO : state.resources.ore.sub(beforeOre),
			alloy: checksumFailed || clockAnomaly ? BigNumber.ZERO : state.resources.alloy.sub(beforeAlloy),
			energy: checksumFailed || clockAnomaly ? BigNumber.ZERO : state.resources.energy.sub(beforeEnergy)
		},
		dysonBefore,
		dysonAfter: dysonProgress(state)
	};
}
function formatDuration(totalSec) {
	const s = Math.max(0, Math.floor(totalSec));
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = s % 60;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${sec}s`;
	return `${sec}s`;
}
function bnField(raw) {
	return BigNumber.fromJSON(raw);
}
function migrate(raw) {
	const p = { ...raw };
	if (!p.version || p.version < 1) p.version = 1;
	return p;
}
function serializeState(state) {
	return {
		version: state.version,
		resources: {
			ore: state.resources.ore.toJSON(),
			alloy: state.resources.alloy.toJSON(),
			energy: state.resources.energy.toJSON(),
			quarks: state.resources.quarks.toJSON()
		},
		lifetime: {
			ore: state.lifetime.ore.toJSON(),
			alloy: state.lifetime.alloy.toJSON(),
			energy: state.lifetime.energy.toJSON()
		},
		generators: { ...state.generators },
		research: { ...state.research },
		quarkUpgrades: { ...state.quarkUpgrades },
		quarksEarned: state.quarksEarned.toJSON(),
		stats: {
			totalClicks: state.stats.totalClicks,
			prestiges: state.stats.prestiges,
			startedAt: state.stats.startedAt,
			playTimeSec: state.stats.playTimeSec,
			totalSpentOre: state.stats.totalSpentOre.toJSON(),
			biggestPulse: state.stats.biggestPulse.toJSON()
		},
		lastActiveAt: state.lastActiveAt,
		checksum: state.checksum
	};
}
function deserializeState(raw) {
	const p = migrate(raw);
	return {
		...createInitialState(p.stats?.startedAt ?? Date.now()),
		version: 1,
		resources: {
			ore: bnField(p.resources?.ore),
			alloy: bnField(p.resources?.alloy),
			energy: bnField(p.resources?.energy),
			quarks: bnField(p.resources?.quarks)
		},
		lifetime: {
			ore: bnField(p.lifetime?.ore),
			alloy: bnField(p.lifetime?.alloy),
			energy: bnField(p.lifetime?.energy)
		},
		generators: p.generators ?? {},
		research: p.research ?? {},
		quarkUpgrades: p.quarkUpgrades ?? {},
		quarksEarned: bnField(p.quarksEarned),
		stats: {
			totalClicks: p.stats?.totalClicks ?? 0,
			prestiges: p.stats?.prestiges ?? 0,
			startedAt: p.stats?.startedAt ?? Date.now(),
			playTimeSec: p.stats?.playTimeSec ?? 0,
			totalSpentOre: bnField(p.stats?.totalSpentOre),
			biggestPulse: bnField(p.stats?.biggestPulse)
		},
		lastActiveAt: p.lastActiveAt ?? Date.now(),
		checksum: p.checksum ?? ""
	};
}
function saveState(state) {
	if (typeof localStorage === "undefined") return false;
	try {
		sealState(state);
		const json = JSON.stringify(serializeState(state));
		const previous = localStorage.getItem(SAVE_KEY);
		if (previous) localStorage.setItem(SAVE_BACKUP_KEY, previous);
		localStorage.setItem(SAVE_KEY, json);
		return true;
	} catch {
		return false;
	}
}
function loadState() {
	if (typeof localStorage === "undefined") return null;
	const tryParse = (key) => {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		try {
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== "object") return null;
			return deserializeState(parsed);
		} catch {
			return null;
		}
	};
	return tryParse("astroforge.dyson.v1") ?? tryParse("astroforge.dyson.v1.bak");
}
function clearSave() {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.removeItem(SAVE_KEY);
		localStorage.removeItem(SAVE_BACKUP_KEY);
	} catch {}
}
function exportSave(state) {
	sealState(state);
	const json = JSON.stringify(serializeState(state));
	return btoa(unescape(encodeURIComponent(json)));
}
function importSave(payload) {
	try {
		const json = decodeURIComponent(escape(atob(payload.trim())));
		const state = deserializeState(JSON.parse(json));
		if (!state.checksum) state.checksum = computeChecksum(state);
		return state;
	} catch {
		return null;
	}
}
var MAX_FRAME_DT = .1;
var UI_DT = 1 / 10;
/**
* Decoupled sim/render loop.
* - Simulation steps at 15 Hz on a rAF accumulator (never setInterval).
* - UI subscribers are throttled to ~10 Hz so React does not thrash.
* - Visibility pause records a timestamp; resume uses closed-form catch-up.
*/
var GameEngine = class GameEngine {
	state;
	acc = 0;
	lastPerf = 0;
	raf = 0;
	running = false;
	uiAcc = 0;
	saveAcc = 0;
	listeners = /* @__PURE__ */ new Set();
	lastPulse = 0;
	lastBought = false;
	reducedMotion = false;
	constructor(state) {
		this.state = state;
	}
	static boot() {
		const loaded = loadState();
		const state = loaded ?? createInitialState();
		const engine = new GameEngine(state);
		const offline = loaded ? applyOfflineCatchUp(state) : null;
		if (!loaded) sealState(state);
		saveState(state);
		return {
			engine,
			offline
		};
	}
	getState() {
		return this.state;
	}
	subscribe(fn) {
		this.listeners.add(fn);
		fn(this.state, {
			pulse: 0,
			bought: false
		});
		return () => {
			this.listeners.delete(fn);
		};
	}
	start() {
		if (this.running) return;
		this.running = true;
		this.acc = 0;
		this.uiAcc = 0;
		this.lastPerf = performance.now();
		const loop = (now) => {
			if (!this.running) return;
			let dt = (now - this.lastPerf) / 1e3;
			this.lastPerf = now;
			if (dt > MAX_FRAME_DT) dt = MAX_FRAME_DT;
			if (dt < 0) dt = 0;
			this.step(dt);
			this.raf = requestAnimationFrame(loop);
		};
		this.raf = requestAnimationFrame(loop);
	}
	stop() {
		this.running = false;
		if (this.raf) cancelAnimationFrame(this.raf);
		this.raf = 0;
		sealState(this.state);
		saveState(this.state);
	}
	setReducedMotion(value) {
		this.reducedMotion = value;
	}
	isReducedMotion() {
		return this.reducedMotion;
	}
	dispatch(intent) {
		let changed = false;
		this.lastPulse = 0;
		this.lastBought = false;
		switch (intent.type) {
			case "pulse": {
				const amt = applyPulse(this.state);
				this.lastPulse = amt.toNumber();
				changed = true;
				break;
			}
			case "buyGenerator":
				changed = applyBuyGenerator(this.state, intent.id, intent.mode);
				this.lastBought = changed;
				break;
			case "buyResearch":
				changed = applyBuyResearch(this.state, intent.id);
				this.lastBought = changed;
				break;
			case "buyQuark":
				changed = applyBuyQuark(this.state, intent.id);
				this.lastBought = changed;
				break;
			case "prestige":
				changed = applyPrestige(this.state);
				this.lastBought = changed;
				if (changed) saveState(this.state);
				break;
			case "importState":
				this.state = intent.state;
				changed = true;
				saveState(this.state);
		}
		if (changed) this.emit(true);
		return changed;
	}
	handleVisibility(hidden) {
		if (hidden) {
			this.stop();
			return null;
		}
		const offline = applyOfflineCatchUp(this.state);
		this.start();
		if (offline) this.emit(true);
		return offline;
	}
	step(dt) {
		this.acc += dt;
		this.uiAcc += dt;
		this.saveAcc += dt;
		let simmed = false;
		while (this.acc >= TICK_DT) {
			applyTick(this.state, TICK_DT);
			this.acc -= TICK_DT;
			simmed = true;
		}
		if (this.uiAcc >= UI_DT && simmed) {
			this.uiAcc = 0;
			this.emit(false);
		}
		if (this.saveAcc >= 30) {
			this.saveAcc = 0;
			sealState(this.state);
			saveState(this.state);
		}
	}
	emit(force) {
		const pulse = this.lastPulse;
		const bought = this.lastBought;
		this.lastPulse = 0;
		this.lastBought = false;
		for (const fn of this.listeners) fn(this.state, {
			pulse,
			bought
		});
	}
};
function bindLifecycle(engine, onOffline) {
	const vis = () => {
		const hidden = document.visibilityState === "hidden";
		const result = engine.handleVisibility(hidden);
		if (!hidden) onOffline(result);
	};
	const hide = () => {
		engine.stop();
	};
	document.addEventListener("visibilitychange", vis);
	window.addEventListener("pagehide", hide);
	window.addEventListener("beforeunload", hide);
	engine.start();
	return () => {
		document.removeEventListener("visibilitychange", vis);
		window.removeEventListener("pagehide", hide);
		window.removeEventListener("beforeunload", hide);
		engine.stop();
	};
}
var GEN_ICON = {
	drone: Bot,
	harvester: Container,
	refinery: Factory,
	laser: Aperture,
	siphon: Waves,
	swarm: Hexagon,
	forge: Sun,
	quantum: Atom
};
function resLabel(id) {
	return RESOURCE_META[id].short;
}
function MilestoneBar({ level }) {
	const next = nextMilestone(level);
	const prev = next === 10 ? 0 : next === 25 ? 10 : next - 25;
	const span = Math.max(1, next - prev);
	const t = Math.min(1, (level - prev) / span);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between text-xs text-subtle",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["×", milestoneMultiplier(level)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
				level,
				"/",
				next
			] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 h-1 overflow-hidden rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full rounded-full bg-accent transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
				style: { width: `${t * 100}%` }
			})
		})]
	});
}
var GeneratorRow = (0, import_react.memo)(function GeneratorRow({ def, state, mode, rate, onBuy }) {
	const unlocked = isGeneratorUnlocked(state, def);
	const level = generatorLevel(state, def.id);
	const count = unlocked ? buyCountForMode(state, def, mode) : 0;
	const cost = count > 0 ? buyCost(state, def, count) : generatorNextCost(state, def);
	const affordable = count > 0;
	const Icon = GEN_ICON[def.id] ?? Hexagon;
	const shown = mode === "max" ? Math.max(1, count) : mode;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("rounded-xl border border-border bg-surface p-4", !unlocked && "opacity-60"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-accent",
				children: unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "size-4",
					strokeWidth: 1.75
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4 text-muted" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-base font-semibold tracking-tight",
							children: def.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular text-xs text-muted",
							children: ["Lv ", level]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-sm text-muted",
						children: def.blurb
					}),
					unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 tabular text-sm text-fg",
						children: [
							resLabel(def.resource),
							" ",
							formatRate(rate)
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-subtle",
						children: unlockHint(def)
					}),
					unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MilestoneBar, { level }) : null
				]
			})]
		}), unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "mt-3 w-full",
			variant: affordable ? "primary" : "secondary",
			disabled: !affordable,
			onClick: () => onBuy(def.id),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Buy ", mode === "max" ? count || 1 : shown] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "tabular opacity-80",
				children: [
					formatSuffix(cost),
					" ",
					resLabel(def.costResource)
				]
			})]
		}) : null]
	});
});
function unlockHint(def) {
	const u = def.unlock;
	if (u.type === "start") return "Available";
	if (u.type === "generator") return `Requires ${GEN_BY_ID[u.id]?.name ?? u.id} Lv ${u.level}`;
	return `Requires ${RESEARCH.find((r) => r.id === u.id)?.name ?? u.id}`;
}
function ForgePanel({ state, rates, mode, onBuy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: GENERATORS.map((def) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeneratorRow, {
			def,
			state,
			mode,
			rate: rates[def.id] ?? BigNumber.ZERO,
			onBuy
		}, def.id))
	});
}
function ResearchPanel({ state, onBuy }) {
	const groups = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const r of RESEARCH) {
			const list = map.get(r.tier) ?? [];
			list.push(r);
			map.set(r.tier, list);
		}
		return [...map.entries()].sort((a, b) => a[0] - b[0]);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [
				researchOwnedCount(state),
				" / ",
				RESEARCH.length,
				" protocols compiled"
			]
		}), groups.map(([tier, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex flex-col gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "text-xs font-medium tracking-wide text-subtle uppercase",
				children: ["Tier ", tier]
			}), items.map((def) => {
				const owned = isResearchOwned(state, def.id);
				const avail = isResearchAvailable(state, def.id);
				const cost = BigNumber.from(def.cost.amount);
				const can = avail && state.resources[def.cost.resource].gte(cost);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: cn("rounded-xl border border-border bg-surface p-4", owned && "border-accent/30", !owned && !avail && "opacity-55"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-display font-semibold tracking-tight",
								children: def.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: def.blurb
							}),
							!owned && !avail && def.requires.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-subtle",
								children: ["Requires ", def.requires.map((id) => RESEARCH.find((r) => r.id === id)?.name ?? id).join(", ")]
							}) : null
						] }), owned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 rounded-full bg-surface-2 px-2 py-1 text-xs text-accent",
							children: "Owned"
						}) : null]
					}), !owned && avail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-3 w-full",
						variant: can ? "primary" : "secondary",
						disabled: !can,
						onClick: () => onBuy(def.id),
						children: ["Compile", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular opacity-80",
							children: [
								formatSuffix(cost),
								" ",
								resLabel(def.cost.resource)
							]
						})]
					}) : null]
				}, def.id);
			})]
		}, tier))]
	});
}
var DYSON_BEATS = [
	{
		at: 0,
		line: "No swarm. The star burns unclaimed."
	},
	{
		at: .08,
		line: "First mirrors catch a thin rind of light."
	},
	{
		at: .25,
		line: "A broken necklace of nodes. Power trickles in."
	},
	{
		at: .5,
		line: "Lattice closing. Photosphere dimming at the poles."
	},
	{
		at: .78,
		line: "The swarm sings. Night-side stations run at surplus."
	},
	{
		at: .95,
		line: "Protocol complete. The star is an instrument."
	}
];
function SwarmPanel({ state, rates, mode, onBuy }) {
	const p = dysonProgress(state);
	const beat = [...DYSON_BEATS].reverse().find((b) => p >= b.at) ?? DYSON_BEATS[0];
	const energyGens = GENERATORS.filter((g) => g.resource === "energy");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "rounded-xl border border-border bg-surface p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display font-semibold tracking-tight",
						children: "Swarm integrity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular text-sm text-accent",
						children: [Math.round(p * 100), "%"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 h-2 overflow-hidden rounded-full bg-surface-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full rounded-full bg-accent transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
						style: { width: `${p * 100}%` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: beat.line
				})
			]
		}), energyGens.map((def) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeneratorRow, {
			def,
			state,
			mode,
			rate: rates[def.id] ?? BigNumber.ZERO,
			onBuy
		}, def.id))]
	});
}
function ProtocolPanel({ state, onQuark, onPrestige }) {
	const pending = pendingQuarks(state);
	const ready = canPrestige(state);
	const nextE = nextQuarkEnergy(state);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl border border-border bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg font-semibold tracking-tight",
						children: "Supernova Reset"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Collapse the current protocol. Generators and research revert. Lifetime energy and quark artifacts remain."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid grid-cols-2 gap-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-subtle",
								children: "Lifetime energy"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular font-medium",
								children: formatSuffix(state.lifetime.energy)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-subtle",
								children: "Pending quarks"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular font-medium text-accent",
								children: formatSuffix(pending)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-subtle",
								children: "Held quarks"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular font-medium",
								children: formatSuffix(state.resources.quarks)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-subtle",
								children: "Next quark at"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "tabular font-medium",
								children: formatSuffix(nextE)
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 w-full",
						variant: ready ? "danger" : "secondary",
						disabled: !ready,
						onClick: onPrestige,
						children: ready ? `Ignite supernova  ·  +${formatSuffix(pending)} quarks` : "Insufficient stellar yield"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs font-medium tracking-wide text-subtle uppercase",
				children: "Quantum artifacts"
			}),
			QUARK_UPGRADES.map((def) => {
				const lv = quarkLevel(state, def.id);
				const maxed = def.max !== void 0 && lv >= def.max;
				const cost = quarkUpgradeCost(state, def.id);
				const can = !maxed && state.resources.quarks.gte(cost);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl border border-border bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-display font-semibold tracking-tight",
								children: def.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular text-xs text-muted",
								children: [
									"Rank ",
									lv,
									def.max ? `/${def.max}` : ""
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: def.blurb
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "mt-3 w-full",
							variant: can ? "primary" : "secondary",
							disabled: !can,
							onClick: () => onQuark(def.id),
							children: [maxed ? "Capped" : "Install", !maxed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular opacity-80",
								children: [formatSuffix(cost), " Q"]
							}) : null]
						})
					]
				}, def.id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl border border-border bg-surface p-4 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display font-semibold tracking-tight",
					children: "Lifetime"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-3 grid grid-cols-2 gap-2 text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Prestiges ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular text-fg",
							children: state.stats.prestiges
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Pulses ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular text-fg",
							children: state.stats.totalClicks
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Ore mined ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular text-fg",
							children: formatSuffix(state.lifetime.ore)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Alloy forged ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular text-fg",
							children: formatSuffix(state.lifetime.alloy)
						})] })
					]
				})]
			})
		]
	});
}
var BUY_MODES = [
	1,
	10,
	100,
	"max"
];
var ctx = null;
var master = null;
var sfx = null;
var music = null;
var muted = false;
var padStarted = false;
var lastPulseAt = 0;
function ensure() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		music = ctx.createGain();
		sfx.gain.value = .7;
		music.gain.value = .18;
		master.gain.value = muted ? 0 : .85;
		sfx.connect(master);
		music.connect(master);
		master.connect(ctx.destination);
	}
	return ctx;
}
function ramp(node, value, time = .03) {
	if (!ctx) return;
	node.gain.setTargetAtTime(value, ctx.currentTime, time);
}
function envTone(freq, dur, type, gain = .12, bus = sfx, slide) {
	if (!ctx || !bus || muted) return;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = type;
	osc.frequency.value = freq;
	if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), ctx.currentTime + dur);
	const t = ctx.currentTime;
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(gain, t + .012);
	g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
	osc.connect(g);
	g.connect(bus);
	osc.start(t);
	osc.stop(t + dur + .02);
	osc.onended = () => {
		osc.disconnect();
		g.disconnect();
	};
}
function noiseBurst(dur, gain = .04) {
	if (!ctx || !sfx || muted) return;
	const n = 2 * ctx.sampleRate * dur;
	const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
	const src = ctx.createBufferSource();
	const g = ctx.createGain();
	const filter = ctx.createBiquadFilter();
	filter.type = "highpass";
	filter.frequency.value = 900;
	src.buffer = buffer;
	const t = ctx.currentTime;
	g.gain.setValueAtTime(gain, t);
	g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
	src.connect(filter);
	filter.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + dur + .02);
}
function startPad() {
	if (!ctx || !music || padStarted || muted) return;
	padStarted = true;
	const make = (freq, type, detune) => {
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		osc.detune.value = detune;
		g.gain.value = .07;
		osc.connect(g);
		g.connect(music);
		osc.start();
	};
	make(55, "sine", 0);
	make(82.4, "sine", 6);
	make(110, "triangle", -4);
}
function resume() {
	const c = ensure();
	if (!c) return;
	if (c.state === "suspended") c.resume();
	if (!muted) startPad();
}
var audio = {
	unlock() {
		resume();
	},
	setMuted(value) {
		muted = value;
		if (typeof localStorage !== "undefined") try {
			localStorage.setItem("astroforge.muted", value ? "1" : "0");
		} catch {}
		if (!ensure() || !master) return;
		ramp(master, value ? 0 : .85, .05);
		if (!value) {
			resume();
			startPad();
		}
	},
	isMuted() {
		return muted;
	},
	pulse() {
		const now = performance.now();
		if (now - lastPulseAt < 40) return;
		lastPulseAt = now;
		const rate = 1 + (Math.random() * .16 - .08);
		envTone(620 * rate, .07, "sine", .08);
		envTone(1240 * rate, .05, "triangle", .03);
	},
	buy(milestone) {
		if (milestone) {
			envTone(392, .18, "sine", .1, sfx, 784);
			envTone(523, .22, "triangle", .06);
			return;
		}
		envTone(330 + Math.random() * 20, .09, "square", .045);
		envTone(440, .07, "sine", .04);
	},
	research() {
		envTone(262, .16, "sine", .08, sfx, 523);
		envTone(392, .2, "triangle", .05);
	},
	prestige() {
		noiseBurst(.35, .05);
		envTone(80, .8, "sine", .16, sfx, 40);
		envTone(220, .6, "triangle", .08, sfx, 880);
	},
	hover() {
		envTone(880, .03, "sine", .015);
	}
};
function hydrateMute() {
	if (typeof localStorage === "undefined") return false;
	try {
		muted = localStorage.getItem("astroforge.muted") === "1";
	} catch {
		muted = false;
	}
	return muted;
}
function haptic(kind) {
	if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
	try {
		if (kind === "pulse") navigator.vibrate(8);
		else if (kind === "buy") navigator.vibrate(12);
		else if (kind === "milestone") navigator.vibrate([
			18,
			30,
			18
		]);
		else navigator.vibrate([
			40,
			40,
			80,
			40,
			120
		]);
	} catch {}
}
var C = {
	void: "#07090d",
	starCore: "#f4f7fb",
	starMid: "#c5dbe2",
	ice: "#8ec8d4",
	steel: "#e6edf5",
	muted: "#8b97a8"
};
var OrbitalCanvas = (0, import_react.memo)(function OrbitalCanvas({ engine, onPulse }) {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const hintRef = (0, import_react.useRef)(null);
	const onPulseRef = (0, import_react.useRef)(onPulse);
	onPulseRef.current = onPulse;
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		engine.setReducedMotion(reduced);
		let w = 0;
		let h = 0;
		let dpr = 1;
		let raf = 0;
		let last = performance.now();
		let time = 0;
		let pulseBoost = 0;
		const stars = /* @__PURE__ */ new Float32Array(240);
		for (let i = 0; i < stars.length; i += 3) {
			stars[i] = Math.random();
			stars[i + 1] = Math.random();
			stars[i + 2] = .15 + Math.random() * .7;
		}
		const particles = Array.from({ length: 48 }, () => ({
			a: Math.random() * Math.PI * 2,
			r: .25 + Math.random() * .85,
			speed: .08 + Math.random() * .18,
			size: .6 + Math.random() * 1.4
		}));
		const ripples = [];
		const floaters = [];
		const resize = () => {
			const rect = wrap.getBoundingClientRect();
			dpr = Math.min(2, window.devicePixelRatio || 1);
			w = Math.max(1, Math.floor(rect.width));
			h = Math.max(1, Math.floor(rect.height));
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		const ro = new ResizeObserver(resize);
		ro.observe(wrap);
		resize();
		const project = (x, y, z, rot) => {
			const cr = Math.cos(rot);
			const sr = Math.sin(rot);
			const xr = x * cr + z * sr;
			const zr = -x * sr + z * cr;
			const persp = 1.35 / (1.35 + zr);
			return {
				x: xr * persp,
				y: y * persp,
				z: zr,
				p: persp
			};
		};
		const hitStar = (clientX, clientY) => {
			const rect = canvas.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;
			const cx = w * .5;
			const cy = h * .5;
			const R = Math.min(w, h) * .42;
			const dx = x - cx;
			const dy = y - cy;
			return dx * dx + dy * dy <= (R * .22) ** 2 * 2.2;
		};
		const firePulse = (clientX, clientY) => {
			const rect = canvas.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;
			pulseBoost = 1;
			ripples.push({
				life: 0,
				max: .7
			});
			const amt = pulsePower(engine.getState());
			floaters.push({
				x,
				y,
				vy: -28,
				life: 0,
				text: `+${formatSuffix(amt)}`
			});
			if (floaters.length > 14) floaters.shift();
			onPulseRef.current();
		};
		const onPointer = (ev) => {
			if (hitStar(ev.clientX, ev.clientY)) {
				ev.preventDefault();
				firePulse(ev.clientX, ev.clientY);
			}
		};
		canvas.addEventListener("pointerdown", onPointer);
		const draw = (now) => {
			let dt = (now - last) / 1e3;
			last = now;
			if (dt > .05) dt = .05;
			const motion = reduced ? 0 : 1;
			time += dt * motion;
			pulseBoost = Math.max(0, pulseBoost - dt * 2.8);
			const state = engine.getState();
			const drones = generatorLevel(state, "drone");
			const harvesters = generatorLevel(state, "harvester");
			const lasers = generatorLevel(state, "laser");
			const siphons = generatorLevel(state, "siphon");
			const swarm = generatorLevel(state, "swarm");
			const forge = generatorLevel(state, "forge");
			const quantum = generatorLevel(state, "quantum");
			const progress = dysonProgress(state);
			const rates = computeRates(state);
			const intensity = Math.min(1, .15 + rates.energy.log10() / 12);
			if (hintRef.current) hintRef.current.style.opacity = drones === 0 && state.stats.totalClicks < 8 ? "1" : "0";
			const cx = w * .5;
			const cy = h * .52;
			const R = Math.min(w, h) * .42;
			ctx.fillStyle = C.void;
			ctx.fillRect(0, 0, w, h);
			for (let i = 0; i < stars.length; i += 3) {
				const sx = stars[i] * w;
				const sy = stars[i + 1] * h;
				const a = stars[i + 2] * (.35 + .2 * Math.sin(time * .6 + i));
				ctx.fillStyle = `rgba(230,237,245,${a})`;
				ctx.fillRect(sx, sy, 1.1, 1.1);
			}
			ctx.beginPath();
			const vig = ctx.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.6);
			vig.addColorStop(0, "rgba(7,9,13,0)");
			vig.addColorStop(1, "rgba(7,9,13,0.55)");
			ctx.fillStyle = vig;
			ctx.fillRect(0, 0, w, h);
			const rot = time * .12;
			const rings = 3 + Math.min(3, Math.floor(progress * 4));
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(-.18);
			for (let i = 1; i <= rings; i++) {
				const rr = R * (.32 + i * .16);
				ctx.beginPath();
				ctx.strokeStyle = `rgba(142,200,212,${.08 + i * .03 + progress * .08})`;
				ctx.lineWidth = 1;
				ctx.setLineDash([3, 7]);
				ctx.ellipse(0, 0, rr, rr * .36, 0, 0, Math.PI * 2);
				ctx.stroke();
			}
			ctx.setLineDash([]);
			ctx.restore();
			ctx.save();
			ctx.translate(cx, cy);
			const latStep = 22;
			const lonStep = 18;
			const sphereR = R * (.55 + progress * .08);
			ctx.lineWidth = 1;
			for (let lat = -60; lat <= 60; lat += latStep) {
				const latR = (lat + 90) / 180 * Math.PI;
				ctx.beginPath();
				let first = true;
				for (let lon = 0; lon <= 360; lon += lonStep) {
					const lonR = lon * Math.PI / 180;
					const x = Math.sin(lonR) * Math.sin(latR);
					const y = Math.cos(latR);
					const z = Math.cos(lonR) * Math.sin(latR);
					const p = project(x, y, z, rot);
					const px = p.x * sphereR;
					const py = p.y * sphereR * .92;
					if (p.z > -.15) {
						if (first) ctx.moveTo(px, py);
						else ctx.lineTo(px, py);
						first = false;
					} else first = true;
				}
				ctx.strokeStyle = `rgba(142,200,212,${.08 + progress * .28})`;
				ctx.stroke();
			}
			for (let lon = 0; lon < 360; lon += lonStep) {
				const lonR = lon * Math.PI / 180;
				ctx.beginPath();
				let first = true;
				for (let lat = -80; lat <= 80; lat += 10) {
					const latR = (lat + 90) / 180 * Math.PI;
					const x = Math.sin(lonR) * Math.sin(latR);
					const y = Math.cos(latR);
					const z = Math.cos(lonR) * Math.sin(latR);
					const p = project(x, y, z, rot);
					const px = p.x * sphereR;
					const py = p.y * sphereR * .92;
					if (p.z > -.1) {
						if (first) ctx.moveTo(px, py);
						else ctx.lineTo(px, py);
						first = false;
					} else first = true;
				}
				ctx.strokeStyle = `rgba(230,237,245,${.05 + progress * .22})`;
				ctx.stroke();
			}
			const nodeCount = Math.min(72, swarm + Math.floor(forge * .4) + Math.floor(quantum * .2));
			for (let i = 0; i < nodeCount; i++) {
				const lon = i / Math.max(1, nodeCount) * Math.PI * 2 + rot * .4;
				const lat = Math.asin((i % 7 - 3) / 4.2);
				const x = Math.cos(lat) * Math.cos(lon);
				const y = Math.sin(lat);
				const z = Math.cos(lat) * Math.sin(lon);
				const p = project(x, y, z, rot * .7);
				if (p.z < -.2) continue;
				const px = p.x * sphereR;
				const py = p.y * sphereR * .92;
				ctx.fillStyle = `rgba(142,200,212,${.35 + p.p * .5})`;
				ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
			}
			ctx.restore();
			const moteN = Math.floor(8 + intensity * 40);
			for (let i = 0; i < moteN && i < particles.length; i++) {
				const p = particles[i];
				if (motion) p.r -= p.speed * dt;
				if (p.r < .08) {
					p.r = .95 + Math.random() * .2;
					p.a = Math.random() * Math.PI * 2;
				}
				const px = cx + Math.cos(p.a + time * .15) * R * p.r;
				const py = cy + Math.sin(p.a + time * .15) * R * p.r * .62;
				ctx.fillStyle = `rgba(142,200,212,${.15 + (1 - p.r) * .55})`;
				ctx.beginPath();
				ctx.arc(px, py, p.size, 0, Math.PI * 2);
				ctx.fill();
			}
			const visDrones = Math.min(28, drones + Math.min(8, harvesters));
			for (let i = 0; i < visDrones; i++) {
				const orbit = .58 + i % 3 * .12;
				const speed = (.35 + i % 5 * .07) * (i % 2 === 0 ? 1 : -1);
				const a = time * speed + i / visDrones * Math.PI * 2;
				const px = cx + Math.cos(a) * R * orbit;
				const py = cy + Math.sin(a) * R * orbit * .36;
				ctx.save();
				ctx.translate(px, py);
				ctx.rotate(a + Math.PI / 2);
				ctx.fillStyle = C.steel;
				ctx.fillRect(-3.5, -1.2, 7, 2.4);
				ctx.fillStyle = C.ice;
				ctx.fillRect(2.2, -.7, 2.4, 1.4);
				ctx.restore();
			}
			if (lasers > 0 && !reduced) {
				const phase = time * .7 % 3;
				if (phase < .18) {
					ctx.strokeStyle = `rgba(142,200,212,${.35 * (1 - phase / .18)})`;
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(cx + R * .7, cy - R * .18);
					ctx.lineTo(cx + R * .12, cy + R * .04);
					ctx.stroke();
				}
			}
			if (siphons > 0) {
				const n = Math.min(6, 2 + Math.floor(siphons / 8));
				for (let i = 0; i < n; i++) {
					const a = time * .25 + i / n * Math.PI * 2;
					ctx.strokeStyle = "rgba(142,200,212,0.12)";
					ctx.beginPath();
					ctx.moveTo(cx + Math.cos(a) * R * .16, cy + Math.sin(a) * R * .16);
					ctx.lineTo(cx + Math.cos(a) * R * .48, cy + Math.sin(a) * R * .3);
					ctx.stroke();
				}
			}
			const bloom = 1 + pulseBoost * .18 + (reduced ? 0 : .025 * Math.sin(time * 1.6));
			const starR = R * .13 * bloom;
			const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR * 4.2);
			glow.addColorStop(0, "rgba(244,247,251,0.85)");
			glow.addColorStop(.18, "rgba(142,200,212,0.45)");
			glow.addColorStop(.5, "rgba(142,200,212,0.08)");
			glow.addColorStop(1, "rgba(142,200,212,0)");
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.arc(cx, cy, starR * 4.2, 0, Math.PI * 2);
			ctx.fill();
			const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR);
			core.addColorStop(0, C.starCore);
			core.addColorStop(.55, C.starMid);
			core.addColorStop(1, C.ice);
			ctx.fillStyle = core;
			ctx.beginPath();
			ctx.arc(cx, cy, starR, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = "rgba(244,247,251,0.5)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(cx, cy, starR * 1.08, 0, Math.PI * 2);
			ctx.stroke();
			for (let i = ripples.length - 1; i >= 0; i--) {
				const r = ripples[i];
				r.life += dt;
				const t = r.life / r.max;
				if (t >= 1) {
					ripples.splice(i, 1);
					continue;
				}
				ctx.strokeStyle = `rgba(142,200,212,${(1 - t) * .55})`;
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.arc(cx, cy, starR * (1.2 + t * 3.2), 0, Math.PI * 2);
				ctx.stroke();
			}
			ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
			ctx.textAlign = "center";
			for (let i = floaters.length - 1; i >= 0; i--) {
				const f = floaters[i];
				f.life += dt;
				f.y += f.vy * dt;
				f.vy *= .96;
				if (f.life > .9) {
					floaters.splice(i, 1);
					continue;
				}
				ctx.fillStyle = `rgba(230,237,245,${1 - f.life / .9})`;
				ctx.fillText(f.text, f.x, f.y);
			}
			ctx.textAlign = "start";
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			canvas.removeEventListener("pointerdown", onPointer);
		};
	}, [engine]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative h-full w-full overflow-hidden bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "block h-full w-full touch-none",
			"aria-label": "Orbital visualizer. Tap the star to mine ore."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			ref: hintRef,
			className: "pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm text-muted transition-opacity duration-500",
			children: "Tap the star to extract ore"
		})]
	});
});
var TABS = [
	{
		id: "forge",
		label: "Forge"
	},
	{
		id: "research",
		label: "Research"
	},
	{
		id: "swarm",
		label: "Swarm"
	},
	{
		id: "protocol",
		label: "Protocol"
	}
];
function perGeneratorRates(state) {
	const m = productionMultiplier(state);
	const out = {};
	for (const def of GENERATORS) {
		const level = generatorLevel(state, def.id);
		const genMult = (m.gens[def.id] ?? 1) * milestoneMultiplier(level);
		const resMult = def.resource === "ore" ? m.ore : def.resource === "alloy" ? m.alloy : m.energy;
		out[def.id] = bn(def.baseProd).mulNum(level).mulNum(genMult * resMult * m.all);
	}
	return out;
}
function ResourceChip({ id, valueRef, rateRef }) {
	const meta = RESOURCE_META[id];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 rounded-lg bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs font-medium tracking-wide text-subtle uppercase",
				children: meta.short
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				ref: valueRef,
				className: "block truncate font-medium text-fg tabular",
				children: "0"
			}),
			id !== "quarks" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				ref: rateRef,
				className: "block text-xs text-muted tabular",
				children: "+0/s"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: "held"
			})
		]
	});
}
function GameApp() {
	const engineRef = (0, import_react.useRef)(null);
	const [engine, setEngine] = (0, import_react.useState)(null);
	const [revision, setRevision] = (0, import_react.useState)(0);
	const [entered, setEntered] = (0, import_react.useState)(false);
	const [buyMode, setBuyMode] = (0, import_react.useState)(1);
	const [tab, setTab] = (0, import_react.useState)("forge");
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [settings, setSettings] = (0, import_react.useState)(false);
	const [offline, setOffline] = (0, import_react.useState)(null);
	const [confirmPrestige, setConfirmPrestige] = (0, import_react.useState)(false);
	const [toast, setToast] = (0, import_react.useState)(null);
	const [hasSave, setHasSave] = (0, import_react.useState)(false);
	const oreRef = (0, import_react.useRef)(null);
	const alloyRef = (0, import_react.useRef)(null);
	const energyRef = (0, import_react.useRef)(null);
	const quarkRef = (0, import_react.useRef)(null);
	const oreRateRef = (0, import_react.useRef)(null);
	const alloyRateRef = (0, import_react.useRef)(null);
	const energyRateRef = (0, import_react.useRef)(null);
	const shown = (0, import_react.useRef)({
		ore: BigNumber.ZERO,
		alloy: BigNumber.ZERO,
		energy: BigNumber.ZERO,
		quarks: BigNumber.ZERO
	});
	(0, import_react.useEffect)(() => {
		const { engine: boot, offline: off } = GameEngine.boot();
		engineRef.current = boot;
		setEngine(boot);
		setOffline(off);
		setMuted(hydrateMute());
		audio.setMuted(hydrateMute());
		setHasSave(boot.getState().stats.playTimeSec > 4 || boot.getState().stats.prestiges > 0);
		const unsub = boot.subscribe(() => setRevision((n) => n + 1));
		const unlife = bindLifecycle(boot, (r) => {
			if (r) setOffline(r);
		});
		window.__astroforge = {
			getState: () => boot.getState(),
			pulse: () => boot.dispatch({ type: "pulse" }),
			buy: (id) => boot.dispatch({
				type: "buyGenerator",
				id,
				mode: 1
			})
		};
		return () => {
			unsub();
			unlife();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!engine) return;
		let last = performance.now();
		let raf = 0;
		const tick = (now) => {
			let dt = (now - last) / 1e3;
			last = now;
			if (dt > .05) dt = .05;
			const s = engine.getState();
			const k = 1 - Math.exp(-10 * dt);
			const lerp = (cur, target) => cur.add(target.sub(cur).mulNum(k));
			shown.current.ore = lerp(shown.current.ore, s.resources.ore);
			shown.current.alloy = lerp(shown.current.alloy, s.resources.alloy);
			shown.current.energy = lerp(shown.current.energy, s.resources.energy);
			shown.current.quarks = s.resources.quarks;
			const rates = computeRates(s);
			if (oreRef.current) oreRef.current.textContent = formatSuffix(shown.current.ore);
			if (alloyRef.current) alloyRef.current.textContent = formatSuffix(shown.current.alloy);
			if (energyRef.current) energyRef.current.textContent = formatSuffix(shown.current.energy);
			if (quarkRef.current) quarkRef.current.textContent = formatSuffix(shown.current.quarks);
			if (oreRateRef.current) oreRateRef.current.textContent = `+${formatRate(rates.ore)}`;
			if (alloyRateRef.current) alloyRateRef.current.textContent = `+${formatRate(rates.alloy)}`;
			if (energyRateRef.current) energyRateRef.current.textContent = `+${formatRate(rates.energy)}`;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [engine]);
	const pulse = (0, import_react.useCallback)(() => {
		const eng = engineRef.current;
		if (!eng) return;
		audio.unlock();
		audio.pulse();
		haptic("pulse");
		eng.dispatch({ type: "pulse" });
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (!entered) return;
			if (e.code === "Space") {
				e.preventDefault();
				pulse();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [entered, pulse]);
	const enter = () => {
		audio.unlock();
		setEntered(true);
	};
	const state = engine?.getState();
	const genRates = (0, import_react.useMemo)(() => state ? perGeneratorRates(state) : {}, [state, revision]);
	const buyGen = (id) => {
		const eng = engineRef.current;
		if (!eng || !state) return;
		const before = generatorLevel(eng.getState(), id);
		if (!eng.dispatch({
			type: "buyGenerator",
			id,
			mode: buyMode
		})) return;
		const after = generatorLevel(eng.getState(), id);
		const crossed = Math.floor(before / 25) !== Math.floor(after / 25) || before < 10 && after >= 10;
		audio.buy(crossed);
		haptic(crossed ? "milestone" : "buy");
	};
	const buyResearch = (id) => {
		const eng = engineRef.current;
		if (!eng) return;
		if (eng.dispatch({
			type: "buyResearch",
			id
		})) {
			audio.research();
			haptic("buy");
		}
	};
	const buyQuark = (id) => {
		const eng = engineRef.current;
		if (!eng) return;
		if (eng.dispatch({
			type: "buyQuark",
			id
		})) {
			audio.research();
			haptic("buy");
		}
	};
	const doPrestige = () => {
		const eng = engineRef.current;
		if (!eng) return;
		if (eng.dispatch({ type: "prestige" })) {
			audio.prestige();
			haptic("prestige");
			setConfirmPrestige(false);
			setTab("forge");
			setToast("Protocol collapsed. Quarks retained.");
		}
	};
	const toggleMute = () => {
		const next = !muted;
		setMuted(next);
		audio.setMuted(next);
	};
	const copySave = async () => {
		if (!engine) return;
		const payload = exportSave(engine.getState());
		try {
			await navigator.clipboard.writeText(payload);
			setToast("Save copied to clipboard");
		} catch {
			setToast("Copy failed");
		}
	};
	const pasteSave = async () => {
		try {
			const next = importSave(await navigator.clipboard.readText());
			if (!next || !engine) {
				setToast("Invalid save");
				return;
			}
			engine.dispatch({
				type: "importState",
				state: next
			});
			setToast("Save imported");
			setSettings(false);
		} catch {
			setToast("Import failed");
		}
	};
	const wipe = () => {
		clearSave();
		window.location.reload();
	};
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const t = window.setTimeout(() => setToast(null), 2200);
		return () => window.clearTimeout(t);
	}, [toast]);
	if (!engine || !state) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-bg text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-sm tracking-wide",
			children: "Calibrating swarm…"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-dvh flex-col bg-bg text-fg lg:h-dvh lg:overflow-hidden",
		children: [
			!entered ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium tracking-widest text-muted uppercase",
						children: "Stellar foundry"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-5xl font-semibold tracking-tight sm:text-6xl",
						children: "AstroForge"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm tracking-widest text-accent uppercase",
						children: "Dyson Protocol"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-sm text-center text-sm text-muted",
						children: "Mine the belt. Refine the alloy. Raise a swarm around the star. When the yield is enough, collapse it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-8 min-w-48",
						size: "lg",
						onClick: enter,
						children: hasSave ? "Resume protocol" : "Initialize protocol"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg font-semibold leading-none tracking-tight",
					children: "AstroForge"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs tracking-widest text-muted uppercase",
					children: "Dyson Protocol"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": muted ? "Unmute" : "Mute",
						onClick: toggleMute,
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": "Settings",
						onClick: () => setSettings(true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col lg:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-col lg:flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-4 gap-2 px-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceChip, {
								id: "ore",
								valueRef: oreRef,
								rateRef: oreRateRef
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceChip, {
								id: "alloy",
								valueRef: alloyRef,
								rateRef: alloyRateRef
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceChip, {
								id: "energy",
								valueRef: energyRef,
								rateRef: energyRateRef
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceChip, {
								id: "quarks",
								valueRef: quarkRef
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 h-[34vh] min-h-52 max-h-80 w-full sm:h-[38vh] lg:h-auto lg:max-h-none lg:min-h-0 lg:flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitalCanvas, {
							engine,
							onPulse: pulse
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-1 flex-col lg:w-96 lg:flex-none lg:border-l lg:border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-2 px-4 pt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-1 rounded-lg bg-surface-2 p-1",
								role: "tablist",
								"aria-label": "Purchase quantity",
								children: BUY_MODES.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: cn("h-9 min-h-9 flex-1 rounded-sm text-xs font-medium", buyMode === m ? "bg-surface text-fg" : "text-muted hover:text-fg"),
									onClick: () => setBuyMode(m),
									children: m === "max" ? "Max" : `×${m}`
								}, String(m)))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "mt-2 flex gap-1 px-4",
							"aria-label": "Sections",
							children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: cn("h-11 min-h-11 flex-1 rounded-md text-sm font-medium", tab === t.id ? "bg-surface text-fg" : "text-muted hover:text-fg"),
								onClick: () => setTab(t.id),
								children: t.label
							}, t.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
							children: [
								tab === "forge" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForgePanel, {
									state,
									rates: genRates,
									mode: buyMode,
									onBuy: buyGen
								}) : null,
								tab === "research" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResearchPanel, {
									state,
									onBuy: buyResearch
								}) : null,
								tab === "swarm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwarmPanel, {
									state,
									rates: genRates,
									mode: buyMode,
									onBuy: buyGen
								}) : null,
								tab === "protocol" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtocolPanel, {
									state,
									onQuark: buyQuark,
									onPrestige: () => setConfirmPrestige(true)
								}) : null
							]
						})
					]
				})]
			}),
			entered && offline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-2xl border border-border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold tracking-tight",
							children: "While you were away"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: [
								formatDuration(offline.secondsAway),
								" elapsed",
								offline.capped ? ` · credited ${formatDuration(offline.cappedSeconds)}` : ""
							]
						}),
						offline.clockAnomaly || offline.checksumFailed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-danger",
							children: "Clock or state verification failed. Offline yield was not applied."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-4 space-y-1 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Ore"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular",
										children: ["+", formatSuffix(offline.gained.ore)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Alloy"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular",
										children: ["+", formatSuffix(offline.gained.alloy)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Energy"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular",
										children: ["+", formatSuffix(offline.gained.energy)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "Swarm"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular",
										children: [
											Math.round(offline.dysonBefore * 100),
											"% → ",
											Math.round(offline.dysonAfter * 100),
											"%"
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full",
							onClick: () => setOffline(null),
							children: "Continue"
						})
					]
				})
			}) : null,
			confirmPrestige ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-2xl border border-border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold tracking-tight",
							children: "Ignite supernova"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "This protocol ends. Drones, research, and stockpiles reset. Quarks and artifacts persist."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								className: "flex-1",
								onClick: () => setConfirmPrestige(false),
								children: "Abort"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								className: "flex-1",
								onClick: doPrestige,
								children: "Ignite"
							})]
						})
					]
				})
			}) : null,
			settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 flex justify-end bg-bg/70",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full w-full max-w-sm flex-col border-l border-border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg font-semibold tracking-tight",
								children: "Settings"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								"aria-label": "Close",
								onClick: () => setSettings(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Autosaves locally every 30 seconds and when you leave."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: toggleMute,
									children: [muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }), muted ? "Sound off" : "Sound on"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: copySave,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Export save"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: pasteSave,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Import from clipboard"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "danger",
									onClick: () => {
										if (window.confirm("Wipe local save and restart the protocol?")) wipe();
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Reset save"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-auto pt-8 text-xs text-subtle",
							children: "Space pulses the star. Progress stores on this device."
						})
					]
				})
			}) : null,
			toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm",
				children: toast
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { Home as component };
