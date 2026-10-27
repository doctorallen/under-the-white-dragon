'use strict';
// ---------------------------------------------------------------------------
// The city behind the city: layers of towers, each further one smaller,
// bluer and slower to move as the camera does (parallax). Every tower is
// made up from a seed: a body, sometimes stepped back on one side or both,
// sometimes with a piece cantilevered out; a crown (flat, sloped, a spire, a
// mast cluster, a water tank, a rooftop billboard); windows in one of a few
// patterns (bands of lit dashes, a sparse grid, lit columns, nearly dark);
// a neon sign down a side; a rim of light on its west edge from the city's
// glow. Giant holograms and a monorail train are drawn over their layer each
// frame (`Skyline.draw`), so the nearer layers pass in front of them.
// ---------------------------------------------------------------------------
const SKY_PAL = {
  far: R(['#12223a', '#1a3452', '#264a6e', '#4a7aa4']),
  mid: R(['#0e1628', '#18243e', '#24365a', '#4a6690']),
  near: R(['#0a0c18', '#14182c', '#202842', '#46507a']),
};
const WIN_COLS = [[255, 176, 80], [255, 200, 120], [58, 240, 224], [255, 120, 200], [160, 220, 255]];

function tower(P, b) {
  const r = new Rng(b.seed), fog = b.fog || 0, fogc = b.fogc, pal = b.pal, glowK = b.glow === undefined ? 0.5 : b.glow;
  const x0 = Math.round(b.x), x1 = Math.round(b.x + b.w), base = b.base, top = Math.round(b.top);
  const tiers = [{ x0, x1, top, bot: base }];
  // stepped back, on one side or both, once or twice
  let t = tiers[0];
  for (let k = 0; k < b.steps; k++) {
    const h = t.bot - t.top, w = t.x1 - t.x0; if (w < 10) break;
    const cutL = r.f() < 0.55 ? Math.round(w * (0.1 + r.f() * 0.3)) : 0, cutR = r.f() < (cutL ? 0.4 : 1) ? Math.round(w * (0.1 + r.f() * 0.3)) : 0;
    const th = Math.round(h * (0.12 + r.f() * 0.25)), nt = { x0: t.x0 + cutL, x1: t.x1 - cutR, top: t.top - th, bot: t.top };
    tiers.push(nt); t = nt;
  }
  for (const q of tiers) P.block(q.x0, q.top, q.x1, q.bot, pal, { base: 0.42, fog, fogc, grain: 0.04, lip: 0.6, panels: b.panels });
  // a piece cantilevered out from one side, its own band of light
  if (b.cant) { const side = r.f() < 0.5 ? -1 : 1, cw = Math.round(6 + r.f() * 14), cy = Math.round(top + (base - top) * (0.2 + r.f() * 0.4)), ch = Math.round(5 + r.f() * 8), cxs = side < 0 ? x0 - cw : x1; P.block(cxs, cy, cxs + cw, cy + ch, pal, { base: 0.5, fog, fogc, lip: 0.8 }); for (let x = cxs + 1; x < cxs + cw - 1; x += 2) if (r.f() < 0.7) P.put(x, cy + Math.round(ch / 2), mixRgb(r.pick(WIN_COLS), fogc, fog * 0.6), glowK); }
  // windows
  const style = b.style;
  for (const q of tiers) {
    const L = q.x0 + 2, Rr = q.x1 - 2;
    if (style === 'bands') for (let y = q.top + 4; y < q.bot - 2; y += 5 + (b.seed % 3)) { if (hash(q.x0, y, b.seed) < 0.45) continue; const col = mixRgb(hash(y, q.x0, 3) < 0.75 ? WIN_COLS[0] : r.pick(WIN_COLS), fogc, fog * 0.6); for (let x = L; x < Rr; x += 3) if (hash(x >> 2, y, b.seed + 1) < 0.45) { P.put(x, y, col, glowK); P.put(x + 1, y, col, glowK); } }
    if (style === 'grid') for (let y = q.top + 3; y < q.bot - 2; y += 4) for (let x = L; x < Rr; x += 3) if (hash(x, y, b.seed + 2) < 0.14) { const col = mixRgb(WIN_COLS[Math.floor(hash(x, y, 5) * WIN_COLS.length)], fogc, fog * 0.6); P.put(x, y, col, glowK); P.put(x, y + 1, mixRgb(col, [0, 0, 0], 0.4), glowK * 0.6); }
    if (style === 'columns') for (let x = L + 1; x < Rr; x += 5) { const lit = hash(x, q.top, b.seed + 3) < 0.6, col = mixRgb(r.pick(WIN_COLS), fogc, fog * 0.6); if (lit) for (let y = q.top + 3; y < q.bot - 2; y++) if (hash(x, y >> 3, b.seed) < 0.35) P.put(x, y, mixRgb(col, [0, 0, 0], (y % 4 === 0) ? 0.5 : 0), glowK * 0.8); }
    if (style === 'dark') for (let y = q.top + 3; y < q.bot - 2; y += 4) for (let x = L; x < Rr; x += 3) if (hash(x, y, b.seed + 4) < 0.04) P.put(x, y, mixRgb(WIN_COLS[1], fogc, fog * 0.6), glowK);
  }
  // a rim of the city's light down the west edge of each tier
  if (b.rim) for (const q of tiers) for (let y = q.top + 1; y < q.bot; y++) if (hash(q.x0, y >> 3, 7) < 0.85) P.put(q.x0, y, mixRgb(b.rim, fogc, fog), 0.3);
  // the crown, on the top tier
  const T0 = tiers[tiers.length - 1], mid = Math.round((T0.x0 + T0.x1) / 2), tw = T0.x1 - T0.x0, red = [255, 50, 60];
  const crown = b.crown;
  if (crown === 'slope') { const hi = r.f() < 0.5, h = Math.round(4 + tw * 0.3); P.area(T0.x0, T0.top - h, T0.x1, T0.top, pal, (x, y) => 0.5 - (y - T0.top + h) * 0.02, { inside: (x, y) => y >= T0.top - h * (hi ? (x - T0.x0) / tw : (T0.x1 - x) / tw), fog, fogc }); }
  if (crown === 'spire') { const h = Math.round(16 + r.f() * 30); for (let y = 0; y < h; y++) { const hw = Math.max(0, Math.round((1 - y / h) * Math.min(4, tw / 4))); for (let x = -hw; x <= hw; x++) P.put(mid + x, T0.top - y, tone(pal, 0.45 + (x < 0 ? 0.1 : -0.05)), 0); } P.put(mid, T0.top - h - 1, red, 1); }
  if (crown === 'masts') { for (let k = 0; k < 3; k++) { const mx = T0.x0 + 2 + Math.round(r.f() * (tw - 4)), h = Math.round(5 + r.f() * 16); for (let y = 0; y < h; y++) P.put(mx, T0.top - y, tone(pal, 0.5)); P.put(mx, T0.top - h, red, 1); } }
  if (crown === 'tank') { const tx = T0.x0 + 2 + Math.round(r.f() * Math.max(1, tw - 12)); P.block(tx, T0.top - 9, tx + 8, T0.top - 3, pal, { base: 0.5, fog, fogc, lip: 0.5 }); for (const lx of [tx + 1, tx + 7]) for (let y = T0.top - 3; y < T0.top; y++) P.put(lx, y, tone(pal, 0.4)); }
  if (crown === 'billboard') {
    const bw = Math.max(14, Math.min(tw + 6, 40)), bx = mid - bw / 2, bh = Math.round(bw * 0.45), by = T0.top - bh - 4, c = mixRgb(r.pick([[255, 74, 176], [58, 240, 224], [255, 176, 64], [160, 120, 255]]), fogc, fog * 0.5);
    for (const lx of [bx + 2, bx + bw - 3]) for (let y = by + bh; y < T0.top; y++) P.put(lx, y, tone(pal, 0.4));
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) { const edge = y === by || x === bx || y === by + bh - 1 || x === bx + bw - 1; P.put(x, y, edge ? c : mixRgb(c, [6, 6, 14], 0.78 - (hash(x >> 1, y, b.seed) < 0.3 ? 0.4 : 0)), edge ? glowK : glowK * 0.4); }
    const gl = GLYPHS[b.seed % GLYPHS.length]; for (let k = 0; k < Math.floor((bw - 4) / 5); k++) for (const [i, j] of GLYPHS[(b.seed + k * 7) % GLYPHS.length]) P.put(bx + 3 + k * 5 + i, by + Math.round(bh / 2) - 2 + j, mixRgb(c, [255, 255, 255], 0.5), glowK); void gl;
  }
  // a neon sign down one side
  if (b.sign) { const side = r.f() < 0.5, n = 3 + r.i(0, 3), sx = side ? x0 - 2 : x1 - 5, sy = Math.round(top + (base - top) * (0.15 + r.f() * 0.3)), c = mixRgb(r.pick([[255, 74, 176], [58, 240, 224], [255, 208, 64]]), fogc, fog * 0.4); for (let k = 0; k < n; k++) for (const [i, j] of GLYPHS[(b.seed + k) % GLYPHS.length]) P.put(sx + i, sy + k * 6 + j, mixRgb(c, [255, 255, 255], 0.35), glowK * 1.6); }
}

