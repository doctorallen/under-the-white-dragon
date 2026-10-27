'use strict';
// ---------------------------------------------------------------------------
// The photo enhancer. A camera still of the scene: the place painted wide,
// the people who were there, graded like an old security camera. A few
// things in it are worth a closer look, too small to make out: tap to
// enhance twice as close on a point, drag to look about, zoom back out.
// Close enough on one and the machine sharpens it: most are nothing (a cat
// on a sill, a bag), one is the clue.
// ---------------------------------------------------------------------------
let PHOTO_W = 400, PHOTO_H = 220;
// what a spot can turn out to be: the clue's detail, or nothing much
const DECOYS = {
  cat: 'A cat on a window sill. It looks back at the camera.', bag: 'A shopping bag, left on a ledge. Noodles, by the look of it.',
  umbrella: 'Somebody under an umbrella, going home. Not who you want.', poster: 'A torn poster for a band nobody remembers.',
  bird: 'A pigeon, hunched in the rain. A real one, maybe.', drone: 'A delivery drone, parked on a sill to charge.',
  plant: 'A pot plant somebody waters every day.', shirt: 'A shirt on a washing line. Just a shirt.',
};
const Enhancer = {
  id: null, cid: null, img: null, spots: [], s: 1, base: 1, ox: 0, oy: 0, found: false, scan: null, raf: 0, note: '',
  open(id, cid, x, y) { this.id = id; this.cid = cid; this.found = !!Cases.st(id).found[cid]; this.scan = null; this.note = ''; this.make(x, y); Hud.toggle('photo'); },
  // ---- the still ----
  make(x, y) {
    // the still has the shape of the screen it's shown on
    PHOTO_H = 180; PHOTO_W = Math.round(clamp(PHOTO_H * Math.max(1, innerWidth - 32) / Math.max(1, innerHeight - 150), 300, 640));
    const L = World.L, w = PHOTO_W, h = PHOTO_H, CS = T.chunk;
    const x0 = clamp(Math.round(x - w / 2), 0, Math.max(0, L.w - w)), y0 = clamp(Math.round(y - h + 24), 0, Math.max(0, L.h - h));
    const [c, g] = canvasOf(w, h); g.fillStyle = '#0a0c14'; g.fillRect(0, 0, w, h);
    for (const F of World.layers) g.drawImage(F.c, -Math.round(x0 * F.f) % F.c.width, -Math.round(y0 * F.fy));
    for (let ky = Math.floor(y0 / CS); ky * CS < y0 + h; ky++) for (let kx = Math.floor(x0 / CS); kx * CS < x0 + w; kx++) { if (kx < 0 || ky < 0 || kx * CS >= L.w || ky * CS >= L.h) continue; const ch = Paint.get(kx, ky); g.drawImage(ch.c, ch.x - x0, ch.y - y0); }
    for (const p of World.props) { if (p.dyn) continue; const s = Props.sprite(p); if (s) g.drawImage(s.c, Math.round(p.x - s.ax - x0), Math.round(p.y - s.ay - y0)); }
    for (const n of Actors.npcs) { if (n.hidden || n.x < x0 - 20 || n.x > x0 + w + 20) continue; const s = person(Object.assign({}, n.def.look, { pose: 'stand', seed: 40 + n.i })); g.drawImage(s.c, Math.round(n.x - s.ax - x0), Math.round(n.y - s.ay - y0)); }
    // the spots: one is the clue, the rest are nothing; each a little
    // picture of its own, drawn into the still too small to read
    const C = Cases.def(this.id), K = C.clues[this.cid], seed = (this.id.length * 31 + this.cid.length * 7 + Math.round(x)) | 0, r = new Rng(seed);
    const decoys = Object.keys(DECOYS).sort((a, b) => hash(a.length, seed, 3) - hash(b.length, seed, 4) || (a < b ? -1 : 1)).slice(0, 3);
    const kinds = [{ kind: K.detail || 'figure', real: true }].concat(decoys.map((k) => ({ kind: k, real: false }))), taken = [];
    this.spots = [];
    for (const k of kinds) {
      let sx = 0, sy = 0;
      for (let t = 0; t < 40; t++) { sx = r.i(30, w - 40); sy = r.i(26, h - 50); if (!taken.some(([a, b]) => Math.abs(a - sx) < 46 && Math.abs(b - sy) < 30)) break; }
      taken.push([sx, sy]);
      const art = enhanceArt(k.kind, C, seed), sw = 12, sh = Math.round(12 * art.h / art.w);
      g.imageSmoothingEnabled = true; g.globalAlpha = 0.9; g.drawImage(art.c, sx, sy, sw, sh); g.globalAlpha = 1; g.imageSmoothingEnabled = false;
      this.spots.push({ x: sx, y: sy, w: sw, h: sh, art, real: k.real, kind: k.kind, seen: k.real && this.found });
    }
    // the camera's grade: green-grey, grain, scanlines, a vignette
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const px = (i / 4) % w, py = Math.floor(i / 4 / w), l = d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15, k = 0.82 + hash(px, py, 9) * 0.22, v = 1 - (Math.hypot(px / w - 0.5, py / h - 0.5) * 0.9) ** 2, ln = py % 2 ? 0.88 : 1;
      d[i] = (l * 0.75 + d[i] * 0.25) * k * v * ln + 6; d[i + 1] = (l * 0.9 + d[i + 1] * 0.1) * k * v * ln + 12; d[i + 2] = (l * 0.8 + d[i + 2] * 0.2) * k * v * ln + 10;
    }
    g.putImageData(id, 0, 0);
    this.img = c; this.stamp = 'CAM ' + String(10 + (seed % 89)).padStart(2, '0') + '  ' + Game.clock() + '  ' + L.name.toUpperCase();
  },
  // ---- the view ----
  attach() {
    const cv = $('photocv'); if (!cv) return; const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    // drawn again (the panel refreshes when a clue's found): keep where you were looking
    const keep = this.shown === this.img && this.base ? { k: this.s / this.base, cx: (this.cw / 2 - this.ox) / this.s, cy: (this.ch / 2 - this.oy) / this.s } : null;
    this.base = Math.min(cv.width / PHOTO_W, cv.height / PHOTO_H); this.shown = this.img; this.cw = cv.width; this.ch = cv.height; this.reset(false);
    if (keep) { this.s = this.base * keep.k; this.ox = cv.width / 2 - keep.cx * this.s; this.oy = cv.height / 2 - keep.cy * this.s; this.clampView(); }
    const pts = new Map(); let moved = 0, pinch = 0;
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
    cv.onpointermove = (e) => {
      if (!pts.has(e.pointerId)) return; const [px, py] = pts.get(e.pointerId), dx = e.clientX - px, dy = e.clientY - py; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.zoom(d / pinch, ((a[0] + b[0]) / 2 - cv.getBoundingClientRect().left) * dpr, ((a[1] + b[1]) / 2 - cv.getBoundingClientRect().top) * dpr); pinch = d; moved = 99; return; }
      moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { this.ox += dx * dpr; this.oy += dy * dpr; this.clampView(); this.draw(); }
    };
    cv.onpointerup = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (moved <= 6) { const r = cv.getBoundingClientRect(); this.enhance((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr); } };
    cv.onwheel = (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoom(e.deltaY < 0 ? 1.25 : 0.8, (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr); };
    document.querySelectorAll('button[data-enh]').forEach((b) => (b.onclick = () => { if (b.dataset.enh === 'out') this.zoom(0.5, cv.width / 2, cv.height / 2); else this.reset(true); }));
    this.noteUpdate(); this.loop();
  },
  reset(draw) { const cv = $('photocv'); this.s = this.base; this.ox = (cv.width - PHOTO_W * this.s) / 2; this.oy = (cv.height - PHOTO_H * this.s) / 2; this.scan = null; if (draw) this.draw(); },
  clampView() { const cv = $('photocv'), w = PHOTO_W * this.s, h = PHOTO_H * this.s; this.ox = w <= cv.width ? (cv.width - w) / 2 : clamp(this.ox, cv.width - w, 0); this.oy = h <= cv.height ? (cv.height - h) / 2 : clamp(this.oy, cv.height - h, 0); },
  zoom(k, px, py) { const s0 = this.s; this.s = clamp(this.s * k, this.base, this.base * 24); this.ox = px - (px - this.ox) * (this.s / s0); this.oy = py - (py - this.oy) * (this.s / s0); this.clampView(); this.scan = null; this.check(); this.draw(); },
  // a tap: twice as close, on that point, which comes to the middle
  enhance(px, py) {
    const cv = $('photocv'), ix = (px - this.ox) / this.s, iy = (py - this.oy) / this.s; if (ix < 0 || iy < 0 || ix > PHOTO_W || iy > PHOTO_H) return;
    this.s = Math.min(this.s * 2, this.base * 16); this.ox = cv.width / 2 - ix * this.s; this.oy = cv.height / 2 - iy * this.s; this.clampView();
    this.scan = null; this.check(); this.draw();
  },
  // close in on a spot (it fills a good part of the view): sharpen it
  check() {
    const cv = $('photocv'), cx = (cv.width / 2 - this.ox) / this.s, cy = (cv.height / 2 - this.oy) / this.s, vw = cv.width / this.s;
    // (a spot near the middle of what you're looking at)
    const sp = this.spots.find((q) => !q.seen && this.s >= this.base * 3.5 && Math.abs(q.x + q.w / 2 - cx) < vw * 0.3 && Math.abs(q.y + q.h / 2 - cy) < (cv.height / this.s) * 0.35);
    if (sp) this.scan = { sp, t: performance.now() };
  },
  loop() { cancelAnimationFrame(this.raf); const f = () => { if (Hud.open !== 'photo' || !$('photocv')) return; if (this.scan && performance.now() - this.scan.t > 900) this.reveal(this.scan.sp); this.draw(); this.raf = requestAnimationFrame(f); }; this.raf = requestAnimationFrame(f); },
  reveal(sp) {
    this.scan = null; sp.seen = true;
    // close in until it fills the middle of the view
    const cv = $('photocv'); if (cv) { this.s = clamp(cv.height * 0.5 / sp.h, this.s, this.base * 24); this.ox = cv.width / 2 - (sp.x + sp.w / 2) * this.s; this.oy = cv.height / 2 - (sp.y + sp.h / 2) * this.s; this.clampView(); }
    if (sp.real) { if (!this.found) { this.found = true; Cases.found(this.id, this.cid); } this.note = Cases.def(this.id).clues[this.cid].text; }
    else this.note = DECOYS[sp.kind] + ' Keep looking.';
    this.noteUpdate();
  },
  noteUpdate() { const el = $('photonote'); if (el) el.textContent = this.note || (this.found ? Cases.def(this.id).clues[this.cid].text : 'Tap anything that looks wrong to enhance it. Drag to look about; − to pull back.'); },
  draw() {
    const cv = $('photocv'); if (!cv) return; const g = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, s = this.s, t = performance.now();
    g.fillStyle = '#020306'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
    g.drawImage(this.img, this.ox, this.oy, PHOTO_W * s, PHOTO_H * s);
    // sharpened spots: their own picture, crisp, in the place of the blur
    const P = (x, y) => [this.ox + x * s, this.oy + y * s];
    for (const sp of this.spots) if (sp.seen) {
      const [a, b] = P(sp.x, sp.y), w = sp.w * s, h = sp.h * s; g.drawImage(sp.art.c, a, b, w, h);
      const col = sp.real ? '#3af0e0' : 'rgba(166,156,182,0.8)', m = Math.min(w, h) * 0.18; g.strokeStyle = col; g.lineWidth = 2 * dpr;
      for (const [x, y, sx, sy] of [[a, b, 1, 1], [a + w, b, -1, 1], [a, b + h, 1, -1], [a + w, b + h, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * m); g.lineTo(x, y); g.lineTo(x + sx * m, y); g.stroke(); }
      if (w > 60 * dpr) { g.font = `${11 * dpr}px ui-monospace, monospace`; g.fillStyle = col; g.fillText(sp.real ? 'MATCH' : 'NO MATCH', a + 4 * dpr, b - 6 * dpr); }
    }
    // faint rings round what's worth a look, while you're still far off
    const far = clamp(1 - (s / this.base - 1) / 2, 0, 1);
    if (far > 0) for (const sp of this.spots) if (!sp.seen) { const [a, b] = P(sp.x + sp.w / 2, sp.y + sp.h / 2), pulse = 0.5 + Math.sin(t / 400 + sp.x) * 0.5; g.strokeStyle = `rgba(58,240,224,${(0.12 + pulse * 0.18) * far})`; g.lineWidth = dpr; g.beginPath(); g.arc(a, b, (8 + pulse * 3) * dpr + sp.w * s * 0.4, 0, Math.PI * 2); g.stroke(); }
    // the machine at work: a sweep down the spot, a grid over it
    if (this.scan) {
      const sp = this.scan.sp, [a, b] = P(sp.x - 2, sp.y - 2), w = (sp.w + 4) * s, h = (sp.h + 4) * s, k = clamp((t - this.scan.t) / 900, 0, 1);
      g.strokeStyle = 'rgba(58,240,224,0.35)'; g.lineWidth = dpr; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(a + (w * i) / 6, b); g.lineTo(a + (w * i) / 6, b + h); g.moveTo(a, b + (h * i) / 6); g.lineTo(a + w, b + (h * i) / 6); g.stroke(); }
      g.fillStyle = 'rgba(58,240,224,0.25)'; g.fillRect(a, b + h * k - 3 * dpr, w, 6 * dpr);
      g.drawImage(sp.art.c, 0, 0, sp.art.w, Math.max(1, Math.round(sp.art.h * k)), a + 2 * s, b + 2 * s, sp.w * s, sp.h * s * k);
    }
    // the readout: frame corners, the stamp, the zoom, where you are
    g.strokeStyle = 'rgba(58,240,224,0.6)'; g.lineWidth = dpr; const c = 18 * dpr, m = 10 * dpr;
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [cv.width - m, m, -1, 1], [m, cv.height - m, 1, -1], [cv.width - m, cv.height - m, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * c); g.lineTo(x, y); g.lineTo(x + sx * c, y); g.stroke(); }
    g.font = `${11 * dpr}px ui-monospace, monospace`; g.fillStyle = '#3af0e0';
    const cx = Math.round((cv.width / 2 - this.ox) / s), cy = Math.round((cv.height / 2 - this.oy) / s);
    g.fillText(this.stamp, 18 * dpr, 26 * dpr);
    g.fillText(`ENHANCE ${Math.round(s / this.base)}×   ${String(cx).padStart(3, '0')}·${String(cy).padStart(3, '0')}${this.scan ? '   ENHANCING…' : ''}`, 18 * dpr, cv.height - 16 * dpr);
    g.strokeStyle = 'rgba(58,240,224,0.4)'; g.beginPath(); g.moveTo(cv.width / 2 - 8 * dpr, cv.height / 2); g.lineTo(cv.width / 2 + 8 * dpr, cv.height / 2); g.moveTo(cv.width / 2, cv.height / 2 - 8 * dpr); g.lineTo(cv.width / 2, cv.height / 2 + 8 * dpr); g.stroke();
  },
};

