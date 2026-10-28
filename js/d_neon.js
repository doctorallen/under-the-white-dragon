'use strict';
// ---------------------------------------------------------------------------
// Neon Row's insides: the places on the Row you can walk into, each its own
// hidden level entered by a door on the street (nrDoors, called from the
// Row's build in d_high.js), with its way out on the back wall:
//   d_izakaya: the Red Lantern, an izakaya: a counter, sake, karaoke.
//   d_menagerie: Lio's pet shop: cages, tanks, an owl.
//   d_pachinko: Lucky Seven, a pachinko hall: rows of machines and smoke.
//   d_cinema: the Orpheum: a lobby, arcade cabinets, and the screen.
//   d_coil: the Coil, the club at the end of the Row (open 21:00 to 05:00).
//   d_shrine: a fox shrine squeezed between the bars.
// The businesses' machines in them (tills, dryers, the jukebox...) can be
// stripped, and that's theft: heat (OWNED in things.js). Helpers carry `nr`.
// ---------------------------------------------------------------------------
const NR_DOORS = [
  ['d_izakaya', 355, 'The Red Lantern: izakaya', 'noren'], ['d_menagerie', 652, 'The Menagerie: pets', 'glass'], ['d_pachinko', 1050, 'Lucky Seven Pachinko', 'glass'],
  ['d_cinema', 1365, 'The Orpheum: pictures', 'glass'], ['d_coil', 2065, 'The Coil', 'steel', [21, 5]], ['d_shrine', 2600, 'The fox shrine', 'noren'],
];
// the Row's doors into them (and the pachinko hall's glass doors, painted on)
function nrDoors(L, G) {
  L.paint(1036, G - 44, 1064, G, (P) => { kFill(P, 1036, G - 44, 1064, G, '#2a2a34'); for (const x0 of [1038, 1051]) { kFill(P, x0, G - 42, x0 + 11, G, '#ffd8f0', 0.35); kV(P, x0 + 9, G - 26, G - 20, '#c8c8d0'); } });
  for (const [id, x, label, , hours] of NR_DOORS) { L.prop('door', x, G, { label, to: [id, 'door'], hours }); L.spawns[id] = [x, G]; }
}
// an interior: a room with its door out on the back wall where you come in
function nrRoom(id, name, W, door, look, amb, build) {
  bkRoom(id, name, W, (L, G) => { build(L, G, G - 118); L.prop('door', door, G, { label: 'Out to Neon Row', out: true, look, to: ['d_neonrow', id] }); L.spawns = { door: [door, G] }; }, amb);
}
// someone who's only there while the place is open (o.hours [open, close]); the
// staff are residents (town.js), coming and going by their own plans
const nrPerson = (L, name, x, G, act, look, lines, o = {}) => { const [a, b] = o.hours || [0, 24], sched = a < b ? [[0, a, x, 'away'], [a, b, x, act], [b, 24, x, 'away']] : [[0, b, x, act], [b, a, x, 'away'], [a, 24, x, act]]; return L.npc(Object.assign({ name, look, x, y: act === 'sit' ? G - 2 : G, face: o.face || 1, sched: sched.filter(([h0, h1]) => h1 > h0), lines }, o)); };

