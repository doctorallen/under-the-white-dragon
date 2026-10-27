'use strict';
// A sprite painted from shapes. Builders work in authored px; the shapes are
// rasterized at k art px to each (k = AP: 1, or 3 with FINE GRAIN), so a
// sprite comes out with k x k times the pixels at the same size in the world,
// its edges and shading finer. The runs that give the shading its texture are
// counted in authored px, so the texture holds. A single px() is a k x k
// block (placed to the art px, so dots along a curve stay smooth). done()
// gives the canvas, its size and its anchors in art px.
class Spr {
  constructor(w, h, seed = 1, k = AP) { this.w = w; this.h = h; this.k = k; this.W = w * k; this.H = h * k; this.c = new Array(this.W * this.H).fill(null); this.g = new Uint8Array(this.W * this.H); this.seed = seed; this.n = 0; this.ax = w / 2; this.ay = h; }
  rnd() { return hash(this.n++, 17, this.seed); }
  // one art px
  set(X, Y, col, glow) { if (!col || X < 0 || Y < 0 || X >= this.W || Y >= this.H) return; const i = Y * this.W + X; this.c[i] = typeof col === 'string' ? rgb(col) : col; this.g[i] = glow ? 1 : 0; }
  px(x, y, col, glow) {
    const k = this.k; if (k === 1) { this.set(Math.round(x), Math.round(y), col, glow); return; }
    if (!col) return; const X0 = Math.floor((x + 0.5) * k) - (k >> 1), Y0 = Math.floor((y + 0.5) * k) - (k >> 1);
    for (let Y = Y0; Y < Y0 + k; Y++) for (let X = X0; X < X0 + k; X++) this.set(X, Y, col, glow);
  }
  // one art px at an authored point: a fine dot, for limbs and lines
  dot(x, y, col, glow) { this.set(Math.floor((x + 0.5) * this.k), Math.floor((y + 0.5) * this.k), col, glow); }
  get(x, y) { if (this.k === 1) return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; const k = this.k, X = Math.floor((x + 0.5) * k), Y = Math.floor((y + 0.5) * k); return X < 0 || Y < 0 || X >= this.W || Y >= this.H ? null : this.c[Y * this.W + X]; }
  // a rounded volume: its tone from how it faces the upper left, in runs
  ell(cx, cy, rx, ry, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), lo = o.lo || 0, hi = o.hi === undefined ? R.length - 1 : o.hi, k = this.k;
    for (let Y = Math.floor((cy - ry - 1) * k); Y <= Math.ceil((cy + ry + 1) * k); Y++) {
      let run = 0, rt = 0; const ya = (Y + 0.5) / k, yi = Math.floor(Y / k);
      for (let X = Math.floor((cx - rx - 1) * k); X <= Math.ceil((cx + rx + 1) * k); X++) {
        const u = ((X + 0.5) / k - cx) / rx, v = (ya - cy) / ry, d = u * u + v * v;
        if (d > 1 || (o.mask && !o.mask(Math.floor(X / k), yi))) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d)), s = (u * -0.55 + v * -0.8) * 0.8 + nz * 0.5 - 0.15 + (o.bias || 0);
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.42; run = (2 + ((this.rnd() * 3) | 0)) * k; }
        run--;
        this.set(X, Y, R[clamp(Math.round(lo + (hi - lo) * clamp(s, 0, 1) + rt), lo, hi)], o.glow);
      }
    }
  }
  box(x0, y0, x1, y1, ramp, o = {}) {
    this.ell((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 0.7, (y1 - y0) / 2 + 0.7, ramp, Object.assign({}, o, { mask: (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 }));
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), k = this.k, fill = R[(o.lo || 0) + 1] || R[0];
    if (k === 1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!this.get(x, y)) this.px(x, y, fill, o.glow); return; }
    // (the corners the volume didn't reach, filled flat, art px by art px)
    for (let Y = Math.ceil(y0) * k; Y < (Math.floor(y1) + 1) * k; Y++) for (let X = Math.ceil(x0) * k; X < (Math.floor(x1) + 1) * k; X++) if (X >= 0 && Y >= 0 && X < this.W && Y < this.H && !this.c[Y * this.W + X]) this.set(X, Y, fill, o.glow);
  }
  // a limb from a to b, w wide: lit along its upper-left side
  limb(ax, ay, bx, by, w, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), L = Math.hypot(bx - ax, by - ay) || 1, k = this.k, n = Math.ceil(L * 3 * k), nx = -(by - ay) / L, ny = (bx - ax) / L;
    const put = k === 1 ? (x, y, c) => this.px(x, y, c, o.glow) : (x, y, c) => this.dot(x, y, c, o.glow);
    for (let q = 0; q <= n; q++) {
      const t = q / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      for (let s = -w / 2; s <= w / 2; s += 0.5 / k) { const lit = nx * s * -0.55 + ny * s * -0.8; put(x + nx * s, y + ny * s, R[clamp(Math.round((R.length - 1) * (0.5 + lit * 0.5 / Math.max(0.5, w / 2))), 0, R.length - 1)]); }
    }
  }
  // a capsule from a (radius ra) to b (radius rb): a limb with volume, its
  // tone from how its surface faces the upper left, laid in short runs
  cap(ax, ay, bx, by, ra, rb, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), lo = o.lo || 0, hi = o.hi === undefined ? R.length - 1 : o.hi, k = this.k;
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, m = Math.max(ra, rb) + 1;
    for (let Y = Math.floor((Math.min(ay, by) - m) * k); Y <= Math.ceil((Math.max(ay, by) + m) * k); Y++) {
      let run = 0, rt = 0; const py = (Y + 0.5) / k, yi = Math.floor(Y / k);
      for (let X = Math.floor((Math.min(ax, bx) - m) * k); X <= Math.ceil((Math.max(ax, bx) + m) * k); X++) {
        const px = (X + 0.5) / k, t = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1), qx = ax + dx * t, qy = ay + dy * t, r = ra + (rb - ra) * t;
        const ux = (px - qx) / r, uy = (py - qy) / r, d = ux * ux + uy * uy;
        if (d > 1 || (o.mask && !o.mask(Math.floor(X / k), yi))) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d)), sh = (ux * -0.6 + uy * -0.75) * 0.75 + nz * 0.45 - 0.1 + (o.bias || 0);
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.35; run = (2 + ((this.rnd() * 2) | 0)) * k; }
        run--;
        this.set(X, Y, R[clamp(Math.round(lo + (hi - lo) * clamp(sh, 0, 1) + rt), lo, hi)], o.glow);
      }
    }
  }
  // a shape from a polygon, shaded across each row (lit on its left, shaded on
  // its right) and down it, like cloth over a body
  shape(pts, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), n1 = R.length - 1, k = this.k;
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let Y = Math.floor(y0 * k); Y <= Math.ceil(y1 * k); Y++) {
      const yc = (Y + 0.5) / k, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && yc < b[1]) || (b[1] <= yc && yc < a[1])) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      let run = 0, rt = 0;
      for (let i = 0; i + 1 < xs.length; i += 2) for (let X = Math.ceil(xs[i] * k - 0.5); X <= Math.floor(xs[i + 1] * k - 0.5); X++) {
        const u = ((X + 0.5) / k - xs[i]) / Math.max(1, xs[i + 1] - xs[i]), v = (yc - y0) / Math.max(1, y1 - y0);
        let sh = 0.78 - u * 0.62 - v * (o.down === undefined ? 0.18 : o.down) + (u < 0.18 ? 0.12 : 0) + (yc - y0 < 1.2 ? 0.15 : 0) + (o.bias || 0);
        if (o.folds) sh += Math.sin((X / k) * 1.7 + (Y / k) * 0.2) * 0.06;
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.35; run = (2 + ((this.rnd() * 2) | 0)) * k; }
        run--;
        this.set(X, Y, R[clamp(Math.round(n1 * clamp(sh, 0, 1) + rt), 0, n1)], o.glow);
      }
    }
  }
  poly(pts, col) {
    const k = this.k; let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let Y = Math.floor(y0 * k); Y <= Math.ceil(y1 * k); Y++) {
      const yc = (Y + 0.5) / k, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && yc < b[1]) || (b[1] <= yc && yc < a[1])) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let X = Math.ceil(xs[i] * k - 0.5); X <= Math.floor(xs[i + 1] * k - 0.5); X++) this.set(X, Y, typeof col === 'function' ? col(X / k, Y / k) : col);
    }
  }
  done() {
    const W = this.W, H = this.H, [c, g] = canvasOf(W, H), img = g.createImageData(W, H);
    let glow = false; const [ec, eg] = canvasOf(W, H), eimg = eg.createImageData(W, H);
    for (let i = 0; i < this.c.length; i++) {
      const col = this.c[i]; if (!col) continue;
      img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255;
      if (this.g[i]) { glow = true; eimg.data[i * 4] = col[0]; eimg.data[i * 4 + 1] = col[1]; eimg.data[i * 4 + 2] = col[2]; eimg.data[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0); if (glow) eg.putImageData(eimg, 0, 0);
    return { c, e: glow ? ec : null, w: W, h: H, ax: this.ax * this.k, ay: this.ay * this.k, k: this.k };
  }
}
function flipSprite(s) {
  const f = (src) => { if (!src) return null; const [c, g] = canvasOf(src.width, src.height); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; };
  return Object.assign({}, s, { c: f(s.c), e: f(s.e), ax: s.w - s.ax });
}