// a layer of the city: towers along it, from a seed
function skylineLayer(P, o) {
  const r = new Rng(o.seed); let x = -r.i(0, 20);
  const crowns = o.crowns || ['flat', 'slope', 'spire', 'masts', 'tank', 'billboard'], styles = o.styles || ['bands', 'grid', 'columns', 'dark'];
  while (x < o.w + 20) {
    const w = r.i(o.wmin, o.wmax), h = r.i(o.hmin, o.hmax);
    tower(P, { x, w, top: o.base - h, base: o.base + 40, pal: o.pal, fog: o.fog, fogc: o.fogc, seed: r.i(1, 1e6), steps: r.f() < 0.55 ? r.i(1, 2) : 0, cant: r.f() < (o.cant || 0.25), crown: r.pick(crowns), style: r.pick(styles), sign: r.f() < (o.signs || 0.2), rim: o.rim, glow: o.glow, panels: o.panels });
    x += w + r.i(o.gmin === undefined ? -4 : o.gmin, o.gmax === undefined ? 10 : o.gmax);
  }
}
// clouds in bands: lumpy tops caught by the city's light, darker below,
// thinning out to clear sky and thickening again, never cut off
function cloudBands(P, x0, x1, y0, y1, ramp, seed) {
  for (let i = 0, y = y0; y < y1; i++, y += 18) {
    const top = (x) => y + (noise(x / 40, i * 2.3, seed) - 0.5) * 18 + Math.abs(Math.sin(x / (14 + (i % 3) * 5) + i)) * -6;
    P.area(x0, y - 20, x1, y + 30, ramp, (x, yy) => { const d = yy - top(x); return (d < 1.5 ? 0.75 : 0.5 - Math.min(d, 14) / 14 * 0.35) + (noise(x / 9, yy / 3, seed + i) - 0.5) * 0.1; }, { inside: (x, yy) => { const th = (noise(x / 90, i * 1.7, seed + 9) - 0.32) * 26 + noise(x / 20, i, seed + 5) * 5; return th > 0 && yy >= top(x) + Math.max(0, 4 - th) * 0.5 && yy < top(x) + th; }, jit: 0.4 });
  }
}