// ---- the Red Lantern: an izakaya. Dark wood, red paper lanterns, a wall of
// sake bottles behind the counter, menu strips hung over it, a karaoke corner
nrRoom('d_izakaya', 'The Red Lantern', 560, 140, 'noren', [0.44, 0.32, 0.28], (L, G, C) => {
  L.paint(0, 0, 560, G, (P) => {
    P.block(0, 0, 560, C, MAT.concreteD, { base: 0.14, lip: 0 });
    P.block(24, C, 536, G, KMAT.darkwood, { base: 0.3, lip: 0, panels: [20, 60] });
    kFill(P, 24, C, 536, C + 6, '#1a0e0a'); kFill(P, 24, G - 30, 536, G - 26, '#2a160c');
    // the menu strips over the counter: white wood, black brush marks
    for (let x = 250; x < 500; x += 10) { kFill(P, x, C + 14, x + 7, C + 36, '#e8e0cc'); for (let y = C + 17; y < C + 34; y += 3) kH(P, x + 2, x + 5, y, '#1a1410'); }
    // sake: a wall of bottles behind the counter, shelf on shelf
    for (let k = 0; k < 3; k++) { const y = C + 52 + k * 14; kFill(P, 250, y, 500, y + 2, '#5a3a20'); bkShelf(P, 252, 498, y, 1, 600 + k); }
    // the low tables by the door (the counter and its stools are props: bCounter)
    for (const x of [44, 190]) { P.block(x, G - 10, x + 34, G - 7, KMAT.darkwood, { base: 0.6 }); kFill(P, x + 4, G - 7, x + 7, G, '#1a0e0a'); kFill(P, x + 27, G - 7, x + 30, G, '#1a0e0a'); kFill(P, x + 12, G - 13, x + 20, G - 10, '#e8e0d0'); }
    // a paper window by the door, lit from the street
    kLattice(P, 70, C + 30, 120, G - 40, KMAT.darkwood, { lit: '#ffb070' });
  });
  bLanterns(L, 40, 520, C + 10, ['#ff3a2a', '#ff6a3a'], { step: 30 });
  // the counter: the master behind it, the regulars on stools in front
  bCounter(L, 240, 510, G, { top: KMAT.darkwood, body: KMAT.lacquer, panel: 36, stools: [274, 334, 394, 454] });
  L.light(370, G - 50, 140, [1, 0.5, 0.3], 0.9); L.light(110, G - 40, 90, [1, 0.6, 0.35], 0.6);
  L.prop('register', 488, G, { label: 'the till', lift: 22, front: true }); L.prop('karaoke', 520, G, { label: 'the karaoke machine' }); L.prop('dryer', 36, G, { label: 'the hand dryer by the restroom' });
  nrPerson(L, 'Salaryman', 274, G, 'sit', { skin: SKINS[1], hair: 'short', top: '#2a2a3a', coat: 'jacket', legs: '#1a1a24' }, ['One more. Then home. Then one more.', 'My boss is a chip in a tower. I report to a chip.'], { hours: [18, 2] });
  nrPerson(L, 'Office girl', 334, G, 'sit', { skin: SKINS[0], hair: 'bob', hairCol: '#1a1414', top: '#c8c0b0', legs: '#2a2a34' }, ['Don\'t make me sing. Last time I sang, the machine died.', 'He\'s been saying one more for an hour.'], { face: -1 }, { hours: [18, 2] });
  nrPerson(L, 'Old drunk', 61, G, 'sit', { skin: SKINS[4], hair: 'bald', top: '#5a4a3a', legs: '#2a2420' }, ['The Row was all paper lanterns when I was young. Now it\'s plastic lanterns.', 'I sang here in \'61. They still talk about it. Badly.'], { hours: [18, 2] });
});

