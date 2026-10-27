'use strict';
// Props: the city's furniture, painted from shapes, anchored at the bottom
// middle unless they hang (ay = 0).
// a drinks machine, a person's height: rows of cans behind glass, a lit
// strip, the coin slot and the flap at the bottom
function vending(o = {}) {
  const S = new Spr(22, 36, 41); S.ax = 11; S.ay = 35; const c = col3(o.col || '#ff4ab0');
  S.box(0, 0, 21, 35, rp(o.body || '#c83a5a'), { lo: 0, hi: 5 });
  S.box(2, 3, 14, 24, ['#1a0e18', '#2a1a2a'], { lo: 0, hi: 1 });
  for (let y = 5; y < 24; y += 4) { for (let x = 3; x < 14; x += 3) { const q = ['#ff6060', '#60d0ff', '#ffd040', '#80ff80'][(x + y) % 4]; S.px(x, y, q, true); S.px(x + 1, y, q, true); S.px(x, y + 1, q, true); S.px(x + 1, y + 1, q); } for (let x = 2; x < 14; x++) S.px(x, y + 2, '#3a3040'); }
  for (let y = 3; y < 25; y++) S.px(16, y, c, true);
  S.box(16, 12, 19, 15, ['#101014', '#30303a']); S.px(17, 17, '#3aff80', true); S.box(2, 27, 14, 32, ['#06060a', '#141418']);
  for (let x = 1; x < 21; x++) S.px(x, 1, mixRgb(c, [255, 255, 255], 0.5), true);
  return S.done();
}
// ---- the businesses' machines: someone owns these, and stripping one is
// theft (OWNED in things.js). Each sits at people scale; the ones that sit on
// a counter or hang on a wall are lifted (o.lift) but anchored at the floor,
// so you reach them from where you stand.
function lifted(S, H, lift) { S.ay = H - 1 + (lift || 0); return S; }
function cashRegister(o = {}) {
  const S = lifted(new Spr(22, 16, 450), 16, o.lift === undefined ? 30 : o.lift); S.ax = 11;
  S.box(0, 8, 21, 15, rp('#3a3e48', 6), { lo: 1, hi: 5 }); S.box(1, 12, 20, 15, rp('#2a2e36', 5)); S.px(10, 13, '#c8c8d0');
  for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) S.px(3 + k * 2, 9 + r * 2, '#e8e0d0');
  S.part(); S.box(12, 0, 20, 8, rp('#1a1c22', 4)); for (let x = 13; x < 20; x++) S.px(x, 3, '#3aff80', true); S.px(14, 5, '#3aff80', true); S.px(16, 5, '#3aff80', true);
  return S.done();
}
function handDryer(o = {}) {
  const S = lifted(new Spr(14, 16, 451), 16, o.lift === undefined ? 34 : o.lift); S.ax = 7;
  S.box(0, 0, 13, 11, rp('#d8dce0', 6), { lo: 1, hi: 5 }); S.box(4, 11, 9, 15, rp('#a8acb4', 5)); S.px(3, 4, '#ff4a4a', true); for (let x = 5; x < 11; x++) S.px(x, 7, '#8a909a');
  return S.done();
}
function jukebox() {
  const S = new Spr(28, 44, 452); S.ax = 14; S.ay = 43;
  S.box(1, 14, 26, 43, rp('#5a2a1a', 6), { lo: 1, hi: 5 }); S.ell(13.5, 14, 13, 13, rp('#7a3a1a', 6));
  for (let a = Math.PI; a < Math.PI * 2; a += 0.04) for (const [r, c] of [[12, '#ff4ab0'], [10, '#ffd040'], [8, '#3af0e0']]) S.px(13.5 + Math.cos(a) * r, 14 + Math.sin(a) * r, c, true);
  S.box(6, 16, 21, 26, rp('#1a1014', 4)); for (let k = 0; k < 4; k++) S.px(8 + k * 4, 21, '#e8e0d0', true);
  for (let y = 30; y < 41; y += 2) for (let x = 4; x < 24; x += 2) S.px(x, y, '#2a1410');
  for (let y = 14; y < 43; y++) { S.px(1, y, '#ff4ab0', true); S.px(26, y, '#3af0e0', true); }
  return S.done();
}
function arcadeCab(o = {}) {
  const S = new Spr(24, 46, 453); S.ax = 12; S.ay = 45; const c = col3(o.col || '#3af0e0');
  S.box(1, 0, 22, 45, rp(o.body || '#2a1a4a', 6), { lo: 1, hi: 5 }); S.box(2, 1, 21, 7, rp('#1a0e2a', 4)); for (let x = 4; x < 20; x++) S.px(x, 4, c, true);
  S.box(3, 9, 20, 22, rp('#0a0a14', 4)); for (let k = 0; k < 18; k++) S.px(5 + Math.floor(hash(k, 1, 453 + (o.seed || 0)) * 13), 11 + Math.floor(hash(k, 2, 453 + (o.seed || 0)) * 9), ['#ff4ab0', '#ffd040', '#3af0e0', '#ffffff'][k % 4], true);
  S.box(1, 24, 22, 28, rp('#3a3a48', 5)); S.px(6, 25, '#ff3040', true); S.px(14, 25, '#3aff80', true); S.px(17, 25, '#3a8aff', true); S.px(6, 24, '#c8c8d0');
  S.box(8, 34, 15, 37, ['#06060a', '#141418']); S.px(11, 35, '#ffd040', true);
  return S.done();
}
function pachinko(o = {}) {
  const S = new Spr(22, 46, 454); S.ax = 11; S.ay = 45;
  S.box(0, 0, 21, 45, rp('#c8b060', 6), { lo: 1, hi: 5 }); S.box(2, 3, 19, 26, rp('#1a2a4a', 4));
  for (let y = 5; y < 25; y += 3) for (let x = 4 + (y % 2); x < 18; x += 3) S.px(x, y, '#e8e8f0');
  S.ell(10.5, 14, 4, 4, ['#ff4ab0', '#ff8ad8', '#ffd0f0']); for (let k = 0; k < 4; k++) S.px(5 + k * 4, 22, ['#ffd040', '#3af0e0'][k % 2], true);
  S.box(2, 28, 19, 33, rp('#e8e0d0', 5)); for (let x = 4; x < 18; x += 2) S.px(x, 30, '#c8c8d0'); S.ell(17, 37, 2.5, 2.5, rp('#3a3a48', 5));
  for (let x = 1; x < 21; x++) S.px(x, 1, (x >> 1) % 2 ? '#ffd040' : '#ff4ab0', true);
  return S.done();
}
function coffeeMachine(o = {}) {
  const S = lifted(new Spr(16, 22, 455), 22, o.lift === undefined ? 30 : o.lift); S.ax = 8;
  S.box(0, 0, 15, 21, rp('#5a6070', 6), { lo: 1, hi: 5 }); S.box(3, 9, 12, 18, rp('#1a1c22', 4)); S.box(6, 9, 9, 11, rp('#8a909a', 5)); S.box(5, 15, 10, 18, rp('#e8e0d0', 5)); S.px(3, 3, '#3aff80', true); S.px(6, 3, '#ff8a3a', true);
  return S.done();
}
function atm() {
  const S = new Spr(24, 40, 456); S.ax = 12; S.ay = 39;
  S.box(0, 0, 23, 39, rp('#3a4048', 6), { lo: 1, hi: 5 }); S.box(1, 0, 22, 5, rp('#1a3a6a', 5)); for (let x = 4; x < 20; x++) S.px(x, 2, '#9ad0ff', true);
  S.box(4, 8, 19, 18, rp('#0a1420', 4)); for (let x = 6; x < 17; x++) S.px(x, 11, '#3af0e0', true); for (let x = 6; x < 13; x++) S.px(x, 14, '#3af0e0', true);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) S.box(5 + k * 4, 21 + r * 3, 7 + k * 4, 22 + r * 3, rp('#c8c8d0', 5)); S.box(17, 21, 20, 23, ['#06060a', '#141418']); S.px(18, 22, '#3aff80', true); S.box(5, 31, 18, 33, ['#06060a', '#141418']);
  return S.done();
}
function ticketMachine() {
  const S = new Spr(20, 38, 457); S.ax = 10; S.ay = 37;
  S.box(0, 0, 19, 37, rp('#e8b030', 6), { lo: 1, hi: 5 }); S.box(3, 4, 16, 14, rp('#0a1014', 4)); for (let x = 5; x < 14; x++) S.px(x, 8, '#ffd040', true); for (let x = 5; x < 11; x++) S.px(x, 11, '#ffd040', true);
  S.box(4, 18, 15, 21, rp('#2a2e36', 5)); S.box(6, 26, 13, 28, ['#06060a', '#141418']); S.px(15, 17, '#3aff80', true);
  return S.done();
}
function karaoke() {
  const S = new Spr(30, 34, 458); S.ax = 15; S.ay = 33;
  for (const x of [0, 21]) { S.box(x, 6, x + 8, 33, rp('#1a1a22', 5), { lo: 1, hi: 4 }); S.ell(x + 4, 14, 3, 3, ['#06060a', '#2a2a34', '#4a4a58']); S.ell(x + 4, 26, 3, 3, ['#06060a', '#2a2a34', '#4a4a58']); }
  S.box(9, 0, 20, 12, rp('#2a2e36', 5)); S.box(10, 1, 19, 10, rp('#0a0a14', 4)); for (let k = 0; k < 4; k++) for (let x = 11; x < 18; x++) if ((x + k) % 3) S.px(x, 3 + k * 2, ['#ff4ab0', '#ffd040'][k % 2], true);
  S.box(10, 24, 19, 33, rp('#3a3a48', 5), { lo: 1, hi: 4 }); S.px(12, 27, '#3aff80', true); S.px(16, 27, '#ff4a4a', true);
  return S.done();
}
function offeringBox() {
  const S = new Spr(24, 18, 459); S.ax = 12; S.ay = 17;
  S.box(0, 3, 23, 17, rp('#5a2a14', 6), { lo: 1, hi: 5 }); for (let x = 2; x < 22; x += 3) for (let y = 4; y < 8; y++) S.px(x, y, '#1a0a06'); S.box(0, 0, 23, 3, rp('#8a3a1a', 6)); S.px(11, 12, '#e8b030', true); S.px(12, 12, '#e8b030', true);
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
// a parked car, at people's scale: about 88 px long and as high as a
// person's chest, a cabin with two windows, wheels, lights at each end
function car(o = {}) {
  const S = new Spr(90, 32, 49); S.ax = 45; S.ay = 31; const b = rp(o.col || '#3a2a48', 7), gl = MAT.glass;
  S.poly([[3, 17], [18, 14], [30, 4], [62, 4], [74, 14], [86, 15], [88, 26], [2, 26]], (x, y) => tone(b, 0.68 - y / 44 - x / 300 + (y < 6 ? 0.2 : 0)));
  S.part(); S.poly([[32, 7], [45, 7], [45, 14], [23, 14]], (x, y) => tone(gl, 0.6 - (x - 23) / 70 + ((x + y) % 9 === 0 ? 0.3 : 0)));
  S.poly([[48, 7], [60, 7], [69, 14], [48, 14]], (x, y) => tone(gl, 0.5 - (x - 48) / 70 + ((x + y) % 9 === 0 ? 0.3 : 0)));
  S.box(2, 21, 88, 26, b, { lo: 0, hi: 3 }); for (let x = 46; x < 47; x++) for (let y = 15; y < 24; y++) S.px(x, y, b[1]); S.px(42, 18, '#c8c8d0'); S.px(58, 18, '#c8c8d0');
  for (const x of [19, 70]) { S.ell(x, 26, 6.2, 5.4, ['#08080a', '#1a1a1e', '#3a3a40']); S.ell(x, 26, 2.4, 2.2, ['#3a3a40', '#6a6e78', '#9aa0aa']); }
  for (let y = 16; y < 19; y++) { for (let x = 2; x < 7; x++) S.px(x, y, '#ff2020', true); for (let x = 83; x < 88; x++) S.px(x, y, '#fff4d0', true); }
  if (o.under) for (let x = 8; x < 82; x++) S.px(x, 30, col3(o.under), true);
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
// a reinforced security shutter: a steel frame with a lock box on top, the
// slatted shutter down to the ground, hazard paint, a red light saying locked
function heavyShutter(o = {}) {
  const w = o.w || 30, h = o.h || 30, W = w + 8, H = h + 12, S = new Spr(W, H, 65); S.ax = W / 2; S.ay = H - 1; const r = rp('#7a7e88', 7), fr = rp('#3a3a42', 6);
  for (let y = 0; y < H; y++) for (const x of [0, 1, 2, W - 3, W - 2, W - 1]) S.px(x, y, fr[x < 3 ? 2 + x : 6 - (x - W + 3)]);
  for (let y = 0; y < 10; y++) for (let x = 0; x < W; x++) S.px(x, y, y === 0 ? fr[5] : y === 9 ? fr[0] : fr[2 + ((x >> 3) % 2)]);
  S.px(W / 2 - 1, 4, '#ff2030', true); S.px(W / 2, 4, '#ff2030', true); S.px(W / 2 - 1, 5, '#ff6070', true); S.px(W / 2, 5, '#ff6070', true);
  for (let y = 10; y < H; y++) for (let x = 3; x < W - 3; x++) S.px(x, y, (y - 10) % 4 === 0 ? r[1] : (y - 10) % 4 === 1 ? r[5] : r[3 + ((x * 7 + y) % 3 === 0 ? 1 : 0)]);
  for (let x = 3; x < W - 3; x++) for (let y = H - 7; y < H - 2; y++) S.px(x, y, ((x + y) >> 2) % 2 ? '#e8b830' : '#1a1a1a');
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

// ---- home: the apartment and the hall outside it ----------------------------
// a flat panel: a door leaf or a cabinet front, lit from the left, a light
// top edge, a dark bottom one (Spr.box shades round, for small things)
function panel(S, x0, y0, x1, y1, ramp, o = {}) {
  const R = ramp.map((c) => (typeof c === 'string' ? rgb(c) : c)), n = R.length - 1, a = o.a === undefined ? 0.55 : o.a, b = o.b === undefined ? 0.35 : o.b;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = y === y0 ? 0.85 : y === y1 ? 0.12 : a + (b - a) * ((x - x0) / Math.max(1, x1 - x0)) + (hash(x, y, 3) - 0.5) * 0.08; S.px(x, y, R[clamp(Math.round(t * n), 0, n)], o.glow); }
}
// a bed against the wall: a frame, a mattress, a rumpled blanket, a pillow
function bed(o = {}) {
  const W = 46, H = 18, S = new Spr(W, H, 201); S.ax = W / 2; S.ay = H - 1;
  panel(S, 0, 10, W - 1, H - 1, MAT.steelD); panel(S, 0, 0, 3, H - 1, MAT.steelD, { a: 0.65, b: 0.5 });
  panel(S, 3, 6, W - 2, 10, rp('#c8c4bc', 6), { a: 0.7, b: 0.5 });
  S.shape([[14, 4], [W - 2, 5], [W - 1, 11], [12, 11], [10, 7]], rp(o.blanket || '#7a3a4a', 7), { down: 0.3, folds: true });
  S.cap(6, 4, 10, 4, 2.4, 1.8, rp('#e8e4dc', 5));
  for (let y = 12; y < H - 2; y += 2) for (let x = 6; x < W - 4; x += 8) S.px(x, y, MAT.steelD[0]);
  return S.done();
}
// a closet: two doors, one open on a rail of coats, and a mirror
function closet() {
  const W = 30, H = 40, S = new Spr(W, H, 202); S.ax = W / 2; S.ay = H - 1; const wd = MAT.wood;
  panel(S, 0, 0, W - 1, H - 1, wd, { a: 0.6, b: 0.45 });
  panel(S, 2, 2, 14, H - 3, ['#140c08', '#2a1a10', '#3a2618'], { a: 0.4, b: 0.6 });
  for (let x = 3; x < 14; x++) S.px(x, 5, MAT.chrome[3]);
  for (const [x, c] of [[4, '#5e4c38'], [8, '#2a2438'], [11, '#34343c']]) S.shape([[x, 6], [x + 3, 6], [x + 3.5, 26], [x - 0.5, 26]], rp(c, 6), { down: 0.25 });
  panel(S, 16, 2, W - 3, H - 3, wd, { a: 0.65, b: 0.5 }); panel(S, 18, 5, W - 5, 24, ['#3a5060', '#6a90a0', '#a8d0dc'], { a: 0.7, b: 0.3 });
  S.px(17, 20, MAT.chrome[4]);
  return S.done();
}
// a kitchenette: a counter, a hotplate, a sink, cups of noodles, a shelf
function kitchen() {
  const W = 44, H = 36, S = new Spr(W, H, 203); S.ax = W / 2; S.ay = H - 1;
  panel(S, 0, 16, W - 1, H - 1, rp('#4a5058', 6)); panel(S, 0, 14, W - 1, 17, rp('#8a8a84', 6), { a: 0.7, b: 0.55 });
  for (let x = 4; x < W - 2; x += 14) { panel(S, x, 20, x + 11, H - 3, rp('#3a4048', 6), { a: 0.5, b: 0.4 }); S.px(x + 9, 24, MAT.chrome[4]); }
  S.ell(10, 13, 4, 1.4, MAT.steelD); S.px(10, 14, '#ff4020', true); S.px(11, 14, '#ff6030', true);
  S.box(26, 13, 36, 15, MAT.chrome, { lo: 1, hi: 5 }); S.limb(34, 13, 34, 8, 0.8, MAT.chrome); S.limb(34, 8, 31, 8, 0.8, MAT.chrome);
  for (const x of [17, 21]) { S.box(x, 9, x + 3, 13, ['#c8c0b0', '#e8e0d0', '#ffffff'], { lo: 1, hi: 2 }); S.px(x + 1, 10, '#d83a3a'); }
  S.box(2, 4, W - 3, 5, MAT.wood, { lo: 1, hi: 5 }); for (let x = 5; x < W - 6; x += 5) S.box(x, 0, x + 2, 3, rp(['#3a8a8a', '#a88a3a', '#8a3a6a'][x % 3]), { lo: 1, hi: 4 });
  return S.done();
}
// a screen on a stand, playing (life.js draws nothing on it; it's a still)
function tvSet(o = {}) {
  const W = 26, H = 26, S = new Spr(W, H, 204); S.ax = W / 2; S.ay = H - 1; const c = col3(o.col || '#3a8aff');
  panel(S, 0, 0, W - 1, 15, MAT.steelD);
  for (let y = 2; y < 14; y++) for (let x = 2; x < W - 2; x++) S.px(x, y, mixRgb(c, [10, 10, 30], 0.35 + hash(x >> 2, y >> 1, 9) * 0.5 + (y % 2) * 0.1), true);
  S.limb(W / 2, 16, W / 2, H - 4, 1, MAT.steelD); S.box(W / 2 - 6, H - 3, W / 2 + 6, H - 1, MAT.steelD, { lo: 1, hi: 4 });
  return S.done();
}
// a plant in a pot, a little sad
function plant() {
  const S = new Spr(14, 22, 205); S.ax = 7; S.ay = 21;
  S.box(3, 15, 10, 21, rp('#8a4a2a', 6), { lo: 1, hi: 5 });
  for (let k = 0; k < 7; k++) { const a = -1.4 + k * 0.45, l = 6 + (k % 3) * 2; S.limb(7, 15, 7 + Math.cos(a - 0.2) * l * 0.6, 15 - Math.sin(Math.abs(a) + 0.6) * l, 1, ['#1a3a1a', '#2a5a2a', '#4a8a3a']); }
  return S.done();
}
// a neighbour's door in the hall: a number plate, a peephole, maybe open
function aptDoor(o = {}) {
  const w = 20, h = 32, S = new Spr(w + 4, h + 6, 206); S.ax = (w + 4) / 2; S.ay = h + 5; const r = rp(o.col || '#4a4450', 7);
  panel(S, 0, 4, w + 3, h + 5, MAT.steelD, { a: 0.6, b: 0.4 });
  if (o.open) { panel(S, 2, 6, w + 1, h + 5, ['#2a1a10', '#6a4020', '#a87040', '#e8b070'], { a: 0.75, b: 0.45 }); for (let y = 8; y < h + 4; y++) S.px(w - 4, y, '#ffd8a0', true); panel(S, w - 3, 6, w + 1, h + 5, r); }
  else { panel(S, 2, 6, w + 1, h + 5, r); S.px(w / 2 + 2, 14, '#c8c8d0'); S.px(w - 2, h / 2 + 6, '#c8c8d0'); }
  // the number, in little lit digits
  panel(S, 5, 7, 13, 11, ['#0a0a0e', '#16161c']); for (let i = 0; i < 3; i++) S.px(6 + i * 2, 9, o.lit || '#ffd8a0', true);
  return S.done();
}
// elevator doors: brushed steel, a seam down the middle, floor lights over them
function elevator(o = {}) {
  const W = 40, H = 48, S = new Spr(W, H, 207); S.ax = W / 2; S.ay = H - 1;
  panel(S, 0, 6, W - 1, H - 1, MAT.steelD, { a: 0.6, b: 0.4 });
  panel(S, 4, 9, W / 2 - 1, H - 1, MAT.chrome, { a: 0.62, b: 0.45 }); panel(S, W / 2, 9, W - 5, H - 1, MAT.chrome, { a: 0.5, b: 0.32 });
  for (let y = 10; y < H; y++) S.px(W / 2 - 1, y, '#141418');
  for (let i = 0; i < 6; i++) S.px(8 + i * 5, 2, i === (o.at || 0) ? '#ffb040' : '#3a3020', i === (o.at || 0));
  panel(S, W - 4, 24, W - 1, 30, MAT.steel); S.px(W - 3, 26, '#3af0e0', true); S.px(W - 3, 28, '#3af0e0', true);
  return S.done();
}

// ---- salvage, as icons for the inventory: 16 px, lit from the upper left ----
function salvageIcon(k) {
  const S = new Spr(16, 16, 300 + k.length), C = SALVAGE[k].col;
  if (k === 'wire') { for (let i = 0; i < 4; i++) S.ell(5 + i * 2, 8, 2.2, 5, MAT.copper); for (let i = 0; i < 4; i++) S.px(5 + i * 2, 4, C[2]); S.limb(12, 9, 15, 13, 1, MAT.copper); }
  if (k === 'alloy') { S.shape([[2, 5], [12, 3], [14, 10], [4, 13]], MAT.steel, { down: 0.3 }); for (const [x, y] of [[4, 6], [11, 5], [12, 10], [5, 11]]) S.px(x, y, MAT.steel[1]); S.limb(3, 5, 12, 3, 0.8, MAT.chrome); }
  if (k === 'glass') { S.ell(8, 8, 6, 6, MAT.steelD); S.ell(8, 8, 4.6, 4.6, rp(C[1], 6), { glow: true }); S.px(6, 6, '#ffffff', true); S.px(7, 5, C[2], true); }
  if (k === 'coolant') { S.cap(8, 5, 8, 13, 4, 4, rp(C[1], 6)); S.box(5, 2, 11, 4, MAT.steel, { lo: 2, hi: 6 }); for (let y = 7; y < 12; y++) S.px(8, y, C[2], true); }
  if (k === 'chips') { S.box(3, 3, 12, 12, ['#14101c', '#241a30', '#3a2a4a'], { lo: 0, hi: 2 }); for (let i = 4; i < 12; i += 2) { S.px(i, 1, MAT.chrome[4]); S.px(i, 14, MAT.chrome[4]); S.px(1, i, MAT.chrome[4]); S.px(14, i, MAT.chrome[4]); } S.box(6, 6, 9, 9, rp(C[1], 4), { glow: true }); }
  S.ax = 8; S.ay = 15; return S.done();
}

// ---- spinners: a police car that flies, and a cab ----------------------------
// a long low wedge on thrusters, a canopy, lights; facing right, at rest on
// its skids (anchored at the bottom middle)
function spinner(o = {}) {
  const W = 66, H = 26, S = new Spr(W, H, o.cab ? 401 : 400); S.ax = W / 2; S.ay = H - 1;
  const body = rp(o.col || (o.cab ? '#e0b028' : '#a8b0c0'), 7), dark = rp('#14141c', 5);
  S.shape([[3, 14], [14, 9], [44, 7], [60, 11], [64, 15], [62, 19], [8, 20], [2, 18]], body, { down: 0.35 });
  S.shape([[20, 9], [28, 3], [44, 3], [50, 8]], ['#0a1420', '#1a3448', '#3a6a88', '#8ac0d8'], { down: 0.2 }); // the canopy
  for (let x = 30; x < 44; x++) S.px(x, 4, '#c8f0ff', x % 3 === 0);
  for (let x = 6; x < 60; x++) { S.px(x, 15, body[6]); S.px(x, 16, o.cab ? '#1a1a1a' : '#2a5aff', !o.cab); } // a lit stripe down the side
  for (let x = 15; x < 58; x++) S.px(x, 9 + (x < 44 ? 0 : (x - 44) * 0.3), body[6]);
  S.box(10, 19, 22, 21, dark, { lo: 0, hi: 3 }); S.box(42, 19, 54, 21, dark, { lo: 0, hi: 3 }); // thruster pods
  for (let x = 11; x < 22; x++) S.px(x, 22, '#3af0e0', true); for (let x = 43; x < 54; x++) S.px(x, 22, '#3af0e0', true);
  S.box(12, 23, 14, 25, dark); S.box(50, 23, 52, 25, dark); S.limb(8, 25, 56, 25, 1, MAT.steelD); // skids
  S.px(63, 14, '#fff8e0', true); S.px(62, 13, '#fff8e0', true); S.px(3, 16, '#ff3040', true); // head and tail lights
  if (o.cab) { S.box(32, 0, 40, 2, rp('#ffd040', 4), { glow: true }); for (let x = 8; x < 58; x += 4) S.px(x, 17, '#1a1a1a'); }
  else { S.box(29, 1, 33, 2, rp('#ff3040', 4), { glow: true }); S.box(40, 1, 44, 2, rp('#3a8aff', 4), { glow: true }); for (let x = 18; x < 40; x += 3) S.px(x, 12, '#1a2a6a'); }
  return S.done();
}
// a desk with a terminal, from the front
function desk(o = {}) {
  const W = 40, H = 24, S = new Spr(W, H, 410); S.ax = W / 2; S.ay = H - 1;
  panel(S, 0, 10, W - 1, H - 1, rp(o.col || '#3a3e48', 6), { a: 0.55, b: 0.4 }); panel(S, 0, 9, W - 1, 11, rp('#6a6e78', 6), { a: 0.75, b: 0.6 });
  panel(S, 22, 0, 34, 8, MAT.steelD); for (let y = 2; y < 7; y++) for (let x = 24; x < 33; x++) S.px(x, y, (y % 2 && hash(x, y, 2) > 0.4) ? '#3af0e0' : '#0a2a2a', true);
  S.box(8, 7, 14, 9, rp('#c8c0a8', 4)); S.px(5, 8, '#ffd040');
  return S.done();
}
// a bench
function bench() { const S = new Spr(30, 10, 411); S.ax = 15; S.ay = 9; panel(S, 0, 3, 29, 5, MAT.steel, { a: 0.7, b: 0.5 }); for (const x of [3, 26]) S.limb(x, 5, x, 9, 1, MAT.steelD); panel(S, 0, 0, 29, 1, MAT.steelD); return S.done(); }

// ---- the ways about, and what cases leave lying around ------------------------
// a subway platform's door and sign
function subwayDoor() {
  const S = new Spr(44, 50, 430); S.ax = 22; S.ay = 49;
  panel(S, 0, 8, 43, 49, R(['#1a2a2a', '#2a3e3a', '#3a524a', '#7a9a8a']), { a: 0.6, b: 0.4 });
  panel(S, 6, 14, 21, 49, MAT.chrome, { a: 0.55, b: 0.4 }); panel(S, 22, 14, 37, 49, MAT.chrome, { a: 0.45, b: 0.3 });
  for (let x = 8; x < 36; x++) S.px(x, 26, '#0a1414');
  panel(S, 8, 0, 35, 6, ['#0a0a0e', '#16161c']); for (let x = 11; x < 33; x += 3) S.px(x, 3, '#ffd040', true);
  return S.done();
}
// a locker: a tall steel box, a lit latch
function locker() {
  const S = new Spr(14, 26, 431); S.ax = 7; S.ay = 25;
  panel(S, 0, 0, 13, 25, rp('#4a5058', 6)); for (let y = 3; y < 9; y += 2) for (let x = 3; x < 11; x++) S.px(x, y, '#1a1e24');
  S.px(10, 14, '#3aff80', true); S.px(10, 15, '#1a5a2a');
  return S.done();
}
// an evidence marker: a little lit tent by whatever's there
function marker(o = {}) {
  const S = new Spr(12, 12, 432); S.ax = 6; S.ay = 11; const c = col3(o.col || '#ffd040');
  for (let y = 0; y < 8; y++) for (let x = -y / 2; x <= y / 2; x++) S.px(6 + x, 3 + y, mixRgb(c, [0, 0, 0], x < 0 ? 0.2 : 0), true);
  S.px(6, 6, '#1a1a1a'); S.px(6, 8, '#1a1a1a');
  S.px(2, 11, '#c8c8d0'); S.px(9, 10, '#e8e8f0', true);
  return S.done();
}

// an icon for anything you carry: salvage as before; the rest by kind, in
// the item's own colours
function itemIcon(k) {
  const I = ITEM[k]; if (!I || I.kind === 'salvage') return salvageIcon(k);
  const S = new Spr(16, 16, 320 + k.length), c = I.col || ['#3a3a3a', '#8a8a8a', '#e8e8e8'], ramp = rp(c[1], 6);
  if (I.kind === 'consumable') {
    if (k === 'noodlecup') { S.shape([[3, 5], [13, 5], [11, 14], [5, 14]], rp('#e8e0d0', 6), { down: 0.3 }); for (let x = 4; x < 13; x++) S.px(x, 8, c[2]); S.limb(9, 5, 12, 0, 0.8, ['#3a2a1a', '#6a4a2a']); }
    else if (k === 'stim') { S.cap(4, 12, 11, 5, 1.6, 1.6, ramp); S.limb(11, 5, 14, 2, 0.8, MAT.chrome); S.px(6, 10, c[2], true); S.px(8, 8, c[2], true); }
    else { S.box(2, 4, 13, 12, rp('#e8f0e8', 5), { lo: 1, hi: 4 }); S.box(6, 5, 9, 11, ramp, { glow: true }); S.box(4, 7, 11, 9, ramp, { glow: true }); }
  } else if (I.kind === 'throwable') { S.ell(8, 9, 5, 5.5, ramp); S.box(6, 2, 10, 4, MAT.steel, { lo: 1, hi: 5 }); S.limb(10, 3, 13, 5, 0.8, MAT.chrome); S.px(8, 9, c[2], true); }
  else if (I.kind === 'key') { panel(S, 1, 4, 14, 12, ramp, { a: 0.7, b: 0.45 }); for (let x = 3; x < 8; x++) S.px(x, 7, '#1a1a1a'); S.px(11, 9, c[2], true); }
  else { panel(S, 2, 3, 13, 13, rp('#c8b890', 5), { a: 0.7, b: 0.5 }); for (let y = 6; y < 12; y += 2) for (let x = 4; x < 11; x++) if (hash(x, y, k.length) > 0.3) S.px(x, y, '#3a3428'); S.box(9, 1, 12, 4, rp('#ff4a6a', 4)); }
  S.ax = 8; S.ay = 15; return S.done();
}

// a ladder up to a manhole: rungs in a shaft, light from the street coming down
function manholeLadder() {
  const S = new Spr(30, 64, 432); S.ax = 15; S.ay = 63;
  panel(S, 4, 0, 25, 63, MAT.concreteD, { a: 0.35, b: 0.25 });
  for (let y = 0; y < 64; y++) for (let x = 8; x < 22; x++) if (hash(x, y, 3) < 0.18 * (1 - y / 64)) S.px(x, y, '#c8d8e8', true);
  for (const x of [9, 20]) S.limb(x, 0, x, 63, 1.2, MAT.steel);
  for (let y = 4; y < 62; y += 6) S.limb(9, y, 20, y, 1, MAT.steel);
  panel(S, 2, 0, 27, 3, MAT.steelD, { a: 0.7, b: 0.5 });
  return S.done();
}
// a manhole in the street: a ring of iron, the cover pushed aside, steam
function manholeCover() {
  const S = new Spr(30, 8, 433); S.ax = 15; S.ay = 7;
  S.ell(13, 5, 11, 2.4, MAT.steelD); S.ell(13, 5, 8, 1.6, ['#020204', '#06060a']); S.ell(22, 4, 7, 2, MAT.steel);
  for (let x = 17; x < 28; x += 3) S.px(x, 4, MAT.steel[1]);
  return S.done();
}
// your workbench: a scarred top, a vice, a magnifier lamp on an arm, a
// soldering iron in its stand, drawers under it
function workbench() {
  const W = 52, H = 34, S = new Spr(W, H, 440); S.ax = W / 2; S.ay = H - 1; const wd = MAT.wood;
  S.box(2, 14, W - 3, 17, wd, { lo: 2, hi: 6 }); S.box(4, 18, 20, H - 1, wd, { lo: 0, hi: 4 }); S.box(W - 21, 18, W - 5, H - 1, wd, { lo: 0, hi: 4 });
  for (const y of [22, 27]) for (let x = 6; x < 19; x++) S.px(x, y, wd[0]); S.px(12, 20, '#c8a060'); S.px(12, 25, '#c8a060');
  for (let x = 6; x < W - 6; x += 7) S.px(x, 15, wd[1]);
  // the vice, the lamp's arm and head, its light on the top
  S.box(6, 9, 13, 13, MAT.steel, { lo: 1, hi: 6 }); S.px(14, 11, MAT.steel[5]);
  S.limb(40, 13, 44, 4, 1.2, MAT.steelD); S.limb(44, 4, 34, 2, 1.2, MAT.steelD); S.ell(32, 4, 4, 2.2, rp('#3a4048', 6)); S.px(31, 6, '#fff4d0', true); S.px(32, 6, '#ffe8b0', true); S.px(33, 6, '#fff4d0', true);
  // the iron in its stand, a coil of solder, a board being worked on
  S.limb(22, 13, 27, 9, 1, MAT.steelD); S.px(21, 13, '#ff8a30', true); S.ell(30, 12, 2, 1.2, ['#6a6a70', '#b8b8c0']);
  S.box(16, 11, 21, 13, rp('#2a6a3a', 5), { lo: 1, hi: 4 }); S.px(18, 11, '#ffd040'); S.px(20, 12, '#c8c8d0');
  return S.done();
}
// the parts shelf: three shelves of bins and boxes, a few parts showing
function partsShelf() {
  const W = 34, H = 50, S = new Spr(W, H, 441); S.ax = W / 2; S.ay = H - 1;
  for (const x of [1, W - 3]) S.box(x, 0, x + 1, H - 1, MAT.steelD, { lo: 1, hi: 5 });
  for (const y of [12, 26, 40, H - 2]) S.box(1, y, W - 2, y + 1, MAT.steel, { lo: 2, hi: 6 });
  const bins = ['#3a5a8a', '#8a3a3a', '#6a6a30', '#2a6a5a', '#5a3a6a', '#7a5a2a'];
  for (const [i, y] of [[0, 4], [1, 18], [2, 32]]) for (let k = 0; k < 3; k++) { const x = 4 + k * 9; S.box(x, y, x + 7, y + 7, rp(bins[(i * 3 + k) % 6], 5), { lo: 1, hi: 4 }); S.px(x + 3, y + 2, '#e8e4dc'); }
  S.px(9, 43, '#3af0e0', true); S.px(20, 45, '#ff8a30', true); S.box(6, 44, 16, 47, rp('#4a4a50', 5), { lo: 1, hi: 4 });
  return S.done();
}
// a clinic's parts cabinet: white steel, a red cross, a keypad, Meridian's
// stripe; jimmied, the door hangs open on empty racks
function medCabinet(open) {
  const W = 22, H = 34, S = new Spr(W, H, 442 + (open ? 1 : 0)); S.ax = W / 2; S.ay = H - 1; const wh = rp('#e0e8e8', 6);
  S.box(1, 0, W - 2, H - 1, wh, { lo: 1, hi: 5 }); S.box(1, H - 4, W - 2, H - 1, MAT.steelD, { lo: 1, hi: 4 });
  if (open) { S.box(3, 2, W - 4, H - 6, rp('#2a3034', 5), { lo: 0, hi: 3 }); for (const y of [10, 19]) S.box(3, y, W - 4, y + 1, MAT.steel, { lo: 2, hi: 5 }); S.box(W - 4, 2, W - 1, H - 6, wh, { lo: 2, hi: 5 }); return S.done(); }
  S.box(8, 6, 13, 7, rp('#ff3a4a', 4)); S.box(10, 4, 11, 9, rp('#ff3a4a', 4)); S.box(3, H - 8, W - 4, H - 7, rp('#ff4a5a', 4));
  S.box(15, 14, 18, 19, rp('#1a1e22', 4), { lo: 1, hi: 3 }); S.px(16, 15, '#3aff80', true); S.px(17, 17, '#3af0e0', true);
  return S.done();
}
// a worn rug on the storeroom floor, red and gold, its fringe frayed: the
// trapdoor's under it
// the door you came in by, seen from inside: on the back wall (the front's cut
// away), the night street through it, a mat at its foot. o.kind: 'noren' (a
// glass door under the bar's curtain), 'glass' (a shop door, a push bar),
// 'steel' (a block's lobby door, wired glass)
function innerDoor(o = {}) {
  const W = 26, H = 46, S = new Spr(W, H, 445); S.ax = W / 2; S.ay = H - 1; const k = o.kind || 'glass';
  const fr = rp(k === 'noren' ? '#3a2014' : k === 'steel' ? '#4a4e58' : '#2a3a3a', 6);
  S.box(1, 3, W - 2, H - 2, fr, { lo: 1, hi: 5 }); // the frame
  // the street through it: night, a wet pavement, a couple of signs across the way
  for (let y = 6; y < H - 3; y++) for (let x = 4; x < W - 4; x++) { const v = hash(x >> 1, y >> 2, 446 + (o.seed || 0)); S.px(x, y, y > H - 12 ? (v < 0.2 ? '#3a5a7a' : '#14202e') : v < 0.05 ? '#ff4ab0' : v < 0.09 ? '#3af0e0' : y < 20 ? '#0c1220' : '#121a2a', true); }
  if (k === 'glass') { for (let x = 4; x < W - 4; x++) S.px(x, 26, '#c8d0d8'); S.px(W - 6, 26, '#ffffff'); for (let y = 8; y < 16; y++) S.px(6 + (y >> 1), y, '#8aa0b0', true); }
  if (k === 'steel') { for (let y = 6; y < H - 3; y++) for (let x = 4; x < W - 4; x++) if ((x + y) % 5 === 0) S.px(x, y, '#5a6470'); S.box(4, 24, W - 5, H - 3, rp('#4a4e58', 6), { lo: 1, hi: 5 }); S.px(W - 7, 27, '#c8c8d0'); }
  if (k === 'noren') { for (let x = 3; x < W - 3; x++) for (let y = 5; y < 20; y++) { const gap = x === Math.floor(W / 2) || x === Math.floor(W / 4) + 1 || x === Math.floor(3 * W / 4) - 1; if (!gap || y < 8) S.px(x, y, y === 5 ? '#e84a3a' : '#a82a24'); } for (const [x, y] of [[12, 11], [13, 11], [12, 13], [13, 13], [12, 15], [13, 15], [11, 12], [14, 14]]) S.px(x, y, '#f4e8d8'); }
  S.box(3, 0, W - 4, 3, rp(k === 'noren' ? '#ff6a3a' : '#3aff80', 6), { lo: 2, hi: 6, glow: true }); // the lit sign over it
  for (let x = 6; x < W - 6; x += 2) S.px(x, 1, '#f4ffe8', true);
  return S.done();
}
// ---- what the residents tip you off about ----
// a crashed courier drone: an orange shell on its side, two rotor arms bent,
// a cracked camera eye, one light still going
function droneWreck() {
  const W = 40, H = 16, S = new Spr(W, H, 447); S.ax = W / 2; S.ay = H - 1;
  const sh = rp('#e8702a', 6), dk = rp('#2a2e36', 5);
  S.limb(4, 13, 12, 8, 1.2, dk); S.limb(36, 4, 28, 8, 1.2, dk); S.box(0, 12, 9, 13, rp('#5a6070', 5)); S.box(31, 2, 39, 3, rp('#5a6070', 5)); // the arms and their rotors
  S.part(); S.ell(20, 10, 11, 5, sh); S.box(12, 12, 28, 15, dk, { lo: 1, hi: 4 }); // the shell, the cargo pod under it
  S.part(); S.ell(28, 9, 3, 3, rp('#14161c', 4)); S.px(27, 8, '#3af0e0', true); S.px(29, 10, '#8a909c');
  for (let x = 13; x < 22; x += 3) S.px(x, 8, '#ffd8a0'); S.px(15, 11, '#ff3040', true);
  return S.done();
}
// a junction box the city forgot: grey steel, its door hanging open, a
// hazard stripe, relays in rows inside
function junctionBox() {
  const W = 30, H = 36, S = new Spr(W, H, 448); S.ax = 13; S.ay = H - 1;
  const st = rp('#6a7078', 6), dk = rp('#1a1c22', 4);
  S.box(2, 2, 24, H - 1, st, { lo: 1, hi: 5 }); S.box(4, 5, 22, H - 4, dk);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { S.box(6 + c * 5, 8 + r * 6, 9 + c * 5, 11 + r * 6, rp('#3a5ac8', 5)); if ((r + c) % 3 === 0) S.px(7 + c * 5, 9 + r * 6, '#3aff80', true); }
  S.part(); S.box(24, 4, 29, H - 3, st, { lo: 1, hi: 5 }); // the door, swung open
  for (let y = 2; y < 6; y++) for (let x = 2; x < 25; x++) if (((x + y) >> 1) % 2) S.px(x, y, '#ffc020');
  return S.done();
}
// an autodoc a clinic threw out: a white pod on its back, a cracked teal
// canopy, a jointed arm folded on top, a status light
function autodoc() {
  const W = 50, H = 22, S = new Spr(W, H, 449); S.ax = W / 2; S.ay = H - 1;
  const wh = rp('#d8dce0', 6), dk = rp('#3a4048', 5), gl = rp('#3ab8c8', 5);
  S.box(3, 12, 47, H - 1, wh, { lo: 1, hi: 5 }); S.box(6, H - 3, 44, H - 1, dk); // the pod
  S.part(); S.ell(25, 12, 20, 6, gl); for (let k = 0; k < 7; k++) S.px(18 + k * 2, 9 + (k % 3), '#e8ffff'); // the canopy, cracked
  S.part(); S.limb(40, 9, 34, 3, 1.4, wh); S.limb(34, 3, 26, 4, 1.2, wh); S.box(24, 3, 27, 6, dk); // the arm, folded
  S.box(8, 14, 13, 17, rp('#14161c', 4)); S.px(10, 15, '#ff4a6a', true); S.px(12, 15, '#3aff80', true);
  return S.done();
}
function rug() {
  const W = 40, H = 4, S = new Spr(W, H, 443); S.ax = W / 2; S.ay = H - 1;
  for (let x = 2; x < W - 2; x++) for (let y = 0; y < H; y++) S.px(x, y, y === 0 || x === 2 || x === W - 3 ? '#c8a050' : (x + y) % 6 < 3 ? '#8a2228' : y === 2 && x % 4 === 0 ? '#e8c070' : '#621a1e');
  for (const x of [0, 1, W - 2, W - 1]) S.px(x, H - 1, '#c8b890');
  return S.done();
}
// the work chair: a ripper's recliner, padded blue-grey on a steel pedestal,
// the back laid low, clamps on the arm for a limb, a little screen lit
function workChair() {
  const W = 62, H = 42, S = new Spr(W, H, 444); S.ax = 31; S.ay = H - 1;
  const pad = rp('#6a86a8', 7), st = rp('#5a6070', 6), dk = rp('#2a2e36', 5);
  S.box(16, H - 5, 46, H - 1, st, { lo: 1, hi: 5 }); S.box(28, 26, 34, H - 5, st, { lo: 1, hi: 5 }); // the pedestal
  S.box(30, 22, 33, 26, dk); S.px(31, 24, '#3af0e0', true); // a lit joint
  S.box(18, 20, 48, 26, pad, { lo: 1, hi: 6 }); for (let x = 20; x < 47; x += 5) S.px(x, 21, pad[6]); // the seat, quilted
  S.limb(18, 22, 5, 8, 4, pad); S.ell(4, 5, 4.5, 3.5, pad); // the back laid low, the headrest
  S.limb(48, 22, 57, 33, 3.2, pad); S.box(54, 33, 60, 36, st, { lo: 1, hi: 5 }); // the leg rest and its foot plate
  S.box(36, 14, 54, 16, st, { lo: 1, hi: 6 }); S.limb(52, 16, 52, 21, 1.2, st); // the arm rest on its post
  for (const x of [39, 47]) { S.box(x, 11, x + 3, 14, MAT.chrome, { lo: 1, hi: 6 }); S.px(x + 1, 12, '#ff4a6a', true); } // its clamps, armed
  S.box(4, 26, 14, 33, dk, { lo: 1, hi: 3 }); S.box(5, 27, 13, 32, rp('#0e3a3a', 4)); for (let x = 6; x < 12; x++) S.px(x, 30 - ((x * 3) % 3), '#3aff80', true); S.px(12, 28, '#3af0e0', true);
  S.limb(14, 30, 28, 36, 0.8, dk); S.limb(14, 31, 28, 38, 0.8, rp('#c85a28', 4)); // its cables
  return S.done();
}
// a tray of tools on a stand: scissors, clamps, a probe
function toolTray() {
  const W = 20, H = 30, S = new Spr(W, H, 445); S.ax = 10; S.ay = H - 1;
  S.limb(10, 8, 10, H - 2, 1, MAT.steelD); S.limb(5, H - 1, 15, H - 1, 1, MAT.steelD);
  S.box(1, 5, 18, 8, rp('#7a8090', 6), { lo: 1, hi: 5 });
  for (const [x, y, c] of [[3, 4, '#e8ecf4'], [4, 3, '#e8ecf4'], [5, 4, '#c8ccd4'], [8, 4, '#c8ccd4'], [9, 3, '#e8ecf4'], [10, 4, '#e8ecf4'], [13, 4, '#ff8a3a'], [14, 4, '#ff8a3a'], [15, 3, '#c8ccd4'], [16, 2, '#c8ccd4']]) S.px(x, y, c);
  return S.done();
}
// a cab stand: a pole with a lit CAB box on top and a hailing button, the bay
// marked on the ground beside it
function cabStand() {
  const W = 40, H = 46, S = new Spr(W, H, 446); S.ax = 8; S.ay = H - 1;
  S.limb(8, 12, 8, H - 2, 1.2, MAT.steelD); S.box(5, H - 2, 11, H - 1, MAT.steelD, { lo: 1, hi: 4 });
  S.box(2, 2, 14, 11, rp('#e0b028', 6), { lo: 1, hi: 6 }); for (let x = 4; x < 13; x++) S.px(x, 6, x % 4 === 3 ? '#e0b028' : '#1a1a1a', false);
  for (const [x, y] of [[4, 5], [5, 4], [5, 7], [7, 4], [7, 7], [8, 5], [8, 6], [9, 4], [9, 7], [11, 4], [11, 5], [11, 6], [11, 7], [12, 4], [12, 7]]) S.px(x, y, '#1a1a1a');
  for (let x = 3; x < 14; x++) S.px(x, 2, '#fff4c0', true);
  S.box(9, 24, 12, 28, rp('#2a2a30', 4), { lo: 1, hi: 3 }); S.px(10, 26, '#3aff80', true);
  for (let x = 16; x < W; x += 3) S.px(x, H - 1, '#e0b028');
  return S.done();
}
