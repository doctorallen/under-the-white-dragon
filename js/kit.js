'use strict';
// ---------------------------------------------------------------------------
// The architect's kit: the pieces hand-built districts are made of. Buildings
// with shops on the bottom and people living above (shophouses), a capsule
// tower, wooden townhouses, temples, shrine gates and pagodas, glass towers,
// dilapidated stacks of shacks, slab blocks, theatres, bathhouses, arcades,
// clinics and pharmacies, parks and their trees; and the painting tricks
// they share: tiled roofs, lattices, curtains, paper lanterns, awnings,
// balconies, round windows. Each building paints its stretch [x0, x1] above
// the ground line G and puts in its lights; walkways, props and people are
// added by the district that places it.
// ---------------------------------------------------------------------------

// ---- more materials ------------------------------------------------------------
const KMAT = {
  stucco: R(['#2a2622', '#4a4238', '#7a6e5e', '#c8b8a0']),
  plaster: R(['#2a2826', '#56524c', '#9a948a', '#e0dad0']),
  cream: R(['#2e2a20', '#5a5240', '#9a8e70', '#e0d4b0']),
  teal: R(['#0e2224', '#1a3a3c', '#2a5a5a', '#6aa8a0']),
  mint: R(['#16261e', '#2a4a3a', '#4a7a62', '#a8d8bc']),
  pink: R(['#2a1620', '#4a2a36', '#7a4a58', '#d8a0b0']),
  ochre: R(['#2a1a0a', '#5a3a14', '#8a6024', '#d8a858']),
  darkwood: R(['#120a06', '#24160c', '#3a2414', '#6a4a2e']),
  lacquer: R(['#2a0806', '#5a120c', '#8a2214', '#d84a2a']),
  gold: R(['#2a1a04', '#6a4a10', '#b08a24', '#ffe080']),
  kawara: R(['#0e1014', '#1c2028', '#2e3440', '#6a7488']),
  terracotta: R(['#2a0e08', '#5a2414', '#8a3e20', '#d8804a']),
  whitepanel: R(['#2a2e34', '#5a6270', '#9aa4b0', '#eef2f6']),
  blackglass: R(['#04060a', '#0a0e16', '#141c28', '#3a4a60']),
  verdigris: R(['#0a1a16', '#1a3a30', '#2e6a54', '#7ac8a8']),
  tarp: R(['#0a1426', '#14284a', '#24447a', '#5a8ac8']),
  tarpR: R(['#260a0a', '#4a1414', '#7a2424', '#c85a4a']),
  plywood: R(['#2a1c0e', '#4a341c', '#7a5a34', '#c8a070']),
  corrBlue: R(['#0e1a22', '#1c3444', '#2e5468', '#7aa8c0']),
  corrGreen: R(['#0e1a12', '#1c3424', '#2e5438', '#7aa880']),
  stone: R(['#18181a', '#2e2e30', '#4a4a4a', '#9a968c']),
  moss: R(['#0c140a', '#1a2a14', '#2e4422', '#6a8a44']),
  brickR: R(['#260c08', '#4a1a10', '#7a2e1c', '#c86a48']),
  concreteL: R(['#2a2a2c', '#4e4e50', '#7a7a78', '#c8c4bc']),
  grass: R(['#08120a', '#12261a', '#1e3e26', '#4a7a44']),
  leaf: R(['#0a160c', '#163020', '#285034', '#5a9a5a']),
  blossom: R(['#3a1a2a', '#7a3a5a', '#c86a8a', '#ffc8d8']),
  bark: R(['#0e0806', '#1e140c', '#32221a', '#5a4434']),
  water: R(['#04080e', '#081420', '#10283a', '#2a5a70']),
};