// ---- what the spots turn out to be, each a little picture, 48 px wide ----
// letters for plates: a few in 3x5
const PLATE_FONT = { I: ['111', '010', '010', '010', '111'], R: ['110', '101', '110', '101', '101'], '-': ['000', '000', '111', '000', '000'], 4: ['101', '101', '111', '001', '001'] };
function enhanceArt(kind, C, seed) {
  const W = 48, H = 36, S = new Spr(W, H, 600 + kind.length * 13 + (seed % 7));
  const back = (cols) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S.px(x, y, mixRgb(col3(cols[0]), col3(cols[1]), y / H + (hash(x >> 2, y >> 2, 5) - 0.5) * 0.15)); };
  const win = (lit) => { back(lit ? ['#7a5a3a', '#3a2a1a'] : ['#1a2430', '#0a0e14']); for (let x = 0; x < W; x++) { S.px(x, 0, '#0a0a0e'); S.px(x, H - 1, '#3a3a3a'); } for (let y = 0; y < H; y++) { S.px(0, y, '#0a0a0e'); S.px(W - 1, y, '#0a0a0e'); } };
  const sk = rp('#c8906a', 6), hair = rp('#1a1414', 5), coat = rp('#2a2e3a', 6);
  if (kind === 'snake') return snakeNeckArt(seed);
  if (kind === 'carry' || kind === 'girl' || kind === 'figure') return peopleArt(kind, seed);
  if (kind === 'plate') { // a serial plate on a market cloth
    back(['#5a2a2a', '#2a1010']); S.box(6, 8, 41, 27, MAT.chrome, { lo: 1, hi: 6 });
    let x = 10; for (const ch of 'IR-4') { const f = PLATE_FONT[ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (f[j][i] === '1') { S.px(x + i * 2, 13 + j * 2, '#141418'); S.px(x + i * 2 + 1, 13 + j * 2, '#141418'); S.px(x + i * 2, 14 + j * 2, '#141418'); S.px(x + i * 2 + 1, 14 + j * 2, '#141418'); } x += 8; }
    for (const [a, b] of [[8, 10], [39, 10], [8, 25], [39, 25]]) S.px(a, b, '#4a4a50');
  } else if (kind === 'cup') { // a hand round a canteen cup, the drink in it glowing green
    back(['#3a3a30', '#1a1a14']); S.shape([[4, 22], [30, 18], [34, 30], [6, 34]], rp('#3a4a5a', 6));
    S.box(22, 10, 36, 28, rp('#d8d8d0', 6), { lo: 1, hi: 5 }); for (let x = 23; x < 36; x++) S.px(x, 11, '#3aff80', true); for (let x = 24; x < 35; x++) S.px(x, 12, '#2ac860', true);
    S.cap(18, 20, 26, 20, 3, 3, sk); for (let k = 0; k < 8; k++) S.px(30 + Math.sin(k) * 1.5, 8 - k, '#5aff9a', true);
  } else if (kind === 'girl') { // a small figure sitting, cables curled round her
    back(['#1a0e24', '#0a0610']); S.ell(24, 14, 4, 4, hair); S.ell(24, 16, 3, 3, sk); S.shape([[18, 20], [30, 20], [32, 32], [16, 32]], rp('#5a4a6a', 6));
    for (let k = 0; k < 3; k++) for (let a = 0; a < Math.PI * 2; a += 0.05) S.px(24 + Math.cos(a + k) * (10 + k * 4), 26 + Math.sin(a + k) * (4 + k), k % 2 ? '#a86aff' : '#6a3aaa', k === 1);
  } else if (kind === 'carry') { // a tall man carrying a woman, going up
    back(['#2a3040', '#10141c']); S.ell(26, 6, 3, 3.4, sk); S.shape([[20, 9], [32, 9], [34, 36], [18, 36]], coat, { down: 0.3 });
    S.shape([[8, 16], [38, 14], [38, 19], [10, 21]], rp('#d8d0c8', 6)); S.ell(8, 16, 3, 3, sk); S.limb(8, 18, 4, 26, 1.5, hair); S.px(27, 6, '#ff3040', true);
  } else if (kind === 'figure') { // a face in a hood, turned to the camera; something in the eye
    back(['#202630', '#0c0e14']); S.ell(24, 18, 12, 13, rp('#2a2a34', 6)); S.ell(25, 20, 7, 8, sk); S.ell(25, 24, 3, 1, rp('#8a5a4a', 4));
    S.px(22, 18, '#1a1010'); S.px(28, 18, '#ffb040', true); S.px(29, 18, '#ffd890', true);
  } else if (kind === 'cat') { win(true); S.ell(24, 24, 9, 8, rp('#2a2420', 5)); S.ell(30, 14, 6, 5, rp('#2a2420', 5)); S.px(26, 9, '#2a2420'); S.px(34, 9, '#2a2420'); S.px(28, 14, '#e8d040', true); S.px(32, 14, '#e8d040', true); S.limb(15, 28, 8, 20, 1.6, rp('#2a2420', 5)); }
  else if (kind === 'bag') { back(['#3a3440', '#1a1620']); S.box(14, 12, 34, 32, rp('#e8e4dc', 6), { lo: 1, hi: 5 }); S.limb(18, 12, 24, 4, 1, ['#aaa', '#ccc']); S.limb(24, 4, 30, 12, 1, ['#aaa', '#ccc']); S.box(19, 18, 29, 24, rp('#c83a2a', 5)); }
  else if (kind === 'umbrella') { back(['#202836', '#0a0e16']); for (let x = 6; x < 42; x++) { const y = 10 - Math.sqrt(Math.max(0, 324 - (x - 24) ** 2)) / 3; for (let j = y; j < 12; j++) S.px(x, j, '#2a3a5a'); } S.limb(24, 12, 24, 30, 1, MAT.steel); S.shape([[16, 14], [32, 14], [34, 36], [14, 36]], coat); }
  else if (kind === 'poster') { back(['#3a3a3a', '#1a1a1a']); panel(S, 8, 4, 40, 32, rp('#c83a5a', 6)); for (let k = 0; k < 4; k++) for (const [a, b] of GLYPHS[(k * 5) % GLYPHS.length]) { S.px(12 + k * 7 + a * 1.5, 10 + b * 1.5, '#f0e8d0'); } for (let y = 20; y < 32; y++) for (let x = 30 + (y % 3); x < 40; x++) S.px(x, y, '#3a3a3a'); }
  else if (kind === 'bird') { back(['#4a4a50', '#2a2a30']); S.ell(22, 22, 9, 6, rp('#6a6a72', 6)); S.ell(30, 16, 4, 4, rp('#6a6a72', 6)); S.px(33, 16, '#e8b030'); S.px(31, 15, '#ff6a2a'); S.limb(14, 22, 6, 26, 2, rp('#4a4a52', 5)); for (let x = 0; x < W; x++) S.px(x, 29, '#3a3a3a'); }
  else if (kind === 'drone') { win(false); S.ell(24, 22, 10, 4, rp('#3a4048', 6)); S.limb(10, 18, 38, 18, 1, MAT.steel); S.ell(10, 17, 5, 1, ['#555', '#777']); S.ell(38, 17, 5, 1, ['#555', '#777']); S.px(28, 22, '#ff3040', true); }
  else if (kind === 'plant') { win(true); S.box(18, 24, 30, 34, rp('#8a4a2a', 6), { lo: 1, hi: 5 }); for (let k = 0; k < 9; k++) S.limb(24, 24, 24 + Math.cos(k) * 12, 22 - Math.abs(Math.sin(k * 1.7)) * 16, 1.4, ['#1a3a1a', '#2a5a2a', '#4a8a3a']); }
  else { back(['#30343c', '#14161c']); S.limb(0, 6, W, 6, 1, ['#111', '#222']); S.shape([[14, 7], [34, 7], [38, 14], [33, 14], [33, 32], [15, 32], [15, 14], [10, 14]], rp('#3a6aa8', 6)); }
  return S.done();
}

