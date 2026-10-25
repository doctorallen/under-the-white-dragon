'use strict';
// ---------------------------------------------------------------------------
// The small folk. x is the middle of the feet, y the soles (world px). Moves
// against the tiles as a box; steps up a one-tile ledge without jumping;
// climbs any rock it's pressed against (up on the stick); digs the tile it
// aims at (the way it faces, or up or down on the stick), as quick as the
// pick and the rock allow.
// ---------------------------------------------------------------------------
const Player = {
  x: 0, y: 0, vx: 0, vy: 0, face: 1, ground: false, coyote: 0, climbing: false, stepOff: 0,
  walked: 0, digT: null, digging: false, swing: 0, home: false, wasHome: false,
  place(x, y) { this.x = x; this.y = y; this.vx = this.vy = 0; },
  hits(x, y) {
    const P = T.player, TL = T.tile, e = 0.01;
    const x0 = Math.floor((x - P.w / 2 + e) / TL), x1 = Math.floor((x + P.w / 2 - e) / TL), y0 = Math.floor((y - P.h + e) / TL), y1 = Math.floor((y - e) / TL);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (World.solid(tx, ty)) return true;
    return false;
  },
  step(dt) {
    const P = T.player, TL = T.tile, ax = Input.ax, ay = Input.ay;
    if (ax) this.face = ax > 0 ? 1 : -1;
    const wallL = this.hits(this.x - 2.5, this.y), wallR = this.hits(this.x + 2.5, this.y);
    // climbing: up against rock, or pushing into a wall in the air
    const pushWall = (ax < 0 && wallL) || (ax > 0 && wallR);
    this.climbing = (ay < -0.3 && (wallL || wallR || pushWall)) || (!this.ground && pushWall && this.vy > 0);
    // on a ladder: up and down as you like, and it holds you
    const lc = Math.floor(this.x / TL), onL = Ladders.has(lc, Math.floor((this.y - 2) / TL)) || Ladders.has(lc, Math.floor((this.y - P.h + 2) / TL)) || (ay > 0.3 && Ladders.has(lc, Math.floor((this.y + 2) / TL)));
    this.onLadder = onL && (ay !== 0 || !this.ground) && !Input.jump;
    // running
    const target = ax * P.speed * (this.digging && this.ground ? 0.25 : 1), acc = this.ground ? P.accel : P.airAccel;
    if (ax) this.vx += clamp(target - this.vx, -acc * dt, acc * dt);
    else this.vx -= clamp(this.vx, -P.friction * dt, P.friction * dt);
    // jumping
    this.coyote = this.ground ? P.coyote : Math.max(0, this.coyote - dt);
    if (Input.take('jumpHit') && (this.coyote > 0 || this.climbing)) { this.vy = -P.jump * (this.climbing ? 0.85 : 1); this.coyote = 0; this.ground = false; }
    // falling or climbing
    if (this.onLadder) { this.vy = ay * P.climb * 1.4; this.climbing = true; if (Math.abs(ax) < 0.3) this.x += clamp(lc * TL + TL / 2 - this.x, -30 * dt, 30 * dt); }
    else if (this.climbing) this.vy = ay < -0.3 ? -P.climb : Math.min(this.vy + P.gravity * dt, 34);
    else this.vy = Math.min(this.vy + P.gravity * dt, P.maxFall);
    if (!Input.jump && this.vy < -60 && !this.climbing) this.vy += P.gravity * dt * 0.9; // a short hop if the jump's let go
    // across, stepping up a single tile
    let nx = this.x + this.vx * dt;
    if (this.hits(nx, this.y)) {
      if ((this.ground || this.climbing) && !this.hits(nx, this.y - TL) && !this.hits(this.x, this.y - TL)) { this.y -= TL; this.stepOff += TL; }
      else {
        nx = this.vx > 0 ? Math.floor((this.x + P.w / 2 + this.vx * dt) / TL) * TL - P.w / 2 - 0.001 : Math.ceil((this.x - P.w / 2 + this.vx * dt) / TL) * TL + P.w / 2 + 0.001;
        if (this.hits(nx, this.y)) nx = this.x;
        this.vx = 0;
      }
    }
    this.walked += Math.abs(nx - this.x); this.x = nx;
    // down (or up)
    let ny = this.y + this.vy * dt; this.ground = false;
    if (this.hits(this.x, ny)) {
      if (this.vy > 0) { ny = Math.floor(ny / TL) * TL; this.ground = true; }
      else ny = Math.ceil((ny - P.h) / TL) * TL + P.h + 0.001;
      if (this.hits(this.x, ny)) ny = this.y;
      this.vy = 0;
    }
    this.y = ny;
    this.stepOff = Math.max(0, this.stepOff - dt * 90);
    // home: unpack whenever you're in with something in the bag
    const tx = Math.floor(this.x / TL), ty = Math.floor((this.y - 6) / TL);
    this.home = World.roomAt(tx, ty) === 1;
    if (this.home && Game.s.bag.length) Bag.unpack();
    if (this.home !== this.wasHome) { this.wasHome = this.home; Hud.refresh(); }
    Game.s.deepest = Math.max(Game.s.deepest, World.depth(ty));
    this.doDig(dt);
    if (Input.take('torchHit')) this.torch();
    if (Input.take('ladderHit')) this.ladder();
  },
  // the tile the pick is aimed at
  aim() {
    const TL = T.tile, P = T.player, ax = Input.ax, ay = Input.ay, col = Math.floor(this.x / TL);
    const below = Math.floor((this.y + 1) / TL), feet = Math.floor((this.y - 1) / TL), head = Math.floor((this.y - P.h + 1) / TL);
    // straight down or up: whichever tile under (or over) the feet is still rock
    const cl = Math.floor((this.x - P.w / 2 + 0.5) / TL), cr = Math.floor((this.x + P.w / 2 - 0.5) / TL);
    const pickCol = (row) => (World.solid(col, row) ? col : World.solid(cl, row) ? cl : cr);
    if (ay > 0.5 && Math.abs(ax) < 0.5) return [pickCol(below), below];
    if (ay < -0.5 && Math.abs(ax) < 0.5) { const up = Math.floor((this.y - P.h - 1) / TL); return [pickCol(up), up]; }
    const fc = Math.floor((this.x + this.face * (P.w / 2 + 3)) / TL);
    if (ay > 0.5) return [fc, below];
    if (ay < -0.5) return [fc, head - 1];
    for (const r of [feet, head]) if (World.solid(fc, r)) return [fc, r];
    return World.solid(col, below) && !this.ground ? [col, below] : [fc, feet];
  },
  doDig(dt) {
    this.digging = false;
    if (!Input.dig) { this.digT = null; return; }
    const [tx, ty] = this.aim(), m = World.at(tx, ty), info = MAT[m];
    this.digging = true; this.swing += dt;
    // digging straight down or up: settle over the shaft, so you drop into it
    if (Math.abs(Input.ax) < 0.5 && Math.abs(Input.ay) > 0.5) { const c = tx * T.tile + T.tile / 2; if (!this.hits(this.x + clamp(c - this.x, -1, 1), this.y)) this.x += clamp(c - this.x, -40 * dt, 40 * dt); }
    if (!info || !World.solid(tx, ty)) { this.digT = null; return; }
    if (!isFinite(info.hard)) { Game.toast(m === M.HOMEWALL ? 'Not the burrow walls.' : 'Nothing gets through that.'); this.digT = null; return; }
    const tier = info.tier || 1;
    if (tier > Game.s.pick) { Game.toast('Too hard for the ' + PICKS[Game.s.pick].name.toLowerCase() + '. Needs a ' + PICKS[tier].name.toLowerCase() + '.'); this.digT = null; return; }
    if (info.item && !Bag.canTake(info.item)) { Game.toast('Your pack is full. Home to unpack.', 'warn'); this.digT = null; return; }
    if (!this.digT || this.digT.x !== tx || this.digT.y !== ty) this.digT = { x: tx, y: ty, t: 0, need: T.dig.base * info.hard / PICKS[Game.s.pick].speed, chip: 0 };
    const d = this.digT; d.t += dt; d.chip -= dt;
    if (d.chip <= 0) { d.chip = 0.13; Fx.chips(tx, ty, m, 2); }
    if (d.t >= d.need) {
      const item = World.dig(tx, ty);
      Paint.changed(tx, ty);
      Fx.chips(tx, ty, m, 7);
      if (item) Bag.add(item);
      this.digT = null;
    }
  },
  torch() {
    if (Game.s.torches <= 0) { Game.toast('No torches. The bench makes them from coal and copper.'); return; }
    const TL = T.tile, tx = Math.floor(this.x / TL), ty = Math.floor((this.y - 14) / TL);
    if (World.isSky(tx, ty)) { Game.toast('No need for a torch up here.'); return; }
    if (Game.s.placed.some(([x, y]) => Math.abs(x - tx) < 2 && Math.abs(y - ty) < 2)) return;
    Game.s.placed.push([tx, ty]); Game.s.torches--;
    Hud.refresh();
  },
  // a ladder: the lowest open tile in the column from the feet up that has none
  ladder() {
    const TL = T.tile, tx = Math.floor(this.x / TL), feet = Math.floor((this.y - 1) / TL);
    if (Game.s.ladders <= 0) { Game.toast('No ladders left. The bench makes them from copper.'); return; }
    for (let ty = feet; ty >= feet - 3; ty--) {
      if (World.solid(tx, ty)) break;
      if (Ladders.has(tx, ty)) continue;
      if (World.isSky(tx, ty)) { Game.toast('No need for a ladder up here.'); return; }
      Ladders.add(tx, ty); Game.s.ladders--; Hud.refresh(); return;
    }
  },
  pose() {
    if (this.digging && this.digT) return this.swing % 0.26 < 0.13 ? 'dig0' : 'dig1';
    if (this.digging) return 'dig0';
    if (this.onLadder) return Math.floor(this.y / 6) % 2 ? 'climb0' : 'climb1';
    if (this.climbing && !this.ground) return Math.floor(this.y / 6) % 2 ? 'climb0' : 'climb1';
    if (!this.ground) return 'jump';
    if (Math.abs(this.vx) > 8) return 'walk' + (Math.floor(this.walked / 6) % 4);
    return Game.t % 1.6 < 0.8 ? 'idle0' : 'idle1';
  },
};

