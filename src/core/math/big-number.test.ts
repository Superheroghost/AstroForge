import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BigNumber, bn, formatSuffix } from "./big-number.ts";

describe("BigNumber", () => {
  it("normalizes mantissa into [1, 10)", () => {
    const a = bn(1234);
    assert.ok(a.m >= 1 && a.m < 10);
    assert.equal(a.e, 3);
    assert.equal(bn(0.05).e, -2);
  });

  it("adds across nearby exponents", () => {
    const sum = bn(1e12).add(bn(5e11));
    assert.ok(Math.abs(sum.toNumber() / 1.5e12 - 1) < 1e-10);
  });

  it("drops negligible addends", () => {
    const sum = new BigNumber(1, 20).add(bn(1));
    assert.equal(sum.e, 20);
    assert.equal(sum.m, 1);
  });

  it("multiplies and divides", () => {
    const p = bn(2e15).mul(bn(3e10));
    assert.equal(p.e, 25);
    assert.ok(Math.abs(p.m - 6) < 1e-10);
    const q = p.div(bn(2));
    assert.ok(Math.abs(q.log10() - Math.log10(3e25)) < 1e-10);
  });

  it("pow and log10", () => {
    const p = bn(1.15).pow(50);
    const naive = 1.15 ** 50;
    assert.ok(Math.abs(p.toNumber() / naive - 1) < 1e-10);
    assert.ok(Math.abs(bn(1e12).log10() - 12) < 1e-10);
  });

  it("formats suffixes", () => {
    assert.equal(formatSuffix(bn(0)), "0");
    assert.equal(formatSuffix(bn(999)), "999");
    assert.equal(formatSuffix(new BigNumber(1.23, 6)), "1.23M");
    assert.equal(formatSuffix(new BigNumber(4.5, 12)), "4.5T");
  });

  it("handles 1e400-scale values beyond IEEE", () => {
    const huge = new BigNumber(3.14, 400);
    assert.equal(huge.toNumber(), Number.POSITIVE_INFINITY);
    assert.equal(huge.mul(bn(2)).e, 400);
    assert.ok(huge.mul(bn(2)).m > 6);
  });

  it("geometric series via pow matches a naive loop", () => {
    const base = bn(10);
    const r = 1.15;
    const level = 3;
    const count = 7;
    let naive = BigNumber.ZERO;
    for (let i = 0; i < count; i++) naive = naive.add(base.mul(bn(r).pow(level + i)));
    const first = base.mul(bn(r).pow(level));
    const closed = first.mul(bn(r).pow(count).sub(BigNumber.ONE)).divNum(r - 1);
    assert.ok(Math.abs(closed.toNumber() / naive.toNumber() - 1) < 1e-9);
  });

  it("prestige curve floor(1000 * sqrt(E / 1e12))", () => {
    const quarks = (energy: BigNumber) => energy.div(new BigNumber(1, 12)).sqrt().mulNum(1000).floor();
    assert.equal(quarks(BigNumber.ZERO).toNumber(), 0);
    assert.equal(quarks(new BigNumber(1, 12)).toNumber(), 1000);
    assert.equal(quarks(new BigNumber(1, 6)).toNumber(), 1);
  });
});