// ---- painting tricks -----------------------------------------------------------
// a flat fill, a stroke-free rectangle of one colour (for frames and shadows)
function kFill(P, x0, y0, x1, y1, col, glow = 0) { const c = col3(col); for (let y = Math.max(y0, P.oy); y < Math.min(y1, P.oy + P.h); y++) for (let x = Math.max(x0, P.ox); x < Math.min(x1, P.ox + P.w); x++) P.put(x, y, c, glow); }
// a horizontal line and a vertical one
function kH(P, x0, x1, y, col, glow = 0) { const c = col3(col); for (let x = x0; x < x1; x++) P.put(x, y, c, glow); }
function kV(P, x, y0, y1, col, glow = 0) { const c = col3(col); for (let y = y0; y < y1; y++) P.put(x, y, c, glow); }
// a tiled roof seen from the front: from the eave line ey up to the ridge,
// wider than the walls by `over`, rows of round tile ends, a heavy ridge cap;
// `curve` lifts its ends like a temple's
function kRoof(P, x0, x1, ey, h, ramp, o = {}) {
  const over = o.over === undefined ? 8 : o.over, curve = o.curve || 0, top = ey - h, inset = o.inset === undefined ? h * 0.9 : o.inset, ax0 = x0 - over, ax1 = x1 + over;
  const edge = (y) => { const t = (ey - y) / h; return [ax0 + inset * t, ax1 - inset * t]; };
  const lift = (x) => { if (!curve) return 0; const d = Math.min(x - ax0, ax1 - x); return d < 18 ? (1 - d / 18) * (1 - d / 18) * curve : 0; };
  P.area(ax0, top - curve - 2, ax1, ey + 3, ramp, (x, y) => {
    const yy = y + lift(x), row = Math.floor((ey - yy) / 3), inRow = (ey - yy) % 3;
    let v = 0.42 + (noise(x / 30, y / 8, 31) - 0.5) * 0.12 - (ey - yy) / h * 0.12;
    if (inRow < 1) v -= 0.2; else if (inRow < 2) v += 0.08;
    if ((x + row * 2) % 4 === 0) v -= 0.1;
    if (yy > ey) v = 0.2 - (yy - ey) * 0.05;
    return v;
  }, { inside: (x, y) => { const yy = y + lift(x); if (yy > ey + 2 || yy < top) return false; const [a, b] = edge(Math.min(yy, ey)); return x >= a && x <= b; } });
  // the ridge cap, and the tile ends along the eave
  const [ra, rb] = edge(top); P.block(ra - 2, top - 3, rb + 2, top + 1, ramp, { base: 0.62 });
  for (let x = ax0; x <= ax1; x += 3) { const y = Math.round(ey + 1 - lift(x)); P.put(x, y, tone(ramp, 0.75)); P.put(x + 1, y, tone(ramp, 0.5)); P.put(x, y + 1, tone(ramp, 0.15)); }
  if (o.ornament) { const oc = col3(o.ornament); for (const x of [ra, rb]) for (let j = 0; j < 4; j++) { P.put(x, top - 4 - j, oc, 0.2); P.put(x + (x === ra ? -1 : 1) * (j > 1 ? 1 : 0), top - 4 - j, oc, 0.2); } }
  // the shadow it throws on the wall under it
  for (let x = x0; x < x1; x++) for (let j = 1; j < 4; j++) P.tint(x, ey + 2 + j, [4, 3, 8], 0.5 - j * 0.12);
}
// upright slats: a wooden lattice front, light between the slats if lit
function kLattice(P, x0, y0, x1, y1, ramp, o = {}) {
  const step = o.step || 3, back = o.lit ? col3(o.lit) : null;
  P.area(x0, y0, x1, y1, ramp, (x, y) => { const k = (x - x0) % step; return k === 0 ? 0.68 : k === 1 ? 0.45 : back ? 0.1 : 0.16; });
  if (back) for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 2; x < x1; x += step) P.put(x, y, mixRgb(back, [0, 0, 0], 0.35 + (y - y0) / (y1 - y0) * 0.3), 0.35);
  kH(P, x0, x1, y0, tone(ramp, 0.8)); kH(P, x0, x1, y1 - 1, tone(ramp, 0.2));
}
// a shop curtain in panels, split up from the bottom, a glyph on the middle
function kNoren(P, x0, x1, y, h, col, o = {}) {
  const ramp = rp(col, 6), n = Math.max(2, Math.round((x1 - x0) / 7)), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const a = Math.round(x0 + i * w), b = Math.round(x0 + (i + 1) * w) - 1; P.area(a, y, b, y + h, ramp, (x, yy) => 0.62 - (yy - y) / h * 0.3 - (x - a) / (w * 4) + (yy - y < 1 ? 0.2 : 0)); }
  kH(P, x0 - 1, x1 + 1, y - 1, '#2a1a10');
  if (o.glyph !== false) { const g = GLYPHS[(o.glyph || x0) % GLYPHS.length], gx = Math.round((x0 + x1) / 2) - 1, gy = y + 2; for (const [i, j] of g) P.put(gx + i, gy + j, o.ink || '#f0e8d8'); }
}
// a paper lantern, hung: ribs across a lit body, black caps; it glows
function kLantern(P, x, y, col, o = {}) {
  const c = col3(col), r = o.r || 3, h = o.h || 5;
  kV(P, x, y - 3, y, '#1a1414');
  for (let j = 0; j < h; j++) { const t = (j + 0.5) / h, w = Math.round(r * Math.sin(Math.PI * t) + 0.6); for (let i = -w; i <= w; i++) P.put(x + i, y + j, j % 2 ? mixRgb(c, [255, 240, 200], 0.35 - Math.abs(i) * 0.08) : mixRgb(c, [0, 0, 0], 0.15), 0.9); }
  kH(P, x - 1, x + 2, y, '#141010'); kH(P, x - 1, x + 2, y + h, '#141010');
  if (o.glyph) P.put(x, y + (h >> 1), [30, 10, 10]);
}
// a row of lanterns on a sagging string
function kLanterns(P, x0, x1, y, cols, o = {}) {
  cable(P, x0, y, x1, y, o.sag === undefined ? 4 : o.sag, '#120e0c');
  const step = o.step || 14;
  for (let x = x0 + step / 2; x < x1; x += step) { const t = (x - x0) / (x1 - x0), yy = Math.round(y + Math.sin(Math.PI * t) * (o.sag === undefined ? 4 : o.sag)) + 3; kLantern(P, Math.round(x), yy, cols[Math.floor(x / step) % cols.length], { r: o.r || 2, h: o.h || 4 }); }
}
// an awning over a shopfront, front-on: a sloping band, striped or plain, a
// scalloped or straight edge, its shadow under it
function kAwning(P, x0, x1, y, col, o = {}) {
  const h = o.h || 7, ramp = rp(col, 7), stripe = o.stripe ? rp(o.stripe, 7) : null, sc = o.scallop !== false;
  P.area(x0 - 2, y, x1 + 2, y + h + 2, ramp, (x, yy) => { const t = (yy - y) / h; return 0.72 - t * 0.35 + (yy - y < 1 ? 0.2 : 0); }, { inside: (x, yy) => yy < y + h || (sc && yy < y + h + 2 && (x - x0) % 6 < 4) });
  if (stripe) for (let yy = y; yy < y + h + 2; yy++) for (let x = x0 - 2; x < x1 + 2; x++) if (Math.floor((x - x0) / 5) % 2 === 0 && (yy < y + h || (sc && yy < y + h + 2 && (x - x0) % 6 < 4))) P.put(x, yy, tone(stripe, 0.7 - (yy - y) / h * 0.35));
  for (let x = x0; x < x1; x++) for (let j = 0; j < 5; j++) P.tint(x, y + h + 2 + j, [4, 3, 8], 0.45 - j * 0.08);
}
// a balcony across the front: a slab, a railing, and what people keep on them
function kBalcony(P, x0, x1, y, o = {}) {
  const ramp = o.ramp || MAT.concrete, seed = o.seed || x0;
  slab(P, x0, x1, y, 3, ramp, { drips: 0.15, dripLen: 6 });
  if (o.solid) P.block(x0, y - 9, x1, y, ramp, { base: 0.42, lip: 0.8 });
  else { railing(P, x0, x1, y, o.rail || MAT.steel, { h: 8, step: o.step || 3 }); }
  for (let x = x0 + 3; x < x1 - 6; x += 9) {
    const h = hash(x, y, seed);
    if (h < 0.18) { for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) P.put(x + i, y - 6 + j, tone(KMAT.terracotta, 0.5 - j * 0.05)); for (let k = 0; k < 9; k++) P.put(x + hash(k, 1, x) * 6 - 1, y - 7 - hash(k, 2, x) * 6, tone(KMAT.leaf, 0.4 + hash(k, 3, x) * 0.5)); }
    else if (h < 0.3) { for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) P.put(x + i, y - 7 + j, tone(rp('#8a8a84', 6), 0.6 - j * 0.06 - (i === 5 ? 0.2 : 0))); P.put(x + 2, y - 4, [30, 30, 30]); P.put(x + 3, y - 4, [30, 30, 30]); }
    else if (h < 0.42) { const c = rp(['#a83a3a', '#3a6aa8', '#d8d0b0', '#3a8a5a'][Math.floor(hash(x, 2, seed) * 4)], 5); for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) P.put(x + i, y - 9 + j, tone(c, 0.65 - j * 0.05)); }
  }
}
// a round window: a thick frame and a lit or dark disc
function kPort(P, cx, cy, r, lit, o = {}) {
  const fr = o.frame || MAT.chrome, glass = lit ? col3(lit) : [16, 22, 32];
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = Math.hypot(x, y);
    if (d <= r - 1) P.put(cx + x, cy + y, lit ? mixRgb(glass, [255, 255, 255], (x + y < -r * 0.6) ? 0.4 : 0) : mixRgb(glass, [80, 100, 130], x + y < -r * 0.5 ? 0.3 : 0), lit ? 0.45 : 0);
    else if (d <= r + 1) P.put(cx + x, cy + y, tone(fr, 0.55 - (x + y) / (r * 4)));
  }
}
// an air conditioner hung on the wall, and its drip stain
function kAC(P, x, y, o = {}) {
  const ramp = rp(o.col || '#8a8a84', 6);
  for (let j = 0; j < 7; j++) for (let i = 0; i < 10; i++) P.put(x + i, y + j, tone(ramp, j === 0 ? 0.9 : 0.6 - j * 0.04 - (i > 8 ? 0.2 : 0)));
  for (let j = 1; j < 6; j++) for (let i = 1; i < 6; i++) if (Math.hypot(i - 3, j - 3) < 2.6) P.put(x + i, y + j, (i + j) % 2 ? [24, 24, 26] : [50, 50, 54]);
  for (let j = 7; j < 7 + (o.drip || 12); j++) P.tint(x + 7, y + j, [10, 12, 10], 0.35);
}
// a down pipe with brackets
function kDrain(P, x, y0, y1, ramp = MAT.steelD) { for (let y = y0; y < y1; y++) { P.put(x, y, tone(ramp, 0.65)); P.put(x + 1, y, tone(ramp, 0.35)); if ((y - y0) % 24 === 0) { P.put(x - 1, y, tone(ramp, 0.5)); P.put(x + 2, y, tone(ramp, 0.3)); } } }
// a window with a frame, a sill, and what's behind it
function kWin(P, x, y, w, h, o = {}) {
  const lit = o.lit, fr = o.frame || [10, 10, 14], c = lit ? col3(lit) : col3(o.dark || '#0e141e');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let col = lit ? mixRgb(c, [0, 0, 0], j / h * 0.35) : mixRgb(c, [70, 90, 110], (i + j < 3 ? 0.25 : 0) + hash(x + i, y + j, 5) * 0.06);
    if (lit && o.blinds && j % 2) col = mixRgb(col, [0, 0, 0], 0.4);
    if (lit && o.curtain && (i < 2 || i > w - 3)) col = mixRgb(col3(o.curtain), [0, 0, 0], 0.3);
    if (lit && o.figure && i > w / 3 && i < w / 3 + 3 && j > h / 3) col = mixRgb(col, [12, 8, 12], 0.85);
    P.put(x + i, y + j, col, lit ? 0.35 : 0);
  }
  if (o.bars) for (let i = 1; i < w; i += 3) for (let j = 0; j < h; j++) P.put(x + i, y + j, [20, 20, 24]);
  if (o.cross !== false && w > 7) { for (let j = 0; j < h; j++) P.put(x + (w >> 1), y + j, fr); }
  for (let i = -1; i <= w; i++) { P.put(x + i, y - 1, fr); P.put(x + i, y + h, tone(MAT.concrete, 0.7)); }
  for (let j = 0; j < h; j++) { P.put(x - 1, y + j, fr); P.put(x + w, y + j, fr); }
}
// a vertical sign hung off a wall on a bracket, Hong Kong style
function kBlade(P, x, y, n, col, o = {}) {
  const [w, h] = signSize(n, true); kH(P, x - 3, x + w + 3, y - 2, tone(MAT.steelD, 0.6)); sign(P, x, y, n, col, Object.assign({ vert: true }, o));
}
// a cross, lit: green for a pharmacy, red or white for a clinic
function kCross(P, cx, cy, s, col) { const c = col3(col); for (let j = -s; j <= s; j++) for (let i = -s; i <= s; i++) if (Math.abs(i) <= s / 3 || Math.abs(j) <= s / 3) P.put(cx + i, cy + j, Math.abs(i) <= s / 3 && Math.abs(j) <= s / 3 ? mixRgb(c, [255, 255, 255], 0.5) : c, 1); }
// a tree, painted: a cherry in blossom, a pine in layers, a willow, a dead one
function kTree(P, x, G, kind, o = {}) {
  const s = o.seed || x, h = o.h || 60;
  const trunk = (x0, y0, x1, y1, w) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k <= n; k++) { const t = k / n, cx = lerp(x0, x1, t), cy = lerp(y0, y1, t), ww = w * (1 - t * 0.5); for (let i = -ww; i <= ww; i++) P.put(cx + i, cy, tone(KMAT.bark, 0.5 - i / (ww * 3) + hash(Math.round(cx + i), Math.round(cy), s) * 0.15)); } };
  const blob = (cx, cy, rx, ry, ramp, k = 1) => P.area(cx - rx, cy - ry, cx + rx, cy + ry, ramp, (xx, yy) => 0.62 - (yy - cy) / ry * 0.25 - (xx - cx) / rx * 0.18 + (noise(xx / 3, yy / 3, s) - 0.5) * 0.5, { inside: (xx, yy) => { const d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2; return d < 1 - noise(xx / 4, yy / 4, s + 1) * 0.35 * k; } });
  if (kind === 'sakura') {
    trunk(x, G, x - 3, G - h * 0.55, 3); trunk(x - 3, G - h * 0.5, x - 16, G - h * 0.8, 1.6); trunk(x - 2, G - h * 0.55, x + 14, G - h * 0.85, 1.6);
    for (const [dx, dy, rx, ry] of [[-14, -0.82, 16, 10], [12, -0.86, 17, 11], [-1, -0.98, 18, 10], [-24, -0.66, 10, 7], [24, -0.7, 11, 7]]) blob(x + dx, G + dy * h, rx, ry, KMAT.blossom);
    for (let k = 0; k < 14; k++) P.put(x - 30 + hash(k, 1, s) * 60, G - 1 - hash(k, 2, s) * 2, tone(KMAT.blossom, 0.8));
  } else if (kind === 'pine') {
    trunk(x, G, x + 4, G - h * 0.7, 2.6); trunk(x + 3, G - h * 0.45, x - 14, G - h * 0.55, 1.4); trunk(x + 4, G - h * 0.65, x + 18, G - h * 0.72, 1.2);
    for (const [dx, dy, rx, ry] of [[-16, -0.6, 13, 5], [18, -0.76, 12, 5], [3, -0.82, 15, 6], [2, -0.96, 9, 5], [-4, -0.42, 10, 4]]) blob(x + dx, G + dy * h, rx, ry, R(['#08140e', '#10241a', '#1c3a26', '#3a6a3a']), 0.6);
  } else if (kind === 'willow') {
    trunk(x, G, x + 1, G - h * 0.7, 3);
    blob(x, G - h * 0.78, 22, 12, KMAT.leaf);
    for (let k = 0; k < 26; k++) { const sx = x - 22 + hash(k, 1, s) * 44, len = h * (0.3 + hash(k, 2, s) * 0.4); for (let j = 0; j < len; j++) P.put(sx + Math.sin(j / 6 + k) * 1.2, G - h * 0.78 + j, tone(KMAT.leaf, 0.55 - j / len * 0.3 + (k % 3) * 0.1)); }
  } else if (kind === 'bamboo') {
    for (let k = 0; k < 7; k++) { const bx = x - 12 + k * 4 + Math.round(hash(k, 1, s) * 2), bh = h * (0.7 + hash(k, 2, s) * 0.3); for (let j = 0; j < bh; j++) { const v = j % 9 === 0 ? 0.8 : 0.5; P.put(bx, G - j, tone(R(['#10200a', '#24401a', '#3e6a2a', '#8ab85a']), v)); P.put(bx + 1, G - j, tone(R(['#10200a', '#24401a', '#3e6a2a', '#8ab85a']), v - 0.2)); } for (let q = 0; q < 4; q++) { const ly = G - bh + 4 + q * 7; for (let i = 0; i < 5; i++) P.put(bx + (q % 2 ? i : -i), ly + i * 0.4, tone(KMAT.leaf, 0.6)); } }
  } else if (kind === 'dead') {
    trunk(x, G, x + 2, G - h * 0.7, 2.4); trunk(x + 1, G - h * 0.4, x - 14, G - h * 0.7, 1.2); trunk(x + 2, G - h * 0.55, x + 16, G - h * 0.85, 1.1); trunk(x + 2, G - h * 0.7, x + 4, G - h, 0.8);
  } else { // a street tree in a pot of concrete
    trunk(x, G - 6, x, G - h * 0.6, 2);
    blob(x, G - h * 0.75, 14, 12, KMAT.leaf);
    P.block(x - 8, G - 7, x + 9, G, MAT.concrete, { base: 0.5 });
  }
}
// grass and a path's edge along the ground
function kGrass(P, x0, x1, G, o = {}) {
  const s = o.seed || 5;
  P.area(x0, G - 3, x1, G + 4, KMAT.grass, (x, y) => 0.45 + (noise(x / 6, y, s) - 0.5) * 0.5 + (y < G ? 0.15 : 0), { inside: (x, y) => y >= G - hash(x, 0, s) * 4 });
  for (let x = x0; x < x1; x += 2) if (hash(x, 1, s) < 0.12) { P.put(x, G - 4, tone(KMAT.blossom, 0.8)); }
}
// a stone lantern, a shrine gate, the steps up to a hall
function kToro(P, x, G, o = {}) {
  const st = o.ramp || KMAT.stone;
  P.block(x - 6, G - 4, x + 6, G, st, { base: 0.5 }); P.block(x - 2, G - 18, x + 2, G - 4, st, { base: 0.5 });
  P.block(x - 5, G - 26, x + 5, G - 18, st, { base: 0.55 }); kFill(P, x - 2, G - 24, x + 2, G - 20, '#ffc070', 0.8);
  kRoof(P, x - 4, x + 4, G - 26, 5, st, { over: 3, inset: 4, curve: 1 }); P.put(x, G - 33, tone(st, 0.7));
}
function kTorii(P, x0, x1, G, h, o = {}) {
  const lac = o.ramp || KMAT.lacquer, w = x1 - x0;
  for (const px of [x0 + w * 0.14, x1 - w * 0.14 - 4]) { P.block(Math.round(px), G - h, Math.round(px) + 4, G, lac, { base: 0.5, lip: 0 }); P.block(Math.round(px) - 1, G - 4, Math.round(px) + 5, G, KMAT.stone, { base: 0.4 }); }
  P.block(x0 + w * 0.08, G - h * 0.78, x1 - w * 0.08, G - h * 0.78 + 3, lac, { base: 0.55 });
  // the top beam, curving up at its ends, black on top
  P.area(x0 - 4, G - h - 6, x1 + 4, G - h + 3, lac, (x, y) => 0.6 - (y - (G - h - 6)) / 12, { inside: (x, y) => { const d = Math.min(x - x0 + 4, x1 + 4 - x), lift = d < 12 ? (1 - d / 12) * 4 : 0; return y >= G - h - 2 - lift && y <= G - h + 2 - lift * 0.5; } });
  P.area(x0 - 4, G - h - 7, x1 + 4, G - h - 3, KMAT.darkwood, () => 0.4, { inside: (x, y) => { const d = Math.min(x - x0 + 4, x1 + 4 - x), lift = d < 12 ? (1 - d / 12) * 4 : 0; return y >= G - h - 4 - lift && y <= G - h - 2 - lift; } });
  if (o.plaque !== false) { P.block((x0 + x1) / 2 - 4, G - h + 1, (x0 + x1) / 2 + 4, G - h * 0.78, KMAT.darkwood, { base: 0.4 }); P.put((x0 + x1) / 2, G - h + 5, col3('#ffd040'), 0.4); }
}
// steps up to a platform, painted (pair them with L.stairs for feet)
function kSteps(P, x0, x1, G, h, ramp) { const n = Math.ceil(h / 3); for (let k = 0; k < n; k++) P.block(x0 + k * 2, G - (k + 1) * 3, x1 - k * 2, G - k * 3, ramp, { base: 0.55 - k * 0.02 }); }
// a lit display of goods behind glass: shelves of little coloured things
function kShelves(P, x0, y0, x1, y1, cols, o = {}) {
  const s = o.seed || x0;
  kFill(P, x0, y0, x1, y1, o.back || '#1a1612', 0);
  for (let y = y0 + 6; y < y1; y += 7) { kH(P, x0, x1, y, tone(MAT.wood, 0.6)); for (let x = x0 + 1; x < x1 - 1; x += 2) if (hash(x, y, s) < 0.75) { const c = col3(cols[Math.floor(hash(x, y, s + 1) * cols.length)]), hh = 2 + Math.floor(hash(x, y, s + 2) * 3); for (let j = 1; j <= hh; j++) P.put(x, y - j, mixRgb(c, [255, 255, 255], j === hh ? 0.3 : 0), o.glow || 0); } }
}

