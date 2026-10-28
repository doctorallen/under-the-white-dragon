'use strict';
// ---------------------------------------------------------------------------
// Tyrell mode (dev): the city's minds laid out to watch, on Tycho's minds
// inspector (Tycho.inspect: vendor/tycho/docs/inspect.md), which shows
// anyone's mind and runs the clock; the map it's drawn on is the game's.
// Everyone is drawn where the simulation has them, colored by what they're
// doing:
//   the city: every street a line, band by band from the Spires down; people
//     out on a street sit on its line, people indoors stack under their door,
//     people between streets or riding between bands hang between the lines;
//   a street (or a room): the painted level, like the pause map, with people
//     on it and counts on the doors of who's inside.
// Pick anyone to see their mind: what they're doing and until when, their
// needs, today's routine, why they chose what they're doing (every option
// weighed, and what ruled the others out: Tyrell's Palantír), what they've
// done lately (Westmarch), and who they know (Fellowship). The clock runs
// from here: play at a speed, or step back and forward; going back is
// Esper's time walk, as far as it remembers.
// ---------------------------------------------------------------------------
const TM_KIND = { work: 'work', stock: 'work', sweep: 'work', school: 'school', sleep: 'sleep', home: 'home', eat_home: 'home', host: 'home', visit: 'home', eat: 'eat', drink: 'fun', pachi: 'fun', watch: 'fun', dance: 'fun', arcade: 'fun', festival: 'fun', bathe: 'fun', loaf: 'fun', play: 'fun', pray: 'fun', shop: 'errand', laundry: 'errand', clinic: 'errand', browse: 'errand', pay: 'errand', collect: 'errand' };
const TM_COL = { work: '#ffb040', school: '#ffe060', sleep: '#5a6ad8', home: '#8aa4ff', eat: '#3aff80', fun: '#ff4ab0', errand: '#3af0e0', other: '#c8c0d8' };
const TM_WORD = { work: 'working', school: 'at school', sleep: 'asleep', home: 'at home', eat: 'eating', fun: 'out for fun', errand: 'errands', other: 'other' };
const TM_SPEEDS = [1, 10, 60, 240]; // game minutes a second

