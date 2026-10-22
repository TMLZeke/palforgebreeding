import { useMemo, useState } from "react";
import { parentsFor } from "../lib/breeding";
import { buildPathFunnelSteps, cakeKeyFor } from "../lib/passiveFunnel";
import type { PassiveEntry } from "../lib/passives";
import { planPathFromStarters } from "../lib/treePlanner";
import { collectGatherList, flattenBreedSteps } from "../lib/treeSteps";
import type { Dataset } from "../lib/types";
import {
  boolCodec,
  intCodec,
  palCodec,
  palListCodec,
  useUrlState,
} from "../lib/urlState";
import { PalMultiSelect, PalSelect } from "./PalSelect";
import { PassiveFunnelStep, type FunnelSlot } from "./PassiveFunnelStep";

type Props = { dataset: Dataset };

export function PassivePlanner({ dataset }: Props) {
  const pal = palCodec(dataset);
  const palList = palListCodec(dataset);
  const [starterA, setStarterA] = useUrlState("sa", null, pal);
  const [starterB, setStarterB] = useUrlState("sb", null, pal);
  const [extraOwned, setExtraOwned] = useUrlState<number[]>("owned", [], palList);
  const [target, setTarget] = useUrlState("pal", null, pal);
  const [allowWild, setAllowWild] = useUrlState("wild", true, boolCodec);
  const [commonPowerMin, setCommonPowerMin] = useUrlState(
    "bp",
    1000,
    intCodec(500, 1400),
  );
  const [leafEntries, setLeafEntries] = useState<
    Record<number, PassiveEntry[]>
  >({});
  const [cakeFlags, setCakeFlags] = useState<Record<string, boolean>>({});

  const starters = useMemo(() => {
    const ids = [starterA, starterB, ...extraOwned].filter(
      (id): id is number => id !== null,
    );
    return [...new Set(ids)];
  }, [starterA, starterB, extraOwned]);

  const result = useMemo(() => {
    return planPathFromStarters(dataset, target, starters, {
      allowWildHelpers: allowWild,
      commonPowerMin,
    });
  }, [dataset, target, starters, allowWild, commonPowerMin]);

  const targetHasNoRecipe =
    target !== null &&
    parentsFor(dataset, target).every(
      ([a, b]) => a === target && b === target,
    );

  const plan = result.status === "ok" ? result.plan : null;
  const steps = useMemo(
    () => (plan ? flattenBreedSteps(plan.root) : []),
    [plan],
  );
  const gather = useMemo(
    () => (plan ? collectGatherList(plan.root) : []),
    [plan],
  );
  const leafPalIds = useMemo(
    () => new Set(gather.map((g) => g.palId)),
    [gather],
  );
  const leafKind = useMemo(
    () => new Map(gather.map((g) => [g.palId, g.kind])),
    [gather],
  );

  const funnelSteps = useMemo(
    () =>
      buildPathFunnelSteps(dataset, steps, leafPalIds, leafEntries, cakeFlags),
    [dataset, steps, leafPalIds, leafEntries, cakeFlags],
  );

  function updateLeafEntries(palId: number, entries: PassiveEntry[]) {
    setLeafEntries((prev) => ({ ...prev, [palId]: entries }));
  }

  function updateCake(key: string, cakeActive: boolean) {
    setCakeFlags((prev) => ({ ...prev, [key]: cakeActive }));
  }

  function toSlot(node: {
    palId: number;
    entries: PassiveEntry[];
    editable: boolean;
  }): FunnelSlot {
    if (!node.editable) {
      return {
        palId: node.palId,
        entries: node.entries,
        editable: false,
        title: "Carried forward",
      };
    }
    let title = leafKind.get(node.palId) === "owned" ? "Owned" : "Catch";
    if (node.palId === starterA) title = "Starter A";
    else if (node.palId === starterB) title = "Starter B";
    return {
      palId: node.palId,
      entries: node.entries,
      editable: true,
      title,
      onChange: (next) => updateLeafEntries(node.palId, next),
    };
  }

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Passive Funnel</h2>
        <p>
          Pick two starters and the Pal you want, and this plans the same
          breeding path as Path planner — but tracks passives through every
          step. Each Pal can hold at most 4 passives (6 with a Special Cake)
          — mark the ones you most want kept so overflow warnings tell you
          what to drop.
        </p>
      </header>

      <div className="path-hero">
        <div className="path-from">
          <span className="field-label">Pals I have (optional stock)</span>
          <div className="pair-grid">
            <PalSelect
              dataset={dataset}
              label="Starter A"
              value={starterA}
              onChange={setStarterA}
              placeholder="Optional…"
            />
            <PalSelect
              dataset={dataset}
              label="Starter B"
              value={starterB}
              onChange={setStarterB}
              placeholder="Optional…"
            />
          </div>
        </div>

        <div className="path-arrow" aria-hidden>
          →
        </div>

        <div className="path-to">
          <PalSelect
            dataset={dataset}
            label="Pal I want"
            value={target}
            onChange={setTarget}
            placeholder="Target pal…"
          />
        </div>
      </div>

      <details className="path-extras">
        <summary>More options</summary>
        <PalMultiSelect
          dataset={dataset}
          values={extraOwned}
          onChange={setExtraOwned}
          label="Extra owned pals"
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={allowWild}
            onChange={(e) => setAllowWild(e.target.checked)}
          />
          Allow catching other pals as the other parent
        </label>
        {allowWild && (
          <label className="slider-field">
            <span className="field-label">
              Common wild threshold (breeding power ≥ {commonPowerMin})
            </span>
            <input
              type="range"
              min={500}
              max={1400}
              step={50}
              value={commonPowerMin}
              onChange={(e) => setCommonPowerMin(Number(e.target.value))}
            />
          </label>
        )}
      </details>

      {result.status === "need-target" && (
        <p className="callout">Pick the Pal you want the passives to end up on.</p>
      )}

      {result.status === "unreachable" && (
        <div className="callout warn">
          {targetHasNoRecipe ? (
            <p>
              No other-species pair produces this Pal in 1.0 — at best it
              only true-breeds from two of itself, so there&apos;s no path
              from scratch. Raid bosses and some legendaries work this way
              and are meant to be caught, not bred.
            </p>
          ) : (
            <>
              <p>
                Couldn&apos;t find a path to that Pal with your current
                starters and options.
              </p>
              {!allowWild ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setAllowWild(true)}
                >
                  Allow wild helpers
                </button>
              ) : (
                <p className="note">
                  Try lowering the common wild threshold above so more Pals
                  count as catchable
                  {starters.length > 0 && ", or clear the starters"}.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {plan && (
        <div className="funnel-plan">
          {funnelSteps.map((step) => (
            <PassiveFunnelStep
              key={`${step.step}-${step.childId}-${step.parentA.palId}-${step.parentB.palId}`}
              dataset={dataset}
              parentA={toSlot(step.parentA)}
              parentB={toSlot(step.parentB)}
              childId={step.childId}
              genderDependent={step.genderDependent}
              altChildId={step.altChildId}
              cakeActive={step.cakeActive}
              onCakeChange={(v) =>
                updateCake(
                  cakeKeyFor({
                    step: step.step,
                    parentAId: step.parentA.palId,
                    parentBId: step.parentB.palId,
                    childId: step.childId,
                  }),
                  v,
                )
              }
              isFinal={step.childId === plan.targetId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
