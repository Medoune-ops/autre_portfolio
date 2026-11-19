import type { ReactElement } from "react";

export type ShapeWavesShapes = "mixed" | "squares" | "circles" | "triangles";

export interface ShapeWavesProps {
  /** Texte utilisé comme masque. Vide = champ complet. */
  text?: string;
  fontFamily?: string;
  fontWeight?: number;
  textSize?: number;
  shapes?: ShapeWavesShapes;
  cellSize?: number;
  dotSize?: number;
  color?: string;
  hoverColor?: string;
  backgroundColor?: string;
  speed?: number;
  scale?: number;
  contrast?: number;
  brightness?: number;
  flow?: number;
  direction?: number;
  fade?: number;
  interactive?: boolean;
  splashRadius?: number;
  splashStrength?: number;
  glow?: number;
  intro?: boolean;
  introDuration?: number;
  introKey?: number;
  paused?: boolean;
  onError?: (error: Error) => void;
  className?: string;
}

export default function ShapeWaves(props: ShapeWavesProps): ReactElement;
