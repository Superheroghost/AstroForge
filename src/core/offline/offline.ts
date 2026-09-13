import { BigNumber } from "@/core/math/big-number";
import { MAX_OFFLINE_HOURS_HARD, OFFLINE_POPUP_MIN_SEC } from "@/domain/catalog";
import { type GameState, type OfflineProgressResult } from "@/domain/models";
import { applyTick, dysonProgress, productionMultiplier } from "@/domain/simulation";

const CLOCK_FUDGE_MS = 2_000;

/**
 * djb2 of canonical fields. Not cryptographic — the browser is untrusted —
 * but a mismatch plus a rewound clock is a strong signal to skip catch-up.
 */
export function computeChecksum(state: GameState): string {
  const payload = [
    state.version,
    state.resources.ore.toSci(6),
    state.resources.alloy.toSci(6),
    state.resources.energy.toSci(6),
    state.resources.quarks.toSci(6),
    state.lifetime.energy.toSci(6),
    state.stats.prestiges,
    state.lastActiveAt,
  ].join("|");
  let h = 5381;
  for (let i = 0; i < payload.length; i++) {
    h = ((h << 5) + h) ^ payload.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export function sealState(state: GameState, now = Date.now()): GameState {
  state.lastActiveAt = now;
  state.checksum = computeChecksum(state);
  return state;
}

function checksumMatches(state: GameState): boolean {
  return state.checksum === computeChecksum(state);
}

/**
 * Analytical catch-up. Production is a closed form (rate × Δt) because
 * generators do not consume inputs. No per-tick loop over missed hours.
 */
export function applyOfflineCatchUp(
  state: GameState,
  now = Date.now(),
): OfflineProgressResult | null {
  const checksumFailed = !checksumMatches(state);
  const saved = state.lastActiveAt || now;
  const rawDeltaMs = now - saved;
  let clockAnomaly = false;

  if (rawDeltaMs < -CLOCK_FUDGE_MS) {
    clockAnomaly = true;
  }

  const maxHours = Math.min(productionMultiplier(state).offlineHours, MAX_OFFLINE_HOURS_HARD);
  const maxMs = maxHours * 3600 * 1000;
  const uncappedSec = clockAnomaly ? 0 : Math.max(0, rawDeltaMs / 1000);
  const cappedSeconds = Math.min(uncappedSec, maxMs / 1000);
  const capped = uncappedSec > cappedSeconds + 1;

  const dysonBefore = dysonProgress(state);
  const beforeOre = state.resources.ore;
  const beforeAlloy = state.resources.alloy;
  const beforeEnergy = state.resources.energy;

  if (cappedSeconds > 0 && !checksumFailed && !clockAnomaly) {
    applyTick(state, cappedSeconds);
  }

  state.lastActiveAt = now;
  state.checksum = computeChecksum(state);

  if (cappedSeconds < OFFLINE_POPUP_MIN_SEC) return null;

  return {
    secondsAway: clockAnomaly ? 0 : uncappedSec,
    cappedSeconds,
    capped,
    clockAnomaly,
    checksumFailed,
    gained: {
      ore: checksumFailed || clockAnomaly ? BigNumber.ZERO : state.resources.ore.sub(beforeOre),
      alloy: checksumFailed || clockAnomaly ? BigNumber.ZERO : state.resources.alloy.sub(beforeAlloy),
      energy: checksumFailed || clockAnomaly ? BigNumber.ZERO : state.resources.energy.sub(beforeEnergy),
    },
    dysonBefore,
    dysonAfter: dysonProgress(state),
  };
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
