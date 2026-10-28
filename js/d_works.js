'use strict';
// ---------------------------------------------------------------------------
// The Works: heavy industry far under the city, reached by the lift cages.
// The hub (the workers' floor, the Foreman's crane hall), Pump Hall Seven,
// the Foundry, the Server Farm and the Coolant Vats, each built by hand from
// the kit (kit.js) and the industrial painters below.
// ---------------------------------------------------------------------------

// ---- industrial painters ------------------------------------------------------
// hazard stripes, yellow and black, slanting
function wkStripes(P, x0, y0, x1, y1) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) P.put(x, y, ((x + y) >> 2) % 2 ? [210, 160, 40] : [26, 22, 18]); }
// a round gauge with a needle
function wkGauge(P, cx, cy, r, v = 0.6) {
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) { const d = Math.hypot(x, y); if (d <= r - 1) P.put(cx + x, cy + y, [214, 206, 186]); else if (d <= r + 1) P.put(cx + x, cy + y, tone(MAT.copper, 0.6 - (x + y) / (r * 4))); }
  const a = Math.PI * (0.8 + v * 1.4); for (let k = 0; k < r - 1; k++) P.put(Math.round(cx + Math.cos(a) * k), Math.round(cy + Math.sin(a) * k), [180, 20, 20]);
  P.put(cx, cy, [20, 20, 20]);
}
// a row of rivets along a line
function wkRivets(P, x0, x1, y, ramp, step = 5) { for (let x = x0; x < x1; x += step) { P.put(x, y, tone(ramp, 0.85)); P.put(x + 1, y + 1, tone(ramp, 0.15)); } }
// the hall behind everything: a ceiling slab with girders, a back wall in
// panels, columns holding up the city, big pipes along the wall
function wkHall(L, W, G, o = {}) {
  const wall = o.wall || MAT.steelD, ceil = o.ceil || MAT.concreteD, top = o.top || 110, seed = o.seed || 7;
  L.block(0, 0, W, top, ceil, { base: 0.24, lip: 0, panels: [80, 24], drips: 0.12, dripLen: 14 });
  L.paint(0, top, W, G, (P) => {
    P.area(0, top, W, G, wall, (x, y) => 0.3 + (noise(x / 90, y / 50, seed) - 0.5) * 0.12 + ((x % (o.pw || 48)) < 1 || ((y - top) % (o.ph || 36)) < 1 ? -0.08 : 0) + (y - top) / (G - top) * 0.06);
    for (let x = 0; x < W; x += 54) girder(P, x, top, x + 54, top + 12, MAT.steelD, { step: 12 });
    for (let x = o.col0 || 120; x < W; x += o.colStep || 360) { P.block(x, top + 12, x + 22, G, o.colRamp || MAT.concreteD, { base: 0.3, lip: 0, panels: [22, 40], drips: 0.2, dripLen: 30 }); wkRivets(P, x + 2, x + 20, top + 20, MAT.steel, 4); }
    if (o.pipes !== false) { pipe(P, 0, top + 30, W, top + 44, o.pipeRamp || MAT.rust, { joints: 60 }); pipe(P, 0, top + 50, W, top + 57, MAT.steel, { joints: 44 }); }
    for (let x = (o.col0 || 120) + 11; x < W; x += o.colStep || 360) { P.block(x - 6, G - 132, x + 6, G - 124, MAT.steelD, { base: 0.5 }); for (let i = -4; i <= 4; i++) P.put(x + i, G - 123, col3(o.lamp || '#ffb050'), 1); }
  });
  for (let x = (o.col0 || 120) + 11; x < W; x += o.colStep || 360) L.light(x, G - 110, 130, col3(o.lamp || '#ffb050').map((q) => q / 255), 0.75, 1.1);
}
// a sodium lamp hung from the ceiling on a chain
function wkHangLamp(L, x, y0, y1, col = '#ffb050', k = 0.85) {
  L.paint(x - 6, y0, x + 6, y1 + 4, (P) => { for (let y = y0; y < y1; y++) P.put(x, y, tone(MAT.steelD, (y % 3) ? 0.55 : 0.3)); P.area(x - 5, y1, x + 5, y1 + 3, MAT.steel, (xx, yy) => 0.7 - (yy - y1) * 0.2, { inside: (xx, yy) => Math.abs(xx - x) < 5 - (yy - y1) }); for (let i = -2; i <= 2; i++) P.put(x + i, y1 + 3, mixRgb(col3(col), [255, 255, 255], 0.4), 1); });
  L.light(x, y1 + 10, 110, col3(col).map((q) => q / 255), k, 1.1);
}
// an overhead crane: a box girder across the hall on rails, a trolley, a cab,
// a cable down to a hook (o.hookY), the hazard stripes on its end
function wkCrane(P, x0, x1, y, o = {}) {
  P.block(x0, y - 4, x1, y + 10, o.ramp || KMAT.ochre, { base: 0.5, panels: [30, 14] });
  wkRivets(P, x0 + 2, x1 - 2, y - 2, KMAT.ochre, 6); wkStripes(P, x0, y + 6, x0 + 14, y + 10); wkStripes(P, x1 - 14, y + 6, x1, y + 10);
  const tx = o.trolley || Math.round((x0 + x1) / 2), hy = o.hookY || y + 80;
  P.block(tx - 14, y + 10, tx + 14, y + 22, MAT.steelD, { base: 0.45 });
  P.block(tx + 16, y + 8, tx + 34, y + 30, KMAT.ochre, { base: 0.5 }); kFill(P, tx + 19, y + 12, tx + 31, y + 20, '#ffd890', 0.4);
  for (const dx of [-5, 5]) for (let yy = y + 22; yy < hy; yy++) P.put(tx + dx, yy, tone(MAT.steel, (yy % 4) ? 0.55 : 0.3));
  P.block(tx - 8, hy, tx + 8, hy + 6, MAT.steelD, { base: 0.5 }); wkStripes(P, tx - 8, hy + 6, tx + 8, hy + 8);
  for (let k = 0; k < 7; k++) P.put(tx + Math.round(Math.sin(k / 2) * 3), hy + 8 + k, tone(MAT.steel, 0.7));
}
// a conveyor: a belt on rollers, legs, crates riding it
function wkConveyor(P, x0, x1, y, o = {}) {
  P.block(x0, y, x1, y + 5, MAT.asphalt, { base: 0.35, lip: 0.6 });
  for (let x = x0 + 4; x < x1; x += 8) { P.put(x, y + 6, tone(MAT.steel, 0.7)); P.put(x + 1, y + 6, tone(MAT.steel, 0.4)); }
  for (let x = x0 + 10; x < x1; x += 40) P.block(x, y + 7, x + 3, o.G || y + 30, MAT.steelD, { base: 0.4, lip: 0 });
  for (let x = x0 + 16; x < x1 - 14; x += 26 + Math.floor(hash(x, 1, x0) * 12)) P.block(x, y - 9, x + 11, y, rp(['#5a4a2a', '#3a4a5a', '#6a3a2a', '#4a5a3a'][x % 4], 6), { base: 0.5 });
}
// a shift board: a lit panel of names and slots
function wkBoard(P, x0, y0, x1, y1) {
  P.block(x0 - 2, y0 - 2, x1 + 2, y1 + 2, MAT.steelD, { base: 0.4 }); kFill(P, x0, y0, x1, y1, '#0a0e0c');
  for (let y = y0 + 3; y < y1 - 2; y += 4) for (let x = x0 + 2; x < x1 - 2; x++) if (hash(x >> 1, y, x0) < 0.6) P.put(x, y, (x - x0) > (x1 - x0) * 0.7 ? (hash(x, y, 3) < 0.5 ? [255, 90, 60] : [90, 255, 120]) : [255, 190, 90], 0.7);
}
// a giant pump: a riveted body like a bell, a flywheel with spokes, a piston
// rod into a cylinder, gauges, pipes out of it
function wkPump(P, cx, G, o = {}) {
  const s = o.s || 1, bw = Math.round(46 * s), bh = Math.round(120 * s), body = o.ramp || MAT.steel, by = G - 14 - bh;
  P.block(cx - bw - 12, G - 14, cx + bw + 12, G, MAT.concreteD, { base: 0.45, panels: [20, 14] });
  P.area(cx - bw, by, cx + bw, G - 14, body, (x, y) => { const t = (x - cx) / bw; return 0.62 - t * 0.35 - Math.abs(t) ** 4 * 0.2 + (noise(x / 20, y / 30, cx) - 0.5) * 0.1 + ((y - by) % 30 < 2 ? 0.15 : 0); }, { inside: (x, y) => Math.abs(x - cx) < bw * (0.72 + 0.28 * Math.min(1, (y - by) / (bh * 0.3))) });
  for (let y = by + 2; y < G - 14; y += 30) wkRivets(P, cx - bw + 6, cx + bw - 6, y, body, 6);
  // the dome and the cylinder on top, the piston rod
  P.area(cx - bw * 0.5, by - 26 * s, cx + bw * 0.5, by + 2, body, (x, y) => 0.7 - (x - cx) / bw * 0.5, { inside: (x, y) => Math.hypot((x - cx) / (bw * 0.5), (y - by) / (26 * s)) < 1 });
  P.block(cx - 8, by - 26 * s - 50 * s, cx + 8, by - 22 * s, MAT.steelD, { base: 0.45, bands: 8 });
  for (let y = by - 22 * s - 70 * s; y < by - 26 * s - 50 * s + 4; y++) { P.put(cx - 1, y, tone(MAT.chrome, 0.8)); P.put(cx, y, tone(MAT.chrome, 0.6)); P.put(cx + 1, y, tone(MAT.chrome, 0.3)); }
  // the flywheel beside it
  const fx = cx + bw + 26 * s, fy = by + bh * 0.35, R2 = 30 * s;
  for (let y = -R2 - 2; y <= R2 + 2; y++) for (let x = -R2 - 2; x <= R2 + 2; x++) { const d = Math.hypot(x, y); if (d > R2 - 5 && d <= R2) P.put(fx + x, fy + y, tone(MAT.steelD, 0.6 - (x + y) / (R2 * 3))); else if (d < 6) P.put(fx + x, fy + y, tone(MAT.steel, 0.65 - (x + y) / 20)); }
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + (o.turn || 0); for (let r2 = 5; r2 < R2 - 4; r2++) { P.put(Math.round(fx + Math.cos(a) * r2), Math.round(fy + Math.sin(a) * r2), tone(MAT.steelD, 0.5)); P.put(Math.round(fx + Math.cos(a) * r2) + 1, Math.round(fy + Math.sin(a) * r2), tone(MAT.steelD, 0.3)); } }
  P.block(fx - 4, fy, fx + 4, G - 14, MAT.steelD, { base: 0.35, lip: 0 });
  // gauges, a nameplate, a lit window
  wkGauge(P, cx - bw * 0.45, by + 30, 6, hash(cx, 1, 2)); wkGauge(P, cx - bw * 0.1, by + 30, 6, hash(cx, 2, 2));
  P.block(cx - 14, by + 50, cx + 14, by + 60, MAT.copper, { base: 0.5 }); for (let x = cx - 11; x < cx + 11; x += 2) P.put(x, by + 55, tone(MAT.copper, 0.9));
  wkStripes(P, cx - bw, G - 22, cx + bw, G - 18);
}
// a furnace: a brick kiln, an arched mouth roaring, a flue up into the dark
function wkFurnace(P, x0, x1, G, o = {}) {
  const w = x1 - x0, cx = Math.round((x0 + x1) / 2), top = G - (o.h || 130), mw = Math.round(w * 0.2), my = G - 22;
  P.block(cx - w * 0.18, 40, cx + w * 0.18, top, MAT.brickD, { base: 0.36, bands: 6, drips: 0.2, dripLen: 30 });
  P.block(x0, top, x1, G, MAT.brick, { base: 0.42, bands: 5, seed: x0 });
  P.block(x0 - 4, top - 6, x1 + 4, top, MAT.steelD, { base: 0.5 }); wkRivets(P, x0, x1, top - 4, MAT.steel, 6);
  for (const sx of [x0 + 6, x1 - 12]) P.block(sx, top + 4, sx + 6, G, MAT.steelD, { base: 0.45, lip: 0 });
  // the mouth: white at the heart, yellow, orange at the edge
  P.area(cx - mw, my - mw * 1.1, cx + mw, G, R(['#3a0800', '#a82a04', '#ff7a10', '#ffd040', '#fff4c8'], 9, 0.3, 0.2), (x, y) => { const d = Math.hypot((x - cx) / mw, (y - G) / (mw * 1.6)); return 1.0 - d * 0.85 + (noise(x / 4, y / 3, x0) - 0.5) * 0.35; }, { inside: (x, y) => y > my - mw * 1.1 && Math.abs(x - cx) < mw && (y > my - mw * 0.4 || Math.hypot(x - cx, y - (my - mw * 0.4)) < mw), glow: 0.6 });
  for (let x = cx - mw + 3; x < cx + mw; x += 5) for (let y = Math.round(my - mw * 1.3); y < G; y++) if (Math.abs(x - cx) < mw && (y > my - mw * 0.4 || Math.hypot(x - cx, y - (my - mw * 0.4)) < mw)) { P.put(x, y, [40, 16, 8]); P.put(x + 1, y, [70, 30, 14]); }
  P.area(cx - mw - 14, my - mw * 1.6 - 24, cx + mw + 14, my - mw * 1.6, MAT.steelD, (x, y) => 0.5 - (y - my + mw * 1.6 + 24) / 60, { inside: (x, y) => Math.abs(x - cx) < mw + 14 - (my - mw * 1.6 - y) * 0.4 });
  P.block(cx - mw - 4, G - 6, cx + mw + 4, G, MAT.steelD, { base: 0.5 });
  for (let x = cx - mw - 3; x <= cx + mw + 3; x++) { const yy = my - mw * 0.4 - Math.sqrt(Math.max(0, (mw + 3) ** 2 - (x - cx) ** 2)); P.put(x, yy, tone(MAT.steel, 0.7)); P.put(x, yy + 1, tone(MAT.steelD, 0.3)); }
  wkGauge(P, x0 + 20, top + 20, 5, 0.85); wkGauge(P, x1 - 20, top + 20, 5, 0.9);
}
// a ladle hung from a crane hook, tipped, pouring a stream into a mould
function wkLadle(P, cx, y, G, o = {}) {
  const r = 16;
  P.area(cx - r, y, cx + r, y + 26, MAT.steelD, (x, yy) => 0.55 - (x - cx) / r * 0.3, { inside: (x, yy) => Math.abs(x - cx) < r - (yy - y) * 0.25 });
  for (let x = cx - r + 2; x < cx + r - 2; x++) P.put(x, y + 1, [255, 200, 80], 1);
  for (const dx of [-r + 2, r - 2]) for (let yy = y - 30; yy < y; yy++) P.put(cx + dx + Math.round((yy - y + 30) / 30 * (dx < 0 ? 6 : -6)), yy, tone(MAT.steel, 0.5));
  // the pour, from the lip down to the mould
  const lx = cx + r - 1; for (let yy = y + 2; yy < G - 12; yy++) { const sx = lx + 2 + Math.round(Math.sqrt(yy - y) * 0.6); for (let i = -1; i <= 1; i++) P.put(sx + i, yy, i ? [255, 140, 30] : [255, 240, 170], 1); }
}
// moulds on the floor: steel boxes of glowing metal, cooling
function wkMoulds(P, x0, x1, G, o = {}) {
  for (let x = x0; x < x1 - 20; x += 28) {
    const hot = hash(x, 1, x0); P.block(x, G - 12, x + 22, G, MAT.steelD, { base: 0.45 });
    const c = hot < 0.4 ? [[255, 230, 140], [255, 120, 20]] : hot < 0.7 ? [[255, 120, 30], [150, 30, 4]] : [[90, 30, 20], [40, 16, 12]];
    for (let xx = x + 2; xx < x + 20; xx++) for (let yy = G - 11; yy < G - 8; yy++) P.put(xx, yy, mixRgb(c[0], c[1], (yy - G + 11) / 3 + hash(xx, yy, 5) * 0.2), hot < 0.7 ? 0.9 : 0);
  }
}
// a tank: a riveted cylinder with a sight glass down it showing what's in it
// glowing, bubbles, a ladder up the side; o.open for a vat with no lid
function wkTank(P, x0, x1, G, h, col, o = {}) {
  const c = col3(col), top = G - h, w = x1 - x0, ramp = o.ramp || MAT.steel;
  P.area(x0, top, x1, G, ramp, (x, y) => { const t = (x - x0) / w; return 0.42 + Math.sin(t * Math.PI) * 0.36 - t * 0.2 + ((y - top) % 24 < 1 ? -0.2 : (y - top) % 24 < 2 ? 0.1 : 0) + (noise(x / 12, y / 30, x0) - 0.5) * 0.1; });
  for (let x = x0; x < x1; x++) for (let j = 0; j < 40; j++) if (hash(x, j, x0) < 0.15 * (1 - j / 40)) P.tint(x, G - 1 - j, [40, 30, 20], 0.4);
  for (let y = top + 3; y < G; y += 24) wkRivets(P, x0 + 3, x1 - 3, y, ramp, 6);
  for (let y = top; y < G; y++) { P.put(x0, y, [8, 10, 10]); P.put(x1 - 1, y, [8, 10, 10]); }
  P.block(x0 - 4, G - 6, x1 + 4, G, MAT.concreteD, { base: 0.5 });
  P.area(x0 - 2, top - 8, x1 + 2, top + 2, ramp, (x, y) => 0.7 - (y - top + 8) / 14, { inside: (x, y) => y >= top - 8 * Math.sqrt(Math.max(0, 1 - ((x - (x0 + x1) / 2) / (w / 2 + 2)) ** 2)) });
  const gx = x0 + Math.round(w * 0.22), gw = Math.max(4, Math.round(w * 0.06)), lvl = top + 12 + Math.round(h * (o.level || 0.3));
  kFill(P, gx - 2, top + 8, gx + gw + 2, G - 10, '#1a1e22');
  for (let y = top + 10; y < G - 12; y++) for (let x = gx; x < gx + gw; x++) { if (y < lvl) P.put(x, y, [18, 26, 30]); else P.put(x, y, mixRgb(c, [255, 255, 255], (x === gx + 1 ? 0.35 : 0) + (hash(x, y, x0) < 0.06 ? 0.5 : 0)), 0.75); }
  if (!o.noLadder) for (let y = top; y < G; y += 4) { P.put(x1 - 8, y, tone(MAT.steel, 0.65)); P.put(x1 - 3, y, tone(MAT.steel, 0.4)); for (let i = 0; i < 6; i++) P.put(x1 - 8 + i, y, tone(MAT.steel, 0.5)); }
  if (o.label) { P.block(x0 + w * 0.55, top + 20, x0 + w * 0.85, top + 34, rp(o.label, 5), { base: 0.55 }); for (const [a, b] of GLYPHS[(x0 >> 3) % GLYPHS.length]) P.put(Math.round(x0 + w * 0.65) + a, top + 24 + b, [20, 20, 20]); }
}
// an open vat seen side-on: a concrete lip, the glowing surface, haze over it
function wkVat(P, x0, x1, y, depth, col) {
  const c = col3(col);
  for (let x = x0; x < x1; x++) for (let yy = y; yy < y + depth; yy++) { const t = (yy - y) / depth; P.put(x, yy, mixRgb(mixRgb(c, [255, 255, 255], yy === y ? 0.5 : 0), [0, 10, 10], t * 0.75 + (noise(x / 9, yy / 2, 9) - 0.5) * 0.2), 0.7 * (1 - t)); }
  for (let x = x0; x < x1; x++) for (let j = 1; j < 30; j++) P.tint(x, y - j, c, 0.22 * (1 - j / 30) * (0.6 + noise(x / 14, j / 6, 4) * 0.8));
}
// a drum of chemicals, painted
function wkDrum(P, x, G, col, o = {}) {
  const ramp = rp(col, 6);
  P.area(x, G - 18, x + 12, G, ramp, (xx, y) => 0.7 - (xx - x) / 16 + ((y - G + 18) % 6 < 1 ? -0.25 : 0));
  kH(P, x, x + 12, G - 18, tone(ramp, 0.9));
  if (o.mark) { kFill(P, x + 3, G - 12, x + 9, G - 7, '#e8d040'); P.put(x + 6, G - 10, [20, 20, 20]); P.put(x + 6, G - 9, [20, 20, 20]); }
}
// a rack of servers painted into the wall, floor to ceiling: blades with
// status lights, a cold blue gap between each rack
function wkServerWall(P, x0, x1, y0, y1, seed) {
  for (let x = x0; x < x1; x += 22) {
    P.block(x, y0, x + 18, y1, MAT.machine, { base: 0.32, lip: 0 });
    for (let y = y0 + 3; y < y1 - 2; y += 3) { kH(P, x + 2, x + 16, y, tone(MAT.machine, 0.2)); for (let i = 3; i < 15; i += 2) if (hash(x + i, y, seed) < 0.16) P.put(x + i, y + 1, hash(x + i, y, seed + 1) < 0.85 ? [90, 230, 255] : hash(x, y, 5) < 0.5 ? [90, 255, 140] : [255, 170, 60], 0.9); }
    for (let y = y0; y < y1; y++) { P.put(x + 19, y, [10, 20, 30]); P.put(x + 20, y, mixRgb([40, 110, 160], [10, 20, 30], hash(x, y >> 3, seed) * 0.7), 0.25); P.put(x + 21, y, [10, 20, 30]); }
  }
}
// frost: pale blue speckles creeping up from the floor and down from ducts
function wkFrost(P, x0, x1, y0, y1, seed) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const t = (y - y0) / (y1 - y0); if (hash(x, y, seed) < t * 0.14 * (0.5 + noise(x / 12, y / 8, seed))) P.tint(x, y, [200, 235, 255], 0.55); } }
// a duct: a wide square pipe in sheet metal with seams
function wkDuct(P, x0, y0, x1, y1, ramp = MAT.chrome) { P.area(x0, y0, x1, y1, ramp, (x, y) => { const vert = x1 - x0 < y1 - y0, t = vert ? (x - x0) / (x1 - x0) : (y - y0) / (y1 - y0); return 0.55 - t * 0.35 + (((vert ? y : x) % 30) < 1 ? -0.25 : 0); }); }

