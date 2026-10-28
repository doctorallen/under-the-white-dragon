'use strict';
// ---------------------------------------------------------------------------
// The White Dragon: a noodle bar on a street of the Stack, one shopfront among
// the others, and your workshop under it. Three places, each its own level:
//   d_dragon, the street: the buildings, the White Dragon's front with its
//     neon sign over the door, a machine and a junk pile, a cab stand.
//   d_noodles, the shop (hidden from the city map): through the front door,
//     the dining room with people eating, Auntie Lin at the counter, and
//     through the curtain her storeroom, with a rug over the trapdoor.
//   d_cellar, the basement (hidden too): down the ladder from the trapdoor.
// Helpers carry the prefix `wd`.
// ---------------------------------------------------------------------------
const WD = { FRONT: 300, DOOR: 424, END: 470, CEIL: 62 }; // (the shop's ground floor: a door's height and the fascia over it)

addDistrict('d_dragon', 'The White Dragon', 1, 2, 230, 'A street of shophouses and capsules, and on it a noodle bar with what nobody knows under it.', 'The White Dragon', () => district({
  id: 'd_dragon', name: 'The White Dragon', tier: 1, W: 1500, amb: [0.2, 0.17, 0.26], layerDy: 0,
  build(L, G) {
    const C = G - WD.CEIL;
    // the street: a shophouse, then an alley, the White Dragon, then the rest of the block
    bShophouse(L, 150, 282, G, { floors: 4, wall: KMAT.teal, shops: [['glass', '#9af0ff']], roof: 'tank', seed: 911 });
    L.paint(282, G - 330, 300, G, (P) => { kFill(P, 282, G - 330, 300, G, '#08070c'); for (let y = G - 330; y < G; y++) { P.put(286, y, [26, 28, 34]); P.put(287, y, [44, 48, 56]); } for (let y = G - 300; y < G; y += 46) for (let x = 282; x < 300; x++) P.put(x, y, [30, 30, 38]); });
    bCapsules(L, 490, 650, G, { h: 300, sign: '#ffd040', seed: 913 });
    bMachiya(L, 666, 780, G, { noren: '#2a3a6a', seed: 915 });
    bArcade(L, 796, 940, G, { col: '#3af0e0', h: 130, seed: 917 });
    bShophouse(L, 956, 1120, G, { floors: 3, wall: KMAT.mint, shops: [['noren', '#ff4ab0'], ['glass', '#ffd040']], roof: 'flat', seed: 919 });
    bStack(L, 1136, 1400, G, { levels: 4, blade: '#ff4ab0', shop: 'pawn', shopCol: '#ffb040', seed: 921 });
    // the White Dragon's building: flats above, the shop below
    L.paint(WD.FRONT, G - 330, WD.END + 6, G, (P) => {
      P.block(WD.FRONT, G - 320, WD.END, C, KMAT.plaster, { base: 0.4, panels: [60, 34], drips: 0.12, dripLen: 24 });
      for (let fy = C - 50 + 12; fy > G - 316; fy -= 50) for (let fx = 334; fx < WD.END - 22; fx += 34) kWin(P, fx, fy, KS.winW, KS.winH, { lit: hash(fx, fy, 31) < 0.45 ? (hash(fx, fy, 32) < 0.5 ? '#ffd8a0' : '#a8e0ff') : null, blinds: hash(fx, fy, 33) < 0.4, curtain: hash(fx, fy, 34) < 0.3 ? '#5a2a3a' : null });
      P.block(WD.FRONT - 4, G - 330, WD.END + 4, G - 320, KMAT.kawara, { base: 0.5 });
      P.block(WD.FRONT, C, WD.END, C + 6, MAT.concreteD, { base: 0.5 });
      // the pier at the corner, the shop window, the door with its curtain, a pier at the end
      P.block(WD.FRONT, C + 6, 330, G, KMAT.lacquer, { base: 0.42 });
      P.block(WD.END - 12, C + 6, WD.END, G, KMAT.lacquer, { base: 0.42 });
      P.block(330, C + 6, WD.END - 12, C + 16, KMAT.darkwood, { base: 0.5 }); // the fascia
      // the shopfront's own wall, behind the window and the door (nothing of the city shows through)
      P.block(330, C + 16, WD.END - 12, G, KMAT.darkwood, { base: 0.32, panels: [24, 30] });
      // the window: warm light, steam on the glass, people eating at the counter inside
      kFill(P, 336, C + 20, 404, G - 14, '#2a120a');
      for (let y = C + 21; y < G - 15; y++) for (let x = 337; x < 403; x++) P.put(x, y, mixRgb([220, 130, 60], [140, 60, 28], (y - C) / 50), 0.14);
      for (const [x, h] of [[346, 14], [362, 16], [380, 13], [394, 15]]) { for (let y = G - 18 - h; y < G - 18; y++) for (let dx = 0; dx < 6; dx++) if (y > G - 18 - h + 3 || (dx > 1 && dx < 4)) P.put(x + dx, y, [40, 20, 14]); } // (people at the counter inside)
      for (let x = 337; x < 403; x++) { P.put(x, G - 19, [60, 30, 18]); P.put(x, G - 18, [90, 50, 30]); }
      for (let x = 337; x < 403; x++) P.put(x, Math.round((C + G) / 2) - 4, [60, 30, 18]);
      kFill(P, 334, G - 14, 406, G - 11, '#1a0e0a'); kFill(P, 334, G - 11, 406, G, '#2a1612');
      // the door, a person's height: dark wood frame, the warm inside through it, the curtain over the top
      kFill(P, WD.DOOR - 13, G - KS.door - 4, WD.DOOR + 13, G, '#140c0a'); kFill(P, WD.DOOR - 10, G - KS.door, WD.DOOR + 10, G, '#e8a060', 0.4);
      for (let y = G - KS.door; y < G; y++) P.put(WD.DOOR - 1, y, [120, 60, 30]);
      kNoren(P, WD.DOOR - 14, WD.DOOR + 14, G - KS.door - 6, 16, '#e8e4dc');
    });
    // the gap to the next building: an alley, dark, a drainpipe
    L.paint(WD.END, G - 330, 490, G, (P) => { kFill(P, WD.END, G - 330, 490, G, '#08070c'); for (let y = G - 330; y < G; y++) { P.put(478, y, [26, 28, 34]); P.put(479, y, [44, 48, 56]); } for (let y = G - 300; y < G; y += 46) for (let x = WD.END; x < 490; x++) P.put(x, y, [30, 30, 38]); });
    bLanterns(L, 336, 450, C + 8, ['#ff3a3a', '#ffb040'], { step: 22 });
    L.light(370, G - 30, 50, [1, 0.6, 0.35], 0.7); L.light(WD.DOOR, G - 20, 34, [1, 0.65, 0.35], 0.8);
    L.prop('door', WD.DOOR, G, { label: 'The White Dragon', to: ['d_noodles', 'door'] });
    L.spawns.door = [WD.DOOR, G];
    // the sign on the corner, over the street, a conduit down the pier
    L.paint(318, G - 48, 324, G, (P) => { for (let y = G - 48; y < G - 4; y++) { P.put(320, y, [20, 22, 28]); P.put(321, y, [58, 62, 72]); } for (const y of [G - 40, G - 24, G - 10]) { P.put(319, y, [90, 96, 108]); P.put(322, y, [90, 96, 108]); } });
    L.prop('deco', 312, G - 46, { art: () => dragonSign(), id: 'wdsign' });
    L.light(316, G - 100, 90, [0.75, 0.9, 1], 0.8); L.light(296, G - 120, 40, [1, 0.3, 0.38], 0.5);
    // the other doors on the block: Mo's grocery in the teal shophouse, the flats over the mint one
    L.paint(200, G - 40, 232, G, (P) => { kFill(P, 204, G - 38, 228, G, '#0e1a1a'); for (let y = G - 36; y < G; y++) for (let x = 206; x < 226; x++) P.put(x, y, [170, 230, 210], 0.18); kFill(P, 204, G - 46, 228, G - 40, '#0a0e10'); for (let x = 207; x < 226; x += 2) P.put(x, G - 43, [80, 255, 160], 0.9); });
    L.prop('door', 216, G, { label: 'Mo\'s Grocery, open all hours', to: ['d_grocery', 'door'] }); L.light(216, G - 30, 40, [0.6, 1, 0.8], 0.5);
    L.paint(1026, G - 44, 1056, G, (P) => { kFill(P, 1028, G - 42, 1054, G, '#1a1410'); for (let y = G - 40; y < G; y++) P.put(1041, y, [255, 200, 130], 0.3); kFill(P, 1026, G - 44, 1056, G - 42, '#4a4a52'); for (let k = 0; k < 6; k++) P.put(1030 + k * 4, G - 26, [200, 200, 210]); });
    L.prop('door', 1041, G, { label: 'Wan Fat Mansions: the flats', to: ['d_flats', 'door'] }); L.light(1041, G - 34, 30, [1, 0.8, 0.5], 0.5);
    L.spawns.grocery = [216, G]; L.spawns.flats = [1041, G];
    // a machine and a junk pile to strip
    L.prop('vending', 250, G, { look: { col: '#3af0e0', body: '#2a3a4a' }, label: 'vending machine' }); L.light(250, G - 12, 30, [0.3, 0.9, 1], 0.5);
    L.prop('junk', 186, G, { label: 'junk pile' });
    L.prop('vending', 1430, G, { look: { col: '#ff4ab0', body: '#3a2a3a' }, label: 'vending machine' }); L.light(1430, G - 12, 30, [1, 0.3, 0.7], 0.5);
  },
}));

