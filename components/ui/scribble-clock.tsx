"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Scribble Clock by Louis Studios.
// 200 more hand-made React components at https://studios.lou15.com/?ref=21st-code

import * as React from "react";

/*
 * Scribble Clock
 * One large digit at a time on a near-black field. Each digit starts as a thin outline of a bold
 * grotesk numeral, then a single wandering hairline grows out of that outline: a soft thread of
 * round loops that hugs the figure, densest right at the ink and thinning outward, crossing itself
 * freely, while counters fill with the same thread at a smaller loop size. The line never
 * enters the numeral, so the figure reads as a clean dark shape inside a loopy scribble.
 */

export interface ScribbleClockProps {
  /** "seconds" draws the last digit of the current second, like a ticking clock. "value" draws the digits of `value`. */
  mode?: "seconds" | "value";
  /** Digits to draw in "value" mode, for example 7, "42" or "2026". Characters other than 0-9 are ignored. */
  value?: string | number;
  /** How far the line wanders from the numeral: "tight", "loose", or a number (1 is tight, 2 is loose). */
  scribble?: "tight" | "loose" | number;
  /** Line colour. The grid and the caption are drawn from it at low opacity. */
  color?: string;
  /** Background colour of the field. */
  background?: string;
  /** Line weight in CSS pixels at a 640 px tall component. It scales gently with size. */
  stroke?: number;
  /** Font stack used to build the numeral outline. A bold grotesk looks right. */
  font?: string;
  /** Font weight of the numeral outline. */
  weight?: number | string;
  /** Numeral cap height as a fraction of the component's shorter side. */
  size?: number;
  /** Show the faint centre crosshair behind the digit. */
  grid?: boolean;
  /** Small mono caption in the bottom left corner. true shows the mode and scribble setting, a string shows your own text, false hides it. */
  caption?: boolean | string;
  /** Seed for the scribble. Each digit always draws the same tangle for a given seed. */
  seed?: number;
  /** Seconds the hand-off takes when a digit changes (scribble collapses, digit swaps, scribble regrows). */
  handoff?: number;
  /** Drive the clock yourself, in seconds. In "seconds" mode the digit shown is floor(time) % 10. Leave unset for the live clock. */
  time?: number;
  /** Click, tap, Enter or Space redraws the current digits with a fresh tangle. */
  replayOnClick?: boolean;
  /** Accessible description of the component. */
  ariaLabel?: string;
  /** Extra class name on the root element. */
  className?: string;
  /** Extra inline styles on the root element. */
  style?: React.CSSProperties;
}

/* ---------------------------------------------------------------- geometry */

type Glyph = {
  n: number;
  loop: Int16Array; // contour id per sample (-1 on bridges)
  cv: Float32Array; // signed curvature, positive where concave
  loops: number;
  hole: Uint8Array; // per contour id: 1 for a counter
  area: Float32Array; // per contour id: enclosed area, cap units squared
  px: Float32Array; // base path, H units, origin at bbox centre x and cap middle y
  py: Float32Array;
  nx: Float32Array; // smoothed outward normal
  ny: Float32Array;
  tx: Float32Array; // smoothed tangent
  ty: Float32Array;
  s: Float32Array; // arc length along the path, H units
  w: Float32Array; // displacement weight (0 on the bridges into counters)
  sdf: Float32Array; // signed distance in mask pixels, positive outside
  gw: number;
  gh: number;
  ox: number; // mask pixel of the origin
  oy: number;
  adv: number; // advance width, H units
  half: number; // half the ink width, H units
};

const MH = 300; // mask cap height in pixels
const NSM = 0.12; // smoothing of the outline frame, cap heights
const DS = 1 / 520; // path sample step, H units
const glyphCache = new Map<string, Glyph | null>();

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  return null;
}

// 1D squared distance transform (Felzenszwalb and Huttenlocher)
function edt1(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

function edt(feature: Uint8Array, w: number, h: number): Float64Array {
  const INF = 1e20;
  const out = new Float64Array(w * h);
  const m = Math.max(w, h);
  const f = new Float64Array(m), d = new Float64Array(m), z = new Float64Array(m + 1);
  const v = new Int32Array(m);
  for (let i = 0; i < w * h; i++) out[i] = feature[i] ? 0 : INF;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = out[y * w + x];
    edt1(f, h, d, v, z);
    for (let y = 0; y < h; y++) out[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = out[y * w + x];
    edt1(f, w, d, v, z);
    for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x]);
  }
  return out;
}

// marching squares on the alpha mask, returns closed loops in mask pixel coordinates
function contours(a: Float32Array, w: number, h: number, thr: number): number[][] {
  const pts = new Map<number, [number, number]>();
  const adj = new Map<number, number[]>();
  const edgePt = (id: number, x0: number, y0: number, x1: number, y1: number, v0: number, v1: number) => {
    if (!pts.has(id)) {
      const t = (thr - v0) / (v1 - v0 || 1e-9);
      pts.set(id, [x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5]);
    }
  };
  const link = (e0: number, e1: number) => {
    let l = adj.get(e0);
    if (!l) adj.set(e0, (l = []));
    l.push(e1);
    l = adj.get(e1);
    if (!l) adj.set(e1, (l = []));
    l.push(e0);
  };
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const c = [a[y * w + x], a[y * w + x + 1], a[(y + 1) * w + x + 1], a[(y + 1) * w + x]];
      const ins = c.map((q) => q >= thr);
      if (ins[0] === ins[1] && ins[1] === ins[2] && ins[2] === ins[3]) continue;
      // edges: 0 top, 1 right, 2 bottom, 3 left
      const ids = [(y * w + x) * 2, (y * w + x + 1) * 2 + 1, ((y + 1) * w + x) * 2, (y * w + x) * 2 + 1];
      const ends: [number, number, number, number, number, number][] = [
        [x, y, x + 1, y, c[0], c[1]],
        [x + 1, y, x + 1, y + 1, c[1], c[2]],
        [x, y + 1, x + 1, y + 1, c[3], c[2]],
        [x, y, x, y + 1, c[0], c[3]],
      ];
      const cross: number[] = [];
      for (let e = 0; e < 4; e++) {
        if (ins[e] !== ins[(e + 1) % 4]) {
          const q = ends[e];
          edgePt(ids[e], q[0], q[1], q[2], q[3], q[4], q[5]);
          cross.push(e);
        }
      }
      if (cross.length === 2) link(ids[cross[0]], ids[cross[1]]);
      else if (cross.length === 4) {
        const centre = (c[0] + c[1] + c[2] + c[3]) / 4 >= thr;
        // corner k sits between edge k-1 and edge k; cut off the corners on the minority side
        for (let k = 0; k < 4; k++) if (ins[k] !== centre) link(ids[(k + 3) % 4], ids[k]);
      }
    }
  }
  const seen = new Set<number>();
  const loops: number[][] = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    let prev = -1, cur = start;
    for (let guard = 0; guard < 1e6; guard++) {
      seen.add(cur);
      const p = pts.get(cur)!;
      loop.push(p[0], p[1]);
      const nb = adj.get(cur)!;
      const nxt = nb[0] !== prev ? nb[0] : nb[1];
      if (nxt === undefined || nxt === start) break;
      prev = cur;
      cur = nxt;
      if (seen.has(cur)) break;
    }
    if (loop.length >= 12) loops.push(loop);
  }
  return loops;
}

function loopLength(l: number[]) {
  let L = 0;
  const n = l.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    L += Math.hypot(l[j * 2] - l[i * 2], l[j * 2 + 1] - l[i * 2 + 1]);
  }
  return L;
}

