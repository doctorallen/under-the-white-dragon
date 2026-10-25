'use strict';
// ---------------------------------------------------------------------------
// Sprites, painted from shapes: an ellipse, a box or a limb is shaded by a
// ramp as if lit from the upper left, in short runs of one tone (so figures
// carry the same strokes as the rock), with no outlines. A pixel can glow:
// it goes to the glow layer too and lights itself.
// ---------------------------------------------------------------------------
class Spr {
  constructor(w, h, seed = 1) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); this.g = new Uint8Array(w * h); this.seed = seed; this.n = 0; this.ax = w / 2; this.ay = h; }
  rnd() { return hash(this.n++, 17, this.seed); }
  px(x, y, col, glow) { x = Math.round(x); y = Math.round(y); if (!col || x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.c[y * this.w + x] = typeof col === 'string' ? rgb(col) : col; this.g[y * this.w + x] = glow ? 1 : 0; }
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
        if (run <= 0) { rt = (this.rnd() + this.rnd() - 1) * 0.42; run = 2 + ((this.rnd() * 3) | 0); }
        run--;
        this.px(x, y, R[clamp(Math.round(lo + (hi - lo) * clamp(s, 0, 1) + rt), lo, hi)], o.glow);
      }
    }
  }
  box(x0, y0, x1, y1, ramp, o = {}) {
    this.ell((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 0.7, (y1 - y0) / 2 + 0.7, ramp, Object.assign({}, o, { mask: (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 }));
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!this.get(x, y)) this.px(x, y, R[(o.lo || 0) + 1] || R[0], o.glow);
  }
  // a limb from a to b, w wide: lit along its upper-left side
  limb(ax, ay, bx, by, w, ramp, o = {}) {
    const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), L = Math.hypot(bx - ax, by - ay) || 1, n = Math.ceil(L * 3), nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      for (let s = -w / 2; s <= w / 2; s += 0.5) { const lit = nx * s * -0.55 + ny * s * -0.8; this.px(x + nx * s, y + ny * s, R[clamp(Math.round((R.length - 1) * (0.5 + lit * 0.5 / Math.max(0.5, w / 2))), 0, R.length - 1)], o.glow); }
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
  done() {
    const [c, g] = canvasOf(this.w, this.h), img = g.createImageData(this.w, this.h);
    let glow = false; const [ec, eg] = canvasOf(this.w, this.h), eimg = eg.createImageData(this.w, this.h);
    for (let i = 0; i < this.c.length; i++) {
      const col = this.c[i]; if (!col) continue;
      img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255;
      if (this.g[i]) { glow = true; eimg.data[i * 4] = col[0]; eimg.data[i * 4 + 1] = col[1]; eimg.data[i * 4 + 2] = col[2]; eimg.data[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0); if (glow) eg.putImageData(eimg, 0, 0);
    return { c, e: glow ? ec : null, w: this.w, h: this.h, ax: this.ax, ay: this.ay };
  }
}
function flipSprite(s) {
  const f = (src) => { if (!src) return null; const [c, g] = canvasOf(src.width, src.height); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; };
  return Object.assign({}, s, { c: f(s.c), e: f(s.e), ax: s.w - s.ax });
}

// ---- the small folk ----------------------------------------------------------
// About 28 px tall: a hood with a point (or goggles over it), a round face,
// a coat and waistcoat, a canvas pack, breeches to the knee, big bare feet.
// The kit shows on them: stage 1 goggles, stage 2 copper plates, gloves and
// a lamp on the goggles.
const FOLK = {
  hood: ['#0a120a', '#16241a', '#24381e', '#365028', '#4c6a34', '#6a8a48'],
  skin: ['#4a2618', '#7a4a30', '#b07a52', '#d8a47a', '#f0c8a0'],
  coat: ['#140e08', '#22180e', '#342416', '#4a3420', '#60462c'],
  vest: ['#2a1a0c', '#4a3018', '#6a4824', '#8a6234', '#a87c46'],
  pants: ['#1a140e', '#2a2018', '#3a2e22', '#4a3c2e'],
  pack: ['#2a2014', '#4a3a24', '#6a5636', '#8a744c', '#a89064'],
  wood: ['#3a2414', '#5a3a1e', '#8a5c30', '#a8743e'],
  steel: ['#3a404c', '#6a7280', '#a8b2c0', '#e0e6ee'],
  copper: ['#3a1e0c', '#8a4a1e', '#c87a3a', '#f2b878'],
  lens: ['#1a8a84', '#3af0e0', '#c8fff8'],
  // the pick's head, by tier: the old pick, bronze, iron, mithril
  heads: [null, ['#2a2420', '#4a423a', '#6a6058', '#8a8074'], ['#4a2a10', '#8a5a24', '#c8903a', '#f0c870'], ['#3a404c', '#6a7280', '#a8b2c0', '#e0e6ee'], ['#5a6a80', '#a8c0dc', '#e0f0ff', '#ffffff']],
};
// A frame: pose (legs, arms, the pick), at a kit stage.
function folkFrame(pose, stage, tier = 1) {
  const S = new Spr(30, 32, 7 + pose.k), P = FOLK, head = P.heads[tier] || P.heads[1];
  S.ax = 15; S.ay = 31;
  const bob = pose.bob || 0, fb = pose.feet ? pose.feet[0] : 0, ff = pose.feet ? pose.feet[1] : 0, lb = pose.lift ? pose.lift[0] : 0, lf = pose.lift ? pose.lift[1] : 0;
  const hipY = 21 + bob;
  // the pick, behind everything when carried over the shoulder
  const pick = (hx, hy, tx, ty, back) => {
    S.limb(hx, hy, tx, ty, 1.6, P.wood);
    const dx = tx - hx, dy = ty - hy, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px2 = -uy, py2 = ux;
    S.limb(tx - px2 * 5.5, ty - py2 * 5.5, tx + px2 * 4.5, ty + py2 * 4.5, 1.8, head, { glow: tier >= 4 && !back });
  };
  const handF = pose.handF || [20, 19], handB = pose.handB || [11, 19];
  if (pose.pick === 'shoulder') pick(handF[0], handF[1], 7, 2 + bob, true);
  if (pose.pick === 'raised') pick(handF[0], handF[1], 6, 3, true);
  // back leg and foot
  S.limb(12.5, hipY, 12 + fb, 25.5 - lb, 2.6, P.pants); S.limb(12 + fb, 25.5 - lb, 11.5 + fb, 29 - lb, 2.2, P.skin);
  S.ell(12.6 + fb, 30 - lb, 3.4, 1.5, P.skin, { bias: -0.15 });
  // the pack
  S.box(3, 9 + bob, 9, 20 + bob, P.pack, { lo: 0, hi: 4 }); for (let x = 3; x <= 9; x++) S.px(x, 14 + bob, P.pack[0]);
  // back arm
  S.limb(12, 13 + bob, handB[0], handB[1], 2.2, P.coat);
  // the body: coat, waistcoat, a belt
  S.ell(14, 17 + bob, 5.6, 5.2, P.coat); S.ell(16.4, 17 + bob, 2.6, 3.8, P.vest, { bias: 0.1 });
  for (let x = 9; x <= 19; x++) if (S.get(x, 20 + bob)) S.px(x, 20 + bob, P.pants[0]);
  if (stage >= 2) { S.ell(13, 12.5 + bob, 3.2, 2, P.copper); }
  // front leg and foot
  S.limb(15.5, hipY, 15.5 + ff, 25.5 - lf, 2.6, P.pants); S.limb(15.5 + ff, 25.5 - lf, 16 + ff, 29 - lf, 2.2, P.skin);
  S.ell(17.4 + ff, 30 - lf, 3.6, 1.6, P.skin);
  S.px(16 + ff, 28.6 - lf, P.hood[2]); S.px(17 + ff, 28.6 - lf, P.hood[1]);
  // front arm and hand
  S.limb(15, 13 + bob, handF[0], handF[1], 2.4, P.coat);
  S.ell(handF[0], handF[1], 1.5, 1.5, stage >= 2 ? P.copper : P.skin);
  if (pose.pick === 'strike') pick(handF[0], handF[1], 27, 26, false);
  // the head: hood, its point, the face, an eye, a nose, a cheek
  const hy = 8 + bob;
  S.poly([[9.5, hy - 2], [4.5, hy + 3.5], [10.5, hy + 2]], P.hood[2]);
  S.ell(14, hy, 5.6, 5.4, P.hood);
  S.ell(16.6, hy + 0.8, 3.5, 3.5, P.skin);
  S.px(18, hy, P.skin[0]); S.px(18, hy + 0.9, '#120a06');
  S.px(20.2, hy + 1.5, P.skin[3]); S.px(17, hy + 2.6, '#c8705a');
  if (stage >= 1) { for (let x = 9; x <= 20; x++) S.px(x, hy - 2.6, P.copper[x < 13 ? 1 : 2]); S.px(18.4, hy - 2.6, P.lens[2], true); S.px(19.4, hy - 2.6, P.lens[1], true); S.px(18.4, hy - 1.8, P.lens[0], true); }
  if (stage >= 2) { S.px(20.5, hy - 3.6, '#fff4d8', true); S.px(21.5, hy - 3.6, '#ffe0a0', true); }
  return S.done();
}
const FOLK_POSES = {
  idle0: { k: 0, pick: 'shoulder' }, idle1: { k: 1, pick: 'shoulder', bob: 0.6 },
  walk0: { k: 2, pick: 'shoulder', feet: [-2.5, 2.5], lift: [0, 0], handB: [10, 18], handF: [20, 18] },
  walk1: { k: 3, pick: 'shoulder', feet: [-0.5, 0.5], lift: [1.4, 0], bob: -0.6 },
  walk2: { k: 4, pick: 'shoulder', feet: [2.5, -2.5], lift: [0, 0], handB: [13, 19], handF: [18, 19] },
  walk3: { k: 5, pick: 'shoulder', feet: [0.5, -0.5], lift: [0, 1.4], bob: -0.6 },
  jump: { k: 6, pick: 'shoulder', feet: [-1.5, 1.5], lift: [2.5, 1.5], handB: [9, 15] },
  dig0: { k: 7, pick: 'raised', handF: [18, 12], handB: [12, 14] },
  dig1: { k: 8, pick: 'strike', handF: [22, 20], handB: [17, 19], feet: [-1.5, 1.5] },
  climb0: { k: 9, pick: 'shoulder', feet: [0, 0], lift: [3, 0], handF: [21, 9], handB: [12, 17] },
  climb1: { k: 10, pick: 'shoulder', feet: [0, 0], lift: [0, 3], handF: [20, 16], handB: [13, 9] },
};
const FolkArt = {
  cache: new Map(),
  get(pose, stage, left, tier = 1) {
    const k = pose + '/' + stage + '/' + (left ? 1 : 0) + '/' + tier;
    let s = this.cache.get(k);
    if (!s) { s = folkFrame(FOLK_POSES[pose], stage, tier); if (left) s = flipSprite(s); this.cache.set(k, s); }
    return s;
  },
};

// ---- the props ---------------------------------------------------------------
const WOOD = ['#1c120c', '#3a2618', '#5a3c24', '#7a5636', '#9a7048'];
const STONE = ['#2a2a26', '#45443e', '#626058', '#86837a', '#aaa69a'];
function propSprite(d) {
  let S;
  switch (d.t) {
    case 'door': {
      S = new Spr(30, 32, 41);
      S.ell(15, 16, 14, 14.5, WOOD); S.ell(15, 16.5, 11.5, 12, ['#14301a', '#204a26', '#2f6b34', '#4a8a4a', '#6aa060']);
      for (let x = 7; x <= 23; x += 4) for (let y = 6; y <= 28; y++) if (S.get(x, y) && Math.hypot(x - 15, y - 16.5) < 11.5) S.px(x, y, '#14301a');
      S.ell(16.5, 17, 1.6, 1.6, ['#3a2a10', '#c8a03a', '#f8e08a']);
      for (let y = 22; y < 32; y++) { S.px(1, y, null); }
      break;
    }
    case 'window': { S = new Spr(16, 16, 43); S.ell(8, 8, 7.5, 7.5, WOOD); S.ell(8, 8, 5.4, 5.4, ['#7a3a20', '#e89a50', '#f8d088', '#fff4d0'], { glow: true }); for (let k = -5; k <= 5; k++) { S.px(8 + k, 8, WOOD[1]); S.px(8, 8 + k, WOOD[1]); } S.ay = 0; break; }
    case 'shelves': {
      const w = d.small ? 26 : 38, h = d.small ? 20 : 34; S = new Spr(w, h, 47);
      S.box(0, 0, 2, h - 1, WOOD, { lo: 0, hi: 3 }); S.box(w - 3, 0, w - 1, h - 1, WOOD, { lo: 0, hi: 2 });
      for (let y = 9; y < h; y += 11) S.box(0, y, w - 1, y + 1, WOOD, { lo: 1, hi: 4 });
      break;
    }
    case 'bench': { S = new Spr(40, 16, 49); S.box(0, 0, 39, 3, WOOD, { lo: 1, hi: 4 }); S.box(2, 4, 4, 15, WOOD, { lo: 0, hi: 2 }); S.box(35, 4, 37, 15, WOOD, { lo: 0, hi: 2 }); S.box(28, -3, 33, -1, ['#2a2e34', '#4a525c', '#8a94a0']); S.ell(14, -2, 3, 2.4, ['#0e5a54', '#3ad8c8', '#d8fff8'], { glow: true }); S.ay = 16; S.h = 16; break; }
    case 'lantern': case 'deadLantern': {
      const lit = d.t === 'lantern'; S = new Spr(9, 16, 51); S.ay = 0;
      for (let y = 0; y < 4; y++) S.px(4, y, '#4a4a54');
      for (let y = 4; y < 15; y++) { S.px(1, y, '#8a4a1e'); S.px(7, y, '#c87a3a'); }
      for (let x = 1; x <= 7; x++) { S.px(x, 4, '#c87a3a'); S.px(x, 15, '#8a4a1e'); }
      for (let y = 6; y < 13; y++) for (let x = 3; x <= 5; x++) S.px(x, y, lit ? (y < 9 ? '#fff0b0' : '#f0a040') : y > 10 ? '#2a2420' : '#141210', lit);
      break;
    }
    case 'prop': { const h = 36; S = new Spr(30, h, 61); const W2 = ['#140e0a', '#2a1e14', '#3e2c1e', '#54402a', '#6a5236']; S.box(2, 4, 4, h - 1, W2, { lo: 0, hi: 3 }); S.box(25, 4, 27, h - 1, W2, { lo: 0, hi: 2 }); S.box(0, 0, 29, 3, W2, { lo: 1, hi: 4 }); break; }
    case 'cart': {
      S = new Spr(30, 18, 63); const rust = ['#2a140c', '#4a2414', '#6a3418', '#8a4a22', '#a8642e'].map(rgb);
      S.poly([[2, 2], [28, 2], [25, 13], [5, 13]], (x, y) => rust[clamp(Math.round(3 - x / 14 - y / 9 + hash(x, y, 3) * 1.4), 0, 4)]);
      for (let x = 2; x < 28; x++) S.px(x, 2, rust[4]);
      S.ell(8, 15, 2.6, 2.6, ['#141414', '#2a2a2a', '#4a4a4a']); S.ell(22, 15, 2.6, 2.6, ['#141414', '#2a2a2a', '#4a4a4a']);
      break;
    }
    case 'pillar': { const h = d.h * T.tile; S = new Spr(16, h, 53); S.box(1, h - 5, 14, h - 1, STONE, { lo: 1, hi: 4 }); S.box(3, 5, 12, h - 6, STONE, { lo: 1, hi: 4 }); for (let y = 7; y < h - 7; y++) { S.px(6, y, STONE[0]); S.px(9, y, STONE[1]); } S.box(0, 0, 15, 4, STONE, { lo: 1, hi: 4 }); break; }
    case 'runeDoor': {
      S = new Spr(36, 44, 55); const cx = 18, dark = ['#06070a', '#0c0e12', '#14161c'];
      S.box(0, 10, 35, 43, STONE, { lo: 1, hi: 4 }); S.ell(cx, 14, 18, 14, STONE, { lo: 1, hi: 4, mask: (x, y) => y < 14 });
      S.box(7, 16, 28, 43, dark, { lo: 0, hi: 2 }); S.ell(cx, 18, 11, 9, dark, { lo: 0, hi: 2, mask: (x, y) => y < 18 });
      for (let a = Math.PI * 1.05; a < Math.PI * 1.95; a += 0.16) S.px(cx + Math.cos(a) * 14.5, 15 + Math.sin(a) * 11.5, '#9ccf4a', true);
      for (let y = 18; y < 42; y += 3) { S.px(3, y, '#9ccf4a', true); S.px(32, y, '#9ccf4a', true); }
      break;
    }
    case 'root': { const len = 10 + d.len * 6; S = new Spr(5, len, 57); S.ay = 0; for (let k = 0; k < len; k++) { const x = 2 + Math.round(Math.sin(k * 0.3) * 1.2); S.px(x, k, k % 3 ? '#3a2a18' : '#5a4630'); S.px(x + 1, k, '#1c140c'); } S.px(2, len - 1, '#c8e85a', true); break; }
    case 'barrel': { S = new Spr(16, 20, 71); S.ell(8, 10, 7.5, 9.5, WOOD); for (const y of [4, 15]) for (let x = 1; x < 15; x++) if (S.get(x, y)) S.px(x, y, '#2a2a30'); break; }
    case 'catalog': { S = new Spr(46, 30, 73); S.ay = 0; S.box(0, 0, 45, 29, WOOD, { lo: 0, hi: 2 }); S.box(2, 2, 43, 27, ['#a8885a', '#c9a86a', '#dcc08a'], { lo: 0, hi: 2 }); break; }
    case 'riftArch': {
      S = new Spr(56, 92, 91); const st = ['#14121c', '#221e2e', '#34304a', '#4a4466', '#665e88'];
      S.box(0, 24, 7, 91, st, { lo: 1, hi: 4 }); S.box(48, 24, 55, 91, st, { lo: 0, hi: 3 });
      S.ell(28, 26, 28, 26, st, { lo: 1, hi: 4, mask: (x, y) => y < 26 && ((x - 28) ** 2 / 784 + (y - 26) ** 2 / 676 > 0.62) });
      for (let y = 28; y < 90; y += 4) { S.px(3, y, '#3af0e0', true); S.px(52, y, '#ff4ab0', true); }
      for (let y = 0; y < 66; y++) {
        const t = y / 65, half = Math.max(1, Math.sin(Math.PI * t) * 10 + Math.sin(y * 0.7) * 1.4), off = Math.round(Math.sin(y * 0.18) * 2);
        for (let x = Math.round(28 - half - 2); x <= Math.round(28 + half + 2); x++) {
          const dd = Math.abs(x - 28 - off) - half, c = dd > 1.2 ? null : dd > 0 ? '#3af0e0' : dd > -1.2 ? '#ffffff' : dd > -2.4 ? '#ff6ad8' : '#0c0618';
          if (!c) continue; S.px(x + off, y + 22, c, c !== '#0c0618');
          if (c === '#0c0618' && hash(x, y, 9) > 0.95) S.px(x + off, y + 22, '#ffffff', true);
        }
      }
      break;
    }
    default: S = new Spr(1, 1);
  }
  return S.done();
}

// ---- icons: a find, as the bag and the shelves show it -----------------------
const Icons = {
  cache: new Map(),
  get(item) {
    let c = this.cache.get(item);
    if (!c) {
      const S = new Spr(12, 12, 3);
      paintFind(item, 0, 0, (x, y, col, glow) => S.px(x, y, col, glow), 0.5);
      c = S.done(); c.ax = 6; c.ay = 12;
      this.cache.set(item, c);
    }
    return c;
  },
};
