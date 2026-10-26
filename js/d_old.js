'use strict';
// ---------------------------------------------------------------------------
// Old Town: the first city, sunk under the new one. Wooden townhouses,
// temples, canals and lanterns, all under a concrete sky: the new city's
// foundations, slab and beams overhead, columns as wide as houses coming
// down through the old streets. Reached by the old subway.
// ---------------------------------------------------------------------------

const OT_CON = R(['#121216', '#202026', '#30303a', '#5e5e6a']);
const OT_BACK = R(['#07070a', '#0e0e14', '#18181f', '#34343e']);
// the frame every Old Town place shares: a dim back wall with older roofs in
// it, the slab overhead with its beams, the great columns, drips from above
function otBack(L, G, o = {}) {
  const W = L.w, seed = o.seed || 7, CE = o.ceil || G - 176, cols = o.cols || 430;
  L.paint(0, CE, W, G, (P) => {
    P.area(0, CE, W, G, o.back || OT_BACK, (x, y) => 0.22 + (noise(x / 90, y / 50, seed) - 0.5) * 0.14 + (y - CE) / (G - CE) * 0.1);
    // far roofs of the drowned city, a few windows still lit
    for (let x = -20; x < W; x += 50 + Math.floor(hash(x, 1, seed) * 46)) {
      const w = 36 + Math.floor(hash(x, 2, seed) * 40), h = 50 + Math.floor(hash(x, 3, seed) * 70), t = G - h;
      P.area(x, t, x + w, G, R(['#0a0a10', '#121219', '#1c1c26', '#34343e']), () => 0.34 + hash(x, 4, seed) * 0.1);
      P.area(x - 5, t - 9, x + w + 5, t + 1, R(['#08080c', '#101016', '#1a1a22', '#2e2e38']), (xx, yy) => 0.4 - (yy - t + 9) / 30, { inside: (xx, yy) => yy > t - 9 + Math.abs(xx - x - w / 2) * 18 / (w + 10) - 0 });
      for (let wy = t + 8; wy < G - 12; wy += 14) for (let wx = x + 5; wx < x + w - 6; wx += 11) if (hash(wx, wy, seed) < 0.16) kFill(P, wx, wy, wx + 4, wy + 6, hash(wx, wy, seed + 1) < 0.6 ? '#7a5a30' : '#3a5a5a', 0.25);
    }
  });
  // the slab overhead, beams under it, pipes along it
  L.block(0, 0, W, CE, OT_CON, { base: 0.26, lip: 0, panels: [140, 26], drips: 0.25, dripLen: 24 });
  L.paint(0, CE, W, CE + 18, (P) => { for (let x = 0; x < W; x += 70) girder(P, x, CE, x + 70, CE + 12, MAT.steelD, { step: 14 }); pipe(P, 0, CE + 13, W, CE + 18, MAT.rust, { joints: 60 }); });
  // the columns: the new city standing on the old one
  for (let x = o.col0 || 360; x < W - 40; x += cols) L.paint(x - 10, CE, x + 56, G, (P) => {
    P.block(x, CE, x + 46, G, OT_CON, { base: 0.36, lip: 0, panels: [46, 40], drips: 0.3, dripLen: 70, seed: x });
    P.block(x - 8, CE + 18, x + 54, CE + 30, OT_CON, { base: 0.48 });
    for (let k = 0; k < 6; k++) P.put(x + 6 + k * 6, G - 70 - (k % 3) * 9, [255, 150, 60], 0.3);
  });
  for (let x = 120; x < W; x += 260) L.drips.push({ x: x + Math.floor(hash(x, 5, seed) * 80), y0: CE + 16, y1: G });
  L.dry.push([0, 0, W, L.h]);
}
// water over the street: shallow, dark, catching the light
function otWater(L, x0, x1, G, o = {}) {
  L.paint(x0, G - 3, x1, L.h, (P) => {
    P.area(x0, G - 2, x1, L.h, KMAT.water, (x, y) => 0.28 + (noise(x / 18, y / 3, 61) - 0.5) * 0.2 + (y < G ? 0.32 : 0) - (y - G) / 120);
    for (let x = x0; x < x1; x += 3) if (hash(x, 2, 17) < 0.3) P.put(x, G - 1, [120, 150, 170], 0.15);
  });
  L.wet.push({ y: G - 1, x0, x1, depth: o.depth || 30, k: o.k || 0.55 });
}
// a hump bridge of wood and red rails over a canal
function otBridge(L, x0, x1, G) {
  L.paint(x0 - 4, G - 22, x1 + 4, G + 6, (P) => {
    const mid = (x0 + x1) / 2, span = (x1 - x0) / 2, arc = (x) => G - 2 - Math.max(0, 1 - ((x - mid) / span) ** 2) * 10;
    P.area(x0, G - 14, x1, G + 6, KMAT.darkwood, (x, y) => 0.5 - (y - arc(x)) / 14, { inside: (x, y) => y >= arc(x) && y <= arc(x) + 4 });
    for (let x = x0; x <= x1; x++) { const y = Math.round(arc(x)) - 8; P.put(x, y, tone(KMAT.lacquer, 0.7)); P.put(x, y + 1, tone(KMAT.lacquer, 0.35)); if ((x - x0) % 12 === 0) for (let j = 0; j < 8; j++) P.put(x, y + j, tone(KMAT.lacquer, 0.5)); }
    for (const px of [x0 + 6, x1 - 8]) P.block(px, G - 2, px + 3, G + 6, KMAT.darkwood, { base: 0.35, lip: 0 });
  });
}
// a small boat on the water: a hull, a cabin or a lantern on a pole
function otBoat(L, x, G, o = {}) {
  L.paint(x - 40, G - 40, x + 40, G + 6, (P) => {
    const w = o.w || 56, x0 = x - w / 2;
    P.area(x0, G - 8, x0 + w, G + 4, rp(o.col || '#3a2a1e', 7), (xx, y) => 0.55 - (y - G + 8) / 16, { inside: (xx, y) => { const d = Math.min(xx - x0, x0 + w - xx); return y < G + 4 - Math.max(0, 8 - d) * 0.6; } });
    kH(P, x0, x0 + w, G - 8, tone(MAT.wood, 0.85));
    if (o.cabin) { P.block(x - 12, G - 22, x + 10, G - 8, KMAT.darkwood, { base: 0.4 }); kRoof(P, x - 12, x + 10, G - 22, 6, KMAT.kawara, { over: 4, inset: 5 }); kFill(P, x - 6, G - 18, x + 4, G - 12, '#ffb060', 0.4); }
    else { kV(P, x + w / 2 - 8, G - 30, G - 8, tone(KMAT.darkwood, 0.6)); kLantern(P, x + w / 2 - 8, G - 30, '#ff6a30', { r: 2, h: 4 }); }
  });
  L.light(x + (o.cabin ? 0 : (o.w || 56) / 2 - 8), G - 20, 40, [1, 0.6, 0.3], 0.55, 1, { mode: 'fire', seed: x });
}
// a stone grave marker, a candle
function otGrave(P, x, G, seed) { const h = 10 + Math.floor(hash(x, 1, seed) * 8); P.block(x - 3, G - h, x + 3, G, KMAT.stone, { base: 0.45 + hash(x, 2, seed) * 0.15 }); P.block(x - 5, G - 3, x + 5, G, KMAT.stone, { base: 0.4 }); if (hash(x, 3, seed) < 0.5) for (let j = 0; j < 4; j++) P.put(x + 7, G - 1 - j, j === 3 ? [255, 200, 120] : [220, 210, 190], j === 3 ? 1 : 0); }
// candles in a row: little flames
function otCandles(L, x0, x1, y, n) { L.paint(x0, y - 8, x1, y + 1, (P) => { for (let k = 0; k < n; k++) { const x = Math.round(x0 + (x1 - x0) * (k + 0.5) / n), h = 3 + (k % 3); for (let j = 0; j < h; j++) P.put(x, y - j, [230, 220, 200]); P.put(x, y - h, [255, 210, 120], 1); P.put(x, y - h - 1, [255, 170, 60], 0.8); } }); L.light((x0 + x1) / 2, y - 6, Math.max(40, (x1 - x0) * 0.8), [1, 0.7, 0.35], 0.6, 1, { mode: 'fire', seed: x0 }); }
// a tiled station wall: white tiles gone yellow, a band, a name board
function otTiles(P, x0, y0, x1, y1, seed, band = '#2a6a5a') {
  P.area(x0, y0, x1, y1, R(['#1e1c18', '#4a463c', '#8a8270', '#d8d0b8']), (x, y) => 0.5 - (y - y0) / (y1 - y0) * 0.2 + (((x - x0) % 6 === 0 || (y - y0) % 4 === 0) ? -0.2 : 0) + (noise(x / 20, y / 14, seed) - 0.5) * 0.3);
  kFill(P, x0, y0 + 22, x1, y0 + 27, band);
}

