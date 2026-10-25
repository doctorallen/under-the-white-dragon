'use strict';
// ---------------------------------------------------------------------------
// Everyone else. People keep a daily schedule (where to be, what to do,
// when to go home); some sell things, fix your ware, or give out work.
// Enemies: block drones that hover and shoot, gangers that close in with
// blades, and the Warden, the security mech in the Stack's service yard.
// ---------------------------------------------------------------------------
const NPC_ROLE = {
  noodles: { verb: 'Eat', prompt: () => 'Noodles · 12 cr', use: (n) => { if (Game.s.hp >= T.player.hp) { Actors.say(n, 'You\'re fine. Come back hungry.'); return; } if (!Game.pay({ cr: 12 })) { Actors.say(n, 'Twelve. You don\'t have twelve.'); return; } Game.s.hp = Math.min(T.player.hp, Game.s.hp + 50); Hud.refresh(); Actors.say(n, 'Eat. Slowly.'); } },
  vendor: { verb: 'Trade', prompt: (n) => 'Trade with ' + n.def.name, use: (n) => Hud.toggle('vendor', n) },
  fixer: { verb: 'Jobs', prompt: () => 'Talk to Juno', use: (n) => Hud.toggle('fixer', n) },
  doc: { verb: 'Mods', prompt: () => 'See the ripperdoc', use: (n) => Hud.toggle('doc', n) },
};
const GANG_LOOKS = [
  { skin: SKINS[5], hair: 'mohawk', hairCol: '#3af0e0', hairGlow: true, top: '#1a1a1e', legs: '#2a1a1e', cyArm: true, blade: '#3af0e0', acc: '#3af0e0', wide: 1 },
  { skin: SKINS[2], hair: 'short', hairCol: '#1a1a1a', top: '#3a1a1a', legs: '#1a1a1e', blade: '#ff4ab0', acc: '#ff4ab0', mask: '#2a2a2a', wide: 1 },
  { skin: SKINS[0], hair: 'bob', hairCol: '#ff4ab0', top: '#2a1a2a', legs: '#1a1a1e', cyLegs: true, blade: '#ff4ab0', acc: '#ff4ab0', eye: '#ff4ab0' },
];