// ---- the Menagerie: Lio's pet shop. Teal tile, stacked cages with eyes in
// them, tanks of fish lit blue, a perch for the owl, the till on the counter
nrRoom('d_menagerie', 'The Menagerie', 520, 290, 'glass', [0.4, 0.5, 0.5], (L, G, C) => {
  L.paint(0, 0, 520, G, (P) => {
    P.block(0, 0, 520, C, MAT.concreteD, { base: 0.14, lip: 0 });
    for (let y = C; y < G; y++) for (let x = 24; x < 496; x++) { const grout = (x - 24) % 10 === 0 || (y - C) % 10 === 0; P.put(x, y, grout ? [40, 90, 88] : y > G - 20 ? [50, 110, 104] : [90, 160, 150]); }
    // cages, three high, some with eyes shining
    for (let k = 0; k < 12; k++) {
      const cx = 36 + (k % 4) * 46, cy = C + 20 + Math.floor(k / 4) * 30;
      if (cx > 200 && cx < 290) continue;
      kFill(P, cx, cy, cx + 40, cy + 26, '#1a2a2a'); for (let x = cx; x <= cx + 40; x += 4) kV(P, x, cy, cy + 26, '#8a9a9a'); kH(P, cx, cx + 41, cy, '#c8d0d0'); kH(P, cx, cx + 41, cy + 26, '#5a6a6a');
      if (hash(k, 1, 77) < 0.7) { const ex = cx + 10 + Math.floor(hash(k, 2, 77) * 18), ey = cy + 10 + Math.floor(hash(k, 3, 77) * 8), c = [[255, 220, 80], [120, 255, 160], [255, 120, 80]][k % 3]; P.put(ex, ey, c, 1); P.put(ex + 3, ey, c, 1); }
    }
    // the fish tanks along the right wall, lit from inside
    for (const x0 of [310, 370, 430]) { kFill(P, x0, C + 30, x0 + 52, G - 32, '#0a1420'); for (let y = C + 32; y < G - 34; y++) for (let x = x0 + 2; x < x0 + 50; x++) P.put(x, y, mixRgb([60, 160, 220], [20, 60, 120], (y - C - 30) / 56), 0.35); for (let k = 0; k < 6; k++) { const fx = x0 + 6 + Math.floor(hash(k, x0, 78) * 38), fy = C + 40 + Math.floor(hash(k, x0, 79) * 36), c = [[255, 140, 40], [255, 220, 60], [255, 90, 160]][k % 3]; for (let i = 0; i < 4; i++) P.put(fx + i, fy, c, 0.5); P.put(fx + 4, fy - 1, c, 0.5); P.put(fx + 4, fy + 1, c, 0.5); } kFill(P, x0 - 2, G - 32, x0 + 54, G, '#2a3a3a'); }
  });
  bCounter(L, 192, 252, G, { top: KMAT.darkwood, body: MAT.steelD, panel: 30 });
  L.critter('owl', 230, 230, C + 40, 1); L.critter('cat', 40, 300, G, 2); L.critter('dog', 60, 290, G, 1);
  L.light(380, G - 60, 120, [0.4, 0.8, 1], 0.7); L.light(120, C + 30, 140, [0.8, 1, 0.95], 0.5);
  L.prop('register', 236, G, { label: 'the till', lift: 22, front: true });
});

// ---- Lucky Seven: a pachinko hall. Rows of machines down both sides of the
// aisle, players on stools in the smoke, a cash machine by the door
nrRoom('d_pachinko', 'Lucky Seven Pachinko', 640, 320, 'glass', [0.5, 0.42, 0.5], (L, G, C) => {
  L.paint(0, 0, 640, G, (P) => {
    P.block(0, 0, 640, C, MAT.concreteD, { base: 0.14, lip: 0 });
    for (let y = C; y < G; y++) for (let x = 24; x < 616; x++) P.put(x, y, (y - C) % 24 < 2 ? [70, 30, 70] : [40, 16, 44]);
    // the back row of machines, painted: a wall of lit playfields
    for (let x = 30; x < 610; x += 24) { if (Math.abs(x - 320) < 30) continue; kFill(P, x, C + 20, x + 22, G - 34, '#c8b060'); kFill(P, x + 2, C + 23, x + 20, C + 46, '#1a2a4a'); for (let y = C + 25; y < C + 45; y += 3) for (let xx = x + 4 + (y % 2); xx < x + 19; xx += 3) P.put(xx, y, [220, 220, 235]); P.put(x + 11, C + 34, [255, 74, 176], 1); kFill(P, x + 2, C + 50, x + 20, C + 54, '#e8e0d0'); }
    // bulbs round the ceiling
    for (let x = 26; x < 614; x += 3) P.put(x, C + 8, ((x / 3) | 0) % 2 ? [255, 220, 120] : [255, 90, 190], 1);
    // a carpet that hides everything
    for (let x = 24; x < 616; x++) for (let y = G - 4; y < G; y++) P.put(x, y, (x + y) % 6 < 3 ? [120, 30, 60] : [80, 20, 40]);
  });
  for (const x of [80, 104, 200, 448, 520]) L.prop('pachinko', x, G, { label: 'a pachinko machine' });
  for (const x of [128, 152, 176, 224, 472, 496, 544]) L.prop('deco', x, G, { art: () => pachinko(), id: 'nrpk' + x });
  L.prop('atm', 380, G, { label: 'the cash machine' }); L.prop('dryer', 600, G, { label: 'the hand dryer' });
  L.light(320, C + 30, 200, [1, 0.6, 0.9], 0.8); L.light(120, G - 40, 120, [1, 0.8, 0.5], 0.6); L.light(500, G - 40, 120, [1, 0.8, 0.5], 0.6);
  for (const x of [128, 176, 472, 544]) L.vents.push({ x, y: G - 30, kind: 'steam' });
  const players = [['Player', 128, SKINS[1], '#3a4a5a'], ['Regular', 176, SKINS[4], '#5a3a3a'], ['Housewife', 472, SKINS[0], '#6a5a7a'], ['Night shift', 544, SKINS[2], '#2a3a2a']];
  for (const [name, x, skin, top] of players) nrPerson(L, name, x, G, 'sit', { skin, hair: hash(x, 1, 3) < 0.5 ? 'short' : 'bob', top, legs: '#2a2a2a' }, ['Shh. It\'s about to hit.', 'Eleven hours. It owes me.', 'The balls don\'t lie. The machine does.'], { face: -1, hours: [10, 1] });
});

