/**
 * Downloads pal icons from tylercamp/palcalc (same pinned source as the dataset)
 * into web/public/icons/<InternalName>.png
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const db = JSON.parse(
  fs.readFileSync(path.join(root, "data", "db.json"), "utf8"),
);
const outDir = path.join(root, "web", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const BASE =
  "https://raw.githubusercontent.com/tylercamp/palcalc/main/PalCalc.UI/Resources/Pals/";

const failed = [];
let downloaded = 0;
let skipped = 0;

async function fetchIcon(pal) {
  const dest = path.join(outDir, `${pal.InternalName}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skipped++;
    return;
  }
  const url = BASE + encodeURIComponent(pal.Name) + ".png";
  const res = await fetch(url);
  if (!res.ok) {
    failed.push({ name: pal.Name, internal: pal.InternalName, status: res.status });
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  downloaded++;
}

const pals = db.Pals;
const CONCURRENCY = 10;
for (let i = 0; i < pals.length; i += CONCURRENCY) {
  await Promise.all(pals.slice(i, i + CONCURRENCY).map(fetchIcon));
  process.stdout.write(`\r${Math.min(i + CONCURRENCY, pals.length)}/${pals.length}`);
}
console.log(
  `\nDone. downloaded=${downloaded} skipped=${skipped} failed=${failed.length}`,
);
if (failed.length) {
  console.log("Failed:", failed);
  process.exitCode = 1;
}