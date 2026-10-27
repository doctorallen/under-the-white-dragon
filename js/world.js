'use strict';
// ---------------------------------------------------------------------------
// Levels. A level is built once by its function in levels.js through the
// builder below: painting operations for the chunk painter, and the shape of
// the place for play: solid boxes, one-way surfaces (walkways and stairs,
// stood on from above, jumped up through), ladders, props, lights, doors,
// people and enemies. World holds the level being played and answers the
// questions physics and play ask of it.
// ---------------------------------------------------------------------------
const LEVELS = {};

function newLevel(id, name, w, h) {
  const L = {
    id, name, w, h, ops: [], solids: [], ways: [], ladders: [], props: [], lights: [], npcs: [], enemies: [], wet: [], spawns: {},
    rain: 0, dry: [], flicks: [], ads: [], critters: [], trash: [], vents: [], drips: [], traffic: [], holos: [], train: null, layers: [], layerDy: 0, ambient: [0.2, 0.18, 0.26], far: null, music: null,
    paint(x0, y0, x1, y1, fn) { this.ops.push({ x0, y0, x1, y1, fn, seed: this.ops.length * 31 + 7 }); },
    block(x0, y0, x1, y1, ramp, o = {}) { this.paint(x0, y0, x1, y1, (P) => P.block(x0, y0, x1, y1, ramp, o)); },
    solid(x0, y0, x1, y1) { this.solids.push({ x0, y0, x1, y1 }); },
    wall(x0, y0, x1, y1, ramp, o = {}) { this.block(x0, y0, x1, y1, ramp, o); this.solid(x0, y0, x1, y1); },
    // a floor: solid, painted as a slab with a lit lip
    floor(x0, x1, y, th, ramp, o = {}) { this.paint(x0, y, x1, y + th, (P) => slab(P, x0, x1, y, th, ramp, o)); this.solid(x0, y, x1, y + th); },
    // a walkway: stood on from above only
    walk(x0, x1, y, th = 6, ramp = MAT.concrete, o = {}) {
      this.paint(x0, y - 8, x1, y + th, (P) => { slab(P, x0, x1, y, th, ramp, o); if (o.rail !== false) railing(P, x0, x1, y, MAT.steel); });
      this.ways.push({ x0, y0: y, x1, y1: y });
    },
    stairs(x0, y0, x1, y1, ramp = MAT.steel) { this.paint(Math.min(x0, x1), Math.min(y0, y1) - 10, Math.max(x0, x1), Math.max(y0, y1) + 3, (P) => stairsPaint(P, x0, y0, x1, y1, ramp)); this.ways.push(x0 < x1 ? { x0, y0, x1, y1 } : { x0: x1, y0: y1, x1: x0, y1: y0 }); },
    ladder(x, y0, y1) {
      this.paint(x - 5, y0, x + 5, y1, (P) => { for (let y = y0; y < y1; y++) { P.put(x - 4, y, tone(MAT.steel, 0.65)); P.put(x - 3, y, tone(MAT.steel, 0.3)); P.put(x + 3, y, tone(MAT.steel, 0.5)); P.put(x + 4, y, tone(MAT.steel, 0.2)); if ((y - y0) % 5 === 0) for (let i = -3; i <= 3; i++) P.put(x + i, y, tone(MAT.steel, 0.7 - (i + 3) * 0.06)); } });
      this.ladders.push({ x, y0, y1 });
    },
    light(x, y, r, col, k = 1, flat = 1, flick = null) { const l = { x, y, r, c: typeof col === 'string' ? rgb(col).map((q) => q / 255) : col, k, flat, flick }; this.lights.push(l); return l; },
    // signs and tubes flicker (life.js): the light and the glow of the tube itself, together
    sign(x, y, n, colr, o = {}) { const [w, h] = signSize(n, o.vert); this.paint(x, y, x + w, y + h, (P) => sign(P, x, y, n, colr, o)); const fl = { mode: o.dead ? 'bad' : 'sign', seed: x * 7 + y }; this.light(x + w / 2, y + h / 2, o.r || Math.max(w, h) * 2 + 26, colr, o.k || 0.85, 1, fl); this.flicks.push({ x0: x, y0: y, x1: x + w, y1: y + h, fl }); },
    tube(x, y, w, colr = '#e8f4ff', k = 0.75) { this.paint(x, y, x + w, y + 2, (P) => tubePaint(P, x, y, w, colr)); const fl = { mode: 'tube', seed: x * 13 + y }; this.light(x + w / 2, y + 6, w * 1.8 + 40, colr, k, 1.15, fl); this.flicks.push({ x0: x, y0: y - 1, x1: x + w, y1: y + 3, fl }); },
    // a fire: a light that dances, and smoke
    fire(x, y, r = 60, k = 1.1) { this.light(x, y, r, [1, 0.55, 0.25], k, 1, { mode: 'fire', seed: x }); this.vents.push({ x, y: y - 6, kind: 'smoke' }); },
    // a screen: an animated advert drawn each frame (life.js) on a dark panel
    ad(x, y, w, h, kind, cols) { this.paint(x - 2, y - 2, x + w + 2, y + h + 2, (P) => { P.block(x - 2, y - 2, x + w + 2, y + h + 2, MAT.steelD, { base: 0.35 }); P.area(x, y, x + w, y + h, R(['#04060a', '#0a0e16']), () => 0.3); }); const l = this.light(x + w / 2, y + h / 2, Math.max(w, h) * 1.6 + 30, [1, 1, 1], 0.6); this.ads.push({ x, y, w, h, kind, cols: cols.map(rgb), l }); },
    critter(kind, x0, x1, y, n = 1) { for (let i = 0; i < n; i++) this.critters.push({ kind, x0, x1, y }); },
    litter(x0, x1, y, n) { this.trash.push({ x0, x1, y, n }); },
    lamp(x, y, h, colr = '#ffe0b0', k = 1) { this.paint(x, y - h, x + 10, y, (P) => lampPaint(P, x, y, h, colr)); this.light(x + 7, y - h + 8, h * 1.7, colr, k, 1.2); },
    prop(kind, x, y, o = {}) { const p = Object.assign({ id: this.id + ':' + kind + ':' + Math.round(x) + ':' + Math.round(y), kind, x, y }, o); this.props.push(p); return p; },
    npc(def) { personName(this, def); this.npcs.push(def); return def; }, // (everyone gets a name: levels.js)
    enemy(type, x, y, o = {}) { this.enemies.push(Object.assign({ type, x, y }, o)); },
  };
  return L;
}

