import type { TreeNode } from "./types";

export type BreedStep = {
  step: number;
  parentAId: number;
  parentBId: number;
  childId: number;
};

export type GatherItem = {
  palId: number;
  kind: "owned" | "wild";
  note?: string;
};

/** Post-order breed steps so you can follow top-to-bottom in the breeding farm. */
export function flattenBreedSteps(root: TreeNode): BreedStep[] {
  const steps: BreedStep[] = [];
  const seen = new Set<string>();

  function walk(node: TreeNode) {
    if (node.kind !== "breed" || !node.parentA || !node.parentB) return;
    walk(node.parentA);
    walk(node.parentB);
    const key = `${node.parentA.palId}|${node.parentB.palId}|${node.palId}`;
    if (seen.has(key)) return;
    seen.add(key);
    steps.push({
      step: 0,
      parentAId: node.parentA.palId,
      parentBId: node.parentB.palId,
      childId: node.palId,
    });
  }

  walk(root);
  return steps.map((s, i) => ({ ...s, step: i + 1 }));
}

export function collectGatherList(root: TreeNode): GatherItem[] {
  const items: GatherItem[] = [];
  const seen = new Set<number>();

  function walk(node: TreeNode) {
    if (node.kind === "owned" || node.kind === "wild") {
      if (!seen.has(node.palId)) {
        seen.add(node.palId);
        items.push({
          palId: node.palId,
          kind: node.kind,
          note: node.note,
        });
      }
      return;
    }
    if (node.parentA) walk(node.parentA);
    if (node.parentB) walk(node.parentB);
  }

  walk(root);
  return items;
}