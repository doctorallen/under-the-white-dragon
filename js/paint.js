'use strict';
// ---------------------------------------------------------------------------
// The painted city. A level is a list of painting operations in world
// coordinates; the world is painted lazily in chunks (T.chunk px square),
// each chunk running only the operations that touch it. Every area is laid in
// short horizontal strokes of close tones (strokeRow), each stroke one tone
// read at its middle, and every block is lit side-on: a lit lip on top, the
// west face lit, soot under, the east face shaded, grime running down.
//
// A chunk is a colour canvas (transparent where the far layer shows through)
// and a glow canvas (what lights itself). Strokes depend only on the place
// and each operation's own seed, so chunks meet without seams.
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

// A pixel buffer over a piece of the world: (ox, oy) is its top left.
class Pix {
  constructor(w, h, ox = 0, oy = 0) {
    this.w = w; this.h = h; this.ox = ox; this.oy = oy; this.n = 1; this.glowed = false;
    this.c = new Uint8ClampedArray(w * h * 4); this.g = new Uint8ClampedArray(w * h * 4);
    this.mid = new Int16Array(w + 16); this.jit = new Float32Array(w + 16);
  }
  put(x, y, col, glow = 0) {
    x = Math.floor(x) - this.ox; y = Math.floor(y) - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !col) return;
    const o = (y * this.w + x) * 4; this.c[o] = col[0]; this.c[o + 1] = col[1]; this.c[o + 2] = col[2]; this.c[o + 3] = 255;
    if (glow) { this.g[o] = col[0] * glow; this.g[o + 1] = col[1] * glow; this.g[o + 2] = col[2] * glow; this.g[o + 3] = 255; this.glowed = true; }
    else this.g[o] = this.g[o + 1] = this.g[o + 2] = this.g[o + 3] = 0;
  }
  // mix what's there towards a colour (haze, steam)
  tint(x, y, col, k) { x = Math.floor(x) - this.ox; y = Math.floor(y) - this.oy; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const o = (y * this.w + x) * 4; if (!this.c[o + 3]) return; this.c[o] = lerp(this.c[o], col[0], k); this.c[o + 1] = lerp(this.c[o + 1], col[1], k); this.c[o + 2] = lerp(this.c[o + 2], col[2], k); }
  // a painted area: inside(x, y) says what's in it, v(x, y) its value (0..1).
  // Flat (PAINT_FLAT): each pixel its own tone, no brushwork; otherwise read at
  // each stroke's middle with a little jitter, so the area reads as brushwork
  area(ax0, ay0, ax1, ay1, ramp, v, o = {}) {
    const seed = o.seed === undefined ? this.n * 13 + 5 : o.seed; this.n++;
    ax0 = Math.floor(ax0); ay0 = Math.floor(ay0); ax1 = Math.ceil(ax1); ay1 = Math.ceil(ay1);
    const x0 = Math.max(this.ox, ax0), y0 = Math.max(this.oy, ay0), x1 = Math.min(this.ox + this.w - 1, ax1), y1 = Math.min(this.oy + this.h - 1, ay1);
    if (x1 < x0 || y1 < y0) return;
    const inside = o.inside || null, J = PAINT_FLAT ? 0 : o.jit === undefined ? 0.45 : o.jit, n = x1 - x0 + 1, glow = o.glow || 0, fog = o.fog || 0, fogc = o.fogc || [20, 16, 30];
    for (let y = y0; y <= y1; y++) {
      strokeRow(this.mid, this.jit, x0, n, y, seed);
      for (let i = 0; i < n; i++) {
        const x = x0 + i; if (inside && !inside(x, y)) continue;
        const m = x0 + this.mid[i], vx = v(x, y), vm = PAINT_FLAT ? vx : m >= ax0 && m <= ax1 && (!inside || inside(m, y)) ? v(m, y) : vx;
        let c = tone(ramp, clamp(vm * 0.6 + vx * 0.4, 0, 1), this.jit[i] * J);
        if (fog) c = mixRgb(c, fogc, fog);
        this.put(x, y, c, glow);
      }
    }
  }
  block(x0, y0, x1, y1, ramp, o = {}) { this.area(x0, y0, x1, y1, ramp, blockV(x0, y0, x1, y1, o), o); }
  // does a world box touch this buffer?
  sees(x0, y0, x1, y1) { return x1 >= this.ox && y1 >= this.oy && x0 < this.ox + this.w && y0 < this.oy + this.h; }
  canvases() {
    const [c, g] = canvasOf(this.w, this.h); g.putImageData(new ImageData(this.c, this.w, this.h), 0, 0);
    let e = null; if (this.glowed) { const [ec, eg] = canvasOf(this.w, this.h); eg.putImageData(new ImageData(this.g, this.w, this.h), 0, 0); e = ec; }
    return { c, e };
  }
}
// The city's painting is flat, like its people: one tone a surface, a crisp
// lit edge on top and a shaded one under, no noise and no brushwork.
const PAINT_FLAT = true;
// side-on lighting for a block
function blockV(x0, y0, x1, y1, o = {}) {
  const base = o.base === undefined ? 0.5 : o.base, s = o.seed || 3, grain = o.grain === undefined ? 0.06 : o.grain, lip = o.lip === undefined ? 1 : o.lip;
  if (PAINT_FLAT) return (x, y) => {
    let v = base;
    const top = y - y0, bot = y1 - y, l = x - x0, r = x1 - x;
    if (lip && top < 1) v = 0.9; if (bot < 1) v -= 0.3; if (l < 1) v += 0.1; if (r < 1) v -= 0.12;
    if (o.drips) { const d = hash(x, 0, s + 5); if (d > 1 - o.drips && top < 3 + (d - 1 + o.drips) / o.drips * (o.dripLen || 40)) v -= 0.12; }
    if (o.bands) { if ((y - y0) % o.bands === 0) v -= 0.16; }
    if (o.panels) { const px = (x - x0) % o.panels[0], py = (y - y0) % o.panels[1]; if (px === 0 || py === 0) v -= 0.16; }
    return v;
  };
  return (x, y) => {
    let v = base + (noise(x / 40, y / 16, s) - 0.5) * 0.14 + (noise(x / 4, y / 30, s + 1) - 0.5) * grain;
    const top = y - y0, bot = y1 - y, l = x - x0, r = x1 - x;
    if (lip) { if (top < 1) v = 0.98; else if (top < 2) v = Math.max(v, 0.8); else if (top < 4) v += 0.1 * lip; }
    if (bot < 1) v -= 0.36; else if (bot < 3) v -= 0.16;
    if (l < 2) v += 0.12; if (r < 2) v -= 0.14;
    if (o.inward) v -= Math.min(o.inward, Math.min(top, bot, l, r) * 0.006);
    if (o.drips) { const d = hash(x, 0, s + 5); if (d > 1 - o.drips && top < 3 + (d - 1 + o.drips) / o.drips * (o.dripLen || 40)) v -= 0.14; }
    if (o.bands) { if ((y - y0) % o.bands === 0) v -= 0.18; else if ((y - y0) % o.bands === 1) v += 0.08; }
    if (o.panels) { const px = (x - x0) % o.panels[0], py = (y - y0) % o.panels[1]; if (px === 0 || py === 0) v -= 0.2; else if (px === 1 || py === 1) v += 0.07; }
    return v;
  };
}

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
const Paint = {
  chunks: new Map(), level: null, queue: [],
  reset(level) { this.chunks.clear(); this.level = level; },
  key: (cx, cy) => cx + ',' + cy,
  has(cx, cy) { return this.chunks.has(this.key(cx, cy)); },
  get(cx, cy) { const k = this.key(cx, cy); let c = this.chunks.get(k); if (!c) { c = paintChunk(this.level, cx, cy); this.chunks.set(k, c); } return c; },
  // paint one chunk not yet painted near (x, y), if there is one: a frame's
  // spare work, so walking into new ground doesn't stall
  ahead(x, y) {
    const CS = T.chunk, L = this.level, cx0 = Math.floor(x / CS), cy0 = Math.floor(y / CS);
    let best = null, bd = 1e9;
    for (let cy = cy0 - 2; cy <= cy0 + 2; cy++) for (let cx = cx0 - 3; cx <= cx0 + 3; cx++) {
      if (cx < 0 || cy < 0 || cx * CS >= L.w || cy * CS >= L.h || this.has(cx, cy)) continue;
      const d = Math.abs(cx - cx0) + Math.abs(cy - cy0); if (d < bd) { bd = d; best = [cx, cy]; }
    }
    if (best) this.get(best[0], best[1]);
    return !!best;
  },
};
function paintChunk(L, cx, cy) {
  const CS = T.chunk, P = new Pix(CS, CS, cx * CS, cy * CS);
  for (const op of L.ops) if (P.sees(op.x0, op.y0, op.x1, op.y1)) { P.n = op.seed; op.fn(P); }
  const { c, e } = P.canvases();
  return { c, e, x: cx * CS, y: cy * CS };
}
