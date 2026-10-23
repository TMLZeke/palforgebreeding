import { useMemo } from "react";
import { MOUNTS, type MountCategory, type MountInfo } from "../lib/mountData";
import type { Dataset, Pal } from "../lib/types";
import { enumCodec, stringCodec, useUrlState } from "../lib/urlState";
import { PalChip } from "./PalSelect";

type Props = { dataset: Dataset; onViewLocation?: (palId: number) => void };

const CATEGORIES: { id: MountCategory; label: string; blurb: string }[] = [
  {
    id: "ground",
    label: "Ground",
    blurb: "Land only — lose stamina and eventually drown over water.",
  },
  {
    id: "fly",
    label: "Flying",
    blurb: "Fly freely. Most hover when out of stamina; a few drop and drown over water.",
  },
  {
    id: "swim",
    label: "Water",
    blurb: "No stamina drain while swimming.",
  },
  {
    id: "glider",
    label: "Gliders",
    blurb: "Enhance your equipped glider rather than being ridden.",
  },
];

type SortKey =
  | "name"
  | "saddle"
  | "run"
  | "sprint"
  | "stamina"
  | "average"
  | "distance";

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  saddle: "Saddle level",
  run: "Run speed",
  sprint: "Sprint speed",
  stamina: "Stamina",
  average: "Average speed",
  distance: "Distance",
};

const categoryCodec = enumCodec(CATEGORIES.map((c) => c.id));
const sortCodec = enumCodec<SortKey>(Object.keys(SORT_LABELS) as SortKey[]);

// Name and saddle level read best low → high; speeds and stats high → low.
function sortValue(m: MountInfo, key: SortKey): number {
  switch (key) {
    case "saddle":
      return -m.saddleLevel;
    case "run":
      return m.runSpeed ?? -1;
    case "sprint":
      return m.sprintSpeed ?? -1;
    case "stamina":
      return m.stamina ?? -1;
    case "average":
      return m.average ?? -1;
    case "distance":
      return m.distance ?? -1;
    default:
      return 0;
  }
}

export function MountSpeeds({ dataset, onViewLocation }: Props) {
  const [category, setCategory] = useUrlState<MountCategory>(
    "type",
    "ground",
    categoryCodec,
  );
  const [sortBy, setSortBy] = useUrlState<SortKey>("sort", "sprint", sortCodec);
  const [query, setQuery] = useUrlState("q", "", stringCodec);

  const palByName = useMemo(
    () => new Map(dataset.pals.map((p) => [p.name, p])),
    [dataset],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MOUNTS.filter(
      (m) =>
        m.category === category &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.skill.toLowerCase().includes(q)),
    );
    if (sortBy === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...list].sort((a, b) => sortValue(b, sortBy) - sortValue(a, sortBy));
  }, [category, sortBy, query]);

  const sortProps = { sortBy, onSort: setSortBy };
  const active = CATEGORIES.find((c) => c.id === category)!;
  const isGlider = category === "glider";

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Mount speeds (1.0)</h2>
        <p>
          Base speeds without passives or condensation. Speed passives (Nimble,
          Runner, Swift, Legend) stack and apply while mounted.
        </p>
      </header>

      <div className="subtabs" role="tablist" aria-label="Mount category">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={category === c.id}
            className={category === c.id ? "active" : ""}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mount-toolbar">
        <p className="category-blurb">{active.blurb}</p>
        <label className="text-field mount-search">
          <span className="field-label">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pal or mount skill…"
          />
        </label>
        {!isGlider && (
          <label className="text-field sort-field">
            <span className="field-label">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mount-table-wrap">
        <table className="mount-table">
          <thead>
            <tr>
              <SortHeader label="Pal" sortKey="name" {...sortProps} />
              <SortHeader label="Saddle" sortKey="saddle" {...sortProps} />
              {isGlider ? (
                <SortHeader label="Glide speed" sortKey="sprint" {...sortProps} />
              ) : (
                <>
                  <SortHeader label="Run" sortKey="run" {...sortProps} />
                  <SortHeader label="Sprint" sortKey="sprint" {...sortProps} />
                  <SortHeader label="Stamina" sortKey="stamina" {...sortProps} />
                  <SortHeader label="Avg" sortKey="average" {...sortProps} />
                  <SortHeader label="Distance" sortKey="distance" {...sortProps} />
                </>
              )}
              <th className="skill-col">Mount skill</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const pal = palByName.get(m.name);
              return (
                <tr key={m.name}>
                  <td>
                    {pal ? (
                      <MountPalCell
                        pal={pal}
                        drowns={m.drowns}
                        onViewLocation={onViewLocation}
                      />
                    ) : (
                      m.name
                    )}
                  </td>
                  <td className={sortBy === "saddle" ? "sorted-cell" : ""}>
                    Lv {m.saddleLevel}
                  </td>
                  {isGlider ? (
                    <td className={sortBy === "sprint" ? "sorted-cell" : ""}>
                      {m.sprintSpeed ?? "—"}
                    </td>
                  ) : (
                    <>
                      <td className={sortBy === "run" ? "sorted-cell" : ""}>
                        {m.runSpeed ?? "—"}
                      </td>
                      <td className={sortBy === "sprint" ? "sorted-cell" : ""}>
                        {m.sprintSpeed ?? "—"}
                      </td>
                      <td className={sortBy === "stamina" ? "sorted-cell" : ""}>
                        {m.stamina ?? "—"}
                      </td>
                      <td className={sortBy === "average" ? "sorted-cell" : ""}>
                        {m.average ?? "—"}
                      </td>
                      <td className={sortBy === "distance" ? "sorted-cell" : ""}>
                        {m.distance?.toLocaleString() ?? "—"}
                      </td>
                    </>
                  )}
                  <td className="skill-col">{m.skill}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="tip-footnote">
        Source: Palworld wiki “Rideable Pals” (1.0). “—” means the wiki hasn’t
        verified that value yet. Flying pals marked ⚠ drown over water when out
        of stamina.
      </p>
    </section>
  );
}

function MountPalCell({
  pal,
  drowns,
  onViewLocation,
}: {
  pal: Pal;
  drowns?: boolean;
  onViewLocation?: (palId: number) => void;
}) {
  return (
    <span className="mount-pal-cell">
      <PalChip
        pal={pal}
        onNameClick={onViewLocation && (() => onViewLocation(pal.id))}
      />
      {drowns && (
        <span className="drowns-badge" title="Drowns over water without stamina">
          ⚠
        </span>
      )}
    </span>
  );
}

function SortHeader({
  label,
  sortKey,
  sortBy,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sortBy: SortKey;
  onSort: (key: SortKey) => void;
}) {
  const active = sortBy === sortKey;
  const ascending = sortKey === "name" || sortKey === "saddle";
  return (
    <th aria-sort={active ? (ascending ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        className={`sort-btn${active ? " active" : ""}`}
        onClick={() => onSort(sortKey)}
      >
        {label}
        <span className="sort-arrow" aria-hidden>
          {active ? (ascending ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
