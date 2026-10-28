'use strict';
// ---------------------------------------------------------------------------
// Up high: the districts at the Stack's height, reached by spinner. Each is
// built by hand from the kit (kit.js).
// ---------------------------------------------------------------------------

// ---- Neon Row: the nightlife strip. Bars, a pachinko hall, a capsule hotel,
// noodle carts, the Menagerie (a pet shop of synth animals), and at the far
// end the Coil, the club everybody owes.
addDistrict('d_neonrow', 'Neon Row', 1, 60, 380, 'The nightlife strip: bars, pachinko, noodle carts, the Menagerie pet shop and the Coil.', 'Nightlife strip', () => district({
  id: 'd_neonrow', name: 'Neon Row', tier: 1, W: 2900, amb: [0.2, 0.16, 0.26],
  local: { name: 'Local', lines: LOCAL_LINES.neon, look: { hair: 'undercut', hairCol: '#ff4ab0', top: '#2a2a3a', coat: 'jacket' } },
  build(L, G) {
    // the way in: a corp tower's base by the pad, then the Row's own gate
    bGlass(L, -20, 170, G, { h: 340, crown: 'step', edge: '#3af0e0', lit: 0.3 });
    kGate(L, 186, 296, G, 92, '#ff4ab0');
    // bars and noodle houses with flats above
    bShophouse(L, 300, 410, G, { floors: 4, wall: KMAT.pink, shops: [['izakaya', '#ff8a3a']], roof: 'tank', blade: '#ff4ab0', seed: 11 });
    bShophouse(L, 410, 540, G, { floors: 3, wall: MAT.concrete, shops: [['bar', '#9a6aff'], ['noren', '#ffd040']], roof: 'shack', blade: '#3af0e0', seed: 12 });
    // the Menagerie: a wide glass front of cages, an owl on its perch
    bShophouse(L, 560, 790, G, { floors: 3, wall: KMAT.teal, shops: [], roof: 'garden', balcony: 'all', seed: 13, gh: 46 });
    L.paint(560, G - 50, 790, G, (P) => {
      P.block(560, G - 46, 790, G - 42, MAT.steelD, { base: 0.5 });
      for (const [a, b] of [[564, 600], [604, 700], [704, 786]]) { glassWall(P, a, G - 42, b, G - 4, { ramp: KMAT.teal, mw: 12, mh: 13 }); for (let x = a; x < b; x++) for (let y = G - 42; y < G - 4; y++) if ((x - a) % 12 < 1 || (y - G + 42) % 13 < 1) P.put(x, y, [20, 40, 40]); }
      kFill(P, 604, G - 40, 700, G - 6, '#2a6a6a', 0.12);
      P.block(560, G - 4, 790, G, MAT.steelD, { base: 0.4 });
    });
    L.sign(616, G - 60, 10, '#3af0e0', { r: 90, seed: 31 });
    L.paint(626, G - 80, 656, G - 76, (P) => P.block(626, G - 80, 656, G - 78, MAT.steelD, { base: 0.5 })); L.paint(639, G - 78, 643, G - 24, (P) => P.block(640, G - 78, 642, G - 24, MAT.steelD, { base: 0.4 }));
    L.light(670, G - 30, 120, [0.4, 1, 0.9], 0.8);
    L.critter('owl', 640, 640, G - 80, 1); L.critter('dog', 590, 760, G, 1); L.critter('cat', 560, 780, G, 1);
    L.npc({ name: 'Lio', look: { skin: SKINS[2], hair: 'short', hairCol: '#3a2418', top: '#3a5a4a', apron: '#2a3a30', legs: '#2a2a2a', glasses: true }, x: 690, y: G, face: -1, sched: [[0, 24, 690, 'stand']], lines: ['Every one of them hand-reared. Mostly.', 'You want a dog? I\'ve got one left. Synth. Good boy.', 'A real owl. Do you know what a real owl is worth?'] });
    // a capsule hotel, noodle carts in front of it
    bCapsules(L, 800, 960, G, { h: 320, sign: '#ffd040', seed: 41 });
    kStallAt(L, 840, G, 'ramen', { npc: { name: 'Old Sato', lines: ['Shoyu or miso? Don\'t say synth broth, I\'ll throw you out.', 'The pet shop lady? Lio\'s a man. Nice man. Owes everybody.'] } });
    kStallAt(L, 920, G, 'yakitori');
    // the pachinko hall
    bArcade(L, 980, 1120, G, { col: '#ff4ab0', h: 130, seed: 51 });
    L.prop('vending', 1132, G, { look: { col: '#3af0e0', body: '#3a5a8a' }, label: 'vending machine' }); L.light(1132, G - 14, 36, [0.3, 0.9, 1], 0.6);
    // a love hotel and a karaoke bar
    bShophouse(L, 1144, 1270, G, { floors: 5, wall: KMAT.pink, shops: [['club', '#ff4ab0']], roof: 'tank', balcony: false, blade: '#ffd040', seed: 61 });
    // a little cinema
    bTheater(L, 1290, 1440, G, { col: '#3af0e0', h: 160, seed: 71 });
    // a stack of shacks on an old block, a stair up to its roof walk
    bStack(L, 1460, 1700, G, { levels: 5, blade: '#ffd040', shop: 'pawn', shopCol: '#ffb040', seed: 81 });
    L.stairs(1470, G, 1560, G - 112); L.walk(1470, 1700, G - 112, 6); L.dry.push([1460, G - 112, 1700, G]);
    L.prop('ac', 1600, G - 112, { label: 'air conditioner' });
    L.spots.push([1600, G - 112]);
    kStallAt(L, 1520, G, 'dumpling'); kStallAt(L, 1610, G, 'skewers', { npc: { name: 'Skewer kid', lines: ['Two for one. One for two. Whatever.', 'The dancer from the Coil? She don\'t eat. Never seen her eat.'] } });
    // two shophouses joined by a gallery at the first floor, doors along it
    bShophouse(L, 1720, 1830, G, { floors: 4, wall: KMAT.cream, shops: [['glass', '#ff8a3a']], roof: 'tile', balcony: false, seed: 91, gh: 44 });
    bShophouse(L, 1830, 1945, G, { floors: 4, wall: KMAT.stucco, shops: [['tea', '#ffd040']], roof: 'flat', balcony: false, seed: 92, gh: 44 });
    L.walk(1724, 1940, G - 82, 5); L.ladder(1932, G - 82, G);
    for (const x of [1760, 1820, 1880]) L.prop('deco', x, G - 82, { art: DECO.door({ col: ['#5a3a3a', '#3a4a5a', '#4a4a3a'][x % 3], light: x % 2 ? '#ffd8a0' : '#ff9ad8' }), id: 'nrdoor' + x });
    L.spots.push([1850, G - 82]); L.prop('junk', 1800, G, { label: 'junk pile' });
    // the Coil: the club at the end of the Row, black glass and pink light
    L.paint(1960, G - 230, 2170, G, (P) => {
      P.block(1960, G - 220, 2170, G - 44, KMAT.blackglass, { base: 0.3, panels: [30, 20] });
      for (let k = 0; k < 9; k++) { const cy = G - 200 + k * 18; for (let x = 1966; x < 2164; x++) { const s = Math.sin((x - 1966) / 22 + k * 0.9) * 5; P.put(x, Math.round(cy + s), [255, 74, 176], 0.7); } }
      P.block(1956, G - 226, 2174, G - 220, MAT.chrome, { base: 0.6 });
    });
    kShop(L, 1960, 2170, G, 'club', '#ff4ab0', { h: 44, signN: 8, seed: 101 });
    L.light(2060, G - 120, 160, [1, 0.35, 0.75], 0.9);
    L.npc({ name: 'Bouncer', look: { skin: SKINS[5], hair: 'bald', top: '#1a1a1a', coat: 'long', legs: '#1a1a1a', tall: 1.1 }, x: 1990, y: G, face: 1, sched: [[0, 24, 1990, 'stand']], lines: ['Members only. You\'re not a member.', 'If you\'re here for Zola, she\'s on at midnight. Every night.'] });
    // more bars, the mask maker, a car at the kerb
    bShophouse(L, 2190, 2300, G, { floors: 3, wall: KMAT.mint, shops: [['ramen', '#ff3a2a']], roof: 'tin', blade: '#3af0e0', bladeLeft: true, seed: 111 });
    bShophouse(L, 2300, 2410, G, { floors: 4, wall: MAT.brickD, shops: [['bar', '#ffd040']], roof: 'tank', seed: 112 });
    kStallAt(L, 2250, G, 'masks', { col: '#c83a2a' });
    L.prop('car', 2360, G, { look: { col: '#4a1a2a', under: '#ff4ab0' }, label: 'parked car' });
    // a shrine squeezed between the bars, its own lantern light
    bTorii(L, 2440, 2500, G, 58); bToro(L, 2520, G);
    bTemple(L, 2540, 2660, G, { h: 46, base: 8, roofH: 24, lit: true });
    bTree(L, 2680, G, 'sakura', { h: 70 });
    // the end: a corp tower, a noodle robot in its lobby
    bGlass(L, 2720, 2900, G, { h: 380, crown: 'slant', edge: '#ff4ab0', logo: '#e8e8ff', panel: 48, seed: 121 });
    kStallAt(L, 2780, G, 'robot', { col: '#ff4ab0' });
    nrDoors(L, G); // (the places on the Row you can walk into: d_neon.js)
    // overhead: cables, lanterns and washing across the street
    L.paint(300, G - 180, 1950, G - 120, (P) => { for (let k = 0; k < 3; k++) cable(P, 300, G - 170 + k * 8, 1950, G - 160 + k * 6, 30 + k * 6, '#08080c'); });
    bLanterns(L, 300, 540, G - 132, ['#ff3a2a', '#ffb040']); bLanterns(L, 1144, 1440, G - 140, ['#ff4ab0', '#3af0e0'], { step: 16 }); bLanterns(L, 2190, 2410, G - 128, ['#ff3a2a', '#ffd040']);
    // the Row's people, its trouble
    L.spots.push([380, G], [700, G], [1050, G], [1350, G], [2050, G], [2350, G], [2600, G]);
    L.critter('rat', 300, 2800, G, 2); L.critter('dog', 1700, 2400, G, 1); L.litter(200, 2800, G, 8);
  },
}));

