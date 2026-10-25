'use strict';
// ---------------------------------------------------------------------------
// Drawing a frame. The picture is made small (about T.view.min px on the
// short side) and scaled up by whole pixels. Order: the sky and its hills,
// the painted chunks, the props, the folk, then the light: a banded light
// map, worked out on a 4 px grid fixed to the world (so the bands hold
// still), multiplied over everything; then whatever glows is added back on
// top, with a soft bloom round it.
// ---------------------------------------------------------------------------
const View = {
  cv: null, g: null, low: null, lg: null, gl: null, gg: null, bl: null, bg: null, lc: null, lgc: null, limg: null,
  scale: 1, w: 0, h: 0, LC: 4,
  init() { this.cv = $('view'); this.g = this.cv.getContext('2d'); addEventListener('resize', () => this.resize()); this.resize(); },
  resize() {
    const dpr = window.devicePixelRatio || 1, W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    this.scale = Math.max(1, Math.floor(Math.min(W, H) / T.view.min));
    this.w = Math.ceil(W / this.scale); this.h = Math.ceil(H / this.scale);
    this.cv.width = W; this.cv.height = H;
    [this.low, this.lg] = canvasOf(this.w, this.h);
    [this.gl, this.gg] = canvasOf(this.w, this.h);
    [this.bl, this.bg] = canvasOf(Math.ceil(this.w / 4), Math.ceil(this.h / 4)); this.bg.imageSmoothingEnabled = true;
    const lw = Math.ceil(this.w / this.LC) + 2, lh = Math.ceil(this.h / this.LC) + 2;
    [this.lc, this.lgc] = canvasOf(lw, lh); this.limg = this.lgc.createImageData(lw, lh);
    Sky.cache = null;
  },
};

