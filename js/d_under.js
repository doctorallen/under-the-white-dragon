'use strict';
// ---------------------------------------------------------------------------
// The undercity: what runs the city, just under the street. The great brick
// drain, the boiler house that heats the blocks, the substation that feeds
// them power, the waterworks. Reached by a ladder down from a manhole. Each is
// built by hand; the painters here are its own (prefixed un).
// ---------------------------------------------------------------------------

// ---- materials ------------------------------------------------------------------
const UNMAT = {
  brick: R(['#1e0e0a', '#3a1e14', '#5a3020', '#9a5a3a']),
  brickD: R(['#120806', '#22120c', '#341c12', '#5a3424']),
  brickY: R(['#20180c', '#3e3018', '#5e4a26', '#a08a5a']),
  slime: R(['#0a120a', '#16241a', '#24382a', '#4a6a4a']),
  iron: R(['#0e0e10', '#1e1e22', '#323236', '#6a6a70']),
  boiler: R(['#180a06', '#3a1a10', '#6a3420', '#d88a5a']),
  green: R(['#0a1410', '#14281e', '#224232', '#5a8a6a']),
  cream: R(['#2a2820', '#4e4a3a', '#8a8268', '#d8ceb0']),
  hazard: R(['#2a2006', '#5a4410', '#a07a18', '#ffd040']),
  water: R(['#020608', '#061016', '#0c2028', '#24505c']),
  porcelain: R(['#2a2a2a', '#5a5850', '#a8a498', '#f0ece0']),
  tile: R(['#1a2220', '#2e3c38', '#4a5e58', '#9ab4a8']),
};