// ---- Old Town: the hub. The subway platform, an old street, a canal, a
// temple, Ferrin's stall, and the Mayor's hall at the east end
LEVELS.oldtown = { name: 'Old Town', depth: '-140 m', metres: -140, tier: 3, hub: true, mapX: 500, label: 'The first city', blurb: 'The first city, sunk under the new one: canals, temples, lanterns, and the Old Mayor who runs it.', make: () => district({
  id: 'oldtown', name: 'Old Town', tier: 3, W: 3400, sky: false, transit: 'subway', floor: KMAT.stone, amb: [0.18, 0.15, 0.17], crowd: 6, crowdTo: 2300,
  local: { name: 'Old-timer', lines: LOCAL_LINES.flood, look: { hair: 'long', hairCol: '#c8c8c8', top: '#4a3a2a', coat: 'long' } },
  build(L, G) {
    L.spawns.subway = [140, G];
    otBack(L, G, { seed: 31, col0: 620, cols: 520 });
    // the platform the old line still stops at
    L.paint(0, G - 120, 230, G, (P) => { otTiles(P, 0, G - 120, 230, G, 31); P.block(0, G - 126, 230, G - 120, MAT.steelD, { base: 0.5 }); P.block(120, G - 100, 200, G - 70, MAT.steelD, { base: 0.4 }); for (let i = 0; i < 6; i++) { kH(P, 126, 196, G - 92 + i * 4, ['#d83a2a', '#3a8ad8', '#e8b030', '#3aa86a', '#8a3ad8', '#e8e8e8'][i]); kFill(P, 130 + i * 11, G - 94 + i * 4, 133 + i * 11, G - 89 + i * 4, '#f0f0f0'); } });
    L.sign(12, G - 112, 7, '#ffd040', { r: 50, seed: 3 }); L.tube(40, G - 118, 30, '#e8ffe8', 0.6); L.tube(160, G - 118, 30, '#e8ffe8', 0.5);
    L.prop('deco', 190, G, { art: () => bench(), id: 'otb1' });
    // the old street: townhouses, lanterns
    bMachiya(L, 236, 318, G, { seed: 1, noren: '#1a2a4a' });
    bMachiya(L, 318, 410, G, { seed: 2, noren: '#6a1a1a', doorLeft: true });
    // the canal and its bridge; the Ferryman's boat
    otWater(L, 420, 640, G); otBridge(L, 440, 620, G); otBoat(L, 470, G + 8, { cabin: true });
    L.npc({ name: 'The Ferryman', look: { skin: SKINS[5], hair: 'hood', top: '#2a3a3a', coat: 'long', legs: '#1a2020', tall: 0.95 }, x: 520, y: G, face: -1, sched: [[0, 24, 520, 'stand']], lines: ['Old Town keeps its own hours. And its own law.', 'The lanterns are lit with glass and good will. Mostly glass.'] });
    // shophouses of the old city, tile roofs, a gallery along the first floor
    bShophouse(L, 650, 770, G, { floors: 2, wall: KMAT.stucco, shops: [['tea', '#ffb040']], roof: 'tile', ac: false, seed: 301 });
    bShophouse(L, 770, 860, G, { floors: 2, wall: KMAT.plaster, shops: [['pawn', '#ffd040']], roof: 'tile', ac: false, seed: 302 });
    kStallAt(L, 900, G, 'parts', { col: '#5a3a1a', npc: { name: 'Ferrin', role: 'vendor', rate: 1.2, look: { skin: SKINS[1], hair: 'long', hairCol: '#8a8a80', top: '#3a3a2a', apron: '#2a2a1a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, lines: ['Old Town prices. Old Town quality. Buy something.'] } });
    bShophouse(L, 940, 1060, G, { floors: 2, wall: KMAT.ochre, shops: [['noren', '#ff8a3a']], roof: 'tile', ac: false, seed: 303, blade: '#ff6a3a' });
    L.walk(654, 1056, G - 80, 5); L.stairs(1060, G, 1120, G - 80); L.dry.push([650, G - 80, 1060, G]); L.spots.push([800, G - 80]);
    bLanterns(L, 236, 410, G - 100, ['#ff3a2a', '#ffb040']); bLanterns(L, 650, 1060, G - 126, ['#ff3a2a', '#ffd890'], { step: 16 });
    // the temple, its gate and lanterns; Esi sweeps the steps
    bTorii(L, 1090, 1150, G, 62); bToro(L, 1166, G);
    bTemple(L, 1200, 1420, G, { h: 50, roofH: 34, double: false });
    bToro(L, 1446, G); bTree(L, 1480, G, 'pine', { h: 64 });
    L.npc({ name: 'Esi', look: { skin: SKINS[3], hair: 'bun', hairCol: '#1a1414', top: '#5a3a2a', legs: '#2a2420' }, x: 1300, y: G, sched: [[0, 24, 1300, 'stand']], lines: ['My brother\'s in a precinct cell up top. For an arm. An arm!', 'The Mayor runs everything down here. Even the water.'] });
    // a lantern lane, a bathhouse
    bMachiya(L, 1520, 1600, G, { seed: 4, noren: '#2a4a2a' }); bMachiya(L, 1600, 1680, G, { seed: 5, noren: '#4a1a4a', doorLeft: true });
    bBath(L, 1700, 1830, G, {});
    kStallAt(L, 1560, G, 'dumpling', { npc: { name: 'Auntie Bo', lines: ['Dumplings from the old recipe. The old city\'s, not mine.', 'The Mayor\'s men don\'t pay. Everyone else pays double.'] } });
    // the second canal, a stack of old houses with ladders up them
    otWater(L, 1850, 2010, G); otBridge(L, 1860, 2000, G); otBoat(L, 1960, G + 8, {});
    bShophouse(L, 2020, 2160, G, { floors: 3, wall: MAT.brick, shops: [['half', '#ffb040']], roof: 'tile', seed: 304 });
    bShophouse(L, 2160, 2370, G, { floors: 2, wall: KMAT.stucco, shops: [['izakaya', '#ff6a3a'], ['shutter', '#3af0e0']], roof: 'tile', seed: 305, blade: '#ffd040' });
    L.walk(2026, 2366, G - 80, 5); L.ladder(2030, G - 80, G); L.walk(2060, 2360, G - 142, 5); L.ladder(2340, G - 142, G - 80);
    L.dry.push([2020, G - 142, 2370, G]); L.spots.push([2200, G - 80], [2200, G - 142]); L.prop('locker', 2300, G - 142, { tier: 3, label: 'locker' });
    bLanterns(L, 2020, 2370, G - 160, ['#ff3a2a', '#ffb040']);
    // the Mayor's hall and his lift
    arena(L, 2400, 3260, G, 'hall'); L.enemy('mayor', 2860, G, { arena: [2420, 3240] });
    keyDoor(L, 3330, G, 'mayorkey', 'lift', 'The Mayor\'s lift, down to the Works');
    // trouble, things to strip, lockers
    kFoes(L, G, [['spider', 760, 650, 860], ['gang', 1600, 1500, 1700], ['gunner', 2100, 2020, 2200], ['feral', 2260, 2160, 2370]]);
    L.prop('locker', 1150, G, { tier: 3, label: 'locker' }); L.prop('locker', 1840, G, { tier: 3, label: 'locker' });
    L.prop('junk', 600, G, { label: 'junk pile' }); L.prop('ac', 1010, G - 80, { label: 'air conditioner' }); L.prop('vending', 2380, G, { look: { col: '#ffb040', body: '#5a3a1a' }, label: 'vending machine' });
    L.spots.push([340, G], [700, G], [1000, G], [1330, G], [1620, G], [1900, G], [2100, G], [2260, G]);
    L.critter('rat', 200, 2380, G, 3); L.critter('cat', 1500, 1700, G, 1);
  },
}) };

// ---- Flooded Arcade: a covered shopping street of the old city, half under
// water: a glass roof on iron arches, shuttered shops, signs from a century ago
addDistrict('d_arcade', 'Flooded Arcade', 3, -150, 300, 'A covered shopping street of the old city, half under water, under a roof of broken glass.', 'Drowned arcade', () => district({
  id: 'd_arcade', name: 'Flooded Arcade', tier: 3, W: 2600, sky: false, transit: 'subway', floor: KMAT.stone, amb: [0.16, 0.16, 0.2], crowd: 3,
  local: { name: 'Shopkeeper', lines: ['Forty years I kept this shop. The water came in the night, and I kept it anyway.', 'Wade, don\'t swim. The deep channels have things in them.', 'Somebody came through with a cut wrist. Bought a bandage. Paid in clean money.'], look: { hair: 'bald', top: '#4a4a3a', apron: '#2a2a1a' } },
  build(L, G) {
    otBack(L, G, { seed: 41, col0: 900, cols: 900 });
    const RF = G - 150;
    // the arcade roof: iron arches, panes of glass, some broken through
    L.paint(150, RF - 30, 2500, RF + 12, (P) => {
      for (let x = 150; x < 2500; x++) for (let y = RF - 22; y < RF; y++) { const k = (x - 150) % 100, a = Math.abs(k - 50) / 50, top = RF - 22 + a * a * 18; if (y < top) continue; const broken = noise(x / 14, y / 6, 4) > 0.7; if (!broken) P.put(x, y, mixRgb([40, 70, 80], [120, 170, 180], (y - top) / 22 + ((x + y) % 11 === 0 ? 0.3 : 0)), 0.05); }
      for (let x = 150; x < 2500; x += 100) for (let k = 0; k <= 100; k += 1) { const a = Math.abs(k - 50) / 50, y = Math.round(RF - 22 + a * a * 18); P.put(x + k, y, tone(MAT.steelD, 0.6)); P.put(x + k, y + 1, tone(MAT.steelD, 0.3)); }
      for (let x = 150; x <= 2500; x += 100) P.block(x - 2, RF - 4, x + 2, G, MAT.steelD, { base: 0.45, lip: 0 });
      for (let x = 150; x < 2500; x += 25) kV(P, x, RF - 18, RF, tone(MAT.steelD, 0.4));
    });
    // shops along the arcade, two floors, mostly shut, a few still trading
    const kinds = [['shutter', '#ffb040'], ['half', '#ffd040'], ['pawn', '#ff8a3a'], ['shutter', '#3af0e0'], ['tea', '#ffb040'], ['shutter', '#ff6a8a'], ['bakery', '#ffd890'], ['half', '#3aff80'], ['shutter', '#ffd040'], ['pawn', '#c8a040'], ['shutter', '#9a6aff'], ['glass', '#ffb040'], ['shutter', '#ffd040'], ['flowers', '#ff6a8a'], ['shutter', '#3af0e0']];
    let x = 200;
    kinds.forEach(([k, c], i) => { const w = 140 + (i % 3) * 10; if (x + w > 2420) return; bShophouse(L, x, x + w, G, { floors: 1, fh: 46, gh: 44, wall: [KMAT.cream, KMAT.stucco, KMAT.teal, KMAT.pink, KMAT.ochre][i % 5], shops: [[k, c]], roof: 'flat', balcony: false, ac: false, lit: 0.25, seed: 400 + i }); x += w; });
    // hanging signs from a century ago, half of them dead
    for (let sx = 260; sx < 2400; sx += 130) L.sign(sx, RF + 6, 5 + (sx % 3), ['#ffb040', '#ff6a8a', '#3af0e0', '#ffd040'][(sx >> 5) % 4], { vert: true, r: 50, dead: (sx % 260) ? 0.5 : 0, seed: sx });
    bLanterns(L, 200, 2420, RF + 2, ['#ff3a2a', '#ffb040', '#ffd890'], { step: 22, sag: 6 });
    // the water: most of the floor, wading deep; dry boards on crates here and there
    otWater(L, 300, 2500, G, { k: 0.6 });
    for (const [a, b] of [[640, 760], [1240, 1380], [1900, 2020]]) L.paint(a, G - 8, b, G, (P) => { P.block(a, G - 5, b, G - 2, MAT.wood, { base: 0.55, panels: [10, 3] }); for (let cx = a + 4; cx < b - 8; cx += 30) P.block(cx, G - 2, cx + 10, G + 4, MAT.wood, { base: 0.4 }); });
    // the upper gallery, by stairs and a ladder
    L.walk(210, 1180, G - 90, 5); L.stairs(220, G, 310, G - 90); L.walk(1300, 2400, G - 90, 5); L.ladder(1310, G - 90, G); L.ladder(2380, G - 90, G);
    L.dry.push([200, G - 90, 2420, G]);
    for (const dx of [420, 780, 1060, 1520, 1880, 2240]) L.prop('deco', dx, G - 90, { art: DECO.door({ col: '#3a3440', light: '#ffd8a0' }), id: 'otad' + dx });
    // people who stayed, trouble that came
    kStallAt(L, 1310, G, 'books', { npc: { name: 'Archivist', lines: ['Paper from the old city. Water-stained, still readable.', 'A ticket stub came through last week. Old Town line. Punched at the Mayor\'s stop.'] } });
    L.prop('junk', 520, G, { label: 'junk pile' }); L.prop('vending', 990, G, { look: { col: '#ffb040', body: '#4a3a2a' }, label: 'dead vending machine' }); L.prop('ac', 1700, G - 90, { label: 'air conditioner' }); L.prop('junk', 2200, G, { label: 'junk pile' });
    L.prop('locker', 860, G - 90, { tier: 3, label: 'locker' }); L.prop('locker', 1980, G, { tier: 3, label: 'locker' });
    kFoes(L, G, [['spider', 900, 760, 1100], ['gunner', 1600, 1450, 1800], ['feral', 2100, 1950, 2300], ['spider', 1200, 1000, 1400, G - 90]]);
    // spots: 5 is a case's, on the ground in the deep middle of the arcade
    L.spots.push([400, G], [700, G], [1000, G], [600, G - 90], [1100, G - 90], [1450, G], [1700, G], [2000, G], [1700, G - 90], [2300, G]);
    L.critter('rat', 300, 2400, G - 90, 2);
  },
}));

// ---- Drowned Chapel: the old city's great hall of worship, flooded to the
// knee: pillars in the water, rows of pews going under, candles, a bell tower,
// and a graveyard of stone lanterns on the rise outside
addDistrict('d_chapel', 'Drowned Chapel', 3, -165, 560, 'The old city\'s great hall of worship, flooded to the knee: candles, pillars, a bell tower, a field of graves.', 'Flooded chapel', () => district({
  id: 'd_chapel', name: 'Drowned Chapel', tier: 3, W: 2500, sky: false, transit: 'subway', floor: KMAT.stone, amb: [0.15, 0.14, 0.18], crowd: 2,
  local: { name: 'Keeper', lines: ['I light the candles. Somebody has to.', 'They prayed for the water to stop. It stopped at the knee. That\'s a sort of answer.', 'The bell still rings when the trains go over. Seven times a night.'], look: { hair: 'bald', top: '#2a2a3a', coat: 'long', legs: '#1a1a24' } },
  build(L, G) {
    otBack(L, G, { seed: 51, col0: 300, cols: 2000 });
    // the graveyard on the rise: stone lanterns, markers, a dead tree, a gate
    L.paint(200, G - 40, 560, G, (P) => { for (let x = 230; x < 540; x += 22) otGrave(P, x, G, 51); });
    for (const x of [260, 360, 460]) bToro(L, x, G);
    bTree(L, 330, G, 'dead', { h: 80 }); bTorii(L, 500, 560, G, 60, { ramp: KMAT.stone });
    // the great hall: tall walls, arched windows of coloured glass
    const H0 = 580, H1 = 1760, TOP = G - 168;
    L.paint(H0, TOP - 20, H1, G, (P) => {
      P.block(H0, TOP, H1, G, KMAT.stone, { base: 0.3, panels: [40, 20], drips: 0.25, dripLen: 60, seed: 5 });
      for (let x = H0 + 40; x < H1 - 40; x += 120) {
        const cx = x + 20; for (let y = TOP + 20; y < G - 70; y++) for (let i = -12; i <= 12; i++) { const top = TOP + 34 - Math.sqrt(Math.max(0, 144 - i * i)); if (y < top) continue; const pane = (Math.floor((i + 12) / 6) + Math.floor((y - TOP) / 9)) % 4; P.put(cx + i, y, Math.abs(i) % 6 === 0 || (y - TOP) % 9 === 0 ? [20, 16, 20] : [[140, 40, 50], [40, 70, 140], [160, 120, 40], [50, 110, 70]][pane], 0.35); }
      }
      P.block(H0 - 6, TOP - 14, H1 + 6, TOP, KMAT.stone, { base: 0.5, bands: 4 });
    });
    // pillars down the hall, pews going under the water, the altar
    for (let x = H0 + 30; x < H1; x += 120) L.paint(x - 8, TOP, x + 16, G, (P) => { P.block(x - 2, TOP, x + 10, G, KMAT.stone, { base: 0.5, lip: 0, bands: 12 }); P.block(x - 6, TOP, x + 14, TOP + 8, KMAT.stone, { base: 0.6 }); });
    L.paint(H0, G - 16, H1, G, (P) => { for (let x = H0 + 50; x < H1 - 40; x += 40) if (Math.abs(x - 1170) > 70) { P.block(x, G - 14, x + 26, G - 11, KMAT.darkwood, { base: 0.5 }); P.block(x, G - 11, x + 3, G, KMAT.darkwood, { base: 0.35 }); P.block(x + 23, G - 11, x + 26, G, KMAT.darkwood, { base: 0.35 }); } });
    otWater(L, H0, H1, G, { k: 0.65 });
    L.paint(1100, G - 120, 1240, G, (P) => {
      P.block(1110, G - 22, 1230, G, KMAT.stone, { base: 0.55, panels: [20, 7] });
      // a seated figure of the old faith, gilded, worn
      P.area(1140, G - 100, 1200, G - 22, KMAT.gold, (x, y) => 0.5 - (x - 1170) / 80 - (y - G + 100) / 300 + (noise(x / 3, y / 3, 9) - 0.5) * 0.3, { inside: (x, y) => { const dx = x - 1170; if (y < G - 92) return Math.hypot(dx, y - G + 86) < 8; if (y < G - 60) return Math.abs(dx) < 12 + (y - G + 92) * 0.4; return Math.abs(dx) < 28 - (y - G + 60) * 0.05; } });
      for (let a = 0; a < Math.PI * 2; a += 0.02) P.put(Math.round(1170 + Math.cos(a) * 18), Math.round(G - 86 + Math.sin(a) * 18), [255, 200, 110], 0.5);
    });
    otCandles(L, 1112, 1228, G - 22, 14); otCandles(L, 700, 760, G - 14, 5); otCandles(L, 1500, 1560, G - 14, 5);
    L.light(1170, G - 70, 120, [1, 0.75, 0.4], 0.8);
    // the gallery up the hall walls
    L.walk(H0 + 10, H1 - 10, G - 112, 5, KMAT.stone); L.stairs(H0 + 16, G, H0 + 100, G - 112, KMAT.stone); L.ladder(H1 - 30, G - 112, G);
    L.spots.push([900, G - 112], [1450, G - 112]); L.prop('locker', 1640, G - 112, { tier: 3, label: 'offering box' });
    // the cloister: a water garden, a willow
    otWater(L, 1780, 2020, G); bTree(L, 1840, G, 'willow', { h: 80 }); bToro(L, 1920, G); bTree(L, 1980, G, 'bamboo', { h: 70 });
    // the bell tower, a ladder to its bell
    L.paint(2050, G - 200, 2210, G, (P) => {
      P.block(2080, G - 150, 2180, G, KMAT.stone, { base: 0.38, panels: [20, 30] });
      P.block(2090, G - 150, 2170, G - 90, KMAT.darkwood, { base: 0.3 });
      P.area(2112, G - 145, 2148, G - 105, KMAT.verdigris, (x, y) => 0.6 - (x - 2130) / 50 - (y - G + 145) / 120, { inside: (x, y) => Math.abs(x - 2130) < 8 + (y - G + 145) * 0.25 });
      for (const px of [2084, 2170]) P.block(px, G - 160, px + 6, G - 90, KMAT.lacquer, { base: 0.5, lip: 0 });
      kRoof(P, 2080, 2180, G - 158, 26, KMAT.kawara, { over: 14, inset: 30, curve: 6, ornament: '#e8b030' });
    });
    L.walk(2086, 2174, G - 90, 5, KMAT.darkwood); L.ladder(2100, G - 90, G); L.spots.push([2140, G - 90]);
    L.light(2130, G - 120, 60, [1, 0.6, 0.3], 0.5, 1, { mode: 'fire', seed: 21 });
    // more graves past the tower
    L.paint(2220, G - 40, 2480, G, (P) => { for (let x = 2240; x < 2470; x += 20) otGrave(P, x, G, 53); });
    bToro(L, 2300, G); bToro(L, 2420, G);
    // things that come out of the water
    kFoes(L, G, [['feral', 900, 700, 1050], ['feral', 1400, 1260, 1700], ['spider', 1900, 1790, 2020], ['gunner', 2350, 2230, 2470]]);
    L.prop('locker', 420, G, { tier: 3, label: 'locker' }); L.prop('junk', 1700, G, { label: 'fallen pew' }); L.prop('junk', 2040, G, { label: 'junk pile' });
    L.spots.push([300, G], [640, G], [850, G], [1000, G], [1350, G], [1600, G], [1900, G], [2250, G]);
    L.critter('rat', 600, 1700, G, 2);
  },
}));

// ---- Old Line Four: an abandoned subway line. Two platforms of tiled walls
// and route maps, a tunnel between, and a dead train people live in
function otCarriage(P, x0, x1, G, seed) {
  const top = G - 58;
  P.area(x0, top, x1, G - 6, R(['#121a18', '#22322e', '#3a524a', '#7a9a8a']), (x, y) => { let v = 0.42 - (y - top) / 160 + (noise(x / 30, y / 10, seed) - 0.5) * 0.2; if (y - top < 2) v = 0.75; if ((x - x0) % 62 === 0) v -= 0.25; if (y > G - 20 && y < G - 16) v += 0.15; return v; }, { inside: (x, y) => !(y < top + 3 && (x - x0 < 3 || x1 - x < 3)) });
  for (let x = x0 + 8; x < x1 - 16; x += 20) { const lit = hash(x, 1, seed) < 0.55; kWin(P, x, top + 10, 14, 14, { lit: lit ? ['#ffc880', '#ffe0a0', '#a0e0ff'][Math.floor(hash(x, 2, seed) * 3)] : null, curtain: lit && hash(x, 3, seed) < 0.5 ? ['#8a3a3a', '#3a5a8a', '#6a6a2a'][x % 3] : null, figure: hash(x, 4, seed) < 0.15, cross: false }); }
  for (let x = x0 + 62 * 0.5; x < x1 - 20; x += 62) { kFill(P, x - 6, top + 10, x + 6, G - 8, '#0e1412'); kV(P, x, top + 10, G - 8, '#2a3a36'); }
  for (let x = x0; x < x1; x++) { P.put(x, top + 30, [200, 170, 60]); }
  for (const wx of [x0 + 14, x1 - 14]) for (let a = 0; a < Math.PI * 2; a += 0.15) P.put(Math.round(wx + Math.cos(a) * 5), Math.round(G - 4 + Math.sin(a) * 5), tone(MAT.steelD, 0.4));
}
addDistrict('d_line', 'Old Line Four', 3, -155, 760, 'An abandoned subway line: tiled platforms, old route maps, and a dead train that people live in.', 'Dead subway line', () => district({
  id: 'd_line', name: 'Old Line Four', tier: 3, W: 2800, sky: false, transit: 'subway', floor: MAT.concrete, amb: [0.15, 0.16, 0.16], crowd: 3,
  local: { name: 'Platform squatter', lines: ['Last train ran in sixty-four. People still wait for it.', 'Watch the third rail. It remembers.', 'Car six is mine. Knock. Don\'t just come in.'], look: { hair: 'hood', top: '#3a4a3a', coat: 'long' } },
  build(L, G) {
    const CE = G - 150;
    L.block(0, 0, L.w, CE, OT_CON, { base: 0.24, lip: 0, panels: [120, 30], drips: 0.2, dripLen: 20 });
    L.dry.push([0, 0, L.w, L.h]);
    // station A: tiled walls, a route map, the station's name, benches, a kiosk
    L.paint(0, CE, 960, G, (P) => {
      otTiles(P, 0, CE, 960, G, 61, '#2a6a5a');
      for (let x = 60; x < 960; x += 220) { P.block(x, G - 112, x + 70, G - 62, MAT.steelD, { base: 0.4 }); kFill(P, x + 3, G - 109, x + 67, G - 65, '#d8d0b8'); const c = [[216, 58, 42], [58, 138, 216], [232, 176, 48], [58, 168, 106]]; for (let i = 0; i < 4; i++) { const yy = G - 100 + i * 8; for (let k = 6; k < 64; k++) P.put(x + k, yy + Math.round(Math.sin(k / 9 + i) * 2), c[i]); for (let k = 10; k < 64; k += 12) kFill(P, x + k, yy - 1 + Math.round(Math.sin(k / 9 + i) * 2), x + k + 3, yy + 2 + Math.round(Math.sin(k / 9 + i) * 2), '#ffffff'); } }
      for (let x = 0; x < 960; x++) for (let y = G - 3; y < G; y++) P.put(x, y, ((x >> 2) % 2) ? [200, 170, 50] : [40, 34, 20]);
    });
    for (const x of [180, 400, 620, 840]) L.sign(x, CE + 6, 6, '#ffd040', { r: 50, seed: x });
    for (let x = 30; x < 960; x += 110) L.tube(x, CE + 4, 26, '#e8ffe8', hash(x, 1, 6) < 0.3 ? 0.2 : 0.55);
    for (const x of [260, 500, 740]) L.prop('deco', x, G, { art: () => bench(), id: 'otlb' + x });
    kStallAt(L, 900, G, 'ramen', { npc: { name: 'Kiosk cook', lines: ['The kiosk\'s been here longer than the trains have been gone.', 'Noodles. Hot. That\'s the menu.'] } });
    // the tunnel: a dark mouth, rails, a dead carriage pushed in
    L.paint(960, CE, 1520, G, (P) => {
      P.area(960, CE, 1520, G, R(['#050506', '#0c0c10', '#16161c', '#2e2e36']), (x, y) => 0.2 + (noise(x / 40, y / 20, 8) - 0.5) * 0.2);
      for (let x = 960; x < 1520; x += 60) { for (let y = CE + 10; y < G; y++) for (let i = -2; i <= 2; i++) { const a = Math.abs(x + 30 - 1240) < 300 ? 1 : 0; if (a) P.put(x + i, y, tone(OT_CON, 0.35 + i * 0.05)); } }
      pipe(P, 960, CE + 10, 1520, CE + 16, MAT.rust, { joints: 40 }); for (let k = 0; k < 3; k++) cable(P, 960, CE + 22 + k * 5, 1520, CE + 24 + k * 5, 10, '#0a0a0c');
      otCarriage(P, 1040, 1440, G, 63);
    });
    L.walk(1044, 1436, G - 58, 4, MAT.steelD, { rail: false }); L.ladder(1050, G - 58, G); L.spots.push([1300, G - 58]);
    for (const x of [1000, 1240, 1480]) L.lamp(x, G, 54, '#ffd8a8', 0.7);
    // station B: the train people live in, washing on its roof, a roof walk
    L.paint(1520, CE, 2600, G, (P) => {
      otTiles(P, 1520, CE, 2600, G, 67, '#6a2a3a');
      for (let x = 1520; x < 2600; x++) for (let y = G - 3; y < G; y++) P.put(x, y, ((x >> 2) % 2) ? [200, 170, 50] : [40, 34, 20]);
      for (const [a, b] of [[1560, 1910], [1916, 2266], [2272, 2580]]) otCarriage(P, a, b, G, a);
      laundry(P, 1580, G - 74, 1890, G - 78, 3); laundry(P, 2290, G - 74, 2560, G - 76, 7);
      for (let x = 1600; x < 2560; x += 130) { P.block(x, G - 66, x + 8, G - 58, KMAT.terracotta, { base: 0.5 }); for (let q = 0; q < 10; q++) P.put(x + hash(q, 1, x) * 10 - 1, G - 67 - hash(q, 2, x) * 8, tone(KMAT.leaf, 0.3 + hash(q, 3, x) * 0.6)); }
    });
    L.walk(1562, 2578, G - 58, 4, MAT.steelD, { rail: false }); L.ladder(1600, G - 58, G); L.ladder(2540, G - 58, G); L.dry.push([1520, G - 58, 2600, G]);
    for (let x = 1540; x < 2600; x += 130) L.tube(x, CE + 4, 24, '#ffe8d0', 0.5);
    for (const x of [1700, 2100, 2450]) L.sign(x, CE + 8, 6, '#ff6a8a', { r: 40, dead: 0.4, seed: x });
    L.prop('deco', 2000, G - 58, { art: DECO.door({ col: '#2a3a36', light: '#ffd8a0' }), id: 'otcar1' }); L.prop('locker', 2200, G - 58, { tier: 3, label: 'locker' });
    // the far tunnel mouth
    L.paint(2600, CE, 2800, G, (P) => { P.area(2600, CE, 2800, G, R(['#030304', '#08080a', '#101014']), (x, y) => 0.3 - (x - 2600) / 400); for (let y = CE + 30; y < G; y += 4) for (const x of [2620, 2700]) P.put(x, y, [255, 40, 40], y % 40 === 0 ? 1 : 0); });
    kFoes(L, G, [['gunner', 700, 500, 900], ['spider', 1200, 1000, 1500], ['gang', 1850, 1650, 2050], ['turret', 2620, 2560, 2700], ['gunner', 2350, 2200, 2550, G - 58]]);
    L.prop('locker', 420, G, { tier: 3, label: 'locker' }); L.prop('vending', 330, G, { look: { col: '#ffd040', body: '#3a4a2a' }, label: 'vending machine' }); L.prop('junk', 1150, G, { label: 'junk pile' }); L.prop('wreck', 2650, G, { label: 'track drone' });
    L.spots.push([300, G], [600, G], [800, G], [1100, G], [1650, G], [1900, G], [2150, G], [2400, G], [1800, G - 58]);
    L.critter('rat', 200, 2700, G, 4);
  },
}));

// ---- Cistern Market: a market in the old city's vaulted cistern. Columns
// stand in black water, rafts and boats are stalls, a boardwalk runs through
addDistrict('d_cistern', 'Cistern Market', 3, -175, 420, 'A floating market in the old city\'s vaulted cistern: columns in black water, boats for stalls.', 'Floating market', () => district({
  id: 'd_cistern', name: 'Cistern Market', tier: 3, W: 2600, sky: false, transit: 'subway', floor: MAT.wood, amb: [0.16, 0.14, 0.15], crowd: 6,
  local: { name: 'Boatwoman', lines: ['Everything floats down here eventually. I sell it.', 'Mind the boards. The water\'s deeper than the columns are tall.', 'Lanterns are free. Light costs.'], look: { hair: 'bun', top: '#3a5a5a', coat: 'jacket' } },
  build(L, G) {
    const CE = G - 170, VB = R(['#140c0a', '#2a1810', '#442818', '#8a5a38']);
    L.dry.push([0, 0, L.w, L.h]);
    // the vault: brick arches springing from column to column
    L.paint(0, 0, L.w, G, (P) => {
      P.area(0, 0, L.w, G, R(['#06060a', '#0c0c10', '#16141a', '#2e2a30']), (x, y) => 0.24 + (noise(x / 60, y / 40, 71) - 0.5) * 0.12);
      for (let x = 0; x < L.w; x++) { const u = ((((x % 160) + 160) % 160) - 80) / 80, archY = CE + 40 - 40 * Math.sqrt(Math.max(0, 1 - u * u)); for (let y = 0; y < archY; y++) { const v = 0.32 + (((x + ((y >> 2) % 2) * 4) % 8 === 0 || y % 4 === 0) ? -0.12 : 0) - (archY - y < 3 ? 0.12 : 0); P.put(x, y, tone(VB, v + (noise(x / 20, y / 12, 3) - 0.5) * 0.2)); } }
      // a strip of far water behind, the far columns standing in it
      P.area(0, G - 26, L.w, G, KMAT.water, (x, y) => 0.25 + (noise(x / 25, y / 3, 5) - 0.5) * 0.2 + (y === G - 26 ? 0.2 : 0));
      for (let x = 50; x < L.w; x += 80) P.block(x, CE + 40, x + 14, G - 26, R(['#0e0c10', '#1a1820', '#2a2830', '#4a4650']), { base: 0.3, lip: 0, bands: 10 });
    });
    // the near columns: carved capitals, standing on the boardwalk's piles
    for (let x = 0; x < L.w; x += 160) L.paint(x - 16, CE, x + 16, G, (P) => {
      P.block(x - 10, CE + 34, x + 10, G, KMAT.stone, { base: 0.45, lip: 0, bands: 8, seed: x });
      P.block(x - 15, CE + 26, x + 15, CE + 36, KMAT.stone, { base: 0.62 }); for (let i = -12; i <= 12; i += 4) P.put(x + i, CE + 31, tone(KMAT.stone, 0.3));
      if ((x / 160) % 3 === 1) for (let a = 0; a < Math.PI * 2; a += 0.08) P.put(Math.round(x + Math.cos(a) * 7), Math.round(G - 40 + Math.sin(a) * 9), tone(KMAT.stone, 0.75));
    });
    // the boardwalk over the water: planks, gaps, ropes and posts
    L.paint(0, G - 12, L.w, G + 10, (P) => { for (let x = 0; x < L.w; x++) for (let y = G; y < G + 4; y++) P.put(x, y, tone(MAT.wood, (x % 12 === 0 ? 0.2 : 0.55) - (y - G) * 0.08)); for (let x = 20; x < L.w; x += 60) { P.block(x, G - 10, x + 3, G, MAT.wood, { base: 0.5 }); cable(P, x + 1, G - 9, x + 61, G - 9, 3, '#4a3a24'); } });
    L.wet.push({ y: G - 26, x0: 0, x1: L.w, depth: 20, k: 0.5 });
    // boats moored behind, lanterns on poles
    for (const [x, c] of [[300, true], [700, false], [1150, true], [1600, false], [2050, true], [2400, false]]) otBoat(L, x, G - 22, { cabin: c, col: c ? '#3a2a1e' : '#2a3a3a' });
    // the market itself: stalls of every kind along the boardwalk
    const stalls = [[380, 'fish'], [500, 'fruit'], [620, 'herbs'], [860, 'tea'], [980, 'dumpling'], [1240, 'books'], [1360, 'flowers'], [1480, 'masks'], [1760, 'yakitori'], [1880, 'parts'], [2160, 'skewers'], [2280, 'fish']];
    for (const [x, k] of stalls) kStallAt(L, x, G, k, { col: ['#c83a2a', '#2a6a8a', '#8a5a1a', '#3a8a5a'][x % 4] });
    kStallAt(L, 1100, G, 'parts', { col: '#3a5a6a', npc: { name: 'Raft trader', role: 'vendor', rate: 1.25, lines: ['I buy what floats in. Salvage? Bring it here.', 'Mayor takes a cut of everything. Even this sentence.'] } });
    bLanterns(L, 0, L.w, CE + 60, ['#ff3a2a', '#ffb040', '#ffd890'], { step: 18, sag: 10 });
    bLanterns(L, 300, 2400, CE + 90, ['#ff6a3a', '#ffe0a0'], { step: 24, sag: 6 });
    // a gallery round the vault, up by ladders
    L.walk(200, 1050, G - 110, 5, KMAT.stone); L.ladder(210, G - 110, G); L.walk(1300, 2350, G - 110, 5, KMAT.stone); L.ladder(2340, G - 110, G); L.ladder(1310, G - 110, G);
    L.prop('locker', 600, G - 110, { tier: 3, label: 'locker' }); L.prop('locker', 1900, G - 110, { tier: 3, label: 'locker' }); L.prop('junk', 2000, G - 110, { label: 'junk pile' });
    L.spots.push([700, G - 110], [1700, G - 110]);
    kFoes(L, G, [['gang', 1650, 1550, 1750], ['feral', 2480, 2380, 2560], ['spider', 800, 650, 1000, G - 110]]);
    L.prop('junk', 2460, G, { label: 'flotsam' }); L.prop('vending', 1620, G, { look: { col: '#3af0e0', body: '#2a4a4a' }, label: 'vending machine' });
    L.spots.push([300, G], [450, G], [740, G], [1050, G], [1300, G], [1620, G], [2000, G], [2400, G]);
    L.critter('cat', 400, 2400, G, 1); L.critter('rat', 300, 2500, G, 2);
  },
}));

// ---- Lantern Quarter: the festival quarter. A sky of paper lanterns, a row
// of shrine gates up to a pagoda, food stalls of every kind, a teahouse, a
// bathhouse, mask stalls, a stage for the drums
addDistrict('d_lantern', 'Lantern Quarter', 3, -145, 660, 'The festival quarter: a sky of paper lanterns, shrine gates, a pagoda, food stalls, a bathhouse.', 'Festival quarter', () => district({
  id: 'd_lantern', name: 'Lantern Quarter', tier: 3, W: 2800, sky: false, transit: 'subway', floor: KMAT.stone, amb: [0.2, 0.15, 0.14], crowd: 9,
  local: { name: 'Festival-goer', lines: ['The festival\'s every night. Nobody remembers what for.', 'Try the skewers. Don\'t ask about the meat.', 'The lanterns are the only sky we\'ve got.'], look: { hair: 'bob', hairCol: '#1a1414', top: '#8a2a3a', coat: 'jacket' } },
  build(L, G) {
    otBack(L, G, { seed: 81, col0: 560, cols: 700, back: R(['#0a0606', '#140c0c', '#201414', '#402828']) });
    // the sky of lanterns, three deep
    for (const [y, step, sag] of [[G - 170, 12, 8], [G - 150, 14, 12], [G - 128, 16, 6]]) bLanterns(L, 0, L.w, y, ['#ff3a2a', '#ffb040', '#ff6a3a', '#ffd890', '#e83a5a'], { step, sag });
    // the teahouse and a stall street
    bMachiya(L, 200, 300, G, { seed: 11, noren: '#2a5a2a' });
    bShophouse(L, 300, 420, G, { floors: 2, wall: KMAT.plaster, shops: [['tea', '#ffb040']], roof: 'tile', ac: false, balcony: 'all', seed: 501, blade: '#ff6a3a' });
    const row = [[460, 'yakitori'], [530, 'masks'], [600, 'dumpling'], [670, 'skewers'], [740, 'masks'], [810, 'ramen'], [880, 'fruit'], [950, 'tea']];
    for (const [x, k] of row) kStallAt(L, x, G, k, { col: ['#c83a2a', '#8a2a5a', '#2a5a8a', '#c87a1a'][x % 4] });
    // the gates in a row up to the shrine, the pagoda behind
    for (let x = 1020; x < 1360; x += 58) bTorii(L, x, x + 46, G, 66 - (x - 1020) / 40);
    bPagoda(L, 1450, G, { tiers: 4, w: 64, th: 30 });
    bToro(L, 1380, G); bToro(L, 1520, G);
    bTemple(L, 1560, 1760, G, { h: 46, roofH: 28, base: 10 });
    // the drum stage: a raised platform, lanterns round it
    L.paint(1790, G - 60, 2010, G, (P) => { P.block(1800, G - 34, 2000, G, MAT.wood, { base: 0.45, panels: [20, 34] }); for (const px of [1800, 1996]) P.block(px, G - 60, px + 4, G - 34, KMAT.lacquer, { base: 0.5, lip: 0 }); kH(P, 1800, 2000, G - 60, tone(KMAT.lacquer, 0.7)); for (const dx of [1850, 1950]) { P.area(dx - 10, G - 54, dx + 10, G - 36, KMAT.lacquer, (x, y) => 0.6 - Math.hypot(x - dx, y - G + 45) / 20, { inside: (x, y) => Math.abs(x - dx) < 10 && Math.abs(y - G + 45) < 9 }); P.area(dx - 8, G - 54, dx + 8, G - 52, KMAT.plaster, () => 0.7); } });
    L.stairs(1780, G, 1810, G - 34); L.walk(1800, 2000, G - 34, 4, MAT.wood, { rail: false }); L.spots.push([1900, G - 34]);
    L.light(1900, G - 50, 100, [1, 0.6, 0.3], 0.8);
    // the bathhouse, more townhouses, a gallery over them
    bBath(L, 2040, 2180, G, {});
    bMachiya(L, 2200, 2290, G, { seed: 12, noren: '#4a1a1a' }); bMachiya(L, 2290, 2380, G, { seed: 13, noren: '#1a2a4a', doorLeft: true });
    bShophouse(L, 2380, 2520, G, { floors: 2, wall: KMAT.ochre, shops: [['izakaya', '#ff6a3a']], roof: 'tile', ac: false, seed: 502 });
    L.walk(2384, 2516, G - 84, 5); L.ladder(2390, G - 84, G); L.spots.push([2460, G - 84]); L.prop('locker', 2500, G - 84, { tier: 3, label: 'locker' });
    kStallAt(L, 2580, G, 'flowers'); kStallAt(L, 2660, G, 'books');
    bTree(L, 2740, G, 'sakura', { h: 76 });
    kFoes(L, G, [['gang', 1150, 1020, 1350], ['gunner', 2300, 2200, 2500], ['feral', 2650, 2560, 2760]]);
    L.prop('locker', 1000, G, { tier: 3, label: 'locker' }); L.prop('junk', 1780, G, { label: 'junk pile' }); L.prop('vending', 2030, G, { look: { col: '#ff6a3a', body: '#5a2a1a' }, label: 'vending machine' });
    // spots: 3 is a case's, out in the stall street
    L.spots.push([260, G], [480, G], [700, G], [900, G], [1200, G], [1400, G], [1650, G], [2100, G], [2300, G], [2600, G]);
    L.critter('cat', 400, 1000, G, 1); L.critter('rat', 2000, 2700, G, 2);
  },
}));
