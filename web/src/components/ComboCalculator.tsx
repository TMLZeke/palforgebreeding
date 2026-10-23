import { useMemo } from "react";
import { breedChild, formatDex, rarityLabel } from "../lib/breeding";
import type { Dataset } from "../lib/types";
import { boolCodec, palCodec, useUrlState } from "../lib/urlState";
import { PalArt } from "./PalArt";
import { PalChip, PalSelect } from "./PalSelect";

type Props = { dataset: Dataset; onPlanPath?: (palId: number) => void };

export function ComboCalculator({ dataset, onPlanPath }: Props) {
  const pal = palCodec(dataset);
  const [parentA, setParentA] = useUrlState("a", null, pal);
  const [parentB, setParentB] = useUrlState("b", null, pal);
  const [catMageFemale, setCatMageFemale] = useUrlState("katress", true, boolCodec);

  const result = useMemo(() => {
    if (parentA === null || parentB === null) return null;
    return breedChild(dataset, parentA, parentB, { catMageFemale });
  }, [dataset, parentA, parentB, catMageFemale]);

  const child = result ? dataset.pals[result.childId] : null;
  const alt = result?.altChildId !== undefined
    ? dataset.pals[result.altChildId]
    : null;

  const genderPair =
    parentA !== null &&
    parentB !== null &&
    [dataset.pals[parentA].internalName, dataset.pals[parentB].internalName]
      .sort()
      .join("|") === "CatMage|FoxMage";

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Combo calculator</h2>
        <p>Pick two parents to see the 1.0 offspring species.</p>
      </header>

      <div className="combo-pickers">
        <PalSelect
          dataset={dataset}
          label="Parent A"
          value={parentA}
          onChange={setParentA}
        />
        <button
          type="button"
          className="swap-btn"
          aria-label="Swap parents"
          title="Swap parents"
          disabled={parentA === null && parentB === null}
          onClick={() => {
            setParentA(parentB);
            setParentB(parentA);
          }}
        >
          <SwapIcon />
        </button>
        <PalSelect
          dataset={dataset}
          label="Parent B"
          value={parentB}
          onChange={setParentB}
        />
      </div>

      {genderPair && (
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={catMageFemale}
            onChange={(e) => setCatMageFemale(e.target.checked)}
          />
          Katress is female (unchecked = Katress male / Wixen female)
        </label>
      )}

      <div className="result-stage">
        {!child && <p className="empty">Select two parents to hatch a result.</p>}
        {child && (
          <div className="result-card has-art">
            <PalArt pal={child} className="result-art" />
            <div className="result-body">
              <h3 className="result-name">
                {child.name}
                <span className="dex">#{formatDex(child)}</span>
              </h3>
              <dl className="stat-grid">
                <div>
                  <dt>Breeding power</dt>
                  <dd>{child.breedingPower}</dd>
                </div>
                <div>
                  <dt>Rarity</dt>
                  <dd>
                    {child.rarity} · {rarityLabel(child.rarity)}
                  </dd>
                </div>
                <div>
                  <dt>Stats</dt>
                  <dd>
                    HP {child.hp} / Atk {child.attack} / Def {child.defense}
                  </dd>
                </div>
              </dl>
              {Object.keys(child.work).length > 0 && (
                <div className="work-row">
                  {Object.entries(child.work).map(([k, v]) => (
                    <span key={k}>
                      {k} {v}
                    </span>
                  ))}
                </div>
              )}
              {onPlanPath && (
                <button
                  type="button"
                  className="ghost-btn plan-path-btn"
                  onClick={() => onPlanPath(child.id)}
                >
                  Plan a path to {child.name} →
                </button>
              )}
              {result?.genderDependent && alt && (
                <p className="note">
                  Gender swap yields <PalChip pal={alt} />
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SwapIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 5h10m0 0-2.5-2.5M12.5 5 10 7.5M13.5 11h-10m0 0L6 8.5M3.5 11 6 13.5" />
    </svg>
  );
}