// ---- painters ------------------------------------------------------------------
// brick in courses, the mortar dark, damp streaks running down
function unBrick(P, x0, y0, x1, y1, ramp, o = {}) {
  const s = o.seed || 7, bh = o.bh || 4, bw = o.bw || 9, base = o.base === undefined ? 0.42 : o.base;
  P.area(x0, y0, x1, y1, ramp, (x, y) => {
    const row = Math.floor((y - y0) / bh), off = row % 2 ? bw >> 1 : 0, bx = Math.floor((x - x0 + off) / bw);
    let v = base + (hash(bx, row, s) - 0.5) * 0.2 + (noise(x / 40, y / 30, s) - 0.5) * 0.16;
    if ((y - y0) % bh === 0 || (x - x0 + off) % bw === 0) v -= 0.22;
    if (o.wet !== false) v -= Math.max(0, noise(x / 10, y / 60, s + 3) - 0.62) * 0.7;
    if (o.fade) v -= clamp((y - (o.fadeFrom || y0)) / o.fade, 0, 1) * 0.25;
    return v;
  }, { inside: o.inside });
}
// an arch-topped shape, its foot on yb
function unArchIn(cx, yb, w, h) { const r = w / 2, ys = yb - h + r; return (x, y) => Math.abs(x - cx) <= r && y <= yb && (y >= ys || Math.hypot(x - cx, y - ys) <= r); }
// a tunnel's mouth going off into the dark: rings getting darker inward,
// voussoirs round the rim
function unMouth(P, cx, yb, w, h, ramp, o = {}) {
  const r = w / 2, ys = yb - h + r, rimIn = unArchIn(cx, yb, w + 10, h + 5), inner = unArchIn(cx, yb, w, h);
  P.area(cx - r - 5, yb - h - 5, cx + r + 5, yb, ramp, (x, y) => { const a = Math.atan2(y - ys, x - cx); return 0.55 + (Math.floor(a * 6) % 2 ? 0.08 : -0.06) + (y < ys ? 0 : 0.02) - (Math.floor((y - ys) / 4) % 2 ? 0.1 : 0) * (y > ys ? 1 : 0); }, { inside: (x, y) => rimIn(x, y) && !inner(x, y) });
  for (let k = 0; k < 5; k++) { const t = k / 5, ww = w * (1 - t * 0.7), hh = h * (1 - t * 0.55), f = unArchIn(cx, yb - t * 6, ww, hh); P.area(cx - ww / 2, yb - hh - 6, cx + ww / 2, yb, ramp, () => 0.22 - t * 0.2, { inside: (x, y) => f(x, y) && !unArchIn(cx, yb - (t + 0.2) * 6, ww * 0.86, hh * 0.89)(x, y) }); }
  kFill(P, cx - w * 0.12, yb - h * 0.4, cx + w * 0.12, yb - 2, o.glow || '#040406', o.glow ? 0.4 : 0);
  if (o.water) for (let x = Math.round(cx - r); x < cx + r; x++) for (let y = yb - 4; y < yb; y++) if (inner(x, y)) P.put(x, y, tone(UNMAT.water, 0.4 + (y === yb - 4 ? 0.3 : 0)));
}
// the brick arcade: piers and great arches holding the street up, the vault
// over them, everything wet
function unArcade(P, x0, x1, ys, G, step, o = {}) {
  const r = step / 2 - 8, s = o.seed || 3, ramp = o.ramp || UNMAT.brick;
  unBrick(P, x0, 0, x1, ys, o.vault || UNMAT.brickD, { seed: s, base: 0.32, fade: ys, fadeFrom: 0 });
  for (let px = x0; px < x1 + step; px += step) {
    const cx = px + step / 2;
    // the arch band, a ring of headers
    P.area(cx - r - 10, ys - r - 12, cx + r + 10, ys + 2, ramp, (x, y) => { const a = Math.atan2(ys - y, x - cx), d = Math.hypot(x - cx, y - ys); return 0.52 + (Math.floor(a * 14) % 2 ? 0.07 : -0.05) - (d > r + 7 ? 0.12 : 0) + (d < r + 1.5 ? 0.15 : 0); }, { inside: (x, y) => { const d = Math.hypot(x - cx, y - ys); return y <= ys && d >= r && d <= r + 10; } });
    // the piers
    unBrick(P, px - 9, ys - 2, px + 9, G, ramp, { seed: s + px, base: 0.5 }); for (let y = ys - 2; y < G; y++) { P.put(px - 9, y, tone(ramp, 0.75)); P.put(px + 8, y, tone(ramp, 0.2)); }
    P.block(px - 12, ys - 4, px + 12, ys + 2, UNMAT.brickY, { base: 0.55 });
  }
}
// an old enamel sign: a blue plate, a white border, words in the old letters
function unSign(P, x, y, n, o = {}) {
  const w = n * 4 + 5, h = 11, bg = col3(o.bg || '#1a3a7a'), ink = col3(o.ink || '#e8ecf0');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const edge = i === 1 || j === 1 || i === w - 2 || j === h - 2; P.put(x + i, y + j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? [20, 20, 24] : edge ? ink : mixRgb(bg, [0, 0, 0], hash(i, j, x) * 0.25 + (hash(i >> 2, j >> 2, y) < 0.08 ? 0.5 : 0))); }
  for (let k = 0; k < n; k++) for (const [a, b] of GLYPHS[Math.floor(hash(k, x, o.seed || 5) * GLYPHS.length)]) P.put(x + 3 + k * 4 + a, y + 3 + b, ink);
}
// a hazard sign: a yellow triangle with a bolt or a bang
function unDanger(P, cx, y, s = 8) { for (let j = 0; j < s; j++) for (let i = -j * 0.6; i <= j * 0.6; i++) P.put(cx + i, y + j, j === s - 1 || Math.abs(Math.abs(i) - j * 0.6) < 0.7 ? [30, 24, 6] : [255, 200, 40]); for (let j = 2; j < s - 2; j++) P.put(cx + (j < s / 2 ? 0 : -1) + (j % 3 === 0 ? 1 : 0), y + j, [20, 16, 4]); }
// a valve wheel or a flywheel: a rim, spokes, a hub
function unWheel(P, cx, cy, r, ramp, o = {}) {
  const sp = o.spokes || 6, rot = o.rot || 0, th = o.th || Math.max(1.2, r * 0.12);
  P.area(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, ramp, (x, y) => 0.6 - ((x - cx) + (y - cy)) / (r * 3), { inside: (x, y) => { const d = Math.hypot(x - cx, y - cy); if (d <= r && d >= r - th) return true; if (d < r * 0.18 + 1) return true; const a = Math.atan2(y - cy, x - cx) - rot; for (let k = 0; k < sp; k++) { const da = Math.abs(((a - k * Math.PI * 2 / sp) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI); if (da * d < th * 0.6 && d < r) return true; } return false; } });
}
// a pressure gauge: a brass ring, a pale face, a needle
function unGauge(P, cx, cy, r, v, o = {}) {
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) { const d = Math.hypot(x, y); if (d <= r - 1) P.put(cx + x, cy + y, [214, 206, 182], 0.12); else if (d <= r + 1) P.put(cx + x, cy + y, tone(MAT.copper, 0.6 - (x + y) / (r * 3))); }
  const a = Math.PI * (0.8 + v * 1.4); for (let k = 0; k < r - 1; k++) P.put(cx + Math.cos(a) * k, cy + Math.sin(a) * k, v > 0.8 ? [220, 30, 30] : [30, 26, 22]);
  P.put(cx + Math.cos(Math.PI * 0.2) * (r - 2), cy + Math.sin(Math.PI * 0.2) * (r - 2), [220, 40, 40]);
}
// falling water, a column of it, white at the edges, glinting
function unStream(P, x, y0, y1, w) { for (let y = y0; y < y1; y++) for (let i = 0; i < w; i++) { const t = (y - y0) / (y1 - y0), n = noise(i * 2, (y - x) / 3, 41); P.put(x + i + Math.round(Math.sin(y / 9) * 0.4), y, mixRgb([30, 70, 80], [190, 220, 220], n * 0.7 + (i === 0 || i === w - 1 ? 0.2 : 0) - t * 0.15), 0.15 + n * 0.2); } }
// riveted plate: a seam every so often, rivets along it
function unRivets(P, x0, y0, x1, y1, ramp, step = 18) { for (let y = y0 + step; y < y1; y += step) for (let x = x0 + 2; x < x1 - 1; x += 3) { P.put(x, y, tone(ramp, 0.8)); P.put(x, y + 1, tone(ramp, 0.15)); } }
// a caged work lamp on a bracket, and its light
function unLamp(L, x, y, col = [1, 0.82, 0.55], k = 0.8, o = {}) {
  L.paint(x - 4, y - 6, x + 5, y + 6, (P) => { kH(P, x - 4, x + 1, y - 5, tone(MAT.steelD, 0.5)); kV(P, x, y - 5, y - 2, tone(MAT.steelD, 0.4)); const c = col.map((q) => q * 255); for (let j = 0; j < 5; j++) for (let i = -2; i <= 2; i++) { const edge = Math.abs(i) === 2 || j === 0 || j === 4; if (edge && (i === 0 || j === 2 || Math.abs(i) + Math.abs(j - 2) > 3)) continue; P.put(x + i, y - 2 + j, edge ? [34, 32, 28] : mixRgb(c, [255, 255, 255], i === 0 && j === 2 ? 0.7 : 0.25), edge ? 0 : 1); } });
  L.light(x, y + 2, o.r || 80, col, k, 1, o.flick ? { mode: o.flick, seed: x } : null);
}
// a ladder painted up a shaft (no feet on it), a manhole at the top, the grey
// light of the street coming down it, and rain through the grate
function unShaft(L, x, G, top, o = {}) {
  L.paint(x - 14, top - 10, x + 14, G, (P) => {
    P.area(x - 12, top - 10, x + 12, top + 40, MAT.concreteD, (xx, y) => 0.3 + (y - top) / 200);
    for (let y = top; y < G; y++) { P.put(x - 5, y, tone(MAT.steel, 0.6)); P.put(x + 5, y, tone(MAT.steel, 0.4)); if ((y - top) % 5 === 0) for (let i = -4; i <= 4; i++) P.put(x + i, y, tone(MAT.steel, 0.65 - i * 0.03)); }
    for (let i = -11; i <= 11; i++) for (let j = -9; j < -4; j++) P.put(x + i, top + j, (i + 11) % 3 === 0 ? [20, 20, 24] : [150, 160, 175], 0.5);
  });
  L.light(x, top + 20, 70, [0.6, 0.7, 0.85], 0.8, 2);
  if (o.rain !== false) { const d = L.dry, i = d.findIndex((r) => r[0] < x && r[2] > x && r[1] <= 0); if (i >= 0) { const r = d[i]; d.splice(i, 1, [r[0], r[1], x - 9, r[3]], [x + 9, r[1], r[2], r[3]], [x - 9, G - 2, x + 9, r[3]]); } }
  L.drips.push({ x: x + 7, y0: top, y1: G });
}

