'use strict';
// ---------------------------------------------------------------------------
// The painted city. A level is a list of painting operations in world
// coordinates; the world is painted lazily in chunks (T.chunk px square),
// each chunk running only the operations that touch it, each from its own
// seed, so chunks meet without seams. The painting is flat: each surface one
// tone from its value, a crisp lit top edge and a shaded bottom, panel lines
// and drips, no noise and no brushwork (PAINT_FLAT; false brings back the
// old way, short strokes of close tones and beveled lips).
//
// The pixel buffer (Pix: put, tint, area, block), its strokes and blocks, and
// the chunk cache (Paint) are Tycho's painter (Tycho.paint, which grew from
// this file); the city's own materials and painters (windows, signs, pipes,
// railings, laundry, slabs, water...) are here, on top of it. A chunk is a
// color canvas (transparent where the far layer shows through) and a glow
// canvas (what lights itself).
// ---------------------------------------------------------------------------
const R = (anchors, n = 9, deep = 0.55, high = 0.3) => rampOf(anchors, n, deep, high);
const MAT = {
  concrete: R(['#2e2a2a', '#4a4440', '#68605a', '#a89c90']),
  concreteD: R(['#1e1c20', '#2e2a30', '#423c42', '#7a7076']),
  steel: R(['#1a2028', '#2a3440', '#40505e', '#90a4b4']),
  steelD: R(['#101418', '#1a2028', '#28323c', '#5a6a78']),
  rust: R(['#2a140c', '#4a2414', '#6e3a1e', '#b8703a']),
  glass: R(['#0a1a24', '#12303e', '#1e4a5a', '#6ab8c8']),
  glassC: R(['#14141e', '#22243a', '#363a5a', '#9aa0d8']),
  brick: R(['#2a1410', '#4a2418', '#6a3622', '#b06a48']),
  brickD: R(['#1a0e0c', '#2e1a14', '#44261c', '#7a4a36']),
  tile: R(['#2a2e2a', '#3e4440', '#5a625a', '#b0b8a8']),
  tileW: R(['#2e2a26', '#4a443c', '#6a6256', '#c8bca8']),
  asphalt: R(['#0e0e12', '#18181e', '#24242c', '#52525e']),
  machine: R(['#141a18', '#202a26', '#2e3c36', '#6a8478']),
  copper: R(['#2a140a', '#5a2e14', '#8a4a22', '#e09050']),
  chrome: R(['#2a2e38', '#5a6270', '#9aa4b4', '#eef2f8']),
  plastic: R(['#2a1e2a', '#463246', '#664a64', '#b08ab0']),
  wood: R(['#1c120c', '#3a2618', '#5a3c24', '#9a7048']),
  clinic: R(['#0e1a1c', '#1a2c2e', '#2a4244', '#a0d0c8']),
  sky: R(['#05040c', '#0e0a1e', '#1e1434', '#4a2a5a', '#a04a6a'], 14, 0.3, 0.3),
};
const col3 = (h) => (typeof h === 'string' ? rgb(h) : h);

// The city's painting is flat, like its people: one tone a surface, a crisp
// lit edge on top and a shaded one under, no noise and no brushwork.
const PAINT_FLAT = true;
// A pixel buffer over a piece of the world, (ox, oy) its top left, painting
// the city's way (Tycho.paint.Pix)
class Pix extends Tycho.paint.Pix { constructor(w, h, ox = 0, oy = 0) { super(w, h, ox, oy, { flat: PAINT_FLAT }); } }

