import { useEffect, useMemo, useState } from "react";
import {
  BASE_TYPES,
  WORK_LABELS,
  recommendBasePals,
  type BaseTypeId,
} from "../lib/baseAdvisor";
import type { Dataset } from "../lib/types";
import { enumCodec, intCodec, useUrlState } from "../lib/urlState";
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

      <div className="pair-grid">
        <label className="text-field">
          <span className="field-label">Base type</span>
          <select
            value={baseTypeId}
            onChange={(e) => setBaseTypeId(e.target.value as BaseTypeId)}
          >
            {BASE_TYPES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="slider-field">
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

      <p className="category-blurb">{baseType.blurb}</p>

      <ol className="advisor-list">
        {recommendations.map((rec, i) => (
          <li key={rec.pal.id} className="advisor-row">
            <span className="advisor-rank">{i + 1}</span>
            <div className="advisor-main">
              <div className="advisor-pal">
                <PalChip pal={rec.pal} />
                {rec.pal.nocturnal && (
                  <span className="night-badge" title="Nocturnal — works at night">
                    🌙 night
                  </span>
                )}
              </div>
              <div className="work-row">
                {rec.relevantWork.map((w) => (
                  <span key={w.type}>
                    {WORK_LABELS[w.type] ?? w.type} {w.level}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="ghost-btn dont-have-btn"
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