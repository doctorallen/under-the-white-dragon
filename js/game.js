'use strict';
// ---------------------------------------------------------------------------
// The game's state and its rules. Game.s is everything a save keeps: where
// you are, your health and money, the pack and the stash, your ware and
// programs, what's been done to the city (props by id, flags), the jobs, and
// the time of day.
// ---------------------------------------------------------------------------
const Game = {
  frame: 0, t: 0, acc: 0, last: 0, paused: false, fade: 0, fadeTo: null,
  s: null, cam: { x: 0, y: 0 }, toasts: [], particles: [], ghost: 0,
  fresh() {
    return {
      v: 2, level: 'stack', spawn: 'capsule', px: 0, py: 0, hp: T.player.hp, cr: 40, ram: T.ram.max,
      pack: {}, stash: {}, mods: { owned: {}, on: {} }, programs: {}, prog: null,
      done: {}, flags: {}, jobs: { taken: {}, done: {}, kills: {} }, time: T.day.start, day: 1, deaths: 0,
    };
  },
  // ---- ware ----
  has(mod) { return !!this.s.mods.on[mod]; },
  flag(f) { return !!this.s.flags[f]; },
  neuralCap() { return T.neural.base + (this.s.flags.booster ? T.neural.booster : 0); },
  neuralLoad() { let n = 0; for (const m in this.s.mods.on) if (this.s.mods.on[m]) n += MODS[m].load; return n; },
  stage() { return { eye: this.has('lowlight'), legs: this.has('spring'), arm: this.has('mantis') }; },
  // ---- the pack ----
  packCount() { let n = 0; for (const k in this.s.pack) n += this.s.pack[k]; return n; },
  give(item, n) { const room = T.pack.cap - this.packCount(), k = Math.min(n, room); if (k <= 0) { this.toast('Your pack is full. Stash it or sell it.', 'warn'); return 0; } this.s.pack[item] = (this.s.pack[item] || 0) + k; this.checkJobs(); Hud.refresh(); return k; },
  canPay(cost) { for (const k in cost) { if (k === 'cr') { if (this.s.cr < cost.cr) return false; } else if ((this.s.pack[k] || 0) + (this.s.stash[k] || 0) < cost[k]) return false; } return true; },
  // pay from the pack first, then the stash
  pay(cost) {
    if (!this.canPay(cost)) return false;
    for (const k in cost) { if (k === 'cr') { this.s.cr -= cost.cr; continue; } let left = cost[k]; const a = Math.min(left, this.s.pack[k] || 0); this.s.pack[k] = (this.s.pack[k] || 0) - a; left -= a; this.s.stash[k] = (this.s.stash[k] || 0) - left; }
    Hud.refresh(); return true;
  },
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
    if (r.chips) { this.s.stash.chips = (this.s.stash.chips || 0) + r.chips; got.push(r.chips + ' chips to your stash'); }
    if (r.booster) { this.s.flags.booster = true; got.push('a neural booster: your nervous system takes one more point of ware'); }
    this.toast('Job done: ' + j.title + '. ' + got.join(', ') + '.', 'good');
    Hud.refresh(); Save.write();
  },
  kill(type) { for (const j of JOBS) if (j.kills && j.kills[type] && this.s.jobs.taken[j.id] && !this.s.jobs.done[j.id]) { const k = j.id + ':' + type; this.s.jobs.kills[k] = (this.s.jobs.kills[k] || 0) + 1; if (this.s.jobs.kills[k] === j.kills[type]) this.toast(j.title + ': done. Go and see Juno.', 'good'); } },
  checkJobs() { for (const j of JOBS) if (this.s.jobs.taken[j.id] && !this.s.jobs.done[j.id] && !this.s.jobs['said:' + j.id] && this.jobReady(j)) { this.s.jobs['said:' + j.id] = true; this.toast(j.title + ': you have what Juno wants.', 'good'); } },
  // ---- the clock ----
  hour() { return this.s.time % 24; },
  clock() { const h = Math.floor(this.hour()), m = Math.floor((this.hour() % 1) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); },
  pass(hours) { this.s.time += hours; while (this.s.time >= 24) { this.s.time -= 24; this.s.day++; } },
  // ---- moving between levels ----
  go(level, spawn) { this.fadeTo = { level, spawn }; this.fade = 0.001; },
  arrive(level, spawn) {
    this.s.level = level; World.load(level);
    const sp = World.L.spawns[spawn] || Object.values(World.L.spawns)[0];
    Player.place(sp[0], sp[1]); Actors.load();
    this.cam.x = Player.x; this.cam.y = Player.y - 30;
    Hud.refresh(); Save.write();
    this.toast(LEVELS[level].name + ' · ' + LEVELS[level].depth);
  },
  hurt(n, from) {
    if (Player.inv > 0 || this.paused) return;
    this.s.hp -= n; Player.inv = T.player.iframes; Player.hurtT = 0.25;
    if (from) { Player.vx = Math.sign(Player.x - from.x || 1) * 110; Player.vy = -120; }
    Fx.burst(Player.x, Player.y - 16, [255, 60, 80], 8);
    if (this.s.hp <= 0) this.die();
    Hud.refresh();
  },
  die() {
    this.s.deaths++; this.s.hp = T.player.hp; this.s.pack = {}; this.s.ram = T.ram.max; this.pass(6);
    this.toast('You wake in your capsule, sore, with an empty pack. Somebody carried you home.', 'warn');
    this.go('stack', 'capsule');
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
