import { BigNumber, bn } from "@/core/math/big-number";

export type ResourceId = "ore" | "alloy" | "energy" | "quarks";
export type BuyMode = 1 | 10 | 100 | "max";
export type TabId = "forge" | "research" | "swarm" | "protocol";

export interface GeneratorDef {
  id: string;
  name: string;
  blurb: string;
  resource: Exclude<ResourceId, "quarks">;
  baseCost: number;
  costResource: Exclude<ResourceId, "quarks">;
  costMult: number;
  baseProd: number;
  unlock:
    | { type: "start" }
    | { type: "generator"; id: string; level: number }
    | { type: "research"; id: string };
}

export type ResearchEffect =
  | { type: "unlock"; generatorId: string }
  | { type: "mult"; scope: "all" | Exclude<ResourceId, "quarks"> | { gen: string }; value: number }
  | { type: "click"; value: number }
  | { type: "offlineHours"; value: number };

export interface ResearchDef {
  id: string;
  name: string;
  blurb: string;
  tier: number;
  cost: { resource: Exclude<ResourceId, "quarks">; amount: number };
  requires: string[];
  effect: ResearchEffect;
}

export type QuarkEffect =
  | { type: "mult"; value: number }
  | { type: "cost"; value: number }
  | { type: "offlineHours"; value: number }
  | { type: "click"; value: number }
  | { type: "startOre"; value: number };

export interface QuarkUpgradeDef {
  id: string;
  name: string;
  blurb: string;
  baseCost: number;
  costMult: number;
  effect: QuarkEffect;
  max?: number;
}

export const TICK_HZ = 15;
export const TICK_DT = 1 / TICK_HZ;
export const UI_HZ = 10;
export const AUTOSAVE_MS = 30_000;
export const OFFLINE_POPUP_MIN_SEC = 30;
export const BASE_OFFLINE_HOURS = 4;
export const MAX_OFFLINE_HOURS_HARD = 72;
export const SAVE_VERSION = 1;
export const SAVE_KEY = "astroforge.dyson.v1";
export const SAVE_BACKUP_KEY = "astroforge.dyson.v1.bak";

export const GENERATORS: readonly GeneratorDef[] = [
  {
    id: "drone",
    name: "Mining Drone",
    blurb: "Autonomous prospector. Strips nickel-iron from near rocks.",
    resource: "ore",
    costResource: "ore",
    baseCost: 10,
    costMult: 1.15,
    baseProd: 0.6,
    unlock: { type: "start" },
  },
  {
    id: "harvester",
    name: "Asteroid Harvester",
    blurb: "Tugs entire chondrites into the foundry mouth.",
    resource: "ore",
    costResource: "ore",
    baseCost: 85,
    costMult: 1.14,
    baseProd: 4.5,
    unlock: { type: "generator", id: "drone", level: 8 },
  },
  {
    id: "refinery",
    name: "Refinery Array",
    blurb: "Cracks bulk ore into lattice-perfect exo-alloy.",
    resource: "alloy",
    costResource: "ore",
    baseCost: 420,
    costMult: 1.13,
    baseProd: 1.4,
    unlock: { type: "research", id: "alloy-smelting" },
  },
  {
    id: "laser",
    name: "Orbital Laser",
    blurb: "Cuts high-grade veins from a silent geostationary perch.",
    resource: "alloy",
    costResource: "alloy",
    baseCost: 960,
    costMult: 1.13,
    baseProd: 9,
    unlock: { type: "research", id: "orbital-mechanics" },
  },
  {
    id: "siphon",
    name: "Fusion Siphon",
    blurb: "Skims coronal plasma and condenses it to usable flux.",
    resource: "energy",
    costResource: "alloy",
    baseCost: 4800,
    costMult: 1.12,
    baseProd: 12,
    unlock: { type: "research", id: "stellar-cartography" },
  },
  {
    id: "swarm",
    name: "Dyson Swarm Node",
    blurb: "A mirror-sat that drinks starlight and routes it home.",
    resource: "energy",
    costResource: "energy",
    baseCost: 36_000,
    costMult: 1.12,
    baseProd: 95,
    unlock: { type: "research", id: "dyson-blueprint" },
  },
  {
    id: "forge",
    name: "Stellar Forge",
    blurb: "Matter-works suspended in the photosphere.",
    resource: "energy",
    costResource: "energy",
    baseCost: 520_000,
    costMult: 1.11,
    baseProd: 880,
    unlock: { type: "research", id: "photospheric-foundry" },
  },
  {
    id: "quantum",
    name: "Quantum Array",
    blurb: "Harvests vacuum fluctuation along a closed timelike loop.",
    resource: "energy",
    costResource: "energy",
    baseCost: 8_400_000,
    costMult: 1.11,
    baseProd: 9200,
    unlock: { type: "research", id: "quantum-lattice" },
  },
];

