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
  scale: 1, w: 0, h: 0, LC: 4,
  init() { this.cv = $('view'); this.g = this.cv.getContext('2d'); addEventListener('resize', () => this.resize()); this.resize(); },
  resize() {
    const dpr = window.devicePixelRatio || 1, W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    this.scale = clamp(Math.round(Math.min(W, H) / T.view.min), 1, T.view.maxScale);
    this.w = Math.ceil(W / this.scale); this.h = Math.ceil(H / this.scale);
    this.cv.width = W; this.cv.height = H;
    [this.low, this.lg] = canvasOf(this.w, this.h);
    [this.gl, this.gg] = canvasOf(this.w, this.h);
    [this.bl, this.bg] = canvasOf(Math.ceil(this.w / 4), Math.ceil(this.h / 4)); this.bg.imageSmoothingEnabled = true;
    [this.bl2, this.bg2] = canvasOf(Math.ceil(this.w / 10), Math.ceil(this.h / 10)); this.bg2.imageSmoothingEnabled = true;
    const lw = Math.ceil(this.w / this.LC) + 2, lh = Math.ceil(this.h / this.LC) + 2;
    [this.lc, this.lgc] = canvasOf(lw, lh); this.limg = this.lgc.createImageData(lw, lh);
    [this.tmp, this.tg] = canvasOf(128, 128);
  },
};

