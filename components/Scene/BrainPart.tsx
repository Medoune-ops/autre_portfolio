"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BrainPartData } from "@/types";
import type { PartBuild } from "@/lib/brain";
import { scrollStore } from "@/lib/scrollStore";
import { PHASES, PIECE_SEGMENT } from "@/data/parts";

const vert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uCircuitMix; // global circuit emphasis
  uniform vec3 uAccent;
  uniform float uPulse;
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.2);
    // split: x < 0 organique, x > 0 circuits
    float side = smoothstep(-0.08, 0.08, vPos.x);
    // organique argenté
    float fold = 0.5 + 0.5*sin(vPos.y*10.0 + sin(vPos.z*6.0));
    vec3 organic = mix(vec3(0.78,0.82,0.88), vec3(0.95,0.97,1.0), fold);
    organic += vec3(0.25) * fres * 0.5;
    // circuits néon
    float grid = step(0.92, fract(vPos.y*18.0)) + step(0.92, fract(vPos.z*18.0));
    grid = clamp(grid, 0.0, 1.0);
    float dots = step(0.965, hash(floor(vPos*22.0)));
    float pulse = 0.7 + 0.3*sin(uTime*2.0 + vPos.y*6.0 + vPos.z*4.0);
    vec3 circuit = mix(vec3(0.02,0.08,0.14), uAccent, 0.35);
    circuit += uAccent * (grid*0.35 + dots*0.8) * (0.8 + 0.4*pulse);
    circuit += uAccent * fres * 0.5;
    vec3 col = mix(organic, circuit, side);
    // légère emphase circuits globale
    col = mix(col, col + uAccent * 0.08 * side, uCircuitMix);
    float alpha = 0.92;
    gl_FragColor = vec4(col, alpha);
  }
`;

function getExplosionProgress(p: number) {
  if (p <= PHASES.heroEnd) return 0;
  if (p >= PHASES.explodeEnd) {
    // reste explosé jusqu'à sortie
    if (p <= PHASES.piecesEnd) return 1;
    // reforme en P5
    const t = THREE.MathUtils.clamp((p - PHASES.connectEnd) / (PHASES.outroEnd - PHASES.connectEnd), 0, 1);
    return 1 - t * t * (3 - 2 * t);
  }
  const t = THREE.MathUtils.clamp((p - PHASES.heroEnd) / (PHASES.explodeEnd - PHASES.heroEnd), 0, 1);
  return t * t * (3 - 2 * t);
}

function getPieceFocus(p: number, id: string) {
  const seg = PIECE_SEGMENT.find((s) => s.id === id);
  if (!seg) return 0;
  if (p < seg.start || p > seg.end) return 0;
  const local = (p - seg.start) / (seg.end - seg.start);
  const inT = THREE.MathUtils.smoothstep(local, 0, 0.35);
  const outT = 1 - THREE.MathUtils.smoothstep(local, 0.7, 1);
  return inT * outT;
}

export function BrainPart({ build, data, index }: { build: PartBuild; data: BrainPartData; index: number }) {
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCircuitMix: { value: 0.4 },
      uAccent: { value: new THREE.Color(data.accent) },
      uPulse: { value: 0 },
    }),
    [data.accent]
  );

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const p = scrollStore.reduced ? scrollStore.targetProgress : scrollStore.progress;
    const exp = getExplosionProgress(p);
    const focus = getPieceFocus(p, data.id);
    const dir = new THREE.Vector3(...data.explodeDir).normalize();
    const targetPos = dir.multiplyScalar(data.explodeDist * exp);
    // léger décalage de phase pour mouvement ordonné
    const stagger = 1 - index * 0.03;
    group.current.position.lerp(targetPos.multiplyScalar(stagger), 1 - Math.pow(0.001, delta));

    // échelle/lumière locale quand focus
    const s = 1 + focus * 0.06;
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, s, 0.08));
    group.current.rotation.y += delta * 0.02 * (0.2 + focus);

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
      matRef.current.uniforms.uCircuitMix.value = 0.3 + focus * 0.7 + (p > PHASES.explodeEnd && p < PHASES.piecesEnd ? 0.2 : 0);
      matRef.current.uniforms.uPulse.value = focus;
    }
    if (lineRef.current) {
      const m = lineRef.current.material as THREE.LineBasicMaterial;
      m.opacity = 0.15 + focus * 0.6 + (p > PHASES.heroEnd ? 0.1 : 0);
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={build.geometry}>
        <shaderMaterial ref={matRef} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
      </mesh>
      <lineSegments ref={lineRef} geometry={build.circuits}>
        <lineBasicMaterial color={data.accent} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {/* points lumineux / "puce" centrale sur la moitié circuit */}
      <mesh position={[0.18, 0.05, 0.05]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={data.accent} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.22, 0.05, 0.05]}>
        <ringGeometry args={[0.06, 0.085, 24]} />
        <meshBasicMaterial color={data.accent} transparent opacity={0.5} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