function resampleLoop(l: number[], step: number): number[] {
  const n = l.length / 2;
  const L = loopLength(l);
  const m = Math.max(8, Math.round(L / step));
  const st = L / m;
  const out: number[] = [];
  let i = 0, acc = 0;
  let seg = Math.hypot(l[2] - l[0], l[3] - l[1]);
  for (let k = 0; k < m; k++) {
    const target = k * st;
    while (acc + seg < target && i < n) {
      acc += seg;
      i++;
      const a = i % n, b = (i + 1) % n;
      seg = Math.hypot(l[b * 2] - l[a * 2], l[b * 2 + 1] - l[a * 2 + 1]);
    }
    const a = i % n, b = (i + 1) % n;
    const t = seg > 0 ? (target - acc) / seg : 0;
    out.push(l[a * 2] + (l[b * 2] - l[a * 2]) * t, l[a * 2 + 1] + (l[b * 2 + 1] - l[a * 2 + 1]) * t);
  }
  return out;
}

// cyclic box blur, repeated: a cheap gaussian along the loop
function blurLoop(l: number[], r: number, passes: number): number[] {
  const n = l.length / 2;
  let src = l.slice();
  if (r < 1) return src;
  for (let p = 0; p < passes; p++) {
    const dst = new Array(src.length);
    let sx = 0, sy = 0;
    for (let k = -r; k <= r; k++) {
      const q = ((k % n) + n) % n;
      sx += src[q * 2];
      sy += src[q * 2 + 1];
    }
    const inv = 1 / (2 * r + 1);
    for (let i = 0; i < n; i++) {
      dst[i * 2] = sx * inv;
      dst[i * 2 + 1] = sy * inv;
      const add = (i + r + 1) % n, sub = (((i - r) % n) + n) % n;
      sx += src[add * 2] - src[sub * 2];
      sy += src[add * 2 + 1] - src[sub * 2 + 1];
    }
    src = dst;
  }
  return src;
}

function pointInLoop(x: number, y: number, l: number[]) {
  let inside = false;
  const n = l.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = l[i * 2], yi = l[i * 2 + 1], xj = l[j * 2], yj = l[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function buildGlyph(ch: string, font: string, weight: number | string): Glyph | null {
  const key = `${weight}|${font}|${ch}`;
  if (glyphCache.has(key)) return glyphCache.get(key)!;
  const cv = makeCanvas(16, 16);
  const g = cv && (cv.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null);
  if (!cv || !g) return null;
  const F = 200;
  g.font = `${weight} ${F}px ${font}`;
  const capM = g.measureText("1");
  const cap = capM.actualBoundingBoxAscent > 1 ? capM.actualBoundingBoxAscent : F * 0.714;
  const fs = (F * MH) / cap;
  const fontCss = `${weight} ${fs}px ${font}`;
  g.font = fontCss;
  const m = g.measureText(ch);
  const L = m.actualBoundingBoxLeft || 0, R = m.actualBoundingBoxRight || fs * 0.55;
  const A = m.actualBoundingBoxAscent || MH, D = m.actualBoundingBoxDescent || 0;
  const pad = Math.round(MH * 0.3);
  const W = Math.ceil(L + R) + pad * 2, Hh = Math.ceil(A + D) + pad * 2;
  cv.width = W;
  cv.height = Hh;
  g.font = fontCss;
  g.fillStyle = "#ffffff"; // ls:keep
  g.textBaseline = "alphabetic";
  g.fillText(ch, pad + L, pad + A);
  const img = g.getImageData(0, 0, W, Hh).data;
  const alpha = new Float32Array(W * Hh);
  const inside = new Uint8Array(W * Hh), outside = new Uint8Array(W * Hh);
  for (let i = 0; i < W * Hh; i++) {
    alpha[i] = img[i * 4 + 3] / 255;
    inside[i] = alpha[i] >= 0.5 ? 1 : 0;
    outside[i] = 1 - inside[i];
  }
  // signed distance, positive outside, softened so the clamp edge is smooth
  const dIn = edt(inside, W, Hh), dOut = edt(outside, W, Hh);
  let sdf = new Float32Array(W * Hh);
  for (let i = 0; i < W * Hh; i++) {
    // sub-pixel correction from coverage near the edge
    const base = inside[i] ? -(dOut[i] - 0.5) : dIn[i] - 0.5;
    sdf[i] = Math.abs(base) < 1.2 ? 0.5 - alpha[i] : base;
  }
  for (let pass = 0; pass < 2; pass++) {
    const o = new Float32Array(W * Hh);
    for (let y = 0; y < Hh; y++)
      for (let x = 0; x < W; x++) {
        let s = 0, c = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= Hh) continue;
            s += sdf[yy * W + xx];
            c++;
          }
        o[y * W + x] = s / c;
      }
    sdf = o;
  }

  const ox = pad + (L + R) / 2;
  const oy = pad + A - MH / 2;
  const step = DS * MH;
  let loops = contours(alpha, W, Hh, 0.5).filter((l) => loopLength(l) > MH * 0.08);
  if (!loops.length) {
    glyphCache.set(key, null);
    return null;
  }
  loops = loops.map((l) => blurLoop(resampleLoop(l, step), 1, 2));
  // classify outer loops and holes
  const depth = loops.map((l, i) => loops.reduce((d, o, j) => (j !== i && pointInLoop(l[0], l[1], o) ? d + 1 : d), 0));
  const outers = loops.map((l, i) => i).filter((i) => depth[i] % 2 === 0);
  const holesOf = new Map<number, number[]>();
  loops.forEach((l, i) => {
    if (depth[i] % 2 === 0) return;
    let best = -1, bestLen = Infinity;
    for (const o of outers) {
      if (pointInLoop(l[0], l[1], loops[o]) && loopLength(loops[o]) < bestLen) {
        best = o;
        bestLen = loopLength(loops[o]);
      }
    }
    if (best >= 0) (holesOf.get(best) || holesOf.set(best, []).get(best)!).push(i);
  });

  // normals per loop: tangent of a strongly smoothed copy, pointed away from the ink
  const smoothR = Math.max(2, Math.round((NSM * MH) / step));
  const frames = loops.map((l) => {
    const n = l.length / 2;
    const sm = blurLoop(l, smoothR, 3);
    const nx = new Float32Array(n), ny = new Float32Array(n), tx = new Float32Array(n), ty = new Float32Array(n);
    let vote = 0;
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n, b = (i + 1) % n;
      let dx = sm[b * 2] - sm[a * 2], dy = sm[b * 2 + 1] - sm[a * 2 + 1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      tx[i] = dx;
      ty[i] = dy;
      nx[i] = dy;
      ny[i] = -dx;
      const qx = Math.round(l[i * 2] + nx[i] * 2.5), qy = Math.round(l[i * 2 + 1] + ny[i] * 2.5);
      if (qx >= 0 && qy >= 0 && qx < W && qy < Hh) vote += inside[qy * W + qx] ? -1 : 1;
    }
    if (vote < 0)
      for (let i = 0; i < n; i++) {
        nx[i] = -nx[i];
        ny[i] = -ny[i];
      }
    // signed curvature of the smoothed outline, per cap height: positive where it is concave
    const cv = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n, b = (i + 1) % n;
      cv[i] = (((tx[b] - tx[a]) * nx[i] + (ty[b] - ty[a]) * ny[i]) / (2 * step)) * MH;
    }
    return { nx, ny, tx, ty, cv };
  });

  const P: number[] = [], N: number[] = [], T: number[] = [], Wt: number[] = [], LP: number[] = [];
  let lid = 0;
  const CV: number[] = [];
  let curCv = 0;
  const push = (x: number, y: number, nx: number, ny: number, tx: number, ty: number, w: number) => {
    CV.push(w > 0 ? curCv : 0);
    LP.push(w > 0 ? lid : -1);
    P.push((x - ox) / MH, (y - oy) / MH);
    N.push(nx, ny);
    T.push(tx, ty);
    Wt.push(w);
  };
  const gap = 0.006 * MH;
  let loopCount = -1;
  const HOLE: number[] = [], AREA: number[] = [];
  const areaOf = (l: number[]) => {
    let A2 = 0;
    const n = l.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) A2 += l[j * 2] * l[i * 2 + 1] - l[i * 2] * l[j * 2 + 1];
    return Math.abs(A2) / 2 / (MH * MH);
  };
  for (const o of outers) {
    const outerId = ++loopCount;
    HOLE[outerId] = 0;
    AREA[outerId] = areaOf(loops[o]);
    const l = loops[o], f = frames[o];
    const n = l.length / 2;
    // start at the top of the outer contour
    let start = 0;
    for (let i = 1; i < n; i++) if (l[i * 2 + 1] < l[start * 2 + 1]) start = i;
    const bridges = new Map<number, { hole: number; j: number }[]>();
    for (const hi of holesOf.get(o) || []) {
      const h = loops[hi];
      let bi = 0, bj = 0, bd = Infinity;
      for (let i = 0; i < n; i += 2)
        for (let j = 0; j < h.length / 2; j += 2) {
          const d = (l[i * 2] - h[j * 2]) ** 2 + (l[i * 2 + 1] - h[j * 2 + 1]) ** 2;
          if (d < bd) {
            bd = d;
            bi = i;
            bj = j;
          }
        }
      (bridges.get(bi) || bridges.set(bi, []).get(bi)!).push({ hole: hi, j: bj });
    }
    for (let k = 0; k <= n; k++) {
      const i = (start + k) % n;
      lid = outerId;
      curCv = f.cv[i];
      push(l[i * 2], l[i * 2 + 1], f.nx[i], f.ny[i], f.tx[i], f.ty[i], 1);
      const bl = k < n ? bridges.get(i) : undefined;
      if (!bl) continue;
      for (const b of bl) {
        const h = loops[b.hole], hf = frames[b.hole], hn = h.length / 2;
        const ax = l[i * 2], ay = l[i * 2 + 1], bx = h[b.j * 2], by = h[b.j * 2 + 1];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const ux = (bx - ax) / len, uy = (by - ay) / len;
        const sx = -uy * gap * 0.5, sy = ux * gap * 0.5;
        const steps = Math.max(2, Math.round(len / step));
        for (let q = 1; q < steps; q++) {
          const t = q / steps;
          push(ax + (bx - ax) * t + sx, ay + (by - ay) * t + sy, -uy, ux, ux, uy, 0);
        }
        lid = ++loopCount;
        HOLE[lid] = 1;
        AREA[lid] = areaOf(h);
        for (let q = 0; q <= hn; q++) {
          const j = (b.j + q) % hn;
          curCv = hf.cv[j];
          push(h[j * 2], h[j * 2 + 1], hf.nx[j], hf.ny[j], hf.tx[j], hf.ty[j], 1);
        }
        for (let q = 1; q < steps; q++) {
          const t = q / steps;
          push(bx + (ax - bx) * t - sx, by + (ay - by) * t - sy, uy, -ux, -ux, -uy, 0);
        }
        lid = outerId;
        curCv = f.cv[i];
        push(l[i * 2], l[i * 2 + 1], f.nx[i], f.ny[i], f.tx[i], f.ty[i], 1);
      }
    }
  }
  const n = P.length / 2;
  const s = new Float32Array(n);
  for (let i = 1; i < n; i++) s[i] = s[i - 1] + Math.hypot(P[i * 2] - P[i * 2 - 2], P[i * 2 + 1] - P[i * 2 - 1]);
  // ease the displacement in and out around the bridges so the line never jumps
  const w = new Float32Array(Wt);
  const ramp = 0.035;
  const wr = new Float32Array(n);
  for (let i = 0; i < n; i++) wr[i] = w[i];
  let last = -1e9;
  for (let i = 0; i < n; i++) {
    if (w[i] === 0) last = s[i];
    wr[i] = Math.min(wr[i], Math.min(1, (s[i] - last) / ramp));
  }
  last = 1e9;
  for (let i = n - 1; i >= 0; i--) {
    if (w[i] === 0) last = s[i];
    wr[i] = Math.min(wr[i], Math.min(1, (last - s[i]) / ramp));
  }
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, wr[i]);
    w[i] = v * v * (3 - 2 * v);
  }
  const px = new Float32Array(n), py = new Float32Array(n);
  const nx = new Float32Array(n), ny = new Float32Array(n), tx = new Float32Array(n), ty = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    px[i] = P[i * 2];
    py[i] = P[i * 2 + 1];
    nx[i] = N[i * 2];
    ny[i] = N[i * 2 + 1];
    tx[i] = T[i * 2];
    ty[i] = T[i * 2 + 1];
  }
  const glyph: Glyph = {
    n, px, py, loop: Int16Array.from(LP), loops: loopCount + 1, hole: Uint8Array.from(HOLE), area: Float32Array.from(AREA), cv: Float32Array.from(CV), nx, ny, tx, ty, s, w, sdf, gw: W, gh: Hh, ox, oy,
    adv: m.width / MH,
    half: (L + R) / 2 / MH,
  };
  glyphCache.set(key, glyph);
  return glyph;
}