function render() {
  const V = View, g = V.lg, gg = V.gg, w = V.w, h = V.h, L = World.L;
  const cx = Math.round(clamp(Game.cam.x - w / 2, 0, Math.max(0, L.w - w))), cy = Math.round(clamp(Game.cam.y - h / 2, 0, Math.max(0, L.h - h)));
  V.cx = cx; V.cy = cy;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = '#08060c'; g.fillRect(0, 0, w, h);
  gg.globalCompositeOperation = 'source-over'; gg.fillStyle = '#000'; gg.fillRect(0, 0, w, h);
  // the far layer
  if (World.far) { const F = World.far, fx = -Math.round(cx * F.f), fy = -Math.round(cy * F.fy); g.drawImage(F.c, fx, fy); if (F.e) gg.drawImage(F.e, fx, fy); }
  // the painted chunks
  const CS = T.chunk;
  for (let ky = Math.floor(cy / CS); ky <= Math.floor((cy + h) / CS); ky++) for (let kx = Math.floor(cx / CS); kx <= Math.floor((cx + w) / CS); kx++) {
    if (kx < 0 || ky < 0 || kx * CS >= L.w || ky * CS >= L.h) continue;
    const ch = Paint.get(kx, ky);
    g.drawImage(ch.c, ch.x - cx, ch.y - cy);
    // the near city hides the far layer's glow behind it
    gg.globalCompositeOperation = 'destination-out'; gg.drawImage(ch.c, ch.x - cx, ch.y - cy); gg.globalCompositeOperation = 'source-over';
    if (ch.e) gg.drawImage(ch.e, ch.x - cx, ch.y - cy);
  }
  // props
  for (const p of World.props) {
    const s = Props.sprite(p); if (!s) continue;
    const x = Math.round(p.x - s.ax - cx), y = Math.round(p.y - s.ay - cy);
    if (x > w || y > h || x + s.w < 0 || y + s.h < 0) continue;
    g.drawImage(s.c, x, y); if (s.e) gg.drawImage(s.e, x, y);
  }
  // the light
  lightMap(cx, cy);
  const LC = V.LC, lw = V.lc.width, lh = V.lc.height, ox = -(((cx % LC) + LC) % LC), oy = -(((cy % LC) + LC) % LC);
  // the light is smooth: its grid is scaled up with filtering, so no cell edges show
  g.imageSmoothingEnabled = true;
  g.globalCompositeOperation = 'multiply'; g.drawImage(V.lc, ox - LC / 2, oy - LC / 2, lw * LC, lh * LC);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.1; g.drawImage(V.lc, ox - LC / 2, oy - LC / 2, lw * LC, lh * LC); g.globalAlpha = 1;
  g.imageSmoothingEnabled = false;
  g.globalCompositeOperation = 'source-over';
  // people, enemies, the runner
  const actor = (s, x, y, flash) => {
    const sx = Math.round(x - s.ax - cx), sy = Math.round(y - s.ay - cy);
    if (sx > w || sy > h || sx + s.w < 0 || sy + s.h < 0) return;
    const col = lightAt(sx + s.w / 2, sy + s.h * 0.55, ox, oy);
    const t = V.tg; if (V.tmp.width < s.w || V.tmp.height < s.h) { V.tmp.width = Math.max(V.tmp.width, s.w); V.tmp.height = Math.max(V.tmp.height, s.h); }
    t.globalCompositeOperation = 'copy'; t.drawImage(s.c, 0, 0);
    t.globalCompositeOperation = 'multiply'; t.fillStyle = flash ? '#ffffff' : css(col); t.fillRect(0, 0, s.w, s.h);
    t.globalCompositeOperation = 'destination-in'; t.drawImage(s.c, 0, 0);
    if (flash) { t.globalCompositeOperation = 'source-atop'; t.fillStyle = 'rgba(255,255,255,0.7)'; t.fillRect(0, 0, s.w, s.h); }
    g.drawImage(V.tmp, 0, 0, s.w, s.h, sx, sy, s.w, s.h);
    // what glows behind a figure is hidden by it
    occlude(s.c, sx, sy);
    if (s.e) gg.drawImage(s.e, sx, sy);
  };
  for (const n of Actors.npcs) if (!n.hidden) { const pose = n.moving ? 'walk' + (Math.floor((n.walked || 0) / 7) % 4) : n.act === 'sit' ? 'sit' : 'stand'; actor(Actors.art(n, pose, n.face < 0), n.x, n.y); }
  for (const p of World.props) if (p.front) { if (!p.frontSpr) p.frontSpr = lowerPart(Props.sprite(p), p.front); const s = p.frontSpr, sx = Math.round(p.x - s.ax - cx), sy = Math.round(p.y - s.ay - cy); if (sx < w && sx + s.w > 0 && sy < h && sy + s.h > 0) { const t = V.tg; t.globalCompositeOperation = 'copy'; t.drawImage(s.c, 0, 0); t.globalCompositeOperation = 'multiply'; t.imageSmoothingEnabled = true; t.drawImage(V.lc, 0, 0, lw, lh, ox - LC / 2 - sx, oy - LC / 2 - sy, lw * LC, lh * LC); t.imageSmoothingEnabled = false; t.globalCompositeOperation = 'destination-in'; t.drawImage(s.c, 0, 0); g.drawImage(V.tmp, 0, 0, s.w, s.h, sx, sy, s.w, s.h); occlude(s.c, sx, sy); if (s.e) gg.drawImage(s.e, sx, sy); } }
  for (const e of Actors.enemies) { const s = Actors.enemyArt(e); actor(s, e.x, e.type === 'drone' ? e.y + 6 : e.y - (e.hop || 0), e.flash > 0); }
  if (Player.inv <= 0 || Math.floor(Game.t * 16) % 2) actor(RunnerArt.get(Player.pose(), Player.face < 0), Player.x, Player.y + 1);
  // bolts and sparks: all glow
  for (const b of Actors.bolts) { const x = Math.round(b.x - cx), y = Math.round(b.y - cy); gg.fillStyle = css(b.c); if (b.wave) gg.fillRect(x - 3, y - 8, 6, 10); else { gg.fillRect(x - 2, y - 1, 4, 2); gg.fillStyle = '#fff'; gg.fillRect(x - 1, y - 1, 2, 2); } }
  for (const p of Game.particles) { gg.fillStyle = css(p.c); gg.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 1, 1); }
  // the glow, and its bloom
  g.globalCompositeOperation = 'lighter'; g.drawImage(V.gl, 0, 0);
  V.bg.clearRect(0, 0, V.bl.width, V.bl.height); V.bg.drawImage(V.gl, 0, 0, V.bl.width, V.bl.height);
  V.bg2.clearRect(0, 0, V.bl2.width, V.bl2.height); V.bg2.drawImage(V.gl, 0, 0, V.bl2.width, V.bl2.height);
  g.imageSmoothingEnabled = true; g.globalAlpha = 0.75; g.drawImage(V.bl, -2, -2, w + 4, h + 4); g.globalAlpha = 0.5; g.drawImage(V.bl2, -5, -5, w + 10, h + 10); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
  // wet ground: what's above, flipped, rippled and dim
  for (const wt of L.wet) {
    const y0 = wt.y - cy; if (y0 < 0 || y0 > h) continue;
    const x0 = Math.max(0, wt.x0 - cx), x1 = Math.min(w, wt.x1 - cx); if (x1 <= x0) continue;
    const t = V.tg, d = Math.min(wt.depth, h - y0); if (V.tmp.width < w) V.tmp.width = w; if (V.tmp.height < d) V.tmp.height = Math.max(V.tmp.height, d);
    t.globalCompositeOperation = 'copy'; t.drawImage(V.low, x0, Math.max(0, y0 - d), x1 - x0, Math.min(d, y0), 0, 0, x1 - x0, Math.min(d, y0));
    for (let k = 0; k < d && y0 - 1 - k >= 0; k++) {
      const off = Math.round(Math.sin(k * 0.9 + Game.t * 2 + k * k * 0.05) * (k > 2 ? 1 : 0));
      g.globalAlpha = wt.k * (1 - k / wt.depth) * (k % 2 ? 0.8 : 1);
      g.drawImage(V.tmp, 0, Math.min(d, y0) - 1 - k, x1 - x0, 1, x0 + off, y0 + k, x1 - x0, 1);
    }
    g.globalAlpha = 1;
  }
  // rain, brighter where the light is: each drop two short strokes, drawn
  // in four batches by brightness
  if (L.rain) {
    const n = Math.round(w * h / 260), tt = Game.t, B = [[], [], [], []];
    for (let k = 0; k < n; k++) {
      const sp = 220 + hash(k, 5, 31) * 80, y = ((hash(k, 2, 31) * (h + 40) + tt * sp) % (h + 40)) - 20, x = ((hash(k, 1, 31) * (w + 40) - cx * 0.9 + y * 0.35) % (w + 40) + w + 40) % (w + 40) - 20;
      if (L.dry && L.dry.some((r) => x + cx > r[0] && x + cx < r[2] && y + cy > r[1] && y + cy < r[3])) continue; // under cover
      const li = lightAt(x, y, ox, oy), b = Math.min(3, Math.floor(Math.max(li[0], li[1], li[2]) / 70));
      B[b].push(Math.round(x), Math.round(y), 3 + ((k * 7) % 4));
    }
    B.forEach((arr, b) => { g.fillStyle = `rgba(170,190,230,${0.06 + b * 0.08})`; for (let i = 0; i < arr.length; i += 3) { const x = arr[i], y = arr[i + 1], l = arr[i + 2]; g.fillRect(x, y, 1, l >> 1); g.fillRect(x + 1, y + (l >> 1), 1, l - (l >> 1)); } });
  }
  g.globalCompositeOperation = 'source-over';
  // a fade between levels
  if (Game.fade > 0) { g.fillStyle = `rgba(0,0,0,${clamp(Game.fade, 0, 1)})`; g.fillRect(0, 0, w, h); }
  V.g.imageSmoothingEnabled = false;
  V.g.drawImage(V.low, 0, 0, w * V.scale, h * V.scale);
}
// hide the glow layer under a sprite's shape: the glow is added over the
// whole frame at the end, so without this a sign or a monitor behind
// someone would shine through them
function occlude(c, x, y) { const gg = View.gg; gg.globalCompositeOperation = 'destination-out'; gg.drawImage(c, x, y); gg.globalCompositeOperation = 'source-over'; }
// the light map's colour at a point on the screen (0..255)
function lightAt(x, y, ox, oy) {
  const V = View, lw = V.lc.width, lh = V.lc.height, i = clamp(Math.floor((x - ox) / V.LC), 0, lw - 1), j = clamp(Math.floor((y - oy) / V.LC), 0, lh - 1), o = (j * lw + i) * 4, d = V.limg.data;
  let r = d[o], g = d[o + 1], b = d[o + 2]; const m = Math.max(r, g, b), fl = 0.62 * 255;
  if (m < fl) { const k = fl / Math.max(m, 12); r = Math.min(255, r * k * 0.6 + fl * 0.4); g = Math.min(255, g * k * 0.6 + fl * 0.4); b = Math.min(255, b * k * 0.6 + fl * 0.45); }
  return [r, g, b];
}
// ---- the light map ------------------------------------------------------------
function lightMap(cx, cy) {
  const V = View, LC = V.LC, lw = V.lc.width, lh = V.lc.height, d = V.limg.data, L = World.L, w = V.w, h = V.h;
  const gx0 = Math.floor(cx / LC), gy0 = Math.floor(cy / LC);
  const lights = [];
  for (const l of L.lights) if (l.x > cx - l.r && l.x < cx + w + l.r && l.y > cy - l.r && l.y < cy + h + l.r) lights.push(l);
  // the runner's cutter gives off a little light of its own; so do the bolts
  lights.push({ x: Player.x + Player.face * 6, y: Player.y - 16, r: T.light.lamp, c: [1, 0.78, 0.5], k: 0.32, flat: 1 });
  for (const b of Actors.bolts) lights.push({ x: b.x, y: b.y, r: 30, c: b.c.map((q) => q / 255), k: 0.5, flat: 1 });
  if (Game.flash) lights.push({ x: Game.flash.x, y: Game.flash.y, r: 60, c: [1, 0.75, 0.4], k: 1, flat: 1 });
  for (const e of Actors.enemies) if (e.type === 'warden') lights.push({ x: e.x + e.face * 20, y: e.y - 50, r: 50, c: [1, 0.25, 0.3], k: 0.5, flat: 1 });
  const low = Game.has('lowlight') ? T.light.lowlight : 0, amb = L.ambient;
  const row = [];
  for (let j = 0; j < lh; j++) {
    const wy = (gy0 + j) * LC + LC / 2;
    row.length = 0; for (const l of lights) if (Math.abs(wy - l.y) * (l.flat || 1) < l.r) row.push(l);
    for (let i = 0; i < lw; i++) {
      const wx = (gx0 + i) * LC + LC / 2, a = typeof amb === 'function' ? amb(wx, wy) : amb;
      let r = a[0], g = a[1], b = a[2];
      for (const l of row) { const dx = wx - l.x, dy = (wy - l.y) * (l.flat || 1), dd = dx * dx + dy * dy; if (dd > l.r * l.r) continue; const f = Math.pow(1 - Math.sqrt(dd) / l.r, 1.5) * l.k; r += f * l.c[0]; g += f * l.c[1]; b += f * l.c[2]; }
      if (low) { r = Math.max(r, low * 0.8); g = Math.max(g, low); b = Math.max(b, low * 0.9); }
      const mx = Math.max(r, g, b, 0.001), qm = clamp(mx, 0.03, 1.3), k = qm / mx;
      const o = (j * lw + i) * 4; d[o] = Math.min(255, r * k * 255); d[o + 1] = Math.min(255, g * k * 255); d[o + 2] = Math.min(255, b * k * 255); d[o + 3] = 255;
    }
  }
  V.lgc.putImageData(V.limg, 0, 0);
}
