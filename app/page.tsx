"use client";

import { useState } from "react";
import { ScribbleIntro } from "@/components/ui/scribble-intro";
import SiteBackground from "@/components/ui/site-background";
import SwarmCursor from "@/components/ui/SwarmCursor";
import { PortfolioContent } from "@/components/sections/PortfolioContent";

export default function Page() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f1f5f9] text-[#16232c]">
      <SiteBackground />
      <div className="relative z-10" aria-hidden={!introDone}>
        <PortfolioContent active={introDone} />
      </div>
      {!introDone && <ScribbleIntro onComplete={() => setIntroDone(true)} />}

      {/* Essaim de particules qui suit le curseur sur toute la page. */}
      <div className="pointer-events-none fixed inset-0 z-50 h-screen w-screen overflow-hidden">
        <SwarmCursor
          count={800}
          size={2.6}
          spread={90}
          swirl={0.6}
          clickEffect="burst"
          color="#2872a1"
          accentColor="#f59e0b"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
