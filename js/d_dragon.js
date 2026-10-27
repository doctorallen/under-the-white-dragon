'use strict';
// ---------------------------------------------------------------------------
// The White Dragon: the noodle bar on the corner, and your back room behind
// it. The street out front with the tall neon sign on the corner; through the
// curtain, the bar, Auntie Lin at the pots; through the next curtain, the back
// room: the bench, the parts shelf, the cot. Home.
// Helpers carry the prefix `wd`.
// ---------------------------------------------------------------------------
const WD = { IN: 380, PART: 762, BACK: 774, END: 1092, CEIL: 122 };

addDistrict('d_dragon', 'The White Dragon', 1, 2, 230, 'The noodle bar on the corner, and your back room behind it.', 'The White Dragon', () => district({
  id: 'd_dragon', name: 'The White Dragon', tier: 1, W: 1120, crowd: 3, crowdFrom: 150, crowdTo: 330, amb: [0.2, 0.17, 0.26], layerDy: 0,
  build(L, G) {
    const C = G - WD.CEIL;
    // next door: a shophouse, flats above
    bShophouse(L, 150, 300, G, { floors: 4, wall: KMAT.teal, shops: [['glass', '#9af0ff']], roof: 'tank', seed: 911 });
    // the White Dragon's building: flats above the bar, a slab between
    L.paint(300, G - 330, WD.END + 28, C + 6, (P) => {
      P.block(300, G - 320, WD.END + 28, C, KMAT.plaster, { base: 0.4, panels: [60, 34], drips: 0.12, dripLen: 24 });
      for (let fy = G - 306; fy < C - 24; fy += 34) for (let fx = 316; fx < WD.END + 10; fx += 26) kWin(P, fx, fy, 14, 18, { lit: hash(fx, fy, 31) < 0.45 ? (hash(fx, fy, 32) < 0.5 ? '#ffd8a0' : '#a8e0ff') : null, blinds: hash(fx, fy, 33) < 0.4, curtain: hash(fx, fy, 34) < 0.3 ? '#5a2a3a' : null });
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
    L.npc({ name: 'Auntie Lin', role: 'noodles', look: { skin: SKINS[0], hair: 'bun', hairCol: '#c8c8c8', top: '#e8e0d0', apron: '#8a1a24', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 600, y: G - 2, face: 1, sched: [[0, 24, 600, 'work']], lines: ['Eat first. Then fix things.', 'The back room is yours as long as the rent comes and the police don\'t.', 'Nobody asks what you do back there. Nobody asks me what\'s in the broth either.'] });
    // ---- the partition: a curtain through to the back
    L.paint(WD.PART, C + 6, WD.BACK, G, (P) => { P.block(WD.PART, C + 6, WD.BACK, G - 40, MAT.concreteD, { base: 0.4 }); kNoren(P, WD.PART - 2, WD.BACK + 2, G - 40, 26, '#2a2a3a'); });
    // ---- the back room: bare concrete, a lamp over the bench, the shelves
    L.paint(WD.BACK, C + 6, WD.END, G, (P) => {
      P.block(WD.BACK, C + 6, WD.END, G, MAT.concreteD, { base: 0.3, lip: 0, panels: [46, 30], drips: 0.06, dripLen: 12 });
      // a pegboard of tools over the bench, cables along the ceiling
      kFill(P, 862, C + 30, 950, C + 70, '#2a2420'); for (let y = C + 34; y < C + 68; y += 4) for (let x = 866; x < 948; x += 4) P.put(x, y, [16, 12, 10]);
      for (const [x, y, w, h] of [[872, C + 40, 2, 16], [882, C + 38, 3, 12], [894, C + 42, 10, 3], [910, C + 38, 2, 18], [922, C + 44, 8, 8], [936, C + 40, 3, 14]]) kFill(P, x, y, x + w, y + h, '#8a8e96');
      for (let x = WD.BACK; x < WD.END; x++) P.put(x, C + 9 + Math.round(Math.sin(x * 0.05) * 1.5), [20, 20, 24]);
      // the hidden panel's seam, low on the wall (it opens later)
      for (let y = G - 34; y < G - 6; y++) P.put(1060, y, [24, 24, 28]);
      for (let x = WD.BACK; x < WD.END; x++) P.put(x, G - 2, [22, 22, 26]);
    });
    L.light(906, C + 16, 70, [1, 0.88, 0.7], 0.95); L.light(820, C + 40, 50, [0.6, 0.8, 1], 0.35);
    L.prop('workbench', 906, G, { label: 'your bench' });
    L.prop('shelf', 818, G, { label: 'the parts shelf' });
    L.prop('bed', 1020, G, {});
    L.wall(WD.END, C, WD.END + 28, G, MAT.concreteD, { base: 0.35 });
    L.spawns.bed = [1000, G];
    L.dry.push([330, 0, 1120, L.h]); // (no rain indoors, nor under the eaves)
    for (const w of L.wet) w.x1 = Math.min(w.x1, 330); // (the street is wet; the bar's floor isn't)
    // ---- the sign: on the corner, over the street
    L.prop('deco', 296, G - 10, { art: () => dragonSign(), id: 'wdsign' });
    L.light(296, G - 80, 110, [0.75, 0.9, 1], 0.9); L.light(266, G - 130, 50, [1, 0.3, 0.38], 0.6);
  },
}));
