import { BigNumber, bn } from "@/core/math/big-number";
import {
  energyForQuarks,
  geometricSum,
  maxAffordable,
  milestoneMultiplier,
  nextCost,
  quarksFromLifetimeEnergy,
} from "@/core/math/formulas";
import {
  BASE_OFFLINE_HOURS,
  GENERATORS,
  GEN_BY_ID,
  MAX_OFFLINE_HOURS_HARD,
  QUARK_BY_ID,
  QUARK_UPGRADES,
  RESEARCH,
  RESEARCH_BY_ID,
  type BuyMode,
  type GeneratorDef,
} from "./catalog";
import {
  cloneState,
  createInitialState,
  emptyRates,
  type GameState,
  type Rates,
} from "./models";

export function generatorLevel(state: GameState, id: string): number {
  return state.generators[id] ?? 0;
}

export function isResearchOwned(state: GameState, id: string): boolean {
  return Boolean(state.research[id]);
}

export function isGeneratorUnlocked(state: GameState, def: GeneratorDef): boolean {
  const u = def.unlock;
  if (u.type === "start") return true;
  if (u.type === "generator") return generatorLevel(state, u.id) >= u.level;
  return isResearchOwned(state, u.id);
}

export function isResearchAvailable(state: GameState, id: string): boolean {
  if (isResearchOwned(state, id)) return false;
  const def = RESEARCH_BY_ID[id];
  if (!def) return false;
  return def.requires.every((req) => isResearchOwned(state, req));
}

export function quarkLevel(state: GameState, id: string): number {
  return state.quarkUpgrades[id] ?? 0;
}

export function productionMultiplier(state: GameState): {
  all: number;
  ore: number;
  alloy: number;
  energy: number;
  gens: Record<string, number>;
  click: number;
  costFactor: number;
  offlineHours: number;
  startOre: BigNumber;
} {
  let all = 1;
  let ore = 1;
  let alloy = 1;
  let energy = 1;
  const gens: Record<string, number> = {};
  let click = 1;
  let costFactor = 1;
  let offlineHours = BASE_OFFLINE_HOURS;
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
    } else if (e.type === "click") {
      click *= e.value;
    } else if (e.type === "offlineHours") {
      offlineHours += e.value;
    }
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

  if (costFactor < 0.4) costFactor = 0.4;
  if (offlineHours > MAX_OFFLINE_HOURS_HARD) offlineHours = MAX_OFFLINE_HOURS_HARD;

  return { all, ore, alloy, energy, gens, click, costFactor, offlineHours, startOre };
}