// ---- helpers for the high places --------------------------------------------------
// a playground: a slide, a swing frame, a sandpit
function hiPlayground(L, x0, G) {
  L.paint(x0, G - 40, x0 + 110, G, (P) => {
    P.block(x0 + 4, G - 3, x0 + 40, G, KMAT.ochre, { base: 0.5 });
    // the slide: a ladder up, a chute down
    for (let y = G - 30; y < G; y += 4) kH(P, x0 + 46, x0 + 52, y, tone(MAT.steel, 0.6)); kV(P, x0 + 46, G - 32, G, tone(MAT.steel, 0.55)); kV(P, x0 + 52, G - 32, G, tone(MAT.steel, 0.35));
    P.block(x0 + 44, G - 34, x0 + 56, G - 31, rp('#d83a3a', 6), { base: 0.6 });
    for (let k = 0; k < 30; k++) { const x = x0 + 56 + k, y = G - 32 + k * 0.95; P.put(x, y, tone(rp('#e8b030', 6), 0.75)); P.put(x, y + 1, tone(rp('#e8b030', 6), 0.4)); }
    // swings
    kH(P, x0 + 86, x0 + 110, G - 34, tone(rp('#3a8ac8', 6), 0.6)); kV(P, x0 + 87, G - 34, G, tone(rp('#3a8ac8', 6), 0.5)); kV(P, x0 + 109, G - 34, G, tone(rp('#3a8ac8', 6), 0.4));
    for (const sx of [x0 + 93, x0 + 102]) { kV(P, sx, G - 34, G - 10, '#3a3a40'); kV(P, sx + 4, G - 34, G - 10, '#3a3a40'); kH(P, sx - 1, sx + 6, G - 10, tone(MAT.wood, 0.6)); }
  });
  L.lamp(x0 + 70, G, 52, '#e8f0ff', 0.7);
}
// a fountain: a basin, a ring of jets, mist; the jets light themselves
function hiFountain(L, cx, G, col = '#9af0ff') {
  const c = col3(col);
  L.paint(cx - 50, G - 70, cx + 50, G, (P) => {
    P.block(cx - 46, G - 10, cx + 46, G, KMAT.whitepanel, { base: 0.55 });
    kFill(P, cx - 42, G - 9, cx + 42, G - 6, '#1e4a5a', 0.3);
    P.block(cx - 6, G - 22, cx + 6, G - 10, KMAT.whitepanel, { base: 0.6 });
    for (const [dx, h] of [[-30, 26], [-16, 40], [0, 58], [16, 40], [30, 26]]) for (let j = 0; j < h; j++) { const x = cx + dx + Math.sin(j * 0.3) * 0.6, y = G - 10 - j; P.put(x, y, mixRgb(c, [255, 255, 255], j > h - 4 ? 0.6 : 0.2), 0.7); }
    for (let k = 0; k < 40; k++) P.put(cx - 40 + hash(k, 1, cx) * 80, G - 12 - hash(k, 2, cx) * 30, mixRgb(c, [255, 255, 255], 0.5), 0.5);
  });
  L.light(cx, G - 30, 110, c.map((q) => q / 255), 0.9); L.vents.push({ x: cx, y: G - 50, kind: 'steam' });
}
// a sculpture: a great chrome ring stood on its edge on a plinth
function hiSculpture(L, cx, G) {
  L.paint(cx - 40, G - 100, cx + 40, G, (P) => {
    P.block(cx - 16, G - 14, cx + 16, G, KMAT.blackglass, { base: 0.4 });
    P.area(cx - 36, G - 94, cx + 36, G - 14, MAT.chrome, (x, y) => 0.55 - (x - cx) / 80 - (y - G + 54) / 120 + (Math.abs(x - cx - 6) < 3 ? 0.3 : 0), { inside: (x, y) => { const d = Math.hypot((x - cx) / 34, (y - G + 54) / 40); return d < 1 && d > 0.78; } });
  });
  L.light(cx, G - 50, 70, [0.8, 0.9, 1], 0.6);
}
// a glass dome greenhouse: ribs, plants inside lit warm-green
function hiDome(L, cx, G, r = 46) {
  L.paint(cx - r - 2, G - r - 4, cx + r + 2, G, (P) => {
    P.area(cx - r, G - r, cx + r, G, MAT.glass, (x, y) => 0.35 + ((x + y) % 11 === 0 ? 0.2 : 0) - (G - y) / (r * 4), { inside: (x, y) => Math.hypot(x - cx, (y - G) * 1.1) < r });
    for (let k = 0; k < 60; k++) { const x = cx - r * 0.8 + hash(k, 1, cx) * r * 1.6, y = G - 2 - hash(k, 2, cx) * r * 0.55; P.put(x, y, tone(KMAT.leaf, 0.4 + hash(k, 3, cx) * 0.5), 0.15); P.put(x + 1, y, tone(KMAT.leaf, 0.5), 0.15); }
    for (let a = 0; a <= Math.PI; a += Math.PI / 8) for (let t = 0; t < 1; t += 0.01) { const x = cx + Math.cos(a) * r * t, y = G - Math.sin(a) * r * t / 1.1; if (Math.hypot(x - cx, (y - G) * 1.1) > r * 0.97 || t > 0.98) continue; } 
    for (let a = 0; a <= Math.PI; a += 0.004) P.put(cx + Math.cos(a) * r, G - Math.sin(a) * r / 1.1, tone(KMAT.whitepanel, 0.7));
    for (const f of [0.35, 0.7]) for (let a = 0; a <= Math.PI; a += 0.006) P.put(cx + Math.cos(a) * r, G - Math.sin(a) * r * f / 1.1, tone(KMAT.whitepanel, 0.55));
    for (let k = -3; k <= 3; k++) { const a = Math.PI / 2 + k * 0.4; for (let t = 0; t < 1; t += 0.01) P.put(cx + Math.cos(a) * r * t * 1.0 * (Math.abs(k) / 3), G - Math.sin(a) * r * t / 1.1, tone(KMAT.whitepanel, 0.5)); }
  });
  L.light(cx, G - r / 3, r * 1.6, [0.6, 1, 0.65], 0.5);
}
// an arched red bridge over a pond; its deck can be walked
function hiBridge(L, x0, x1, G) {
  const mid = (x0 + x1) / 2, h = 16;
  L.paint(x0 - 10, G - h - 12, x1 + 10, G + 6, (P) => {
    for (let x = x0 - 10; x < x1 + 10; x++) for (let y = G - 1; y < G + 5; y++) P.put(x, y, tone(KMAT.water, 0.3 + (y === G - 1 ? 0.35 : 0) + (noise(x / 9, y, 4) - 0.5) * 0.2));
    for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0), y = G - Math.sin(Math.PI * t) * h; for (let j = 0; j < 3; j++) P.put(x, y + j, tone(KMAT.lacquer, 0.65 - j * 0.15)); P.put(x, y - 8, tone(KMAT.lacquer, 0.7)); if ((x - x0) % 8 === 0) for (let j = 1; j < 8; j++) P.put(x, y - j, tone(KMAT.lacquer, 0.5)); }
  });
  L.wet.push({ y: G - 1, x0: x0 - 10, x1: x1 + 10, depth: 8, k: 0.6 });
  L.stairs(x0, G, mid, G - h, KMAT.lacquer); L.stairs(mid, G - h, x1, G, KMAT.lacquer);
}
// the drop: what's below the bridge deck, painted over the floor: a truss,
// then air and the tops of towers far below in the haze
function hiDrop(L, W, G, H) {
  L.paint(0, G + 6, W, H, (P) => {
    P.area(0, G + 6, W, H, R(['#0a1220', '#16243a', '#2a3e5a', '#4a6a88']), (x, y) => 0.25 + (y - G) / (H - G) * 0.45 + (noise(x / 50, y / 10, 7) - 0.5) * 0.1);
    for (let x = 0; x < W; x += 2) { const t = hash(x >> 4, 1, 9); if (t < 0.5) continue; const top = H - 20 - t * 40; for (let y = top; y < H; y++) P.put(x, y, mixRgb([30, 40, 60], [70, 100, 130], (y - top) / 60), 0); if (hash(x, 3, 9) < 0.2) P.put(x, top + 6 + hash(x, 4, 9) * 20, [255, 210, 140], 0.6); }
    haze(P, 0, W, G + 20, H, [70, 100, 130], 0.5);
  });
  L.paint(0, G, W, G + 22, (P) => { for (let x = 0; x < W; x += 30) girder(P, x, G + 4, x + 30, G + 20, MAT.steelD, { step: 10 }); P.block(0, G, W, G + 5, MAT.steel, { base: 0.5 }); });
}

