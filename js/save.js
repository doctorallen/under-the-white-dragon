'use strict';
// ---------------------------------------------------------------------------
// Saving: Game.s, in localStorage. The levels are built from code, so a save
// only needs what's changed: props done by id, flags, the pack, the ware.
// Every read and write is guarded, since storage can be missing or full.
// ---------------------------------------------------------------------------
const Save = {
  key: 'downlevel.save.v1', last: 0, off: false,
  write() {
    if (!Game.s || this.off) return;
    if (World.L) { Game.s.px = Player.x; Game.s.py = Player.y; }
    try { localStorage.setItem(this.key, JSON.stringify(Game.s)); } catch (e) { /* storage unavailable */ }
    this.last = Game.t;
  },
  read() { try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } },
  wipe() { this.off = true; try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ } },
  // start from the save if there is one; true if there was
  start() {
    const d = this.read();
    const f = Game.fresh();
    if (d && d.v === 2) { Game.s = Object.assign(f, d, { mods: Object.assign(f.mods, d.mods), jobs: Object.assign(f.jobs, d.jobs) }); return true; }
    Game.s = f; return false;
  },
};
