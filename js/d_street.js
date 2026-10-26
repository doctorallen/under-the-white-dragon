'use strict';
// ---------------------------------------------------------------------------
// Street level: the districts down at the bottom of the open city, under its
// decks and walkways, reached by spinner. Each built by hand from the kit,
// with a few painters of its own (prefixed st).
// ---------------------------------------------------------------------------

// ---- painters of the street's own ------------------------------------------------
// a highway deck overhead: a thick slab with a lit lip, a crash barrier, lamp
// standards on top, the dark underside with tubes and dripping
function stDeck(P, x0, x1, y, th) {
  P.block(x0, y, x1, y + th, MAT.concrete, { base: 0.4, drips: 0.25, dripLen: 14, panels: [80, th] });
  for (let x = x0; x < x1; x++) for (let j = 0; j < 6; j++) P.tint(x, y + th + j, [4, 3, 8], 0.55 - j * 0.08);
  P.block(x0, y - 7, x1, y - 1, KMAT.concreteL, { base: 0.5 });
  for (let x = x0; x < x1; x += 3) P.put(x, y - 4, (x >> 4) % 2 ? [230, 180, 40] : [30, 26, 20]);
  for (let x = x0 + 40; x < x1; x += 160) { for (let yy = y - 40; yy < y - 7; yy++) { P.put(x, yy, tone(MAT.steel, 0.55)); P.put(x + 1, yy, tone(MAT.steel, 0.3)); } kH(P, x - 8, x + 2, y - 40, tone(MAT.steel, 0.6)); kH(P, x - 8, x - 2, y - 39, [255, 230, 170], 1); }
}
// a pier holding the deck up: a fat column, a capital, stains, a poster or two
function stPier(P, x, w, y0, G, seed) {
  P.block(x, y0, x + w, G, KMAT.concreteL, { base: 0.36, drips: 0.3, dripLen: 60, seed, panels: [w, 40] });
  P.block(x - 8, y0, x + w + 8, y0 + 10, KMAT.concreteL, { base: 0.48 });
  for (let k = 0; k < 3; k++) { const py = G - 70 + k * 6 + Math.round(hash(k, 1, seed) * 20), px = x + 4 + Math.round(hash(k, 2, seed) * (w - 16)); P.area(px, py, px + 10, py + 14, rp(['#c8b890', '#d8a0a0', '#a0c0d8'][k], 5), (xx, yy) => 0.6 - (yy - py) / 30 + (noise(xx / 2, yy / 2, seed) - 0.5) * 0.3); }
  for (let k = 0; k < 18; k++) P.put(x + 3 + k * (w - 6) / 18, G - 30 + Math.sin(k * 0.9 + seed) * 4, [255, 74, 176], 0.3);
}
// a quay: timber planks on top, piles going down into black water between
function stQuay(P, x0, x1, G, H) {
  P.area(x0, G, x1, G + 5, KMAT.plywood, (x, y) => 0.62 + ((x - x0) % 9 === 0 ? -0.35 : 0) + (y === G ? 0.25 : 0) + (noise(x / 5, y, 4) - 0.5) * 0.2);
  P.block(x0, G + 5, x1, G + 8, KMAT.darkwood, { base: 0.45, lip: 0 });
  for (let x = x0; x < x1; x++) for (let y = G + 8; y < H; y++) P.put(x, y, tone(KMAT.water, 0.22 + (noise(x / 14, y / 3, 61) - 0.5) * 0.18 + (y > G + 26 && (x * 7 + y * 13) % 61 === 0 ? 0.4 : 0)));
  for (let x = x0 + 6; x < x1 - 4; x += 22) P.block(x, G + 8, x + 5, H, KMAT.darkwood, { base: 0.42, lip: 0 });
  for (let x = x0; x < x1; x++) P.put(x, G + 26, tone(KMAT.water, 0.6));
}
// open water under a gangway: a thin deck with rope rails, the canal below
function stGangway(P, x0, x1, G, H) {
  for (let x = x0; x < x1; x++) for (let y = G + 3; y < H; y++) P.put(x, y, tone(KMAT.water, 0.3 + (noise(x / 20, y / 2, 61) - 0.5) * 0.3 + ((x * 7 + y * 13) % 37 === 0 ? 0.5 : 0) + (noise(x / 6, y / 1.5, 62) > 0.72 ? 0.25 : 0)));
  for (const px of [x0 + 2, x1 - 6]) P.block(px, G - 2, px + 4, H, KMAT.darkwood, { base: 0.5, lip: 0 });
  P.area(x0, G, x1, G + 3, KMAT.plywood, (x, y) => 0.55 + ((x - x0) % 5 === 0 ? -0.3 : 0));
  for (let x = x0; x < x1; x += 30) { for (let y = G - 10; y < G; y++) P.put(x, y, tone(KMAT.darkwood, 0.6)); }
  cable(P, x0, G - 10, x1, G - 10, 4, '#7a6a4a'); cable(P, x0, G - 5, x1, G - 5, 3, '#5a4a34');
}
// a bollard with a rope down to the water
function stBollard(P, x, G, rope) {
  P.block(x - 3, G - 7, x + 3, G, MAT.steelD, { base: 0.5 }); P.block(x - 4, G - 8, x + 4, G - 6, MAT.steelD, { base: 0.65 });
  if (rope) cable(P, x, G - 5, x + rope, G + 10, 4, '#a89060', { thick: true });
}
// a shipping container, side on: ribs, a number, doors at one end
function stBox(P, x, y, w, h, col, num) {
  const ramp = rp(col, 7);
  P.area(x, y, x + w, y + h, ramp, (xx, yy) => { let v = 0.5 + ((xx - x) % 4 === 0 ? -0.18 : (xx - x) % 4 === 1 ? 0.1 : 0) + (noise(xx / 10, yy / 8, x) - 0.5) * 0.25; if (yy - y < 1) v = 0.85; if (y + h - yy < 2) v -= 0.25; if (noise(xx / 5, yy / 4, y) > 0.78) v = 0.2; return v; });
  for (let yy = y + 2; yy < y + h - 1; yy++) { P.put(x + 1, yy, tone(ramp, 0.75)); P.put(x + w - 2, yy, tone(ramp, 0.2)); }
  if (num) { const s = String(num); for (let i = 0; i < s.length; i++) for (const [a, b] of GLYPHS[(s.charCodeAt(i) * 5) % GLYPHS.length]) P.put(x + 6 + i * 4 + a, y + 4 + b, [236, 230, 210]); }
}
// a big gantry crane: two legs, a beam, a cab, a cable and what it's lifting
function stGantry(P, x0, x1, G, top, o = {}) {
  const yel = rp('#d8a020', 7);
  for (const lx of [x0, x1 - 10]) { P.block(lx, top, lx + 10, G, yel, { base: 0.45, lip: 0 }); for (let y = top + 10; y < G - 10; y += 16) for (let k = 0; k < 10; k++) P.put(lx + k, y + k, tone(yel, 0.25)); P.block(lx - 6, G - 8, lx + 16, G, MAT.steelD, { base: 0.4 }); }
  girder(P, x0 - 30, top - 14, x1 + 40, top + 2, yel, { step: 14 });
  P.block(x0 - 30, top + 2, x1 + 40, top + 6, yel, { base: 0.35 });
  const cx = o.cab || Math.round((x0 + x1) / 2); P.block(cx - 14, top + 6, cx + 14, top + 26, yel, { base: 0.5 }); kFill(P, cx - 10, top + 10, cx + 10, top + 20, '#ffe8b0', 0.5);
  const hx = o.hook || cx + 60; for (let y = top + 6; y < (o.hookY || G - 90); y++) { P.put(hx - 3, y, [24, 24, 28]); P.put(hx + 3, y, [24, 24, 28]); }
  if (o.load) stBox(P, hx - 28, o.hookY || G - 90, 56, 22, o.load, 'MRD 4471');
  P.put(x1 + 38, top - 15, [255, 40, 40], 1); P.put(x0 - 28, top - 15, [255, 40, 40], 1);
}
// a boat moored on the water: a hull, a cabin with lit windows, a mast light
function stBoat(P, x0, x1, wy, o = {}) {
  const hull = rp(o.col || '#2a3a4a', 7), w = x1 - x0, deck = wy - (o.free || 8);
  P.area(x0, deck, x1, wy + 6, hull, (x, y) => 0.5 - (y - deck) / 30 + (y === deck ? 0.3 : 0), { inside: (x, y) => { const t = (y - deck) / (wy + 6 - deck); return x > x0 + t * 10 && x < x1 - t * 18; } });
  for (let x = x0 + 4; x < x1 - 8; x++) P.put(x, deck + 3, o.stripe ? col3(o.stripe) : tone(hull, 0.8));
  const cw = Math.round(w * (o.cabin || 0.4)), cx = x0 + Math.round(w * 0.25); P.block(cx, deck - (o.ch || 18), cx + cw, deck, KMAT.whitepanel, { base: 0.45 });
  for (let x = cx + 4; x < cx + cw - 6; x += 9) kFill(P, x, deck - (o.ch || 18) + 5, x + 6, deck - (o.ch || 18) + 10, hash(x, 3, wy) < 0.6 ? '#ffd890' : '#1a2430', hash(x, 3, wy) < 0.6 ? 0.5 : 0);
  const mx = cx + cw - 6; for (let y = deck - (o.ch || 18) - (o.mast || 26); y < deck - (o.ch || 18); y++) P.put(mx, y, tone(MAT.steel, 0.55)); P.put(mx, deck - (o.ch || 18) - (o.mast || 26) - 1, [255, 240, 200], 1);
  P.put(x0 + 4, deck - 1, [255, 50, 50], 1); P.put(x1 - 12, deck - 1, [60, 255, 120], 1);
  for (let x = x0 + 6; x < x1 - 14; x++) P.put(x, wy + 7, mixRgb(col3(o.col || '#2a3a4a'), [255, 220, 160], 0.15), 0.1);
}
// a harbour beacon on a pier end: a striped tower, a lamp room
function stBeacon(P, x, G, h) {
  for (let y = G - h; y < G; y++) for (let i = -5 + Math.floor((y - G + h) / h * 3) * 0; i <= 5; i++) { const w = 4 + (y - G + h) / h * 3; if (Math.abs(i) > w) continue; P.put(x + i, y, tone(Math.floor((y - G + h) / 14) % 2 ? KMAT.plaster : KMAT.lacquer, 0.55 - i / 14)); }
  P.block(x - 6, G - h - 12, x + 6, G - h, MAT.steelD, { base: 0.4 }); kFill(P, x - 4, G - h - 10, x + 4, G - h - 2, '#fff2c0', 1);
  kRoof(P, x - 5, x + 5, G - h - 12, 5, MAT.steelD, { over: 2, inset: 5 });
  railing(P, x - 8, x + 8, G - h, MAT.steel, { h: 4, step: 2 });
}
// a warehouse: a long shed, a pitched tin roof, a huge painted number, a roller door
function stWarehouse(P, x0, x1, G, h, num, col) {
  const top = G - h;
  corrugated(P, x0, top, x1, G, KMAT.corrBlue);
  P.area(x0 - 6, top - 20, x1 + 6, top + 2, MAT.rust, (x, y) => 0.5 + ((x - x0) % 3 === 0 ? 0.15 : 0) - (y - top + 20) / 40, { inside: (x, y) => y >= top - 20 + Math.abs(x - (x0 + x1) / 2) / ((x1 - x0) / 2 + 6) * 20 });
  stNumber(P, x0 + 24, top + 16, num, 8, col || '#e8d8b0');
  for (let k = 0; k < 40; k++) P.tint(x0 + 20 + hash(k, 1, 7) * 110, top + 14 + hash(k, 2, 7) * 44, [20, 30, 40], 0.5);
  const dx = x1 - 110; P.area(dx, G - 56, dx + 70, G, rp('#7a7a7a', 7), (x, y) => ((y - G + 56) % 3 === 0 ? 0.25 : 0.55) - (x - dx) / 300);
  P.block(dx - 3, G - 60, dx + 73, G - 56, MAT.steelD, { base: 0.5 });
  for (let x = dx; x < dx + 70; x++) for (let y = G - 5; y < G; y++) P.put(x, y, ((x + y) >> 2) % 2 ? [220, 170, 40] : [26, 22, 18]);
}
// a garage bay: a roll-up door half open, a car up on a lift, tools on the wall
function stGarage(P, x0, x1, G, o = {}) {
  const w = x1 - x0, h = o.h || 60;
  P.block(x0, G - h - 10, x1, G, o.wall || MAT.brickD, { base: 0.38, drips: 0.2, dripLen: 20 });
  kFill(P, x0 + 8, G - h, x1 - 8, G, '#141210');
  P.area(x0 + 8, G - h, x1 - 8, G - h + (o.open || 22), rp('#6a6a70', 7), (x, y) => ((y - G + h) % 3 === 0 ? 0.25 : 0.55));
  for (let x = x0 + 10; x < x1 - 10; x++) for (let y = G - h + (o.open || 22); y < G; y++) P.put(x, y, mixRgb([110, 88, 60], [40, 32, 26], (y - G + h) / h), 0.12);
  kFill(P, x0 + 20, G - h + (o.open || 22) + 1, x1 - 20, G - h + (o.open || 22) + 2, '#fff0c8', 0.9);
  for (let x = x0 + 14; x < x1 - 14; x += 6) { P.put(x, G - h + (o.open || 22) + 4, tone(MAT.steel, 0.6)); P.put(x + 1, G - h + (o.open || 22) + 6, tone(MAT.copper, 0.6)); }
  // the lift posts and the car on it, wheels off
  const ly = G - 22; for (const px of [x0 + 18, x1 - 22]) P.block(px, ly, px + 4, G, rp('#c8a020', 6), { base: 0.5 }); P.block(x0 + 16, ly - 2, x1 - 16, ly, MAT.steelD, { base: 0.5 });
  P.area(x0 + 22, ly - 14, x1 - 22, ly - 2, rp(o.car || '#4a2a3a', 7), (x, y) => 0.85 - (y - ly + 14) / 20 + ((x + y) % 11 === 0 ? 0.2 : 0), { inside: (x, y) => y > ly - 14 + (Math.abs(x - (x0 + x1) / 2) > (w - 50) * 0.3 ? 5 : 0) });
  for (const wx of [x0 + 30, x1 - 34]) for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (Math.hypot(i, j) < 3.5) P.put(wx + i, ly - 1 + j, [10, 10, 12]);
  P.put(x0 + 24, ly - 8, [255, 200, 120], 0.7);
  if (o.sparks) for (let k = 0; k < 12; k++) P.put((x0 + x1) / 2 + hash(k, 1, x0) * 10 - 5, ly + 2 + hash(k, 2, x0) * 8, [255, 220, 120], 1);
}
// a chain-link fence: posts, a top rail, a diamond mesh you can see through
function stFence(P, x0, x1, G, h) {
  for (let x = x0; x < x1; x++) for (let y = G - h; y < G; y++) if (((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) && hash(x, y, 7) > 0.08) P.put(x, y, tone(MAT.steel, 0.42));
  for (let x = x0; x < x1; x += 30) P.block(x, G - h - 3, x + 2, G, MAT.steel, { base: 0.5, lip: 0 });
  kH(P, x0, x1, G - h, tone(MAT.steel, 0.65));
  for (let x = x0; x < x1; x += 4) P.put(x, G - h - 4 + (x % 8 < 4 ? 1 : 0), tone(MAT.steel, 0.5));
}
// crushed cars in cubes, stacked
function stCubes(P, x0, G, cols, rows, seed) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * 22 + (r % 2) * 4, y = G - (r + 1) * 18, col = ['#6a2a2a', '#2a4a6a', '#5a5a5a', '#6a5a2a', '#2a5a3a', '#4a2a5a'][Math.floor(hash(c, r, seed) * 6)];
    P.area(x, y, x + 21, y + 17, rp(col, 7), (xx, yy) => 0.45 + (noise(xx / 2, yy / 2, seed + c) - 0.5) * 0.7 + (yy === y ? 0.25 : 0) - (yy - y) / 60);
    if (hash(c, r, seed + 1) < 0.4) kFill(P, x + 5, y + 6, x + 12, y + 9, '#6aa8c8');
  }
}
// a crawler crane with an electromagnet: the cab, the boom, a car stuck to it
function stMagnetCrane(P, x, G, o = {}) {
  const yel = rp('#c88a20', 7), bx = x + (o.reach || 150), by = G - (o.h || 230);
  P.block(x - 40, G - 16, x + 40, G, MAT.steelD, { base: 0.4, bands: 3 }); for (let k = 0; k < 6; k++) P.put(x - 34 + k * 13, G - 8, [10, 10, 10]);
  P.block(x - 30, G - 54, x + 26, G - 16, yel, { base: 0.5, panels: [56, 18] }); kFill(P, x + 4, G - 50, x + 22, G - 34, '#ffd890', 0.5);
  for (let k = 0; k <= 100; k++) { const t = k / 100, cx = lerp(x - 10, bx, t), cy = lerp(G - 40, by, t); for (let j = -3; j <= 3; j++) P.put(cx, cy + j, j === -3 || j === 3 ? tone(yel, 0.7) : (Math.round(cx) % 10 === Math.abs(j) * 2 ? tone(yel, 0.6) : null)); }
  for (let y = by; y < G - (o.hang || 100); y++) P.put(bx, y, [20, 20, 24]);
  const my = G - (o.hang || 100); P.area(bx - 16, my, bx + 16, my + 8, MAT.steelD, (xx, yy) => 0.6 - (yy - my) / 14, { inside: (xx, yy) => Math.abs(xx - bx) < 16 - (yy - my) * 0.3 });
  if (o.car !== false) { P.area(bx - 26, my + 8, bx + 26, my + 26, rp('#3a5a7a', 7), (xx, yy) => 0.55 - (yy - my - 8) / 30 + (noise(xx / 3, yy / 3, 5) - 0.5) * 0.4, { inside: (xx, yy) => yy < my + 20 || Math.abs(xx - bx) < 20 }); for (const wx of [bx - 16, bx + 16]) for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) if (Math.hypot(i, j) < 4) P.put(wx + i, my + 24 + j, [12, 12, 14]); }
  P.put(bx, by - 2, [255, 40, 40], 1);
}

