import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Dataset } from "./types";

// "Pals I own", kept in this browser's localStorage (no account or server).
// Stored by internal name so the list survives dataset rebuilds. Every tool
// reads the same store, and edits in one tab show up in the others.

const STORAGE_KEY = "palforge-owned";
const listeners = new Set<() => void>();
let snapshot: string[] = read();

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(names: string[]) {
  snapshot = names;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Private mode or storage full: keep the in-memory copy for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    snapshot = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOwnedPals(dataset: Dataset) {
  const names = useSyncExternalStore(subscribe, () => snapshot);

  const ids = useMemo(() => {
    const byName = new Map(dataset.pals.map((p) => [p.internalName, p.id]));
    return names
      .map((n) => byName.get(n))
      .filter((id): id is number => id !== undefined)
      .sort((a, b) => a - b);
  }, [dataset, names]);

  const owned = useMemo(() => new Set(ids), [ids]);

  const setOwned = useCallback(
    (next: number[]) => write(next.map((id) => dataset.pals[id].internalName)),
    [dataset],
  );

  return { ids, owned, setOwned };
}
