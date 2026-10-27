'use strict';
// ---------------------------------------------------------------------------
// What's hostile: a table of kinds (ENEMY), how each moves and fights (Foes,
// by its `ai`), how it looks, its hurtbox, and what it leaves when it falls.
//   walker   patrols its stretch, closes in, winds up a blow (gangers)
//   shooter  keeps its distance and fires (gunners, guards with shields,
//            Meridian's enforcers)
//   charger  a walker that rushes you from further off (bruisers)
//   crawler  small and fast (spider-bots); leaper: jumps at you (ferals)
//   flyer    hovers and shoots (block drones, sentinels)
//   turret   bolted to a wall, fires bursts at what it sees
//   boss     an arena, a name on the HUD, a round of attacks
// `chrome`: implanted, so wanted; `bot`: a machine (an EMP stops it, Puppet
// can take a flyer); `tier`: how deep it's found, for what it drops.
// ---------------------------------------------------------------------------
const ENEMY = {
  drone: { name: 'Block drone', ai: 'flyer', hp: 30, speed: 46, sight: 120, fire: { cd: 1.5, dmg: 8, speed: 130 }, bot: true, center: [10, 8, 10, 6] },
  sentinel: { name: 'Sentinel', ai: 'flyer', hp: 70, speed: 62, sight: 150, fire: { cd: 1.3, dmg: 10, speed: 170, n: 3 }, bot: true, center: [13, 9, 13, 7] },
  gang: { name: 'Ganger', ai: 'walker', hp: 50, speed: 58, sight: 110, reach: 20, windup: 0.38, dmg: 12, chrome: true },
  gunner: { name: 'Gunner', ai: 'shooter', hp: 45, speed: 40, sight: 150, keep: 90, fire: { cd: 1.6, dmg: 9, speed: 150, aim: 0.45 }, chrome: true },
  bruiser: { name: 'Bruiser', ai: 'charger', hp: 150, speed: 32, sight: 130, reach: 26, windup: 0.6, dmg: 22, chrome: true, box: [9, 40] },
  spider: { name: 'Spider-bot', ai: 'crawler', hp: 22, speed: 92, sight: 120, reach: 14, windup: 0.14, dmg: 7, bot: true, box: [9, 13] },
  turret: { name: 'Turret', ai: 'turret', hp: 60, sight: 170, fire: { cd: 0.16, dmg: 7, speed: 210, burst: 4, pause: 1.8 }, bot: true, center: [8, 6, 8, 6] },
  guard: { name: 'Corp guard', ai: 'shooter', hp: 90, speed: 34, sight: 150, keep: 100, fire: { cd: 1.4, dmg: 11, speed: 170, aim: 0.5 }, shield: true },
  feral: { name: 'Feral', ai: 'leaper', hp: 42, speed: 72, sight: 120, reach: 18, windup: 0.25, dmg: 13 },
  enforcer: { name: 'Meridian enforcer', ai: 'shooter', hp: 130, speed: 66, sight: 170, keep: 110, fire: { cd: 1.0, dmg: 12, speed: 200, aim: 0.3, n: 2 }, synth: true },
  // a suspect who ran: gets away if you let them, gives up when they're hurt
  fugitive: { name: 'Fugitive', ai: 'flee', hp: 90, speed: 92, sight: 400, fire: { cd: 1.4, dmg: 8, speed: 170, aim: 0.2 }, synth: true },
  // bosses
  warden: { name: 'The Warden', ai: 'warden', hp: 420, boss: true, flag: 'warden', drop: { gear: 'helmet', cr: 150, items: { chips: 2 } } },
  king: { name: 'The Gutter King', ai: 'boss', hp: 620, boss: true, speed: 42, attacks: ['charge', 'summon', 'slam', 'burst'], summon: 'gang', box: [12, 50], flag: 'king', drop: { gear: 'katana', cr: 300 }, chrome: true },
  mayor: { name: 'The Old Mayor', ai: 'boss', hp: 760, boss: true, speed: 30, attacks: ['spray', 'summon', 'burst', 'stomp'], summon: 'spider', box: [30, 80], flag: 'mayor', drop: { items: { mayorkey: 1 }, cr: 350 } },
  foreman: { name: 'The Foreman', ai: 'boss', hp: 900, boss: true, speed: 34, attacks: ['stomp', 'charge', 'lash', 'burst'], box: [30, 80], flag: 'foreman', drop: { items: { workspass: 1 }, cr: 400, gear: 'plated' } },
  root: { name: 'The Root\'s guardian', ai: 'boss', hp: 1100, boss: true, still: true, attacks: ['lash', 'summon', 'spray', 'lash'], summon: 'spider', center: [34, 40, 34, 40], flag: 'root', drop: { items: { rootsigil: 1 }, cr: 450 } },
  halden: { name: 'Halden', ai: 'boss', hp: 1000, boss: true, speed: 80, attacks: ['leap', 'burst', 'charge', 'spray'], box: [8, 36], flag: 'halden', drop: { gear: 'synthweave', cr: 600 }, synth: true },
};
// how they look: gangers in three styles, and the rest
const LOOKS = {
  gunner: [{ skin: SKINS[1], hair: 'cap', capCol: '#3a3a3a', top: '#2a2a1e', legs: '#1a1a1e', cyArm: true, acc: '#ffd040', gun: true, visor: '#ffd040' }, { skin: SKINS[3], hair: 'undercut', hairCol: '#ff4ab0', top: '#2a1a2a', legs: '#1a1a24', eye: '#ff4ab0', gun: true }, { skin: SKINS[4], hair: 'hood', top: '#1a2a2a', legs: '#1a1a1e', cyArm: true, acc: '#3af0e0', gun: true, visor: '#3af0e0' }],
  bruiser: [{ skin: SKINS[2], hair: 'bald', top: '#2a1a1a', legs: '#1a1a1e', cyArm: 'both', acc: '#ff6a3a', tall: 1.22, wide: 2.4 }, { skin: SKINS[5], hair: 'mohawk', hairCol: '#3af0e0', top: '#1a1a1e', legs: '#1a1a24', cyArm: 'both', cyLegs: true, acc: '#3af0e0', tall: 1.22, wide: 2.4 }],
  guard: [{ skin: SKINS[0], hair: 'helmet', armor: '#2a3448', visor: '#3af0e0', top: '#2a3040', legs: '#1a1e2a', gun: true, shield: '#3a4a6a' }],
  feral: [{ skin: '#c8c0b0', hair: 'long', hairCol: '#8a8a80', top: '#4a4438', legs: '#3a342a', tall: 0.92, eye: '#c8ff60' }, { skin: '#b8b0a0', hair: 'bald', top: '#3a3a30', legs: '#2a2a22', tall: 0.88, eye: '#c8ff60' }],
  enforcer: [{ skin: '#e8d8c8', hair: 'short', hairCol: '#e8e8e8', top: '#e8e8f0', coat: 'long', collar: true, legs: '#c8c8d0', boots: '#2a2a30', eye: '#ff3040', gun: true, visor: '#ff3040' }],
  king: [{ skin: SKINS[2], hair: 'short', hairCol: '#ffd040', top: '#3a1a1a', coat: 'long', collar: true, legs: '#1a1a1e', cyArm: 'both', acc: '#ffd040', eye: '#ffd040', tall: 1.42, wide: 3 }],
  halden: [{ skin: SKINS[4], hair: 'short', hairCol: '#c8c8d0', top: '#f0f0f4', coat: 'long', collar: true, trim: true, acc: '#ff3040', legs: '#d8d8e0', boots: '#2a2a30', eye: '#ff3040', tall: 1.12 }],
};

