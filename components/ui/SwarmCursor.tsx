"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SwarmCursorProps = {
  /** Nombre de particules qui suivent le pointeur. */
  count?: number;
  /** Rayon des particules, en pixels. */
  size?: number;
  /** Rayon de dispersion autour du pointeur, en pixels. */
  spread?: number;
  /** Force de rotation tourbillonnaire (0 = aucun, 1 = rapide). */
  swirl?: number;
  /** Effet au clic : explosion radial, onde, ou aucun. */
  clickEffect?: "burst" | "ripple" | "none";
  /** Couleur des particules. */
  color?: string;
  /** Couleur de quelques particules d'accent. */
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  speed: number;
  accent: boolean;
};

type Ripple = { x: number; y: number; life: number };

export default function SwarmCursor({
  count = 800,
  size = 1.1,
  spread = 90,
  swirl = 0.6,
  clickEffect = "burst",
  color = "#2872a1",
  accentColor = "#f59e0b",
  className,
  children,
}: SwarmCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pas de curseur swarm sur les écrans tactiles ni si l'animation est réduite.
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const mouse = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      active: false,
    };
    const onPointerMove = (event: PointerEvent) => {
      mouse.vx = event.clientX - mouse.x;
      mouse.vy = event.clientY - mouse.y;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    };
    const onPointerLeave = () => {
      mouse.active = false;
    };

    const ripples: Ripple[] = [];
    const onPointerDown = (event: PointerEvent) => {
      if (clickEffect === "none") return;
      const x = event.clientX;
      const y = event.clientY;

      if (clickEffect === "ripple") {
        ripples.push({ x, y, life: 1 });
        return;
      }

      // Burst : impulsion radiale appliquée à toutes les particules.
      for (const particle of particles) {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const distance = Math.max(30, Math.hypot(dx, dy));
        const impulse = Math.min(22, 900 / distance);
        particle.vx += (dx / distance) * impulse;
        particle.vy += (dy / distance) * impulse;
      }
    };

    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      // Les particules sont dense au centre et réparties en bras de spirale :
      // c'est ce qui donne la silhouette d'un tourbillon, pas d'un anneau.
      const radius = Math.pow(Math.random(), 1.8) * spread;
      const angle = Math.random() * Math.PI * 2 + radius * 0.045;
      return {
        x: mouse.x + Math.cos(angle) * radius * 0.5,
        y: mouse.y + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        angle,
        radius,
        speed: 0.7 + Math.random() * 0.7,
        accent: i % 17 === 0,
      };
    });

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (mouse.active) {
        // Vitesse du pointeur lissée : elle pilote la longueur de la traînée.
        mouse.speed += (Math.hypot(mouse.vx, mouse.vy) - mouse.speed) * 0.12;
        mouse.vx *= 0.88;
        mouse.vy *= 0.88;
        const tail = Math.min(1, mouse.speed / 28);

        for (const particle of particles) {
          const t = particle.radius / spread;

          // Rotation différentielle : le cœur tourne plus vite que les bords,
          // ce qui étire les bras en spirale.
          particle.angle += swirl * 0.02 * (1.7 - t) * particle.speed;

          // Entonnoir : étroit en haut, large en bas.
          const yNorm = (Math.sin(particle.angle) + 1) / 2;
          const funnel = 0.18 + yNorm * 1.25;
          const wobble = 1 + 0.08 * Math.sin(frame * 0.02 + particle.angle * 2);
          const rx = particle.radius * funnel * wobble;
          const ry = particle.radius * 1.35;

          // Les particules externes traînent derrière le mouvement du curseur.
          const lag = t * tail * 1.4;
          const targetX = mouse.x + Math.cos(particle.angle) * rx - mouse.vx * lag;
          const targetY = mouse.y + Math.sin(particle.angle) * ry - mouse.vy * lag;

          particle.vx += (targetX - particle.x) * 0.03;
          particle.vy += (targetY - particle.y) * 0.03;
          particle.vx *= 0.9;
          particle.vy *= 0.9;
          particle.x += particle.vx;
          particle.y += particle.vy;

          const speed = Math.hypot(particle.vx, particle.vy);
          const alpha = Math.max(0.22, Math.min(0.8, 0.3 + speed * 0.03));
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.accent ? accentColor : color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.accent ? size * 1.15 : size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.life -= 0.025;
        if (ripple.life <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = ripple.life * 0.5;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, (1 - ripple.life) * spread * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame += 1;
      frameId = requestAnimationFrame(render);
    };

    let frameId = requestAnimationFrame(render);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [count, size, spread, swirl, clickEffect, color, accentColor]);

  return (
    <div className={cn("relative", className)}>
      {children}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true" />
    </div>
  );
}
