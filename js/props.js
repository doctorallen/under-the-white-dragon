'use strict';
// Props: the city's furniture, painted from shapes, anchored at the bottom
// middle unless they hang (ay = 0).
function vending(o = {}) {
  const S = new Spr(16, 26, 41); S.ax = 8; S.ay = 25; const c = col3(o.col || '#ff4ab0');
  S.box(0, 0, 15, 25, rp(o.body || '#c83a5a'), { lo: 0, hi: 5 });
  S.box(2, 2, 10, 17, ['#1a0e18', '#2a1a2a'], { lo: 0, hi: 1 });
  for (let y = 3; y < 17; y += 3) for (let x = 3; x < 10; x += 2) S.px(x, y, ['#ff6060', '#60d0ff', '#ffd040', '#80ff80'][(x + y) % 4], true);
  for (let y = 2; y < 18; y++) S.px(12, y, c, true);
  S.box(12, 9, 14, 11, ['#101014', '#30303a']); S.box(2, 20, 10, 23, ['#06060a', '#141418']);
  for (let x = 1; x < 15; x++) S.px(x, 1, mixRgb(c, [255, 255, 255], 0.5), true);
  return S.done();
}
function stall(o = {}) {
  const S = new Spr(64, 44, 43); S.ax = 32; S.ay = 43; const aw = rp(o.awning || '#c83030'), wd = MAT.wood;
  S.box(4, 26, 60, 43, wd, { lo: 0, hi: 6 }); S.box(2, 24, 62, 27, wd, { lo: 2, hi: 8 });
  for (let x = 8; x < 58; x += 9) for (let y = 30; y < 42; y++) S.px(x, y, wd[0]);
  for (const x of [5, 58]) S.box(x, 6, x + 1, 24, MAT.steel, { lo: 1, hi: 6 });
  // the awning, striped, scalloped
  for (let x = 0; x < 64; x++) for (let y = 0; y < 8 + (x % 8 < 4 ? 1 : 0); y++) S.px(x, y, tone(aw, ((x >> 3) % 2 ? 0.7 : 0.35) - y * 0.03 + (y < 1 ? 0.25 : 0)));
  // lanterns, pots, steam
  for (const x of [14, 32, 50]) { S.limb(x, 9, x, 11, 1, ['#222', '#444']); S.ell(x, 14, 2.6, 3, ['#8a2010', '#f05030', '#ffc080'], { glow: true }); }
  S.ell(20, 22, 6, 3, MAT.steel); S.ell(40, 22, 5, 3, MAT.copper);
  for (let k = 0; k < 18; k++) S.px(20 + Math.sin(k * 0.7) * 2, 18 - k * 0.6, '#c8c8d4');
  // a menu board
  S.box(26, 11, 38, 19, ['#0a0a0e', '#16161c']); for (let y = 13; y < 18; y += 2) for (let x = 28; x < 37; x++) if (hash(x, y, 4) > 0.35) S.px(x, y, '#ffe080', true);
  return S.done();
}
function acUnit() { const S = new Spr(14, 10, 45); S.ax = 7; S.ay = 9; S.box(0, 0, 13, 9, rp('#7a7a72'), { lo: 0, hi: 5 }); S.ell(5, 5, 3, 3, ['#1a1a1a', '#3a3a3a', '#5a5a5a']); for (let y = 2; y < 8; y += 2) for (let x = 9; x < 13; x++) S.px(x, y, '#2a2a28'); return S.done(); }
function stool() { const S = new Spr(8, 9, 46); S.ax = 4; S.ay = 8; S.ell(4, 1.5, 3.5, 1.2, rp('#c83a3a')); S.limb(4, 2, 4, 8, 1, MAT.chrome); S.limb(1, 8, 7, 8, 1, MAT.chrome); return S.done(); }
function crate(o = {}) { const w = o.w || 12, h = o.h || 10, S = new Spr(w, h, 47); S.ax = w / 2; S.ay = h - 1; S.box(0, 0, w - 1, h - 1, rp(o.col || '#4a5a3a'), { lo: 0, hi: 5 }); for (let x = 0; x < w; x++) S.px(x, 2, rp(o.col || '#4a5a3a')[0]); if (o.label) for (let x = 2; x < 6; x++) S.px(x, 5, col3(o.label)); return S.done(); }
function barrelFire() {
  const S = new Spr(12, 22, 48); S.ax = 6; S.ay = 21; S.ell(6, 15, 5.5, 6.5, MAT.rust, { mask: (x, y) => y > 9 }); S.box(1, 9, 11, 21, MAT.rust, { lo: 0, hi: 6 });
  for (let x = 1; x < 12; x++) { S.px(x, 12, MAT.rust[1]); S.px(x, 18, MAT.rust[1]); }
  for (let k = 0; k < 26; k++) { const x = 2 + hash(k, 1, 4) * 8, y = 9 - hash(k, 2, 4) * hash(k, 3, 4) * 9; S.px(x, y, y < 3 ? '#ffe0a0' : y < 6 ? '#ffa040' : '#e04010', true); }
  return S.done();
}
function car(o = {}) {
  const S = new Spr(60, 22, 49); S.ax = 30; S.ay = 21; const b = rp(o.col || '#3a2a48', 7), gl = MAT.glass;
  S.poly([[2, 12], [12, 10], [20, 3], [42, 3], [50, 10], [58, 11], [59, 18], [1, 18]], (x, y) => tone(b, 0.7 - y / 30 - x / 200 + (y < 5 ? 0.2 : 0)));
  S.poly([[21, 5], [41, 5], [47, 10], [15, 10]], (x, y) => tone(gl, 0.55 - (x - 15) / 60 + ((x + y) % 7 === 0 ? 0.3 : 0)));
  S.box(1, 15, 59, 18, b, { lo: 0, hi: 3 });
  for (const x of [13, 47]) S.ell(x, 18, 4.2, 3.6, ['#08080a', '#1a1a1e', '#3a3a40']);
  for (let x = 2; x < 58; x++) if (x < 6 || x > 54) S.px(x, 13, x < 6 ? '#ff2020' : '#fff4d0', true);
  if (o.under) for (let x = 6; x < 54; x++) S.px(x, 20, col3(o.under), true);
  return S.done();
}
function terminal(o = {}) {
  const S = new Spr(14, 22, 51); S.ax = 7; S.ay = 21; const c = col3(o.col || '#3af0e0');
  S.box(3, 8, 10, 21, MAT.steelD, { lo: 1, hi: 6 }); S.box(0, 0, 13, 9, MAT.steel, { lo: 1, hi: 6 });
  for (let y = 2; y < 8; y++) for (let x = 2; x < 12; x++) S.px(x, y, (y % 2 && hash(x, y, 5) > 0.4) ? c : mixRgb(c, [0, 0, 0], 0.75), true);
  return S.done();
}
function rack(o = {}) {
  const h = o.h || 40, S = new Spr(16, h, 53); S.ax = 8; S.ay = h - 1;
  S.box(0, 0, 15, h - 1, MAT.steelD, { lo: 0, hi: 5 });
  for (let y = 3; y < h - 3; y += 4) { for (let x = 2; x < 14; x++) S.px(x, y, MAT.steelD[0]); for (let x = 3; x < 13; x += 2) if (hash(x, y, o.seed || 3) > 0.45) S.px(x, y + 2, ['#3aff80', '#3af0e0', '#ffb040', '#ff3040'][Math.floor(hash(x, y, 9) * (o.warn ? 4 : 2))], true); }
  return S.done();
}
function shutter(o = {}) { const w = o.w || 28, h = o.h || 22, S = new Spr(w, h, 55); S.ax = w / 2; S.ay = h - 1; S.box(0, 0, w - 1, h - 1, rp(o.col || '#5a5a60'), { lo: 0, hi: 5, }); for (let y = 2; y < h; y += 2) for (let x = 1; x < w - 1; x++) S.px(x, y, rp(o.col || '#5a5a60')[0]); if (o.tag) for (let k = 0; k < 18; k++) S.px(4 + k + Math.sin(k) * 1, h / 2 + Math.sin(k * 0.8) * 3, col3(o.tag)); return S.done(); }
function capsule(o = {}) {
  // a capsule's end, seen from the hall: a plastic frame round a rounded
  // opening; open and lit, or shuttered with a status light
  const W = 58, H = 40, S = new Spr(W, H, 57 + (o.seed || 0)); S.ax = W / 2; S.ay = H - 1;
  const fr = rp(o.col || '#d8d4c8', 7);
  S.box(0, 0, W - 1, H - 1, fr, { lo: 1, hi: 6 });
  const inside = (x, y) => x > 5 && x < W - 6 && y > 4 && y < H - 6 && !((x < 9 || x > W - 10) && (y < 8 || y > H - 10) && Math.hypot(x < 9 ? x - 9 : x - (W - 10), y < 8 ? y - 8 : y - (H - 10)) > 3.5);
  if (o.lit) {
    S.box(5, 4, W - 6, H - 6, ['#3a2a20', '#6a5040', '#9a7a5a', '#c8a880', '#f0dcc0'], { lo: 1, hi: 4, mask: inside });
    for (let x = 6; x < W - 6; x++) for (let y = H - 13; y < H - 6; y++) if (inside(x, y)) S.px(x, y, (y === H - 13) ? '#f0f0f4' : (x + y) % 5 ? '#5a7aa8' : '#3a5a88');
    S.cap(10, H - 15, 16, H - 15, 2, 2, ['#c8c8d0', '#e8e8f0', '#ffffff']);
    S.px(W - 12, 9, '#ffd8a0', true); S.px(W - 13, 9, '#ffd8a0', true); S.px(W - 12, 10, '#f0a050', true);
    for (let y = 8; y < 14; y++) for (let x = 10; x < 18; x++) if ((x + y) % 2) S.px(x, y, '#3af0e0', true);
  } else {
    S.box(5, 4, W - 6, H - 6, rp(o.shut || '#8a8a90', 6), { lo: 0, hi: 4, mask: inside });
    for (let y = 7; y < H - 6; y += 3) for (let x = 6; x < W - 6; x++) if (inside(x, y)) S.px(x, y, rp(o.shut || '#8a8a90', 6)[1]);
  }
  S.px(W - 4, H - 4, o.lit ? '#3aff80' : '#ff3040', true); S.px(3, 2, '#3a3a3a');
  for (let k = 0; k < 3; k++) S.px(4 + k * 2, H - 3, '#2a2a2a');
  return S.done();
}
function docChair() {
  const S = new Spr(40, 34, 59); S.ax = 20; S.ay = 33;
  S.box(16, 22, 22, 33, MAT.chrome, { lo: 1, hi: 7 }); S.box(8, 30, 30, 33, MAT.steelD, { lo: 1, hi: 6 });
  S.poly([[4, 18], [34, 18], [36, 22], [2, 22]], (x, y) => tone(MAT.plastic, 0.7 - y / 50 - x / 120));
  S.poly([[30, 4], [34, 4], [37, 18], [32, 18]], (x, y) => tone(MAT.plastic, 0.55 - y / 40));
  // the arm over it: a lamp, a needle
  S.limb(2, 33, 4, 2, 1.6, MAT.chrome); S.limb(4, 2, 18, 6, 1.4, MAT.chrome); S.limb(18, 6, 20, 12, 1, MAT.chrome);
  for (let x = 14; x < 22; x++) S.px(x, 5, '#e0fbff', true);
  S.px(20, 13, '#3af0e0', true);
  return S.done();
}
function holo(w, h, colr, kind = 'fish', seed = 1) {
  const S = new Spr(w, h, seed); S.ax = 0; S.ay = 0; const c = col3(colr);
  const put = (x, y, k = 1) => S.px(x, y, mixRgb(c, [255, 255, 255], k > 1 ? 0.5 : 0), true);
  if (kind === 'fish') { for (let a = 0; a < Math.PI * 2; a += 0.03) { const x = w / 2 + Math.cos(a) * w * 0.32, y = h / 2 + Math.sin(a) * h * 0.18 * (1 + Math.cos(a) * 0.3); put(x, y); } for (let k = 0; k < 10; k++) { put(w * 0.18 - k * 0.3, h / 2 - k, 1); put(w * 0.18 - k * 0.3, h / 2 + k, 1); } put(w * 0.72, h * 0.45, 2); for (let k = 0; k < 12; k++) put(w * 0.38 + k * 2, h * 0.5 + Math.sin(k) * 2); }
  if (kind === 'face') { for (let a = 0; a < Math.PI * 2; a += 0.04) put(w / 2 + Math.cos(a) * w * 0.3, h * 0.45 + Math.sin(a) * h * 0.38); for (const ex of [-0.12, 0.12]) for (let k = -2; k <= 2; k++) put(w / 2 + ex * w + k, h * 0.38, 2); for (let k = -4; k <= 4; k++) put(w / 2 + k, h * 0.62 + Math.abs(k) * 0.3); }
  if (kind === 'bars') { for (let k = 0; k < 6; k++) { const bh = 4 + hash(k, 1, seed) * (h - 8); for (let y = 0; y < bh; y++) if (y % 2 === 0) for (let x = 0; x < 3; x++) put(4 + k * 6 + x, h - 3 - y); } }
  // scanlines: every other row dimmed
  const out = S.done(), g = out.e.getContext('2d'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.55)'; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 1);
  const g2 = out.c.getContext('2d'); g2.globalCompositeOperation = 'destination-out'; g2.fillStyle = 'rgba(0,0,0,0.75)'; g2.fillRect(0, 0, w, h);
  return out;
}
// the part of a sprite below a line, for drawing in front of people
function lowerPart(s, y0) {
  const cut = (src) => { if (!src) return null; const [c, g] = canvasOf(src.width, src.height); g.drawImage(src, 0, y0, src.width, src.height - y0, 0, y0, src.width, src.height - y0); return c; };
  return Object.assign({}, s, { c: cut(s.c), e: cut(s.e) });
}

