import { useEffect, useState } from "react";
import { combinePools, computeOverflow, type PassiveEntry } from "../lib/passives";
import type { Dataset } from "../lib/types";
import { PalPassiveCard } from "./PalPassiveCard";
import { PalChip } from "./PalSelect";

export type FunnelSlot = {
  palId: number;
  entries: PassiveEntry[];
  editable: boolean;
  title: string;
  onChange?: (entries: PassiveEntry[]) => void;
  cakeActive?: boolean;
  onCakeChange?: (cakeActive: boolean) => void;
};

type Props = {
  dataset: Dataset;
  parentA: FunnelSlot;
  parentB: FunnelSlot;
  childId: number;
  genderDependent: boolean;
  altChildId?: number;
  cakeActive: boolean;
  onCakeChange: (cakeActive: boolean) => void;
  onChildEntriesChange?: (entries: PassiveEntry[]) => void;
  isFinal: boolean;
};

export function PassiveFunnelStep({
  dataset,
  parentA,
  parentB,
  childId,
  genderDependent,
  altChildId,
  cakeActive,
  onCakeChange,
  onChildEntriesChange,
  isFinal,
}: Props) {
  const pool = combinePools(parentA.entries, parentB.entries);
  const overflow = computeOverflow(pool, cakeActive);
  const altChild = altChildId !== undefined ? dataset.pals[altChildId] : null;

  const [finalEntries, setFinalEntries] = useState(overflow.kept);
  useEffect(() => {
    setFinalEntries(overflow.kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, JSON.stringify(overflow.kept)]);

  function updateFinalEntries(entries: PassiveEntry[]) {
    setFinalEntries(entries);
    onChildEntriesChange?.(entries);
  }

  return (
    <div className="funnel-step">
      <div className="funnel-step-row">
        <SlotCard dataset={dataset} slot={parentA} />
        <span className="op">×</span>
        <SlotCard dataset={dataset} slot={parentB} />
        <span className="op arrow">→</span>
        {isFinal ? (
          <PalPassiveCard
            dataset={dataset}
            palId={childId}
            title="Result"
            entries={finalEntries}
            onChange={updateFinalEntries}
            cakeActive={cakeActive}
            onCakeChange={onCakeChange}
          />
        ) : (
          <ReadOnlyStrip
            dataset={dataset}
            palId={childId}
            title="Carries forward"
            entries={overflow.kept}
          />
        )}
      </div>

      {genderDependent && altChild && (
        <p className="note">
          Gender-dependent: could also produce <PalChip pal={altChild} />{" "}
          depending on parent gender.
        </p>
      )}

      {(overflow.overflow || overflow.wantedOverflow) && (
        <div className="callout warn">
          {overflow.wantedOverflow ? (
            <p>
              {overflow.wantedDropped.length} wanted passive
              {overflow.wantedDropped.length === 1 ? "" : "s"} won&apos;t fit
              even with a Special Cake (cap {overflow.cap}):{" "}
              {overflow.wantedDropped
                .map((e) => passiveName(dataset, e.internalName))
                .join(", ")}
              . Drop some "want" flags or split this across an extra
              generation.
            </p>
          ) : (
            <p>
              {overflow.dropped.length} non-wanted passive
              {overflow.dropped.length === 1 ? "" : "s"} won&apos;t make the
              cut (cap {overflow.cap}):{" "}
              {overflow.dropped
                .map((e) => passiveName(dataset, e.internalName))
                .join(", ")}
              {!cakeActive && " — a Special Cake would raise the cap to 6."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function passiveName(dataset: Dataset, internalName: string): string {
  return (
    dataset.passives.find((p) => p.internalName === internalName)?.name ??
    internalName
  );
}

function SlotCard({ dataset, slot }: { dataset: Dataset; slot: FunnelSlot }) {
  if (slot.editable && slot.onChange) {
    return (
      <PalPassiveCard
        dataset={dataset}
        palId={slot.palId}
        title={slot.title}
        entries={slot.entries}
        onChange={slot.onChange}
        cakeActive={slot.cakeActive ?? false}
        onCakeChange={slot.onCakeChange ?? (() => {})}
      />
    );
  }
  return (
    <ReadOnlyStrip
      dataset={dataset}
      palId={slot.palId}
      title={slot.title}
      entries={slot.entries}
    />
  );
}

function ReadOnlyStrip({
  dataset,
  palId,
  title,
  entries,
}: {
  dataset: Dataset;
  palId: number;
  title: string;
  entries: PassiveEntry[];
}) {
  return (
    <div className="passive-readonly-strip">
      <span className="field-label">{title}</span>
      <PalChip pal={dataset.pals[palId]} />
      <ul className="passive-chip-list">
        {entries.length === 0 && <li className="hint">No passives</li>}
        {entries.map((entry) => (
          <li
            key={entry.internalName}
            className={`passive-chip-dark ${entry.wanted ? "wanted" : ""}`}
          >
            <span className="name">
              {passiveName(dataset, entry.internalName)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
