'use strict';
// ---------------------------------------------------------------------------
// The White Dragon: the noodle bar's neon dragon, in pixel art, and its sign.
// dragonHead(N) is the head in profile (the icon's), dragonVert(W) the whole
// dragon coiling down a tall sign; both come back as a canvas with .glow.
// Every part is a shape on a design grid cut to whole pixels, and a neon tube
// runs along each edge where a part lies over what's behind it.
// ---------------------------------------------------------------------------
// the White Dragon's head, in profile facing left, as a neon sign: every part
// drawn as a shape on a 100 x 100 design, cut to whole pixels at N, then a
// tube along every edge where a part meets what's behind it.
// window.dragonHead(N) -> canvas, with .glow
function dragonHead (N, o = {}) {
  const S = N / (o.design || 100), H0 = o.h || N, xf = o.xf || [0, 0, 1];
  const mask = (draw, whole) => { const c = document.createElement('canvas'); c.width = N; c.height = H0; const g = c.getContext('2d'); g.scale(S, S); if (!whole) { g.translate(xf[0], xf[1]); g.scale(xf[2], xf[2]); } g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round'; draw(g); const d = g.getImageData(0, 0, N, H0).data, m = new Uint8Array(N * H0); for (let i = 0; i < N * H0; i++) m[i] = d[i * 4 + 3] > 120 ? 1 : 0; return m; };
  const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
  const lw = (g, w, whole) => { g.lineWidth = Math.max(w, 1.15 / S / (whole ? 1 : xf[2])); };
  // the parts, back to front: [name, mask, tube colour, fill]
  const P = [];
  const skip = new Set(o.skip || []);
  const add = (name, draw, tube, fill, whole) => { if (!skip.has(name)) P.push({ name, m: mask(draw, whole), tube, fill }); };
  if (o.before) o.before(add, { poly, lw, CY: [214, 252, 255], RED: [255, 74, 92], WHITE: [255, 255, 255], PANEL: [16, 30, 34], PANEL_R: [44, 10, 18], BELLY: [26, 44, 46] });
  const CY = [214, 252, 255], RED = [255, 74, 92], WHITE = [255, 255, 255], AMB = [255, 206, 96];
  const PANEL = [16, 30, 34], PANEL_R = [44, 10, 18];
  // the mane: flames streaming back from the head and down the neck
  add('mane', (g) => { for (const [x, y, l, a, w] of [[66, 22, 26, -0.35, 7], [70, 30, 28, -0.05, 8], [72, 40, 26, 0.25, 8], [74, 50, 24, 0.5, 7], [76, 60, 20, 0.75, 7], [80, 70, 16, 0.95, 6]]) { const tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l, nx = -Math.sin(a), ny = Math.cos(a); g.beginPath(); g.moveTo(x - nx * w, y - ny * w); g.quadraticCurveTo(x + Math.cos(a) * l * 0.55 - nx * w * 0.2, y + Math.sin(a) * l * 0.55 - ny * w * 0.2 - 3, tx, ty); g.quadraticCurveTo(x + Math.cos(a) * l * 0.45 + nx * w * 0.5, y + Math.sin(a) * l * 0.45 + ny * w * 0.5, x + nx * w, y + ny * w); g.closePath(); g.fill(); } }, [120, 210, 255], PANEL);
  // the far horn
  add('hornB', (g) => { lw(g, 3.2); g.beginPath(); g.moveTo(62, 26); g.quadraticCurveTo(78, 18, 94, 20); g.stroke(); lw(g, 2.4); g.beginPath(); g.moveTo(80, 19); g.quadraticCurveTo(84, 12, 82, 6); g.stroke(); }, CY, PANEL);
  // the neck, curving down and away
  add('neck', (g) => { g.beginPath(); g.moveTo(54, 66); g.bezierCurveTo(60, 78, 64, 90, 62, 100); g.lineTo(94, 100); g.bezierCurveTo(92, 76, 84, 50, 74, 30); g.closePath(); g.fill(); }, CY, PANEL);
  // its belly plates, down the front
  add('plates', (g) => { lw(g, 1.1); g.beginPath(); g.moveTo(60, 70); g.bezierCurveTo(68, 80, 72, 90, 72, 100); g.stroke(); for (const t of [0.2, 0.42, 0.64, 0.86]) { const y = 72 + t * 28, x0 = 57 + t * 6, x1 = 64 + t * 8; g.beginPath(); g.moveTo(x0, y - 1); g.quadraticCurveTo((x0 + x1) / 2, y + 2.4, x1 + 2, y - 1.6); g.stroke(); } }, CY, PANEL);
  // the beard: points down and back under the jaw
  add('beard', (g) => { for (let k = 0; k < 5; k++) { const x = 22 + k * 7, y = 67 - k * 0.3; poly(g, [[x - 2, y - 2], [x + 6, y - 1], [x + 6 + k, y + 8 - k * 0.6]]); } }, CY, PANEL);
  // the lower jaw, dropped open
  add('jaw', (g) => poly(g, [[50, 50], [21, 62], [18, 65.5], [23, 68.5], [46, 67], [58, 60]]), CY, PANEL);
  // inside the mouth
  add('mouth', (g) => poly(g, [[48, 46.5], [15, 44.5], [21, 62], [50, 51]]), [120, 24, 36], [70, 8, 20]);
  // teeth: down from the upper jaw, up from the lower, a fang at the front of each
  add('teeth', (g) => { poly(g, [[15.5, 44.4], [20, 44.8], [18, 55]]); for (const x of [24, 29, 34, 39]) poly(g, [[x, 45.4], [x + 3.4, 45.7], [x + 1.6, 50.5]]); poly(g, [[21.6, 61.4], [25.4, 59.8], [22.6, 52.6]]); for (const x of [29, 34, 39, 44]) { const y = 62 - (x - 21) * 0.38; poly(g, [[x, y], [x + 3.4, y - 1.3], [x + 1.4, y - 5]]); } }, WHITE, [190, 210, 220]);
  // the tongue, forked, curling out past the fangs
  add('tongue', (g) => { lw(g, 2.2); g.beginPath(); g.moveTo(44, 55); g.bezierCurveTo(36, 58, 28, 60, 21, 59); g.bezierCurveTo(14, 58, 10, 62, 7, 66); g.stroke(); lw(g, 1.6); g.beginPath(); g.moveTo(7, 66); g.lineTo(2, 64); g.stroke(); g.beginPath(); g.moveTo(7, 66); g.lineTo(5, 72); g.stroke(); }, RED, RED);
  // the head: brow, snout, upper lip
  add('head', (g) => { g.beginPath(); g.moveTo(74, 30); g.bezierCurveTo(64, 18, 50, 20, 42, 26); g.lineTo(22, 30.5); g.bezierCurveTo(13, 31, 8.5, 35, 9.5, 40); g.bezierCurveTo(10, 43, 12, 44.4, 15, 44.6); g.lineTo(48, 46.5); g.lineTo(58, 54); g.lineTo(68, 50); g.closePath(); g.fill(); }, CY, PANEL);
  // the nose: a knob on the snout's tip, a curled nostril
  add('nose', (g) => {}, CY, PANEL);
  add('nostril', (g) => { lw(g, 1.1); g.beginPath(); g.moveTo(17.5, 36.5); g.bezierCurveTo(16, 33.5, 11.5, 34.5, 12.5, 38); g.bezierCurveTo(13, 40, 16, 39.6, 15.4, 37.6); g.stroke(); }, CY, PANEL);
  // ridges along the snout
  add('ridges', (g) => { for (const x of [22, 28, 34]) { g.beginPath(); g.arc(x, 29.5, 2.6, Math.PI, 0); g.fill(); } }, CY, PANEL);
  // a fin at the cheek, behind the mouth
  add('cheek', (g) => { for (const [x, y, tx, ty] of [[54, 46, 74, 40], [56, 52, 76, 50], [56, 58, 72, 60]]) poly(g, [[x, y - 3], [tx, ty], [x + 2, y + 3]]); }, CY, PANEL);
  // the brow, heavy over the eye
  add('brow', (g) => poly(g, [[36, 30], [44, 23], [52, 22], [58, 26], [52, 27], [44, 28]]), CY, PANEL);
  add('eye', (g) => { g.beginPath(); g.ellipse(47, 32, 5, 3.2, -0.15, 0, 7); g.fill(); }, AMB, [255, 170, 60]);
  add('pupil', (g) => { g.beginPath(); g.ellipse(46, 32, 1.1, 2.4, 0, 0, 7); g.fill(); }, [60, 20, 10], [60, 20, 10]);
  // the near horn, branched like antlers
  add('hornF', (g) => { lw(g, 3.8); g.beginPath(); g.moveTo(54, 24); g.bezierCurveTo(62, 12, 74, 6, 90, 4); g.stroke(); lw(g, 2.8); g.beginPath(); g.moveTo(66, 11); g.quadraticCurveTo(68, 4, 64, -1); g.stroke(); g.beginPath(); g.moveTo(77, 6.5); g.quadraticCurveTo(82, 1, 80, -3); g.stroke(); }, CY, PANEL);
  // whiskers: one curling up and back from the nose, one hanging from the lip
  add('whiskers', (g) => { lw(g, 1.1); g.beginPath(); g.moveTo(11, 35); g.bezierCurveTo(4, 26, 8, 14, 18, 13); g.bezierCurveTo(26, 12, 26, 20, 20, 21); g.bezierCurveTo(16, 21.5, 15.5, 18, 18, 17); g.stroke(); g.beginPath(); g.moveTo(20, 64); g.bezierCurveTo(11, 70, 8, 80, 13, 88); g.bezierCurveTo(17, 94, 24, 90, 21, 86); g.stroke(); }, CY, PANEL);
  // compose: each pixel takes the frontmost part; a tube where it meets a part behind it
  const NN = N * H0, lab = new Int16Array(NN).fill(-1);
  P.forEach((p, k) => { for (let i = 0; i < NN; i++) if (p.m[i]) lab[i] = k; });
  const c = document.createElement('canvas'); c.width = N; c.height = H0; const cg = c.getContext('2d'), img = cg.createImageData(N, H0), D = img.data;
  const e = document.createElement('canvas'); e.width = N; e.height = H0; const eg = e.getContext('2d'), eimg = eg.createImageData(N, H0), E = eimg.data;
  const put = (A, i, col) => { A[i * 4] = col[0]; A[i * 4 + 1] = col[1]; A[i * 4 + 2] = col[2]; A[i * 4 + 3] = 255; };
  const thin = new Set(['whiskers', 'tongue', 'plates', 'nostril', 'hornF', 'hornB', 'pupil', 'bplates', 'claws', 'clawsB'].concat(o.thinExtra || []));
  for (let y = 0; y < H0; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, k = lab[i]; if (k < 0) continue; const p = P[k];
    let edge = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; const q = X < 0 || Y < 0 || X >= N || Y >= H0 ? -1 : lab[Y * N + X]; if (q < k) { edge = true; break; } }
    if (p.name === 'eye' || p.name === 'pupil' || p.name === 'tongue') { put(D, i, p.fill); if (p.name !== 'pupil') put(E, i, p.name === 'eye' ? [255, 170, 60] : [255, 50, 50]); continue; }
    if (edge || (thin.has(p.name) && !['hornF', 'hornB', 'claws', 'clawsB'].includes(p.name))) { put(D, i, p.tube); put(E, i, p.tube === RED || (p.tube[0] > 200 && p.tube[1] < 120) ? [255, 40, 60] : p.tube === WHITE ? [200, 240, 255] : p.tube[0] < 120 ? [40, 140, 255] : [58, 220, 240]); }
    else put(D, i, p.fill);
  }
  cg.putImageData(img, 0, 0); eg.putImageData(eimg, 0, 0); c.glow = e; return c;
};

