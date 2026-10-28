'use strict';
// ---------------------------------------------------------------------------
// Everyone else. People keep a daily schedule (where to be, what to do,
// when to go home); some sell things or bring you work. The block's
// residents are moved by Town (town.js) and their minds by Tyrell (city.js).
// ---------------------------------------------------------------------------
const NPC_ROLE = {
  noodles: { verb: 'Eat', prompt: () => 'A bowl of noodles · 6 cr', use: (n) => { const paid = Game.pay({ cr: 6 }); Game.pass(0.25); n.line = (n.line || 0) + 1; Actors.say(n, paid ? n.def.lines[n.line % n.def.lines.length] : 'Eat. Pay me when you\'ve got it.'); Hud.refresh(); } },
  vendor: { verb: 'Trade', prompt: (n) => 'Trade with ' + n.def.name, use: (n) => Hud.toggle('vendor', n) },
  parts: { verb: 'Trade', prompt: (n) => 'Parts from ' + n.def.name, use: (n) => Hud.toggle('partshop', n) },
};

const Actors = {
  npcs: [],
  load() {
    const L = World.L;
    this.npcs = L.npcs.map((def, i) => ({ def, i, x: def.x, y: def.y, face: def.face || 1, hidden: false, tx: def.x, wt: 0, bubble: null, line: 0, art: new Map() }));
    for (const n of this.npcs) { const e = this.entry(n); if (e) n.x = e[2]; this.ground(n); if (e && e[3] === 'away') { if (n.out !== null) n.x = n.out; n.hidden = true; } }
    this.spawns();
  },
  // the people who come and go by their own lights: customers for the bench, the residents
  spawns() { if (!World.L) return; Jobs.spawn(); Town.sync(); },
  // someone put down inside something built there (a passer-by whose patch of
  // street has a terrace on it) stands on top of it if it's low, or beside it;
  // and wandering, they keep to the stretch they're on, between walls and edges
  ground(n) {
    if (n.def.town) return;
    const blocked = (x, y) => World.hits(x - 3, y - 20, x + 3, y - 1), under = (x, y) => World.hits(x - 1, y, x + 1, y + 2) || World.way(x, y - 1, y + 1) !== null;
    let r = blocked(n.x, n.y);
    if (r && n.y - r.y0 <= 40 && !blocked(n.x, r.y0)) { n.y = r.y0; r = null; }
    if (r) for (let d = 4; d < 300; d += 4) { const x = [n.x - d, n.x + d].find((q) => !blocked(q, n.y) && under(q, n.y)); if (x !== undefined) { n.x = x; break; } }
    let a = n.x, b = n.x;
    while (a > 0 && !blocked(a - 4, n.y) && under(a - 4, n.y)) a -= 4;
    while (b < World.L.w && !blocked(b + 4, n.y) && under(b + 4, n.y)) b += 4;
    n.lane = [a, b];
    // the way out they take when they go away (and come back in by): the
    // nearest door, cab stand or subway they can walk to, or the end of the
    // street if it goes on; with none, they go where they stand, as before
    const L = World.L, nb = Travel.neighbours(L.id), xs = World.props.filter((p) => (p.kind === 'door' || p.kind === 'transit') && Math.abs(p.y - n.y) < 12).map((p) => p.x);
    if (nb.west) xs.push(2); if (nb.east) xs.push(L.w - 2);
    const ok = xs.filter((x) => x >= a - 12 && x <= b + 12);
    n.out = ok.length ? ok.reduce((q, x) => (Math.abs(x - n.x) < Math.abs(q - n.x) ? x : q)) : null;
  },
  entry(n) { const h = Game.hour(); for (const e of n.def.sched) if (h >= e[0] && h < e[1]) return e; return n.def.sched[0]; },
  say(n, text) { n.bubble = { text, t: 3.6, seq: (this.bseq = (this.bseq || 0) + 1) }; },
  talk(n) {
    if (n.def.town) { Town.talk(n); return; }
    // work for the bench through them: the talk panel (someone with a trade
    // and only an offer opens their trade, the work on top)
    const acts = Jobs.actionsFor(n.def.name), trade = ['vendor', 'parts'].includes(n.def.role);
    if (acts.some((a) => a.kind !== 'offer') || (acts.length && !trade)) { n.face = Math.sign(Player.x - n.x) || n.face; Hud.toggle('talk', n); return; }
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
      let tx = act === 'away' && n.out !== null && n.out !== undefined ? n.out : e[2];
      if (act === 'wander') { n.wt -= dt; if (n.wt <= 0) { n.wt = 3 + hash(n.i, Game.frame, 2) * 5; n.tx = e[2] + (hash(n.i, Game.frame, 3) - 0.5) * 120; if (n.lane) n.tx = clamp(n.tx, n.lane[0], n.lane[1]); } tx = n.tx; }
      const d = tx - n.x, there = Math.abs(d) <= 2;
      if (!there && !n.bubble) { n.x += Math.sign(d) * Math.min(Math.abs(d), 26 * dt); n.face = Math.sign(d); n.moving = true; n.walked = (n.walked || 0) + 26 * dt; if (n.hidden) n.hidden = false; }
      // (stopped to talk on the way out, they're still here: gone only once they're at the door)
      else { n.moving = false; if (there) n.hidden = act === 'away'; if (Math.abs(Player.x - n.x) < 40 && Math.abs(Player.y - n.y) < 20 && act !== 'work' && act !== 'sit') n.face = Math.sign(Player.x - n.x) || n.face; else if (act === 'stand' && !n.def.face && hash(n.i, Math.floor(Game.t * 0.25), 3) < 0.35) n.face = hash(n.i, Math.floor(Game.t * 0.25), 4) < 0.5 ? -1 : 1; }
      n.act = act;
    }
  },
  // sprites for each, cached
  shared: new Map(),
  // new sprites a frame may make: past it, a figure keeps its last one a
  // frame or two longer, so a crowd walking into view doesn't stall a frame
  built: 0, budget() { if (this.built < 3) { this.built++; return true; } return false; },
  art(n, pose, left) {
    // (an umbrella only goes up while it's raining)
    const dry = n.def.look && n.def.look.umbrella && Weather.rain() < 0.08, k = pose + (left ? 'L' : 'R') + (dry ? 'd' : ''); let s = n.art.get(k);
    if (!s) { if (!n.lookKey) n.lookKey = JSON.stringify(n.def.look) + (n.def.smoke ? 's' : ''); s = this.shared.get(n.lookKey + k); if (s) n.art.set(k, s); }
    if (!s && n.lastArt && !this.budget()) return n.lastArt;
    if (s) return (n.lastArt = s);
    { const look = Object.assign({}, n.def.look, { pose: pose === 'work' ? 'breathe' : pose, seed: 20 + n.i }); if (dry) { delete look.umbrella; delete look.umbrellaGlow; } if (pose === 'work') { const hd = look.hands || {}; look.hands = Object.assign({}, hd, { fy: (hd.fy || 38) - 3, fx: (hd.fx || 25) + 1 }); } if (n.def.smoke && pose !== 'work') look.hands = Object.assign({}, look.hands || {}, { fx: 26, fy: 27 }); s = person(look); if (left) s = flipSprite(s); n.art.set(k, s); if (this.shared.size > 900) this.shared.clear(); this.shared.set(n.lookKey + k, s); }
    return (n.lastArt = s);
  },
};
