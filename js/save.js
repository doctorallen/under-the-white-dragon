'use strict';
// ---------------------------------------------------------------------------
// Saving: Game.s, in localStorage. The levels are built from code, so a save
// only needs what's changed: props done by id, flags, what you carry and
// wear, the parts, the notebook, what's on the bench, the jobs and the heat.
// Every read and write is guarded, since storage can be missing or full.
// ---------------------------------------------------------------------------
const Save = {
  key: 'whitedragon.save.v1', last: 0, off: false,
  // saves from before the White Dragon (Downlevel's) aren't carried over
  OLD: ['downlevel.save.v1'],
  write() {
    if (!Game.s || this.off) return;
    if (World.L) { Game.s.px = Player.x; Game.s.py = Player.y; }
    try { localStorage.setItem(this.key, JSON.stringify(Game.s)); } catch (e) { /* storage unavailable */ }
    this.last = Game.t;
  },
  read() { try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } },
  wipe() { this.off = true; try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ } },
  // start from the save if there is one; true if there was. Old saves are
  // deleted, and a save of another version is started over.
  start() {
    for (const k of this.OLD) try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    const d = this.read(), f = Game.fresh();
    if (d && d.v === f.v) {
      Game.s = Object.assign(f, d, { gear: Object.assign(f.gear, d.gear || {}), warrants: d.warrants || f.warrants, notes: Object.assign(f.notes, d.notes || {}) });
      Game.s.gear.lvl = Game.s.gear.lvl || {};
      return true;
    }
    Game.s = f; return false;
  },
};
