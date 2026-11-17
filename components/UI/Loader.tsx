"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { scrollStore } from "@/lib/scrollStore";

export function Loader() {
  const { progress, active } = useProgress();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active && progress >= 100) {
      const t = setTimeout(() => {
        setDone(true);
        scrollStore.ready = true;
      }, 350);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  if (done) return null;

  return (
    <div className="loader" role="status" aria-live="polite">
      <div style={{ textAlign: "center" }}>
        <div style={{ letterSpacing: "0.18em", fontSize: 12, color: "#00E5FF", textTransform: "uppercase" }}>
          Initialisation
        </div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 600 }}>Cerveau immersif</div>
        <div className="loader__bar" aria-hidden>
          <span style={{ width: `${Math.max(5, progress)}%`, transition: "width 0.2s ease" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "rgba(234,246,255,0.6)" }}>{Math.round(progress)}%</div>
      </div>
    </div>
  );
}
