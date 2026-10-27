'use strict';
// ---------------------------------------------------------------------------
// The runner. x is the middle of the feet, y the soles (world px). Moves as a
// box against the level: solid boxes stop it, walkways and stairs hold it up
// from above only (down and jump drops through), small ledges are stepped
// up. Ladders are climbed with up and down. Use works on whatever's nearest
// (a prop or a person); stripping and cutting are held.
// ---------------------------------------------------------------------------
// the detective, under whatever they wear (each piece of gear has a look)
const RUNNER = { skin: '#c88a5a', hair: 'short', hairCol: '#1a1416', top: '#4a4a52', coat: 'none', legs: '#4a3e36', boots: '#3a2a22', acc: '#ff8a20', trim: false, blaster: true, belt: '#2a1e14' };
const POSE_HANDS = {
  // (carried low at the side, the blaster pointing at the ground)
  stand: { fx: 23.5, fy: 38 }, breathe: { fx: 23.5, fy: 37.5 },
  jump: { fx: 26, fy: 32, bx: 14, by: 30 }, fall: { fx: 26, fy: 30, bx: 14, by: 26 }, strike: { fx: 31, fy: 30, bx: 15, by: 35 }, aim: { fx: 30, fy: 29, bx: 17, by: 36 }, shot: { fx: 30, fy: 28, bx: 17, by: 36 }, cut: { fx: 28, fy: 33, bx: 22, by: 34 },
  climb0: { fx: 23, fy: 18, bx: 18, by: 24 }, climb1: { fx: 23, fy: 24, bx: 18, by: 18 }, hurt: { fx: 24, fy: 30, bx: 14, by: 30 },
};
const RunnerArt = {
  cache: new Map(),
  get(pose, left) {
    const st = Game.stage(), k = pose + (left ? 'L' : 'R') + (st.eye ? 'e' : '') + (st.legs ? 'l' : '') + (st.arm ? 'a' : '');
    let s = this.cache.get(k);
    if (!s) {
      // a pose can be the legs' and the arms' apart ('walk3+shot'): firing
      // while moving keeps the stride and changes only the arms
      const [legs, arms] = pose.split('+'), up = arms || legs;
      const o = Object.assign({}, RUNNER, { pose: legs, hands: POSE_HANDS[up] || {}, fixedHands: !!arms, seed: 5, holding: true, gunDown: !['aim', 'shot', 'strike', 'cut'].includes(up) && !/^climb/.test(up) });
      // the inner layer's colour shows as the body without a coat
      for (const slot of SLOT_ORDER) { const g = Game.worn(slot); if (g && g.look) Object.assign(o, g.look); }
      if (!Game.worn('outer') && o.shirt) o.top = o.shirt;
      const mel = Game.worn('melee');
      // gadgets show: goggles, heel jets, the cutter's plasma in a blow
      if (st.eye) o.goggles = '#3af0e0';
      if (st.legs) o.jets = true;
      if (up === 'cut') { o.cutter = true; o.blaster = false; }
      if (up === 'shot') o.muzzle = true;
      if (up === 'strike' && (st.arm || mel)) { o.blade = mel ? mel.look.bladeCol : '#ffb040'; o.blaster = false; o.sheath = null; }
      s = person(o); if (left) s = flipSprite(s);
      this.cache.set(k, s);
    }
    return s;
  },
};

