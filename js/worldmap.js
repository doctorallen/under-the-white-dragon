'use strict';
// ---------------------------------------------------------------------------
// The city map: the whole city in cross-section, from the Spires above the
// clouds down through the towers, the street, the undercity, Old Town, the
// Works and the Bowels, every place pinned at its depth. Opened at a way out
// (a spinner pad, a subway platform, a lift cage, a manhole) it's how you
// travel: tap a place, then Go. From the pause menu it's just to look at.
// The picture is painted once, then dragged and zoomed; pins and names are
// drawn over it at screen resolution.
// ---------------------------------------------------------------------------
// the strata, top to bottom: the depths each spans (metres) and its height on
// the map; gaps between them are rock
const STRATA = [
  { id: 'sky', name: 'Above the clouds', top: 340, bot: 190, h: 150, gap: 0 },
  { id: 'high', name: 'Up high', top: 190, bot: -20, h: 250, gap: 0 },
  { id: 'street', name: 'Street level', top: -20, bot: -80, h: 120, gap: 18 },
  { id: 'under', name: 'The undercity', top: -80, bot: -132, h: 130, gap: 26 },
  { id: 'old', name: 'Old Town', top: -132, bot: -190, h: 140, gap: 46 },
  { id: 'works', name: 'The Works', top: -230, bot: -320, h: 140, gap: 46 },
  { id: 'bowels', name: 'The Bowels', top: -380, bot: -480, h: 150, gap: 0 },
];
(() => { let y = 0; for (const S of STRATA) { S.y = y; y += S.h + S.gap; } })();
const WMAP_W = 1000, WMAP_H = STRATA[STRATA.length - 1].y + STRATA[STRATA.length - 1].h;
// a depth in metres to a height on the map
function wmapY(m) {
  for (const S of STRATA) if (m <= S.top && m >= S.bot) return S.y + ((S.top - m) / (S.top - S.bot)) * S.h;
  if (m > STRATA[0].top) return 0;
  for (let i = 0; i + 1 < STRATA.length; i++) { const A = STRATA[i], B = STRATA[i + 1]; if (m < A.bot && m > B.top) return A.y + A.h + ((A.bot - m) / (A.bot - B.top)) * A.gap; }
  return WMAP_H;
}
function stratumOf(m) { return STRATA.find((S) => m <= S.top && m >= S.bot) || STRATA[STRATA.length - 1]; }

