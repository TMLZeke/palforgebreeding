import type { Dataset, Passive } from "./types";

export const PASSIVE_CAP_NORMAL = 4;
export const PASSIVE_CAP_CAKE = 6;

export type PassiveEntry = {
  internalName: string;
  wanted: boolean;
  addedAt: number;
};

export function searchPassives(dataset: Dataset, query: string): Passive[] {
  const q = query.trim().toLowerCase();
  if (!q) return dataset.passives;
  return dataset.passives.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}

export function capFor(cakeActive: boolean): number {
  return cakeActive ? PASSIVE_CAP_CAKE : PASSIVE_CAP_NORMAL;
}

/** Dedup by internalName; first occurrence's addedAt wins, wanted if either side wanted it. */
export function combinePools(
  a: PassiveEntry[],
  b: PassiveEntry[],
): PassiveEntry[] {
  const byName = new Map<string, PassiveEntry>();
  for (const entry of [...a, ...b]) {
    const existing = byName.get(entry.internalName);
    if (!existing) {
      byName.set(entry.internalName, { ...entry });
    } else if (entry.wanted && !existing.wanted) {
      existing.wanted = true;
    }
  }
  return [...byName.values()].sort((x, y) => x.addedAt - y.addedAt);
}

export type OverflowResult = {
  cap: number;
  kept: PassiveEntry[];
  dropped: PassiveEntry[];
  wantedDropped: PassiveEntry[];
  overflow: boolean;
  wantedOverflow: boolean;
};

export function computeOverflow(
  pool: PassiveEntry[],
  cakeActive: boolean,
): OverflowResult {
  const cap = capFor(cakeActive);
  const wanted = pool
    .filter((p) => p.wanted)
    .sort((x, y) => x.addedAt - y.addedAt);
  const unwanted = pool
    .filter((p) => !p.wanted)
    .sort((x, y) => x.addedAt - y.addedAt);

  if (wanted.length > cap) {
    return {
      cap,
      kept: wanted.slice(0, cap),
      dropped: unwanted,
      wantedDropped: wanted.slice(cap),
      overflow: true,
      wantedOverflow: true,
    };
  }

  const keptUnwanted = unwanted.slice(0, cap - wanted.length);
  const droppedUnwanted = unwanted.slice(cap - wanted.length);
  return {
    cap,
    kept: [...wanted, ...keptUnwanted],
    dropped: droppedUnwanted,
    wantedDropped: [],
    overflow: pool.length > cap,
    wantedOverflow: false,
  };
}
