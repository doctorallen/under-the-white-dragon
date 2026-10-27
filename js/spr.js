'use strict';
// A sprite painted from shapes. Props and the city's pieces are shaded in
// soft runs of close tones. Figures (people, enemies, machines) are flat
// (`Spr.figure`): three hard tones a material (shadow, base, light) with no
// noise, a shadow line where one part lies over another (`part`), and a dark
// outline round the whole, so they read as drawn pixel art.
class Spr {
  constructor(w, h, seed = 1) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); this.g = new Uint8Array(w * h); this.p = new Uint8Array(w * h); this.seed = seed; this.n = 0; this.ax = w / 2; this.ay = h; this.flat = false; this.line = false; this.pid = 0; this.soft = new Set(); }
  // a flat figure, outlined
  static figure(w, h, seed) { const S = new Spr(w, h, seed); S.flat = S.line = true; return S; }
  // the next shapes are a new part, drawn over what came before; a part that
  // doesn't cast (hair on a face) leaves no shadow line on what's under it
  part(cast = true) { this.pid = Math.min(255, this.pid + 1); if (!cast) this.soft.add(this.pid); }
  rnd() { return hash(this.n++, 17, this.seed); }
  // a tone from a shading value, flat: shadow, base or light
  band(s, lo, hi) { return lo + Math.round((hi - lo) * (s < 0.32 ? 0.18 : s < 0.7 ? 0.5 : 0.82)); }
  px(x, y, col, glow) { x = Math.round(x); y = Math.round(y); if (!col || x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; this.c[i] = typeof col === 'string' ? rgb(col) : col; this.g[i] = glow ? 1 : 0; this.p[i] = this.pid; }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; }
  // a rounded volume: its tone from how it faces the upper left, in runs
  ell(cx, cy, rx, ry, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), lo = o.lo || 0, hi = o.hi === undefined ? R.length - 1 : o.hi;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      let run = 0, rt = 0;
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, d = u * u + v * v;
        if (d > 1 || (o.mask && !o.mask(x, y))) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d)), s = (u * -0.55 + v * -0.8) * 0.8 + nz * 0.5 - 0.15 + (o.bias || 0);
        if (this.flat) { this.px(x, y, R[this.band(s, lo, hi)], o.glow); continue; }
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.42; run = 2 + ((this.rnd() * 3) | 0); }
        run--;
        this.px(x, y, R[clamp(Math.round(lo + (hi - lo) * clamp(s, 0, 1) + rt), lo, hi)], o.glow);
      }
    }
  }
  box(x0, y0, x1, y1, ramp, o = {}) {
    this.ell((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 0.7, (y1 - y0) / 2 + 0.7, ramp, Object.assign({}, o, { mask: (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 }));
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!this.get(x, y) || (this.flat && this.p[y * this.w + x] !== this.pid)) this.px(x, y, R[(o.lo || 0) + 1] || R[0], o.glow);
  }
  // a limb from a to b, w wide: lit along its upper-left side
  limb(ax, ay, bx, by, w, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), L = Math.hypot(bx - ax, by - ay) || 1, n = Math.ceil(L * 3), nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      for (let s = -w / 2; s <= w / 2; s += 0.5) { const lit = nx * s * -0.55 + ny * s * -0.8; if (this.flat) { this.px(x + nx * s, y + ny * s, R[this.band(0.5 + lit * 0.7 / Math.max(0.5, w / 2), 0, R.length - 1)], o.glow); continue; } this.px(x + nx * s, y + ny * s, R[clamp(Math.round((R.length - 1) * (0.5 + lit * 0.5 / Math.max(0.5, w / 2))), 0, R.length - 1)], o.glow); }
    }
  }
  // a capsule from a (radius ra) to b (radius rb): a limb with volume, its
  // tone from how its surface faces the upper left, laid in short runs
  cap(ax, ay, bx, by, ra, rb, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), lo = o.lo || 0, hi = o.hi === undefined ? R.length - 1 : o.hi;
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, m = Math.max(ra, rb) + 1;
    for (let y = Math.floor(Math.min(ay, by) - m); y <= Math.ceil(Math.max(ay, by) + m); y++) {
      let run = 0, rt = 0;
      for (let x = Math.floor(Math.min(ax, bx) - m); x <= Math.ceil(Math.max(ax, bx) + m); x++) {
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1), qx = ax + dx * t, qy = ay + dy * t, r = ra + (rb - ra) * t;
        const ux = (px - qx) / r, uy = (py - qy) / r, d = ux * ux + uy * uy;
        if (d > 1 || (o.mask && !o.mask(x, y))) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d)), sh = (ux * -0.6 + uy * -0.75) * 0.75 + nz * 0.45 - 0.1 + (o.bias || 0);
        if (this.flat) { this.px(x, y, R[this.band(sh, lo, hi)], o.glow); continue; }
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.35; run = 2 + ((this.rnd() * 2) | 0); }
        run--;
        this.px(x, y, R[clamp(Math.round(lo + (hi - lo) * clamp(sh, 0, 1) + rt), lo, hi)], o.glow);
      }
    }
  }
  // a shape from a polygon, shaded across each row (lit on its left, shaded on
  // its right) and down it, like cloth over a body
  shape(pts, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), n1 = R.length - 1;
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && yc < b[1]) || (b[1] <= yc && yc < a[1])) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      let run = 0, rt = 0;
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) {
        const u = (x + 0.5 - xs[i]) / Math.max(1, xs[i + 1] - xs[i]), v = (yc - y0) / Math.max(1, y1 - y0);
        let sh = 0.78 - u * 0.62 - v * (o.down === undefined ? 0.18 : o.down) + (u < 0.18 ? 0.12 : 0) + (yc - y0 < 1.2 ? 0.15 : 0) + (o.bias || 0);
        if (this.flat) { const L = xs[i + 1] - xs[i], fx = x + 0.5 - xs[i]; this.px(x, y, R[this.band(fx < Math.min(1.6, L * 0.25) || yc - y0 < 1 ? 0.9 : xs[i + 1] - x - 0.5 < Math.min(1.6, L * 0.3) ? 0.1 : 0.5 - (o.down || 0) * 0.3 * v, 0, n1)], o.glow); continue; }
        if (o.folds) sh += Math.sin(x * 1.7 + y * 0.2) * 0.06;
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.35; run = 2 + ((this.rnd() * 2) | 0); }
        run--;
        this.px(x, y, R[clamp(Math.round(n1 * clamp(sh, 0, 1) + rt), 0, n1)], o.glow);
      }
    }
  }
  poly(pts, col) {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && yc < b[1]) || (b[1] <= yc && yc < a[1])) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) this.px(x, y, typeof col === 'function' ? col(x, y) : col);
    }
  }
  // a figure's finish: a shadow line on a part where a later part lies on
  // it, then a dark outline round the whole (not round glow alone)
  finish() {
    const w = this.w, h = this.h, C = this.c, dk = [8, 6, 12], N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const shade = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!C[i] || this.g[i]) continue;
      for (const [dx, dy] of N) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const j = Y * w + X; if (C[j] && this.p[j] > this.p[i] && !this.g[j] && !this.soft.has(this.p[j])) { shade.push(i); break; } }
    }
    for (const i of shade) this.c[i] = mixRgb(this.c[i], dk, 0.45);
    const out = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (C[i]) continue; let best = null, lit = 0;
      for (const [dx, dy] of N) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const j = Y * w + X; if (!C[j]) continue; if (this.g[j]) { lit++; continue; } const L = C[j][0] + C[j][1] + C[j][2]; if (!best || L < best[1]) best = [C[j], L]; }
      if (best) out.push([i, mixRgb(best[0], dk, 0.72)]);
    }
    for (const [i, col] of out) { this.c[i] = col; this.g[i] = 0; }
  }
  done() {
    if (this.line) this.finish();
    const [c, g] = canvasOf(this.w, this.h), img = g.createImageData(this.w, this.h);
    // (a glow canvas only for a sprite with something that glows)
    let glow = false; const eimg = this.g.some((q) => q) ? new ImageData(this.w, this.h) : null;
    for (let i = 0; i < this.c.length; i++) {
      const col = this.c[i]; if (!col) continue;
      img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255;
      if (this.g[i] && eimg) { glow = true; eimg.data[i * 4] = col[0]; eimg.data[i * 4 + 1] = col[1]; eimg.data[i * 4 + 2] = col[2]; eimg.data[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0); let ec = null; if (glow) { const [c2, eg] = canvasOf(this.w, this.h); eg.putImageData(eimg, 0, 0); ec = c2; }
    return { c, e: ec, w: this.w, h: this.h, ax: this.ax, ay: this.ay };
  }
}
function flipSprite(s) {
  const f = (src) => { if (!src) return null; const [c, g] = canvasOf(src.width, src.height); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; };
  return Object.assign({}, s, { c: f(s.c), e: f(s.e), ax: s.w - s.ax });
}

