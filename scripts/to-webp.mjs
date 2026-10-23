/**
 * Converts the downloaded Pal art and spawn maps (web/public/art/*.png,
 * web/public/maps/*.png) to WebP and removes the PNGs, roughly halving what
 * the site ships. Needs ffmpeg with libwebp on PATH. Safe to re-run: files
 * that already have a .webp are skipped. Icons stay PNG (small already).
 *
 * Run after `npm run art` / `npm run locations`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "web", "public");

const JOBS = [
  // Art has transparency; keep alpha and a slightly higher quality.
  { dir: "art", quality: 85 },
  { dir: "maps", quality: 80 },
];

let converted = 0;
let before = 0;
let after = 0;

for (const { dir, quality } of JOBS) {
  const full = path.join(publicDir, dir);
  if (!fs.existsSync(full)) continue;
  for (const name of fs.readdirSync(full)) {
    if (!name.endsWith(".png")) continue;
    const src = path.join(full, name);
    const dest = src.replace(/\.png$/, ".webp");
    if (!fs.existsSync(dest)) {
      const result = spawnSync(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-i", src, "-c:v", "libwebp",
          "-quality", String(quality), "-compression_level", "6", dest],
        { stdio: "inherit" },
      );
      if (result.status !== 0) {
        console.error(`ffmpeg failed on ${dir}/${name}; keeping the PNG.`);
        continue;
      }
    }
    before += fs.statSync(src).size;
    after += fs.statSync(dest).size;
    fs.unlinkSync(src);
    converted++;
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`Converted ${converted} files: ${mb(before)} MB → ${mb(after)} MB`);