// real digits, 3 by 5, scaled: for painted numbers that must read
const ST_DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
function stNumber(P, x, y, num, sc, col, glow = 0) { const c = col3(col), s = String(num); for (let i = 0; i < s.length; i++) { const d = ST_DIGITS[+s[i]]; if (!d) continue; for (let k = 0; k < 15; k++) if (d[k] === '1') kFill(P, x + i * 4 * sc + (k % 3) * sc, y + Math.floor(k / 3) * sc, x + i * 4 * sc + (k % 3 + 1) * sc, y + (Math.floor(k / 3) + 1) * sc, c, glow); } }
// a clinic's waiting room behind its glass, painted over the shopfront's bright
// window so it reads as a room: dim light, chairs, someone waiting
function stWait(L, x0, x1, G, o = {}) {
  const gh = o.gh || 42, mid = Math.round((x0 + x1) / 2), a = x0 + 7, b = mid - 2, top = G - gh + 8;
  L.paint(a, top, b, G, (P) => {
    for (let x = a; x < b; x++) for (let y = top; y < G; y++) P.put(x, y, mixRgb(col3(o.grime ? '#3a5048' : '#7a9aa0'), [20, 30, 34], (y - top) / (G - top) * 0.5 + (o.grime ? hash(x >> 1, y >> 1, 7) * 0.2 : 0)), o.grime ? 0.05 : 0.1);
    kFill(P, a + 2, top + 2, b - 2, top + 4, o.grime ? '#9ad0b0' : '#e8f8ff', 0.6);
    for (let x = a + 3; x < b - 6; x += 9) { kFill(P, x, G - 9, x + 6, G - 7, '#2a3a40'); kFill(P, x, G - 15, x + 1, G - 7, '#2a3a40'); kV(P, x + 1, G - 7, G, '#1a2428'); kV(P, x + 5, G - 7, G, '#1a2428'); }
    if (b - a > 14) { const fx = a + Math.round((b - a) * 0.55); kFill(P, fx, G - 20, fx + 4, G - 9, o.grime ? '#2a1a1a' : '#3a3040'); kFill(P, fx, G - 24, fx + 4, G - 20, '#6a4a3a'); }
    for (let y = top; y < G; y += 2) if (hash(y, a, 3) < 0.15) P.put(a + Math.round(hash(y, 1, a) * (b - a)), y, [230, 250, 255], 0.3);
  });
}