// ---- the Works hub: the workers' floor, the canteen, the Foreman's crane hall
LEVELS.works = { name: 'The Works', depth: '-260 m', metres: -260, tier: 4, hub: true, mapX: 500, label: 'The machine floors', blurb: 'The machine floors under everything: Cookie\'s canteen, the conveyors, the Foreman\'s crane hall and the shaft down to the Bowels.',
  make: () => district({ id: 'works', name: 'The Works', tier: 4, W: 3400, sky: false, transit: 'lift', floor: MAT.steel, amb: [0.25, 0.21, 0.19], crowd: 3, crowdTo: 2300,
    local: { name: 'Worker', lines: LOCAL_LINES.works, look: { hair: 'cap', capCol: '#e8b030', top: '#5a4a2a', coat: 'jacket', legs: '#2a2a2a' } },
    build(L, G) {
      L.spawns.lift = [140, G];
      wkHall(L, 3400, G, { wall: MAT.steelD, seed: 4, colStep: 400 });
      // the lift landing: a cage frame, stripes, the shift board
      L.paint(20, G - 120, 300, G, (P) => { wkStripes(P, 20, G - 6, 130, G - 2); wkBoard(P, 180, G - 100, 280, G - 60); P.block(176, G - 112, 284, G - 104, MAT.steelD, { base: 0.5 }); for (const [a, b] of GLYPHS[3]) P.put(222 + a, G - 110 + b, [255, 190, 90], 1); });
      L.light(230, G - 80, 60, [1, 0.7, 0.4], 0.6);
      
      // the canteen: tiled, steamy windows, Cookie behind the counter
      L.paint(540, G - 110, 880, G, (P) => {
        P.block(540, G - 96, 880, G, MAT.tileW, { base: 0.42, panels: [10, 10] });
        P.block(536, G - 104, 884, G - 96, KMAT.ochre, { base: 0.55 });
        for (let x = 560; x < 860; x += 60) { kFill(P, x, G - 84, x + 44, G - 52, '#c8a070', 0.16); for (let y = G - 84; y < G - 52; y++) for (let xx = x; xx < x + 44; xx++) if (hash(xx, y, 9) < 0.3) P.tint(xx, y, [255, 255, 255], 0.4); }
        P.block(600, G - 30, 800, G - 22, MAT.steel, { base: 0.65 }); P.block(604, G - 22, 796, G, MAT.steelD, { base: 0.35, panels: [16, 22] });
        for (let x = 620; x < 790; x += 24) { P.block(x, G - 36, x + 10, G - 30, rp('#e8e0d0', 5), { base: 0.6 }); }
      });
      L.sign(640, G - 118, 7, '#ffd040', { r: 60 }); L.light(700, G - 40, 110, [1, 0.8, 0.55], 0.9);
      L.vents.push({ x: 650, y: G - 40, kind: 'steam' }, { x: 760, y: G - 40, kind: 'steam' });
      L.npc({ name: 'Cookie', look: { skin: SKINS[2], hair: 'bald', top: '#e8e0d0', apron: '#8a3a2a', legs: '#2a2a2a', wide: 1, hands: { fx: 26, fy: 38 } }, x: 700, y: G, sched: [[0, 24, 700, 'work']], lines: ['Eat something, tinker. You look like a pump that\'s run dry.', 'Twelve-hour shifts. I feed them all.'], behind: true });
      for (const x of [560, 840]) L.prop('deco', x, G, { art: () => bench(), id: 'wkcb' + x });
      // the conveyor floor: belts at two heights, crates riding, a crane over it
      L.paint(900, 40, 2300, G, (P) => {
        wkConveyor(P, 920, 1400, G - 30, { G }); wkConveyor(P, 1460, 2280, G - 30, { G });
        wkCrane(P, 900, 2300, G - 150, { trolley: 1760, hookY: G - 72 });
        for (let x = 1000; x < 2260; x += 220) { P.block(x, G - 140, x + 70, G - 34, MAT.steelD, { base: 0.38, panels: [14, 20] }); for (let y = G - 132; y < G - 40; y += 8) for (let xx = x + 6; xx < x + 64; xx += 6) if (hash(xx, y, 2) < 0.25) P.put(xx, y, hash(xx, y, 3) < 0.6 ? [255, 160, 60] : [90, 255, 120], 0.8); wkGauge(P, x + 14, G - 120, 5, hash(x, 3, 1)); wkGauge(P, x + 30, G - 120, 5, hash(x, 4, 1)); }
      });
      // a gantry walk over the belts, ladders up
      L.walk(980, 2260, G - 150, 5, MAT.steel); L.ladder(990, G - 150, G); L.ladder(2240, G - 150, G);
      L.spots.push([1300, G - 150], [1900, G - 150]);
      for (const x of [1060, 1500, 1980]) wkHangLamp(L, x, 110, G - 150);
      L.prop('ac', 1180, G, { label: 'blower' }); L.prop('junk', 1420, G, { label: 'scrap bin' }); L.prop('rack', 2120, G, { label: 'control cabinet' });
      L.vents.push({ x: 1440, y: G - 20, kind: 'steam' }, { x: 2290, y: G - 20, kind: 'steam' });
      L.light(1700, G - 60, 160, [1, 0.6, 0.3], 0.7, 1, { mode: 'bad', seed: 17 });
      // the Foreman's crane hall, and the shaft down
      arena(L, 2400, 3260, G, 'crane');
      L.paint(2400, 60, 3260, G, (P) => { wkCrane(P, 2400, 3260, G - 150, { trolley: 2620, hookY: G - 84 }); wkStripes(P, 2420, G - 6, 3240, G - 2); });
      L.paint(3290, G - 70, 3380, G, (P) => wkStripes(P, 3296, G - 62, 3366, G - 56));
      L.spots.push([400, G], [600, G], [900, G], [1150, G], [1500, G], [1750, G], [2050, G], [2250, G]);
      L.critter('rat', 300, 2300, G, 2);
    } }) };

