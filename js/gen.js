'use strict';
// ---------------------------------------------------------------------------
// The districts: levels made from a seed and a theme, out of building blocks
// (a building with a walkway up its face, an alley, a market, a machine
// floor, a bridge over water, a server aisle, a nest of cables). The same
// seed always makes the same district. Each has a way in and out (a spinner
// pad, a subway platform or a lift cage), people of its own, machines and
// lockers to open, enemies for its depth, and `spots` on the ground where
// cases and warrants put clues, witnesses and targets.
// ---------------------------------------------------------------------------
const THEMES = {
  neon: { sky: true, rain: 1, wall: MAT.concreteD, wall2: MAT.brickD, floor: MAT.concrete, mods: ['facade', 'market', 'facade', 'alley', 'facade', 'market'], foes: ['gang', 'gunner', 'drone'], amb: [0.2, 0.16, 0.26], signs: ['#ff4ab0', '#3af0e0', '#ffd040', '#9a6aff'], crowd: 8 },
  blocks: { sky: true, rain: 1, wall: MAT.concrete, wall2: MAT.concreteD, floor: MAT.concrete, mods: ['facade', 'facade', 'alley', 'facade', 'courtyard'], foes: ['gang', 'drone', 'gunner'], amb: [0.18, 0.17, 0.24], signs: ['#ffd040', '#3af0e0'], crowd: 6, laundry: true },
  plaza: { sky: true, rain: 1, wall: MAT.glassC, wall2: MAT.steelD, floor: MAT.tile, mods: ['tower', 'plaza', 'tower', 'plaza'], foes: ['guard', 'sentinel', 'turret'], amb: [0.22, 0.24, 0.3], signs: ['#e8e8ff', '#3af0e0'], crowd: 5, glass: true },
  docks: { sky: true, rain: 1, wall: MAT.rust, wall2: MAT.steelD, floor: MAT.concrete, mods: ['shed', 'water', 'shed', 'alley', 'water'], foes: ['gang', 'gunner', 'bruiser'], amb: [0.15, 0.17, 0.22], signs: ['#ffd040', '#ff6a3a'], crowd: 4 },
  scrap: { sky: true, rain: 1, wall: MAT.rust, wall2: MAT.brickD, floor: MAT.asphalt, mods: ['heap', 'alley', 'heap', 'shed', 'heap'], foes: ['gang', 'bruiser', 'gunner', 'spider'], amb: [0.16, 0.13, 0.15], signs: ['#ff6a3a', '#ffd040'], crowd: 3, fires: true },
  flood: { sky: false, rain: 0, wall: MAT.brick, wall2: MAT.brickD, floor: MAT.tileW, mods: ['facade', 'water', 'market', 'water', 'facade'], foes: ['gunner', 'spider', 'feral', 'gang'], amb: [0.12, 0.13, 0.16], signs: ['#ffb040', '#3aff80'], crowd: 4, ceiling: true, lanterns: true },
  line: { sky: false, rain: 0, wall: MAT.tile, wall2: MAT.concreteD, floor: MAT.concrete, mods: ['platform', 'tunnel', 'platform', 'tunnel'], foes: ['gunner', 'spider', 'gang', 'turret'], amb: [0.12, 0.13, 0.14], signs: ['#ffd040', '#3af0e0'], crowd: 3, ceiling: true },
  works: { sky: false, rain: 0, wall: MAT.steelD, wall2: MAT.rust, floor: MAT.steel, mods: ['machines', 'catwalk', 'vats', 'machines', 'catwalk'], foes: ['turret', 'spider', 'gunner', 'bruiser', 'sentinel'], amb: [0.14, 0.12, 0.11], signs: ['#ff8a3a', '#ffd040'], crowd: 2, ceiling: true, fires: true },
  servers: { sky: false, rain: 0, wall: MAT.machine, wall2: MAT.steelD, floor: MAT.steel, mods: ['racks', 'catwalk', 'racks', 'machines'], foes: ['turret', 'sentinel', 'spider', 'guard'], amb: [0.1, 0.14, 0.18], signs: ['#3af0e0', '#5a9aff'], crowd: 1, ceiling: true, cold: true },
  tunnel: { sky: false, rain: 0, wall: R(['#0e0a14', '#1a1222', '#2a1c34', '#5a3a6a']), wall2: MAT.concreteD, floor: R(['#141018', '#221a26', '#32283a', '#6a5a72']), mods: ['cables', 'tunnel', 'cables', 'nest'], foes: ['feral', 'spider', 'feral', 'sentinel'], amb: [0.1, 0.08, 0.13], signs: ['#c87aff', '#3aff80'], crowd: 1, ceiling: true, organic: true },
  vault: { sky: false, rain: 0, wall: R(['#0a1218', '#122030', '#1c3448', '#5a8aa8']), wall2: MAT.steelD, floor: MAT.steel, mods: ['racks', 'nest', 'vats', 'cables'], foes: ['feral', 'sentinel', 'spider', 'turret'], amb: [0.1, 0.13, 0.17], signs: ['#9af0ff', '#c87aff'], crowd: 1, ceiling: true, cold: true },
};
// the districts, by depth: tier 1 up at the Stack's height (the spinner),
// 2 street level (the spinner), 3 Old Town (the subway), 4 the Works and 5
// the Bowels (the lift cages)
const DISTRICTS = [
  ['d_neonrow', 'Neon Row', 1, 'neon', 2900], ['d_kessler', 'Kessler Blocks', 1, 'blocks', 2400], ['d_glasshouse', 'Glasshouse Plaza', 1, 'plaza', 2600], ['d_skybridge', 'The Skybridge', 1, 'blocks', 2200], ['d_gardens', 'Arcology Gardens', 1, 'plaza', 2200],
  ['d_overpass', 'Overpass Market', 2, 'neon', 2600], ['d_docks', 'Canal Docks', 2, 'docks', 2500], ['d_scrapyard', 'The Scrapyard', 2, 'scrap', 2400], ['d_chopshop', 'Chop Shop Alley', 2, 'scrap', 2300], ['d_clinicrow', 'Clinic Row', 2, 'neon', 2100],
  ['d_arcade', 'Flooded Arcade', 3, 'flood', 2500], ['d_chapel', 'Drowned Chapel', 3, 'flood', 2100], ['d_line', 'Old Line Four', 3, 'line', 2700], ['d_cistern', 'Cistern Market', 3, 'flood', 2300], ['d_lantern', 'Lantern Quarter', 3, 'flood', 2400],
  ['d_pumphall', 'Pump Hall Seven', 4, 'works', 2600], ['d_foundry', 'The Foundry', 4, 'works', 2400], ['d_servers', 'Server Farm', 4, 'servers', 2500], ['d_vats', 'Coolant Vats', 4, 'works', 2200],
  ['d_cables', 'Cable Run', 5, 'tunnel', 2600], ['d_vaults', 'Cooling Vaults', 5, 'vault', 2300], ['d_gut', 'The Gut', 5, 'tunnel', 2400], ['d_roots', 'Old Roots', 5, 'tunnel', 2200],
];
const TRANSIT_OF = { 1: 'spinner', 2: 'spinner', 3: 'subway', 4: 'lift', 5: 'lift' };
const DEPTH_OF = { 1: '+60 m', 2: '-60 m', 3: '-140 m', 4: '-260 m', 5: '-400 m' };
const LOCAL_LINES = {
  neon: ['Everything on the Row is for sale. Even the rain, if you ask the right stall.', 'Don\'t stand still too long, tracer. People notice.', 'My cousin sold a synth dog once. Got more for it than for his kidney.'],
  blocks: ['Forty floors and the lift works on Tuesdays.', 'The walls are thin. I know everyone\'s business. Ask me.', 'Somebody on twelve keeps a real cat. Real! Imagine the money.'],
  plaza: ['You\'re not cleared for this level, are you? I won\'t tell.', 'Meridian owns the floor you\'re standing on. Literally.', 'Clean air up here. Costs extra.'],
  docks: ['Nothing\'s floated in this canal since I was born. Plenty\'s sunk.', 'The cranes run themselves now. Mostly.', 'Crates come in marked "machine parts". Some of them breathe.'],
  scrap: ['Everything ends up here eventually. People too.', 'The fires keep the dogs off. The real ones and the other kind.', 'You buying or burying?'],
  flood: ['The first city. It\'s still down here, under the water.', 'Lanterns keep the ferals back. Mostly.', 'The Mayor runs Old Town. Nobody voted.'],
  line: ['Last train ran in sixty-four. People still wait for it.', 'Watch the third rail. It remembers.', 'The tunnels go further than any map.'],
  works: ['Shift\'s twelve hours. The Works never stops.', 'Hot down here, tracer. Drink water. Not coolant.', 'The Foreman counts every bolt. Counts us too.'],
  servers: ['Cold enough to keep the racks happy. Not me.', 'Every screen up top is running on something down here.', 'Don\'t touch the blue lights.'],
  tunnel: ['You hear it? The hum. The Root, breathing.', 'The ferals were people once. Some still are.', 'Go back up, tracer. There\'s nothing to arrest down here.'],
  vault: ['It\'s the city\'s memory, kept cold.', 'Breath freezes on the racks. Mind the ice.', 'Something lives in the vents. Something warm.'],
};

