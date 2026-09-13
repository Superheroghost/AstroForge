import { BigNumber } from "@/core/math/big-number";
import { SAVE_VERSION, type ResourceId } from "./catalog";

export interface Rates {
  ore: BigNumber;
  alloy: BigNumber;
  energy: BigNumber;
}

export interface GameState {
  version: number;
  resources: Record<ResourceId, BigNumber>;
  lifetime: { ore: BigNumber; alloy: BigNumber; energy: BigNumber };
  generators: Record<string, number>;
  research: Record<string, boolean>;
  quarkUpgrades: Record<string, number>;
  quarksEarned: BigNumber;
  stats: {
    totalClicks: number;
    prestiges: number;
    startedAt: number;
    playTimeSec: number;
    totalSpentOre: BigNumber;
    biggestPulse: BigNumber;
  };
  lastActiveAt: number;
  checksum: string;
}

export interface OfflineProgressResult {
  secondsAway: number;
  cappedSeconds: number;
  capped: boolean;
  clockAnomaly: boolean;
  checksumFailed: boolean;
  gained: Rates;
  dysonBefore: number;
  dysonAfter: number;
}

export type Intent =
  | { type: "pulse" }
  | { type: "buyGenerator"; id: string; mode: import("./catalog").BuyMode }
  | { type: "buyResearch"; id: string }
  | { type: "buyQuark"; id: string }
  | { type: "prestige" }
  | { type: "importState"; state: GameState };

export function emptyRates(): Rates {
  return {
    ore: BigNumber.ZERO,
    alloy: BigNumber.ZERO,
    energy: BigNumber.ZERO,
  };
}

export function createInitialState(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    resources: {
      ore: BigNumber.ZERO,
      alloy: BigNumber.ZERO,
      energy: BigNumber.ZERO,
      quarks: BigNumber.ZERO,
    },
    lifetime: {
      ore: BigNumber.ZERO,
      alloy: BigNumber.ZERO,
      energy: BigNumber.ZERO,
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
      biggestPulse: BigNumber.ZERO,
    },
    lastActiveAt: now,
    checksum: "",
  };
}

export function cloneState(state: GameState): GameState {
  return {
    version: state.version,
    resources: {
      ore: state.resources.ore,
      alloy: state.resources.alloy,
      energy: state.resources.energy,
      quarks: state.resources.quarks,
    },
    lifetime: {
      ore: state.lifetime.ore,
      alloy: state.lifetime.alloy,
      energy: state.lifetime.energy,
    },
    generators: { ...state.generators },
    research: { ...state.research },
    quarkUpgrades: { ...state.quarkUpgrades },
    quarksEarned: state.quarksEarned,
    stats: { ...state.stats },
    lastActiveAt: state.lastActiveAt,
    checksum: state.checksum,
  };
}
