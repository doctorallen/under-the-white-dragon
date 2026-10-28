'use strict';
// ---------------------------------------------------------------------------
// Shared helpers: math, seeded randomness and noise, colors and ramps.
// Every file is a classic script in one global scope (index.html loads them
// in order), so names here are used everywhere.
// ---------------------------------------------------------------------------

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const $ = (id) => document.getElementById(id);

// A hash of integers to 0..1, stable everywhere: all painting and generation
// is seeded by place, never Math.random, so a world always looks the same.
function hash(x, y, s) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
// Value noise, smooth between integer lattice points.
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// A seeded generator (mulberry32): f() 0..1, i(a, b) an integer a..b.
class Rng {
  constructor(seed) { this.s = seed >>> 0; }
  f() { let t = (this.s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  i(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
}

// ---- colors ---------------------------------------------------------------
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const SOOT = [8, 6, 12], WARM = [255, 238, 200];
// A painter's ramp: n tones from soot through the anchors (dark to light) to
// a warm light, evenly spaced in lightness, so neighboring tones always
// differ by a visible step and the strokes show.
function rampOf(anchors, n = 9, deep = 0.55, high = 0.3) {
  const A = anchors.map((a) => (typeof a === 'string' ? rgb(a) : a));
  const path = [mixRgb(A[0], SOOT, deep)].concat(A, [mixRgb(A[A.length - 1], WARM, high)]), pts = [];
  for (let i = 0; i + 1 < path.length; i++) for (let k = 0; k < 16; k++) pts.push(mixRgb(path[i], path[i + 1], k / 16));
  pts.push(path[path.length - 1]);
  const L = []; let m = -1; for (const c of pts) { m = Math.max(m, lum(c)); L.push(m); }
  const out = [];
  for (let k = 0, j = 0; k < n; k++) {
    const want = L[0] + (L[L.length - 1] - L[0]) * (k / (n - 1));
    while (j < L.length - 2 && L[j + 1] < want) j++;
    const u = L[j + 1] > L[j] ? clamp((want - L[j]) / (L[j + 1] - L[j]), 0, 1) : 0;
    out.push(mixRgb(pts[j], pts[j + 1], u));
  }
  return out;
}
// The tone of a ramp at value v (0..1), moved by a stroke's jitter.
const tone = (ramp, v, jit = 0) => ramp[clamp(Math.round(v * (ramp.length - 1) + jit), 0, ramp.length - 1)];

// ---- strokes ---------------------------------------------------------------
// Everything is painted in short horizontal strokes of one tone each. A row
// is cut into 8 px cells (each row set off by its own phase), each cell into
// one to three strokes at hashed places; for every pixel, `mid` is its
// stroke's middle (where its tone is read) and `jit` the stroke's jitter.
// It depends only on the place, so anything painted twice matches itself.
function strokeRow(mid, jit, x0, n, y, seed) {
  const C = 8, ph = Math.floor(hash(y, 7, seed) * C);
  let c = Math.floor((x0 + ph) / C), cs = c * C - ph, i = 0;
  while (i < n) {
    const h = hash(c, y, seed + 1), h2 = hash(c, y, seed + 2), h3 = hash(c, y, seed + 3);
    let a = C, b = C;
    if (h > 0.3) { if (h < 0.7) a = 2 + ((h2 * (C - 3)) | 0); else { a = 2 + ((h2 * 3) | 0); b = Math.min(C - 2, a + 2 + ((h3 * 3) | 0)); } }
    const ja = h2 + h3 - 1, jb = hash(c, y, seed + 4) + h3 - 1, jc = hash(c, y, seed + 5) + h - 1;
    const ma = cs + ((a - 1) >> 1), mb = cs + ((a + b - 1) >> 1), mc = cs + ((b + C - 1) >> 1);
    for (let k = 0; k < C; k++) {
      if (cs + k < x0) continue;
      if (i >= n) break;
      if (k < a) { mid[i] = ma - x0; jit[i] = ja; } else if (k < b) { mid[i] = mb - x0; jit[i] = jb; } else { mid[i] = mc - x0; jit[i] = jc; }
      i++;
    }
    c++; cs += C;
  }
}

// ---- a small canvas helper ----------------------------------------------------
function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
