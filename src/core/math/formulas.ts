import { BigNumber, bn } from "./big-number";

/**
 * Geometric cost of `count` purchases starting at `level`:
 * Cost = Σ_{i=0}^{n-1} base × r^{level+i}
 *      = base × r^level × (r^n − 1) / (r − 1)
 */
export function geometricSum(
  baseCost: BigNumber,
  costMult: number,
  level: number,
  count: number,
): BigNumber {
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
export function maxAffordable(
  money: BigNumber,
  baseCost: BigNumber,
  costMult: number,
  level: number,
  limit = 1e9,
): number {
  if (money.m <= 0) return 0;
  const first = baseCost.mul(BigNumber.from(costMult).pow(level));
  if (money.lt(first)) return 0;
  if (Math.abs(costMult - 1) < 1e-12) {
    const n = Math.floor(money.div(first).toNumber());
    return Math.max(0, Math.min(limit, Number.isFinite(n) ? n : limit));
  }
  // n = log(1 + money*(r-1)/first) / log(r)
  const inner = money.mulNum(costMult - 1).div(first).add(BigNumber.ONE);
  if (inner.lte(BigNumber.ZERO)) return 0;
  const raw = inner.log10() / Math.log10(costMult);
  let count = Math.floor(raw);
  if (!Number.isFinite(count) || count < 0) count = 0;
  if (count > limit) count = limit;
  while (count > 0 && geometricSum(baseCost, costMult, level, count).gt(money)) {
    count--;
  }
  while (count < limit && geometricSum(baseCost, costMult, level, count + 1).lte(money)) {
    count++;
  }
  return count;
}

/** Cost = BaseCost × (CostMultiplier)^Level  (single next unit). */
export function nextCost(baseCost: BigNumber, costMult: number, level: number): BigNumber {
  return baseCost.mul(BigNumber.from(costMult).pow(level));
}

/**
 * Production = BaseProd × Level × Π(Multipliers).
 * Multipliers are ordinary JS numbers (they stay well below 1e308 in practice);
 * the BigNumber path is used when combining with other large factors.
 */
export function productionRate(baseProd: number, level: number, multipliers: number): BigNumber {
  if (level <= 0 || baseProd <= 0 || multipliers <= 0) return BigNumber.ZERO;
  return bn(baseProd).mulNum(level).mulNum(multipliers);
}

/**
 * Quarks = ⌊ 1000 × (TotalLifetimeEnergy / 10^12)^0.5 ⌋
 */
export function quarksFromLifetimeEnergy(lifetimeEnergy: BigNumber): BigNumber {
  if (lifetimeEnergy.m <= 0) return BigNumber.ZERO;
  const ratio = lifetimeEnergy.div(new BigNumber(1, 12));
  return ratio.sqrt().mulNum(1000).floor();
}

/** Energy required to reach `target` total earned quarks (inverse of the prestige curve). */
export function energyForQuarks(target: BigNumber): BigNumber {
  if (target.m <= 0) return BigNumber.ZERO;
  // E = 1e12 * (Q / 1000)^2
  const q = target.divNum(1000);
  return q.mul(q).mul(new BigNumber(1, 12));
}

const MILESTONE_FIRST = 10;
const MILESTONE_SECOND = 25;
const MILESTONE_STEP = 25;

export function milestoneCount(level: number): number {
  if (level < MILESTONE_FIRST) return 0;
  if (level < MILESTONE_SECOND) return 1;
  return 2 + Math.floor((level - MILESTONE_SECOND) / MILESTONE_STEP);
}

export function milestoneMultiplier(level: number): number {
  return 2 ** milestoneCount(level);
}

export function nextMilestone(level: number): number {
  if (level < MILESTONE_FIRST) return MILESTONE_FIRST;
  if (level < MILESTONE_SECOND) return MILESTONE_SECOND;
  return MILESTONE_SECOND + (Math.floor((level - MILESTONE_SECOND) / MILESTONE_STEP) + 1) * MILESTONE_STEP;
}