// the clue in the Menagerie still: a woman reflected in a window, seen in
// profile, a snake tattooed coiling up her neck under the ear; lit pink from
// a sign on one side, the window's blue on the other
function snakeNeckArt(seed) {
  const W = 72, H = 54, S = new Spr(W, H, 650 + (seed % 5)); S.ax = 0; S.ay = 0;
  // the glass: dark blue, streaks of reflection, a smear of pink sign
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let c = mixRgb([14, 22, 36], [30, 44, 66], y / H); if ((x + y * 0.6) % 19 < 1.5) c = mixRgb(c, [90, 120, 150], 0.35); if (x > 56) c = mixRgb(c, [120, 30, 80], (x - 56) / 30); S.px(x, y, c); }
  const skin = ['#3a2018', '#6a3a28', '#9a5a40', '#c88060', '#e8a888', '#ffd0b8'], hair = ['#06040a', '#120c14', '#22161e', '#3a2a30', '#5a4048'];
  const coat = ['#081414', '#102424', '#1a3434', '#2a4a48', '#4a6a64'];
  // shoulders and a coat collar turned up
  S.shape([[2, 54], [8, 44], [22, 40], [34, 44], [46, 42], [62, 46], [70, 54]], coat, { down: 0.4 });
  S.shape([[24, 40], [32, 34], [36, 44], [30, 47]], coat, { down: 0.2 });
  // the neck, turned a little away: the side of it is where the tattoo is
  S.shape([[30, 26], [44, 30], [46, 44], [32, 46], [28, 36]], skin, { down: 0.3, bias: 0.05 });
  // the face in profile, looking right: brow, nose, lips, chin, jaw
  S.shape([[34, 8], [44, 6], [50, 10], [52, 16], [51, 20], [55, 25], [52, 27], [53, 30], [51, 32], [52, 35], [48, 38], [42, 37], [36, 32], [32, 22]], skin, { down: 0.25, bias: 0.1 });
  // the eye, a brow, the mouth's line, a nostril, the ear under the hair
  for (const [x, y, c] of [[47, 16, '#1a1010'], [48, 16, '#1a1010'], [46, 17, '#3a2a28'], [48, 17, '#e8d8d0'], [45, 14, '#2a1a18'], [46, 14, '#2a1a18'], [47, 13, '#2a1a18'], [48, 13, '#2a1a18'], [52, 26, '#6a3028'], [50, 31, '#8a3a3a'], [51, 31, '#8a3a3a'], [49, 31, '#6a2a2a']]) S.px(x, y, c);
  S.ell(37, 22, 2.6, 3.4, skin.slice(1));
  // hair: a dark bob over the back of the head and the ear, a fringe
  S.shape([[22, 10], [30, 3], [42, 2], [50, 6], [52, 10], [46, 9], [40, 10], [38, 16], [40, 22], [38, 30], [34, 34], [26, 34], [20, 26]], hair, { down: 0.2 });
  for (let k = 0; k < 6; k++) S.px(30 + k * 3, 5 + (k % 2), '#6a5058');
  // the snake: coiled from the collar up the side of the neck, its head under the ear
  const body = [];
  for (let k = 0; k <= 60; k++) { const t = k / 60; body.push([36 + Math.sin(t * Math.PI * 3.2) * 4.5 + t * 2, 45 - t * 17]); }
  body.forEach(([x, y], k) => { const w = 1.6 - k / 80; for (let d = -w; d <= w; d += 0.5) S.px(x + d, y, k % 4 < 2 ? '#1a9a88' : '#127068', true); if (k % 6 === 0) S.px(x, y, '#3af0e0', true); });
  const [hx, hy] = body[60]; S.ell(hx + 1.5, hy - 1, 2.4, 1.6, ['#0e6a60', '#1a9a88', '#3ac8b8'], { glow: true }); S.px(hx + 2.5, hy - 1.5, '#ff3040', true); S.px(hx + 4, hy - 0.5, '#ff4060'); S.px(hx + 5, hy - 0.2, '#ff4060');
  // pink light from the sign along the face's edge
  for (let y = 8; y < 38; y++) for (let x = W - 1; x > 30; x--) { const c = S.get(x, y); if (c && (skin.some((q) => rgb(q).join() === c.join()) || c[0] > 120)) { S.px(x, y, mixRgb(c, [255, 120, 190], 0.45)); break; } }
  return S.done();
}

