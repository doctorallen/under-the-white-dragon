'use strict';
// ---------------------------------------------------------------------------
// Everyone else. People keep a daily schedule (where to be, what to do,
// when to go home); some sell things, build things, or give out work, and
// some have something to say about a quest. Enemies are kept here, and run
// by Foes (enemies.js); the Warden's fight is here. Bolts fly, thrown things
// arc and go off, the dead stay where they fell.
// ---------------------------------------------------------------------------
const NPC_ROLE = {
  noodles: { verb: 'Eat', prompt: () => 'Noodles · 12 cr', use: (n) => { if (Game.s.hp >= T.player.hp) { Actors.say(n, 'You\'re fine. Come back hungry.'); return; } if (!Game.pay({ cr: 12 })) { Actors.say(n, 'Twelve. You don\'t have twelve.'); return; } Game.s.hp = Math.min(T.player.hp, Game.s.hp + 50); Hud.refresh(); Actors.say(n, 'Eat. Slowly.'); } },
  vendor: { verb: 'Trade', prompt: (n) => 'Trade with ' + n.def.name, use: (n) => Hud.toggle('vendor', n) },
  fixer: { verb: 'Cases', prompt: (n) => 'Talk to ' + n.def.name, use: (n) => Hud.toggle('fixer', n) },
  qm: { verb: 'Gadgets', prompt: () => 'The quartermaster', use: (n) => Hud.toggle('qm', n) },
  parts: { verb: 'Trade', prompt: (n) => 'Parts from ' + n.def.name, use: (n) => Hud.toggle('partshop', n) },
  fab: { verb: 'Craft', prompt: () => 'Mags · make, upgrade, break down', use: (n) => Hud.toggle('fab', n) },
};
const GANG_LOOKS = [
  { skin: SKINS[5], hair: 'mohawk', hairCol: '#3af0e0', hairGlow: true, top: '#1a1a1e', legs: '#2a1a1e', cyArm: true, blade: '#3af0e0', acc: '#3af0e0', wide: 1 },
  { skin: SKINS[2], hair: 'short', hairCol: '#1a1a1a', top: '#3a1a1a', legs: '#1a1a1e', blade: '#ff4ab0', acc: '#ff4ab0', mask: '#2a2a2a', wide: 1 },
  { skin: SKINS[0], hair: 'bob', hairCol: '#ff4ab0', top: '#2a1a2a', legs: '#1a1a1e', cyLegs: true, blade: '#ff4ab0', acc: '#ff4ab0', eye: '#ff4ab0' },
];