function makeDistrict(D) { const [id, name, tier, theme, W] = D; return buildPlace({ id, name, tier, theme, W, ...(DISTRICT_EXTRA[id] || {}) }); }
// what a district has that the generator doesn't make: shops, clubs, a boss
const DISTRICT_EXTRA = {
  d_neonrow: {
    extra(L, G) {
      // the Menagerie: a pet shop of synth animals, and a few real ones, very dear
      L.block(560, G - 120, 780, G - 96, ['#1a1420', '#2a2030', '#3a2c40', '#4a3a50'], { base: 0.3, lip: 0.6 });
      L.paint(560, G - 96, 780, G, (P) => { P.block(560, G - 96, 780, G, ['#141018', '#201a24', '#2c2430', '#3a3040'], { base: 0.25 }); glassWall(P, 590, G - 80, 750, G - 24); });
      L.sign(630, G - 116, 8, '#3af0e0', { r: 80, seed: 31 });
      L.light(670, G - 50, 120, [0.4, 1, 0.9], 0.9);
      L.paint(626, G - 80, 656, G - 76, (P) => P.block(626, G - 80, 656, G - 78, MAT.steelD, { base: 0.5 })); L.paint(639, G - 78, 643, G - 24, (P) => P.block(640, G - 78, 642, G - 24, MAT.steelD, { base: 0.4 }));
      L.critter('owl', 640, 640, G - 80, 1); L.critter('dog', 590, 760, G, 1); L.critter('cat', 560, 780, G, 1);
      L.npc({ name: 'Lio', look: { skin: SKINS[2], hair: 'short', hairCol: '#3a2418', top: '#3a5a4a', apron: '#2a3a30', legs: '#2a2a2a', glasses: true }, x: 690, y: G, face: -1, sched: [[0, 24, 690, 'stand']], lines: ['Every one of them. Shot in their cages.', 'You want a dog? I\'ve got one left. Synth. Good boy.', 'A real owl. Do you know what a real owl is worth?'] });
      // the Coil: the club at the end of the Row
      L.block(1960, G - 140, 2160, G - 110, ['#200a18', '#3a1028', '#5a1a3a', '#7a2a4a'], { base: 0.3, lip: 0.6 });
      L.sign(2030, G - 134, 6, '#ff4ab0', { r: 90, seed: 33 });
      L.light(2060, G - 60, 140, [1, 0.35, 0.75], 1);
      L.npc({ name: 'Bouncer', look: { skin: SKINS[5], hair: 'bald', top: '#1a1a1a', coat: 'long', legs: '#1a1a1a', tall: 1.1 }, x: 1990, y: G, face: 1, sched: [[0, 24, 1990, 'stand']], lines: ['Members only. You\'re not a member.', 'If you\'re here for Zola, she\'s on at midnight. Every night.'] });
    },
  },
  d_chopshop: {
    extra(L, G) {
      arena(L, 1700, 2200, G, 'hall');
      L.enemy('king', 1980, G, { range: [1720, 2180] });
    },
  },
};
// a place: a theme's blocks in a row (or the ones given in `seq`), a way in,
// people, machines, lockers, enemies (unless `calm`), and `extra` for what's
// particular to it (a boss's arena, the people of a hub)
function buildPlace(o) {
  const { id, name, tier, theme, W } = o, Th = THEMES[theme], seed = id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0, r = new Rng(seed);
  const H = 430, G = 386, L = newLevel(id, name, W, H), UP = G - 112, UP2 = G - 212;
  L.ground = G; L.spots = []; L.tier = tier;
  // ---- behind: the city, or a dark ceiling and back wall
  if (Th.sky) { cityLayers(L); L.layerDy = o.layerDy !== undefined ? o.layerDy : tier <= 1 ? 40 : 0; }
  else {
    L.block(0, 0, W, 60, Th.wall2, { base: 0.22, lip: 0, panels: [70, 30], drips: 0.15, dripLen: 18 });
    L.paint(0, 60, W, G, (P) => P.area(0, 60, W, G, Th.wall2, (x, y) => 0.18 + (noise(x / 80, y / 60, seed) - 0.5) * 0.12 + (y - 60) / (G - 60) * 0.08));
    for (let x = 30; x < W; x += 140 + r.i(0, 80)) L.paint(x, 60, x + 6, G, (P) => pipe(P, x, 60, x + 6, G, Th.organic ? Th.wall : MAT.steelD, { joints: 30 }));
  }
  L.floor(0, W, G, 44, Th.floor, { base: 0.42, drips: 0 });
  if (Th.sky) L.wet.push({ y: G + 1, x0: 0, x1: W, depth: 22, k: 0.35 });
  // ---- the way in: a pad, a platform or a lift cage
  const mode = o.transit || TRANSIT_OF[tier];
  L.prop('transit', 70, G, { mode, label: mode === 'spinner' ? 'your spinner' : mode === 'subway' ? 'subway platform' : 'lift cage' });
  if (mode === 'spinner') L.light(70, G + 2, 50, [0.3, 0.9, 1], 0.6, 2.5); else L.light(70, G - 40, 50, [1, 0.8, 0.5], 0.6);
  L.spawns = { enter: [140, G] };
  // ---- the blocks, left to right
  let x = 180, m = 0;
  const seq = o.seq || null, end = o.end || W - 260;
  const addFoe = (type, fx, fy, range) => L.enemy(type, fx, fy, { range });
  const foeFor = () => Th.foes[Math.floor(r.f() * Th.foes.length)];
  while (x < end) {
    const kind = seq ? seq[m++ % seq.length] : Th.mods[m++ % Th.mods.length], w = r.i(240, 380), x1 = Math.min(end + 60, x + w), mid = (x + x1) / 2, rr = r.i(1, 1e6);
    BLOCKS[kind](L, x, x1, G, UP, UP2, Th, rr, tier);
    L.spots.push([Math.round(mid), G]);
    if (!o.calm && x > 500) {
      if (r.f() < 0.55 + tier * 0.07) { const t = foeFor(), D0 = ENEMY[t]; if (D0.ai === 'flyer') addFoe(t, mid, G - 70, [x, x1]); else if (D0.ai === 'turret') addFoe(t, x + 12, G - 60, [x, x1]); else addFoe(t, mid + r.i(-40, 40), G, [x + 10, x1 - 10]); }
      if (tier >= 2 && r.f() < 0.25 + tier * 0.05) { const t = foeFor(); if (ENEMY[t].ai !== 'turret' && ENEMY[t].ai !== 'flyer') addFoe(t, mid, G, [x + 10, x1 - 10]); }
    }
    x = x1;
  }
  // a locker or two to open, and the people
  for (let k = 0; k < 2 + Math.floor(tier / 2); k++) { const s = L.spots[r.i(1, L.spots.length - 1)]; L.prop('locker', s[0] + r.i(-60, 60), G, { tier, label: 'locker' }); }
  crowd(L, o.crowd !== undefined ? o.crowd : Th.crowd, 300, Math.min(W - 200, end), G, seed);
  if (!o.noLocal) L.npc({ name: ['Local', 'Resident', 'Old-timer', 'Worker'][tier % 4], look: { skin: SKINS[r.i(0, 5)], hair: r.pick(['short', 'cap', 'long', 'hood', 'bald']), top: r.pick(['#3a4a5a', '#5a3a3a', '#4a4a3a', '#2a3a3a']), coat: r.pick(['long', 'jacket']), legs: '#2a2a2a' }, x: 260, y: G, sched: [[0, 24, 260, 'stand']], lines: LOCAL_LINES[theme] });
  // light and weather
  L.ambient = Th.sky ? Th.amb : Th.amb.map((v) => v + 0.05); L.rain = Th.rain; if (!Th.rain) L.dry = [[0, 0, W, H]];
  if (Th.sky) L.ambient = (ax, ay) => { const t = clamp(1 - ay / 400, 0, 1); return [Th.amb[0] + t * 0.08, Th.amb[1] + t * 0.06, Th.amb[2] + t * 0.1]; };
  L.critter('rat', 200, W - 100, G, Th.sky ? 2 : 3);
  if (theme === 'neon' || theme === 'blocks') L.critter('dog', 300, W - 300, G, 1);
  if (Th.sky) L.litter(200, W - 100, G, 6);
  if (o.extra) o.extra(L, G, UP, UP2, r);
  return L;
}

