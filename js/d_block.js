'use strict';
// ---------------------------------------------------------------------------
// The White Dragon's block: the places on its street you can walk into,
// besides the noodle bar. Each is its own level, hidden from the city map,
// entered by a door on the street (d_dragon.js puts the doors there):
//   d_grocery: Mo's grocery, open all hours: shelves, fridges, the produce,
//     the till.
//   d_flats: the block of flats over the mint shophouse, cut away: a lobby,
//     two flats on the ground floor, three upstairs, the stairs between.
// The people who live and work here are in town.js. Helpers carry the prefix `bk`.
// ---------------------------------------------------------------------------
const BK = { G: 386, F1: 386 - 76 }; // the ground, and the flats' upper floor

// a small hidden interior: walls, a ceiling, a door out at the west end
function bkRoom(id, name, W, build) {
  LEVELS[id] = { name, tier: 1, hidden: true, metres: 2, depth: '+2 m', mapX: 230, blurb: name, label: name, make: () => district({
    id, name, tier: 1, W, sky: false, rain: 0, amb: [0.14, 0.13, 0.16], floor: MAT.concreteD,
    build(L, G) { L.props = L.props.filter((p) => p.kind !== 'transit'); L.wall(0, 0, 24, G, MAT.concreteD, { base: 0.3 }); L.wall(W - 24, 0, W, G, MAT.concreteD, { base: 0.3 }); build(L, G); L.spots = Array.from({ length: 10 }, () => [W - 60, G]); },
  }) };
}
// goods on a shelf: rows of packets and tins in flat colours
function bkGoods(P, x0, x1, y, h, seed) {
  for (let x = x0; x < x1; ) {
    const w = 3 + Math.floor(hash(x, seed, 1) * 4), hh = Math.max(3, h - Math.floor(hash(x, seed, 2) * 4)), c = col3(['#e84a3a', '#f0c040', '#3a8ae8', '#e8e0d0', '#5ac85a', '#e87ab0', '#ff8a30', '#8a5ae8'][Math.floor(hash(x, seed, 3) * 8)]);
    for (let yy = y - hh; yy < y; yy++) for (let xx = x; xx < Math.min(x1, x + w); xx++) P.put(xx, yy, xx === x ? mixRgb(c, [255, 255, 255], 0.25) : yy === y - hh ? mixRgb(c, [255, 255, 255], 0.15) : (yy - y + hh) === Math.floor(hh / 2) ? mixRgb(c, [255, 255, 255], 0.5) : c);
    x += w + 1;
  }
}

// ---- Mo's grocery ---------------------------------------------------------------
bkRoom('d_grocery', 'Mo\'s Grocery', 540, (L, G) => {
  const C = G - 118;
  L.paint(0, 0, 540, G, (P) => {
    P.block(0, 0, 540, C, MAT.concreteD, { base: 0.14, lip: 0, panels: [80, 40] });
    // pale green tile, a darker band at the foot
    for (let y = C; y < G; y++) for (let x = 24; x < 516; x++) { const grout = (x - 24) % 12 === 0 || (y - C) % 10 === 0; P.put(x, y, y > G - 22 ? (grout ? [40, 70, 60] : [60, 100, 86]) : grout ? [120, 150, 138] : mixRgb([170, 200, 186], [130, 160, 150], hash(x >> 3, y >> 3, 91) * 0.5)); }
    for (let k = 0; k < 18; k++) P.tint(30 + Math.floor(hash(k, 1, 92) * 480), C + Math.floor(hash(k, 2, 92) * 90), [90, 80, 60], 0.25);
    kFill(P, 24, C, 516, C + 4, '#2a2a30');
    // the window onto the street by the door, the 24H sign in it
    kFill(P, 70, C + 22, 120, G - 30, '#06080e'); for (let y = C + 23; y < G - 31; y++) for (let x = 71; x < 119; x++) { const v = hash(x >> 2, y >> 3, 93); P.put(x, y, v < 0.07 ? [255, 74, 176] : v < 0.12 ? [58, 240, 224] : mixRgb([10, 14, 24], [24, 30, 48], (y - C) / 90)); }
    // produce under the window: crates of fruit and greens
    for (const [x, c] of [[66, [255, 140, 40]], [86, [90, 200, 70]], [106, [230, 60, 50]]]) { kFill(P, x, G - 22, x + 18, G - 10, '#6a4a2a'); for (let k = 0; k < 14; k++) P.put(x + 2 + (k % 7) * 2, G - 24 + Math.floor(k / 7) * 2, mixRgb(c, [255, 255, 255], (k % 3) * 0.12)); kFill(P, x + 1, G - 10, x + 3, G, '#3a2a1a'); kFill(P, x + 15, G - 10, x + 17, G, '#3a2a1a'); }
    // three shelving units, five shelves each, full
    for (const [x0, x1] of [[140, 210], [224, 294], [308, 362]]) {
      kFill(P, x0, C + 18, x1, G, '#2a2e36'); kFill(P, x0 + 2, C + 20, x1 - 2, G - 2, '#14161c');
      for (let k = 0; k < 5; k++) { const y = C + 36 + k * 16; kFill(P, x0, y, x1, y + 2, '#8a909c'); bkGoods(P, x0 + 3, x1 - 3, y, 11, x0 + k * 17); }
      kFill(P, x0 + 4, C + 10, x1 - 4, C + 17, '#e84a3a'); for (let x = x0 + 8; x < x1 - 8; x += 5) P.put(x, C + 13, [255, 240, 220]);
    }
    // the drinks fridges: glass doors lit cold, bottles in rows
    kFill(P, 374, C + 14, 440, G, '#1a1e24');
    for (const x0 of [377, 409]) { for (let y = C + 17; y < G - 3; y++) for (let x = x0; x < x0 + 29; x++) P.put(x, y, mixRgb([150, 230, 250], [60, 140, 180], (y - C) / 100), 0.25); for (let k = 0; k < 5; k++) { const y = C + 30 + k * 15; for (let x = x0 + 2; x < x0 + 27; x += 3) { const c = col3(['#3af0e0', '#ff4a6a', '#ffd040', '#3aff80'][(x + k) % 4]); for (let yy = y - 8; yy < y; yy++) P.put(x, yy, yy < y - 6 ? [220, 220, 230] : c, 0.4); } kFill(P, x0, y, x0 + 29, y + 1, '#9ab8c8'); } }
    // the till: a counter, the register's screen, a rack of sweets
    P.block(452, G - 30, 512, G - 26, KMAT.darkwood, { base: 0.6 }); P.block(456, G - 26, 508, G, MAT.steelD, { base: 0.4, panels: [26, 26] });
    kFill(P, 462, G - 40, 478, G - 30, '#1a1e24'); for (let x = 464; x < 476; x++) P.put(x, G - 37, [80, 255, 140], 0.8);
    bkGoods(P, 484, 506, G - 30, 6, 77);
    for (let x = 24; x < 516; x++) P.put(x, G - 1, [40, 50, 46]);
  });
  for (const x of [80, 200, 320, 440]) L.tube(x - 20, C + 6, 40, '#e8fff4', 0.6);
  L.light(408, G - 50, 60, [0.6, 0.9, 1], 0.6);
  L.prop('door', 44, G, { label: 'Out to the street', out: true, to: ['d_dragon', 'grocery'] });
  L.spawns = { door: [60, G] };
});

