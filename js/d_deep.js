'use strict';
// ---------------------------------------------------------------------------
// The Bowels: the bottom of the city, -400 m and down, where the Root lives.
// Half machine, half grown: cables like roots and veins, glowing violet and
// green, and whatever the city buried here being swallowed by it. Reached by
// the cage elevators. Each place is built by hand from the kit (kit.js) and the
// painters below.
// ---------------------------------------------------------------------------

// ---- the deep's own colors ---------------------------------------------------------
const DPMAT = {
  rock: R(['#0e0b14', '#1e1828', '#30263c', '#5e4c6a']),
  rockG: R(['#080c0a', '#121a14', '#1e2a20', '#3e5244']),
  cable: R(['#0e0a14', '#241c30', '#40324e', '#6a5a84', '#a898c4']),
  cableG: R(['#0a120e', '#1a2c22', '#2e4a38', '#5a8a68', '#9ac8a4']),
  flesh: R(['#140608', '#2e1014', '#4e1e22', '#8a4a44', '#c88a78']),
  bone: R(['#2a2620', '#5a5446', '#9a927c', '#e8e0c8']),
  ice: R(['#0e1c2a', '#24425a', '#5a8aa8', '#c8e8f8']),
  frost: R(['#1a2a38', '#3a5a72', '#8ab0c8', '#eef8ff']),
  vault: R(['#0a1218', '#16222e', '#26384a', '#6a8aa8']),
  ruin: R(['#1c1c1e', '#343432', '#525048', '#9a9282']),
  tileOld: R(['#18201c', '#2a3a32', '#46584c', '#a0b0a0']),
  sick: R(['#0e1404', '#1e2a08', '#3a4a10', '#a8c040']),
  cableL: R(['#1a1622', '#3a3248', '#5e5272', '#9a8cb4', '#d8d0ec']),
  cableLG: R(['#141e1a', '#2e463a', '#4e7260', '#86b49a', '#c8ecd8']),
};
const DP_VIOLET = [200, 120, 255], DP_GREEN = [90, 255, 150], DP_ICE = [150, 220, 255], DP_SICK = [190, 230, 70];

