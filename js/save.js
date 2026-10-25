'use strict';
// ---------------------------------------------------------------------------
// Saving. The world is made again from its seed, so a save is the seed, the
// tiles dug since (as indices), and Game.s. Kept in localStorage; every read
// and write is guarded, since storage can be missing or full.
// ---------------------------------------------------------------------------
const Save = {
  key: 'underhill.save.v1',
  last: 0, off: false,
  write() {
    if (!Game.s || this.off) return;
    Game.s.px = Player.x; Game.s.py = Player.y;
    try { localStorage.setItem(this.key, JSON.stringify({ s: Game.s, dug: World.dug })); } catch (e) { /* storage unavailable */ }
    this.last = Game.t;
  },
  read() {
    try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  },
  wipe() { this.off = true; try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ } },
  // start: from the save if there is one, else a new world
  start() {
    const d = this.read();
    if (d && d.s && d.s.v === 1) {
      Game.s = Object.assign(Game.fresh(d.s.seed), d.s);
      generateWorld(Game.s.seed);
      for (const i of d.dug || []) { World.tiles[i] = M.AIR; World.dug.push(i); }
      return true;
    }
    // a new world: ?seed=N in the address picks one (for tests and sharing)
    const want = /[?&]seed=(\d+)/.exec(location.search), seed = want ? +want[1] : (Date.now() % 2147483647) | 0;
    Game.s = Game.fresh(seed);
    generateWorld(seed);
    return false;
  },
};
