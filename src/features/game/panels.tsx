import { memo, useMemo } from "react";
import {
  Atom,
  Aperture,
  Bot,
  Factory,
  Hexagon,
  Lock,
  Sun,
  Waves,
  Container,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BigNumber, formatRate, formatSuffix } from "@/core/math/big-number";
import { milestoneMultiplier, nextMilestone } from "@/core/math/formulas";
import {
  GENERATORS,
  GEN_BY_ID,
  QUARK_UPGRADES,
  RESEARCH,
  RESOURCE_META,
  type BuyMode,
  type GeneratorDef,
  type ResearchDef,
  type ResourceId,
} from "@/domain/catalog";
import type { GameState } from "@/domain/models";
import {
  buyCost,
  buyCountForMode,
  canPrestige,
  dysonProgress,
  generatorLevel,
  generatorNextCost,
  isGeneratorUnlocked,
  isResearchAvailable,
  isResearchOwned,
  nextQuarkEnergy,
  pendingQuarks,
  quarkLevel,
  quarkUpgradeCost,
  researchOwnedCount,
} from "@/domain/simulation";
import { cn } from "@/lib/utils";

const GEN_ICON: Record<string, typeof Bot> = {
  drone: Bot,
  harvester: Container,
  refinery: Factory,
  laser: Aperture,
  siphon: Waves,
  swarm: Hexagon,
  forge: Sun,
  quantum: Atom,
};

function resLabel(id: ResourceId): string {
  return RESOURCE_META[id].short;
}

