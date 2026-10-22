import { breedChild, parentsFor, rankParentPairs } from "./breeding";
import type {
  Dataset,
  PathPlanResult,
  TreeNode,
  TreePlan,
} from "./types";

const MAX_OWNED_STEPS = 14;
const MAX_WILD_DEPTH = 6;

/**
 * Path from two (or more) starters → target.
 *
 * When 2+ starters are given, the tree MUST include their first child:
 *   StarterA × StarterB → bridge child → … → target
 * No shortcuts that skip that child (e.g. StarterB × wild → target).
 */
export function planPathFromStarters(
  dataset: Dataset,
  targetId: number | null,
  starterIds: number[],
  options?: {
    allowWildHelpers?: boolean;
    commonPowerMin?: number;
    /** Allow Goal × bridge descendants (ladder). Default false. */
    includeTargetAsParent?: boolean;
  },
): PathPlanResult {
  if (targetId === null) return { status: "need-target" };

  const includeTargetAsParent = options?.includeTargetAsParent ?? false;
  const allowWild = options?.allowWildHelpers ?? true;
  const commonPowerMin = options?.commonPowerMin ?? 1000;
  const stock = [...new Set(starterIds)];

  if (stock.length >= 2) {
    const plan = planThroughStarterChild(dataset, targetId, stock, {
      includeTargetAsParent,
      allowWildPartners: allowWild,
    });
    if (plan) return { status: "ok", plan };
    return { status: "unreachable", triedSteps: MAX_OWNED_STEPS };
  }

  if (stock.length === 1) {
    const plan = planFromSingleStarter(dataset, targetId, stock[0], {
      includeTargetAsParent,
      allowWildPartners: allowWild,
    });
    if (plan) return { status: "ok", plan };
  }

  if (allowWild || stock.length === 0) {
    const reverse = planFromCommonParents(
      dataset,
      targetId,
      commonPowerMin,
      new Set(stock.filter((id) => id !== targetId)),
      { requireBreedSteps: true },
    );
    if (reverse && reverse.steps > 0) {
      return {
        status: "ok",
        plan: {
          ...reverse,
          ownedOnly: reverse.usedWild.length === 0,
        },
      };
    }
  }

  return { status: "unreachable", triedSteps: MAX_OWNED_STEPS };
}

/** @deprecated */
export function planBreedingTree(
  dataset: Dataset,
  targetId: number,
  ownedIds: number[],
  options?: { commonPowerMin?: number },
): TreePlan | null {
  const result = planPathFromStarters(dataset, targetId, ownedIds, {
    allowWildHelpers: true,
    includeTargetAsParent: false,
    commonPowerMin: options?.commonPowerMin,
  });
  return result.status === "ok" ? result.plan : null;
}

type How =
  | { kind: "owned" }
  | { kind: "wild" }
  | { kind: "breed"; a: number; b: number };

/**
 * Required: first breed the two primary starters, then continue from that child.
 */
function planThroughStarterChild(
  dataset: Dataset,
  targetId: number,
  starters: number[],
  options: { includeTargetAsParent: boolean; allowWildPartners: boolean },
): TreePlan | null {
  const a = starters[0];
  const b = starters[1];
  const extras = starters.slice(2);

  const { childId: bridgeId } = breedChild(dataset, a, b);
  const ownedStock = new Set(starters);

  const how = new Map<number, How>();
  how.set(a, { kind: "owned" });
  how.set(b, { kind: "owned" });
  for (const id of extras) how.set(id, { kind: "owned" });

  // Always record the required first breed (unless trivial goal×goal with no bridge)
  if (a === targetId && b === targetId) return null;

  if (bridgeId === targetId) {
    how.set(targetId, { kind: "breed", a, b });
    return buildFromHow(targetId, how, ownedStock);
  }

  how.set(bridgeId, { kind: "breed", a, b });

  // Lineage we are allowed to breed FROM toward the goal (must descend from bridge)
  const lineage = new Set<number>([bridgeId]);
  for (const id of extras) lineage.add(id);

  // Direct finish: bridge (or lineage) × partner → target
  const direct = finishFromLineage(dataset, targetId, how, lineage, {
    includeTargetAsParent: options.includeTargetAsParent,
    allowWildPartners: options.allowWildPartners,
    ownedStock,
    // May also use owned starters as the *partner* side, but the lineage pal
    // must be one parent of the finishing breed.
    requireLineageParent: true,
  });
  if (direct) return buildFromHow(targetId, direct, ownedStock);

  // Grow lineage by breeding lineage × (lineage ∪ stock ∪ useful wilds)
  const grown = growLineageToTarget(dataset, targetId, how, lineage, ownedStock, {
    includeTargetAsParent: options.includeTargetAsParent,
    allowWildPartners: options.allowWildPartners,
  });
  if (grown) return buildFromHow(targetId, grown, ownedStock);

  return null;
}

