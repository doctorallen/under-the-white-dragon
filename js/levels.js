'use strict';
// ---------------------------------------------------------------------------
// The levels. Each is drawn and shaped here, once, through the builder in
// world.js: what's painted, what's solid, where the walkways and stairs run,
// the props, lights, people and enemies.
// ---------------------------------------------------------------------------

// a few deco sprites a level places by name
const DECO = {
  stall: (look) => () => stall(look), stool: () => () => stool(), crate: (o) => () => crate(o), barrel: () => () => barrelFire(),
  capsule: (o) => () => capsule(o), chair: () => () => docChair(), door: (o) => () => door(o), shutter: (o) => () => shutter(o), terminal: (o) => () => terminal(o),
};

// people passing through: a few made up from a seed, wandering their stretch
// of floor in the day and gone home at night, with something to say
const CROWD_LINES = [
  'Third shift this week. Fourth if you count this one.', 'Rain\'s warm tonight. That\'s the chemicals.', 'Lift\'s out again. Lift\'s always out.',
  'My kid wants a chrome arm for her birthday. She\'s nine.', 'They\'re hiring at the Works. Nobody comes back up to say how it is.', 'You see the fish on the billboard? It follows you if you look at it.',
  'Got any change? No? Me neither.', 'They say synths don\'t sleep. I don\'t sleep either. Doesn\'t make me one.', 'Don\'t eat the street noodles. Eat Mama\'s.',
  'Detective? You don\'t look like a detective. That\'s probably the point.', 'I haven\'t seen the sky in eleven years. I hear it\'s overrated.', 'Somebody stole the copper out of my wall again.',
];
function crowd(L, n, x0, x1, y, seed) {
  const r = new Rng(seed);
  for (let i = 0; i < n; i++) {
    const hairs = ['short', 'bob', 'long', 'cap', 'hood', 'bun', 'bald', 'undercut'], tops = ['#3a4a5a', '#5a3a3a', '#3a5a3a', '#4a4a4a', '#6a5a3a', '#2a2a3a', '#5a3a5a', '#c8c0b0'];
    const look = { skin: r.pick(SKINS), hair: r.pick(hairs), hairCol: r.pick(['#1a1414', '#3a2a20', '#8a6a4a', '#c8c8c8', '#ff4ab0', '#3af0e0']), top: r.pick(tops), coat: r.f() < 0.4 ? 'long' : 'jacket', legs: r.pick(['#2a2a2a', '#1a1a24', '#3a3028']), tall: 0.88 + r.f() * 0.14 };
    if (r.f() < 0.25) { look.umbrella = r.pick(['#2a3a5a', '#5a2a3a', '#2a2a2a']); if (r.f() < 0.5) look.umbrellaGlow = r.pick(['#3af0e0', '#ff4ab0']); }
    if (r.f() < 0.2) { look.cyArm = true; look.acc = r.pick(['#3af0e0', '#ff4ab0', '#ffb040']); }
    // a night city: out most hours, home for a few before dawn
    const home = x0 + r.f() * (x1 - x0), h0 = 2 + r.i(0, 2), h1 = h0 + 3 + r.i(0, 3);
    L.npc({ name: r.pick(['Passer-by', 'Commuter', 'Local', 'Night worker']), look, x: home, y, sched: [[0, h0, home, 'wander'], [h0, h1, home, 'away'], [h1, 24, home, 'wander']], lines: [r.pick(CROWD_LINES), r.pick(CROWD_LINES)], smoke: r.f() < 0.2 && !look.umbrella });
  }
}