// ---- painters ---------------------------------------------------------------------
// a thick cable or root along a line of points, round and lit from the upper
// left; `glow` runs a pulsing vein down its middle, `rib` rings it, `r` may
// swell along it (a function of the distance)
function dpTube(P, pts, r, ramp, o = {}) {
  const S = [], seed = o.seed || 3; let len = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let k = 0; k < n; k++, len++) { const t = k / n; S.push([ax + (bx - ax) * t, ay + (by - ay) * t, len, (bx - ax) / n, (by - ay) / n]); } }
  const rad = (l) => (typeof r === 'function' ? r(l) : r);
  for (const [cx, cy, l] of S) {
    const rr = rad(l); if (!P.sees(cx - rr - 1, cy - rr - 1, cx + rr + 1, cy + rr + 1)) continue;
    const rib = o.rib && l % o.rib < 2;
    for (let dy = -Math.ceil(rr); dy <= rr; dy++) for (let dx = -Math.ceil(rr); dx <= rr; dx++) {
      const d = Math.hypot(dx, dy) / rr; if (d > 1) continue;
      const v = 0.62 - (dx * 0.45 + dy * 0.75) / rr * 0.32 - d * d * 0.3 + (rib ? -0.16 : 0) + (hash(Math.round(cx + dx), Math.round(cy + dy), seed) - 0.5) * 0.1;
      P.put(cx + dx, cy + dy, tone(ramp, clamp(v, 0, 1)));
    }
  }
  if (o.glow && o.nodes !== false) { const g = col3(o.glow); for (const [cx, cy, l] of S) if (l % 47 === 23 && hash(l, 3, seed) < 0.6) { const rr = Math.min(rad(l) - 1, 3); for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) if (dx * dx + dy * dy <= rr * rr) P.put(cx + dx, cy + dy, mixRgb(g, [255, 255, 255], 0.5 - Math.hypot(dx, dy) / (rr * 2 + 1)), 1); } }
  if (o.glow) { const g = col3(o.glow); for (const [cx, cy, l, ux, uy] of S) { const on = noise(l / 18, 0, seed + 7); if (on < (o.vein || 0.45)) continue; const k = clamp((on - 0.45) * 2.2, 0.3, 1); P.put(cx - uy * 0.5, cy + ux * 0.5, mixRgb(g, [255, 255, 255], k > 0.8 ? 0.4 : 0), k); } }
}
// a trunk of cables, thick as a tree, from the ceiling to the floor, its
// strands flaring out at both ends
function dpBundle(P, x, y0, y1, w, ramp, glow, seed) {
  const n = Math.max(3, Math.round(w / 6)), h = y1 - y0;
  for (let i = 0; i < n; i++) {
    const off = (i / (n - 1) - 0.5) * w, fl = (i / (n - 1) - 0.5) * w * 1.6, sw = Math.sin(i * 1.7 + seed) * 3;
    dpTube(P, [[x + fl, y0], [x + off + sw, y0 + h * 0.18], [x + off - sw, y0 + h * 0.5], [x + off + sw, y0 + h * 0.82], [x + fl * 1.2, y1 + 2]], 2.4 + hash(i, 1, seed) * 1.6, ramp, { glow: hash(i, 2, seed) < 0.4 ? glow : null, seed: seed + i, rib: 9 });
  }
}
// cables hanging from the ceiling in a curtain, swaying, some lit at the end
function dpCurtain(P, x0, x1, y, len, glow, seed) {
  for (let x = x0; x < x1; x += 2) {
    const l = len * (0.4 + hash(x, 1, seed) * 0.6), c = hash(x, 2, seed) < 0.5 ? [40, 32, 54] : [60, 50, 78];
    for (let j = 0; j < l; j++) P.put(x + Math.sin(j / 14 + x * 0.3) * 1.5, y + j, c);
    if (glow && hash(x, 3, seed) < 0.18) { const yy = y + l, xx = x + Math.sin(l / 14 + x * 0.3) * 1.5; P.put(xx, yy, col3(glow), 1); P.put(xx, yy + 1, mixRgb(col3(glow), [0, 0, 0], 0.4), 0.6); }
  }
}
// roots coming down out of the ceiling, thin, a few lit
function dpHangRoots(P, x0, x1, y, len, glow, seed) {
  for (let k = 0; k < (x1 - x0) / 22; k++) {
    const x = x0 + hash(k, 1, seed) * (x1 - x0), l = len * (0.3 + hash(k, 2, seed) * 0.7), pts = [[x, y]];
    for (let j = 1; j <= 4; j++) pts.push([x + Math.sin(j + k) * 6, y + l * j / 4]);
    dpTube(P, pts, (d) => Math.max(0.6, 2.4 - d / l * 2), DPMAT.cable, { glow: hash(k, 3, seed) < 0.4 ? glow : null, seed: seed + k, vein: 0.5 });
  }
}
// the back of the place: rock or old concrete, sweating, ribbed if grown
// over; a ceiling slab with drips; the light is low and colored
function dpBack(L, W, G, o = {}) {
  const wall = o.wall || DPMAT.rock, ceil = o.ceil || DPMAT.rock, seed = o.seed || 5, top = o.top || 54;
  L.block(0, 0, W, top, ceil, { base: 0.22, lip: 0, drips: 0.25, dripLen: 22, seed });
  L.paint(0, top, W, G, (P) => {
    P.area(0, top, W, G, wall, (x, y) => {
      let v = 0.3 + (noise(x / 70, y / 50, seed) - 0.5) * 0.18 + (noise(x / 9, y / 40, seed + 1) - 0.5) * 0.08 + (y - top) / (G - top) * 0.06;
      if (o.ribs) { const k = (x + Math.sin(y / 30 + x / 90) * 10) % o.ribs; if (k < 3) v += 0.08; else if (k < 5) v -= 0.06; }
      if (o.panels) { const px = x % o.panels[0], py = (y - top) % o.panels[1]; if (px < 1 || py < 1) v -= 0.08; }
      return v;
    });
    for (let x = 20; x < W; x += 37) if (hash(x, 9, seed) < 0.4) for (let y = top; y < top + 40 + hash(x, 10, seed) * 120; y++) P.tint(x, y, [4, 4, 6], 0.35);
  });
  L.dry.push([0, 0, W, L.h]);
}
// a junction box on a cable trunk: a steel case, lit tells, a warning stripe
function dpJunction(P, x, y, w, h, col) {
  P.block(x, y, x + w, y + h, MAT.steelD, { base: 0.45, panels: [w, 8] });
  for (let i = 0; i < w - 4; i += 3) P.put(x + 2 + i, y + 3, hash(i, y, x) < 0.6 ? col3(col) : [60, 20, 20], 1);
  for (let i = 0; i < w; i++) P.put(x + i, y + h - 2, ((i >> 1) % 2) ? [210, 160, 40] : [20, 18, 16]);
}
// a pool on the floor, lit from inside, bubbles at its skin
function dpPool(P, x0, x1, G, col, seed) {
  const c = col3(col);
  for (let x = x0; x < x1; x++) { const d = Math.min(x - x0, x1 - x) ; for (let y = G - 1; y < G + 8; y++) { if (d < (y - G + 2) * 2) continue; const v = 0.5 + (noise(x / 7, y / 2, seed) - 0.5) * 0.4; P.put(x, y, mixRgb(c, [6, 8, 4], 0.55 - v * 0.3 + (y - G) * 0.04), y < G + 1 ? 0.6 : 0.25); } }
  for (let k = 0; k < (x1 - x0) / 6; k++) { const bx = x0 + 3 + hash(k, 1, seed) * (x1 - x0 - 6), r = hash(k, 2, seed) < 0.3 ? 2 : 1; for (let a = 0; a < 6.3; a += 0.4) P.put(bx + Math.cos(a) * r, G - 2 + Math.sin(a) * r * 0.6, mixRgb(c, [255, 255, 255], 0.4), 0.8); }
}
// a peristaltic pipe: it swells and narrows, ribbed, as if it swallowed
function dpGutPipe(P, pts, r, seed) { dpTube(P, pts, (d) => r * (0.75 + 0.35 * Math.sin(d / 26 + seed) ** 2), DPMAT.flesh, { rib: 7, seed, glow: '#c8e040', vein: 0.62 }); }
// a maw in the wall: a ribbed round mouth the waste comes out of
function dpMaw(P, cx, cy, r, seed) {
  for (let y = -r - 6; y <= r + 6; y++) for (let x = -r - 6; x <= r + 6; x++) {
    const d = Math.hypot(x, y * 1.15), a = Math.atan2(y, x); if (d > r + 6) continue;
    let c;
    if (d < r * 0.55) c = mixRgb([10, 12, 4], [60, 70, 20], Math.max(0, 1 - d / (r * 0.55)) * 0.3);
    else { const rib = Math.sin(a * 14 + d * 0.3) > 0.3, v = 0.6 - (x * 0.4 + y * 0.6) / r * 0.3 - Math.abs(d - r * 0.8) / r * 0.6 + (rib ? -0.15 : 0); c = tone(DPMAT.flesh, clamp(v, 0, 1)); }
    P.put(cx + x, cy + y, c);
  }
  for (let k = 0; k < 12; k++) { const x = cx - r * 0.4 + hash(k, 1, seed) * r * 0.8, l = 6 + hash(k, 2, seed) * 30; for (let j = 0; j < l; j++) P.put(x, cy + r * 0.45 + j, mixRgb(DP_SICK, [20, 30, 0], j / l), 0.3); }
}
// a broken column: a stone shaft, its top snapped off ragged
function dpColumn(P, x, w, y0, G, seed) {
  const top = (xx) => y0 + noise(xx / 3, 0, seed) * 14;
  P.area(x, y0, x + w, G, DPMAT.ruin, (xx, y) => 0.45 - (xx - x) / w * 0.25 + ((y - y0) % 30 < 1 ? -0.15 : 0) + (noise(xx / 5, y / 8, seed) - 0.5) * 0.15, { inside: (xx, y) => y >= top(xx) });
  P.block(x - 4, G - 8, x + w + 4, G, DPMAT.ruin, { base: 0.5 });
}
// a frozen drone, stuck in ice on the floor
function dpFrozenDrone(P, x, G, seed) {
  P.area(x - 14, G - 9, x + 14, G, MAT.steelD, (xx, y) => 0.5 - (y - G + 9) / 14, { inside: (xx, y) => ((xx - x) / 11) ** 2 + ((y - G + 4) / 5) ** 2 < 1 });
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) P.put(x + s * (8 + i), G - 9 - i * 0.3, tone(MAT.steel, 0.5));
  P.put(x + 4, G - 5, [255, 50, 60], 0.3);
  P.area(x - 18, G - 12, x + 18, G, DPMAT.frost, (xx, y) => 0.55 + (noise(xx / 3, y / 3, seed) - 0.5) * 0.4, { inside: (xx, y) => y > G - 12 + Math.abs(xx - x) * 0.6 && hash(xx, y, seed) < 0.55 });
}
// icicles along an edge
function dpIcicles(P, x0, x1, y, len, seed) { for (let x = x0; x < x1; x += 3) { const l = len * hash(x, 1, seed); for (let j = 0; j < l; j++) { P.put(x, y + j, tone(DPMAT.ice, 0.8 - j / l * 0.5), j > l - 2 ? 0.4 : 0); if (j < l * 0.5) P.put(x + 1, y + j, tone(DPMAT.ice, 0.45)); } } }
// a vault door: a great round plug of steel, bolted, frosted over at the rim
function dpVaultDoor(P, cx, cy, r, seed) {
  for (let y = -r - 4; y <= r + 4; y++) for (let x = -r - 4; x <= r + 4; x++) {
    const d = Math.hypot(x, y); if (d > r + 4) continue;
    let v = 0.5 - (x * 0.4 + y * 0.7) / r * 0.25;
    if (d > r) v = 0.3; else if (d > r - 3) v = 0.7 - (x + y) / (r * 3); else if (Math.abs(d - r * 0.6) < 1) v -= 0.25; else if (d < 6) v = 0.75 - d / 12;
    let c = tone(DPMAT.vault, clamp(v, 0, 1));
    if (d < r + 3 && (y > r * 0.3 || d > r - 6) && hash(x + cx, y + cy, seed) < 0.35 + y / r * 0.3) c = tone(DPMAT.frost, 0.6 + hash(x, y, seed + 1) * 0.3);
    P.put(cx + x, cy + y, c);
  }
  for (let a = 0; a < 6.28; a += 0.52) { const bx = cx + Math.cos(a) * (r - 6), by = cy + Math.sin(a) * (r - 6); P.put(bx, by, tone(MAT.chrome, 0.8)); P.put(bx + 1, by + 1, tone(MAT.steelD, 0.2)); }
  for (let a = 0; a < 6.28; a += 1.57) for (let k = 0; k < 9; k++) P.put(cx + Math.cos(a) * k, cy + Math.sin(a) * k, tone(MAT.chrome, 0.7));
  P.put(cx + r * 0.7, cy - r * 0.7, [255, 60, 60], 1);
}
// a storage core: a tall glass cylinder, data in it as stacked cold light
function dpCore(P, x, y0, G, seed) {
  P.block(x - 2, y0 - 6, x + 18, y0, MAT.steel, { base: 0.55 }); P.block(x - 2, G - 10, x + 18, G, MAT.steel, { base: 0.45 });
  for (let y = y0; y < G - 10; y++) for (let i = 0; i < 16; i++) { const lit = (y + Math.floor(hash(i >> 2, y >> 2, seed) * 4)) % 5 < 2 && i > 2 && i < 13; P.put(x + i, y, lit ? mixRgb(DP_ICE, [255, 255, 255], hash(i, y, seed) * 0.4) : tone(DPMAT.vault, 0.3 + (i < 3 ? 0.3 : 0) - (i > 12 ? 0.1 : 0)), lit ? 0.5 : 0); }
  for (let y = y0; y < G - 10; y++) if (hash(x, y, seed) < 0.5) P.put(x + (hash(y, 2, seed) < 0.5 ? 0 : 15), y, tone(DPMAT.frost, 0.85));
}
// rubble heaped on the floor, and a ruin's ragged wall
function dpRubble(P, x0, x1, G, h, ramp, seed) { heap(P, x0, x1, G, h, ramp, seed % 13); for (let k = 0; k < (x1 - x0) / 8; k++) { const bx = x0 + hash(k, 1, seed) * (x1 - x0), by = G - 2 - hash(k, 2, seed) * h * 0.6; P.block(bx, by, bx + 3 + hash(k, 3, seed) * 6, by + 3, ramp, { base: 0.5 }); } }
// the Root's growth at eye level: roots crawling the floor and up the wall,
// glowing spores on the stone
function dpGrowth(P, x0, x1, G, glow, seed, o = {}) {
  const g = col3(glow);
  for (let k = 0; k < (x1 - x0) / 140; k++) { const a = x0 + hash(k, 1, seed) * (x1 - x0), b = a + 60 + hash(k, 2, seed) * 120; dpTube(P, [[a, G - 2], [(a + b) / 2, G - 5 - hash(k, 3, seed) * 4], [b, G - 2]], 2.5 + hash(k, 4, seed) * 2, hash(k, 5, seed) < 0.5 ? DPMAT.cable : DPMAT.cableG, { glow, seed: seed + k, vein: 0.5 }); }
  for (let k = 0; k < (x1 - x0) / 110; k++) { const x = x0 + hash(k, 6, seed) * (x1 - x0), h = 60 + hash(k, 7, seed) * (o.climb || 110), pts = [[x, G]]; for (let j = 1; j <= 5; j++) pts.push([x + Math.sin(j * 1.3 + k) * 8, G - h * j / 5]); dpTube(P, pts, (d) => Math.max(0.8, 3 - d / h * 2.4), DPMAT.cable, { glow, seed: seed + 40 + k, vein: 0.5, nodes: false }); }
  for (let k = 0; k < (x1 - x0) / 5; k++) { const x = x0 + hash(k, 8, seed) * (x1 - x0), y = G - 20 - hash(k, 9, seed) * (o.spores || 160); if (noise(x / 60, y / 40, seed) < 0.55) continue; P.put(x, y, mixRgb(g, [255, 255, 255], hash(k, 10, seed) * 0.4), 0.6 + hash(k, 11, seed) * 0.4); }
}
// a hermit, a local who stayed
function dpHermit(name, x, G, lines, look = {}) { return { name, look: Object.assign({ skin: '#c8c0b0', hair: 'long', hairCol: '#d8d8d0', top: '#2a2620', coat: 'long', legs: '#1e1a14', tall: 0.9, mask: '#2a3a2a' }, look), x, y: G, face: 1, sched: [[0, 24, x, 'stand']], lines }; }
// a hermit's camp: a tarp lean-to, a fire in a drum, a bedroll
function dpCamp(L, x, G, seed) {
  L.paint(x - 50, G - 50, x + 50, G, (P) => {
    P.area(x - 46, G - 44, x + 10, G, KMAT.tarp, (xx, y) => 0.5 - (y - G + 44) / 80 + ((xx - x) % 7 === 0 ? -0.1 : 0), { inside: (xx, y) => y > G - 44 + (xx - x + 46) * 0.25 && y > G - 44 + (x + 10 - xx) * 0.0 });
    for (let y = G - 46; y < G; y++) P.put(x + 10, y, tone(MAT.wood, 0.5));
    P.block(x - 40, G - 4, x - 12, G, KMAT.tarpR, { base: 0.4 });
  });
  L.prop('deco', x + 26, G, { art: DECO.barrel(), id: 'dpcamp' + x }); L.fire(x + 26, G - 15, 70, 0.9);
}