// ---- Overpass Market: a market under the highway decks ------------------------
addDistrict('d_overpass', 'Overpass Market', 2, -40, 300, 'A market packed under the highway decks: dozens of stalls, a mechanic, a salvage buyer.', 'Market under the decks', () => district({
  id: 'd_overpass', name: 'Overpass Market', tier: 2, W: 2700, crowd: 14, amb: [0.17, 0.15, 0.2], layerDy: 0,
  local: { name: 'Porter', lines: ['The deck shakes every time a freight hauler goes over. You get used to it.', 'Everything up there sells down here, a week later, cheaper.', 'Vance runs the stalls past the third pier. Pay him or pack up.'], look: { hair: 'cap', capCol: '#5a4a1a', top: '#4a3a2a', coat: 'jacket' } },
  build(L, G) {
    const DY = G - 128, piers = [185, 615, 1045, 1475, 1905, 2335];
    // the far deck, higher, behind; then the near deck and its piers
    L.paint(600, G - 240, 2200, G, (P) => { stDeck(P, 600, 2200, G - 200, 14); for (const px of [820, 1260, 1700, 2100]) P.block(px, G - 186, px + 36, DY, KMAT.concreteL, { base: 0.26, lip: 0, panels: [36, 30] }); for (let x = 640; x < 2200; x += 90) P.put(x, G - 206, [255, 230, 170], 0.8); });
    L.paint(140, DY - 44, 2700, DY + 30, (P) => stDeck(P, 140, 2700, DY, 24));
    for (const px of piers) L.paint(px - 10, DY, px + 70, G, (P) => stPier(P, px, 60, DY + 24, G, px));
    L.walk(140, 2700, DY, 0, MAT.concrete, { rail: false });
    for (const px of [620, 1910]) L.ladder(px + 44, DY, G);
    for (const [x, c] of [[400, '#3a3a4a'], [980, '#6a2a2a'], [1700, '#d8d8e0'], [2200, '#2a4a3a']]) { L.prop('deco', x, DY, { art: () => car({ col: c }), id: 'ovcar' + x }); L.light(x + 30, DY - 14, 30, [1, 0.95, 0.8], 0.5); L.light(x - 30, DY - 14, 20, [1, 0.2, 0.2], 0.5); }
    for (let x = 240; x < 2700; x += 160) L.light(x - 4, DY - 40, 70, [1, 0.85, 0.6], 0.5);
    L.dry.push([140, DY + 24, 2700, G]);
    // tubes hung under the deck, string lights between the piers
    for (let x = 260; x < 2650; x += 110) L.tube(x, DY + 28, 26, x % 220 < 110 ? '#e8f4ff' : '#ffe8c8', 0.6);
    for (let i = 0; i + 1 < piers.length; i++) bLanterns(L, piers[i] + 60, piers[i + 1], DY + 40, [['#ff3a2a', '#ffb040'], ['#3af0e0', '#ff4ab0'], ['#ffd040', '#ff8a3a']][i % 3], { sag: 10, step: 18 });
    // bay 1: food
    kStallAt(L, 290, G, 'ramen'); kStallAt(L, 360, G, 'fish'); kStallAt(L, 430, G, 'fruit', { col: '#c83a2a' });
    kStallAt(L, 510, G, 'parts', { col: '#2a3a5a', npc: { name: 'Hollis', role: 'vendor', rate: 1.15, lines: ['Salvage? I pay over the odds. Under the deck, everything\'s over the odds.', 'Vance takes a cut of every stall. Not mine. Not yet.'] } });
    L.sign(300, DY + 36, 7, '#ffd040', { r: 60, seed: 3 });
    // bay 2: a shophouse squeezed under the deck, dumplings, tea, books
    bShophouse(L, 680, 800, G, { floors: 1, wall: KMAT.mint, shops: [['noren', '#ffd040']], roof: 'flat', balcony: false, seed: 201, gh: 42 });
    kStallAt(L, 840, G, 'dumpling'); kStallAt(L, 910, G, 'tea', { col: '#3a6a2a' }); kStallAt(L, 985, G, 'books');
    // bay 3: the mechanic's garage, a car on the lift
    L.paint(1100, G - 80, 1300, G, (P) => stGarage(P, 1100, 1300, G, { h: 58, car: '#2a4a6a', sparks: true, wall: KMAT.concreteL }));
    L.sign(1150, G - 76, 8, '#ff8a3a', { r: 60, seed: 4 }); L.light(1200, G - 30, 100, [1, 0.8, 0.55], 0.95);
    L.npc({ name: 'Mechanic Ana', look: { skin: SKINS[3], hair: 'bun', hairCol: '#2a1a14', top: '#3a4a5a', apron: '#2a2a2a', legs: '#2a2a2a', goggles: '#ffb040', hands: { fx: 26, fy: 38 } }, x: 1230, y: G, face: -1, sched: [[0, 24, 1230, 'work']], behind: true, lines: ['Ground cars, spinners, fridges. If it has a motor I\'ll fix it.', 'Somebody brought me a dog to fix once. A synth dog. It bit me.'] });
    kStallAt(L, 1340, G, 'skewers'); kStallAt(L, 1410, G, 'masks', { col: '#2a5a8a' });
    // bay 4: the thick of it
    kStallAt(L, 1550, G, 'flowers'); kStallAt(L, 1620, G, 'herbs'); kStallAt(L, 1690, G, 'parts', { col: '#5a2a5a' }); kStallAt(L, 1760, G, 'robot', { col: '#ffd040' }); kStallAt(L, 1835, G, 'med');
    L.prop('vending', 1880, G, { look: { col: '#ffd040', body: '#5a4a1a' }, label: 'vending machine' }); L.light(1880, G - 14, 30, [1, 0.85, 0.3], 0.6);
    // bay 5: a pawnshop under a stair up to a hung gantry, crates
    bShophouse(L, 1970, 2100, G, { floors: 1, wall: MAT.brickD, shops: [['pawn', '#ffb040']], roof: 'flat', balcony: false, seed: 202 });
    L.stairs(2110, G, 2190, G - 70); L.walk(2110, 2330, G - 70, 4, MAT.steelD); L.paint(2110, DY + 24, 2330, G - 70, (P) => { for (const x of [2140, 2240, 2320]) for (let y = DY + 22; y < G - 70; y++) P.put(x, y, tone(MAT.steel, 0.4)); });
    L.prop('locker', 2290, G - 70, { tier: 2, label: 'locker' }); L.prop('ac', 2210, G - 70, { label: 'air conditioner' });
    for (const [x, c] of [[2160, '#3a4a5a'], [2176, '#5a4a2a'], [2168, '#4a5a3a']]) L.prop('deco', x, x === 2168 ? G - 10 : G, { art: DECO.crate({ col: c, w: 14, h: 10 }), id: 'ovcr' + x });
    kStallAt(L, 2240, G, 'yakitori');
    // bay 6: the market's end, junk and a car at the kerb
    kStallAt(L, 2420, G, 'fruit', { col: '#2a6a8a' }); L.prop('junk', 2500, G, { label: 'junk pile' }); L.prop('car', 2600, G, { look: { col: '#3a3a2a', under: '#ffb040' }, label: 'parked car' });
    L.prop('locker', 760, G, { tier: 2, label: 'locker' }); L.prop('wreck', 1520, DY, { label: 'downed drone' });
    kFoes(L, G, [['gang', 1000, 860, 1040], ['gunner', 1500, 1440, 1700], ['bruiser', 2050, 1960, 2300], ['drone', 1200, 1050, 1450, DY - 60], ['drone', 2400, 2250, 2600, DY - 60], ['gang', 2500, 2380, 2650]]);
    L.spots.push([330, G], [580, G], [870, G], [1060, G], [1380, G], [1590, G], [1960, G], [2280, G], [2460, G], [2220, G - 70], [1300, DY]);
    L.critter('rat', 200, 2600, G, 3); L.critter('dog', 600, 2000, G, 1); L.litter(200, 2600, G, 9);
  },
}));