// ---- L1: the Stack ------------------------------------------------------------
LEVELS.stack = {
  name: 'The Stack', depth: '0 m',
  make() {
    const L = newLevel('stack', 'The Stack', 2560, 690);
    const G = 640, MID = 500, UP = 360, YARD = 2200;
    // ---- the far side of the canyon: sky, spires, a wall of windows, haze
    L.far = {
      f: 0.5, fy: 0.45, w: 1800, h: 640,
      paint(P) {
        sky(P, 0, 0, 1800, 260, { low: 0.2, span: 0.6 });
        skyline(P, 0, 1800, 200, { seed: 3, hmin: 30, hmax: 110, fog: 0.55, lit: 0.18 });
        P.block(0, 150, 1800, 640, MAT.concreteD, { base: 0.4, fog: 0.42, fogc: [40, 24, 60], lip: 0, grain: 0.08 });
        windows(P, 6, 158, 1800, 640, { w: 4, h: 5, gx: 6, gy: 8, lit: 0.16, seed: 4, glow: 0.2, unlit: false });
        haze(P, 0, 1800, 120, 330, [60, 36, 80], 0.5);
        for (const [x, y, n, c] of [[90, 170, 6, '#ff4ab0'], [520, 160, 5, '#3af0e0'], [900, 190, 4, '#ffd040'], [1300, 168, 6, '#ff4ab0'], [1640, 176, 5, '#3af0e0']]) sign(P, x, y, n, c, { vert: true });
      },
    };
    // ---- the ground: one long slab under everything
    L.floor(0, L.w, G, 50, MAT.concrete, { drips: 0, base: 0.42 });
    // ---- the hotel and the clinic: a block on the left, cut away at the ground floor
    L.block(0, 70, 700, MID, MAT.concrete, { base: 0.42, drips: 0.12, dripLen: 40, panels: [30, 36] });
    L.paint(0, 70, 700, MID, (P) => { for (let fy = 84; fy < MID - 30; fy += 36) for (let fx = 10; fx < 690; fx += 30) { const lit = hash(fx, fy, 2) < 0.45; P.block(fx + 2, fy + 4, fx + 24, fy + 26, MAT.concreteD, { base: 0.25, lip: 0 }); windows(P, fx + 5, fy + 7, fx + 23, fy + 25, { w: 7, h: 9, gx: 2, gy: 9, lit: lit ? 1 : 0, seed: fx + fy, blinds: hash(fx, fy, 3) < 0.5, glow: 0.3 }); } });
    L.sign(318, 100, 7, '#ff4ab0', { vert: true, r: 70 }); L.sign(70, 440, 6, '#ffd040', { r: 50 });
    for (let y = 84; y < MID - 30; y += 72) L.light(300, y + 20, 60, [1, 0.75, 0.5], 0.3);
    // hotel: capsules three high
    L.block(0, MID, 336, G, MAT.concreteD, { base: 0.38, lip: 0, panels: [62, 47] });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const x = 34 + c * 62, y = G - r * 47; if (r === 0 && c === 2) continue;
      const lit = hash(r, c, 4) < 0.45;
      L.prop('deco', x, y, { art: DECO.capsule({ lit, seed: r * 5 + c, shut: ['#8a8a90', '#6a7a8a', '#8a7a6a'][(r + c) % 3] }), id: 'cap' + r + c });
      if (lit) L.light(x, y - 20, 34, [1, 0.75, 0.45], 0.45);
    }
    L.paint(0, MID, 336, G, (P) => { for (let r = 1; r < 3; r++) for (let x = 0; x < 330; x++) P.put(x, G - r * 47 + 1, tone(MAT.steel, 0.55)); });
    L.prop('capsule', 158, G, { label: 'capsule' });
    L.light(158, G - 20, 40, [1, 0.8, 0.5], 0.7);
    L.tube(40, MID + 8, 24, '#ffe0c0', 0.55); L.tube(230, MID + 8, 24, '#ffe0c0', 0.55);
    // clinic: tiled teal, glass partitions, the chair, monitors, shelves of ware
    L.block(336, MID, 700, G, MAT.clinic, { base: 0.42, lip: 0, panels: [14, 14] });
    L.paint(334, MID, 342, G, (P) => { for (let y = MID; y < G; y++) for (let x = 334; x < 340; x++) P.put(x, y, tone(MAT.chrome, x < 336 ? 0.7 : 0.4)); });
    L.paint(690, MID, 700, G, (P) => { for (let y = MID + 6; y < G - 40; y++) for (let x = 692; x < 698; x++) if ((x + y) % 9 === 0) P.put(x, y, [140, 220, 230], 0.3); });
    L.prop('deco', 520, G, { art: DECO.chair(), id: 'docchair' });
    L.paint(360, 530, 470, 590, (P) => { for (const [x, y] of [[370, 540], [396, 540], [370, 566]]) { P.block(x, y, x + 22, y + 18, MAT.steelD, { base: 0.4 }); for (let j = 2; j < 16; j++) for (let i = 2; i < 20; i++) P.put(x + i, y + j, (j % 3 === 0 && hash(i, j, x) > 0.3) ? [90, 255, 200] : [10, 40, 36], 0.7); } });
    L.paint(600, 520, 680, 630, (P) => { for (let sy = 540; sy < 630; sy += 26) { P.block(600, sy, 680, sy + 3, MAT.steel, { base: 0.6 }); for (let k = 0; k < 5; k++) { const x = 606 + k * 15, c = [[60, 240, 230], [255, 80, 180], [255, 180, 60], [140, 255, 120]][(k + sy) % 4]; P.area(x, sy - 7, x + 7, sy - 1, MAT.chrome, (a, b) => 0.7 - (b - sy + 7) / 10); P.put(x + 3, sy - 4, c, 1); P.put(x + 4, sy - 4, c, 1); } } });
    L.light(520, 560, 90, [0.85, 1, 1], 0.9); L.light(400, 560, 50, [0.3, 1, 0.8], 0.5); L.light(640, 580, 60, [0.6, 0.8, 1], 0.5);
    L.tube(420, MID + 8, 30, '#e0fff8', 0.6); L.tube(580, MID + 8, 30, '#e0fff8', 0.6);
    for (let k = -4; k <= 4; k++) for (const w of [-1, 0, 1]) { L.paint(660 + k, 470 + w, 661 + k, 471 + w, (P) => P.put(660 + k, 470 + w, [90, 255, 140], 1)); L.paint(660 + w, 470 + k, 661 + w, 471 + k, (P) => P.put(660 + w, 470 + k, [90, 255, 140], 1)); }
    L.light(660, 470, 60, [0.35, 1, 0.55], 0.8);
    // ---- the market: back wall of shopfronts under the walkway, the canyon above
    L.block(700, MID, YARD, G, MAT.concreteD, { base: 0.36, lip: 0, panels: [40, 30], drips: 0.1, dripLen: 50 });
    L.block(1500, MID, YARD, G, MAT.tile, { base: 0.33, lip: 0, panels: [6, 6] });
    L.paint(740, 560, 840, 620, (P) => windows(P, 740, 566, 840, 620, { w: 30, h: 24, gx: 6, gy: 40, lit: 1, seed: 8, pal: [['#ffe8c0', '#e0a060']], glow: 0.2 }));
    L.light(790, 590, 60, [1, 0.8, 0.55], 0.5);
    for (const x of [720, 820, 960, 1090, 1230, 1560, 1700, 1850, 2000, 2120]) L.tube(x, MID + 8, 22, x > 1500 ? '#ffe8d0' : '#d8f0ff', 0.7);
    L.sign(730, 530, 7, '#3af0e0', { r: 60 }); L.sign(1000, 512, 5, '#ff4ab0', { vert: true, r: 50 }); L.sign(1180, 540, 6, '#ffd040', { r: 50, dead: 0.25 });
    // the noodle stall, the vending machines, Kit's salvage stand
    L.prop('deco', 880, G, { art: DECO.stall({ awning: '#b02a3a' }), id: 'noodles', front: 20 }); L.light(880, 620, 70, [1, 0.6, 0.35], 0.9);
    for (const x of [856, 868, 892, 904]) L.prop('deco', x, G, { art: DECO.stool(), id: 'stool' + x });
    L.prop('vending', 970, G, { look: { col: '#3af0e0', body: '#3a5a8a' }, label: 'vending machine' }); L.light(970, 625, 36, [0.3, 0.9, 1], 0.7);
    L.prop('vending', 988, G, { label: 'vending machine' }); L.light(988, 625, 36, [1, 0.3, 0.7], 0.7);
    L.prop('deco', 1110, G, { art: DECO.stall({ awning: '#2a5a8a' }), id: 'kitstall', front: 20 }); L.light(1110, 620, 60, [0.6, 0.85, 1], 0.7);
    L.prop('deco', 1060, G, { art: DECO.crate({ col: '#3a4a5a', w: 14, h: 11 }), id: 'cr1' }); L.prop('deco', 1074, G, { art: DECO.crate({ col: '#5a4a2a', w: 10, h: 8, label: '#e8b030' }), id: 'cr2' });
    // the bar: Juno's, a warm room under the walkway
    L.block(1300, MID, 1490, G, MAT.wood, { base: 0.36, lip: 0, bands: 5 });
    L.paint(1296, MID, 1300, G, (P) => { for (let y = MID; y < G; y++) for (let x = 1296; x < 1300; x++) P.put(x, y, tone(MAT.wood, 0.7)); });
    L.sign(1340, 512, 3, '#ff6a3a', { r: 60 }); L.light(1400, 580, 90, [1, 0.62, 0.35], 0.85);
    L.paint(1330, 590, 1480, G, (P) => { P.block(1330, 606, 1480, G, MAT.wood, { base: 0.55 }); for (let k = 0; k < 9; k++) { const x = 1340 + k * 15, c = [[255, 160, 60], [90, 255, 200], [255, 80, 160]][k % 3]; P.block(x, 594, x + 3, 605, MAT.glass, { base: 0.5 }); P.put(x + 1, 597, c, 0.8); } });
    for (const x of [1350, 1370, 1440, 1460]) L.prop('deco', x, G, { art: DECO.stool(), id: 'bs' + x });
    // stairs up to the walkway
    L.stairs(1500, G, 1660, MID);
    // under the walkway past the bar: shutters, a junk pile, a car, ac units
    L.prop('deco', 1720, G, { art: DECO.shutter({ tag: '#ff4ab0', w: 36, h: 28 }), id: 'sh1' }); L.prop('deco', 1960, G, { art: DECO.shutter({ tag: '#3af0e0', col: '#4a4a52', w: 40, h: 30 }), id: 'sh2' });
    L.prop('junk', 1800, G, { label: 'junk pile' }); L.prop('car', 2080, G, { look: { col: '#3a2a48', under: '#3af0e0' }, label: 'wrecked car' }); L.light(2080, 642, 40, [0.3, 1, 0.95], 0.5, 2.5);
    L.prop('ac', 1880, G, { label: 'air conditioner' }); L.prop('ac', 2130, G, { label: 'air conditioner' });
    // the walkways
    L.walk(0, YARD - 14, MID, 6);
    L.walk(960, YARD - 14, UP, 6);
    L.stairs(1020, UP, 1160, MID);
    L.ladder(2140, UP, MID);
    // the residential block behind the walkways, east of the canyon
    L.block(1500, 90, YARD - 14, MID, MAT.concrete, { base: 0.4, drips: 0.12, dripLen: 30, panels: [24, 26] });
    L.paint(1500, 90, YARD - 14, MID, (P) => { for (let fy = 96; fy < MID - 20; fy += 26) { if (Math.abs(fy - UP) < 30 || Math.abs(fy - MID) < 30) continue; for (let fx = 1506; fx < YARD - 30; fx += 24) { const lit = hash(fx, fy, 2) < 0.5; P.block(fx + 2, fy + 4, fx + 20, fy + 20, MAT.concreteD, { base: 0.25, lip: 0 }); windows(P, fx + 4, fy + 7, fx + 19, fy + 19, { w: 6, h: 8, gx: 2, gy: 9, lit: lit ? 1 : 0, seed: fx + fy, blinds: hash(fx, fy, 3) < 0.5, glow: 0.3 }); } } });
    for (const x of [1560, 1660, 1780, 1900, 2020]) { L.prop('deco', x, MID, { art: DECO.door({ col: ['#5a3a3a', '#3a4a5a', '#4a4a3a'][x % 3], light: x % 2 ? '#ffd8a0' : '#9af0ff' }), id: 'door' + x }); L.light(x, MID - 34, 30, x % 2 ? [1, 0.85, 0.6] : [0.6, 0.95, 1], 0.5); }
    for (const x of [1600, 1700, 1820, 1940, 2060]) L.prop('deco', x, UP, { art: DECO.door({ col: '#3a3440', light: '#ff9ad8' }), id: 'udoor' + x });
    L.prop('ac', 1620, MID, { label: 'air conditioner' }); L.prop('ac', 1960, MID, { label: 'air conditioner' }); L.prop('vending', 1840, MID, { look: { col: '#ffd040', body: '#5a4a1a' }, label: 'vending machine' }); L.light(1840, 485, 34, [1, 0.85, 0.3], 0.6);
    L.sign(1530, 120, 8, '#3af0e0', { vert: true, r: 60 }); L.sign(2150, 150, 7, '#ff4ab0', { vert: true, r: 60 });
    // upper walkway: a data node, junk, a downed drone, a hidden panel
    L.prop('node', 1070, UP, { gives: { program: 'breach' }, level: 1, col: '#3af0e0' }); L.light(1070, UP - 18, 50, [0.3, 1, 0.95], 0.8);
    L.prop('junk', 1300, UP); L.prop('wreck', 1480, UP, { label: 'downed drone' }); L.prop('junk', 1760, UP); L.prop('cache', 2110, UP, { label: 'hidden panel' });
    for (const x of [1000, 1240, 1600, 1900]) L.tube(x, UP + 8, 20, '#d8f0ff', 0.5);
    // cables and laundry across the canyon; rain
    L.paint(700, 280, 1500, 470, (P) => { for (let k = 0; k < 4; k++) cable(P, 700, 300 + k * 6, 1500, 288 + k * 9, 18 + k * 4, '#08080c'); laundry(P, 760, 420, 1240, 428, 3); laundry(P, 1180, UP - 30, 1490, UP - 26, 5); });
    // ---- the service yard: a wall, a grate, the Warden's ground, the lift, the shaft
    L.wall(YARD - 14, 60, YARD + 4, G - 40, MAT.concrete, { base: 0.5, drips: 0.2, dripLen: 90 });
    L.prop('grate', YARD - 5, G, { w: 18, h: 40, label: 'grate' });
    L.block(YARD + 4, 60, L.w, G, MAT.concreteD, { base: 0.34, lip: 0, panels: [60, 50], drips: 0.15, dripLen: 70 });
    L.paint(YARD + 4, 60, L.w, G, (P) => { pipe(P, YARD + 4, 380, L.w, 392, MAT.rust, { joints: 50 }); pipe(P, YARD + 4, 396, L.w, 402, MAT.steel, { joints: 40 }); for (let x = YARD + 20; x < L.w; x += 60) girder(P, x, 100, x + 60, 112, MAT.steelD, { step: 12 }); for (let x = YARD + 10; x < L.w - 10; x++) for (let y = G - 8; y < G - 3; y++) P.put(x, y, ((x + y) >> 2) % 2 ? [210, 160, 40] : [30, 26, 20]); });
    L.lamp(YARD + 60, G, 80, '#ffe8c0', 1.0); L.lamp(L.w - 70, G, 80, '#ffe8c0', 1.0);
    L.prop('lift', 2380, G, { to: ['street', 'lift'], dir: 'down' });
    L.prop('hatch', 2500, G, { w: 30, h: 38, to: ['street', 'shaft'], goLabel: 'Climb down to street level', needs: 'warden', needsLabel: 'The Warden\'s lock holds it shut' });
    L.sign(2470, 520, 5, '#ffb040', { r: 50 });
    L.enemy('warden', 2420, G, { arena: [YARD + 10, L.w - 10] });
    // ---- the people of the Stack
    const N = (o) => L.npc(o);
    N({ name: 'Mama Ruiz', role: 'noodles', look: { skin: SKINS[4], hair: 'bun', hairCol: '#2a2020', top: '#e8e0d0', apron: '#3a3a3a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 880, y: G, sched: [[0, 24, 880, 'work']], lines: ['Detective. Noodles. Twelve. Sit.', 'You look like you need a bowl and a week of sleep.', 'Rain\'s been going since Tuesday. Year before last.'], behind: true });
    N({ name: 'Kit', role: 'vendor', rate: 1, look: { skin: SKINS[2], hair: 'cap', capCol: '#2a5a8a', top: '#4a5a6a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 1110, y: G, sched: [[0, 24, 1110, 'work']], lines: ['Wire, glass, chips. I buy it all. Don\'t ask where it goes.', 'Strip it, bring it, get paid.'], behind: true });
    N({ name: 'Doc Vasquez', role: 'doc', look: { skin: SKINS[0], hair: 'bald', top: '#e0e8e8', coat: 'long', legs: '#3a4a4a', cyArm: 'both', acc: '#3af0e0', eye: '#3af0e0' }, x: 560, y: G, face: -1, sched: [[0, 24, 560, 'stand']], lines: ['Sit down. Don\'t touch anything that glows.', 'Your nervous system only takes so much. Choose.', 'Synths? On my table I can\'t tell them from you anymore. Only by what they ask for.'] });
    N({ name: 'Juno', role: 'fixer', look: { skin: SKINS[3], hair: 'bob', hairCol: '#ff4ab0', top: '#2a1a2a', coat: 'long', legs: '#1a1a1e', acc: '#ff4ab0', eye: '#ff4ab0' }, x: 1420, y: G, face: -1, sched: [[0, 24, 1420, 'stand']], lines: ['The precinct sent a tracer. Cute. I have leads; they cost.', 'Everything in this city runs downhill. Money, water, synths.'] });
    N({ name: 'Ines', look: { skin: SKINS[1], hair: 'short', top: '#3a5a7a', legs: '#2a2a3a' }, x: 868, y: G, sched: [[19, 23, 868, 'sit'], [23, 24, 1560, 'away'], [0, 7, 1560, 'away'], [7, 19, 760, 'wander']], lines: ['Night shift at the plant. Third this week.', 'Mama\'s broth is the only warm thing on this level.'] });
    N({ name: 'Teo', smoke: true, look: { skin: SKINS[3], hair: 'mohawk', hairCol: '#ff4ab0', hairGlow: true, top: '#1a1a1a', legs: '#2a1a2a', cyArm: true, acc: '#ff4ab0' }, x: 904, y: G, face: -1, sched: [[20, 24, 904, 'sit'], [0, 3, 904, 'sit'], [3, 20, 1320, 'wander']], lines: ['You\'re the tracer? Don\'t look at me, I\'m all meat. Mostly.', 'Chrome arm\'s from Vasquez. Still itches.', 'Don\'t go in the yard. The Warden doesn\'t do warnings.'] });
    N({ name: 'Mr. Hale', look: { skin: SKINS[0], hair: 'short', hairCol: '#3a2a20', top: '#2a2a2a', coat: 'long', shirt: '#d8d8d8', legs: '#1a1a1e', umbrella: '#2a3a5a', umbrellaGlow: '#3af0e0' }, x: 1700, y: MID, sched: [[6, 9, 1180, 'wander'], [9, 18, 2020, 'away'], [18, 22, 1660, 'wander'], [22, 24, 1660, 'away'], [0, 6, 1660, 'away']], lines: ['Twenty-two years in accounts. Never once been below the market.', 'They say the lift in the yard used to go all the way down.'] });
    N({ name: 'Old Pei', look: { skin: SKINS[5], hair: 'long', hairCol: '#c8c8c8', top: '#5a3a5a', coat: 'long', legs: '#2a2030', tall: 0.9 }, x: 1880, y: MID, sched: [[0, 24, 1880, 'wander']], lines: ['Forty years in that capsule. They built three more levels on top of me.', 'My husband went down to the Works in sixty-one. The pay was good.', 'You hear it at night? The hum, from under everything.', 'A girl came through last week asking the way down. Polite. Too polite.'] });
    N({ name: 'Rook', look: { skin: SKINS[2], hair: 'cap', capCol: '#a83a2a', top: '#3a6a3a', legs: '#2a2a2a', phone: '#9af0ff', hands: { fx: 24, fy: 36 } }, x: 1240, y: UP, sched: [[0, 24, 1240, 'stand']], lines: ['Up here\'s the only place the signal\'s clean.', 'That node by the stairs? Corp junk. Locked tight. Unless you can jack in.'] });
    N({ name: 'Mika', look: { skin: SKINS[4], hair: 'bob', hairCol: '#3af0e0', top: '#d8d8e0', legs: '#2a2a3a', tall: 0.95 }, x: 780, y: G, sched: [[8, 23, 760, 'wander'], [23, 24, 158, 'away'], [0, 8, 158, 'away']], lines: ['Capsule next to yours. You snore.', 'I\'m saving for eyes. Real ones. Well, fake ones. You know.'] });
    // ---- the block's drones
    for (const [x, y, a, b] of [[1200, UP - 40, 1080, 1420], [1560, UP - 46, 1440, 1760], [1900, UP - 40, 1780, 2120], [1700, MID - 46, 1560, 1900], [2000, MID - 40, 1880, 2160]]) L.enemy('drone', x, y, { range: [a, b] });
    // spawns, light, weather
    // ---- the city going about its business
    crowd(L, 4, 720, 1290, G, 61); crowd(L, 3, 1560, 2120, MID, 62); crowd(L, 2, 1000, 1480, UP, 63);
    L.traffic = [{ y: 92, scale: 0.12, speed: 26, dir: -1, n: 6, fog: 0.4 }, { y: 128, scale: 0.17, speed: 40, dir: 1, n: 5, fog: 0.55 }, { y: 168, scale: 0.24, speed: 62, dir: -1, n: 3, fog: 0.75 }];
    L.ad(396, 430, 64, 42, 'cycle', ['#ffb040', '#ff4ab0']);
    L.ad(1650, 262, 80, 46, 'koi', ['#3af0e0', '#9af0ff']);
    L.ad(760, 514, 90, 15, 'marquee', ['#ffd040', '#ff4ab0']);
    L.ad(1436, 516, 40, 14, 'bars', ['#ff6a3a', '#ffd040']);
    L.ad(2290, 560, 90, 15, 'marquee', ['#ff3040', '#e8e8f0']);
    L.critter('rat', 720, 2150, G, 3); L.critter('rat', 20, 320, G, 1); L.critter('rat', 2220, 2540, G, 1); L.critter('cat', 1520, 2160, MID, 1);
    L.litter(700, 2180, G, 8); L.litter(1500, 2180, MID, 3); L.litter(2210, 2550, G, 3);
    L.vents.push({ x: 860, y: 618, kind: 'steam' }, { x: 2280, y: 390, kind: 'steam' });
    L.spawns = { capsule: [180, G], shaft: [2470, G], lift: [2380, G] };
    L.ambient = (x, y) => { const t = clamp(1 - y / 520, 0, 1); return [0.16 + t * 0.12, 0.13 + t * 0.07, 0.24 + t * 0.14]; };
    L.wet.push({ y: G + 1, x0: 700, x1: L.w, depth: 22, k: 0.38 });
    L.rain = 1;
    // under the walkways and indoors it doesn't rain
    L.dry = [[0, MID, YARD - 14, L.h], [960, UP, YARD - 14, MID]];
    return L;
  },
};

