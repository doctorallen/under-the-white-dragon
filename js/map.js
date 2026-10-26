'use strict';
// ---------------------------------------------------------------------------
// The map: the whole level, paused, to drag around and zoom. It's the
// painted level itself (every chunk painted, the props laid on it), with
// markers drawn over it: you, the people who matter, the ways in and out,
// what's hostile. With the dev setting on, a tap on the map puts you there.
// ---------------------------------------------------------------------------
const MapView = {
  cache: {}, cv: null, s: 1, ox: 0, oy: 0, img: null,
  html() { return '<div class="mapwrap"><canvas id="mapcv"></canvas><div class="mapbtns"><button data-map="in">+</button><button data-map="out">−</button><button data-map="fit">Fit</button><button data-map="me">You</button></div><p class="maphint">Drag to look around, pinch or scroll to zoom.' + (Dev.s.teleport ? ' Tap to teleport.' : '') + '</p></div>'; },
  // the level as one picture, made once per level
  picture() {
    const L = World.L; if (this.cache[L.id]) return this.cache[L.id];
    const [c, g] = canvasOf(L.w, L.h), CS = T.chunk;
    g.fillStyle = '#0a0c14'; g.fillRect(0, 0, L.w, L.h);
    for (let ky = 0; ky * CS < L.h; ky++) for (let kx = 0; kx * CS < L.w; kx++) { const ch = Paint.get(kx, ky); g.drawImage(ch.c, ch.x, ch.y); }
    for (const p of World.props) { const s = Props.sprite(p); if (s) g.drawImage(s.c, Math.round(p.x - s.ax), Math.round(p.y - s.ay)); }
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6;
    for (let ky = 0; ky * CS < L.h; ky++) for (let kx = 0; kx * CS < L.w; kx++) { const ch = Paint.get(kx, ky); if (ch.e) g.drawImage(ch.e, ch.x, ch.y); }
    return (this.cache[L.id] = c);
  },
  attach() {
    const cv = (this.cv = $('mapcv')); if (!cv) return;
    const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    this.img = this.picture(); this.fit(); this.draw();
    // dragging, pinching, the wheel; a tap teleports in dev mode
    const pts = new Map(); let moved = 0, pinch = 0;
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
    cv.onpointermove = (e) => {
      if (!pts.has(e.pointerId)) return; const [px, py] = pts.get(e.pointerId), dx = e.clientX - px, dy = e.clientY - py; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.zoom(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; moved = 99; return; }
      moved += Math.abs(dx) + Math.abs(dy); this.ox += dx * dpr; this.oy += dy * dpr; this.draw();
    };
    cv.onpointerup = (e) => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = 0;
      if (moved < 6 && Dev.s.teleport) { const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) * dpr - this.ox) / this.s, y = ((e.clientY - r.top) * dpr - this.oy) / this.s; Player.place(x, y); Player.vx = Player.vy = 0; Game.cam.x = x; Game.cam.y = y - 30; Hud.toggle(null); }
    };
    cv.onwheel = (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top); };
    document.querySelectorAll('button[data-map]').forEach((b) => (b.onclick = () => { const k = b.dataset.map; if (k === 'fit') this.fit(); else if (k === 'me') { this.s = Math.max(this.s, 2 * dpr); this.ox = cv.width / 2 - Player.x * this.s; this.oy = cv.height / 2 - Player.y * this.s; } else this.zoom(k === 'in' ? 1.5 : 1 / 1.5, cv.clientWidth / 2, cv.clientHeight / 2); this.draw(); }));
  },
  fit() { const cv = this.cv, L = World.L; this.s = Math.min(cv.width / L.w, cv.height / L.h) * 0.96; this.ox = (cv.width - L.w * this.s) / 2; this.oy = (cv.height - L.h * this.s) / 2; },
  // zoom about a point on screen (css px)
  zoom(k, sx, sy) { const dpr = window.devicePixelRatio || 1, x = sx * dpr, y = sy * dpr, s0 = this.s; this.s = clamp(this.s * k, 0.1, 8 * dpr); this.ox = x - (x - this.ox) * (this.s / s0); this.oy = y - (y - this.oy) * (this.s / s0); this.draw(); },
  draw() {
    const cv = this.cv; if (!cv || !document.body.contains(cv)) return;
    const g = cv.getContext('2d'), s = this.s, dpr = window.devicePixelRatio || 1, P = (x, y) => [this.ox + x * s, this.oy + y * s];
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#06050a'; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = s < 1; g.drawImage(this.img, this.ox, this.oy, this.img.width * s, this.img.height * s);
    g.fillStyle = 'rgba(6,5,10,0.25)'; g.fillRect(this.ox, this.oy, this.img.width * s, this.img.height * s);
    // dots first, then their names, most important first, skipping any that would overlap
    const marks = [], mark = (x, y, text, col, dot, pri) => marks.push({ x, y, text, col, dot, pri });
    const PLACES = { elevator: 'Elevator', spinner: 'Spinner', lift: 'Freight lift', hatch: 'Shaft', exit: 'Ladder up', node: 'Data node', bed: 'Bed', closet: 'Closet', sealed: 'Sealed', heavy: 'Shutter', grate: 'Grate' };
    for (const p of World.props) if (PLACES[p.kind] && !(p.kind === 'node' && p.done)) mark(p.x, p.y - 20, PLACES[p.kind], '#3af0e0', 2.5, 2);
    for (const n of Actors.npcs) if (!n.hidden) { const named = n.def.role || !/Passer-by|Commuter|Local|Night worker/.test(n.def.name); mark(n.x, n.y - 20, named ? n.def.name : '', n.def.role ? '#ffb040' : '#a69cb6', n.def.role ? 3 : 2, n.def.role ? 3 : 1); }
    for (const e of Actors.enemies) if (!e.ally) mark(e.x, e.y - 12, e.type === 'warden' ? 'The Warden' : '', '#ff4060', e.type === 'warden' ? 5 : 3, 4);
    for (const b of Actors.bodies) mark(b.x, b.y - 2, '', '#5a4048', 2, 0);
    mark(Player.x, Player.y - 16, 'You', '#ffd040', 4 + Math.sin(performance.now() / 200) * 1.5, 9);
    for (const m of marks) { const [a, b] = P(m.x, m.y); g.fillStyle = m.col; g.beginPath(); g.arc(a, b, m.dot * dpr, 0, Math.PI * 2); g.fill(); }
    g.font = `${11 * dpr}px ui-monospace, monospace`;
    const taken = [];
    for (const m of marks.filter((q) => q.text).sort((p, q) => q.pri - p.pri)) {
      const [a, b] = P(m.x, m.y), w = g.measureText(m.text).width + 8 * dpr, h = 14 * dpr, r = [a + 5 * dpr, b - 15 * dpr, w, h];
      if (taken.some((t) => r[0] < t[0] + t[2] && r[0] + r[2] > t[0] && r[1] < t[1] + t[3] && r[1] + r[3] > t[1])) continue;
      taken.push(r); g.fillStyle = 'rgba(8,6,12,0.8)'; g.fillRect(...r); g.fillStyle = m.col; g.fillText(m.text, a + 9 * dpr, b - 4 * dpr);
    }
  },
};
