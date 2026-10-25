'use strict';
// ---------------------------------------------------------------------------
// The painted world. Collision is tiles, but nothing is drawn as a tile: the
// solid/open boundary is the tiles' solidity smoothed between their centres
// and wandered by noise, so caves are round and ragged; and every surface is
// laid in short horizontal strokes of a few close tones (strokeRow, util.js),
// each stroke one tone read at its middle, so the rock reads as paint.
//
// Rock is seen side-on: the top of any ledge catches the light (a lit lip),
// a face to the west is lit, an underside goes to soot, a face to the east
// is shaded, and a mass darkens a little inward. Behind the open is the back
// wall, dimmer, in its stratum's (or room's) own ramp, with a shadow under
// every ceiling. Turf grows where rock meets the sky. Some rock has its own
// marks: dressed stone its joints, seam rock its circuitry (which glows).
//
// The world is painted lazily in chunks (T.world.chunk tiles square), each a
// colour canvas (transparent where the sky shows) and a glow canvas, and a
// chunk is painted again when a tile in or near it is dug.
// ---------------------------------------------------------------------------
const LOOK = {
  rock: {
    [M.TURF]: rampOf(['#3a2618', '#5a3c24', '#7a5434', '#d8b080']),
    [M.EARTH]: rampOf(['#3a2618', '#5a3c24', '#7a5434', '#d8b080']),
    [M.HOMEWALL]: rampOf(['#3a2618', '#5a3c24', '#7a5434', '#d8b080']),
    [M.CLAY]: rampOf(['#2e2a24', '#48403a', '#625848', '#c8b898']),
    [M.STONE]: rampOf(['#20262a', '#343e40', '#4c5856', '#b8c8c0']),
    [M.DRESSED]: rampOf(['#2e2e2a', '#4a4a44', '#68665e', '#e0dccc']),
    [M.SEAMROCK]: rampOf(['#141022', '#221c38', '#342c52', '#b8a0f0']),
    [M.BEDROCK]: rampOf(['#0c0a0e', '#16141a', '#22202a', '#605a70'], 7),
  },
  // the back walls behind the open: by room, else by stratum
  wall: {
    home: rampOf(['#5a3e26', '#7a5838', '#9a744c', '#c8a070']),
    homeLow: rampOf(['#3a2414', '#5a3a20', '#7a5230', '#a87444']),
    cellar: rampOf(['#3a3630', '#504a42', '#686054']),
    tunnel: rampOf(['#2a2018', '#3a2c20', '#4a3a2a']),
    hall: rampOf(['#262624', '#36362f', '#48463e']),
    cellars: rampOf(['#2e2014', '#42301e', '#56402a']),
    diggings: rampOf(['#24201a', '#322c24', '#40382e']),
    oldgrowth: rampOf(['#181e1c', '#242c28', '#323a34']),
    seam: rampOf(['#100c1c', '#1a142a', '#26203a']),
  },
  grass: rampOf(['#1e3418', '#2e4c22', '#3f6b2f', '#5c8f3e', '#7ab04c', '#a0cc60'], 8, 0.4, 0.2),
};
const ROOM_WALL = { 1: 'home', 2: 'tunnel', 3: 'hall', 4: 'cellar' };

const Paint = {
  chunks: new Map(), keep: 28, queue: [],
  key: (cx, cy) => cx + ',' + cy,
  get(cx, cy) {
    const k = this.key(cx, cy);
    let c = this.chunks.get(k);
    if (!c) { c = paintChunk(cx, cy); this.chunks.set(k, c); }
    c.used = Game.frame;
    if (this.chunks.size > this.keep) {
      let old = null; for (const [kk, v] of this.chunks) if (!old || v.used < old[1].used) old = [kk, v];
      if (old && old[1].used < Game.frame) this.chunks.delete(old[0]);
    }
    return c;
  },
  // a tile changed: paint again every chunk whose picture it touches
  changed(tx, ty) {
    const CH = T.world.chunk, seen = new Set();
    for (const [dx, dy] of [[-2, -2], [2, -2], [-2, 2], [2, 2], [0, 0]]) {
      const cx = Math.floor((tx + dx) / CH), cy = Math.floor((ty + dy) / CH), k = this.key(cx, cy);
      if (seen.has(k) || !this.chunks.has(k)) continue;
      seen.add(k); this.chunks.set(k, paintChunk(cx, cy));
    }
  },
  clear() { this.chunks.clear(); },
};