// ---- The Bowels: the hub, and the Root's chamber at the end ---------------------
LEVELS.bowels = { name: 'The Bowels', depth: '-400 m', meters: -400, mapX: 500, tier: 5, hub: true, label: 'The bottom', blurb: 'The bottom of the city, where the cables turn into roots and the Root thinks in the dark.', make: () => district({
  id: 'bowels', name: 'The Bowels', tier: 5, W: 3500, sky: false, transit: 'elevator', floor: DPMAT.rock, amb: [0.25, 0.2, 0.31],
  build(L, G) {
    L.spawns.elevator = [140, G];
    dpBack(L, 3500, G, { wall: DPMAT.rock, ribs: 60, seed: 41 });
    // the old foundations: pillars of the city above, roots wrapped round them
    L.paint(0, 54, 2400, G, (P) => {
      for (const x of [230, 760, 1380, 1960]) { P.block(x, 54, x + 46, G, MAT.concrete, { base: 0.3, panels: [46, 40], drips: 0.3, dripLen: 60 }); for (let k = 0; k < 3; k++) dpTube(P, [[x - 10 + k * 22, 54], [x + 40 - k * 10, 160], [x - 6 + k * 18, 280], [x + 30 - k * 6, G + 2]], 3 + k, DPMAT.cable, { glow: k === 1 ? DP_VIOLET : DP_GREEN, seed: x + k, rib: 10, vein: 0.5 }); }
      dpHangRoots(P, 0, 2400, 54, 210, DP_VIOLET, 3); dpGrowth(P, 180, 2400, G, DP_VIOLET, 4); dpGrowth(P, 300, 2300, G, DP_GREEN, 5, { climb: 60 });
    });
    for (const x of [253, 783, 1403, 1983]) L.light(x, G - 60, 70, [0.75, 0.55, 1], 0.45);
    // the Hermit's camp by the elevator
    dpCamp(L, 560, G, 1);
    L.prop('deco', 621, G, { art: () => crate({ w: 12, h: 15, col: '#7a6a48' }), id: 'hermitcrate', seat: 'side', seatW: 5 }); // (what he sits on)
    L.npc(dpHermit('The Hermit', 620, G, ['Nobody comes down here on purpose.', 'Listen. The hum. That\'s the Root, thinking.', 'The girl with the drawings went past me. She was humming along.']));
    // a chasm of cables, a walkway over it
    L.paint(860, 54, 1320, G, (P) => { dpBundle(P, 960, 54, G, 34, DPMAT.cable, DP_VIOLET, 11); dpBundle(P, 1200, 54, G, 26, DPMAT.cableG, DP_GREEN, 12); dpCurtain(P, 1000, 1170, 54, 120, DP_GREEN, 13); });
    L.walk(880, 1320, G - 110, 5, MAT.steelD); L.stairs(880, G, 960, G - 110); L.ladder(1300, G - 110, G);
    L.spots.push([1150, G - 110]);
    for (const x of [960, 1200]) L.light(x, G - 160, 90, x === 960 ? [0.7, 0.4, 1] : [0.3, 1, 0.6], 0.6);
    // a buried maintenance station: a lit booth, dead terminals, racks
    L.paint(1420, 220, 1900, G, (P) => {
      P.block(1440, 230, 1880, G, MAT.steelD, { base: 0.3, panels: [40, 30], drips: 0.25, dripLen: 40 });
      kFill(P, 1480, 270, 1600, 320, '#0a1a14'); for (let x = 1484; x < 1596; x += 2) for (let y = 274; y < 316; y++) if (hash(x, y, 4) < 0.15) P.put(x, y, DP_GREEN, 0.6);
      sign(P, 1640, 250, 8, '#3aff80', { dead: 0.4, seed: 4 });
      dpTube(P, [[1420, 230], [1520, 236], [1640, 228], [1900, 240]], 6, DPMAT.cable, { glow: DP_VIOLET, rib: 8, seed: 21 });
      dpRubble(P, 1820, 1900, G, 24, DPMAT.rock, 5);
    });
    L.light(1540, 300, 80, [0.3, 1, 0.6], 0.6, 1, { mode: 'bad', seed: 7 });
    for (const x of [1500, 1560]) L.prop('rack', x, G, { label: 'server rack' }); L.prop('wreck', 1780, G, { label: 'dead drone' }); L.prop('junk', 1620, G, { label: 'junk pile' });
    L.walk(1460, 1860, G - 96, 4, MAT.steelD); L.ladder(1850, G - 96, G); L.spots.push([1650, G - 96]);
    // the roots thicken toward the chamber
    L.paint(2000, 54, 2400, G, (P) => { for (let k = 0; k < 5; k++) dpTube(P, [[2000 + k * 50, 54], [2100 + k * 40, 180], [2200 + k * 30, 300], [2300 + k * 20, G + 2]], 4 + k, k % 2 ? DPMAT.cable : DPMAT.cableG, { glow: k % 2 ? DP_VIOLET : DP_GREEN, seed: 30 + k, rib: 11 }); });
    L.light(2200, G - 100, 140, [0.7, 0.4, 1], 0.6);
    // the Root's chamber
    arena(L, 2400, 3420, G, 'chamber');
    L.paint(2400, 40, 3420, G, (P) => {
      dpHangRoots(P, 2420, 3400, 52, 200, DP_VIOLET, 9); for (const x of [2480, 3340]) dpBundle(P, x, 52, G, 30, DPMAT.cable, DP_VIOLET, x);
      // the heart: every root in the chamber reaching for the place the Root hangs
      for (let k = 0; k < 14; k++) { const a = -Math.PI * 0.95 + k / 13 * Math.PI * 0.9, ex = 2900 + Math.cos(a) * 520, ey = G - 90 + Math.sin(a) * 300; dpTube(P, [[ex, Math.max(50, ey)], [2900 + Math.cos(a) * 260, G - 90 + Math.sin(a) * 150 + 20], [2900 + Math.cos(a) * 40, G - 90 + Math.sin(a) * 24]], (d) => Math.max(2, 7 - d / 120), k % 2 ? DPMAT.cable : DPMAT.cableG, { glow: k % 2 ? DP_VIOLET : DP_GREEN, rib: 10, seed: 700 + k }); }
      for (const s of [-1, 1]) dpTube(P, [[2900 + s * 500, G - 2], [2900 + s * 200, G - 30], [2900 + s * 40, G - 70]], 6, DPMAT.cable, { glow: DP_VIOLET, rib: 9, seed: 780 + s });
      dpGrowth(P, 2440, 3400, G, DP_VIOLET, 11, { spores: 260 });
    });
    L.light(2900, G - 90, 260, [0.75, 0.45, 1], 0.9);
    L.spots.push([700, G], [1250, G], [1700, G], [2100, G], [2600, G], [3000, G], [3200, G]);
    L.critter('rat', 300, 2300, G, 3); L.drips.push({ x: 1000, y0: 56, y1: G }, { x: 2150, y0: 56, y1: G });
  },
}) };

