'use strict';
// ---------------------------------------------------------------------------
// The runner. x is the middle of the feet, y the soles (world px). Moves as a
// box against the level: solid boxes stop it, walkways and stairs hold it up
// from above only (down and jump drops through), small ledges are stepped
// up. Ladders are climbed with up and down. Use works on whatever's nearest
// (a prop or a person); stripping and cutting are held.
// ---------------------------------------------------------------------------
// the runner, in the work clothes they live in: a knit cap, a canvas work
// jacket over a work shirt, old slacks, worn boots
// the runner: a tinker in safety-orange coveralls, sleeves rolled, a chrome
// forearm with blue-lit seams, cropped silver hair with blue goggles pushed up,
// a navy satchel of parts, a navy glove on the flesh hand, knee pads, a tool belt
const RUNNER = { skin: '#c8a080', hair: 'undercut', hairCol: '#c8c0b0', top: '#e0701e', legs: '#d0661a', sleeves: true, cyArm: true, acc: '#4a9aff', goggles: '#4aa8ff', gogglesUp: true, satchel: '#24365a', gloves: '#22304e', kneePad: '#24304a', toolbelt: '#2a2420', boots: '#1a1412', belt: '#1a1414', trim: false };
const POSE_HANDS = {
  stand: { fx: 23.5, fy: 38 }, breathe: { fx: 23.5, fy: 37.5 },
  jump: { fx: 26, fy: 32, bx: 14, by: 30 }, fall: { fx: 26, fy: 30, bx: 14, by: 26 }, cut: { fx: 28, fy: 33, bx: 22, by: 34 },
  climb0: { fx: 23, fy: 18, bx: 18, by: 24 }, climb1: { fx: 23, fy: 24, bx: 18, by: 18 },
};
const RunnerArt = {
  cache: new Map(),
  get(pose, left) {
    const k = pose + (left ? 'L' : 'R');
    let s = this.cache.get(k);
    if (!s) {
      // (on a ladder, seen from behind; at a machine, the cutter's plasma in hand)
      const o = Object.assign({}, RUNNER, { pose, hands: POSE_HANDS[pose] || {}, seed: 5, holding: true, view: /^climb/.test(pose) ? 'back' : undefined, cutter: pose === 'cut' });
      s = person(o); if (left) s = flipSprite(s);
      this.cache.set(k, s);
    }
    return s;
  },
};

