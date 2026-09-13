/**
 * Mantissa-exponent scientific number for idle-game magnitudes far beyond 1e308.
 * Immutable. Hot-path ops allocate one object; they never recurse or loop by
 * magnitude. Mantissa is normalized to 0 or [1, 10) with sign.
 */
const LOG10 = Math.LN10;
const INV_LOG10 = 1 / LOG10;
const EXP_ABS_CAP = 1e12;

function clampExp(e: number): number {
  if (e > EXP_ABS_CAP) return EXP_ABS_CAP;
  if (e < -EXP_ABS_CAP) return -EXP_ABS_CAP;
  return e;
}

export class BigNumber {
  readonly m: number;
  readonly e: number;

  constructor(mantissa: number, exponent = 0) {
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

    // log10 path — constant time, no loops over the exponent.
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

  static readonly ZERO = new BigNumber(0, 0);
  static readonly ONE = new BigNumber(1, 0);
  static readonly TEN = new BigNumber(10, 0);

  static from(n: number): BigNumber {
    if (n === 0) return BigNumber.ZERO;
    if (n === 1) return BigNumber.ONE;
    return new BigNumber(n, 0);
  }

  static fromParts(m: number, e: number): BigNumber {
    return new BigNumber(m, e);
  }

  static fromJSON(raw: unknown): BigNumber {
    if (raw instanceof BigNumber) return raw;
    if (typeof raw === "number") return BigNumber.from(raw);
    if (raw && typeof raw === "object" && "m" in raw && "e" in raw) {
      const rec = raw as { m: unknown; e: unknown };
      return new BigNumber(Number(rec.m) || 0, Number(rec.e) || 0);
    }
    if (typeof raw === "string") return BigNumber.parse(raw);
    return BigNumber.ZERO;
  }

  static parse(text: string): BigNumber {
    const t = text.trim();
    const sci = t.match(/^([+-]?\d+(?:\.\d+)?)e([+-]?\d+)$/i);
    if (sci) return new BigNumber(Number(sci[1]), Number(sci[2]));
    const n = Number(t);
    return Number.isFinite(n) ? BigNumber.from(n) : BigNumber.ZERO;
  }

  static min(a: BigNumber, b: BigNumber): BigNumber {
    return a.lt(b) ? a : b;
  }

  static max(a: BigNumber, b: BigNumber): BigNumber {
    return a.gt(b) ? a : b;
  }

  isZero(): boolean {
    return this.m === 0;
  }

  isFinite(): boolean {
    return Math.abs(this.e) < EXP_ABS_CAP;
  }

  sign(): number {
    return this.m === 0 ? 0 : this.m < 0 ? -1 : 1;
  }

  abs(): BigNumber {
    return this.m < 0 ? new BigNumber(-this.m, this.e) : this;
  }

  neg(): BigNumber {
    return this.m === 0 ? this : new BigNumber(-this.m, this.e);
  }

  add(other: BigNumber): BigNumber {
    if (this.m === 0) return other;
    if (other.m === 0) return this;
    const de = this.e - other.e;
    if (de >= 16) return this;
    if (de <= -16) return other;
    if (de >= 0) {
      return new BigNumber(this.m + other.m * Math.pow(10, -de), this.e);
    }
    return new BigNumber(other.m + this.m * Math.pow(10, de), other.e);
  }

  sub(other: BigNumber): BigNumber {
    if (other.m === 0) return this;
    return this.add(other.neg());
  }

  mul(other: BigNumber): BigNumber {
    if (this.m === 0 || other.m === 0) return BigNumber.ZERO;
    return new BigNumber(this.m * other.m, this.e + other.e);
  }

  mulNum(n: number): BigNumber {
    if (n === 0 || this.m === 0) return BigNumber.ZERO;
    if (n === 1) return this;
    return new BigNumber(this.m * n, this.e);
  }

  div(other: BigNumber): BigNumber {
    if (other.m === 0) {
      if (this.m === 0) return BigNumber.ZERO;
      return new BigNumber(this.m < 0 ? -1 : 1, EXP_ABS_CAP);
    }
    if (this.m === 0) return BigNumber.ZERO;
    return new BigNumber(this.m / other.m, this.e - other.e);
  }

  divNum(n: number): BigNumber {
    if (n === 0) return this.m === 0 ? BigNumber.ZERO : new BigNumber(this.sign(), EXP_ABS_CAP);
    if (this.m === 0) return BigNumber.ZERO;
    return new BigNumber(this.m / n, this.e);
  }

  /** this^exp for real exp. Negative bases with non-integer exp → 0. */
  pow(exp: number): BigNumber {
    if (exp === 0) return BigNumber.ONE;
    if (this.m === 0) return exp > 0 ? BigNumber.ZERO : new BigNumber(1, EXP_ABS_CAP);
    if (this.m < 0 && !Number.isInteger(exp)) return BigNumber.ZERO;
    const log10 = Math.log(Math.abs(this.m)) * INV_LOG10 + this.e;
    const resultLog = log10 * exp;
    if (!Number.isFinite(resultLog)) {
      return new BigNumber(this.m < 0 && exp % 2 ? -1 : 1, EXP_ABS_CAP);
    }
    const e = Math.floor(resultLog);
    const m = Math.pow(10, resultLog - e);
    const sign = this.m < 0 && exp % 2 !== 0 ? -1 : 1;
    return new BigNumber(sign * m, e);
  }

  sqrt(): BigNumber {
    return this.m < 0 ? BigNumber.ZERO : this.pow(0.5);
  }

  log10(): number {
    if (this.m <= 0) return Number.NEGATIVE_INFINITY;
    return Math.log(this.m) * INV_LOG10 + this.e;
  }

  ln(): number {
    if (this.m <= 0) return Number.NEGATIVE_INFINITY;
    return Math.log(this.m) + this.e * LOG10;
  }

  floor(): BigNumber {
    if (this.m === 0) return this;
    if (this.e >= 15) return this;
    if (this.e < 0) return this.m >= 0 ? BigNumber.ZERO : BigNumber.from(-1);
    const v = this.toNumber();
    if (!Number.isFinite(v)) return this;
    return BigNumber.from(Math.floor(v));
  }

  cmp(other: BigNumber): number {
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

  eq(other: BigNumber): boolean {
    return this.cmp(other) === 0;
  }
  lt(other: BigNumber): boolean {
    return this.cmp(other) < 0;
  }
  lte(other: BigNumber): boolean {
    return this.cmp(other) <= 0;
  }
  gt(other: BigNumber): boolean {
    return this.cmp(other) > 0;
  }
  gte(other: BigNumber): boolean {
    return this.cmp(other) >= 0;
  }

  toNumber(): number {
    if (this.m === 0) return 0;
    if (this.e > 308) return this.m < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    if (this.e < -308) return 0;
    return this.m * Math.pow(10, this.e);
  }

  toJSON(): { m: number; e: number } {
    return { m: this.m, e: this.e };
  }

  toSci(digits = 3): string {
    if (this.m === 0) return "0";
    const d = Math.max(0, digits);
    return `${this.m.toFixed(d)}e${this.e}`;
  }

  toSuffix(digits = 2): string {
    return formatSuffix(this, digits);
  }

  toString(): string {
    return this.toSuffix();
  }
}

const SUFFIXES = [
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
  "Tg",
];

export function formatSuffix(value: BigNumber, digits = 2): string {
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
  if (group >= SUFFIXES.length) {
    return sign + abs.toSci(Math.max(2, digits));
  }
  const rem = abs.e - group * 3;
  const shown = abs.m * Math.pow(10, rem);
  const suffix = SUFFIXES[group];
  let body: string;
  if (shown >= 100) body = shown.toFixed(0);
  else if (shown >= 10) body = shown.toFixed(Math.min(1, digits));
  else body = shown.toFixed(Math.min(2, digits));
  body = body.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return sign + body + suffix;
}

export function formatRate(value: BigNumber): string {
  return `${formatSuffix(value)}/s`;
}

export const bn = BigNumber.from;
