'use strict';
// ---------------------------------------------------------------------------
// The world: one hill and what's under it, as a grid of tiles, made from a
// seed (Rng and hash only, never Math.random, so a seed always makes the same
// world and a save need only keep what's been dug).
//
// Down from the surface: the burrow under the hill (home), the cellars and
// roots, the Old Diggings (shored tunnels, and at their foot a copper wire
// through the clay), Old Growth (dwarf-cut halls), and the Seam (rock turned
// to circuitry, and a rift held open in an arch).
// ---------------------------------------------------------------------------

// Materials. hard: seconds of digging, times T.dig.base (Infinity: can't be
// dug); tier: the pick it needs (1 the old pick, 2 bronze, 3 iron, 4
// mithril). An ore names the item it gives and the rock it sits in.
const M = {
  AIR: 0, TURF: 1, EARTH: 2, CLAY: 3, STONE: 4, DRESSED: 5, SEAMROCK: 6, BEDROCK: 7, HOMEWALL: 8,
  COIN: 20, SPOON: 21, BUTTON: 22, IRON: 23, WIRE: 24, MITHRIL: 25, RUNE: 26, GOGGLES: 27, SPICE: 28, NEON: 29, CHIP: 30,
  COPPER: 31, TIN: 32, COAL: 33, IRONORE: 34, SHARD: 35,
};
const MAT = [];
MAT[M.TURF] = { name: 'turf', hard: 0.6, tier: 1 };
MAT[M.EARTH] = { name: 'earth', hard: 0.8, tier: 1 };
MAT[M.CLAY] = { name: 'clay', hard: 1.1, tier: 1 };
MAT[M.STONE] = { name: 'stone', hard: 1.8, tier: 2 };
MAT[M.DRESSED] = { name: 'dressed stone', hard: 2.6, tier: 3 };
MAT[M.SEAMROCK] = { name: 'seam rock', hard: 2.0, tier: 4 };
MAT[M.BEDROCK] = { name: 'bedrock', hard: Infinity };
MAT[M.HOMEWALL] = { name: 'the burrow wall', hard: Infinity };
const ore = (item, host, hard, tier) => ({ name: item, item, host, hard, tier: tier || MAT[host].tier, ore: true });
MAT[M.COIN] = ore('coin', M.EARTH, 1.0);
MAT[M.SPOON] = ore('spoon', M.EARTH, 1.0);
MAT[M.BUTTON] = ore('button', M.EARTH, 1.0);
MAT[M.IRON] = ore('iron', M.CLAY, 1.4);
MAT[M.WIRE] = ore('wire', M.CLAY, 1.2);
MAT[M.MITHRIL] = ore('mithril', M.STONE, 3.0, 3);
MAT[M.RUNE] = ore('rune', M.STONE, 2.4);
MAT[M.GOGGLES] = ore('goggles', M.DRESSED, 1.5);
MAT[M.SPICE] = ore('spice', M.SEAMROCK, 2.2);
MAT[M.NEON] = ore('neon', M.SEAMROCK, 2.4);
MAT[M.CHIP] = ore('chip', M.SEAMROCK, 2.0);
// the ores proper: what the bench makes things from
MAT[M.COPPER] = ore('copper', M.EARTH, 1.2);
MAT[M.TIN] = ore('tin', M.CLAY, 1.4);
MAT[M.COAL] = ore('coal', M.CLAY, 1.0);
MAT[M.IRONORE] = ore('ironore', M.STONE, 2.2);
MAT[M.SHARD] = ore('shard', M.STONE, 2.4, 3);