// ---- the building blocks --------------------------------------------------------
// each paints its stretch [x0, x1] and puts in what belongs there
function signAt(L, x, y, r, Th) { L.sign(x, y, r.i(3, 7), r.pick(Th.signs), { r: 50, vert: r.f() < 0.3, dead: r.f() < 0.15 ? 0.3 : 0 }); }
const BLOCKS = {
  // a building: a facade of windows, shops at the bottom, a walkway up its
  // face with stairs to it, sometimes a second one by ladder
  facade(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed), top = Th.sky ? r.i(60, 160) : 60, ramp = r.f() < 0.5 ? Th.wall : Th.wall2;
    L.block(x0, top, x1, G, ramp, { base: 0.38, drips: 0.12, dripLen: 30, panels: [r.i(20, 40), r.i(24, 36)] });
    L.paint(x0, top, x1, G, (P) => { for (let fy = top + 10; fy < UP - 30; fy += 30) windows(P, x0 + 8, fy, x1 - 8, fy + 20, { w: 8, h: 12, gx: 6, gy: 30, lit: 0.35 + r.f() * 0.2, seed: seed + fy, blinds: true, glow: 0.3, sill: true }); });
    // shops at the bottom
    for (let sx = x0 + 20; sx < x1 - 60; sx += r.i(80, 120)) {
      const lit = r.f() < 0.8, c = r.pick(Th.signs);
      L.paint(sx, G - 36, sx + 50, G, (P) => { P.block(sx, G - 36, sx + 50, G, MAT.steelD, { base: 0.3 }); if (lit) windows(P, sx + 3, G - 32, sx + 47, G - 4, { w: 44, h: 26, gx: 2, gy: 40, lit: 1, seed: sx, pal: [[col3(c).map((q) => Math.min(255, q * 0.5 + 90)), col3(c).map((q) => q * 0.4)]], glow: 0.2 }); });
      L.tube(sx + 6, G - 40, 38, c, 0.6); if (r.f() < 0.6) signAt(L, sx + 4, G - 58, r, Th);
      if (r.f() < 0.35) L.prop(['vending', 'ac', 'junk'][r.i(0, 2)], sx + 60, G, { label: 'machine' });
    }
    // the walkway up the front, and stairs to it
    if (r.f() < 0.7) {
      L.walk(x0 + 10, x1 - 10, UP, 6); L.stairs(x0 + 14, G, x0 + 90, UP);
      for (let dx = x0 + 120; dx < x1 - 40; dx += r.i(60, 90)) L.prop('deco', dx, UP, { art: DECO.door({ col: r.pick(['#3a3440', '#4a3a3a', '#3a4a4a']), light: r.pick(['#ffd8a0', '#9af0ff', '#ff9ad8']) }), id: 'gd' + dx });
      L.dry.push([x0, UP, x1, G]); L.spots.push([Math.round((x0 + x1) / 2 + 40), UP]);
      if (Th.laundry && r.f() < 0.6) L.paint(x0 + 20, UP - 50, x1 - 20, UP - 30, (P) => laundry(P, x0 + 20, UP - 46, x1 - 20, UP - 40, seed));
      if (top < UP2 - 20 && r.f() < 0.5) { L.walk(x0 + 30, x1 - 30, UP2, 6); L.ladder(x1 - 40, UP2, UP); L.spots.push([Math.round((x0 + x1) / 2), UP2]); if (r.f() < 0.5) L.prop('locker', x0 + 60, UP2, { tier, label: 'locker' }); }
    }
    if (Th.sky && r.f() < 0.4) L.ad(x0 + 30, top + 20, Math.min(100, x1 - x0 - 60), 26, r.pick(['marquee', 'cycle', 'bars']), [r.pick(Th.signs), r.pick(Th.signs)]);
    if (Th.lanterns) for (let lx = x0 + 30; lx < x1; lx += 90) L.lamp(lx, G, 44, '#ffb060', 0.8);
  },
  // an alley: a gap between buildings, the city through it, junk and a lamp
  alley(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed);
    if (!Th.sky) L.block(x0, 60, x1, G, Th.wall, { base: 0.26, lip: 0, panels: [40, 40], drips: 0.2, dripLen: 40 });
    L.paint(x0, G - 50, x1, G, (P) => { heap(P, x0 + 10, x0 + 80, G, 18, MAT.rust, seed % 9); });
    L.prop('junk', x0 + 120, G, { label: 'junk pile' });
    L.lamp(x0 + (x1 - x0) / 2, G, 70, r.pick(['#ffd8a8', '#c8e0ff']), 0.9);
    if (Th.fires) { L.prop('deco', x1 - 60, G, { art: DECO.barrel(), id: 'bf' + x0 }); L.fire(x1 - 60, G - 15); }
    if (r.f() < 0.5) L.prop('car', x1 - 140, G, { look: { col: r.pick(['#3a2a48', '#4a1a2a', '#2a3a4a']), under: r.pick(Th.signs) }, label: 'parked car' });
    L.litter(x0, x1, G, 2);
  },
  // a market: stalls, string lights, someone selling
  market(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed);
    if (!Th.sky) L.block(x0, 60, x1, G, Th.wall2, { base: 0.24, lip: 0, panels: [50, 40] });
    L.paint(x0, G - 90, x1, G - 40, (P) => stringLightsPaint(P, x0 + 10, G - 80, x1 - 10, G - 82, 12, Th.signs));
    for (let sx = x0 + 50; sx < x1 - 40; sx += 110) { L.prop('deco', sx, G, { art: DECO.stall({ awning: r.pick(['#b02a3a', '#2a5a8a', '#2a7a4a', '#8a5a1a']) }), id: 'st' + sx, front: 20 }); L.light(sx, G - 22, 60, [1, 0.7, 0.45], 0.7); }
    const vx = x0 + 50;
    L.npc({ name: ['Hawker', 'Stallholder', 'Trader'][r.i(0, 2)], role: 'vendor', rate: 1.1, look: { skin: SKINS[r.i(0, 5)], hair: 'cap', capCol: r.pick(['#2a5a8a', '#8a2a2a']), top: '#4a4a3a', apron: '#3a2a1a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: vx, y: G, sched: [[0, 24, vx, 'work']], lines: ['Salvage? I\'ll take it. Fair prices. Fairish.'], behind: true });
  },
  // a courtyard between blocks: a tree in a box, benches, washing overhead
  courtyard(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed);
    L.paint(x0, G - 30, x1, G, (P) => { P.block(x0 + 40, G - 12, x0 + 70, G, MAT.concreteD, { base: 0.4 }); });
    L.prop('deco', x0 + 55, G - 12, { art: () => plant(), id: 'tree' + x0 });
    L.prop('deco', x0 + 130, G, { art: () => bench(), id: 'bn' + x0 });
    L.paint(x0, UP - 30, x1, UP, (P) => laundry(P, x0, UP - 20, x1, UP - 26, seed));
    L.lamp(x1 - 40, G, 60, '#ffe0b0', 0.8);
    if (r.f() < 0.5) L.critter('cat', x0, x1, G, 1);
  },
  // a corporate tower base: glass, a lit lobby, a guard post
  tower(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed), top = r.i(30, 90);
    L.paint(x0, top, x1, G, (P) => glassWall(P, x0, top, x1, G - 40, { lit: 0.5, seed, mw: 12, mh: 16 }));
    L.paint(x0, G - 40, x1, G, (P) => { P.block(x0, G - 40, x1, G - 36, MAT.steel, { base: 0.6 }); P.area(x0, G - 36, x1, G, MAT.glassC, () => 0.55); });
    L.light((x0 + x1) / 2, G - 20, 100, [0.85, 0.9, 1], 0.8);
    L.sign(x0 + 20, G - 56, 6, '#e8e8ff', { r: 60 });
    L.walk(x0 + 20, x1 - 20, UP, 6); L.ladder(x0 + 30, UP, G); L.spots.push([Math.round((x0 + x1) / 2), UP]);
    if (r.f() < 0.5) L.prop('rack', x1 - 40, G, { label: 'data rack' });
  },
  // an open plaza: a fountain of light, a hologram, benches
  plaza(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed), cx = (x0 + x1) / 2;
    L.paint(cx - 40, G - 8, cx + 40, G, (P) => P.block(cx - 40, G - 8, cx + 40, G, MAT.tile, { base: 0.55 }));
    L.light(cx, G - 30, 90, [0.5, 0.9, 1], 0.9);
    L.prop('deco', cx - 70, G, { art: () => bench(), id: 'pb' + x0 }); L.prop('deco', cx + 70, G, { art: () => bench(), id: 'pb2' + x0 });
    L.ad(cx - 30, G - 110, 60, 50, r.pick(['koi', 'cycle']), [r.pick(Th.signs), '#ffffff']);
  },
  // a shed: corrugated walls, crates, a loading door
  shed(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed), top = G - r.i(90, 150);
    L.paint(x0, top, x1, G, (P) => corrugated(P, x0, top, x1, G, r.f() < 0.5 ? MAT.rust : MAT.steelD));
    L.prop('deco', x0 + 60, G, { art: DECO.shutter({ w: 50, h: 40, tag: r.pick(Th.signs) }), id: 'sh' + x0 });
    for (let k = 0; k < 3; k++) L.prop('deco', x1 - 40 - k * 16, G, { art: DECO.crate({ col: r.pick(['#3a4a5a', '#5a4a2a', '#4a5a3a']), w: 14, h: 11 }), id: 'cr' + x0 + k });
    L.tube(x0 + 20, top + 10, 30, '#ffe8c0', 0.6);
    L.walk(x0 + 10, x1 - 10, top, 4, MAT.steelD); L.ladder(x1 - 20, top, G); L.spots.push([Math.round((x0 + x1) / 2), top]);
    if (r.f() < 0.6) L.prop('locker', x0 + 120, top, { tier, label: 'locker' });
  },
  // water: a canal under a bridge; the bridge is the floor
  water(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed);
    L.paint(x0, G, x1, G + 44, (P) => { water(P, x0, x1, G + 8, 36, R(['#06101a', '#0c1c2a', '#163040', '#3a6a80'])); P.block(x0, G, x1, G + 7, MAT.steelD, { base: 0.5 }); });
    L.paint(x0, G - 10, x1, G, (P) => railing(P, x0, x1, G, MAT.steel, { h: 9 }));
    L.wet.push({ y: G + 8, x0, x1, depth: 30, k: 0.5 });
    if (Th.lanterns) for (let lx = x0 + 40; lx < x1; lx += 100) L.lamp(lx, G, 50, '#ffb060', 0.9); else L.lamp((x0 + x1) / 2, G, 70, '#c8e0ff', 0.8);
    if (r.f() < 0.5) L.critter('rat', x0, x1, G, 1);
  },
  // a heap of scrap, a fire, a wreck to strip
  heap(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed);
    L.paint(x0, G - 90, x1, G, (P) => { heap(P, x0, x1, G, r.i(40, 80), MAT.rust, seed % 11); heap(P, x0 + 40, x1 - 60, G, r.i(20, 40), MAT.steelD, seed % 7); });
    L.prop('wreck', x0 + 70, G, { label: 'wrecked drone' }); L.prop('junk', x1 - 70, G, { label: 'junk pile' });
    if (Th.fires) { L.prop('deco', (x0 + x1) / 2, G, { art: DECO.barrel(), id: 'hb' + x0 }); L.fire((x0 + x1) / 2, G - 15); }
    L.prop('car', x0 + 170, G, { look: { col: '#3a3a3a', under: '#ff6a3a' }, label: 'burned-out car' });
  },
  // a platform: the old line, rails, a dead train
  platform(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed);
    L.paint(x0, G - 90, x1, G, (P) => { P.block(x0, G - 70, x1, G - 20, R(['#1a2a2a', '#2a3e3a', '#3a524a', '#7a9a8a']), { base: 0.35, panels: [26, 50] }); windows(P, x0 + 12, G - 62, x1 - 12, G - 40, { w: 16, h: 14, gx: 10, gy: 40, lit: 0.4, seed, glow: 0.2 }); });
    L.sign(x0 + 20, G - 100, 5, '#ffd040', { r: 50 });
    for (let tx = x0 + 30; tx < x1; tx += 120) L.tube(tx, 70, 30, '#e8ffe8', 0.6);
    L.prop('deco', x1 - 60, G, { art: () => bench(), id: 'plb' + x0 });
  },
  // a tunnel: darker, pipes, a single lamp
  tunnel(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed);
    L.block(x0, 60, x1, G, Th.wall, { base: 0.2, lip: 0, panels: [60, 50], drips: 0.25, dripLen: 50 });
    L.paint(x0, 90, x1, 110, (P) => pipe(P, x0, 92, x1, 104, MAT.rust, { joints: 40 }));
    L.lamp(x0 + r.i(40, 120), G, 60, '#ffd8a8', 0.7);
    if (Th.organic) L.paint(x0, G - 60, x1, G, (P) => heap(P, x0 + 20, x1 - 20, G, 26, Th.wall, seed % 13));
    L.drips.push({ x: x0 + 60, y0: 64, y1: G }, { x: x1 - 80, y0: 64, y1: G });
  },
  // machines: a floor of them to strip, a catwalk over
  machines(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed);
    L.block(x0, 70, x1, G, Th.wall, { base: 0.26, lip: 0, panels: [40, 30] });
    L.paint(x0, 100, x1, G, (P) => { for (let px = x0 + 20; px < x1; px += 60) pipe(P, px, 100, px + 8, G - 40, MAT.copper, { joints: 24 }); });
    for (let mx = x0 + 40; mx < x1 - 40; mx += 70) L.prop(r.pick(['rack', 'ac', 'junk']), mx, G, { label: 'machine' });
    L.walk(x0 + 10, x1 - 10, UP + 10, 4, MAT.steelD); L.ladder(x0 + 20, UP + 10, G); L.spots.push([Math.round((x0 + x1) / 2), UP + 10]);
    L.light((x0 + x1) / 2, UP - 10, 120, [1, 0.6, 0.3], 0.8, 1, { mode: 'bad', seed });
    L.vents.push({ x: x1 - 30, y: G - 10, kind: 'steam' });
  },
  // a catwalk floor: the gantry above, sparks
  catwalk(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    const r = new Rng(seed);
    L.paint(x0, 60, x1, G, (P) => { for (let gx = x0; gx < x1; gx += 54) girder(P, gx, UP - 8, gx + 54, UP + 4, MAT.steelD, { step: 12 }); });
    L.walk(x0, x1, UP, 4, MAT.steel); L.stairs(x0 + 10, G, x0 + 90, UP); L.walk(x0 + 60, x1 - 40, UP2 + 30, 4, MAT.steel); L.ladder(x1 - 50, UP2 + 30, UP);
    L.spots.push([Math.round(x1 - 80), UP], [Math.round((x0 + x1) / 2), UP2 + 30]);
    L.light((x0 + x1) / 2, UP + 20, 100, [1, 0.7, 0.4], 0.7);
    if (r.f() < 0.6) L.prop('locker', x0 + 140, UP2 + 30, { tier, label: 'locker' });
  },
  // vats: big tanks of coolant, glowing
  vats(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed), c = Th.cold ? [90, 200, 255] : [90, 255, 160];
    L.paint(x0, UP - 40, x1, G, (P) => { for (let vx = x0 + 20; vx < x1 - 70; vx += 100) { P.block(vx, UP - 20, vx + 70, G, MAT.steelD, { base: 0.4, panels: [70, 20] }); for (let y = UP; y < G - 20; y += 1) for (let i = 4; i < 9; i++) if (y % 3) P.put(vx + 30 + i, y, c, 0.6); } });
    L.light((x0 + x1) / 2, G - 60, 120, c.map((q) => q / 255), 0.8);
    L.prop('ac', x1 - 40, G, { label: 'coolant pump' });
  },
  // a server aisle: racks, cold light
  racks(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed);
    L.block(x0, 70, x1, G, Th.wall, { base: 0.22, lip: 0, panels: [30, 30] });
    for (let rx = x0 + 30; rx < x1 - 20; rx += 40) L.prop('rack', rx, G, { label: 'server rack' });
    for (let tx = x0 + 20; tx < x1; tx += 90) L.tube(tx, 76, 30, '#c8f0ff', 0.7);
    L.vents.push({ x: x0 + 20, y: 80, kind: 'steam' });
  },
  // cables: the Bowels' veins, glowing faintly
  cables(L, x0, x1, G, UP, UP2, Th, seed) {
    const r = new Rng(seed);
    L.paint(x0, 60, x1, G, (P) => { for (let k = 0; k < 8; k++) { const y0 = 70 + r.i(0, 100), y1 = 70 + r.i(0, 100); cable(P, x0, y0, x1, y1, r.i(20, 80), r.pick(['#2a1a3a', '#1a2a2a', '#3a1a2a']), { thick: true }); } for (let k = 0; k < 30; k++) P.put(x0 + r.i(0, x1 - x0), r.i(80, G - 20), r.pick([[200, 120, 255], [90, 255, 150]]), 1); });
    L.light((x0 + x1) / 2, G - 80, 110, r.f() < 0.5 ? [0.7, 0.4, 1] : [0.3, 1, 0.6], 0.6);
    L.walk(x0 + 40, x1 - 40, UP, 4, Th.wall); L.ladder(x0 + 50, UP, G); L.spots.push([Math.round((x0 + x1) / 2), UP]);
  },
  // a nest: where the ferals sleep, warm, a heap of rags and a fire
  nest(L, x0, x1, G, UP, UP2, Th, seed, tier) {
    L.paint(x0, G - 40, x1, G, (P) => heap(P, x0 + 30, x1 - 30, G, 22, R(['#1a1410', '#2a2018', '#3a3024', '#6a5a44']), seed % 5));
    L.prop('deco', (x0 + x1) / 2, G, { art: DECO.barrel(), id: 'nb' + x0 }); L.fire((x0 + x1) / 2, G - 15, 70, 0.9);
    L.prop('locker', x1 - 50, G, { tier, label: 'cache of scraps' });
  },
};
for (const D of DISTRICTS) LEVELS[D[0]] = { name: D[1], depth: DEPTH_OF[D[2]], tier: D[2], district: true, theme: D[3], make: () => makeDistrict(D) };