// ---- Pump Hall Seven: a cathedral of pumps, pipes as wide as a man, the sump
addDistrict('d_pumphall', 'Pump Hall Seven', 4, -270, 340, 'A cathedral of pumps that keeps the lower city from drowning: flywheels, pistons, the flooded sump.', 'Pumps and the sump', () => district({
  id: 'd_pumphall', name: 'Pump Hall Seven', tier: 4, W: 2600, sky: false, transit: 'lift', floor: MAT.concreteD, amb: [0.22, 0.22, 0.23], crowd: 2, crowdTo: 1200,
  local: { name: 'Pump hand', lines: ['Seven pumps. Six working. The seventh just sounds angry.', 'If the pumps stop, Old Town is a lake by morning.', 'Don\'t lean on the pipes. They\'re hotter than they look.'], look: { hair: 'cap', capCol: '#3a6a8a', top: '#3a4a5a', legs: '#2a2a2a' } },
  build(L, G) {
    wkHall(L, 2600, G, { wall: MAT.machine, ceil: MAT.concreteD, colStep: 300, col0: 200, pipeRamp: MAT.copper, seed: 11 });
    // the great pumps, standing in a row like pews
    const pumps = [420, 800, 1180, 1560];
    L.paint(300, 30, 1720, G, (P) => {
      for (let i = 0; i < pumps.length; i++) wkPump(P, pumps[i], G, { s: i % 2 ? 0.9 : 1.05, turn: i * 0.4 });
      // pipes as wide as a man, from pump to pump and up into the ceiling
      for (let i = 0; i < pumps.length - 1; i++) pipe(P, pumps[i] + 40, G - 150, pumps[i + 1] - 40, G - 128, MAT.rust, { joints: 40 });
      for (const x of pumps) pipe(P, x - 11, 40, x + 11, G - 230, MAT.copper, { joints: 36 });
    });
    for (const x of pumps) { L.light(x, G - 70, 90, [0.6, 0.8, 1], 0.5); L.vents.push({ x: x + 50, y: G - 30, kind: 'steam' }); }
    // a catwalk along the pumps' shoulders
    L.walk(330, 1700, G - 170, 5, MAT.steel); L.ladder(340, G - 170, G); L.ladder(1690, G - 170, G);
    L.spots.push([600, G - 170], [1000, G - 170], [1380, G - 170]);
    // the sump: a pit of black water the floor bridges, rails, a gauge board
    L.paint(1760, G - 120, 2160, G + 44, (P) => {
      water(P, 1760, 2160, G + 6, 38, KMAT.water); P.block(1760, G, 2160, G + 6, MAT.steelD, { base: 0.5 }); railing(P, 1760, 2160, G, MAT.steel, { h: 9 });
      wkBoard(P, 1840, G - 100, 2000, G - 60); for (let k = 0; k < 6; k++) wkGauge(P, 1850 + k * 24, G - 48, 6, hash(k, 1, 77));
      for (let y = G - 120; y < G; y++) { P.put(2090, y, tone(MAT.steel, 0.5)); P.put(2091, y, tone(MAT.steel, 0.3)); }
    });
    L.wet.push({ y: G + 6, x0: 1760, x1: 2160, depth: 30, k: 0.6 });
    L.light(1920, G - 60, 100, [0.4, 1, 0.6], 0.6, 1, { mode: 'bad', seed: 5 });
    L.drips.push({ x: 1800, y0: 50, y1: G }, { x: 2100, y0: 50, y1: G });
    // the pump control room up a stair: lit windows over the hall
    L.paint(2200, G - 190, 2560, G, (P) => {
      P.block(2200, G - 180, 2560, G - 100, MAT.steelD, { base: 0.4, panels: [24, 20] });
      for (let x = 2214; x < 2540; x += 40) { kFill(P, x, G - 168, x + 30, G - 124, '#b08a58', 0.14); kH(P, x, x + 30, G - 150, '#2a2a2a'); kFill(P, x + 4, G - 140, x + 26, G - 124, '#3a3428'); if (hash(x, 4, 4) < 0.5) kFill(P, x + 12, G - 158, x + 16, G - 140, '#1a1410'); }
      for (let x = 2220; x < 2540; x += 50) P.block(x, G - 100, x + 8, G, MAT.steelD, { base: 0.35, lip: 0 });
    });
    L.stairs(2210, G, 2320, G - 100); L.walk(2200, 2560, G - 100, 5, MAT.steel);
    L.spots.push([2450, G - 100]); L.prop('rack', 2500, G - 100, { label: 'control cabinet' });
    L.light(2380, G - 140, 120, [1, 0.8, 0.5], 0.7);
    for (const x of [600, 1000, 1380, 1950]) wkHangLamp(L, x, 110, G - 150, '#ffc070', 0.7);
    L.prop('ac', 610, G, { label: 'pump motor' }); L.prop('junk', 1000, G, { label: 'scrap pile' }); L.prop('wreck', 1400, G, { label: 'dead maintenance drone' });
    L.spots.push([300, G], [620, G], [990, G], [1370, G], [1720, G], [2200, G], [2420, G]);
    L.critter('rat', 300, 2500, G, 3);
  },
}));

