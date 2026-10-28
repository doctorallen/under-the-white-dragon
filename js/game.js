'use strict';
// ---------------------------------------------------------------------------
// The game's state and its rules. Game.s is everything a save keeps: where
// you are, your money, what you carry (salvage, by count) and the parts you
// have (parts.js), what's been done to the city (props by id, flags), the
// bench, the jobs, your heat, the tips, and the time of day. The block's
// minds are kept with it (Game.s.city, city.js).
// ---------------------------------------------------------------------------
const Game = {
  frame: 0, t: 0, acc: 0, last: 0, paused: false, fade: 0, fadeTo: null,
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
  packCount() { let n = 0; for (const k in this.s.pack) n += this.s.pack[k]; return n; },
  give(item, n) { if (n <= 0) return 0; this.s.pack[item] = (this.s.pack[item] || 0) + n; Hud.refresh(); return n; },
  canPay(cost) { for (const k in cost) { if (k === 'cr') { if (this.s.cr < cost.cr) return false; } else if ((this.s.pack[k] || 0) < cost[k]) return false; } return true; },
  pay(cost) {
    if (!this.canPay(cost)) return false;
    for (const k in cost) { if (k === 'cr') this.s.cr -= cost.cr; else this.s.pack[k] -= cost[k]; }
    Hud.refresh(); return true;
  },
  // ---- the clock ----
  hour() { return this.s.time % 24; },
  clock() { const h = Math.floor(this.hour()), m = Math.floor((this.hour() % 1) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); },
  pass(hours) { this.s.time += hours; while (this.s.time >= 24) { this.s.time -= 24; this.s.day++; } },
  // ---- moving between levels ----
  go(level, spawn) { this.fadeTo = { level, spawn }; this.fade = 0.001; },
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