// the other clues that are people, at the same size: Halden carrying a woman
// up through a lobby, a girl sitting in the Root's cables, a face in a hood
function peopleArt(kind, seed) {
  const W = 72, H = 54, S = new Spr(W, H, 660 + kind.length + (seed % 5)); S.ax = 0; S.ay = 0;
  const skin = ['#3a2018', '#6a3a28', '#9a5a40', '#c88060', '#e8a888'], pale = ['#4a3a34', '#7a6058', '#b09080', '#d8c0b0', '#f0e0d8'];
  const bg = (a, b) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S.px(x, y, mixRgb(col3(a), col3(b), y / H + (hash(x >> 2, y >> 2, 7) - 0.5) * 0.08)); };
  if (kind === 'carry') {
    // a lobby: a lit lift door behind, a floor line
    bg('#1a2230', '#0a0e14'); panel(S, 46, 4, 66, 46, ['#8aa0b8', '#c8d8e8', '#e8f4ff'], { a: 0.5, b: 0.3, glow: true }); for (let y = 4; y < 46; y++) S.px(56, y, '#4a5a6a'); for (let x = 0; x < W; x++) S.px(x, 46, '#3a4450');
    // Halden: tall, a long dark coat, walking right, head turned to the lift
    S.shape([[22, 14], [32, 14], [36, 30], [38, 46], [30, 46], [27, 36], [24, 46], [16, 46], [19, 30]], ['#08080c', '#14141c', '#22222e', '#3a3a4a', '#5a5a6a'], { down: 0.3 });
    S.ell(28, 9, 3.6, 4.4, pale); for (let x = 25; x < 32; x++) S.px(x, 5, '#d8d8e0'); S.px(30, 9, '#ff3040', true);
    // the woman across his arms: her head hanging back, hair down, a pale dress
    S.shape([[10, 22], [40, 21], [42, 26], [12, 28]], ['#5a5058', '#9a909a', '#c8c0c8', '#e8e0e8'], { down: 0.2 });
    S.ell(9, 24, 3.4, 3, skin); S.limb(7, 26, 5, 36, 2.2, ['#1a1010', '#2a1a14', '#3a2418']); S.limb(40, 23, 46, 30, 1.2, skin); S.limb(42, 26, 48, 33, 1.2, skin);
    S.limb(24, 18, 22, 27, 1.6, ['#14141c', '#22222e']); S.limb(32, 18, 34, 26, 1.6, ['#14141c', '#22222e']);
  } else if (kind === 'girl') {
    // the Root's chamber: dark violet, cables curling round her like a cat
    bg('#1a0e26', '#06040a');
    for (let k = 0; k < 4; k++) for (let a = -0.4; a < Math.PI * 1.6; a += 0.02) { const r = 18 + k * 5, x = 34 + Math.cos(a) * r * 1.2, y = 40 + Math.sin(a) * r * 0.45; S.px(x, y, k % 2 ? '#7a3ac8' : '#a86aff', k === 1); S.px(x, y + 1, '#2a103a'); }
    // a small girl sitting hugging her knees, side on, facing right
    S.shape([[26, 26], [36, 24], [42, 36], [38, 44], [24, 44], [22, 34]], ['#2a2a3a', '#4a4a5e', '#6a6a82', '#9a9ab0'], { down: 0.25 });
    S.shape([[34, 30], [44, 30], [46, 40], [40, 44], [34, 40]], ['#3a3048', '#5a4a6a', '#7a6a8a'], { down: 0.2 });
    S.ell(32, 18, 5, 5.6, skin); S.shape([[26, 12], [34, 10], [38, 14], [36, 16], [30, 16], [28, 26], [25, 22]], ['#06040a', '#140c14', '#2a1a20', '#4a3038']);
    S.px(35, 18, '#1a1010'); S.px(36, 18, '#c8a0ff', true); S.limb(36, 30, 42, 34, 1.4, skin);
    S.ell(34, 46, 9, 1.4, ['#140a20', '#24123a']);
  } else {
    // a face in a hood, three-quarters to the camera: shadow, and one eye lit wrong
    bg('#202630', '#0a0c12');
    S.shape([[18, 54], [20, 30], [26, 10], [38, 4], [50, 10], [56, 30], [58, 54]], ['#0a0a10', '#16161e', '#24242e', '#383844', '#50505e'], { down: 0.2 });
    S.shape([[28, 18], [46, 16], [50, 30], [46, 42], [36, 46], [28, 40], [26, 28]], skin, { down: 0.35, bias: -0.05 });
    for (let x = 26; x < 52; x++) for (let y = 14; y < 24; y++) { const c = S.get(x, y); if (c) S.px(x, y, mixRgb(c, [6, 4, 8], 0.55 - (y - 14) * 0.04)); }
    S.px(32, 26, '#1a1010'); S.px(33, 26, '#1a1010'); S.px(42, 26, '#ffb040', true); S.px(43, 26, '#ffe0a0', true); S.px(42, 27, '#c86010', true);
    S.limb(37, 27, 38, 34, 0.8, ['#6a3a28', '#9a5a40']); S.limb(33, 38, 42, 38, 0.8, ['#6a2a2a', '#8a3a3a']);
  }
  return S.done();
}