// ---- The Foundry: furnaces, ladles pouring, moulds glowing, the slag heap
addDistrict('d_foundry', 'The Foundry', 4, -285, 640, 'Furnaces that never go out: ladles of molten metal, moulds glowing on the floor, a slag heap and a crane overhead.', 'Furnaces and molten metal', () => district({
  id: 'd_foundry', name: 'The Foundry', tier: 4, W: 2400, sky: false, transit: 'lift', floor: MAT.asphalt, amb: [0.25, 0.18, 0.15], crowd: 2, crowdTo: 1100,
  local: { name: 'Smelter', lines: ['Two thousand degrees in the ladle. Stand back of the yellow line.', 'We cast the bones of the city here. Beams for the Spires.', 'Lost a glove in the pour once. Hand was still in it.'], look: { hair: 'helmet', armor: '#c8a040', visor: '#ff8a3a', top: '#5a3a2a', apron: '#3a2a1a', legs: '#2a2420' } },
  build(L, G) {
    wkHall(L, 2400, G, { wall: MAT.brickD, colRamp: MAT.brickD, colStep: 420, col0: 340, pipeRamp: MAT.rust, seed: 21 });
    // three furnaces, roaring
    const fur = [[300, 470], [900, 1080], [1500, 1680]];
    L.paint(280, 30, 1700, G, (P) => { for (const [a, b] of fur) wkFurnace(P, a, b, G, { h: 140 }); });
    for (const [a, b] of fur) { const c = (a + b) / 2; L.light(c, G - 30, 160, [1, 0.55, 0.2], 1.2, 1, { mode: 'fire', seed: a }); L.vents.push({ x: c, y: 50, kind: 'smoke' }); }
    // the casting floor: a crane carrying a ladle, the pour, moulds
    L.paint(480, 60, 900, G, (P) => { wkCrane(P, 480, 900, G - 150, { trolley: 660, hookY: G - 128 }); wkLadle(P, 660, G - 96, G); wkMoulds(P, 560, 880, G); });
    L.light(690, G - 30, 140, [1, 0.6, 0.2], 1.1, 1, { mode: 'fire', seed: 3 }); L.light(670, G - 90, 70, [1, 0.7, 0.3], 0.8);
    L.paint(1090, 60, 1500, G, (P) => { wkMoulds(P, 1110, 1480, G); wkCrane(P, 1090, 1500, G - 150, { trolley: 1380, hookY: G - 64 }); });
    L.light(1300, G - 10, 160, [1, 0.45, 0.15], 0.8);
    // the slag heap, still smouldering, and a skip of scrap
    L.paint(1720, G - 110, 2080, G, (P) => {
      heap(P, 1730, 2070, G, 90, R(['#0e0806', '#2a1a12', '#4a3020', '#7a5a40']), 13);
      for (let k = 0; k < 120; k++) { const x = 1740 + hash(k, 1, 4) * 320, y = G - hash(k, 2, 4) * 60; if (hash(k, 3, 4) < 0.5) P.put(x, y, [255, 110 + hash(k, 4, 4) * 100, 30], 0.9); }
    });
    L.light(1900, G - 40, 120, [1, 0.4, 0.15], 0.6, 1, { mode: 'fire', seed: 9 });
    L.vents.push({ x: 1850, y: G - 60, kind: 'smoke' }, { x: 1980, y: G - 40, kind: 'smoke' });
    // the pattern shop: a raised office over the floor, a stair, lockers
    L.paint(2110, G - 160, 2380, G, (P) => {
      P.block(2110, G - 150, 2380, G - 96, MAT.steelD, { base: 0.4, panels: [30, 18] });
      for (let x = 2124; x < 2370; x += 46) { kFill(P, x, G - 140, x + 34, G - 110, '#b08050', 0.15); kV(P, x + 17, G - 140, G - 110, '#2a2420'); if (hash(x, 2, 6) < 0.5) kFill(P, x + 6, G - 132, x + 10, G - 110, '#1a1410'); }
      for (let x = 2120; x < 2370; x += 80) P.block(x, G - 96, x + 8, G, MAT.steelD, { base: 0.35, lip: 0 });
      wkStripes(P, 2110, G - 98, 2380, G - 96);
    });
    L.stairs(2120, G, 2220, G - 96); L.walk(2110, 2380, G - 96, 5, MAT.steel);
    L.spots.push([2280, G - 96]);
    // a gantry over the casting floor
    L.walk(480, 1490, G - 180, 5, MAT.steel); L.ladder(1480, G - 180, G); L.ladder(490, G - 180, G); L.spots.push([800, G - 180], [1250, G - 180]);
    L.paint(0, G - 8, 2400, G, (P) => { for (const [a, b] of [[520, 900], [1100, 1490]]) wkStripes(P, a, G - 4, b, G - 2); });
    L.prop('junk', 1740, G, { label: 'scrap skip' }); L.prop('ac', 520, G, { label: 'blower' }); L.prop('wreck', 1120, G, { label: 'burnt-out loader' });
    L.spots.push([220, G], [520, G], [760, G], [1080, G], [1320, G], [1720, G], [2080, G]);
    L.critter('rat', 200, 2300, G, 2);
  },
}));