const TyrellMode = {
  view: 'city', level: null, follow: false, ox: 0, zoom: 1, pics: new Map(), rows: null,
  // the inspector: the mind, the clock and the side are Tycho's; the words
  // for places and people, the buttons and the map are the game's
  ins: new Tycho.inspect.Inspector({
    prefix: 'tm', bg: '#0a0812', speeds: TM_SPEEDS, speed: 60,
    world: () => (City.on ? City.w : null),
    people: () => TOWN_ORDER,
    kinds: Object.fromEntries(Object.keys(TM_COL).map((k) => [k, { color: TM_COL[k], word: TM_WORD[k] }])),
    kind: (id) => TyrellMode.kind(City.state(id)),
    note: (id) => City.state(id).act,
    // the game's clock (day and hour) as Tyrell's minutes, and the minds brought there
    clock: {
      now: () => (Game.s.day * 24 + Game.s.time) * 60,
      set(m) { const s = Game.s, t = m / 60; s.day = Math.max(0, Math.floor(t / 24)); s.time = t - s.day * 24; City.sync(); },
      text: () => `Day ${Game.s.day} · ${Game.clock()}`,
    },
    say: (t) => Game.toast(t, 'warn'),
    name: (id) => RESIDENTS[id].name,
    who: (id) => Folk.who(id),
    place: (pid, id) => (!pid ? 'anywhere' : pid === RESIDENTS[id].homePlace ? 'home' : Census.places[pid] ? Census.places[pid].label : pid),
    walking: (id) => (City.state(id).gap ? ' (off screen)' : ''),
    about(id, p) { const R = RESIDENTS[id]; return `${p.vars && p.vars.money !== undefined ? ` · ${Math.round(p.vars.money)} cr` : ''}${R.likes && Object.keys(R.likes).length ? ' · likes ' + Object.keys(R.likes).join(', ') : ''}${Chat.about(id)}`; },
    selectable: (id) => !!RESIDENTS[id],
    buttons(id) { const st = City.state(id), T = TyrellMode; return `<button data-tmdo="follow" class="${T.follow ? 'go' : ''}">${T.follow ? 'Following' : 'Follow'}</button><button data-tmdo="street">Their street</button><button data-tmdo="go" ${st.level && !st.hidden ? '' : 'disabled'}>Go there</button>`; },
    bar: () => '<button data-tm="city" id="tmcity">City</button><span class="tmwhere" id="tmwhere"></span>',
    status() { const T = TyrellMode, c = $('tmcity'); if (c) c.classList.toggle('go', T.view === 'city'); const wh = $('tmwhere'); if (wh) wh.textContent = T.view === 'street' ? LEVELS[T.level].name : 'Everyone, everywhere'; },
    summary: () => TyrellMode.summary(),
    // picked from a list or a mind: on a street, to their street
    onSelect(id) { const T = TyrellMode, w = T.where(id); if (T.view === 'street' && w.st.level && w.st.level !== T.level && !w.st.hidden) T.open(w.st.level); },
    act(k, id) {
      const T = TyrellMode;
      if (k === 'city') { T.view = 'city'; T.level = null; }
      if (k === 'follow') { T.follow = !T.follow; const st = City.state(id); if (T.follow && st.level && !st.hidden) T.open(st.level); }
      if (k === 'street') { const w = T.where(id); if (w.street) T.open(w.room && LEVELS[w.room] && LEVELS[w.room].hidden && !w.st.hidden ? w.room : w.street); }
      if (k === 'go') { const st = City.state(id); if (st.level && !st.hidden) { Hud.toggle(null); Dev.landAt = { level: st.level, x: st.x + 14, y: st.y }; Game.go(st.level, Object.keys(Census.built(st.level).spawns)[0]); } return false; }
    },
    open: () => Hud.open === 'tyrell',
    view: {
      // the city scrolls: as tall as its rows
      height: (box) => (TyrellMode.view === 'city' ? Math.max(box, TyrellMode.cityRows().h) : box),
      draw: (g) => (TyrellMode.view === 'city' ? TyrellMode.drawCity(g) : TyrellMode.drawStreet(g)),
      tap: (b) => TyrellMode.tapBadge(b),
      // a drag scrolls a street, the wheel zooms it
      grab: () => TyrellMode.ox,
      drag(dx, dy, ox) { const T = TyrellMode; if (T.view === 'street') { T.ox = ox - dx; T.ins.draw(); } },
      wheel(e, mx) { const T = TyrellMode; if (T.view !== 'street') return; e.preventDefault(); const k = e.deltaY < 0 ? 1.25 : 0.8, z0 = T.zoom; T.zoom = clamp(T.zoom * k, 0.5, 6); T.ox = (T.ox + mx) * (T.zoom / z0) - mx; T.ins.draw(); },
    },
  }),
  get sel() { return this.ins.sel; }, set sel(v) { this.ins.sel = v; },
  get list() { return this.ins.list; }, set list(v) { this.ins.list = v; },
  get dots() { return this.ins.dots; },
  get badges() { return this.ins.badges; },
  get w() { return this.ins.w; },
  get h() { return this.ins.h; },
  html() {
    if (!City.on) return '<p class="sub">Tyrell isn\'t running: there are no minds to watch.</p>';
    return this.ins.html();
  },
  attach() { if ($('tmcv')) this.ins.attach($('panelBody')); },
  // ---- the clock, the side and the picture: the inspector's -------------------
  step(min, quiet) { this.ins.step(min, quiet); },
  side(force) { this.ins.side(force); },
  draw() { this.ins.draw(); },
  size() { this.ins.size(); },
  kind(st) { return TM_KIND[st.act] || 'other'; },
  // ---- where everyone is, for drawing: a street and an x, out or in -----------
  where(id) {
    const st = City.state(id), C = Census.places;
    if (st.gap) return { st, between: st.gap };
    if (st.level && Census.streets[st.level]) return { st, street: st.level, x: st.x, out: !st.hidden };
    const pl = C[st.place] || (st.level && C[st.level]) || (st.apt && C['apt:' + st.apt]);
    if (pl) return { st, street: pl.street, x: pl.x, room: pl.kind === 'room' ? (pl.level || st.level) : null, door: pl.id, out: false };
    return { st };
  },
  // ---- the city: every street a line, band by band ---------------------------
  cityRows() {
    if (this.rows) return this.rows;
    const rows = [], RH = 34, BH = 22; let y = 8;
    for (const S of STRATA) {
      const ids = Object.keys(Census.streets).filter((k) => Census.streets[k].band === S.id).sort((a, b) => (Census.streets[a].row < 0) - (Census.streets[b].row < 0) || Census.streets[a].row - Census.streets[b].row);
      if (!ids.length) continue;
      rows.push({ band: S, y }); y += BH;
      for (const id of ids) { rows.push({ street: id, y: y + 10 }); y += RH; }
    }
    return (this.rows = { rows, h: y + 8 });
  },
  drawCity(g) {
    const R = this.cityRows(), LW = 118, x0 = LW, x1 = this.w - 10, maxW = Math.max(...Object.values(Census.streets).map((s) => s.w)), sx = (id, x) => x0 + (x / maxW) * (x1 - x0), rowY = {};
    g.font = '11px ui-monospace, monospace'; g.textBaseline = 'middle';
    for (const r of R.rows) {
      if (r.band) { g.fillStyle = '#b0a6c0'; g.fillText(r.band.name.toUpperCase(), 8, r.y + 8); continue; }
      const S = Census.streets[r.street]; rowY[r.street] = r.y;
      g.fillStyle = this.level === r.street ? '#3af0e0' : '#d8d0e8'; g.fillText(LEVELS[r.street].name.slice(0, 17), 8, r.y);
      g.fillStyle = '#3a3050'; g.fillRect(sx(r.street, 0), r.y, sx(r.street, S.w) - sx(r.street, 0), 1);
      this.badges.push({ x0: 0, x1: LW, y0: r.y - 10, y1: r.y + 10, street: r.street });
    }
    // everyone
    const stacks = {};
    for (const id of TOWN_ORDER) {
      const w = this.where(id), k = this.kind(w.st), col = TM_COL[k];
      if (w.between) {
        const A = w.between, ya = rowY[A.from], yb = rowY[A.to]; if (ya === undefined || yb === undefined) continue;
        const x = sx(A.from, A.x0) + (sx(A.to, A.x1) - sx(A.from, A.x0)) * A.f, y = ya + (yb - ya) * A.f;
        this.ins.dot(g, x, y, col, id, true); continue;
      }
      if (!w.street || rowY[w.street] === undefined) continue;
      const y = rowY[w.street], x = sx(w.street, w.x);
      if (w.out) { this.ins.dot(g, x, y - 4, col, id, w.st.moving); continue; }
      const key = w.street + ':' + Math.round(x / 3); const n = (stacks[key] = (stacks[key] || 0) + 1) - 1;
      if (n < 15) this.ins.dot(g, x - 4 + (n % 3) * 4, y + 5 + Math.floor(n / 3) * 4, col, id, false, 1.5);
    }
  },
  // ---- a street or a room: its picture, people on it, counts on its doors ----------
  picture(lid) {
    if (this.pics.has(lid)) return this.pics.get(lid);
    const L = Census.built(lid), CS = T.chunk, [c, g] = canvasOf(L.w, L.h);
    g.fillStyle = '#0a0c14'; g.fillRect(0, 0, L.w, L.h);
    for (let ky = 0; ky * CS < L.h; ky++) for (let kx = 0; kx * CS < L.w; kx++) { const ch = paintChunk(L, kx, ky); g.drawImage(ch.c, ch.x, ch.y); }
    for (const p of L.props) { const s = Props.sprite(p); if (s) g.drawImage(s.c, Math.round(p.x - s.ax), Math.round(p.y - s.ay)); }
    if (this.pics.size > 4) this.pics.delete(this.pics.keys().next().value);
    this.pics.set(lid, c); return c;
  },
  drawStreet(g) {
    const lid = this.level, L = Census.built(lid), pic = this.picture(lid), k = (this.h / L.h) * this.zoom, top = this.h - L.h * k;
    this.ox = clamp(this.ox, -40, Math.max(-40, L.w * k - this.w + 40));
    g.imageSmoothingEnabled = k < 1; g.drawImage(pic, -this.ox, top, L.w * k, L.h * k);
    g.fillStyle = 'rgba(6,5,10,0.35)'; g.fillRect(0, 0, this.w, this.h);
    const X = (x) => x * k - this.ox, Y = (y) => top + y * k;
    // who's behind each door: homes, shops, and the rooms you can walk into
    const inside = {}, C = Census.places;
    for (const id of TOWN_ORDER) {
      const w = this.where(id); if (w.street !== lid || w.out) continue;
      const key = w.room && w.room !== lid ? w.room : w.door || w.room; if (!key) continue;
      (inside[key] = inside[key] || []).push(id);
    }
    g.font = '11px ui-monospace, monospace'; g.textBaseline = 'middle';
    for (const key in inside) {
      const pl = C[key] || C[Object.keys(C).find((q) => C[q].level === key)]; if (!pl) continue;
      const x = X(pl.x), y = Y(Census.streets[lid] ? Census.streets[lid].G : pl.G) - 46 * k, n = inside[key].length, label = String(n);
      g.fillStyle = pl.kind === 'room' ? 'rgba(58,240,224,0.9)' : 'rgba(180,170,210,0.85)'; const bw = g.measureText(label).width + 8; g.fillRect(x - bw / 2, y - 7, bw, 14);
      g.fillStyle = '#0a0812'; g.fillText(label, x - bw / 2 + 4, y);
      this.badges.push({ x0: x - bw / 2, x1: x + bw / 2, y0: y - 7, y1: y + 7, inside: inside[key], place: pl, room: pl.kind === 'room' ? pl.level : null });
    }
    // everyone out here
    for (const id of TOWN_ORDER) {
      const w = this.where(id), st = w.st; if (st.level !== lid || st.hidden) continue;
      const x = X(st.x), y = Y(st.y - 16 - (st.depth && st.depth.lift ? st.depth.lift : 0));
      this.ins.dot(g, x, y, TM_COL[this.kind(st)], id, st.moving, 3);
      if (k >= 1.1 || id === this.sel) { g.fillStyle = id === this.sel ? '#ffffff' : '#d8d0e8'; g.fillText(RESIDENTS[id].name, x + 6, y - 8); }
    }
    if (this.follow && this.sel) { const st = City.state(this.sel); if (st.level === lid && !st.hidden) this.ox = st.x * k - this.w / 2; }
  },
  // a tap that found nobody: a street's name looks along it, a room's count
  // goes in, another door's count lists who's inside
  tapBadge(b) {
    if (!b) return;
    if (b.street) { this.open(b.street); return; }
    if (b.room && b.room !== this.level && LEVELS[b.room] && LEVELS[b.room].hidden) { this.open(b.room); return; }
    this.list = { title: `${b.place.label} · ${b.inside.length} inside`, ids: b.inside }; this.side(true);
  },
  open(lid) { this.view = 'street'; this.level = lid; this.zoom = 1; this.ox = 0; this.size(); this.draw(); this.side(true); this.ins.clock(); },
  // ---- the side with nobody picked: who's where -----------------------------------------
  summary() {
    const n = {}, out = { street: 0, inside: 0, between: 0 };
    for (const id of TOWN_ORDER) { const w = this.where(id), k = this.kind(w.st); n[k] = (n[k] || 0) + 1; if (w.between) out.between++; else if (w.out) out.street++; else out.inside++; }
    const here = this.view === 'street' ? `<p class="dim">${LEVELS[this.level].name}. Tap someone to see their mind, a count on a door to see who's inside, a room's count to go in. Drag to scroll; the wheel zooms.</p>` : '<p class="dim">Tap someone to see their mind, or a street\'s name to look along it.</p>';
    return `<h3>${TOWN_ORDER.length} people</h3>${here}` + this.ins.legend(n) + `<p class="dim">Out in the streets ${out.street} · indoors ${out.inside} · between streets or riding ${out.between}. A ring is someone on the move.</p>`;
  },
};
