'use strict';
// ---------------------------------------------------------------------------
// The kit, and the bench that makes it. Ore goes to the bins at home; the
// bench turns it into picks (which dig harder rock, faster), lamps (which
// reach further), packs (more slots) and torches (to leave lit on the way).
// Each upgrade needs the one before it.
// ---------------------------------------------------------------------------
const PICKS = [
  null,
  { name: 'Old pick', speed: 1 },
  { name: 'Bronze pick', speed: 1.5 },
  { name: 'Iron pick', speed: 2.2 },
  { name: 'Mithril pick', speed: 3.2 },
];
const LAMPS = ['Candle-lantern', 'Hooded lamp', 'Shard lamp'];
const PACKS = { 8: 'Canvas pack', 10: 'Stitched pack', 12: 'Framed pack' };

const RECIPES = [
  { id: 'torches', name: 'Torches (4)', needs: { coal: 1, copper: 1 }, note: 'Leave a light on the way down.', ok: () => true, make: (s) => { s.torches += 4; }, repeat: true },
  { id: 'ladders', name: 'Ladders (8)', needs: { copper: 2 }, note: 'Copper-pegged, to climb back up the way you came.', ok: () => true, make: (s) => { s.ladders += 8; }, repeat: true },
  { id: 'bronzePick', name: 'Bronze pick', needs: { copper: 6, tin: 3, coal: 2 }, note: 'Digs stone, half again as quick.', ok: (s) => s.pick === 1, make: (s) => { s.pick = 2; } },
  { id: 'hoodedLamp', name: 'Hooded lamp', needs: { copper: 4, coal: 3 }, note: 'Throws the light further.', ok: (s) => s.lamp === 0, make: (s) => { s.lamp = 1; } },
  { id: 'stitchedPack', name: 'Stitched pack', needs: { copper: 3, tin: 2, coal: 1 }, note: 'Ten slots instead of eight.', ok: (s) => s.slots === 8, make: (s) => { s.slots = 10; } },
  { id: 'ironPick', name: 'Iron pick', needs: { ironore: 6, coal: 4 }, note: 'Digs the dwarves\' dressed stone, and mithril.', ok: (s) => s.pick === 2, make: (s) => { s.pick = 3; } },
  { id: 'framedPack', name: 'Framed pack', needs: { ironore: 4, tin: 3 }, note: 'Twelve slots.', ok: (s) => s.slots === 10, make: (s) => { s.slots = 12; } },
  { id: 'shardLamp', name: 'Shard lamp', needs: { shard: 4, copper: 2, ironore: 2 }, note: 'Cold light, and a long way.', ok: (s) => s.lamp === 1, make: (s) => { s.lamp = 2; } },
  { id: 'mithrilPick', name: 'Mithril pick', needs: { mithril: 6, ironore: 3, coal: 4 }, note: 'Bites the Seam\'s strange rock.', ok: (s) => s.pick === 3, make: (s) => { s.pick = 4; } },
];
// What a recipe still needs before it's open: the upgrade before it.
const RECIPE_AFTER = { ironPick: 'Bronze pick first', framedPack: 'Stitched pack first', shardLamp: 'Hooded lamp first', mithrilPick: 'Iron pick first' };

const Craft = {
  canAfford(r) { const st = Game.s.store; for (const k in r.needs) if ((st[k] || 0) < r.needs[k]) return false; return true; },
  // a one-off that's behind you now
  passed(r) {
    const s = Game.s;
    return { bronzePick: s.pick >= 2, hoodedLamp: s.lamp >= 1, stitchedPack: s.slots >= 10, ironPick: s.pick >= 3, framedPack: s.slots >= 12, shardLamp: s.lamp >= 2, mithrilPick: s.pick >= 4 }[r.id] || false;
  },
  make(r) {
    if (!r.ok(Game.s) || !this.canAfford(r)) return false;
    for (const k in r.needs) Game.s.store[k] -= r.needs[k];
    r.make(Game.s);
    Game.s.made[r.id] = (Game.s.made[r.id] || 0) + 1;
    Save.write();
    return true;
  },
};
