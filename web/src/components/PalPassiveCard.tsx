import { useEffect, useMemo, useRef, useState } from "react";
import { capFor, searchPassives, type PassiveEntry } from "../lib/passives";
import type { Dataset } from "../lib/types";
import { useClickOutside } from "../lib/useClickOutside";
import { PalArt } from "./PalArt";

let nextAddedAt = 1;

type Props = {
  dataset: Dataset;
  palId: number | null;
  title: string;
  entries: PassiveEntry[];
  onChange: (entries: PassiveEntry[]) => void;
  cakeActive: boolean;
  onCakeChange: (cakeActive: boolean) => void;
};

export function PalPassiveCard({
  dataset,
  palId,
  title,
  entries,
  onChange,
  cakeActive,
  onCakeChange,
}: Props) {
  const pal = palId !== null ? dataset.pals[palId] : null;
  const cap = capFor(cakeActive);
  const atCap = entries.length >= cap;
  const existing = useMemo(
    () => new Set(entries.map((e) => e.internalName)),
    [entries],
  );

  function addPassive(internalName: string) {
    if (atCap || existing.has(internalName)) return;
    onChange([
      ...entries,
      { internalName, wanted: false, addedAt: nextAddedAt++ },
    ]);
  }

  function removePassive(internalName: string) {
    onChange(entries.filter((e) => e.internalName !== internalName));
  }

  function toggleWanted(internalName: string) {
    onChange(
      entries.map((e) =>
        e.internalName === internalName ? { ...e, wanted: !e.wanted } : e,
      ),
    );
  }

  return (
    <div className="pal-passive-card">
      <span className="field-label">{title}</span>

      {pal ? (
        <>
          <PalArt pal={pal} />
          <p className="pal-passive-name">{pal.name}</p>
        </>
      ) : (
        <div className="pal-art-frame is-empty">
          <span className="hint">No Pal selected</span>
        </div>
      )}

      <ul className="passive-chip-list">
        {entries.length === 0 && <li className="hint">No passives added</li>}
        {entries.map((entry) => {
          const passive = dataset.passives.find(
            (p) => p.internalName === entry.internalName,
          );
          return (
            <li
              key={entry.internalName}
              className={`passive-chip-dark ${entry.wanted ? "wanted" : ""}`}
            >
              <button
                type="button"
                className="want-toggle"
                aria-pressed={entry.wanted}
                onClick={() => toggleWanted(entry.internalName)}
                title="Want (priority lock when over cap)"
              >
                ★
              </button>
              <span className="name">{passive?.name ?? entry.internalName}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => removePassive(entry.internalName)}
                aria-label={`Remove ${passive?.name ?? entry.internalName}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <PassivePicker
        dataset={dataset}
        disabled={atCap}
        existing={existing}
        onPick={addPassive}
      />
      {atCap && (
        <p className="note">
          Cap reached ({cap}){" "}
          {cakeActive
            ? "— that's the max even with a Special Cake."
            : "— toggle Special Cake below to allow up to 6."}
        </p>
      )}

      <label className="toggle-row cake-toggle">
        <input
          type="checkbox"
          checked={cakeActive}
          onChange={(e) => onCakeChange(e.target.checked)}
        />
        Special Cake (raises cap to 6)
      </label>
    </div>
  );
}

function PassivePicker({
  dataset,
  disabled,
  existing,
  onPick,
}: {
  dataset: Dataset;
  disabled: boolean;
  existing: Set<string>;
  onPick: (internalName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useClickOutside(rootRef, () => setOpen(false), open);

  const results = useMemo(
    () =>
      searchPassives(dataset, query)
        .filter((p) => !existing.has(p.internalName))
        .slice(0, 40),
    [dataset, query, existing],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelector(".passive-picker-menu li button.active")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function pick(internalName: string) {
    onPick(internalName);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[activeIndex];
      if (picked) pick(picked.internalName);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="passive-picker" ref={rootRef}>
      <button
        type="button"
        className="ghost-btn"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        + Add passive
      </button>
      {open && (
        <div className="passive-picker-menu">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search passives…"
          />
          <ul>
            {results.map((p, i) => (
              <li key={p.internalName}>
                <button
                  type="button"
                  className={i === activeIndex ? "active" : ""}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(p.internalName)}
                >
                  <span className="name">{p.name}</span>
                  <span className="meta">R{p.rank}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="hint">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