// ---- Canal Docks: quays on piles, cranes, containers, boats on black water ------
addDistrict('d_docks', 'Canal Docks', 2, -70, 120, 'Quays over the black canal: cranes, container stacks, a fish market, Warehouse Seven and the harbour light.', 'Docks', () => district({
  id: 'd_docks', name: 'Canal Docks', tier: 2, W: 2800, crowd: 6, amb: [0.15, 0.17, 0.22], layerDy: 30, wet: false,
  local: { name: 'Dock worker', lines: LOCAL_LINES.docks, look: { hair: 'cap', capCol: '#c8a020', top: '#d86a20', coat: 'jacket', legs: '#2a2a3a' } },
  build(L, G) {
    const H = L.h, waters = [[560, 760], [1290, 1520], [2210, 2500]];
    // far out on the water, behind: ships' lights, a breakwater
    L.paint(0, G - 60, L.w, G, (P) => { for (let xx = 0; xx < L.w; xx++) for (let y = G - 26; y < G; y++) P.put(xx, y, tone(KMAT.water, 0.18 + (y - G + 26) / 80 + ((xx * 13 + y * 7) % 97 === 0 ? 0.4 : 0))); P.block(0, G - 30, L.w, G - 26, KMAT.concreteL, { base: 0.25, lip: 0.4 });
      for (const [sx, sw] of [[300, 120], [1100, 200], [1900, 90], [2450, 160]]) { P.block(sx, G - 44, sx + sw, G - 30, MAT.steelD, { base: 0.25 }); P.block(sx + sw * 0.6, G - 56, sx + sw * 0.85, G - 44, MAT.steelD, { base: 0.3 }); for (let k = 0; k < sw; k += 7) P.put(sx + k, G - 40, [255, 220, 150], 0.7); P.put(sx + sw * 0.7, G - 60, [255, 60, 60], 1); } });
    // the boats moored in the gaps, behind the gangways
    L.paint(570, G - 50, 750, G + 6, (P) => stBoat(P, 590, 730, G, { col: '#3a2a1a', cabin: 0.3, ch: 14, mast: 18, free: 10, stripe: '#c83a2a' }));
    L.paint(1280, G - 90, 1540, G + 6, (P) => stBoat(P, 1296, 1516, G, { col: '#1a2a3a', cabin: 0.45, ch: 24, mast: 34, free: 22, stripe: '#e8e0d0' }));
    L.paint(2210, G - 40, 2400, G + 6, (P) => stBoat(P, 2230, 2330, G, { col: '#4a3a1a', cabin: 0.35, ch: 10, mast: 12, free: 6, stripe: '#3a8a5a' }));
    // the quays and the water between them
    let x = 0;
    for (const [a, b] of waters) { const qx = x; L.paint(qx, G, a, H, (P) => stQuay(P, qx, a, G, H)); L.paint(a, G - 12, b, H, (P) => stGangway(P, a, b, G, H)); L.wet.push({ y: G + 4, x0: a, x1: b, depth: 30, k: 0.6 }); x = b; }
    L.paint(x, G, L.w, H, (P) => stQuay(P, x, L.w, G, H));
    L.wet.push({ y: G + 26, x0: 0, x1: L.w, depth: 14, k: 0.3 });
    // the fish market: a shed roof on posts over the stalls
    L.paint(180, G - 110, 550, G, (P) => { P.area(170, G - 104, 560, G - 88, MAT.rust, (xx, y) => 0.5 + ((xx - 170) % 3 === 0 ? 0.15 : 0) - (y - G + 104) / 30, { inside: (xx, y) => y >= G - 104 + Math.abs(xx - 365) / 195 * 8 }); for (const px of [186, 300, 420, 540]) P.block(px, G - 90, px + 4, G, MAT.steelD, { base: 0.5, lip: 0 }); for (const bx of [240, 360, 480]) { kV(P, bx, G - 88, G - 78, '#222'); kFill(P, bx - 2, G - 78, bx + 2, G - 75, '#fff4d0', 1); } });
    L.sign(330, G - 120, 9, '#3af0e0', { r: 70, seed: 21 });
    for (const bx of [240, 360, 480]) L.light(bx, G - 74, 60, [1, 0.95, 0.85], 0.7);
    kStallAt(L, 240, G, 'fish', { npc: { name: 'Fishmonger Ota', lines: ['Canal fish. Glows a little. Perfectly safe.', 'Somebody\'s been bringing crates in at night. Crates that knock back.'] } });
    kStallAt(L, 330, G, 'fish'); kStallAt(L, 420, G, 'fish', { npc: false }); kStallAt(L, 500, G, 'ramen');
    L.paint(520, G - 10, 560, G, (P) => { stBollard(P, 540, G, 20); });
    // the first water: a gangway, a skiff moored under it
    L.light(660, G - 24, 50, [1, 0.9, 0.7], 0.5);
    // the container yard under the gantry crane
    L.paint(740, G - 200, 1290, G, (P) => {
      stGantry(P, 790, 1240, G, G - 172, { cab: 900, hook: 1120, hookY: G - 128, load: '#2a6a8a' });
      stBox(P, 820, G - 22, 90, 22, '#a83a2a', 'MRD 0031'); stBox(P, 920, G - 22, 90, 22, '#2a5a8a', 'TKS 8810'); stBox(P, 830, G - 44, 90, 22, '#3a7a4a', 'MRD 2290'); stBox(P, 925, G - 44, 90, 22, '#c88a20', 'HNJ 4417'); stBox(P, 875, G - 66, 90, 22, '#6a3a6a', 'MRD 9902');
      stBox(P, 1060, G - 22, 90, 22, '#5a5a62', 'KSL 1180'); stBox(P, 1150, G - 22, 90, 22, '#a85a2a'); stBox(P, 1100, G - 44, 90, 22, '#2a4a7a', 'MRD 7713');
    });
    L.solid(820, G - 22, 1010, G); L.solid(1060, G - 22, 1240, G);
    L.walk(830, 1015, G - 44, 0, MAT.steel, { rail: false }); L.walk(875, 965, G - 66, 0, MAT.steel, { rail: false }); L.walk(1100, 1190, G - 44, 0, MAT.steel, { rail: false });
    L.stairs(770, G, 820, G - 22, MAT.steel); L.stairs(1240, G - 22, 1280, G, MAT.steel);
    L.walk(820, 1010, G - 22, 0, MAT.steel, { rail: false }); L.walk(1010, 1240, G - 22, 0, MAT.steel, { rail: false });
    L.ladder(1050, G - 44, G - 22); L.ladder(870, G - 66, G - 44);
    L.light(900, G - 150, 80, [1, 0.85, 0.5], 0.8); L.light(1120, G - 90, 70, [1, 0.9, 0.7], 0.6); L.lamp(812, G - 22, 60, '#fff0d0', 1); L.lamp(1050, G - 22, 60, '#fff0d0', 1);
    L.prop('locker', 920, G - 66, { tier: 2, label: 'container locker' }); L.spots.push([920, G - 66], [1140, G - 44]);
    // the quay edge, the barge moored in the second water
    L.paint(1240, G - 12, 1300, G, (P) => { stBollard(P, 1260, G, 30); stBollard(P, 1285, G, 0); });
    L.light(1400, G - 40, 80, [1, 0.85, 0.6], 0.6); L.light(1470, G - 80, 30, [1, 0.95, 0.85], 0.6);
    // Warehouse Seven, its loading dock, a stair up its side to a gantry
    L.paint(1520, G - 160, 1960, G, (P) => stWarehouse(P, 1540, 1950, G, 130, 7, '#e8d8b0'));
    L.light(1880, G - 30, 80, [1, 0.8, 0.45], 0.7); L.tube(1850, G - 66, 40, '#ffe8c0', 0.6);
    L.stairs(1550, G, 1640, G - 96, MAT.steel); L.walk(1550, 1760, G - 96, 4, MAT.steel);
    L.prop('deco', 1700, G - 96, { art: DECO.door({ col: '#3a4a5a', light: '#ffd8a0' }), id: 'dkoff' });
    L.spots.push([1700, G - 96]);
    for (const [cx, c, h] of [[1780, '#3a4a5a', 0], [1796, '#5a4a2a', 0], [1788, '#4a5a3a', 10], [1640, '#5a3a2a', 0]]) L.prop('deco', cx, G - h, { art: DECO.crate({ col: c, w: 16, h: 10 }), id: 'dkcr' + cx + h });
    L.prop('ac', 1620, G - 96, { label: 'air conditioner' });
    // the harbourmaster's office and the dockers' canteen
    bShophouse(L, 1980, 2090, G, { floors: 2, wall: KMAT.concreteL, shops: [['izakaya', '#ff8a3a']], roof: 'tank', seed: 301 });
    bShophouse(L, 2090, 2200, G, { floors: 3, wall: KMAT.corrBlue, shops: [['glass', '#3af0e0']], roof: 'flat', balcony: false, seed: 302 });
    L.npc({ name: 'Harbourmaster Ilse', look: { skin: SKINS[0], hair: 'short', hairCol: '#c8c8c8', top: '#2a3a5a', coat: 'long', legs: '#1a2030' }, x: 2150, y: G, face: -1, sched: [[0, 24, 2150, 'stand']], lines: ['Nothing\'s floated in this canal since I was born. Plenty\'s sunk.', 'Manifests say machine parts. Manifests lie.', 'The light out there\'s been burning eighty years. Longer than me.'] });
    // the third water and the harbour beacon on its pier
    L.paint(2210, G - 160, 2500, G + 20, (P) => { stBeacon(P, 2440, G, 120); for (const bx of [2260, 2330]) { P.area(bx - 4, G + 2, bx + 4, G + 12, KMAT.lacquer, (xx, y) => 0.6 - (y - G) / 20, { inside: (xx, y) => Math.abs(xx - bx) < 4 - (y - G - 2) * 0.2 }); P.put(bx, G + 1, [60, 255, 120], 1); } });
    L.light(2440, G - 128, 140, [1, 0.95, 0.75], 1, 1, { mode: 'sign', seed: 7 }); L.light(2260, G + 2, 20, [0.3, 1, 0.5], 0.6); L.light(2330, G + 2, 20, [0.3, 1, 0.5], 0.6);
    L.walk(2420, 2470, G - 120, 3, MAT.steel); L.ladder(2462, G - 120, G);
    // the far quay: crates, a small crane, a car, the dark end
    L.paint(2520, G - 140, 2800, G, (P) => { stBollard(P, 2520, G, 0); for (let y = G - 120; y < G; y++) { P.put(2620, y, tone(rp('#c88a20', 6), 0.6)); P.put(2621, y, tone(rp('#c88a20', 6), 0.35)); } for (let k = 0; k <= 60; k++) P.put(2620 + k, G - 120 + k * 0.2, tone(rp('#c88a20', 6), 0.6)); for (let y = G - 108; y < G - 60; y++) P.put(2680, y, [20, 20, 24]); stBox(P, 2650, G - 60, 60, 18, '#3a6a4a'); stBox(P, 2700, G - 22, 90, 22, '#8a2a2a', 'MRD 0007'); });
    L.prop('car', 2590, G, { look: { col: '#2a2a2a', under: '#ffb040' }, label: 'dock truck' }); L.prop('junk', 2560, G, { label: 'junk pile' });
    L.prop('locker', 2760, G, { tier: 2, label: 'locker' });
    L.lamp(1270, G, 70, '#ffd8a8', 0.9); L.lamp(2000, G, 70, '#ffd8a8', 0.9); L.lamp(2540, G, 70, '#c8e0ff', 0.9);
    kFoes(L, G, [['gang', 1150, 1060, 1240], ['gunner', 1700, 1560, 1760, G - 96], ['bruiser', 1880, 1780, 1960], ['gunner', 2370, 2220, 2500], ['gang', 2650, 2540, 2760], ['drone', 960, 820, 1100, G - 110]]);
    L.spots.push([350, G], [650, G], [1000, G - 22], [1390, G], [1600, G], [1850, G], [2050, G], [2350, G], [2600, G]);
    L.critter('rat', 200, 2700, G, 3); L.litter(300, 2700, G, 4);
  },
}));

