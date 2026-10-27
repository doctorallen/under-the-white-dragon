'use strict';
// ---------------------------------------------------------------------------
// The bench: a close-up of the thing you're fixing, worked by hand. Four tools
// and a lens:
//   Driver: hold on a screw to back it out (or drive it in). Now and then it
//     binds (its ring goes red): ease off and go again, or hold on through and
//     strip the head, and that screw never holds tight again.
//   Probe: touch a part to read it: fine, worn, dead or burnt, and whether it
//     fits.
//   Iron: hold on a joint (the solder at each end of a part) to melt it. A
//     soldered joint melts free; a free one with a part seated flows and sets.
//     Hold on past that and the board browns; brown it three times and the
//     control board's cooked.
//   Hands: lift the casing, pull a part that's free at both ends, seat a new
//     one from the shelf in an empty slot.
//   Lens: shows what the eye can't: wear, scorching, a serial.
// Close it up, drive the screws home and power it up: it works, it half
// works, or it smokes. What's on the bench is saved (Game.s.bench), so a job
// waits for you; the tools' state in your hand (heat, a screw half out) isn't.
// The view is BW × BH bench pixels, drawn flat and scaled up.
// ---------------------------------------------------------------------------
const BW = 172, BH = 98;
const BENCH_TOOLS = { driver: 'Driver', probe: 'Probe', iron: 'Iron', hands: 'Hands' };
const Bench = {
  tool: 'driver', lens: false, hold: null, heat: {}, rt: {}, lit: {}, sel: null, msg: '', fx: null, raf: 0, last: 0, c: null, k: 1, offx: 0, offy: 0, mat: null,
  get b() { return Game.s.bench; },
  get D() { return DEVICE[this.b.dev]; },
  // ---- what's on the bench ----
  // a thing to fix: the device and the parts in it, [grade, state, gauge] a
  // slot (null for an empty one)
  put(dev, o = {}) {
    const D = DEVICE[dev], slots = {};
    for (const k in D.slots) {
      const sp = (o.parts || {})[k];
      slots[k] = sp === null ? { p: null, j: ['open', 'open'] } : { p: Parts.make(D.slots[k].kind, sp ? sp[0] : 'street', { st: sp ? sp[1] : 'ok', gauge: sp ? sp[2] : undefined, how: 'pull', out: o.name || D.name }), j: ['solid', 'solid'] };
    }
    Game.s.bench = { dev, job: o.job || null, name: o.name || D.name, open: false, rusty: !!o.rusty, screws: D.screws.map(() => ({ st: 'in', strip: false })), slots, probed: {}, scorch: [], tested: null };
    this.reset();
  },
  clear() { Game.s.bench = null; this.reset(); },
  reset() { this.hold = null; this.heat = {}; this.rt = {}; this.lit = {}; this.sel = null; this.msg = ''; this.fx = null; this.tool = this.b && this.b.open ? 'probe' : 'driver'; },
  open() {
    if (!this.b) { Game.toast('Your bench. Nothing on it yet: a job brings something to fix.'); return; }
    this.hold = null; this.msg = ''; Hud.toggle('bench');
  },
  // ---- places on the board ----
  get ox() { return Math.round((BW - this.D.w) / 2); },
  get oy() { return Math.round((BH - this.D.h) / 2); },
  joints(k) { const S = this.D.slots[k], y = this.oy + S.y + (S.h >> 1); return [[this.ox + S.x - 3, y], [this.ox + S.x + S.w + 2, y]]; },
  screwAt(i) { const [x, y] = this.D.screws[i]; return [this.ox + x, this.oy + y]; },
  near(x, y, list, r) { let best = null, bd = r * r; for (const it of list) { const d = (it.x - x) ** 2 + (it.y - y) ** 2; if (d <= bd) { bd = d; best = it; } } return best; },
  slotAt(x, y) { for (const k in this.D.slots) { const S = this.D.slots[k], X = this.ox + S.x, Y = this.oy + S.y; if (x >= X - 3 && x <= X + S.w + 3 && y >= Y - 3 && y <= Y + S.h + 3) return k; } return null; },
  onDevice(x, y) { return x >= this.ox - 4 && x <= this.ox + this.D.w + 4 && y >= this.oy - 4 && y <= this.oy + this.D.h + 4; },
  // the screw that binds, and where: one point a turn, two if it's rusty
  binds(i, out) { const n = this.b.rusty ? 2 : 1, h = (j) => hash(i, j * 7 + (out ? 1 : 2), this.b.dev.length * 31); return n === 1 ? [0.3 + h(1) * 0.4] : [0.2 + h(1) * 0.25, 0.58 + h(2) * 0.25]; },
  loose() { return this.b.screws.filter((s) => s.st !== 'in' || s.strip).length; },
  // ---- the hand ----
  press(x, y) {
    const b = this.b; this.fx = this.fx && this.fx.res === 'smoke' ? this.fx : null;
    if (this.tool === 'driver') {
      if (b.open) { this.say('The screws are out. Put the casing back on before you drive them home.'); return; }
      const sc = this.near(x, y, b.screws.map((s, i) => { const [sx, sy] = this.screwAt(i); return { x: sx, y: sy, i }; }), 11);
      if (sc) this.hold = { what: 'screw', i: sc.i, x, y, tx: sc.x, ty: sc.y }; else this.say('Hold the driver on a screw.');
      return;
    }
    if (this.tool === 'iron') {
      if (!b.open) { this.say('Get the casing off first.'); return; }
      const js = []; for (const k in this.D.slots) this.joints(k).forEach(([jx, jy], ji) => js.push({ x: jx, y: jy, k, ji }));
      const j = this.near(x, y, js, 8);
      this.hold = j ? { what: 'joint', k: j.k, ji: j.ji, x, y, tx: j.x, ty: j.y } : { what: 'air', x, y };
      if (!j) this.say('Touch the iron to a joint: the solder at either end of a part.');
      return;
    }
    if (this.tool === 'probe') {
      if (!b.open) { this.say('The probe needs the casing off.'); return; }
      const k = this.slotAt(x, y); this.hold = { what: 'probe', x, y };
      if (k) this.probe(k); else this.say('Touch the probe to a part.');
      return;
    }
    if (this.tool === 'hands') {
      if (!b.open) { if (this.onDevice(x, y)) this.lift(); return; }
      const k = this.slotAt(x, y); if (!k) { this.sel = null; this.side(); return; }
      const s = b.slots[k], nm = PART[this.D.slots[k].kind].name.toLowerCase();
      if (!s.p) { this.sel = k; this.say(`An empty mount. It takes ${PART[this.D.slots[k].kind].took}${this.D.slots[k].gauge ? ', ' + this.D.slots[k].gauge + ' gauge' : ''}.`); return; }
      const open = s.j.filter((j) => j === 'open').length;
      if (open === 2) { const p = s.p; s.p = null; this.sel = k; if (k === 'board') b.scorch = []; Parts.give(p, true); this.lit[k] = null; this.say(`You lift the ${nm} out and set it on the shelf: ${Parts.name(p).toLowerCase()}, ${PART_STATE[p.st]}.`); }
      else this.say(open ? `One end of the ${nm}'s still soldered.` : `The ${nm}'s soldered in at both ends. Melt each joint with the iron to free it.`);
    }
  },
  release() {
    const h = this.hold; this.hold = null; if (!h || h.what !== 'screw') return;
    const r = this.rt[h.i]; if (r && r.bind >= 0) { r.bind = -1; r.bi++; this.say('You ease off. It gives.'); }
  },
  // the screw under the driver, a step at a time
  turn(dt) {
    const h = this.hold, sc = this.b.screws[h.i], out = sc.st === 'in';
    if (h.done) return;
    const r = (this.rt[h.i] = this.rt[h.i] || { p: 0, bi: 0, bind: -1, out });
    if (r.out !== out) Object.assign(r, { p: 0, bi: 0, bind: -1, out });
    if (r.bind >= 0) {
      r.bind += dt;
      if (r.bind > 0.45) { sc.strip = true; r.bind = -1; r.bi = 9; this.say('The driver jumps and chews the head. That screw will never hold tight again.'); }
      return;
    }
    const binds = sc.strip ? [] : this.binds(h.i, out);
    r.p += dt / (sc.strip ? 1.1 : 0.7);
    if (r.bi < binds.length && r.p >= binds[r.bi]) { r.p = binds[r.bi]; r.bind = 0; return; }
    if (r.p >= 1) {
      sc.st = out ? 'out' : 'in'; this.rt[h.i] = null; h.done = true;
      const left = this.b.screws.filter((s) => s.st === 'in').length;
      if (out) this.say(left ? `It's out. ${left} to go.` : 'That\'s the last one. Lift the casing.');
      else this.say(sc.strip ? 'It spins in but never bites. Loose.' : left === this.b.screws.length ? 'All in. Power it up.' : 'Snug.');
      if (out && !left) this.tool = 'hands';
      this.side();
    }
  },
  // the joint under the iron
  solder(dt) {
    const h = this.hold, b = this.b, key = h.k + ':' + h.ji, s = b.slots[h.k], nm = PART[this.D.slots[h.k].kind].name.toLowerCase();
    const v = (this.heat[key] = (this.heat[key] || 0) + dt * 1.25);
    if (v >= 1 && !h.done) {
      h.done = true;
      if (s.p && s.j[h.ji] === 'solid') { s.j[h.ji] = 'open'; this.say(s.j.every((j) => j === 'open') ? `Both ends free. Lift the ${nm} out with your hands.` : 'The solder melts and wicks away. That end\'s free.'); }
      else if (s.p && s.j[h.ji] === 'open') { s.j[h.ji] = 'solid'; this.say(s.j.every((j) => j === 'solid') ? `The ${nm}'s in.` : 'The solder flows and sets bright. One more end.'); }
      else this.say('There\'s nothing there to solder.');
    }
    if (v >= 1.8) {
      this.heat[key] = 1.15; b.scorch.push([h.tx + Math.round((hash(b.scorch.length, 3, 9) - 0.5) * 4), h.ty + Math.round((hash(b.scorch.length, 4, 9) - 0.5) * 4)]);
      const bd = b.slots.board && b.slots.board.p;
      if (b.scorch.length >= 3 && bd && bd.st !== 'burnt') { bd.st = 'burnt'; this.say('The board browns, then blackens. You\'ve cooked it.'); }
      else this.say('Too long: the board browns under the tip.');
    }
  },
  probe(k) {
    const b = this.b, s = b.slots[k], S = this.D.slots[k];
    if (!s.p) { this.say(`Nothing in that mount. It takes ${PART[S.kind].took}${S.gauge ? ', ' + S.gauge + ' gauge' : ''}.`); return; }
    const bad = s.p.st !== 'ok' || (S.gauge && s.p.gauge !== S.gauge);
    this.lit[k] = s.p.st === 'ok' && !bad ? 'ok' : s.p.st === 'worn' || s.p.st === 'ok' ? 'worn' : 'dead';
    this.say(`${GRADE[s.p.g].name} ${PART[S.kind].name.toLowerCase()}: ${Parts.reading(s.p, S)}`);
    b.probed[k] = 1;
    if (bad && b.job) Parts.jot(b.job + ':' + k, `${b.name}: the ${PART[S.kind].name.toLowerCase()} is ${s.p.st === 'ok' ? 'the wrong gauge' : PART_STATE[s.p.st]}. It needs ${PART[S.kind].took}${S.gauge ? ', ' + S.gauge + ' gauge' : ''}.`);
    if (Object.keys(this.D.slots).every((q) => b.probed[q])) Parts.learn(b.dev);
  },
  lift() {
    const n = this.b.screws.filter((s) => s.st === 'in').length;
    if (n) { this.say(`Still screwed down: ${n} screw${n > 1 ? 's' : ''} to go.`); return; }
    this.b.open = true; this.tool = 'probe'; this.fx = null; this.say('The casing comes away. Probe the parts to find what\'s wrong.'); this.side();
  },
  close() { this.b.open = false; this.tool = 'driver'; this.sel = null; this.lit = {}; this.say('Casing on. Drive the screws home, then power it up.'); this.side(); },
  fit(id) {
    const k = this.sel, s = this.b.slots[k]; if (!k || s.p) return;
    s.p = Parts.take(id); s.j = ['open', 'open']; if (k === 'board') this.b.scorch = []; this.lit[k] = null; this.b.probed[k] = 0;
    this.say(`Seated. Now solder both ends with the iron.`); this.tool = 'iron'; this.side();
  },
  // power it up: what works, what doesn't, and why
  test() {
    const b = this.b, D = this.D, rank = { works: 0, half: 1, dead: 2, smoke: 3 }; let res = 'works'; const why = [];
    const worse = (r, w) => { if (rank[r] > rank[res]) res = r; why.push(w); };
    for (const k in D.slots) {
      const s = b.slots[k], S = D.slots[k], nm = PART[S.kind].name.toLowerCase();
      if (!s.p) worse('dead', `there's no ${nm} in it`);
      else if (s.j.includes('open')) worse('dead', `the ${nm} isn't soldered in`);
      else if (s.p.st === 'burnt') worse('smoke', `the ${nm}'s burnt`);
      else if (s.p.st === 'dead') worse('dead', `the ${nm}'s dead`);
      else if (s.p.st === 'worn') worse('half', `the ${nm}'s worn`);
      else if (S.gauge && s.p.gauge !== S.gauge) worse('half', `the ${nm}'s the wrong gauge`);
    }
    const loose = this.loose(); b.tested = { res, loose, day: Game.s.day };
    this.fx = { res, t: performance.now() };
    const list = why.length ? ' ' + why.join(', ').replace(/^./, (c) => c.toUpperCase()) + '.' : '';
    this.say({ works: 'It powers up clean.' + (loose ? ` The casing rattles, though: ${loose} screw${loose > 1 ? 's' : ''} loose.` : ' Good work.'), half: 'It comes on, stutters, and runs. Mostly.' + list, dead: 'Nothing.' + list, smoke: 'A thread of smoke from the seam, and the smell.' + list }[res]);
    Save.write(); this.side();
  },
  say(m) { this.msg = m; const el = $('benchmsg'); if (el) el.textContent = m; },
  // what to do next, when nothing's been said
  hint() {
    const b = this.b, inn = b.screws.filter((s) => s.st === 'in').length;
    if (!b.open) return inn === b.screws.length && !b.tested ? 'Hold the driver on a screw to back it out. If it binds (the ring goes red), ease off and go again, or you\'ll strip the head.' : inn ? 'Drive the screws home, then power it up.' : 'Lift the casing, or drive the screws home.';
    if (!Object.keys(this.D.slots).every((k) => b.probed[k])) return 'Touch the probe to each part to find what\'s wrong.';
    return 'Melt both joints of a bad part with the iron, lift it out, seat a good one and solder it in.';
  },
  // ---- the panel ----
  html() {
    const t = Object.keys(BENCH_TOOLS).map((k) => `<button data-tool="${k}" class="${this.tool === k ? 'on' : ''}">${BENCH_TOOLS[k]}</button>`).join('') + `<button data-lens class="${this.lens ? 'on' : ''}">Lens</button>`;
    return `<div class="benchwrap"><canvas id="benchcv"></canvas><div class="benchside"><div class="tools">${t}</div><p id="benchmsg" class="sub"></p><div id="benchtray"></div><div class="buttons" id="benchacts"></div></div></div>`;
  },
  // the side: tools, what's been said, the shelf for an empty mount, and the
  // big actions; redrawn alone so the canvas keeps its size
  side() {
    const side = document.querySelector('.benchside'); if (!side || !this.b) return; const b = this.b;
    side.querySelectorAll('button[data-tool]').forEach((x) => x.classList.toggle('on', x.dataset.tool === this.tool));
    const lens = side.querySelector('button[data-lens]'); if (lens) lens.classList.toggle('on', this.lens);
    $('benchmsg').textContent = this.msg || this.hint();
    let tray = '';
    if (b.open && this.sel && !b.slots[this.sel].p) {
      const S = this.D.slots[this.sel], have = Parts.have(S.kind);
      tray = `<h3>Fit ${PART[S.kind].took}</h3>` + (have.length ? have.map((p) => `<button class="part" data-fit="${p.id}" style="--r:${GRADE[p.g].col}"><b>${Parts.name(p)}${p.gauge ? ' · ' + p.gauge : ''}</b><small>${PART_STATE[p.st]} · ${Parts.from(p)}</small></button>`).join('') : `<p class="dim">You've nothing that fits on the shelf.</p>`);
    }
    $('benchtray').innerHTML = tray;
    const inn = b.screws.filter((s) => s.st === 'in').length;
    $('benchacts').innerHTML = (b.open ? '<button data-bench="close">Close it up</button>' : (inn ? '' : '<button data-bench="lift">Lift the casing</button>') + '<button data-bench="test" class="go">Power it up</button>') + '<button data-bench="done" class="quiet">Leave it</button>';
    side.querySelectorAll('button[data-fit]').forEach((x) => (x.onclick = () => this.fit(+x.dataset.fit)));
    side.querySelectorAll('button[data-bench]').forEach((x) => (x.onclick = () => { const a = x.dataset.bench; if (a === 'close') this.close(); if (a === 'lift') this.lift(); if (a === 'test') this.test(); if (a === 'done') { Save.write(); Hud.toggle(null); } }));
  },
  attach() {
    const cv = $('benchcv'); if (!cv) return; const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    let k = Math.min(cv.width / BW, cv.height / BH); if (k >= 3) k = Math.floor(k);
    this.k = k; this.offx = Math.round((cv.width - BW * k) / 2); this.offy = Math.round((cv.height - BH * k) / 2);
    if (!this.c) [this.c, this.g] = canvasOf(BW, BH);
    const at = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) * dpr - this.offx) / this.k, ((e.clientY - r.top) * dpr - this.offy) / this.k]; };
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); const [x, y] = at(e); this.press(x, y); };
    cv.onpointermove = (e) => { const h = this.hold; if (!h) return; const [x, y] = at(e); h.x = x; h.y = y; if (h.tx !== undefined && (x - h.tx) ** 2 + (y - h.ty) ** 2 > 16 * 16) this.release(); };
    cv.onpointerup = cv.onpointercancel = () => this.release();
    document.querySelectorAll('.benchside button[data-tool]').forEach((x) => (x.onclick = () => { this.tool = x.dataset.tool; this.sel = null; this.msg = ''; this.side(); }));
    const lens = document.querySelector('.benchside button[data-lens]'); if (lens) lens.onclick = () => { this.lens = !this.lens; this.side(); };
    this.side(); this.loop();
  },
  loop() {
    cancelAnimationFrame(this.raf); this.last = performance.now();
    const f = () => { if (Hud.open !== 'bench' || !$('benchcv')) { this.hold = null; return; } const now = performance.now(); this.step(Math.min(0.05, (now - this.last) / 1000)); this.last = now; this.draw(); this.raf = requestAnimationFrame(f); };
    this.raf = requestAnimationFrame(f);
  },
  step(dt) {
    const h = this.hold;
    if (h && h.what === 'screw') this.turn(dt);
    if (h && h.what === 'joint') this.solder(dt);
    const held = h && h.what === 'joint' ? h.k + ':' + h.ji : null;
    for (const key in this.heat) if (key !== held) { this.heat[key] = Math.max(0, this.heat[key] - dt * 0.8); if (!this.heat[key]) delete this.heat[key]; }
  },
  // ---- drawing ----
  draw() {
    const cv = $('benchcv'); if (!cv || !this.b) return; const g = this.g, b = this.b, D = this.D, t = performance.now();
    g.drawImage(this.matCanvas(), 0, 0);
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const ox = this.ox, oy = this.oy;
    // a shadow under the thing
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(ox + 3, oy + 4, D.w, D.h);
    if (b.open) {
      // the board: green, traces between the joints, the mounting holes
      R(ox - 1, oy - 1, D.w + 2, D.h + 2, '#06140c'); R(ox, oy, D.w, D.h, '#123e26'); R(ox, oy, D.w, 1, '#1e5a36'); R(ox, oy, 1, D.h, '#1a5030');
      for (let i = 0; i < 26; i++) { const x = ox + 4 + Math.floor(hash(i, 1, 77) * (D.w - 8)), y = oy + 4 + Math.floor(hash(i, 2, 77) * (D.h - 8)), w = 4 + Math.floor(hash(i, 3, 77) * 26); hash(i, 4, 77) < 0.5 ? R(x, y, Math.min(w, ox + D.w - 3 - x), 1, '#1c6a3c') : R(x, y, 1, Math.min(w >> 1, oy + D.h - 3 - y), '#1c6a3c'); }
      const ks = Object.keys(D.slots);
      for (let i = 0; i + 1 < ks.length; i++) { const [, a] = this.joints(ks[i]), [c] = this.joints(ks[i + 1]); const my = Math.min(a[1], c[1]) - 6; R(a[0], Math.min(my, a[1]), 1, Math.abs(a[1] - my) + 1, '#2a8a50'); R(Math.min(a[0], c[0]), my, Math.abs(c[0] - a[0]) + 1, 1, '#2a8a50'); R(c[0], Math.min(my, c[1]), 1, Math.abs(c[1] - my) + 1, '#2a8a50'); }
      D.screws.forEach((_, i) => { const [x, y] = this.screwAt(i); R(x - 2, y - 2, 5, 5, '#c8a050'); R(x - 1, y - 1, 3, 3, '#06080a'); });
      for (const [x, y] of b.scorch) { R(x - 3, y - 2, 7, 5, '#3a2a0e'); R(x - 2, y - 1, 5, 3, '#1a1006'); R(x - 1, y, 2, 1, '#060402'); }
      for (const k of ks) {
        const S = D.slots[k], s = b.slots[k], X = ox + S.x, Y = oy + S.y;
        if (!s.p) { for (let x = 0; x < S.w; x += 2) { R(X + x, Y, 1, 1, '#8ac8a0'); R(X + x, Y + S.h - 1, 1, 1, '#8ac8a0'); } for (let y = 0; y < S.h; y += 2) { R(X, Y + y, 1, 1, '#8ac8a0'); R(X + S.w - 1, Y + y, 1, 1, '#8ac8a0'); } }
        else partArt(g, s.p, X, Y, S.w, S.h, this.lens, t);
        this.joints(k).forEach(([x, y], ji) => {
          if (s.j[ji] === 'solid') { R(x - 2, y - 2, 5, 5, '#5a6068'); R(x - 1, y - 2, 3, 4, '#c8ccd4'); R(x - 1, y - 1, 1, 1, '#ffffff'); }
          else { R(x - 2, y - 2, 5, 5, '#c87a3a'); R(x - 1, y - 1, 3, 3, '#5a2a0e'); R(x, y, 1, 1, '#06080a'); }
          const v = this.heat[k + ':' + ji]; if (v) ring(g, x, y, 5, Math.min(1, v), v > 1 ? '#ff3a2a' : '#ffa040', v > 1 ? (v - 1) / 0.8 : 0);
        });
        if (this.lit[k] && this.tool === 'probe') { const c = { ok: '#3aff80', worn: '#ffb040', dead: '#ff4a6a' }[this.lit[k]]; R(X + S.w - 3, Y - 4, 3, 3, c); g.globalAlpha = 0.35; R(X + S.w - 4, Y - 5, 5, 5, c); g.globalAlpha = 1; }
        if (this.sel === k) { const a = 0.5 + Math.sin(t / 180) * 0.5; g.strokeStyle = `rgba(58,240,224,${0.4 + a * 0.6})`; g.lineWidth = 1; g.strokeRect(X - 2.5, Y - 2.5, S.w + 5, S.h + 5); }
      }
    } else casingArt(g, D, b, ox, oy, t, this.fx);
    // the screws, when the casing's on: heads, or the empty holes
    if (!b.open) b.screws.forEach((sc, i) => {
      const [x, y] = this.screwAt(i), r = this.rt[i];
      if (sc.st === 'in' || (r && r.p > 0)) { R(x - 3, y - 3, 7, 7, '#2a2e34'); R(x - 2, y - 3, 5, 7, '#9aa0aa'); R(x - 3, y - 2, 7, 5, '#9aa0aa'); R(x - 2, y - 2, 2, 2, '#d8dce4'); const a = r ? r.p * (r.out ? 1 : -1) * 3 : 0; if (sc.strip) R(x - 1, y - 1, 3, 3, '#4a4e56'); else if ((Math.round(a * 2) & 1) === 0) { R(x - 2, y, 5, 1, '#3a3e46'); R(x, y - 2, 1, 5, '#3a3e46'); } else { R(x - 1, y - 1, 1, 1, '#3a3e46'); R(x + 1, y + 1, 1, 1, '#3a3e46'); R(x + 1, y - 1, 1, 1, '#3a3e46'); R(x - 1, y + 1, 1, 1, '#3a3e46'); R(x, y, 1, 1, '#3a3e46'); } }
      else { R(x - 2, y - 2, 5, 5, '#14161a'); R(x - 1, y - 1, 3, 3, '#040506'); }
      if (r && (r.p > 0 || r.bind >= 0)) ring(g, x, y, 6, r.out ? r.p : 1 - r.p, r.bind >= 0 ? '#ff3a4a' : '#3af0e0', 0);
    });
    // the tool in your hand
    const h = this.hold;
    if (h && h.what !== 'probe') {
      const x = Math.round(h.tx !== undefined ? h.tx : h.x), y = Math.round(h.ty !== undefined ? h.ty : h.y);
      if (this.tool === 'driver') { g.fillStyle = '#c8ccd4'; for (let i = 1; i < 18; i++) g.fillRect(x + i, y - i, 1, 2); g.fillStyle = '#c8302a'; for (let i = 18; i < 34; i++) g.fillRect(x + i - 1, y - i - 1, 4, 4); }
      if (this.tool === 'iron') { const v = this.heat[h.k + ':' + h.ji] || 0.3; g.fillStyle = '#8a8e96'; for (let i = 1; i < 14; i++) g.fillRect(x + i, y - i, 2, 2); g.fillStyle = '#2a2a30'; for (let i = 14; i < 34; i++) g.fillRect(x + i - 1, y - i - 1, 5, 5); g.fillStyle = `rgba(255,${140 - v * 60 | 0},40,${0.3 + Math.min(1, v) * 0.6})`; g.fillRect(x - 1, y - 1, 3, 3); }
    }
    // the lens: the edge of the glass
    if (this.lens) { g.strokeStyle = 'rgba(58,240,224,0.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(BW / 2, BH / 2, BW / 2 + 20, BH / 2 + 14, 0, 0, Math.PI * 2); g.stroke(); }
    // the result of a test
    if (this.fx && this.fx.res === 'smoke') { const s = (t - this.fx.t) / 1000; for (let i = 0; i < 9; i++) { const k = (s * 0.5 + i / 9) % 1, x = ox + D.w * (0.3 + hash(i, 1, 5) * 0.4) + Math.sin(k * 6 + i) * 4, y = oy + D.h * 0.4 - k * 50; g.fillStyle = `rgba(150,150,160,${(1 - k) * 0.45})`; g.fillRect(x - 3 - k * 6, y - 2 - k * 4, 6 + k * 12, 4 + k * 8); } }
    // onto the screen, scaled up flat
    const out = cv.getContext('2d'); out.imageSmoothingEnabled = false; out.fillStyle = '#05070a'; out.fillRect(0, 0, cv.width, cv.height);
    out.drawImage(this.c, this.offx, this.offy, BW * this.k, BH * this.k);
  },
  // the cutting mat under the lamp (made once)
  matCanvas() {
    if (this.mat) return this.mat; const [c, g] = canvasOf(BW, BH);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const v = 1 - Math.min(1, Math.hypot((x - BW * 0.45) / BW, (y - BH * 0.35) / BH) * 1.4), n = hash(x, y, 41) * 0.06; const grid = x % 10 === 0 || y % 10 === 0; g.fillStyle = css(mixRgb([8, 14, 12], grid ? [44, 74, 58] : [26, 50, 40], clamp(v * 0.9 + n, 0, 1))); g.fillRect(x, y, 1, 1); }
    return (this.mat = c);
  },
};