// ---- things you can open, strip and use ----------------------------------------
// a steel grate over a gap: bars you cut through
function grate(o = {}) {
  const w = o.w || 12, h = o.h || 30, S = new Spr(w, h, 63); S.ax = w / 2; S.ay = h - 1;
  for (let x = 0; x < w; x++) { S.px(x, 0, MAT.steel[6]); S.px(x, 1, MAT.steel[3]); S.px(x, h - 1, MAT.steel[2]); S.px(x, h - 2, MAT.steel[4]); }
  for (let x = 1; x < w; x += 3) for (let y = 2; y < h - 2; y++) { S.px(x, y, MAT.steel[5]); S.px(x + 1, y, MAT.steel[2]); }
  for (let y = 8; y < h - 2; y += 10) for (let x = 0; x < w; x++) S.px(x, y, MAT.steel[4]);
  return S.done();
}
// a reinforced shutter: striped, too heavy for the plain cutter
function heavyShutter(o = {}) {
  const w = o.w || 30, h = o.h || 30, S = new Spr(w, h, 65); S.ax = w / 2; S.ay = h - 1; const r = rp('#6a6a72', 7);
  S.box(0, 0, w - 1, h - 1, r, { lo: 0, hi: 6 });
  for (let y = 3; y < h; y += 4) for (let x = 1; x < w - 1; x++) S.px(x, y, r[0]);
  for (let x = 0; x < w; x++) for (let y = h - 7; y < h - 2; y++) S.px(x, y, ((x + y) >> 2) % 2 ? '#d8a830' : '#1a1a1a');
  for (const x of [4, w - 5]) for (let y = 2; y < h - 8; y += 6) S.px(x, y, '#c8c8d0');
  return S.done();
}
// a hatch in the floor or a service door, locked until breached
function hatch(o = {}) {
  const w = o.w || 26, h = o.h || 34, S = new Spr(w, h, 67); S.ax = w / 2; S.ay = h - 1; const r = rp(o.col || '#4a5058', 7), c = col3(o.lock || '#ff3040');
  S.box(0, 0, w - 1, h - 1, MAT.steelD, { lo: 1, hi: 6 }); S.box(3, 3, w - 4, h - 1, r, { lo: 0, hi: 6 });
  for (let y = 6; y < h - 2; y += 7) for (let x = 4; x < w - 4; x++) S.px(x, y, r[1]);
  S.box(w - 8, h / 2 - 3, w - 5, h / 2 + 3, MAT.steelD, { lo: 1, hi: 5 }); S.px(w - 7, h / 2 - 1, c, true); S.px(w - 6, h / 2 - 1, c, true);
  if (o.stripe) for (let x = 3; x < w - 3; x++) for (let y = 0; y < 3; y++) S.px(x, y, ((x + y) >> 1) % 2 ? '#d8a830' : '#1a1a1a');
  return S.done();
}
// a data node: a column with a core of light; you jack in here
function node(o = {}) {
  const S = new Spr(16, 34, 69); S.ax = 8; S.ay = 33; const c = col3(o.col || '#3af0e0');
  S.box(2, 6, 13, 33, MAT.steelD, { lo: 1, hi: 6 }); S.box(0, 0, 15, 6, MAT.steel, { lo: 1, hi: 7 }); S.box(1, 30, 14, 33, MAT.steel, { lo: 1, hi: 5 });
  for (let y = 9; y < 28; y++) for (let x = 6; x < 10; x++) S.px(x, y, mixRgb(c, [255, 255, 255], (y % 4 === 0) ? 0.5 : 0.05 + (x === 7 ? 0.25 : 0)), o.spent ? 0 : true);
  if (o.spent) for (let y = 9; y < 28; y++) for (let x = 6; x < 10; x++) S.px(x, y, mixRgb(c, [10, 12, 16], 0.85));
  for (let y = 10; y < 28; y += 3) { S.px(3, y, mixRgb(c, [0, 0, 0], 0.4), !o.spent); S.px(12, y, mixRgb(c, [0, 0, 0], 0.5), !o.spent); }
  return S.done();
}
// the freight lift: a cage, dark until you get it running
function liftCage(o = {}) {
  const S = new Spr(34, 46, 71); S.ax = 17; S.ay = 45; const r = MAT.steel;
  for (let x = 0; x < 34; x++) { S.px(x, 0, r[6]); S.px(x, 1, r[3]); S.px(x, 45, r[2]); S.px(x, 44, r[5]); }
  for (let y = 2; y < 44; y++) { S.px(0, y, r[5]); S.px(1, y, r[2]); S.px(32, y, r[4]); S.px(33, y, r[1]); }
  for (let x = 3; x < 32; x += 4) for (let y = 3; y < 44; y++) if ((y + x) % 2 === 0) S.px(x, y, r[3]);
  const c = o.on ? '#3aff80' : '#ff3040'; S.px(28, 20, c, true); S.px(29, 20, c, true); S.px(28, 21, c, true);
  if (o.on) for (let x = 4; x < 30; x++) S.px(x, 3, '#e8f8ff', true);
  return S.done();
}
// a door: apartment, bar or clinic, with a light over it
function door(o = {}) {
  const w = o.w || 20, h = o.h || 32, S = new Spr(w + 4, h + 6, 73); S.ax = (w + 4) / 2; S.ay = h + 5; const r = rp(o.col || '#3a3440', 7), c = col3(o.light || '#ffd8a0');
  S.box(0, 4, w + 3, h + 5, MAT.steelD, { lo: 1, hi: 6 }); S.box(2, 6, w + 1, h + 5, r, { lo: 0, hi: 6 });
  if (o.open) S.box(3, 7, w, h + 5, ['#2a1a10', '#6a4020', '#a87040', '#e8b070'], { lo: 0, hi: 3, glow: true });
  for (let x = 2; x < w + 2; x++) S.px(x, 1, c, true);
  for (let x = 4; x < w; x++) S.px(x, 2, mixRgb(c, [0, 0, 0], 0.4), true);
  S.px(w - 2, h / 2 + 6, '#c8c8d0');
  return S.done();
}
function junk(o = {}) {
  const S = new Spr(26, 14, 75 + (o.seed || 0)); S.ax = 13; S.ay = 13;
  for (let k = 0; k < 9; k++) { const x = 3 + hash(k, 1, o.seed || 1) * 20, y = 7 + hash(k, 2, o.seed || 1) * 5, w = 2 + hash(k, 3, o.seed || 1) * 5; S.ell(x, y, w, 2 + hash(k, 4, o.seed || 1) * 3, [MAT.rust, MAT.steel, MAT.plastic, MAT.concrete][k % 4]); }
  S.px(9, 6, '#3af0e0', true);
  return S.done();
}
function wreck(o = {}) {
  // a downed drone: rotors bent, one eye still lit
  const S = new Spr(24, 12, 77); S.ax = 12; S.ay = 11;
  S.ell(12, 8, 7, 3.4, rp('#3a4048')); S.limb(2, 10, 7, 6, 1, MAT.steel); S.limb(22, 4, 17, 6, 1, MAT.steel);
  S.px(15, 8, '#ff3040', true);
  return S.done();
}
// a stripped machine: darker, its lights out, gaps where its parts were
function stripped(s) {
  const [c, g] = canvasOf(s.w, s.h); g.drawImage(s.c, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(8,6,12,0.55)'; g.fillRect(0, 0, s.w, s.h);
  g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < Math.max(3, s.w * s.h / 60); k++) g.fillRect(Math.floor(hash(k, 1, s.w) * s.w), Math.floor(hash(k, 2, s.h) * s.h), 1 + Math.floor(hash(k, 3, 9) * 3), 1);
  return Object.assign({}, s, { c, e: null });
}