function sampleSdf(g: Glyph, x: number, y: number): number {
  // x, y in H units; returns H units, positive outside
  let gx = x * MH + g.ox - 0.5, gy = y * MH + g.oy - 0.5;
  let extra = 0;
  if (gx < 0 || gy < 0 || gx >= g.gw - 1.001 || gy >= g.gh - 1.001) {
    // beyond the mask: continue the field outward from its border
    const cx = Math.min(g.gw - 1.001, Math.max(0, gx)), cy = Math.min(g.gh - 1.001, Math.max(0, gy));
    extra = Math.hypot(gx - cx, gy - cy);
    gx = cx;
    gy = cy;
  }
  const x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0;
  const i = y0 * g.gw + x0, d = g.sdf;
  const a = d[i] + (d[i + 1] - d[i]) * fx;
  const b = d[i + g.gw] + (d[i + g.gw + 1] - d[i + g.gw]) * fx;
  return (a + (b - a) * fy + extra) / MH;
}

/* ---------------------------------------------------------------- noise */

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

type Field = { m: number; sg: Float32Array; du: Float32Array; dv: Float32Array };
const fieldCache = new Map<string, Field>();
const freeCache = new WeakMap<Glyph, Float32Array>();
const WEIGHT_VAR = 0.22; // how much the line weight drifts along the line
const FINE = 0.25; // how much finer the pen gets as the scribble loosens
function weightNoise(seed: number) {
  const n = noise2(seed >>> 0);
  return (x: number) => n(x, 0.5);
}