// a sentinel: Meridian's drone, bigger, white, an amber eye
function sentinel() {
  const S = Spr.figure(30, 18, 37); S.ax = 15; S.ay = 15;
  const sb = rp('#c8ccd8', 6); S.ell(15, 9, 9, 4.6, sb); S.part(); S.box(4, 4, 26, 5, MAT.steel, { lo: 2, hi: 6 }); for (const x of [3, 27]) { S.ell(x, 4, 3.4, 1, ['#3a3a40', '#8a8a96']); S.px(x, 3, '#e8e8f0'); }
  // a seam under the eye, a Meridian mark, fins
  for (let x = 8; x < 23; x++) if (S.get(x, 11)) S.px(x, 11, sb[1]); S.px(9, 8, '#ff3040'); S.px(10, 8, '#e8e8f0'); S.px(7, 12, sb[0]); S.px(23, 12, sb[0]);
  for (let x = 13; x < 20; x++) S.px(x, 9, x === 17 ? '#fff0c0' : '#ffb040', true);
  for (let y = 13; y < 17; y++) S.px(15, y, '#ffb040', true);
  return S.done();
}
// a turret on a wall bracket, its barrel and its eye
function turret() {
  const S = Spr.figure(20, 16, 39); S.ax = 10; S.ay = 8;
  panel(S, 0, 0, 5, 15, MAT.steelD); S.ell(10, 8, 6, 5.5, rp('#4a4e58', 6)); S.box(14, 6, 19, 9, MAT.steelD, { lo: 1, hi: 5 });
  S.px(10, 7, '#ff3040', true); S.px(11, 7, '#ff8090', true); S.px(10, 8, '#ff3040', true);
  return S.done();
}
// the Root's guardian: a knot of cable round a lit core, roots into the floor
function rootCore() {
  const S = Spr.figure(90, 96, 41); S.ax = 45; S.ay = 48;
  // cables, banded where they're clamped, a lit bead now and then
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, r0 = 18, r1 = 40 + (k % 3) * 4, x0 = 45 + Math.cos(a) * r0, y0 = 48 + Math.sin(a) * r0, x1 = 45 + Math.cos(a + 0.4) * r1, y1 = 48 + Math.sin(a + 0.4) * r1 + (Math.sin(a) > 0 ? 8 : 0), w = 3 - (k % 2);
    S.part(); S.limb(x0, y0, x1, y1, w, ['#1a0e2a', '#3a1a4a', '#5a2a6a', '#8a4aa0']);
    const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (let t = 5; t < L - 2; t += 6) { const x = x0 + (x1 - x0) * t / L, y = y0 + (y1 - y0) * t / L; for (let q = -w / 2; q <= w / 2; q += 0.5) S.px(x + nx * q, y + ny * q, '#140a1e'); }
    if (k % 3 === 0) S.px(x0 + (x1 - x0) * 0.62, y0 + (y1 - y0) * 0.62, '#e8a0ff', true);
  }
  S.part(); S.ell(45, 48, 20, 20, ['#140a1e', '#2a1438', '#4a2058', '#6a3080']);
  // a ring of plates round the core, then the core and its pupil
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; S.px(45 + Math.cos(a) * 15, 48 + Math.sin(a) * 15, k % 2 ? '#140a1e' : '#6a3080'); }
  S.ell(45, 48, 11, 11, ['#140a1e', '#1e0e2a']);
  S.ell(45, 48, 9, 9, ['#5a1a8a', '#a83aff', '#e8c8ff', '#ffffff'], { glow: true });
  for (let y = 42; y <= 54; y++) for (let x = 44; x <= 46; x++) if (Math.abs(y - 48) < 6 - Math.abs(x - 45) * 2) S.px(x, y, '#2a0a44', true);
  for (let k = 0; k < 6; k++) S.px(45 + Math.cos(k) * 18, 48 + Math.sin(k) * 18, '#c87aff', true);
  return S.done();
}
// a sprite drawn bigger, pixel for pixel (for the bigger bosses)
function scaleSprite(s, k) {
  const sc = (src) => { if (!src) return null; const [c, g] = canvasOf(src.width * k, src.height * k); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, src.width * k, src.height * k); return c; };
  return Object.assign({}, s, { c: sc(s.c), e: sc(s.e), w: s.w * k, h: s.h * k, ax: s.ax * k, ay: s.ay * k });
}

