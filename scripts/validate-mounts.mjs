import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(
  fs.readFileSync(path.join(root, "web", "public", "dataset.json"), "utf8"),
);
const names = new Set(dataset.pals.map((p) => p.name));
const src = fs.readFileSync(
  path.join(root, "web", "src", "lib", "mountData.ts"),
  "utf8",
);
const mountNames = [...src.matchAll(/\{ name: "([^"]+)"/g)].map((m) => m[1]);
console.log("mounts listed:", mountNames.length);
const missing = mountNames.filter((n) => !names.has(n));
console.log("names not in dataset:", missing.length ? missing : "none");
console.log("nocturnal flag present:", "nocturnal" in dataset.pals[0]);
