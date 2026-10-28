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

// ---- canvases --------------------------------------------------------------
// A canvas and its context with smoothing off (Tycho's sprite part). The
// painting's strokes (strokeRow) are Tycho's too, inside its pixel buffer
// (paint.js).
const canvasOf = (w, h) => Tycho.sprite.canvas(w, h);