// ---- shopfronts -------------------------------------------------------------------
// the ground floor of a building, [x0, x1] by h px over G; `kind` says what's
// sold there, `col` its colour. Lights and signs go in with it.
function kShop(L, x0, x1, G, kind, col, o = {}) {
  const h = o.h || 40, w = x1 - x0, c = col3(col || '#ffd040'), mid = Math.round((x0 + x1) / 2), seed = o.seed || x0;
  L.paint(x0, G - h - 12, x1, G, (P) => {
    // the frame: a lintel, piers at the sides
    P.block(x0, G - h, x1, G - h + 4, o.frame || MAT.steelD, { base: 0.45 });
    P.block(x0, G - h + 4, x0 + 3, G, o.frame || MAT.steelD, { base: 0.5, lip: 0 }); P.block(x1 - 3, G - h + 4, x1, G, o.frame || MAT.steelD, { base: 0.35, lip: 0 });
    const ix0 = x0 + 3, ix1 = x1 - 3, iy0 = G - h + 4;
    if (kind === 'glass' || kind === 'boutique') { // a lit window display and a door
      kFill(P, ix0, iy0, ix1, G, mixRgb(c, [20, 16, 24], 0.72), 0.25);
      for (let x = ix0 + 6; x < ix1 - 6; x += 12) { P.block(x, G - 22, x + 5, G - 4, rp(mixRgb(c, [255, 255, 255], 0.3), 5), { base: 0.6 }); P.block(x + 1, G - 26, x + 4, G - 22, rp('#c8a080', 4), { base: 0.6 }); }
      for (let y = iy0; y < G; y++) P.put(ix0 + Math.round(w * 0.6), y, [18, 18, 22]);
      for (let x = ix0; x < ix1; x++) if ((x + G) % 13 < 2) for (let y = iy0; y < G; y++) if ((x + y) % 17 === 0) P.put(x, y, [220, 240, 255], 0.3);
    } else if (kind === 'shutter') { // closed for the night, tagged
      P.area(ix0, iy0, ix1, G, rp(o.shutCol || '#6a6a70', 7), (x, y) => ((y - iy0) % 3 === 0 ? 0.25 : 0.55) - (x - ix0) / (w * 3) + (noise(x / 8, y / 8, seed) - 0.5) * 0.2);
      for (let k = 0; k < w * 0.6; k++) P.put(ix0 + 4 + k, G - 14 + Math.sin(k * 0.5 + seed) * 3, c);
    } else if (kind === 'half') { // shutter half up, light under it
      P.area(ix0, iy0, ix1, G - 14, rp('#6a6a70', 7), (x, y) => ((y - iy0) % 3 === 0 ? 0.25 : 0.55));
      kFill(P, ix0, G - 14, ix1, G, mixRgb(c, [30, 20, 10], 0.5), 0.4);
    } else if (kind === 'noren' || kind === 'ramen' || kind === 'izakaya') { // dark wood, a curtain over the door, lanterns
      P.area(ix0, iy0, ix1, G, KMAT.darkwood, (x, y) => ((x - ix0) % 4 === 0 ? 0.55 : 0.32));
      kFill(P, mid - 12, iy0 + 4, mid + 12, G, mixRgb(c, [40, 24, 10], 0.55), 0.35);
      kNoren(P, mid - 13, mid + 13, iy0 + 2, 14, kind === 'ramen' ? '#c82a2a' : kind === 'izakaya' ? '#1a2a5a' : (o.noren || '#2a2a3a'));
      if (kind !== 'noren') { kLantern(P, ix0 + 6, iy0 + 4, '#ff4a2a', { r: 3, h: 6 }); kLantern(P, ix1 - 6, iy0 + 4, '#ff4a2a', { r: 3, h: 6 }); }
    } else if (kind === 'counter' || kind === 'food') { // an open counter, the kitchen behind it
      kFill(P, ix0, iy0, ix1, G - 14, mixRgb(c, [30, 20, 10], 0.62), 0.3);
      kShelves(P, ix0 + 4, iy0 + 4, ix1 - 4, G - 18, ['#e8e0d0', '#c8a040', '#a83a2a', '#3a8a5a'], { back: mixRgb(c, [20, 14, 10], 0.75), seed });
      P.block(ix0 - 2, G - 15, ix1 + 2, G - 12, MAT.steel, { base: 0.65 }); P.block(ix0, G - 12, ix1, G, MAT.steelD, { base: 0.35, panels: [12, 12] });
      for (let k = 0; k < 10; k++) P.put(ix0 + 8 + k * 0.3, G - 18 - k, [200, 200, 210]);
    } else if (kind === 'pharmacy') { // shelves of bottles, a green cross
      kFill(P, ix0, iy0, ix1, G, '#0e2a22', 0.2);
      kShelves(P, ix0 + 3, iy0 + 6, ix1 - 3, G - 10, ['#e8f0e8', '#3aff80', '#ffd040', '#ff6a8a', '#9af0ff'], { back: '#102a24', glow: 0.25, seed });
      P.block(ix0, G - 10, ix1, G, KMAT.whitepanel, { base: 0.5 });
    } else if (kind === 'clinic' || kind === 'dental' || kind === 'vet') { // white tile, a glass door, a bed or a chair inside
      P.area(ix0, iy0, ix1, G, KMAT.whitepanel, (x, y) => 0.55 + (((x - ix0) % 6 === 0 || (y - iy0) % 6 === 0) ? -0.15 : 0));
      kFill(P, ix0 + 4, iy0 + 4, mid - 2, G, '#7aa8b4', 0.12);
      for (let y = iy0 + 4; y < G; y++) P.put(ix0 + 4 + ((y * 3) % (mid - ix0 - 6)), y, [255, 255, 255], 0.4);
      kFill(P, mid + 2, iy0 + 6, ix1 - 4, G - 16, '#0e1a1e'); for (let k = 0; k < (ix1 - mid - 8); k++) P.put(mid + 3 + k, G - 22 - Math.round(Math.sin(k * 0.8) * 2 + (k % 9 === 0 ? -3 : 0)), [90, 255, 160], 0.9);
    } else if (kind === 'pachinko' || kind === 'arcade') { // a wall of bulbs and machines
      kFill(P, ix0, iy0, ix1, G, '#1a0a1a', 0);
      for (let x = ix0 + 2; x < ix1 - 6; x += 9) { P.block(x, G - 30, x + 7, G, rp(['#c83a8a', '#3a8ac8', '#e8b030'][(x >> 3) % 3], 6), { base: 0.45 }); kFill(P, x + 1, G - 27, x + 6, G - 19, ['#ff9ad8', '#9af0ff', '#fff0a0'][(x >> 3) % 3], 0.8); }
      for (let x = x0; x < x1; x += 3) { P.put(x, G - h + 1, (x / 3) % 2 ? [255, 220, 120] : [255, 120, 200], 1); P.put(x, G - h + 2, (x / 3) % 2 ? [255, 120, 200] : [255, 220, 120], 1); }
    } else if (kind === 'pawn' || kind === 'junkshop') { // barred window, stuff piled
      kFill(P, ix0, iy0, ix1, G, mixRgb(c, [12, 10, 8], 0.8), 0.15);
      kShelves(P, ix0 + 2, iy0 + 3, ix1 - 2, G - 4, ['#c8c8d0', '#a87a3a', '#3a3a3a', '#8a3a3a', '#3af0e0'], { back: '#120e0c', seed });
      for (let x = ix0 + 1; x < ix1; x += 4) for (let y = iy0; y < G; y++) P.put(x, y, [26, 24, 26]);
    } else if (kind === 'tea' || kind === 'bakery' || kind === 'flowers') { // warm, open, wooden
      P.area(ix0, iy0, ix1, G, MAT.wood, (x, y) => 0.4 + ((y - iy0) % 6 === 0 ? -0.15 : 0));
      kFill(P, ix0 + 4, iy0 + 4, ix1 - 4, G - 12, mixRgb(c, [40, 30, 20], 0.45), 0.35);
      if (kind === 'flowers') for (let k = 0; k < (ix1 - ix0) * 0.8; k++) P.put(ix0 + hash(k, 1, seed) * (ix1 - ix0), G - 4 - hash(k, 2, seed) * 14, col3(['#ff6a8a', '#ffd040', '#e8e8ff', '#c85aff', '#ff8a3a'][k % 5]));
      else kShelves(P, ix0 + 6, iy0 + 6, ix1 - 6, G - 14, kind === 'bakery' ? ['#d8a858', '#c88a3a', '#f0d8a0'] : ['#3a6a3a', '#8a5a2a', '#c8c0a0'], { back: mixRgb(c, [30, 20, 14], 0.6), seed });
      P.block(ix0, G - 12, ix1, G, MAT.wood, { base: 0.5 });
    } else if (kind === 'bar' || kind === 'club') { // dark, a lit door, a bouncer's light
      kFill(P, ix0, iy0, ix1, G, '#0a060c');
      P.block(mid - 9, G - 30, mid + 9, G, KMAT.blackglass, { base: 0.4 }); kFill(P, mid - 7, G - 28, mid + 7, G, mixRgb(c, [10, 0, 10], 0.6), 0.45);
      for (let x = ix0 + 2; x < ix1 - 2; x++) if (Math.abs(x - mid) > 11) P.put(x, iy0 + 6, c, 1);
    } else if (kind === 'temple') { // red doors with gold studs
      P.area(ix0, iy0, ix1, G, KMAT.lacquer, (x, y) => 0.45 + ((x - ix0) % 14 === 0 ? -0.25 : 0));
      for (let y = iy0 + 6; y < G - 4; y += 6) for (let x = ix0 + 4; x < ix1 - 2; x += 5) P.put(x, y, tone(KMAT.gold, 0.8));
    } else { // a plain door in a plain wall
      P.area(ix0, iy0, ix1, G, MAT.concreteD, () => 0.4);
      P.block(mid - 8, G - 30, mid + 8, G, rp(col || '#4a3a3a', 6), { base: 0.45 });
    }
  });
  // signs and lights
  if (o.sign !== false && kind !== 'shutter') L.sign(Math.round(mid - (o.signN || 5) * 2 - 1), G - h - 11, o.signN || 5, col || '#ffd040', { r: 50, seed });
  if (kind === 'pharmacy' || kind === 'clinic' || kind === 'dental' || kind === 'vet') { const cc = kind === 'pharmacy' ? '#3aff80' : kind === 'clinic' ? '#ff3a4a' : '#e8f4ff'; L.paint(x1 - 14, G - h - 22, x1 - 2, G - h - 8, (P) => { kFill(P, x1 - 14, G - h - 22, x1 - 2, G - h - 8, '#0a0e10'); kCross(P, x1 - 8, G - h - 15, 4, cc); }); L.light(x1 - 8, G - h - 15, 50, cc, 0.7); }
  if (kind !== 'shutter') L.light(mid, G - h / 2, Math.max(50, w * 0.8), kind === 'clinic' || kind === 'dental' || kind === 'vet' ? [0.7, 0.85, 0.95] : c.map((q) => Math.min(1, q / 255 * 0.7 + 0.3)), kind === 'bar' || kind === 'club' ? 0.6 : 0.75);
}

