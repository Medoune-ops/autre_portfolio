"use client";

import SiteBackground from "@/components/ui/site-background";
import SwarmCursor from "@/components/ui/SwarmCursor";
import { PortfolioContent } from "@/components/sections/PortfolioContent";

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f1f5f9] text-[#16232c]">
      <SiteBackground />
      <div className="relative z-10">
        <PortfolioContent active={true} />
      </div>

      {/* Essaim de particules ultra-fluide sur desktop uniquement (100 particules au lieu de 800 pour 60-120 FPS constant) */}
      <div className="pointer-events-none fixed inset-0 z-50 hidden h-screen w-screen overflow-hidden md:block">
        <SwarmCursor
          count={100}
          size={2.2}
          spread={75}
          swirl={0.5}
          clickEffect="burst"
          color="#2872a1"
          accentColor="#f59e0b"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
