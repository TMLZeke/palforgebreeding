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

type SortKey = "sprint" | "average" | "saddle";

const categoryCodec = enumCodec(CATEGORIES.map((c) => c.id));
const sortCodec = enumCodec<SortKey>(["sprint", "average", "saddle"]);

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
    const value = (m: MountInfo) => {
      if (sortBy === "sprint") return m.sprintSpeed ?? -1;
      if (sortBy === "average") return m.average ?? -1;
      return -m.saddleLevel; // lower saddle level first
    };
    return [...list].sort((a, b) => value(b) - value(a));
  }, [category, sortBy, query]);

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
              <option value="sprint">Sprint speed</option>
              <option value="average">Average speed</option>
              <option value="saddle">Saddle level</option>
            </select>
          </label>
        )}
      </div>

      <div className="mount-table-wrap">
        <table className="mount-table">
          <thead>
            <tr>
              <th>Pal</th>
              <th>Saddle</th>
              {isGlider ? (
                <th>Glide speed</th>
              ) : (
                <>
                  <th>Run</th>
                  <th>Sprint</th>
                  <th>Stamina</th>
                  <th>Avg</th>
                  <th>Distance</th>
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
                  <td>Lv {m.saddleLevel}</td>
                  {isGlider ? (
                    <td>{m.sprintSpeed ?? "—"}</td>
                  ) : (
                    <>
                      <td>{m.runSpeed ?? "—"}</td>
                      <td className="sprint-cell">{m.sprintSpeed ?? "—"}</td>
                      <td>{m.stamina ?? "—"}</td>
                      <td>{m.average ?? "—"}</td>
                      <td>{m.distance?.toLocaleString() ?? "—"}</td>
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