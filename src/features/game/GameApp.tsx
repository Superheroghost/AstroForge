import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, RotateCcw, Settings, Upload, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bindLifecycle, GameEngine } from "@/core/engine/game-engine";
import { BigNumber, bn, formatRate, formatSuffix } from "@/core/math/big-number";
import { formatDuration } from "@/core/offline/offline";
import { BUY_MODES, ForgePanel, ProtocolPanel, ResearchPanel, SwarmPanel } from "@/features/game/panels";
import { audio, haptic, hydrateMute } from "@/features/game/audio";
import { OrbitalCanvas } from "@/features/game/OrbitalCanvas";
import {
  GENERATORS,
  RESOURCE_META,
  type BuyMode,
  type ResourceId,
  type TabId,
} from "@/domain/catalog";
import type { OfflineProgressResult } from "@/domain/models";
import { computeRates, generatorLevel, productionMultiplier } from "@/domain/simulation";
import { clearSave, exportSave, importSave } from "@/data/save";
import { cn } from "@/lib/utils";
import { milestoneMultiplier } from "@/core/math/formulas";

const TABS: { id: TabId; label: string }[] = [
  { id: "forge", label: "Forge" },
  { id: "research", label: "Research" },
  { id: "swarm", label: "Swarm" },
  { id: "protocol", label: "Protocol" },
];

function perGeneratorRates(state: ReturnType<GameEngine["getState"]>): Record<string, BigNumber> {
  const m = productionMultiplier(state);
  const out: Record<string, BigNumber> = {};
  for (const def of GENERATORS) {
    const level = generatorLevel(state, def.id);
    const genMult = (m.gens[def.id] ?? 1) * milestoneMultiplier(level);
    const resMult = def.resource === "ore" ? m.ore : def.resource === "alloy" ? m.alloy : m.energy;
    out[def.id] = bn(def.baseProd).mulNum(level).mulNum(genMult * resMult * m.all);
  }
  return out;
}

function ResourceChip({
  id,
  valueRef,
  rateRef,
}: {
  id: ResourceId;
  valueRef: React.RefObject<HTMLSpanElement | null>;
  rateRef?: React.RefObject<HTMLSpanElement | null>;
}) {
  const meta = RESOURCE_META[id];
  return (
    <div className="min-w-0 rounded-lg bg-surface px-3 py-2">
      <div className="text-xs font-medium tracking-wide text-subtle uppercase">{meta.short}</div>
      <span ref={valueRef} className="block truncate font-medium text-fg tabular">
        0
      </span>
      {id !== "quarks" ? (
        <span ref={rateRef} className="block text-xs text-muted tabular">
          +0/s
        </span>
      ) : (
        <div className="text-xs text-muted">held</div>
      )}
    </div>
  );
}

