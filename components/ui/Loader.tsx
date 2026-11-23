"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { scrollStore } from "@/lib/scrollStore";

export function Loader() {
  const { progress, active } = useProgress();
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Drei ne suit que les chargements via ses loaders/suspense.
    // Notre cerveau procédural ne déclenche pas forcément de chargement suivi,
    // donc on débloque aussi quand il n'y a aucune activité (progress 0) ou après un délai max.
    const readyByProgress = !active && progress >= 100;
    const readyByIdle = !active && progress === 0;

    if (readyByProgress || readyByIdle) {
      const t = setTimeout(
        () => {
          setDone(true);
          scrollStore.ready = true;
        },
        readyByProgress ? 350 : 600
      );
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  useEffect(() => {
    const fallback = setTimeout(() => {
      setDone(true);
      scrollStore.ready = true;
    }, 2500);
    return () => clearTimeout(fallback);
  }, []);

  if (done) return null;

  const display = active ? Math.max(5, progress) : 100;

  return (
    <div className="loader" role="status" aria-live="polite">
      <div style={{ textAlign: "center" }}>
        <div style={{ letterSpacing: "0.18em", fontSize: 12, color: "#2872a1", textTransform: "uppercase" }}>
          Initialisation
        </div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 600 }}>Cerveau immersif</div>
        <div className="loader__bar" aria-hidden>
          <span style={{ width: `${display}%`, transition: "width 0.2s ease" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "rgba(22,35,44,0.6)" }}>{Math.round(display)}%</div>
      </div>
    </div>
  );
}
