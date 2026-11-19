"use client";

import { useState } from "react";
import { ScribbleIntro } from "@/components/ui/scribble-intro";
import SiteBackground from "@/components/ui/site-background";
import { PortfolioContent } from "@/components/sections/PortfolioContent";

export default function Page() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0F1C] text-[#EAF6FF]">
      <SiteBackground />
      <div className="relative z-10" aria-hidden={!introDone}>
        <PortfolioContent active={introDone} />
      </div>
      {!introDone && <ScribbleIntro onComplete={() => setIntroDone(true)} />}
    </div>
  );
}