const Player = {
  x: 0, y: 0, vx: 0, vy: 0, face: 1, ground: false, coyote: 0, jumps: 0, drop: 0, ladder: null, inv: 0, hurtT: 0,
  strikeT: 0, strikeCd: 0, aimT: 0, charge: GEAR.blaster.shots, chargeT: 0, walked: 0, target: null, hold: null, ramT: 0,
  place(x, y) { this.x = x; this.y = y; this.vx = this.vy = 0; this.ladder = null; this.hold = null; this.ground = true; },
  box(x = this.x, y = this.y) { const P = T.player; return [x - P.w / 2, y - P.h, x + P.w / 2, y]; },
  hits(x, y) { const b = this.box(x, y); return World.hits(b[0] + 0.01, b[1] + 0.01, b[2] - 0.01, b[3] - 0.01); },
  step(dt) {
    const P = T.player; Input.apply();
    const ax = Input.ax, ay = Input.ay;
    this.aimT = Math.max(0, this.aimT - dt);
    // the blaster recharges a shot at a time
    const W = Game.weapon();
    if (Dev.s.ammo && this.charge < W.shots) { this.charge = W.shots; Hud.refresh(); }
    if (this.charge < W.shots) { this.chargeT += dt; if (this.chargeT >= T.blaster.recharge / ((1 + Game.perk('recharge')) * W.recharge)) { this.chargeT = 0; this.charge++; Hud.refresh(); } } else this.chargeT = 0;
    this.inv = Math.max(0, this.inv - dt); this.hurtT = Math.max(0, this.hurtT - dt); this.strikeT = Math.max(0, this.strikeT - dt); this.strikeCd = Math.max(0, this.strikeCd - dt); this.drop = Math.max(0, this.drop - dt);
    if (ax && !this.strikeT) this.face = ax > 0 ? 1 : -1;
    // RAM comes back on its own
    if (Game.s.ram < T.ram.max) { this.ramT += dt; if (this.ramT >= T.ram.regen / (1 + Game.perk('ram'))) { this.ramT = 0; Game.s.ram++; Hud.refresh(); } } else this.ramT = 0;
    const jumpHit = Input.take('jumpHit');
    // ---- on a ladder
    if (!this.ladder && Math.abs(ay) > 0.5 && Math.abs(ax) < 0.6) {
      const l = World.ladderAt(this.x, this.y - P.h, this.y + (ay > 0 ? 3 : 0));
      if (l && (ay < 0 ? this.y > l.y0 + 2 : this.y < l.y1 - 1)) { this.ladder = l; this.x = l.x; this.vx = 0; this.jumps = 0; this.hold = null; }
    }
    if (this.ladder) {
      const l = this.ladder;
      this.vy = ay * P.climb; this.y += this.vy * dt; this.vx = 0;
      if (this.y <= l.y0) { this.y = l.y0; this.ladder = null; this.ground = true; this.vy = 0; }
      else if (this.y >= l.y1) { this.y = l.y1; this.ladder = null; this.ground = true; this.vy = 0; }
      else if (jumpHit) { this.ladder = null; this.vy = -P.jump * 0.7; this.vx = this.face * 60; }
      else if (Math.abs(ax) > 0.6 && Math.abs(ay) < 0.3) { this.ladder = null; }
      if (this.ladder) { this.walked += Math.abs(this.vy * dt); this.interact(dt); return; }
    }
    // ---- running
    // the stick sets the pace: a light push walks, a full one runs
    const m = Math.abs(ax), sp = (1 + Game.perk('speed') + (Game.buffOn('speed') ? CONSUMABLES.stim.buff.speed : 0)) * Dev.s.speed, pace = (m < 0.62 ? P.walk : lerp(P.walk, P.speed, clamp((m - 0.62) / 0.28, 0, 1))) * sp;
    const busy = this.hold ? 0.15 : 1, target = Math.sign(ax) * pace * busy, acc = this.ground ? P.accel : P.airAccel;
    if (ax) this.vx += clamp(target - this.vx, -acc * dt, acc * dt);
    else this.vx -= clamp(this.vx, -P.friction * dt, P.friction * dt);
    // ---- jumping, dropping through, the second jump
    this.coyote = this.ground ? P.coyote : Math.max(0, this.coyote - dt);
    if (jumpHit) {
      const onWay = this.ground && !World.hits(this.x - 4, this.y, this.x + 4, this.y + 2) && World.way(this.x, this.y - 1, this.y + 1) !== null;
      if (ay > 0.5 && onWay) { this.drop = 0.25; this.ground = false; this.y += 1; }
      else if (this.coyote > 0) { this.vy = -P.jump; this.coyote = 0; this.ground = false; this.jumps = 1; }
      else if (Game.has('jets') && this.jumps < 2) { this.vy = -P.doubleJump; this.jumps = 2; Fx.burst(this.x, this.y, [58, 240, 224], 6); }
    }
    this.vy = Math.min(this.vy + P.gravity * dt, P.maxFall);
    if (!Input.jump && this.vy < -70) this.vy += P.gravity * dt * 0.9;
    // ---- across: step up a small ledge, or stop at the wall
    let nx = this.x + this.vx * dt;
    const hx = this.hits(nx, this.y);
    if (hx) {
      let stepped = false;
      if (this.ground) for (let s = 2; s <= 7; s += 1) if (!this.hits(nx, this.y - s)) { this.y -= s; stepped = true; break; }
      if (!stepped) { nx = this.vx > 0 ? hx.x0 - P.w / 2 - 0.01 : hx.x1 + P.w / 2 + 0.01; if (this.hits(nx, this.y)) nx = this.x; this.vx = 0; }
    }
    this.walked += Math.abs(nx - this.x); this.x = nx;
    // following stairs down or up while walking on them
    if (this.ground && this.vy >= 0 && !this.drop) { const s = World.way(this.x, this.y - 7, this.y + 7); if (s !== null && !this.hits(this.x, s)) this.y = s; }
    // ---- down (or up)
    const wasY = this.y; let ny = this.y + this.vy * dt; this.ground = false;
    if (this.vy >= 0) {
      const hy = this.hits(this.x, ny);
      if (hy) { ny = hy.y0; this.vy = 0; this.ground = true; }
      else if (!this.drop) { const s = World.way(this.x, wasY - 0.5, ny + 0.5); if (s !== null) { ny = s; this.vy = 0; this.ground = true; } }
      if (this.ground) this.jumps = 0;
    } else {
      const hy = this.hits(this.x, ny);
      if (hy) { ny = hy.y1 + T.player.h + 0.01; this.vy = 0; }
    }
    this.y = ny;
    if (this.y > World.L.h + 40) { Game.hurt(20); const sp = Object.values(World.L.spawns)[0]; this.place(sp[0], sp[1]); }
    if (Input.take('strikeHit') && this.strikeCd <= 0 && !this.hold) this.fire();
    if (Input.take('progHit')) this.runProgram();
    if (Input.take('itemHit')) { const q = Game.quickItem(); if (q) Game.useItem(q); else Game.toast('Nothing to use. Vendors sell med-patches and grenades.'); }
    // the rest of a burst, a shot at a time
    if (this.burstQ > 0) { this.burstT -= dt; if (this.burstT <= 0) { this.burstQ--; this.burstT = 0.07; this.shot(Game.weapon()); } }
    // gear that heals you, slowly
    const rg = Game.perk('regen'); if (rg && Game.s.hp < T.player.hp && Game.s.hp > 0) { Game.s.hp = Math.min(T.player.hp, Game.s.hp + rg * dt); if (Game.frame % 30 === 0) Hud.refresh(); }
    this.questT = (this.questT || 0) - dt; if (this.questT <= 0) { this.questT = 0.25; Quests.tick(); }
    this.interact(dt);
  },
  // Fire: up close it's a blow (the blaster's butt, or the blades); further
  // off, a shot, aimed at the nearest hostile ahead, up or down a little
  fire() {
    const S = T.strike, x0 = this.face > 0 ? this.x : this.x - S.reach - 4, box = [x0, this.y - T.player.h + 2, x0 + S.reach + 4, this.y - 2];
    // behind one that hasn't seen you: a quiet takedown
    const tk = Actors.enemies.find((e) => e.hp > 0 && Math.sign(e.x - this.x) === this.face && Foes.canTakedown(e));
    if (tk) { this.strikeT = 0.2; this.strikeCd = S.cd; Foes.takedown(tk); return; }
    if (Actors.enemies.some((e) => { if (e.ally) return false; const b = Actors.hurtbox(e); return box[2] > b[0] && box[0] < b[2] && box[3] > b[1] && box[1] < b[3]; })) { this.strike(); return; }
    const W = Game.weapon();
    if (this.charge < 1) { Game.toast('Recharging.'); this.strikeCd = 0.2; return; }
    this.charge--; this.strikeCd = W.cd; this.aimT = 0.22; Hud.refresh(); Foes.noise(this.x, this.y, 140);
    this.shot(W);
    if (W.burstN) { this.burstQ = W.burstN - 1; this.burstT = 0.07; }
  },
  // one pull of the trigger: a bolt (or a scatter of pellets) at the nearest
  // hostile ahead within the gun's range, up or down a little
  shot(W) {
    const mx = this.x + this.face * 12, my = this.y - 22;
    let best = null, bd = 1e9;
    for (const e of Actors.enemies) { if (e.ally) continue; const b = Actors.hurtbox(e), tx = (b[0] + b[2]) / 2, ty = (b[1] + b[3]) / 2, dx = (tx - mx) * this.face, dy = ty - my; if (dx < 4 || dx > W.range || Math.abs(dy) > dx * 0.9 + 16) continue; const d = dx + Math.abs(dy) * 1.5; if (d < bd) { bd = d; best = [tx, ty]; } }
    const a = best ? Math.atan2(best[1] - my, best[0] - mx) : (this.face > 0 ? 0 : Math.PI), n = W.pellets || 1;
    for (let k = 0; k < n; k++) {
      const aa = a + (n > 1 ? (k / (n - 1) - 0.5) * W.spread : 0);
      Actors.bolts.push({ x: mx, y: my, vx: Math.cos(aa) * W.speed, vy: Math.sin(aa) * W.speed, t: (W.range / W.speed) * 1.15, dmg: W.dmg, ally: true, player: true, c: W.bolt, pierce: W.pierce, chain: W.chain });
    }
    Game.flash = { x: mx + this.face * 4, y: my, t: 0.07 };
  },
  // throw what's in the quick slot: an arc ahead, a little more if you're running
  throwIt(k) {
    // lobbed to land on the nearest hostile ahead, or as far as it goes
    const e = Actors.nearest((q) => !q.ally && Math.sign(q.x - this.x) === this.face && Math.abs(q.y - this.y) < 60, 200);
    const d = e ? Math.abs(e.x + (e.vx || 0) * 0.4 - this.x) : 0, vy = e ? -clamp(d * 1.3, 90, 175) : -175, fl = (-vy + Math.sqrt(vy * vy + 2 * 520 * 24)) / 520;
    const vx = e ? this.face * clamp(d / fl, 40, 220) : this.face * 165 + this.vx * 0.4;
    Actors.throws.push({ x: this.x + this.face * 6, y: this.y - 24, vx, vy, t: k === 'frag' ? 1.4 : 1.0, kind: k });
    this.strikeT = 0.15; return true;
  },
  strike() {
    const S = T.strike, dmg = Game.strikeDmg();
    this.strikeT = 0.2; this.strikeCd = S.cd;
    const x0 = this.face > 0 ? this.x : this.x - S.reach - 4, box = [x0, this.y - T.player.h + 2, x0 + S.reach + 4, this.y - 2];
    const mel = Game.worn('melee');
    if (Actors.hit(box, dmg, this.face, mel && mel.stun)) Fx.sparks(this.x + this.face * 14, this.y - 18, 6);
  },
  runProgram() {
    const prog = Game.s.prog;
    if (!prog) { Game.toast('No programs yet. Data nodes have them.'); return; }
    const tp = this.target && this.target.p;
    if (prog === 'breach' && tp && tp.kind === 'hatch' && !tp.done) { Props.use(tp); return; }
    Programs.run(prog);
  },
  // what Use would work on, and working it
  interact(dt) {
    let best = null, bd = 1e9;
    for (const p of World.props) {
      if (p.kind === 'deco') continue;
      const reach = p.kind === 'exit' ? 14 : p.kind === 'car' ? 30 : p.kind === 'lift' ? 16 : 18 + (p.block ? (p.block.x1 - p.block.x0) / 2 : 0);
      const dx = Math.abs(p.x - this.x), dy = p.kind === 'exit' ? Math.abs(p.y - (this.y - 16)) : Math.abs(p.y - this.y);
      if (dx > reach || dy > (p.kind === 'exit' ? 24 : 26)) continue;
      const pr = Props.prompt(p); if (!pr) continue;
      if (dx < bd) { bd = dx; best = { p, pr }; }
    }
    for (const n of Actors.npcs) {
      if (n.hidden) continue;
      const dx = Math.abs(n.x - this.x); if (dx > 20 || Math.abs(n.y - this.y) > 14) continue;
      const work = n.def.caseId || Cases.actionsFor(n.def.name).length > 0, dn = dx + (work ? -30 : n.def.role ? 0 : 14); // passers-by don't get in the way of a machine you're at
      if (dn < bd) { bd = dn; best = { n, pr: { verb: work ? 'Question' : n.def.role ? NPC_ROLE[n.def.role].verb : 'Talk', text: work ? 'Question ' + n.def.name : n.def.role ? NPC_ROLE[n.def.role].prompt(n) : 'Talk to ' + n.def.name, tap: true } }; }
    }
    this.target = best;
    const useHit = Input.take('useHit');
    if (this.hold) {
      if (!Input.use || !best || best.p !== this.hold.p) { this.hold = null; }
      else {
        const sp = Game.has('cutter') ? T.cut.speedCutter : 1, t0 = this.hold.t;
        this.hold.t += dt * sp; this.face = Math.sign(this.hold.p.x - this.x) || this.face;
        if (Math.floor(this.hold.t * 8) !== Math.floor(t0 * 8)) Fx.sparks(this.x + this.face * 12, this.y - 16, 2);
        if (this.hold.t >= this.hold.need) { const p = this.hold.p; this.hold = null; Props.use(p); }
      }
      return;
    }
    if (!useHit || !best) return;
    if (best.n) { Actors.talk(best.n); return; }
    if (best.pr.hold) { this.hold = { p: best.p, t: 0, need: best.pr.hold }; return; }
    if (best.pr.no) { Game.toast(best.pr.text + '.'); return; }
    Props.use(best.p);
  },
  pose() {
    if (this.hurtT > 0) return 'hurt';
    if (this.strikeT > 0) return 'strike';
    if (this.hold) return 'cut';
    if (this.ladder) return Math.floor(this.walked / 7) % 2 ? 'climb0' : 'climb1';
    // the legs go on as they were; a shot only raises the arms
    const v = Math.abs(this.vx), legs = !this.ground ? (this.vy < 0 ? 'jump' : 'fall') : v > 64 ? 'run' + (Math.floor(this.walked / 6.5) % 6) : v > 6 ? 'walk' + (Math.floor(this.walked / 4.6) % 6) : null;
    if (this.aimT > 0) { const arms = this.aimT > 0.15 ? 'shot' : 'aim'; return legs ? legs + '+' + arms : arms; }
    return legs || ((Game.t * 0.65) % 1 < 0.5 ? 'breathe' : 'stand'); // breathing
  },
};