// ---- The Scrapyard: mountains of scrap, a magnet crane, the compactor --------------
addDistrict('d_scrapyard', 'The Scrapyard', 2, -65, 820, 'Mountains of scrap behind a chain-link fence: a magnet crane, the compactor, stacked wrecks, fires and dogs.', 'Scrapyard', () => district({
  id: 'd_scrapyard', name: 'The Scrapyard', tier: 2, W: 2500, crowd: 3, amb: [0.26, 0.21, 0.22], floor: MAT.asphalt, layerDy: 20,
  local: { name: 'Picker', lines: LOCAL_LINES.scrap, look: { hair: 'hood', top: '#4a3a2a', coat: 'long', legs: '#2a2420', mask: '#3a3a3a' } },
  build(L, G) {
    // the mountains behind: rust, steel, plastic, painted in tiers
    L.paint(160, G - 200, 2500, G, (P) => { heap(P, 160, 1100, G, 170, MAT.rust, 3); heap(P, 900, 1800, G, 190, MAT.steelD, 7); heap(P, 1600, 2500, G, 160, MAT.rust, 11); heap(P, 300, 900, G, 90, KMAT.plywood, 5); heap(P, 1300, 2100, G, 100, MAT.steel, 13);
      for (let k = 0; k < 80; k++) { const x = 180 + hash(k, 1, 9) * 2300, y = G - 20 - hash(k, 2, 9) * 120; P.put(x, y, [[200, 60, 40], [60, 120, 200], [220, 200, 60], [180, 180, 190]][k % 4]); } });
    // the fence and its gate, a sign hung on it
    L.paint(170, G - 70, 500, G, (P) => { stFence(P, 170, 290, G, 56); stFence(P, 350, 500, G, 56); P.block(290, G - 64, 294, G, MAT.steel, { base: 0.6 }); P.block(346, G - 64, 350, G, MAT.steel, { base: 0.6 }); P.block(380, G - 50, 460, G - 34, rp('#c8a020', 6), { base: 0.55 }); for (let i = 0; i < 9; i++) for (const [a, b] of GLYPHS[(i * 11) % GLYPHS.length]) P.put(386 + i * 8 + a, G - 46 + b, [30, 20, 10]); });
    L.lamp(300, G, 70, '#ffd8a8', 0.9);
    // floodlights on tall poles over the heaps
    for (const fx of [760, 1120, 1660, 2080]) { L.lamp(fx, G, 130, '#fff4e0', 1.1); }
    // scrap that catches the light: car doors, a fridge, a bathtub, a sign
    L.paint(300, G - 160, 2400, G, (P) => { for (let k = 0; k < 26; k++) { const x = 320 + k * 80 + hash(k, 3, 5) * 40, y = G - 20 - hash(k, 4, 5) * 90, c = ['#8a3a2a', '#3a6a9a', '#c8c0b0', '#c89a2a', '#4a7a4a'][k % 5], w = 8 + hash(k, 5, 5) * 14, h = 5 + hash(k, 6, 5) * 8; P.area(x, y, x + w, y + h, rp(c, 6), (xx, yy) => 0.7 - (yy - y) / 20 - (xx - x) / 60 + (noise(xx / 2, yy / 2, k) - 0.5) * 0.3); if (k % 4 === 0) kFill(P, x + 2, y + 2, x + 5, y + 4, '#9ad0e8'); } });
    // the dealer's shack: a box of corrugated tin on blocks, a counter window
    L.paint(520, G - 90, 700, G, (P) => { corrugated(P, 530, G - 70, 690, G, MAT.rust); P.area(522, G - 84, 698, G - 68, KMAT.corrBlue, (x, y) => 0.5 + ((x - 522) % 3 === 0 ? 0.15 : 0) - (y - G + 84) / 30, { inside: (x, y) => y >= G - 84 + (x - 522) / 176 * 8 }); kFill(P, 560, G - 54, 640, G - 30, '#ffc070', 0.35); kShelves(P, 562, G - 52, 638, G - 32, ['#c8c8d0', '#c8a040', '#3af0e0', '#8a3a3a'], { back: '#3a2410' }); P.block(556, G - 30, 644, G - 26, MAT.steelD, { base: 0.6 }); kFill(P, 655, G - 50, 675, G, '#1a1410'); });
    L.sign(560, G - 98, 7, '#ffb040', { r: 60, seed: 41 }); L.light(600, G - 40, 70, [1, 0.75, 0.45], 0.8);
    L.npc({ name: 'Old Dutch', role: 'vendor', rate: 1.1, look: { skin: SKINS[1], hair: 'bald', top: '#5a4a3a', apron: '#3a2a1a', legs: '#2a2420', hands: { fx: 26, fy: 38 }, tall: 0.95 }, x: 600, y: G, face: -1, sched: [[0, 24, 600, 'work']], behind: true, lines: ['You buying or burying?', 'I pay by the kilo. Synth parts by the gram. Kidding.', 'Marr\'s crew runs the east heaps. Don\'t go out there without a gun.'] });
    L.prop('deco', 720, G, { art: DECO.barrel(), id: 'scb1' }); L.fire(720, G - 15, 90, 1.3);
    L.critter('dog', 520, 1100, G, 2);
    // the magnet crane, a car stuck to it, swinging over the heaps
    L.paint(760, G - 260, 1150, G, (P) => stMagnetCrane(P, 830, G, { reach: 180, h: 230, hang: 120 }));
    L.light(1010, G - 110, 90, [1, 0.85, 0.6], 0.8); L.light(850, G - 40, 70, [1, 0.85, 0.5], 0.8);
    L.prop('car', 940, G, { look: { col: '#3a3a3a', under: '#ff6a3a' }, label: 'wreck' }); L.prop('wreck', 1040, G, { label: 'wrecked drone' });
    // stacked wrecks, a walk over them
    L.paint(1150, G - 80, 1340, G, (P) => stCubes(P, 1160, G, 8, 3, 21));
    L.solid(1160, G - 36, 1340, G); L.walk(1160, 1340, G - 36, 0, MAT.steel, { rail: false }); L.walk(1180, 1330, G - 54, 0, MAT.steel, { rail: false });
    L.stairs(1110, G, 1160, G - 36, MAT.rust); L.spots.push([1250, G - 54]);
    L.prop('locker', 1300, G - 54, { tier: 2, label: 'stash in the wrecks' });
    // the compactor: a press over a pit, cubes coming out of it
    L.paint(1380, G - 150, 1640, G, (P) => {
      P.block(1390, G - 120, 1600, G, MAT.steelD, { base: 0.38, panels: [70, 40], drips: 0.2, dripLen: 20 });
      P.block(1420, G - 140, 1570, G - 120, rp('#c8a020', 7), { base: 0.5, bands: 5 });
      for (const px of [1450, 1540]) P.block(px, G - 170, px + 8, G - 120, MAT.steel, { base: 0.55 });
      kFill(P, 1430, G - 90, 1560, G - 30, '#1a1210'); P.area(1432, G - 88, 1558, G - 60, rp('#7a7a7a', 7), (x, y) => ((y - G + 88) % 4 === 0 ? 0.2 : 0.55));
      for (let x = 1390; x < 1600; x++) for (let y = G - 8; y < G - 3; y++) P.put(x, y, ((x + y) >> 2) % 2 ? [220, 170, 40] : [26, 22, 18]);
      kFill(P, 1574, G - 100, 1592, G - 84, '#0a1214'); for (let k = 0; k < 6; k++) P.put(1576 + k * 2, G - 92, k % 2 ? [255, 60, 60] : [60, 255, 120], 1);
      stCubes(P, 1600, G, 2, 2, 33);
    });
    L.sign(1440, G - 160, 8, '#ff6a3a', { r: 60, seed: 42, dead: 0.3 }); L.light(1495, G - 60, 90, [1, 0.6, 0.3], 0.7, 1, { mode: 'bad', seed: 5 });
    L.vents.push({ x: 1500, y: G - 130, kind: 'steam' });
    // the east heaps: Marr's ground, fires, a burned car, more dogs
    L.paint(1680, G - 70, 2100, G, (P) => { heap(P, 1700, 1860, G, 50, MAT.rust, 17); heap(P, 1900, 2080, G, 60, MAT.steelD, 19); });
    for (const x of [1760, 1990]) { L.prop('deco', x, G, { art: DECO.barrel(), id: 'scb' + x }); L.fire(x, G - 15, 90, 1.3); }
    L.prop('car', 1880, G, { look: { col: '#2a2a2a', under: '#ff6a3a' }, label: 'burned-out car' }); L.prop('junk', 2050, G, { label: 'junk pile' }); L.prop('junk', 1700, G, { label: 'junk pile' });
    L.critter('dog', 1700, 2300, G, 2);
    // the back gate: a tower of cubes, a lookout shack on top
    L.paint(2120, G - 160, 2400, G, (P) => { stCubes(P, 2130, G, 6, 4, 45); corrugated(P, 2180, G - 106, 2250, G - 72, KMAT.corrGreen); kWin(P, 2195, G - 98, 10, 8, { lit: '#ffd890', cross: false }); stFence(P, 2290, 2400, G, 56); });
    L.solid(2130, G - 72, 2262, G); L.walk(2130, 2262, G - 72, 0, MAT.steel, { rail: false }); L.ladder(2268, G - 72, G);
    L.prop('locker', 2240, G - 72, { tier: 2, label: 'lookout locker' }); L.light(2205, G - 92, 40, [1, 0.85, 0.55], 0.5); L.spots.push([2200, G - 72]);
    L.lamp(2420, G, 60, '#c8e0ff', 0.8);
    kFoes(L, G, [['gang', 1000, 900, 1100], ['spider', 1300, 1170, 1330, G - 54], ['bruiser', 1800, 1700, 1950], ['gunner', 1990, 1880, 2100], ['gang', 2380, 2290, 2460], ['drone', 1500, 1380, 1650, G - 180]]);
    L.spots.push([400, G], [760, G], [900, G], [1080, G], [1660, G], [1840, G], [2020, G], [2300, G], [2440, G]);
    L.critter('rat', 200, 2400, G, 3); L.litter(200, 2400, G, 6);
  },
}));