// ---- Cable Run: where every cable in the city comes down ------------------------
addDistrict('d_cables', 'Cable Run', 5, -420, 180, 'A tunnel where every cable in the city comes down: bundles thick as trees, curtains of wire, fiber glowing in the dark.', 'Cable tunnel', () => district({
  id: 'd_cables', name: 'Cable Run', tier: 5, W: 2600, sky: false, transit: 'elevator', floor: MAT.steelD, amb: [0.23, 0.2, 0.29],
  local: dpHermit('Linesman', 260, 386, ['Every call, every screen, every lie up there runs through here.', 'Touch the green ones and you hear people talking. Don\'t.', 'Somebody\'s been drawing on the junction boxes. Little pictures. Birds.'], { hair: 'cap', capCol: '#c8a030', mask: null, top: '#4a4020', coat: 'jacket' }),
  build(L, G) {
    dpBack(L, 2600, G, { wall: R(['#08060c', '#120e18', '#1e1828', '#3a3048']), panels: [80, 60], seed: 51 });
    // the trunks, the curtains between them, junction boxes on the trunks
    L.paint(0, 50, 2600, G, (P) => {
      for (const [x, w, g] of [[320, 30, DP_GREEN], [520, 20, DP_VIOLET], [700, 44, DP_VIOLET], [1060, 26, DP_GREEN], [1260, 18, DP_VIOLET], [1480, 50, DP_VIOLET], [1700, 22, DP_GREEN], [1900, 34, DP_GREEN], [2100, 20, DP_VIOLET], [2300, 40, DP_VIOLET]]) dpBundle(P, x, 54, G, w, x % 3 ? DPMAT.cableL : DPMAT.cableLG, g, x);
      for (const [a, b] of [[380, 640], [760, 1000], [1120, 1420], [1560, 1840], [1960, 2240]]) dpCurtain(P, a, b, 54, 200 + (a % 5) * 20, a % 2 ? DP_GREEN : DP_VIOLET, a);
      // cable trays along the wall, heavy runs in them feeding the trunks, sagging fiber across
      for (const ty of [G - 200, G - 150]) { for (let x = 0; x < 2600; x++) { P.put(x, ty, tone(MAT.steel, 0.6)); P.put(x, ty + 1, tone(MAT.steelD, 0.35)); if (x % 40 < 2) for (let j = 2; j < 10; j++) P.put(x, ty + j, tone(MAT.steelD, 0.4)); } for (let k = 0; k < 4; k++) dpTube(P, [[0, ty - 3 - k * 3], [2600, ty - 3 - k * 3]], 1.6, k % 2 ? DPMAT.cableL : DPMAT.cableLG, { glow: k === 1 ? (ty % 2 ? DP_VIOLET : DP_GREEN) : null, seed: ty + k, nodes: false, vein: 0.55 }); }
      for (let k = 0; k < 10; k++) { const x = k * 260 + 40; dpTube(P, [[x, G - 196], [x + 130, G - 140 + (k % 3) * 10], [x + 260, G - 196]], 2.2, k % 2 ? DPMAT.cableL : DPMAT.cableLG, { glow: k % 2 ? DP_VIOLET : DP_GREEN, seed: 900 + k }); }
      for (let k = 0; k < 13; k++) { const x = k * 200 + 10; dpTube(P, [[x, G - 150], [x + 100, G - 90 - (k % 3) * 12], [x + 200, G - 150]], 3.4, k % 2 ? DPMAT.cableL : DPMAT.cableLG, { glow: k % 3 === 0 ? DP_GREEN : null, seed: 950 + k, rib: 8 }); }
      for (const [a, b] of [[440, 600], [1600, 1760]]) for (let k = 0; k < 3; k++) dpTube(P, [[a + k * 6, G - 3 - k * 3], [b - k * 6, G - 3 - k * 3]], 3, DPMAT.cableLG, { seed: a + k, rib: 6 });
      dpGrowth(P, 200, 2600, G, DP_GREEN, 52, { climb: 50 });
      for (const [x, y] of [[680, G - 110], [1460, G - 130], [2280, G - 100], [1040, G - 90]]) dpJunction(P, x, y, 26, 18, '#3aff80');
      // the cart track along the floor
      for (let x = 0; x < 2600; x++) { P.put(x, G - 2, tone(MAT.chrome, 0.6)); P.put(x, G - 1, tone(MAT.steelD, 0.3)); if (x % 12 < 3) P.put(x, G - 3, tone(MAT.wood, 0.35)); }
    });
    for (const [x, c] of [[320, [0.3, 1, 0.6]], [700, [0.7, 0.4, 1]], [1060, [0.3, 1, 0.6]], [1480, [0.7, 0.4, 1]], [1900, [0.3, 1, 0.6]], [2300, [0.7, 0.4, 1]]]) L.light(x, G - 140, 110, c, 0.55);
    for (const [x, y] of [[693, 280], [1473, 260], [2293, 290], [1053, 300]]) L.light(x, y, 30, [0.4, 1, 0.6], 0.5, 1, { mode: 'bad', seed: x });
    // the maintenance cart, parked on the track
    L.paint(1180, G - 30, 1260, G - 2, (P) => { P.block(1184, G - 22, 1256, G - 6, rp('#c8a030', 7), { base: 0.5, panels: [24, 16] }); for (let i = 0; i < 72; i++) P.put(1184 + i, G - 12, ((i >> 2) % 2) ? [20, 18, 16] : [210, 160, 40]); for (const wx of [1194, 1246]) P.area(wx - 4, G - 10, wx + 4, G - 2, MAT.steelD, (x, y) => 0.6 - Math.hypot(x - wx, y - G + 6) / 6, { inside: (x, y) => Math.hypot(x - wx, y - G + 6) < 4.5 }); P.block(1238, G - 30, 1254, G - 22, MAT.steel, { base: 0.5 }); kFill(P, 1241, G - 28, 1251, G - 24, '#ffd890', 0.6); });
    L.light(1246, G - 26, 50, [1, 0.85, 0.5], 0.6);
    for (let x = 220; x < 2600; x += 180) L.light(x, G - 60, 120, (x / 180) % 2 ? [0.55, 0.4, 0.9] : [0.35, 0.85, 0.6], 0.45);
    // gantries between the trunks, ladders up
    L.walk(360, 700, G - 100, 4, MAT.steelD); L.ladder(370, G - 100, G); L.walk(740, 1040, G - 160, 4, MAT.steelD); L.stairs(690, G - 100, 760, G - 160);
    L.walk(1520, 1880, G - 110, 4, MAT.steelD); L.ladder(1870, G - 110, G); L.walk(1940, 2280, G - 70, 4, MAT.steelD); L.ladder(1950, G - 70, G);
    
    L.prop('wreck', 520, G, { label: 'dead drone' }); L.prop('rack', 1620, G - 110, { label: 'patch rack' }); L.prop('junk', 2050, G, { label: 'cable offcuts' }); L.prop('rack', 1350, G, { label: 'patch rack' });
    L.spots.push([500, G], [520, G - 100], [900, G - 160], [1250, G], [1350, G], [1700, G - 110], [2000, G], [2100, G - 70], [2400, G], [800, G]);
    L.critter('rat', 200, 2500, G, 3); L.drips.push({ x: 1600, y0: 56, y1: G });
  },
}));