// ---- decals: what the city puts on its walls --------------------------------
// windows in a grid: lit ones warm, cool or pink, some with blinds or a figure
function windows(P, x0, y0, x1, y1, o = {}) {
  const ww = o.w || 4, wh = o.h || 5, gx = o.gx || 3, gy = o.gy || 4, lit = o.lit === undefined ? 0.35 : o.lit, s = o.seed || 7;
  const pal = o.pal || [['#ffd890', '#e8a050'], ['#a0f0ff', '#40a0d0'], ['#ff90d0', '#c04090'], ['#fff0d0', '#c0a080']];
  const dark = col3(o.dark || '#0c1018'), frame = col3(o.frame || '#06060a');
  for (let y = y0; y + wh <= y1; y += wh + gy) for (let x = x0; x + ww <= x1; x += ww + gx) {
    if (!P.sees(x - 1, y, x + ww + 1, y + wh + 1)) continue;
    const h = hash(x, y, s), on = h < lit, p = pal[Math.floor(hash(x, y, s + 1) * pal.length)];
    if (!on && o.unlit === false) continue;
    for (let j = 0; j < wh; j++) for (let i = 0; i < ww; i++) {
      let c;
      if (on) { c = mixRgb(col3(p[0]), col3(p[1]), j / wh); if (o.blinds && j % 2) c = mixRgb(c, [0, 0, 0], 0.5); if (hash(x, y, s + 2) > 0.8 && i > 0 && i < ww - 1 && j > 1) c = mixRgb(c, [10, 8, 12], 0.85); }
      else c = mixRgb(dark, [60, 80, 100], (i + j < 2 ? 0.25 : 0) + hash(x + i, y + j, s) * 0.08);
      P.put(x + i, y + j, c, on ? o.glow || 0.35 : 0);
    }
    if (o.sill) for (let i = -1; i <= ww; i++) P.put(x + i, y + wh, frame);
  }
}
// a sign of invented glyphs, in neon tube
const GLYPHS = [];
for (let k = 0; k < 40; k++) { const g = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (hash(i, j, 900 + k) > 0.5 || (i === 1 && j === 2)) g.push([i, j]); GLYPHS.push(g); }
function signSize(n, vert) { return vert ? [7, n * 6 + 3] : [n * 4 + 3, 9]; }
function sign(P, x, y, n, colr, o = {}) {
  const c = col3(colr), vert = o.vert, pad = 2, [w, h] = signSize(n, vert), back = col3(o.back || '#0a0810');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const edge = i === 0 || j === 0 || i === w - 1 || j === h - 1; P.put(x + i, y + j, mixRgb(back, c, edge ? 0.35 : 0.04), edge ? 0.25 : 0); }
  for (let k = 0; k < n; k++) {
    const g = GLYPHS[Math.floor(hash(k, x + y, o.seed || 3) * GLYPHS.length)], gx = x + pad + (vert ? 0 : k * 4), gy = y + pad + (vert ? k * 6 : 0);
    if (o.dead && hash(k, 1, x) < o.dead) continue;
    for (const [i, j] of g) P.put(gx + i, gy + j, mixRgb(c, [255, 255, 255], 0.45), 1);
  }
}
// a pipe, round, lit from the upper left
function pipe(P, x0, y0, x1, y1, ramp, o = {}) {
  const vert = x1 - x0 < y1 - y0;
  P.area(x0, y0, x1, y1, ramp, (x, y) => {
    const t = vert ? (x - x0) / Math.max(1, x1 - x0) : (y - y0) / Math.max(1, y1 - y0);
    let v = 0.75 - Math.abs(t - 0.3) * 1.3 + (noise(x / 9, y / 9, 4) - 0.5) * 0.15;
    if (o.joints) { const a = vert ? y : x; if (a % o.joints < 2) v += 0.12; else if (a % o.joints < 3) v -= 0.2; }
    return v;
  }, o);
}
function cable(P, x0, y0, x1, y1, sag, colr, o = {}) {
  const n = Math.ceil(Math.abs(x1 - x0) + Math.abs(y1 - y0)) * 2, c = col3(colr);
  for (let k = 0; k <= n; k++) { const t = k / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(Math.PI * t) * sag; P.put(x, y, c, o.glow || 0); if (o.thick) P.put(x, y + 1, mixRgb(c, [0, 0, 0], 0.4)); }
}
function girder(P, x0, y0, x1, y1, ramp, o = {}) {
  const h = y1 - y0, step = o.step || h;
  P.block(x0, y0, x1, y0 + 1, ramp, { base: 0.6 }); P.block(x0, y1 - 1, x1, y1, ramp, { base: 0.4, lip: 0 });
  for (let x = x0; x < x1; x += step) for (let k = 0; k <= step; k++) { const t = k / step; P.put(x + k, y0 + 2 + t * (h - 4), tone(ramp, 0.45 - t * 0.1)); P.put(x + k + 1, y0 + 2 + t * (h - 4), tone(ramp, 0.3)); if (x + step - k <= x1) P.put(x + step - k, y0 + 2 + t * (h - 4), tone(ramp, 0.55)); }
}
function haze(P, x0, x1, y0, y1, colr, k) {
  const c = col3(colr);
  for (let y = Math.max(y0, P.oy); y < Math.min(y1, P.oy + P.h); y++) { const t = 1 - Math.abs((y - (y0 + y1) / 2) / ((y1 - y0) / 2)); for (let x = Math.max(x0, P.ox); x < Math.min(x1, P.ox + P.w); x++) P.tint(x, y, c, t * k * (0.8 + noise(x / 30, y / 6, 77) * 0.4)); }
}
function tubePaint(P, x, y, w, colr) { const c = col3(colr); for (let i = 0; i < w; i++) { P.put(x + i, y, mixRgb(c, [255, 255, 255], 0.5), 1); P.put(x + i, y + 1, mixRgb(c, [0, 0, 0], 0.2), 0.6); } }
function lampPaint(P, x, y, h, colr) {
  for (let j = 0; j < h; j++) { P.put(x, y - j, tone(MAT.steel, 0.5)); P.put(x + 1, y - j, tone(MAT.steel, 0.25)); }
  for (let i = 0; i < 9; i++) { P.put(x + i, y - h, tone(MAT.steel, 0.6)); P.put(x + i, y - h + 1, tone(MAT.steel, 0.3)); }
  for (let i = 5; i < 10; i++) P.put(x + i, y - h + 2, mixRgb(col3(colr), [255, 255, 255], 0.5), 1);
}
function glassWall(P, x0, y0, x1, y1, o = {}) {
  const mw = o.mw || 10, mh = o.mh || 14, ramp = o.ramp || MAT.glass;
  P.area(x0, y0, x1, y1, ramp, (x, y) => {
    let v = 0.32 + (noise(x / 50, y / 80, 21) - 0.5) * 0.25 + ((x + y * 0.6) % 40 < 6 ? 0.18 : 0) + ((x - y * 0.3) % 70 < 3 ? 0.12 : 0) - (y - y0) / (y1 - y0) * 0.1;
    const mx = (x - x0) % mw, my = (y - y0) % mh;
    if (mx === 0 || my === 0) v = 0.12; else if (mx === 1 || my === 1) v += 0.1;
    if (x - x0 < 2) v += 0.25; if (x1 - x < 2) v -= 0.1;
    return v;
  }, { jit: 0.5 });
  if (o.lit) windows(P, x0 + 2, y0 + 2, x1 - 1, y1, { w: mw - 2, h: mh - 2, gx: 2, gy: 2, lit: o.lit, seed: o.seed || 3, glow: 0.18, dark: '#0a1a24', pal: o.pal });
}
// a heap of scrap, flat like everything: its ridge lit, then bands of
// darker tones down into the shadow, each band's edge following the ridge
// and wavering a little (slow noise: fine noise hangs off the bands in
// streaks), and a few pieces of junk on the ridge breaking the skyline
function heap(P, x0, x1, ybase, hgt, ramp, seed = 5) {
  const top = (x) => ybase - hgt * (0.5 + noise(x / 18, 0, seed) * 0.5);
  P.area(x0, ybase - hgt - 4, x1, ybase, ramp, (x, y) => Math.max(0.1, 0.55 - (y - top(x)) / 40 + (y - top(x) < 2 ? 0.35 : 0) + (noise(x / 11, y / 16, seed + 1) - 0.5) * 0.14), { inside: (x, y) => y > top(x) });
  for (let k = 0; k < (x1 - x0) / 26; k++) {
    const cx = Math.round(x0 + hash(k, 1, seed) * (x1 - x0)), w = 5 + Math.floor(hash(k, 2, seed) * 9), h = 2 + Math.floor(hash(k, 3, seed) * 2), sl = (hash(k, 5, seed) - 0.5) * 0.8, cy = Math.round(top(cx)) - 1 - Math.floor(hash(k, 4, seed) * 3);
    for (let i = -1; i <= w; i++) for (let j = -1; j <= h; j++) { const x = cx - (w >> 1) + i, y = Math.round(cy + j + i * sl); if (y >= ybase) continue; P.put(x, y, tone(ramp, i < 0 || i === w || j < 0 || j === h ? 0.08 : j === 0 ? 0.85 : 0.6)); }
  }
}
function corrugated(P, x0, y0, x1, y1, ramp, o = {}) {
  P.area(x0, y0, x1, y1, ramp, (x, y) => { let v = 0.45 + ((x - x0) % 3 === 0 ? 0.2 : (x - x0) % 3 === 2 ? -0.15 : 0) + (noise(x / 12, y / 12, 41) - 0.5) * 0.4; if (y - y0 < 1) v = 0.9; if (y1 - y < 1) v -= 0.3; if (noise(x / 6, y / 5, 43) > 0.72) v -= 0.25; return v; }, o);
}
function railing(P, x0, x1, y, ramp, o = {}) {
  const h = o.h || 7;
  for (let x = x0; x <= x1; x++) { P.put(x, y - h, tone(ramp, 0.75)); P.put(x, y - h + 1, tone(ramp, 0.35)); }
  for (let x = x0; x <= x1; x += o.step || 5) for (let y2 = y - h; y2 < y; y2++) P.put(x, y2, tone(ramp, 0.45));
}
function laundry(P, x0, y0, x1, y1, seed) {
  cable(P, x0, y0, x1, y1, 4, '#141418');
  for (let x = x0 + 4; x < x1 - 4; x += 7 + Math.floor(hash(x, 1, seed) * 5)) {
    const t = (x - x0) / (x1 - x0), y = lerp(y0, y1, t) + Math.sin(Math.PI * t) * 4, c = rampOf([['#a83a3a', '#3a6aa8', '#d8d0b0', '#3a8a5a', '#8a3aa8'][Math.floor(hash(x, 2, seed) * 5)]], 5, 0.5, 0.25), w = 4 + Math.floor(hash(x, 3, seed) * 3), h = 5 + Math.floor(hash(x, 4, seed) * 4);
    P.area(x, y + 1, x + w, y + h, c, (a, b) => 0.7 - (b - y) / 14 - (a - x) / 20);
  }
}
// a floor slab, side-on, with a lit lip and grime under it
function slab(P, x0, x1, y, th, ramp, o = {}) { P.block(x0, y, x1, y + th, ramp, Object.assign({ base: 0.45, drips: 0.08, dripLen: 10, inward: 0.1 }, o)); }
function stairsPaint(P, x0, y0, x1, y1, ramp) {
  const n = Math.max(1, Math.round(Math.abs(y1 - y0) / 4)), dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  for (let k = 0; k < n; k++) P.block(Math.min(x0 + k * dx, x0 + (k + 1) * dx), y0 + k * dy, Math.max(x0 + k * dx, x0 + (k + 1) * dx) + 1, y0 + k * dy + 2, ramp, { base: 0.5 });
  for (let k = 0; k <= n; k++) for (let j = 1; j < 9; j++) if (k % 3 === 0) P.put(x0 + k * dx, y0 + k * dy - j, tone(ramp, 0.55));
  cable(P, x0, y0 - 9, x1, y1 - 9, 0, tone(ramp, 0.7));
}
// water: a still dark surface the reflections play on
function water(P, x0, x1, y, depth, ramp) { P.area(x0, y, x1, y + depth, ramp, (x, yy) => 0.25 + (noise(x / 20, yy / 2, 61) - 0.5) * 0.2 + ((yy - y) < 1 ? 0.3 : 0)); }

// ---- the chunk cache ----------------------------------------------------------
// Paint.reset(level) for a new level, Paint.get(cx, cy) for a painted chunk
// ({ c, e, x, y }), and Paint.ahead(x, y) for a frame's spare work: the
// nearest chunk not yet painted near (x, y), so walking into new ground
// doesn't stall (Tycho.paint.Painter).
const Paint = new Tycho.paint.Painter({ size: T.chunk, flat: PAINT_FLAT });
// a chunk painted afresh, outside the cache (Tyrell mode's pictures)
function paintChunk(L, cx, cy) { return Tycho.paint.chunk(L.ops, cx, cy, T.chunk, { flat: PAINT_FLAT }); }