// The finds, in the order the catalog shows them. col: the item's colours
// (dark, mid, light) for its icon and its glint in the rock. kind: 'ore'
// (stacks deep, goes to the bins at home, the bench uses it) or 'curio'
// (goes on the shelves; some unlock kit).
const ITEMS = {
  copper: { kind: 'ore', name: 'Copper ore', stratum: 'cellars', col: ['#4a2a14', '#b8642a', '#7ad8a0'], note: 'Green-streaked lumps. Soft enough for the old pick.' },
  coal: { kind: 'ore', name: 'Coal', stratum: 'diggings', col: ['#08080a', '#1e1e24', '#6a6a78'], note: 'Burns hot in the bench\'s little forge.' },
  tin: { kind: 'ore', name: 'Tin ore', stratum: 'diggings', col: ['#3a3a40', '#8a8a94', '#e0e0ea'], note: 'Grey and heavy. Copper and tin make bronze.' },
  ironore: { kind: 'ore', name: 'Iron ore', stratum: 'oldgrowth', col: ['#3a1a10', '#8a3a22', '#d87a4a'], note: 'Red in the grey stone. Needs a bronze pick.' },
  coin: { name: 'Old coin', stratum: 'cellars', col: ['#7a5a1a', '#d8a83a', '#fff0a0'], note: 'Somebody\'s savings, a long time ago.' },
  spoon: { name: 'Lost spoon', stratum: 'cellars', col: ['#5a606c', '#a8b0bc', '#f0f4f8'], note: 'Every hole has lost one.' },
  button: { name: 'Brass button', stratum: 'cellars', col: ['#6a4a1a', '#c08a2a', '#f8d888'], note: 'Off a waistcoat, by the look of it.' },
  iron: { name: 'Rusted ironwork', stratum: 'diggings', col: ['#3a1e10', '#8a4a22', '#c8743a'], note: 'Rails, nails and hinges from the old diggers.' },
  wire: { name: 'Copper wire', stratum: 'diggings', col: ['#6a2e0e', '#d8823a', '#5af0e8'], note: 'Runs right through the clay. Nobody in Underhill made it.' },
  mithril: { kind: 'ore', name: 'Mithril', stratum: 'oldgrowth', col: ['#4f5a66', '#c8d4e2', '#ffffff'], note: 'Light as a feather, hard as dragon scales.' },
  rune: { name: 'Rune-stone', stratum: 'oldgrowth', col: ['#2a3a1a', '#6a8a3a', '#c8f070'], note: 'The old folk\'s letters, still faintly lit.' },
  goggles: { name: 'Old goggles', stratum: 'oldgrowth', col: ['#5a2a10', '#c87a3a', '#3af0e0'], note: 'Copper and glass, and not the old folk\'s work. They fit.' },
  shard: { kind: 'ore', name: 'Glow shard', stratum: 'oldgrowth', col: ['#1a4a5a', '#5ac8e8', '#e0fbff'], note: 'Cold light grown in the deep stone. Lamps love it.' },
  spice: { name: 'Spice crystal', stratum: 'seam', col: ['#0e5a54', '#3ad8c8', '#d8fff8'], note: 'Teal all the way through. Warm to the touch.' },
  neon: { name: 'Neon crystal', stratum: 'seam', col: ['#5a0a3a', '#ff4ab0', '#ffd0ec'], note: 'A light trapped in stone, humming.' },
  chip: { name: 'Circuit chip', stratum: 'seam', col: ['#0e2a1a', '#2a7a4a', '#3af0ff'], note: 'From the far side of the rift, or growing out of the rock. Hard to say.' },
};
for (const k in ITEMS) ITEMS[k].kind = ITEMS[k].kind || 'curio';
const ITEM_ORDER = Object.keys(ITEMS);

const World = {
  w: 0, h: 0, S: 0, seed: 0, tiles: null, room: null, sy: null, decor: [], dug: [], home: null,
  idx(x, y) { return y * this.w + x; },
  at(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? M.BEDROCK : this.tiles[y * this.w + x]; },
  solid(x, y) { return this.at(x, y) !== M.AIR; },
  roomAt(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.room[y * this.w + x]; },
  // open to the sky: air above the land's line, outside any room
  isSky(x, y) { return y < 0 || (x >= 0 && x < this.w && y < this.sy[x] && this.at(x, y) === M.AIR && !this.roomAt(x, y)); },
  depth(y) { return y - this.S; },
  metres(py) { return Math.max(0, (py / T.tile - this.S) * T.metresPerTile); },
  stratum(y) { const d = this.depth(y); let s = T.strata[0]; for (const st of T.strata) if (d >= st.from) s = st; return s; },
  hardness(x, y) { const m = MAT[this.at(x, y)]; return m ? m.hard : 0; },
  tier(x, y) { const m = MAT[this.at(x, y)]; return m ? m.tier || 1 : 0; },
  // Dig a tile out: it becomes air; returns what it gave (an item id) or null.
  dig(x, y) {
    const m = this.at(x, y), info = MAT[m];
    if (!info || !isFinite(info.hard)) return null;
    this.tiles[y * this.w + x] = M.AIR;
    this.dug.push(y * this.w + x);
    return info.item || null;
  },
};

