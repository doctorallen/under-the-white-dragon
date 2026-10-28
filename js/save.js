'use strict';
// ---------------------------------------------------------------------------
// Saving: Game.s, in localStorage. The levels are built from code, so a save
// only needs what's changed: props done by id, flags, what you carry, the
// parts, the notebook, what's on the bench, the jobs and the heat, and the
// residents' minds (city).
// Every read and write is guarded, since storage can be missing or full.
// ---------------------------------------------------------------------------
const Save = {
  key: 'whitedragon.save.v1', last: 0,
  // saves from before the White Dragon (Downlevel's) aren't carried over
  OLD: ['downlevel.save.v1'],
  // ids renamed since a save could have been made (American English: the
  // block's flats are its apartments now), put right in an old save
  RENAMED: [[/\bd_flats\b/g, 'd_apartments']],
  // the store (Tycho's): a save of another version is started over, and
  // what Downlevel kept that nothing reads now is dropped
  store: null,
  make() {
    return (this.store = new Tycho.save.Store({
      key: this.key, fresh: () => Game.fresh(), old: this.OLD, renamed: this.RENAMED,
      accept: (d, f) => d.v === f.v,
      clean: (s) => { s.notes = Object.assign(Game.fresh().notes, s.notes || {}); for (const k of Game.OLD) delete s[k]; },
    }));
  },
  write() {
    if (!Game.s || !this.store) return;
    if (World.L) { Game.s.px = Player.x; Game.s.py = Player.y; }
    City.stash(); // the residents' minds (Tyrell's state), as they are
    this.store.write(Game.s);
    this.last = Game.t;
  },
  read() { try { return (this.store || this.make()).read(); } catch (e) { return null; } },
  wipe() { (this.store || this.make()).wipe(); },
  get off() { return !!(this.store && this.store.wiped); },
  // start from the save if there is one; true if there was
  start() { Game.s = (this.store || this.make()).load(); return this.store.loaded; },
};
