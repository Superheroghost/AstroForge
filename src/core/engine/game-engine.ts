import { TICK_DT, UI_HZ, AUTOSAVE_MS } from "@/domain/catalog";
import { createInitialState, type GameState, type Intent, type OfflineProgressResult } from "@/domain/models";
import {
  applyBuyGenerator,
  applyBuyQuark,
  applyBuyResearch,
  applyPrestige,
  applyPulse,
  applyTick,
} from "@/domain/simulation";
import { applyOfflineCatchUp, sealState } from "@/core/offline/offline";
import { loadState, saveState } from "@/data/save";

export type EngineListener = (state: GameState, meta: { pulse: number; bought: boolean }) => void;

const MAX_FRAME_DT = 0.1;
const UI_DT = 1 / UI_HZ;

/**
 * Decoupled sim/render loop.
 * - Simulation steps at 15 Hz on a rAF accumulator (never setInterval).
 * - UI subscribers are throttled to ~10 Hz so React does not thrash.
 * - Visibility pause records a timestamp; resume uses closed-form catch-up.
 */
export class GameEngine {
  state: GameState;
  private acc = 0;
  private lastPerf = 0;
  private raf = 0;
  private running = false;
  private uiAcc = 0;
  private saveAcc = 0;
  private listeners = new Set<EngineListener>();
  private lastPulse = 0;
  private lastBought = false;
  private reducedMotion = false;

  constructor(state: GameState) {
    this.state = state;
  }

  static boot(): { engine: GameEngine; offline: OfflineProgressResult | null } {
    const loaded = loadState();
    const state = loaded ?? createInitialState();
    const engine = new GameEngine(state);
    const offline = loaded ? applyOfflineCatchUp(state) : null;
    if (!loaded) sealState(state);
    saveState(state);
    return { engine, offline };
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn);
    fn(this.state, { pulse: 0, bought: false });
    return () => {
      this.listeners.delete(fn);
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.acc = 0;
    this.uiAcc = 0;
    this.lastPerf = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      let dt = (now - this.lastPerf) / 1000;
      this.lastPerf = now;
      if (dt > MAX_FRAME_DT) dt = MAX_FRAME_DT;
      if (dt < 0) dt = 0;
      this.step(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    sealState(this.state);
    saveState(this.state);
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  dispatch(intent: Intent): boolean {
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
        break;
    }
    if (changed) this.emit(true);
    return changed;
  }

  handleVisibility(hidden: boolean): OfflineProgressResult | null {
    if (hidden) {
      this.stop();
      return null;
    }
    const offline = applyOfflineCatchUp(this.state);
    this.start();
    if (offline) this.emit(true);
    return offline;
  }

  private step(dt: number): void {
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
    if (this.saveAcc >= AUTOSAVE_MS / 1000) {
      this.saveAcc = 0;
      sealState(this.state);
      saveState(this.state);
    }
  }

  private emit(force: boolean): void {
    void force;
    const pulse = this.lastPulse;
    const bought = this.lastBought;
    this.lastPulse = 0;
    this.lastBought = false;
    for (const fn of this.listeners) fn(this.state, { pulse, bought });
  }
}

export function bindLifecycle(engine: GameEngine, onOffline: (r: OfflineProgressResult | null) => void): () => void {
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
