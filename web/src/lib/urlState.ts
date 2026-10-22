import { useCallback, useState } from "react";
import type { Dataset } from "./types";

// Mirrors tool inputs into the query string so a refresh keeps them and the
// address bar is a shareable link. Uses replaceState: typing into a field
// should not flood the back button with history entries.

export type Codec<T> = {
  parse: (raw: string) => T | undefined;
  format: (value: T) => string;
};

function readParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

export function writeParams(params: URLSearchParams) {
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

function writeParam(key: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (value === null) params.delete(key);
  else params.set(key, value);
  writeParams(params);
}

export function useUrlState<T>(
  key: string,
  fallback: T,
  codec: Codec<T>,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = readParam(key);
    if (raw === null) return fallback;
    return codec.parse(raw) ?? fallback;
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      const formatted = codec.format(next);
      // Leave defaults out of the URL to keep shared links short.
      writeParam(
        key,
        formatted === "" || formatted === codec.format(fallback) ? null : formatted,
      );
    },
    [key, codec, fallback],
  );

  return [value, update];
}

export const boolCodec: Codec<boolean> = {
  parse: (raw) => (raw === "1" ? true : raw === "0" ? false : undefined),
  format: (v) => (v ? "1" : "0"),
};

export function intCodec(min: number, max: number): Codec<number> {
  return {
    parse: (raw) => {
      const n = Number(raw);
      return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
    },
    format: (v) => String(v),
  };
}

export function enumCodec<T extends string | number>(values: readonly T[]): Codec<T> {
  return {
    parse: (raw) => values.find((v) => String(v) === raw),
    format: (v) => String(v),
  };
}

export const stringCodec: Codec<string> = {
  parse: (raw) => raw,
  format: (v) => v,
};

// Pals go in the URL by internal name, which stays stable across dataset
// rebuilds where numeric ids could shift.
const palIndexCache = new WeakMap<Dataset, Map<string, number>>();

function palIndex(dataset: Dataset) {
  let index = palIndexCache.get(dataset);
  if (!index) {
    index = new Map(dataset.pals.map((p) => [p.internalName, p.id]));
    palIndexCache.set(dataset, index);
  }
  return index;
}

export function palCodec(dataset: Dataset): Codec<number | null> {
  return {
    parse: (raw) => palIndex(dataset).get(raw),
    format: (id) => (id === null ? "" : dataset.pals[id].internalName),
  };
}

export function palListCodec(dataset: Dataset): Codec<number[]> {
  return {
    parse: (raw) =>
      raw
        .split(",")
        .map((name) => palIndex(dataset).get(name))
        .filter((id): id is number => id !== undefined),
    format: (ids) => ids.map((id) => dataset.pals[id].internalName).join(","),
  };
}
