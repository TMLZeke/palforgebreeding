import type { Dataset, Pal } from "./types";

export type BaseTypeId =
  | "mining"
  | "logging"
  | "farm"
  | "crafting"
  | "breeding"
  | "power"
  | "cooling"
  | "medicine"
  | "allround";

export type BaseType = {
  id: BaseTypeId;
  label: string;
  blurb: string;
  /** Work type → importance weight. Types with weight >= 1.5 are "core". */
  weights: Record<string, number>;
};

export const BASE_TYPES: BaseType[] = [
  {
    id: "mining",
    label: "Mining",
    blurb: "Ore / coal / stone farm — miners plus haulers.",
    weights: { Mining: 3, Transporting: 1.5, Handiwork: 0.5 },
  },
  {
    id: "logging",
    label: "Logging",
    blurb: "Wood farm — lumberers plus haulers.",
    weights: { Lumbering: 3, Transporting: 1.5, Handiwork: 0.5 },
  },
  {
    id: "farm",
    label: "Farming & Ranch",
    blurb: "Crops and ranch drops — planters, waterers, gatherers, ranch pals.",
    weights: {
      Planting: 2.5,
      Watering: 2,
      Gathering: 1.5,
      Farming: 2,
      Transporting: 1,
    },
  },
  {
    id: "crafting",
    label: "Crafting / Production",
    blurb: "Assembly lines and crafting benches — handiwork above all.",
    weights: { Handiwork: 3, Transporting: 1.5 },
  },
  {
    id: "breeding",
    label: "Breeding / Cake",
    blurb: "Self-sufficient cake pipeline: crops, ranch, cooking, milling.",
    weights: {
      Farming: 2,
      Kindling: 1.5,
      Planting: 1.5,
      Watering: 1.5,
      Handiwork: 1,
      Transporting: 1,
    },
  },
  {
    id: "power",
    label: "Power",
    blurb: "Generators running around the clock.",
    weights: { GenerateElectricity: 3, Handiwork: 1 },
  },
  {
    id: "cooling",
    label: "Cooling / Food storage",
    blurb: "Fridges and coolers to keep food fresh.",
    weights: { Cooling: 3, Transporting: 1 },
  },
  {
    id: "medicine",
    label: "Medicine",
    blurb: "Medicine production plus herb gathering.",
    weights: { MedicineProduction: 3, Gathering: 1 },
  },
  {
    id: "allround",
    label: "All-round",
    blurb: "A bit of everything for a main base.",
    weights: {
      Kindling: 1,
      Watering: 1,
      Planting: 1,
      GenerateElectricity: 1,
      Handiwork: 1.5,
      Gathering: 1,
      Lumbering: 1,
      Mining: 1,
      MedicineProduction: 0.5,
      Cooling: 1,
      Transporting: 1.5,
      Farming: 1,
    },
  },
];

export type Recommendation = {
  pal: Pal;
  score: number;
  /** Work entries relevant to the chosen base type, sorted by contribution */
  relevantWork: Array<{ type: string; level: number }>;
};

/**
 * Greedy pick: each slot takes the pal with the best marginal value —
 * weighted work levels plus a bonus for covering core work types that no
 * already-picked pal covers. Excluded pals are skipped entirely.
 */
export function recommendBasePals(
  dataset: Dataset,
  baseType: BaseType,
  slots: number,
  excluded: Set<number>,
): Recommendation[] {
  const weights = baseType.weights;
  const coreTypes = Object.entries(weights)
    .filter(([, w]) => w >= 1.5)
    .map(([t]) => t);

  const candidates = dataset.pals.filter((p) => {
    if (excluded.has(p.id)) return false;
    return Object.keys(weights).some((t) => (p.work[t] ?? 0) > 0);
  });

  function baseScore(pal: Pal): number {
    let s = 0;
    for (const [type, weight] of Object.entries(weights)) {
      s += (pal.work[type] ?? 0) * weight;
    }
    return s;
  }

  const picked: Recommendation[] = [];
  const pickedIds = new Set<number>();
  const covered = new Set<string>();

  for (let slot = 0; slot < slots; slot++) {
    let best: { pal: Pal; value: number; score: number } | null = null;

    for (const pal of candidates) {
      if (pickedIds.has(pal.id)) continue;
      const score = baseScore(pal);
      if (score <= 0) continue;

      let coverageBonus = 0;
      for (const type of coreTypes) {
        if (!covered.has(type) && (pal.work[type] ?? 0) > 0) {
          coverageBonus += weights[type] * 2.5;
        }
      }

      const value = score + coverageBonus;
      if (!best || value > best.value) {
        best = { pal, value, score };
      }
    }

    if (!best) break;

    pickedIds.add(best.pal.id);
    for (const type of coreTypes) {
      if ((best.pal.work[type] ?? 0) > 0) covered.add(type);
    }

    const relevantWork = Object.entries(weights)
      .map(([type, weight]) => ({
        type,
        level: best!.pal.work[type] ?? 0,
        contribution: (best!.pal.work[type] ?? 0) * weight,
      }))
      .filter((w) => w.level > 0)
      .sort((a, b) => b.contribution - a.contribution)
      .map(({ type, level }) => ({ type, level }));

    picked.push({ pal: best.pal, score: best.score, relevantWork });
  }

  return picked;
}

export const WORK_LABELS: Record<string, string> = {
  Kindling: "Kindling",
  Watering: "Watering",
  Planting: "Planting",
  GenerateElectricity: "Electricity",
  Handiwork: "Handiwork",
  Gathering: "Gathering",
  Lumbering: "Lumbering",
  Mining: "Mining",
  MedicineProduction: "Medicine",
  Cooling: "Cooling",
  Transporting: "Transporting",
  Farming: "Farming",
};