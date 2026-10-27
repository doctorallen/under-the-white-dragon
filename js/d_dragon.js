'use strict';
// ---------------------------------------------------------------------------
// The White Dragon: the noodle bar on the corner, and your workshop under it.
// The street out front with the neon sign on the corner; through the curtain,
// the bar, Auntie Lin at the pots; through the next curtain, her storeroom, and
// under a rug in it the trapdoor down to the basement (d_cellar, its own place,
// hidden from the city map): the bench, the parts shelf, the cot. Home.
// Helpers carry the prefix `wd`.
// ---------------------------------------------------------------------------
const WD = { IN: 380, PART: 762, BACK: 774, END: 1092, CEIL: 122 };

addDistrict('d_dragon', 'The White Dragon', 1, 2, 230, 'The noodle bar on the corner, and what nobody knows is under it.', 'The White Dragon', () => district({
  id: 'd_dragon', name: 'The White Dragon', tier: 1, W: 1120, crowd: 3, crowdFrom: 150, crowdTo: 330, amb: [0.2, 0.17, 0.26], layerDy: 0,
  build(L, G) {
    const C = G - WD.CEIL;
    // next door: a shophouse, flats above
    bShophouse(L, 150, 282, G, { floors: 4, wall: KMAT.teal, shops: [['glass', '#9af0ff']], roof: 'tank', seed: 911 });
    // a gap between the buildings: pipes, a drainpipe, the dark
    L.paint(282, G - 330, 300, G, (P) => { kFill(P, 282, G - 330, 300, G, '#08070c'); for (let y = G - 330; y < G; y++) { P.put(286, y, [26, 28, 34]); P.put(287, y, [44, 48, 56]); } for (let y = G - 300; y < G; y += 46) for (let x = 282; x < 300; x++) P.put(x, y, [30, 30, 38]); });
    // the White Dragon's building: flats above the bar, a slab between
    L.paint(300, G - 330, WD.END + 28, C + 6, (P) => {
      P.block(300, G - 320, WD.END + 28, C, KMAT.plaster, { base: 0.4, panels: [60, 34], drips: 0.12, dripLen: 24 });
      for (let fy = G - 306; fy < C - 24; fy += 34) for (let fx = 316; fx < WD.END + 10; fx += 26) if (fx > 352 || fy + 18 < G - 150) kWin(P, fx, fy, 14, 18, { lit: hash(fx, fy, 31) < 0.45 ? (hash(fx, fy, 32) < 0.5 ? '#ffd8a0' : '#a8e0ff') : null, blinds: hash(fx, fy, 33) < 0.4, curtain: hash(fx, fy, 34) < 0.3 ? '#5a2a3a' : null });
      P.block(296, G - 330, WD.END + 30, G - 320, KMAT.kawara, { base: 0.5 });
      P.block(300, C, WD.END + 28, C + 6, MAT.concreteD, { base: 0.5 });
    });
    // the front: a pier at the corner, the entrance with its curtain
    L.paint(300, C, WD.IN, G, (P) => {
      P.block(300, C + 6, 330, G, KMAT.lacquer, { base: 0.42 });
      kFill(P, 330, C + 6, WD.IN, G, '#140c0a');
      kNoren(P, 334, WD.IN - 2, C + 10, 30, '#e8e4dc');
    });
    // ---- the bar: warm tiles, a counter, stools, lanterns, the menu
    L.paint(WD.IN, C + 6, WD.PART, G, (P) => {
      P.block(WD.IN, C + 6, WD.PART, G, KMAT.terracotta, { base: 0.36, lip: 0, panels: [8, 8] });
      // the menu boards over the pots, steam stains on the tiles
      for (const [x, w] of [[470, 60], [560, 80], [668, 50]]) { kFill(P, x, C + 18, x + w, C + 40, '#120806'); for (let k = 0; k < w - 10; k += 5) P.put(x + 5 + k, C + 24 + (k % 3) * 5, [255, 210, 150], 0.4); }
      // the counter
      P.block(440, G - 30, 720, G - 26, KMAT.darkwood, { base: 0.62 }); P.block(446, G - 26, 714, G, KMAT.lacquer, { base: 0.38, panels: [34, 26] });
      // a skirting, the floor's edge
      for (let x = WD.IN; x < WD.PART; x++) P.put(x, G - 2, [30, 14, 10]);
    });
    bLanterns(L, WD.IN + 10, WD.PART - 10, C + 10, ['#ff3a3a', '#ffb040'], { step: 26 });
    for (const x of [470, 520, 570, 620, 670]) L.prop('deco', x, G, { art: () => stool(), id: 'wdstool' + x });
    L.light(580, G - 50, 120, [1, 0.62, 0.38], 0.9); L.vents.push && L.vents.push({ x: 600, y: G - 34, kind: 'steam' });
    L.npc({ name: 'Auntie Lin', role: 'noodles', look: { skin: SKINS[0], hair: 'bun', hairCol: '#c8c8c8', top: '#e8e0d0', apron: '#8a1a24', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 600, y: G - 2, face: 1, sched: [[0, 24, 600, 'work']], lines: ['Eat first. Then fix things.', 'The cellar is yours as long as the rent comes and nobody lifts that rug.', 'Nobody asks what you do down there. Nobody asks me what\'s in the broth either.'] });
    // ---- the partition: a curtain through to the back
    L.paint(WD.PART, C + 6, WD.BACK, G, (P) => { P.block(WD.PART, C + 6, WD.BACK, G - 40, MAT.concreteD, { base: 0.4 }); kNoren(P, WD.PART - 2, WD.BACK + 2, G - 40, 26, '#2a2a3a'); });
    // ---- the storeroom: sacks and crates, the cold room, a mop, and a rug
    L.paint(WD.BACK, C + 6, WD.END, G, (P) => {
      P.block(WD.BACK, C + 6, WD.END, G, MAT.concreteD, { base: 0.3, lip: 0, panels: [46, 30], drips: 0.06, dripLen: 12 });
      // shelves of sacks and tins along the wall
      for (const y of [C + 40, C + 70]) { P.block(790, y, 900, y + 3, KMAT.darkwood, { base: 0.5 }); for (let x = 794; x < 896; x += 12) { const top = y - 12 + (x % 3), c = [[200, 184, 144], [168, 152, 112], [216, 200, 160]][(x >> 2) % 3]; for (let yy = top; yy < y; yy++) { const k = yy - top, inset = k < 2 ? 3 - k : 0; for (let xx = x + inset; xx < x + 10 - inset; xx++) P.put(xx, yy, k === 2 ? [90, 70, 50] : xx === x + inset ? mixRgb(c, [255, 240, 210], 0.3) : xx === x + 9 - inset ? mixRgb(c, [20, 14, 10], 0.4) : c); } for (let xx = x + 3; xx < x + 7; xx++) P.put(xx, top + 6, mixRgb(c, [120, 30, 30], 0.6)); } }
      // the cold room's steel door, a strip of light under it
      P.block(930, C + 24, 976, G, MAT.steelD, { base: 0.45, panels: [46, 24] }); kFill(P, 966, C + 60, 972, C + 76, '#8a909c'); for (let x = 930; x < 976; x++) P.put(x, G - 1, [120, 200, 230]);
      for (let x = WD.BACK; x < WD.END; x++) P.put(x, C + 9 + Math.round(Math.sin(x * 0.05) * 1.5), [20, 20, 24]);
      for (let x = WD.BACK; x < WD.END; x++) P.put(x, G - 2, [22, 22, 26]);
    });
    L.light(880, C + 16, 60, [1, 0.8, 0.55], 0.7); L.light(953, G - 4, 26, [0.5, 0.8, 1], 0.4);
    for (const [x, w, h, col] of [[808, 14, 12, '#5a4a32'], [824, 12, 10, '#4a3a2a'], [814, 12, 9, '#6a5a3a'], [1050, 16, 14, '#4a4a3a'], [1068, 12, 10, '#5a4a32']]) L.prop('deco', x, x === 814 ? G - 12 : G, { art: () => crate({ w, h, col }), id: 'wdcrate' + x + h });
    // the rug, and under it the trapdoor down
    L.prop('trapdoor', 1010, G, { to: ['d_cellar', 'ladder'] });
    L.spawns.trapdoor = [1010, G];
    L.wall(WD.END, C, WD.END + 28, G, MAT.concreteD, { base: 0.35 });
    L.dry.push([330, 0, 1120, L.h]); // (no rain indoors, nor under the eaves)
    for (const w of L.wet) w.x1 = Math.min(w.x1, 330); // (the street is wet; the bar's floor isn't)
    // ---- the street out front: a machine and a junk pile to strip
    L.prop('vending', 250, G, { look: { col: '#3af0e0', body: '#2a3a4a' }, label: 'vending machine' }); L.light(250, G - 12, 30, [0.3, 0.9, 1], 0.5);
    L.prop('junk', 186, G, { label: 'junk pile' });
    // ---- the sign: on the corner, over the street
    // a conduit from the sign down the pier into the wall
    L.paint(318, G - 48, 324, G, (P) => { for (let y = G - 48; y < G - 4; y++) { P.put(320, y, [20, 22, 28]); P.put(321, y, [58, 62, 72]); } for (const y of [G - 40, G - 24, G - 10]) { P.put(319, y, [90, 96, 108]); P.put(322, y, [90, 96, 108]); } });
    L.prop('deco', 312, G - 46, { art: () => dragonSign(), id: 'wdsign' });
    L.light(316, G - 100, 90, [0.75, 0.9, 1], 0.8); L.light(296, G - 120, 40, [1, 0.3, 0.38], 0.5);
  },
}));

// ---- the basement: under the storeroom, down the ladder. Brick, pipes, a sump,
// one bulb over the ladder and the lamp over your bench. Its own place, but not
// on the city map: you can only get here through the trapdoor.
const CL = { W: 560, CEIL: 132 };
LEVELS.d_cellar = { name: 'Under the White Dragon', tier: 1, hidden: true, metres: -4, depth: '-4 m', mapX: 230, blurb: 'Your workshop, under the noodle bar. Nobody knows.', label: 'Workshop', make: () => district({
  id: 'd_cellar', name: 'Under the White Dragon', tier: 1, W: CL.W, sky: false, rain: 0, amb: [0.12, 0.11, 0.15], floor: MAT.concreteD,
  build(L, G) {
    const C = G - CL.CEIL;
    // no way out but the ladder: the district's spinner pad isn't here
    L.props = L.props.filter((p) => p.kind !== 'transit');
    L.paint(0, 0, CL.W, G, (P) => {
      P.block(0, 0, CL.W, C, MAT.concreteD, { base: 0.18, lip: 0, panels: [80, 40] }); // the storeroom's floor, seen from under
      P.block(0, C, CL.W, G, MAT.brickD, { base: 0.26, lip: 0, panels: [40, 22], drips: 0.18, dripLen: 30 });
      kFill(P, 0, C, CL.W, C + 4, '#141218');
      for (let x = 10; x < CL.W; x += 48) kFill(P, x, C + 4, x + 6, C + 10, '#1e1a20'); // joists
      // pipes along the ceiling, one dripping down the wall to the sump
      for (let x = 0; x < CL.W; x++) { P.put(x, C + 14, [30, 34, 40]); P.put(x, C + 15, [66, 72, 82]); P.put(x, C + 16, [22, 24, 30]); }
      for (let y = C + 16; y < G - 6; y++) { P.put(520, y, [30, 34, 40]); P.put(521, y, [66, 72, 82]); }
      kFill(P, 506, G - 6, 536, G - 2, '#0a0c10'); for (let x = 508; x < 534; x += 3) P.put(x, G - 4, [40, 44, 50]);
      // the hatch in the ceiling over the ladder, light through its edges
      kFill(P, 52, C - 2, 92, C + 2, '#2a2620'); for (let x = 54; x < 90; x++) P.put(x, C + 2, [255, 210, 150]);
      // a pegboard of tools over the bench
      kFill(P, 236, C + 30, 330, C + 74, '#2a2420'); for (let y = C + 34; y < C + 72; y += 4) for (let x = 240; x < 328; x += 4) P.put(x, y, [16, 12, 10]);
      for (const [x, y, w, h] of [[248, C + 42, 2, 16], [258, C + 40, 3, 12], [270, C + 46, 10, 3], [288, C + 40, 2, 18], [300, C + 48, 8, 8], [316, C + 42, 3, 14]]) kFill(P, x, y, x + w, y + h, '#8a8e96');
      // the old hidden panel's seam, low on the wall (it opens later)
      for (let y = G - 34; y < G - 6; y++) P.put(430, y, [24, 22, 26]);
      for (let x = 0; x < CL.W; x++) P.put(x, G - 2, [22, 20, 24]);
    });
    L.wall(0, 0, 24, G, MAT.concreteD, { base: 0.3 }); L.wall(CL.W - 24, 0, CL.W, G, MAT.concreteD, { base: 0.3 });
    // the ladder up
    L.paint(60, C, 86, G, (P) => { for (let y = C; y < G; y++) for (const x of [62, 82]) { P.put(x, y, [40, 44, 52]); P.put(x + 1, y, [96, 102, 114]); } for (let y = C + 6; y < G - 2; y += 8) for (let x = 64; x < 82; x++) { P.put(x, y, [110, 116, 128]); P.put(x, y + 1, [36, 40, 48]); } });
    L.prop('trapdoor', 72, G, { up: true, to: ['d_dragon', 'trapdoor'] });
    L.light(72, C + 6, 50, [1, 0.8, 0.55], 0.6);
    // the bench under its lamp, the shelf, the cot
    L.prop('shelf', 170, G, { label: 'the parts shelf' });
    L.prop('workbench', 282, G, { label: 'your bench' });
    L.light(282, C + 20, 80, [1, 0.88, 0.7], 1); L.light(170, C + 40, 44, [0.6, 0.8, 1], 0.3);
    L.prop('bed', 470, G, {});
    L.spawns = { ladder: [96, G], bed: [450, G] };
    // a terminal of your own, at the far end by the cot
    L.spots = Array.from({ length: 10 }, () => [404, G]);
  },
}) };