// ---- The Main Drain ---------------------------------------------------------------
addDistrict('d_drain', 'The Main Drain', 2, -95, 300, 'The great brick sewer under the street: arches, a channel of black water, manholes up to the rain. Ferals live in the side tunnels.', 'Sewers', () => district({
  id: 'd_drain', name: 'The Main Drain', tier: 2, W: 2700, sky: false, transit: 'hatch', crowd: 2, rain: 1, amb: [0.21, 0.2, 0.2], floor: UNMAT.slime,
  local: { name: 'Sewerman Dodd', lines: ['Mind the channel. What goes in doesn\'t come out.', 'Hundred and forty years these arches have held the street up. Brick. Nobody makes brick now.', 'The ferals keep to the side tunnels. Mostly. Don\'t go poking.', 'Somebody\'s been dumping coolant again. Look at it shine.'], look: { hair: 'cap', capCol: '#3a4a2a', top: '#3a4a3a', coat: 'long', legs: '#2a2a20', mask: '#3a3a30' } },
  build(L, G) {
    const W = L.w, YS = 282;
    L.dry.push([0, 0, W, L.h]);
    // the arcade behind: piers, arches, the vault; side tunnels between some piers
    L.paint(0, 0, W, G, (P) => {
      unBrick(P, 0, YS, W, G, UNMAT.brickD, { seed: 11, base: 0.3 });
      unArcade(P, -40, W, YS, G, 220, { seed: 5 });
      for (const [cx, w, h, gl] of [[470, 60, 90, null], [910, 46, 70, null], [1350, 70, 100, '#3a1a0a'], [1790, 50, 74, null], [2230, 64, 96, '#2a1206']]) unMouth(P, cx, G - 2, w, h, UNMAT.brick, { water: true, glow: gl });
      // old pipes along the wall, a tide line of slime
      pipe(P, 0, YS + 16, W, YS + 24, MAT.rust, { joints: 44 }); pipe(P, 0, YS + 30, W, YS + 34, MAT.copper, { joints: 30 });
      for (let x = 0; x < W; x++) for (let y = G - 26; y < G - 2; y++) P.tint(x, y, [20, 40, 24], 0.25 + (y > G - 12 ? 0.25 : 0));
    });
    // the channel in front: a stone ledge, black water under it
    L.paint(0, G, W, L.h, (P) => {
      P.block(0, G, W, G + 5, UNMAT.brickY, { base: 0.5 });
      P.area(0, G + 5, W, L.h, UNMAT.water, (x, y) => 0.3 + (noise(x / 26, y / 2, 61) - 0.5) * 0.25 + (y < G + 7 ? 0.25 : 0));
      for (let x = 0; x < W; x += 3) if (hash(x, 9, 4) < 0.2) P.put(x, G + 9 + hash(x, 2, 4) * 20, [90, 160, 120], 0.4);
    });
    L.wet.push({ y: G + 6, x0: 0, x1: W, depth: 38, k: 0.6 });
    // outfalls: pipes through the wall pouring into gutters across the ledge, a grate over each
    for (const x of [690, 1570, 2420]) {
      L.paint(x - 20, G - 70, x + 20, G + 6, (P) => { P.area(x - 10, G - 66, x + 10, G - 46, MAT.rust, (xx, y) => 0.6 - Math.hypot(xx - x, y - G + 56) / 14, { inside: (xx, y) => Math.hypot(xx - x, y - G + 56) < 10 }); kFill(P, x - 6, G - 62, x + 6, G - 50, '#06080a'); unStream(P, x - 4, G - 52, G, 8); for (let i = -14; i <= 14; i++) for (let j = 0; j < 5; j++) P.put(x + i, G + j, (i + 14) % 3 === 0 ? [16, 18, 20] : tone(UNMAT.water, 0.5)); });
      L.vents.push({ x, y: G - 4, kind: 'steam' }); L.drips.push({ x: x - 2, y0: G - 50, y1: G }, { x: x + 2, y0: G - 50, y1: G });
    }
    // the sluice: a gate in a frame, a wheel to wind it
    L.paint(1080, YS - 20, 1200, G, (P) => {
      P.block(1086, YS - 10, 1096, G, UNMAT.iron, { base: 0.45 }); P.block(1184, YS - 10, 1194, G, UNMAT.iron, { base: 0.4 }); P.block(1080, YS - 18, 1200, YS - 8, UNMAT.iron, { base: 0.5 });
      P.area(1096, G - 120, 1184, G - 30, UNMAT.iron, (x, y) => 0.38 + ((y - G) % 10 === 0 ? 0.2 : 0) + ((x - 1096) % 22 === 0 ? -0.15 : 0)); unRivets(P, 1096, G - 120, 1184, G - 30, UNMAT.iron, 10);
      for (let y = G - 30; y < G; y++) for (let x = 1096; x < 1184; x++) P.put(x, y, tone(UNMAT.water, 0.3 + noise(x / 5, y / 2, 3) * 0.4), 0.05);
      for (let y = YS - 8; y < G - 120; y++) { P.put(1139, y, tone(MAT.steel, 0.6)); P.put(1140, y, tone(MAT.steel, 0.3)); }
      unWheel(P, 1140, YS + 8, 14, R(['#2a0806', '#6a1a10', '#a82a1a', '#e85a3a']), { spokes: 5 });
      unSign(P, 1100, G - 140, 6, { seed: 3 });
    });
    unLamp(L, 1140, G - 128, [1, 0.8, 0.5], 0.7);
    // a junction chamber: a dome of light from a big grating, a municipal sign, an old desk
    L.paint(1900, 120, 2100, YS + 10, (P) => { P.area(1930, 140, 2070, YS, UNMAT.brickD, (x, y) => 0.25 + (y - 140) / 300); unSign(P, 1958, YS + 30, 9, { seed: 21 }); unSign(P, 1980, YS + 46, 5, { seed: 22, bg: '#7a1a1a' }); });
    unShaft(L, 2000, G, 150); unShaft(L, 250, G, 160); unShaft(L, 1430, G, 160);
    // catwalks over the channel side, ladders up to them
    L.walk(560, 860, G - 96, 4, MAT.steelD); L.ladder(580, G - 96, G); L.ladder(840, G - 96, G);
    L.walk(1620, 1880, G - 110, 4, MAT.steelD); L.stairs(1630, G, 1720, G - 110);
    L.prop('locker', 760, G - 96, { tier: 2, label: 'maintenance locker' }); L.prop('locker', 2600, G, { tier: 2, label: 'flood locker' }); L.prop('locker', 1820, G - 110, { tier: 2, label: 'maintenance locker' });
    L.prop('junk', 520, G, { label: 'washed-up junk' }); L.prop('junk', 1500, G, { label: 'washed-up junk' }); L.prop('wreck', 2140, G, { label: 'drowned drone' }); L.prop('ac', 980, G, { label: 'pump motor' });
    for (const [x, y] of [[400, G - 60], [800, G - 70], [1250, G - 60], [1700, G - 60], [2300, G - 60], [2600, G - 70]]) unLamp(L, x, y, [1, 0.78, 0.5], 0.75, { flick: x % 3 ? null : 'bad' });
    for (let x = 300; x < W; x += 230) L.drips.push({ x, y0: YS + 4, y1: G });
    // the channel's people: ferals out of the side tunnels, spiders in the pipes, a gang's dump
    kFoes(L, G, [['feral', 1350, 1240, 1460], ['feral', 2230, 2120, 2340], ['spider', 1750, 1640, 1880, G - 110], ['gang', 2500, 2380, 2650], ['spider', 700, 600, 840, G - 96]]);
    L.spots.push([470, G], [700, G - 96], [910, G], [1140, G], [1350, G], [1750, G - 110], [2000, G], [2230, G], [2420, G], [2600, G]);
    L.critter('rat', 200, W - 100, G, 5); L.litter(200, W - 100, G, 4);
  },
}));

