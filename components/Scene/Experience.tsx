"use client";

import { useEffect, useMemo, useState } from "react";
import { CameraRig } from "./CameraRig";
import { Brain } from "./Brain";
import { Wires } from "./Wires";
import { Particles } from "./Particles";
import { buildProceduralBrain, type PartBuild } from "@/lib/brain";

export function Experience() {
  const [parts, setParts] = useState<PartBuild[] | null>(null);

  useEffect(() => {
    // Tentative de chargement d'un GLB segmenté (public/models/brain.glb)
    // si présent. Sinon fallback procédural documenté.
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/models/brain.glb", { method: "HEAD" });
        if (res.ok) {
          // POINT D'INTÉGRATION GLB:
          // 1) importer useGLTF from '@react-three/drei'
          // 2) charger /models/brain.glb et parcourir scene.children/meshes
          // 3) mapper les meshes nommées -> ids BrainPartData:
          //    frontal, parietal, temporal, occipital, cerebellum, brainstem
          // 4) construire PartBuild[] (geometry + basePosition + circuits) pour chaque mesh
          //    (générer circuits via makeCircuits sur la bounding box si besoin)
          // Fallback procédural conservé pour fonctionner sans asset.
          // Voir lib/brain.ts et public/models/README.md
        }
      } catch {
        // ignore
      }
      if (!cancelled) setParts(buildProceduralBrain());
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const builds = useMemo(() => parts, [parts]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#f1f5f9" />
      <pointLight position={[-3, 1, 2]} intensity={1.2} color="#94a3b8" />
      <pointLight position={[2, -2, -2]} intensity={0.8} color="#64748b" />

      <CameraRig />
      <Particles />
      {builds && <Brain builds={builds} />}
      {builds && <Wires />}

      {/* brume légère */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.15} />
      </mesh>
    </>
  );
}