function planFromSingleStarter(
  dataset: Dataset,
  targetId: number,
  starterId: number,
  options: { includeTargetAsParent: boolean; allowWildPartners: boolean },
): TreePlan | null {
  const ownedStock = new Set([starterId]);
  const how = new Map<number, How>([[starterId, { kind: "owned" }]]);
  const lineage = new Set<number>([starterId]);

  const direct = finishFromLineage(dataset, targetId, how, lineage, {
    includeTargetAsParent: options.includeTargetAsParent,
    allowWildPartners: options.allowWildPartners,
    ownedStock,
    requireLineageParent: true,
  });
  if (direct) return buildFromHow(targetId, direct, ownedStock);

  const grown = growLineageToTarget(
    dataset,
    targetId,
    how,
    lineage,
    ownedStock,
    options,
  );
  if (grown) return buildFromHow(targetId, grown, ownedStock);
  return null;
}

function finishFromLineage(
  dataset: Dataset,
  targetId: number,
  how: Map<number, How>,
  lineage: Set<number>,
  options: {
    includeTargetAsParent: boolean;
    allowWildPartners: boolean;
    ownedStock: Set<number>;
    requireLineageParent: boolean;
  },
): Map<number, How> | null {
  let best: { score: number; lineagePal: number; partner: number } | null =
    null;

  for (const pal of lineage) {
    if (!options.includeTargetAsParent && pal === targetId) continue;

    for (const [p1, p2] of parentsFor(dataset, targetId)) {
      let partner: number | null = null;
      if (p1 === pal) partner = p2;
      else if (p2 === pal) partner = p1;
      else continue;

      if (!options.includeTargetAsParent && partner === targetId) continue;
      if (pal === targetId && partner === targetId) continue;

      const partnerKnown = how.has(partner);
      if (!partnerKnown && !options.allowWildPartners) continue;

      // Prefer partners already in stock/lineage; otherwise wild
      const partnerPal = dataset.pals[partner];
      const score =
        (partnerKnown ? 80 : 0) +
        (options.ownedStock.has(partner) ? 30 : 0) +
        (lineage.has(partner) ? 25 : 0) +
        partnerPal.breedingPower / 100 -
        partnerPal.rarity * 3;

      if (!best || score > best.score) {
        best = { score, lineagePal: pal, partner };
      }
    }
  }

  if (!best) return null;

  const win = new Map(how);
  if (!win.has(best.partner)) {
    win.set(best.partner, {
      kind: options.ownedStock.has(best.partner) ? "owned" : "wild",
    });
  }
  win.set(targetId, {
    kind: "breed",
    a: best.lineagePal,
    b: best.partner,
  });
  return win;
}

function growLineageToTarget(
  dataset: Dataset,
  targetId: number,
  baseHow: Map<number, How>,
  baseLineage: Set<number>,
  ownedStock: Set<number>,
  options: { includeTargetAsParent: boolean; allowWildPartners: boolean },
): Map<number, How> | null {
  const how = new Map(baseHow);
  const lineage = new Set(baseLineage);

  // Useful wild partners: other parents of the target, and parents of those
  const usefulWilds = new Set<number>();
  if (options.allowWildPartners) {
    for (const [p1, p2] of parentsFor(dataset, targetId)) {
      usefulWilds.add(p1);
      usefulWilds.add(p2);
    }
    for (const mid of [...usefulWilds]) {
      if (mid === targetId) continue;
      for (const [p1, p2] of parentsFor(dataset, mid).slice(0, 30)) {
        usefulWilds.add(p1);
        usefulWilds.add(p2);
      }
    }
    usefulWilds.delete(targetId);
  }

  for (let step = 0; step < MAX_OWNED_STEPS; step++) {
    const finish = finishFromLineage(dataset, targetId, how, lineage, {
      includeTargetAsParent: options.includeTargetAsParent,
      allowWildPartners: options.allowWildPartners,
      ownedStock,
      requireLineageParent: true,
    });
    if (finish) return finish;

    const lineageList = [...lineage];
    const partnerPool = new Set<number>([
      ...lineage,
      ...ownedStock,
      ...usefulWilds,
    ]);
    if (options.includeTargetAsParent) partnerPool.add(targetId);

    let added = false;
    for (const pal of lineageList) {
      if (!options.includeTargetAsParent && pal === targetId) continue;
      for (const partner of partnerPool) {
        if (!options.includeTargetAsParent && partner === targetId) continue;
        if (pal === targetId && partner === targetId) continue;

        const { childId } = breedChild(dataset, pal, partner);
        if (childId === targetId) {
          const win = new Map(how);
          if (!win.has(partner)) {
            win.set(partner, {
              kind: ownedStock.has(partner) ? "owned" : "wild",
            });
          }
          win.set(targetId, { kind: "breed", a: pal, b: partner });
          return win;
        }
        if (how.has(childId)) continue;

        // New child becomes part of lineage (descended from bridge path)
        if (!how.has(partner) && !ownedStock.has(partner)) {
          how.set(partner, { kind: "wild" });
        }
        how.set(childId, { kind: "breed", a: pal, b: partner });
        lineage.add(childId);
        added = true;
      }
    }
    if (!added) break;
  }

  return finishFromLineage(dataset, targetId, how, lineage, {
    includeTargetAsParent: options.includeTargetAsParent,
    allowWildPartners: options.allowWildPartners,
    ownedStock,
    requireLineageParent: true,
  });
}

