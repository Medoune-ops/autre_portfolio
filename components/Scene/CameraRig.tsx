"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollStore } from "@/lib/scrollStore";
import { BRAIN_PARTS, PIECE_SEGMENT, PHASES } from "@/data/parts";

function smoothstep(e0: number, e1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export function CameraRig() {
  const { camera } = useThree();
  const target = new THREE.Vector3(0, 0, 0);
  const desiredPos = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();

  useFrame((_, delta) => {
    const p = scrollStore.reduced ? scrollStore.targetProgress : scrollStore.progress;

    // HERO — cerveau très gros, occupant ~70–80% de l'écran
    if (p <= PHASES.heroEnd) {
      desiredPos.set(0, 0.12, 3.25);
      desiredLook.set(0, 0.03, 0);
    }
    // EXPLOSION
    else if (p <= PHASES.explodeEnd) {
      const t = smoothstep(PHASES.heroEnd, PHASES.explodeEnd, p);
      desiredPos.lerpVectors(new THREE.Vector3(0, 0.12, 3.25), new THREE.Vector3(0.25, 0.25, 5.2), t);
      desiredLook.set(0, 0.03, 0);
    }
    // PIECES (entrée dans chaque pièce)
    else if (p <= PHASES.piecesEnd) {
      let idx = 0;
      for (let i = 0; i < PIECE_SEGMENT.length; i++) {
        if (p >= PIECE_SEGMENT[i].start) idx = i;
      }
      const seg = PIECE_SEGMENT[idx];
      const part = BRAIN_PARTS[idx];
      const local = smoothstep(seg.start, seg.end, p);
      // arrivée douce -> tenue -> sortie douce
      const inT = smoothstep(0, 0.35, local);
      const outT = smoothstep(0.7, 1, local);
      const blend = inT * (1 - outT);
      const basePos = new THREE.Vector3(0.2, 0.2, 5.0);
      const partPos = new THREE.Vector3(...part.cameraPos);
      const partLook = new THREE.Vector3(...part.cameraLookAt);
      // légère dérive entre pièces
      const next = BRAIN_PARTS[Math.min(idx + 1, BRAIN_PARTS.length - 1)];
      const nextPos = new THREE.Vector3(...next.cameraPos);
      const nextLook = new THREE.Vector3(...next.cameraLookAt);
      const drift = smoothstep(0.55, 1.0, local) * 0.25;
      desiredPos.copy(basePos).lerp(partPos, blend).lerp(nextPos, outT * 0.15);
      desiredLook.set(0, 0.05, 0).lerp(partLook, blend).lerp(nextLook, drift);
    }
    // CONNEXIONS + SORTIE
    else {
      const t = smoothstep(PHASES.piecesEnd, PHASES.outroEnd, p);
      desiredPos.lerpVectors(new THREE.Vector3(0.4, 0.2, 2.6), new THREE.Vector3(0, 0.15, 4.4), t);
      desiredLook.lerpVectors(new THREE.Vector3(0, 0.0, 0), new THREE.Vector3(0, 0.05, 0), t);
    }

    const k = 1 - Math.pow(0.001, delta);
    camera.position.lerp(desiredPos, k);
    target.lerp(desiredLook, k);
    camera.lookAt(target);
  });

  return null;
}
