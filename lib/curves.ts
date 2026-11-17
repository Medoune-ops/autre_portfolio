import * as THREE from "three";

export function makeWireCurve(from: THREE.Vector3, to: THREE.Vector3, lift = 0.6, side = 1): THREE.CatmullRomCurve3 {
  const mid = from.clone().lerp(to, 0.5);
  const dir = to.clone().sub(from).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  let perp = new THREE.Vector3().crossVectors(dir, up);
  if (perp.lengthSq() < 0.001) perp = new THREE.Vector3(1, 0, 0);
  perp.normalize();
  mid.addScaledVector(up, lift);
  mid.addScaledVector(perp, 0.25 * side);
  const p1 = from.clone().lerp(mid, 0.45);
  const p2 = mid.clone().lerp(to, 0.55);
  return new THREE.CatmullRomCurve3([from, p1, mid, p2, to], false, "catmullrom", 0.5);
}
