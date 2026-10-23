import { useOwnedPals } from "../lib/owned";
import type { Dataset } from "../lib/types";
import { PalMultiSelect } from "./PalSelect";

// Collapsible editor for the shared "Pals I own" list. Each tool that uses
// the list shows one, so it can be filled in from wherever you are.
export function OwnedPals({ dataset }: { dataset: Dataset }) {
  const { ids, setOwned } = useOwnedPals(dataset);

  return (
    <details className="owned-pals">
      <summary>
        My Pals <span className="owned-count">{ids.length}</span>
      </summary>
      <PalMultiSelect
        dataset={dataset}
        values={ids}
        onChange={setOwned}
        label="Pals I own"
      />
      <p className="tip-footnote">
        Saved in this browser only, and shared by Find parents, Path planner
        and Base pals.
      </p>
    </details>
  );
}
