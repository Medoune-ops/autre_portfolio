"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStore } from "@/lib/scrollStore";
import { BRAIN_PARTS, PIECE_SEGMENT, PHASES } from "@/data/parts";

gsap.registerPlugin(ScrollTrigger);

export function ScrollController() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollStore.reduced = reduced;

    // progression globale -> store (scrub)
    const st = ScrollTrigger.create({
      trigger: "#scroll-root",
      start: "top top",
      end: "bottom bottom",
      scrub: reduced ? 0 : 0.6,
      onUpdate: (self) => {
        scrollStore.targetProgress = self.progress;
        if (reduced) scrollStore.progress = self.progress;
      },
    });

    if (reduced) {
      // états statiques lisibles
      gsap.set("#hud-hero", { opacity: 1 });
      gsap.set("#scroll-hint", { opacity: 0 });
      gsap.set("#final-cta", { opacity: 1, pointerEvents: "auto" });
      BRAIN_PARTS.forEach((p) => gsap.set(`#panel-${p.id}`, { opacity: 0 }));
      return () => st.kill();
    }

    // HUD hero + hint
    gsap.timeline({
      scrollTrigger: { trigger: "#scroll-root", start: "top top", end: `${PHASES.heroEnd * 100}% top`, scrub: true },
    })
      .to("#hud-hero", { opacity: 0, y: -30, ease: "none" }, 0.3)
      .to("#scroll-hint", { opacity: 0, ease: "none" }, 0.2);

    // Panneaux par pièce (P3)
    PIECE_SEGMENT.forEach((seg) => {
      const el = `#panel-${seg.id}`;
      const mid = (seg.start + seg.end) / 2;
      const fadeIn = seg.start + (seg.end - seg.start) * 0.12;
      const fadeOut = seg.end - (seg.end - seg.start) * 0.12;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll-root",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
      // valeurs normalisées sur le scrub global
      tl.to(el, { opacity: 0, y: 12, duration: seg.start }, 0);
      tl.to(el, { opacity: 1, y: 0, duration: Math.max(0.001, mid - fadeIn), ease: "none" }, fadeIn);
      tl.to(el, { opacity: 1, y: 0, duration: Math.max(0.001, fadeOut - mid), ease: "none" }, mid);
      tl.to(el, { opacity: 0, y: -12, duration: Math.max(0.001, seg.end - fadeOut), ease: "none" }, fadeOut);
      tl.to(el, { opacity: 0, duration: Math.max(0.001, 1 - seg.end) }, seg.end);
    });

    // CTA finale (P5)
    gsap.timeline({
      scrollTrigger: { trigger: "#scroll-root", start: `${PHASES.connectEnd * 100}% top`, end: "bottom bottom", scrub: true },
    })
      .fromTo("#final-cta", { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: "none" });

    // boucle de lissage du progress pour la 3D
    let raf = 0;
    const tick = () => {
      const t = scrollStore.targetProgress;
      scrollStore.smooth += (t - scrollStore.smooth) * 0.12;
      scrollStore.progress = scrollStore.smooth;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onRefresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onRefresh);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onRefresh);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