// ---- Kessler Blocks: a housing estate up high. Slab blocks of a thousand
// front doors, a capsule tower, shops at the foot of the flats, a courtyard
// with a playground, a little shrine the residents keep.
addDistrict('d_kessler', 'Kessler Blocks', 1, 50, 230, 'A housing estate up high: slab blocks, a capsule tower, a courtyard, washing on every line.', 'Housing estate', () => district({
  id: 'd_kessler', name: 'Kessler Blocks', tier: 1, W: 2600, amb: [0.19, 0.18, 0.24],
  local: { name: 'Resident', lines: LOCAL_LINES.blocks, look: { hair: 'bun', hairCol: '#8a8a8a', top: '#5a3a3a', coat: 'long' } },
  build(L, G) {
    // block 14: a long slab, galleries of doors, the lift shaft at its end
    bDanchi(L, 180, 560, G, { floors: 7, number: 14, seed: 201 });
    L.walk(204, 560, G - 60, 4, KMAT.concreteL, { rail: false }); L.stairs(640, G, 560, G - 60); L.spots.push([400, G - 60]);
    for (const x of [260, 360, 460]) L.prop('deco', x, G - 60, { art: DECO.door({ col: ['#5a4a3a', '#3a4a5a', '#4a3a4a'][x % 3], light: '#ffd8a0' }), id: 'kbd' + x });
    // the corner shop and the noodle bar at the foot of the flats
    bShophouse(L, 640, 760, G, { floors: 4, wall: KMAT.cream, shops: [['counter', '#ffd040']], roof: 'tank', balcony: 'all', awning: '#2a6a4a', stripe: '#e8e0d0', seed: 211 });
    bShophouse(L, 760, 860, G, { floors: 4, wall: KMAT.mint, shops: [['ramen', '#ff3a2a']], roof: 'garden', blade: '#3af0e0', seed: 212 });
    L.prop('vending', 872, G, { look: { col: '#ffd040', body: '#5a4a1a' }, label: 'vending machine' }); L.light(872, G - 14, 34, [1, 0.85, 0.3], 0.6);
    // the courtyard: a big tree, the playground, benches, washing between the blocks
    bPark(L, 890, 1170, G, { trees: ['street'], fence: false, critters: false, seed: 221 });
    bTree(L, 920, G, 'willow', { h: 80 }); hiPlayground(L, 1000, G);
    L.paint(890, G - 190, 1170, G - 90, (P) => { laundry(P, 890, G - 170, 1170, G - 160, 7); laundry(P, 890, G - 130, 1170, G - 124, 9); laundry(P, 890, G - 100, 1170, G - 98, 11); });
    L.critter('cat', 900, 1160, G, 1); L.critter('dog', 900, 1160, G, 1);
    L.npc({ name: 'Kid', look: { skin: SKINS[3], hair: 'cap', capCol: '#3af0e0', top: '#c83a3a', legs: '#2a2a3a', tall: 0.7 }, x: 1080, y: G, sched: [[0, 2, 1080, 'wander'], [2, 15, 1080, 'away'], [15, 24, 1080, 'wander']], lines: ['The slide\'s mine after nine. Them\'s the rules.', 'My dog\'s a synth. He doesn\'t know. Don\'t tell him.'] });
    // the capsule tower, plugged into two cores
    bCapsules(L, 1180, 1360, G, { h: 340, sign: '#3af0e0', seed: 231 });
    // a shrine the residents keep, between the towers
    bTorii(L, 1380, 1430, G, 52); bToro(L, 1446, G);
    bTemple(L, 1462, 1560, G, { h: 40, base: 6, roofH: 20, steps: false });
    bTree(L, 1580, G, 'pine', { h: 56 });
    L.npc({ name: 'Mrs Ueda', look: { skin: SKINS[1], hair: 'bun', hairCol: '#e8e8e8', top: '#3a3a5a', coat: 'long', legs: '#2a2a2a', tall: 0.88 }, x: 1500, y: G, face: -1, sched: [[0, 24, 1500, 'stand']], lines: ['I sweep the shrine every night. Nobody asked me to.', 'The fox up there watches the whole block. Better than the cameras.'] });
    // block 9: a second slab, taller, a walkway across to it
    bDanchi(L, 1620, 2060, G, { floors: 8, number: 9, wall: KMAT.stucco, seed: 241 });
    L.walk(1644, 2060, G - 90, 4, KMAT.stucco, { rail: false }); L.ladder(1650, G - 90, G); L.spots.push([1850, G - 90]);
    L.walk(1644, 2060, G - 180, 4, KMAT.stucco, { rail: false }); L.ladder(2040, G - 180, G - 90); L.spots.push([1800, G - 180]);
    L.prop('ac', 1960, G - 90, { label: 'air conditioner' });
    for (const x of [1720, 1840, 1960]) L.prop('deco', x, G - 90, { art: DECO.door({ col: '#3a4a5a', light: x % 2 ? '#ffd8a0' : '#9af0ff' }), id: 'k9d' + x });
    // the end: a laundrette and a pawn shop, a stack of shacks on an old block
    bShophouse(L, 2080, 2200, G, { floors: 3, wall: MAT.concrete, shops: [['glass', '#9af0ff', { kind: 'school', label: 'Kessler Primary', staff: 2, hours: [7, 17] }]], roof: 'shack', seed: 251 });
    bStack(L, 2210, 2420, G, { levels: 4, shop: 'pawn', shopCol: '#ffb040', blade: '#ff4ab0', seed: 261 });
    bShophouse(L, 2430, 2600, G, { floors: 5, wall: KMAT.pink, shops: [['tea', '#ffd040'], ['glass', '#3af0e0', { kind: 'laundry', label: 'Suds Laundromat', hours: [6, 24] }]], roof: 'tank', seed: 271 });
    kStallAt(L, 2150, G, 'fruit', { col: '#2a8a4a' });
    L.prop('car', 2340, G, { look: { col: '#2a3a4a', under: '#3af0e0' }, label: 'parked car' }); L.prop('junk', 600, G, { label: 'junk pile' });
    L.spots.push([300, G], [700, G], [1050, G], [1280, G], [1500, G], [1900, G], [2140, G], [2500, G]);
    L.critter('rat', 300, 2500, G, 2); L.litter(200, 2500, G, 7);
  },
}));

