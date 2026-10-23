import { useEffect, useMemo, useState } from "react";
import {
  BASE_TYPES,
  WORK_LABELS,
  recommendBasePals,
  type BaseTypeId,
} from "../lib/baseAdvisor";
import type { Dataset } from "../lib/types";
import { enumCodec, intCodec, useUrlState } from "../lib/urlState";
import { PalArt } from "./PalArt";
import { PalChip } from "./PalSelect";

type Props = { dataset: Dataset };

const baseTypeCodec = enumCodec(BASE_TYPES.map((b) => b.id));
const slotsCodec = intCodec(1, 20);

const STORAGE_KEY = "palforge-dont-have";

function loadExcluded(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

export function BaseAdvisor({ dataset }: Props) {
  const [baseTypeId, setBaseTypeId] = useUrlState<BaseTypeId>(
    "base",
    "mining",
    baseTypeCodec,
  );
  const [slots, setSlots] = useUrlState("slots", 10, slotsCodec);
  const [excluded, setExcluded] = useState<Set<number>>(loadExcluded);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...excluded]));
  }, [excluded]);

  const baseType = BASE_TYPES.find((b) => b.id === baseTypeId)!;

  const recommendations = useMemo(
    () => recommendBasePals(dataset, baseType, slots, excluded),
    [dataset, baseType, slots, excluded],
  );

  function markDontHave(palId: number) {
    setExcluded((prev) => new Set(prev).add(palId));
  }

  function restore(palId: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.delete(palId);
      return next;
    });
  }

  const excludedPals = [...excluded]
    .map((id) => dataset.pals[id])
    .filter(Boolean)
    .sort((a, b) => a.dex - b.dex);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Base pal advisor</h2>
        <p>
          Pick a base type and team size — get the best 1.0 work pals for it.
          Click <strong>“Don’t have”</strong> on any pal and the list refills
          with the next best replacement.
        </p>
      </header>

      <span className="field-label" id="base-type-label">
        Base type
      </span>
      <div
        className="subtabs base-types"
        role="radiogroup"
        aria-labelledby="base-type-label"
      >
        {BASE_TYPES.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={baseTypeId === b.id}
            className={baseTypeId === b.id ? "active" : ""}
            onClick={() => setBaseTypeId(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="base-controls">
        <p className="category-blurb">{baseType.blurb}</p>
        <label className="slider-field slots-field">
          <span className="field-label">Pal slots: {slots}</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={slots}
            onChange={(e) => setSlots(Number(e.target.value))}
          />
        </label>
      </div>

      <ol className="advisor-list">
        {recommendations.map((rec, i) => (
          <li key={rec.pal.id} className="advisor-card">
            <span className="advisor-rank" aria-label={`Pick ${i + 1}`}>
              {i + 1}
            </span>
            <PalArt pal={rec.pal} className="advisor-art" />
            <div className="advisor-main">
              <div className="advisor-pal">
                <PalChip pal={rec.pal} />
                {rec.pal.nocturnal && (
                  <span className="night-badge" title="Nocturnal — works at night">
                    <MoonIcon />
                    Night shift
                  </span>
                )}
              </div>
              <ul className="work-levels" aria-label="Relevant work">
                {rec.relevantWork.map((w) => (
                  <li
                    key={w.type}
                    className={
                      (baseType.weights[w.type] ?? 0) >= 1.5 ? "is-core" : ""
                    }
                  >
                    {WORK_LABELS[w.type] ?? w.type}
                    <strong>{w.level}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="dont-have-btn"
              aria-label={`Don’t have ${rec.pal.name}`}
              onClick={() => markDontHave(rec.pal.id)}
            >
              Don’t have
            </button>
          </li>
        ))}
      </ol>

      {recommendations.length < slots && (
        <p className="callout warn">
          Only {recommendations.length} suitable pals left for this base type —
          restore some from the “don’t have” list below.
        </p>
      )}

      {excludedPals.length > 0 && (
        <section className="recipe-block excluded-block">
          <h3>Marked “don’t have” ({excludedPals.length})</h3>
          <div className="pal-multi-selected">
            {excludedPals.map((pal) => (
              <button
                key={pal.id}
                type="button"
                className="tag"
                onClick={() => restore(pal.id)}
                title="Click to restore"
              >
                <PalChip pal={pal} withInfo={false} /> ↩
              </button>
            ))}
          </div>
          <p className="tip-footnote">
            Saved in your browser — applies to every base type. Click a pal to
            restore it.
          </p>
        </section>
      )}
    </section>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5 5.8 5.8 0 1 0 13.5 9.6Z" />
    </svg>
  );
}