const WorldMap = {
  cv: null, img: null, K: 1.3, s: 1, ox: 0, oy: 0, sel: null, browse: false, timer: 0,
  // every place on the map: its pin and what you know of it
  places() {
    return Object.keys(LEVELS).filter((id) => LEVELS[id].metres !== undefined && LEVELS[id].mapX !== undefined).map((id) => {
      const L = LEVELS[id]; return { id, name: L.name, x: L.mapX, y: wmapY(L.metres), m: L.metres, L };
    });
  },
  html(browse) {
    this.browse = !!browse;
    return `<div class="mapwrap wmap"><canvas id="worldcv"></canvas><div class="mapbtns"><button data-wm="in">+</button><button data-wm="out">−</button><button data-wm="me">You</button></div><div class="wminfo" id="wminfo"></div></div>`;
  },
  // ---- the picture ----
  picture() {
    if (this.img) return this.img;
    const K = this.K, [c, g] = canvasOf(Math.ceil(WMAP_W * K), Math.ceil(WMAP_H * K)); g.scale(K, K);
    const H = (a, b, s) => hash(a | 0, b | 0, s);
    const band = (id) => STRATA.find((S) => S.id === id);
    const sky = band('sky'), hi = band('high'), st = band('street'), un = band('under'), old = band('old'), wk = band('works'), bw = band('bowels');
    const streetY = wmapY(-76);
    // the sky: deep violet into the smog's teal, stars above the clouds
    let gr = g.createLinearGradient(0, 0, 0, streetY); gr.addColorStop(0, '#05040c'); gr.addColorStop(0.25, '#0c0a20'); gr.addColorStop(0.55, '#14203a'); gr.addColorStop(1, '#1e3a4a'); g.fillStyle = gr; g.fillRect(0, 0, WMAP_W, streetY);
    for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(230,230,255,${0.3 + H(k, 1, 3) * 0.6})`; g.fillRect(H(k, 2, 3) * WMAP_W, H(k, 3, 3) * sky.h * 0.8, 1, 1); }
    // the far city, hazy, then the towers, nearer and darker
    const towers = (n, seed, hmin, hmax, wmin, wmax, col, lit, alpha) => {
      for (let k = 0; k < n; k++) {
        const w = wmin + H(k, 1, seed) * (wmax - wmin), x = H(k, 2, seed) * (WMAP_W + 40) - 20, h = hmin + Math.pow(H(k, 3, seed), 1.6) * (hmax - hmin), top = streetY - h;
        g.globalAlpha = alpha; g.fillStyle = col; g.fillRect(x, top, w, h);
        if (H(k, 4, seed) < 0.4) { g.fillRect(x + w * 0.3, top - h * 0.08, w * 0.4, h * 0.08); }
        if (H(k, 5, seed) < 0.3) { g.fillRect(x + w / 2 - 0.5, top - 12, 1, 12); g.fillStyle = '#ff3040'; g.fillRect(x + w / 2 - 0.5, top - 13, 1.2, 1.2); g.fillStyle = col; }
        for (let wy = top + 3; wy < streetY - 2; wy += 3) for (let wx = x + 1.5; wx < x + w - 1.5; wx += 2.5) if (H(wx * 7, wy * 5, seed) < lit) { g.fillStyle = ['#ffd890', '#a0f0ff', '#ff90c8', '#ffe8c0'][(H(wx, wy, seed + 1) * 4) | 0]; g.fillRect(wx, wy, 1, 1); g.fillStyle = col; }
        if (H(k, 6, seed) < 0.35) { g.fillStyle = ['#ff4ab0', '#3af0e0', '#ffd040'][(H(k, 7, seed) * 3) | 0]; g.fillRect(x - 1, top + h * (0.3 + H(k, 8, seed) * 0.5), 2, 6 + H(k, 9, seed) * 10); }
      }
      g.globalAlpha = 1;
    };
    towers(70, 11, 60, 260, 10, 26, '#1a2a3e', 0.08, 0.55);
    // the clouds, a deck the tallest towers break through
    const cloudY = sky.y + sky.h - 10;
    for (let k = 0; k < 90; k++) { const x = H(k, 1, 21) * WMAP_W, y = cloudY + (H(k, 2, 21) - 0.5) * 30, r = 14 + H(k, 3, 21) * 30; const cg = g.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, 'rgba(120,140,170,0.28)'); cg.addColorStop(1, 'rgba(120,140,170,0)'); g.fillStyle = cg; g.fillRect(x - r, y - r, r * 2, r * 2); }
    towers(55, 23, 80, 330, 14, 38, '#101826', 0.12, 1);
    // the Spires: white towers above the clouds, lit crowns
    for (const [x, h, w] of [[420, 360, 22], [470, 400, 26], [530, 380, 20], [575, 330, 16], [380, 300, 14]]) {
      const top = streetY - h; gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#8aa0c0'); gr.addColorStop(0.4, '#3a4a66'); gr.addColorStop(1, '#141c2c'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, streetY); g.lineTo(x, top + 14); g.lineTo(x + w / 2, top); g.lineTo(x + w, top + 10); g.lineTo(x + w, streetY); g.fill();
      for (let wy = top + 16; wy < streetY; wy += 4) { g.fillStyle = `rgba(200,230,255,${H(x, wy, 4) < 0.5 ? 0.5 : 0.12})`; g.fillRect(x + 2, wy, w - 4, 1); }
      g.fillStyle = '#e8f4ff'; g.fillRect(x + w / 2 - 1, top - 2, 2, 2);
    }
    // sky traffic: lanes of lights
    for (let k = 0; k < 140; k++) { const y = hi.y + 30 + ((k % 5) * 40) + (H(k, 1, 31) - 0.5) * 8; g.fillStyle = k % 3 ? 'rgba(255,240,210,0.7)' : 'rgba(255,60,60,0.7)'; g.fillRect(H(k, 2, 31) * WMAP_W, y, 2, 1); }
    // the street: a band of lit asphalt, overpasses, the haze
    gr = g.createLinearGradient(0, streetY - 30, 0, streetY); gr.addColorStop(0, 'rgba(255,120,200,0)'); gr.addColorStop(1, 'rgba(255,140,90,0.25)'); g.fillStyle = gr; g.fillRect(0, streetY - 30, WMAP_W, 30);
    for (let x = 0; x < WMAP_W; x += 3) { g.fillStyle = H(x, 1, 41) < 0.4 ? '#ffb060' : H(x, 2, 41) < 0.2 ? '#ff4ab0' : '#2a2a34'; g.fillRect(x, streetY - 1, 2, 1); }
    for (const x0 of [60, 520]) { g.fillStyle = '#20202a'; g.fillRect(x0, streetY - 26, 300, 5); for (let x = x0 + 20; x < x0 + 300; x += 60) g.fillRect(x, streetY - 21, 6, 21); }
    // under the street: earth, pipes, sewers
    const earth = (y0, y1, a, b) => { gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, y0, WMAP_W, y1 - y0); };
    earth(streetY, un.y + un.h + un.gap, '#1a1410', '#120e0c'); g.fillStyle = '#2a2a30'; g.fillRect(0, streetY, WMAP_W, 3);
    for (let k = 0; k < 9; k++) { const y = un.y + 12 + k * 13; g.fillStyle = ['#3a2a20', '#2a3036', '#4a2a1a'][k % 3]; g.fillRect(0, y, WMAP_W, 2); }
    for (let x = 30; x < WMAP_W; x += 90) { g.strokeStyle = '#4a3428'; g.lineWidth = 3; g.beginPath(); g.arc(x + 30, un.y + un.h - 30, 22, Math.PI, 0); g.stroke(); g.fillStyle = 'rgba(40,70,90,0.6)'; g.fillRect(x + 10, un.y + un.h - 30, 40, 5); }
    // rock between: strata lines
    const rock = (y0, y1, seed) => { earth(y0, y1, '#14100e', '#0e0b0a'); for (let k = 0; k < (y1 - y0) / 4; k++) { const y = y0 + k * 4 + H(k, 1, seed) * 3; g.fillStyle = `rgba(${60 + H(k, 2, seed) * 40},${45 + H(k, 3, seed) * 30},${35},0.35)`; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= WMAP_W; x += 50) g.lineTo(x, y + Math.sin(x / 90 + k) * 3); g.lineTo(WMAP_W, y + 2); g.lineTo(0, y + 2); g.fill(); } };
    // Old Town: a cavern under concrete, the old roofs, lanterns
    rock(un.y + un.h, old.y, 51);
    earth(old.y, old.y + old.h, '#1a1612', '#100c0a');
    for (let x = 40; x < WMAP_W; x += 110) { g.fillStyle = '#2a2a2c'; g.fillRect(x, old.y, 12, old.h - 30); g.fillRect(x - 6, old.y, 24, 6); }
    for (let k = 0; k < 60; k++) { const x = H(k, 1, 61) * WMAP_W, w = 16 + H(k, 2, 61) * 24, base = old.y + old.h - 26, h = 12 + H(k, 3, 61) * 18; g.fillStyle = '#1e1814'; g.fillRect(x, base - h, w, h); g.fillStyle = '#2a2a34'; g.beginPath(); g.moveTo(x - 4, base - h); g.lineTo(x + w / 2, base - h - 8); g.lineTo(x + w + 4, base - h); g.fill(); if (H(k, 4, 61) < 0.7) { g.fillStyle = '#ff7a3a'; g.fillRect(x + w * 0.4, base - h * 0.5, 2, 2); } }
    g.fillStyle = 'rgba(30,60,80,0.7)'; g.fillRect(0, old.y + old.h - 26, WMAP_W, 4);
    // the Works: machines, fire
    rock(old.y + old.h, wk.y, 71);
    earth(wk.y, wk.y + wk.h, '#1a120c', '#0e0a08');
    for (let k = 0; k < 26; k++) { const x = H(k, 1, 81) * WMAP_W, w = 20 + H(k, 2, 81) * 40, h = 30 + H(k, 3, 81) * 70, base = wk.y + wk.h - 14; g.fillStyle = '#241c18'; g.fillRect(x, base - h, w, h); if (H(k, 4, 81) < 0.5) { g.fillStyle = '#2a2420'; g.beginPath(); g.ellipse(x + w / 2, base - h, w / 2, 6, 0, 0, Math.PI * 2); g.fill(); } const fg = g.createRadialGradient(x + w / 2, base - 6, 0, x + w / 2, base - 6, 30); fg.addColorStop(0, 'rgba(255,120,40,0.45)'); fg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = fg; g.fillRect(x + w / 2 - 30, base - 36, 60, 40); }
    for (let k = 0; k < 6; k++) { g.fillStyle = '#3a2a1e'; g.fillRect(0, wk.y + 16 + k * 18, WMAP_W, 2); }
    // the Bowels: roots of cable, violet and green
    rock(wk.y + wk.h, bw.y, 91);
    earth(bw.y, bw.y + bw.h, '#120c18', '#08060c');
    for (let k = 0; k < 70; k++) { g.strokeStyle = k % 3 ? 'rgba(170,90,255,0.35)' : 'rgba(80,255,150,0.3)'; g.lineWidth = 1 + H(k, 1, 101) * 2; g.beginPath(); let x = H(k, 2, 101) * WMAP_W, y = bw.y; g.moveTo(x, y); for (let j = 0; j < 8; j++) { x += (H(k, j, 102) - 0.5) * 60; y += bw.h / 8; g.lineTo(x, y); } g.stroke(); }
    const core = g.createRadialGradient(560, bw.y + bw.h * 0.6, 0, 560, bw.y + bw.h * 0.6, 70); core.addColorStop(0, 'rgba(200,120,255,0.6)'); core.addColorStop(1, 'rgba(200,120,255,0)'); g.fillStyle = core; g.fillRect(490, bw.y, 140, bw.h);
    // the ways down: the subway, the lift shafts, manholes
    g.strokeStyle = 'rgba(255,208,64,0.55)'; g.lineWidth = 2; g.setLineDash([]); g.beginPath(); g.moveTo(330, streetY); g.lineTo(330, old.y + old.h - 30); g.lineTo(WMAP_W - 40, old.y + old.h - 30); g.stroke();
    g.strokeStyle = 'rgba(255,140,60,0.5)'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(700, old.y + old.h - 30); g.lineTo(700, wk.y + wk.h - 14); g.moveTo(560, wk.y + wk.h - 14); g.lineTo(560, bw.y + bw.h * 0.6); g.stroke(); g.setLineDash([]);
    // depth marks down the left
    return (this.img = c);
  },
  // ---- the view ----
  attach() {
    const cv = (this.cv = $('worldcv')); if (!cv) return;
    const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    this.picture();
    this.s = Math.max(cv.width / WMAP_W, 0.6 * dpr); const here = this.places().find((p) => p.id === World.L.id) || { x: 500, y: wmapY(0) };
    this.ox = cv.width / 2 - here.x * this.s; this.oy = cv.height * 0.42 - here.y * this.s; this.clampView();
    this.sel = this.sel && LEVELS[this.sel] ? this.sel : null; this.info(); this.draw();
    const pts = new Map(); let moved = 0, pinch = 0;
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } };
    cv.onpointermove = (e) => {
      if (!pts.has(e.pointerId)) return; const [px, py] = pts.get(e.pointerId), dx = e.clientX - px, dy = e.clientY - py; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.zoom(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; moved = 99; return; }
      moved += Math.abs(dx) + Math.abs(dy); this.ox += dx * dpr; this.oy += dy * dpr; this.clampView(); this.draw();
    };
    cv.onpointerup = (e) => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = 0;
      if (moved < 8) { const r = cv.getBoundingClientRect(); this.tap((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr); }
    };
    cv.onwheel = (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top); };
    document.querySelectorAll('button[data-wm]').forEach((b) => (b.onclick = () => { const k = b.dataset.wm; if (k === 'me') { const p = this.places().find((q) => q.id === World.L.id); if (p) { this.ox = cv.width / 2 - p.x * this.s; this.oy = cv.height * 0.42 - p.y * this.s; this.clampView(); } } else this.zoom(k === 'in' ? 1.4 : 1 / 1.4, cv.clientWidth / 2, cv.clientHeight / 2); this.draw(); }));
    clearInterval(this.timer); this.timer = setInterval(() => { if (!document.body.contains(cv)) { clearInterval(this.timer); return; } this.draw(); }, 120);
  },
  clampView() { const cv = this.cv, w = WMAP_W * this.s, h = WMAP_H * this.s; this.ox = w <= cv.width ? (cv.width - w) / 2 : clamp(this.ox, cv.width - w, 0); this.oy = h <= cv.height ? (cv.height - h) / 2 : clamp(this.oy, cv.height - h - cv.height * 0.3, cv.height * 0.15); },
  zoom(k, sx, sy) { const dpr = window.devicePixelRatio || 1, x = sx * dpr, y = sy * dpr, s0 = this.s; this.s = clamp(this.s * k, (this.cv.width / WMAP_W) * 0.9, 4 * dpr); this.ox = x - (x - this.ox) * (this.s / s0); this.oy = y - (y - this.oy) * (this.s / s0); this.clampView(); this.draw(); },
  // which pins are worth a mark: where an open case or job wants you
  wanted() { const w = new Set(); for (const c of Cases.open()) { const q = Cases.where(c); if (q) w.add(q.level); } for (const j of Quests.open()) { const q = Quests.where(j); if (q) w.add(q.level); } return w; },
  tap(x, y) {
    let best = null, bd = 26 * (window.devicePixelRatio || 1);
    for (const p of this.places()) { const d = Math.hypot(this.ox + p.x * this.s - x, this.oy + p.y * this.s - y); if (d < bd) { bd = d; best = p.id; } }
    this.sel = best; this.info(); this.draw();
  },
  // the card for the picked place: its name, its depth, what it is, Go
  info() {
    const el = $('wminfo'); if (!el) return;
    if (!this.sel) { el.innerHTML = `<p class="dim">${this.browse ? 'The city, top to bottom. Tap a place to see what it is.' : 'Tap a place to travel there.'}</p>`; return; }
    const L = LEVELS[this.sel], here = this.sel === World.L.id, ok = Travel.open(this.sel), S = stratumOf(L.metres), want = this.wanted().has(this.sel);
    let act = '';
    if (here) act = '<span class="tag">You are here</span>';
    else if (!ok) act = `<span class="tag lock">${lockText(this.sel)}</span>`;
    else if (this.browse) act = '<span class="tag">Travel from a spinner pad, a subway platform, a lift or a manhole</span>';
    else act = `<button data-go="${this.sel}" class="go">Go · ${Travel.how(this.sel)}</button>`;
    el.innerHTML = `<div class="wmcard"><div><b>${L.name}${want ? ' <i class="mark">◆</i>' : ''}</b><small>${S.name} · ${L.depth || ''}${L.label ? ' · ' + L.label : ''}</small><p>${ok || here ? L.blurb || '' : 'You haven\'t been there yet.'}</p></div>${act}</div>`;
    el.querySelectorAll('button[data-go]').forEach((b) => (b.onclick = () => Travel.go(b.dataset.go)));
  },
  draw() {
    const cv = this.cv; if (!cv || !document.body.contains(cv)) return;
    const g = cv.getContext('2d'), s = this.s, dpr = window.devicePixelRatio || 1, P = (x, y) => [this.ox + x * s, this.oy + y * s], t = performance.now() / 1000;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05040a'; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = true; g.drawImage(this.img, this.ox, this.oy, WMAP_W * s, WMAP_H * s);
    // the strata's names down the left edge
    g.font = `600 ${10 * dpr}px ui-monospace, monospace`; g.textAlign = 'left';
    for (const S of STRATA) { const [, y] = P(0, S.y + 6); g.fillStyle = 'rgba(8,6,12,0.6)'; const tw = g.measureText(S.name.toUpperCase()).width; g.fillRect(6 * dpr, y, tw + 10 * dpr, 15 * dpr); g.fillStyle = '#ff4ab0'; g.fillText(S.name.toUpperCase(), 11 * dpr, y + 11 * dpr); }
    // pins, then names, skipping names that would overlap
    const places = this.places(), want = this.wanted(), taken = [];
    for (const p of places) {
      const [x, y] = P(p.x, p.y), here = p.id === World.L.id, ok = Travel.open(p.id), sel = p.id === this.sel, hub = p.L.hub;
      const r = (hub ? 6 : 4.5) * dpr * (sel ? 1.3 : 1);
      if (here) { g.strokeStyle = `rgba(255,208,64,${0.5 + Math.sin(t * 4) * 0.3})`; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(x, y, r + (4 + Math.sin(t * 4) * 2) * dpr, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = here ? '#ffd040' : !ok ? '#4a4652' : want.has(p.id) ? '#ffb040' : hub ? '#3af0e0' : '#7ae8e0'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(5,4,10,0.9)'; g.lineWidth = 1.5 * dpr; g.stroke();
      if (sel) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5 * dpr; g.beginPath(); g.arc(x, y, r + 3 * dpr, 0, Math.PI * 2); g.stroke(); }
    }
    g.font = `${10.5 * dpr}px system-ui, sans-serif`;
    const order = places.slice().sort((a, b) => (b.id === this.sel) - (a.id === this.sel) || (b.id === World.L.id) - (a.id === World.L.id) || (want.has(b.id) - want.has(a.id)) || (!!b.L.hub - !!a.L.hub));
    for (const p of order) {
      const [x, y] = P(p.x, p.y), ok = Travel.open(p.id), text = (want.has(p.id) ? '◆ ' : '') + (ok || p.id === World.L.id ? p.name : '?'), w = g.measureText(text).width + 8 * dpr, h = 14 * dpr;
      let r = null;
      for (const [dx, dy] of [[8, -7], [8, 7], [-8 - w / dpr, -7], [-8 - w / dpr, 7]]) { const q = [x + dx * dpr, y + dy * dpr - h / 2, w, h]; if (!taken.some((u) => q[0] < u[0] + u[2] && q[0] + q[2] > u[0] && q[1] < u[1] + u[3] && q[1] + q[3] > u[1])) { r = q; break; } }
      if (!r) continue; taken.push(r);
      g.fillStyle = 'rgba(8,6,12,0.72)'; g.fillRect(...r); g.fillStyle = p.id === World.L.id ? '#ffd040' : want.has(p.id) ? '#ffb040' : ok ? '#e8e4f0' : '#7a7484'; g.fillText(text, r[0] + 4 * dpr, r[1] + 10.5 * dpr);
    }
  },
};
