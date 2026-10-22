import { breedChild } from "./breeding";
import { combinePools, computeOverflow, type PassiveEntry } from "./passives";
import type { BreedStep } from "./treeSteps";
import type { Dataset } from "./types";

export type FunnelStep = {
  step: number;
  parentA: { palId: number; entries: PassiveEntry[]; editable: boolean };
  parentB: { palId: number; entries: PassiveEntry[]; editable: boolean };
  childId: number;
  genderDependent: boolean;
  altChildId?: number;
  cakeActive: boolean;
  overflow: ReturnType<typeof computeOverflow>;
};

export function cakeKeyFor(step: BreedStep): string {
  return `${step.parentAId}-${step.parentBId}-${step.childId}`;
}

/**
 * Walks a breeding path (from planPathFromStarters/flattenBreedSteps) and
 * tracks passive pools through every step, funnel-style: a leaf Pal (one of
 * `leafPalIds` — owned starters/extras or algorithm-picked wild helpers)
 * pulls its entries from `leafEntries`; anything else is an intermediate
 * bred Pal, whose entries are whatever survived the step that produced it.
 */
export function buildPathFunnelSteps(
  dataset: Dataset,
  steps: BreedStep[],
  leafPalIds: Set<number>,
  leafEntries: Record<number, PassiveEntry[]>,
  cakeFlags: Record<string, boolean>,
): FunnelStep[] {
  const resolved = new Map<number, PassiveEntry[]>();

  function entriesFor(palId: number): { entries: PassiveEntry[]; editable: boolean } {
    if (leafPalIds.has(palId)) {
      return { entries: leafEntries[palId] ?? [], editable: true };
    }
    return { entries: resolved.get(palId) ?? [], editable: false };
  }

  return steps.map((s) => {
    const a = entriesFor(s.parentAId);
    const b = entriesFor(s.parentBId);
    const cakeActive = cakeFlags[cakeKeyFor(s)] ?? false;
    const pool = combinePools(a.entries, b.entries);
    const overflow = computeOverflow(pool, cakeActive);
    const { genderDependent, altChildId } = breedChild(
      dataset,
      s.parentAId,
      s.parentBId,
    );
    resolved.set(s.childId, overflow.kept);

    return {
      step: s.step,
      parentA: { palId: s.parentAId, entries: a.entries, editable: a.editable },
      parentB: { palId: s.parentBId, entries: b.entries, editable: b.editable },
      childId: s.childId,
      genderDependent,
      altChildId,
      cakeActive,
      overflow,
    };
  });
}
