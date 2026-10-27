'use strict';
// ---------------------------------------------------------------------------
// Drawing a frame. The picture is made small (about T.view.min px on the
// short side) and scaled up by whole pixels. The far layer, the painted
// chunks and the props are drawn, then the light: a light map worked out on a
// 4 px grid fixed to the world and scaled up smooth, multiplied over them. People are lit after that, each by the light where they stand
// but never below a floor, so a figure always reads against the wall. Then
// the parts of props in front of people, what glows (with a bloom), the wet
// ground's reflections, and the rain.
// ---------------------------------------------------------------------------
const View = {
  cv: null, g: null, low: null, lg: null, gl: null, gg: null, bl: null, bg: null, bl2: null, bg2: null, lc: null, lgc: null, limg: null, tmp: null, tg: null,
  scale: 1, w: 0, h: 0, LC: 4, out: 1, q: 3, cx: 0, cy: 0, cxA: 0, cyA: 0,
  // WebGL2 finishes the frame where there is one (gl.js); else the 2D canvas
  init() { this.cv = $('view'); if (!GL.init(this.cv)) this.g = this.cv.getContext('2d'); addEventListener('resize', () => this.resize()); this.resize(); },
  // the view's canvases are in art px (AP to a world px): about T.view.min
  // world px on the short side, so T.view.min x AP art px; scale is device
  // px to an art px. The world is framed the same at either grain: a whole
  // number of device px to a world px, so at a fine grain the scale to an
  // art px can be a fraction (4/3 on a desktop), and then the frame is made
  // at the next whole number up and the browser brings it down smoothly.
  resize() {
    const dpr = window.devicePixelRatio || 1, W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    const sw = clamp(Math.round(Math.min(W, H) / T.view.min), 1, T.view.maxScale);
    this.scale = sw / AP;
    this.w = Math.ceil(W / sw) * AP; this.h = Math.ceil(H / sw) * AP;
    // the finished frame is made at `out` screen pixels to a view pixel (at
    // most q, the quality: 3, or less when frames run slow) and the browser
    // scales it the rest of the way, crisply: far fewer pixels to finish than
    // the screen's own, for a picture that's made of big pixels anyway
    const q = Dev.s.res && Dev.s.res !== 'auto' ? +Dev.s.res : this.q;
    this.out = Math.max(1, Math.min(Math.ceil(this.scale), q));
    this.cv.style.imageRendering = this.out > this.scale ? 'auto' : '';
    this.cv.width = this.w * this.out; this.cv.height = this.h * this.out;
    this.cv.style.width = (this.w * this.scale) / dpr + 'px'; this.cv.style.height = (this.h * this.scale) / dpr + 'px';
    [this.low, this.lg] = canvasOf(this.w, this.h);
    [this.gl, this.gg] = canvasOf(this.w, this.h);
    [this.bl, this.bg] = canvasOf(Math.ceil(this.w / 4), Math.ceil(this.h / 4)); this.bg.imageSmoothingEnabled = true;
    [this.bl2, this.bg2] = canvasOf(Math.ceil(this.w / 10), Math.ceil(this.h / 10)); this.bg2.imageSmoothingEnabled = true;
    // the light map stays a grid in world px (LC to a cell), so the light keeps its softness at any grain
    const lw = Math.ceil(this.w / (this.LC * AP)) + 2, lh = Math.ceil(this.h / (this.LC * AP)) + 2;
    [this.lc, this.lgc] = canvasOf(lw, lh); this.limg = this.lgc.createImageData(lw, lh);
    [this.tmp, this.tg] = canvasOf(128 * AP, 128 * AP);
  },
  // art px from the left and top of the view, for a world point
  sx(x) { return Math.round(x * AP - this.cxA); }, sy(y) { return Math.round(y * AP - this.cyA); },
};
// Drawing in world px where it's simplest (flat rects, dots, glyphs): a
// context scaled by AP, its origin on the world grid nearest the view's
// corner (ix, iy, whole world px) and the rest of the way in art px, so
// whole world px land on whole art px. drawWorld(g, fn) runs fn(ix, iy) so.
function worldGrid(g, fn, offA = 0, offB = 0) {
  if (AP === 1) { fn(View.cxA - offA, View.cyA - offB); return; }
  const ax = View.cxA - offA, ay = View.cyA - offB, ix = Math.floor(ax / AP), iy = Math.floor(ay / AP);
  g.setTransform(AP, 0, 0, AP, ix * AP - ax, iy * AP - ay); fn(ix, iy); g.setTransform(1, 0, 0, 1, 0, 0);
}

