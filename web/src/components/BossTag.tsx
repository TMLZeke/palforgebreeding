import type { Pal } from "../lib/types";

export function BossTag({ pal }: { pal: Pal }) {
  if (pal.bossStatus === "boss-only") {
    return (
      <span className="boss-tag boss-only" title="No regular wild spawn — only obtainable from its Boss encounter">
        Boss
      </span>
    );
  }
  if (pal.bossStatus === "boss-and-wild") {
    return (
      <span className="boss-tag boss-dual" title="Also has a Boss encounter, in addition to a regular wild spawn">
        Also Boss
      </span>
    );
  }
  return null;
}