// ---- the flats: a lobby and five flats, cut away ------------------------------------
// each flat: its walls' colour, where the bed and the table are, a window, a light
const FLATS = {
  A: { x0: 190, x1: 350, y: BK.G, wall: '#6a5a4a', bed: 326, table: 250, tag: 'plants' },
  B: { x0: 350, x1: 516, y: BK.G, wall: '#5a4a5a', bed: 492, table: 420, tag: 'shrine' },
  C: { x0: 190, x1: 300, y: BK.F1, wall: '#3a5a6a', bed: 208, table: 272, tag: 'tv' },
  D: { x0: 300, x1: 410, y: BK.F1, wall: '#6a6a3a', bed: 390, table: 332, tag: 'toys' },
  E: { x0: 410, x1: 516, y: BK.F1, wall: '#4a3a3a', bed: 494, table: 452, tag: 'bike' },
};
const FLAT_STAIRS = { x0: 104, x1: 178 }; // from the lobby (x0) up to the upper floor (x1)
bkRoom('d_flats', 'Wan Fat Mansions', 540, (L, G) => {
  const F1 = BK.F1, C1 = G - 72, C2 = F1 - 74;
  L.paint(0, 0, 540, G, (P) => {
    P.block(0, 0, 540, C2, MAT.concreteD, { base: 0.14, lip: 0, panels: [80, 40] });
    // the lobby and the stairwell: bare concrete, mailboxes, a bike
    P.block(24, C2, 540, G, MAT.concreteD, { base: 0.26, lip: 0, panels: [40, 30], drips: 0.08, dripLen: 16 });
    kFill(P, 40, G - 46, 96, G - 22, '#3a3e48'); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { kFill(P, 42 + c * 13, G - 44 + r * 7, 53 + c * 13, G - 39 + r * 7, '#5a606c'); P.put(47 + c * 13, G - 42 + r * 7, [200, 200, 210]); }
    // each flat: its wallpaper, a window on the city, its own bits
    for (const k in FLATS) {
      const F = FLATS[k], top = F.y - 70, wc = col3(F.wall);
      for (let y = top; y < F.y; y++) for (let x = F.x0; x < F.x1; x++) P.put(x, y, mixRgb(wc, [0, 0, 0], ((x - F.x0) % 8 === 0 ? 0.12 : 0) + (y > F.y - 14 ? 0.2 : 0) + hash(x >> 3, y >> 3, 94) * 0.08));
      // the partition at its west end, a doorway in it
      for (let y = top; y < F.y; y++) for (const x of [F.x0, F.x0 + 1, F.x0 + 2]) P.put(x, y, y > F.y - 34 && x !== F.x0 ? [20, 18, 22] : [70, 66, 72]);
      kFill(P, F.x0 + 3, F.y - 34, F.x0 + 5, F.y, '#3a2a1a');
      // the window
      const wx = Math.round((F.x0 + F.x1) / 2) - 12; kFill(P, wx, top + 14, wx + 24, top + 36, '#06080e'); for (let y = top + 15; y < top + 35; y++) for (let x = wx + 1; x < wx + 23; x++) { const v = hash(x >> 1, y >> 2, 95 + F.x0); P.put(x, y, v < 0.08 ? [255, 200, 120] : v < 0.11 ? [58, 240, 224] : [14, 18, 30], v < 0.11 ? 0.4 : 0); } for (let x = wx; x < wx + 24; x++) P.put(x, top + 25, [60, 56, 62]);
      // the table and a chair
      kFill(P, F.table - 10, F.y - 15, F.table + 10, F.y - 13, '#6a4a2a'); kFill(P, F.table - 1, F.y - 13, F.table + 1, F.y, '#3a2a1a'); kFill(P, F.table - 14, F.y - 10, F.table - 9, F.y, '#4a3a2a');
      if (F.tag === 'plants') for (const px of [F.x0 + 10, F.x0 + 18]) { kFill(P, px, F.y - 8, px + 6, F.y, '#8a4a2a'); for (let k = 0; k < 10; k++) P.put(px + 3 + Math.round(Math.sin(k) * 3), F.y - 9 - k, [60, 160, 70]); }
      if (F.tag === 'shrine') { kFill(P, F.x1 - 54, top + 26, F.x1 - 38, top + 40, '#5a1a1a'); P.put(F.x1 - 46, top + 30, [255, 180, 80], 1); P.put(F.x1 - 44, top + 34, [255, 120, 60], 0.8); }
      if (F.tag === 'toys') for (let k = 0; k < 4; k++) kFill(P, F.x0 + 14 + k * 7, F.y - 4, F.x0 + 18 + k * 7, F.y, ['#ff4a4a', '#3a8aff', '#ffd040', '#3aff80'][k]);
      if (F.tag === 'bike') { for (const cx of [F.x0 + 20, F.x0 + 38]) for (let a = 0; a < 6.3; a += 0.4) P.put(cx + Math.round(Math.cos(a) * 6), F.y - 7 + Math.round(Math.sin(a) * 6), [40, 44, 52]); kFill(P, F.x0 + 20, F.y - 12, F.x0 + 38, F.y - 11, '#ff8a20'); }
    }
    // the floors: the upper floor's slab over the ground floor
    P.block(24, F1, FLAT_STAIRS.x0, F1 + 5, MAT.concreteD, { base: 0.5 }); P.block(FLAT_STAIRS.x1, F1, 540, F1 + 5, MAT.concreteD, { base: 0.5 }); P.block(24, C2 - 4, 540, C2, MAT.concreteD, { base: 0.4 });
    // over the lobby, a corner of washing lines
    for (let x = 30; x < 98; x++) P.put(x, F1 - 50 + Math.round(Math.sin((x - 30) / 68 * Math.PI) * 4), [90, 90, 96]); for (const [x, c] of [[40, '#c8c0b0'], [56, '#5a7aa8'], [72, '#a85a5a'], [86, '#c8c0b0']]) kFill(P, x, F1 - 48, x + 8, F1 - 36, c);
    // the stairs' stringer
    for (let k = 0; k <= FLAT_STAIRS.x1 - FLAT_STAIRS.x0; k++) { const x = FLAT_STAIRS.x0 + k, y = G - Math.round((k / (FLAT_STAIRS.x1 - FLAT_STAIRS.x0)) * (G - F1)); for (let d = 0; d < 4; d++) P.put(x, y + d, d === 0 ? [110, 110, 120] : [50, 50, 58]); }
    for (let x = 24; x < 540; x++) P.put(x, G - 1, [30, 28, 34]);
  });
  L.walk(24, FLAT_STAIRS.x0, F1, 5, MAT.concreteD); L.walk(FLAT_STAIRS.x1, 516, F1, 5, MAT.concreteD); L.stairs(FLAT_STAIRS.x0, G, FLAT_STAIRS.x1, F1);
  for (const k in FLATS) { const F = FLATS[k]; L.prop('deco', F.bed, F.y, { art: () => bed(), id: 'flatbed' + k }); L.light(F.table, F.y - 50, 60, [1, 0.8, 0.55], 0.55); }
  for (const k of ['C', 'D']) L.prop('deco', FLATS[k].bed + (k === 'C' ? 26 : -26), FLATS[k].y, { art: () => bed(), id: 'flatbed2' + k }); // (a second bed: two live there)
  L.ad(FLATS.C.table + 14, BK.F1 - 40, 18, 12, 'cycle', ['#3af0e0', '#ff4ab0']);
  L.light(60, G - 50, 50, [0.9, 0.9, 1], 0.4); L.light(140, F1 - 40, 50, [0.9, 0.9, 1], 0.4);
  L.prop('door', 50, G, { label: 'Out to the street', out: true, to: ['d_dragon', 'flats'] });
  L.spawns = { door: [70, G] };
});
