"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Experience } from "./Experience";
import { scrollStore } from "@/lib/scrollStore";

export default function SceneCanvas() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0.15, 3.5], fov: 40, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ touchAction: "pan-y" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0f172a", 1);
        }}
      >
        <color attach="background" args={["#0f172a"]} />
        <fog attach="fog" args={["#0f172a", 6, 16]} />
        <Suspense fallback={null}>
          <Experience />
          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={scrollStore.reduced ? 0.4 : 0.9}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