// ---- travel between places: what's open, and how you get there -----------------
// Any way out (a spinner pad, a subway platform, a lift cage, a manhole)
// opens the city map, and from it you can go anywhere you've opened: the
// spinner flies the sky and the street, a manhole ladder takes you down into
// the undercity, the old subway runs to Old Town, lift cages go deeper.
const Travel = {
  // the band of the city a place is in, from its depth
  band(id) { const L = LEVELS[id]; return L && L.metres !== undefined ? stratumOf(L.metres).id : 'high'; },
  // is a place open to you yet
  open(id) {
    const L = LEVELS[id], f = (k) => Game.flag(k);
    if (!L || L.metres === undefined) return false;
    if (f('been:' + id) || id === 'home' || id === 'precinct' || id === 'stack') return true;
    if (id === 'spires') return Game.s.pack.spirepass > 0;
    if (id === 'oldtown') return Game.s.pack.subwaypass > 0 && f('been:street');
    const b = this.band(id);
    if (b === 'high') return true;
    if (b === 'street' || b === 'under') return f('been:street');
    if (b === 'old') return f('been:oldtown');
    if (b === 'works') return f('been:works');
    if (b === 'bowels') return f('been:bowels');
    return false;
  },
  // how you'd get there
  how(id) { return { sky: 'Spinner', high: 'Spinner', street: 'Spinner', under: 'Down a manhole', old: 'Subway', works: 'Lift cage', bowels: 'Lift cage' }[this.band(id)]; },
  spawnFor(id) { const L = LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); if (L.spawns.enter) return 'enter'; if (World.L && this.band(World.L.id) === 'under' && L.spawns.manhole) return 'manhole'; for (const k of ['pad', 'elevator', 'subway', 'lift']) if (L.spawns[k]) return k; return Object.keys(L.spawns)[0]; },
  go(id) {
    Hud.toggle(null);
    const sp = this.spawnFor(id), b = this.band(id);
    if (b === 'sky' || b === 'high' || b === 'street') Flight.start(id, sp, false);
    else { Game.toast({ under: 'You climb down the ladder into the dark and the drip.', old: 'The old train lurches off into the dark.', works: 'The cage drops, and keeps dropping.', bowels: 'The cage drops past the last of the lights.' }[b]); Game.go(id, sp); }
  },
  // where a key door leads
  KEYS: { subwaypass: 'oldtown', mayorkey: 'works', workspass: 'bowels' },
};

