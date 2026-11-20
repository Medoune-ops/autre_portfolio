"use client";

import ShapeWaves from "./ShapeWaves";
import "./site-background.css";

/**
 * Fond animé de tout le site : le champ de formes ShapeWaves (WebGPU),
 * avec les props de l'exemple React Bits fourni.
 */
export default function SiteBackground() {
  return (
    <div className="site-bg" aria-hidden="true">
      <div className="site-bg__waves">
        <ShapeWaves
          text=""
          fontFamily='Geist, "Geist Sans", system-ui, sans-serif'
          fontWeight={500}
          textSize={0.6}
          shapes="mixed"
          cellSize={10}
          dotSize={0.75}
          color="#94a3b8"
          hoverColor="#0891b2"
          backgroundColor="#f1f5f9"
          speed={1}
          scale={1}
          contrast={0.9}
          brightness={0.72}
          flow={0}
          direction={0}
          fade={0.22}
          interactive={true}
          splashRadius={40}
          splashStrength={0.35}
          glow={0.18}
          intro={true}
          introDuration={1.6}
          paused={false}
        />
      </div>
      <div className="site-bg__veil" />
    </div>
  );
}
