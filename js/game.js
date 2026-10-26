'use strict';
// ---------------------------------------------------------------------------
// The game's state and its rules. Game.s is everything a save keeps: where
// you are, your health and money, what you carry and wear, your ware and
// programs, what's been done to the city (props by id, flags), the jobs, and
// the time of day.
// ---------------------------------------------------------------------------
const Game = {
  frame: 0, t: 0, acc: 0, last: 0, paused: false, fade: 0, fadeTo: null,
  s: null, cam: { x: 0, y: 0 }, toasts: [], particles: [], ghost: 0,
  fresh() {
    return {
      v: 3, level: 'home', spawn: 'bed', px: 0, py: 0, hp: T.player.hp, cr: 40, ram: T.ram.max,
      pack: {}, gadgets: {}, gear: { owned: Object.fromEntries(Object.values(GEAR_START).map((g) => [g, 1])), on: Object.assign({}, GEAR_START), lvl: {} }, programs: {}, prog: null,
      done: {}, flags: {}, jobs: { taken: {}, done: {}, kills: {} }, time: T.day.start, day: 1, deaths: 0,
    };
  },
  // ---- ware ----
  // gadgets: carried, so working
  has(g) { return !!this.s.gadgets[g]; },
  flag(f) { return !!this.s.flags[f]; },
  stage() { return { eye: this.has('scanner'), legs: this.has('jets'), arm: this.has('cutter') }; },
  // ---- what you carry: no limit, and once it's yours it stays yours ----
  packCount() { let n = 0; for (const k in this.s.pack) n += this.s.pack[k]; return n; },
  give(item, n) { if (n <= 0) return 0; this.s.pack[item] = (this.s.pack[item] || 0) + n; this.checkJobs(); Hud.refresh(); return n; },
  canPay(cost) { for (const k in cost) { if (k === 'cr') { if (this.s.cr < cost.cr) return false; } else if ((this.s.pack[k] || 0) < cost[k]) return false; } return true; },
  pay(cost) {
    if (!this.canPay(cost)) return false;
    for (const k in cost) { if (k === 'cr') this.s.cr -= cost.cr; else this.s.pack[k] -= cost[k]; }
    Hud.refresh(); return true;
  },
  // ---- gear: one piece a slot ----
  worn(slot) { const id = this.s.gear.on[slot]; return id ? GEAR[id] : null; },
  // a piece's level (from the fabricator) adds a quarter of its base stats each
  lvl(id) { return this.s.gear.lvl[id] || 0; },
  stat(id, key) { const v = GEAR[id][key]; return v === undefined ? undefined : Math.round(v * (1 + FAB.perLevel * this.lvl(id))); },
  gearName(id) { const l = this.lvl(id); return GEAR[id].name + (l ? ' +' + l : ''); },
  armor() { let a = 0; for (const k in this.s.gear.on) { const id = this.s.gear.on[k]; if (GEAR[id] && GEAR[id].armor) a += this.stat(id, 'armor'); } return a; },
  perk(name) { let v = 0; for (const k in this.s.gear.on) { const g = GEAR[this.s.gear.on[k]]; if (g && g.perk && g.perk[name]) v += g.perk[name]; } return v; },
  weapon() { const id = this.s.gear.on.ranged || 'blaster'; return Object.assign({}, GEAR[id], { dmg: this.stat(id, 'dmg') }); },
  strikeDmg() { const id = this.s.gear.on.melee; return (id ? this.stat(id, 'strike') : T.strike.dmg) + (this.has('cutter') ? T.strike.cutter : 0); },
  // ---- the fabricator: parts you're short of can be bought from her as you pay ----
  shortfall(cost) {
    const missing = {}; let extra = 0;
    for (const k in cost) if (k !== 'cr') { const m = cost[k] - (this.s.pack[k] || 0); if (m > 0) { missing[k] = m; extra += Math.round(m * SALVAGE[k].price * FAB.markup); } }
    return { missing, extra, total: (cost.cr || 0) + extra };
  },
  payBuying(cost) {
    const f = this.shortfall(cost); if (this.s.cr < f.total) return false;
    for (const k in f.missing) this.s.pack[k] = (this.s.pack[k] || 0) + f.missing[k];
    this.s.cr -= f.extra; return this.pay(cost);
  },
  make(id) { if (this.s.gear.owned[id] || !this.payBuying(FAB.make[id])) return false; this.giveGear(id); Save.write(); return true; },
  upgrade(id) {
    const l = this.lvl(id); if (!this.s.gear.owned[id] || l >= FAB.maxLevel || !this.payBuying(FAB.upgrade(id, l))) return false;
    this.s.gear.lvl[id] = l + 1; this.toast(this.gearName(id) + '. Better than it was.', 'good'); Hud.refresh(); Save.write(); return true;
  },
  breakDown(id) {
    const G = GEAR[id]; if (!this.s.gear.owned[id] || this.s.gear.on[G.slot] === id) return false;
    const got = FAB.salvage(id, this.lvl(id)); for (const k in got) this.give(k, got[k]);
    delete this.s.gear.owned[id]; delete this.s.gear.lvl[id];
    this.toast(G.name + ' broken down: + ' + Object.keys(got).map((k) => got[k] + ' ' + SALVAGE[k].name.toLowerCase()).join(', '), 'good'); Hud.refresh(); Save.write(); return true;
  },
  buyPart(k, n) { const c = Math.round(SALVAGE[k].price * FAB.markup) * n; if (this.s.cr < c) return false; this.s.cr -= c; this.give(k, n); Save.write(); return true; },
  giveGear(id) {
    const G = GEAR[id]; if (!G || this.s.gear.owned[id]) return false;
    this.s.gear.owned[id] = 1; if (!this.s.gear.on[G.slot]) this.equip(id);
    this.toast('New gear: ' + G.name + ', ' + RARITY[G.rarity].name.toLowerCase() + ' ' + SLOTS[G.slot].toLowerCase() + '. Wear it from Gear.', 'good');
    Hud.refresh(); return true;
  },
  equip(id) { const G = GEAR[id]; if (!this.s.gear.owned[id]) return; this.s.gear.on[G.slot] = id; if (G.slot === 'ranged') Player.charge = Math.min(Player.charge, G.shots); RunnerArt.cache.clear(); Hud.refresh(); Save.write(); },
  unequip(slot) { if (slot === 'ranged') return; delete this.s.gear.on[slot]; RunnerArt.cache.clear(); Hud.refresh(); Save.write(); },
  reward(g) {
    if (!g) return;
    if (g.program) { this.s.programs[g.program] = true; if (!this.s.prog) this.s.prog = g.program; this.toast('New program: ' + PROGRAMS[g.program].name + '. ' + PROGRAMS[g.program].note, 'good'); }
    if (g.flag) { this.s.flags[g.flag] = true; this.checkJobs(); }
    Hud.refresh(); Save.write();
  },
  // ---- jobs ----
  jobState(j) { const J = this.s.jobs; if (J.done[j.id]) return 'done'; if (J.taken[j.id]) return this.jobReady(j) ? 'ready' : 'taken'; if (j.after && !j.after.every((a) => J.done[a])) return 'locked'; return 'open'; },
  jobReady(j) {
    if (j.need) for (const k in j.need) if ((this.s.pack[k] || 0) < j.need[k]) return false;
    if (j.kills) for (const k in j.kills) if ((this.s.jobs.kills[j.id + ':' + k] || 0) < j.kills[k]) return false;
    if (j.flag && !this.s.flags[j.flag]) return false;
    return true;
  },
  takeJob(j) { this.s.jobs.taken[j.id] = true; Hud.refresh(); Save.write(); },
  finishJob(j) {
    if (!this.jobReady(j)) return;
    if (j.need) for (const k in j.need) this.s.pack[k] -= j.need[k];
    this.s.jobs.done[j.id] = true;
    const r = j.reward, got = [];
    if (r.cr) { this.s.cr += r.cr; got.push(r.cr + ' cr'); }
    if (r.chips) { this.give('chips', r.chips); got.push(r.chips + ' chips'); }
    if (r.gear && this.giveGear(r.gear)) got.push(GEAR[r.gear].name.toLowerCase());
    this.toast('Job done: ' + j.title + '. ' + got.join(', ') + '.', 'good');
    if (j.story) setTimeout(() => this.toast(j.story, 'good'), 2500);
    Hud.refresh(); Save.write();
  },
  kill(type) { for (const j of JOBS) if (j.kills && j.kills[type] && this.s.jobs.taken[j.id] && !this.s.jobs.done[j.id]) { const k = j.id + ':' + type; this.s.jobs.kills[k] = (this.s.jobs.kills[k] || 0) + 1; if (this.s.jobs.kills[k] === j.kills[type]) this.toast(j.title + ': done. Report to Lieutenant Hale at the precinct.', 'good'); } },
  checkJobs() { for (const j of JOBS) if (this.s.jobs.taken[j.id] && !this.s.jobs.done[j.id] && !this.s.jobs['said:' + j.id] && this.jobReady(j)) { this.s.jobs['said:' + j.id] = true; this.toast(j.title + ': you have what the lieutenant wants.', 'good'); } },
  // ---- the clock ----
  hour() { return this.s.time % 24; },
  clock() { const h = Math.floor(this.hour()), m = Math.floor((this.hour() % 1) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); },
  pass(hours) { this.s.time += hours; while (this.s.time >= 24) { this.s.time -= 24; this.s.day++; } },
  // ---- moving between levels ----
  go(level, spawn) { this.fadeTo = { level, spawn }; this.fade = 0.001; },
  arrive(level, spawn) {
    this.s.level = level; this.s.flags['been:' + level] = true; World.load(level);
    const sp = World.L.spawns[spawn] || Object.values(World.L.spawns)[0];
    Player.place(sp[0], sp[1]); Actors.load(); Life.load();
    this.cam.x = Player.x; this.cam.y = Player.y - 30;
    Hud.refresh(); Save.write();
    this.toast(LEVELS[level].name + ' · ' + LEVELS[level].depth);
  },
  hurt(n, from) {
    if (Player.inv > 0 || this.paused) return;
    // armour takes its share off every hit
    this.s.hp -= n * 100 / (100 + this.armor()); Player.inv = T.player.iframes; Player.hurtT = 0.25;
    if (from) { Player.vx = Math.sign(Player.x - from.x || 1) * 110; Player.vy = -120; }
    Fx.burst(Player.x, Player.y - 16, [255, 60, 80], 8);
    if (this.s.hp <= 0) this.die();
    Hud.refresh();
  },
  die() {
    this.s.deaths++; this.s.hp = T.player.hp; this.s.ram = T.ram.max; this.pass(6);
    this.toast('You wake in your own bed, sore, six hours later. Somebody carried you home.', 'warn');
    this.go('home', 'bed');
  },
  toast(text, kind = '') {
    const last = this.toasts[this.toasts.length - 1];
    if (last && last.text === text && this.t - last.t < 2.5) { last.t = this.t; return; }
    this.toasts.push({ text, kind, t: this.t });
    if (this.toasts.length > 2) this.toasts.shift();
    Hud.toasts();
  },
};

