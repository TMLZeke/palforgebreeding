import { useMemo } from "react";
import type { Dataset, Passive } from "../lib/types";
import { enumCodec, stringCodec, useUrlState } from "../lib/urlState";

const FILTERS = [
  { id: "positive", label: "Positive", test: (r: number) => r > 0 },
  { id: "r3", label: "Rank 3+", test: (r: number) => r >= 3 },
  { id: "r4", label: "Rank 4+", test: (r: number) => r >= 4 },
  { id: "r5", label: "Rank 5", test: (r: number) => r >= 5 },
  { id: "negative", label: "Negative", test: (r: number) => r < 0 },
  { id: "all", label: "All", test: () => true },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const filterCodec = enumCodec<FilterId>(FILTERS.map((f) => f.id));

// Bucket for the rank colour: negatives share one red, positives climb
// from muted teal to gold.
function rankTone(rank: number): string {
  return rank < 0 ? "neg" : String(Math.min(rank, 5));
}

function rankLabel(rank: number): string {
  return rank < 0 ? `Rank −${-rank}` : `Rank ${rank}`;
}

type Props = { dataset: Dataset };

export function PassiveBrowser({ dataset }: Props) {
  const [query, setQuery] = useUrlState("q", "", stringCodec);
  const [filterId, setFilterId] = useUrlState<FilterId>(
    "grade",
    "positive",
    filterCodec,
  );

  const matchingQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dataset.passives;
    return dataset.passives.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [dataset.passives, query]);

  const filter = FILTERS.find((f) => f.id === filterId)!;
  const passives = matchingQuery.filter((p) => filter.test(p.rank));

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Passives (1.0)</h2>
        <p>
          Standard passive skills from the current dataset —{" "}
          {dataset.meta.passiveCount} total.
        </p>
      </header>

      <label className="text-field passive-search">
        <span className="field-label">Search</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artisan, attack, work speed…"
        />
      </label>

      <div className="grade-filter" role="radiogroup" aria-label="Rank filter">
        {FILTERS.map((f) => {
          const count = matchingQuery.filter((p) => f.test(p.rank)).length;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filterId === f.id}
              className={`grade-chip tone-${f.id}${filterId === f.id ? " active" : ""}`}
              onClick={() => setFilterId(f.id)}
            >
              {f.label}
              <span className="grade-count">{count}</span>
            </button>
          );
        })}
      </div>

      {passives.length === 0 ? (
        <p className="callout">
          No passives match{query.trim() ? ` “${query.trim()}”` : ""} in{" "}
          {filter.label.toLowerCase()}.
        </p>
      ) : (
        <div className="passive-list">
          {passives.map((p) => (
            <PassiveCard key={p.internalName} passive={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function PassiveCard({ passive: p }: { passive: Passive }) {
  return (
    <article className={`passive-row rank-tone-${rankTone(p.rank)}`}>
      <header className="passive-row-head">
        <h3>{p.name}</h3>
        <span className="rank-pill">{rankLabel(p.rank)}</span>
      </header>
      {p.description ? (
        <ul className="passive-effects">
          {p.description.split("\n").map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p>No description</p>
      )}
      {p.surgeryCost > 0 && (
        <p className="passive-surgery">
          Surgery cost {p.surgeryCost.toLocaleString()}
        </p>
      )}
    </article>
  );
}
