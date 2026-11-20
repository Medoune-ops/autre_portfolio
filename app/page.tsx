"use client";

import { useState } from "react";
import { ScribbleIntro } from "@/components/ui/scribble-intro";
import SiteBackground from "@/components/ui/site-background";
import { PortfolioContent } from "@/components/sections/PortfolioContent";

export default function Page() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f1f5f9] text-[#0f172a]">
      <SiteBackground />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[#f1f5f9]/70"
      />
      <div className="relative z-10" aria-hidden={!introDone}>
        <PortfolioContent active={introDone} />
      </div>
      {!introDone && <ScribbleIntro onComplete={() => setIntroDone(true)} />}
    </div>
  );
}
