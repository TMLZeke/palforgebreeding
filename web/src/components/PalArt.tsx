import { useEffect, useState } from "react";
import type { Pal } from "../lib/types";

// Full artwork where we have it, falling back to the round game icon.
export function PalArt({ pal, className = "" }: { pal: Pal; className?: string }) {
  const [src, setSrc] = useState(`/art/${pal.internalName}.png`);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setSrc(`/art/${pal.internalName}.png`);
    setUsingFallback(false);
  }, [pal.internalName]);

  return (
    <div className={`pal-art-frame ${className}`}>
      <img
        className={usingFallback ? "pal-art is-fallback" : "pal-art"}
        src={src}
        alt={pal.name}
        onError={() => {
          if (!usingFallback) {
            setUsingFallback(true);
            setSrc(`/icons/${pal.internalName}.png`);
          }
        }}
      />
    </div>
  );
}
