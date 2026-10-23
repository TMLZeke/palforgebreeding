import { useMemo, useState } from "react";
import type { Tab } from "../App";
import type { Dataset } from "../lib/types";
import { PalArt } from "./PalArt";
import { PalSelect } from "./PalSelect";

type Props = {
  dataset: Dataset;
  onOpen: (tab: Tab, params?: Record<string, string>) => void;
};

const SHOWCASE = ["JetDragon", "Anubis", "CatMage", "SheepBall"];

const BREED_TOOLS: { tab: Tab; title: string; body: string }[] = [
  {
    tab: "tree",
    title: "Path planner",
    body: "Pick the Pal you want and get every parent to catch plus the exact breeding order. Give it your starters and it plans from what you have.",
  },
  {
    tab: "combo",
    title: "Combo",
    body: "Choose two parents and see the egg they make, with its stats and work skills.",
  },
  {
    tab: "parents",
    title: "Find parents",
    body: "Every pair that hatches a Pal, easiest first. Pairs you already own jump to the top.",
  },
  {
    tab: "funnel",
    title: "Passive funnel",
    body: "Plan a breeding line that keeps the passive skills you want, with warnings before a Pal runs out of slots.",
  },
];

const REFERENCE_TOOLS: { tab: Tab; title: string; body: string }[] = [
  {
    tab: "passives",
    title: "Passives",
    body: "All 1.0 passive skills, colour-coded by rank.",
  },
  {
    tab: "mounts",
    title: "Mounts",
    body: "Ride speeds, stamina and saddle levels, sortable by any stat.",
  },
  {
    tab: "base",
    title: "Base pals",
    body: "The best workers for a mining, farming, power or any other base.",
  },
  {
    tab: "locations",
    title: "Locations",
    body: "Day and night spawn maps, plus which Pals only come from bosses.",
  },
  {
    tab: "tips",
    title: "Tips",
    body: "Cakes, key breeding Pals and a workflow for perfect passives.",
  },
];

export function Home({ dataset, onOpen }: Props) {
  const [target, setTarget] = useState<number | null>(null);

  const showcase = useMemo(
    () =>
      SHOWCASE.map((name) =>
        dataset.pals.find((p) => p.internalName === name),
      ).filter((p) => p !== undefined),
    [dataset],
  );

  function planPath() {
    if (target === null) return;
    onOpen("tree", { pal: dataset.pals[target].internalName });
  }

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <h2>Work out how to breed any Pal, step by step.</h2>
          <p className="home-lede">
            Palforge is a free breeding planner for Palworld 1.0. Tell it which
            Pal you are after and it works out which parents to catch and the
            order to breed them in.
          </p>

          <div className="home-start">
            <PalSelect
              dataset={dataset}
              label="Which Pal do you want?"
              value={target}
              onChange={setTarget}
              placeholder="Search all Pals…"
            />
            <button
              type="button"
              className="primary-btn"
              disabled={target === null}
              onClick={planPath}
            >
              Plan my path
            </button>
          </div>
          <p className="home-alt">
            Or{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => onOpen("combo")}
            >
              check what two parents make
            </button>
            .
          </p>
        </div>

        <div className="home-showcase" aria-hidden>
          {showcase.map((pal, i) => (
            <PalArt key={pal.id} pal={pal} className={`showcase-${i}`} />
          ))}
        </div>
      </section>

      <p className="home-facts">
        Covers <strong>{dataset.meta.palCount}</strong> Pals,{" "}
        <strong>{dataset.meta.comboCount.toLocaleString()}</strong> breeding
        combinations and <strong>{dataset.meta.passiveCount}</strong> passive
        skills, built from game-file data for version{" "}
        {dataset.meta.gameVersion}.
      </p>

      <section className="home-section" aria-labelledby="home-breed">
        <h3 id="home-breed">Breeding tools</h3>
        <div className="home-tools is-breed">
          {BREED_TOOLS.map((t) => (
            <ToolLink key={t.tab} {...t} onOpen={onOpen} />
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-reference">
        <h3 id="home-reference">Reference</h3>
        <div className="home-tools is-reference">
          {REFERENCE_TOOLS.map((t) => (
            <ToolLink key={t.tab} {...t} onOpen={onOpen} />
          ))}
        </div>
      </section>

      <section className="home-section home-notes" aria-labelledby="home-notes">
        <h3 id="home-notes">Good to know</h3>
        <ul>
          <li>
            <strong>Your Pals stay on your device.</strong> Add the Pals you
            own under “My Pals” and Find parents, Path planner and Base pals
            use them. The list is saved in this browser only, with no account.
          </li>
          <li>
            <strong>Every page is a shareable link.</strong> The address bar
            keeps what you picked, so you can bookmark a plan or send it to a
            friend.
          </li>
          <li>
            <strong>Tap any Pal name</strong> for its stats, work skills and
            partner skill.
          </li>
        </ul>
      </section>
    </div>
  );
}

function ToolLink({
  tab,
  title,
  body,
  onOpen,
}: {
  tab: Tab;
  title: string;
  body: string;
  onOpen: Props["onOpen"];
}) {
  return (
    <button type="button" className="tool-link" onClick={() => onOpen(tab)}>
      <span className="tool-link-title">
        {title}
        <span className="tool-link-arrow" aria-hidden>
          →
        </span>
      </span>
      <span className="tool-link-body">{body}</span>
    </button>
  );
}