// ---- the Orpheum: a lobby (tickets, popcorn, two arcade cabinets, posters),
// then through the curtain the screen, cut away, a film flickering on it
nrRoom('d_cinema', 'The Orpheum', 680, 110, 'glass', [0.42, 0.34, 0.36], (L, G, C) => {
  L.paint(0, 0, 680, G, (P) => {
    P.block(0, 0, 680, C, MAT.concreteD, { base: 0.14, lip: 0 });
    // the lobby: red flock wallpaper, gold trim, posters
    for (let y = C; y < G; y++) for (let x = 24; x < 330; x++) P.put(x, y, ((x >> 2) + (y >> 2)) % 5 === 0 ? [120, 30, 40] : [90, 20, 30]);
    kFill(P, 24, G - 26, 330, G - 24, '#c8a040');
    for (const [x, c] of [[150, '#3a5ac8'], [200, '#c83a5a'], [250, '#e8a030']]) { P.block(x - 2, C + 18, x + 30, C + 64, KMAT.gold, { base: 0.5 }); P.area(x, C + 20, x + 28, C + 62, rp(c, 6), (xx, yy) => 0.4 + ((xx + yy) % 11 < 2 ? 0.2 : 0)); for (const [a, b] of GLYPHS[x % GLYPHS.length]) P.put(x + 12 + a, C + 26 + b, [255, 255, 255], 0.5); }
    // the popcorn machine on the counter (the counter's a prop: bCounter)
    kFill(P, 240, G - 40, 262, G - 22, '#c8c0a0'); kFill(P, 241, G - 39, 261, G - 26, '#e8e0c0'); for (let k = 0; k < 18; k++) P.put(242 + Math.floor(hash(k, 1, 81) * 18), G - 37 + Math.floor(hash(k, 2, 81) * 10), [255, 240, 200]); kFill(P, 238, G - 42, 264, G - 40, '#c83a2a');
    // the partition and its curtain, then the screen room, dark, seats in rows
    P.block(330, C, 342, G - 44, KMAT.darkwood, { base: 0.4 }); kFill(P, 330, G - 44, 342, G, '#6a1a24');
    kFill(P, 342, C, 656, G, '#0a0608');
    kFill(P, 380, C + 12, 640, C + 70, '#e8ecf0');
    // the rows behind the front one (a prop: seatRow), stepping down toward
    // the screen, the same size, each a little darker
    for (let r = 2; r >= 1; r--) { const top = G - 16 - r * 8, dk = 1 - r * 0.22; for (let x = 362 + r * 10; x + 16 < 650; x += 20) { kFill(P, x + 2, top, x + 14, top + 2, [150 * dk, 36 * dk, 50 * dk]); kFill(P, x, top + 2, x + 16, top + 14, [120 * dk, 26 * dk, 40 * dk]); kFill(P, x + 3, top + 5, x + 13, top + 12, [90 * dk, 18 * dk, 30 * dk]); } }
  });
  L.ad(382, C + 14, 256, 54, 'cycle', ['#c8d8ff', '#ffd8a0']);
  L.light(510, C + 50, 200, [0.75, 0.82, 1], 0.7); L.light(200, G - 50, 140, [1, 0.7, 0.45], 0.8);
  L.prop('ticket', 60, G, { label: 'the ticket machine' }); L.prop('arcadecab', 300, G, { label: 'an arcade cabinet', col: '#ff4ab0', body: '#3a1a3a' }); L.prop('arcadecab', 140, G, { label: 'an arcade cabinet', col: '#3af0e0', body: '#1a2a4a' });
  bCounter(L, 168, 282, G, { top: KMAT.gold, body: KMAT.lacquer, panel: 38, trim: '#ffd060' });
  L.prop('register', 196, G, { label: 'the popcorn till', lift: 22, front: true }); L.prop('coffee', 228, G, { label: 'the coffee machine', lift: 22, front: true });
  // the front row of seats, the audience in it seen from behind (seat k's middle is 370 + 20k)
  L.prop('deco', 502, G, { art: () => seatRow({ n: 14, lamps: true }), id: 'orpheumseats', front: true });
  for (const [x, skin, hair] of [[430, SKINS[1], 'short'], [470, SKINS[3], 'bob'], [570, SKINS[0], 'bun'], [610, SKINS[4], 'short']]) nrPerson(L, 'Watching', x, G, 'sit', { skin, hair, hairCol: '#1a1414', top: '#1a1a24', legs: '#1a1a1a' }, ['Shh.', 'This is the good bit.'], { hours: [18, 0.5], y: G, view: 'back', behind: true, lift: 2 });
});