// a ring around a screw or joint: how far along it is (0..1), and past it,
// how far into the red
function ring(g, x, y, r, f, col, over) {
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(x + 0.5, y + 0.5, r, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = col; g.beginPath(); g.arc(x + 0.5, y + 0.5, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); g.stroke();
  if (over > 0) { g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(x + 0.5, y + 0.5, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, over)); g.stroke(); }
}

// a part in its mount, flat: its body by kind, its grade's marks, and under
// the lens its wear
function partArt(g, p, X, Y, w, h, lens, t) {
  const C = PART[p.k].col, R = (x, y, a, b, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, a, b); }, gc = GRADE[p.g].col;
  R(0, 0, w, h, '#06080a');
  if (p.k === 'cell') {
    R(1, 1, w - 2, h - 2, C[1]); R(1, 1, w - 2, 2, C[2]); R(1, h - 4, w - 2, 3, C[0]);
    R(1, 1, 4, h - 2, '#8a9098'); R(w - 5, 1, 4, h - 2, '#8a9098'); R(1, 1, 4, 1, '#d8dce4'); R(w - 5, 1, 4, 1, '#d8dce4');
    R((w >> 1) - 3, 1, 6, h - 2, gc); R((w >> 1) - 3, 1, 6, 1, '#ffffff'); R(w - 10, (h >> 1) - 1, 3, 1, C[2]); R(w - 9, (h >> 1) - 2, 1, 3, C[2]);
  } else if (p.k === 'board') {
    R(1, 3, w - 2, h - 6, C[1]); R(1, 3, w - 2, 1, C[2]); R(1, h - 4, w - 2, 1, C[0]);
    for (let x = 3; x < w - 3; x += 3) { R(x, 0, 1, 3, '#b8bcc4'); R(x, h - 3, 1, 3, '#b8bcc4'); }
    R(4, 6, 3, 3, C[0]); R(w - 14, 6, 9, 6, '#14181c'); R(w - 13, 6, 7, 1, '#3a4048'); R(6, h - 10, 12, 4, '#14181c'); R(w - 6, h - 8, 2, 2, gc);
  } else if (p.k === 'aerial') {
    R(0, (h >> 1) - 1, w, 3, '#3a3e46'); R(0, (h >> 1) - 1, w, 1, '#6a7078');
    for (let x = 4; x < w - 4; x++) { R(x, 1, 1, h - 2, x % 2 ? C[1] : C[2]); } R(4, h - 2, w - 8, 1, C[0]); R((w >> 1) - 2, 0, 4, 1, gc);
  } else if (p.k === 'servo') {
    R(1, 1, w - 2, h - 2, C[1]); R(1, 1, w - 2, 1, C[2]); R(1, 1, 1, h - 2, C[2]); R(1, h - 2, w - 2, 1, C[0]); R(w - 2, 1, 1, h - 2, C[0]);
    const cx = Math.round(w * 0.4), cy = h >> 1, r = Math.min(w, h) * 0.32;
    for (let a = 0; a < 12; a++) { const A = (a / 12) * Math.PI * 2 + (p.st === 'ok' ? t / 900 : 0); R(Math.round(cx + Math.cos(A) * (r + 1)) - 1, Math.round(cy + Math.sin(A) * (r + 1)) - 1, 2, 2, C[0]); }
    g.fillStyle = C[2]; g.beginPath(); g.arc(X + cx, Y + cy, r, 0, Math.PI * 2); g.fill(); R(cx - 2, cy - 2, 4, 4, '#2a2e34'); R(cx - 1, cy - 1, 2, 2, '#c8d0dc');
    R(w - 9, 4, 5, h - 8, '#2a2e34'); R(w - 8, 5, 3, 1, gc);
  } else { R(1, 1, w - 2, h - 2, C[1]); R(1, 1, w - 2, 1, C[2]); R(3, (h >> 1), w - 6, 1, C[2]); }
  // the grade shows: scrap's rust, a clinic's stripe, Meridian's red band
  if (p.g === 'scrap') for (let i = 0; i < 10; i++) R(1 + Math.floor(hash(p.id, i, 3) * (w - 3)), 1 + Math.floor(hash(p.id, i, 4) * (h - 3)), 2, 1, '#7a4a2a');
  if (p.g === 'military') { R(2, h - 3, w - 4, 1, '#ff4a5a'); }
  if (p.g === 'clinic') { R(2, 2, w - 4, 1, '#7ae8d8'); }
  // what the lens shows: wear, burns, and a serial where there is one
  if (p.st === 'burnt') { R((w >> 1) - 3, (h >> 1) - 2, 6, 4, lens ? '#1a0a04' : '#2a1a10'); if (lens) { R((w >> 1) - 5, (h >> 1) - 3, 10, 1, '#5a2a0e'); R((w >> 1) - 1, (h >> 1) - 1, 2, 2, '#ff4a2a'); } }
  if (lens && p.st === 'worn') for (let i = 0; i < 14; i++) R(1 + Math.floor(hash(p.id, i, 7) * (w - 3)), 1 + Math.floor(hash(p.id, i, 8) * (h - 3)), 1, 1, '#c8a050');
  if (lens && p.st === 'dead') { R(2, 2, 2, 2, '#3a3e46'); }
  if (lens && p.g === 'military') for (let i = 0; i < 6; i++) R(3 + i * 3, h - 6, 2, 2, '#ffd0d8');
}