// ---- sparks, bursts -----------------------------------------------------------
const Fx = {
  sparks(x, y, n) {
    for (let k = 0; k < n; k++) { const h1 = hash(Game.frame, k, 1), h2 = hash(Game.frame, k, 2), h3 = hash(Game.frame, k, 3); Game.particles.push({ x, y, vx: (h1 - 0.5) * 160, vy: -40 - h2 * 110, t: 0.25 + h3 * 0.35, c: [255, 160 + h3 * 90, 60 + h3 * 120], g: 400 }); }
    Game.flash = { x, y, t: 0.08 };
    this.cap();
  },
  burst(x, y, c, n) { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + hash(Game.frame, k, 4), s = 40 + hash(Game.frame, k, 5) * 70; Game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.3 + hash(Game.frame, k, 6) * 0.3, c, g: 0 }); } this.cap(); },
  // an arc bolt jumping from one to the next
  arc(a, b) { const pa = Actors.hurtbox(a), pb = Actors.hurtbox(b), ax = (pa[0] + pa[2]) / 2, ay = (pa[1] + pa[3]) / 2, bx = (pb[0] + pb[2]) / 2, by = (pb[1] + pb[3]) / 2; for (let k = 0; k <= 10; k++) Game.particles.push({ x: ax + (bx - ax) * k / 10 + (hash(Game.frame, k, 8) - 0.5) * 6, y: ay + (by - ay) * k / 10 + (hash(Game.frame, k, 9) - 0.5) * 6, vx: 0, vy: 0, t: 0.15, c: [190, 150, 255], g: 0 }); this.cap(); },
  // something thrown going off: a ring of light and a flash, its colour by kind
  blast(x, y, kind, r) {
    const c = { frag: [255, 150, 60], emp: [90, 160, 255], flash: [255, 255, 255], smoke: [150, 150, 160] }[kind];
    for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2, s = r * (kind === 'smoke' ? 0.8 : 2.4); Game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, t: kind === 'smoke' ? 1.6 : 0.35, c, g: kind === 'smoke' ? -20 : 0 }); }
    Game.flash = { x, y, t: kind === 'flash' ? 0.25 : 0.12, r: r * 2, c: c.map((q) => q / 255) }; this.cap();
  },
  cap() { if (Game.particles.length > 260) Game.particles.splice(0, Game.particles.length - 200); },
  step(dt) { for (const p of Game.particles) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; } Game.particles = Game.particles.filter((p) => p.t > 0); if (Game.flash) { Game.flash.t -= dt; if (Game.flash.t <= 0) Game.flash = null; } },
};