const D_NAME = (e) => e.named || ENEMY[e.type].name;
const Foes = {
  def(e) { return ENEMY[e.type]; },
  // how far it sees you: less with stealthy gear, nothing under Ghost
  sees(e, r) { r *= 1 - Game.perk('stealth'); return !Game.ghost && Math.abs(Player.x - e.x) < r && Math.abs((Player.y - 16) - (this.def(e).center ? e.y : e.y - 16)) < r * 0.7; },
  // ---- awareness. A hostile doesn't fight until it knows you're there. It
  // notices you only while it's facing you (or you're right on top of it), a
  // meter filling faster up close, in light and at a run, slower walking and
  // still in the dark. Half aware, it stops and looks; full, it's alert and
  // tells the others near it. Out of its sight long enough, it gives up and
  // goes back to its rounds. Being hit or hearing a shot wakes it at once.
  // Bosses, allies and fugitives skip all this.
  lit() {
    const V = View; if (!V.limg) return 0.5;
    const i = Math.floor((Player.x - V.cx) / V.LC), j = Math.floor((Player.y - 18 - V.cy) / V.LC);
    if (i < 0 || j < 0 || i >= V.lc.width || j >= V.lc.height) return 0.5;
    const o = (j * V.lc.width + i) * 4, d = V.limg.data; return Math.max(d[o], d[o + 1], d[o + 2]) / 255;
  },
  hunts(e) { const D = this.def(e); return !(D.boss || e.ally || D.ai === 'flee' || e.type === 'warden'); },
  notice(e, D, dt) {
    const r = D.sight || 120;
    if (e.alert) {
      if (this.sees(e, r * 1.3)) e.lost = 0; else e.lost = (e.lost || 0) + dt;
      if (e.lost > 6) { e.alert = false; e.aware = 0.5; e.lookX = Player.x; e.state = 'idle'; e.aim = 0; }
      return;
    }
    const dx = Player.x - e.x, d = Math.abs(dx), close = d < 16 && Math.abs(Player.y - e.y) < 24;
    const facing = Math.sign(dx) === e.face || d < 4, v = Math.abs(Player.vx);
    if (this.sees(e, r) && (facing || close)) {
      const move = v > 64 ? 1.6 : v > 6 ? 0.75 : 0.6, light = 0.35 + 0.9 * this.lit();
      e.aware = (e.aware || 0) + dt * (facing ? 3 * (1 - 0.7 * d / r) * light * move : v > 64 ? 1.2 : 0.25);
      e.lookX = Player.x;
    } else e.aware = Math.max(0, (e.aware || 0) - dt * 0.3);
    if (e.aware >= 1) this.alarm(e);
  },
  // it knows: so do the others close by
  alarm(e, quiet) {
    if (e.alert || !this.hunts(e)) return;
    e.alert = true; e.aware = 1; e.lost = 0; e.seen = 1.2;
    if (!quiet) for (const q of Actors.enemies) if (q !== e && q.hp > 0 && !q.alert && Math.abs(q.x - e.x) < 110 && Math.abs(q.y - e.y) < 60) this.alarm(q, true);
  },
  // a shot is loud: everything near enough turns to look, and close by, knows
  noise(x, y, r) { for (const e of Actors.enemies) { if (e.hp <= 0 || !this.hunts(e) || e.alert) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < r) { e.aware = Math.max(e.aware || 0, d < r * 0.5 ? 1 : 0.6); e.lookX = x; if (e.aware >= 1) this.alarm(e); } } },
  // what's alert hunts you within its sight, whichever way it was facing
  hunt(e, r) { return (e.alert || !this.hunts(e)) && this.sees(e, e.alert ? r * 1.3 : r); },
  // from behind, unseen: put it down quietly
  canTakedown(e) { const D = this.def(e); return this.hunts(e) && !e.alert && D.ai !== 'flyer' && D.ai !== 'turret' && Math.sign(Player.x - e.x) !== e.face && Math.abs(Player.x - e.x) < 22 && Math.abs(Player.y - e.y) < 20; },
  takedown(e) { e.subdued = true; Actors.damage(e, 9999, Math.sign(e.x - Player.x) || 1); Game.toast(D_NAME(e) + ' goes down without a sound.', 'good'); },
  hurtbox(e) {
    const D = this.def(e);
    if (e.type === 'warden') return [e.x - 30, e.y - 80 - (e.hop || 0), e.x + 30, e.y - (e.hop || 0)];
    if (D.center) { const c = D.center; return [e.x - c[0], e.y - c[1], e.x + c[2], e.y + c[3]]; }
    const b = D.box || [6, 30], h = (e.hop || 0); return [e.x - b[0], e.y - b[1] - h, e.x + b[0], e.y - h];
  },
  step(e, dt) {
    const D = this.def(e);
    if (e.type === 'warden') return Actors.warden(e, dt);
    if (e.stun > 0) { if (D.ai === 'flyer') e.y += Math.sin(e.t * 20) * 0.3; return; }
    if (this.hunts(e)) { this.notice(e, D, dt); if (e.seen > 0) e.seen -= dt; }
    this[D.ai](e, dt, D);
  },
  // walk along its stretch of floor, never off it
  move(e, dt) { const r = e.range || [e.x - 80, e.x + 80], nx = clamp(e.x + e.vx * dt, r[0], r[1]); if (!World.hits(nx - 5, e.y - 28, nx + 5, e.y - 1)) e.x = nx; e.moving = Math.abs(e.vx) > 5; e.walked = (e.walked || 0) + Math.abs(e.vx * dt); },
  patrol(e, D) {
    // half aware: stop, and look where it saw something
    if (!e.alert && e.aware > 0.3) { e.vx = 0; e.face = Math.sign((e.lookX === undefined ? Player.x : e.lookX) - e.x) || e.face; return; }
    const r = e.range || [e.x - 80, e.x + 80]; e.vx = (e.dir || 1) * D.speed * 0.45; if (e.x >= r[1] - 1) e.dir = -1; if (e.x <= r[0] + 1) e.dir = 1; e.face = e.dir || 1; },
  // a blow lands if you're still in front of it when the wind-up ends
  blow(e, D, reach, dmg) { const x0 = e.face > 0 ? e.x : e.x - reach, pb = Player.box(); if (pb[2] > x0 && pb[0] < x0 + reach && Math.abs(Player.y - e.y) < 22) Game.hurt(dmg, e); },
  walker(e, dt, D) {
    const near = this.hunt(e, D.sight) && Math.abs(Player.y - e.y) < 26;
    e.vx *= Math.pow(0.002, dt);
    if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { e.state = 'rest'; e.st = 0.6; this.blow(e, D, D.reach + 2, D.dmg); } }
    else if (e.state === 'rest') { e.st -= dt; if (e.st <= 0) e.state = 'idle'; }
    else if (e.state === 'dash') { e.st -= dt; e.vx = e.face * 170; if (Math.abs(Player.x - e.x) < 16 && Math.abs(Player.y - e.y) < 24) { Game.hurt(Math.round(D.dmg * 1.2), e); e.state = 'rest'; e.st = 0.9; } if (e.st <= 0) { e.state = 'rest'; e.st = 0.8; } }
    else if (near) {
      e.face = Math.sign(Player.x - e.x) || e.face; const d = Math.abs(Player.x - e.x);
      e.cd = (e.cd || 0) - dt;
      if (d < D.reach) { e.state = 'wind'; e.st = D.windup; e.vx = 0; }
      else if (D.ai === 'charger' && d > 50 && d < 140 && e.cd <= 0) { e.state = 'dash'; e.st = 0.55; e.cd = 3; Game.toast(D.name + ' charges!', 'warn'); }
      else if (D.ai === 'leaper' && d > 30 && d < 100 && e.cd <= 0) { e.leap = 0.6; e.cd = 2.2; e.vx = e.face * 150; }
      else e.vx = e.face * D.speed;
    } else this.patrol(e, D);
    if (e.leap > 0) { e.leap -= dt; e.hop = Math.sin((1 - e.leap / 0.6) * Math.PI) * 26; e.vx = e.face * 150; if (e.leap <= 0) { e.hop = 0; if (Math.abs(Player.x - e.x) < 18 && Math.abs(Player.y - e.y) < 24) Game.hurt(D.dmg, e); } }
    this.move(e, dt);
  },
  charger(e, dt, D) { this.walker(e, dt, D); },
  crawler(e, dt, D) { this.walker(e, dt, D); e.hop = e.moving ? Math.abs(Math.sin(e.t * 18)) * 1.5 : 0; },
  leaper(e, dt, D) { this.walker(e, dt, D); },
  // fire at the runner, a few bolts fanned a little
  shoot(e, D, ox, oy) { const F = D.fire, n = F.n || 1; for (let k = 0; k < n; k++) { const a = Math.atan2(Player.y - 16 - (e.y + oy), Player.x - (e.x + ox)) + (k - (n - 1) / 2) * 0.12; Actors.bolts.push({ x: e.x + ox, y: e.y + oy, vx: Math.cos(a) * F.speed, vy: Math.sin(a) * F.speed, t: 2.4, dmg: F.dmg, c: [255, 60, 80] }); } Game.flash = { x: e.x + ox, y: e.y + oy, t: 0.05 }; },
  shooter(e, dt, D) {
    const near = this.hunt(e, D.sight) && Math.abs(Player.y - e.y) < 60, F = D.fire;
    e.vx *= Math.pow(0.002, dt);
    if (near) {
      e.face = Math.sign(Player.x - e.x) || e.face; const d = Math.abs(Player.x - e.x);
      if (e.aim > 0) { e.aim -= dt; e.vx = 0; if (e.aim <= 0) { this.shoot(e, D, e.face * 10, -21); e.cd = F.cd; } }
      else {
        e.cd = (e.cd === undefined ? 0.6 : e.cd) - dt;
        if (d > D.keep + 24) e.vx = e.face * D.speed; else if (d < D.keep - 30) e.vx = -e.face * D.speed * 0.7; else e.vx = 0;
        if (e.cd <= 0 && d < D.sight) e.aim = F.aim;
      }
    } else { e.aim = 0; this.patrol(e, D); }
    e.aiming = e.aim > 0;
    this.move(e, dt);
  },
  flyer(e, dt, D) {
    const F = D.fire;
    if (e.ally) {
      const t = Actors.nearestTo(e, (q) => q !== e && !q.ally && q.hp > 0, 160);
      const gx = t ? t.x - Math.sign(t.x - e.x || 1) * 50 : Player.x - Player.face * 20, gy = (t ? t.y - 16 : Player.y - 46) - 6;
      e.x += clamp(gx - e.x, -70 * dt, 70 * dt); e.y += clamp(gy - e.y, -50 * dt, 50 * dt);
      e.cd -= dt; if (t && e.cd <= 0) { e.cd = 0.8; Actors.fire(e, t.x, t.y - 10, 160, 14, true); }
      return;
    }
    if (this.hunt(e, D.sight)) {
      const gx = Player.x - Math.sign(Player.x - e.x || 1) * 56, gy = Player.y - 26 + Math.sin(e.t * 2) * 5;
      e.x += clamp(gx - e.x, -D.speed * dt, D.speed * dt); e.y += clamp(gy - e.y, -D.speed * 0.8 * dt, D.speed * 0.8 * dt); e.face = Math.sign(Player.x - e.x) || e.face;
      e.cd -= dt; if (e.cd <= 0) { e.cd = F.cd; this.shoot(e, D, 0, 0); }
    } else {
      const r = e.range || [e.x - 100, e.x + 100];
      e.x += (e.dir || 1) * 26 * dt; if (e.x > r[1]) e.dir = -1; if (e.x < r[0]) e.dir = 1; e.face = e.dir || 1;
      if (e.home === undefined) e.home = e.y;
      e.y += Math.sin(e.t * 1.7) * 6 * dt + clamp(e.home - e.y, -10 * dt, 10 * dt);
    }
  },
  turret(e, dt, D) {
    const F = D.fire;
    if (!this.hunt(e, D.sight)) { e.n = 0; e.cd = Math.max(e.cd, 0.4); return; }
    e.face = Math.sign(Player.x - e.x) || e.face; e.cd -= dt;
    if (e.cd <= 0) { this.shoot(e, D, e.face * 9, 0); e.n = (e.n || 0) + 1; if (e.n >= F.burst) { e.n = 0; e.cd = F.pause; } else e.cd = F.cd; }
  },
  // run: away from you, to the end of the level, shooting back now and then
  flee(e, dt, D) {
    const L = World.L, away = Math.sign(e.x - Player.x) || 1, d = Math.abs(Player.x - e.x);
    e.face = away; e.vx = away * D.speed * (d < 160 ? 1 : 0.55); e.cd = (e.cd || 1) - dt;
    if (d < 120 && e.cd <= 0) { e.face = -away; this.shoot(e, D, -away * 10, -21); e.cd = D.fire.cd; }
    e.range = [30, L.w - 30]; this.move(e, dt);
    if ((e.x <= 31 || e.x >= L.w - 31) && d > 100) { e.hp = 0; Cases.escaped(e.caseId); }
  },
  // bosses: wake when you come into their arena, then a round of attacks
  boss(e, dt, D) {
    const A = e.arena || [e.x - 200, e.x + 200], inArena = Player.x > A[0] && Player.x < A[1];
    if (e.state === 'idle') { if (inArena) { e.state = 'move'; e.st = 1.2; e.k = 0; Game.toast(D.name.toUpperCase() + (D.line ? ': ' + D.line : ''), 'warn'); } return; }
    e.st -= dt; e.face = Math.sign(Player.x - e.x) || e.face;
    const B = this.hurtbox(e), touch = Player.x > B[0] - 4 && Player.x < B[2] + 4 && Player.y > B[1] && Player.y - 30 < B[3];
    if (touch && e.state !== 'move') Game.hurt(e.state === 'charge' ? 22 : 12, e);
    if (e.state === 'move') { if (!D.still && Math.abs(Player.x - e.x) > 60) e.x = clamp(e.x + e.face * D.speed * dt, A[0] + 30, A[1] - 30); if (e.st <= 0) { e.state = D.attacks[e.k % D.attacks.length]; e.k++; e.st = { burst: 1.2, spray: 1.1, stomp: 1.1, charge: 1.0, summon: 0.8, slam: 0.9, lash: 1.4, leap: 1.0 }[e.state]; e.n = 0; } return; }
    const top = B[1] + (B[3] - B[1]) * 0.35, mx = e.x + e.face * (B[2] - B[0]) * 0.45;
    if (e.state === 'burst') { if (e.st < 1.0 - e.n * 0.25 && e.n < 4) { e.n++; Actors.fire({ x: mx, y: top }, Player.x, Player.y - 16, 170, 10); Game.flash = { x: mx, y: top, t: 0.06 }; } }
    if (e.state === 'spray') { if (e.st < 0.6 && !e.n) { e.n = 1; for (let k = -3; k <= 3; k++) { const a = Math.atan2(Player.y - 16 - top, Player.x - mx) + k * 0.16; Actors.bolts.push({ x: mx, y: top, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, t: 2.4, dmg: 9, c: [255, 120, 60] }); } } }
    if (e.state === 'stomp' || e.state === 'slam') { const t = 1 - e.st; e.hop = t < 0.45 ? Math.sin((t / 0.45) * Math.PI) * (e.state === 'stomp' ? 24 : 10) : 0; if (t >= 0.45 && !e.n) { e.n = 1; for (const d of [-1, 1]) Actors.bolts.push({ x: e.x + d * 24, y: e.y - 4, vx: d * 170, vy: 0, t: 1.6, dmg: 15, wave: true, c: [255, 180, 60] }); Fx.sparks(e.x, e.y - 2, 14); } }
    if (e.state === 'charge' && !D.still) { if (e.st < 0.75) e.x = clamp(e.x + e.face * 200 * dt, A[0] + 30, A[1] - 30); }
    if (e.state === 'leap' && !D.still) { const t = 1 - e.st; if (!e.n) { e.n = 1; e.lx = e.x; e.tx = clamp(Player.x, A[0] + 30, A[1] - 30); } e.x = e.lx + (e.tx - e.lx) * clamp(t / 0.7, 0, 1); e.hop = t < 0.7 ? Math.sin((t / 0.7) * Math.PI) * 60 : 0; if (t >= 0.7 && e.n === 1) { e.n = 2; for (const d of [-1, 1]) Actors.bolts.push({ x: e.x + d * 16, y: e.y - 4, vx: d * 190, vy: 0, t: 1.2, dmg: 14, wave: true, c: [255, 80, 80] }); } }
    if (e.state === 'summon') { if (!e.n && e.st < 0.5) { e.n = 1; const live = Actors.enemies.filter((q) => q.minion && q.hp > 0).length; if (live < 4) for (const d of [-1, 1]) Actors.spawn(D.summon, clamp(e.x + d * 70, A[0] + 20, A[1] - 20), e.ground || e.y, { minion: true, range: [A[0] + 10, A[1] - 10] }); Fx.burst(e.x, top, [255, 120, 200], 16); } }
    if (e.state === 'lash') {
      // a warning line at your height, then the lash along it
      if (!e.n) { e.n = 1; e.ly = Player.y - 14; } e.lashY = e.ly; e.lashOn = e.st < 0.5;
      if (e.lashOn && Math.abs(Player.y - 14 - e.ly) < 12 && Player.x > A[0] && Player.x < A[1]) Game.hurt(16, e);
    } else e.lashY = null;
    if (e.st <= 0) { e.state = 'move'; e.st = D.still ? 0.9 : 1.3; e.hop = 0; e.lashY = null; }
  },
  // looks: each kind and pose, cached
  art(e) {
    const D = this.def(e), left = e.face < 0;
    let pose = 'stand';
    if (e.state === 'wind' || (e.type === 'halden' && ['charge', 'leap'].includes(e.state))) pose = 'strike';
    else if (e.aiming) pose = 'aim';
    else if (e.moving || e.state === 'dash') pose = (Math.abs(e.vx) > 45 ? 'run' : 'walk') + (Math.floor((e.walked || 0) / (Math.abs(e.vx) > 45 ? 6.5 : 4.6)) % 6);
    const v = e.look ? 'x' + e.i : (e.i % ((LOOKS[e.type] || GANG_LOOKS).length || 1));
    const k = e.type + v + pose + (left ? 'L' : 'R') + (e.ally ? 'a' : '');
    if (!this.cache) this.cache = new Map();
    if (!this.cache.has(k) && e.lastArt && !Actors.budget()) return e.lastArt;
    let s = this.cache.get(k);
    if (!s) {
      if (e.type === 'drone') s = drone({ eye: e.ally ? '#3aff80' : '#ff3040', light: e.ally ? '#3aff80' : null });
      else if (e.type === 'sentinel') s = sentinel();
      else if (e.type === 'spider') s = spider({});
      else if (e.type === 'turret') s = turret();
      else if (e.type === 'warden') s = mech({});
      else if (e.type === 'mayor') s = mech({ col: '#a88a5a', eye: '#3aff80' });
      else if (e.type === 'foreman') s = mech({ col: '#e8b030', eye: '#ff8040' });
      else if (e.type === 'root') s = rootCore();
      else {
        const base = e.type === 'gang' ? GANG_LOOKS : LOOKS[e.type] || SUSPECT_LOOKS, look = Object.assign({}, base[e.i % base.length], e.look || {});
        const hands = pose === 'strike' ? { fx: 31, fy: 30 } : pose === 'aim' ? { fx: 30, fy: 29, bx: 17, by: 36 } : undefined;
        s = person(Object.assign(look, { pose, hands, seed: 40 + e.i, blade: pose === 'strike' ? (look.blade || (e.type === 'halden' ? '#ff3040' : '#c8c8d0')) : look.blade }));
      }
      if (left) s = flipSprite(s);
      this.cache.set(k, s);
    }
    return (e.lastArt = s);
  },
  // what it leaves: bodies of people, loot by depth, a boss's drop and flag
  die(e) {
    const D = this.def(e), tier = Quests.tier(World.L.id);
    Fx.burst(e.x, D.center ? e.y : e.y - 16, D.bot ? [255, 200, 90] : [255, 160, 60], D.boss ? 40 : 14);
    if (!D.bot && D.ai !== 'flyer' && !D.boss) Actors.bodies.push({ x: e.x, y: e.y, face: e.face, i: e.i, type: e.type, look: e.look });
    if (D.boss) {
      if (D.flag) Game.s.flags[D.flag] = true;
      const d = D.drop || {}; if (d.cr) Game.s.cr += d.cr; if (d.items) for (const k in d.items) Game.give(k, d.items[k]); if (d.gear) Game.giveGear(d.gear);
      Game.toast(D.name + ' goes down.' + (d.items ? ' It drops ' + Object.keys(d.items).map((k) => ITEM[k].name.toLowerCase()).join(', ') + '.' : ''), 'good');
      Actors.boss = null; Game.kill(e.type, e); Save.write(); Hud.refresh(); return;
    }
    if (e.minion) { Game.kill(e.type, e); return; }
    const got = Game.loot(tier, hash(e.i, Game.s.day, e.type.length + Math.round(e.x)), e.named || e.warrant ? 3 : D.bot ? 0.6 : 0.8);
    Game.toast((e.named ? e.named + ' is down. ' : '') + '+ ' + got.join(', '));
    Game.kill(e.type, e); Hud.refresh();
  },
};