// ---- the Coil: black glass, a dance floor lit from under, the DJ on a riser,
// the bar along the back, pink waves on every wall
nrRoom('d_coil', 'The Coil', 720, 120, 'steel', [0.34, 0.2, 0.36], (L, G, C) => {
  L.paint(0, 0, 720, G, (P) => {
    P.block(0, 0, 720, C, MAT.concreteD, { base: 0.1, lip: 0 });
    kFill(P, 24, C, 696, G, '#0e0812');
    for (let k = 0; k < 6; k++) { const cy = C + 14 + k * 14; for (let x = 24; x < 696; x++) P.put(x, Math.round(cy + Math.sin(x / 26 + k) * 4), k % 2 ? [58, 240, 224] : [255, 74, 176], 0.6); }
    // the riser and the DJ's decks
    P.block(300, G - 22, 420, G, KMAT.blackglass, { base: 0.4 }); P.block(330, G - 34, 390, G - 22, MAT.steelD, { base: 0.5 }); for (const x of [340, 370]) for (let a = 0; a < 6.3; a += 0.3) P.put(Math.round(x + 5 + Math.cos(a) * 4), Math.round(G - 30 + Math.sin(a) * 1.5), [200, 200, 220], 0.4);
    // the dance floor: tiles lit from under
    for (let x = 160; x < 300; x++) for (let y = G - 3; y < G; y++) P.put(x, y, [[255, 74, 176], [58, 240, 224], [255, 208, 64]][((x - 160) / 14 | 0) % 3], 0.8);
    // the bar along the back right, bottles lit from below
    for (let k = 0; k < 2; k++) { const y = C + 60 + k * 16; kFill(P, 510, y, 670, y + 2, '#3a3a48'); bkShelf(P, 512, 668, y, 1, 700 + k); }
  });
  bCounter(L, 500, 680, G, { top: MAT.chrome, body: KMAT.blackglass, panel: 45, trim: '#ff4ab0', glow: true });
  L.light(230, G - 20, 120, [1, 0.35, 0.8], 0.9); L.light(360, G - 50, 80, [0.3, 0.9, 1], 0.8); L.light(590, G - 50, 120, [1, 0.6, 0.85], 0.6);
  L.prop('jukebox', 460, G, { label: 'the old jukebox' }); L.prop('register', 650, G, { label: 'the bar\'s till', lift: 22, front: true }); L.prop('dryer', 40, G, { label: 'the hand dryer' });
  nrPerson(L, 'DJ Halcyon', 360, G - 22, 'work', { skin: SKINS[3], hair: 'mohawk', hairCol: '#3af0e0', hairGlow: true, top: '#1a1a1e', legs: '#1a1a24' }, ['This one\'s for the ones still awake.', 'The jukebox? A relic. I keep it for luck.'], { y: G - 22, hours: [22, 4] });
  const dancers = [['Dancer', 180, SKINS[0], '#ff4ab0'], ['Dancer', 220, SKINS[2], '#3af0e0'], ['Dancer', 260, SKINS[4], '#ffd040'], ['Clubber', 290, SKINS[1], '#9a6aff']];
  for (const [name, x, skin, acc] of dancers) L.npc({ name, look: { skin, hair: hash(x, 2, 4) < 0.5 ? 'bob' : 'undercut', hairCol: acc, top: '#1a1a24', legs: '#1a1a1e', acc }, x, y: G, sched: [[0, 4, x, 'wander'], [4, 22, x, 'away'], [22, 24, x, 'wander']], lines: ['Can\'t hear you!', 'This track!'] });
});

