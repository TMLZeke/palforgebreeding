import { useEffect, useState } from "react";
import type { Dataset, Pal } from "../lib/types";
import { PalChip } from "./PalSelect";

type Props = { dataset: Dataset };

function findPal(dataset: Dataset, name: string): Pal | undefined {
  return dataset.pals.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

function PalRef({ dataset, name }: { dataset: Dataset; name: string }) {
  const pal = findPal(dataset, name);
  if (!pal) return <strong>{name}</strong>;
  return <PalChip pal={pal} />;
}

const SECTIONS = [
  { id: "tips-pals", label: "Key pals" },
  { id: "tips-passives", label: "Passives" },
  { id: "tips-cakes", label: "Cakes" },
  { id: "tips-setup", label: "Base setup" },
  { id: "tips-workflow", label: "Workflow" },
];

// Highlights the section currently in view, for the sticky contents list.
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

export function BreedingTips({ dataset }: Props) {
  const active = useActiveSection(SECTIONS.map((s) => s.id));
  return (
    <section className="panel tips-panel">
      <header className="panel-head">
        <h2>Breeding tips (1.0)</h2>
        <p>
          Useful pals, cakes, and habits for a faster breeding base. Mechanics
          below match the 1.0 update (mutations, new cakes, Ancient Hatchery).
        </p>
      </header>

      <div className="tips-layout">
        <nav className="tips-toc" aria-label="Tips sections">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={active === s.id ? "active" : ""}
              aria-current={active === s.id ? "location" : undefined}
              onClick={(e) => {
                // Scroll without touching the URL hash, which holds no state
                // here and would sit oddly next to the query-string state.
                e.preventDefault();
                document
                  .getElementById(s.id)
                  ?.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                  });
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="tips-content">

          <article id="tips-pals" className="tip-section">
            <h3>Key pals for breeding &amp; incubating</h3>
            <div className="tip-cards">
              <div className="tip-card">
                <h4>
                  <PalRef dataset={dataset} name="Grintale" />
                </h4>
                <p>
                  Condensed Grintale’s partner skill can grant a high chance of an{" "}
                  <strong>extra egg</strong> when you collect eggs. Huge for volume
                  breeding — keep one at the breeding base.
                </p>
              </div>
              <div className="tip-card">
                <h4>
                  <PalRef dataset={dataset} name="Braloha" />
                </h4>
                <p>
                  Partner skill boosts <strong>Breeding Farm speed</strong> (about
                  +50% when condensed well). Best “make eggs faster” worker for the
                  farm itself.
                </p>
              </div>
              <div className="tip-card">
                <h4>
                  <PalRef dataset={dataset} name="Dynamoff" />
                </h4>
                <p>
                  Partner skill speeds <strong>incubation</strong>{" "}
                  (Electro-Massage). Pair with Babysitter carriers if you hatch a
                  lot of eggs at once.
                </p>
              </div>
              <div className="tip-card">
                <h4>Cake supply line</h4>
                <p>
                  Keep cake flowing with ranch/farm pals like{" "}
                  <PalRef dataset={dataset} name="Mozzarina" /> (milk),{" "}
                  <PalRef dataset={dataset} name="Chikipi" /> (eggs),{" "}
                  <PalRef dataset={dataset} name="Beegarde" /> (honey), plus wheat /
                  berries for flour and jam. Idle farms usually mean you ran out of
                  cake.
                </p>
              </div>
            </div>
          </article>

          <article id="tips-passives" className="tip-section">
            <h3>Passives that matter on the breeding base</h3>
            <ul className="tip-list">
              <li>
                <strong>Babysitter</strong> — +30% egg production and +30%
                incubation for pals on a Breeding Farm.{" "}
                <em>Egg production does not stack</em> with a second Babysitter or
                with Braloha’s partner skill (pick one for output).{" "}
                <em>Incubation does stack</em> — multiple Babysitters + Dynamoff
                help hatch speed.
              </li>
              <li>
                <strong>Philanthropist</strong> — when assigned to a Breeding Farm,
                breeding speed +100%. Excellent on the actual breeding pair /
                farm workers when you care about raw egg throughput.
              </li>
              <li>
                <strong>Insomnia</strong> — keeps pals working at night so breeding
                doesn’t stall while everyone sleeps.
              </li>
              <li>
                Work-speed passives (<strong>Artisan</strong>,{" "}
                <strong>Remarkable Craftsmanship</strong>) help cake crafting and
                ranch chores more than the farm timer itself.
              </li>
            </ul>
          </article>

          <article id="tips-cakes" className="tip-section">
            <h3>Which cake to use</h3>
            <div className="cake-table">
              <div>
                <strong>Cake</strong>
                <span>Default fuel. Fine early; 1% mutation chance per egg.</span>
              </div>
              <div>
                <strong>Mushroom Cake</strong>
                <span>Slightly better chance of higher base / talent stats.</span>
              </div>
              <div>
                <strong>Vegetable Cake</strong>
                <span>
                  <em>Two eggs</em> per cycle — best for volume when hunting
                  passives.
                </span>
              </div>
              <div>
                <strong>Extravagant / Deluxe Vegetable Cake</strong>
                <span>
                  Raises <em>mutation</em> odds (about 3%) and helps stat growth —
                  use when chasing mutated eggs.
                </span>
              </div>
              <div>
                <strong>Special Cake</strong>
                <span>
                  Stronger passive inheritance from parents — use when parents
                  already have the traits you want locked in.
                </span>
              </div>
            </div>
            <p className="tip-note">
              Simple rule: Vegetable for quantity → Special to clean passives →
              Extravagant when you’re mutation hunting.
            </p>
          </article>

          <article id="tips-setup" className="tip-section">
            <h3>Base setup tips</h3>
            <ul className="tip-list">
              <li>
                Unlock a <strong>Breeding Farm</strong> early (tech ~19), then scale
                to multiple farms so several lines run in parallel.
              </li>
              <li>
                Late game, the <strong>Ancient Hatchery</strong> automates egg
                production and incubation — worth building when you unlock it.
              </li>
              <li>
                Stock each farm chest with cakes so pairs never sit idle.
              </li>
              <li>
                Keep a dedicated “hatch wing” with incubators + Dynamoff /
                Babysitter supports so eggs don’t pile up.
              </li>
              <li>
                1.0 reshuffled many recipes — don’t trust Early Access combo
                sheets. Use this app’s Combo / Path tools (1.0 data).
              </li>
            </ul>
          </article>

          <article id="tips-workflow" className="tip-section">
            <h3>Helpful breeding workflow</h3>
            <ol className="tip-steps">
              <li>
                <strong>Pick the goal species</strong> with Path or Find parents —
                get the species first, then worry about perfect passives.
              </li>
              <li>
                <strong>Isolate passives</strong> on clean parents (pyramid method):
                breed until each parent holds the traits you want, then combine.
                Don’t stack junk passives on both parents.
              </li>
              <li>
                <strong>Volume phase</strong> with Vegetable Cake (+ Grintale) until
                you see the passive mix you need.
              </li>
              <li>
                <strong>Lock phase</strong> with Special Cake once parents are
                clean.
              </li>
              <li>
                <strong>Mutation / IV chase</strong> with Extravagant Vegetable Cake
                after the species + passives are right.
              </li>
              <li>
                Remember: some strong pals <strong>only true-breed</strong> (same
                species × same species) or need a unique pair — Path will tell you
                if your starters can’t reach them alone.
              </li>
            </ol>
          </article>

        </div>
      </div>

      <p className="tip-footnote">
        Tip details reflect community 1.0 guides and in-game passive text from
        this dataset (DB {dataset.meta.dbVersion}). Patch notes can nudge cake
        odds or partner-skill numbers — re-check after big updates.
      </p>
    </section>
  );
}