// smooth 1D value noise on demand (Catmull-Rom through random knots)
function noise1(rnd: () => number, lam: number) {
  const knots: number[] = [];
  return (x: number) => {
    const u = x / lam;
    const j = Math.floor(u), t = u - j;
    while (knots.length < j + 4) knots.push(rnd() * 2 - 1);
    const p0 = knots[j], p1 = knots[j + 1], p2 = knots[j + 2], p3 = knots[j + 3];
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
}

/*
 * The scribble is one wandering pen: constant speed, curvature from smooth noise, softly steered
 * to stay inside a band that slides along the outline. Offsets are stored in the outline's own
 * frame (tangent du, normal dv) against a guide position sg, so the drawing can grow from the
 * bare outline by scaling the offsets.
 */
// smooth 2D value noise
function noise2(seed: number) {
  const h = (x: number, y: number) => {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (((n ^ (n >>> 16)) >>> 0) / 4294967296) * 2 - 1;
  };
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// pen tuning, in cap-height units (measured on the reference at 512 px cap height)
const TUNE = {
  step: 0.004, // pen step
  lo: 0.004, // closest the line comes to the ink
  r: 0.07, rExp: 0.8, rVar: 0.3, lamR: 0.6, // loop radius, its growth with the amount, spread, noise scale (in loops)
  burst: 0.65, burstK: 0.5, lamB: 4, // bursts of small loops: threshold, radius factor, noise scale (in loops)
  flip: 0.8, // reversals of the turning direction: noise scale (in loops), smaller flips more often
  turnVar: 0.45, lamT: 0.35,
  asp: 0.5, aspVar: 0.45, aspMin: 0.3, lamA: 1.2, spin: 1.5, // loops as ellipses: mean aspect, its wander, the thinnest, noise scale (in loops), how far the orientation turns // wobble in the turning rate (uneven, kidney shaped loops) and its scale (in loops)
  slide: 1.6, lamS: 0.9, // the centre slides back and forth along the outline: amount (in radii), scale (in loops)
  reach: 0.26, reachExp: 1.15, reachVar: 0.35, lamV: 0.35, vSkew: 1.0, vSkewExp: 0.8, lamQ: 0.6, // band: reach, growth, variation, its scale (cap), pull toward the ink, offset noise scale (in loops)
  relax: 8, // how quickly the loop centre follows its guide
  wander: 0.6, lamW: 0.7, // the centre also wanders about its guide: amount (in radii), scale (in loops)
  rMin: 0.02, // smallest loop worth drawing: in tight corners the centre backs away instead
  rNear: 0.03, rSlope: 0.6, // loop radius allowed at the ink, and how it grows with the centre's distance from it
  taper: 0.05, // ease in and out at the ends of a stretch
  eR: 0.028, eExp: 0.55, eSpread: 0.8, eDens: 0.7, eDensExp: 0.55, // edge pass: loop radius, its growth, how far it strays from the ink (in radii), pace relative to the outer pass, its growth
  oAsp: 0.5, oIn: 0.8, // outer pass: mean loop aspect, closest approach to the ink (in radii)
  cR: 0.02, cRExp: 0.3, cGap: 1.3, cDens: 1.6, cDensExp: 0, // counters: loop radius, its growth, row spacing of the sweep (in radii), pace relative to the outer pass, its growth
  cover: 8200, holeK: 0.06, lenK: -0.18, // cells of 1/256 cap the line should cover (about the same for every numeral, a little less per counter, whose dense fill reads brighter, and for a long outline)
  ink: 36, inkExp: 1.35, // first guess at the line length per numeral (cap heights), and how ink grows with the amount
};

/*
 * The scribble is one continuous pen thread of round loops. The pen circles a centre that drifts
 * along the outline (u along it, v out from the ink): the radius wanders with smooth noise, now and
 * then drops into a burst of small loops, and the turning direction reverses smoothly from time to
 * time, so the thread makes S bends and crosses itself freely. The centre runs along the offset
 * contour of the numeral: a first dense pass of small loops whose inner side kisses the ink all the
 * way round, bays and notches included, then a wider, sparser pass out across the band, so the
 * numeral stays a crisp dark cut-out. Counters are swept row by row with a fine thread that fills
 * them edge to edge. The band is adjusted until the
 * line covers about the same share of the field for every numeral. Points are stored against the
 * outline (position u along it, offsets du and dv in its own frame), so the drawing grows out of
 * the bare outline by scaling the offsets.
 */
function getField(g: Glyph, key: string, seed: number, amt: number): Field {
  const T = TUNE;
  const k = key + "|" + seed + "|" + amt.toFixed(3);
  let f = fieldCache.get(k);
  if (f) return f;
  const a = Math.max(0.05, amt);
  const step = T.step;
  // room along the normal before another part of the ink comes nearer than the outline it starts from
  let free = freeCache.get(g);
  if (!free) {
    free = new Float32Array(g.n);
    for (let i = 0; i < g.n; i++) {
      let t = 0.006;
      for (; t < 1.2; t += 0.006) if (sampleSdf(g, g.px[i] + g.nx[i] * t, g.py[i] + g.ny[i] * t) < 0.82 * t - 0.012) break;
      free[i] = t;
    }
    freeCache.set(g, free);
  }
  const fr = free;
  const idxAt = (u: number) => {
    let lo2 = 0, hi2 = g.n - 1;
    while (lo2 < hi2) {
      const mid = (lo2 + hi2 + 1) >> 1;
      if (g.s[mid] <= u) lo2 = mid;
      else hi2 = mid - 1;
    }
    return lo2;
  };
  // the outline frame at arc length u
  const G = { x: 0, y: 0, nx: 0, ny: 0, free: 0, cv: 0 };
  const frameAt = (u: number) => {
    const i = idxAt(u), j = Math.min(g.n - 1, i + 1);
    const sl = g.s[j] - g.s[i], t = sl > 0 ? Math.min(1, Math.max(0, (u - g.s[i]) / sl)) : 0;
    G.x = g.px[i] + (g.px[j] - g.px[i]) * t;
    G.y = g.py[i] + (g.py[j] - g.py[i]) * t;
    const nx = g.nx[i] + (g.nx[j] - g.nx[i]) * t, ny = g.ny[i] + (g.ny[j] - g.ny[i]) * t, nl = Math.hypot(nx, ny) || 1;
    G.nx = nx / nl;
    G.ny = ny / nl;
    G.free = Math.min(fr[i], fr[j]);
    G.cv = g.cv[i] + (g.cv[j] - g.cv[i]) * t;
  };
  // the pieces of the walk: stretches of the outline (outer, bridge, counter)
  const pieces: { i: number; j: number; kind: number }[] = [];
  for (let i = 0; i < g.n - 1; ) {
    const li = g.loop[i];
    const full = g.w[i] > 0.999 && li >= 0;
    let jx = i;
    while (jx < g.n - 1 && (g.w[jx + 1] > 0.999 && g.loop[jx + 1] >= 0) === full && (!full || g.loop[jx + 1] === li)) jx++;
    pieces.push({ i, j: jx, kind: !full ? 0 : g.hole[li] ? 2 : 1 });
    i = jx + 1;
  }
  let outerLen = 0, holes = 0;
  for (const p of pieces) {
    if (p.kind === 1) outerLen += g.s[p.j] - g.s[p.i];
    if (p.kind === 2) holes++;
  }
  outerLen = Math.max(0.5, outerLen);
  const SG: number[] = [], DU: number[] = [], DV: number[] = [], BT: number[] = [];
  const put = (sg: number, du: number, dv: number, band: number) => {
    BT.push(band);
    SG.push(sg);
    DU.push(du);
    DV.push(dv);
  };
  let lastJ = -1;
  // store an x, y point against its nearest outline sample among i0..i1
  const putXY = (x: number, y: number, i0: number, i1: number, band: number) => {
    let best = i0, bd = Infinity;
    for (let i = i0; i <= i1; i += 8) {
      const dd = (g.px[i] - x) ** 2 + (g.py[i] - y) ** 2;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    for (let i = Math.max(i0, best - 8); i <= Math.min(i1, best + 8); i++) {
      const dd = (g.px[i] - x) ** 2 + (g.py[i] - y) ** 2;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    // stay with the previous point's stretch of outline unless the new one is clearly nearer, so a
    // thread near the middle of a notch does not flick between its two walls as it grows
    if (lastJ >= i0 && lastJ <= i1 && Math.abs(g.s[best] - g.s[lastJ]) > 0.04) {
      let lb = lastJ, ld = Infinity;
      for (let i = Math.max(i0, lastJ - 16); i <= Math.min(i1, lastJ + 16); i++) {
        const dd = (g.px[i] - x) ** 2 + (g.py[i] - y) ** 2;
        if (dd < ld) {
          ld = dd;
          lb = i;
        }
      }
      if (Math.sqrt(ld) < Math.sqrt(bd) * 1.3 + 0.004) best = lb;
    }
    const j = (lastJ = best);
    put(g.s[j], (x - g.px[j]) * g.tx[j] + (y - g.py[j]) * g.ty[j], (x - g.px[j]) * g.nx[j] + (y - g.py[j]) * g.ny[j], band);
  };
  const rBase = T.r * Math.pow(a, T.rExp), reachB = T.reach * Math.pow(a, T.reachExp);
  const rEdge = T.eR * Math.pow(a, T.eExp), rHole = T.cR * Math.pow(a, T.cRExp);
  const TWO_PI = Math.PI * 2;
  // one thread of loops along the stretch i0..i1. Mode 0 hugs the ink (the dense edge pass), mode 1
  // swings out across the band, mode 2 sweeps a counter row by row
  const thread = (i0: number, i1: number, mode: number, rb: number, adv: number, salt: string) => {
    const s0 = g.s[i0], s1 = g.s[i1], len = s1 - s0;
    const hole = mode === 2, edge = mode === 0;
    const band = hole ? 0 : 1;
    if (len < 0.02) {
      for (let i = i0; i <= i1; i++) put(g.s[i], 0, T.lo, band);
      return;
    }
    // a whole outline with no bridge is walked round without a seam, so no corner gets a knot
    const closed = hole || Math.hypot(g.px[i1] - g.px[i0], g.py[i1] - g.py[i0]) < 1e-3;
    const at = (u: number) => frameAt(closed ? s0 + ((((u - s0) % len) + len) % len) : Math.min(s1, Math.max(s0, u)));
    // a counter is swept in even rows, down every other row and back up between them, so the
    // thread covers the whole window evenly; SP is that guide track, SL its length so far
    const SP: number[] = [], SL: number[] = [0];
    if (hole) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let i = i0; i <= i1; i++) {
        x0 = Math.min(x0, g.px[i]);
        x1 = Math.max(x1, g.px[i]);
        y0 = Math.min(y0, g.py[i]);
        y1 = Math.max(y1, g.py[i]);
      }
      const inside = (x: number, y: number) => {
        let c = false;
        for (let i = i0, j = i1; i <= i1; j = i++)
          if (g.py[i] > y !== g.py[j] > y && x < ((g.px[j] - g.px[i]) * (y - g.py[i])) / (g.py[j] - g.py[i]) + g.px[i]) c = !c;
        return c && sampleSdf(g, x, y) > T.lo + rb * 0.7;
      };
      const gap = T.cGap * rb, dx = gap * 0.25;
      const rows: number[] = [];
      for (let y = y0 + gap * 0.5; y < y1; y += gap) rows.push(y);
      const order = rows.map((_, r) => r).filter((r) => r % 2 === 0);
      for (let r = rows.length - 1; r >= 0; r--) if (r % 2 === 1) order.push(r);
      SP.push(g.px[i0], g.py[i0]);
      let flipR = false;
      for (const r of order) {
        const y = rows[r];
        let a0 = Infinity, a1 = -Infinity;
        for (let x = x0; x <= x1; x += dx)
          if (inside(x, y)) {
            a0 = Math.min(a0, x);
            a1 = Math.max(a1, x);
          }
        if (a1 < a0) continue;
        if (flipR) SP.push(a1, y, a0, y);
        else SP.push(a0, y, a1, y);
        flipR = !flipR;
      }
      SP.push(g.px[i1], g.py[i1]);
      for (let q = 2; q < SP.length; q += 2) SL.push(SL[SL.length - 1] + Math.hypot(SP[q] - SP[q - 2], SP[q + 1] - SP[q - 1]));
    }
    const sweep = (u: number, o: { x: number; y: number }) => {
      const d = Math.min(SL[SL.length - 1], Math.max(0, u - s0));
      let q = 1;
      while (q < SL.length - 1 && SL[q] < d) q++;
      const t = SL[q] > SL[q - 1] ? (d - SL[q - 1]) / (SL[q] - SL[q - 1]) : 0;
      o.x = SP[q * 2 - 2] + (SP[q * 2] - SP[q * 2 - 2]) * t;
      o.y = SP[q * 2 - 1] + (SP[q * 2 + 1] - SP[q * 2 - 1]) * t;
    };
    const SW = { x: 0, y: 0 };
    const end = hole ? s0 + SL[SL.length - 1] : s1;
    const rnd = mulberry(hashStr(k + "|p" + salt));
    const nR = noise1(rnd, 1), nB = noise1(rnd, 1), nQ = noise1(rnd, 1), nF = noise1(rnd, 1), nV = noise1(rnd, T.lamV);
    const nT = noise1(rnd, 1), nS = noise1(rnd, 1), nWx = noise1(rnd, 1), nWy = noise1(rnd, 1), nA = noise1(rnd, 1), nP = noise1(rnd, 1);
    // the loop is an ellipse: its aspect and orientation wander, so loops stretch into hairpins
    let asp = 1, psi = 0;
    const off = (ph: number, o: { x: number; y: number }) => {
      const ex = rad * Math.cos(ph), ey = rad * asp * Math.sin(ph), cp = Math.cos(psi), sp = Math.sin(psi);
      o.x = ex * cp - ey * sp;
      o.y = ex * sp + ey * cp;
    };
    const O = { x: 0, y: 0 };
    const loopLen = TWO_PI * rb;
    const ease = (u: number) => (closed && !hole ? 1 : Math.min(1, Math.max(0, Math.min(u - s0, end - u) / T.taper)));
    const aspM = mode === 1 ? T.oAsp : T.asp;
    at(s0);
    let rad = 0.006, u = s0, pl = 0, dir = rnd() < 0.5 ? 1 : -1;
    let cx = G.x + G.nx * (T.lo + rad), cy = G.y + G.ny * (T.lo + rad);
    let phi = Math.atan2(-G.ny, -G.nx);
    let lastF = nF(0) > 0;
    while (u < end) {
      const e = ease(u);
      at(u + T.slide * rb * e * nS(pl / (loopLen * T.lamS)));
      // loop radius: wandering, with bursts of small loops, limited by the room there
      let want = rb * Math.exp(T.rVar * Math.sqrt(a) * nR(pl / (loopLen * T.lamR)));
      const b = nB(pl / (loopLen * T.lamB));
      if (b > T.burst) want *= 1 - (1 - T.burstK) * Math.min(1, (b - T.burst) / 0.15);
      const room = hole ? 1 : edge ? G.free * 0.95 : Math.min(reachB * (1 + T.reachVar * nV(u)), G.free * 0.95);
      want = Math.max(Math.min(T.rMin, rb), Math.min(want, (room - T.lo) / 2) * (0.6 + 0.4 * e));
      rad += (want - rad) * 0.12;
      // the guide runs along the offset contour: right at the ink for the edge pass, anywhere in the
      // band for the outer pass, and along the sweep in a counter
      const q01 = (nQ(pl / (loopLen * T.lamQ)) + 1) / 2;
      let v = 0;
      if (edge) v = T.lo + rad * (1 + T.eSpread * q01 * e);
      else if (!hole) {
        const q = Math.min(1, Math.max(0, Math.pow(q01, T.vSkew * Math.pow(a, T.vSkewExp))));
        v = T.lo + rad * T.oIn + Math.max(0, room - rad * (1 + T.oIn) - T.lo) * q * e;
      }
      const wl = pl / (loopLen * T.lamW);
      const wa = T.wander * rad * (edge || hole ? 0.5 : 1);
      if (hole) sweep(u, SW);
      const gx = (hole ? SW.x : G.x + G.nx * v) + wa * nWx(wl), gy = (hole ? SW.y : G.y + G.ny * v) + wa * nWy(wl);
      const dx = gx - cx, dy = gy - cy, dl = Math.hypot(dx, dy);
      if (dl > 1e-9) {
        const mv = Math.min(dl * T.relax * step, (mode === 1 ? 0.35 : 0.6) * step);
        cx += (dx / dl) * mv;
        cy += (dy / dl) * mv;
      }
      // the whole loop must fit outside the ink: shrink it, and ease the centre away from the edge
      const sdC = sampleSdf(g, cx, cy);
      const need = Math.max(want, Math.min(T.rMin, rb) * e) + T.lo;
      if (sdC < need) {
        const h = 1.5 / MH;
        const ux = sampleSdf(g, cx + h, cy) - sampleSdf(g, cx - h, cy), uy = sampleSdf(g, cx, cy + h) - sampleSdf(g, cx, cy - h);
        const ul = Math.hypot(ux, uy) || 1, push = Math.min(need - sdC, 0.3 * step);
        cx += (ux / ul) * push;
        cy += (uy / ul) * push;
      }
      // small loops close to the ink keep the silhouette; the big arcs swing further out
      const sdN = sampleSdf(g, cx, cy);
      rad = Math.min(rad, Math.max(0.004, sdN - T.lo), T.rNear + T.rSlope * sdN);
      // now and then the pen turns the other way: mirror the centre through the pen
      const fNow = nF(pl / (loopLen * T.flip)) > 0;
      if (fNow !== lastF) {
        lastF = fNow;
        off(phi, O);
        const px0 = cx + O.x, py0 = cy + O.y;
        const ncx = 2 * px0 - cx, ncy = 2 * py0 - cy;
        if (sampleSdf(g, ncx, ncy) > rad + T.lo) {
          cx = ncx;
          cy = ncy;
          phi += Math.PI;
          dir = -dir;
        }
      }
      asp = Math.min(1, Math.max(T.aspMin, aspM + T.aspVar * nA(pl / (loopLen * T.lamA))));
      psi = Math.PI * T.spin * nP(pl / (loopLen * T.lamA));
      const sp = rad * Math.max(asp, Math.hypot(Math.sin(phi), asp * Math.cos(phi)));
      phi += (dir * step * Math.max(0.3, 1 + T.turnVar * nT(pl / (loopLen * T.lamT)))) / sp;
      off(phi, O);
      let x = cx + O.x, y = cy + O.y;
      // never into the ink
      const sd = sampleSdf(g, x, y);
      if (sd < T.lo) {
        const h = 1.5 / MH;
        const ux = sampleSdf(g, x + h, y) - sampleSdf(g, x - h, y), uy = sampleSdf(g, x, y + h) - sampleSdf(g, x, y - h);
        const ul = Math.hypot(ux, uy) || 1;
        x += (ux / ul) * (T.lo - sd);
        y += (uy / ul) * (T.lo - sd);
      }
      putXY(x, y, i0, i1, band);
      // through the eased ends quickly so they never wind into a coil; the outer pass also hurries
      // past spots too tight for a real loop and through narrow rooms; a counter's sweep keeps an
      // even pace
      let du = adv * step * (1 + 4 * (1 - e));
      // the edge track is shorter than the outline in a bay and longer round a corner: keep its pace
      // even along the track itself, so bays get no knots and corners no gaps
      if (edge) du /= Math.min(2, Math.max(0.3, 1 - v * G.cv));
      if (mode === 1) du *= (rad < 1.4 * T.rMin ? 3 : 1) * Math.pow(Math.min(5, Math.max(1, (0.5 * reachB) / Math.max(1e-3, room))), 0.75);
      u += du;
      pl += step;
    }
    if (closed) return;
    // back to the ink at the end of the stretch
    at(s1);
    const ex = G.x + G.nx * T.lo, ey = G.y + G.ny * T.lo;
    off(phi, O);
    const lx = cx + O.x, ly = cy + O.y;
    const n = Math.max(1, Math.ceil(Math.hypot(ex - lx, ey - ly) / step));
    for (let q = 1; q <= n; q++) putXY(lx + ((ex - lx) * q) / n, ly + ((ey - ly) * q) / n, i0, i1, band);
  };
  // walk the outline, then correct the thread's pace until the line covers its share of the field
  const GR = 256, grid = new Uint8Array(GR * 2 * GR * 2);
  const pt = { x: 0, y: 0, w: 0 };
  const target = T.cover * Math.pow(a, T.inkExp) * Math.max(0.5, 1 - T.holeK * a * holes) * Math.pow(outerLen / 3.2, T.lenK);
  let adv = outerLen / Math.max(4, T.ink * Math.pow(a, T.inkExp) * 0.8);
  for (let pass = 0; pass < 5; pass++) {
    SG.length = DU.length = DV.length = BT.length = 0;
    for (const p of pieces) {
      if (p.kind === 0) for (let q = p.i; q <= p.j; q++) put(g.s[q], 0, 0, 0);
      else if (p.kind === 1) {
        // the dense pass right at the ink first, then the wider, sparser pass out across the band
        thread(p.i, p.j, 0, rEdge, adv * T.eDens * Math.pow(a, T.eDensExp), p.i + "e");
        thread(p.i, p.j, 1, rBase, adv, p.i + "");
      } else {
        thread(p.i, p.j, 2, rHole, adv * T.cDens * Math.pow(a, T.cDensExp), p.i + "");
        // a counter is then traced once round its edge, which keeps it a clean round window
        for (let q = p.i; q <= p.j; q++) put(g.s[q], 0, T.lo, 0);
      }
    }
    // how much of the field the line covers (cells of 1/256 cap), band and counters apart
    grid.fill(0);
    const tmp: Field = { m: SG.length, sg: Float32Array.from(SG), du: Float32Array.from(DU), dv: Float32Array.from(DV) };
    for (let q = 0; q < tmp.m; q++) {
      placePoint(g, tmp, q, 1, pt);
      const gx = Math.floor((pt.x + 1) * GR), gy = Math.floor((pt.y + 1) * GR);
      if (gx >= 0 && gy >= 0 && gx < GR * 2 && gy < GR * 2) grid[gy * GR * 2 + gx] |= BT[q] ? 1 : 2;
    }
    let tot = 0;
    for (let q = 0; q < grid.length; q++) if (grid[q]) tot++;
    if (Math.abs(tot / target - 1) < 0.03) break;
    adv *= Math.min(3, Math.max(0.33, Math.pow(tot / target, 1.15)));
  }
  const m = SG.length;
  f = { m, sg: Float32Array.from(SG), du: Float32Array.from(DU), dv: Float32Array.from(DV) };
  if (fieldCache.size > 60) fieldCache.clear();
  fieldCache.set(k, f);
  return f;
}

// position of field sample qf (fractional) for growth amplitude A, kept outside the numeral
function placePoint(g: Glyph, f: Field, qf: number, A: number, out: { x: number; y: number; w: number }) {
  const q0 = Math.floor(qf), q1 = Math.min(f.m - 1, q0 + 1), fq = qf - q0;
  const sg = f.sg[q0] + (f.sg[q1] - f.sg[q0]) * fq;
  const du = f.du[q0] + (f.du[q1] - f.du[q0]) * fq;
  const dv = f.dv[q0] + (f.dv[q1] - f.dv[q0]) * fq;
  let lo = 0, hi = g.n - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.s[mid] <= sg) lo = mid;
    else hi = mid - 1;
  }
  const j = lo;
  const sj = g.s[j], sl = g.s[j + 1] - sj;
  const tt = sl > 0 ? Math.min(1, Math.max(0, (sg - sj) / sl)) : 0;
  let x = g.px[j] + (g.px[j + 1] - g.px[j]) * tt;
  let y = g.py[j] + (g.py[j + 1] - g.py[j]) * tt;
  const wj = g.w[j] + (g.w[j + 1] - g.w[j]) * tt;
  if (A > 0 && wj > 0) {
    const nx = g.nx[j] + (g.nx[j + 1] - g.nx[j]) * tt, ny = g.ny[j] + (g.ny[j + 1] - g.ny[j]) * tt;
    const tx = g.tx[j] + (g.tx[j + 1] - g.tx[j]) * tt, ty = g.ty[j] + (g.ty[j + 1] - g.ty[j]) * tt;
    const an = dv * A * wj, bt = du * A * wj;
    x += nx * an + tx * bt;
    y += ny * an + ty * bt;
    // keep the line outside the numeral: project inside points onto the edge
    for (let it = 0; it < 2; it++) {
      const d = sampleSdf(g, x, y);
      if (d >= 0) break;
      const e = 1.5 / MH;
      const gx = sampleSdf(g, x + e, y) - sampleSdf(g, x - e, y);
      const gy = sampleSdf(g, x, y + e) - sampleSdf(g, x, y - e);
      const gl = Math.hypot(gx, gy) || 1;
      x -= (gx / gl) * d;
      y -= (gy / gl) * d;
    }
  }
  out.x = x;
  out.y = y;
  out.w = wj;
}

