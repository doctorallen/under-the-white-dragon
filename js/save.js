'use strict';
// ---------------------------------------------------------------------------
// Saving: Game.s, in localStorage. The levels are built from code, so a save
// only needs what's changed: props done by id, flags, what you carry, the
// parts, the notebook, what's on the bench, the jobs and the heat, and the
// residents' minds (city).
// Every read and write is guarded, since storage can be missing or full.
// ---------------------------------------------------------------------------
const Save = {
  key: 'whitedragon.save.v1', last: 0, off: false,
  // saves from before the White Dragon (Downlevel's) aren't carried over
  OLD: ['downlevel.save.v1'],
  write() {
    if (!Game.s || this.off) return;
    if (World.L) { Game.s.px = Player.x; Game.s.py = Player.y; }
    City.stash(); // the residents' minds (Tyrell's state), as they are
    try { localStorage.setItem(this.key, JSON.stringify(Game.s)); } catch (e) { /* storage unavailable */ }
    this.last = Game.t;
  },
  read() { try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } },
  wipe() { this.off = true; try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ } },
  // start from the save if there is one; true if there was. Old saves are
  // deleted, and a save of another version is started over.
  // ids renamed since a save could have been made (American English: the
  // block's flats are its apartments now), put right in an old save
  RENAMED: [[/\bd_flats\b/g, 'd_apartments']],
  renamed(d) { let j = JSON.stringify(d); for (const [a, b] of this.RENAMED) j = j.replace(a, b); return JSON.parse(j); },
  start() {
    for (const k of this.OLD) try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    const d = this.read(), f = Game.fresh();
    if (d && d.v === f.v) {
      Object.assign(d, this.renamed(d));
      Game.s = Object.assign(f, d, { notes: Object.assign(f.notes, d.notes || {}) });
      for (const k of Game.OLD) delete Game.s[k]; // (what Downlevel kept: health, gear, cases...)
      return true;
    }
    Game.s = f; return false;
  },
};
