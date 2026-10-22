import { useMemo, useState } from "react";
import { rankParentPairs } from "../lib/breeding";
import type { Dataset } from "../lib/types";
import { palCodec, useUrlState } from "../lib/urlState";
import { PalChip, PalSelect } from "./PalSelect";

type Props = { dataset: Dataset };

export function ParentFinder({ dataset }: Props) {
  const [target, setTarget] = useUrlState("pal", null, palCodec(dataset));
  const [limit, setLimit] = useState(24);

  const pairs = useMemo(() => {
    if (target === null) return [];
    return rankParentPairs(dataset, target);
  }, [dataset, target]);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Find parents</h2>
        <p>Every 1.0 parent pair that produces your target, easiest first.</p>
      </header>

      <PalSelect
        dataset={dataset}
        label="Target Pal"
        value={target}
        onChange={setTarget}
      />

      {target !== null && (
        <p className="count-line">
          {pairs.length.toLocaleString()} combinations
          {pairs.some((p) => p.sameSpecies) &&
            " · includes same-species (true breed)"}
        </p>
      )}

      <div className="pair-list">
        {pairs.slice(0, limit).map(({ parents, sameSpecies }) => {
          const [a, b] = parents;
          return (
            <div
              key={`${a}-${b}`}
              className={`pair-row ${sameSpecies ? "true-breed" : ""}`}
            >
              <PalChip pal={dataset.pals[a]} />
              <span className="times">×</span>
              <PalChip pal={dataset.pals[b]} />
              {sameSpecies && <span className="badge">True breed</span>}
            </div>
          );
        })}
      </div>

      {pairs.length > limit && (
        <button
          type="button"
          className="ghost-btn"
          onClick={() => setLimit((n) => n + 40)}
        >
          Show more ({pairs.length - limit} left)
        </button>
      )}
    </section>
  );
}