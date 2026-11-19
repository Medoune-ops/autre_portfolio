"use client";

import { useEffect, useRef, useState } from "react";
import { ScribbleClock } from "@/components/ui/scribble-clock";

const STEP_MS = 1000;
const HOLD_MS = 200;
const FADE_MS = 700;

export function ScribbleIntro({
  onComplete,
  from = 5,
}: {
  onComplete: () => void;
  from?: number;
}) {
  const [count, setCount] = useState(from);
  const [fading, setFading] = useState(false);
  const completedRef = useRef(false);
  const bodyOverflowRef = useRef("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    bodyOverflowRef.current = previous;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflowRef.current;
    };
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = from + 1;

    for (let i = 0; i < steps; i++) {
      timers.push(setTimeout(() => setCount(from - i), i * STEP_MS));
    }

    const afterCountdown = steps * STEP_MS + HOLD_MS;
    if (reduced) {
      timers.push(setTimeout(finish, afterCountdown));
    } else {
      timers.push(setTimeout(() => setFading(true), afterCountdown));
      timers.push(setTimeout(finish, afterCountdown + FADE_MS));
    }

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [from]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Décompte ${count}`}
      className="fixed inset-0 z-[100] overflow-hidden bg-[#0f0f0f]"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="h-full w-full">
        <ScribbleClock
          mode="value"
          value={count}
          scribble="tight"
          color="#ededed"
          background="#0f0f0f"
          caption="initialisation"
          size={0.55}
          grid={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center gap-2 text-xs tracking-[0.2em] uppercase text-white/40">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" aria-hidden="true" />
        Chargement de l&apos;expérience
      </p>
    </div>
  );
}