const Actors = {
  npcs: [], enemies: [], bolts: [], boss: null,
  load() {
    const L = World.L;
    this.npcs = L.npcs.map((def, i) => ({ def, i, x: def.x, y: def.y, face: def.face || 1, hidden: false, tx: def.x, wt: 0, bubble: null, line: 0, art: new Map() }));
    for (const n of this.npcs) { const e = this.entry(n); if (e && e[3] === 'away') { n.x = e[2]; n.hidden = true; } else if (e) n.x = e[2]; }
    this.enemies = []; this.bolts = []; this.boss = null;
    L.enemies.forEach((d, i) => {
      if (d.type === 'warden' && Game.flag('warden')) return;
      const e = Object.assign({ i, x: d.x, y: d.y, vx: 0, vy: 0, face: -1, hp: 0, max: 0, cd: 1 + i * 0.3, t: hash(i, 3, 7) * 6, stun: 0, ally: 0, flash: 0, state: 'idle', st: 0 }, d);
      e.max = e.hp = { drone: 30, gang: 50, warden: 420 }[d.type];
      if (d.type === 'warden') this.boss = e;
      this.enemies.push(e);
    });
  },
  entry(n) { const h = Game.hour(); for (const e of n.def.sched) if (h >= e[0] && h < e[1]) return e; return n.def.sched[0]; },
  nearest(test, r) { let best = null, bd = r; for (const e of this.enemies) { if (!test(e)) continue; const d = Math.hypot(e.x - Player.x, (e.y - 10) - (Player.y - 16)); if (d < bd) { bd = d; best = e; } } return best; },
  say(n, text) { n.bubble = { text, t: 3.6 }; },
  talk(n) {
    if (n.def.role) { NPC_ROLE[n.def.role].use(n); return; }
    const L = n.def.lines; this.say(n, L[n.line % L.length]); n.line++;
    n.face = Math.sign(Player.x - n.x) || n.face;
  },
  step(dt) {
    // ---- people
    for (const n of this.npcs) {
      if (n.bubble) { n.bubble.t -= dt; if (n.bubble.t <= 0) n.bubble = null; }
      const e = this.entry(n), act = e[3];
      let tx = e[2];
      if (act === 'wander') { n.wt -= dt; if (n.wt <= 0) { n.wt = 3 + hash(n.i, Game.frame, 2) * 5; n.tx = e[2] + (hash(n.i, Game.frame, 3) - 0.5) * 120; } tx = n.tx; }
      const d = tx - n.x;
      if (Math.abs(d) > 2 && !n.bubble) { n.x += Math.sign(d) * Math.min(Math.abs(d), 26 * dt); n.face = Math.sign(d); n.moving = true; n.walked = (n.walked || 0) + 26 * dt; if (n.hidden) n.hidden = false; }
      else { n.moving = false; if (act === 'away') n.hidden = true; else n.hidden = false; if (Math.abs(Player.x - n.x) < 40 && Math.abs(Player.y - n.y) < 20 && act !== 'work' && act !== 'sit') n.face = Math.sign(Player.x - n.x) || n.face; else if (act === 'stand' && !n.def.face && hash(n.i, Math.floor(Game.t * 0.25), 3) < 0.35) n.face = hash(n.i, Math.floor(Game.t * 0.25), 4) < 0.5 ? -1 : 1; }
      n.act = act;
    }
    // ---- enemies
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt); e.stun = Math.max(0, e.stun - dt); e.t += dt;
      if (e.ally) { e.ally = Math.max(0, e.ally - dt); if (!e.ally) e.spr = null; }
      if (e.type === 'drone') this.drone(e, dt);
      if (e.type === 'gang') this.gang(e, dt);
      if (e.type === 'warden') this.warden(e, dt);
    }
    // ---- bolts
    for (const b of this.bolts) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.t -= dt;
      if (World.hits(b.x - 1, b.y - 1, b.x + 1, b.y + 1)) b.t = 0;
      if (b.ally) { for (const e of this.enemies) if (!e.ally && e.hp > 0 && this.inBox(b.x, b.y, this.hurtbox(e))) { this.damage(e, b.dmg, Math.sign(b.vx)); b.t = 0; break; } }
      else { const pb = Player.box(); if (b.x > pb[0] && b.x < pb[2] && b.y > pb[1] && b.y < pb[3]) { Game.hurt(b.dmg, b); b.t = 0; } }
    }
    this.bolts = this.bolts.filter((b) => b.t > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  },
  sees(e, r) { return !Game.ghost && Math.abs(Player.x - e.x) < r && Math.abs((Player.y - 16) - e.y) < r * 0.7; },
  fire(e, tx, ty, speed, dmg, ally) { const a = Math.atan2(ty - e.y, tx - e.x); this.bolts.push({ x: e.x + Math.cos(a) * 8, y: e.y + Math.sin(a) * 8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, t: 2.4, dmg, ally: !!ally, c: ally ? [90, 255, 140] : [255, 60, 80] }); },
  drone(e, dt) {
    if (e.stun) { e.y += Math.sin(e.t * 20) * 0.3; return; }
    const r = e.range;
    if (e.ally) {
      const t = this.nearestTo(e, (q) => q !== e && !q.ally && q.hp > 0, 160);
      const gx = t ? t.x - Math.sign(t.x - e.x || 1) * 50 : Player.x - Player.face * 20, gy = (t ? t.y : Player.y - 46) - 6;
      e.x += clamp(gx - e.x, -70 * dt, 70 * dt); e.y += clamp(gy - e.y, -50 * dt, 50 * dt);
      e.cd -= dt; if (t && e.cd <= 0) { e.cd = 0.8; this.fire(e, t.x, t.y - 10, 160, 14, true); }
      return;
    }
    if (this.sees(e, 120)) {
      const gx = Player.x - Math.sign(Player.x - e.x || 1) * 56, gy = Player.y - 26 + Math.sin(e.t * 2) * 5;
      e.x += clamp(gx - e.x, -46 * dt, 46 * dt); e.y += clamp(gy - e.y, -36 * dt, 36 * dt); e.face = Math.sign(Player.x - e.x) || e.face;
      e.cd -= dt; if (e.cd <= 0) { e.cd = 1.5; this.fire(e, Player.x, Player.y - 16, 130, 8); }
    } else {
      e.x += (e.dir || 1) * 26 * dt; if (e.x > r[1]) e.dir = -1; if (e.x < r[0]) e.dir = 1; e.face = e.dir || 1;
      e.y += Math.sin(e.t * 1.7) * 6 * dt + clamp(e.home === undefined ? 0 : e.home - e.y, -10 * dt, 10 * dt);
      if (e.home === undefined) e.home = e.y;
    }
  },
  gang(e, dt) {
    if (e.stun) return;
    const r = e.range, near = this.sees(e, 110) && Math.abs(Player.y - e.y) < 24;
    e.vx *= Math.pow(0.002, dt);
    if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { e.state = 'rest'; e.st = 0.7; const x0 = e.face > 0 ? e.x : e.x - 22, pb = Player.box(); if (pb[2] > x0 && pb[0] < x0 + 22 && Math.abs(Player.y - e.y) < 20) Game.hurt(12, e); } }
    else if (e.state === 'rest') { e.st -= dt; if (e.st <= 0) e.state = 'idle'; }
    else if (near) {
      e.face = Math.sign(Player.x - e.x) || e.face;
      if (Math.abs(Player.x - e.x) < 20) { e.state = 'wind'; e.st = 0.38; }
      else e.vx = e.face * 58;
    } else { e.vx = (e.dir || 1) * 26; if (e.x > r[1]) e.dir = -1; if (e.x < r[0]) e.dir = 1; e.face = e.dir || 1; }
    const nx = e.x + e.vx * dt; if (!World.hits(nx - 5, e.y - 28, nx + 5, e.y - 1)) e.x = nx;
    e.moving = Math.abs(e.vx) > 5; e.walked = (e.walked || 0) + Math.abs(e.vx * dt);
  },
  warden(e, dt) {
    const A = e.arena, inArena = Player.x > A[0] && Player.x < A[1];
    if (e.state === 'idle') { if (inArena) { e.state = 'walk'; e.st = 1.5; Game.toast('THE WARDEN: Unauthorised presence. Lethal response authorised.', 'warn'); } return; }
    if (e.stun) return;
    e.face = Math.sign(Player.x - e.x) || e.face; e.st -= dt;
    const touch = Math.abs(Player.x - e.x) < 30 && Player.y > e.y - 70;
    if (touch) Game.hurt(e.state === 'charge' ? 20 : 10, e);
    if (e.state === 'walk') { if (Math.abs(Player.x - e.x) > 50) e.x += e.face * 30 * dt; if (e.st <= 0) { const k = Math.floor(e.t * 7) % 3; e.state = ['burst', 'stomp', 'charge'][k]; e.st = [1.2, 1.1, 1.0][k]; e.n = 0; e.y0 = e.y; } }
    else if (e.state === 'burst') { if (e.st < 1.0 - e.n * 0.28 && e.n < 3) { e.n++; this.fire({ x: e.x + e.face * 34, y: e.y - 50 }, Player.x, Player.y - 16, 150, 10); Game.flash = { x: e.x + e.face * 38, y: e.y - 50, t: 0.06 }; } if (e.st <= 0) { e.state = 'walk'; e.st = 1.6; } }
    else if (e.state === 'stomp') { const t = 1.1 - e.st; e.hop = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) * 26 : 0; if (t >= 0.5 && !e.landed) { e.landed = true; for (const d of [-1, 1]) this.bolts.push({ x: e.x + d * 30, y: e.y - 4, vx: d * 170, vy: 0, t: 1.6, dmg: 15, wave: true, c: [255, 180, 60] }); Fx.sparks(e.x, e.y - 2, 14); } if (e.st <= 0) { e.landed = false; e.hop = 0; e.state = 'walk'; e.st = 1.4; } }
    else if (e.state === 'charge') { if (e.st < 0.75) { const nx = e.x + e.face * 190 * dt; e.x = clamp(nx, A[0] + 30, A[1] - 30); } if (e.st <= 0) { e.state = 'walk'; e.st = 1.8; } }
  },
  nearestTo(a, test, r) { let best = null, bd = r; for (const e of this.enemies) { if (!test(e)) continue; const d = Math.hypot(e.x - a.x, e.y - a.y); if (d < bd) { bd = d; best = e; } } return best; },
  hurtbox(e) { if (e.type === 'drone') return [e.x - 10, e.y - 8, e.x + 10, e.y + 6]; if (e.type === 'warden') return [e.x - 30, e.y - 80 - (e.hop || 0), e.x + 30, e.y - (e.hop || 0)]; return [e.x - 6, e.y - 30, e.x + 6, e.y]; },
  inBox(x, y, b) { return x > b[0] && x < b[2] && y > b[1] && y < b[3]; },
  // the runner's strike: true if it hit anything
  hit(box, dmg, face) {
    let any = false;
    for (const e of this.enemies) { if (e.ally) continue; const b = this.hurtbox(e); if (box[2] > b[0] && box[0] < b[2] && box[3] > b[1] && box[1] < b[3]) { this.damage(e, dmg, face); any = true; } }
    return any;
  },
  damage(e, dmg, face) {
    e.hp -= dmg; e.flash = 0.12;
    if (e.type === 'gang') { e.vx = face * T.strike.knock; e.state = 'rest'; e.st = 0.35; }
    if (e.type === 'drone') { e.x += face * 6; e.stun = Math.max(e.stun, 0.2); }
    if (e.hp <= 0) this.die(e);
  },
  die(e) {
    Fx.burst(e.x, e.y - (e.type === 'drone' ? 0 : 16), [255, 160, 60], e.type === 'warden' ? 40 : 14);
    if (e.type === 'drone') { const got = []; if (Game.give('glass', 1)) got.push('1 optic glass'); if (hash(e.i, Game.s.day, 3) < 0.5 && Game.give('chips', 1)) got.push('1 chips'); if (got.length) Game.toast('Drone down. + ' + got.join(', ')); Game.kill('drone'); }
    if (e.type === 'gang') { const cr = 10 + Math.floor(hash(e.i, Game.s.day, 4) * 20); Game.s.cr += cr; Game.give('alloy', 1); Game.toast('+ ' + cr + ' cr, 1 scrap alloy'); Game.kill('gang'); }
    if (e.type === 'warden') { Game.s.flags.warden = true; Game.s.cr += 150; Game.give('chips', 2); Game.toast('The Warden goes down hard. Its lock on the shaft hatch lets go. + 150 cr, 2 chips', 'good'); this.boss = null; Save.write(); }
    Hud.refresh();
  },
  // sprites for each, cached
  art(n, pose, left) {
    const k = pose + (left ? 'L' : 'R'); let s = n.art.get(k);
    if (!s) { const look = Object.assign({}, n.def.look, { pose: pose === 'work' ? 'breathe' : pose, seed: 20 + n.i }); if (pose === 'work') { const hd = look.hands || {}; look.hands = Object.assign({}, hd, { fy: (hd.fy || 38) - 3, fx: (hd.fx || 25) + 1 }); } if (n.def.smoke && pose !== 'work') look.hands = Object.assign({}, look.hands || {}, { fx: 26, fy: 27 }); s = person(look); if (left) s = flipSprite(s); n.art.set(k, s); }
    return s;
  },
  enemyArt(e) {
    const left = e.face < 0, k = e.type + (left ? 'L' : 'R') + (e.ally ? 'a' : '') + (e.type === 'gang' ? (e.state === 'wind' ? 's' : e.moving ? (Math.abs(e.vx) > 45 ? 'r' : 'w') + (Math.floor(e.walked / (Math.abs(e.vx) > 45 ? 6.5 : 4.6)) % 6) : 'i') : '');
    if (!this.cache) this.cache = new Map();
    let s = this.cache.get(k + (e.type === 'gang' ? e.i % 3 : ''));
    if (!s) {
      if (e.type === 'drone') s = drone({ eye: e.ally ? '#3aff80' : '#ff3040', light: e.ally ? '#3aff80' : null });
      else if (e.type === 'warden') s = mech({});
      else { const pose = e.state === 'wind' ? 'strike' : e.moving ? (Math.abs(e.vx) > 45 ? 'run' + (Math.floor(e.walked / 6.5) % 6) : 'walk' + (Math.floor(e.walked / 4.6) % 6)) : 'stand'; s = person(Object.assign({}, GANG_LOOKS[e.i % 3], { pose, hands: pose === 'strike' ? { fx: 31, fy: 30 } : undefined, seed: 40 + e.i })); }
      if (left) s = flipSprite(s);
      this.cache.set(k + (e.type === 'gang' ? e.i % 3 : ''), s);
    }
    return s;
  },
};