// ---- Cooling Vaults: the city's memory, kept cold ------------------------------
addDistrict('d_vaults', 'Cooling Vaults', 5, -430, 360, 'The city\'s memory kept cold: frosted vaults of storage cores, ice, and the drones that froze tending them.', 'Frozen data vaults', () => district({
  id: 'd_vaults', name: 'Cooling Vaults', tier: 5, W: 2300, sky: false, transit: 'elevator', floor: R(['#1a2a38', '#3a5a72', '#6a8aa8', '#c8e0f0']), amb: [0.21, 0.26, 0.34],
  local: dpHermit('Archivist', 260, 386, ['It\'s the city\'s memory, kept cold. Every face it ever saw.', 'Breath freezes on the racks. Mind the ice.', 'Something lives in the vents. Something warm.'], { hair: 'hood', top: '#3a4a5a', mask: '#8ab0c8' }),
  build(L, G) {
    dpBack(L, 2300, G, { wall: DPMAT.vault, ceil: DPMAT.vault, panels: [60, 40], seed: 61 });
    L.paint(0, 50, 2300, G, (P) => {
      dpIcicles(P, 0, 2300, 54, 18, 3);
      // vault after vault: a round door, cores either side, frost over all of it
      for (const vx of [420, 1100, 1800]) { P.block(vx - 70, 120, vx + 70, G, DPMAT.vault, { base: 0.35, panels: [140, 30] }); dpVaultDoor(P, vx, G - 60, 50, vx); dpIcicles(P, vx - 70, vx + 70, 120, 10, vx); }
      for (const cx of [560, 620, 680, 860, 920, 1240, 1300, 1560, 1620, 1940, 2000, 2060]) dpCore(P, cx, 150, G, cx);
      // ice on the floor
      for (let x = 0; x < 2300; x++) { const h = 2 + Math.floor(noise(x / 30, 0, 9) * 5); for (let y = G - h; y < G; y++) P.put(x, y, tone(DPMAT.frost, 0.55 + (y === G - h ? 0.3 : 0) + (noise(x / 4, y, 2) - 0.5) * 0.2)); }
      for (const x of [770, 1450, 2180]) dpFrozenDrone(P, x, G, x);
      // the cooling pipes overhead, frosted
      pipe(P, 0, 84, 2300, 96, DPMAT.ice, { joints: 50 }); pipe(P, 0, 100, 2300, 106, MAT.steelD, { joints: 40 });
    });
    for (const vx of [420, 1100, 1800]) { L.light(vx, G - 60, 110, [0.6, 0.85, 1], 0.6); L.light(vx + 35, G - 95, 24, [1, 0.25, 0.25], 0.6, 1, { mode: 'bad', seed: vx }); }
    for (const cx of [590, 890, 1270, 1590, 1970]) L.light(cx + 8, G - 120, 80, [0.55, 0.85, 1], 0.6);
    for (const x of [300, 1000, 1700, 2200]) L.vents.push({ x, y: G - 4, kind: 'steam' });
    // catwalks over the cores
    L.walk(540, 960, G - 150, 4, MAT.steel); L.ladder(550, G - 150, G); L.walk(1220, 1660, G - 120, 4, MAT.steel); L.stairs(1170, G, 1240, G - 120); L.walk(1920, 2120, G - 160, 4, MAT.steel); L.ladder(2110, G - 160, G);
    
    for (const x of [500, 1180, 1880]) L.prop('rack', x, G, { label: 'memory rack' }); L.prop('wreck', 1460, G, { label: 'frozen drone' }); L.prop('wreck', 780, G, { label: 'frozen drone' });
    L.spots.push([500, G], [720, G - 150], [980, G], [1300, G], [1450, G - 120], [1600, G], [1950, G], [2020, G - 160], [2200, G], [850, G]);
    L.critter('rat', 300, 2200, G, 1);
  },
}));