// ---- The Server Farm: cold blue aisles of racks, ducts, frost, the watch room
addDistrict('d_servers', 'Server Farm', 4, -300, 820, 'The city\'s thinking, racked floor to ceiling in the cold: blue aisles, ducts breathing frost, a watch room full of screens.', 'Racks in the cold', () => district({
  id: 'd_servers', name: 'Server Farm', tier: 4, W: 2500, sky: false, transit: 'lift', floor: MAT.steel, amb: [0.17, 0.21, 0.27], crowd: 1, crowdTo: 900,
  local: { name: 'Night tech', lines: ['Cold enough to keep the racks happy. Not me.', 'Every screen up top is running on something down here.', 'Don\'t touch the blue lights. Don\'t touch anything.'], look: { hair: 'short', top: '#2a3a4a', coat: 'long', legs: '#1a2030', shades: '#3af0e0' } },
  build(L, G) {
    wkHall(L, 2500, G, { wall: KMAT.blackglass, ceil: MAT.steelD, colStep: 500, col0: 460, colRamp: MAT.steelD, pipes: false, seed: 31 });
    // aisle after aisle of racks up to the ceiling, ducts over them, frost
    L.paint(200, 50, 2400, G, (P) => {
      for (const [a, b] of [[220, 640], [700, 1120], [1180, 1560], [1980, 2380]]) { wkServerWall(P, a, b, 70, G - 4, a); wkFrost(P, a, b, G - 70, G, a); }
      wkDuct(P, 200, 56, 2400, 70); for (let x = 260; x < 2400; x += 180) wkDuct(P, x, 70, x + 14, 110);
      for (let x = 200; x < 2400; x += 8) { P.put(x, 72, tone(MAT.steelD, 0.5)); } // a cable tray under the duct
      for (let k = 0; k < 8; k++) cable(P, 200 + k * 40, 74, 2400 - k * 30, 74 + (k % 3), 6 + k, ['#0a1a24', '#102a3a'][k % 2]);
    });
    for (const x of [430, 910, 1370, 2180]) { L.light(x, G - 90, 170, [0.4, 0.75, 1], 0.7); L.vents.push({ x, y: 110, kind: 'steam' }); }
    for (let x = 260; x < 2400; x += 140) L.tube(x, 112, 26, '#c8f0ff', 0.55);
    // the racks you can strip, at the end of each aisle
    for (const x of [650, 680, 1135, 1160, 1580, 1960]) L.prop('rack', x, G, { label: 'server rack' });
    // the watch room: a glass box up a stair, screens and screens
    L.paint(1600, G - 190, 1960, G, (P) => {
      P.block(1600, G - 180, 1960, G - 100, MAT.steelD, { base: 0.35 });
      for (let x = 1610; x < 1950; x += 28) { kFill(P, x, G - 172, x + 24, G - 152, '#0a1a24'); for (let y = G - 170; y < G - 154; y++) for (let xx = x + 2; xx < x + 22; xx++) if (y % 2 && hash(xx, y, x) > 0.45) P.put(xx, y, hash(x, 2, 3) < 0.7 ? [90, 220, 255] : [255, 90, 90], 0.8); }
      glassWall(P, 1600, G - 150, 1960, G - 104, { ramp: MAT.glass, mw: 20, mh: 46 });
      for (let x = 1610; x < 1960; x += 70) P.block(x, G - 100, x + 8, G, MAT.steelD, { base: 0.35, lip: 0 });
    });
    L.stairs(1610, G, 1720, G - 100); L.walk(1600, 1960, G - 100, 5, MAT.steel);
    L.light(1780, G - 140, 110, [0.5, 0.85, 1], 0.7); L.spots.push([1820, G - 100]);
    L.npc({ name: 'Operator Vey', look: { skin: SKINS[1], hair: 'bob', hairCol: '#e8e8f0', top: '#1a2a3a', coat: 'long', legs: '#1a1a24', glasses: true }, x: 1800, y: G - 100, face: 1, sched: [[0, 24, 1800, 'stand']], lines: ['Six hundred thousand racks and one of me.', 'Someone\'s been pulling memory from aisle four. Not my problem. Unless you make it mine.', 'The Bowels send the heat up and we send it back cold. The city breathes through us.'] });
    // gantries between the rack tops, ladders down the aisle ends
    L.walk(220, 1560, G - 160, 4, MAT.steelD); L.ladder(670, G - 160, G); L.ladder(1150, G - 160, G); L.spots.push([430, G - 160], [910, G - 160], [1370, G - 160]);
    L.prop('ac', 1570, G, { label: 'chiller unit' }); L.prop('wreck', 2000, G, { label: 'dead cleaning drone' });
    L.spots.push([300, G], [480, G], [900, G], [1300, G], [1500, G], [2100, G], [2300, G]);
  },
}));

