'use strict';
// ---------------------------------------------------------------------------
// Saving: Game.s, in localStorage. The levels are built from code, so a save
// only needs what's changed: props done by id, flags, what you carry and
// wear, the ware.
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
    if (d && (d.v === 2 || d.v === 3)) {
      // a save from before the apartment: the stash goes into the pack, the
      // capsule's spawn becomes the elevator, and you wear what you started in
      // ware from before implants were outlawed comes back as the gadget that does its job
      if (d.mods) { const m = { lowlight: 'scanner', spring: 'jets', mantis: 'cutter' }; d.gadgets = d.gadgets || {}; for (const k in d.mods.owned || {}) if (m[k]) d.gadgets[m[k]] = 1; delete d.mods; }
      if (d.v === 2) { for (const k in d.stash || {}) d.pack[k] = (d.pack[k] || 0) + d.stash[k]; delete d.stash; if (d.spawn === 'capsule') d.spawn = 'elevator'; d.v = 3; }
      Quests.migrate(d); Cases.migrate(d);
      Game.s = Object.assign(f, d, { gear: Object.assign(f.gear, d.gear || {}), warrants: d.warrants || f.warrants });
      Game.s.gear.lvl = Game.s.gear.lvl || {};
      return true;
    }
    Game.s = f; return false;
  },
};