// ---- The Gut: where the waste ends up, and something digests it -----------------
addDistrict('d_gut', 'The Gut', 5, -450, 680, 'Where the city\'s waste ends up and something digests it: swallowing pipes, bubbling pools, the ferals\' nests.', 'Waste digesters', () => district({
  id: 'd_gut', name: 'The Gut', tier: 5, W: 2400, sky: false, transit: 'elevator', floor: R(['#0e0c08', '#1e1a10', '#2e2a1a', '#5a523a']), amb: [0.25, 0.27, 0.17],
  local: dpHermit('Scavenger', 260, 386, ['Everything that falls down the city ends here. Everything.', 'The pipes swallow. Hear them? Gulp. Gulp.', 'Don\'t drink from the pools. The ferals did. Look at them.'], { hair: 'bald', top: '#3a3a20', mask: '#5a5a3a' }),
  build(L, G) {
    dpBack(L, 2400, G, { wall: R(['#0c0a06', '#1a1610', '#2a2418', '#4a4430']), ribs: 40, seed: 71 });
    L.paint(0, 50, 2400, G, (P) => {
      // the digesting pipes: in from the ceiling, along the wall, down into the pools
      dpGutPipe(P, [[0, G - 150], [400, G - 136], [700, G - 156], [1000, G - 130], [1400, G - 152], [1800, G - 134], [2400, G - 150]], 13, 5);
      dpGutPipe(P, [[1100, G - 120], [1250, G - 140], [1500, G - 118], [1700, G - 150], [2000, G - 126]], 9, 6);
      dpMaw(P, 400, G - 86, 52, 7); dpRubble(P, 330, 480, G, 22, DPMAT.bone, 8);
      for (const x of [520, 1240, 1960]) dpGutPipe(P, [[x, 54], [x + 10, 150], [x - 10, 260], [x + 6, G]], 11, x);
      dpGutPipe(P, [[200, 54], [300, 200], [380, 250]], 8, 7);
      for (const [a, b] of [[600, 760], [1320, 1500], [2040, 2200]]) dpPool(P, a, b, G, '#a8d040', a);
      // bone-white scrap heaped, ribs of something
      for (const [a, b] of [[860, 1060], [1600, 1840]]) { dpRubble(P, a, b, G, 40, DPMAT.bone, a); for (let k = 0; k < 5; k++) { const rx = a + 20 + k * 30; for (let t = 0; t < 3.1; t += 0.05) P.put(rx + Math.cos(t) * 14, G - 30 - Math.sin(t) * 20, tone(DPMAT.bone, 0.7)); } }
    });
    for (const [a, b] of [[600, 760], [1320, 1500], [2040, 2200]]) { L.light((a + b) / 2, G - 10, 110, [0.75, 0.95, 0.3], 0.7, 1, { mode: 'fire', seed: a }); for (let x = a + 20; x < b; x += 50) L.vents.push({ x, y: G - 4, kind: 'steam' }); L.wet.push({ y: G - 1, x0: a, x1: b, depth: 10, k: 0.5 }); }
    for (const x of [520, 1240, 1960]) L.light(x, 200, 80, [0.8, 0.9, 0.3], 0.4);
    // the ferals' nests: rags, a fire, a cache
    for (const x of [960, 1720]) { L.prop('deco', x + 80, G, { art: DECO.barrel(), id: 'dpgn' + x }); L.fire(x + 80, G - 15, 70, 0.9); }
    // platforms over the pools
    L.walk(560, 800, G - 70, 5, MAT.rust); L.ladder(790, G - 70, G); L.walk(1280, 1540, G - 90, 5, MAT.rust); L.stairs(1220, G, 1290, G - 90); L.walk(2000, 2240, G - 70, 5, MAT.rust); L.ladder(2010, G - 70, G);
    L.walk(1100, 1300, G - 170, 4, MAT.steelD); L.ladder(1290, G - 170, G - 90);
     
    L.prop('junk', 900, G, { label: 'bone scrap' }); L.prop('junk', 1650, G, { label: 'bone scrap' }); L.prop('wreck', 1880, G, { label: 'half-eaten drone' }); L.prop('ac', 450, G, { label: 'pump' });
    L.spots.push([480, G], [680, G - 70], [1000, G], [1200, G - 170], [1400, G - 90], [1580, G], [1900, G], [2100, G - 70], [2300, G], [820, G]);
    L.critter('rat', 200, 2300, G, 4);
  },
}));