const Player = {
  x: 0, y: 0, vx: 0, vy: 0, face: 1, ground: false, coyote: 0, drop: 0, ladder: null, walked: 0, target: null, hold: null,
  place(x, y) { this.x = x; this.y = y; this.vx = this.vy = 0; this.ladder = null; this.hold = null; this.ground = true; },
  box(x = this.x, y = this.y) { const P = T.player; return [x - P.w / 2, y - P.h, x + P.w / 2, y]; },
  hits(x, y) { const b = this.box(x, y); return World.hits(b[0] + 0.01, b[1] + 0.01, b[2] - 0.01, b[3] - 0.01); },
  step(dt) {
    const P = T.player; Input.apply();
    const ax = Input.ax, ay = Input.ay;
    this.drop = Math.max(0, this.drop - dt);
    if (ax) this.face = ax > 0 ? 1 : -1;
    const jumpHit = Input.take('jumpHit');
    // ---- on a ladder
    if (!this.ladder && Math.abs(ay) > 0.5 && Math.abs(ax) < 0.6) {
      const l = World.ladderAt(this.x, this.y - P.h, this.y + (ay > 0 ? 3 : 0));
      if (l && (ay < 0 ? this.y > l.y0 + 2 : this.y < l.y1 - 1)) { this.ladder = l; this.x = l.x; this.vx = 0; this.hold = null; }
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
    const m = Math.abs(ax), sp = Dev.s.speed, pace = (m < 0.62 ? P.walk : lerp(P.walk, P.speed, clamp((m - 0.62) / 0.28, 0, 1))) * sp;
    const busy = this.hold ? 0.15 : 1, target = Math.sign(ax) * pace * busy, acc = this.ground ? P.accel : P.airAccel;
    if (ax) this.vx += clamp(target - this.vx, -acc * dt, acc * dt);
    else this.vx -= clamp(this.vx, -P.friction * dt, P.friction * dt);
    // ---- jumping, dropping through
    this.coyote = this.ground ? P.coyote : Math.max(0, this.coyote - dt);
    if (jumpHit) {
      const onWay = this.ground && !World.hits(this.x - 4, this.y, this.x + 4, this.y + 2) && World.way(this.x, this.y - 1, this.y + 1) !== null;
      if (ay > 0.5 && onWay) { this.drop = 0.25; this.ground = false; this.y += 1; }
      else if (this.coyote > 0) { this.vy = -P.jump; this.coyote = 0; this.ground = false; }
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
    } else {
      const hy = this.hits(this.x, ny);
      if (hy) { ny = hy.y1 + T.player.h + 0.01; this.vy = 0; }
    }
    this.y = ny;
    if (this.y > World.L.h + 40) { const sp = Object.values(World.L.spawns)[0]; this.place(sp[0], sp[1]); } // (fallen off the world: put back)
    this.interact(dt);
    Travel.edge();
  },
  // what Use would work on, and working it
  interact(dt) {
    let best = null, bd = 1e9;
    for (const p of World.props) {
      if (p.kind === 'deco') continue;
      const reach = p.kind === 'exit' ? 14 : p.kind === 'car' ? 44 : 18 + (p.block ? (p.block.x1 - p.block.x0) / 2 : 0);
      const dx = Math.abs(p.x - this.x), dy = p.kind === 'exit' ? Math.abs(p.y - (this.y - 16)) : Math.abs(p.y - this.y);
      if (dx > reach || dy > (p.kind === 'exit' ? 24 : 26)) continue;
      const pr = Props.prompt(p); if (!pr) continue;
      if (dx < bd) { bd = dx; best = { p, pr }; }
    }
    for (const n of Actors.npcs) {
      if (n.hidden) continue;
      const dx = Math.abs(n.x - this.x); if (dx > 20 || Math.abs(n.y - this.y) > 14) continue;
      // (someone with a job for you comes first; passers-by don't get in the way of a machine you're at)
      const job = Jobs.actionsFor(n.def.name).length > 0, dn = dx + (job ? -30 : n.def.role ? 0 : 14);
      if (dn < bd) { bd = dn; const role = n.def.role && !(NPC_ROLE[n.def.role].talks && Talk.can(n)) ? NPC_ROLE[n.def.role] : null; best = { n, pr: { verb: role ? role.verb : 'Talk', text: role ? role.prompt(n) : 'Talk to ' + n.def.name, tap: true } }; }
    }
    this.target = best;
    const useHit = Input.take('useHit');
    if (this.hold) {
      if (!Input.use || !best || best.p !== this.hold.p) { this.hold = null; }
      else {
        const t0 = this.hold.t;
        this.hold.t += dt; this.face = Math.sign(this.hold.p.x - this.x) || this.face;
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
    if (this.hold) return 'cut';
    if (this.ladder) return Math.floor(this.walked / 7) % 2 ? 'climb0' : 'climb1';
    const v = Math.abs(this.vx);
    if (!this.ground) return this.vy < 0 ? 'jump' : 'fall';
    if (v > 64) return 'run' + (Math.floor(this.walked / 6.5) % 6);
    if (v > 6) return 'walk' + (Math.floor(this.walked / 4.6) % 6);
    return (Game.t * 0.65) % 1 < 0.5 ? 'breathe' : 'stand'; // breathing
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
  cap() { if (Game.particles.length > 260) Game.particles.splice(0, Game.particles.length - 200); },
  step(dt) { for (const p of Game.particles) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; } Game.particles = Game.particles.filter((p) => p.t > 0); if (Game.flash) { Game.flash.t -= dt; if (Game.flash.t <= 0) Game.flash = null; } },
};