// the casing, closed: the device's own face over a bevelled shell
function casingArt(g, D, b, ox, oy, t, fx) {
  const C = D.col, R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); }, w = D.w, h = D.h;
  R(0, 1, w, h - 2, '#06080a'); R(1, 0, w - 2, h, '#06080a');
  R(1, 1, w - 2, h - 2, C[1]); R(2, 1, w - 4, 1, C[2]); R(1, 2, 1, h - 4, C[2]); R(2, h - 2, w - 4, 1, C[0]); R(w - 2, 2, 1, h - 4, C[0]);
  for (let i = 0; i < 40; i++) R(2 + Math.floor(hash(i, 1, w) * (w - 5)), 2 + Math.floor(hash(i, 2, w) * (h - 5)), 1 + (i % 3), 1, hash(i, 3, w) < 0.5 ? C[0] : C[2]);
  if (b.dev === 'navunit') {
    R(16, 14, 74, 48, '#06080a'); R(18, 16, 70, 44, '#0e1a22'); R(20, 18, 20, 1, '#2a4a5a'); R(20, 18, 1, 12, '#2a4a5a');
    for (let i = 0; i < 3; i++) { R(104, 18 + i * 14, 28, 10, '#06080a'); R(105, 19 + i * 14, 26, 8, C[2]); R(105, 26 + i * 14, 26, 1, C[0]); }
    for (let x = 18; x < 132; x += 4) R(x, 72, 2, 8, '#14181e');
  } else {
    R(58, 2, 1, h - 4, C[0]); R(108, 2, 1, h - 4, C[0]); R(59, 2, 1, h - 4, C[2]);
    g.fillStyle = C[0]; g.beginPath(); g.arc(ox + 31, oy + h / 2, 15, 0, Math.PI * 2); g.fill(); g.fillStyle = C[2]; g.beginPath(); g.arc(ox + 30, oy + h / 2 - 1, 12, 0, Math.PI * 2); g.fill(); R(27, (h >> 1) - 3, 6, 6, C[0]);
    for (let x = 70; x < 102; x += 4) R(x, 20, 2, 32, '#14181e');
  }
  // a light that shows it's alive, after a test
  const res = fx && fx.res, k = Math.floor(t / 300) % 2, [lx, ly] = D.led || [w - 12, h - 10];
  R(lx, ly, 4, 4, '#06080a');
  if (res === 'works') { R(lx + 1, ly + 1, 2, 2, '#3aff80'); g.fillStyle = 'rgba(58,255,128,0.35)'; g.fillRect(ox + lx - 2, oy + ly - 2, 8, 8); }
  if (res === 'half' && (k || hash(Math.floor(t / 90), 1, 1) < 0.5)) { R(lx + 1, ly + 1, 2, 2, '#ffb040'); }
  if (res === 'smoke') R(lx + 1, ly + 1, 2, 2, '#ff4a2a');
}