// ---- the story's hubs: Old Town, the Works, the Bowels, the Spires --------------
// built like districts, with a boss's arena at the far end and the people of
// the place; a locked way on (a lift, a shaft) wants the key the boss drops
function arena(L, x0, x1, G, style) {
  const S = {
    hall: { wall: MAT.brick, trim: MAT.wood, light: [1, 0.75, 0.45], deco: '#ffb040' },
    crane: { wall: MAT.steelD, trim: MAT.rust, light: [1, 0.6, 0.3], deco: '#ff8a3a' },
    chamber: { wall: R(['#0e0a14', '#1a1222', '#2a1c34', '#5a3a6a']), trim: R(['#1a0e2a', '#3a1a4a', '#5a2a6a', '#8a4aa0']), light: [0.7, 0.4, 1], deco: '#c87aff' },
    penthouse: { wall: MAT.glassC, trim: MAT.chrome, light: [0.85, 0.9, 1], deco: '#e8e8ff' },
  }[style];
  L.block(x0, 40, x1, G, S.wall, { base: 0.3, lip: 0, panels: [60, 50], drips: style === 'penthouse' ? 0 : 0.2, dripLen: 40 });
  L.paint(x0, 40, x1, G, (P) => { for (let cx = x0 + 40; cx < x1; cx += 160) P.block(cx, 60, cx + 18, G, S.trim, { base: 0.45, panels: [18, 40] }); P.block(x0, 40, x1, 52, S.trim, { base: 0.5 }); });
  for (let lx = x0 + 120; lx < x1; lx += 200) L.light(lx, 120, 140, S.light, 0.8);
  L.sign(x0 + 30, 70, 6, S.deco, { r: 70 });
  L.dry.push([x0, 0, x1, L.h]);
}
// a way on that wants a key: a lift, a shaft, a gate
function keyDoor(L, x, G, key, mode, label) { L.prop('keydoor', x, G, { key, mode, label }); L.light(x, G - 30, 40, [1, 0.6, 0.3], 0.5); }