// ---- the shop: through the front door. The dining room, Auntie Lin at the
// counter, and through the curtain her storeroom with the rug and the trapdoor.
const WN = { W: 940, DOOR: 340, CEIL: 128, PART: 618, BACK: 630, END: 912 };
LEVELS.d_noodles = { name: 'The White Dragon', tier: 1, hidden: true, metres: 2, depth: '+2 m', mapX: 230, blurb: 'Auntie Lin\'s noodle bar.', label: 'Noodle bar', make: () => district({
  id: 'd_noodles', name: 'The White Dragon', tier: 1, W: WN.W, sky: false, rain: 0, amb: [0.5, 0.4, 0.34], floor: KMAT.darkwood,
  build(L, G) {
    const C = G - WN.CEIL;
    L.props = L.props.filter((p) => p.kind !== 'transit');
    L.paint(0, 0, WN.W, G, (P) => {
      P.block(0, 0, WN.W, C, MAT.concreteD, { base: 0.14, lip: 0, panels: [80, 40] }); // the flats' floor over the shop
      kFill(P, 0, C, WN.W, C + 6, '#1a0e0a');
      // the dining room: warm tile, the menu boards, steam stains
      P.block(24, C + 6, WN.PART, G, KMAT.terracotta, { base: 0.36, lip: 0, panels: [8, 8] });
      for (const [x, w] of [[380, 60], [460, 80], [552, 50]]) { kFill(P, x, C + 18, x + w, C + 40, '#120806'); for (let k = 0; k < w - 10; k += 5) P.put(x + 5 + k, C + 24 + (k % 3) * 5, [255, 210, 150], 0.4); }
      for (let k = 0; k < 20; k++) P.tint(380 + Math.floor(hash(k, 1, 83) * 220), C + 44 + Math.floor(hash(k, 2, 83) * 30), [40, 20, 14], 0.25);
      // the front window, from inside: the street, wet and neon
      kFill(P, 40, C + 20, 120, G - 30, '#06080e'); bkWindow(P, 41, C + 21, 119, G - 31, 84);
      kFill(P, 36, G - 30, 124, G - 26, '#2a1610');
      // the tables along the wall: dark wood, a bowl and chopsticks on each
      for (const x of [150, 220, 290]) { P.block(x, G - 18, x + 26, G - 15, KMAT.darkwood, { base: 0.6 }); kFill(P, x + 11, G - 15, x + 15, G, '#1a0e0a'); kFill(P, x + 9, G - 21, x + 17, G - 18, '#e8e0d0'); kFill(P, x + 10, G - 22, x + 16, G - 21, '#c84a2a'); }
      // the pots behind the counter (the counter's a prop: bCounter), bowls on it
      for (const x of [400, 430]) { P.block(x, G - 38, x + 22, G - 22, MAT.steel, { base: 0.5 }); }
      for (const x of [470, 520, 560]) kFill(P, x, G - 25, x + 8, G - 22, '#e8e0d0');
      for (let x = 24; x < WN.PART; x++) P.put(x, G - 2, [30, 14, 10]);
      // the partition and its curtain through to the back
      P.block(WN.PART, C + 6, WN.BACK, G - 40, MAT.concreteD, { base: 0.4 }); kNoren(P, WN.PART - 2, WN.BACK + 2, G - 40, 26, '#2a2a3a');
      // ---- the storeroom: sacks and tins, the cold room, crates, and a rug
      P.block(WN.BACK, C + 6, WN.END, G, MAT.concreteD, { base: 0.3, lip: 0, panels: [46, 30], drips: 0.06, dripLen: 12 });
      for (const y of [C + 40, C + 70]) { P.block(646, y, 756, y + 3, KMAT.darkwood, { base: 0.5 }); for (let x = 650; x < 752; x += 12) { const top = y - 12 + (x % 3), c = [[200, 184, 144], [168, 152, 112], [216, 200, 160]][(x >> 2) % 3]; for (let yy = top; yy < y; yy++) { const k = yy - top, inset = k < 2 ? 3 - k : 0; for (let xx = x + inset; xx < x + 10 - inset; xx++) P.put(xx, yy, k === 2 ? [90, 70, 50] : xx === x + inset ? mixRgb(c, [255, 240, 210], 0.3) : xx === x + 9 - inset ? mixRgb(c, [20, 14, 10], 0.4) : c); } for (let xx = x + 3; xx < x + 7; xx++) P.put(xx, top + 6, mixRgb(c, [120, 30, 30], 0.6)); } }
      P.block(780, C + 24, 826, G, MAT.steelD, { base: 0.45, panels: [46, 24] }); kFill(P, 816, C + 60, 822, C + 76, '#8a909c'); for (let x = 780; x < 826; x++) P.put(x, G - 1, [120, 200, 230]);
      for (let x = WN.BACK; x < WN.END; x++) P.put(x, C + 9 + Math.round(Math.sin(x * 0.05) * 1.5), [20, 20, 24]);
      for (let x = WN.BACK; x < WN.END; x++) P.put(x, G - 2, [22, 22, 26]);
    });
    L.wall(0, 0, 24, G, MAT.concreteD, { base: 0.3 }); L.wall(WN.END, 0, WN.W, G, MAT.concreteD, { base: 0.35 });
    // the way out: the front door, between the tables and the counter (the front wall's cut away)
    L.prop('door', WN.DOOR, G, { label: 'Out to the street', out: true, look: 'noren', to: ['d_dragon', 'door'] }); L.light(WN.DOOR, C + 20, 34, [1, 0.5, 0.3], 0.5);
    // the dining room's light: lanterns, the pots' steam, the window's neon
    bLanterns(L, 140, 600, C + 10, ['#ff3a3a', '#ffb040'], { step: 26 });
    L.light(480, G - 50, 130, [1, 0.62, 0.38], 0.9); L.light(220, G - 40, 110, [1, 0.6, 0.38], 0.7); L.light(80, G - 60, 60, [0.8, 0.4, 0.9], 0.5);
    for (const x of [411, 441]) L.vents.push({ x, y: G - 40, kind: 'steam' });
    for (const x of [163, 233, 303]) L.vents.push({ x, y: G - 23, kind: 'steam' });
    // the counter: Lin behind it, on the step, the diners on stools in front
    bCounter(L, 372, 610, G, { top: KMAT.darkwood, body: KMAT.lacquer, panel: 34, stools: [400, 450, 500, 550] });
    L.npc({ name: 'Auntie Lin', role: 'noodles', look: { skin: SKINS[0], hair: 'bun', hairCol: '#c8c8c8', top: '#e8e0d0', apron: '#8a1a24', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 470, y: G, face: 1, sched: [[0, 24, 470, 'work']], behind: true, lift: 4, lines: ['Eat first. Then fix things.', 'The cellar is yours as long as the rent comes and nobody lifts that rug.', 'Nobody asks what you do down there. Nobody asks me what\'s in the broth either.'] });
    // people eating: at the tables and at the counter, chopsticks up
    // a regular who's always on the same stool of an evening; the rest of the
    // diners are the block's residents, in at their own times (town.js)
    const DINE = [['A regular', 500, 1, { skin: SKINS[1], hair: 'short', hairCol: '#5a3a1a', top: '#5a2a2a', coat: 'long', legs: '#2a2a2a' }, ['Every night for eleven years. Same stool.', 'Lin\'s got a basement, you know. Wine, I think.']]];
    for (const [name, x, face, look, lines] of DINE) L.npc({ name, look: Object.assign({ hands: { fx: 25, fy: 27 } }, look), x, y: G - 2, face, sched: [[0, 17, x, 'away'], [17, 24, x, 'sit']], lines });
    // the storeroom's light, crates, and the rug over the trapdoor
    L.light(730, C + 16, 60, [1, 0.8, 0.55], 0.7); L.light(803, G - 4, 26, [0.5, 0.8, 1], 0.4);
    for (const [x, w, h, col] of [[664, 14, 12, '#5a4a32'], [680, 12, 10, '#4a3a2a'], [670, 12, 9, '#6a5a3a'], [870, 16, 14, '#4a4a3a'], [888, 12, 10, '#5a4a32']]) L.prop('deco', x, x === 670 ? G - 12 : G, { art: () => crate({ w, h, col }), id: 'wncrate' + x + h });
    L.prop('trapdoor', 846, G, { to: ['d_cellar', 'ladder'] });
    L.spawns = { door: [WN.DOOR, G], trapdoor: [846, G] };
    L.spots = Array.from({ length: 10 }, () => [870, G]);
  },
}) };

// ---- the basement: under the storeroom, down the ladder. A ripper's den
// made out of a cellar: grimy white tile under a red neon strip, the work chair
// under two articulated lamps, monitors on arms, a rack of glowing canisters,
// spare chrome on hooks, cables across the floor, teal screens round the cot,
// and your bench. Its own place, but not on the city map: you can only get here
// through the trapdoor.
const CL = { W: 720, CEIL: 132 };
// a line of pixels, for arms and cables (glow > 0 lights it)
function clLine(P, x0, y0, x1, y1, col, glow = 0) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) P.put(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), col, glow); }
LEVELS.d_cellar = { name: 'Under the White Dragon', tier: 1, hidden: true, metres: -4, depth: '-4 m', mapX: 230, blurb: 'Your workshop, under the noodle bar. Nobody knows.', label: 'Workshop', make: () => district({
  id: 'd_cellar', name: 'Under the White Dragon', tier: 1, W: CL.W, sky: false, rain: 0, amb: [0.26, 0.22, 0.28], floor: MAT.concreteD,
  build(L, G) {
    const C = G - CL.CEIL, W = CL.W, TT = C + 24; // TT: the top of the tile
    // no way out but the ladder: the district's spinner pad isn't here
    L.props = L.props.filter((p) => p.kind !== 'transit');
    L.paint(0, 0, W, G + 14, (P) => {
      P.block(0, 0, W, C, MAT.concreteD, { base: 0.16, lip: 0, panels: [80, 40] }); // the storeroom's floor, seen from under
      P.block(0, C, W, G, MAT.brickD, { base: 0.22, lip: 0, panels: [40, 22], drips: 0.18, dripLen: 30 });
      kFill(P, 0, C, W, C + 4, '#141218');
      for (let x = 10; x < W; x += 48) kFill(P, x, C + 4, x + 6, C + 10, '#1e1a20'); // joists
      // pipes along the ceiling, a duct, one pipe down the wall to the sump
      for (let x = 0; x < W; x++) { P.put(x, C + 13, [30, 34, 40]); P.put(x, C + 14, [76, 82, 92]); P.put(x, C + 15, [22, 24, 30]); }
      for (let x = 120; x < 620; x++) { for (let y = C + 4; y < C + 11; y++) P.put(x, y, y === C + 5 ? [70, 66, 72] : [40, 36, 44]); if (x % 30 === 0) for (let y = C + 4; y < C + 11; y++) P.put(x, y, [24, 22, 28]); }
      for (let y = C + 15; y < G - 6; y++) { P.put(690, y, [30, 34, 40]); P.put(691, y, [76, 82, 92]); }
      kFill(P, 676, G - 6, 706, G - 2, '#0a0c10'); for (let x = 678; x < 704; x += 3) P.put(x, G - 4, [40, 44, 50]);
      // the work wall: grimy white tile from the chair to the bench, under the red strip
      for (let y = TT; y < G - 4; y++) for (let x = 200; x < 560; x++) {
        const gx = (x - 200) % 10, gy = (y - TT) % 8, grout = gx === 0 || gy === 0, dirt = hash(x >> 2, y >> 2, 71) * 0.5 + (y - TT) / (G - TT) * 0.35 + (hash(x >> 4, 3, 72) < 0.2 ? 0.25 : 0);
        P.put(x, y, grout ? [70, 66, 70] : mixRgb([200, 196, 192], [92, 80, 72], clamp(dirt, 0, 1)));
      }
      // rust and blood-brown streaks down the tile
      for (let k = 0; k < 14; k++) { const x = 206 + Math.floor(hash(k, 1, 73) * 350), y0 = TT + Math.floor(hash(k, 2, 73) * 30), n = 8 + Math.floor(hash(k, 3, 73) * 40); for (let y = y0; y < Math.min(G - 4, y0 + n); y++) P.tint(x, y, [90, 40, 30], 0.35); }
      // the red neon strip's channel, and a shelf of trophies under it
      kFill(P, 196, TT - 6, 564, TT - 2, '#1a0a0e');
      kFill(P, 470, TT + 22, 552, TT + 25, '#2a2430');
      for (const [x, h, c] of [[476, 9, [200, 170, 80]], [488, 13, [190, 190, 200]], [500, 7, [200, 170, 80]], [530, 11, [150, 150, 170]]]) { kFill(P, x, TT + 22 - h, x + 4, TT + 22, css(c)); P.put(x + 1, TT + 22 - h, mixRgb(c, [255, 255, 255], 0.6)); }
      // spare chrome on hooks: forearms and hands, a joint still lit
      kFill(P, 112, C + 30, 186, C + 33, '#3a3640');
      for (let k = 0; k < 4; k++) {
        const x = 120 + k * 18, y0 = C + 33, len = 26 + (k % 2) * 6, c = k === 2 ? [190, 160, 140] : [170, 178, 196];
        P.put(x + 2, y0, [90, 90, 100]); P.put(x + 2, y0 + 1, [90, 90, 100]);
        for (let y = y0 + 2; y < y0 + len; y++) for (let dx = 0; dx < 5; dx++) P.put(x + dx, y, dx === 0 ? mixRgb(c, [255, 255, 255], 0.35) : dx === 4 ? mixRgb(c, [0, 0, 0], 0.5) : (y % 6 === 0 ? mixRgb(c, [0, 0, 0], 0.3) : c));
        for (let f = 0; f < 4; f++) for (let y = y0 + len; y < y0 + len + 4 + (f % 2); y++) P.put(x + f + (f > 1 ? 1 : 0), y, mixRgb(c, [0, 0, 0], 0.2));
        P.put(x + 2, y0 + 10, k % 2 ? [255, 60, 80] : [60, 240, 230], 1); P.put(x + 2, y0 + 11, k % 2 ? [160, 30, 40] : [30, 140, 140], 0.6);
      }
      // the rack of canisters: steel frame, six glass tubes, amber and green
      kFill(P, 196, G - 64, 244, G - 60, '#2a2e36'); kFill(P, 196, G - 34, 244, G - 30, '#2a2e36'); kFill(P, 196, G - 64, 199, G, '#22262c'); kFill(P, 241, G - 64, 244, G, '#22262c');
      for (let k = 0; k < 6; k++) {
        const x = 202 + (k % 3) * 13, y0 = k < 3 ? G - 59 : G - 29, h = 22, c = [[255, 170, 60], [90, 255, 120], [255, 170, 60], [90, 255, 120], [255, 140, 40], [120, 255, 200]][k], lvl = 5 + Math.floor(hash(k, 1, 74) * 12);
        for (let y = y0; y < y0 + h; y++) for (let dx = 0; dx < 8; dx++) { const full = y >= y0 + lvl, edge = dx === 0 || dx === 7; P.put(x + dx, y, y === y0 || y === y0 + h - 1 ? [70, 74, 82] : full ? mixRgb(c, [0, 0, 0], edge ? 0.55 : 0.15) : edge ? [60, 70, 80] : [26, 30, 36], full && !edge ? 0.55 : 0); }
      }
      // the lamp arms over the chair: from the duct, two elbows each, lamp heads facing down
      for (const [bx, ex, ey, hx, hy] of [[300, 274, C + 40, 300, C + 58], [380, 406, C + 36, 378, C + 54]]) {
        for (const d of [0, 1]) { clLine(P, bx + d, C + 11, ex + d, ey, [56, 60, 70]); clLine(P, ex + d, ey, hx + d, hy, [56, 60, 70]); }
        clLine(P, bx - 1, C + 11, ex - 1, ey, [110, 116, 128]);
        kFill(P, ex - 2, ey - 2, ex + 3, ey + 3, '#3a3e48'); kFill(P, hx - 9, hy - 4, hx + 10, hy + 3, '#2a2e36');
        for (let x = hx - 8; x < hx + 9; x++) { P.put(x, hy + 2, [230, 250, 255], 1); P.put(x, hy + 3, [140, 220, 240], 0.8); }
      }
      // their light, a cone each down onto the chair
      for (const hx of [300, 378]) { const hy = C + 60; for (let y = hy; y < G - 2; y++) { const k = (y - hy) / (G - hy), half = 8 + k * 26; for (let x = Math.round(hx - half); x <= hx + half; x++) P.tint(x, y, [210, 245, 255], 0.16 * (1 - k) * (1 - Math.abs(x - hx) / half)); } }
      // the monitor arm from the wall to the screen by the chair
      clLine(P, 252, TT + 8, 262, TT + 18, [56, 60, 70]); clLine(P, 252, TT + 9, 262, TT + 19, [56, 60, 70]);
      // teal screens on feet round the cot: panels with a lit edge and warning marks
      for (const px of [566, 598]) {
        for (let y = G - 78; y < G - 6; y++) for (let x = px; x < px + 30; x++) { const edge = x === px || x === px + 29 || y === G - 78; P.put(x, y, edge ? [70, 230, 220] : mixRgb([14, 64, 66], [24, 92, 92], ((x + y) % 7) / 14), edge ? 0.7 : 0); }
        for (let x = px + 4; x < px + 26; x++) { P.put(x, G - 60, [120, 220, 210]); P.put(x, G - 30, [120, 220, 210]); }
        for (let k = 0; k < 5; k++) { P.put(px + 6 + k, G - 50 + k, [255, 120, 80]); P.put(px + 16 - k, G - 50 + k, [255, 120, 80]); } for (let x = px + 6; x < px + 17; x++) P.put(x, G - 45, [255, 120, 80]);
        for (let y = G - 26; y < G - 12; y += 3) for (let x = px + 18; x < px + 26; x++) P.put(x, y, [60, 150, 150]);
        kFill(P, px + 2, G - 6, px + 6, G, '#2a2e36'); kFill(P, px + 24, G - 6, px + 28, G, '#2a2e36');
      }
      // the hatch in the ceiling over the ladder, light through its edges
      kFill(P, 52, C - 2, 92, C + 2, '#2a2620'); for (let x = 54; x < 90; x++) P.put(x, C + 2, [255, 210, 150], 0.4);
      // the ladder
      for (let y = C; y < G; y++) for (const x of [62, 82]) { P.put(x, y, [40, 44, 52]); P.put(x + 1, y, [96, 102, 114]); }
      for (let y = C + 6; y < G - 2; y += 8) for (let x = 64; x < 82; x++) { P.put(x, y, [110, 116, 128]); P.put(x, y + 1, [36, 40, 48]); }
      // the old hidden panel's seam, by the cot (it opens later)
      for (let y = G - 34; y < G - 6; y++) P.put(668, y, [24, 22, 26]);
      // the floor: dark tile, a lit strip along the wall's foot, cables from the chair to the wall
      for (let y = G; y < G + 14; y++) for (let x = 0; x < W; x++) P.put(x, y, (x % 16 === 0 || (y - G) % 7 === 0) ? [18, 18, 22] : mixRgb([40, 40, 46], [28, 28, 34], hash(x >> 4, (y - G) >> 3, 75)));
      for (let x = 100; x < 660; x++) P.put(x, G - 1, [60, 220, 230], 0.8);
      for (const [x0, x1, c] of [[318, 200, [200, 90, 40]], [330, 248, [30, 30, 34]], [346, 470, [200, 90, 40]]]) { const n = Math.abs(x1 - x0); for (let k = 0; k <= n; k++) { const x = x0 + Math.sign(x1 - x0) * k, y = G + 2 + Math.round(Math.sin((k / n) * Math.PI) * 4 + Math.sin(k * 0.3) * 0.6); P.put(x, y, c); P.put(x, y + 1, mixRgb(c, [0, 0, 0], 0.5)); } }
    });
    L.wall(0, 0, 24, G, MAT.concreteD, { base: 0.3 }); L.wall(W - 24, 0, W, G, MAT.concreteD, { base: 0.3 });
    // the red strip: neon, across the work wall
    L.tube(198, TT - 4, 364, '#ff2a40', 0.42);
    // the ladder up
    L.prop('trapdoor', 72, G, { up: true, to: ['d_noodles', 'trapdoor'] });
    L.light(72, C + 6, 44, [1, 0.8, 0.55], 0.5);
    // the chair under its lamps, the tray of tools, the monitors
    L.prop('deco', 340, G, { art: () => workChair(), id: 'clchair' });
    L.prop('deco', 296, G, { art: () => toolTray(), id: 'cltray' });
    L.light(304, G - 30, 70, [0.75, 0.95, 1], 1.2); L.light(374, G - 30, 70, [0.75, 0.95, 1], 1.2); L.light(340, C + 60, 60, [0.75, 0.95, 1], 0.6);
    L.ad(256, TT + 14, 26, 16, 'ecg', ['#3aff80', '#3af0e0']);
    L.ad(410, TT + 8, 30, 20, 'readout', ['#3af0e0', '#ff4a6a']);
    L.light(220, G - 40, 40, [1, 0.75, 0.4], 0.6); L.light(220, G - 14, 30, [0.5, 1, 0.6], 0.5);
    L.light(150, C + 46, 50, [0.6, 0.85, 1], 0.6);
    // the bench, the shelf, the cot behind the screens
    L.prop('workbench', 470, G, { label: 'your bench' });
    L.light(470, G - 40, 50, [1, 0.88, 0.7], 0.7);
    L.prop('shelf', 530, G, { label: 'the parts shelf' });
    L.prop('bed', 650, G, {});
    L.light(600, G - 50, 70, [0.3, 0.9, 0.85], 0.45);
    L.vents.push({ x: 690, y: C + 20, kind: 'steam' });
    L.spawns = { ladder: [96, G], bed: [630, G] };
    // a terminal of your own, by the ladder
    L.spots = Array.from({ length: 10 }, () => [150, G]);
  },
}) };
