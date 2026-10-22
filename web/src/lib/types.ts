export type WorkSuitability = Record<string, number>;

export type Pal = {
  id: number;
  internalName: string;
  name: string;
  dex: number;
  variant: boolean;
  breedingPower: number;
  rarity: number;
  size: string;
  hp: number;
  attack: number;
  defense: number;
  work: WorkSuitability;
  nocturnal: boolean;
  maleChance: number;
  flavorText?: string;
  ability?: { name: string; description: string };
  bossStatus?: "boss-only" | "boss-and-wild";
};

export type Passive = {
  name: string;
  internalName: string;
  rank: number;
  description: string;
  surgeryCost: number;
  randomInheritance: boolean;
};

export type DatasetMeta = {
  gameVersion: string;
  dbVersion: string;
  source: string;
  sourceCommitHint: string;
  generatedAt: string;
  palCount: number;
  comboCount: number;
  passiveCount: number;
};

export type Dataset = {
  meta: DatasetMeta;
  pals: Pal[];
  passives: Passive[];
  pairChild: Array<number | [number, number]>;
  parentsOf: number[][][];
  genderRules: {
    note: string;
    pair: [string, string];
  };
};

export type BreedResult = {
  childId: number;
  genderDependent: boolean;
  altChildId?: number;
};

export type TreeNode = {
  palId: number;
  kind: "owned" | "wild" | "breed";
  parentA?: TreeNode;
  parentB?: TreeNode;
  note?: string;
};

export type TreePlan = {
  targetId: number;
  steps: number;
  root: TreeNode;
  usedOwned: number[];
  usedWild: number[];
  /** True when the path uses only starter pals + bred offspring */
  ownedOnly: boolean;
};

export type PathPlanResult =
  | { status: "ok"; plan: TreePlan }
  | { status: "need-target" }
  | { status: "unreachable"; triedSteps: number };