// ---- the sky: an evening, painted in bands, hills behind, a ringed moon ----
const Sky = {
  cache: null,
  build() {
    const TL = T.tile, top = -220, bot = (World.S + 6) * TL, H = bot - top, W = View.w + 8;
    const [c, g] = canvasOf(W, H), img = g.createImageData(W, H), d = img.data;
    const ramp = rampOf(['#1a2244', '#34406a', '#6a5a7a', '#c07a6a', '#f0b078'], 12, 0.3, 0.4);
    const mid = new Int16Array(W), jit = new Float32Array(W);
    for (let y = 0; y < H; y++) {
      strokeRow(mid, jit, 0, W, y, 77);
      const t = clamp((y + top + 220) / (H - 10), 0, 1);
      for (let x = 0; x < W; x++) { const col = tone(ramp, Math.pow(t, 1.4) * 0.92 + 0.04, jit[x] * 0.7), o = (y * W + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    // the hills: two layers that repeat, the far one bluer
    const hills = [];
    for (const [k, anchors, amp, base] of [[0, ['#2a2a48', '#3a3a5a', '#4e4a68'], 46, 0.55], [1, ['#1e2a22', '#2a3c2a', '#3a5236'], 34, 0.7]]) {
      const HW = 640, HH = 120, [hc, hg] = canvasOf(HW, HH), him = hg.createImageData(HW, HH), hd = him.data, r = rampOf(anchors, 7, 0.4, 0.15);
      for (let x = 0; x < HW; x++) {
        const a = (x / HW) * Math.PI * 2, top2 = HH * base - amp * (0.5 * Math.sin(a * 2 + k) + 0.3 * Math.sin(a * 5 + k * 3) + 0.2 * Math.sin(a * 11)) - 6;
        for (let y = Math.max(0, Math.floor(top2)); y < HH; y++) { const v = clamp(0.75 - (y - top2) / 60 + (hash(x >> 2, y, 9 + k) - 0.5) * 0.25 + (y - top2 < 2 ? 0.25 : 0), 0, 1), col = tone(r, v), o = (y * HW + x) * 4; hd[o] = col[0]; hd[o + 1] = col[1]; hd[o + 2] = col[2]; hd[o + 3] = 255; }
      }
      hg.putImageData(him, 0, 0); hills.push(hc);
    }
    // the moon, ringed (it isn't the one the old stories talk about)
    const [mc, mg] = canvasOf(40, 24), ms = new Spr(40, 24, 5);
    ms.ell(20, 12, 7, 7, ['#6a6070', '#a89aa8', '#e0d4d8', '#fff4ec']);
    for (let a = 0; a < Math.PI * 2; a += 0.02) { const x = 20 + Math.cos(a) * 17, y = 12 + Math.sin(a) * 3.4; if (Math.sin(a) < 0 && Math.hypot(x - 20, y - 12) < 7.2) continue; ms.px(x, y, Math.sin(a) > 0 ? '#f8e0c0' : '#a88a7a'); }
    mg.drawImage(ms.done().c, 0, 0);
    this.cache = { c, top, hills, moon: mc };
  },
  draw(g, cx, cy) {
    if (!this.cache) this.build();
    const C = this.cache, TL = T.tile;
    g.drawImage(C.c, 0, C.top - cy);
    g.drawImage(C.moon, Math.round(View.w * 0.72 - cx * 0.02), Math.round(-150 - cy * 0.3 + 40));
    const base = World.S * TL;
    C.hills.forEach((hc, k) => {
      const f = k ? 0.45 : 0.22, y = Math.round(base - 120 + 26 - (k ? 0 : 30) - cy + (cy - base) * (k ? 0.2 : 0.4) * 0);
      let x = -(((cx * f) % hc.width) + hc.width) % hc.width;
      for (; x < View.w; x += hc.width) g.drawImage(hc, Math.round(x), y);
    });
  },
};

// ---- props: painted once each ---------------------------------------------
const Decor = {
  spr(d) { if (!d._s) d._s = propSprite(d); return d._s; },
  pos(d) { const s = this.spr(d), TL = T.tile; return [d.t === 'riftArch' ? d.x * TL + TL / 2 - s.w / 2 : d.x * TL, d.y * TL - s.ay]; },
  torch: null, lad: null,
  ladderSprite() {
    if (!this.lad) { const S = new Spr(12, 12, 4); S.ay = 0; for (let y = 0; y < 12; y++) { S.px(2, y, y % 4 ? '#6a4a2c' : '#8a6438'); S.px(1, y, '#3a2616'); S.px(9, y, y % 4 ? '#5a3e24' : '#7a5430'); S.px(10, y, '#2a1c10'); } for (const y of [2, 8]) for (let x = 3; x < 9; x++) S.px(x, y, x < 5 ? '#e8a060' : '#b8642a'); this.lad = S.done(); }
    return this.lad;
  },
  torchSprite() {
    if (!this.torch) { const S = new Spr(6, 12, 3); S.ay = 0; for (let y = 5; y < 12; y++) S.px(2, y, y % 3 ? '#5a3a20' : '#3a2414'); S.px(2, 2, '#fff4c0', true); S.px(1, 3, '#f8c050', true); S.px(2, 3, '#ffe890', true); S.px(3, 3, '#f8a040', true); S.px(2, 4, '#e07020', true); S.px(1, 4, '#c04010', true); S.px(3, 4, '#c04010', true); this.torch = S.done(); }
    return this.torch;
  },
};

function render() {
  const V = View, g = V.lg, gg = V.gg, TL = T.tile, w = V.w, h = V.h;
  const cx = Math.round(Game.cam.x - w / 2), cy = Math.round(Game.cam.y - h / 2);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  gg.globalCompositeOperation = 'source-over'; gg.fillStyle = '#000'; gg.fillRect(0, 0, w, h);
  g.fillStyle = '#08060c'; g.fillRect(0, 0, w, h);
  if (cy < (World.S + 6) * TL) Sky.draw(g, cx, cy);
  // the painted world
  const CS = T.world.chunk * TL;
  for (let ky = Math.floor(cy / CS); ky <= Math.floor((cy + h) / CS); ky++) for (let kx = Math.floor(cx / CS); kx <= Math.floor((cx + w) / CS); kx++) {
    if (kx < 0 || ky < 0 || kx * CS >= World.w * TL || ky * CS >= World.h * TL) continue;
    const ch = Paint.get(kx, ky);
    g.drawImage(ch.c, ch.x - cx, ch.y - cy);
    if (ch.e) gg.drawImage(ch.e, ch.x - cx, ch.y - cy);
  }
  // props
  for (const d of World.decor) {
    const s = Decor.spr(d), [x, y] = Decor.pos(d);
    if (x - cx > w || y - cy > h || x + s.w - cx < 0 || y + s.h - cy < 0) continue;
    g.drawImage(s.c, Math.round(x - cx), Math.round(y - cy));
    if (s.e) gg.drawImage(s.e, Math.round(x - cx), Math.round(y - cy));
    if (d.t === 'shelves' && !d.small) drawShelf(g, gg, x - cx, y - cy);
    if (d.t === 'catalog') drawBoard(g, x - cx, y - cy);
  }
  // ladders
  const ls = Decor.ladderSprite(), lx0 = Math.floor(cx / TL), lx1 = Math.floor((cx + w) / TL), ly0 = Math.floor(cy / TL), ly1 = Math.floor((cy + h) / TL);
  for (const i of Ladders.set) { const tx = i % World.w, ty = (i / World.w) | 0; if (tx < lx0 || tx > lx1 || ty < ly0 || ty > ly1) continue; g.drawImage(ls.c, tx * TL - cx, ty * TL - cy); }
  // torches
  const ts = Decor.torchSprite();
  for (const [tx, ty] of Game.s.placed) { const x = tx * TL + 3 - cx, y = ty * TL - cy; if (x < -8 || y < -14 || x > w || y > h) continue; g.drawImage(ts.c, x, y); gg.drawImage(ts.e, x, y); }
  // the dig: cracks across the tile
  const D = Player.digT;
  if (D) {
    const p = clamp(D.t / D.need, 0, 1), x0 = D.x * TL - cx, y0 = D.y * TL - cy;
    g.fillStyle = 'rgba(8,6,12,0.75)';
    for (let k = 0; k < Math.floor(p * 9); k++) { let x = 6 + Math.floor((hash(k, D.x, D.y) - 0.5) * 6), y = 6; for (let s = 0; s < 6; s++) { g.fillRect(x0 + x, y0 + y, 1, 1); x += Math.round((hash(k, s, D.x + D.y) - 0.5) * 3); y += hash(k, s, 3) > 0.5 ? 1 : -1; x = clamp(x, 0, 11); y = clamp(y, 0, 11); } }
  }
  // the folk
  const fs = FolkArt.get(Player.pose(), Game.stage(), Player.face < 0, Game.s.pick);
  const fx = Math.round(Player.x - fs.ax - cx), fy = Math.round(Player.y - fs.ay - cy + Player.stepOff + 1);
  g.drawImage(fs.c, fx, fy); if (fs.e) gg.drawImage(fs.e, fx, fy);
  // chips
  for (const p of Game.particles) { g.fillStyle = p.c; g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1); }
  // the light
  lightMap(cx, cy);
  g.globalCompositeOperation = 'multiply';
  const LC = V.LC, ox = -(((cx % LC) + LC) % LC), oy = -(((cy % LC) + LC) % LC);
  g.drawImage(V.lc, 0, 0, V.lc.width, V.lc.height, ox, oy, V.lc.width * LC, V.lc.height * LC);
  // and what glows, with its bloom
  g.globalCompositeOperation = 'lighter';
  g.drawImage(V.gl, 0, 0);
  V.bg.clearRect(0, 0, V.bl.width, V.bl.height); V.bg.drawImage(V.gl, 0, 0, V.bl.width, V.bl.height);
  g.imageSmoothingEnabled = true; g.globalAlpha = 0.8;
  g.drawImage(V.bl, -2, -2, w + 4, h + 4);
  g.globalAlpha = 1; g.imageSmoothingEnabled = false; g.globalCompositeOperation = 'source-over';
  // up to the screen
  V.g.imageSmoothingEnabled = false;
  V.g.drawImage(V.low, 0, 0, w * V.scale, h * V.scale);
}

// the curios on the home shelves, four to a board, in catalog order
function drawShelf(g, gg, x, y) {
  const have = ITEM_ORDER.filter((k) => ITEMS[k].kind === 'curio' && Game.s.store[k] > 0);
  have.slice(0, 12).forEach((k, i) => {
    const ic = Icons.get(k), bx = Math.round(x + 2 + (i % 4) * 8.5 - 2), by = Math.round(y + 9 + Math.floor(i / 4) * 11 - 10);
    g.drawImage(ic.c, bx, by); if (ic.e) gg.drawImage(ic.e, bx, by);
  });
}
// the catalog board: a swatch pinned up for everything found
function drawBoard(g, x, y) {
  ITEM_ORDER.forEach((k, i) => {
    const bx = Math.round(x + 5 + (i % 6) * 6.2), by = Math.round(y + 5 + Math.floor(i / 6) * 7);
    const c = Game.s.catalog[k] ? ITEMS[k].col : ['#6a5232', '#7a6040', '#7a6040'];
    g.fillStyle = c[1]; g.fillRect(bx, by, 4, 4); g.fillStyle = c[2]; g.fillRect(bx, by, 2, 1); g.fillStyle = c[0]; g.fillRect(bx + 1, by + 4, 3, 1);
  });
}

// ---- the light map ---------------------------------------------------------
const TINT = { cellars: [0.95, 0.86, 0.76], diggings: [0.82, 0.8, 0.84], oldgrowth: [0.72, 0.88, 0.8], seam: [0.78, 0.62, 1.0] };
function ambientAt(d) {
  const A = T.light.ambient;
  if (d <= A[0][0]) return A[0][1];
  for (let i = 1; i < A.length; i++) if (d < A[i][0]) return lerp(A[i - 1][1], A[i][1], (d - A[i - 1][0]) / (A[i][0] - A[i - 1][0]));
  return A[A.length - 1][1];
}
function lights(cx, cy) {
  const TL = T.tile, L = [], t = Game.t, w = View.w, h = View.h;
  const lamp = T.light.lantern[Game.s.lamp], lc = Game.s.lamp >= 2 ? [0.82, 0.96, 1.05] : T.light.lanternCol;
  L.push({ x: Player.x + Player.face * 3, y: Player.y - 18, r: lamp * (1 + Math.sin(t * 9) * 0.015), c: lc });
  for (const d of World.decor) {
    const near = (x, y, r) => x > cx - r && x < cx + w + r && y > cy - r && y < cy + h + r;
    if (d.t === 'lantern' && d.lit) { const x = d.x * TL + 4, y = d.y * TL + 10; if (near(x, y, 120)) L.push({ x, y, r: 120, c: [1.05, 0.85, 0.6] }); }
    if (d.t === 'riftArch') { const x = d.x * TL + 6, y = d.y * TL - 50; if (near(x, y, 170)) { L.push({ x: x - 4, y, r: 170, c: [0.9, 0.4, 1.0] }); L.push({ x: x + 4, y: y + 20, r: 110, c: [0.3, 1.0, 0.95] }); } }
    if (d.t === 'window') { const x = d.x * TL + 8, y = d.y * TL + 8; if (near(x, y, 60)) L.push({ x, y: y + 10, r: 60, c: [0.9, 0.7, 0.45] }); }
  }
  for (const [tx, ty] of Game.s.placed) { const x = tx * TL + 6, y = ty * TL + 3, r = T.torch.reach; if (x > cx - r && x < cx + w + r && y > cy - r && y < cy + h + r) L.push({ x, y, r: r * (1 + Math.sin(t * 13 + tx) * 0.04 + Math.sin(t * 7.3 + ty) * 0.03), c: [1.05, 0.72, 0.4] }); }
  return L;
}
function lightMap(cx, cy) {
  const V = View, LC = V.LC, lw = V.lc.width, lh = V.lc.height, d = V.limg.data, TL = T.tile, bands = T.light.bands;
  const gx0 = Math.floor(cx / LC), gy0 = Math.floor(cy / LC), L = lights(cx, cy);
  for (let j = 0; j < lh; j++) {
    const wy = (gy0 + j) * LC + LC / 2, ty = Math.floor(wy / TL), strat = World.stratum(ty), tint = TINT[strat.id] || [1, 1, 1];
    for (let i = 0; i < lw; i++) {
      const wx = (gx0 + i) * LC + LC / 2, tx = clamp(Math.floor(wx / TL), 0, World.w - 1);
      let r, g, b;
      if (World.isSky(tx, ty)) { r = 1; g = 0.97; b = 0.94; }
      else {
        const a = ambientAt(wy / TL - World.sy[tx]), u = clamp((wy / TL - World.sy[tx]) / 8, 0, 1);
        r = a * lerp(1, tint[0], u); g = a * lerp(0.97, tint[1], u); b = a * lerp(0.94, tint[2], u);
      }
      for (const l of L) {
        const dx = wx - l.x, dy = wy - l.y, dd = dx * dx + dy * dy; if (dd > l.r * l.r) continue;
        const f = Math.pow(1 - Math.sqrt(dd) / l.r, 1.35) * 1.1;
        r += f * l.c[0]; g += f * l.c[1]; b += f * l.c[2];
      }
      // bands: stepped, the step edges broken by a little dither fixed to the world
      // (the brightness is stepped, the hue kept, so the steps don't go speckled)
      const dz = (hash(gx0 + i, gy0 + j, 13) - 0.5) * 0.6, mx = Math.max(r, g, b, 0.001), qm = clamp(Math.round(Math.min(mx, 1) * bands + dz) / bands, 1 / bands, 1), k = (qm / mx) * 255;
      const o = (j * lw + i) * 4; d[o] = Math.min(255, r * k); d[o + 1] = Math.min(255, g * k); d[o + 2] = Math.min(255, b * k); d[o + 3] = 255;
    }
  }
  V.lgc.putImageData(V.limg, 0, 0);
}