// what the detective's city had that the tinkerer's doesn't: lockers of loot, data
// nodes, caches, sealed and pass-locked doors (hatches and shutters stand open)
const LEGACY_PROPS = ['locker', 'node', 'cache', 'stash', 'sealed', 'keydoor', 'elevator', 'closet', 'spinner'];
const World = {
  L: null, far: null, layers: [], props: [], shared: {},
  load(id) {
    if (!LEVELS[id].built) LEVELS[id].built = LEVELS[id].make();
    const L = (this.L = LEVELS[id].built);
    Paint.reset(L);
    // the far layer: painted once, moved at a fraction of the camera's speed
    this.far = null;
    if (L.far) { const f = L.far, P = new Pix(f.w, f.h, 0, 0); P.n = 3; f.paint(P); this.far = Object.assign({ f: f.f, fy: f.fy === undefined ? f.f : f.fy }, P.canvases()); }
    // or several, back to front, each moving less the further it is
    // (the same city behind many places is painted once and shared)
    const paintLayers = () => L.layers.map((f, i) => { const P = new Pix(f.w, f.h, 0, 0); P.n = 3 + i * 100; f.paint(P); return Object.assign({ f: f.f, fy: f.fy === undefined ? f.f : f.fy }, P.canvases()); });
    if (!L.layersPainted) L.layersPainted = L.layersKey ? (World.shared[L.layersKey] = World.shared[L.layersKey] || paintLayers()) : paintLayers();
    this.layers = L.layersPainted;
    // props, with what's been done to them
    this.props = L.props.filter((p) => LEGACY || !LEGACY_PROPS.includes(p.kind)).map((p) => Object.assign({}, p, { done: Props.isDone(p) || (!LEGACY && (p.kind === 'hatch' || p.kind === 'heavy')) }));
    for (const p of this.props) Props.init(p);
    this.questProps();
  },
  // the props cases and quests put in this level: clues, photos, pickups;
  // made again whenever a case or quest moves on
  // the spot a case put something at: a night case's spots are numbers taken
  // round the level's spots, so two could land on one; within the case they
  // step on to the next free spot instead, so nobody stands on anyone
  spotOf(a, L) {
    const n = L.spots.length; if (!a.group) return L.spots[a.spot % n];
    const used = [], idx = a.group.map((s) => { let i = s % n; for (let k = 0; k < n && used.includes(i); k++) i = (i + 1) % n; used.push(i); return i; });
    return L.spots[idx[a.gi !== undefined ? a.gi : a.group.indexOf(a.spot)]];
  },
  questProps() {
    if (!this.L) return;
    const L = this.L, at = (a) => { let x = a.x, y = a.y; if (a.spot !== undefined && L.spots && L.spots.length) { const s = World.spotOf(a, L); x = s[0] + 18; y = s[1]; } if (y === undefined || y === 'G') y = L.ground || Object.values(L.spawns)[0][1]; return [x, y]; };
    this.props = this.props.filter((p) => !p.dyn);
    for (const c of Cases.props(L.id)) { const [x, y] = at(c.K.at); const p = { id: 'clue:' + c.id + ':' + c.cid, kind: 'clue', x, y, caseId: c.id, cid: c.cid, K: c.K, dyn: true }; Props.init(p); this.props.push(p); }
    for (const t of Tips.props(L.id)) { const p = Object.assign(t, { y: L.ground || Object.values(L.spawns)[0][1], dyn: true, done: !!Game.s.done[t.id] }); Props.init(p); this.props.push(p); }
    for (const q of Quests.pickups(L.id)) { const [x, y] = at(q.a); const p = { id: 'pick:' + q.item, kind: 'pickup', x, y, item: q.item, dyn: true }; Props.init(p); this.props.push(p); }
  },
  // does the box (x0..x1, y0..y1) overlap anything solid?
  hits(x0, y0, x1, y1) {
    for (const r of this.L.solids) if (x1 > r.x0 && x0 < r.x1 && y1 > r.y0 && y0 < r.y1) return r;
    for (const p of this.props) if (p.block && !p.done) { const r = p.block; if (x1 > r.x0 && x0 < r.x1 && y1 > r.y0 && y0 < r.y1) return r; }
    if (x0 < 0 || x1 > this.L.w) return { x0: x0 < 0 ? -100 : this.L.w, y0: -1e4, x1: x0 < 0 ? 0 : this.L.w + 100, y1: 1e4 };
    return null;
  },
  // the height of a one-way surface under x, if there's one between y0 and y1
  way(x, y0, y1) {
    let best = null;
    for (const w of this.L.ways) {
      if (x < w.x0 || x > w.x1) continue;
      const y = w.y0 + (w.y1 - w.y0) * ((x - w.x0) / Math.max(1, w.x1 - w.x0));
      if (y >= y0 && y <= y1 && (best === null || y < best)) best = y;
    }
    return best;
  },
  ladderAt(x, y0, y1) { for (const l of this.L.ladders) if (Math.abs(x - l.x) < 6 && y1 > l.y0 && y0 < l.y1) return l; return null; },
};
