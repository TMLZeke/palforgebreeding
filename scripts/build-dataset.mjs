/**
 * Builds a compact browser dataset from tylercamp/palcalc 1.0 exports.
 * Source: data/db.json + data/breeding.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dbPath = path.join(root, "data", "db.json");
const breedingPath = path.join(root, "data", "breeding.json");
const palInfoPath = path.join(root, "data", "pal-info.json");
const spawnInfoPath = path.join(root, "data", "spawn-info.json");
const outPath = path.join(root, "web", "public", "dataset.json");

const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const breedingDb = JSON.parse(fs.readFileSync(breedingPath, "utf8"));
const palInfo = fs.existsSync(palInfoPath)
  ? JSON.parse(fs.readFileSync(palInfoPath, "utf8"))
  : {};
const spawnInfo = fs.existsSync(spawnInfoPath)
  ? JSON.parse(fs.readFileSync(spawnInfoPath, "utf8"))
  : {};

const pals = [...db.Pals].sort((a, b) => {
  const dex = a.Id.PalDexNo - b.Id.PalDexNo;
  if (dex !== 0) return dex;
  return Number(a.Id.IsVariant) - Number(b.Id.IsVariant) || a.Name.localeCompare(b.Name);
});

const indexByInternal = new Map(pals.map((p, i) => [p.InternalName, i]));

const WORK_KEYS = [
  "Kindling",
  "Watering",
  "Planting",
  "GenerateElectricity",
  "Handiwork",
  "Gathering",
  "Lumbering",
  "Mining",
  "MedicineProduction",
  "Cooling",
  "Transporting",
  "Farming",
];

const slimPals = pals.map((p) => {
  const gender = db.BreedingGenderProbability[p.InternalName] ?? {
    MALE: 0.5,
    FEMALE: 0.5,
  };
  const work = {};
  for (const key of WORK_KEYS) {
    const level = p.WorkSuitability?.[key] ?? 0;
    if (level > 0) work[key] = level;
  }
  const info = palInfo[p.InternalName];
  const spawn = spawnInfo[p.InternalName];
  return {
    id: indexByInternal.get(p.InternalName),
    internalName: p.InternalName,
    name: p.Name,
    dex: p.Id.PalDexNo,
    variant: Boolean(p.Id.IsVariant),
    breedingPower: p.BreedingPower,
    rarity: p.Rarity,
    size: p.Size,
    hp: p.Hp,
    attack: p.Attack,
    defense: p.Defense,
    work,
    nocturnal: Boolean(p.Nocturnal),
    maleChance: gender.MALE ?? 0.5,
    ...(info?.description ? { flavorText: info.description } : {}),
    ...(info?.ability ? { ability: info.ability } : {}),
    ...(spawn?.bossStatus ? { bossStatus: spawn.bossStatus } : {}),
  };
});

const n = slimPals.length;
/** @type {(number | [number, number])[]} */
const pairChild = new Array((n * (n + 1)) / 2);

function pairIndex(i, j) {
  const a = Math.min(i, j);
  const b = Math.max(i, j);
  return (a * (2 * n - a + 1)) / 2 + (b - a);
}

function setPair(i, j, value) {
  pairChild[pairIndex(i, j)] = value;
}

for (const combo of breedingDb.Breeding) {
  const i = indexByInternal.get(combo.Parent1InternalName);
  const j = indexByInternal.get(combo.Parent2InternalName);
  const child = indexByInternal.get(combo.ChildInternalName);
  if (i === undefined || j === undefined || child === undefined) {
    throw new Error(`Unknown pal in combo: ${JSON.stringify(combo)}`);
  }

  const gendered =
    combo.Parent1Gender !== "WILDCARD" || combo.Parent2Gender !== "WILDCARD";

  if (gendered) {
    // Encode as [childIfCatMageFemaleFoxMale, childIfCatMageMaleFoxFemale]
    // Only CatMage x FoxMage uses gender rules in 1.0 palcalc data.
    const existing = pairChild[pairIndex(i, j)];
    const slot =
      combo.Parent1InternalName === "CatMage" &&
      combo.Parent1Gender === "FEMALE"
        ? 0
        : combo.Parent2InternalName === "CatMage" &&
            combo.Parent2Gender === "FEMALE"
          ? 0
          : 1;
    if (!Array.isArray(existing)) {
      setPair(i, j, [child, child]);
    }
    const arr = pairChild[pairIndex(i, j)];
    arr[slot] = child;
  } else {
    setPair(i, j, child);
  }
}

for (let i = 0; i < pairChild.length; i++) {
  if (pairChild[i] === undefined) {
    throw new Error(`Missing pair result at index ${i}`);
  }
}

/** @type {number[][][]} */
const parentsOf = Array.from({ length: n }, () => []);
for (let i = 0; i < n; i++) {
  for (let j = i; j < n; j++) {
    const result = pairChild[pairIndex(i, j)];
    if (Array.isArray(result)) {
      for (const child of new Set(result)) {
        parentsOf[child].push([i, j]);
      }
    } else {
      parentsOf[result].push([i, j]);
    }
  }
}

const passives = db.PassiveSkills.filter((p) => p.IsStandardPassiveSkill)
  .map((p) => ({
    name: p.Name,
    internalName: p.InternalName,
    rank: p.Rank,
    description: p.Description ?? "",
    surgeryCost: p.SurgeryCost ?? 0,
    randomInheritance: Boolean(p.RandomInheritanceAllowed),
  }))
  .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));

const dataset = {
  meta: {
    gameVersion: "1.0",
    dbVersion: db.Version,
    source: "tylercamp/palcalc (PalCalc.Model db.json + breeding.json)",
    sourceCommitHint: "main branch export pinned at build time",
    generatedAt: new Date().toISOString(),
    palCount: n,
    comboCount: breedingDb.Breeding.length,
    passiveCount: passives.length,
  },
  pals: slimPals,
  passives,
  pairChild,
  parentsOf,
  genderRules: {
    note: "Only Katress (CatMage) × Wixen (FoxMage) is gender-specific in this dataset.",
    pair: ["CatMage", "FoxMage"],
    // slot 0: CatMage female + FoxMage male → CatMage_Fire
    // slot 1: CatMage male + FoxMage female → FoxMage_Dark
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(dataset));
console.log(
  `Wrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB) — ${n} pals, ${passives.length} passives`,
);