function paintChunk(cx, cy) {
  const TL = T.tile, CH = T.world.chunk, S = CH * TL, pad = 16, PW = S + pad * 2, seed = World.seed;
  const X0 = cx * S - pad, Y0 = cy * S - pad;
  const kind = new Uint8Array(PW * PW), mat = new Uint8Array(PW * PW), room = new Uint8Array(PW * PW), dist = new Uint8Array(PW * PW);
  // ---- what each pixel is: rock (1), open (0) or sky (2)
  for (let j = 0; j < PW; j++) {
    const py = Y0 + j, fy = py / TL - 0.5, iy = Math.floor(fy), v = fy - iy;
    for (let i = 0; i < PW; i++) {
      const px = X0 + i, fx = px / TL - 0.5, ix = Math.floor(fx), u = fx - ix;
      const a = World.solid(ix, iy), b = World.solid(ix + 1, iy), c = World.solid(ix, iy + 1), d = World.solid(ix + 1, iy + 1);
      const f = (a ? (1 - u) * (1 - v) : 0) + (b ? u * (1 - v) : 0) + (c ? (1 - u) * v : 0) + (d ? u * v : 0) + (noise(px / 7, py / 6, seed + 11) - 0.5) * 0.42;
      const p = j * PW + i, tx = Math.floor(px / TL), ty = Math.floor(py / TL);
      if (f > 0.5) {
        kind[p] = 1;
        let m = World.at(tx, ty);
        if (m === M.AIR) { const cands = [[ix, iy, (1 - u) * (1 - v)], [ix + 1, iy, u * (1 - v)], [ix, iy + 1, (1 - u) * v], [ix + 1, iy + 1, u * v]].filter(([x, y]) => World.solid(x, y)).sort((p1, p2) => p2[2] - p1[2]); m = cands.length ? World.at(cands[0][0], cands[0][1]) : M.EARTH; }
        mat[p] = m;
      } else {
        kind[p] = World.isSky(tx, ty) ? 2 : 0;
        room[p] = World.roomAt(tx, ty);
      }
    }
  }
  // ---- how far each rock pixel is from the open (to 14)
  for (let p = 0; p < PW * PW; p++) dist[p] = kind[p] === 1 ? 14 : 0;
  for (let j = 0; j < PW; j++) for (let i = 0; i < PW; i++) { const p = j * PW + i; if (!dist[p]) continue; let m = dist[p]; if (i) m = Math.min(m, dist[p - 1] + 1); if (j) m = Math.min(m, dist[p - PW] + 1); dist[p] = m; }
  for (let j = PW - 1; j >= 0; j--) for (let i = PW - 1; i >= 0; i--) { const p = j * PW + i; if (!dist[p]) continue; let m = dist[p]; if (i < PW - 1) m = Math.min(m, dist[p + 1] + 1); if (j < PW - 1) m = Math.min(m, dist[p + PW] + 1); dist[p] = m; }
  const K = (i, j) => (i < 0 || j < 0 || i >= PW || j >= PW ? 1 : kind[j * PW + i]);
  const open = (i, j) => K(i, j) !== 1;
  // ---- the paint
  const [cc, cg] = canvasOf(S, S), [ec, eg] = canvasOf(S, S);
  const cimg = cg.createImageData(S, S), eimg = eg.createImageData(S, S), cd = cimg.data, ed = eimg.data;
  const mid = new Int16Array(PW), jit = new Float32Array(PW), val = new Float32Array(PW), rmp = new Array(PW);
  let glows = false;
  for (let j = pad; j < pad + S; j++) {
    const py = Y0 + j;
    strokeRow(mid, jit, X0, PW, py, seed + 21);
    const strat = World.stratum(Math.floor(py / TL));
    for (let i = 0; i < PW; i++) {
      const p = j * PW + i, px = X0 + i, k = kind[p];
      if (k === 2) { val[i] = 0; rmp[i] = null; continue; }
      const n1 = noise(px / 40, py / 18, seed + 31), n2 = noise(px / 36, py / 3, seed + 32);
      let v;
      if (k === 1) {
        const m = mat[p], host = MAT[m] && MAT[m].host ? MAT[m].host : m, d = dist[p];
        let r = LOOK.rock[host] || LOOK.rock[M.EARTH];
        v = 0.5 + (n1 - 0.5) * 0.3 + (Math.floor(noise(px / 14, py / 9, seed + 33) * 5) / 5 - 0.4) * 0.16 + (n2 > 0.66 ? 0.08 : n2 < 0.2 ? -0.07 : 0);
        v -= Math.min(0.14, Math.max(0, d - 6) * 0.016);
        if (open(i, j - 1)) v = 1; else if (open(i, j - 2)) v = Math.max(v, 0.84); else if (open(i, j - 3)) v = Math.max(v, 0.7);
        else if (open(i - 1, j) || open(i - 2, j)) v += 0.2;
        if (open(i, j + 1)) v -= 0.3; else if (open(i, j + 2)) v -= 0.15;
        if (open(i + 1, j) || open(i + 2, j)) v -= 0.1;
        if (d > 3 && n2 > 0.82 && hash(px >> 3, py, seed + 7) < 0.5) v -= 0.2;
        // turf where the rock meets the sky
        if ((host === M.TURF || host === M.EARTH || host === M.HOMEWALL)) { let s = -1; for (let q = 1; q <= 5; q++) if (K(i, j - q) === 2) { s = q; break; } if (s > 0) { r = LOOK.grass; v = s <= 1 ? 1 : 1 - s * 0.13 + (hash(px, py, 5) - 0.5) * 0.2; } }
        rmp[i] = r;
      } else {
        const rm = room[p], wk = ROOM_WALL[rm] || strat.id;
        let r = LOOK.wall[wk] || LOOK.wall.cellars;
        v = 0.42 + (n1 - 0.5) * 0.26 + (n2 > 0.62 ? 0.08 : 0) + (Math.floor(noise(px / 10, py / 8, seed + 34) * 4) / 4 - 0.4) * 0.1;
        if (rm === 1) { const ty = Math.floor(py / TL); if (ty >= World.home.y1 - 1) { r = LOOK.wall.homeLow; v = 0.5 + (px % 9 === 0 ? -0.25 : 0); } else v = 0.62 + (n1 - 0.5) * 0.15; }
        if (rm === 3 || rm === 4) { if (py % 9 === 0 || (px + (Math.floor(py / 9) * 7) % 16) % 16 === 0) v -= 0.2; }
        if (rm === 2 && (py % 10 === 0)) v -= 0.1;
        let up = 0; for (let q = 1; q <= 14; q++) if (K(i, j - q) === 1) { up = 1 - q / 15; break; }
        let dn = 0; for (let q = 1; q <= 6; q++) if (K(i, j + q) === 1) { dn = 1 - q / 7; break; }
        v += -up * 0.3 + dn * 0.08;
        rmp[i] = r;
      }
      val[i] = clamp(v, 0, 1);
    }
    for (let i = pad; i < pad + S; i++) {
      const p = j * PW + i, k = kind[p], o = ((j - pad) * S + (i - pad)) * 4;
      if (k === 2) continue;
      const m = mid[i] >= 0 && mid[i] < PW && kind[j * PW + mid[i]] === k && rmp[mid[i]] === rmp[i] ? mid[i] : i;
      let c = tone(rmp[i], val[m] * 0.6 + val[i] * 0.4, jit[i] * 0.9);
      if (k === 0) c = mixRgb(c, SOOT, 0.28);
      cd[o] = c[0]; cd[o + 1] = c[1]; cd[o + 2] = c[2]; cd[o + 3] = 255;
      // the marks some rock has of its own
      const px = X0 + i, py = Y0 + j, hm = k === 1 ? (MAT[mat[p]] && MAT[mat[p]].host) || mat[p] : 0;
      if (hm === M.DRESSED && dist[p] <= 10) {
        const row = Math.floor(py / 9);
        if (py % 9 === 0 || (px + (row * 7) % 16) % 16 === 0) { cd[o] *= 0.45; cd[o + 1] *= 0.45; cd[o + 2] *= 0.45; }
        else if (py % 9 === 1 || (px + (row * 7) % 16) % 16 === 1) { cd[o] = lerp(cd[o], 224, 0.25); cd[o + 1] = lerp(cd[o + 1], 214, 0.25); cd[o + 2] = lerp(cd[o + 2], 190, 0.25); }
      }
      if (hm === M.SEAMROCK) {
        const vt = px % 7 === 0 && hash(Math.floor(px / 7), Math.floor(py / 22), seed + 41) > 0.86;
        const ht = py % 7 === 0 && hash(Math.floor(px / 22), Math.floor(py / 7), seed + 42) > 0.9;
        if (vt || ht) {
          const teal = hash(Math.floor(px / 60), Math.floor(py / 60), seed + 43) > 0.45, gc = teal ? [58, 240, 224] : [255, 74, 176];
          const node = vt && ht;
          cd[o] = gc[0]; cd[o + 1] = gc[1]; cd[o + 2] = gc[2];
          const g = dist[p] < 12 ? 0.55 : 0.25; ed[o] = gc[0] * g; ed[o + 1] = gc[1] * g; ed[o + 2] = gc[2] * g; ed[o + 3] = 255; glows = true;
          if (node) { cd[o] = cd[o + 1] = cd[o + 2] = 255; ed[o] = ed[o + 1] = ed[o + 2] = 255; }
        }
      }
    }
  }
  // ---- what's in the rock: the finds, painted over it, glinting
  const put = (x, y, c, glow) => {
    const i = x - cx * S, j = y - cy * S; if (i < 0 || j < 0 || i >= S || j >= S) return;
    const p = (j + pad) * PW + (i + pad); if (kind[p] !== 1) return;
    const o = (j * S + i) * 4; cd[o] = c[0]; cd[o + 1] = c[1]; cd[o + 2] = c[2]; cd[o + 3] = 255;
    if (glow) { ed[o] = c[0]; ed[o + 1] = c[1]; ed[o + 2] = c[2]; ed[o + 3] = 255; glows = true; }
  };
  const tx0 = cx * CH - 1, ty0 = cy * CH - 1;
  for (let ty = ty0; ty <= ty0 + CH + 1; ty++) for (let tx = tx0; tx <= tx0 + CH + 1; tx++) {
    const m = World.at(tx, ty), info = MAT[m]; if (!info || !info.ore) continue;
    paintFind(info.item, tx * TL, ty * TL, put, hash(tx, ty, seed));
  }
  cg.putImageData(cimg, 0, 0);
  if (glows) eg.putImageData(eimg, 0, 0);
  return { c: cc, e: glows ? ec : null, x: cx * S, y: cy * S, used: 0 };
}

