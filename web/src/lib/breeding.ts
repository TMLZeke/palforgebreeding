import type { BreedResult, Dataset, Pal } from "./types";

export function pairIndex(n: number, i: number, j: number): number {
  const a = Math.min(i, j);
  const b = Math.max(i, j);
  return (a * (2 * n - a + 1)) / 2 + (b - a);
}

export function breedChild(
  dataset: Dataset,
  parentA: number,
  parentB: number,
  options?: { catMageFemale?: boolean },
): BreedResult {
  const n = dataset.pals.length;
  const raw = dataset.pairChild[pairIndex(n, parentA, parentB)];

  if (Array.isArray(raw)) {
    const preferFemaleCatMage = options?.catMageFemale ?? true;
    const childId = preferFemaleCatMage ? raw[0] : raw[1];
    return {
      childId,
      genderDependent: true,
      altChildId: preferFemaleCatMage ? raw[1] : raw[0],
    };
  }

  return { childId: raw, genderDependent: false };
}

export function parentsFor(dataset: Dataset, childId: number): number[][] {
  return dataset.parentsOf[childId] ?? [];
}

/** Rank parent pairs: prefer common parents (higher breeding power, lower rarity). */
export function rankParentPairs(
  dataset: Dataset,
  childId: number,
): Array<{ parents: [number, number]; score: number; sameSpecies: boolean }> {
  const child = dataset.pals[childId];
  return parentsFor(dataset, childId)
    .map(([a, b]) => {
      const pa = dataset.pals[a];
      const pb = dataset.pals[b];
      const sameSpecies = a === b;
      // Higher score = easier / more desirable for planning
      const score =
        (pa.breedingPower + pb.breedingPower) / 2 -
        (pa.rarity + pb.rarity) * 40 -
        (sameSpecies ? 80 : 0) +
        (Math.min(pa.breedingPower, pb.breedingPower) >
        child.breedingPower
          ? 120
          : 0);
      return { parents: [a, b] as [number, number], score, sameSpecies };
    })
    .sort((x, y) => y.score - x.score);
}

export function searchPals(dataset: Dataset, query: string): Pal[] {
  const q = query.trim().toLowerCase();
  if (!q) return dataset.pals;
  return dataset.pals.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      String(p.dex).includes(q) ||
      p.internalName.toLowerCase().includes(q),
  );
}

export function formatDex(pal: Pal): string {
  const base = String(pal.dex).padStart(3, "0");
  return pal.variant ? `${base}·var` : base;
}

export function rarityLabel(rarity: number): string {
  if (rarity >= 10) return "Legendary";
  if (rarity >= 8) return "Epic";
  if (rarity >= 6) return "Rare";
  if (rarity >= 4) return "Uncommon";
  return "Common";
}