// ---- buildings ------------------------------------------------------------------
// A shophouse: shops on the ground, people above. o.floors, o.fh (floor
// height), o.wall (material), o.shops ([[kind, colour], ...] across the
// front), o.roof ('flat', 'tank', 'garden', 'tin', 'tile', 'shack'), o.balcony,
// o.blade (a hanging sign's colour), o.ac.
function bShophouse(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0 * 7 + 3, r = new Rng(seed), fl = o.floors || 3, fh = o.fh || 34, gh = o.gh || 42, top = G - gh - fl * fh, wall = o.wall || r.pick([KMAT.stucco, KMAT.cream, KMAT.teal, KMAT.pink, MAT.concrete, KMAT.mint]), w = x1 - x0;
  L.paint(x0 - 12, top - 40, x1 + 12, G - gh + 2, (P) => {
    P.block(x0, top, x1, G - gh, wall, { base: 0.42, drips: 0.12, dripLen: 22, seed });
    // floor by floor: a band, windows, sometimes a balcony across, AC units
    for (let f = 0; f < fl; f++) {
      const fy = G - gh - (f + 1) * fh, wy = fy + 8, n = Math.max(1, Math.round(w / 26)), sp = w / n;
      P.block(x0 - 1, fy + fh - 3, x1 + 1, fy + fh, wall, { base: 0.55, lip: 0.8 });
      for (let i = 0; i < n; i++) {
        const wx = Math.round(x0 + sp * i + sp / 2 - 7), lit = hash(i, f, seed) < (o.lit || 0.55);
        kWin(P, wx, wy, 14, 15, { lit: lit ? ['#ffd890', '#ffe8c0', '#a0f0ff', '#ff90c0', '#ffc070'][Math.floor(hash(i, f, seed + 1) * 5)] : null, blinds: hash(i, f, seed + 2) < 0.4, curtain: hash(i, f, seed + 3) < 0.3 ? ['#8a3a3a', '#3a5a8a', '#8a7a3a'][i % 3] : null, figure: hash(i, f, seed + 4) < 0.12, bars: o.bars && f === 0 });
        if (o.ac !== false && hash(i, f, seed + 5) < 0.45) kAC(P, wx + (hash(i, f, seed + 6) < 0.5 ? -3 : 7), wy + 17);
      }
      if (o.balcony !== false && (o.balcony === 'all' || hash(f, 9, seed) < 0.45)) kBalcony(P, x0 + 2, x1 - 2, fy + fh - 4, { seed: seed + f, ramp: wall, solid: hash(f, 3, seed) < 0.3 });
      else if (hash(f, 11, seed) < 0.5) laundry(P, x0 + 4, fy + 6, x1 - 4, fy + 4, seed + f);
    }
    kDrain(P, x1 - 4, top, G - gh);
    // the roof
    const rf = o.roof || r.pick(['flat', 'tank', 'garden', 'tin', 'shack']);
    P.block(x0 - 2, top - 4, x1 + 2, top, wall, { base: 0.6 });
    if (rf === 'tank') { const tx = x0 + Math.round(w * (0.2 + r.f() * 0.4)); P.block(tx, top - 26, tx + 22, top - 8, MAT.wood, { base: 0.4, bands: 4 }); for (const lx of [tx + 2, tx + 18]) P.block(lx, top - 8, lx + 2, top, MAT.steelD, { base: 0.3, lip: 0 }); P.area(tx + 1, top - 30, tx + 21, top - 26, MAT.wood, () => 0.55, { inside: (x, y) => y > top - 30 + Math.abs(x - tx - 11) * 0.35 }); }
    if (rf === 'garden') { for (let k = 0; k < Math.round(w / 12); k++) { const gx = x0 + 6 + k * 12; P.block(gx, top - 5, gx + 8, top, KMAT.terracotta, { base: 0.5 }); for (let q = 0; q < 10; q++) P.put(gx + hash(q, 1, gx) * 9, top - 6 - hash(q, 2, gx) * 7, tone(KMAT.leaf, 0.3 + hash(q, 3, gx) * 0.6)); } railing(P, x0, x1, top - 4, MAT.steel, { h: 6 }); }
    if (rf === 'tin') { P.area(x0 - 4, top - 14, x1 + 4, top, MAT.rust, (x, y) => 0.5 + ((x - x0) % 3 === 0 ? 0.15 : 0) - (y - top + 14) / 30, { inside: (x, y) => y > top - 14 + (x - x0 + 4) / (w + 8) * 10 }); }
    if (rf === 'tile') kRoof(P, x0, x1, top, Math.min(22, w * 0.18), KMAT.kawara, { over: 6, inset: Math.min(22, w * 0.18) * 1.6 });
    if (rf === 'shack') { const sx = x0 + Math.round(w * 0.3); P.area(sx, top - 24, sx + 30, top, KMAT.corrBlue, (x, y) => 0.45 + ((x - sx) % 3 === 0 ? 0.12 : 0)); kWin(P, sx + 5, top - 18, 8, 7, { lit: hash(sx, 1, 1) < 0.6 ? '#ffd890' : null }); for (let y = top - 40; y < top - 24; y++) P.put(sx + 24, y, tone(MAT.steel, 0.5)); }
    if (rf !== 'garden' && r.f() < 0.6) { const ax = x0 + Math.round(w * r.f()); for (let y = top - 22; y < top - 4; y++) P.put(ax, y, tone(MAT.steel, 0.55)); kH(P, ax - 4, ax + 5, top - 16, tone(MAT.steel, 0.5)); }
    if (r.f() < 0.4) { const dx = x0 + Math.round(w * 0.75); P.area(dx - 5, top - 14, dx + 5, top - 4, MAT.chrome, (x, y) => 0.7 - Math.hypot(x - dx, y - top + 9) / 8, { inside: (x, y) => Math.hypot(x - dx, y - top + 9) < 5 }); }
  });
  // the shops along the bottom
  const shops = o.shops || [[r.pick(['glass', 'counter', 'noren', 'pawn', 'tea']), r.pick(['#ff4ab0', '#3af0e0', '#ffd040', '#ff8a3a'])]];
  const sw = w / shops.length; shops.forEach(([kind, col], i) => kShop(L, Math.round(x0 + i * sw), Math.round(x0 + (i + 1) * sw), G, kind, col, { h: gh, seed: seed + i, signN: Math.max(3, Math.min(7, Math.round(sw / 10))) }));
  if (o.awning) L.paint(x0, G - gh - 2, x1, G - gh + 12, (P) => kAwning(P, x0 + 2, x1 - 2, G - gh + 1, o.awning, { stripe: o.stripe }));
  if (o.blade) L.sign(o.bladeLeft ? x0 - 9 : x1 + 2, top + 12, Math.min(9, Math.round(fl * fh / 8)), o.blade, { vert: true, r: 70, seed });
  return { top, x0, x1 };
}
// A capsule tower: two concrete cores with boxes plugged into them, each a
// room with one round window, stacked at odd angles up into the dark
function bCapsules(L, x0, x1, G, o = {}) {
  const seed = o.seed || 77, h = o.h || 300, top = G - h, w = x1 - x0, cores = [x0 + Math.round(w * 0.28), x0 + Math.round(w * 0.68)];
  L.paint(x0 - 30, top - 30, x1 + 30, G, (P) => {
    // the cores: lift shafts with slit windows, stairs lit at night
    for (const cx of cores) { P.block(cx - 12, top, cx + 12, G - 30, KMAT.concreteL, { base: 0.42, panels: [24, 16], drips: 0.1, dripLen: 30 }); for (let y = top + 8; y < G - 40; y += 16) kFill(P, cx - 2, y, cx + 2, y + 8, hash(cx, y, seed) < 0.5 ? '#ffe0a0' : '#1a1e24', hash(cx, y, seed) < 0.5 ? 0.4 : 0); P.block(cx - 14, top - 10, cx + 14, top, KMAT.concreteL, { base: 0.55 }); for (let y = top - 22; y < top - 10; y++) P.put(cx + 6, y, tone(MAT.steel, 0.5)); P.put(cx + 6, top - 23, [255, 50, 60], 1); }
    // the capsules: each fixed to a core, sticking out one side or the other
    let k = 0;
    for (const cx of cores) for (let y = top + 6; y < G - 66; y += 27) for (const side of [-1, 1]) {
      k++; if (hash(k, y, seed) < 0.12) continue;
      const off = Math.round(hash(k, 2, seed) * 8), bw = 30, bh = 24, bx = side < 0 ? cx - 12 - bw + 6 - off : cx + 12 - 6 + off, by = y + Math.round(hash(k, 3, seed) * 4);
      P.block(bx, by, bx + bw, by + bh, KMAT.whitepanel, { base: 0.62 - hash(k, 4, seed) * 0.14, panels: [10, 24], drips: 0.25, dripLen: 10 });
      const lit = hash(k, 5, seed) < 0.5; kPort(P, bx + bw / 2, by + bh / 2, 6, lit ? ['#ffd890', '#ffe8c0', '#a0f0ff', '#ffb0d0'][k % 4] : null);
      if (lit && hash(k, 6, seed) < 0.3) { P.put(bx + bw / 2 - 2, by + bh / 2, [20, 14, 18]); P.put(bx + bw / 2 - 2, by + bh / 2 + 1, [20, 14, 18]); }
      for (let i = 0; i < 4; i++) P.put(bx + 3 + i * 2, by + bh - 3, [30, 30, 34]);
      if (hash(k, 7, seed) < 0.2) kAC(P, bx + (side < 0 ? 2 : bw - 12), by + bh + 1, { drip: 6 });
    }
    // the base: pilotis, a dim lobby
    P.block(x0 + 10, G - 30, x1 - 10, G - 26, KMAT.concreteL, { base: 0.5 });
    for (let x = x0 + 14; x < x1 - 14; x += 22) P.block(x, G - 26, x + 5, G, KMAT.concreteL, { base: 0.45, lip: 0 });
    kFill(P, x0 + 20, G - 24, x1 - 20, G, '#0c0e12'); kFill(P, cores[0] - 10, G - 22, cores[0] + 10, G, '#ffe8c0', 0.25);
  });
  L.light(cores[0], G - 14, 50, [1, 0.85, 0.6], 0.6);
  if (o.sign) L.sign(x1 - 20, top + 30, 8, o.sign, { vert: true, r: 70, seed });
  return { top };
}
// A machiya: a narrow wooden townhouse, two floors: a lattice front, a
// curtain over the door, a little tiled roof between floors, the main roof
function bMachiya(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0, w = x1 - x0, g1 = G - 40, g2 = g1 - 32, wood = o.wood || KMAT.darkwood, pl = KMAT.plaster;
  L.paint(x0 - 10, g2 - 30, x1 + 10, G, (P) => {
    // the upper floor: plaster with slatted windows (mushiko)
    P.block(x0 + 2, g2, x1 - 2, g1, pl, { base: 0.46, drips: 0.1, dripLen: 10 });
    for (let x = x0 + 8; x < x1 - 18; x += 22) { kFill(P, x, g2 + 10, x + 14, g2 + 22, '#1a1410'); for (let i = 0; i < 14; i += 3) for (let j = 0; j < 12; j++) P.put(x + i, g2 + 10 + j, tone(pl, 0.6)); if (hash(x, 1, seed) < 0.5) for (let i = 1; i < 14; i += 3) for (let j = 0; j < 12; j++) P.put(x + i, g2 + 10 + j, [255, 200, 130], 0.3); }
    for (const px of [x0 + 2, x1 - 6]) P.block(px, g2, px + 4, G, wood, { base: 0.5, lip: 0 });
    // the main roof and the little roof between floors
    kRoof(P, x0, x1, g2, 16, o.roof || KMAT.kawara, { over: 7, inset: 8 });
    kRoof(P, x0, x1, g1, 6, o.roof || KMAT.kawara, { over: 6, inset: 1 });
    // the ground floor: the lattice, the door with its curtain
    const dx = o.doorLeft ? x0 + 8 : x1 - 30;
    kLattice(P, x0 + 6, g1 + 4, x1 - 6, G, wood, { lit: o.lit === false ? null : '#ffb060' });
    kFill(P, dx, g1 + 8, dx + 22, G, '#2a1608', 0.2); kFill(P, dx + 2, g1 + 10, dx + 20, G, '#c87a3a', 0.35);
    kNoren(P, dx, dx + 22, g1 + 6, 14, o.noren || '#1a2a4a', { glyph: seed });
    P.block(x0 + 4, G - 3, x1 - 4, G, KMAT.stone, { base: 0.5 });
  });
  if (o.lantern !== false) L.paint(x0, g1, x0 + 14, g1 + 16, (P) => kLantern(P, x0 + 8, g1 + 4, o.lantern || '#ff5030', { r: 3, h: 7 }));
  L.light(o.doorLeft ? x0 + 19 : x1 - 19, G - 16, 50, [1, 0.65, 0.35], 0.75);
  if (o.lantern !== false) L.light(x0 + 8, g1 + 8, 30, [1, 0.45, 0.25], 0.6, 1, { mode: 'fire', seed: x0 });
}
// A temple hall on a stone base: red pillars, lattice doors, a great curved
// roof with gold at the ridge; o.steps paints the stairs up the front
function bTemple(L, x0, x1, G, o = {}) {
  const w = x1 - x0, base = o.base || 12, wall = G - base, h = o.h || 56, ey = wall - h, rh = o.roofH || Math.round(w * 0.22), lac = o.lac || KMAT.lacquer;
  L.paint(x0 - 30, ey - rh - 30, x1 + 30, G, (P) => {
    P.block(x0 - 8, wall, x1 + 8, G, KMAT.stone, { base: 0.45, panels: [16, 6] });
    if (o.steps !== false) kSteps(P, Math.round((x0 + x1) / 2) - 30, Math.round((x0 + x1) / 2) + 30, G, base, KMAT.stone);
    // the hall: dark wood walls, red pillars, lit lattice doors
    P.block(x0 + 4, ey + 8, x1 - 4, wall, KMAT.darkwood, { base: 0.36 });
    const n = Math.max(3, Math.round(w / 34)), sp = (w - 8) / n;
    for (let i = 0; i <= n; i++) { const px = Math.round(x0 + 4 + i * sp) - 3; P.block(px, ey + 6, px + 6, wall, lac, { base: 0.52, lip: 0 }); }
    for (let i = 0; i < n; i++) { const a = Math.round(x0 + 4 + i * sp) + 5, b = Math.round(x0 + 4 + (i + 1) * sp) - 5; kLattice(P, a, ey + 16, b, wall, KMAT.darkwood, { step: 3, lit: o.lit === false ? null : '#ffb050' }); }
    // the bracket band under the eave, then the roof, lifted at its corners
    P.block(x0, ey + 2, x1, ey + 8, lac, { base: 0.4, bands: 3 });
    for (let x = x0 + 4; x < x1 - 4; x += 8) { P.put(x, ey + 5, tone(KMAT.gold, 0.8)); }
    kRoof(P, x0, x1, ey + 2, rh, o.roof || KMAT.kawara, { over: 18, inset: rh * 1.3, curve: 8, ornament: '#e8b030' });
    if (o.double) kRoof(P, x0 + w * 0.22, x1 - w * 0.22, ey + 2 - rh + 4, Math.round(rh * 0.7), o.roof || KMAT.kawara, { over: 12, inset: rh, curve: 6, ornament: '#e8b030' });
    // a plaque over the doors
    P.block((x0 + x1) / 2 - 14, ey + 10, (x0 + x1) / 2 + 14, ey + 18, KMAT.darkwood, { base: 0.3 }); for (let i = 0; i < 4; i++) for (const [a, b] of GLYPHS[(i * 7 + x0) % GLYPHS.length]) P.put((x0 + x1) / 2 - 11 + i * 6 + a, ey + 11 + b, tone(KMAT.gold, 0.85), 0.3);
  });
  for (let x = x0 + 20; x < x1 - 10; x += 50) { L.paint(x - 4, ey + 6, x + 4, ey + 20, (P) => kLantern(P, x, ey + 10, '#ff3a2a', { r: 3, h: 7 })); L.light(x, ey + 14, 40, [1, 0.4, 0.2], 0.6, 1, { mode: 'fire', seed: x }); }
  L.light((x0 + x1) / 2, wall - 20, w * 0.6, [1, 0.62, 0.3], 0.7);
  return { ey, wall };
}
// A pagoda: storeys of roofs getting smaller, a spire with rings on top
function bPagoda(L, cx, G, o = {}) {
  const n = o.tiers || 5, w0 = o.w || 60, th = o.th || 30, lac = o.lac || KMAT.lacquer;
  const topY = G - 14 - n * th - 40;
  L.paint(cx - w0 / 2 - 30, topY - 10, cx + w0 / 2 + 30, G, (P) => {
    P.block(cx - w0 / 2 - 6, G - 14, cx + w0 / 2 + 6, G, KMAT.stone, { base: 0.45, panels: [14, 7] });
    for (let i = 0; i < n; i++) {
      const w = w0 * (1 - i * 0.12), y1 = G - 14 - i * th, y0 = y1 - th + 8;
      P.block(cx - w / 2 + 4, y0, cx + w / 2 - 4, y1, KMAT.darkwood, { base: 0.36 });
      for (const px of [cx - w / 2 + 4, cx + w / 2 - 8, cx - 2]) P.block(px, y0, px + 4, y1, lac, { base: 0.5, lip: 0 });
      kLattice(P, cx - w / 4, y0 + 6, cx - 3, y1, KMAT.darkwood, { lit: hash(i, 1, cx) < 0.6 ? '#ffb050' : null }); kLattice(P, cx + 3, y0 + 6, cx + w / 4, y1, KMAT.darkwood, { lit: hash(i, 2, cx) < 0.6 ? '#ffb050' : null });
      kRoof(P, cx - w / 2 + 4, cx + w / 2 - 4, y0, 9, o.roof || KMAT.kawara, { over: 12, inset: 10, curve: 5 });
    }
    // the spire
    const sy = G - 14 - n * th + 8; for (let y = topY; y < sy; y++) { P.put(cx, y, tone(KMAT.gold, 0.7)); P.put(cx + 1, y, tone(KMAT.gold, 0.4)); }
    for (let k = 0; k < 6; k++) kH(P, cx - 3, cx + 5, sy - 6 - k * 5, tone(KMAT.gold, 0.8));
    P.put(cx, topY - 1, [255, 220, 120], 1);
  });
  for (let i = 0; i < n; i++) { const y = G - 14 - i * th - 4; for (const s of [-1, 1]) L.paint(cx + s * w0 * (0.5 - i * 0.06) - 4, y - 24, cx + s * w0 * (0.5 - i * 0.06) + 4, y - 10, (P) => kLantern(P, Math.round(cx + s * w0 * (0.5 - i * 0.06)), y - 20, '#ff4a2a', { r: 2, h: 5 })); }
  L.light(cx, G - 40, 80, [1, 0.6, 0.3], 0.6);
}
// A glass tower: a tall lit lobby, a curtain wall of glass in frames, light
// strips up its edges, a slanted crown; o.panel for white metal bands
function bGlass(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0, h = o.h || 320, top = G - h, w = x1 - x0, edge = col3(o.edge || '#3af0e0'), crown = o.crown || 'slant';
  L.paint(x0 - 10, top - 60, x1 + 10, G, (P) => {
    // the curtain wall
    glassWall(P, x0, top, x1, G - 48, { lit: o.lit === undefined ? 0.4 : o.lit, seed, mw: o.mw || 12, mh: o.mh || 14, ramp: o.glass || MAT.glassC, pal: o.pal });
    if (o.panel) for (let y = top + 20; y < G - 60; y += o.panel) P.block(x0, y, x1, y + 5, KMAT.whitepanel, { base: 0.55 });
    if (o.fins) for (let x = x0 + 6; x < x1 - 4; x += o.fins) P.block(x, top, x + 2, G - 48, KMAT.whitepanel, { base: 0.6, lip: 0 });
    // the crown: slanted glass, a stepped top, or a ring
    if (crown === 'slant') P.area(x0, top - 50, x1, top, o.glass || MAT.glassC, (x, y) => 0.45 + ((x + y) % 9 === 0 ? 0.2 : 0) - (top - y) / 120, { inside: (x, y) => y >= top - 50 * (x - x0) / w });
    if (crown === 'step') { P.block(x0 + w * 0.15, top - 30, x1 - w * 0.15, top, KMAT.whitepanel, { base: 0.5, panels: [10, 10] }); P.block(x0 + w * 0.32, top - 50, x1 - w * 0.32, top - 30, KMAT.whitepanel, { base: 0.55 }); for (let y = top - 70; y < top - 50; y++) P.put(Math.round((x0 + x1) / 2), y, tone(MAT.steel, 0.6)); P.put(Math.round((x0 + x1) / 2), top - 71, [255, 50, 60], 1); }
    if (crown === 'ring') { for (let a = 0; a < Math.PI * 2; a += 0.01) { const x = (x0 + x1) / 2 + Math.cos(a) * w * 0.4, y = top - 22 + Math.sin(a) * 8; P.put(x, y, a > Math.PI ? edge : mixRgb(edge, [0, 0, 0], 0.5), a > Math.PI ? 1 : 0.4); } }
    // light strips up the corners
    for (let y = top; y < G - 48; y++) { P.put(x0, y, edge, 0.9); P.put(x1 - 1, y, mixRgb(edge, [0, 0, 0], 0.4), 0.6); }
    // the lobby: a canopy, tall glass, people's light inside
    P.block(x0 - 6, G - 52, x1 + 6, G - 47, KMAT.whitepanel, { base: 0.62 });
    for (let x = x0 + 2; x < x1 - 2; x++) for (let y = G - 47; y < G; y++) { const t = (y - G + 47) / 47; P.put(x, y, (x - x0) % 16 < 1 ? [30, 38, 48] : mixRgb([150, 175, 200], [60, 72, 90], t + (hash(x >> 3, 1, seed) - 0.5) * 0.3), (x - x0) % 16 < 1 ? 0 : 0.08); }
    for (let x = x0 + 8; x < x1 - 8; x += 22) { kFill(P, x, G - 20, x + 10, G - 12, '#2a3a48'); kFill(P, x + 2, G - 36, x + 8, G - 33, '#e8f0ff', 0.5); }
    P.block(Math.round((x0 + x1) / 2) - 12, G - 30, Math.round((x0 + x1) / 2) + 12, G, KMAT.blackglass, { base: 0.35 });
  });
  L.light((x0 + x1) / 2, G - 26, w * 0.7, [0.75, 0.85, 1], 0.55);
  if (o.logo) L.sign(Math.round((x0 + x1) / 2) - 13, G - 64, 6, o.logo, { r: 70, seed });
  return { top };
}
// A stack of shacks: an old two-floor block with whatever people could find
// built on top of it, box on box, corrugated, tarped, plywood, a container
function bStack(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0 * 3, r = new Rng(seed), w = x1 - x0, base = G - 76, levels = o.levels || 4, mats = [MAT.rust, KMAT.corrBlue, KMAT.plywood, KMAT.tarp, KMAT.corrGreen, KMAT.tarpR, MAT.steelD];
  const boxes = []; let y = base;
  for (let k = 0; k < levels; k++) { const bh = r.i(22, 32), cnt = r.i(1, 3); let bx = x0 + r.i(-16, 20); for (let q = 0; q < cnt && bx < x1 - 20; q++) { const bw = r.i(28, 56); boxes.push({ x: bx, y: y - bh, w: Math.min(bw, x1 + 20 - bx), h: bh, m: r.pick(mats), s: r.i(1, 1e5) }); bx += bw + r.i(-6, 10); } y -= bh; }
  L.paint(x0 - 40, y - 30, x1 + 40, G, (P) => {
    // the old block under it all: brick, barred windows, a stair up its side
    P.block(x0, base, x1, G - 42, MAT.brickD, { base: 0.38, drips: 0.2, dripLen: 20, seed });
    for (let x = x0 + 8; x < x1 - 14; x += 24) kWin(P, x, base + 8, 12, 14, { lit: hash(x, 2, seed) < 0.5 ? '#ffc880' : null, bars: true });
    for (const b of boxes) {
      const corr = b.m === MAT.rust || b.m === KMAT.corrBlue || b.m === KMAT.corrGreen;
      if (corr) corrugated(P, b.x, b.y, b.x + b.w, b.y + b.h, b.m); else P.block(b.x, b.y, b.x + b.w, b.y + b.h, b.m, { base: 0.42, panels: b.m === KMAT.plywood ? [12, 40] : undefined, drips: 0.2, dripLen: 8 });
      // a window or two, a door, things hung off it
      for (let wx = b.x + 5; wx < b.x + b.w - 10; wx += 18) if (hash(wx, b.y, b.s) < 0.7) kWin(P, wx, b.y + 6, 8, 8, { lit: hash(wx, b.y, b.s + 1) < 0.55 ? ['#ffd890', '#a0f0ff', '#ff90c0', '#ffc070'][Math.floor(hash(wx, 3, b.s) * 4)] : null, cross: false });
      kH(P, b.x - 2, b.x + b.w + 2, b.y, tone(MAT.steel, 0.65)); kH(P, b.x - 2, b.x + b.w + 2, b.y + 1, tone(MAT.steelD, 0.3));
      if (hash(b.x, b.y, 5) < 0.35) { for (let j = 0; j < 9; j++) P.put(b.x + b.w - 6, b.y - 9 + j, tone(MAT.steel, 0.5)); P.area(b.x + b.w - 11, b.y - 15, b.x + b.w - 1, b.y - 7, MAT.chrome, (x, yy) => 0.7 - Math.hypot(x - b.x - b.w + 6, yy - b.y + 11) / 7, { inside: (x, yy) => Math.hypot(x - b.x - b.w + 6, yy - b.y + 11) < 5 }); }
      if (hash(b.x, b.y, 6) < 0.3) P.put(b.x + 3, b.y + 3, [255, 230, 160], 1);
    }
    // cables everywhere, a ladder, washing
    for (let k = 0; k < 6; k++) cable(P, x0 - 30 + r.i(0, 40), y + r.i(0, base - y), x1 + 30 - r.i(0, 40), y + r.i(0, base - y), r.i(4, 20), '#0a0a0c');
    for (let ly = base; ly > y + 10; ly -= 4) { P.put(x1 - 8, ly, tone(MAT.steel, 0.6)); P.put(x1 - 3, ly, tone(MAT.steel, 0.4)); }
    laundry(P, x0 + 6, base - 4, x1 - 6, base - 8, seed);
  });
  kShop(L, x0, x1, G, o.shop || 'junkshop', o.shopCol || '#ffb040', { h: 42, seed });
  for (const b of boxes) if (hash(b.x, b.y, 6) < 0.3) L.light(b.x + 3, b.y + 3, 30, [1, 0.85, 0.6], 0.4);
  if (o.blade) L.sign(x0 - 8, base - 50, 7, o.blade, { vert: true, r: 60, seed });
  return { top: y };
}
// A slab block (danchi): floors of front doors along open galleries, a stair
// tower at one end, a number painted big on the end wall
function bDanchi(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0, fl = o.floors || 6, fh = 30, top = G - fl * fh - 10, w = x1 - x0, wall = o.wall || KMAT.concreteL;
  L.paint(x0 - 4, top - 20, x1 + 4, G, (P) => {
    P.block(x0, top, x1, G, wall, { base: 0.4, drips: 0.22, dripLen: 40, seed });
    for (let f = 0; f < fl; f++) {
      const gy = G - f * fh - 2;
      for (let x = x0 + 30; x < x1 - 14; x += 26) { const lit = hash(x, f, seed) < 0.55; P.block(x, gy - 24, x + 12, gy, rp(['#5a4a3a', '#3a4a5a', '#4a3a4a', '#6a5a3a'][Math.floor(hash(x, f, seed + 2) * 4)], 6), { base: 0.42 }); kWin(P, x + 14, gy - 20, 8, 9, { lit: lit ? '#ffd8a0' : null, cross: false }); P.put(x + 10, gy - 12, [200, 200, 200]); if (lit) P.put(x + 6, gy - 26, [255, 230, 170], 0.8); }
      if (f > 0) { slab(P, x0, x1, gy, 3, wall); railing(P, x0 + 24, x1, gy, wall, { h: 8, step: 2 }); for (let x = x0 + 24; x < x1; x++) for (let j = 1; j < 8; j++) if (hash(x >> 2, f, seed) < 0.15) P.put(x, gy - j, tone(rp(['#a83a3a', '#3a6aa8', '#d8d0b0'][Math.floor(hash(x >> 2, f, seed + 1) * 3)], 5), 0.6)); }
    }
    // the stair tower, and the number
    P.block(x0, top - 10, x0 + 22, G, wall, { base: 0.5, panels: [22, 12] }); for (let y = top; y < G - 10; y += 12) kFill(P, x0 + 6, y + 3, x0 + 16, y + 9, hash(y, 3, seed) < 0.6 ? '#e8f0d0' : '#1a1e20', hash(y, 3, seed) < 0.6 ? 0.3 : 0);
    const num = String(o.number || 7), nx = x1 - 20; for (let i = 0; i < num.length; i++) for (const [a, b] of GLYPHS[(num.charCodeAt(i) * 3) % GLYPHS.length]) kFill(P, nx + i * 10 + a * 3, top + 10 + b * 3, nx + i * 10 + a * 3 + 3, top + 13 + b * 3, '#d8c8a0');
  });
  for (let f = 1; f < fl; f++) if (hash(f, 1, seed) < 0.6) L.tube(x0 + 30 + Math.round(hash(f, 2, seed) * (w - 60)), G - f * fh - 26, 10, '#e8f4e8', 0.45);
  return { top };
}
// A theatre: a marquee of chasing bulbs, posters in lit frames, a tall sign
// up the front, a ticket window, doors
function bTheater(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0, w = x1 - x0, top = G - (o.h || 150), c = col3(o.col || '#ffd040'), mid = Math.round((x0 + x1) / 2);
  L.paint(x0 - 10, top - 20, x1 + 10, G, (P) => {
    P.block(x0, top, x1, G, o.wall || MAT.brickD, { base: 0.4, panels: [24, 30], seed });
    // an ornate cornice, arched windows above the marquee
    P.block(x0 - 4, top - 6, x1 + 4, top + 2, KMAT.cream, { base: 0.55, bands: 2 }); for (let x = x0; x < x1; x += 6) P.put(x, top + 4, tone(KMAT.cream, 0.7));
    for (let x = x0 + 14; x < x1 - 20; x += 26) { kFill(P, x, top + 22, x + 12, top + 50, '#1a0e10'); P.area(x, top + 16, x + 12, top + 24, KMAT.cream, () => 0.5, { inside: (xx, yy) => Math.hypot(xx - x - 6, yy - top - 22) < 7 && Math.hypot(xx - x - 6, yy - top - 22) > 5 }); if (hash(x, 1, seed) < 0.5) kFill(P, x + 1, top + 24, x + 11, top + 50, '#ffb070', 0.3); }
    // the marquee
    const my = G - 64; P.block(x0 - 8, my, x1 + 8, my + 18, KMAT.blackglass, { base: 0.4 });
    for (let x = x0 - 8; x < x1 + 8; x += 2) { P.put(x, my, ((x >> 1) % 3) ? c : [255, 255, 255], 1); P.put(x, my + 17, ((x >> 1) % 3) ? [255, 255, 255] : c, 1); }
    for (let i = 0; i < Math.floor(w / 9); i++) for (const [a, b] of GLYPHS[(i + seed) % GLYPHS.length]) P.put(x0 + 4 + i * 8 + a, my + 6 + b, [255, 240, 220], 1);
    // posters, a ticket window, doors
    for (const px of [x0 + 8, x1 - 30]) { P.block(px - 2, G - 42, px + 22, G - 8, KMAT.gold, { base: 0.5 }); P.area(px, G - 40, px + 20, G - 10, rp(['#c83a5a', '#3a5ac8', '#e8a030'][px % 3], 6), (x, y) => 0.4 + noise(x / 4, y / 6, px) * 0.5); for (const [a, b] of GLYPHS[px % GLYPHS.length]) P.put(px + 9 + a, G - 34 + b, [255, 255, 255], 0.5); }
    P.block(mid - 30, G - 44, mid + 30, G, KMAT.darkwood, { base: 0.35 }); kFill(P, mid - 26, G - 40, mid - 8, G, '#ffcf90', 0.35); kFill(P, mid + 8, G - 40, mid + 26, G, '#ffcf90', 0.35); P.block(mid - 6, G - 30, mid + 6, G - 14, KMAT.gold, { base: 0.5 }); kFill(P, mid - 4, G - 28, mid + 4, G - 20, '#2a1a0a');
    kFill(P, mid - 26, G - 2, mid + 26, G, '#8a1a1a');
  });
  L.sign(x0 + 6, top + 60, 10, o.col || '#ffd040', { vert: true, r: 80, seed });
  L.light(mid, G - 56, w, c.map((q) => q / 255), 0.9); L.light(mid, G - 20, 60, [1, 0.8, 0.55], 0.7);
}
// A bathhouse: a wooden house with a curtain marked for the bath, a chimney
function bBath(L, x0, x1, G, o = {}) {
  const w = x1 - x0, ey = G - 58, cx = x1 - 26;
  L.paint(x0 - 12, G - 220, x1 + 12, G, (P) => {
    P.block(cx, G - 210, cx + 14, ey - 10, MAT.brick, { base: 0.42, bands: 6 }); for (let y = G - 210; y < G - 206; y++) for (let x = cx - 1; x < cx + 15; x++) P.put(x, y, tone(MAT.brick, 0.75));
    P.block(x0 + 4, ey, x1 - 4, G, KMAT.plaster, { base: 0.48 });
    kRoof(P, x0, x1, ey, 26, KMAT.kawara, { over: 10, inset: 30, curve: 5 });
    kLattice(P, x0 + 10, ey + 14, x0 + w * 0.35, G - 10, KMAT.darkwood, { lit: '#ffc070' });
    kFill(P, x0 + w * 0.42, ey + 18, x1 - 14, G, '#3a2410', 0.2); kFill(P, x0 + w * 0.44, ey + 20, x1 - 16, G, '#e8b070', 0.35);
    kNoren(P, Math.round(x0 + w * 0.42), x1 - 14, ey + 14, 18, '#2a3a8a', { glyph: 11 });
    P.block(x0 + 4, G - 3, x1 - 4, G, KMAT.stone, { base: 0.5 });
  });
  L.vents.push({ x: cx + 7, y: G - 214, kind: 'steam' });
  L.light(x0 + w * 0.6, G - 20, 70, [1, 0.75, 0.45], 0.8);
}
// A park: grass, a path, trees of a kind, a lamp or two, benches, a pond
function bPark(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0, r = new Rng(seed), trees = o.trees || ['sakura', 'pine', 'street'];
  L.paint(x0, G - 100, x1, G + 4, (P) => {
    kGrass(P, x0, x1, G, { seed });
    if (o.pond) { const px0 = x0 + (x1 - x0) * 0.4, px1 = px0 + 80; for (let x = px0; x < px1; x++) for (let y = G - 2; y < G + 4; y++) P.put(x, y, tone(KMAT.water, 0.35 + (y === G - 2 ? 0.3 : 0) + (noise(x / 9, y, 4) - 0.5) * 0.2)); }
    for (let x = x0 + 30; x < x1 - 20; x += r.i(70, 110)) kTree(P, x, G - 2, r.pick(trees), { h: r.i(50, 80), seed: x });
    if (o.fence !== false) for (let x = x0; x < x1; x += 6) { kV(P, x, G - 8, G, tone(MAT.steelD, 0.5)); } if (o.fence !== false) kH(P, x0, x1, G - 8, tone(MAT.steelD, 0.6));
  });
  if (o.pond) L.wet.push({ y: G - 2, x0: x0 + (x1 - x0) * 0.4, x1: x0 + (x1 - x0) * 0.4 + 80, depth: 10, k: 0.6 });
  for (let x = x0 + 60; x < x1 - 30; x += 150) L.lamp(x, G, 46, '#ffe8c0', 0.8);
  for (let x = x0 + 100; x < x1 - 40; x += 160) L.prop('deco', x, G, { art: () => bench(), id: 'pk' + x });
  if (o.critters !== false) L.critter('cat', x0, x1, G, 1);
}
// A pachinko hall or arcade: a whole front of bulbs and screens
function bArcade(L, x0, x1, G, o = {}) {
  const seed = o.seed || x0, h = o.h || 110, top = G - h, w = x1 - x0, c = col3(o.col || '#ff4ab0');
  L.paint(x0 - 4, top - 10, x1 + 4, G, (P) => {
    P.block(x0, top, x1, G - 40, KMAT.blackglass, { base: 0.3 });
    for (let y = top + 6; y < G - 46; y += 4) for (let x = x0 + 4; x < x1 - 4; x += 4) { const k = Math.floor(hash(x >> 4, y >> 4, seed) * 4); P.put(x, y, [[255, 220, 120], [255, 90, 190], [90, 230, 255], [255, 255, 255]][k], 0.8); }
    for (let k = 0; k < 3; k++) { const bx = x0 + 10 + k * (w - 20) / 3; kFill(P, bx, top + 16, bx + (w - 20) / 3 - 8, top + 40, mixRgb(c, [10, 0, 20], 0.5), 0.6); }
  });
  kShop(L, x0, x1, G, 'pachinko', o.col || '#ff4ab0', { h: 40, seed, signN: 7 });
  L.ad(x0 + 12, top + 50, Math.min(90, w - 24), 22, 'marquee', [o.col || '#ff4ab0', '#ffd040']);
  L.light((x0 + x1) / 2, top + 40, w, c.map((q) => q / 255), 0.8);
}
// a hanging sign of glyphs between two buildings, and a lit gate over a street
function kGate(L, x0, x1, G, h, col, o = {}) {
  L.paint(x0 - 6, G - h - 20, x1 + 6, G, (P) => {
    for (const px of [x0, x1 - 6]) P.block(px, G - h, px + 6, G, o.ramp || KMAT.lacquer, { base: 0.5, lip: 0 });
    kRoof(P, x0, x1, G - h, 10, o.roof || KMAT.kawara, { over: 8, inset: 6, curve: 4, ornament: o.gold === false ? null : '#e8b030' });
    P.block(x0 + 6, G - h + 4, x1 - 6, G - h + 14, KMAT.darkwood, { base: 0.4 });
  });
  L.sign(Math.round((x0 + x1) / 2) - 13, G - h + 5, 6, col, { r: 60 });
  L.paint(x0, G - h + 14, x1, G - h + 30, (P) => kLanterns(P, x0 + 6, x1 - 6, G - h + 16, ['#ff3a2a', '#ffb040'], { sag: 4, step: 12 }));
}

