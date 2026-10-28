'use strict';
// ---------------------------------------------------------------------------
// Tyrell mode (dev): the city's minds laid out to watch. Everyone is drawn
// where the simulation has them, coloured by what they're doing:
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
  view: 'city', level: null, sel: null, playing: false, speed: 60, follow: false, ox: 0, zoom: 1, dots: [], badges: [], pics: new Map(), raf: 0, sideT: 0, list: null,
  html() {
    if (!City.on) return '<p class="sub">Tyrell isn\'t running: there are no minds to watch.</p>';
    const sp = TM_SPEEDS.map((v) => `<option value="${v}"${v === this.speed ? ' selected' : ''}>×${v === 1 ? '1 (game)' : v}</option>`).join('');
    return `<div class="tm"><div class="tmbar">
      <span class="tmclock" id="tmclock"></span>
      <button data-tm="-60" title="Back an hour">−1h</button><button data-tm="-15">−15m</button><button data-tm="play" class="go" id="tmplay">Play</button><button data-tm="15">+15m</button><button data-tm="60">+1h</button>
      <select id="tmspeed" aria-label="Speed">${sp}</select>
      <button data-tm="city" id="tmcity">City</button><span class="tmwhere" id="tmwhere"></span>
    </div><div class="tmbody"><div class="tmview" id="tmview"><canvas id="tmcv"></canvas></div><div class="tmside" id="tmside"></div></div></div>`;
  },
  attach() {
    const cv = $('tmcv'); if (!cv) return;
    const body = $('panelBody');
    body.querySelectorAll('button[data-tm]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.tm;
      if (k === 'play') { this.playing = !this.playing; this.last = performance.now(); }
      else if (k === 'city') { this.view = 'city'; this.level = null; }
      else this.step(+k);
      this.draw(); this.side(true);
    }));
    $('tmspeed').onchange = (e) => { this.speed = +e.target.value; };
    // a tap picks someone, a street, or a door's count; a drag scrolls a street
    let down = null;
    cv.onpointerdown = (e) => { down = { x: e.clientX, y: e.clientY, ox: this.ox, moved: 0 }; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = (e) => { if (!down) return; const dx = e.clientX - down.x; down.moved = Math.max(down.moved, Math.abs(dx) + Math.abs(e.clientY - down.y)); if (this.view === 'street') { this.ox = down.ox - dx; this.draw(); } };
    cv.onpointerup = (e) => { const d = down; down = null; if (d && d.moved < 6) this.tap(e); };
    cv.onwheel = (e) => { if (this.view !== 'street') return; e.preventDefault(); const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, k = e.deltaY < 0 ? 1.25 : 0.8, z0 = this.zoom; this.zoom = clamp(this.zoom * k, 0.5, 6); this.ox = (this.ox + mx) * (this.zoom / z0) - mx; this.draw(); };
    this.size(); this.draw(); this.side(true);
    cancelAnimationFrame(this.raf); this.last = performance.now();
    const tick = (t) => {
      if (Hud.open !== 'tyrell' || !$('tmcv')) { this.playing = false; return; }
      const dt = Math.min(0.1, (t - this.last) / 1000); this.last = t;
      if (this.playing) { this.step(this.speed * dt, true); this.draw(); }
      if (t - this.sideT > 250) { this.sideT = t; this.side(); this.clock(); }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  },
  // the canvas, sized to its box (taller than it for the city: the box scrolls)
  size() {
    const cv = $('tmcv'), box = $('tmview'), dpr = window.devicePixelRatio || 1;
    const w = box.clientWidth, h = this.view === 'city' ? Math.max(box.clientHeight, this.cityRows().h) : box.clientHeight;
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    this.w = w; this.h = h; this.dpr = dpr;
  },
  // ---- the clock: on (or back) by some game minutes ----------------------------
  step(min, quiet) {
    const s = Game.s; let t = s.day * 24 + s.time + min / 60;
    if (min < 0 && City.on) { const e = City.w.esper.earliest() / 60; if (t < e) { t = Math.ceil(e * 4) / 4; if (!quiet) Game.toast('Esper only remembers back to ' + this.hhmm(e * 60) + '.', 'warn'); } }
    s.day = Math.max(0, Math.floor(t / 24)); s.time = t - s.day * 24;
    City.sync(); this.clock();
  },
  clock() { const el = $('tmclock'); if (el) el.textContent = `Day ${Game.s.day} · ${Game.clock()}`; const p = $('tmplay'); if (p) p.textContent = this.playing ? 'Pause' : 'Play'; const c = $('tmcity'); if (c) c.classList.toggle('go', this.view === 'city'); const wh = $('tmwhere'); if (wh) wh.textContent = this.view === 'street' ? LEVELS[this.level].name : 'Everyone, everywhere'; },
  hhmm(m) { const h = (((m / 60) % 24) + 24) % 24; return String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); },
  kind(st) { return TM_KIND[st.act] || 'other'; },
  // ---- where everyone is, for drawing: a street and an x, out or in -----------
  where(id) {
    const st = City.state(id), C = Census.places;
    if (st.gap) return { st, between: st.gap };
    if (st.level && Census.streets[st.level]) return { st, street: st.level, x: st.x, out: !st.hidden };
    const pl = C[st.place] || (st.level && C[st.level]) || (st.flat && C['flat:' + st.flat]);
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
  draw() {
    const cv = $('tmcv'); if (!cv) return;
    if ((this.view === 'city') !== (this.drawn === 'city') || cv.width !== Math.round($('tmview').clientWidth * this.dpr)) this.size();
    this.drawn = this.view;
    const g = cv.getContext('2d'); g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.fillStyle = '#0a0812'; g.fillRect(0, 0, this.w, this.h);
    this.dots = []; this.badges = [];
    if (this.view === 'city') this.drawCity(g); else this.drawStreet(g);
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
        this.dot(g, x, y, col, id, true); continue;
      }
      if (!w.street || rowY[w.street] === undefined) continue;
      const y = rowY[w.street], x = sx(w.street, w.x);
      if (w.out) { this.dot(g, x, y - 4, col, id, w.st.moving); continue; }
      const key = w.street + ':' + Math.round(x / 3); const n = (stacks[key] = (stacks[key] || 0) + 1) - 1;
      if (n < 15) this.dot(g, x - 4 + (n % 3) * 4, y + 5 + Math.floor(n / 3) * 4, col, id, false, 1.5);
    }
  },
  dot(g, x, y, col, id, moving, r = 2.2) {
    const sel = id === this.sel;
    if (sel) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r + 3, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    if (moving) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r + 1.2, 0, Math.PI * 2); g.stroke(); }
    this.dots.push({ x, y, id });
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
      this.dot(g, x, y, TM_COL[this.kind(st)], id, st.moving, 3);
      if (k >= 1.1 || id === this.sel) { g.fillStyle = id === this.sel ? '#ffffff' : '#d8d0e8'; g.fillText(RESIDENTS[id].name, x + 6, y - 8); }
    }
    if (this.follow && this.sel) { const st = City.state(this.sel); if (st.level === lid && !st.hidden) this.ox = st.x * k - this.w / 2; }
  },
  tap(e) {
    const r = $('tmcv').getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 9; for (const d of this.dots) { const dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; best = d; } }
    if (best) { this.sel = best.id; this.list = null; this.draw(); this.side(true); return; }
    const b = this.badges.find((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
    if (!b) return;
    if (b.street) { this.open(b.street); return; }
    if (b.room && b.room !== this.level && LEVELS[b.room] && LEVELS[b.room].hidden) { this.open(b.room); return; }
    this.list = { place: b.place, ids: b.inside }; this.side(true);
  },
  open(lid) { this.view = 'street'; this.level = lid; this.zoom = 1; this.ox = 0; this.size(); this.draw(); this.side(true); this.clock(); },
  // ---- the side: someone's mind, or who's where -----------------------------------------
  side(force) {
    const el = $('tmside'); if (!el) return;
    if (!force && el.matches(':hover')) return; // (don't redraw under the pointer while it's reading)
    el.innerHTML = this.sel ? this.mind(this.sel) : this.list ? this.inside(this.list) : this.summary();
    el.querySelectorAll('[data-tmsel]').forEach((b) => (b.onclick = () => { this.sel = b.dataset.tmsel; this.list = null; const w = this.where(this.sel); if (this.view === 'street' && w.st.level && w.st.level !== this.level && !w.st.hidden) this.open(w.st.level); this.draw(); this.side(true); }));
    el.querySelectorAll('[data-tmdo]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.tmdo;
      if (k === 'close') { this.sel = null; this.list = null; }
      if (k === 'follow') { this.follow = !this.follow; const st = City.state(this.sel); if (this.follow && st.level && !st.hidden) this.open(st.level); }
      if (k === 'street') { const w = this.where(this.sel); if (w.street) this.open(w.room && LEVELS[w.room] && LEVELS[w.room].hidden && !w.st.hidden ? w.room : w.street); }
      if (k === 'go') { const st = City.state(this.sel); if (st.level && !st.hidden) { Hud.toggle(null); Dev.landAt = { level: st.level, x: st.x + 14, y: st.y }; Game.go(st.level, Object.keys(Census.built(st.level).spawns)[0]); } return; }
      this.draw(); this.side(true);
    }));
  },
  summary() {
    const n = {}, out = { street: 0, inside: 0, between: 0 };
    for (const id of TOWN_ORDER) { const w = this.where(id), k = this.kind(w.st); n[k] = (n[k] || 0) + 1; if (w.between) out.between++; else if (w.out) out.street++; else out.inside++; }
    const here = this.view === 'street' ? `<p class="dim">${LEVELS[this.level].name}. Tap someone to see their mind, a count on a door to see who's inside, a room's count to go in. Drag to scroll; the wheel zooms.</p>` : '<p class="dim">Tap someone to see their mind, or a street\'s name to look along it.</p>';
    return `<h3>${TOWN_ORDER.length} people</h3>${here}<div class="tmlegend">` + Object.keys(TM_COL).filter((k) => n[k]).map((k) => `<span><i style="background:${TM_COL[k]}"></i>${TM_WORD[k]} <b>${n[k]}</b></span>`).join('') + `</div><p class="dim">Out in the streets ${out.street} · indoors ${out.inside} · between streets or riding ${out.between}. A ring is someone on the move.</p>`;
  },
  inside(L) {
    return `<h3>${L.place.label} · ${L.ids.length} inside</h3><div class="tmlist">` + L.ids.map((id) => { const st = City.state(id); return `<button data-tmsel="${id}"><i style="background:${TM_COL[this.kind(st)]}"></i>${RESIDENTS[id].name} <small>${st.act}</small></button>`; }).join('') + '</div><div class="buttons"><button data-tmdo="close">Back</button></div>';
  },
  // someone's mind, in parts
  mind(id) {
    const w = City.w, p = w.get(id), R = RESIDENTS[id], C = Census.places, st = City.state(id), d = p.doing, at = (pid) => (!pid ? 'anywhere' : pid === R.homePlace ? 'home' : C[pid] ? C[pid].label : pid);
    const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    let h = `<h3>${esc(R.name)}</h3><p class="sub">${esc(Folk.who(id))}</p>`;
    const now = !d ? 'Nothing, waiting to choose.' : d.kind === 'travel' ? `Walking${st.gap ? ' (off screen)' : ''} from ${esc(at(d.from))} to ${esc(at(d.to))}, to ${d.action}, till ${this.hhmm(d.end)}.` : d.kind === 'wait' ? `Waiting at ${esc(at(p.place))} till ${this.hhmm(d.end)}.` : `${d.action} at ${esc(at(d.place || p.place))}, till ${this.hhmm(d.end)}.`;
    h += `<p><b>Now</b> ${now}${d && d.rank !== undefined ? ` <small class="dim">(${d.layer || 'free'}, rank ${d.rank})</small>` : ''}</p>`;
    if (p.directive && !p.directive.done) h += `<p class="dim">Told to: ${p.directive.do}${p.directive.label ? ' · ' + esc(p.directive.label) : ''}</p>`;
    // needs, as bars
    h += '<div class="tmneeds">' + Object.keys(p.needs).map((k) => { const v = w.needOf(id, k); return `<div><span>${k}</span><i><b style="width:${Math.round(clamp(v, 0, 1) * 100)}%;background:${v > 0.85 ? '#ff4a5a' : v > 0.6 ? '#ffb040' : '#3af0e0'}"></b></i></div>`; }).join('') + '</div>';
    const rv = w.reverie; if (rv) h += `<p class="dim">Mood ${(rv.mood(id) || 0).toFixed(2)}${p.vars && p.vars.money !== undefined ? ` · ${Math.round(p.vars.money)} cr` : ''}${R.likes && Object.keys(R.likes).length ? ' · likes ' + Object.keys(R.likes).join(', ') : ''}</p>`;
    // why: the last decision, every option weighed
    const dec = w.why(id);
    if (!dec) h += '<h3>Why</h3><p class="dim">No choice made since the last time walk: play the clock on a little.</p>';
    if (dec) {
      h += `<h3>Why · ${this.hhmm(dec.t)}</h3><p class="dim">${esc(dec.reason || '')}</p><div class="tmwhy">`;
      const pk = dec.picked, isPick = (c) => !!pk && c.id === pk.id && c.place === pk.place && c.target === pk.target;
      const cands = dec.candidates.slice().sort((a, b) => isPick(b) - isPick(a) || b.rank - a.rank || b.weight - a.weight).slice(0, 9);
      if (pk) h += `<p>Chose <b>${pk.id}</b> at ${esc(at(pk.place))}${pk.layer ? ` <small class="dim">(${pk.layer})</small>` : ''}. It's drawn from the best few, by weight squared, so the top one doesn't always win.</p>`;
      for (const c of cands) h += `<div class="${isPick(c) ? 'pick' : c.blocked ? 'no' : ''}"><b>${c.id}</b> <small>${esc(at(c.place))} · rank ${c.rank}${c.blocked ? '' : ' · ' + c.weight.toFixed(3)}</small><br><small>${esc(c.blocked || (c.parts || []).map(([n, v]) => n + ' ' + (+v).toFixed(2)).join(' × '))}</small></div>`;
      h += '</div>';
    }
    // today's routine, the hour they're in marked
    const ra = w.mind.routineAt(p), plan = (w.mind.routineFor(p, w.now) || []).slice().sort((a, b) => a[0] - b[0]), cur = ra && ra.entry;
    if (plan.length) h += '<h3>Today</h3><div class="tmday">' + plan.map((e) => `<div class="${e === cur ? 'cur' : ''}"><span>${String(Math.floor(e[0])).padStart(2, '0')}:${String(Math.round((e[0] % 1) * 60)).padStart(2, '0')}</span> ${e[2] === '*' ? 'free' : e[2]} <small>${e[1] === null ? '' : esc(e[1] === 'home' ? 'home' : at(e[1]))}${e[3] && e[3].rank ? ' · holds' : ''}</small></div>`).join('') + '</div>';
    // lately: what they've done
    const lines = w.westmarch.chronicle(id, w.now - 12 * 60).slice(-10);
    if (lines.length) h += '<h3>Lately</h3><div class="tmlog">' + lines.map((l) => `<div>${esc(l)}</div>`).join('') + '</div>';
    // who they know best
    const fs = w.fellowship ? w.fellowship.relations(id).slice(0, 4) : [];
    if (fs.length) h += '<h3>People</h3><div class="tmlist">' + fs.map((f) => RESIDENTS[f.id] ? `<button data-tmsel="${f.id}">${esc(RESIDENTS[f.id].name)} <small>regard ${f.regard.toFixed(2)}</small></button>` : `<span class="dim">${esc(f.id)} · ${f.regard.toFixed(2)}</span>`).join('') + '</div>';
    h += `<div class="buttons"><button data-tmdo="follow" class="${this.follow ? 'go' : ''}">${this.follow ? 'Following' : 'Follow'}</button><button data-tmdo="street">Their street</button><button data-tmdo="go" ${st.level && !st.hidden ? '' : 'disabled'}>Go there</button><button data-tmdo="close">Close</button></div>`;
    return h;
  },
};
