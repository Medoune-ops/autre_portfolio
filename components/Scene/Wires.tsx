"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BRAIN_PARTS, PHASES, PIECE_SEGMENT } from "@/data/parts";
import { makeWireCurve } from "@/lib/curves";
import { impulseFragment, impulseVertex } from "@/lib/shaders";
import { scrollStore } from "@/lib/scrollStore";

function getExplosionProgress(p: number) {
  if (p <= PHASES.heroEnd) return 0;
  if (p >= PHASES.explodeEnd) {
    if (p <= PHASES.piecesEnd) return 1;
    const t = THREE.MathUtils.clamp((p - PHASES.connectEnd) / (PHASES.outroEnd - PHASES.connectEnd), 0, 1);
    return 1 - t * t * (3 - 2 * t);
  }
  const t = THREE.MathUtils.clamp((p - PHASES.heroEnd) / (PHASES.explodeEnd - PHASES.heroEnd), 0, 1);
  return t * t * (3 - 2 * t);
}

export function Wires() {
  const group = useRef<THREE.Group>(null);

  // géométries de base des courbes (recalculées en frame via uniform progress/positions simplifiées)
  const items = useMemo(() => {
    return BRAIN_PARTS.map((part, i) => {
      const from = new THREE.Vector3(...part.wireAnchor);
      // cible "panneau" dans l'espace monde (côté droit/gauche alterné)
      const side = i % 2 === 0 ? 1 : -1;
      const to = new THREE.Vector3(side * 2.6, 0.2 + (i - 2.5) * 0.25, 1.2);
      const curve = makeWireCurve(from, to, 0.7, side);
      const geo = new THREE.TubeGeometry(curve, 64, 0.012, 8, false);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uSpeed: { value: 0.35 + i * 0.03 },
          uColor: { value: new THREE.Color(part.accent) },
          uOpacity: { value: 0.0 },
        },
        vertexShader: impulseVertex,
        fragmentShader: impulseFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return { id: part.id, geo, mat, part, side };
    });
  }, []);

  useFrame(({ clock }) => {
    const p = scrollStore.reduced ? scrollStore.targetProgress : scrollStore.progress;
    const exp = getExplosionProgress(p);
    items.forEach((it, i) => {
      const seg = PIECE_SEGMENT[i];
      // apparition du fil pendant la phase connexions et autour du focus de la pièce
      let vis = 0;
      if (p >= seg.start && p <= PHASES.connectEnd) {
        const inT = THREE.MathUtils.smoothstep(p, seg.start, seg.mid);
        const hold = p < PHASES.piecesEnd ? inT : 1;
        const outT = 1 - THREE.MathUtils.smoothstep(p, PHASES.connectEnd, PHASES.outroEnd);
        vis = hold * outT;
      } else if (p > PHASES.connectEnd) {
        vis = 1 - THREE.MathUtils.smoothstep(p, PHASES.connectEnd, PHASES.outroEnd);
      }
      // lier l'origine à la position explosée de la pièce (approx: déplacer le groupe/mesh)
      const dir = new THREE.Vector3(...it.part.explodeDir).normalize().multiplyScalar(it.part.explodeDist * exp * (1 - i * 0.03));
      // on applique une translation globale au mesh du fil pour suivre l'explosion de la pièce
      const mesh = group.current?.children[i] as THREE.Mesh | undefined;
      if (mesh) mesh.position.copy(dir);

      it.mat.uniforms.uTime.value = clock.elapsedTime;
      it.mat.uniforms.uProgress.value = THREE.MathUtils.clamp(vis, 0, 1);
      it.mat.uniforms.uOpacity.value = scrollStore.reduced ? (vis > 0.2 ? 0.5 : 0) : vis * 0.95;
    });
  });

  return (
    <group ref={group}>
      {items.map((it) => (
        <mesh key={it.id} geometry={it.geo} material={it.mat} frustumCulled={false} />
      ))}
    </group>
  );
}
