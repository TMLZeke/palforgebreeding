import { useEffect, useMemo, useState } from "react";
import { breedChild, formatDex, parentsFor } from "../lib/breeding";
import { useOwnedPals } from "../lib/owned";
import type { PassiveEntry } from "../lib/passives";
import { planPathFromStarters } from "../lib/treePlanner";
import {
  collectGatherList,
  flattenBreedSteps,
  type BreedStep,
  type GatherItem,
} from "../lib/treeSteps";
import type { Dataset, TreeNode } from "../lib/types";
import {
  boolCodec,
  intCodec,
  palCodec,
  palListCodec,
  useUrlState,
} from "../lib/urlState";
import { OwnedPals } from "./OwnedPals";
import { PalArt } from "./PalArt";
import { PalChip, PalMultiSelect, PalSelect } from "./PalSelect";
import { PassiveFunnelStep } from "./PassiveFunnelStep";

type Props = { dataset: Dataset };

type StepPassiveState = {
  parentAEntries: PassiveEntry[];
  parentBEntries: PassiveEntry[];
  cakeActive: boolean;
};

const EMPTY_STEP_STATE: StepPassiveState = {
  parentAEntries: [],
  parentBEntries: [],
  cakeActive: false,
};

export function TreePlanner({ dataset }: Props) {
  const pal = palCodec(dataset);
  const palList = palListCodec(dataset);
  const [starterA, setStarterA] = useUrlState("sa", null, pal);
  const [starterB, setStarterB] = useUrlState("sb", null, pal);
  const [extraOwned, setExtraOwned] = useUrlState<number[]>("owned", [], palList);
  const [target, setTarget] = useUrlState("pal", null, pal);
  const [allowWild, setAllowWild] = useUrlState("wild", true, boolCodec);
  const [includeTargetAsParent, setIncludeTargetAsParent] = useUrlState(
    "ladder",
    false,
    boolCodec,
  );
  const [commonPowerMin, setCommonPowerMin] = useUrlState(
    "bp",
    1000,
    intCodec(500, 1400),
  );

  const [useMine, setUseMine] = useUrlState("mine", false, boolCodec);
  const { ids: myPals } = useOwnedPals(dataset);

  const starters = useMemo(() => {
    const ids = [
      starterA,
      starterB,
      ...extraOwned,
      ...(useMine ? myPals : []),
    ].filter((id): id is number => id !== null);
    return [...new Set(ids)];
  }, [starterA, starterB, extraOwned, useMine, myPals]);

  const firstEgg =
    starterA !== null && starterB !== null
      ? dataset.pals[breedChild(dataset, starterA, starterB).childId]
      : null;

  const result = useMemo(() => {
    return planPathFromStarters(dataset, target, starters, {
      allowWildHelpers: allowWild,
      includeTargetAsParent,
      commonPowerMin,
    });
  }, [
    dataset,
    target,
    starters,
    allowWild,
    includeTargetAsParent,
    commonPowerMin,
  ]);

  const targetHasNoRecipe =
    target !== null &&
    parentsFor(dataset, target).every(([a, b]) => a === target && b === target);

  // When no path exists, find the highest wild threshold that does produce
  // one, so the error can offer a one-click fix instead of a vague hint.
  const suggestedPowerMin = useMemo(() => {
    if (result.status !== "unreachable" || !allowWild || targetHasNoRecipe) {
      return null;
    }
    for (let t = commonPowerMin - 50; t >= 500; t -= 50) {
      const attempt = planPathFromStarters(dataset, target, starters, {
        allowWildHelpers: true,
        includeTargetAsParent,
        commonPowerMin: t,
      });
      if (attempt.status === "ok") return t;
    }
    return null;
  }, [
    result.status,
    allowWild,
    targetHasNoRecipe,
    commonPowerMin,
    dataset,
    target,
    starters,
    includeTargetAsParent,
  ]);

  const [optionsOpen, setOptionsOpen] = useState(false);

  const plan = result.status === "ok" ? result.plan : null;
  const steps = useMemo(
    () => (plan ? flattenBreedSteps(plan.root) : []),
    [plan],
  );
  const gather = useMemo(
    () => (plan ? collectGatherList(plan.root) : []),
    [plan],
  );

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [stepPassives, setStepPassives] = useState<
    Record<string, StepPassiveState>
  >({});

  function toggleStepExpanded(key: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function updateStepState(key: string, patch: Partial<StepPassiveState>) {
    setStepPassives((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? EMPTY_STEP_STATE), ...patch },
    }));
  }

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Path planner</h2>
        <p>
          Leave the starters blank to search freely for any path. Set both
          Starter A and B and step 1 is forced to{" "}
          <strong>Starter A × Starter B → their child</strong>, then that child
          is used to reach your goal (no skipping them).
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
          {firstEgg && (
            <p className="first-egg">
              Those two make <PalChip pal={firstEgg} /> on the first breed.
            </p>
          )}
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

      <details
        className="path-extras"
        open={optionsOpen}
        onToggle={(e) => setOptionsOpen(e.currentTarget.open)}
      >
        <summary>More options</summary>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={useMine}
            disabled={myPals.length === 0 && !useMine}
            onChange={(e) => setUseMine(e.target.checked)}
          />
          Use my Pals list as stock ({myPals.length})
        </label>
        <OwnedPals dataset={dataset} />
        <PalMultiSelect
          dataset={dataset}
          values={extraOwned}
          onChange={setExtraOwned}
          label="Extra owned pals (this plan only)"
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={includeTargetAsParent}
            onChange={(e) => setIncludeTargetAsParent(e.target.checked)}
          />
          Include goal as a parent in the chain (ladder mode)
        </label>
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
        <p className="callout">Pick the Pal you want a breed tree for.</p>
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
              ) : suggestedPowerMin !== null ? (
                <>
                  <p>
                    Counting Pals with breeding power ≥ {suggestedPowerMin}{" "}
                    as catchable finds a path (currently ≥ {commonPowerMin}).
                  </p>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setCommonPowerMin(suggestedPowerMin);
                      setOptionsOpen(true);
                    }}
                  >
                    Use breeding power ≥ {suggestedPowerMin}
                  </button>
                </>
              ) : (
                <>
                  <p className="note">
                    Even the lowest wild threshold (breeding power ≥ 500)
                    doesn&apos;t reach it
                    {starters.length > 0
                      ? ". Try clearing the starters or adding more owned Pals."
                      : ". Try adding Pals you own under More options."}
                  </p>
                  {!optionsOpen && (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setOptionsOpen(true)}
                    >
                      Show more options
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {plan && (
        <div className="tree-wrap">
          <div className="tree-summary">
            {target !== null && (
              <PalArt pal={dataset.pals[target]} className="summary-art" />
            )}
            <div className="tree-summary-body">
              {target !== null && (
                <h3 className="result-name">
                  {dataset.pals[target].name}
                  <span className="dex">#{formatDex(dataset.pals[target])}</span>
                </h3>
              )}
              <p>
                <strong>{plan.steps}</strong> breed step
                {plan.steps === 1 ? "" : "s"}
                {" · "}
                {plan.ownedOnly
                  ? "using only your stock"
                  : "uses wild / catchable parents"}
              </p>
            </div>
            <CopyPlanButton
              text={() =>
                planToText(dataset, plan.targetId, plan.steps, gather, steps)
              }
            />
          </div>

          {gather.length > 0 && (
            <section className="recipe-block">
              <h3>1. Get these parents</h3>
              <ul className="gather-list">
                {gather.map((item) => (
                  <li key={`${item.kind}-${item.palId}`}>
                    <PalChip pal={dataset.pals[item.palId]} />
                    <span className={`source-tag source-${item.kind}`}>
                      {item.kind === "owned" ? "You have this" : "Catch / obtain"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {steps.length > 0 && (
            <section className="recipe-block">
              <h3>2. Breed in this order</h3>
              <ol className="step-list">
                {steps.map((s) => {
                  const isGoal = s.childId === plan.targetId;
                  const key = `${s.step}-${s.childId}-${s.parentAId}-${s.parentBId}`;
                  const expanded = expandedSteps.has(key);
                  const stepState = stepPassives[key] ?? EMPTY_STEP_STATE;
                  const { genderDependent, altChildId } = breedChild(
                    dataset,
                    s.parentAId,
                    s.parentBId,
                  );
                  return (
                    <li
                      key={key}
                      className={isGoal ? "is-goal" : ""}
                    >
                      <PalArt
                        pal={dataset.pals[s.childId]}
                        className="step-art"
                      />
                      <span className="step-num">Step {s.step}</span>
                      <div className="step-flow">
                        <PalChip pal={dataset.pals[s.parentAId]} />
                        <span className="op">×</span>
                        <PalChip pal={dataset.pals[s.parentBId]} />
                        <span className="op arrow">→</span>
                        <span className="step-result">
                          <PalChip pal={dataset.pals[s.childId]} />
                          {isGoal && <span className="goal-tag">Goal</span>}
                        </span>
                        <button
                          type="button"
                          className="ghost-btn plan-passives-btn"
                          onClick={() => toggleStepExpanded(key)}
                        >
                          {expanded ? "Hide passives" : "Plan passives"}
                        </button>
                      </div>
                      {expanded && (
                        <PassiveFunnelStep
                          dataset={dataset}
                          parentA={{
                            palId: s.parentAId,
                            entries: stepState.parentAEntries,
                            editable: true,
                            title: "Parent A",
                            onChange: (entries) =>
                              updateStepState(key, { parentAEntries: entries }),
                          }}
                          parentB={{
                            palId: s.parentBId,
                            entries: stepState.parentBEntries,
                            editable: true,
                            title: "Parent B",
                            onChange: (entries) =>
                              updateStepState(key, { parentBEntries: entries }),
                          }}
                          childId={s.childId}
                          genderDependent={genderDependent}
                          altChildId={altChildId}
                          cakeActive={stepState.cakeActive}
                          onCakeChange={(cakeActive) =>
                            updateStepState(key, { cakeActive })
                          }
                          isFinal
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <details className="tree-diagram">
            <summary>Show family diagram</summary>
            <p className="diagram-hint">
              Parents sit above the child. Bottom result is your goal.
            </p>
            <FamilyDiagram dataset={dataset} node={plan.root} />
          </details>
        </div>
      )}
    </section>
  );
}

function FamilyDiagram({
  dataset,
  node,
}: {
  dataset: Dataset;
  node: TreeNode;
}) {
  if (node.kind !== "breed" || !node.parentA || !node.parentB) {
    return (
      <div className={`leaf-card kind-${node.kind}`}>
        <PalChip pal={dataset.pals[node.palId]} />
        <span className={`source-tag source-${node.kind}`}>
          {node.kind === "owned" ? "Owned" : "Catch"}
        </span>
      </div>
    );
  }

  return (
    <div className="family-unit">
      <div className="family-parents">
        <FamilyDiagram dataset={dataset} node={node.parentA} />
        <span className="op">×</span>
        <FamilyDiagram dataset={dataset} node={node.parentB} />
      </div>
      <div className="family-join" aria-hidden>
        <span />
      </div>
      <div className="family-child">
        <PalChip pal={dataset.pals[node.palId]} />
      </div>
    </div>
  );
}

function planToText(
  dataset: Dataset,
  targetId: number,
  stepCount: number,
  gather: GatherItem[],
  steps: BreedStep[],
): string {
  const name = (id: number) => dataset.pals[id].name;
  const lines = [
    `Palforge plan: ${name(targetId)} (${stepCount} breed step${stepCount === 1 ? "" : "s"})`,
  ];
  if (gather.length > 0) {
    lines.push(
      "Get: " +
        gather
          .map((g) => `${name(g.palId)} (${g.kind === "owned" ? "have" : "catch"})`)
          .join(", "),
    );
  }
  for (const s of steps) {
    lines.push(
      `${s.step}. ${name(s.parentAId)} × ${name(s.parentBId)} → ${name(s.childId)}`,
    );
  }
  lines.push(window.location.href);
  return lines.join("\n");
}

// The async Clipboard API is blocked in some embedded browsers and older
// setups; fall back to the legacy copy command there.
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("Copy failed");
  }
}

function CopyPlanButton({ text }: { text: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <button
      type="button"
      className="ghost-btn copy-plan-btn"
      onClick={() =>
        copyText(text())
          .then(() => setState("copied"))
          .catch(() => setState("failed"))
      }
    >
      <span aria-live="polite">
        {state === "copied"
          ? "Copied!"
          : state === "failed"
            ? "Couldn’t copy"
            : "Copy plan"}
      </span>
    </button>
  );
}