// ---- Glasshouse Plaza: Meridian's front garden. Glass and white metal
// towers of every shape, a fountain, a ring of chrome, boutiques under a
// canopy, a sky-garden, and security everywhere.
addDistrict('d_glasshouse', 'Glasshouse Plaza', 1, 90, 560, 'The corporate plaza: glass towers, a fountain and a hologram, boutiques, and guards who look straight through you.', 'Corporate plaza', () => district({
  id: 'd_glasshouse', name: 'Glasshouse Plaza', tier: 1, W: 2700, layerDy: 30, floor: KMAT.whitepanel, amb: [0.22, 0.24, 0.3],
  local: { name: 'Office worker', lines: LOCAL_LINES.plaza, look: { hair: 'short', top: '#1a1a24', coat: 'long', collar: true, legs: '#1a1a24' } },
  build(L, G) {
    // the floor of the plaza: pale stone with lit seams
    L.paint(0, G, 2700, G + 3, (P) => { for (let x = 0; x < 2700; x += 40) P.put(x, G + 1, [160, 220, 255], 0.5); });
    bGlass(L, 170, 360, G, { h: 380, crown: 'step', fins: 12, edge: '#9af0ff', logo: '#e8e8ff', seed: 301 });
    // the boutique arcade: shops under a glass canopy
    L.paint(370, G - 70, 780, G - 50, (P) => { P.area(370, G - 66, 780, G - 56, MAT.glass, (x, y) => 0.5 + ((x - 370) % 20 < 1 ? 0.3 : 0)); P.block(370, G - 56, 780, G - 52, KMAT.whitepanel, { base: 0.6 }); for (let x = 380; x < 780; x += 60) P.block(x, G - 52, x + 3, G, KMAT.whitepanel, { base: 0.55, lip: 0 }); });
    L.paint(370, G - 160, 780, G - 66, (P) => { P.block(370, G - 160, 780, G - 66, KMAT.whitepanel, { base: 0.5, panels: [40, 18] }); for (let x = 380; x < 770; x += 40) kWin(P, x + 6, G - 150, 28, 8, { lit: '#d8ecff', cross: false }); });
    const bq = [['boutique', '#ff9ad8'], ['glass', '#e8e8ff'], ['boutique', '#ffd040'], ['flowers', '#ff6a8a'], ['glass', '#9af0ff'], ['tea', '#e8c070']];
    bq.forEach(([k, c], i) => kShop(L, 380 + i * 66, 440 + i * 66, G, k, c, { h: 46, frame: KMAT.whitepanel, signN: 5, seed: 310 + i }));
    L.walk(370, 780, G - 66, 4, KMAT.whitepanel, { rail: true }); L.stairs(860, G, 782, G - 66, KMAT.whitepanel); // (up from the plaza to the arcade's gallery) L.spots.push([560, G - 66]);
    // the plaza: a fountain, a hologram over it, benches, the chrome ring
    hiFountain(L, 1000, G);
    L.ad(960, G - 160, 80, 60, 'koi', ['#3af0e0', '#ffffff']);
    for (const x of [900, 1100]) L.prop('deco', x, G, { art: () => bench(), id: 'gb' + x });
    hiSculpture(L, 1230, G);
    bTree(L, 1320, G, 'street', { h: 60 }); bTree(L, 880, G, 'street', { h: 56 });
    // a black glass tower with a sky-garden halfway up
    bGlass(L, 1380, 1580, G, { h: 400, crown: 'slant', glass: KMAT.blackglass, edge: '#ff4ab0', lit: 0.25, panel: 60, seed: 321 });
    L.walk(1380, 1580, G - 130, 6, KMAT.whitepanel); L.ladder(1574, G - 130, G);
    for (const x of [1410, 1480, 1550]) bTree(L, x, G - 130, x === 1480 ? 'sakura' : 'pine', { h: 44 });
    L.spots.push([1500, G - 130]);
    L.light(1480, G - 150, 90, [0.7, 1, 0.75], 0.5);
    // the security post and a corp lobby
    L.paint(1600, G - 40, 1680, G, (P) => { P.block(1600, G - 40, 1680, G, KMAT.whitepanel, { base: 0.5 }); kFill(P, 1606, G - 34, 1674, G - 16, '#3a8aff', 0.3); for (let x = 1610; x < 1670; x += 10) kFill(P, x, G - 30, x + 7, G - 22, '#0a1a2a', 0); });
    L.light(1640, G - 24, 50, [0.4, 0.6, 1], 0.7); L.prop('rack', 1690, G, { label: 'security rack' });
    bGlass(L, 1720, 1960, G, { h: 340, crown: 'ring', glass: MAT.glass, edge: '#3af0e0', logo: '#3af0e0', fins: 16, seed: 331, work: 'hotel', name: 'The Glasshouse Hotel', staff: 3 });
    // a white tower of bands and a narrow gold one
    bGlass(L, 1990, 2150, G, { h: 300, crown: 'step', glass: MAT.glassC, panel: 22, edge: '#e8e8ff', seed: 341 });
    bGlass(L, 2170, 2260, G, { h: 420, crown: 'slant', glass: R(['#1a1408', '#3a2a10', '#6a5020', '#e8c070']), edge: '#ffd040', lit: 0.2, seed: 351 });
    kStallAt(L, 2050, G, 'robot', { col: '#9af0ff' });
    // the plaza's far end: a sunken garden and the monorail stop
    bPark(L, 2280, 2560, G, { trees: ['pine', 'sakura'], pond: true, seed: 361 });
    L.paint(2580, G - 70, 2700, G, (P) => { P.block(2580, G - 70, 2700, G - 64, KMAT.whitepanel, { base: 0.6 }); for (const x of [2590, 2690]) P.block(x, G - 64, x + 4, G, KMAT.whitepanel, { base: 0.5, lip: 0 }); });
    L.sign(2600, G - 84, 7, '#e8e8ff', { r: 60 }); L.prop('deco', 2640, G, { art: () => bench(), id: 'gmb' });
    L.prop('vending', 1300, G, { look: { col: '#9af0ff', body: '#c8d0d8' }, label: 'vending machine' });
    // Meridian's security
    // spots: spot 6 is the sky-garden (a case photo is taken there)
    L.spots.length = 0; L.spots.push([300, G], [560, G - 66], [700, G], [1000, G], [1230, G], [1300, G], [1500, G - 130], [1850, G], [2080, G], [2400, G], [2620, G]);
    L.critter('cat', 2290, 2550, G, 1); L.litter(200, 2600, G, 3);
  },
}));