// A find, as it shows in the rock (x, y: the tile's top left), by its kind.
function paintFind(item, x, y, put, h) {
  const C = ITEMS[item].col.map(rgb), L = C[2], Md = C[1], D = C[0];
  const crystal = (cx, by, hgt, w, lean) => {
    for (let k = 0; k < hgt; k++) {
      const top = hgt - 1 - k, wi = top === 0 ? 1 : top === 1 ? Math.max(1, w - 1) : w, ox = Math.round(cx + lean * k - (wi - 1) / 2);
      for (let q = 0; q < wi; q++) put(ox + q, by - k, wi === 1 ? L : q === 0 ? L : q === wi - 1 ? D : Md, top <= 1 || q === 0);
    }
  };
  switch (item) {
    case 'spice': case 'neon': case 'mithril':
      for (let k = 0; k < 3; k++) crystal(x + 3 + k * 3 + Math.round(h * 2), y + 10 - (k % 2), 4 + Math.round(hash(k, h * 99, 1) * 4), 2 + (k % 2), (hash(k, h * 77, 2) - 0.5) * 0.4);
      return;
    case 'copper': case 'tin': case 'ironore': case 'coal':
      // lumps of ore in the rock, lit on their upper left, a fleck or two
      for (let k = 0; k < 4; k++) {
        const cx = x + 2 + Math.round(hash(k, h * 97, 3) * 8), cy = y + 2 + Math.round(hash(k, h * 89, 4) * 8), r = 1 + Math.round(hash(k, h * 83, 5) * 1.2);
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + 1) put(cx + i, cy + j, i + j < -r + 1 ? L : i + j > r - 1 ? D : Md, item !== 'coal' && i + j < -r);
      }
      return;
    case 'shard':
      for (let k = 0; k < 2; k++) crystal(x + 4 + k * 4 + Math.round(h * 2), y + 10, 5 + Math.round(hash(k, h * 99, 1) * 3), 2, (hash(k, h * 77, 2) - 0.5) * 0.6);
      return;
    case 'coin': for (const [cx, cy] of [[4, 5], [8, 8]]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) put(x + cx + i, y + cy + j, i + j < -1 ? L : i + j > 1 ? D : Md, i + j < 0); return;
    case 'button': for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 9) put(x + 6 + i, y + 6 + j, (i === -1 || i === 1) && j === 0 ? D : i + j < -2 ? L : Md, i + j < -2); return;
    case 'spoon': for (let k = 0; k < 7; k++) put(x + 2 + k, y + 8 - (k >> 1), k > 4 ? L : Md, k > 5); for (let j = -1; j <= 1; j++) for (let i = -2; i <= 1; i++) put(x + 9 + i, y + 4 + j, i < 0 ? L : Md, i < 0); return;
    case 'iron': for (let k = 0; k < 9; k++) { put(x + 2 + k, y + 5, Md); put(x + 2 + k, y + 6, D); if (k % 4 === 0) put(x + 2 + k, y + 4, L); } put(x + 5, y + 8, Md); put(x + 9, y + 3, D); return;
    case 'wire': for (let k = 0; k < 12; k++) { const yy = y + 6 + Math.round(Math.sin((x + k) * 0.5)); put(x + k, yy, Md, false); put(x + k, yy + 1, D); if ((x + k) % 6 === 0) put(x + k, yy, L, true); } return;
    case 'rune': for (const [i, j] of [[5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [4, 3], [6, 3], [3, 5], [7, 6], [6, 7]]) put(x + i, y + j, L, true); return;
    case 'goggles': for (const cx of [4, 9]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const d = i * i + j * j; if (d <= 5) put(x + cx + i, y + 6 + j, d >= 3 ? Md : L, d < 3); } for (let k = 0; k < 12; k++) put(x + k, y + 4, D); return;
    case 'chip': for (let j = 3; j < 9; j++) for (let i = 2; i < 10; i++) put(x + i, y + j, j === 3 || i === 2 ? Md : D); for (let i = 3; i < 10; i += 2) { put(x + i, y + 2, [216, 168, 58]); put(x + i, y + 9, [216, 168, 58]); } put(x + 6, y + 5, L, true); put(x + 5, y + 6, L, true); return;
  }
}
