/**
 * Best-effort download of Paldex flavor text + Partner Skill ("aura") data
 * from the community mlg404/palworld-paldex-api repo into data/pal-info.json,
 * keyed by our InternalName (matches that repo's "asset" field exactly).
 * Coverage is unverified/partial — this is a fallback enrichment source,
 * not a guarantee; build-dataset.mjs merges whatever's present.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "data", "pal-info.json");

const URL =
  "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/src/pals.json";

function titleCase(slug) {
  return slug
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const res = await fetch(URL);
if (!res.ok) {
  console.error(`Failed to fetch ${URL}: ${res.status}`);
  process.exit(1);
}
const records = await res.json();

const info = {};
let withDescription = 0;
let withAbility = 0;

for (const r of records) {
  if (!r.asset) continue;
  const entry = {};
  if (r.description && r.description.trim()) {
    entry.description = r.description.trim();
    withDescription++;
  }
  if (r.aura?.description) {
    entry.ability = {
      name: titleCase(r.aura.name ?? "ability"),
      description: r.aura.description.trim(),
    };
    withAbility++;
  }
  if (Object.keys(entry).length > 0) {
    info[r.asset] = entry;
  }
}

fs.writeFileSync(outPath, JSON.stringify(info, null, 2));
console.log(
  `Wrote ${outPath}: ${Object.keys(info).length} pals, ${withDescription} with flavor text, ${withAbility} with ability.`,
);