// ---- The Skybridge: a deck slung between two megatowers, high over the
// city. Tea houses and kiosks built along it, cables up to the towers,
// maintenance gantries, the drop on every side, and the wind.
addDistrict('d_skybridge', 'The Skybridge', 1, 140, 760, 'A deck slung between two megatowers: tea houses and kiosks along it, and a long way down.', 'Bridge between towers', () => {
  const L = district({
    id: 'd_skybridge', name: 'The Skybridge', tier: 1, W: 2500, H: 520, layerDy: -120, floor: MAT.steelD, wet: false, amb: [0.2, 0.22, 0.3],
    local: { name: 'Bridge warden', lines: ['Hold the rail in the wind. People don\'t, every year.', 'Twelve hundred metres of deck and they still charge rent on it.', 'You can see the sun from here, two mornings a year.'], look: { hair: 'cap', capCol: '#e8b030', top: '#4a4a3a', coat: 'long' } },
    build(L, G) {
      hiDrop(L, 2500, G, 520);
      // the west tower: the bridge comes out of its flank
      bGlass(L, -40, 190, G, { h: 380, crown: 'step', glass: MAT.glassC, panel: 40, edge: '#3af0e0', seed: 401 });
      // the bridge: rails, cable stays up to the towers, lamps
      L.paint(190, G - 300, 2300, G, (P) => {
        railing(P, 190, 2300, G, MAT.steel, { h: 10, step: 6 });
        for (let x = 240; x < 1200; x += 60) cable(P, 190, G - 300 + (x - 240) * 0.05, x, G - 10, 0, '#1a1e24');
        for (let x = 1300; x < 2260; x += 60) cable(P, 2300, G - 300 + (2260 - x) * 0.05, x, G - 10, 0, '#1a1e24');
      });
      for (let x = 260; x < 2260; x += 220) L.lamp(x, G, 56, '#e8f0ff', 0.75);
      // kiosks and a tea house along the deck
      bShophouse(L, 300, 400, G, { floors: 1, fh: 30, wall: KMAT.whitepanel, shops: [['counter', '#ffd040']], roof: 'flat', balcony: false, ac: false, seed: 411 });
      kStallAt(L, 460, G, 'tea', { col: '#2a6a3a', npc: { name: 'Tea seller', lines: ['Sit down, tinker. Tea first. Look down second, if you must.', 'The wind took my awning twice this week.'] } });
      bMachiya(L, 540, 640, G, { noren: '#2a6a3a', seed: 421 });
      L.paint(540, G - 80, 640, G - 72, (P) => kLanterns(P, 540, 640, G - 80, ['#ffd040', '#ff8a3a'], { sag: 2, step: 10 }));
      kStallAt(L, 720, G, 'dumpling');
      // a maintenance gantry over the deck, a ladder up
      L.paint(800, G - 140, 1100, G, (P) => { for (let x = 800; x < 1100; x += 50) girder(P, x, G - 132, x + 50, G - 120, MAT.steelD, { step: 10 }); for (const x of [806, 1090]) P.block(x, G - 132, x + 4, G, MAT.steelD, { base: 0.4, lip: 0 }); });
      L.walk(800, 1100, G - 120, 4, MAT.steelD); L.ladder(820, G - 120, G); L.spots.push([950, G - 120]);
      L.prop('wreck', 960, G - 120, { label: 'downed drone' });
      // the bridge's middle: a glass shelter with a hanging garden, a viewing point
      L.paint(1150, G - 80, 1400, G, (P) => { glassWall(P, 1150, G - 70, 1400, G - 4, { ramp: MAT.glass, mw: 16, mh: 22 }); P.block(1146, G - 80, 1404, G - 70, KMAT.whitepanel, { base: 0.6 }); });
      for (const x of [1180, 1260, 1340]) bTree(L, x, G - 2, 'bamboo', { h: 60 });
      L.sign(1230, G - 94, 7, '#9af0ff', { r: 60 }); L.light(1275, G - 40, 100, [0.7, 0.95, 1], 0.6);
      L.prop('deco', 1440, G, { art: () => bench(), id: 'sbb1' }); L.prop('vending', 1480, G, { look: { col: '#ff4ab0', body: '#5a2a4a' }, label: 'vending machine' });
      // a run of kiosks: noodles, parts, a pawn window
      bShophouse(L, 1540, 1660, G, { floors: 2, fh: 30, wall: KMAT.corrBlue, shops: [['ramen', '#ff3a2a']], roof: 'tin', balcony: false, seed: 431 });
      bShophouse(L, 1660, 1760, G, { floors: 2, fh: 30, wall: MAT.rust, shops: [['pawn', '#3af0e0']], roof: 'shack', balcony: false, seed: 432 });
      kStallAt(L, 1810, G, 'parts', { col: '#2a3a4a' });
      // a second gantry and a crane arm out over the drop
      L.paint(1880, G - 180, 2140, G, (P) => { for (let x = 1880; x < 2140; x += 40) girder(P, x, G - 170, x + 40, G - 160, MAT.rust, { step: 10 }); for (const x of [1884, 2130]) P.block(x, G - 170, x + 4, G, MAT.rust, { base: 0.4, lip: 0 }); });
      L.walk(1880, 2140, G - 160, 4, MAT.rust); L.stairs(1900, G, 1990, G - 80); L.walk(1990, 2100, G - 80, 4, MAT.rust); L.ladder(2096, G - 160, G - 80); L.spots.push([2040, G - 160], [2040, G - 80]);
      // the east tower
      bGlass(L, 2300, 2540, G, { h: 420, crown: 'slant', glass: KMAT.blackglass, edge: '#ff4ab0', lit: 0.3, logo: '#ff4ab0', seed: 441 });
      L.spots.push([350, G], [600, G], [760, G], [1270, G], [1460, G], [1700, G], [2200, G]);
      L.litter(200, 2300, G, 12);
    },
  });
  L.spawns.enter[1] = 386; return L;
});

