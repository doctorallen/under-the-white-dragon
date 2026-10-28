'use strict';
// ---------------------------------------------------------------------------
// The game's state and its rules. Game.s is everything a save keeps: where
// you are, your money, what you carry (salvage, by count) and the parts you
// have (parts.js), what's been done to the city (props by id, flags), the
// bench, the jobs, your heat, the tips, and the time of day. The block's
// minds are kept with it (Game.s.city, city.js).
// ---------------------------------------------------------------------------
const Game = {
  frame: 0, t: 0, paused: false, fade: 0, fadeTo: null,
  s: null, cam: { x: 0, y: 0 }, toasts: [], gains: [], particles: [],
  fresh() {
    return {
      v: 1, level: 'd_cellar', spawn: 'bed', px: 0, py: 0, cr: 40, pack: {},
      done: {}, flags: {}, time: T.day.start, day: 1,
      parts: [], pid: 1, notes: { known: {}, log: [] }, bench: null, aside: {}, jobs: {}, heat: 0, tools: 1, tips: {},
    };
  },
  // what an old save has that nothing reads now (Downlevel's health, gear,
  // programs, cases and side work): dropped as it loads
  OLD: ['hp', 'ram', 'gadgets', 'quick', 'quests', 'gear', 'programs', 'prog', 'track', 'warrants', 'cases', 'xp', 'closed', 'night', 'deaths'],
  flag(f) { return !!this.s.flags[f]; },
  // ---- what you carry: no limit, and once it's yours it stays yours ----
  // (the pockets are a bag of counts, Tycho.items.bag; a cost is cr and salvage)
  packCount() { return bag.total(this.s.pack); },
  give(item, n) { const got = bag.add(this.s.pack, item, n); if (got) Hud.refresh(); return got; },
  canPay(cost) { const { cr, ...items } = cost; if (cr !== undefined && this.s.cr < cr) return false; return bag.has(this.s.pack, items); },
  pay(cost) {
    if (!this.canPay(cost)) return false;
    const { cr, ...items } = cost;
    if (cr !== undefined) this.s.cr -= cr;
    bag.pay(this.s.pack, items);
    Hud.refresh(); return true;
  },
  // ---- the clock ----
  hour() { return this.s.time % 24; },
  clock() { const h = Math.floor(this.hour()), m = Math.floor((this.hour() % 1) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); },
  pass(hours) { this.s.time += hours; while (this.s.time >= 24) { this.s.time -= 24; this.s.day++; } },
  // ---- moving between levels ----
  // (hours: time that passes on the way, passed once the screen's dark, so
  // nobody's seen jumping about on the screen you're leaving)
  go(level, spawn, hours = 0) { this.fadeTo = { level, spawn, hours }; this.fade = 0.001; },
  // time passing where you are (a bowl of noodles, a cup of tea): the screen
  // goes dark, the time passes, and it comes back up on whoever's there now
  rest(hours) { if (this.fadeTo) return; this.fadeTo = { stay: true, hours }; this.fade = 0.001; },
  arrive(level, spawn) {
    this.s.level = level; this.s.flags['been:' + level] = true; World.load(level);
    const sp = World.L.spawns[spawn] || Object.values(World.L.spawns)[0];
    Player.place(sp[0], sp[1]);
    if (Dev.landAt && Dev.landAt.level === level) { Player.place(Dev.landAt.x, Dev.landAt.y); Dev.landAt = null; } // (dev: beside someone)
    Actors.load(); Life.load();
    this.cam.x = Player.x; this.cam.y = Player.y - 30;
    Hud.refresh(); Save.write();
    this.toast(LEVELS[level].name + ' · ' + LEVELS[level].depth);
  },
  // what Use just got, a line each ("+1 coil"), rising over where it came from
  gain(x, y, list) { list.forEach((g, i) => this.gains.push(Object.assign({ x, y, t: this.t + i * 0.12, i, of: list.length }, g))); },
  toast(text, kind = '') {
    const last = this.toasts[this.toasts.length - 1];
    if (last && last.text === text && this.t - last.t < 2.5) { last.t = this.t; return; }
    this.toasts.push({ text, kind, t: this.t });
    if (this.toasts.length > 2) this.toasts.shift();
    Hud.toasts();
  },
};