// ---- stalls: each kind of food and trade has its own look --------------------------
// Sprites (lit like props), anchored at the bottom middle. kStall(kind, o)
// gives the art function for L.prop('deco', ...); put the vendor `behind`.
const STALL_KINDS = ['ramen', 'yakitori', 'dumpling', 'fish', 'fruit', 'tea', 'flowers', 'parts', 'med', 'herbs', 'organs', 'masks', 'books', 'skewers', 'robot'];
function kStall(kind, o = {}) { return () => stallArt(kind, o); }
function stallArt(kind, o = {}) {
  const W = 64, H = 48, S = new Spr(W, H, 500 + STALL_KINDS.indexOf(kind) * 7 + (o.seed || 0)); S.ax = W / 2; S.ay = H - 1;
  const wd = MAT.wood, st = MAT.steel, aw = rp(o.col || '#c83030', 7);
  const counter = (ramp, y = 28) => { panel(S, 4, y, W - 5, H - 1, ramp, { a: 0.55, b: 0.35 }); panel(S, 2, y - 2, W - 3, y, ramp, { a: 0.85, b: 0.7 }); };
  const posts = (y0 = 6, y1 = 28) => { for (const x of [5, W - 7]) S.box(x, y0, x + 1, y1, st, { lo: 1, hi: 6 }); };
  const flat = (y, ramp, h = 6) => { for (let x = 0; x < W; x++) for (let j = 0; j < h; j++) S.px(x, y + j, tone(ramp, 0.75 - j * 0.07 + (j === 0 ? 0.15 : 0))); };
  const lantern = (x, y, c) => { S.limb(x, y - 3, x, y, 0.8, ['#111', '#333']); S.ell(x, y + 3, 2.6, 3.2, rp(c, 4), { glow: true }); S.px(x, y, '#111'); S.px(x, y + 6, '#111'); };
  const steam = (x, y, n = 16) => { for (let k = 0; k < n; k++) S.px(x + Math.sin(k * 0.7) * 2, y - k * 0.6, k % 3 ? '#c8c8d4' : '#e8e8f0'); };
  if (kind === 'ramen') { // a cart with wheels and a short curtain
    posts(8, 28); flat(4, rp('#3a2418', 6), 5);
    for (let i = 0; i < 6; i++) { S.box(6 + i * 9, 9, 13 + i * 9, 17, rp('#c82a2a', 6), { lo: 1, hi: 5 }); if (i === 2 || i === 3) for (let j = 11; j < 15; j++) S.px(9 + i * 9, j, '#f0e8d8'); }
    counter(wd, 30); S.ell(16, 27, 7, 3, st); S.ell(46, 27, 6, 3, MAT.copper); steam(16, 23); steam(46, 23, 12);
    for (const x of [14, 50]) { S.ell(x, 44, 4, 4, ['#0a0a0a', '#2a2a2a', '#4a4a4a']); S.px(x, 44, '#8a8a8a'); }
    lantern(3, 6, '#ff4a2a'); lantern(W - 4, 6, '#ff4a2a');
  } else if (kind === 'yakitori') { // a charcoal grill, skewers, smoke, one big red lantern
    posts(10, 28); flat(6, rp('#1a1a1a', 5), 4);
    counter(rp('#5a3a24', 7), 30); for (let x = 10; x < 54; x++) { S.px(x, 27, x % 2 ? '#ff6a20' : '#ffb040', true); S.px(x, 28, '#2a1a10'); }
    for (let x = 12; x < 52; x += 4) { S.limb(x, 26, x + 2, 20, 0.6, ['#8a6a3a', '#c8a060']); S.ell(x + 1.5, 22, 1.4, 1.6, rp('#8a3a1a', 4)); }
    for (let k = 0; k < 30; k++) S.px(18 + hash(k, 1, 3) * 28, 18 - hash(k, 2, 3) * 14, hash(k, 3, 3) < 0.5 ? '#8a8690' : '#a8a4b0');
    S.ell(32, 12, 6, 7, rp('#d82a1a', 5), { glow: true }); for (let y = 6; y < 19; y += 3) for (let x = 27; x < 38; x++) if (Math.hypot(x - 32, (y - 12) * 0.85) < 6) S.px(x, y, '#5a0a0a', true); S.px(31, 11, '#1a0808'); S.px(33, 13, '#1a0808');
  } else if (kind === 'dumpling') { // stacked bamboo steamers, white steam, a blue awning
    posts(8, 28); for (let x = 0; x < W; x++) for (let j = 0; j < 7; j++) S.px(x, 4 + j, tone(rp('#2a5a9a', 7), (x >> 3) % 2 ? 0.7 - j * 0.06 : 0.45 - j * 0.05));
    counter(rp('#e8e0d0', 6), 30);
    for (const sx of [12, 26, 40]) for (let k = 0; k < 3; k++) { S.box(sx, 25 - k * 4, sx + 11, 28 - k * 4, rp('#c8a060', 6), { lo: 1, hi: 5 }); S.px(sx + 2, 26 - k * 4, '#6a4a2a'); } for (const sx of [17, 31, 45]) steam(sx, 13, 12);
    for (let x = 8; x < W - 8; x += 3) S.px(x, 32, '#d83a2a');
  } else if (kind === 'fish') { // a bed of ice, fish laid on it, a bare bulb, tubs
    S.limb(32, 0, 32, 8, 0.8, ['#111', '#333']); S.ell(32, 10, 2, 2.4, ['#fff8d0', '#ffffff'], { glow: true });
    counter(rp('#3a5a6a', 6), 26); for (let x = 4; x < W - 4; x++) for (let y = 22; y < 26; y++) S.px(x, y, hash(x, y, 4) < 0.5 ? '#e8f4ff' : '#b8d0e0');
    for (let k = 0; k < 6; k++) { const fx = 8 + k * 9; S.ell(fx + 3, 22, 4, 1.6, rp(['#8aa0b8', '#c8a8a0', '#a8b8c8', '#d8c0a0'][k % 4], 5)); S.px(fx, 22, '#1a1a1a'); S.px(fx + 7, 21, '#4a4a5a'); S.px(fx + 7, 23, '#4a4a5a'); }
    for (const x of [10, 30, 50]) { S.box(x - 5, 36, x + 5, 47, rp('#2a6aa8', 6), { lo: 1, hi: 5 }); for (let i = -3; i <= 3; i++) S.px(x + i, 37, '#c8e0f0'); }
  } else if (kind === 'fruit') { // crates of fruit under a striped parasol
    S.limb(32, 6, 32, 46, 1, st); for (let x = 2; x < W - 2; x++) { const y = 6 - Math.round(Math.sqrt(Math.max(0, 900 - (x - 32) ** 2)) / 10); for (let j = y; j < 9; j++) S.px(x, j, tone(rp((x >> 3) % 2 ? '#e8e0d0' : (o.col || '#2a8a4a'), 7), 0.7 - (j - y) * 0.05)); }
    for (let k = 0; k < 4; k++) { const cx = 6 + k * 14, cy = 36 - (k % 2) * 6; panel(S, cx, cy, cx + 12, cy + 10, wd, { a: 0.6, b: 0.4 }); for (let i = 0; i < 5; i++) S.ell(cx + 2 + i * 2.2, cy - 1, 1.6, 1.6, rp(['#d83a2a', '#ff9a2a', '#e8d040', '#6ab83a'][k], 5)); }
    panel(S, 4, 44, W - 5, 47, wd);
  } else if (kind === 'tea') { // a wooden counter, a kettle, cups, a banner on a pole
    S.limb(6, 0, 6, 46, 1, wd); for (let y = 2; y < 30; y++) for (let x = 7; x < 15; x++) S.px(x, y, tone(rp(o.col || '#2a6a3a', 6), 0.65 - (x - 7) * 0.03)); for (let y = 6; y < 26; y += 6) for (const [a, b] of GLYPHS[y % GLYPHS.length]) S.px(10 + a, y + b, '#f0e8d0');
    counter(wd, 30); S.ell(28, 26, 5, 4, ['#1a1a1a', '#3a3a3a', '#5a5a5a']); S.limb(33, 25, 37, 22, 1, MAT.steelD); steam(26, 21, 10);
    for (const x of [42, 48, 54]) { S.box(x, 25, x + 3, 28, rp('#e8e0d0', 4), { lo: 1, hi: 3 }); }
    for (let x = 16; x < W - 2; x += 8) { S.limb(x, 8, x + 8, 8, 0.6, ['#111', '#222']); S.ell(x + 4, 11, 2, 2.4, rp('#ffd890', 4), { glow: true }); }
  } else if (kind === 'flowers') { // buckets of flowers on steps
    for (let k = 0; k < 3; k++) panel(S, 4 + k * 4, 30 + k * 6, W - 5 - k * 4, 33 + k * 6, wd);
    for (let k = 0; k < 9; k++) { const bx = 6 + (k % 5) * 11, by = 30 + Math.floor(k / 5) * 6; S.box(bx, by - 6, bx + 7, by, rp('#5a6a7a', 5), { lo: 1, hi: 4 }); for (let q = 0; q < 8; q++) { const fx = bx + hash(q, k, 2) * 8, fy = by - 8 - hash(q, k, 3) * 10; S.limb(bx + 3.5, by - 6, fx, fy, 0.5, ['#1a3a1a', '#3a6a2a']); S.px(fx, fy, ['#ff6a8a', '#ffd040', '#f0f0ff', '#c85aff', '#ff8a3a'][(k + q) % 5]); } }
  } else if (kind === 'parts') { // screens, coils of cable, bins of chips, a jumble
    posts(6, 28); flat(2, rp(o.col || '#2a3a4a', 6), 5); counter(MAT.steelD, 28);
    for (let k = 0; k < 4; k++) { const sx = 6 + k * 14; panel(S, sx, 14, sx + 11, 24, MAT.steelD); for (let y = 16; y < 23; y++) for (let x = sx + 2; x < sx + 10; x++) S.px(x, y, (y % 2 && hash(x, y, k) > 0.3) ? ['#3af0e0', '#ff4ab0', '#3aff80', '#ffd040'][k] : '#0a1214', true); }
    for (let k = 0; k < 5; k++) { const bx = 6 + k * 11; panel(S, bx, 32, bx + 9, 38, rp('#3a3a42', 5)); for (let q = 0; q < 6; q++) S.px(bx + 1 + hash(q, k, 5) * 8, 31 - hash(q, k, 6) * 2, ['#3aff80', '#c8a040', '#c8c8d0'][q % 3]); }
    S.ell(52, 44, 5, 3, MAT.copper);
  } else if (kind === 'med') { // a white tarp, a red cross, boxes of pills, drip bags
    posts(4, 28); for (let x = 0; x < W; x++) for (let j = 0; j < 8; j++) S.px(x, 2 + j, tone(rp('#d8e0e4', 7), 0.75 - j * 0.05));
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (Math.abs(i) < 2 || Math.abs(j) < 2) S.px(32 + i, 5 + j, '#e82a3a', true);
    counter(rp('#c8d0d4', 6), 30);
    for (let k = 0; k < 7; k++) { const bx = 6 + k * 7; S.box(bx, 23, bx + 5, 28, rp(['#e8f0f0', '#3aa86a', '#e8c040', '#5a8ac8'][k % 4], 5), { lo: 1, hi: 4 }); }
    for (const x of [12, 24, 44]) { S.limb(x, 10, x, 13, 0.6, ['#888', '#aaa']); S.cap(x, 14, x, 19, 2, 2.2, ['#8ad0e8', '#c8f0ff', '#e8ffff'], { glow: true }); S.limb(x, 20, x + 2, 26, 0.5, ['#aaa', '#ccc']); }
  } else if (kind === 'herbs') { // jars on shelves, bundles of dried things hanging
    posts(4, 28); flat(2, rp('#5a3a1a', 6), 4);
    for (let k = 0; k < 7; k++) { const x = 8 + k * 7; S.limb(x, 6, x, 9, 0.6, ['#111', '#333']); S.shape([[x - 2, 9], [x + 2, 9], [x + 1, 16], [x - 1, 16]], rp(['#6a5a2a', '#8a4a2a', '#4a5a2a', '#7a6a4a'][k % 4], 5)); }
    counter(wd, 30); panel(S, 6, 20, W - 7, 22, wd); for (let k = 0; k < 8; k++) { const x = 8 + k * 6; S.box(x, 23, x + 4, 28, rp(['#c8a040', '#8a3a2a', '#3a6a3a', '#a8a8b8'][k % 4], 5), { lo: 1, hi: 5 }); S.px(x + 1, 24, '#e8e8f0'); }
  } else if (kind === 'organs') { // a fridge lit cold blue, coolers, a cleaver; no questions
    panel(S, 4, 4, 30, H - 1, KMAT.whitepanel, { a: 0.7, b: 0.5 }); for (let y = 8; y < H - 4; y++) for (let x = 7; x < 27; x++) S.px(x, y, (y % 9 === 0) ? '#c8f0ff' : '#3a8ab8', true);
    for (let k = 0; k < 4; k++) S.ell(12 + (k % 2) * 8, 13 + Math.floor(k / 2) * 9, 3, 2.4, rp('#a83a4a', 5));
    for (const [x, y] of [[36, 34], [50, 38]]) { panel(S, x, y, x + 12, H - 1, rp('#e8e8e8', 5)); for (let i = x + 1; i < x + 12; i++) S.px(i, y + 2, '#3a8ad8'); }
    S.limb(40, 26, 50, 24, 1, MAT.chrome); S.px(41, 28, '#c8c8d0');
  } else if (kind === 'masks') { // masks hung on a board, a festival stall
    flat(2, rp(o.col || '#c83a2a', 7), 6); posts(8, 30); panel(S, 6, 9, W - 7, 30, rp('#2a1a10', 5));
    for (let k = 0; k < 8; k++) { const mx = 11 + (k % 4) * 13, my = 13 + Math.floor(k / 4) * 9; S.ell(mx, my + 2, 4, 3.6, rp(['#f0e8e0', '#e83a2a', '#3a8ae8', '#f0c040'][k % 4], 5)); S.px(mx - 1.5, my + 1, '#1a1010'); S.px(mx + 1.5, my + 1, '#1a1010'); S.px(mx, my + 4, '#8a1a1a'); }
    counter(wd, 32);
  } else if (kind === 'books') { // a table of old books and data chips
    counter(wd, 32); for (let k = 0; k < 9; k++) { const bx = 6 + k * 6, bh = 4 + hash(k, 1, 9) * 6; S.box(bx, 31 - bh, bx + 4, 31, rp(['#6a2a2a', '#2a4a6a', '#5a5a2a', '#3a3a3a', '#8a6a3a'][k % 5], 5), { lo: 1, hi: 5 }); }
    S.limb(32, 0, 32, 10, 0.8, ['#111', '#333']); S.ell(32, 12, 2, 2.4, ['#ffd890', '#fff0c0'], { glow: true });
  } else if (kind === 'skewers') { // a tiny grill cart, one lantern, a stool
    counter(MAT.steelD, 32); for (let x = 12; x < 52; x++) S.px(x, 30, x % 3 ? '#ff6a20' : '#ffd060', true); for (let x = 14; x < 50; x += 5) S.limb(x, 30, x + 1, 23, 0.6, ['#8a6a3a', '#c8a060']); lantern(56, 10, '#ffb040');
    for (let k = 0; k < 20; k++) S.px(20 + hash(k, 1, 7) * 24, 22 - hash(k, 2, 7) * 18, '#9a96a0');
  } else if (kind === 'robot') { // a noodle robot in a glass booth: an arm, a screen
    panel(S, 8, 0, W - 9, H - 1, MAT.steelD); for (let y = 4; y < 30; y++) for (let x = 12; x < W - 12; x++) S.px(x, y, mixRgb([20, 40, 50], [90, 160, 180], (x + y) % 11 === 0 ? 0.5 : 0.15), (x + y) % 11 === 0);
    S.limb(22, 26, 30, 14, 2, MAT.chrome); S.limb(30, 14, 40, 18, 1.6, MAT.chrome); S.ell(42, 20, 2, 2, MAT.chrome); S.ell(40, 27, 5, 2.5, rp('#e8e0d0', 4)); steam(40, 24, 10);
    for (let x = 12; x < W - 12; x++) S.px(x, 2, o.col || '#3af0e0', true); panel(S, 14, 34, 30, 42, ['#0a0a0e', '#16161c']); for (let x = 16; x < 29; x += 2) S.px(x, 38, '#ffd040', true);
  } else { counter(wd, 30); posts(); flat(2, aw, 6); }
  return S.done();
}
// a stall placed in the street: the art, its light, and a vendor behind it who
// says something fitting (o.npc: { name, role, lines, look })
function kStallAt(L, x, G, kind, o = {}) {
  L.prop('deco', x, G, { art: kStall(kind, o), id: L.id + ':stall:' + kind + ':' + x, front: o.front || 26 });
  const lc = { ramen: [1, 0.55, 0.3], yakitori: [1, 0.5, 0.25], dumpling: [1, 0.85, 0.65], fish: [0.9, 0.95, 1], fruit: [1, 0.85, 0.6], tea: [1, 0.8, 0.5], flowers: [1, 0.85, 0.75], parts: [0.4, 0.9, 1], med: [0.85, 0.95, 1], herbs: [1, 0.7, 0.4], organs: [0.4, 0.75, 1], masks: [1, 0.6, 0.35], books: [1, 0.85, 0.55], skewers: [1, 0.6, 0.3], robot: [0.4, 0.95, 1] }[kind] || [1, 0.7, 0.45];
  L.light(x, G - 26, 56, lc, 0.8, 1, kind === 'yakitori' || kind === 'skewers' ? { mode: 'fire', seed: x } : null);
  if (kind === 'yakitori' || kind === 'skewers') L.vents.push({ x: x - 4, y: G - 26, kind: 'smoke' });
  if (kind === 'ramen' || kind === 'dumpling' || kind === 'tea') L.vents.push({ x: x - 12, y: G - 22, kind: 'steam' });
  if (o.npc !== false) {
    const n = o.npc || {}, looks = { ramen: { apron: '#e8e0d0', hair: 'cap', capCol: '#e8e0d0' }, fish: { apron: '#2a4a6a', hair: 'cap' }, med: { top: '#e0e8e8', hair: 'short' }, organs: { top: '#2a2a2a', apron: '#8a2a2a', hair: 'bald' }, robot: null }[kind];
    if (looks !== null) L.npc(Object.assign({ name: n.name || STALL_NAMES[kind] || 'Stallholder', look: Object.assign({ skin: SKINS[(x >> 4) % 6], hair: 'cap', capCol: '#2a3a5a', top: '#4a4a3a', apron: '#3a2a1a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, looks || {}, n.look || {}), x, y: G, sched: [[0, 24, x, 'work']], lines: n.lines || STALL_LINES[kind] || ['Buy something or move along.'], behind: true }, n.role ? { role: n.role, rate: n.rate || 1 } : {}));
  }
}
const STALL_NAMES = { ramen: 'Ramen cook', yakitori: 'Grill man', dumpling: 'Dumpling auntie', fish: 'Fishmonger', fruit: 'Fruit seller', tea: 'Tea seller', flowers: 'Flower seller', parts: 'Parts dealer', med: 'Street medic', herbs: 'Herbalist', organs: 'Cold-box man', masks: 'Mask maker', books: 'Book seller', skewers: 'Skewer kid' };
const STALL_LINES = {
  ramen: ['Shoyu or miso? Don\'t say synth broth, I\'ll throw you out.', 'Sit. Eat. The rain can wait.'], yakitori: ['Chicken. Real chicken. Don\'t ask from where.', 'Smoke\'s free. Skewers are not.'],
  dumpling: ['Six for a credit. Steamed this morning. This evening. Recently.', 'My grandmother\'s recipe. She was a synth, you know. Joking!'], fish: ['Canal fish. Glows a little. Perfectly safe.', 'Fresh off the barge. Fresh-ish.'],
  fruit: ['Real oranges from the arcology. Fell off a truck.', 'Apples are grown in vats now. These ones aren\'t. Probably.'], tea: ['Sit down, tracer. Tea first, questions after.', 'Green, black, or the one that keeps you awake for three days.'],
  flowers: ['Real flowers. Smell them. That\'s free.', 'For the dead or the living? Different price.'], parts: ['Chips, screens, coils. Nothing stolen. Nothing I know of.', 'Need a part? I\'ve got the part. Somewhere.'],
  med: ['Patches, painkillers, stitches. No chrome. I\'m legal.', 'Bleeding? Sit. Pay after.'], herbs: ['Roots for the lungs. The air down here eats them.', 'Old remedies. They work as well as the new ones. Which is to say, a bit.'],
  organs: ['Cold box. Don\'t open the cold box.', 'Everything in here\'s grown, not taken. You have my word. My word\'s cheap.'], masks: ['Fox, demon, cat. Hide your face, tracer. Everyone does.', 'Festival\'s on the fourth. Every month.'],
  books: ['Paper books. Nobody reads them. I do.', 'A first edition of a manual for a car that doesn\'t exist any more.'], skewers: ['Two for one. One for two. Whatever.', 'Mum says don\'t talk to cops.'],
};

// ---- a district ---------------------------------------------------------------------
// The frame every hand-built place shares: the ground, what's behind (the
// city's layers, or for places under the street a back wall and a ceiling),
// the way in at the west end (a spinner pad, a subway platform, a lift cage,
// a manhole ladder), passers-by, light and weather. o.build(L, G) places the
// rest by hand. Spots (where cases and warrants put things) come from
// L.spots; if a place gives fewer than ten, the ground is shared out.
//   o: { id, name, tier, W, H, G, sky, layerDy, floor, transit, amb, rain,
//        crowd, crowdFrom, crowdTo, local: { name, lines, look }, build }
function district(o) {
  const W = o.W, H = o.H || 430, G = o.G || 386, L = newLevel(o.id, o.name, W, H);
  L.ground = G; L.spots = []; L.tier = o.tier;
  if (o.sky !== false) { cityLayers(L); L.layerDy = o.layerDy !== undefined ? o.layerDy : 0; }
  L.floor(0, W, G, H - G, o.floor || MAT.concrete, { base: 0.42, drips: 0 });
  if (o.sky !== false && o.wet !== false) L.wet.push({ y: G + 1, x0: 0, x1: W, depth: 22, k: 0.35 });
  // the way in
  const mode = o.transit || 'spinner';
  L.prop('transit', 70, G, { mode, label: { spinner: 'a cab stand', subway: 'subway platform', lift: 'lift cage', hatch: 'ladder up to the street' }[mode] || 'the way out' });
  if (mode === 'spinner') L.light(66, G - 40, 40, [1, 0.85, 0.4], 0.6); else L.light(70, G - 40, 50, [1, 0.8, 0.5], 0.6);
  L.spawns = { enter: [140, G] };
  o.build(L, G);
  // the spots: the ones the place gave, then the ground shared out
  for (let x = 300; L.spots.length < 10 && x < W - 150; x += Math.max(140, Math.floor((W - 450) / 10))) if (!L.spots.some((s) => Math.abs(s[0] - x) < 60 && s[1] === G)) L.spots.push([x, G]);
  // a terminal on the ground, by one of the spots: a network to jack into
  const gs = L.spots.filter((s) => s[1] === G), ts = gs.length ? gs[Math.floor(hash(o.id.length, W, 23) * gs.length)] : [W * 0.5, G], tier = o.tier || 1;
  L.prop('node', ts[0] - 26, G, { term: true, level: tier >= 5 ? 3 : tier >= 3 ? 2 : 1, col: '#ffb040' }); L.light(ts[0] - 26, G - 18, 40, [1, 0.7, 0.3], 0.5);
  // people passing, light, weather
  if (o.crowd) crowd(L, o.crowd, o.crowdFrom || 300, o.crowdTo || W - 200, G, o.id.length * 977 + W);
  if (o.local) L.npc(Object.assign({ x: 260, y: G, sched: [[0, 24, 260, 'stand']] }, o.local, { look: Object.assign({ skin: SKINS[2], hair: 'short', top: '#3a4a5a', coat: 'jacket', legs: '#2a2a2a' }, o.local.look || {}) }));
  const amb = o.amb || [0.2, 0.17, 0.26];
  if (o.sky !== false) L.ambient = (ax, ay) => { const t = clamp(1 - ay / 400, 0, 1); return [amb[0] + t * 0.08, amb[1] + t * 0.06, amb[2] + t * 0.1]; };
  else L.ambient = amb;
  L.rain = o.rain === undefined ? (o.sky !== false ? 1 : 0) : o.rain; if (!L.rain) L.dry = [[0, 0, W, H]];
  return L;
}
// enemies by hand: [type, x, from, to]; fliers hover, turrets sit on a wall
function kFoes(L, G, list) {
  for (const [type, x, a, b, y] of list) { const D = ENEMY[type]; L.enemy(type, x, y !== undefined ? y : D.ai === 'flyer' ? G - 70 : D.ai === 'turret' ? G - 60 : G, { range: [a === undefined ? x - 120 : a, b === undefined ? x + 120 : b] }); }
}
// a district's entry in LEVELS: where it sits on the world map (x across the
// city, depth in metres) and a line about it
function addDistrict(id, name, tier, depth, mapX, blurb, label, make) {
  LEVELS[id] = { name, tier, district: true, depth: (depth > 0 ? '+' : '') + depth + ' m', metres: depth, mapX, blurb, label, make };
}
// the painted pieces placed straight into a level
function bTorii(L, x0, x1, G, h = 70, o = {}) { L.paint(x0 - 8, G - h - 10, x1 + 8, G, (P) => kTorii(P, x0, x1, G, h, o)); }
function bToro(L, x, G) { L.paint(x - 8, G - 36, x + 8, G, (P) => kToro(P, x, G)); L.light(x, G - 22, 30, [1, 0.7, 0.35], 0.6, 1, { mode: 'fire', seed: x }); }
function bTree(L, x, G, kind, o = {}) { const h = o.h || 60; L.paint(x - 40, G - h - 20, x + 40, G + 2, (P) => kTree(P, x, G, kind, Object.assign({ h }, o))); }
function bLanterns(L, x0, x1, y, cols, o = {}) { L.paint(x0, y - 2, x1, y + 16, (P) => kLanterns(P, x0, x1, y, cols, o)); for (let x = x0 + 30; x < x1; x += 70) L.light(x, y + 8, 40, [1, 0.5, 0.3], 0.45); }