// ---- Chop Shop Alley: illegal chrome, chopped cars, the Gutter King ---------------
addDistrict('d_chopshop', 'Chop Shop Alley', 2, -60, 560, 'A narrow alley of illegal chrome clinics and chop garages. The Gutter King holds court at the end.', 'Chop shops', () => district({
  id: 'd_chopshop', name: 'Chop Shop Alley', tier: 2, W: 2300, crowd: 5, amb: [0.15, 0.13, 0.18], floor: MAT.asphalt, layerDy: 0,
  local: { name: 'Lookout', lines: ['You\'re in the wrong alley, tracer.', 'Nobody here\'s got chrome. Nobody here\'s got anything. Walk on.', 'The King hears everything. Even this.'], look: { hair: 'mohawk', hairCol: '#3af0e0', hairGlow: true, top: '#1a1a1e', coat: 'jacket', cyArm: true, acc: '#3af0e0' } },
  build(L, G) {
    // the alley's walls close overhead: bridges, pipes, cables, a strip of sky
    L.paint(180, G - 300, 1700, G - 150, (P) => { for (const [a, b, y] of [[300, 520, G - 240], [800, 1100, G - 220], [1300, 1560, G - 260]]) { P.block(a, y, b, y + 14, MAT.concreteD, { base: 0.35, drips: 0.3, dripLen: 10 }); railing(P, a, b, y, MAT.steel); for (let x = a + 10; x < b; x += 30) P.put(x, y + 16, [255, 200, 140], 0.8); } for (let k = 0; k < 6; k++) cable(P, 180, G - 290 + k * 20, 1700, G - 280 + k * 18, 20 + k * 8, '#060608'); pipe(P, 180, G - 170, 1700, G - 162, MAT.rust, { joints: 40 }); });
    // a dirty clinic: "no questions", a chair through the window
    bShophouse(L, 200, 330, G, { floors: 4, wall: KMAT.teal, shops: [['clinic', '#3af0e0']], roof: 'tank', bars: true, blade: '#3af0e0', seed: 401, lit: 0.35 });
    stWait(L, 200, 330, G, { grime: true });
    L.paint(200, G - 300, 330, G, (P) => { for (let k = 0; k < 400; k++) P.tint(200 + hash(k, 1, 4) * 130, G - 300 + hash(k, 2, 4) * 300, [10, 14, 8], 0.4); for (let k = 0; k < 30; k++) P.put(210 + k * 3, G - 50 + Math.sin(k) * 2, [255, 74, 176]); });
    kStallAt(L, 380, G, 'organs', { npc: { name: 'Cold-box man', lines: ['Cold box. Don\'t open the cold box.', 'Grown, not taken. You have my word. My word\'s cheap.'] } });
    // a chop garage: a car on the lift, half its parts gone
    L.paint(430, G - 80, 640, G, (P) => stGarage(P, 440, 630, G, { h: 60, car: '#5a1a2a', sparks: true }));
    L.sign(470, G - 76, 6, '#ff6a3a', { r: 50, seed: 43, dead: 0.3 }); L.light(535, G - 30, 80, [1, 0.7, 0.4], 0.75, 1, { mode: 'bad', seed: 9 });
    L.prop('car', 690, G, { look: { col: '#2a2a3a', under: '#3af0e0' }, label: 'half-stripped car' });
    // a stack of shacks over a parts shop, a stair up to a gallery
    bStack(L, 740, 900, G, { levels: 4, shop: 'pawn', shopCol: '#3af0e0', blade: '#ff4ab0', seed: 402 });
    L.stairs(905, G, 960, G - 76); L.walk(740, 1090, G - 76, 4, MAT.steelD);
    L.prop('locker', 800, G - 76, { tier: 2, label: 'locker' }); L.prop('ac', 1040, G - 76, { label: 'air conditioner' }); L.spots.push([1000, G - 76]);
    kStallAt(L, 950, G, 'parts', { col: '#5a2a5a', npc: { name: 'Fence', lines: ['Arms, eyes, a liver if you want one. Not for you, of course. Officer.', 'The King gets a slice of everything sold in this alley.'] } });
    // the back-room surgery, seen through a door left open
    L.paint(1000, G - 150, 1150, G, (P) => { P.block(1000, G - 140, 1150, G, MAT.brickD, { base: 0.35, drips: 0.25, dripLen: 30 }); kFill(P, 1040, G - 48, 1110, G, '#0e2a2a', 0.25); for (let y = G - 46; y < G; y++) for (let x = 1042; x < 1108; x++) if ((x + y) % 7 === 0) P.put(x, y, [120, 255, 230], 0.3); P.block(1036, G - 52, 1114, G - 48, MAT.steelD, { base: 0.5 }); for (let k = 0; k < 20; k++) P.put(1015 + k, G - 100 + k * 0.5, [255, 74, 176]); kWin(P, 1020, G - 120, 14, 14, { lit: '#9af0e0', bars: true }); kWin(P, 1110, G - 120, 14, 14, { bars: true }); });
    L.prop('deco', 1075, G, { art: DECO.chair(), id: 'ccchair' }); L.light(1075, G - 30, 60, [0.5, 1, 0.9], 0.8, 1, { mode: 'tube', seed: 3 });
    L.npc({ name: 'Doc Nine', look: { skin: SKINS[0], hair: 'bald', top: '#c8d0d0', coat: 'long', legs: '#2a2a2a', mask: '#c8e0e8', cyArm: 'both', acc: '#3af0e0' }, x: 1095, y: G, face: -1, sched: [[0, 24, 1095, 'stand']], lines: ['Close the door. You\'re letting the clean out.', 'I don\'t fit chrome. I fix what other people fit badly.', 'A woman came through with a cut wrist and a serial number she didn\'t want. Polite.'] });
    // more chop shops: shutters, a vet that isn't, a garage
    kShop(L, 1160, 1240, G, 'shutter', '#3af0e0', { h: 42, seed: 403 }); L.block(1160, G - 160, 1240, G - 42, MAT.concreteD, { base: 0.32, drips: 0.3, dripLen: 40 });
    bShophouse(L, 1240, 1360, G, { floors: 3, wall: KMAT.pink, shops: [['vet', '#ffd040']], roof: 'shack', seed: 404, lit: 0.3 }); stWait(L, 1240, 1360, G, { grime: true });
    L.paint(1360, G - 80, 1560, G, (P) => stGarage(P, 1370, 1550, G, { h: 58, car: '#2a3a2a', open: 38 }));
    L.light(1460, G - 20, 60, [1, 0.75, 0.45], 0.6);
    kStallAt(L, 1610, G, 'organs', { npc: false }); L.prop('vending', 1660, G, { look: { col: '#ff4ab0', body: '#3a1a2a' }, label: 'vending machine' }); L.light(1660, G - 14, 30, [1, 0.3, 0.7], 0.6);
    L.prop('junk', 1200, G, { label: 'junk pile' }); L.prop('wreck', 1580, G, { label: 'gutted drone' });
    // the Gutter King's hall at the end
    arena(L, 1700, 2200, G, 'hall');
    // the King's court: graffiti over the hall's walls, cages on chains, a throne of scrap, a crown in neon
    L.paint(1700, G - 240, 2200, G, (P) => {
      for (let k = 0; k < 900; k++) P.tint(1700 + hash(k, 1, 6) * 500, G - 220 + hash(k, 2, 6) * 220, [12, 8, 10], 0.35);
      for (let g = 0; g < 7; g++) { const gx = 1720 + g * 66, gy = G - 120 + (g % 3) * 30, c = [[255, 74, 176], [58, 240, 224], [255, 208, 64], [154, 106, 255]][g % 4]; for (let k = 0; k < 40; k++) P.put(gx + k, gy + Math.round(Math.sin(k * 0.6 + g) * 5 + (k % 7 === 0 ? -3 : 0)), c, 0.25); for (let k = 0; k < 40; k += 2) P.put(gx + k, gy + Math.round(Math.sin(k * 0.6 + g) * 5) + 1, mixRgb(c, [0, 0, 0], 0.5)); }
      for (const cx of [1790, 2110]) { kV(P, cx, G - 230, G - 150, '#2a2a2e'); for (let y = G - 150; y < G - 112; y++) for (let x = cx - 10; x <= cx + 10; x++) if ((x - cx) % 4 === 0 || y === G - 150 || y === G - 113) P.put(x, y, tone(MAT.steel, 0.5)); kFill(P, cx - 4, G - 126, cx + 4, G - 116, '#3a2a24'); }
      heap(P, 1900, 2060, G, 46, MAT.rust, 23); P.block(1952, G - 70, 2008, G - 40, rp('#8a6a2a', 7), { base: 0.5 }); P.block(1948, G - 90, 1958, G - 40, rp('#8a6a2a', 7), { base: 0.55 }); P.block(2002, G - 90, 2012, G - 40, rp('#8a6a2a', 7), { base: 0.45 });
      for (const [a, b] of [[1960, G - 104], [1972, G - 110], [1984, G - 112], [1996, G - 110], [2008, G - 104]]) for (let y = b; y < G - 96; y++) P.put(a, y, [255, 208, 64], 1);
      kH(P, 1958, 2012, G - 96, [255, 208, 64], 1);
      stCubes(P, 1712, G, 1, 3, 50); stCubes(P, 2160, G, 1, 3, 51);
    });
    L.light(1985, G - 100, 80, [1, 0.8, 0.3], 0.8); L.light(1790, G - 130, 40, [1, 0.4, 0.6], 0.5); L.light(2110, G - 130, 40, [0.4, 1, 0.9], 0.5);
    L.enemy('king', 1980, G, { range: [1720, 2180] });
    L.prop('locker', 2240, G, { tier: 2, label: 'the King\'s strongbox' });
    kFoes(L, G, [['gang', 600, 450, 720], ['gang', 1000, 960, 1150], ['gunner', 900, 760, 1080, G - 76], ['bruiser', 1450, 1360, 1600], ['drone', 1300, 1160, 1500, G - 120]]);
    L.spots.push([300, G], [480, G], [700, G], [860, G], [1130, G], [1300, G], [1500, G], [1650, G], [2250, G]);
    L.critter('rat', 200, 1700, G, 4); L.litter(200, 1700, G, 8);
  },
}));