// ---- ladders: tiles you can climb, kept in the save as tile indices ---------
const Ladders = {
  set: new Set(),
  load() { this.set = new Set(Game.s.ladderAt || []); },
  has(x, y) { return this.set.has(y * World.w + x); },
  add(x, y) { const i = y * World.w + x; this.set.add(i); Game.s.ladderAt = [...this.set]; },
  // a ladder goes when the rock round it does? no: only if its tile fills (never), so this is all
};

// ---- chips of rock and the like -------------------------------------------
const Fx = {
  chips(tx, ty, m, n) {
    const TL = T.tile, ramp = LOOK.rock[MAT[m] && MAT[m].host ? MAT[m].host : m] || LOOK.rock[M.EARTH];
    for (let k = 0; k < n; k++) {
      const h1 = hash(Game.frame, k, 1), h2 = hash(Game.frame, k, 2), h3 = hash(Game.frame, k, 3);
      Game.particles.push({ x: tx * TL + 2 + h1 * 8, y: ty * TL + 2 + h2 * 8, vx: (h1 - 0.5) * 90, vy: -30 - h3 * 70, t: 0.5 + h3 * 0.4, c: css(ramp[2 + Math.floor(h2 * (ramp.length - 3))]) });
    }
    if (Game.particles.length > 120) Game.particles.splice(0, Game.particles.length - 120);
  },
  step(dt) {
    for (const p of Game.particles) { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; if (World.solid(Math.floor(p.x / T.tile), Math.floor(p.y / T.tile))) { p.vy *= -0.3; p.vx *= 0.5; p.y -= 1; } }
    Game.particles = Game.particles.filter((p) => p.t > 0);
  },
};
