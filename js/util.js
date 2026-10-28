'use strict';
// ---------------------------------------------------------------------------
// Shared helpers: math, seeded randomness and noise, colors and ramps.
// Every file is a classic script in one global scope (index.html loads them
// in order), so names here are used everywhere.
// ---------------------------------------------------------------------------

// The core comes from Tycho (vendor/tycho/dist/tycho.js, loaded first): the
// same functions this file used to hold, bit for bit.
const { clamp, lerp } = Tycho.math;
// A hash of integers to 0..1, stable everywhere: all painting and generation
// is seeded by place, never Math.random, so a world always looks the same.
// `noise` is value noise from it; `Rng` a seeded stream (f, i, pick...).
const { hash, noise, smooth, Rng } = Tycho.seed;
// Colors: '#rrggbb' to [r, g, b] (rgb), mixing, lightness, css; and a
// painter's ramp (rampOf): tones from soot through the anchors to a warm
// light, evenly spaced in lightness, read at a value by `tone`.
const { rgb, mixRgb, lum, css, SOOT, WARM, rampOf, tone } = Tycho.color;
const $ = (id) => document.getElementById(id);

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