// ---- the fox shrine: a small hall, wood and red lacquer, the altar with its
// mirror and two fox guardians, candles, wishes on wooden plaques, an
// offering box (taking from it is theft, and the foxes see)
nrRoom('d_shrine', 'The fox shrine', 440, 370, 'noren', [0.42, 0.3, 0.24], (L, G, C) => {
  L.paint(0, 0, 440, G, (P) => {
    P.block(0, 0, 440, C, MAT.concreteD, { base: 0.14, lip: 0 });
    P.block(24, C, 416, G, KMAT.darkwood, { base: 0.34, lip: 0, panels: [32, 80] });
    for (const x of [24, 120, 300, 404]) P.block(x, C, x + 12, G, KMAT.lacquer, { base: 0.5, lip: 0 });
    // the altar: steps, the round mirror, two foxes
    P.block(170, G - 20, 270, G, KMAT.lacquer, { base: 0.42 }); P.block(180, G - 30, 260, G - 20, KMAT.darkwood, { base: 0.5 });
    for (let a = 0; a < Math.PI * 2; a += 0.02) for (let r = 0; r < 10; r++) P.put(Math.round(220 + Math.cos(a) * r), Math.round(G - 52 + Math.sin(a) * r), r > 8 ? [200, 160, 60] : [220, 230, 240], r > 8 ? 0.3 : 0.15);
    for (const x of [186, 246]) { kFill(P, x, G - 46, x + 10, G - 30, '#e8e0d0'); kFill(P, x + 1, G - 50, x + 4, G - 46, '#e8e0d0'); kFill(P, x + 6, G - 50, x + 9, G - 46, '#e8e0d0'); P.put(x + 3, G - 43, [200, 40, 40]); P.put(x + 7, G - 43, [200, 40, 40]); kFill(P, x + 2, G - 38, x + 8, G - 36, '#c83a2a'); }
    // the wishes: plaques on a rack
    kH(P, 50, 110, C + 60, '#5a3a20'); for (let x = 52; x < 108; x += 8) { kFill(P, x, C + 61, x + 6, C + 70, '#d8b880'); P.put(x + 2, C + 64, [60, 30, 20]); P.put(x + 3, C + 66, [60, 30, 20]); }
    kH(P, 330, 390, C + 60, '#5a3a20'); for (let x = 332; x < 388; x += 8) { kFill(P, x, C + 61, x + 6, C + 70, '#d8b880'); P.put(x + 3, C + 64, [60, 30, 20]); }
  });
  for (const x of [168, 272]) { L.paint(x - 3, G - 30, x + 3, G, (P) => { kFill(P, x - 1, G - 26, x + 1, G, '#c8c0a0'); P.put(x, G - 28, [255, 200, 90], 1); }); L.light(x, G - 28, 40, [1, 0.6, 0.3], 0.7, 1, { mode: 'fire', seed: x }); }
  L.light(220, G - 52, 70, [1, 0.85, 0.6], 0.6);
  L.prop('offering', 220, G, { label: 'the offering box' });
});