function render() {
  const V = View, g = V.lg, gg = V.gg, w = V.w, h = V.h, L = World.L, A = AP;
  const cxA = Math.round(clamp(Game.cam.x * A - w / 2, 0, Math.max(0, L.w * A - w))), cyA = Math.round(clamp(Game.cam.y * A - h / 2, 0, Math.max(0, L.h * A - h)));
  const cx = cxA / A, cy = cyA / A, ww = w / A, wh = h / A;
  V.cx = cx; V.cy = cy; V.cxA = cxA; V.cyA = cyA;
  const SX = (x) => Math.round(x * A - cxA), SY = (y) => Math.round(y * A - cyA);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = '#08060c'; g.fillRect(0, 0, w, h);
  gg.globalCompositeOperation = 'source-over'; gg.fillStyle = '#000'; gg.fillRect(0, 0, w, h);
  if (Flight.on) { Flight.draw(g, gg, w, h); finishFrame([]); return; }
  // the far layer
  if (World.far) { const F = World.far, fx = -Math.round(cxA * F.f), fy = -Math.round(cyA * F.fy); g.drawImage(F.c, fx, fy); if (F.e) gg.drawImage(F.e, fx, fy); }
  // the layers of the city behind, back to front: each hides the glow of
  // those behind it, then its own holograms, train and traffic go on top
  World.layers.forEach((F, i) => {
    const fx = -Math.round(cxA * F.f), fy = -Math.round(cyA * F.fy + (L.layerDy || 0) * A);
    g.drawImage(F.c, fx, fy);
    gg.globalCompositeOperation = 'destination-out'; gg.drawImage(F.c, fx, fy); gg.globalCompositeOperation = 'source-over';
    if (F.e) gg.drawImage(F.e, fx, fy);
    Skyline.draw(i, g, gg, fx, fy); Life.drawTraffic(g, gg, cx, cy, i);
  });
  if (!World.layers.length) Life.drawTraffic(g, gg, cx, cy);
  // the painted chunks
  const CS = Paint.CS;
  for (let ky = Math.floor(cy / CS); ky <= Math.floor((cy + wh) / CS); ky++) for (let kx = Math.floor(cx / CS); kx <= Math.floor((cx + ww) / CS); kx++) {
    if (kx < 0 || ky < 0 || kx * CS >= L.w || ky * CS >= L.h) continue;
    const ch = Paint.get(kx, ky), x = SX(ch.x), y = SY(ch.y);
    g.drawImage(ch.c, x, y);
    // the near city hides the far layer's glow behind it
    gg.globalCompositeOperation = 'destination-out'; gg.drawImage(ch.c, x, y); gg.globalCompositeOperation = 'source-over';
    if (ch.e) gg.drawImage(ch.e, x, y);
  }
  // flickering signs and tubes: their glow dims with their light
  for (const f of L.flicks) { if (f.x1 < cx || f.x0 > cx + ww || f.y1 < cy || f.y0 > cy + wh) continue; const k = Life.flick(f.fl); if (k > 0.97) continue; const x = SX(f.x0), y = SY(f.y0), fw = (f.x1 - f.x0) * A, fh = (f.y1 - f.y0) * A; gg.globalCompositeOperation = 'destination-out'; gg.fillStyle = `rgba(0,0,0,${1 - k})`; gg.fillRect(x, y, fw, fh); gg.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(0,0,0,${(1 - k) * 0.55})`; g.fillRect(x, y, fw, fh); }
  worldGrid(gg, (ix, iy) => Life.drawAds(gg, ix, iy));
  // props
  for (const p of World.props) {
    const s = Props.sprite(p); if (!s) continue;
    const x = Math.round(p.x * A - s.ax - cxA), y = Math.round(p.y * A - s.ay - cyA);
    if (x > w || y > h || x + s.w < 0 || y + s.h < 0) continue;
    g.drawImage(s.c, x, y); if (s.e) gg.drawImage(s.e, x, y);
  }
  Life.drawWorld(g, gg, cx, cy);
  // the light: a grid of LC world px, LCA art px a cell
  lightMap(cx, cy);
  const LC = V.LC, LCA = LC * A, lw = V.lc.width, lh = V.lc.height, ox = Math.floor(cx / LC) * LCA - cxA, oy = Math.floor(cy / LC) * LCA - cyA;
  // the light is smooth: its grid is scaled up with filtering, so no cell edges show
  g.imageSmoothingEnabled = true;
  g.globalCompositeOperation = 'multiply'; g.drawImage(V.lc, ox - LCA / 2, oy - LCA / 2, lw * LCA, lh * LCA);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.1; g.drawImage(V.lc, ox - LCA / 2, oy - LCA / 2, lw * LCA, lh * LCA); g.globalAlpha = 1;
  g.imageSmoothingEnabled = false;
  g.globalCompositeOperation = 'source-over';
  // people, enemies, the runner
  const litMax = A > 1 ? 8 : 24;
  const actor = (s, x, y, flash) => {
    const sx = Math.round(x * A - s.ax - cxA), sy = Math.round(y * A - s.ay - cyA);
    if (sx > w || sy > h || sx + s.w < 0 || sy + s.h < 0) return;
    const col = lightAt(sx + s.w / 2, sy + s.h * 0.55, ox, oy);
    // the sprite lit by that colour, kept: most figures stand in the same light frame after frame
    const key = flash ? 'f' : ((col[0] >> 3) << 10) | ((col[1] >> 3) << 5) | (col[2] >> 3);
    if (!s.lit) s.lit = new Map();
    let lc = s.lit.get(key);
    if (!lc) {
      if (s.lit.size > litMax) s.lit.clear();
      const [c, t] = canvasOf(s.w, s.h);
      t.drawImage(s.c, 0, 0);
      t.globalCompositeOperation = 'multiply'; t.fillStyle = flash ? '#ffffff' : css(col.map((q) => ((q >> 3) << 3) + 4)); t.fillRect(0, 0, s.w, s.h);
      t.globalCompositeOperation = 'destination-in'; t.drawImage(s.c, 0, 0);
      if (flash) { t.globalCompositeOperation = 'source-atop'; t.fillStyle = 'rgba(255,255,255,0.7)'; t.fillRect(0, 0, s.w, s.h); }
      lc = c; s.lit.set(key, lc);
    }
    g.drawImage(lc, sx, sy);
    // what glows behind a figure is hidden by it
    occlude(s.c, sx, sy);
    if (s.e) gg.drawImage(s.e, sx, sy);
    return [sx, sy];
  };
  const D = A > 1 ? 2 : 1; // a dot of light: finer than a world px at a fine grain
  for (const n of Actors.npcs) if (!n.hidden) {
    // standing still, everyone breathes; vendors work their hands
    const br = (Game.t * 0.7 + n.i * 0.37) % 1 < 0.5, pose = n.moving ? 'walk' + (Math.floor((n.walked || 0) / 4.6) % 6) : n.act === 'sit' ? 'sit' : n.act === 'work' && (Game.t * 1.6 + n.i) % 1 < 0.5 ? 'work' : br ? 'breathe' : 'stand';
    actor(Actors.art(n, pose, n.face < 0), n.x, n.y);
    if (n.def.smoke) { const on = (Game.t * 0.4 + n.i) % 1 < 0.3; gg.fillStyle = on ? '#ffb040' : '#a83a10'; gg.fillRect(SX(n.x + n.face * 6), SY(n.y - 24), D, D); }
  }
  for (const p of World.props) if (p.front) { if (!p.frontSpr) p.frontSpr = lowerPart(Props.sprite(p), p.front * A); const s = p.frontSpr, sx = Math.round(p.x * A - s.ax - cxA), sy = Math.round(p.y * A - s.ay - cyA); if (sx < w && sx + s.w > 0 && sy < h && sy + s.h > 0) { if (V.tmp.width < s.w || V.tmp.height < s.h) { V.tmp.width = Math.max(V.tmp.width, s.w); V.tmp.height = Math.max(V.tmp.height, s.h); } const t = V.tg; t.globalCompositeOperation = 'copy'; t.drawImage(s.c, 0, 0); t.globalCompositeOperation = 'multiply'; t.imageSmoothingEnabled = true; t.drawImage(V.lc, 0, 0, lw, lh, ox - LCA / 2 - sx, oy - LCA / 2 - sy, lw * LCA, lh * LCA); t.imageSmoothingEnabled = false; t.globalCompositeOperation = 'destination-in'; t.drawImage(s.c, 0, 0); g.drawImage(V.tmp, 0, 0, s.w, s.h, sx, sy, s.w, s.h); occlude(s.c, sx, sy); if (s.e) gg.drawImage(s.e, sx, sy); } }
  for (const b of Actors.bodies) { const s = Actors.bodyArt(b), x = SX(b.x), y = SY(b.y); g.fillStyle = 'rgba(60,4,10,0.55)'; g.fillRect(x - 9 * A, y - A, 18 * A, 2 * A); actor(s, b.x, b.y + 1); }
  for (const e of Actors.enemies) { const s = Actors.enemyArt(e), at = actor(s, e.x, e.type === 'drone' ? e.y + 6 : e.y - (e.hop || 0), e.flash > 0); if (at) tag(e, s, at[0], at[1]); }
  if (Player.inv <= 0 || Math.floor(Game.t * 16) % 2) actor(RunnerArt.get(Player.pose(), Player.face < 0), Player.x, Player.y + 1);
  // bolts and sparks: all glow
  for (const b of Actors.bolts) {
    const x = SX(b.x), y = SY(b.y); gg.fillStyle = css(b.c);
    if (b.player) { const sp = Math.hypot(b.vx, b.vy), ux = b.vx / sp, uy = b.vy / sp; for (let k = 0; k < 7 * A; k++) { gg.fillStyle = k < 2 * A ? '#fff4d8' : css(b.c.map((q) => q * (1 - k / (9 * A)))); gg.fillRect(Math.round(x - ux * k), Math.round(y - uy * k), D, D); } continue; }
    if (b.wave) gg.fillRect(x - 3 * A, y - 8 * A, 6 * A, 10 * A); else { gg.fillRect(x - 2 * A, y - A, 4 * A, 2 * A); gg.fillStyle = '#fff'; gg.fillRect(x - A, y - A, 2 * A, 2 * A); }
  }
  worldGrid(gg, (ix, iy) => Life.drawGlints(gg, ix, iy));
  for (const p of Game.particles) { gg.fillStyle = css(p.c); gg.fillRect(SX(p.x), SY(p.y), D, D); }
  // rain, brighter where the light is: each drop two short strokes, drawn
  // in four batches by brightness (a stroke an art px wide: finer at a fine grain)
  if (L.rain) {
    const n = Math.round(ww * wh / 260), tt = Game.t, B = [[], [], [], []];
    for (let k = 0; k < n; k++) {
      const sp = 220 + hash(k, 5, 31) * 80, y = ((hash(k, 2, 31) * (wh + 40) + tt * sp) % (wh + 40)) - 20, x = ((hash(k, 1, 31) * (ww + 40) - cx * 0.9 + y * 0.35) % (ww + 40) + ww + 40) % (ww + 40) - 20;
      if (L.dry && L.dry.some((r) => x + cx > r[0] && x + cx < r[2] && y + cy > r[1] && y + cy < r[3])) continue; // under cover
      const li = lightAt(x * A, y * A, ox, oy), b = Math.min(3, Math.floor(Math.max(li[0], li[1], li[2]) / 70));
      B[b].push(Math.round(x * A), Math.round(y * A), (3 + ((k * 7) % 4)) * A);
    }
    const sl = A > 1 ? Math.round(A * 0.35 * 1000) / 1000 : 1; // the slant across a stroke, in art px
    B.forEach((arr, b) => { g.fillStyle = `rgba(170,190,230,${0.06 + b * 0.08})`; for (let i = 0; i < arr.length; i += 3) { const x = arr[i], y = arr[i + 1], l = arr[i + 2]; if (A === 1) { g.fillRect(x, y, 1, l >> 1); g.fillRect(x + 1, y + (l >> 1), 1, l - (l >> 1)); } else for (let q = 0; q < 3; q++) g.fillRect(x + q, y + Math.round(q * l / 3), 1, Math.ceil(l / 3)); } });
  }
  // the wet strips in view (art px)
  const wets = [];
  for (const wt of L.wet) { const y0 = SY(wt.y), x0 = Math.max(0, SX(wt.x0)), x1 = Math.min(w, SX(wt.x1)); if (y0 >= 0 && y0 <= h && x1 > x0) wets.push({ x0, y0, x1, depth: wt.depth * A, k: wt.k }); }
  finishFrame(wets);
}
// the frame's finish: glow, bloom, reflections, the fade, scaled up
function finishFrame(wets) {
  const V = View, g = V.lg, w = V.w, h = V.h;
  if (GL.ok) { GL.frame(V.low, V.gl, wets, Game.fade); return; }
  // ---- without WebGL2: glow, bloom, reflections and the fade in 2D
  g.globalCompositeOperation = 'lighter'; g.drawImage(V.gl, 0, 0);
  V.bg.clearRect(0, 0, V.bl.width, V.bl.height); V.bg.drawImage(V.gl, 0, 0, V.bl.width, V.bl.height);
  V.bg2.clearRect(0, 0, V.bl2.width, V.bl2.height); V.bg2.drawImage(V.gl, 0, 0, V.bl2.width, V.bl2.height);
  g.imageSmoothingEnabled = true; g.globalAlpha = 0.75; g.drawImage(V.bl, -2 * AP, -2 * AP, w + 4 * AP, h + 4 * AP); g.globalAlpha = 0.5; g.drawImage(V.bl2, -5 * AP, -5 * AP, w + 10 * AP, h + 10 * AP); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
  for (const wt of wets) {
    const { x0, y0, x1 } = wt, t = V.tg, d = Math.min(wt.depth, h - y0); if (V.tmp.width < w) V.tmp.width = w; if (V.tmp.height < d) V.tmp.height = Math.max(V.tmp.height, d);
    t.globalCompositeOperation = 'copy'; t.drawImage(V.low, x0, Math.max(0, y0 - d), x1 - x0, Math.min(d, y0), 0, 0, x1 - x0, Math.min(d, y0));
    for (let k = 0; k < d && y0 - 1 - k >= 0; k++) {
      const kw = k / AP, off = Math.round(Math.sin(kw * 0.9 + Game.t * 2 + kw * kw * 0.05) * (kw > 2 ? 1 : 0));
      g.globalAlpha = wt.k * (1 - k / wt.depth) * (Math.floor(kw) % 2 ? 0.8 : 1);
      g.drawImage(V.tmp, 0, Math.min(d, y0) - 1 - k, x1 - x0, 1, x0 + off, y0 + k, x1 - x0, 1);
    }
    g.globalAlpha = 1;
  }
  g.globalCompositeOperation = 'source-over';
  if (Game.fade > 0) { g.fillStyle = `rgba(0,0,0,${clamp(Game.fade, 0, 1)})`; g.fillRect(0, 0, w, h); }
  V.g.imageSmoothingEnabled = false;
  V.g.drawImage(V.low, 0, 0, w * V.out, h * V.out);
}
// The runner's retinal overlay tags what's hostile: a thin outline round its
// shape and a bar of its health over its head, drawn as light (into the glow
// layer, so it reads like a projection and blooms a little). Red for
// hostiles, green for a drone you've taken over; brighter when it has seen
// you. Under Ghost, the tags dim: you're not the only one hidden.
const TagArt = { outlines: new WeakMap() };
// (OUTLINE art px wide: two at a fine grain, a little finer than a world px)
const OUTLINE = AP > 1 ? 2 : 1;
function outlineOf(s) {
  let o = TagArt.outlines.get(s); if (o) return o;
  const t = OUTLINE, [c, g] = canvasOf(s.w + 2 * t, s.h + 2 * t);
  for (let d = 1; d <= t; d++) for (const [dx, dy] of [[t - d, t], [t + d, t], [t, t - d], [t, t + d]]) g.drawImage(s.c, dx, dy);
  g.globalCompositeOperation = 'destination-out'; g.drawImage(s.c, t, t);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  TagArt.outlines.set(s, c); return c;
}
function tag(e, s, sx, sy) {
  const gg = View.gg, ally = e.ally > 0, alert = ally || e.state !== 'idle' || Actors.sees(e, 120) || e.hp < e.max;
  const col = ally ? [80, 255, 140] : [255, 56, 80], k = (Game.ghost > 0 ? 0.35 : 1) * (alert ? 1 : 0.55);
  // the outline, tinted
  const o = outlineOf(s), t = View.tg, ot = OUTLINE; if (View.tmp.width < o.width || View.tmp.height < o.height) { View.tmp.width = Math.max(View.tmp.width, o.width); View.tmp.height = Math.max(View.tmp.height, o.height); }
  t.globalCompositeOperation = 'copy'; t.drawImage(o, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = css(col); t.fillRect(0, 0, o.width, o.height);
  gg.globalAlpha = 0.55 * k; gg.drawImage(View.tmp, 0, 0, o.width, o.height, sx - ot, sy - ot, o.width, o.height); gg.globalAlpha = 1;
  // the health bar: segments over the top of its shape
  if (ENEMY[e.type].boss) return; // a boss's bar is on the HUD
  const b = Actors.hurtbox(e), n = e.type === 'drone' ? 5 : 6, w = n * 3 - 1, A = AP, x0 = View.sx((b[0] + b[2]) / 2 - w / 2), y0 = View.sy(b[1]) - 5 * A, lit = Math.ceil((e.hp / e.max) * n);
  gg.globalAlpha = k;
  for (let i = 0; i < n; i++) { gg.fillStyle = i < lit ? css(col) : css(col.map((q) => q * 0.25)); gg.fillRect(x0 + i * 3 * A, y0, 2 * A, 2 * A); }
  // brackets at the bar's ends, the overlay's mark
  gg.fillStyle = css(col.map((q) => q * 0.7)); gg.fillRect(x0 - 2 * A, y0 - A, A, 4 * A); gg.fillRect(x0 + (w + 1) * A, y0 - A, A, 4 * A);
  gg.globalAlpha = 1;
}
// hide the glow layer under a sprite's shape: the glow is added over the
// whole frame at the end, so without this a sign or a monitor behind
// someone would shine through them
function occlude(c, x, y) { const gg = View.gg; gg.globalCompositeOperation = 'destination-out'; gg.drawImage(c, x, y); gg.globalCompositeOperation = 'source-over'; }
// the light map's colour at a point on the screen (0..255)
function lightAt(x, y, ox, oy) {
  const V = View, lw = V.lc.width, lh = V.lc.height, LCA = V.LC * AP, i = clamp(Math.floor((x - ox) / LCA), 0, lw - 1), j = clamp(Math.floor((y - oy) / LCA), 0, lh - 1), o = (j * lw + i) * 4, d = V.limg.data;
  let r = d[o], g = d[o + 1], b = d[o + 2]; const m = Math.max(r, g, b), fl = 0.62 * 255;
  if (m < fl) { const k = fl / Math.max(m, 12); r = Math.min(255, r * k * 0.6 + fl * 0.4); g = Math.min(255, g * k * 0.6 + fl * 0.4); b = Math.min(255, b * k * 0.6 + fl * 0.45); }
  return [r, g, b];
}
// ---- the light map ------------------------------------------------------------
function lightMap(cx, cy) {
  const V = View, LC = V.LC, lw = V.lc.width, lh = V.lc.height, d = V.limg.data, L = World.L, w = V.w / AP, h = V.h / AP;
  const gx0 = Math.floor(cx / LC), gy0 = Math.floor(cy / LC);
  const lights = [];
  for (const l of L.lights) if (l.x > cx - l.r && l.x < cx + w + l.r && l.y > cy - l.r && l.y < cy + h + l.r) lights.push(l.flick ? { x: l.x, y: l.y, r: l.r, c: l.c, flat: l.flat, k: l.k * Life.flick(l.flick) } : l);
  // the runner's cutter gives off a little light of its own; so do the bolts
  lights.push({ x: Player.x + Player.face * 6, y: Player.y - 16, r: T.light.lamp, c: [1, 0.78, 0.5], k: 0.32, flat: 1 });
  for (const b of Actors.bolts) lights.push({ x: b.x, y: b.y, r: 30, c: b.c.map((q) => q / 255), k: 0.5, flat: 1 });
  if (Game.flash) lights.push({ x: Game.flash.x, y: Game.flash.y, r: Game.flash.r || 60, c: Game.flash.c || [1, 0.75, 0.4], k: 1, flat: 1 });
  for (const e of Actors.enemies) if (e.type === 'warden') lights.push({ x: e.x + e.face * 20, y: e.y - 50, r: 50, c: [1, 0.25, 0.3], k: 0.5, flat: 1 });
  const low = Game.has('scanner') ? T.light.lowlight : 0, amb = L.ambient, n = lw * lh;
  // ambient first, then each light adds itself over just the cells it reaches
  if (!V.lR || V.lR.length !== n) { V.lR = new Float32Array(n); V.lG = new Float32Array(n); V.lB = new Float32Array(n); }
  const R = V.lR, G = V.lG, B = V.lB, fn = typeof amb === 'function';
  for (let j = 0, o = 0; j < lh; j++) { const wy = (gy0 + j) * LC + LC / 2; for (let i = 0; i < lw; i++, o++) { const a = fn ? amb((gx0 + i) * LC + LC / 2, wy) : amb; R[o] = a[0]; G[o] = a[1]; B[o] = a[2]; } }
  for (const l of lights) {
    const fl = l.flat || 1, r = l.r, r2 = r * r, c0 = l.c[0] * l.k, c1 = l.c[1] * l.k, c2 = l.c[2] * l.k, inv = 1 / r;
    const i0 = Math.max(0, Math.floor((l.x - r) / LC) - gx0), i1 = Math.min(lw - 1, Math.ceil((l.x + r) / LC) - gx0);
    const j0 = Math.max(0, Math.floor((l.y - r / fl) / LC) - gy0), j1 = Math.min(lh - 1, Math.ceil((l.y + r / fl) / LC) - gy0);
    for (let j = j0; j <= j1; j++) {
      const dy = ((gy0 + j) * LC + LC / 2 - l.y) * fl, dy2 = dy * dy; if (dy2 >= r2) continue;
      for (let i = i0, o = j * lw + i0; i <= i1; i++, o++) {
        const dx = (gx0 + i) * LC + LC / 2 - l.x, dd = dx * dx + dy2; if (dd >= r2) continue;
        const t = 1 - Math.sqrt(dd) * inv, f = t * Math.sqrt(t); R[o] += f * c0; G[o] += f * c1; B[o] += f * c2;
      }
    }
  }
  for (let o = 0; o < n; o++) {
    let r = R[o], g = G[o], b = B[o];
    if (low) { r = Math.max(r, low * 0.8); g = Math.max(g, low); b = Math.max(b, low * 0.9); }
    const mx = Math.max(r, g, b, 0.001), qm = mx < 0.03 ? 0.03 : mx > 1.3 ? 1.3 : mx, k = (qm / mx) * 255, q = o * 4;
    d[q] = Math.min(255, r * k); d[q + 1] = Math.min(255, g * k); d[q + 2] = Math.min(255, b * k); d[q + 3] = 255;
  }
  V.lgc.putImageData(V.limg, 0, 0);
}
