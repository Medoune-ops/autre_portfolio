"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SwarmCursor = dynamic(() => import("@/components/ui/SwarmCursor"), {
  ssr: false,
});

export function DesktopSwarmCursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setEnabled(media.matches && !reduced.matches);
    update();

    media.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 hidden h-screen w-screen overflow-hidden md:block">
      <SwarmCursor
        count={72}
        size={2.2}
        spread={75}
        swirl={0.5}
        clickEffect="burst"
        color="#2872a1"
        accentColor="#f59e0b"
        className="h-full w-full"
      />
    </div>
  );
}