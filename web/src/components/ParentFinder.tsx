import { useMemo, useState } from "react";
import { rankParentPairs } from "../lib/breeding";
import { useOwnedPals } from "../lib/owned";
import type { Dataset } from "../lib/types";
import { palCodec, useUrlState } from "../lib/urlState";
import { OwnedPals } from "./OwnedPals";
import { PalChip, PalSelect } from "./PalSelect";

type Props = { dataset: Dataset };

export function ParentFinder({ dataset }: Props) {
  const pal = palCodec(dataset);
  const [target, setTarget] = useUrlState("pal", null, pal);
  const [withParent, setWithParent] = useUrlState("with", null, pal);
  const [limit, setLimit] = useState(24);
  const { owned } = useOwnedPals(dataset);

  const allPairs = useMemo(() => {
    if (target === null) return [];
    return rankParentPairs(dataset, target);
  }, [dataset, target]);

  const pairs = useMemo(() => {
    const rows = allPairs
      .filter(
        ({ parents: [a, b] }) =>
          withParent === null || a === withParent || b === withParent,
      )
      .map((p) => {
        let [a, b] = p.parents;
        // Keep the filtered parent in the first column so the list lines up.
        if (withParent !== null && b === withParent) [a, b] = [b, a];
        const ownedCount = Number(owned.has(a)) + Number(owned.has(b));
        return { ...p, parents: [a, b] as [number, number], ownedCount };
      });
    // Pairs you can breed right now first; ranking is kept within each group.
    return owned.size > 0
      ? rows.sort((x, y) => y.ownedCount - x.ownedCount)
      : rows;
  }, [allPairs, withParent, owned]);

  const readyCount = pairs.filter((p) => p.ownedCount === 2).length;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Find parents</h2>
        <p>
          Every 1.0 parent pair that produces your target, easiest first. Pairs
          you already own move to the top.
        </p>
      </header>

      <div className="pair-grid">
        <PalSelect
          dataset={dataset}
          label="Target Pal"
          value={target}
          onChange={setTarget}
        />
        <PalSelect
          dataset={dataset}
          label="Only pairs using"
          value={withParent}
          onChange={setWithParent}
          placeholder="Any parent…"
        />
      </div>

      <OwnedPals dataset={dataset} />

      {target !== null && (
        <p className="count-line">
          {pairs.length.toLocaleString()} combinations
          {withParent !== null && ` using ${dataset.pals[withParent].name}`}
          {owned.size > 0 && ` · ${readyCount} you can breed now`}
          {pairs.some((p) => p.sameSpecies) &&
            " · includes same-species (true breed)"}
        </p>
      )}

      <div className="pair-list">
        {pairs.slice(0, limit).map(({ parents, sameSpecies, ownedCount }) => {
          const [a, b] = parents;
          return (
            <div
              key={`${a}-${b}`}
              className={`pair-row ${sameSpecies ? "true-breed" : ""} ${ownedCount === 2 ? "is-ready" : ""}`}
            >
              <PalChip pal={dataset.pals[a]} />
              <span className="times">×</span>
              <PalChip pal={dataset.pals[b]} />
              <span className="pair-tags">
                {ownedCount === 2 && (
                  <span className="badge ready-badge">You have both</span>
                )}
                {ownedCount === 1 && (
                  <span className="badge half-badge">Have 1</span>
                )}
                {sameSpecies && <span className="badge">True breed</span>}
              </span>
            </div>
          );
        })}
      </div>

      {target !== null && pairs.length === 0 && (
        <p className="callout">
          No pairs use {withParent !== null && dataset.pals[withParent].name} to
          make {dataset.pals[target].name}.
        </p>
      )}

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
