'use strict';
// ---------------------------------------------------------------------------
// The city getting on with itself: what moves that nobody asked to move.
// Lights flicker (signs blink now and then, a bad one stutters, tubes buzz,
// fires dance), adverts play on their screens, flying cars cross the sky
// behind the blocks, rats run the gutters and a cat keeps the walkway,
// litter blows along the ground, smoke and steam rise, water drips from the
// underside of the level above, rain splashes. Everything here is driven by
// the clock and `hash`, so it costs no save and repeats nothing exactly.
// ---------------------------------------------------------------------------
const Life = {
  critters: [], trash: [], puffs: [], drops: [], splashes: [], cache: new Map(),
  load() {
    const L = World.L;
    this.critters = L.critters.map((c, i) => ({ ...c, i, x: c.x0 + hash(i, 3, 5) * (c.x1 - c.x0), vx: 0, face: 1, wait: hash(i, 4, 5) * 3, t: 0 }));
    this.trash = [];
    L.trash.forEach((tr, j) => { for (let i = 0; i < tr.n; i++) { const k = j * 50 + i; this.trash.push({ ...tr, k, x: tr.x0 + hash(k, 1, 9) * (tr.x1 - tr.x0), y: tr.y, y0: tr.y, vy: 0, air: 0, kind: hash(k, 2, 9) < 0.6 ? 'paper' : hash(k, 3, 9) < 0.5 ? 'bag' : 'can', spin: 0 }); } });
    this.puffs = []; this.drops = []; this.splashes = [];
  },
  // the wind along the ground, gusting
  wind(t) { return 14 + Math.sin(t * 0.31) * 10 + Math.max(0, Math.sin(t * 0.13 + 1)) * 26 + (noise(t * 0.8, 0, 3) - 0.5) * 12; },
  // how much of its light a flickering light gives right now (0..1)
  flick(fl) {
    if (!fl) return 1;
    const t = Game.t, s = fl.seed;
    if (fl.mode === 'fire') return 0.8 + noise(t * 5, s * 0.1, 7) * 0.35;
    if (fl.mode === 'tube') { if (hash(Math.floor(t * 0.3), s, 11) < 0.07) return hash(Math.floor(t * 13), s, 12) < 0.45 ? 0.3 : 1; return 1; }
    if (fl.mode === 'bad') { if (hash(Math.floor(t * 0.6), s, 13) < 0.4) return hash(Math.floor(t * 9), s, 14) < 0.5 ? 0.15 : 0.9; return 0.95; }
    // a good sign: a slow breath of brightness, and a rare blink
    if (hash(Math.floor(t * 6), s, 15) < 0.008) return 0.25;
    return 0.94 + Math.sin(t * 1.3 + s) * 0.06;
  },
  step(dt) {
    const t = Game.t, L = World.L, wind = this.wind(t);
    // ---- critters
    for (const c of this.critters) {
      c.t += dt;
      const dp = Player.x - c.x, near = Math.abs(dp) < 46 && Math.abs(Player.y - c.y) < 20;
      if (c.kind === 'rat') {
        if (near) { c.vx = -Math.sign(dp || 1) * 95; c.wait = 0.6 + hash(c.i, Game.frame, 1); }
        else if (c.wait > 0) { c.wait -= dt; c.vx *= 0.8; if (c.wait <= 0) c.vx = (hash(c.i, Game.frame, 2) < 0.5 ? -1 : 1) * (40 + hash(c.i, Game.frame, 3) * 40); }
        else if (hash(c.i, Game.frame, 4) < dt * 0.8) c.wait = 0.5 + hash(c.i, Game.frame, 5) * 2.5;
        c.x += c.vx * dt; if (c.x < c.x0) { c.x = c.x0; c.vx = Math.abs(c.vx); } if (c.x > c.x1) { c.x = c.x1; c.vx = -Math.abs(c.vx); }
        if (Math.abs(c.vx) > 3) c.face = Math.sign(c.vx);
      } else if (c.kind === 'cat') {
        if (near && !c.flee) { c.flee = 1.2; c.vx = -Math.sign(dp || 1) * 70; }
        if (c.flee) { c.flee -= dt; if (c.flee <= 0) { c.flee = 0; c.vx = 0; } }
        else if (hash(Math.floor(c.t * 0.2), c.i, 6) < 0.2) c.vx = (hash(Math.floor(c.t * 0.2), c.i, 7) < 0.5 ? -1 : 1) * 22; else c.vx = 0;
        c.x = clamp(c.x + c.vx * dt, c.x0, c.x1); if (Math.abs(c.vx) > 3) c.face = Math.sign(c.vx);
      } else if (c.kind === 'dog') {
        // a synth dog: trots about, and comes to heel by you for a while
        const d = Math.abs(dp);
        if (d < 90 && Math.abs(Player.y - c.y) < 20) c.vx = d > 22 ? Math.sign(dp) * 60 : 0;
        else if (hash(Math.floor(c.t * 0.3), c.i, 8) < 0.35) c.vx = (hash(Math.floor(c.t * 0.3), c.i, 9) < 0.5 ? -1 : 1) * 34; else c.vx = 0;
        c.x = clamp(c.x + c.vx * dt, c.x0, c.x1); if (Math.abs(c.vx) > 3) c.face = Math.sign(c.vx); else if (d < 90) c.face = Math.sign(dp) || 1;
      } else if (c.kind === 'owl') {
        // an owl on its perch: it turns its head to follow you
        c.vx = 0; c.face = Math.abs(dp) < 140 ? Math.sign(dp) || 1 : c.face;
      }
    }
    // ---- litter: slides in the wind, lifts in a gust, tumbles
    for (const p of this.trash) {
      const heavy = p.kind === 'can' ? 0.35 : p.kind === 'bag' ? 1.2 : 1;
      if (p.air > 0 || p.y < p.y0) { p.vy += (p.kind === 'bag' ? 60 : 140) * dt; p.y += p.vy * dt; if (p.y >= p.y0 && p.vy > 0) { p.y = p.y0; p.vy = 0; p.air = 0; } }
      const gust = wind * heavy * (0.5 + noise(t * 0.7, p.k, 4) * 0.8);
      if (p.y >= p.y0 && gust > 22 && hash(p.k, Math.floor(t * 4), 6) < dt * (p.kind === 'can' ? 0.5 : 3)) { p.vy = -(20 + gust * (p.kind === 'can' ? 0.2 : 0.9)); p.air = 1; }
      p.x += gust * (p.air || p.y < p.y0 ? 1 : p.kind === 'can' ? 0.45 : 0.6) * dt; p.spin += gust * dt * 0.2;
      if (p.x > p.x1) { p.x = p.x0; p.y = p.y0; p.vy = 0; } // gone round the corner; another comes
    }
    // ---- smoke, steam, drips, splashes
    for (const v of L.vents) if (Math.abs(v.x - Game.cam.x) < 300 && hash(v.x, Math.floor(t * 9), 8) < (v.kind === 'steam' ? 0.9 : 0.6) && Math.floor(t * 9) !== v.last) { v.last = Math.floor(t * 9); this.puffs.push({ x: v.x + (hash(v.x, Game.frame, 1) - 0.5) * 4, y: v.y, vy: -(v.kind === 'steam' ? 26 : 14) - hash(v.x, Game.frame, 2) * 8, t: 0, life: v.kind === 'steam' ? 1.6 : 2.6, kind: v.kind }); }
    for (const n of Actors.npcs) if (n.def.smoke && !n.hidden && Math.abs(n.x - Game.cam.x) < 300 && hash(n.i, Math.floor(t * 3), 9) < 0.5 && Math.floor(t * 3) !== n.lastPuff) { n.lastPuff = Math.floor(t * 3); this.puffs.push({ x: n.x + n.face * 6, y: n.y - 24, vy: -9, t: 0, life: 2.2, kind: 'smoke', thin: true }); }
    for (const p of Tycho.fx.age(this.puffs, dt)) { p.y += p.vy * dt; p.x += wind * 0.25 * dt * (p.t / p.life + 0.2); }
    for (const d of L.drips) if (hash(d.x, Math.floor(t * 2 + d.x), 10) < 0.5 && Math.floor(t * 2 + d.x) !== d.last) { d.last = Math.floor(t * 2 + d.x); this.drops.push({ x: d.x, y: d.y0, vy: 0, y1: d.y1 }); }
    for (const d of this.drops) { d.vy += 500 * dt; d.y += d.vy * dt; if (d.y >= d.y1) { d.done = true; this.splashes.push({ x: d.x, y: d.y1, t: 0 }); } }
    this.drops = this.drops.filter((d) => !d.done);
    const rk = L.rain ? Weather.rain() : 0;
    if (rk > 0.05) for (const w of L.wet) for (let k = 0; k < Math.ceil(3 * rk); k++) { const x = Game.cam.x + (hash(Game.frame, k, 21) - 0.5) * View.w; if (x > w.x0 && x < w.x1 && !(L.dry || []).some((r) => x > r[0] && x < r[2] && w.y - 1 > r[1] && w.y - 1 < r[3])) this.splashes.push({ x, y: w.y - 1, t: 0 }); }
    Tycho.fx.age(this.splashes, dt, 0.18);
    if (this.splashes.length > 80) this.splashes.splice(0, this.splashes.length - 80);
  },
  // ---- sprites, cached by frame
  art(key, make) { let s = this.cache.get(key); if (!s) { s = make(); this.cache.set(key, s); } return s; },
  rat(frame, left) {
    return this.art('rat' + frame + left, () => {
      const S = new Spr(12, 6, 91); S.ax = 6; S.ay = 5;
      S.ell(5.5, 3, 3.2, 1.8, ['#1a1614', '#3a322c', '#5a4e44', '#7a6a5a']); S.ell(8.6, 3.2, 1.6, 1.3, ['#1a1614', '#3a322c', '#5a4e44']);
      S.px(9.4, 2.6, '#ff3a3a'); S.px(10.2, 3.6, '#c88a8a');
      for (let k = 0; k < 4; k++) S.px(2.2 - k * 0.9, 3.4 + Math.sin(k + frame * 2) * 0.6 + k * 0.2, '#6a4a4a');
      S.px(4 + (frame ? 1 : 0), 5, '#2a2420'); S.px(7 - (frame ? 1 : 0), 5, '#2a2420');
      const s = S.done(); return left ? flipSprite(s) : s;
    });
  },
  cat(frame, left) {
    return this.art('cat' + frame + left, () => {
      const S = new Spr(14, 10, 93); S.ax = 7; S.ay = 9; const fur = ['#0e0c10', '#1e1a20', '#2e2832', '#4a4250'];
      S.ell(6, 6, 3.6, 2.6, fur); S.ell(9.6, 3.6, 2, 1.8, fur); S.px(8.8, 1.4, fur[2]); S.px(10.6, 1.4, fur[2]);
      S.px(10.4, 3.4, '#e8d040', true); for (let y = 7; y < 10; y++) { S.px(4, y, fur[1]); S.px(8, y, fur[1]); }
      for (let k = 0; k < 5; k++) S.px(2.6 - k * 0.5 + (frame ? k * 0.3 : 0), 6 - k * 1.1, fur[2]);
      const s = S.done(); return left ? flipSprite(s) : s;
    });
  },
  dog(frame, left) {
    return this.art('dog' + frame + left, () => {
      const S = new Spr(16, 12, 95); S.ax = 8; S.ay = 11; const fur = ['#2a2018', '#4a3a2a', '#6a5440', '#8a7058'];
      S.ell(7, 6.5, 4.6, 2.6, fur); S.ell(12, 4, 2.2, 2, fur); S.box(13, 4, 15, 6, fur.slice(1)); S.px(11, 1.6, fur[1]); S.px(12, 1.4, fur[0]);
      S.px(12.6, 3.4, '#3af0e0', true); S.box(10, 5, 11, 7, ['#1a6a7a', '#3af0e0'], { glow: true });
      const a = frame ? 1 : 0; for (let y = 8; y < 12; y++) { S.px(4 + a, y, fur[1]); S.px(6 - a, y, fur[0]); S.px(9 - a, y, fur[1]); S.px(11 + a, y, fur[0]); }
      S.limb(2.6, 6, 0.6, 3 + a, 0.7, fur.slice(1));
      const s = S.done(); return left ? flipSprite(s) : s;
    });
  },
  owl(frame, left) {
    return this.art('owl' + frame + left, () => {
      const S = new Spr(12, 16, 97); S.ax = 6; S.ay = 15; const f = ['#2a2420', '#4a4038', '#7a6a58', '#a89880'];
      S.ell(6, 9.5, 4, 5.4, f); S.ell(6, 4.6, 3.6, 3.2, f); S.px(3, 1.6, f[1]); S.px(9, 1.6, f[1]);
      S.px(4.4, 4.4, '#ffb030', true); S.px(7.6, 4.4, '#ffb030', true); if (!frame) { S.px(4.4, 4.4, '#ffe080', true); S.px(7.6, 4.4, '#ffe080', true); }
      S.px(6, 5.6, '#3a2a1a'); for (let y = 9; y < 14; y += 2) S.px(6 + (y % 4 ? 1 : -1), y, f[3]);
      S.px(4, 15, '#5a4a2a'); S.px(8, 15, '#5a4a2a');
      const s = S.done(); return left ? flipSprite(s) : s;
    });
  },
  // the flying cars behind the blocks: lanes across the far layer, each car's
  // place worked out from the clock, so nothing needs keeping
  drawTraffic(g, gg, cx, cy, layer) {
    const L = World.L;
    const t = Game.t, w = View.w;
    L.traffic.forEach((lane, li) => {
      if ((lane.layer === undefined ? -1 : lane.layer) !== (layer === undefined ? -1 : layer)) return;
      const F = layer === undefined ? World.far : World.layers[layer]; if (!F) return;
      const span = (layer === undefined ? L.far.w : L.layers[layer].w) + 200, scale = lane.scale;
      for (let j = 0; j < lane.n; j++) {
        const off = hash(li, j, 31) * span, x = ((off + t * lane.speed * lane.dir) % span + span) % span - 100;
        const sx = Math.round(x - cx * F.f), sy = Math.round(lane.y + Math.sin(t * 0.9 + j) * 1.5 - cy * F.fy);
        if (sx < -30 || sx > w + 30) continue;
        const s = this.art('av' + li + j + lane.dir, () => { const c = car({ col: ['#2a2a3a', '#3a2a2a', '#d8d8e0', '#2a3a3a'][j % 4] }); const [cv, cg] = canvasOf(Math.ceil(60 * scale), Math.ceil(22 * scale)); cg.imageSmoothingEnabled = true; if (lane.dir < 0) { cg.translate(cv.width, 0); cg.scale(-1, 1); } cg.drawImage(c.c, 0, 0, cv.width, cv.height); return { c: cv, w: cv.width, h: cv.height }; });
        g.globalAlpha = lane.fog; g.drawImage(s.c, sx - s.w / 2, sy - s.h / 2); g.globalAlpha = 1;
        // head and tail lights, and the glow under
        const front = sx + lane.dir * s.w / 2, back = sx - lane.dir * s.w / 2;
        gg.fillStyle = '#fff4d8'; gg.fillRect(front - (lane.dir > 0 ? 1 : 0), sy, 1, 1);
        gg.fillStyle = '#ff3030'; gg.fillRect(back - (lane.dir > 0 ? 0 : 1), sy, 1, 1);
        if (hash(li, j, 33) < 0.4) { gg.fillStyle = ['#3af0e0', '#ff4ab0'][j % 2]; gg.fillRect(sx - s.w / 3, sy + Math.ceil(s.h / 2), Math.ceil(s.w * 0.66), 1); }
      }
    });
  },
  // litter, critters, smoke: in the world, lit by the light map
  drawWorld(g, gg, cx, cy) {
    const t = Game.t;
    for (const p of this.puffs) { const a = (1 - p.t / p.life) * (p.thin ? 0.25 : 0.35), r = 1 + (p.t / p.life) * (p.thin ? 2 : 5); g.globalAlpha = a; g.fillStyle = p.kind === 'steam' ? '#c8ccd8' : '#8a8690'; g.fillRect(Math.round(p.x - r - cx), Math.round(p.y - r - cy), Math.ceil(r * 2), Math.ceil(r * 2)); }
    g.globalAlpha = 1;
    for (const p of this.trash) {
      const x = Math.round(p.x - cx), y = Math.round(p.y - cy); if (x < -6 || x > View.w + 6 || y < -6 || y > View.h + 6) continue;
      const f = Math.floor(p.spin) % 3;
      if (p.kind === 'paper') { g.fillStyle = '#c8c0a8'; if (f === 0 || p.y >= p.y0) g.fillRect(x - 2, y - 1, 4, 1); else if (f === 1) g.fillRect(x - 1, y - 2, 2, 2); else g.fillRect(x - 1, y - 3, 1, 3); g.fillStyle = '#5a5448'; g.fillRect(x - 1, y - 1, 1, 1); }
      else if (p.kind === 'bag') { g.fillStyle = '#d8dce8'; g.fillRect(x - 2, y - 3 + (f === 1 ? 1 : 0), 3, 3); g.fillStyle = '#9aa0b0'; g.fillRect(x - 2, y - 1, 3, 1); }
      else { g.fillStyle = '#b83a2a'; g.fillRect(x - 1, y - 2, f % 2 ? 2 : 3, f % 2 ? 2 : 1); g.fillStyle = '#e8e8e8'; g.fillRect(x - 1, y - 2, 1, 1); }
    }
    for (const c of this.critters) {
      const moving = Math.abs(c.vx) > 3, fr = moving ? Math.floor(t * 12) % 2 : 0;
      const s = c.kind === 'rat' ? this.rat(fr, c.face < 0) : c.kind === 'dog' ? this.dog(fr, c.face < 0) : c.kind === 'owl' ? this.owl(hash(Math.floor(t * 2), c.i, 3) < 0.08 ? 1 : 0, c.face < 0) : this.cat(c.kind === 'cat' && !moving ? Math.floor(t * 0.7 + c.i) % 2 : fr, c.face < 0);
      const x = Math.round(c.x - s.ax - cx), y = Math.round(c.y - s.ay - cy);
      if (x > -16 && x < View.w + 16 && y > -12 && y < View.h + 12) { g.drawImage(s.c, x, y); if (s.e) gg.drawImage(s.e, x, y); }
    }
  },
  // drips and splashes catch the light: they go in the glow, faintly
  drawGlints(gg, cx, cy) {
    gg.fillStyle = 'rgba(150,180,220,0.55)';
    for (const d of this.drops) gg.fillRect(Math.round(d.x - cx), Math.round(d.y - cy), 1, 2);
    for (const s of this.splashes) { const x = Math.round(s.x - cx), y = Math.round(s.y - cy), k = s.t < 0.09 ? 1 : 2; gg.fillRect(x - k, y - 1, 1, 1); gg.fillRect(x + k, y - 1, 1, 1); }
  },
  // the adverts, frame by frame, as light; each also tints its own lamp
  drawAds(gg, cx, cy) {
    const t = Game.t;
    for (const A of World.L.ads) {
      const x0 = A.x - cx, y0 = A.y - cy; if (x0 > View.w || y0 > View.h || x0 + A.w < 0 || y0 + A.h < 0) continue;
      const [c1, c2] = A.cols, put = (x, y, c, a = 1) => { if (x < 0 || y < 0 || x >= A.w || y >= A.h) return; gg.globalAlpha = a * (y % 2 ? 0.6 : 1); gg.fillStyle = css(c); gg.fillRect(Math.round(x0 + x), Math.round(y0 + y), 1, 1); };
      let lit = c1;
      if (A.kind === 'marquee') {
        // glyphs scrolling, two lines the opposite ways
        const sp = 14, rows = A.h >= 14 ? 2 : 1;
        for (let r = 0; r < rows; r++) { const off = (t * sp * (r ? -1 : 1)) % (A.w + 40), col = r ? c2 : c1; for (let k = 0; k < 12; k++) { const gx = ((k * 5 - off) % (A.w + 40) + A.w + 40) % (A.w + 40) - 20, gl = GLYPHS[(k * 7 + r * 3 + A.x) % GLYPHS.length]; for (const [i, j] of gl) put(gx + i, 2 + r * 7 + j, col); } }
      } else if (A.kind === 'koi') {
        // a fish swimming a figure of eight, its tail beating
        const cxk = A.w / 2 + Math.sin(t * 0.5) * (A.w * 0.3), cyk = A.h / 2 + Math.sin(t * 1) * (A.h * 0.22), dir = Math.cos(t * 0.5) >= 0 ? 1 : -1, L = A.w * 0.22;
        for (let a = 0; a < Math.PI * 2; a += 0.12) put(cxk + Math.cos(a) * L, cyk + Math.sin(a) * L * 0.32, c1);
        for (let k = 0; k < 5; k++) { const beat = Math.sin(t * 8) * 2; put(cxk - dir * (L + k), cyk - k * 0.7 + beat * (k / 5), c1); put(cxk - dir * (L + k), cyk + k * 0.7 + beat * (k / 5), c1); }
        put(cxk + dir * L * 0.6, cyk - 1, [255, 255, 255]);
        for (let b = 0; b < 3; b++) { const by = A.h - ((t * 8 + b * 7) % A.h); put(cxk + dir * L + b * 2, by, c2, 0.7); }
      } else if (A.kind === 'cycle') {
        // three scenes in turn: a steaming bowl, a pulsing logo, a face that blinks
        const scene = Math.floor(t / 3.5) % 3, u = (t % 3.5) / 3.5;
        if (scene === 0) { lit = c1; const bx = A.w / 2, by = A.h * 0.62; for (let i = -7; i <= 7; i++) for (let j = 0; j <= 4; j++) if ((i * i) / 49 + (j * j) / 16 <= 1) put(bx + i, by + j, j === 0 ? [255, 255, 255] : c1); for (let k = 0; k < 3; k++) for (let s = 0; s < 5; s++) put(bx - 4 + k * 4 + Math.round(Math.sin(t * 3 + s + k)), by - 2 - s - ((t * 6) % 2), c2, 0.6); put(bx + 5, by - 6, c2); put(bx + 6, by - 7, c2); put(bx + 7, by - 8, c2); }
        if (scene === 1) { lit = c2; const r = 3 + u * (Math.min(A.w, A.h) / 2 - 3); for (let a = 0; a < Math.PI * 2; a += 0.15) { put(A.w / 2 + Math.cos(a) * r, A.h / 2 + Math.sin(a) * r, c2, 1 - u); put(A.w / 2 + Math.cos(a) * 4, A.h / 2 + Math.sin(a) * 4, c1); } for (const [i, j] of GLYPHS[(Math.floor(A.x) + 5) % GLYPHS.length]) put(A.w / 2 - 1 + i, A.h / 2 - 2 + j, [255, 255, 255]); }
        if (scene === 2) { lit = c1; const fx = A.w / 2, fy = A.h / 2; for (let a = 0; a < Math.PI * 2; a += 0.12) put(fx + Math.cos(a) * A.w * 0.22, fy + Math.sin(a) * A.h * 0.36, c1); const blink = (t % 2.2) < 0.15; for (const ex of [-3, 3]) { put(fx + ex, fy - 2, c2); if (!blink) put(fx + ex, fy - 1, [255, 255, 255]); } for (let k = -3; k <= 3; k++) put(fx + k, fy + 4 + Math.abs(k) * 0.2 - (Math.sin(t * 2) > 0 ? 0 : 1) * (k === 0 ? 0 : 0), c2); }
        // a wipe between scenes
        if (u > 0.94) for (let y = 0; y < A.h; y++) put(Math.floor((u - 0.94) / 0.06 * A.w), y, [255, 255, 255], 0.8);
      } else if (A.kind === 'ecg') {
        // a heartbeat trace running across, a dot at its head, the rate in glyphs
        const head = (t * 18) % A.w, base = A.h * 0.62;
        for (let x = 0; x < A.w; x++) { const age = (head - x + A.w) % A.w, ph = (x + Math.floor(t * 18 / A.w) * 7) % 22, y = ph === 8 ? base - 6 : ph === 9 ? base + 3 : ph === 10 ? base - 2 : base; if (age < A.w - 4) put(x, y, c1, 1 - age / A.w); }
        put(head, base, [255, 255, 255]);
        for (const [i, j] of GLYPHS[(Math.floor(t / 2) + A.x) % GLYPHS.length]) put(2 + i, 2 + j, c2); for (const [i, j] of GLYPHS[(Math.floor(t / 2) + 3) % GLYPHS.length]) put(6 + i, 2 + j, c2);
      } else if (A.kind === 'readout') {
        // rows of figures ticking over, one line flagged in the second color
        for (let r = 0; r < Math.floor((A.h - 2) / 6); r++) { const flag = (Math.floor(t / 1.5) + r) % 5 === 0; for (let k = 0; k < Math.floor((A.w - 4) / 5); k++) { const gl = GLYPHS[(k * 3 + r * 5 + Math.floor(t * (r % 2 ? 3 : 1.5))) % GLYPHS.length]; for (const [i, j] of gl) put(2 + k * 5 + i, 2 + r * 6 + j, flag ? c2 : c1, flag ? 1 : 0.8); } }
        if (Math.floor(t * 2) % 2) put(A.w - 3, A.h - 3, c2);
      } else if (A.kind === 'bars') {
        for (let k = 0; k < Math.floor(A.w / 3); k++) { const hh = Math.floor((0.25 + 0.75 * Math.abs(Math.sin(t * (2 + (k % 4) * 0.7) + k))) * (A.h - 2)); for (let y = 0; y < hh; y += 2) put(1 + k * 3, A.h - 1 - y, y > A.h * 0.6 ? c2 : c1); }
      }
      gg.globalAlpha = 1;
      A.l.c = lit.map((q) => q / 255);
    }
  },
};
