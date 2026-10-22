import type { Dataset } from "./types";

let cached: Dataset | null = null;

export async function loadDataset(): Promise<Dataset> {
  if (cached) return cached;
  const res = await fetch("/dataset.json");
  if (!res.ok) {
    throw new Error(`Failed to load dataset.json (${res.status})`);
  }
  cached = (await res.json()) as Dataset;
  return cached;
}

export function getDataset(): Dataset {
  if (!cached) throw new Error("Dataset not loaded yet");
  return cached;
}