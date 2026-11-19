"use client";

import { useState } from "react";
import { ScribbleIntro } from "@/components/ui/scribble-intro";
import { PortfolioContent } from "@/components/sections/PortfolioContent";

export default function Page() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F1C] text-[#EAF6FF]">
      <div aria-hidden={!introDone}>
        <PortfolioContent active={introDone} />
      </div>
      {!introDone && <ScribbleIntro onComplete={() => setIntroDone(true)} />}
    </div>
  );
}
