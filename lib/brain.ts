import * as THREE from "three";
import type { PartId } from "@/types";

// Bruit value 3D simple déterministe (fallback procédural)
function hash3(x: number, y: number, z: number) {
  let h = Math.imul(Math.floor(x), 374761393) + Math.imul(Math.floor(y), 668265263) + Math.imul(Math.floor(z), 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise3(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const a = hash3(ix, iy, iz) * (1 - ux) + hash3(ix + 1, iy, iz) * ux;
  const b = hash3(ix, iy + 1, iz) * (1 - ux) + hash3(ix + 1, iy + 1, iz) * ux;
  const c = hash3(ix, iy, iz + 1) * (1 - ux) + hash3(ix + 1, iy, iz + 1) * ux;
  const d = hash3(ix, iy + 1, iz + 1) * (1 - ux) + hash3(ix + 1, iy + 1, iz + 1) * ux;
  return (a * (1 - uy) + b * uy) * (1 - uz) + (c * (1 - uy) + d * uy) * uz;
}
export function fbm3(x: number, y: number, z: number, oct = 4) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { v += a * vnoise3(x * f, y * f, z * f); n += a; f *= 2.02; a *= 0.5; }
  return v / (n || 1);
}

export type PartBuild = {
  id: PartId;
  geometry: THREE.BufferGeometry;
  basePosition: THREE.Vector3;
  circuits: THREE.BufferGeometry; // lignes de circuit (positions)
};

function deform(geo: THREE.BufferGeometry, scale: THREE.Vector3, offset: THREE.Vector3, fold = 1, seed = 0) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiply(scale).add(offset);
    n.copy(v).normalize();
    const nx = v.x + seed * 1.3, ny = v.y - seed * 0.7, nz = v.z + seed * 0.9;
    const base = fbm3(nx * 1.4, ny * 1.4, nz * 1.4, 4);
    const rid = 1 - Math.abs(2 * fbm3(nx * 2.6 + 3.1, ny * 2.4, nz * 2.6 - 1.7, 4) - 1);
    const disp = (base - 0.5) * 0.18 * fold + (rid - 0.5) * 0.22 * fold;
    v.addScaledVector(n, disp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function makeCircuits(bounds: THREE.Vector3, count: number, seed: number): THREE.BufferGeometry {
  const pts: number[] = [];
  let s = Math.floor(seed * 10000) || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < count; i++) {
    let x = (rnd() - 0.5) * bounds.x * 1.6;
    let y = (rnd() - 0.5) * bounds.y * 1.6;
    let z = (rnd() - 0.5) * bounds.z * 1.6;
    for (let k = 0; k < 3; k++) {
      const nx = x + (Math.round((rnd() - 0.5) * 2) * 0.12);
      const ny = y + (Math.round((rnd() - 0.5) * 2) * 0.12);
      const nz = z + (rnd() - 0.5) * 0.06;
      pts.push(x, y, z, nx, ny, nz);
      x = nx; y = ny; z = nz;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

export function buildProceduralBrain(): PartBuild[] {
  const parts: PartBuild[] = [];

  // frontal: avant haut
  {
    const g = new THREE.SphereGeometry(0.55, 48, 36);
    deform(g, new THREE.Vector3(0.95, 0.85, 1.05), new THREE.Vector3(0, 0.25, 0.35), 1.1, 0.1);
    parts.push({ id: "frontal", geometry: g, basePosition: new THREE.Vector3(0, 0, 0), circuits: makeCircuits(new THREE.Vector3(0.6,0.5,0.6), 28, 1) });
  }
  // parietal: dessus milieu
  {
    const g = new THREE.SphereGeometry(0.52, 48, 36);
    deform(g, new THREE.Vector3(1.0, 0.7, 0.95), new THREE.Vector3(0, 0.45, -0.05), 1.0, 0.2);
    parts.push({ id: "parietal", geometry: g, basePosition: new THREE.Vector3(0, 0, 0), circuits: makeCircuits(new THREE.Vector3(0.6,0.4,0.5), 22, 2) });
  }
  // temporal: côté (fusionne visuel gauche/droite simplifié)
  {
    const g = new THREE.SphereGeometry(0.48, 44, 32);
    deform(g, new THREE.Vector3(1.15, 0.65, 1.0), new THREE.Vector3(0.45, -0.05, 0.05), 0.95, 0.3);
    parts.push({ id: "temporal", geometry: g, basePosition: new THREE.Vector3(0, 0, 0), circuits: makeCircuits(new THREE.Vector3(0.6,0.4,0.5), 24, 3) });
  }
  // occipital: arrière
  {
    const g = new THREE.SphereGeometry(0.5, 44, 32);
    deform(g, new THREE.Vector3(0.95, 0.8, 0.9), new THREE.Vector3(0, 0.2, -0.5), 1.05, 0.4);
    parts.push({ id: "occipital", geometry: g, basePosition: new THREE.Vector3(0, 0, 0), circuits: makeCircuits(new THREE.Vector3(0.55,0.45,0.5), 24, 4) });
  }
  // cerebellum
  {
    const g = new THREE.SphereGeometry(0.38, 40, 28);
    deform(g, new THREE.Vector3(1.15, 0.6, 0.85), new THREE.Vector3(0, -0.45, -0.4), 1.25, 0.5);
    parts.push({ id: "cerebellum", geometry: g, basePosition: new THREE.Vector3(0, 0, 0), circuits: makeCircuits(new THREE.Vector3(0.5,0.3,0.4), 26, 5) });
  }
  // brainstem
  {
    const g = new THREE.CylinderGeometry(0.12, 0.18, 0.55, 24, 12, false);
    deform(g, new THREE.Vector3(1, 1, 1), new THREE.Vector3(0, -0.85, -0.05), 0.4, 0.6);
    parts.push({ id: "brainstem", geometry: g, basePosition: new THREE.Vector3(0, 0, 0), circuits: makeCircuits(new THREE.Vector3(0.2,0.5,0.2), 14, 6) });
  }

  return parts;
}