function planFromCommonParents(
  dataset: Dataset,
  targetId: number,
  commonPowerMin: number,
  owned: Set<number> = new Set(),
  options?: { requireBreedSteps?: boolean },
): TreePlan | null {
  const memo = new Map<number, TreeNode | null>();

  function obtain(palId: number, depth: number): TreeNode | null {
    if (memo.has(palId)) return memo.get(palId) ?? null;

    if (owned.has(palId) && !(palId === targetId && depth === 0)) {
      const node: TreeNode = { palId, kind: "owned" };
      memo.set(palId, node);
      return node;
    }

    if (depth > MAX_WILD_DEPTH) {
      memo.set(palId, null);
      return null;
    }

    const pal = dataset.pals[palId];
    if (
      depth > 0 &&
      palId !== targetId &&
      pal.breedingPower >= commonPowerMin
    ) {
      const node: TreeNode = {
        palId,
        kind: "wild",
        note: "Catch / use as base parent",
      };
      memo.set(palId, node);
      return node;
    }

    const ranked = rankParentPairs(dataset, palId);
    for (const { parents, sameSpecies } of ranked) {
      const [pa, pb] = parents;
      if (sameSpecies && pa === palId) continue;

      const left = obtain(pa, depth + 1);
      const right = obtain(pb, depth + 1);
      if (!left || !right) continue;

      const node: TreeNode = {
        palId,
        kind: "breed",
        parentA: left,
        parentB: right,
      };
      memo.set(palId, node);
      return node;
    }

    if (palId !== targetId) {
      const fallback: TreeNode = {
        palId,
        kind: "wild",
        note: "Catch this Pal (no easier chain found)",
      };
      memo.set(palId, fallback);
      return fallback;
    }

    memo.set(palId, null);
    return null;
  }

  const root = obtain(targetId, 0);
  if (!root) return null;
  const plan = summarize(targetId, root);
  if (options?.requireBreedSteps && plan.steps === 0) return null;
  return plan;
}

function buildFromHow(
  targetId: number,
  how: Map<number, How>,
  ownedStock: Set<number>,
): TreePlan {
  const memo = new Map<string, TreeNode>();

  function build(id: number, asGoal: boolean): TreeNode {
    const key = `${id}:${asGoal ? "g" : "p"}`;
    if (memo.has(key)) return memo.get(key)!;

    if (!asGoal && ownedStock.has(id)) {
      const node: TreeNode = { palId: id, kind: "owned" };
      memo.set(key, node);
      return node;
    }

    const h = how.get(id);
    if (!h || h.kind === "owned") {
      const node: TreeNode = {
        palId: id,
        kind: ownedStock.has(id) ? "owned" : "wild",
      };
      memo.set(key, node);
      return node;
    }

    if (h.kind === "wild") {
      const node: TreeNode = {
        palId: id,
        kind: "wild",
        note: "Catch / obtain this parent",
      };
      memo.set(key, node);
      return node;
    }

    const node: TreeNode = {
      palId: id,
      kind: "breed",
      parentA: build(h.a, false),
      parentB: build(h.b, false),
    };
    memo.set(key, node);
    return node;
  }

  return summarize(targetId, build(targetId, true));
}

function summarize(targetId: number, root: TreeNode): TreePlan {
  const usedOwned: number[] = [];
  const usedWild: number[] = [];
  let steps = 0;

  function walk(node: TreeNode) {
    if (node.kind === "owned") usedOwned.push(node.palId);
    if (node.kind === "wild") usedWild.push(node.palId);
    if (node.kind === "breed") {
      steps++;
      if (node.parentA) walk(node.parentA);
      if (node.parentB) walk(node.parentB);
    }
  }
  walk(root);

  return {
    targetId,
    steps,
    root,
    usedOwned: [...new Set(usedOwned)],
    usedWild: [...new Set(usedWild)],
    ownedOnly: usedWild.length === 0,
  };
}