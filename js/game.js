'use strict';
// ---------------------------------------------------------------------------
// The game's state and its loop. Game.s is everything a save keeps besides
// the world's dug tiles: the bag, the bins and shelves at home (store), what
// the catalog has seen, the kit, the torches left lit.
// ---------------------------------------------------------------------------
const Game = {
  frame: 0, t: 0, acc: 0, last: 0, paused: false,
  s: null,
  cam: { x: 0, y: 0 },
  toasts: [], particles: [],
  fresh(seed) {
    return { v: 1, seed, store: {}, catalog: {}, seen: {}, pick: 1, lamp: 0, slots: T.bag.slots, torches: 3, placed: [], ladders: 16, ladderAt: [], made: {}, goggles: false, bag: [], px: 0, py: 0, deepest: 0 };
  },
  // kit stage, for the sprite: goggles, then the plates and brow lamp
  stage() { return this.s.pick >= 3 && this.s.goggles ? 2 : this.s.goggles ? 1 : 0; },
  toast(text, kind = '') {
    const last = this.toasts[this.toasts.length - 1];
    if (last && last.text === text && this.t - last.t < 2.5) { last.t = this.t; return; }
    this.toasts.push({ text, kind, t: this.t });
    if (this.toasts.length > 3) this.toasts.shift();
    Hud.toasts();
  },
};

// ---- the bag ---------------------------------------------------------------
const Bag = {
  stackOf: (item) => (ITEMS[item].kind === 'ore' ? T.bag.oreStack : T.bag.stack),
  canTake(item) {
    const b = Game.s.bag;
    if (b.some((sl) => sl.item === item && sl.n < this.stackOf(item))) return true;
    return b.length < Game.s.slots;
  },
  add(item) {
    const b = Game.s.bag, sl = b.find((q) => q.item === item && q.n < this.stackOf(item));
    if (sl) sl.n++; else b.push({ item, n: 1 });
    if (!Game.s.seen[item]) { Game.s.seen[item] = true; Game.toast('New find: ' + ITEMS[item].name, 'new'); }
    Hud.bag();
  },
  count() { return Game.s.bag.reduce((a, q) => a + q.n, 0); },
  // home: everything out of the bag, ore to the bins, curios to the shelves
  unpack() {
    const b = Game.s.bag; if (!b.length) return;
    let ores = 0, curios = 0, newCat = 0;
    for (const sl of b) {
      Game.s.store[sl.item] = (Game.s.store[sl.item] || 0) + sl.n;
      if (ITEMS[sl.item].kind === 'ore') ores += sl.n; else curios += sl.n;
      if (!Game.s.catalog[sl.item]) { Game.s.catalog[sl.item] = true; newCat++; }
      if (sl.item === 'goggles' && !Game.s.goggles) { Game.s.goggles = true; Game.toast('The goggles fit. Things look different down there now.', 'new'); }
    }
    Game.s.bag = [];
    const parts = [];
    if (ores) parts.push(ores + ' ore to the bins');
    if (curios) parts.push(curios + ' on the shelves');
    Game.toast('Unpacked: ' + parts.join(', ') + (newCat ? ' · ' + newCat + ' new in the catalog' : ''), 'home');
    Hud.bag(); Hud.refresh();
    Save.write();
  },
};
