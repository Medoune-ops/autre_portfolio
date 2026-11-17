"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BrainPart } from "./BrainPart";
import type { PartBuild } from "@/lib/brain";
import { BRAIN_PARTS } from "@/data/parts";
import { scrollStore } from "@/lib/scrollStore";
import { PHASES } from "@/data/parts";

export function Brain({ builds }: { builds: PartBuild[] }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const map = useMemo(() => {
    const m = new Map<string, PartBuild>();
    builds.forEach((b) => m.set(b.id, b));
    return m;
  }, [builds]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = scrollStore.reduced ? scrollStore.targetProgress : scrollStore.progress;
    // rotation lente continue
    group.current.rotation.y += delta * 0.08;
    // mouvement souris léger en HERO
    if (!scrollStore.reduced && p < PHASES.heroEnd + 0.05) {
      mouse.current.x += (state.pointer.x * 0.25 - mouse.current.x) * 0.05;
      mouse.current.y += (state.pointer.y * 0.15 - mouse.current.y) * 0.05;
      group.current.rotation.x = mouse.current.y;
      group.current.rotation.z = -mouse.current.x * 0.2;
    } else {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.05);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.05);
    }
    // échelle globale: gros cerveau
    const s = p < PHASES.heroEnd ? 1.45 : 1.3;
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, s, 0.04));
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {BRAIN_PARTS.map((part, i) => {
        const build = map.get(part.id);
        if (!build) return null;
        return <BrainPart key={part.id} build={build} data={part} index={i} />;
      })}
    </group>
  );
}