// ---- L2: street level -----------------------------------------------------------
LEVELS.street = {
  name: 'Street level', depth: '−60 m',
  make() {
    const L = newLevel('street', 'Street level', 2400, 500);
    const G = 452;
    // the underside of the Stack: slab, beams, pipes, drips
    const C = 140;
    L.block(0, 0, L.w, C, MAT.concreteD, { base: 0.28, lip: 0, panels: [54, 40], drips: 0.2, dripLen: 14 });
    L.solid(0, 0, L.w, C);
    L.paint(0, C - 10, L.w, C + 26, (P) => { for (let x = 0; x < L.w; x += 54) girder(P, x, C - 6, x + 54, C + 6, MAT.steelD, { step: 12 }); pipe(P, 0, C + 8, L.w, C + 14, MAT.rust, { joints: 40 }); pipe(P, 0, C + 16, L.w, C + 19, MAT.steelD, { joints: 30 }); });
    // the shopfronts and the old brick behind
    L.block(0, C + 20, L.w, G, MAT.brickD, { base: 0.34, lip: 0, bands: 4, drips: 0.15, dripLen: 60 });
    for (const x of [380, 980, 1580, 2180]) { L.block(x, C, x + 34, G, MAT.concrete, { base: 0.42, drips: 0.2, dripLen: 80, inward: 0.15 }); L.paint(x - 2, C, x + 36, G, (P) => { for (let y = C + 40; y < G; y += 60) P.block(x - 2, y, x + 36, y + 3, MAT.steel, { base: 0.4 }); }); }
    for (const x of [40, 200, 520, 760, 1120, 1300, 1460, 1700, 1940, 2100, 2300]) L.tube(x, C + 22, 18, '#c8e0ff', 0.55);
    for (const x of [240, 660, 1050, 1500, 1990, 2240]) L.lamp(x, G, 64, '#ffd8a8', 0.85);
    L.paint(0, 380, L.w, G, (P) => { for (const x of [190, 440, 610, 1060, 1480, 2020]) windows(P, x, 392, x + 44, G - 4, { w: 18, h: 22, gx: 6, gy: 40, lit: hash(x, 1, 2) < 0.7 ? 1 : 0, seed: x, pal: [['#ffe0a8', '#c07a40'], ['#a8f0ff', '#3a8ab0']], glow: 0.3, blinds: true }); });
    for (const x of [212, 462, 632, 1082, 1502, 2042]) L.light(x, 420, 40, [1, 0.8, 0.55], 0.4);
    // the ground: a kerb, then the road
    L.floor(0, L.w, G, 48, MAT.concrete, { base: 0.5, drips: 0 });
    L.paint(0, G + 8, L.w, L.h, (P) => { P.block(0, G + 8, L.w, L.h, MAT.asphalt, { base: 0.35, lip: 0.4, grain: 0.2 }); for (let x = 20; x < L.w; x += 40) for (let i = 0; i < 16; i++) P.put(x + i, G + 30, [120, 110, 70]); });
    // the shaft down from the Stack, and the lift
    L.paint(100, 0, 140, C, (P) => P.block(104, 60, 136, C, MAT.steelD, { base: 0.12, lip: 0 }));
    L.ladder(120, 172, G);
    L.prop('exit', 120, 186, { to: ['stack', 'shaft'], label: 'Climb up to the Stack' });
    L.prop('lift', 300, G, { to: ['stack', 'lift'], dir: 'up' });
    L.sign(60, 200, 5, '#ff4ab0', { vert: true, r: 55 });
    // Ozu's kiosk
    L.prop('deco', 560, G, { art: DECO.stall({ awning: '#2a7a4a' }), id: 'ozu', front: 20 }); L.light(560, 430, 64, [0.5, 1, 0.6], 0.8);
    L.sign(470, 330, 6, '#ffd040', { r: 55, dead: 0.3 });
    L.prop('car', 700, G, { look: { col: '#4a1a2a', under: '#ff4ab0' }, label: 'parked car' }); L.light(700, G + 2, 50, [1, 0.3, 0.7], 0.7, 2.5);
    // the back-alley clinic
    L.block(820, 300, 1040, G, MAT.clinic, { base: 0.4, lip: 0, panels: [14, 14] });
    L.paint(816, 296, 1044, 300, (P) => P.block(816, 296, 1044, 300, MAT.steel, { base: 0.6 }));
    L.paint(870, 340, 896, 366, (P) => { for (let k = -5; k <= 5; k++) for (let w = -1; w <= 1; w++) { P.put(883 + k, 353 + w, [90, 255, 140], 1); P.put(883 + w, 353 + k, [90, 255, 140], 1); } });
    L.light(883, 353, 80, [0.35, 1, 0.55], 0.9); L.sign(1004, 310, 6, '#3aff80', { vert: true, r: 50 });
    L.prop('node', 1000, G, { gives: { program: 'puppet', flag: 'clinicData' }, level: 2, col: '#3aff80' }); L.light(1000, G - 18, 50, [0.3, 1, 0.5], 0.7);
    L.tube(900, 304, 30, '#e0fff0', 0.6);
    // the fire escape and the rooftop node
    L.block(1100, C + 20, 1290, G, MAT.brick, { base: 0.38, lip: 0, bands: 3 });
    L.paint(1104, C + 30, 1290, 440, (P) => windows(P, 1110, C + 34, 1286, 440, { w: 9, h: 14, gx: 12, gy: 22, lit: 0.3, seed: 31, pal: [['#ffd890', '#e09040']], glow: 0.35 }));
    L.ladder(1112, 380, G);
    L.walk(1100, 1230, 380, 4); L.walk(1150, 1290, 345, 4);
    L.walk(1330, 1460, 290, 6);
    L.block(1330, 296, 1460, G, MAT.brickD, { base: 0.34, lip: 0, bands: 3 });
    L.prop('node', 1420, 290, { gives: { program: 'ghost' }, level: 2, col: '#ff4ab0' }); L.light(1420, 272, 50, [1, 0.3, 0.7], 0.8);
    L.prop('deco', 1200, G, { art: DECO.barrel(), id: 'fire1' }); L.fire(1200, G - 15);
    // gang turf: graffiti, a burning barrel, a car, junk, the cache behind a heavy shutter
    L.paint(1500, 300, 2000, G, (P) => { for (let k = 0; k < 6; k++) { const x = 1520 + k * 80, y = 360 + hash(k, 1, 3) * 40, c = [[255, 74, 176], [58, 240, 224], [255, 208, 64]][k % 3]; for (let t = 0; t < 40; t++) P.put(x + t, y + Math.sin(t * 0.4 + k) * 5, c, 0.15); } });
    L.prop('deco', 1640, G, { art: DECO.barrel(), id: 'fire2' }); L.fire(1640, G - 15);
    L.prop('car', 1740, G, { look: { col: '#2a3a2a', under: '#3af0e0' }, label: 'gang car', flip: true }); L.light(1740, G + 2, 50, [0.3, 1, 0.95], 0.6, 2.5);
    L.prop('junk', 1560, G); L.prop('rack', 1820, G, { label: 'dumped server rack' });
    L.wall(1930, 300, 1960, G, MAT.concrete, { base: 0.45 });
    L.block(1880, 300, 1930, G, MAT.concreteD, { base: 0.25, lip: 0 });
    L.prop('heavy', 1886, G, { w: 26, h: 36 }); L.prop('stash', 1912, G, { label: 'gang stash' });
    L.sign(1700, 320, 5, '#ff4ab0', { r: 55 });
    // further on: a car, and the old subway, sealed
    L.prop('car', 2080, G, { look: { col: '#3a3a4a' }, label: 'burnt-out car' });
    L.block(2260, 300, L.w, G, MAT.tileW, { base: 0.36, lip: 0, panels: [8, 8] });
    L.prop('sealed', 2330, G, { label: 'The old subway to Old Town. Sealed, for now.' });
    L.sign(2290, 312, 6, '#ffb040', { r: 50, dead: 0.2 });
    // the people of the street
    const N = (o) => L.npc(o);
    N({ name: 'Ozu', role: 'vendor', rate: 1.4, look: { skin: SKINS[5], hair: 'cap', capCol: '#4a4a2a', top: '#4a3a2a', apron: '#3a2a1a', legs: '#2a241e', hands: { fx: 26, fy: 38 } }, x: 560, y: G, sched: [[0, 24, 560, 'work']], lines: ['Up top they pay you in noodles. Down here we pay in cash.', 'Salvage? I pay better than Kit. Don\'t tell Kit.'], behind: true });
    N({ name: 'Sister Ama', look: { skin: SKINS[1], hair: 'long', hairCol: '#1a1414', top: '#d8e8e0', coat: 'long', legs: '#3a4a40', eye: '#3aff80' }, x: 940, y: G, sched: [[0, 24, 940, 'stand']], lines: ['The clinic\'s terminal? Not mine. The last doctor left in a hurry.', 'We patch up whatever the gangs leave.'] });
    N({ name: 'Dusk', smoke: true, look: { skin: SKINS[3], hair: 'hood', top: '#3a3028', legs: '#2a2420' }, x: 1182, y: G, sched: [[0, 24, 1182, 'stand']], lines: ['Warm here. Warmest place on the street.', 'The Gutter King\'s lot own everything past the next pillar.'] });
    N({ name: 'Lark', look: { skin: SKINS[1], hair: 'long', hairCol: '#4a3a30', top: '#4a3a4a', coat: 'long', legs: '#2a2420', tall: 0.92 }, x: 1218, y: G, face: -1, sched: [[0, 24, 1218, 'stand']], lines: ['My brother went down the subway before they sealed it.', 'You hear the trains sometimes. There aren\'t any trains.'] });
    N({ name: 'Bo', look: { skin: SKINS[0], hair: 'short', hairCol: '#c8a060', top: '#2a3a2a', legs: '#2a2a2a' }, x: 640, y: G, sched: [[6, 22, 640, 'wander'], [22, 24, 300, 'away'], [0, 6, 300, 'away']], lines: ['Lift\'s been dead since the Warden came. Somebody fix it, I\'m tired of the ladder.'] });
    // the gang, and a clinic drone
    for (const [x, a, b] of [[1560, 1500, 1700], [1720, 1640, 1860], [1820, 1760, 1880]]) L.enemy('gang', x, G, { range: [a, b] });
    L.enemy('drone', 960, 340, { range: [860, 1060] });
    // ---- the street going about its business
    crowd(L, 3, 200, 1080, G, 71);
    L.ad(704, 318, 50, 34, 'koi', ['#ff4ab0', '#ffb0e0']); L.ad(984, 330, 26, 34, 'bars', ['#3aff80', '#ffd040']); L.ad(1584, 300, 28, 44, 'cycle', ['#3af0e0', '#ff4ab0']); L.ad(2200, 336, 70, 15, 'marquee', ['#ffb040', '#3af0e0']);
    L.critter('rat', 0, 2300, G, 4); L.litter(0, 2380, G, 10);
    L.vents.push({ x: 820, y: G, kind: 'steam' }, { x: 1360, y: G, kind: 'steam' }, { x: 2040, y: G, kind: 'steam' });
    for (const x of [80, 230, 470, 760, 1010, 1330, 1520, 1890, 2150]) L.drips.push({ x, y0: 162, y1: G });
    L.spawns = { shaft: [128, G], lift: [300, G] };
    L.ambient = [0.15, 0.12, 0.2];
    L.wet.push({ y: G + 1, x0: 0, x1: L.w, depth: 24, k: 0.45 });
    L.rain = 0;
    return L;
  },
};