// the dragon coming down a tall sign: the head at the top, the body in red
// neon coiling down in S-curves, ribbed across, a frill of cyan wisps along
// its back, a mane streaming up, clawed legs reaching out, a flame at the
// tail. Designed 100 x 184; window.dragonVert(W) -> canvas W x W*1.84
function dragonVert (W) {
  const pts = [[44, 44], [60, 54], [70, 72], [60, 90], [40, 100], [30, 118], [42, 134], [62, 140], [70, 154], [58, 166], [46, 170]];
  const path = []; for (let k = 0; k < pts.length - 1; k++) { const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)]; for (let s = 0; s < 1; s += 1 / 30) { const t2 = s * s, t3 = t2 * s; path.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  path.push(pts.at(-1));
  const n = path.length, R = (i) => 8 * (1 - i / n) + 1.4 * (i / n);
  const nrm = (i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
  const at = (i) => path[Math.min(n - 1, Math.max(0, Math.round(i)))];
  const before = (add, k) => {
    const { poly, lw, CY, RED, WHITE, PANEL, PANEL_R } = k, BLUE = [90, 200, 255];
    // the mane: long wisps streaming up and back from behind the head
    add('maneV', (g) => { lw(g, 1.1, true); for (let k = 0; k < 6; k++) { const x = 36 + k * 4.4, y = 22 + k * 2, h = 26 - k * 2.2, sw = 6 + k; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x - 3, y - h * 0.35, x + sw, y - h * 0.55, x + sw * 0.7, y - h * 0.8); g.quadraticCurveTo(x + sw * 0.5, y - h, x + sw * 1.2, y - h * 1.08); g.stroke(); } }, BLUE, PANEL, true);
    // the far legs and claws
    const leg = (i, dx, dy) => (g) => { const [x, y] = at(i); lw(g, 3.4, true); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx * 0.3, y + dy * 0.9, x + dx, y + dy); g.stroke(); };
    const claws = (i, dx, dy, side) => (g) => { const [x, y] = at(i), fx = x + dx, fy = y + dy; lw(g, 1.5, true); for (const a of [-1.0, -0.3, 0.4]) { const aa = Math.atan2(dy, dx) + a; g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx + Math.cos(aa) * 6, fy + Math.sin(aa) * 6, fx + Math.cos(aa + side * 0.9) * 10, fy + Math.sin(aa + side * 0.9) * 10); g.stroke(); } };
    add('legB2', leg(n * 0.62, 18, 4), BLUE, PANEL, true); add('clawsB2', claws(n * 0.62, 18, 4, 1), BLUE, PANEL, true);
    // the body, in red neon, ribbed across
    add('bodyV', (g) => { for (let i = 0; i < n; i++) { const [x, y] = path[i]; g.beginPath(); g.arc(x, y, R(i), 0, 7); g.fill(); } }, WHITE, [22, 28, 38], true);
    add('ribs', (g) => { lw(g, 1.05, true); for (let i = 5; i < n - 8; i += 9) { const [x, y] = path[i], [nx, ny] = nrm(i), r = R(i) * 0.85, [x2, y2] = path[Math.min(n - 1, i + 3)]; g.beginPath(); g.moveTo(x - nx * r, y - ny * r); g.quadraticCurveTo(x2, y2, x + nx * r, y + ny * r); g.stroke(); } }, WHITE, [22, 28, 38], true);
    // the frill of wisps along its back, curling away
    add('frill', (g) => { lw(g, 1.05, true); for (let i = 8; i < n - 6; i += 8) { const [x, y] = path[i], [nx, ny] = nrm(i), r = R(i), [bx, by] = path[Math.max(0, i - 4)], tx = x - bx, ty = y - by, L = Math.hypot(tx, ty) || 1, h = 5 + r * 0.7; g.beginPath(); g.moveTo(x - nx * (r + 0.8), y - ny * (r + 0.8)); g.bezierCurveTo(x - nx * (r + h * 0.7) + tx / L * 2, y - ny * (r + h * 0.7) + ty / L * 2, x - nx * (r + h) - tx / L * 3, y - ny * (r + h) - ty / L * 3, x - nx * (r + h * 0.55) - tx / L * 6, y - ny * (r + h * 0.55) - ty / L * 6); g.stroke(); } }, BLUE, PANEL, true);
    // the near legs, reaching out, and the tail's flame
    add('legF2', leg(n * 0.12, -20, 6), BLUE, PANEL, true); add('clawsF2', claws(n * 0.12, -20, 6, -1), BLUE, PANEL, true);
    add('legF3', leg(n * 0.38, -16, 8), BLUE, PANEL, true); add('clawsF3', claws(n * 0.38, -16, 8, -1), BLUE, PANEL, true);
    add('tailV', (g) => { const [x, y] = path.at(-1); lw(g, 1.1, true); for (const a of [1.6, 2.2, 2.8, 3.4]) { g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5 + 2, x + Math.cos(a) * 9 + 3, y + Math.sin(a) * 9 + 3, x + Math.cos(a) * 12, y + Math.sin(a) * 12 + 4); g.stroke(); } }, BLUE, PANEL, true);
  };
  return dragonHead(W, { skip: ['neck', 'plates', 'mane'], h: Math.round(W * 1.84), before, xf: [2, 4, 0.62], design: 100, thinExtra: ['ribs', 'frill', 'maneV', 'tailV', 'clawsB2', 'clawsF2', 'clawsF3'] });
};