/* ---------------------------------------------------------------- timing */

const TAU = 0.155; // growth time constant, seconds (measured)
const grow = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-t / TAU));

type SlotView = { ch: string; amp: number };

// "seconds" mode is a pure function of the clock: collapse over the last `c` seconds, swap halfway.
function secondsView(t: number, c: number): SlotView {
  const k = Math.floor(t);
  const ph = t - k;
  if (ph >= 1 - c) {
    const u = (ph - (1 - c)) / c;
    const env = (1 + Math.cos(Math.PI * u)) / 2;
    if (u < 0.5) return { ch: String(((k % 10) + 10) % 10), amp: grow(1 - c) * env };
    return { ch: String((((k + 1) % 10) + 10) % 10), amp: grow(1 - c) * env };
  }
  return { ch: String(((k % 10) + 10) % 10), amp: grow(ph) };
}

/* ---------------------------------------------------------------- component */

function amountOf(s: ScribbleClockProps["scribble"]) {
  if (s === "loose") return 2;
  if (s === "tight" || s === undefined) return 1;
  return Math.max(0, +s || 0);
}

export function ScribbleClock({
  mode = "seconds",
  value = "7",
  scribble = "tight",
  color = "#ededed",
  background = "#0f0f0f",
  stroke = 0.65,
  font = '"Helvetica Neue", Helvetica, Arial, sans-serif',
  weight = 700,
  size = 0.4,
  grid = true,
  caption = true,
  seed = 1,
  handoff = 0.1,
  time,
  replayOnClick = true,
  ariaLabel,
  className,
  style,
}: ScribbleClockProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [fontTick, setFontTick] = React.useState(0);

  const digits = React.useMemo(() => String(value ?? "").replace(/[^0-9]/g, "") || "0", [value]);

  // live state shared with the draw loop
  const st = React.useRef({
    w: 0, h: 0, dpr: 1,
    visible: true,
    reduced: false,
    slots: [] as { cur: string; next: string; t0: number; from: number }[],
    replay: { t0: -1e9, salt: 0 },
    props: null as any,
    draw: (_t: number) => {
      void _t;
    },
  });
  const s = st.current;
  s.props = { mode, digits, scribble, color, background, stroke, font, weight, size, grid, caption, seed, handoff, time };

  const clock = React.useCallback(() => (s.props.time !== undefined ? +s.props.time : performance.now() / 1000), [s]);
  const wall = React.useCallback(() => (s.props.time !== undefined ? +s.props.time : Date.now() / 1000), [s]);

  // value mode: keep one slot per digit, animate each change through the hand-off
  React.useEffect(() => {
    if (mode !== "value") return;
    const now = clock();
    const prev = s.slots;
    const c = Math.max(0.02, +handoff || 0.1);
    if (prev.length !== digits.length) {
      s.slots = digits.split("").map((d) => ({ cur: d, next: d, t0: now, from: 0 }));
    } else {
      digits.split("").forEach((d, i) => {
        const q = prev[i];
        if (q.next === d) return;
        // start the hand-off from whatever the slot shows right now
        const dt = now - q.t0;
        let a0: number;
        if (q.from > 0 && dt < c) {
          const u = dt / c;
          a0 = (q.from * (1 + Math.cos(Math.PI * u))) / 2;
          if (u >= 0.5) q.cur = q.next;
        } else if (q.from > 0) {
          q.cur = q.next;
          a0 = grow(dt - c);
        } else a0 = grow(dt);
        q.next = d;
        q.from = Math.max(0.0001, a0);
        q.t0 = now;
      });
    }
  }, [digits, mode, handoff, clock, s]);

  React.useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mq = typeof matchMedia !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
    s.reduced = !!mq?.matches;

    const slotView = (i: number, t: number): SlotView => {
      const P = s.props;
      const c = Math.max(0.02, +P.handoff || 0.1);
      if (P.mode === "seconds") {
        if (s.reduced) return { ch: String(((Math.floor(wall()) % 10) + 10) % 10), amp: 1 };
        return secondsView(wall(), c);
      }
      const q = s.slots[i];
      if (!q) return { ch: P.digits[i] || "0", amp: 1 };
      const dt = t - q.t0;
      if (s.reduced) {
        if (q.next !== q.cur) q.cur = q.next;
        return { ch: q.cur, amp: 1 };
      }
      if (q.from > 0) {
        if (dt < c) {
          const u = dt / c;
          const env = (1 + Math.cos(Math.PI * u)) / 2;
          return { ch: u < 0.5 ? q.cur : q.next, amp: q.from * env };
        }
        q.cur = q.next;
        q.from = 0;
        q.t0 = q.t0 + c;
        return { ch: q.cur, amp: grow(t - q.t0) };
      }
      return { ch: q.cur, amp: grow(dt) };
    };

    const draw = (t: number) => {
      const P = s.props;
      const { w, h, dpr } = s;
      if (!w || !h) return;
      const W = canvas.width, H = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = P.background;
      ctx.fillRect(0, 0, W, H);
      const minSide = Math.min(w, h);
      const amt = amountOf(P.scribble);
      // a looser scribble is drawn with a slightly finer pen
      const lwCss = Math.max(1 / dpr, P.stroke * Math.min(1.6, Math.max(0.7, minSide / 640)) * Math.pow(Math.max(0.5, amt), -FINE));
      if (P.grid) {
        ctx.globalAlpha = 0.075;
        ctx.fillStyle = P.color;
        const gl = Math.max(1, Math.round(dpr));
        ctx.fillRect(Math.round((W - gl) / 2), 0, gl, H);
        ctx.fillRect(0, Math.round((H - gl) / 2), W, gl);
        ctx.globalAlpha = 1;
      }
      const chars: string[] = P.mode === "seconds" ? ["0"] : P.digits.split("");
      // layout
      const fontOk = buildGlyph("0", P.font, P.weight);
      const adv = fontOk ? fontOk.adv : 0.75;
      const track = 0.06 + 0.12 * amt;
      const unitW = chars.length * adv + (chars.length - 1) * track + 0.28 * amt;
      let cap = Math.max(0.05, +P.size || 0.4) * minSide;
      cap = Math.min(cap, (w * 0.9) / Math.max(1, unitW));
      const cx = w / 2, cy = h * 0.495;
      // replay envelope (click to redraw)
      const c = Math.max(0.02, +P.handoff || 0.1);
      const rdt = t - s.replay.t0;
      let renv = 1, salt = s.replay.salt;
      if (!s.reduced && rdt >= 0 && rdt < c) {
        renv = (1 + Math.cos((Math.PI * rdt) / c)) / 2;
        if (rdt < c / 2) salt -= 1;
      } else if (!s.reduced && rdt >= c) renv = grow(rdt - c);

      ctx.strokeStyle = P.color;
      ctx.lineWidth = lwCss * dpr;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let i = 0; i < chars.length; i++) {
        const view = slotView(i, t);
        const g = buildGlyph(view.ch, P.font, P.weight);
        if (!g) continue;
        const A = Math.min(view.amp, renv);
        const f = getField(g, `${P.weight}|${P.font}|${view.ch}`, (P.seed | 0) * 7919 + salt * 104729 + i * 31, amt);
        const ox = cx + (i - (chars.length - 1) / 2) * (adv + track) * cap;
        const k = cap * dpr;
        const X0 = ox * dpr, Y0 = cy * dpr;
        ctx.beginPath();
        let pen = false;
        let lx = 0, ly = 0;
        const pt = { x: 0, y: 0, w: 0 };
        const fill: number[] = [];
        const maxSeg = 0.007;
        let run = 0, chunk = 0;
        const lw0 = lwCss * dpr;
        const lwN = weightNoise((P.seed | 0) * 131 + i * 17);
        ctx.lineWidth = lw0 * (1 + WEIGHT_VAR * lwN(0));
        const emit = (x: number, y: number, w: number) => {
          let brk = !pen;
          if (pen && A > 0 && w > 0) {
            // a jump across a stroke (or a projection that snaps to the far wall of a bay) would draw
            // a straight chord: lift the pen instead
            if (Math.hypot(x - lx, y - ly) > maxSeg * 2.2) brk = true;
            else if (sampleSdf(g, (x + lx) / 2, (y + ly) / 2) < -0.008) brk = true;
          }
          const X = X0 + x * k, Y = Y0 + y * k;
          if (brk) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
          // the pen's weight drifts a little along the line: stroke it in short runs
          if (++run >= 40) {
            run = 0;
            ctx.stroke();
            ctx.beginPath();
            ctx.lineWidth = lw0 * (1 + WEIGHT_VAR * lwN(++chunk * 0.22));
            ctx.moveTo(X, Y);
          }
          pen = true;
          lx = x;
          ly = y;
        };
        for (let q = 0; q < f.m; q++) {
          placePoint(g, f, q, A, pt);
          const jump = q > 0 ? Math.abs(f.sg[q] - f.sg[q - 1]) : 0;
          // while the tangle is still growing, a point that hangs on another part of the outline
          // than the one before would draw a chord across a notch: lift the pen there
          if (A < 0.98 && jump > 0.02) pen = false;
          const d = pen ? Math.hypot(pt.x - lx, pt.y - ly) : 0;
          if (d > maxSeg && q > 0 && jump <= 0.02) {
            // the outline frame swings fast round sharp corners: fill the gap with real samples,
            // unless the fill would have to be pressed onto the ink (then the pen lifts instead)
            const nsub = Math.min(24, Math.ceil(d / maxSeg));
            const ex = pt.x, ey = pt.y, ew = pt.w;
            fill.length = 0;
            for (let si = 1; si < nsub; si++) {
              placePoint(g, f, q - 1 + si / nsub, A, pt);
              if (sampleSdf(g, pt.x, pt.y) < 0.001) {
                fill.length = 0;
                break;
              }
              fill.push(pt.x, pt.y, pt.w);
            }
            for (let si = 0; si < fill.length; si += 3) emit(fill[si], fill[si + 1], fill[si + 2]);
            emit(ex, ey, ew);
          } else emit(pt.x, pt.y, pt.w);
        }
        ctx.stroke();
      }
      if (P.caption) {
        const fsz = Math.max(11, Math.round(minSide * 0.0135));
        ctx.font = `${fsz * dpr}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = P.color;
        ctx.textBaseline = "alphabetic";
        const name = P.scribble === "loose" ? "loose" : P.scribble === "tight" || P.scribble === undefined ? "tight" : amt.toFixed(1);
        const text = typeof P.caption === "string" ? P.caption : `${P.mode === "value" ? "value" : "seconds"}   scribble ${name}`;
        ctx.fillText(text, 10 * dpr, H - 8 * dpr);
        ctx.globalAlpha = 1;
      }
    };
    s.draw = draw;

    const resize = () => {
      const r = root.getBoundingClientRect();
      const dpr = Math.min(3, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
      s.w = Math.max(1, r.width);
      s.h = Math.max(1, r.height);
      s.dpr = dpr;
      const W = Math.round(s.w * dpr), H = Math.round(s.h * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      draw(clock());
    };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(root);
    resize();

    let raf = 0, timer: any = 0;
    const loop = () => {
      raf = 0;
      if (!s.visible || (typeof document !== "undefined" && document.hidden)) return;
      draw(clock());
      if (s.props.time !== undefined) return;
      if (s.reduced) {
        timer = setTimeout(() => (raf = requestAnimationFrame(loop)), 1000 - (Date.now() % 1000) + 5);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && !timer) raf = requestAnimationFrame(loop);
      else if (!raf && timer) {
        clearTimeout(timer);
        timer = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    (s as any).kick = () => {
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
      kick();
    };
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((es) => {
            s.visible = es.some((e) => e.isIntersecting);
            if (s.visible) (s as any).kick();
          })
        : null;
    io?.observe(root);
    const onVis = () => !document.hidden && (s as any).kick();
    document.addEventListener("visibilitychange", onVis);
    const onMq = () => {
      s.reduced = !!mq?.matches;
      (s as any).kick();
    };
    mq?.addEventListener?.("change", onMq);
    kick();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq?.removeEventListener?.("change", onMq);
    };
  }, [s, clock, wall, fontTick]);

  // build the other digits' tangles in idle time, one per callback, so a digit change never waits
  React.useEffect(() => {
    if (mode !== "seconds") return;
    const g0 = typeof window !== "undefined" ? (window as any) : null;
    if (!g0) return;
    const amt = amountOf(scribble);
    let k = 0, id: any = 0, alive = true;
    const idle = (fn: () => void) => (g0.requestIdleCallback ? g0.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
    const step = () => {
      if (!alive || k > 9) return;
      const ch = String(k++);
      const g = buildGlyph(ch, font, weight);
      if (g) getField(g, `${weight}|${font}|${ch}`, (seed | 0) * 7919 + s.replay.salt * 104729, amt);
      id = idle(step);
    };
    id = idle(step);
    return () => {
      alive = false;
      if (g0.cancelIdleCallback && g0.requestIdleCallback) g0.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [mode, scribble, font, weight, seed, s, fontTick]);

  // redraw on prop changes (also covers a controlled `time`)
  React.useEffect(() => {
    s.draw(clock());
    (s as any).kick?.();
  });

  // custom web fonts: rebuild the outline once the face has loaded
  React.useEffect(() => {
    if (typeof document === "undefined" || !(document as any).fonts?.load) return;
    let alive = true;
    (document as any).fonts.load(`${weight} 100px ${font}`, "0123456789").then(() => {
      if (!alive) return;
      for (const k of Array.from(glyphCache.keys())) if (k.startsWith(`${weight}|${font}|`)) glyphCache.delete(k);
      fieldCache.clear();
      setFontTick((n) => n + 1);
    }, () => {});
    return () => {
      alive = false;
    };
  }, [font, weight]);

  const replay = React.useCallback(() => {
    if (!replayOnClick) return;
    s.replay = { t0: clock(), salt: s.replay.salt + 1 };
    (s as any).kick?.();
  }, [replayOnClick, clock, s]);

  const label =
    ariaLabel ?? (mode === "seconds" ? "Scribbled clock showing the last digit of the current second" : `Scribbled number ${digits}`);

  return (
    <div
      ref={rootRef}
      className={["ls-scribble-clock", className].filter(Boolean).join(" ")}
      role={replayOnClick ? "button" : "img"}
      aria-label={replayOnClick ? `${label}. Press to redraw the scribble.` : label}
      tabIndex={replayOnClick ? 0 : undefined}
      onClick={replay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          replay();
        }
      }}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 360,
        overflow: "hidden",
        background,
        cursor: replayOnClick ? "pointer" : undefined,
        WebkitTapHighlightColor: "transparent",
        ["--ls-sc-ring" as any]: color,
        ...style,
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

export default ScribbleClock;
