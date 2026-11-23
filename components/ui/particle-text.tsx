"use client";

import { useEffect, useState } from "react";
import { InteractiveParticles } from "./interactive-particles";

function renderTextImage(
  text: string,
  options: { font: string; color: string; paddingX: number; paddingY: number }
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.font = options.font;
  const lines = text.split("\n");
  const metrics = lines.map((line) => ctx.measureText(line));
  const widths = metrics.map((m) => m.width);
  const lineHeight =
    Math.max(...metrics.map((m) => (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0))) || 1;
  const width = Math.ceil(Math.max(...widths, 1) + options.paddingX * 2);
  const height = Math.ceil(lineHeight * lines.length + options.paddingY * 2);

  canvas.width = width;
  canvas.height = height;
  const ctx2 = canvas.getContext("2d");
  if (!ctx2) return "";
  ctx2.clearRect(0, 0, width, height);
  ctx2.font = options.font;
  ctx2.fillStyle = options.color;
  ctx2.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx2.fillText(line, options.paddingX, options.paddingY + i * lineHeight);
  });
  return canvas.toDataURL("image/png");
}

export function ParticleText({
  text,
  className,
  font = "700 96px system-ui, -apple-system, Segoe UI, sans-serif",
  color = "#16232c",
  particleColor,
  maxDimension = 360,
  size = 1.2,
  randomness = 1.6,
  depth = 2.5,
}: {
  text: string;
  className?: string;
  font?: string;
  color?: string;
  particleColor?: string;
  maxDimension?: number;
  size?: number;
  randomness?: number;
  depth?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // Masque blanc : les pixels clairs sont échantillonnés, la teinte vient de `particleColor`.
    setSrc(renderTextImage(text, { font, color: "#ffffff", paddingX: 24, paddingY: 24 }));
  }, [text, font]);

  if (!src) return <div className={className} aria-label={text} />;

  return (
    <span className={className} style={{ display: "block" }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="block h-full w-full">
        <InteractiveParticles
          src={src}
          allowUpload={false}
          background="transparent"
          color={particleColor ?? color}
          maxDimension={maxDimension}
          size={size}
          randomness={randomness}
          depth={depth}
        />
      </span>
    </span>
  );
}
