import { useEffect, useState } from "react";
import { BaseAdvisor } from "./components/BaseAdvisor";
import { BreedingTips } from "./components/BreedingTips";
import { ComboCalculator } from "./components/ComboCalculator";
import { Home } from "./components/Home";
import { LocationWiki } from "./components/LocationWiki";
import { MountSpeeds } from "./components/MountSpeeds";
import { ParentFinder } from "./components/ParentFinder";
import { PassiveBrowser } from "./components/PassiveBrowser";
import { PassivePlanner } from "./components/PassivePlanner";
import { TreePlanner } from "./components/TreePlanner";
import { loadDataset } from "./lib/dataset";
import { enumCodec, writeParams } from "./lib/urlState";
import type { Dataset } from "./lib/types";
import "./App.scss";

export type Tab =
  | "home"
  | "combo"
  | "parents"
  | "tree"
  | "passives"
  | "funnel"
  | "mounts"
  | "base"
  | "locations"
  | "tips";

const TAB_GROUPS: { label: string; tabs: { id: Tab; label: string }[] }[] = [
  {
    label: "Breed",
    tabs: [
      { id: "combo", label: "Combo" },
      { id: "parents", label: "Find parents" },
      { id: "tree", label: "Path planner" },
      { id: "funnel", label: "Passive funnel" },
    ],
  },
  {
    label: "Reference",
    tabs: [
      { id: "passives", label: "Passives" },
      { id: "mounts", label: "Mounts" },
      { id: "base", label: "Base pals" },
      { id: "locations", label: "Locations" },
      { id: "tips", label: "Tips" },
    ],
  },
];

const TAB_IDS: Tab[] = [
  "home",
  ...TAB_GROUPS.flatMap((g) => g.tabs.map((t) => t.id)),
];
const tabCodec = enumCodec(TAB_IDS);

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("tab");
    const parsed = raw ? tabCodec.parse(raw) : undefined;
    if (parsed) return parsed;
    // Combo used to be the default view, so its links had no tab param.
    return params.has("a") || params.has("b") ? "combo" : "home";
  });

  // Each tool starts fresh when you switch to it (as before), so the URL
  // keeps only the new tab plus any params handed over to it.
  function switchTab(next: Tab, params: Record<string, string> = {}) {
    const search = new URLSearchParams(params);
    if (next !== "home") search.set("tab", next);
    writeParams(search);
    setTab(next);
  }

  function goToLocation(palId: number) {
    if (!dataset) return;
    switchTab("locations", { pal: dataset.pals[palId].internalName });
  }

  // Keep the active tab visible when the tab row scrolls sideways (phones).
  useEffect(() => {
    document
      .querySelector(".tabs button.active")
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [tab]);

  useEffect(() => {
    loadDataset()
      .then(setDataset)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden />
      <header className="topbar">
        <h1 className="brand">
          <a
            href={import.meta.env.BASE_URL}
            className="brand-link"
            aria-current={tab === "home" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              if (tab !== "home") switchTab("home");
            }}
          >
            Palforge
          </a>
          <span className="brand-sub">Palworld 1.0 breeding planner</span>
        </h1>
        {dataset && (
          <p className="meta-line">
            <span>
              Game <strong>{dataset.meta.gameVersion}</strong>
            </span>
            <span>
              DB <strong>{dataset.meta.dbVersion}</strong>
            </span>
            <span className="meta-extra">
              {dataset.meta.palCount} pals ·{" "}
              {dataset.meta.comboCount.toLocaleString()} combos
            </span>
          </p>
        )}
      </header>

      <nav className="tabs" aria-label="Tools">
        {TAB_GROUPS.map((group) => (
          <div className="tab-group" key={group.label}>
            <span className="tab-group-label">{group.label}</span>
            {group.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? "active" : ""}
                aria-current={tab === t.id ? "page" : undefined}
                onClick={() => t.id !== tab && switchTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <main>
        {error && <p className="error">{error}</p>}
        {!dataset && !error && <p className="loading">Loading 1.0 dataset…</p>}
        {dataset && tab === "home" && (
          <Home
            dataset={dataset}
            onOpen={(next, params) => switchTab(next, params)}
          />
        )}
        {dataset && tab === "combo" && (
          <ComboCalculator
            dataset={dataset}
            onPlanPath={(id) =>
              switchTab("tree", { pal: dataset.pals[id].internalName })
            }
          />
        )}
        {dataset && tab === "parents" && <ParentFinder dataset={dataset} />}
        {dataset && tab === "tree" && <TreePlanner dataset={dataset} />}
        {dataset && tab === "passives" && <PassiveBrowser dataset={dataset} />}
        {dataset && tab === "funnel" && <PassivePlanner dataset={dataset} />}
        {dataset && tab === "mounts" && (
          <MountSpeeds dataset={dataset} onViewLocation={goToLocation} />
        )}
        {dataset && tab === "base" && <BaseAdvisor dataset={dataset} />}
        {dataset && tab === "locations" && (
          <LocationWiki dataset={dataset} />
        )}
        {dataset && tab === "tips" && <BreedingTips dataset={dataset} />}
      </main>

      <footer className="site-foot">
        <p>
          Breeding data sourced from{" "}
          <a
            href="https://github.com/tylercamp/palcalc"
            target="_blank"
            rel="noreferrer"
          >
            tylercamp/palcalc
          </a>{" "}
          game-file exports
          {dataset &&
            `, verified ${new Date(dataset.meta.generatedAt).toLocaleDateString()}`}
          . Rebuild with{" "}
          <code>npm run data</code> after updating{" "}
          <code>data/db.json</code> / <code>data/breeding.json</code>.
        </p>
      </footer>
    </div>
  );
}