/**
 * Best-effort download of spawn/location data from the community
 * mlg404/palworld-paldex-api repo:
 *  - data/spawn-info.json: boss status per InternalName, derived from the
 *    game's own DT_PaldexDistributionData table (rows prefixed "BOSS_" are
 *    boss/alpha-only encounters; a plain row is a normal wild spawn).
 *  - web/public/maps/<InternalName>-{day,night}.png: pre-rendered heatmap
 *    images showing where that Pal spawns on the world map.
 * Coverage is unverified/partial — this is a fallback enrichment source,
 * not a guarantee; build-dataset.mjs merges whatever's present.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const db = JSON.parse(
  fs.readFileSync(path.join(root, "data", "db.json"), "utf8"),
);
const spawnInfoOut = path.join(root, "data", "spawn-info.json");
const mapsOutDir = path.join(root, "web", "public", "maps");
fs.mkdirSync(mapsOutDir, { recursive: true });

const DIST_URL =
  "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/src/PaldexDistributionData.json";
const PALS_JSON_URL =
  "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/src/pals.json";
const MAP_BASE =
  "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/public/images/maps/";

function hasLocations(row) {
  if (!row) return false;
  const day = row.dayTimeLocations?.locations?.length ?? 0;
  const night = row.nightTimeLocations?.locations?.length ?? 0;
  return day + night > 0;
}

const distRes = await fetch(DIST_URL);
if (!distRes.ok) {
  console.error(`Failed to fetch distribution data: ${distRes.status}`);
  process.exit(1);
}
const distData = await distRes.json();
const rows = distData[0].Rows;

const spawnInfo = {};
for (const p of db.Pals) {
  const wildRow = rows[p.InternalName];
  const bossRow = rows[`BOSS_${p.InternalName}`];
  const hasWild = hasLocations(wildRow);
  const hasBoss = hasLocations(bossRow);
  if (hasBoss && !hasWild) {
    spawnInfo[p.InternalName] = { bossStatus: "boss-only" };
  } else if (hasBoss && hasWild) {
    spawnInfo[p.InternalName] = { bossStatus: "boss-and-wild" };
  }
}
fs.writeFileSync(spawnInfoOut, JSON.stringify(spawnInfo, null, 2));
const bossOnly = Object.values(spawnInfo).filter(
  (v) => v.bossStatus === "boss-only",
).length;
const bossDual = Object.values(spawnInfo).filter(
  (v) => v.bossStatus === "boss-and-wild",
).length;
console.log(
  `Wrote ${spawnInfoOut}: ${bossOnly} boss-only, ${bossDual} boss-and-wild.`,
);

// NOTE: the community repo's own paldeck/map index ("key" in pals.json)
// does NOT match Palworld's official Dex number (db.json's Id.PalDexNo) —
// e.g. Katress (CatMage) is Dex 79 here but that repo's own index is "075".
// Must join through pals.json's "asset" field (matches our InternalName)
// to get the correct key, or we silently fetch the wrong Pal's map.
const palsRes = await fetch(PALS_JSON_URL);
if (!palsRes.ok) {
  console.error(`Failed to fetch pals.json: ${palsRes.status}`);
  process.exit(1);
}
const palsRecords = await palsRes.json();
const keyByAsset = new Map(
  palsRecords.filter((r) => r.asset && r.key).map((r) => [r.asset, r.key]),
);

const failed = [];
let downloaded = 0;
let skipped = 0;
let noKey = 0;

async function fetchMap(pal, period) {
  const key = keyByAsset.get(pal.InternalName);
  if (!key) {
    noKey++;
    return;
  }
  const dest = path.join(mapsOutDir, `${pal.InternalName}-${period}.png`);
  // The site ships WebP (see scripts/to-webp.mjs); an existing .webp counts.
  const webp = dest.replace(/.png$/, ".webp");
  if (
    (fs.existsSync(dest) && fs.statSync(dest).size > 0) ||
    fs.existsSync(webp)
  ) {
    skipped++;
    return;
  }
  const url = `${MAP_BASE}${key}-${period}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    failed.push({ name: pal.Name, internal: pal.InternalName, period, status: res.status });
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  downloaded++;
}

const CONCURRENCY = 10;
const pals = db.Pals;
for (let i = 0; i < pals.length; i += CONCURRENCY) {
  const batch = pals.slice(i, i + CONCURRENCY);
  await Promise.all(batch.flatMap((p) => [fetchMap(p, "day"), fetchMap(p, "night")]));
  process.stdout.write(`\r${Math.min(i + CONCURRENCY, pals.length)}/${pals.length}`);
}
console.log(
  `\nMaps: downloaded=${downloaded} skipped=${skipped} no-match-in-source=${noKey} failed=${failed.length} (missing entries show "no location data").`,
);