// ---- generation -----------------------------------------------------------
function generateWorld(seed) {
  const W = T.world.w, H = T.world.h, S = T.world.surface, r = new Rng(seed);
  Object.assign(World, { w: W, h: H, S, seed, tiles: new Uint8Array(W * H), room: new Uint8Array(W * H), sy: new Int16Array(W), decor: [], dug: [] });
  const set = (x, y, m) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 4) World.tiles[y * W + x] = m; };
  const get = (x, y) => World.at(x, y);
  // the land's line: rolling, with the hill over the burrow on the left
  for (let x = 0; x < W; x++) {
    const hill = 10 * Math.exp(-Math.pow((x - 19) / 11, 2));
    World.sy[x] = Math.round(S - hill + (noise(x / 9, 0, seed) - 0.5) * 4 + (noise(x / 3, 1, seed) - 0.5) * 1.2);
  }
  // rock by depth, the boundaries wandering a little
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (y < World.sy[x]) continue;
    const d = y - S + (noise(x / 13, y / 13, seed + 1) - 0.5) * 6;
    let m = d < 30 ? M.EARTH : d < 90 ? M.CLAY : d < 190 ? M.STONE : M.SEAMROCK;
    if (y - World.sy[x] < 2) m = M.TURF;
    World.tiles[y * W + x] = m;
  }
  // caves: more of them the deeper you go
  for (let y = S + 6; y < H - 6; y++) for (let x = 2; x < W - 2; x++) {
    const d = y - S, n = noise(x / 7, y / 4.5, seed + 2) * 0.65 + noise(x / 17, y / 11, seed + 3) * 0.35;
    const cut = d < 30 ? 0.8 : d < 90 ? 0.74 : d < 190 ? 0.71 : 0.67;
    if (n > cut) World.tiles[y * W + x] = M.AIR;
  }
  // veins of ore: short random walks through their own rock
  const vein = (m, host, from, to, n, len) => {
    for (let k = 0; k < n; k++) {
      let x = r.i(3, W - 4), y = S + r.i(from, to);
      for (let s = 0; s < len; s++) { if (get(x, y) === host) set(x, y, m); x += r.i(-1, 1); y += r.i(-1, 1); }
    }
  };
  // the ores the bench needs, richest where the pick that digs them is earned
  vein(M.COPPER, M.EARTH, 4, 29, 26, 5); vein(M.COPPER, M.CLAY, 30, 70, 12, 4);
  vein(M.COAL, M.CLAY, 30, 89, 22, 5); vein(M.COAL, M.EARTH, 12, 29, 6, 3);
  vein(M.TIN, M.CLAY, 34, 89, 22, 4);
  vein(M.IRONORE, M.STONE, 90, 188, 30, 5);
  vein(M.SHARD, M.STONE, 120, 188, 14, 3);
  vein(M.COIN, M.EARTH, 3, 29, 14, 3); vein(M.SPOON, M.EARTH, 4, 29, 6, 1); vein(M.BUTTON, M.EARTH, 4, 29, 6, 2);
  vein(M.IRON, M.CLAY, 30, 88, 22, 4);
  vein(M.MITHRIL, M.STONE, 95, 188, 18, 4); vein(M.RUNE, M.STONE, 100, 188, 8, 2);
  vein(M.SPICE, M.SEAMROCK, 192, 268, 20, 4); vein(M.NEON, M.SEAMROCK, 195, 268, 14, 3); vein(M.CHIP, M.SEAMROCK, 200, 268, 7, 1);
  const carve = (x0, y0, x1, y1, room) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { set(x, y, M.AIR); if (room && x > 0 && y > 0 && x < W - 1 && y < H - 1) World.room[y * W + x] = room; } };
  // ---- the burrow: a room in the hill, a passage out to the slope, its walls
  // the burrow's own (they can't be dug; the floor can)
  const hx0 = 13, hx1 = 27, hy0 = S - 5, hy1 = S;
  for (let y = hy0 - 1; y <= hy1 + 1; y++) for (let x = hx0 - 1; x <= hx1 + 1; x++) set(x, y, y === hy1 + 1 ? M.EARTH : M.HOMEWALL);
  carve(hx0, hy0, hx1, hy1, 1);
  let px = hx0 - 1; while (px > 1 && World.sy[px] <= hy1 - 2) { for (let y = hy1 - 2; y <= hy1; y++) { set(px, y, M.AIR); World.room[y * W + px] = 1; } px--; }
  for (let y = hy1 - 2; y <= hy1; y++) { set(px, y, M.AIR); }
  for (let x = px; x < hx0; x++) set(x, hy1 + 1, M.TURF);
  World.home = { x0: hx0, x1: hx1, y0: hy0, y1: hy1, spawn: { x: (hx0 + 18 - 13) * T.tile, y: (hy1 + 1) * T.tile } };
  World.decor.push({ t: 'door', x: px + 1, y: hy1 + 1 }, { t: 'shelves', x: hx0 + 2, y: hy1 + 1 }, { t: 'bench', x: hx0 + 9, y: hy1 + 1 }, { t: 'lantern', x: hx0 + 7, y: hy0, lit: true }, { t: 'catalog', x: hx1 - 3, y: hy0 + 1 }, { t: 'window', x: hx0 + 4, y: hy0 + 1 });
  // ---- neighbours' cellars: small stone rooms with a find or two in the walls
  for (const cx of [52, 96]) {
    const cy = S + r.i(6, 11), w = r.i(6, 9);
    for (let y = cy - 1; y <= cy + 4; y++) for (let x = cx - 1; x <= cx + w; x++) set(x, y, M.DRESSED);
    carve(cx, cy, cx + w - 1, cy + 3, 4);
    set(cx - 1, cy + 1, M.COIN); set(cx + w, cy + 2, M.BUTTON);
    World.decor.push({ t: 'shelves', x: cx + 1, y: cy + 4, small: true }, { t: 'barrel', x: cx + w - 2, y: cy + 4 });
  }
  // ---- the Old Diggings: shored runs on three levels, shafts between them
  const runs = [];
  for (let k = 0; k < 3; k++) {
    const y = S + 38 + k * 16 + r.i(-2, 2), x0 = r.i(6, 30), x1 = r.i(W - 34, W - 7);
    let yy = y;
    for (let x = x0; x <= x1; x++) { if (r.f() < 0.06) yy = clamp(yy + r.i(-1, 1), y - 2, y + 2); carve(x, yy - 2, x, yy, 2); }
    runs.push({ y, x0, x1 });
    for (let x = x0 + 4; x < x1 - 2; x += 7 + r.i(0, 3)) { let fy = y - 2; while (World.at(x, fy + 1) === M.AIR && fy < y + 4) fy++; World.decor.push({ t: 'prop', x, y: fy + 1 }); }
    World.decor.push({ t: 'deadLantern', x: x0 + 10 + r.i(0, 20), y: y - 2 });
    if (k === 1) World.decor.push({ t: 'cart', x: x0 + 18, y: y + 1 });
  }
  for (let k = 0; k + 1 < runs.length; k++) { const x = r.i(Math.max(runs[k].x0, runs[k + 1].x0) + 4, Math.min(runs[k].x1, runs[k + 1].x1) - 4); carve(x, runs[k].y - 2, x + 1, runs[k + 1].y, 2); }
  // the wire: a copper thread through the clay at the Diggings' foot, all the way across
  const wy = S + 86;
  for (let x = 2; x < W - 2; x++) { const y = wy + Math.round(Math.sin(x * 0.17) * 1.6 + Math.sin(x * 0.05) * 1.2); if (get(x, y) !== M.AIR) set(x, y, M.WIRE); }
  // ---- Old Growth: two dwarf-cut halls, pillars, a rune door, the goggles
  const halls = [{ x0: 14, y: S + 118 }, { x0: 70, y: S + 158 }];
  halls.forEach((hl, k) => {
    const w = 34, h = 7, x0 = hl.x0, y0 = hl.y - h + 1;
    for (let y = y0 - 2; y <= hl.y + 2; y++) for (let x = x0 - 2; x <= x0 + w + 1; x++) set(x, y, M.DRESSED);
    carve(x0, y0, x0 + w - 1, hl.y, 3);
    for (let x = x0 + 4; x < x0 + w - 3; x += 7) World.decor.push({ t: 'pillar', x, y: hl.y + 1, h });
    World.decor.push({ t: 'runeDoor', x: x0 + w - 3, y: hl.y + 1 });
    for (let x = x0 + 2; x < x0 + w - 2; x += 9) World.decor.push({ t: 'root', x, y: y0, len: 2 + r.i(0, 3) });
    if (k === 0) set(x0 - 1, hl.y - 1, M.GOGGLES);
    vein(M.MITHRIL, M.STONE, hl.y - S - 6, hl.y - S + 6, 4, 4);
  });
  // ---- the Seam: the rift, held open in an arch at the bottom
  const rx = Math.round(W / 2), ry = S + 258;
  for (let y = ry - 9; y <= ry; y++) for (let x = rx - 12; x <= rx + 12; x++) if (((x - rx) / 12) ** 2 + ((y - ry + 4) / 6) ** 2 < 1.2) set(x, y, M.AIR);
  for (let x = rx - 12; x <= rx + 12; x++) set(x, ry + 1, M.SEAMROCK);
  World.decor.push({ t: 'riftArch', x: rx, y: ry + 1 });
  // the edges: bedrock all round
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x === 0 || x === W - 1 || y >= H - 4) World.tiles[y * W + x] = M.BEDROCK;
  return World;
}