// ---- Boiler House Nine ------------------------------------------------------------
// a vertical boiler on a brick plinth: a riveted drum, a dome, a firebox
// burning at its foot, gauges, a brass number
function unBoiler(P, x0, x1, G, h, o = {}) {
  const w = x1 - x0, cx = (x0 + x1) / 2, top = G - 18 - h, ramp = o.ramp || UNMAT.boiler, seed = o.seed || x0;
  unBrick(P, x0 - 8, G - 18, x1 + 8, G, UNMAT.brick, { seed, base: 0.5, wet: false });
  const body = (x, y) => { const t = (x - x0) / w; let v = 0.66 - Math.abs(t - 0.28) * 1.05 + (noise(x / 12, y / 30, seed) - 0.5) * 0.08; if ((G - 18 - y) % 22 < 1) v -= 0.25; if (Math.abs(x - cx - w * 0.2) < 0.6) v -= 0.18; return v; };
  P.area(x0, top, x1, G - 18, ramp, body);
  for (let y = top; y < G - 18; y++) { P.put(x0, y, [6, 8, 10]); P.put(x1 - 1, y, [6, 8, 10]); P.put(x0 + 1, y, tone(ramp, 0.85)); }
  P.area(x0, top - 16, x1, top + 1, ramp, (x, y) => body(x, y) + (top - y) / 60, { inside: (x, y) => ((x - cx) / (w / 2)) ** 2 + ((y - top) / 16) ** 2 <= 1 });
  for (let y = G - 40; y > top; y -= 22) for (let x = x0 + 2; x < x1 - 1; x += 3) { P.put(x, y, tone(ramp, body(x, y) + 0.25)); }
  // the firebox: an iron frame, a door ajar, the fire
  const fy = G - 46; P.block(cx - 18, fy, cx + 18, G - 18, UNMAT.iron, { base: 0.45 });
  for (let y = fy + 4; y < G - 20; y++) for (let x = cx - 14; x < cx + 14; x++) { const t = (y - fy) / 26, f = noise(x / 3, y / 2, seed + 7); P.put(x, y, mixRgb([255, 90, 20], [255, 230, 140], clamp(f * 1.4 - t * 0.3, 0, 1)), 0.9); }
  for (let x = cx - 14; x < cx + 14; x += 4) for (let y = fy + 4; y < G - 20; y++) P.put(x, y, [30, 14, 8]);
  unGauge(P, cx - 10, fy - 14, 5, hash(seed, 1, 3) * 0.9); unGauge(P, cx + 10, fy - 14, 5, 0.3 + hash(seed, 2, 3) * 0.7);
  P.block(cx - 8, fy - 32, cx + 8, fy - 24, KMAT.gold, { base: 0.55 }); for (const [a, b] of GLYPHS[(o.n || 3) * 5 % GLYPHS.length]) P.put(cx - 1 + a, fy - 31 + b, [40, 26, 8]);
  // the steam pipe off the dome
  pipe(P, cx - 5, o.header || top - 60, cx + 5, top - 14, MAT.copper, { joints: 16 });
}
// a coal bunker on legs, a conveyor running up to it, the heap under it
function unHopper(P, x0, x1, G, o = {}) {
  const w = x1 - x0, top = G - 200, mid = G - 110;
  for (const lx of [x0 + 10, x1 - 16]) P.block(lx, mid, lx + 6, G, UNMAT.iron, { base: 0.4, lip: 0 });
  P.area(x0, top, x1, mid + 30, UNMAT.iron, (x, y) => 0.42 - (x - x0) / (w * 3) + ((y - top) % 18 === 0 ? 0.2 : 0), { inside: (x, y) => y < mid || Math.abs(x - (x0 + x1) / 2) < (w / 2) * (1 - (y - mid) / 34) });
  unRivets(P, x0 + 4, top, x1 - 4, mid, UNMAT.iron, 18);
  heap(P, x0 - 40, x1 + 50, G, 22, R(['#050506', '#0e0e10', '#1a1a1e', '#3a3a40']), 9);
  // the conveyor: a belt on rollers rising from the floor to the bunker's top
  const bx0 = x0 - 170, by0 = G - 10, bx1 = x0 + 20, by1 = top + 4, n = 60;
  for (let k = 0; k <= n; k++) { const t = k / n, x = lerp(bx0, bx1, t), y = lerp(by0, by1, t); for (let j = 0; j < 4; j++) P.put(x, y + j, tone(MAT.steel, j === 0 ? 0.8 : 0.4)); if (k % 6 === 0) { unWheel(P, Math.round(x), Math.round(y + 2), 2, UNMAT.iron, { spokes: 3 }); for (let j = 4; j < (G - y) && j < 200; j += 1) if (k % 12 === 0) { P.put(x, y + j, tone(MAT.steel, 0.5)); P.put(x + 1, y + j, tone(MAT.steel, 0.25)); } } if (k % 4 === 1 && t < 0.9) for (let i = 0; i < 3; i++) { P.put(x + i, y - 1, [20, 20, 22]); P.put(x + i, y - 2, [40, 40, 44]); } }
}
addDistrict('d_boilers', 'Boiler House Nine', 2, -105, 520, 'The district heating plant under the blocks: riveted boilers burning day and night, coal on a conveyor, steam everywhere, the stokers.', 'Boiler house', () => district({
  id: 'd_boilers', name: 'Boiler House Nine', tier: 2, W: 2600, sky: false, transit: 'hatch', crowd: 3, amb: [0.27, 0.22, 0.19], floor: UNMAT.iron,
  local: { name: 'Stoker Ama', lines: ['Nine boilers. Every flat from here to the Stack is warm because of us.', 'Coal, if you can believe it. The Works sends it up. Nobody asks from where.', 'Don\'t touch number four. She\'s been angry since Tuesday.', 'You want a cup of tea? Water\'s always hot down here.'], look: { skin: SKINS[4], hair: 'cap', capCol: '#3a2a1a', top: '#5a3a2a', apron: '#2a1a10', legs: '#2a2420', wide: 1 } },
  build(L, G) {
    const W = L.w, HEAD = G - 214;
    // the hall: green tile below, sooty brick above, trusses under the ceiling
    L.paint(0, 0, W, G, (P) => {
      unBrick(P, 0, 0, W, G - 60, UNMAT.brickY, { seed: 31, base: 0.34, wet: false });
      for (let x = 0; x < W; x++) for (let y = 0; y < G - 60; y++) P.tint(x, y, [10, 8, 6], clamp(0.5 - y / (G - 60) * 0.5, 0, 0.5) + noise(x / 30, y / 40, 7) * 0.2);
      P.area(0, G - 60, W, G, UNMAT.tile, (x, y) => 0.4 + (((x % 8) === 0 || ((y - G + 60) % 8) === 0) ? -0.2 : 0) + (noise(x / 20, y / 10, 3) - 0.5) * 0.2);
      for (let x = 0; x < W; x++) P.put(x, G - 61, tone(UNMAT.cream, 0.7));
      for (let x = -20; x < W; x += 60) girder(P, x, 120, x + 60, 134, UNMAT.iron, { step: 15 });
      for (let x = 30; x < W; x += 240) P.block(x, 134, x + 10, G - 60, UNMAT.iron, { base: 0.38, lip: 0 });
      // the steam header: a fat lagged pipe the length of the hall
      pipe(P, 0, HEAD - 10, W, HEAD + 6, UNMAT.cream, { joints: 40 }); pipe(P, 0, HEAD + 14, W, HEAD + 20, MAT.copper, { joints: 30 });
      for (let x = 0; x < W; x += 3) if (hash(x, 4, 4) < 0.3) P.tint(x, HEAD + 6 + hash(x, 5, 4) * 30, [4, 4, 4], 0.4);
    });
    // the boilers, numbered, each with its fire's light
    [[300, 1], [520, 2], [740, 3], [960, 4], [1180, 5]].forEach(([x, n]) => {
      L.paint(x - 20, HEAD - 20, x + 110, G, (P) => unBoiler(P, x, x + 90, G, 150, { n, seed: x * 3, header: HEAD + 6 }));
      L.light(x + 45, G - 32, 90, [1, 0.5, 0.2], 1.1, 1, { mode: 'fire', seed: x });
      L.vents.push({ x: x + 70, y: G - 175, kind: 'steam' });
    });
    // a catwalk along the boilers' faces, ladders up, a stair down
    L.walk(260, 1300, G - 128, 4, MAT.steelD); L.ladder(280, G - 128, G); L.ladder(1290, G - 128, G); L.stairs(1300, G - 128, 1400, G);
    L.prop('locker', 870, G - 128, { tier: 2, label: 'stoker\'s locker' }); L.spots.push([650, G - 128], [1100, G - 128]);
    // the coal bunker and its conveyor
    L.paint(1380, G - 220, 1900, G, (P) => unHopper(P, 1620, 1760, G));
    L.lamp(1560, G, 70, '#ffd8a0', 0.9); unLamp(L, 1690, G - 100, [1, 0.8, 0.55], 0.9, { r: 110 }); unLamp(L, 1450, G - 110, [1, 0.8, 0.55], 0.7);
    L.prop('junk', 1480, G, { label: 'coal scuttle' }); L.prop('wreck', 1800, G, { label: 'dead cleaning drone' });
    // the stokers' corner: a bench, a kettle, a vending machine
    L.prop('deco', 1880, G, { art: () => bench(), id: 'unbench' }); L.prop('vending', 1920, G, { look: { col: '#ffd040', body: '#5a4a1a' }, label: 'vending machine' }); L.light(1920, G - 14, 34, [1, 0.85, 0.3], 0.6);
    // the control room up a stair: old green screens, a big window on the hall
    const CX0 = 1990, CX1 = 2280, CF = G - 96;
    L.paint(CX0, CF - 90, CX1, G, (P) => {
      P.block(CX0, CF - 86, CX1, CF + 6, UNMAT.green, { base: 0.4, panels: [36, 30] });
      for (let x = CX0 + 12; x < CX1 - 12; x += 46) { kFill(P, x, CF - 74, x + 38, CF - 30, '#0a1a14', 0.1); for (let k = 0; k < 3; k++) { const sx = x + 3 + k * 12; kFill(P, sx, CF - 52, sx + 10, CF - 42, '#103a20'); for (let y = CF - 50; y < CF - 43; y += 2) for (let i = 1; i < 9; i++) if (hash(i, y, sx) < 0.6) P.put(sx + i, y, [90, 255, 140], 0.7); } }
      for (let x = CX0 + 6; x < CX1 - 6; x += 10) unGauge(P, x + 5, CF - 16, 3, hash(x, 7, 1));
      P.block(CX0 - 4, CF + 6, CX1 + 4, G, UNMAT.iron, { base: 0.35, panels: [24, 24] });
      P.block(CX0 + 120, G - 40, CX0 + 146, G, UNMAT.green, { base: 0.5 }); kFill(P, CX0 + 124, G - 36, CX0 + 142, G - 26, '#ffe0a0', 0.4); unSign(P, CX0 + 30, G - 60, 7, { seed: 9 }); unDanger(P, CX0 + 200, G - 50, 12);
      for (let x = CX0 + 160; x < CX1 - 10; x += 22) kWin(P, x, G - 76, 14, 12, { lit: hash(x, 2, 2) < 0.6 ? '#c8ffd0' : null });
    });
    L.walk(CX0, CX1, CF, 4, MAT.steelD); L.stairs(CX0 - 90, G, CX0, CF);
    L.prop('rack', 2120, CF, { label: 'control cabinet' }); L.prop('rack', 2140, CF, { label: 'control cabinet' }); L.prop('locker', 2250, CF, { tier: 2, label: 'engineer\'s locker' });
    L.tube(CX0 + 40, CF - 84, 30, '#c8ffd8', 0.6); L.tube(CX0 + 180, CF - 84, 30, '#c8ffd8', 0.6); L.spots.push([2100, CF]);
    L.npc({ name: 'Engineer Okoro', look: { skin: SKINS[5], hair: 'helmet', armor: '#e8b030', visor: '#3a3a3a', top: '#3a5a3a', legs: '#2a2a2a' }, x: 2060, y: CF, face: 1, sched: [[0, 24, 2060, 'stand']], lines: ['Pressure\'s up on four again. It\'s always four.', 'Those screens are older than me. They still work. That\'s the trouble.', 'If the alarms go, run. Don\'t look back, don\'t play detective.'] });
    // the valve wall at the end: wheels, gauges, a manifold, steam leaking
    L.paint(2320, G - 200, W, G, (P) => {
      P.block(2320, G - 190, W, G - 60, UNMAT.iron, { base: 0.3, panels: [40, 40] });
      for (let y = G - 180; y < G - 70; y += 26) { pipe(P, 2320, y, W, y + 6, MAT.copper, { joints: 26 }); for (let x = 2340; x < W - 20; x += 34) unWheel(P, x + ((y / 26) % 2) * 10, y + 3, 7, R(['#2a0806', '#6a1a10', '#a82a1a', '#e85a3a']), { spokes: 4, rot: x }); }
      for (let x = 2340; x < W; x += 28) unGauge(P, x, G - 46, 5, hash(x, 3, 3));
      for (let i = 0; i < 6; i++) unDanger(P, 2330 + i * 46, G - 30, 9);
    });
    for (const x of [2380, 2470, 2560]) L.vents.push({ x, y: G - 140, kind: 'steam' });
    for (const [x, y] of [[180, G - 80], [1350, G - 80], [1700, G - 120], [2400, G - 70]]) unLamp(L, x, y, [1, 0.8, 0.55], 0.8);
    L.prop('ac', 2300, G, { label: 'feed pump' }); L.prop('locker', 2580, G, { tier: 2, label: 'tool locker' });
    // pipes in front, close to the eye
    for (const x of [480, 1240, 2010]) L.prop('deco', x, G, { art: () => unFrontPipe(170, x), id: 'unfp' + x, front: 1 });
    kFoes(L, G, [['gunner', 900, 760, 1100], ['spider', 640, 300, 1280, G - 128], ['gang', 1700, 1500, 1880], ['turret', 2340, 2320, 2600, G - 110], ['gunner', 2450, 2320, 2580]]);
    L.spots.push([400, G], [800, G], [1200, G], [1500, G], [1880, G], [2400, G], [2550, G]);
    L.critter('rat', 200, W - 100, G, 2);
  },
}));
// a pipe standing in front of everything, close to the eye, dark
function unFrontPipe(h, seed) {
  const S = new Spr(12, h, 600 + (seed % 50)); S.ax = 6; S.ay = h - 1;
  for (let y = 0; y < h; y++) for (let x = 1; x < 11; x++) { const t = (x - 1) / 10; S.px(x, y, tone(UNMAT.iron, clamp(0.5 - Math.abs(t - 0.3) * 1.1 + ((y % 40) < 3 ? 0.15 : 0), 0, 1) * 0.6)); }
  for (let y = 20; y < h; y += 40) for (let x = 0; x < 12; x++) S.px(x, y, tone(UNMAT.iron, 0.4));
  return S.done();
}

