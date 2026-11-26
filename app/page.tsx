import SiteBackground from "@/components/ui/site-background";
import { PortfolioContent } from "@/components/sections/PortfolioContent";
import { DesktopSwarmCursor } from "@/components/ui/desktop-swarm-cursor";

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[#f1f5f9] text-[#16232c]">
      <SiteBackground />
      <div className="relative z-10">
        <PortfolioContent active={true} />
      </div>

      {/* Effet décoratif desktop chargé uniquement sur écran large et sans reduced-motion. */}
      <DesktopSwarmCursor />
    </div>
  );
}
