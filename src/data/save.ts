import { BigNumber } from "@/core/math/big-number";
import { computeChecksum, sealState } from "@/core/offline/offline";
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from "@/domain/catalog";
import { createInitialState, type GameState } from "@/domain/models";

interface Persisted {
  version: number;
  resources: Record<string, { m: number; e: number }>;
  lifetime: Record<string, { m: number; e: number }>;
  generators: Record<string, number>;
  research: Record<string, boolean>;
  quarkUpgrades: Record<string, number>;
  quarksEarned: { m: number; e: number };
  stats: {
    totalClicks: number;
    prestiges: number;
    startedAt: number;
    playTimeSec: number;
    totalSpentOre: { m: number; e: number };
    biggestPulse: { m: number; e: number };
  };
  lastActiveAt: number;
  checksum: string;
}

function bnField(raw: unknown): BigNumber {
  return BigNumber.fromJSON(raw);
}

function migrate(raw: Persisted): Persisted {
  const p = { ...raw };
  if (!p.version || p.version < 1) p.version = SAVE_VERSION;
  return p;
}

export function serializeState(state: GameState): Persisted {
  return {
    version: state.version,
    resources: {
      ore: state.resources.ore.toJSON(),
      alloy: state.resources.alloy.toJSON(),
      energy: state.resources.energy.toJSON(),
      quarks: state.resources.quarks.toJSON(),
    },
    lifetime: {
      ore: state.lifetime.ore.toJSON(),
      alloy: state.lifetime.alloy.toJSON(),
      energy: state.lifetime.energy.toJSON(),
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
      biggestPulse: state.stats.biggestPulse.toJSON(),
    },
    lastActiveAt: state.lastActiveAt,
    checksum: state.checksum,
  };
}

export function deserializeState(raw: Persisted): GameState {
  const p = migrate(raw);
  const base = createInitialState(p.stats?.startedAt ?? Date.now());
  return {
    ...base,
    version: SAVE_VERSION,
    resources: {
      ore: bnField(p.resources?.ore),
      alloy: bnField(p.resources?.alloy),
      energy: bnField(p.resources?.energy),
      quarks: bnField(p.resources?.quarks),
    },
    lifetime: {
      ore: bnField(p.lifetime?.ore),
      alloy: bnField(p.lifetime?.alloy),
      energy: bnField(p.lifetime?.energy),
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
      biggestPulse: bnField(p.stats?.biggestPulse),
    },
    lastActiveAt: p.lastActiveAt ?? Date.now(),
    checksum: p.checksum ?? "",
  };
}

export function saveState(state: GameState): boolean {
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

export function loadState(): GameState | null {
  if (typeof localStorage === "undefined") return null;
  const tryParse = (key: string): GameState | null => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Persisted;
      if (!parsed || typeof parsed !== "object") return null;
      return deserializeState(parsed);
    } catch {
      return null;
    }
  };
  return tryParse(SAVE_KEY) ?? tryParse(SAVE_BACKUP_KEY);
}

export function clearSave(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVE_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

export function exportSave(state: GameState): string {
  sealState(state);
  const json = JSON.stringify(serializeState(state));
  return btoa(unescape(encodeURIComponent(json)));
}

export function importSave(payload: string): GameState | null {
  try {
    const json = decodeURIComponent(escape(atob(payload.trim())));
    const parsed = JSON.parse(json) as Persisted;
    const state = deserializeState(parsed);
    if (!state.checksum) state.checksum = computeChecksum(state);
    return state;
  } catch {
    return null;
  }
}