export function computeRates(state: GameState): Rates {
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

export function pulsePower(state: GameState): BigNumber {
  const m = productionMultiplier(state);
  return bn(1).mulNum(m.click);
}

export function costFactor(state: GameState): number {
  return productionMultiplier(state).costFactor;
}

export function scaledBaseCost(state: GameState, def: GeneratorDef): BigNumber {
  return bn(def.baseCost).mulNum(costFactor(state));
}

export function generatorNextCost(state: GameState, def: GeneratorDef): BigNumber {
  return nextCost(scaledBaseCost(state, def), def.costMult, generatorLevel(state, def.id));
}

export function buyCountForMode(state: GameState, def: GeneratorDef, mode: BuyMode): number {
  const money = state.resources[def.costResource];
  const base = scaledBaseCost(state, def);
  const level = generatorLevel(state, def.id);
  if (mode === "max") return maxAffordable(money, base, def.costMult, level);
  const n = mode;
  const cost = geometricSum(base, def.costMult, level, n);
  return cost.lte(money) ? n : 0;
}

export function buyCost(state: GameState, def: GeneratorDef, count: number): BigNumber {
  if (count <= 0) return BigNumber.ZERO;
  return geometricSum(scaledBaseCost(state, def), def.costMult, generatorLevel(state, def.id), count);
}

export function applyTick(state: GameState, dt: number): void {
  if (dt <= 0) return;
  const rates = computeRates(state);
  credit(state, "ore", rates.ore.mulNum(dt));
  credit(state, "alloy", rates.alloy.mulNum(dt));
  credit(state, "energy", rates.energy.mulNum(dt));
  state.stats.playTimeSec += dt;
}

function credit(state: GameState, resource: "ore" | "alloy" | "energy", amount: BigNumber): void {
  if (amount.m <= 0) return;
  state.resources[resource] = state.resources[resource].add(amount);
  state.lifetime[resource] = state.lifetime[resource].add(amount);
}

export function applyPulse(state: GameState): BigNumber {
  const amount = pulsePower(state);
  credit(state, "ore", amount);
  state.stats.totalClicks += 1;
  if (amount.gt(state.stats.biggestPulse)) state.stats.biggestPulse = amount;
  return amount;
}

export function applyBuyGenerator(state: GameState, id: string, mode: BuyMode): boolean {
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

export function applyBuyResearch(state: GameState, id: string): boolean {
  const def = RESEARCH_BY_ID[id];
  if (!def || !isResearchAvailable(state, id)) return false;
  const have = state.resources[def.cost.resource];
  const cost = bn(def.cost.amount);
  if (have.lt(cost)) return false;
  state.resources[def.cost.resource] = have.sub(cost);
  state.research[id] = true;
  return true;
}

export function quarkUpgradeCost(state: GameState, id: string): BigNumber {
  const def = QUARK_BY_ID[id];
  if (!def) return BigNumber.ZERO;
  return bn(def.baseCost).mul(bn(def.costMult).pow(quarkLevel(state, id)));
}

export function applyBuyQuark(state: GameState, id: string): boolean {
  const def = QUARK_BY_ID[id];
  if (!def) return false;
  const lv = quarkLevel(state, id);
  if (def.max !== undefined && lv >= def.max) return false;
  const cost = quarkUpgradeCost(state, id);
  if (state.resources.quarks.lt(cost)) return false;
  state.resources.quarks = state.resources.quarks.sub(cost);
  state.quarkUpgrades[id] = lv + 1;
  return true;
}

export function pendingQuarks(state: GameState): BigNumber {
  const total = quarksFromLifetimeEnergy(state.lifetime.energy);
  const extra = total.sub(state.quarksEarned);
  return extra.m > 0 ? extra : BigNumber.ZERO;
}

export function nextQuarkEnergy(state: GameState): BigNumber {
  const next = state.quarksEarned.add(pendingQuarks(state)).add(BigNumber.ONE);
  return energyForQuarks(next);
}

export function canPrestige(state: GameState): boolean {
  return pendingQuarks(state).gte(BigNumber.ONE);
}

export function applyPrestige(state: GameState): boolean {
  const gain = pendingQuarks(state);
  if (gain.lt(BigNumber.ONE)) return false;
  const quarks = state.resources.quarks.add(gain);
  const quarksEarned = state.quarksEarned.add(gain);
  const quarkUpgrades = { ...state.quarkUpgrades };
  const lifetime = { ...state.lifetime };
  const stats = { ...state.stats, prestiges: state.stats.prestiges + 1, totalClicks: 0 };
  const now = Date.now();
  const next = createInitialState(now);
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
    biggestPulse: state.stats.biggestPulse,
  };
  const seed = productionMultiplier(next).startOre;
  if (seed.gt(BigNumber.ZERO)) {
    next.resources.ore = seed;
    next.lifetime.ore = lifetime.ore.add(seed);
  }
  Object.assign(state, next);
  return true;
}

export function dysonProgress(state: GameState): number {
  const swarm = generatorLevel(state, "swarm");
  const forge = generatorLevel(state, "forge");
  const quantum = generatorLevel(state, "quantum");
  const weight = swarm + forge * 1.6 + quantum * 3;
  return 1 - Math.exp(-weight / 70);
}

export function researchOwnedCount(state: GameState): number {
  let n = 0;
  for (const def of RESEARCH) if (isResearchOwned(state, def.id)) n++;
  return n;
}

export function snapshot(state: GameState): GameState {
  return cloneState(state);
}