// ---- Old Roots: the first city's foundations, swallowed ------------------------
addDistrict('d_roots', 'Old Roots', 5, -460, 860, 'The oldest buried things, a station and the footings of the first towers, with the Root\'s cables pouring through them.', 'Buried ruins', () => district({
  id: 'd_roots', name: 'Old Roots', tier: 5, W: 2200, sky: false, transit: 'elevator', floor: DPMAT.ruin, amb: [0.23, 0.22, 0.29],
  local: dpHermit('Pilgrim', 260, 386, ['The first city is under the first city. And under that, this.', 'The shrine was here before the towers. The roots came to it. Like they were praying.', 'Leave an offering. A coin, a cable. It knows.'], { hair: 'hood', top: '#5a4a3a' }),
  build(L, G) {
    dpBack(L, 2200, G, { wall: DPMAT.ruin, ceil: DPMAT.rock, panels: [24, 12], seed: 81 });
    L.paint(0, 50, 2200, G, (P) => {
      // the old station: a tiled wall, a name plate, clocks, the platform over the old track bed
      P.block(320, G - 166, 820, G, DPMAT.tileOld, { base: 0.4, panels: [6, 6], drips: 0.3, dripLen: 40 });
      P.block(480, G - 156, 640, G - 138, KMAT.cream, { base: 0.5 }); for (let i = 0; i < 7; i++) for (const [a2, b2] of GLYPHS[(i * 5 + 3) % GLYPHS.length]) kFill(P, 488 + i * 21 + a2 * 2, G - 153 + b2 * 2, 490 + i * 21 + a2 * 2, G - 151 + b2 * 2, '#2a2014');
      for (const x of [380, 760]) { const cy = G - 142; P.area(x - 9, cy - 9, x + 9, cy + 9, MAT.chrome, (xx, y) => 0.7 - Math.hypot(xx - x, y - cy) / 14, { inside: (xx, y) => Math.hypot(xx - x, y - cy) < 9 }); kFill(P, x - 6, cy - 6, x + 7, cy + 7, '#d8d0b8'); for (let k = 0; k < 6; k++) P.put(x + k * 0.5, cy - k, [30, 20, 20]); for (let k = 0; k < 4; k++) P.put(x + k, cy, [30, 20, 20]); }
      for (const x of [400, 540, 680]) { P.block(x, G - 108, x + 70, G - 72, KMAT.cream, { base: 0.45 }); P.area(x + 3, G - 105, x + 67, G - 75, rp(['#5a3a4a', '#3a4a5a', '#5a5a3a'][x % 3], 6), (xx, y) => 0.3 + noise(xx / 6, y / 6, x) * 0.4); }
      P.block(320, G - 60, 820, G - 54, MAT.concrete, { base: 0.5 }); for (let x = 320; x < 820; x++) P.put(x, G - 60, ((x >> 2) % 2) ? [200, 160, 40] : [30, 26, 20]);
      kFill(P, 320, G - 54, 820, G, '#0a0a0c'); for (let x = 320; x < 820; x++) { P.put(x, G - 8, tone(MAT.rust, 0.5)); P.put(x, G - 20, tone(MAT.rust, 0.45)); if (x % 10 < 3) P.put(x, G - 6, tone(MAT.wood, 0.3)); }
      for (const x of [440, 620]) { P.block(x, G - 72, x + 40, G - 68, MAT.wood, { base: 0.5 }); for (const lx of [x + 3, x + 35]) P.block(lx, G - 68, lx + 2, G - 60, MAT.steelD, { base: 0.4, lip: 0 }); }
      // the footings of the first towers: huge concrete feet, rebar out of their tops
      for (const x of [960, 1560]) { P.block(x, G - 120, x + 120, G, MAT.concrete, { base: 0.36, panels: [40, 30], drips: 0.3, dripLen: 40 }); for (let k = 0; k < 8; k++) for (let j = 0; j < 20; j++) P.put(x + 8 + k * 14 + j * 0.2, G - 120 - j, tone(MAT.rust, 0.5)); }
      // broken columns, rubble
      for (const [x, y] of [[880, G - 130], [1150, G - 100], [1320, G - 140], [1720, G - 110]]) dpColumn(P, x, 16, y, G, x);
      dpRubble(P, 1240, 1420, G, 30, DPMAT.ruin, 4); dpRubble(P, 300, 360, G, 20, DPMAT.ruin, 6);
      // the roots, pouring through cracks in the ceiling and the walls
      for (const [x, k] of [[420, 0], [760, 1], [1020, 2], [1280, 3], [1620, 4], [1900, 5]]) dpTube(P, [[x, 54], [x + 30, 140], [x - 20, 240], [x + 10, G + 2]], 5 + (k % 3) * 2, k % 2 ? DPMAT.cable : DPMAT.cableG, { glow: k % 2 ? DP_VIOLET : DP_GREEN, rib: 12, seed: x });
      dpHangRoots(P, 0, 2200, 54, 200, DP_VIOLET, 5); dpGrowth(P, 200, 2200, G, DP_VIOLET, 83); dpGrowth(P, 300, 1800, G, DP_GREEN, 84, { climb: 70 });
    });
    // the buried shrine: its gate half under the rubble, roots round its hall
    bTorii(L, 1780, 1840, G, 54); bToro(L, 1860, G);
    bTemple(L, 1900, 2140, G, { h: 52, base: 10, roofH: 30, lit: true });
    L.paint(1760, 50, 2200, G, (P) => { dpRubble(P, 1770, 1850, G, 16, DPMAT.ruin, 9); for (const x of [1920, 2120]) dpTube(P, [[x, 54], [x + 20, 200], [x - 10, 300], [x + 4, G - 2]], 6, DPMAT.cable, { glow: DP_VIOLET, rib: 10, seed: x }); });
    for (const [x, c] of [[420, [0.3, 1, 0.6]], [760, [0.7, 0.4, 1]], [1020, [0.3, 1, 0.6]], [1280, [0.7, 0.4, 1]], [1620, [0.3, 1, 0.6]], [1900, [0.7, 0.4, 1]]]) L.light(x, G - 120, 100, c, 0.5);
    L.light(560, G - 120, 110, [1, 0.85, 0.6], 0.7, 1, { mode: 'bad', seed: 3 }); L.light(400, G - 130, 60, [1, 0.85, 0.6], 0.5); for (const x of [1020, 1620]) L.light(x, G - 80, 90, [0.85, 0.8, 1], 0.45);
    // up onto the footings and the old platform
    L.ways.push({ x0: 320, y0: G - 60, x1: 820, y1: G - 60 }); L.stairs(250, G, 330, G - 60);
    L.walk(960, 1080, G - 120, 5, MAT.concreteD); L.ladder(1070, G - 120, G); L.walk(1560, 1680, G - 120, 5, MAT.concreteD); L.ladder(1570, G - 120, G);
     
    L.prop('junk', 1300, G, { label: 'rubble' }); L.prop('wreck', 900, G, { label: 'old maintenance drone' }); L.prop('junk', 1480, G, { label: 'rubble' });
    L.spots.push([880, G], [600, G - 60], [900, G], [1020, G - 120], [1200, G], [1450, G], [1620, G - 120], [1700, G], [2000, G], [1300, G]);
    L.critter('rat', 300, 2100, G, 2); L.drips.push({ x: 1100, y0: 56, y1: G }, { x: 1700, y0: 56, y1: G });
  },
}));