// ---- Substation Seven -----------------------------------------------------------------
// a transformer: a tank with radiator fins, a conservator on top, porcelain
// bushings rising to the busbars
function unTransformer(P, x0, G, o = {}) {
  const w = 76, x1 = x0 + w, top = G - 64, ramp = o.ramp || UNMAT.green, seed = o.seed || x0;
  P.block(x0 - 4, G - 6, x1 + 4, G, MAT.concrete, { base: 0.5 });
  P.block(x0 + 10, top, x1 - 10, G - 6, ramp, { base: 0.48, panels: [56, 20] });
  for (const [a, b] of [[x0, x0 + 10], [x1 - 10, x1]]) P.area(a, top + 6, b, G - 8, ramp, (x) => ((x - a) % 2 ? 0.25 : 0.62));
  P.area(x0 + 14, top - 16, x1 - 14, top - 2, ramp, (x, y) => 0.65 - Math.abs(y - top + 11) / 10, { inside: (x, y) => Math.abs(y - (top - 9)) < 7 });
  for (const lx of [x0 + 18, x1 - 22]) P.block(lx, top - 4, lx + 4, top, ramp, { base: 0.4 });
  for (let k = 0; k < 3; k++) { const bx = x0 + 20 + k * 18; for (let j = 0; j < 9; j++) { const y = top - 4 - j * 3; for (let i = -3; i <= 3; i++) P.put(bx + i, y, tone(UNMAT.porcelain, j % 2 ? 0.35 : 0.7 - (i + 3) * 0.06)); P.put(bx - 2, y + 1, tone(UNMAT.porcelain, 0.5)); } P.put(bx, top - 32, [200, 200, 210]); }
  P.block(x0 + 24, top + 20, x0 + 44, top + 30, UNMAT.cream, { base: 0.6 }); for (let i = 0; i < 4; i++) P.put(x0 + 27 + i * 4, top + 25, [30, 30, 30]);
  unDanger(P, x1 - 26, top + 18, 11);
}
// chain-link in front of something dangerous, a sign on it
function unFence(P, x0, x1, G, h = 44) { for (let y = G - h; y < G; y++) for (let x = x0; x < x1; x++) if ((x + y) % 5 === 0 || (x - y + 1000) % 5 === 0) P.put(x, y, [92, 98, 104]); for (let x = x0; x < x1; x += 40) { kV(P, x, G - h - 4, G, tone(MAT.steel, 0.6)); kV(P, x + 1, G - h - 4, G, tone(MAT.steel, 0.3)); } kH(P, x0, x1, G - h, tone(MAT.steel, 0.6)); }
// a cable tray along a wall, bundles of cable in it
function unTray(P, x0, x1, y, o = {}) {
  for (let x = x0; x < x1; x++) { P.put(x, y + 6, tone(MAT.steel, 0.55)); if (x % 12 === 0) for (let j = 0; j < 7; j++) P.put(x, y + j, tone(MAT.steel, 0.45)); }
  const cols = o.cols || ['#1a1a1a', '#2a1a10', '#3a0a0a', '#0a1a3a', '#2a2a0a'];
  for (let k = 0; k < 4; k++) { const c = rp(cols[k % cols.length], 4); for (let x = x0; x < x1; x++) P.put(x, y + 2 + k + Math.round(Math.sin((x + k * 31) / 40)), tone(c, 0.4 + (k % 2) * 0.2)); }
  for (let x = x0 + 20; x < x1; x += 70) for (let j = 0; j < 30; j++) P.put(x + Math.sin(j / 5) * 2, y + 8 + j, tone(rp(cols[x % cols.length], 4), 0.5));
}
// a generator set: a long housing, a flywheel turning beside it, its exciter
function unGenerator(P, x0, G, o = {}) {
  const w = 220, h = 70, top = G - 14 - h, ramp = o.ramp || UNMAT.green;
  P.block(x0 - 6, G - 14, x0 + w + 6, G, MAT.concrete, { base: 0.5, panels: [30, 14] });
  P.area(x0 + 70, top, x0 + w, G - 14, ramp, (x, y) => 0.68 - Math.abs((y - top) / h - 0.3) * 0.9 + ((x - x0) % 24 < 1 ? -0.15 : 0), { inside: (x, y) => { const r = 14; const xx = x < x0 + 70 + r ? x0 + 70 + r - x : x > x0 + w - r ? x - (x0 + w - r) : 0, yy = y < top + r ? top + r - y : 0; return Math.hypot(xx, yy) <= r; } });
  unRivets(P, x0 + 74, top + 6, x0 + w - 4, G - 16, ramp, 16);
  P.block(x0 + 120, top + 18, x0 + 160, top + 30, UNMAT.cream, { base: 0.62 }); for (let i = 0; i < 6; i++) P.put(x0 + 124 + i * 6, top + 24, [30, 40, 30]);
  unWheel(P, x0 + 36, G - 14 - 44, 42, MAT.steel, { spokes: 8, th: 5, rot: o.rot || 0 }); P.area(x0 + 30, G - 64, x0 + 76, G - 52, MAT.steel, () => 0.6);
  P.block(x0 + w - 30, top - 26, x0 + w - 6, top, ramp, { base: 0.5 }); unGauge(P, x0 + w - 18, top - 13, 6, 0.6);
}
addDistrict('d_substation', 'Substation Seven', 2, -115, 720, 'The power under the city: transformers humming behind the fence, busbars, cable trays, a hall of generators, and the engineers who keep the lights on.', 'Substation', () => district({
  id: 'd_substation', name: 'Substation Seven', tier: 2, W: 2600, sky: false, transit: 'hatch', crowd: 2, amb: [0.16, 0.2, 0.24], floor: MAT.concrete,
  local: { name: 'Lineman Bex', lines: ['Don\'t touch anything that hums. Everything hums.', 'Half the Stack\'s lights run through that yard. When it trips, people riot.', 'The arcing\'s normal. Mostly. Stand back from the blue.'], look: { skin: SKINS[1], hair: 'helmet', armor: '#ffd040', visor: '#2a2a2a', top: '#2a4a6a', legs: '#2a2a2a' } },
  build(L, G) {
    const W = L.w;
    // concrete walls in panels, beams overhead, cable trays everywhere
    L.paint(0, 0, W, G, (P) => {
      P.block(0, 0, W, G, MAT.concreteD, { base: 0.36, panels: [80, 60], drips: 0.12, dripLen: 40, lip: 0 });
      for (let x = 0; x < W; x += 160) P.block(x, 0, x + 18, G, MAT.concrete, { base: 0.42, lip: 0 });
      P.block(0, 150, W, 172, MAT.concrete, { base: 0.45 });
      for (const y of [184, 214, G - 120]) unTray(P, 0, W, y);
      for (let x = 20; x < W; x += 3) P.put(x, G - 2, (x >> 3) % 2 ? [220, 170, 30] : [24, 22, 18]);
    });
    // the transformer yard: four behind a fence, the gantry and busbars over them
    L.paint(240, G - 170, 1360, G, (P) => {
      for (let x = 240; x < 1360; x += 70) girder(P, x, G - 150, x + 70, G - 140, MAT.steelD, { step: 14 });
      for (const x of [240, 1350]) P.block(x, G - 150, x + 8, G, MAT.steelD, { base: 0.42, lip: 0 });
      [300, 560, 820, 1080].forEach((x, i) => { unTransformer(P, x, G, { seed: x, ramp: i % 2 ? UNMAT.green : R(['#10141a', '#202a36', '#36465a', '#7a90a8']) }); for (let k = 0; k < 3; k++) { const bx = x + 20 + k * 18; for (let y = G - 140; y < G - 96; y++) P.put(bx, y, [140, 120, 70]); } });
      for (const y of [G - 136, G - 132, G - 128]) for (let x = 250; x < 1350; x++) P.put(x, y, tone(MAT.copper, 0.7 - (y - G + 136) / 12));
      unFence(P, 250, 1350, G, 40);
      for (const x of [400, 900]) unSign(P, x, G - 30, 7, { bg: '#8a1a1a', seed: x });
    });
    // the arcs: blue-white light that stutters
    for (const x of [338, 616, 856, 1134]) { L.light(x, G - 100, 70, [0.6, 0.8, 1], 0.9, 1, { mode: 'bad', seed: x }); L.paint(x - 6, G - 104, x + 6, G - 94, (P) => { for (let k = 0; k < 9; k++) P.put(x - 4 + k, G - 99 + Math.round(Math.sin(k * 2.3) * 2), [200, 230, 255], 1); }); }
    // the generator hall: two sets, a walkway over them
    L.paint(1380, G - 200, 2080, G, (P) => { unGenerator(P, 1420, G, { rot: 0.2 }); unGenerator(P, 1760, G, { rot: 0.9, ramp: R(['#10141a', '#202a36', '#36465a', '#7a90a8']) }); });
    L.walk(1400, 2060, G - 120, 4, MAT.steelD); L.stairs(1380, G, 1460, G - 120); L.ladder(2050, G - 120, G);
    L.prop('locker', 1700, G - 120, { tier: 2, label: 'engineer\'s locker' }); L.spots.push([1600, G - 120], [1900, G - 120]);
    for (const x of [1460, 1800]) L.light(x, G - 60, 90, [0.5, 1, 0.7], 0.5);
    // the control desk under the mimic board, the switchgear
    L.paint(2120, G - 170, 2420, G, (P) => {
      P.block(2120, G - 160, 2420, G - 60, KMAT.blackglass, { base: 0.3 });
      for (let k = 0; k < 9; k++) { const y = G - 150 + k * 10; for (let x = 2130; x < 2410; x++) if (hash(x >> 4, k, 7) < 0.6) P.put(x, y, k % 3 ? [90, 255, 150] : [255, 200, 60], 0.8); for (let x = 2140 + (k * 37) % 240; x < 2420; x += 80) for (let j = 0; j < 10; j++) P.put(x, y + j, [90, 255, 150], 0.7); }
      for (let x = 2136; x < 2410; x += 16) P.put(x, G - 70, hash(x, 2, 3) < 0.2 ? [255, 60, 60] : [90, 255, 150], 1);
    });
    L.prop('deco', 2200, G, { art: () => desk({ col: '#2a3a2a' }), id: 'undesk1' }); L.prop('deco', 2320, G, { art: () => desk({ col: '#2a3a2a' }), id: 'undesk2' }); L.light(2260, G - 100, 120, [0.5, 1, 0.65], 0.7);
    L.npc({ name: 'Chief Engineer Wu', look: { skin: SKINS[0], hair: 'helmet', armor: '#e8e8e8', visor: '#3a3a3a', top: '#3a3a4a', coat: 'long', legs: '#2a2a2a', glasses: true }, x: 2260, y: G, face: -1, sched: [[0, 24, 2260, 'stand']], lines: ['Every light up there, tracer. Every single one. From this room.', 'Someone\'s been tapping our lines for a chrome clinic. You find them, you tell me first.', 'The board\'s older than the precinct. Never once gone dark.'] });
    for (const x of [2450, 2475, 2500, 2525, 2550]) L.prop('rack', x, G, { label: 'switchgear cabinet' });
    L.prop('locker', 2590, G, { tier: 2, label: 'fuse locker' });
    L.prop('ac', 1360, G, { label: 'cooling fan' }); L.prop('junk', 2100, G, { label: 'burnt-out switchgear' });
    for (const x of [200, 700, 1250, 2000, 2440]) L.tube(x, 176, 26, '#e8f4ff', 0.75);
    for (const x of [680, 1900]) L.prop('deco', x, G, { art: () => unFrontPipe(200, x), id: 'unfp' + x, front: 1 });
    kFoes(L, G, [['sentinel', 700, 400, 1200, G - 80], ['drone', 1250, 1000, 1350], ['spider', 1700, 1420, 2040, G - 120], ['turret', 2110, 2000, 2400, G - 100], ['gunner', 2470, 2420, 2590]]);
    L.spots.push([200, G], [450, G], [700, G], [950, G], [1200, G], [1550, G], [1950, G], [2260, G], [2500, G]);
    L.critter('rat', 200, W - 100, G, 2);
  },
}));