LEVELS.oldtown = { name: 'Old Town', depth: '-140 m', tier: 3, hub: true, make: () => buildPlace({ id: 'oldtown', name: 'Old Town', tier: 3, theme: 'flood', W: 3400, transit: 'subway', seq: ['facade', 'market', 'water', 'facade', 'alley'], end: 2350, crowd: 6,
  extra(L, G) {
    L.spawns.subway = [140, G];
    L.npc({ name: 'The Ferryman', look: { skin: SKINS[5], hair: 'hood', top: '#2a3a3a', coat: 'long', legs: '#1a2020', tall: 0.95 }, x: 520, y: G, face: -1, sched: [[0, 24, 520, 'stand']], lines: ['Old Town keeps its own hours. And its own law.', 'The lanterns are lit with glass and good will. Mostly glass.'] });
    L.npc({ name: 'Esi', look: { skin: SKINS[3], hair: 'bun', hairCol: '#1a1414', top: '#5a3a2a', legs: '#2a2420' }, x: 1300, y: G, sched: [[0, 24, 1300, 'stand']], lines: ['My brother\'s in a precinct cell up top. For an arm. An arm!', 'The Mayor runs everything down here. Even the water.'] });
    L.npc({ name: 'Ferrin', role: 'vendor', rate: 1.2, look: { skin: SKINS[1], hair: 'long', hairCol: '#8a8a80', top: '#3a3a2a', apron: '#2a2a1a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 900, y: G, sched: [[0, 24, 900, 'work']], lines: ['Old Town prices. Old Town quality. Buy something.'], behind: true });
    arena(L, 2400, 3260, G, 'hall'); L.enemy('mayor', 2860, G, { arena: [2420, 3240] });
    keyDoor(L, 3330, G, 'mayorkey', 'lift', 'The Mayor\'s lift, down to the Works');
  } }) };
LEVELS.works = { name: 'The Works', depth: '-260 m', tier: 4, hub: true, make: () => buildPlace({ id: 'works', name: 'The Works', tier: 4, theme: 'works', W: 3400, transit: 'lift', seq: ['machines', 'catwalk', 'vats', 'machines'], end: 2300, crowd: 4,
  extra(L, G) {
    L.spawns.lift = [140, G];
    L.paint(560, G - 70, 860, G, (P) => { P.block(560, G - 70, 860, G, MAT.tileW, { base: 0.4, panels: [20, 20] }); windows(P, 580, G - 60, 840, G - 34, { w: 40, h: 22, gx: 10, gy: 40, lit: 1, seed: 5, pal: [['#ffe0b0', '#c08040']], glow: 0.2 }); });
    L.sign(600, G - 84, 7, '#ffd040', { r: 60 }); L.light(700, G - 30, 80, [1, 0.8, 0.55], 0.8);
    L.npc({ name: 'Cookie', look: { skin: SKINS[2], hair: 'bald', top: '#e8e0d0', apron: '#8a3a2a', legs: '#2a2a2a', wide: 1, hands: { fx: 26, fy: 38 } }, x: 700, y: G, sched: [[0, 24, 700, 'work']], lines: ['Eat something, tracer. You look like a pump that\'s run dry.', 'Twelve-hour shifts. I feed them all.'], behind: true });
    arena(L, 2400, 3260, G, 'crane'); L.enemy('foreman', 2860, G, { arena: [2420, 3240] });
    keyDoor(L, 3330, G, 'workspass', 'lift', 'The shaft down to the Bowels');
  } }) };
LEVELS.bowels = { name: 'The Bowels', depth: '-400 m', tier: 5, hub: true, make: () => buildPlace({ id: 'bowels', name: 'The Bowels', tier: 5, theme: 'tunnel', W: 3500, transit: 'lift', seq: ['cables', 'nest', 'tunnel', 'cables'], end: 2300, crowd: 0, noLocal: true,
  extra(L, G) {
    L.spawns.lift = [140, G];
    L.npc({ name: 'The Hermit', look: { skin: '#d8d0c0', hair: 'long', hairCol: '#e8e8e0', top: '#3a3428', coat: 'long', legs: '#2a2418', tall: 0.9, mask: '#3a4a3a' }, x: 620, y: G, face: 1, sched: [[0, 24, 620, 'stand']], lines: ['Nobody comes down here on purpose.', 'Listen. The hum. That\'s the Root, thinking.'] });
    arena(L, 2400, 3420, G, 'chamber'); L.enemy('root', 2900, G - 90, { arena: [2420, 3400], ground: G });
  } }) };
LEVELS.spires = { name: 'The Spires', depth: '+300 m', tier: 6, hub: true, make: () => buildPlace({ id: 'spires', name: 'The Spires', tier: 6, theme: 'plaza', W: 3400, transit: 'spinner', seq: ['tower', 'plaza', 'tower', 'plaza'], end: 2250, crowd: 4, layerDy: 170, calm: true,
  extra(L, G) {
    L.spawns.pad = [140, G]; L.rain = 0; L.dry = [[0, 0, L.w, L.h]];
    L.npc({ name: 'Concierge', role: 'vendor', rate: 0.5, look: { skin: SKINS[0], hair: 'short', hairCol: '#1a1a1a', top: '#1a1a24', coat: 'long', collar: true, legs: '#1a1a24', hands: { fx: 26, fy: 38 } }, x: 1200, y: G, sched: [[0, 24, 1200, 'stand']], lines: ['Welcome to the Spires. Please don\'t touch anything.'] });
    for (const [x, a, b] of [[1500, 1400, 1700], [1900, 1800, 2150], [2200, 2100, 2350]]) L.enemy('enforcer', x, G, { range: [a, b] });
    L.enemy('sentinel', 2000, G - 80, { range: [1800, 2300] });
    arena(L, 2400, 3300, G, 'penthouse'); L.enemy('halden', 2800, G, { arena: [2420, 3280] });
  } }) };