// ---- Arcology Gardens: the arcology's terraced garden, under glass. Cherry
// trees, pines and bamboo, a pond with a red bridge, a tea house, a pavilion,
// greenhouses, a temple, gardeners. Quiet; the quietest place up high.
addDistrict('d_gardens', 'Arcology Gardens', 1, 110, 660, 'The arcology\'s terraced garden under glass: cherry trees, a pond, a tea house, greenhouses, a temple.', 'Gardens', () => district({
  id: 'd_gardens', name: 'Arcology Gardens', tier: 1, W: 2600, layerDy: 80, floor: R(['#1a1410', '#2e2418', '#4a3c2a', '#8a7a5a']), amb: [0.3, 0.32, 0.32], rain: 0,
  local: { name: 'Gardener', lines: ['Every tree in here costs more than your rent.', 'The cherries bloom on a timer. They\'re never wrong.', 'Mind the moss. It\'s older than me.'], look: { hair: 'cap', capCol: '#3a5a2a', top: '#3a5a3a', apron: '#4a3a2a', legs: '#2a2a2a' } },
  build(L, G) {
    // the glass roof of the arcology over all of it: ribs and panes
    L.paint(0, 0, 2600, 90, (P) => { P.area(0, 0, 2600, 90, MAT.glass, (x, y) => 0.3 + ((x + y * 2) % 37 < 2 ? 0.2 : 0) - y / 400); for (let x = 0; x < 2600; x += 80) for (let y = 0; y < 90; y++) P.put(x + Math.round(y * 0.3), y, tone(KMAT.whitepanel, 0.6)); for (let x = 0; x < 2600; x++) { P.put(x, 88, tone(KMAT.whitepanel, 0.7)); P.put(x, 89, tone(KMAT.whitepanel, 0.4)); } });
    L.paint(0, G - 4, 2600, G, (P) => { for (let x = 0; x < 2600; x++) for (let y = G - 4; y < G; y++) if (hash(x, y, 3) < 0.3) P.put(x, y, tone(KMAT.moss, 0.5)); });
    // the arcology's glass wall: mullions over the city behind, a lit rail at its foot
    L.paint(0, 90, 2600, G - 2, (P) => { for (let x = 0; x < 2600; x += 64) for (let y = 90; y < G - 2; y++) { P.put(x, y, tone(KMAT.whitepanel, 0.5)); P.put(x + 1, y, tone(KMAT.whitepanel, 0.25)); } for (let y = 140; y < G - 2; y += 56) for (let x = 0; x < 2600; x++) P.put(x, y, tone(KMAT.whitepanel, 0.4)); for (let x = 0; x < 2600; x++) P.put(x, G - 3, [150, 230, 190], 0.4); });
    for (let x = 200; x < 2600; x += 180) L.light(x, G - 30, 110, [0.75, 1, 0.8], 0.45);
    // the entrance: a gate and a path of stone lanterns
    bTorii(L, 190, 260, G, 60, { ramp: KMAT.darkwood }); bToro(L, 290, G); bToro(L, 350, G);
    bPark(L, 370, 700, G, { trees: ['sakura', 'sakura', 'pine'], fence: false, seed: 501 });
    L.npc({ name: 'Head gardener Mori', look: { skin: SKINS[1], hair: 'bald', top: '#3a5a3a', apron: '#4a3a2a', legs: '#2a2a2a', tall: 0.92 }, x: 540, y: G, sched: [[0, 24, 540, 'wander']], lines: ['Something has been digging in the bamboo. Something with very neat paws.', 'Synth birds. We\'re not allowed real ones. The real ones die.'] });
    // the tea house on a raised terrace, stairs up to it
    L.paint(720, G - 30, 980, G, (P) => P.block(720, G - 30, 980, G, KMAT.stone, { base: 0.45, panels: [20, 10] }));
    L.solid(720, G - 30, 980, G); L.stairs(680, G, 720, G - 30, KMAT.stone);
    bMachiya(L, 760, 940, G - 30, { noren: '#2a6a3a', seed: 511 });
    kStallAt(L, 960, G - 30, 'tea', { col: '#2a6a3a', npc: { name: 'Tea master', lines: ['Sit. The garden won\'t go anywhere.', 'A woman with silver hair came for tea every night last week. Then she stopped.'] } });
    L.spots.push([860, G - 30]); L.stairs(980, G - 30, 1020, G, KMAT.stone);
    // the pond and its red bridge, willows, a crane of bronze
    bTree(L, 1050, G, 'willow', { h: 84 }); bTree(L, 640, G, 'sakura', { h: 76 }); bTree(L, 430, G, 'sakura', { h: 66 }); L.light(540, G - 50, 120, [1, 0.75, 0.85], 0.5);
    hiBridge(L, 1100, 1260, G);
    bTree(L, 1300, G, 'pine', { h: 64 });
    // the greenhouses
    hiDome(L, 1420, G, 52); hiDome(L, 1540, G, 40);
    L.prop('ac', 1600, G, { label: 'climate unit' }); L.prop('rack', 1620, G, { label: 'irrigation controller' });
    // bamboo grove, then the pavilion and the temple on the upper terrace
    for (const x of [1660, 1700, 1740]) bTree(L, x, G, 'bamboo', { h: 80 + (x % 3) * 8 });
    L.paint(1780, G - 60, 2380, G, (P) => { P.block(1780, G - 30, 2380, G, KMAT.stone, { base: 0.45, panels: [24, 10] }); kGrass(P, 1780, 2380, G - 30, { seed: 9 }); });
    L.solid(1796, G - 30, 2380, G); L.stairs(1756, G, 1796, G - 30, KMAT.stone);
    bTemple(L, 1820, 1980, G - 30, { h: 40, base: 8, roofH: 22, steps: false, lit: true });
    bPagoda(L, 2060, G - 30, { tiers: 3, w: 50, th: 26 });
    bTree(L, 2150, G - 30, 'sakura', { h: 70 }); bToro(L, 2210, G - 30);
    L.paint(2240, G - 90, 2370, G - 30, (P) => { P.block(2246, G - 76, 2364, G - 30, KMAT.darkwood, { base: 0.3 }); for (const x of [2246, 2300, 2360]) P.block(x, G - 76, x + 4, G - 30, KMAT.lacquer, { base: 0.5, lip: 0 }); kRoof(P, 2240, 2370, G - 76, 14, KMAT.kawara, { over: 10, inset: 20, curve: 4 }); });
    L.light(2300, G - 50, 70, [1, 0.7, 0.4], 0.6); L.prop('deco', 2300, G - 30, { art: () => bench(), id: 'gpb' });
    L.spots.push([1900, G - 30], [2100, G - 30], [2300, G - 30]);
    L.stairs(2380, G - 30, 2420, G, KMAT.stone);
    bPark(L, 2420, 2600, G, { trees: ['pine', 'bamboo'], seed: 521 });
    L.critter('cat', 400, 700, G, 1); L.critter('owl', 1300, 1300, G - 60, 1); L.critter('dog', 2420, 2580, G, 1);
    L.spots.push([300, G], [520, G], [1180, G - 16], [1480, G], [1700, G], [2500, G]);
  },
}));