export const RESEARCH: readonly ResearchDef[] = [
  {
    id: "drone-firmware",
    name: "Drone Firmware",
    blurb: "Smarter pathing. Mining Drones produce 50% more.",
    tier: 0,
    cost: { resource: "ore", amount: 25 },
    requires: [],
    effect: { type: "mult", scope: { gen: "drone" }, value: 1.5 },
  },
  {
    id: "alloy-smelting",
    name: "Alloy Smelting",
    blurb: "Unlocks the Refinery Array.",
    tier: 1,
    cost: { resource: "ore", amount: 160 },
    requires: ["drone-firmware"],
    effect: { type: "unlock", generatorId: "refinery" },
  },
  {
    id: "harvest-optics",
    name: "Harvest Optics",
    blurb: "Lidar veins. All ore generators ×2.",
    tier: 1,
    cost: { resource: "ore", amount: 220 },
    requires: ["drone-firmware"],
    effect: { type: "mult", scope: "ore", value: 2 },
  },
  {
    id: "orbital-mechanics",
    name: "Orbital Mechanics",
    blurb: "Unlocks the Orbital Laser.",
    tier: 2,
    cost: { resource: "alloy", amount: 80 },
    requires: ["alloy-smelting"],
    effect: { type: "unlock", generatorId: "laser" },
  },
  {
    id: "flux-catalysis",
    name: "Flux Catalysis",
    blurb: "Alloy output ×2.",
    tier: 2,
    cost: { resource: "alloy", amount: 140 },
    requires: ["alloy-smelting"],
    effect: { type: "mult", scope: "alloy", value: 2 },
  },
  {
    id: "pulse-capacitors",
    name: "Pulse Capacitors",
    blurb: "Manual mining pulse ×3.",
    tier: 2,
    cost: { resource: "ore", amount: 900 },
    requires: ["harvest-optics"],
    effect: { type: "click", value: 3 },
  },
  {
    id: "stellar-cartography",
    name: "Stellar Cartography",
    blurb: "Maps safe corona lanes. Unlocks Fusion Siphon.",
    tier: 3,
    cost: { resource: "alloy", amount: 720 },
    requires: ["orbital-mechanics"],
    effect: { type: "unlock", generatorId: "siphon" },
  },
  {
    id: "corona-taps",
    name: "Corona Taps",
    blurb: "Energy output ×2.",
    tier: 4,
    cost: { resource: "energy", amount: 2400 },
    requires: ["stellar-cartography"],
    effect: { type: "mult", scope: "energy", value: 2 },
  },
  {
    id: "dyson-blueprint",
    name: "Dyson Blueprint",
    blurb: "The protocol's core schematic. Unlocks Swarm Nodes.",
    tier: 4,
    cost: { resource: "energy", amount: 12_000 },
    requires: ["stellar-cartography"],
    effect: { type: "unlock", generatorId: "swarm" },
  },
  {
    id: "swarm-lattice",
    name: "Swarm Lattice",
    blurb: "Tighter packing. Swarm Nodes ×2.",
    tier: 5,
    cost: { resource: "energy", amount: 80_000 },
    requires: ["dyson-blueprint"],
    effect: { type: "mult", scope: { gen: "swarm" }, value: 2 },
  },
  {
    id: "photospheric-foundry",
    name: "Photospheric Foundry",
    blurb: "Unlocks the Stellar Forge.",
    tier: 5,
    cost: { resource: "energy", amount: 160_000 },
    requires: ["dyson-blueprint"],
    effect: { type: "unlock", generatorId: "forge" },
  },
  {
    id: "temporal-dilators",
    name: "Temporal Dilators",
    blurb: "Offline catch-up cap +8 hours.",
    tier: 5,
    cost: { resource: "alloy", amount: 24_000 },
    requires: ["flux-catalysis"],
    effect: { type: "offlineHours", value: 8 },
  },
  {
    id: "quantum-lattice",
    name: "Quantum Lattice",
    blurb: "Unlocks the Quantum Array.",
    tier: 6,
    cost: { resource: "energy", amount: 2_200_000 },
    requires: ["photospheric-foundry"],
    effect: { type: "unlock", generatorId: "quantum" },
  },
  {
    id: "harmonic-resonance",
    name: "Harmonic Resonance",
    blurb: "All production ×2.",
    tier: 6,
    cost: { resource: "energy", amount: 9_000_000 },
    requires: ["swarm-lattice", "quantum-lattice"],
    effect: { type: "mult", scope: "all", value: 2 },
  },
  {
    id: "protocol-key",
    name: "Protocol Key",
    blurb: "Final-run amplifier. All production ×3.",
    tier: 7,
    cost: { resource: "energy", amount: 80_000_000 },
    requires: ["harmonic-resonance"],
    effect: { type: "mult", scope: "all", value: 3 },
  },
];