export function GameApp() {
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [revision, setRevision] = useState(0);
  const [entered, setEntered] = useState(false);
  const [buyMode, setBuyMode] = useState<BuyMode>(1);
  const [tab, setTab] = useState<TabId>("forge");
  const [muted, setMuted] = useState(false);
  const [settings, setSettings] = useState(false);
  const [offline, setOffline] = useState<OfflineProgressResult | null>(null);
  const [confirmPrestige, setConfirmPrestige] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const oreRef = useRef<HTMLSpanElement>(null);
  const alloyRef = useRef<HTMLSpanElement>(null);
  const energyRef = useRef<HTMLSpanElement>(null);
  const quarkRef = useRef<HTMLSpanElement>(null);
  const oreRateRef = useRef<HTMLSpanElement>(null);
  const alloyRateRef = useRef<HTMLSpanElement>(null);
  const energyRateRef = useRef<HTMLSpanElement>(null);
  const shown = useRef({
    ore: BigNumber.ZERO,
    alloy: BigNumber.ZERO,
    energy: BigNumber.ZERO,
    quarks: BigNumber.ZERO,
  });

  useEffect(() => {
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
    const dbg = {
      getState: () => boot.getState(),
      pulse: () => boot.dispatch({ type: "pulse" }),
      buy: (id: string) => boot.dispatch({ type: "buyGenerator", id, mode: 1 as const }),
    };
    (window as unknown as { __astroforge: typeof dbg }).__astroforge = dbg;
    return () => {
      unsub();
      unlife();
    };
  }, []);

  useEffect(() => {
    if (!engine) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      const s = engine.getState();
      const k = 1 - Math.exp(-10 * dt);
      const lerp = (cur: BigNumber, target: BigNumber) => cur.add(target.sub(cur).mulNum(k));
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

  const pulse = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    audio.unlock();
    audio.pulse();
    haptic("pulse");
    eng.dispatch({ type: "pulse" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
  const genRates = useMemo(() => (state ? perGeneratorRates(state) : {}), [state, revision]);

  const buyGen = (id: string) => {
    const eng = engineRef.current;
    if (!eng || !state) return;
    const before = generatorLevel(eng.getState(), id);
    const ok = eng.dispatch({ type: "buyGenerator", id, mode: buyMode });
    if (!ok) return;
    const after = generatorLevel(eng.getState(), id);
    const crossed =
      Math.floor(before / 25) !== Math.floor(after / 25) || (before < 10 && after >= 10);
    audio.buy(crossed);
    haptic(crossed ? "milestone" : "buy");
  };

  const buyResearch = (id: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.dispatch({ type: "buyResearch", id })) {
      audio.research();
      haptic("buy");
    }
  };

  const buyQuark = (id: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.dispatch({ type: "buyQuark", id })) {
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
      const text = await navigator.clipboard.readText();
      const next = importSave(text);
      if (!next || !engine) {
        setToast("Invalid save");
        return;
      }
      engine.dispatch({ type: "importState", state: next });
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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!engine || !state) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        <p className="font-display text-sm tracking-wide">Calibrating swarm…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg text-fg lg:h-dvh lg:overflow-hidden">
      {!entered ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg px-6">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">Stellar foundry</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-6xl">AstroForge</h1>
          <p className="mt-2 text-sm tracking-widest text-accent uppercase">Dyson Protocol</p>
          <p className="mt-6 max-w-sm text-center text-sm text-muted">
            Mine the belt. Refine the alloy. Raise a swarm around the star. When the yield is enough,
            collapse it.
          </p>
          <Button className="mt-8 min-w-48" size="lg" onClick={enter}>
            {hasSave ? "Resume protocol" : "Initialize protocol"}
          </Button>
        </div>
      ) : null}

      <header className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div>
          <p className="font-display text-lg font-semibold leading-none tracking-tight">AstroForge</p>
          <p className="mt-1 text-xs tracking-widest text-muted uppercase">Dyson Protocol</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => setSettings(true)}>
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-col lg:flex-1">
          <div className="grid grid-cols-4 gap-2 px-4">
            <ResourceChip id="ore" valueRef={oreRef} rateRef={oreRateRef} />
            <ResourceChip id="alloy" valueRef={alloyRef} rateRef={alloyRateRef} />
            <ResourceChip id="energy" valueRef={energyRef} rateRef={energyRateRef} />
            <ResourceChip id="quarks" valueRef={quarkRef} />
          </div>
          <div className="mt-3 h-[34vh] min-h-52 max-h-80 w-full sm:h-[38vh] lg:h-auto lg:max-h-none lg:min-h-0 lg:flex-1">
            <OrbitalCanvas engine={engine} onPulse={pulse} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:w-96 lg:flex-none lg:border-l lg:border-border">
          <div className="flex items-center gap-2 px-4 pt-3">
            <div
              className="flex flex-1 rounded-lg bg-surface-2 p-1"
              role="tablist"
              aria-label="Purchase quantity"
            >
              {BUY_MODES.map((m) => (
                <button
                  key={String(m)}
                  type="button"
                  className={cn(
                    "h-9 min-h-9 flex-1 rounded-sm text-xs font-medium",
                    buyMode === m ? "bg-surface text-fg" : "text-muted hover:text-fg",
                  )}
                  onClick={() => setBuyMode(m)}
                >
                  {m === "max" ? "Max" : `×${m}`}
                </button>
              ))}
            </div>
          </div>

          <nav className="mt-2 flex gap-1 px-4" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "h-11 min-h-11 flex-1 rounded-md text-sm font-medium",
                  tab === t.id ? "bg-surface text-fg" : "text-muted hover:text-fg",
                )}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="mt-3 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {tab === "forge" ? (
              <ForgePanel state={state} rates={genRates} mode={buyMode} onBuy={buyGen} />
            ) : null}
            {tab === "research" ? <ResearchPanel state={state} onBuy={buyResearch} /> : null}
            {tab === "swarm" ? (
              <SwarmPanel state={state} rates={genRates} mode={buyMode} onBuy={buyGen} />
            ) : null}
            {tab === "protocol" ? (
              <ProtocolPanel state={state} onQuark={buyQuark} onPrestige={() => setConfirmPrestige(true)} />
            ) : null}
          </div>
        </div>
      </div>

      {entered && offline ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-xl font-semibold tracking-tight">While you were away</h2>
            <p className="mt-1 text-sm text-muted">
              {formatDuration(offline.secondsAway)} elapsed
              {offline.capped ? ` · credited ${formatDuration(offline.cappedSeconds)}` : ""}
            </p>
            {offline.clockAnomaly || offline.checksumFailed ? (
              <p className="mt-3 text-sm text-danger">
                Clock or state verification failed. Offline yield was not applied.
              </p>
            ) : (
              <ul className="mt-4 space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted">Ore</span>
                  <span className="tabular">+{formatSuffix(offline.gained.ore)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">Alloy</span>
                  <span className="tabular">+{formatSuffix(offline.gained.alloy)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">Energy</span>
                  <span className="tabular">+{formatSuffix(offline.gained.energy)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">Swarm</span>
                  <span className="tabular">
                    {Math.round(offline.dysonBefore * 100)}% → {Math.round(offline.dysonAfter * 100)}%
                  </span>
                </li>
              </ul>
            )}
            <Button className="mt-5 w-full" onClick={() => setOffline(null)}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {confirmPrestige ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-display text-xl font-semibold tracking-tight">Ignite supernova</h2>
            <p className="mt-2 text-sm text-muted">
              This protocol ends. Drones, research, and stockpiles reset. Quarks and artifacts persist.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmPrestige(false)}>
                Abort
              </Button>
              <Button variant="danger" className="flex-1" onClick={doPrestige}>
                Ignite
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {settings ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-bg/70">
          <div className="flex h-full w-full max-w-sm flex-col border-l border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">Settings</h2>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setSettings(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted">
              Autosaves locally every 30 seconds and when you leave.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="secondary" onClick={toggleMute}>
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                {muted ? "Sound off" : "Sound on"}
              </Button>
              <Button variant="secondary" onClick={copySave}>
                <Download className="size-4" />
                Export save
              </Button>
              <Button variant="secondary" onClick={pasteSave}>
                <Upload className="size-4" />
                Import from clipboard
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm("Wipe local save and restart the protocol?")) wipe();
                }}
              >
                <RotateCcw className="size-4" />
                Reset save
              </Button>
            </div>
            <p className="mt-auto pt-8 text-xs text-subtle">
              Space pulses the star. Progress stores on this device.
            </p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