const Actors = {
  npcs: [], enemies: [], bolts: [], bodies: [], boss: null,
  load() {
    const L = World.L;
    this.npcs = L.npcs.filter((def) => !def.show || Quests.npcShown(def)).map((def, i) => ({ def, i, x: def.x, y: def.y, face: def.face || 1, hidden: false, tx: def.x, wt: 0, bubble: null, line: 0, art: new Map() }));
    for (const n of this.npcs) { const e = this.entry(n); if (e && e[3] === 'away') { n.x = e[2]; n.hidden = true; } else if (e) n.x = e[2]; }
    this.enemies = []; this.bolts = []; this.bodies = []; this.throws = []; this.boss = null; // the dead stay where they fell till you leave
    L.enemies.forEach((d, i) => { const D = ENEMY[d.type]; if (D.boss && D.flag && Game.flag(D.flag)) return; this.spawn(d.type, d.x, d.y, d, i); });
    this.questSpawns();
  },
  // the people a case puts here: witnesses, a suspect once you've found the lead
  caseNpcs() {
    const L = World.L, want = Cases.npcs(L.id), at = (a) => { if (a.spot !== undefined && L.spots && L.spots.length) { const s = World.spotOf(a, L); return [s[0] - 20, s[1]]; } return [a.x, a.y || L.ground || Object.values(L.spawns)[0][1]]; };
    this.npcs = this.npcs.filter((n) => !n.def.dyn || want.some((w) => w.name === n.def.name));
    for (const w of want) { if (this.npcs.some((n) => n.def.name === w.name)) continue; const [x, y] = at(w.at); const def = { name: w.name, look: w.look || SUSPECT_LOOKS[0], x, y, sched: [[0, 24, x, 'stand']], lines: w.lines, dyn: true, suspect: w.suspect, caseId: w.caseId }; this.npcs.push({ def, i: 60 + this.npcs.length, x, y, face: -1, hidden: false, tx: x, wt: 0, bubble: null, line: 0, art: new Map() }); }
  },
  // an enemy into the level: its kind's health, times `hp` for named ones
  spawn(type, x, y, o = {}, i) {
    const D = ENEMY[type], n = i === undefined ? this.enemies.length + 50 : i;
    const e = Object.assign({ i: n, x, y, vx: 0, vy: 0, face: -1, hp: 0, max: 0, cd: 1 + n * 0.3, t: hash(n, 3, 7) * 6, stun: 0, ally: 0, flash: 0, state: 'idle', st: 0, type }, o, { type });
    e.max = e.hp = Math.round(D.hp * (o.hpx || 1));
    if (D.boss) this.boss = e;
    if (o.minion) e.alert = true;
    this.enemies.push(e); return e;
  },
  // named targets a quest or a warrant wants, if they're not here yet
  questSpawns() {
    if (!World.L) return;
    const L = World.L, spots = L.spots && L.spots.length ? L.spots : [[L.w * 0.6, Object.values(L.spawns)[0][1]]];
    const add = (key, E, name, extra) => { if (this.enemies.some((q) => q.elite === key)) return; const sp = spots[Math.floor(hash(key.length, name.length, 5) * spots.length)]; this.spawn(E.type, sp[0], sp[1], Object.assign({ elite: key, named: name, hpx: E.hp || 2, look: E.look, range: [sp[0] - 90, sp[0] + 90] }, extra)); };
    for (const k of Quests.elites(L.id)) add(k, ELITES[k], ELITES[k].name, {});
    for (const w of Warrants.here(L.id)) add('w' + w.id, w, w.name, { warrant: w.id });
    this.caseNpcs();
    Jobs.spawn(); Town.sync();
  },
  entry(n) { const h = Game.hour(); for (const e of n.def.sched) if (h >= e[0] && h < e[1]) return e; return n.def.sched[0]; },
  nearest(test, r) { let best = null, bd = r; for (const e of this.enemies) { if (!test(e)) continue; const d = Math.hypot(e.x - Player.x, (e.y - 10) - (Player.y - 16)); if (d < bd) { bd = d; best = e; } } return best; },
  say(n, text) { n.bubble = { text, t: 3.6 }; },
  talk(n) {
    if (n.def.town) { Town.talk(n); return; }
    // a case or a quest has something to say through them: the talk panel
    // (someone with a trade and only work to offer opens their trade, the work on top)
    const acts = Cases.actionsFor(n.def.name).concat(Quests.actionsFor(n.def.name), Jobs.actionsFor(n.def.name)), trade = ['vendor', 'qm', 'fab', 'parts'].includes(n.def.role);
    if (n.def.role === 'fixer' || acts.some((a) => a.kind !== 'offer') || (acts.length && !trade)) { n.face = Math.sign(Player.x - n.x) || n.face; Hud.toggle('talk', n); return; }
    if (n.def.role) { NPC_ROLE[n.def.role].use(n); return; }
    const L = n.def.lines; this.say(n, L[n.line % L.length]); n.line++;
    n.face = Math.sign(Player.x - n.x) || n.face;
  },
  step(dt) {
    // ---- people (the block's residents go where the clock says: town.js)
    Town.sync(); Town.chatter(dt);
    for (const n of this.npcs) {
      if (n.bubble) { n.bubble.t -= dt; if (n.bubble.t <= 0) n.bubble = null; }
      if (n.def.town) continue;
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
      Foes.step(e, dt);
    }
    // ---- bolts: yours hit what's hostile (a shield turns them from the front;
    // a rail bolt goes through; an arc bolt jumps on), theirs hit you
    for (const b of this.bolts) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.t -= dt;
      if (World.hits(b.x - 1, b.y - 1, b.x + 1, b.y + 1)) b.t = 0;
      if (b.ally) {
        for (const e of this.enemies) {
          if (e.ally || e.hp <= 0 || (b.hitList && b.hitList.includes(e)) || !this.inBox(b.x, b.y, this.hurtbox(e))) continue;
          if (ENEMY[e.type].shield && !e.stun && Math.sign(b.vx) === -e.face) { Fx.sparks(b.x, b.y, 5); b.t = 0; break; }
          this.damage(e, b.dmg, Math.sign(b.vx));
          if (b.chain) { let from = e; for (let c = 0; c < b.chain; c++) { const nx = this.nearestTo(from, (q) => q !== e && !q.ally && q.hp > 0 && !(b.hitList || []).includes(q), 90); if (!nx) break; (b.hitList = b.hitList || [e]).push(nx); Fx.arc(from, nx); this.damage(nx, Math.round(b.dmg * 0.6), Math.sign(nx.x - from.x)); from = nx; } }
          if (b.pierce) { (b.hitList = b.hitList || []).push(e); continue; }
          b.t = 0; break;
        }
      } else { const pb = Player.box(); if (b.x > pb[0] && b.x < pb[2] && b.y > pb[1] && b.y < pb[3]) { Game.hurt(b.dmg, b); b.t = 0; } }
    }
    this.bolts = this.bolts.filter((b) => b.t > 0);
    this.stepThrows(dt);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  },
  // thrown things: an arc, a bounce or two, then they go off
  stepThrows(dt) {
    for (const g of this.throws) {
      g.t -= dt; g.vy += 520 * dt;
      const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt;
      if (World.hits(nx - 2, g.y - 2, nx + 2, g.y + 2)) { g.vx *= -0.4; } else g.x = nx;
      const way = g.vy > 0 ? World.way(g.x, g.y, ny + 2) : null;
      if (World.hits(g.x - 2, ny - 2, g.x + 2, ny + 2) || way !== null) { g.vy *= -0.35; g.vx *= 0.6; if (way !== null) g.y = way - 2; if (g.kind === 'frag' && g.vy < -20) g.t = Math.min(g.t, 0.12); } else g.y = ny;
      if (g.t <= 0 || (g.kind === 'frag' && this.enemies.some((e) => !e.ally && this.inBox(g.x, g.y, this.hurtbox(e))))) { this.goOff(g); g.done = true; }
    }
    this.throws = this.throws.filter((g) => !g.done);
  },
  goOff(g) {
    const I = THROWABLES[g.kind], R = I.radius;
    Fx.blast(g.x, g.y, g.kind, R);
    for (const e of this.enemies) {
      if (e.ally) continue; const b = this.hurtbox(e), d = Math.hypot((b[0] + b[2]) / 2 - g.x, (b[1] + b[3]) / 2 - g.y); if (d > R) continue;
      const D = ENEMY[e.type];
      if (I.dmg) this.damage(e, Math.round(I.dmg * (1 - (d / R) * 0.5)), Math.sign(e.x - g.x) || 1);
      if (I.emp && (D.bot || D.shield)) { e.stun = Math.max(e.stun, D.boss ? 1.2 : I.stun); }
      if (I.flash && !D.bot) { e.stun = Math.max(e.stun, D.boss ? 0.8 : I.stun); }
    }
    if (I.ghost) Game.ghost = Math.max(Game.ghost, I.ghost);
  },
  sees(e, r) { return Foes.sees(e, r); },
  fire(e, tx, ty, speed, dmg, ally) { const a = Math.atan2(ty - e.y, tx - e.x); this.bolts.push({ x: e.x + Math.cos(a) * 8, y: e.y + Math.sin(a) * 8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, t: 2.4, dmg, ally: !!ally, c: ally ? [90, 255, 140] : [255, 60, 80] }); },
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
  hurtbox(e) { return Foes.hurtbox(e); },
  inBox(x, y, b) { return x > b[0] && x < b[2] && y > b[1] && y < b[3]; },
  // the runner's strike: true if it hit anything
  hit(box, dmg, face, stun) {
    let any = false;
    for (const e of this.enemies) { if (e.ally) continue; const b = this.hurtbox(e); if (box[2] > b[0] && box[0] < b[2] && box[3] > b[1] && box[1] < b[3]) { this.damage(e, dmg, face, stun); any = true; } }
    return any;
  },
  damage(e, dmg, face, stun) {
    if (e.hp <= 0) return;
    const D = ENEMY[e.type]; e.hp -= dmg; e.flash = 0.12; if (!e.subdued) Foes.alarm(e);
    if (e.type === 'fugitive' && e.hp <= e.max * 0.35) { e.hp = 0; Cases.surrender(e.caseId, e.x, e.y); return; }
    if (!D.boss && !D.center && D.ai !== 'charger') { e.vx = face * T.strike.knock; if (e.state !== 'dash') { e.state = 'rest'; e.st = 0.35; } e.aim = 0; }
    if (D.ai === 'flyer') { e.x += face * 6; e.stun = Math.max(e.stun, 0.2); }
    if (stun) e.stun = Math.max(e.stun, stun);
    if (e.hp <= 0) Foes.die(e);
  },
  // a body on the ground: the figure laid on its back, darkened
  bodyArt(b) {
    if (!this.bodyCache) this.bodyCache = new Map();
    const base = b.type === 'gang' || !LOOKS[b.type] ? GANG_LOOKS : LOOKS[b.type], v = b.i % base.length, k = (b.type || 'gang') + v + (b.look ? 'x' + b.i : '') + (b.face < 0 ? 'L' : 'R'); let s = this.bodyCache.get(k);
    if (!s) {
      const up = person(Object.assign({}, base[v], b.look || {}, { pose: 'hurt', blade: null, gun: false, shield: null, seed: 40 + b.i })), [c, g] = canvasOf(up.h, up.w);
      g.translate(0, up.w); g.rotate(-Math.PI / 2); g.drawImage(up.c, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(10,6,12,0.35)'; g.fillRect(0, 0, up.h, up.w);
      const d = g.getImageData(0, 0, up.h, up.w).data; let low = 0; for (let y = up.w - 1; y >= 0 && !low; y--) for (let x = 0; x < up.h; x++) if (d[(y * up.h + x) * 4 + 3]) { low = y; break; }
      s = { c, e: null, w: up.h, h: up.w, ax: up.ay - 16, ay: low };
      if (b.face > 0) s = flipSprite(s);
      this.bodyCache.set(k, s);
    }
    return s;
  },
  // sprites for each, cached
  shared: new Map(),
  // new sprites a frame may make: past it, a figure keeps its last one a
  // frame or two longer, so a crowd walking into view doesn't stall a frame
  built: 0, budget() { if (this.built < 3) { this.built++; return true; } return false; },
  art(n, pose, left) {
    const k = pose + (left ? 'L' : 'R'); let s = n.art.get(k);
    if (!s) { if (!n.lookKey) n.lookKey = JSON.stringify(n.def.look) + (n.def.smoke ? 's' : ''); s = this.shared.get(n.lookKey + k); if (s) n.art.set(k, s); }
    if (!s && n.lastArt && !this.budget()) return n.lastArt;
    if (s) return (n.lastArt = s);
    { const look = Object.assign({}, n.def.look, { pose: pose === 'work' ? 'breathe' : pose, seed: 20 + n.i }); if (pose === 'work') { const hd = look.hands || {}; look.hands = Object.assign({}, hd, { fy: (hd.fy || 38) - 3, fx: (hd.fx || 25) + 1 }); } if (n.def.smoke && pose !== 'work') look.hands = Object.assign({}, look.hands || {}, { fx: 26, fy: 27 }); s = person(look); if (left) s = flipSprite(s); n.art.set(k, s); if (this.shared.size > 900) this.shared.clear(); this.shared.set(n.lookKey + k, s); }
    return (n.lastArt = s);
  },
  enemyArt(e) { return Foes.art(e); },
};