// above the clouds: a night sky full of stars, the tops of the other spires
// poking up through a sea of cloud lit from beneath by the city
function hiCloudLayers(L) {
  L.holos = []; L.train = null;
  L.layersKey = null; L.layers = [
    { f: 0.06, fy: 0.05, w: 900, h: 280, paint(P) {
      P.area(0, 0, 900, 280, R(['#020208', '#06081a', '#10163a', '#2a2a5a', '#5a4a7a'], 12, 0.3, 0.3), (x, y) => 0.08 + Math.pow(y / 280, 1.6) * 0.75, { jit: 0.3 });
      for (let k = 0; k < 200; k++) { const x = hash(k, 1, 77) * 900, y = hash(k, 2, 77) * 160; P.put(x, y, hash(k, 3, 77) < 0.2 ? [255, 240, 220] : [150, 160, 210], hash(k, 3, 77) < 0.2 ? 0.8 : 0.3); }
      for (const [x, h, w] of [[120, 70, 8], [330, 50, 6], [560, 90, 10], [770, 60, 7]]) { P.block(x, 190 - h, x + w, 200, R(['#0a0c16', '#161a2a', '#2a3046', '#5a6a8a']), { base: 0.35 }); for (let y = 190 - h - 24; y < 190 - h; y++) P.put(x + (w >> 1), y, [90, 100, 130]); P.put(x + (w >> 1), 190 - h - 25, [255, 60, 70], 1); for (let y = 190 - h + 6; y < 196; y += 6) if (hash(x, y, 5) < 0.6) P.put(x + 2 + (y % 3), y, [255, 220, 160], 0.6); }
      cloudBands(P, 0, 900, 150, 280, R(['#2a2440', '#4a3e62', '#7a6a90', '#c8a8c8'], 9, 0.3, 0.2), 13);
    } },
    { f: 0.2, fy: 0.16, w: 1300, h: 300, paint(P) {
      for (const [x, h, w] of [[200, 150, 18], [620, 180, 24], [1010, 130, 16]]) { P.block(x, 230 - h, x + w, 300, R(['#0e1020', '#1c2238', '#30385a', '#7a8ab0']), { base: 0.38, panels: [w, 12] }); for (let y = 230 - h + 4; y < 250; y += 6) for (let i = 3; i < w - 2; i += 4) if (hash(i + x, y, 3) < 0.4) P.put(x + i, y, [255, 214, 150], 0.5); P.put(x + (w >> 1), 230 - h - 1, [255, 60, 70], 1); }
      cloudBands(P, 0, 1300, 178, 300, R(['#3a3050', '#6a5a80', '#a890b0', '#f0d0e0'], 9, 0.3, 0.2), 29);
    } },
  ];
}
// ---- The Spires: above the clouds. Penthouse towers in glass and white
// metal, a landing pad, a sky lounge, Meridian's enforcers, and at the top of
// it all Halden's penthouse.
LEVELS.spires = { name: 'The Spires', depth: '+300 m', metres: 300, mapX: 520, tier: 6, hub: true, label: 'Above the clouds', blurb: 'Above the clouds: penthouse towers, a sky lounge, and Halden at the top of it all.', make: () => {
  const L = district({
    id: 'spires', name: 'The Spires', tier: 6, W: 3400, layerDy: 0, floor: KMAT.whitepanel, wet: false, rain: 0, amb: [0.26, 0.26, 0.34],
    build(L, G) {
      L.spawns.pad = [140, G]; hiCloudLayers(L);
      // the pad: lit markings, a beacon
      L.paint(0, G, 260, G + 3, (P) => { for (let x = 0; x < 260; x++) if (x % 24 < 12) P.put(x, G + 1, [120, 200, 255], 0.4); });
      // a sea of cloud below the deck's edge, painted along the floor
      L.paint(0, G + 6, 3400, 430, (P) => { P.area(0, G + 6, 3400, 430, R(['#3a3a5a', '#6a6a8a', '#a8a8c8', '#e8e8f8']), (x, y) => 0.55 + (noise(x / 40, y / 8, 3) - 0.5) * 0.4 - (y - G) / 120); });
      bGlass(L, 270, 460, G, { h: 380, crown: 'ring', glass: MAT.glassC, panel: 30, edge: '#e8e8ff', seed: 601 });
      // the sky lounge: a long glass room of light, people at the bar
      L.paint(480, G - 90, 860, G, (P) => {
        P.block(476, G - 96, 864, G - 88, KMAT.whitepanel, { base: 0.65 });
        for (let x = 480; x < 860; x++) for (let y = G - 88; y < G; y++) P.put(x, y, (x - 480) % 38 < 2 ? [40, 46, 60] : mixRgb([255, 214, 160], [120, 90, 70], (y - G + 88) / 88 * 0.7), (x - 480) % 38 < 2 ? 0 : 0.15);
        P.block(520, G - 26, 820, G - 18, KMAT.blackglass, { base: 0.5 }); for (let x = 530; x < 810; x += 16) P.put(x, G - 30, [255, 230, 180], 1);
      });
      L.sign(600, G - 110, 9, '#e8e8ff', { r: 80 }); L.light(670, G - 50, 180, [1, 0.85, 0.6], 0.8);
      for (const x of [560, 620, 760]) L.prop('deco', x, G, { art: DECO.stool(), id: 'sls' + x });
      // white towers of bands, with a sky-garden terrace
      bGlass(L, 880, 1080, G, { h: 420, crown: 'step', glass: MAT.glass, panel: 24, fins: 20, edge: '#9af0ff', logo: '#9af0ff', seed: 611 });
      L.walk(880, 1080, G - 120, 6, KMAT.whitepanel); L.ladder(1074, G - 120, G);
      for (const x of [910, 980, 1040]) bTree(L, x, G - 120, x === 980 ? 'sakura' : 'pine', { h: 42 });
      L.spots.push([1000, G - 120]);
      // the concierge's desk in a marble lobby
      L.paint(1100, G - 60, 1320, G, (P) => { P.block(1100, G - 60, 1320, G, KMAT.plaster, { base: 0.62, panels: [36, 60] }); P.block(1100, G - 64, 1320, G - 58, KMAT.gold, { base: 0.6 }); for (let x = 1150; x < 1270; x++) for (let y = G - 50; y < G - 30; y++) P.put(x, y, mixRgb([255, 236, 200], [150, 120, 90], (y - G + 50) / 20 + ((x - 1150) % 20 < 2 ? 0.4 : 0)), 0.1); });
      L.prop('deco', 1200, G, { art: () => desk({ col: '#e8e0d0' }), id: 'condesk' }); L.light(1210, G - 30, 90, [1, 0.92, 0.78], 0.8);
      L.npc({ name: 'Concierge', role: 'vendor', rate: 0.5, look: { skin: SKINS[0], hair: 'short', hairCol: '#1a1a1a', top: '#1a1a24', coat: 'long', collar: true, legs: '#1a1a24', hands: { fx: 26, fy: 38 } }, x: 1200, y: G, sched: [[0, 24, 1200, 'stand']], lines: ['Welcome to the Spires. Please don\'t touch anything.'], behind: true });
      // a garden of white stone, a pool of light
      hiFountain(L, 1420, G, '#e8e8ff'); hiSculpture(L, 1560, G);
      bGlass(L, 1640, 1820, G, { h: 460, crown: 'slant', glass: KMAT.blackglass, edge: '#ffd040', lit: 0.25, panel: 50, seed: 621 });
      L.prop('rack', 1840, G, { label: 'data rack' });
      bGlass(L, 1880, 2080, G, { h: 400, crown: 'step', glass: R(['#1a1408', '#3a2a10', '#6a5020', '#e8c070']), edge: '#ffd040', fins: 14, seed: 631 });
      bPark(L, 2090, 2390, G, { trees: ['pine', 'street'], fence: false, critters: false, seed: 641 });
      // Halden's penthouse
      arena(L, 2400, 3300, G, 'penthouse');
      // the penthouse dressed: a wall of glass on the night, gold columns, marble, a chandelier, palms in pots
      L.paint(2400, 60, 3300, G, (P) => {
        P.area(2420, 90, 3280, G - 60, KMAT.blackglass, (x, y) => 0.25 + ((x + y) % 31 < 2 ? 0.25 : 0) + (hash(x >> 2, y >> 2, 7) < 0.02 ? 0.6 : 0));
        for (let x = 2420; x < 3280; x += 70) { P.block(x, 90, x + 8, G - 60, KMAT.gold, { base: 0.55, lip: 0 }); }
        P.block(2400, G - 60, 3300, G, KMAT.plaster, { base: 0.62, panels: [50, 60] }); kH(P, 2400, 3300, G - 60, tone(KMAT.gold, 0.8), 0.2);
        for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; P.put(2850 + Math.cos(a) * 30, G - 150 + Math.sin(a) * 6, [255, 230, 170], 1); P.put(2850 + Math.cos(a) * 20, G - 138 + Math.sin(a) * 4, [255, 230, 170], 1); }
        kV(P, 2850, 60, G - 156, tone(KMAT.gold, 0.6));
        for (let x = 2420; x < 3280; x++) for (let y = G - 90; y < G - 60; y++) P.put(x, y, mixRgb([20, 18, 40], [140, 100, 140], (y - G + 90) / 30 * 0.8 + (noise(x / 20, y / 4, 5) - 0.5) * 0.2), 0.05);
      });
      L.light(2850, G - 140, 260, [1, 0.88, 0.65], 0.9);
      for (const x of [2470, 3220]) { bTree(L, x, G, 'street', { h: 64 }); }
      L.prop('deco', 3000, G, { art: () => desk({ col: '#e8e0d0' }), id: 'haldesk' });
      L.spots.push([300, G], [600, G], [900, G], [1300, G], [1700, G], [1950, G], [2200, G], [2300, G]);
    },
  });
  L.rain = 0; L.dry = [[0, 0, L.w, L.h]]; return L;
} };
