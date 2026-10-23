import { useEffect, useState } from "react";
import { asset } from "../lib/assets";
import type { Dataset } from "../lib/types";
import { enumCodec, palCodec, useUrlState } from "../lib/urlState";
import { BossTag } from "./BossTag";
import { PalSelect } from "./PalSelect";

type Props = { dataset: Dataset };

type Period = "day" | "night";

const periodCodec = enumCodec<Period>(["day", "night"]);

export function LocationWiki({ dataset }: Props) {
  const [palId, setPalId] = useUrlState("pal", null, palCodec(dataset));
  const [period, setPeriod] = useUrlState<Period>("time", "day", periodCodec);
  const pal = palId !== null ? dataset.pals[palId] : null;

  const [mapMissing, setMapMissing] = useState(false);
  useEffect(() => {
    setMapMissing(false);
  }, [palId, period]);

  const bossPals = dataset.pals.filter((p) => p.bossStatus === "boss-only");

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Pal Locations</h2>
        <p>
          Spawn heatmaps and Boss encounter info for Palworld 1.0. Coverage is
          partial — some Pals don&apos;t have location data yet.
        </p>
      </header>

      <PalSelect
        dataset={dataset}
        label="Pal"
        value={palId}
        onChange={setPalId}
        placeholder="Search a Pal…"
      />

      {!pal && (
        <>
          <p className="callout">Pick a Pal to see its spawn locations.</p>
          {bossPals.length > 0 && (
            <div className="boss-only-list">
              <span className="field-label">
                Boss-only Pals ({bossPals.length})
              </span>
              <div className="boss-only-grid">
                {bossPals.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    className="ghost-btn"
                    onClick={() => setPalId(bp.id)}
                  >
                    {bp.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {pal && (
        <div className="location-wiki">
          <div className="location-head">
            <h3>
              #{pal.dex} {pal.name}
            </h3>
            <BossTag pal={pal} />
          </div>

          {pal.bossStatus === "boss-only" && (
            <p className="callout warn">
              No regular wild spawn — this Pal is only obtainable by
              defeating its Boss encounter (shown below if we have location
              data for it).
            </p>
          )}
          {pal.bossStatus === "boss-and-wild" && (
            <p className="callout">
              This Pal has a regular wild spawn <em>and</em> a separate Boss
              encounter you can fight for a guaranteed high-level catch.
            </p>
          )}

          <div className="toggle-row period-toggle">
            <button
              type="button"
              className={period === "day" ? "active" : ""}
              onClick={() => setPeriod("day")}
            >
              Day
            </button>
            <button
              type="button"
              className={period === "night" ? "active" : ""}
              onClick={() => setPeriod("night")}
            >
              Night
            </button>
          </div>

          {mapMissing ? (
            <p className="callout">
              No location data available for this Pal yet.
            </p>
          ) : (
            <img
              key={`${pal.internalName}-${period}`}
              className="location-map"
              src={asset(`maps/${pal.internalName}-${period}.webp`)}
              alt={`${pal.name} spawn locations (${period})`}
              onError={() => setMapMissing(true)}
            />
          )}
        </div>
      )}
    </section>
  );
}
