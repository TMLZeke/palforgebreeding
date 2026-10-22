import { useMemo } from "react";
import type { Dataset } from "../lib/types";
import { enumCodec, stringCodec, useUrlState } from "../lib/urlState";

const RANKS = [-3, 0, 1, 3, 4] as const;
const rankCodec = enumCodec(RANKS);

type Props = { dataset: Dataset };

export function PassiveBrowser({ dataset }: Props) {
  const [query, setQuery] = useUrlState("q", "", stringCodec);
  const [minRank, setMinRank] = useUrlState<(typeof RANKS)[number]>(
    "rank",
    0,
    rankCodec,
  );

  const passives = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dataset.passives.filter((p) => {
      if (p.rank < minRank) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [dataset.passives, query, minRank]);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Passives (1.0)</h2>
        <p>
          Standard passive skills from the current dataset —{" "}
          {dataset.meta.passiveCount} total.
        </p>
      </header>

      <div className="pair-grid">
        <label className="text-field">
          <span className="field-label">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Artisan, attack, work speed…"
          />
        </label>
        <label className="text-field">
          <span className="field-label">Min rank</span>
          <select
            value={minRank}
            onChange={(e) => setMinRank(Number(e.target.value) as typeof minRank)}
          >
            <option value={-3}>All</option>
            <option value={0}>Neutral+</option>
            <option value={1}>Rank 1+</option>
            <option value={3}>Rank 3+</option>
            <option value={4}>Rank 4 only</option>
          </select>
        </label>
      </div>

      <div className="passive-list">
        {passives.map((p) => (
          <article key={p.internalName} className="passive-row">
            <div>
              <h3>{p.name}</h3>
              {p.description ? (
                <ul className="passive-effects">
                  {p.description.split("\n").map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>No description</p>
              )}
            </div>
            <div className="passive-meta">
              <span className={`rank rank-${p.rank}`}>R{p.rank}</span>
              {p.surgeryCost > 0 && <span>Surgery {p.surgeryCost}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}