// ---- the sign ------------------------------------------------------------------
// 白 and 龍 as pixels (cut once from a CJK face, so every phone shows the same)
const KANJI = {
  bai: ['.....111.....', '....1111.....', '....1111.....', '1111111111111', '1111111111111', '111.......111', '111.......111', '111.......111', '1111111111111', '1111111111111', '111.......111', '111.......111', '111.......111', '1111111111111', '1111111111111', '1111111111111', '11.........11'],
  long: ['....11...111......', '....11.11111..111.', '.1111111111111111.', '..11.111.111..11..', '..11.111.11111111.', '.111111111....11..', '.......1.1111111..', '.11111111111..11..', '.111..11111111111.', '.11111111111..1...', '.111111111111111..', '.11111111111...1..', '.1111111111111111.', '.1111.111111....1.', '.11..111.11111111.', '.1....11.111111111', '1.....1....111111.'],
};
// 3 x 5 letters for the sign's words (W and N a little wider, to read)
const PIX3 = {
  W: ['1...1', '1...1', '1.1.1', '1.1.1', '.1.1.'], H: ['1.1', '1.1', '111', '1.1', '1.1'], I: ['111', '.1.', '.1.', '.1.', '111'], T: ['111', '.1.', '.1.', '.1.', '.1.'], E: ['111', '1..', '11.', '1..', '111'],
  B: ['11.', '1.1', '11.', '1.1', '11.'], D: ['11.', '1.1', '1.1', '1.1', '11.'], R: ['11.', '1.1', '11.', '1.1', '1.1'], A: ['.1.', '1.1', '111', '1.1', '1.1'], G: ['.11', '1..', '1.1', '1.1', '.11'], O: ['.1.', '1.1', '1.1', '1.1', '.1.'],
  N: ['1..1', '11.1', '1.11', '1..1', '1..1'], L: ['1..', '1..', '1..', '1..', '111'], S: ['.11', '1..', '.1.', '..1', '11.'], ' ': ['...', '...', '...', '...', '...'],
};
function pixText(g, text, x, y, col, k = 1) { g.fillStyle = col; let cx = x; for (const ch of text) { const P = PIX3[ch] || PIX3[' ']; P.forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') g.fillRect(cx + i * k, y + j * k, k, k); })); cx += (P[0].length + 1) * k; } return cx - x - k; }
function pixKanji(g, rows, x, y, col) { g.fillStyle = col; rows.forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') g.fillRect(x + i, y + j, 1, 1); })); }
// the sign: a blue neon frame, the dragon coming down it, 白龍 stacked in red
// down the left, WHITE DRAGON and NOODLES along the foot; hung from a steel
// rail bolted to the wall above it
function dragonSign() {
  const W = 62, H = 92, T = 7, [c, g] = canvasOf(W + 4, H + T), [e, eg] = canvasOf(W + 4, H + T), ox = 2;
  // the rail and its two struts up into the wall
  g.fillStyle = '#2a2e36'; g.fillRect(0, T - 3, W + 4, 3); g.fillStyle = '#5a606c'; g.fillRect(0, T - 3, W + 4, 1);
  for (const x of [10, W - 8]) { g.fillStyle = '#2a2e36'; g.fillRect(x, 0, 2, T - 3); g.fillStyle = '#8a909c'; g.fillRect(x, T - 2, 2, 1); }
  // the plate, opaque, with a dark edge
  g.fillStyle = '#06050a'; g.fillRect(ox, T, W, H); g.fillStyle = '#0e0c16'; g.fillRect(ox + 1, T + 1, W - 2, H - 2);
  for (const G2 of [g, eg]) { G2.fillStyle = '#3a8cff'; G2.fillRect(ox + 2, T + 2, W - 4, 1); G2.fillRect(ox + 2, T + H - 3, W - 4, 1); G2.fillRect(ox + 2, T + 2, 1, H - 4); G2.fillRect(ox + W - 3, T + 2, 1, H - 4); }
  const d = dragonVert(36); g.drawImage(d, ox + 22, T + 3); eg.drawImage(d.glow, ox + 22, T + 3);
  for (const G2 of [g, eg]) { pixKanji(G2, KANJI.bai, ox + 5, T + 9, '#ff4a5a'); pixKanji(G2, KANJI.long, ox + 3, T + 30, '#ff4a5a'); G2.fillStyle = '#ff3a4e'; G2.fillRect(ox + 4, T + 6, 18, 1); G2.fillRect(ox + 4, T + 50, 18, 1); }
  const wid = (t) => [...t].reduce((n, ch) => n + (PIX3[ch] || PIX3[' '])[0].length + 1, -1), tw = wid('WHITE DRAGON'), nw = wid('NOODLES');
  pixText(g, 'WHITE DRAGON', ox + Math.round((W - tw) / 2), T + H - 19, '#e8fcff'); pixText(eg, 'WHITE DRAGON', ox + Math.round((W - tw) / 2), T + H - 19, '#58c8d8');
  pixText(g, 'NOODLES', ox + Math.round((W - nw) / 2), T + H - 11, '#3af0e0'); pixText(eg, 'NOODLES', ox + Math.round((W - nw) / 2), T + H - 11, '#3af0e0');
  return { c, e, w: W + 4, h: H + T, ax: (W + 4) / 2, ay: H + T - 1 };
}
