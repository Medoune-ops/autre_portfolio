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
      <SwarmCursor
        count={800}
        size={2.6}
        spread={90}
        swirl={0.6}
        clickEffect="burst"
      />
    </div>
  );
}
