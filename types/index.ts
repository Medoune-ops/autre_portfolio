import type { Vector3Tuple } from "three";

export type PartId =
  | "frontal"
  | "parietal"
  | "temporal"
  | "occipital"
  | "cerebellum"
  | "brainstem";

export type BrainPartData = {
  id: PartId;
  title: string;
  subtitle: string;
  text: string;
  color: string;
  accent: string;
  // direction d'explosion (normalisée) et distance
  explodeDir: Vector3Tuple;
  explodeDist: number;
  // position caméra quand on "entre" dans la pièce
  cameraPos: Vector3Tuple;
  cameraLookAt: Vector3Tuple;
  // point d'ancrage du fil (local au cerveau)
  wireAnchor: Vector3Tuple;
  // ambiance
  lightIntensity: number;
  circuitDensity: number;
};

export type ScrollState = {
  progress: number; // 0..1 global
  reduced: boolean;
};