export const QUARK_UPGRADES: readonly QuarkUpgradeDef[] = [
  {
    id: "yield",
    name: "Quantum Yield",
    blurb: "+20% all production per rank. Survives supernova.",
    baseCost: 1,
    costMult: 1.55,
    effect: { type: "mult", value: 0.2 },
  },
  {
    id: "compression",
    name: "Cost Compression",
    blurb: "−5% generator costs per rank (multiplicative).",
    baseCost: 2,
    costMult: 1.7,
    effect: { type: "cost", value: 0.05 },
    max: 12,
  },
  {
    id: "chronometers",
    name: "Chronometers",
    blurb: "+3 hours offline cap per rank.",
    baseCost: 2,
    costMult: 1.65,
    effect: { type: "offlineHours", value: 3 },
    max: 16,
  },
  {
    id: "amplifiers",
    name: "Pulse Amplifiers",
    blurb: "+150% mining pulse per rank.",
    baseCost: 1,
    costMult: 1.5,
    effect: { type: "click", value: 1.5 },
  },
  {
    id: "seed-cache",
    name: "Seed Cache",
    blurb: "Start each protocol with 25× more ore per rank.",
    baseCost: 3,
    costMult: 2,
    effect: { type: "startOre", value: 25 },
    max: 10,
  },
];

export const GEN_BY_ID: Record<string, GeneratorDef> = Object.fromEntries(
  GENERATORS.map((g) => [g.id, g]),
);
export const RESEARCH_BY_ID: Record<string, ResearchDef> = Object.fromEntries(
  RESEARCH.map((r) => [r.id, r]),
);
export const QUARK_BY_ID: Record<string, QuarkUpgradeDef> = Object.fromEntries(
  QUARK_UPGRADES.map((q) => [q.id, q]),
);

export const RESOURCE_META: Record<
  ResourceId,
  { label: string; short: string; order: number }
> = {
  ore: { label: "Scrap Ore", short: "Ore", order: 0 },
  alloy: { label: "Exo-Alloy", short: "Alloy", order: 1 },
  energy: { label: "Stellar Energy", short: "Energy", order: 2 },
  quarks: { label: "Quarks", short: "Quarks", order: 3 },
};

export function generatorBaseCost(def: GeneratorDef): BigNumber {
  return bn(def.baseCost);
}
