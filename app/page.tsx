"use client";

import dynamic from "next/dynamic";
import { LenisProvider } from "@/components/Scroll/LenisProvider";
import { ScrollController } from "@/components/Scroll/ScrollController";
import { Panels } from "@/components/UI/Panels";
import { ScrollHint } from "@/components/UI/ScrollHint";
import { FinalCTA } from "@/components/UI/FinalCTA";
import { Loader } from "@/components/UI/Loader";

const SceneCanvas = dynamic(() => import("@/components/Scene/SceneCanvas"), { ssr: false });

export default function Page() {
  return (
    <LenisProvider>
      <Loader />
      <SceneCanvas />
      <div className="hud" aria-hidden="false">
        <div className="hud__hero" id="hud-hero">
          <h1 className="hud__title">À l'intérieur de l'esprit</h1>
          <p className="hud__sub">Faites défiler pour explorer le cerveau, pièce par pièce.</p>
        </div>
        <ScrollHint />
      </div>
      <Panels />
      <FinalCTA />
      {/* Hauteur de scroll : 1 viewport par phase/étape */}
      <ScrollController />
      <main id="scroll-root" aria-label="Expérience immersive">
        <section style={{ height: "120vh" }} />
        <section style={{ height: "160vh" }} />
        <section style={{ height: "520vh" }} />
        <section style={{ height: "120vh" }} />
        <section style={{ height: "140vh" }} />
      </main>
    </LenisProvider>
  );
}