// ---- programs ------------------------------------------------------------------
const Programs = {
  // run a program: at a target (a hatch for Breach), or at what's around you
  run(name, target) {
    const P = PROGRAMS[name];
    if (!Game.s.programs[name]) { Game.toast('You don\'t have ' + P.name + '.'); return false; }
    if (Game.s.ram < P.ram) { Game.toast('Not enough RAM. It comes back on its own.', 'warn'); return false; }
    if (name === 'breach') {
      if (target) { Game.s.ram -= P.ram; Fx.burst(target.x, target.y - 16, [58, 240, 224], 14); Hud.refresh(); return true; }
      const d = Actors.nearest((e) => e.type === 'drone' && !e.ally, 90);
      if (!d) { Game.toast('Nothing in reach to breach. Use it on a locked door.'); return false; }
      d.stun = 2.5; Fx.burst(d.x, d.y, [58, 240, 224], 12);
    }
    if (name === 'ghost') { Game.ghost = 6; Fx.burst(Player.x, Player.y - 16, [255, 74, 176], 14); }
    if (name === 'puppet') {
      const d = Actors.nearest((e) => e.type === 'drone' && !e.ally, 140);
      if (!d) { Game.toast('No drone near enough to take over.'); return false; }
      d.ally = 12; d.spr = null; Fx.burst(d.x, d.y, [58, 255, 128], 12); Game.toast('It\'s yours, for now.');
    }
    Game.s.ram -= P.ram; Hud.refresh(); return true;
  },
};