// ---- The Coolant Vats: tanks of glowing coolant, open vats, drums, the lab
addDistrict('d_vats', 'Coolant Vats', 4, -280, 180, 'Where the city\'s coolant is mixed: tanks and open vats glowing green and blue, drums of worse, a lab of people in suits.', 'Tanks of coolant', () => district({
  id: 'd_vats', name: 'Coolant Vats', tier: 4, W: 2300, sky: false, transit: 'lift', floor: MAT.steel, amb: [0.18, 0.23, 0.21], crowd: 1, crowdTo: 900,
  local: { name: 'Vat hand', lines: ['Don\'t breathe the green. Don\'t touch the blue. Don\'t drink either.', 'Coolant keeps the racks cold and the Works from melting.', 'Somebody\'s been skimming drums. Again.'], look: { hair: 'hood', top: '#c8c840', legs: '#c8c840', mask: '#3a4a3a' } },
  build(L, G) {
    wkHall(L, 2300, G, { wall: MAT.machine, ceil: MAT.concreteD, colStep: 380, col0: 260, pipeRamp: MAT.steel, seed: 41 });
    // the tanks: tall and riveted, sight glasses glowing
    const tanks = [[240, 360, '#3aff90'], [390, 530, '#3ad8ff'], [1480, 1610, '#3aff90'], [1640, 1790, '#9aff3a']];
    L.paint(240, 40, 1800, G, (P) => {
      for (const [a, b, c] of tanks) wkTank(P, a, b, G, 136, c, { level: 0.2 + hash(a, 1, 3) * 0.4, label: '#e8d040', ramp: R(['#1a2420', '#34443e', '#56685e', '#a8b8ac']) });
      for (let i = 0; i < tanks.length - 1; i++) if (tanks[i + 1][0] - tanks[i][1] < 80) pipe(P, tanks[i][1], G - 100, tanks[i + 1][0], G - 90, MAT.steel, { joints: 20 });
      for (const [a, b] of tanks) pipe(P, (a + b) / 2 - 4, 110, (a + b) / 2 + 4, G - 144, MAT.steel, { joints: 30 });
    });
    for (const [a, b, c] of tanks) L.light((a + b) / 2, G - 100, 100, col3(c).map((q) => q / 255), 0.6);
    // the open vats: a walk over them, the glow up into the haze
    L.paint(560, G - 160, 1460, G + 44, (P) => {
      for (const [a, b, c] of [[580, 860, '#3aff90'], [900, 1180, '#3ad8ff'], [1220, 1440, '#3aff90']]) { P.block(a - 6, G - 2, b + 6, G + 44, MAT.concreteD, { base: 0.4 }); wkVat(P, a, b, G + 8, 36, c); for (let x = a; x < b; x++) { for (let y = G; y < G + 4; y++) P.put(x, y, (x % 4) ? tone(MAT.steelD, y === G ? 0.75 : 0.35) : [10, 14, 14]); } for (let x = a; x < b; x += 30) for (let y = G + 4; y < G + 44; y++) { P.put(x, y, tone(MAT.steelD, 0.4)); P.put(x + 1, y, tone(MAT.steelD, 0.2)); } railing(P, a - 6, b + 6, G, MAT.steel, { h: 8, step: 6 }); wkStripes(P, a - 6, G - 2, b + 6, G); }
    });
    for (const [x, c] of [[720, [0.3, 1, 0.6]], [1040, [0.3, 0.85, 1]], [1330, [0.3, 1, 0.6]]]) L.light(x, G - 10, 150, c, 0.9);
    for (const [a, b] of [[580, 860], [900, 1180], [1220, 1440]]) L.wet.push({ y: G + 8, x0: a, x1: b, depth: 30, k: 0.5 });
    L.vents.push({ x: 700, y: G, kind: 'steam' }, { x: 1050, y: G, kind: 'steam' }, { x: 1340, y: G, kind: 'steam' });
    // gantries over the vats
    L.walk(560, 1460, G - 120, 4, MAT.steel); L.stairs(570, G, 660, G - 120); L.spots.push([800, G - 120], [1250, G - 120]);
    // drums stacked, marked
    L.paint(1820, G - 40, 1960, G, (P) => { for (let k = 0; k < 9; k++) wkDrum(P, 1824 + (k % 5) * 14 + (k >= 5 ? 7 : 0), k >= 5 ? G - 19 : G, ['#3a8a3a', '#c8a020', '#3a5a8a', '#8a2a2a'][k % 4], { mark: k % 2 === 0 }); });
    // the lab: white panels, a window onto benches, people in suits
    L.paint(1980, G - 140, 2290, G, (P) => {
      P.block(1980, G - 130, 2290, G, KMAT.whitepanel, { base: 0.48, panels: [20, 20] });
      kFill(P, 2000, G - 110, 2270, G - 50, '#7ab8a8', 0.12); for (let x = 2000; x < 2270; x += 45) kV(P, x, G - 110, G - 50, '#3a4a4a');
      for (let x = 2010; x < 2260; x += 30) { P.block(x, G - 70, x + 22, G - 50, MAT.steel, { base: 0.6 }); for (let k = 0; k < 3; k++) { const fx = x + 4 + k * 6; for (let j = 0; j < 7; j++) P.put(fx, G - 77 + j, j < 3 ? [230, 240, 240] : col3(['#3aff90', '#3ad8ff', '#ff6a8a'][k]), j >= 3 ? 0.8 : 0); } }
      kFill(P, 2120, G - 40, 2150, G, '#3a4a4a'); kCross(P, 2135, G - 120, 4, '#3aff80');
    });
    L.light(2130, G - 80, 120, [0.8, 1, 0.9], 0.8);
    for (const [x, n] of [[2040, 'Chemist Orr'], [2220, 'Lab hand']]) L.npc({ name: n, look: { skin: SKINS[x % 6], hair: 'hood', top: '#e8e8d0', legs: '#e8e8d0', mask: '#3a5a5a', tall: 0.95 }, x, y: G, sched: [[0, 24, x, 'work']], lines: n === 'Chemist Orr' ? ['Coolant\'s mostly glycol and a secret. The secret is mostly glycol.', 'The suit isn\'t for show, tinker. Mind your boots.'] : ['Don\'t mind me. Counting drums.', 'Six short. Six short every week.'] });
    L.prop('ac', 1480, G, { label: 'coolant pump' }); L.prop('junk', 1960, G, { label: 'empty drums' }); L.prop('ac', 540, G, { label: 'coolant pump' });
    for (const x of [460, 1020, 1700]) wkHangLamp(L, x, 110, G - 150, '#c8ffd0', 0.7);
    L.spots.push([300, G], [470, G], [700, G], [1020, G], [1330, G], [1560, G], [1900, G]);
    L.critter('rat', 200, 2200, G, 1);
  },
}));
