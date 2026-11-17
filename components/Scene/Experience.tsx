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
          // Un loader GLTF complet peut être branché ici (useGLTF) en mappant
          // les meshes nommées (frontal, parietal, temporal, occipital, cerebellum, brainstem).
          // Fallback procédural conservé pour garantir le fonctionnement sans asset.
          // -> voir lib/brain.ts et public/models/README.md
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
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#eaf6ff" />
      <pointLight position={[-3, 1, 2]} intensity={1.2} color="#00E5FF" />
      <pointLight position={[2, -2, -2]} intensity={0.8} color="#1E90FF" />

      <CameraRig />
      <Particles />
      {builds && <Brain builds={builds} />}
      {builds && <Wires />}

      {/* brume légère */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#0A0F1C" transparent opacity={0.15} />
      </mesh>
    </>
  );
}