function MilestoneBar({ level }: { level: number }) {
  const next = nextMilestone(level);
  const prev = next === 10 ? 0 : next === 25 ? 10 : next - 25;
  const span = Math.max(1, next - prev);
  const t = Math.min(1, (level - prev) / span);
  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between text-xs text-subtle">
        <span>×{milestoneMultiplier(level)}</span>
        <span>
          {level}/{next}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${t * 100}%` }}
        />
      </div>
    </div>
  );
}

export const GeneratorRow = memo(function GeneratorRow({
  def,
  state,
  mode,
  rate,
  onBuy,
}: {
  def: GeneratorDef;
  state: GameState;
  mode: BuyMode;
  rate: BigNumber;
  onBuy: (id: string) => void;
}) {
  const unlocked = isGeneratorUnlocked(state, def);
  const level = generatorLevel(state, def.id);
  const count = unlocked ? buyCountForMode(state, def, mode) : 0;
  const cost = count > 0 ? buyCost(state, def, count) : generatorNextCost(state, def);
  const affordable = count > 0;
  const Icon = GEN_ICON[def.id] ?? Hexagon;
  const shown = mode === "max" ? Math.max(1, count) : (mode as number);

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        !unlocked && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-accent">
          {unlocked ? <Icon className="size-4" strokeWidth={1.75} /> : <Lock className="size-4 text-muted" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-base font-semibold tracking-tight">{def.name}</h3>
            <span className="tabular text-xs text-muted">Lv {level}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted">{def.blurb}</p>
          {unlocked ? (
            <p className="mt-1 tabular text-sm text-fg">
              {resLabel(def.resource)} {formatRate(rate)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-subtle">{unlockHint(def)}</p>
          )}
          {unlocked ? <MilestoneBar level={level} /> : null}
        </div>
      </div>
      {unlocked ? (
        <Button
          className="mt-3 w-full"
          variant={affordable ? "primary" : "secondary"}
          disabled={!affordable}
          onClick={() => onBuy(def.id)}
        >
          <span>Buy {mode === "max" ? (count || 1) : shown}</span>
          <span className="tabular opacity-80">
            {formatSuffix(cost)} {resLabel(def.costResource)}
          </span>
        </Button>
      ) : null}
    </article>
  );
});

function unlockHint(def: GeneratorDef): string {
  const u = def.unlock;
  if (u.type === "start") return "Available";
  if (u.type === "generator") {
    const src = GEN_BY_ID[u.id];
    return `Requires ${src?.name ?? u.id} Lv ${u.level}`;
  }
  const name = RESEARCH.find((r) => r.id === u.id)?.name ?? u.id;
  return `Requires ${name}`;
}

export function ForgePanel({
  state,
  rates,
  mode,
  onBuy,
}: {
  state: GameState;
  rates: Record<string, BigNumber>;
  mode: BuyMode;
  onBuy: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {GENERATORS.map((def) => (
        <GeneratorRow
          key={def.id}
          def={def}
          state={state}
          mode={mode}
          rate={rates[def.id] ?? BigNumber.ZERO}
          onBuy={onBuy}
        />
      ))}
    </div>
  );
}

export function ResearchPanel({
  state,
  onBuy,
}: {
  state: GameState;
  onBuy: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<number, ResearchDef[]>();
    for (const r of RESEARCH) {
      const list = map.get(r.tier) ?? [];
      list.push(r);
      map.set(r.tier, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        {researchOwnedCount(state)} / {RESEARCH.length} protocols compiled
      </p>
      {groups.map(([tier, items]) => (
        <section key={tier} className="flex flex-col gap-3">
          <h3 className="text-xs font-medium tracking-wide text-subtle uppercase">Tier {tier}</h3>
          {items.map((def) => {
            const owned = isResearchOwned(state, def.id);
            const avail = isResearchAvailable(state, def.id);
            const cost = BigNumber.from(def.cost.amount);
            const can = avail && state.resources[def.cost.resource].gte(cost);
            return (
              <article
                key={def.id}
                className={cn(
                  "rounded-xl border border-border bg-surface p-4",
                  owned && "border-accent/30",
                  !owned && !avail && "opacity-55",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display font-semibold tracking-tight">{def.name}</h4>
                    <p className="mt-1 text-sm text-muted">{def.blurb}</p>
                    {!owned && !avail && def.requires.length > 0 ? (
                      <p className="mt-1 text-xs text-subtle">
                        Requires {def.requires.map((id) => RESEARCH.find((r) => r.id === id)?.name ?? id).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  {owned ? (
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-1 text-xs text-accent">Owned</span>
                  ) : null}
                </div>
                {!owned && avail ? (
                  <Button
                    className="mt-3 w-full"
                    variant={can ? "primary" : "secondary"}
                    disabled={!can}
                    onClick={() => onBuy(def.id)}
                  >
                    Compile
                    <span className="tabular opacity-80">
                      {formatSuffix(cost)} {resLabel(def.cost.resource)}
                    </span>
                  </Button>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

const DYSON_BEATS = [
  { at: 0, line: "No swarm. The star burns unclaimed." },
  { at: 0.08, line: "First mirrors catch a thin rind of light." },
  { at: 0.25, line: "A broken necklace of nodes. Power trickles in." },
  { at: 0.5, line: "Lattice closing. Photosphere dimming at the poles." },
  { at: 0.78, line: "The swarm sings. Night-side stations run at surplus." },
  { at: 0.95, line: "Protocol complete. The star is an instrument." },
];

export function SwarmPanel({
  state,
  rates,
  mode,
  onBuy,
}: {
  state: GameState;
  rates: Record<string, BigNumber>;
  mode: BuyMode;
  onBuy: (id: string) => void;
}) {
  const p = dysonProgress(state);
  const beat = [...DYSON_BEATS].reverse().find((b) => p >= b.at) ?? DYSON_BEATS[0];
  const energyGens = GENERATORS.filter((g) => g.resource === "energy");

  return (
    <div className="flex flex-col gap-3">
      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display font-semibold tracking-tight">Swarm integrity</h3>
          <span className="tabular text-sm text-accent">{Math.round(p * 100)}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${p * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">{beat.line}</p>
      </article>
      {energyGens.map((def) => (
        <GeneratorRow
          key={def.id}
          def={def}
          state={state}
          mode={mode}
          rate={rates[def.id] ?? BigNumber.ZERO}
          onBuy={onBuy}
        />
      ))}
    </div>
  );
}

export function ProtocolPanel({
  state,
  onQuark,
  onPrestige,
}: {
  state: GameState;
  onQuark: (id: string) => void;
  onPrestige: () => void;
}) {
  const pending = pendingQuarks(state);
  const ready = canPrestige(state);
  const nextE = nextQuarkEnergy(state);

  return (
    <div className="flex flex-col gap-4">
      <article className="rounded-xl border border-border bg-surface p-4">
        <h3 className="font-display text-lg font-semibold tracking-tight">Supernova Reset</h3>
        <p className="mt-2 text-sm text-muted">
          Collapse the current protocol. Generators and research revert. Lifetime energy and quark
          artifacts remain.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-subtle">Lifetime energy</dt>
            <dd className="tabular font-medium">{formatSuffix(state.lifetime.energy)}</dd>
          </div>
          <div>
            <dt className="text-subtle">Pending quarks</dt>
            <dd className="tabular font-medium text-accent">{formatSuffix(pending)}</dd>
          </div>
          <div>
            <dt className="text-subtle">Held quarks</dt>
            <dd className="tabular font-medium">{formatSuffix(state.resources.quarks)}</dd>
          </div>
          <div>
            <dt className="text-subtle">Next quark at</dt>
            <dd className="tabular font-medium">{formatSuffix(nextE)}</dd>
          </div>
        </dl>
        <Button className="mt-4 w-full" variant={ready ? "danger" : "secondary"} disabled={!ready} onClick={onPrestige}>
          {ready ? `Ignite supernova  ·  +${formatSuffix(pending)} quarks` : "Insufficient stellar yield"}
        </Button>
      </article>

      <h3 className="text-xs font-medium tracking-wide text-subtle uppercase">Quantum artifacts</h3>
      {QUARK_UPGRADES.map((def) => {
        const lv = quarkLevel(state, def.id);
        const maxed = def.max !== undefined && lv >= def.max;
        const cost = quarkUpgradeCost(state, def.id);
        const can = !maxed && state.resources.quarks.gte(cost);
        return (
          <article key={def.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="font-display font-semibold tracking-tight">{def.name}</h4>
              <span className="tabular text-xs text-muted">
                Rank {lv}
                {def.max ? `/${def.max}` : ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{def.blurb}</p>
            <Button
              className="mt-3 w-full"
              variant={can ? "primary" : "secondary"}
              disabled={!can}
              onClick={() => onQuark(def.id)}
            >
              {maxed ? "Capped" : "Install"}
              {!maxed ? <span className="tabular opacity-80">{formatSuffix(cost)} Q</span> : null}
            </Button>
          </article>
        );
      })}

      <article className="rounded-xl border border-border bg-surface p-4 text-sm">
        <h3 className="font-display font-semibold tracking-tight">Lifetime</h3>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-muted">
          <div>
            Prestiges <span className="tabular text-fg">{state.stats.prestiges}</span>
          </div>
          <div>
            Pulses <span className="tabular text-fg">{state.stats.totalClicks}</span>
          </div>
          <div>
            Ore mined <span className="tabular text-fg">{formatSuffix(state.lifetime.ore)}</span>
          </div>
          <div>
            Alloy forged <span className="tabular text-fg">{formatSuffix(state.lifetime.alloy)}</span>
          </div>
        </dl>
      </article>
    </div>
  );
}

export const BUY_MODES: BuyMode[] = [1, 10, 100, "max"];