// ---- what moves on the layers: holograms and the train -----------------------
const Skyline = {
  // draw the moving things on layer `li` (its offset ox, oy on screen)
  draw(li, g, gg, ox, oy) {
    const L = World.L, t = Game.t;
    for (const h of L.holos) if (h.layer === li) this.holo(h, g, gg, ox, oy, t);
    if (L.train && L.train.layer === li) this.train(L.train, g, gg, ox, oy, t);
  },
  holo(h, g, gg, ox, oy, t) {
    const x0 = Math.round(h.x + ox), y0 = Math.round(h.y + oy); if (x0 > View.w || y0 > View.h || x0 + h.w < 0 || y0 + h.h < 0) return;
    const c = h.cols[Math.floor(t / 6) % h.cols.length], a = 0.75 + Math.sin(t * 1.7 + h.x) * 0.1;
    // now and then a glitch: a band of rows slides sideways
    const glitchY = hash(Math.floor(t * 3), h.x, 41) < 0.05 ? Math.floor(hash(Math.floor(t * 3), h.x, 42) * h.h) : -99;
    const put = (x, y, k = 1) => { if (y % 2) k *= 0.45; const gx = x + (Math.abs(y - glitchY) < 3 ? 4 : 0); gg.globalAlpha = a * k; gg.fillRect(x0 + Math.round(gx), y0 + Math.round(y), 1, 1); };
    gg.fillStyle = css(c);
    if (h.kind === 'ad') {
      // a billboard projected on the air: a frame with corner brackets, a
      // brand in big glyphs, a product turning in the middle, a price that
      // blinks and a slogan running along the bottom. Two products in turn.
      // solid lines and glyphs glow; the faint body of the projection is only
      // tinted into the picture, or the bloom would turn it into a slab
      const W = h.w, H = h.h, fill = (x, y, w, hh, k) => { const tgt = k < 0.5 ? g : gg; tgt.fillStyle = css(c); tgt.globalAlpha = k < 0.5 ? k * 0.8 : a * k; tgt.fillRect(x0 + Math.round(x), y0 + Math.round(y), Math.round(w), Math.round(hh)); tgt.globalAlpha = 1; };
      fill(0, 0, W, H, 0.07);
      for (let x = 0; x < W; x++) { put(x, 0, x < 10 || x > W - 11 ? 1 : 0.35); put(x, H - 1, x < 10 || x > W - 11 ? 1 : 0.35); }
      for (let y = 0; y < H; y++) { put(0, y, y < 10 || y > H - 11 ? 1 : 0.35); put(W - 1, y, y < 10 || y > H - 11 ? 1 : 0.35); }
      const glyphs = (x, y, n, sz, seed, k = 1) => { for (let i = 0; i < n; i++) for (const [gx, gy] of GLYPHS[Math.floor(hash(i, seed, 7) * GLYPHS.length)]) fill(x + (i * 4 + gx) * sz, y + gy * sz, sz, sz, k); };
      const which = Math.floor(t / 8) % 2, ph = (t % 8) / 8;
      // the brand, wiping in at the start of each turn
      const bn = 4, bs = 3, bw = bn * 4 * bs - bs, bx = (W - bw) / 2;
      gg.save(); gg.beginPath(); gg.rect(x0, y0, x0 + bx + bw * Math.min(1, ph * 6) - x0, H); gg.clip(); glyphs(bx, 8, bn, bs, which * 9 + 3); gg.restore();
      for (let x = 10; x < W - 10; x++) put(x, 26, 0.5);
      // the product, turning
      const cx = W / 2, cy = H * 0.47, turn = Math.cos(t * 1.4), wide = 0.35 + Math.abs(turn) * 0.65;
      if (which === 0) {
        // a can: a body, a lit band that slides round, a rim and a ring-pull
        const rw = 14 * (0.85 + 0.15 * wide), top = cy - 22, bot = cy + 22;
        fill(cx - rw, top, rw * 2, bot - top, 0.22);
        for (let y = top; y <= bot; y++) { put(cx - rw, y, 0.9); put(cx + rw, y, 0.9); }
        for (let a2 = 0; a2 < Math.PI * 2; a2 += 0.06) { put(cx + Math.cos(a2) * rw, top + Math.sin(a2) * 3, 0.9); if (Math.sin(a2) > 0) put(cx + Math.cos(a2) * rw, bot + Math.sin(a2) * 3, 0.9); }
        // the label: two stripes round it, and the brand's mark turning with the can
        for (let x = -rw + 1; x < rw; x++) { put(cx + x, cy - 9, 0.6); put(cx + x, cy + 9, 0.6); }
        const th = t * 1.4, lx = cx + Math.sin(th) * rw * 0.55;
        if (Math.cos(th) > -0.1) for (const [gx, gy] of GLYPHS[Math.floor(hash(0, 3, 7) * GLYPHS.length)]) fill(lx - 3 + gx * 2 * (0.5 + Math.cos(th) * 0.5), cy - 5 + gy * 2, Math.max(1, 2 * Math.cos(th)), 2, 1);
        fill(cx - 2, top - 2, 5, 1, 1);
      } else {
        // a bottle of scent: a faceted body, a stopper, a drop that falls
        const rw = 12 * wide, top = cy - 14, bot = cy + 20;
        fill(cx - rw, top, rw * 2, bot - top, 0.24);
        for (let y = top; y <= bot; y++) { put(cx - rw, y, 0.9); put(cx + rw, y, 0.9); put(cx - rw * 0.4 * turn, y, 0.45); }
        for (let x = -rw; x <= rw; x++) { put(cx + x, top, 0.9); put(cx + x, bot, 0.9); }
        fill(cx - 3, top - 9, 7, 8, 0.6); for (let x = -5; x <= 5; x++) put(cx + x, top - 10, 0.9);
        const dy = ((t * 30) % 40); put(cx + rw + 4, top + dy, 1); put(cx + rw + 4, top + dy + 1, 0.7);
      }
      // sparkles round it
      for (let k = 0; k < 5; k++) { const sp = (t * 0.7 + k * 0.37) % 1; if (sp < 0.25) { const sx = cx + (hash(k, Math.floor(t * 0.7 + k * 0.37), 3) - 0.5) * W * 0.7, sy = cy + (hash(k, Math.floor(t * 0.7 + k * 0.37), 4) - 0.5) * 50; gg.fillStyle = '#ffffff'; put(sx, sy); put(sx - 1, sy, 0.5); put(sx + 1, sy, 0.5); put(sx, sy - 1, 0.5); put(sx, sy + 1, 0.5); gg.fillStyle = css(c); } }
      // the price, in a tag that blinks
      if ((t % 1.2) < 0.9) { fill(W - 32, H - 33, 24, 10, 0.35); for (let x = W - 32; x < W - 8; x++) { put(x, H - 33, 0.8); put(x, H - 24, 0.8); } glyphs(W - 29, H - 31, 3, 1, which * 5 + 11, 1); }
      // the slogan, running along the bottom
      gg.save(); gg.beginPath(); gg.rect(x0 + 4, y0, W - 8, H); gg.clip();
      const run = Math.floor((t * 14) % (W + 60)); glyphs(W - run, H - 14, 12, 1, which * 17 + 40, 0.85);
      gg.restore();
    } else if (h.kind === 'koi') {
      // a koi as big as a building, swimming slow circles, fins and tail beating
      const ang = t * 0.25 + h.x, cx = h.w / 2 + Math.cos(ang) * h.w * 0.22, cy = h.h / 2 + Math.sin(ang * 2) * h.h * 0.15, dir = -Math.sin(ang) >= 0 ? 1 : -1, L = h.w * 0.25;
      for (let a2 = 0; a2 < Math.PI * 2; a2 += 0.03) { const x = cx + Math.cos(a2) * L, y = cy + Math.sin(a2) * L * 0.3 * (1 + Math.cos(a2) * dir * 0.25); put(x, y); }
      const beat = Math.sin(t * 4) * 3;
      for (let k = 0; k < L * 0.5; k++) { put(cx - dir * (L + k), cy - k * 0.6 + beat * k / (L * 0.5)); put(cx - dir * (L + k), cy + k * 0.6 + beat * k / (L * 0.5)); }
      for (let k = 0; k < 6; k++) { put(cx + dir * L * 0.1 - k * dir * 0.5, cy + L * 0.3 + k * 0.8 + Math.sin(t * 5) * 1, 0.7); }
      for (let k = 0; k < 4; k++) put(cx + dir * L * 0.65, cy - 2, 1);
      for (let s = 0; s < 6; s++) { const sx = cx + Math.cos(ang * 0.7 + s) * L * 0.5, sy = cy - Math.sin(ang + s * 2) * L * 0.1; put(sx, sy, 0.6); }
    } else if (h.kind === 'ring') {
      // a corporate mark turning in the air
      const cx = h.w / 2, cy = h.h / 2, R0 = Math.min(h.w, h.h) * 0.42, sq = Math.cos(t * 0.8);
      for (let a2 = 0; a2 < Math.PI * 2; a2 += 0.025) { put(cx + Math.cos(a2) * R0 * sq, cy + Math.sin(a2) * R0); put(cx + Math.cos(a2) * R0 * 0.6 * sq, cy + Math.sin(a2) * R0 * 0.6, 0.7); }
      for (let y = -R0 * 0.6; y <= R0 * 0.6; y += 1) put(cx, cy + y, 0.8);
    }
    gg.globalAlpha = 1;
  },
  // the monorail: a train of lit carriages along the layer's track
  train(tr, g, gg, ox, oy, t) {
    const span = tr.span, len = tr.cars * 22, x = ((t * tr.speed) % (span + len)) - len, y0 = Math.round(tr.y + oy);
    for (let k = 0; k < tr.cars; k++) {
      const cx0 = Math.round(x + k * 22 + ox); if (cx0 > View.w || cx0 + 21 < 0) continue;
      g.fillStyle = '#1a2032'; g.fillRect(cx0, y0 - 8, 20, 8); g.fillStyle = '#2a3450'; g.fillRect(cx0, y0 - 8, 20, 1); g.fillStyle = '#0a0e18'; g.fillRect(cx0, y0 - 1, 20, 1);
      for (let w = 2; w < 18; w += 3) { gg.fillStyle = hash(k, w, 3) < 0.8 ? '#ffd8a0' : '#9af0ff'; gg.fillRect(cx0 + w, y0 - 6, 2, 3); }
      if (k === 0) { gg.fillStyle = '#ffffff'; gg.fillRect(cx0 + (tr.speed > 0 ? 19 : 0), y0 - 4, 1, 1); }
    }
  },
};