// ---- Clinic Row: legal medicine, mostly ---------------------------------------
addDistrict('d_clinicrow', 'Clinic Row', 2, -55, 700, 'A whole street of clinics: pharmacies, a dentist, a vet, an optician, the Mercy hospital, street medics and a blood bank.', 'Clinics', () => district({
  id: 'd_clinicrow', name: 'Clinic Row', tier: 2, W: 2500, crowd: 8, amb: [0.18, 0.2, 0.24], layerDy: 0,
  local: { name: 'Patient', lines: ['Six hours in the queue. Six. For a cough.', 'The hospital takes your blood as payment. Half a litre a visit.', 'Doctor Reyes is the only one on the Row who doesn\'t sell to the gangs.'], look: { hair: 'bob', hairCol: '#3a2a20', top: '#c8c0b0', coat: 'long', mask: '#d8e8e8' } },
  build(L, G) {
    // the head of the street: a pharmacy and an optician, flats above
    bShophouse(L, 190, 320, G, { floors: 4, wall: KMAT.cream, shops: [['pharmacy', '#3aff80']], roof: 'tank', blade: '#3aff80', seed: 501 });
    bShophouse(L, 320, 440, G, { floors: 3, wall: KMAT.mint, shops: [['glass', '#9af0ff']], roof: 'garden', seed: 502 });
    L.paint(330, G - 66, 430, G - 44, (P) => { kFill(P, 340, G - 64, 420, G - 46, '#06101a'); for (const cx of [362, 398]) for (let a = 0; a < Math.PI * 2; a += 0.05) P.put(Math.round(cx + Math.cos(a) * 9), Math.round(G - 55 + Math.sin(a) * 6), [154, 240, 255], 1); for (let x = 371; x < 389; x++) P.put(x, G - 57 - Math.round(Math.sin((x - 371) / 18 * Math.PI) * 2), [154, 240, 255], 1); });
    L.light(380, G - 55, 50, [0.6, 0.95, 1], 0.7, 1, { mode: 'sign', seed: 11 });
    kStallAt(L, 470, G, 'herbs', { npc: { name: 'Herbalist Mo', lines: ['Roots for the lungs. The air down here eats them.', 'Doctors charge you for a name. I charge you for a cure.'] } });
    L.prop('vending', 520, G, { look: { col: '#3aff80', body: '#e8f0f0' }, label: 'medicine vending machine' }); L.light(520, G - 14, 36, [0.4, 1, 0.6], 0.7);
    // the dentist: a tooth in lights; a vet with a dog on the step
    bShophouse(L, 550, 670, G, { floors: 3, wall: KMAT.whitepanel, shops: [['dental', '#e8f4ff']], roof: 'flat', balcony: 'all', seed: 503 }); stWait(L, 550, 670, G);
    L.paint(590, G - 98, 630, G - 66, (P) => { kFill(P, 594, G - 96, 626, G - 68, '#0a1018'); P.area(600, G - 92, 620, G - 72, rp('#e8f4ff', 5), (x, y) => 0.8 - (y - G + 92) / 40, { inside: (x, y) => (y < G - 82 && Math.hypot((x - 610) / 10, (y - G + 86) / 6) < 1) || (y >= G - 84 && (Math.abs(x - 604) < 3 || Math.abs(x - 616) < 3)), glow: 0.8 }); });
    L.light(610, G - 82, 50, [0.85, 0.95, 1], 0.6);
    bShophouse(L, 670, 780, G, { floors: 2, wall: KMAT.ochre, shops: [['vet', '#ffd040']], roof: 'tin', seed: 504 }); stWait(L, 670, 780, G);
    L.critter('dog', 680, 780, G, 1); L.critter('cat', 670, 780, G, 1);
    // Mercy Hospital: a white block, a red cross, the ambulance bay, a queue
    L.paint(800, G - 330, 1240, G, (P) => {
      P.block(800, G - 300, 1240, G - 60, KMAT.whitepanel, { base: 0.48, panels: [40, 30], drips: 0.15, dripLen: 30 });
      for (let fy = G - 290; fy < G - 80; fy += 30) for (let fx = 812; fx < 1228; fx += 20) kWin(P, fx, fy, 12, 16, { lit: hash(fx, fy, 6) < 0.6 ? '#e8f8ff' : null, blinds: true, cross: false });
      P.block(790, G - 310, 1250, G - 300, KMAT.whitepanel, { base: 0.62 });
      kFill(P, 1000, G - 330, 1040, G - 312, '#0a0e10'); kCross(P, 1020, G - 321, 7, '#ff2a3a');
      P.block(790, G - 62, 1250, G - 56, KMAT.whitepanel, { base: 0.62 });
      P.block(800, G - 56, 1000, G, KMAT.whitepanel, { base: 0.4 }); kFill(P, 830, G - 46, 970, G, '#d8f0ff', 0.25); for (let x = 830; x < 970; x += 35) for (let y = G - 46; y < G; y++) P.put(x, y, [60, 70, 80]);
      kFill(P, 1000, G - 56, 1240, G, '#141a1e'); for (let x = 1000; x < 1240; x++) for (let y = G - 6; y < G - 2; y++) P.put(x, y, ((x + y) >> 2) % 2 ? [220, 40, 50] : [230, 230, 230]);
    });
    L.sign(840, G - 72, 9, '#ff3a4a', { r: 70, seed: 51 }); L.light(900, G - 30, 100, [0.85, 0.95, 1], 0.9); L.light(1120, G - 30, 80, [1, 0.3, 0.35], 0.6, 1, { mode: 'bad', seed: 2 });
    L.prop('deco', 1120, G, { art: () => spinner({ col: '#e8eef2' }), id: 'ambulance' }); L.light(1120, G - 26, 30, [1, 0.2, 0.25], 0.8, 1, { mode: 'bad', seed: 13 });
    L.npc({ name: 'Doctor Reyes', look: { skin: SKINS[4], hair: 'bun', hairCol: '#1a1414', top: '#e0e8e8', coat: 'long', legs: '#3a4a4a', glasses: true }, x: 940, y: G, face: -1, sched: [[0, 24, 940, 'stand']], lines: ['Eighteen-hour shift. Ask quickly.', 'We treat anyone. Chrome or no chrome, a wound is a wound.', 'Synths don\'t come here. They don\'t get sick. They get broken.'] });
    const queue = [['Patient', SKINS[1], '#5a3a3a', 'long'], ['Old patient', SKINS[5], '#3a3a5a', 'bun'], ['Patient', SKINS[3], '#3a5a3a', 'cap'], ['Mother', SKINS[2], '#6a3a5a', 'bob']];
    queue.forEach(([n, sk, t, h], i) => L.npc({ name: n, look: { skin: sk, hair: h, top: t, legs: '#2a2a2a', coat: i % 2 ? 'long' : 'jacket', tall: i === 3 ? 0.9 : 1 }, x: 860 - i * 18, y: G, face: 1, sched: [[0, 24, 860 - i * 18, 'stand']], lines: [['Don\'t cut in. I\'ve been here since noon.', 'It\'s my lungs. It\'s everyone\'s lungs.', 'They took my blood last time. I\'m back for the change.', 'My boy swallowed a battery. He\'s fine. Probably.'][i]] }));
    // the street medics and the blood bank
    kStallAt(L, 1290, G, 'med', { npc: { name: 'Street medic', lines: ['Patches, painkillers, stitches. No chrome. I\'m legal.', 'Bleeding? Sit. Pay after.'] } });
    kStallAt(L, 1360, G, 'med', { npc: false });
    bShophouse(L, 1400, 1540, G, { floors: 4, wall: KMAT.pink, shops: [['clinic', '#ff3a4a']], roof: 'tank', blade: '#ff3a4a', bladeLeft: true, seed: 505 }); stWait(L, 1400, 1540, G);
    L.paint(1410, G - 40, 1530, G - 4, (P) => { for (let k = 0; k < 5; k++) { const bx = 1418 + k * 22; P.area(bx, G - 30, bx + 10, G - 12, rp('#c81a2a', 6), (x, y) => 0.6 - (y - G + 30) / 30, { glow: 0.3 }); kV(P, bx + 5, G - 36, G - 30, '#c8c8c8'); } });
    // a lane of smaller practices with a gallery over them
    bShophouse(L, 1560, 1680, G, { floors: 3, wall: KMAT.teal, shops: [['clinic', '#3af0e0']], roof: 'flat', balcony: false, seed: 506, gh: 44 }); stWait(L, 1560, 1680, G, { gh: 44 });
    bShophouse(L, 1680, 1800, G, { floors: 3, wall: KMAT.cream, shops: [['pharmacy', '#3aff80']], roof: 'tile', balcony: false, seed: 507, gh: 44 });
    bShophouse(L, 1800, 1930, G, { floors: 4, wall: KMAT.stucco, shops: [['tea', '#ffd040']], roof: 'tank', balcony: false, seed: 508, gh: 44 });
    L.stairs(1565, G, 1630, G - 82); L.walk(1565, 1925, G - 82, 5);
    for (const x of [1660, 1740, 1820, 1880]) L.prop('deco', x, G - 82, { art: DECO.door({ col: '#e0e8e8', light: x % 2 ? '#e8f8ff' : '#9af0e0' }), id: 'crdoor' + x });
    L.prop('locker', 1900, G - 82, { tier: 2, label: 'locker' }); L.spots.push([1780, G - 82]);
    kStallAt(L, 1870, G, 'herbs', { npc: false });
    // a little garden of rest at the end, a shrine to the sick, a bench
    bPark(L, 1960, 2180, G, { trees: ['willow', 'sakura'], seed: 509 });
    bToro(L, 2200, G);
    bShophouse(L, 2230, 2370, G, { floors: 5, wall: KMAT.whitepanel, shops: [['clinic', '#e8f4ff'], ['pharmacy', '#3aff80']], roof: 'garden', seed: 510 }); stWait(L, 2230, 2300, G);
    L.prop('car', 2430, G, { look: { col: '#e8e8e8', under: '#ff3a4a' }, label: 'parked car' });
    L.prop('ac', 2380, G, { label: 'air conditioner' }); L.prop('junk', 1950, G, { label: 'junk pile' });
    L.prop('locker', 2470, G, { tier: 2, label: 'locker' });
    kFoes(L, G, [['gang', 1320, 1260, 1400], ['gunner', 1750, 1600, 1900, G - 82], ['drone', 2050, 1950, 2200], ['gang', 2300, 2200, 2450], ['spider', 1500, 1420, 1560]]);
    L.spots.push([260, G], [600, G], [760, G], [1270, G], [1450, G], [1620, G], [2000, G], [2150, G], [2400, G]);
    L.critter('rat', 200, 2400, G, 2); L.litter(200, 2400, G, 5);
  },
}));
