'use strict';
// ---------------------------------------------------------------------------
// Getting about the city: what's open to you and how you get there (Travel),
// the boss arenas and the locked ways on that hubs share, and what locals
// say. The places themselves are built by hand in the d_*.js files.
// ---------------------------------------------------------------------------
const LOCAL_LINES = {
  neon: ['Everything on the Row is for sale. Even the rain, if you ask the right stall.', 'Don\'t stand still too long, tinker. People notice.', 'My cousin sold a synth dog once. Got more for it than for his kidney.'],
  blocks: ['Forty floors and the lift works on Tuesdays.', 'The walls are thin. I know everyone\'s business. Ask me.', 'Somebody on twelve keeps a real cat. Real! Imagine the money.'],
  plaza: ['You\'re not cleared for this level, are you? I won\'t tell.', 'Meridian owns the floor you\'re standing on. Literally.', 'Clean air up here. Costs extra.'],
  docks: ['Nothing\'s floated in this canal since I was born. Plenty\'s sunk.', 'The cranes run themselves now. Mostly.', 'Crates come in marked "machine parts". Some of them breathe.'],
  scrap: ['Everything ends up here eventually. People too.', 'The fires keep the dogs off. The real ones and the other kind.', 'You buying or burying?'],
  flood: ['The first city. It\'s still down here, under the water.', 'Lanterns keep the ferals back. Mostly.', 'The Mayor runs Old Town. Nobody voted.'],
  line: ['Last train ran in sixty-four. People still wait for it.', 'Watch the third rail. It remembers.', 'The tunnels go further than any map.'],
  works: ['Shift\'s twelve hours. The Works never stops.', 'Hot down here, tinker. Drink water. Not coolant.', 'The Foreman counts every bolt. Counts us too.'],
  servers: ['Cold enough to keep the racks happy. Not me.', 'Every screen up top is running on something down here.', 'Don\'t touch the blue lights.'],
  tunnel: ['You hear it? The hum. The Root, breathing.', 'The ferals were people once. Some still are.', 'Go back up, tinker. Nothing down here wants fixing.'],
  vault: ['It\'s the city\'s memory, kept cold.', 'Breath freezes on the racks. Mind the ice.', 'Something lives in the vents. Something warm.'],
};

// ---- travel between places: what's open, and how you get there -----------------
// Any way out (a cab stand, a subway platform, a lift cage, a manhole)
// opens the city map, and from it you can go anywhere you've opened: the
// cab flies the sky and the street (for a fare, until Ozzy owes you), a manhole ladder takes you down into
// the undercity, the old subway runs to Old Town, lift cages go deeper.
const Travel = {
  // the band of the city a place is in, from its depth
  band(id) { const L = LEVELS[id]; return L && L.metres !== undefined ? stratumOf(L.metres).id : 'high'; },
  // is a place open to you yet
  open(id) {
    const L = LEVELS[id], f = (k) => Game.flag(k);
    if (!L || L.metres === undefined) return false;
    if (!LEGACY && (id === 'home' || id === 'precinct')) return false;
    if (L.hidden) return false; // (the basement: only through the trapdoor)
    if (f('been:' + id) || id === 'd_dragon' || id === 'stack') return true;
    if (id === 'spires') return Game.s.pack.spirepass > 0;
    if (id === 'oldtown') return Game.s.pack.subwaypass > 0 && f('been:street');
    const b = this.band(id);
    if (b === 'high') return true;
    if (b === 'street') return true;
    if (b === 'under') return f('been:street');
    if (b === 'old') return f('been:oldtown');
    if (b === 'works') return f('been:works');
    if (b === 'bowels') return f('been:bowels');
    return false;
  },
  // how you'd get there
  how(id) { const f = Flight.cabFare(); const cab = f ? 'Cab · ' + f + ' cr' : 'Ozzy\'s cab'; return { sky: cab, high: cab, street: cab, under: 'Down a manhole', old: 'Subway', works: 'Lift cage', bowels: 'Lift cage' }[this.band(id)]; },
  spawnFor(id) { const L = LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); if (L.spawns.enter) return 'enter'; if (World.L && this.band(World.L.id) === 'under' && L.spawns.manhole) return 'manhole'; for (const k of ['pad', 'elevator', 'subway', 'lift']) if (L.spawns[k]) return k; return Object.keys(L.spawns)[0]; },
  go(id) {
    Hud.toggle(null);
    const sp = this.spawnFor(id), b = this.band(id);
    if (b === 'sky' || b === 'high' || b === 'street') { const f = Flight.cabFare(); if (f && !Game.pay({ cr: f })) { Game.toast('You can\'t afford the fare: ' + f + ' cr.'); return; } Flight.start(id, sp, true); }
    else { Game.toast({ under: 'You climb down the ladder into the dark and the drip.', old: 'The old train lurches off into the dark.', works: 'The cage drops, and keeps dropping.', bowels: 'The cage drops past the last of the lights.' }[b]); Game.go(id, sp); }
  },
  // ---- on foot: the places at one depth run on from each other, west to east
  // as they sit on the city map, so walking off the end of one street takes
  // you onto the next
  row(b) { return Object.keys(LEVELS).filter((k) => LEVELS[k].district && !LEVELS[k].hidden && LEVELS[k].metres !== undefined && this.band(k) === b).sort((a, c) => LEVELS[a].mapX - LEVELS[c].mapX || (a < c ? -1 : 1)); },
  neighbours(id) { const L = LEVELS[id]; if (!L || !L.district || L.hidden) return {}; const row = this.row(this.band(id)), i = row.indexOf(id); return { west: row[i - 1], east: row[i + 1] }; },
  // near an end: where it goes (for the prompt), and walking off it
  edgeAhead() { const L = World.L, nb = this.neighbours(L.id), x = Player.x; if (x < 60 && nb.west) return { dir: 'west', to: nb.west }; if (x > L.w - 60 && nb.east) return { dir: 'east', to: nb.east }; return null; },
  edge() {
    if (Game.fadeTo || Flight.on || Game.paused || !World.L) return;
    const e = this.edgeAhead(); if (!e) return;
    const off = e.dir === 'west' ? Player.x < 16 && Input.ax < 0 : Player.x > World.L.w - 16 && Input.ax > 0;
    if (!off) return;
    Game.pass(0.15); Game.go(e.to, e.dir === 'west' ? 'east' : 'west');
  },
  // where a key door leads
  KEYS: { subwaypass: 'oldtown', mayorkey: 'works', workspass: 'bowels' },
};

// ---- the story's hubs share these: a boss's arena, and a locked way on --------
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

