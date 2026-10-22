/**
 * Best-effort download of larger Pal art from the community
 * mlg404/palworld-paldex-api repo into web/public/art/<InternalName>.png.
 *
 * IMPORTANT: that repo's image filenames use ITS OWN internal paldeck index
 * (from pals.json's "key" field), which does NOT match Palworld's official
 * Dex number (db.json's Id.PalDexNo) — e.g. Katress (CatMage) is Dex 79 in
 * our data but that repo's own index for it is "075". We must join through
 * pals.json's "asset" field (which does match our InternalName exactly) to
 * get the correct per-Pal "key" before building the image URL. Deriving the
 * key from our own Dex number (as an earlier version of this script did)
 * silently downloads the WRONG Pal's art.
 *
 * Coverage is unverified — this is a fallback source, not a guarantee;
 * PalPassiveCard falls back to the small /icons/ sprite on 404.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const db = JSON.parse(
  fs.readFileSync(path.join(root, "data", "db.json"), "utf8"),
);
const outDir = path.join(root, "web", "public", "art");
fs.mkdirSync(outDir, { recursive: true });

const PALS_JSON_URL =
  "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/src/pals.json";
const BASE =
  "https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/public/images/paldeck/";

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

async function fetchArt(pal) {
  const key = keyByAsset.get(pal.InternalName);
  if (!key) {
    noKey++;
    return;
  }
  const dest = path.join(outDir, `${pal.InternalName}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skipped++;
    return;
  }
  const url = BASE + key + ".png";
  const res = await fetch(url);
  if (!res.ok) {
    failed.push({ name: pal.Name, internal: pal.InternalName, key, status: res.status });
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  downloaded++;
}

const pals = db.Pals;
const CONCURRENCY = 10;
for (let i = 0; i < pals.length; i += CONCURRENCY) {
  await Promise.all(pals.slice(i, i + CONCURRENCY).map(fetchArt));
  process.stdout.write(`\r${Math.min(i + CONCURRENCY, pals.length)}/${pals.length}`);
}
console.log(
  `\nDone. downloaded=${downloaded} skipped=${skipped} no-match-in-source=${noKey} failed=${failed.length} (missing entries fall back to /icons/ at render time)`,
);
