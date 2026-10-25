'use strict';
// People, painted from shapes like everything else: a figure from a few
// choices (hair, coat, cyberware, what they carry), facing right, anchored at
// the feet, about 30 px tall.
const rp = (h, n = 6) => { const c = col3(h); return rampOf([mixRgb(c, [6, 4, 10], 0.55), c, mixRgb(c, [255, 245, 230], 0.3)], n, 0.5, 0.25); };
const SKINS = ['#e8b48a', '#c88a5a', '#8a5a3a', '#5a3a26', '#f0c8a8', '#b07850'];
function person(o = {}) {
  // a canvas 40 x 50, the feet at the bottom middle; heights in units of a
  // 33 px adult, so `tall` scales the whole figure from the feet
  const S = new Spr(44, 52, o.seed || 1); S.ax = 20; S.ay = 51;
  const F = 51, u = o.tall || 1, Y = (h) => F - h * u, cx = 20, wd = o.wide || 0;
  const sk = rp(o.skin || SKINS[0], 6), top = rp(o.top || '#3a3a48', 7), legs = rp(o.legs || '#2a2a34', 6), boots = rp(o.boots || '#18161c', 5);
  const hair = rp(o.hairCol || '#1a1414', 6), chrome = MAT.chrome, acc = o.acc ? col3(o.acc) : null, dark = (r) => r.map((c) => mixRgb(c, [8, 6, 12], 0.3));
  const pose = o.pose || 'stand', bob = pose === 'walk1' || pose === 'walk3' ? -0.6 : 0;
  // the stride: [back, front] foot offsets and lifts
  const st = { stand: [[-1.2, 0], [1.6, 0]], walk0: [[-4, 0], [4, 0]], walk1: [[-1, 1.6], [1, 0]], walk2: [[4, 0], [-4, 0]], walk3: [[1, 0], [-1, 1.6]], sit: [[2, 0], [5, 0]], jump: [[-2.5, 3.2], [2.5, 1.6]], fall: [[-1.5, 1], [2, 2.2]], climb0: [[-0.5, 3], [0.5, 0]], climb1: [[-0.5, 0], [0.5, 3]], strike: [[-3.5, 0], [3.5, 0]], cut: [[-2, 0], [2.6, 0]], hurt: [[-2.5, 1], [1, 0]] }[pose] || [[-1, 0], [1.5, 0]];
  const head = Y(29.5) + bob, sh = Y(24) + bob, waist = Y(16) + bob, hip = Y(14) + bob, knee = Y(7.2), ank = Y(1.6);
  // a leg: thigh, shin, boot; chrome if it's cyberware
  const leg = (f, back) => {
    const [dx, lift] = f, ramp = o.cyLegs ? chrome : legs, R = back ? dark(ramp) : ramp, kx = cx + dx * 0.55 + (pose === 'sit' ? 5 : 0.6), ky = pose === 'sit' ? hip + 1 : knee - lift * 0.6, ax = cx + dx + (pose === 'sit' ? 6 : 0), ay = pose === 'sit' ? F - 2 : ank - lift;
    S.cap(cx + (back ? -1.2 : 1) + dx * 0.15, hip, kx, ky, 2.3 + wd * 0.3, 1.9, R);
    S.cap(kx, ky, ax, ay, 1.8, 1.4, R);
    if (o.cyLegs && acc) { S.px(kx, ky, acc, true); S.px(ax, ay - 2, acc, true); }
    const B = back ? dark(boots) : boots;
    S.cap(ax - 0.5, ay + 0.1, ax + 2.8, ay + 0.5, 1.7, 1.35, B, { bias: 0.05 });
    for (let x = Math.round(ax - 1.5); x <= Math.round(ax + 3.5); x++) if (S.get(x, Math.round(ay + 1.6))) S.px(x, ay + 1.6, B[0]);
  };
  // an arm to a hand, the elbow found by bending it down and back
  const arm = (shx, hx, hy, back) => {
    const cy = o.cyArm === 'both' || (o.cyArm && !back), ramp = cy ? chrome : top, R = back ? dark(ramp) : ramp;
    const L = 5.6 * u, dx = hx - shx, dy = hy - sh, D = Math.min(Math.hypot(dx, dy), 2 * L - 0.1), a = Math.atan2(dy, dx), k = Math.acos(D / (2 * L));
    const ex = shx + Math.cos(a + k) * L, ey = sh + 1 + Math.sin(a + k) * L;
    S.cap(shx, sh + 1, ex, ey, 1.9 + wd * 0.2, 1.6, R);
    S.cap(ex, ey, hx, hy, 1.6, 1.3, R);
    if (!cy && acc && o.trim !== false) S.px(hx - Math.sign(hx - ex), hy - Math.sign(hy - ey), acc, true);
    S.cap(hx, hy, hx + 0.6, hy + 0.4, 1.3, 1.2, cy ? chrome : back ? dark(sk) : sk);
    if (cy && acc) { S.px(ex, ey, acc, true); S.px((ex + hx) / 2, (ey + hy) / 2, acc, true); }
  };
  const H = o.hands || {}, hb = [H.bx === undefined ? cx - 2.5 : H.bx, H.by === undefined ? hip + 0.5 : H.by], hf = [H.fx === undefined ? cx + 4.8 : H.fx, H.fy === undefined ? hip + 1 : H.fy];
  // behind: a pack, an umbrella's shaft, the back arm and leg
  if (o.pack) { const pk = rp(o.pack, 6); S.shape([[cx - 8.6, sh], [cx - 3, sh - 0.5], [cx - 3, waist + 1], [cx - 9, waist + 1]], pk, { down: 0.3 }); S.cap(cx - 8.4, sh - 1.2, cx - 3.6, sh - 1.4, 1.4, 1.4, rp('#5a4a3a', 5)); for (let y = Math.round(sh + 2); y < waist; y += 3) S.px(cx - 8, y, pk[0]); if (acc) S.px(cx - 7, sh + 4, acc, true); }
  arm(cx - 2.6, hb[0], hb[1], true);
  leg(st[0], true);
  // the body: a coat to the knee or a jacket to the hip, a collar, a belt
  const w0 = 4.4 + wd, sx0 = cx - w0, sx1 = cx + w0 - 0.6;
  if (o.coat === 'long') leg(st[1], false); // under a long coat the front leg goes first
  if (o.coat === 'long') S.shape([[sx0 - 0.4, waist], [sx1 + 0.3, waist], [sx1 + 1.6, Y(5.5)], [cx + 0.5, Y(6.5)], [sx0 - 1.8, Y(5.2)]], top, { down: 0.3, folds: true });
  S.shape([[sx0 + 0.6, sh - 0.6], [sx1 - 0.2, sh - 0.6], [sx1 + 0.6, sh + 2], [sx1 - 0.4, waist], [sx1, hip + 0.8], [sx0, hip + 0.8], [sx0 + 0.4, waist], [sx0 - 0.4, sh + 2]], top);
  if (o.shirt) S.shape([[cx + 1.6, sh], [sx1 - 0.6, sh], [sx1 - 0.8, waist - 1], [cx + 2.4, waist - 1]], rp(o.shirt, 5));
  if (o.apron) S.shape([[cx - 1, sh + 3], [sx1 + 0.8, sh + 3], [sx1 + 1.6, Y(5)], [cx - 1.5, Y(5)]], rp(o.apron, 6), { down: 0.25 });
  if (o.armor) { S.cap(cx - 2.5, sh + 2.5, cx + 2.5, sh + 2.5, 3.4, 3.4, rp(o.armor, 7)); S.cap(cx - 3.5, sh + 1, cx - 4.5, sh + 1.5, 2.6, 2.6, rp(o.armor, 7)); }
  if (o.collar) S.cap(cx - 3, sh - 1, cx + 0.5, sh - 1.8, 2.2, 1.6, top, { bias: 0.12 });
  for (let x = Math.round(sx0); x <= Math.round(sx1); x++) if (S.get(x, Math.round(hip))) S.px(x, hip, rp(o.belt || '#141216')[1]);
  if (acc && o.trim !== false) for (let y = Math.round(sh + 1); y < (o.coat === 'long' ? Y(6) : hip); y++) { const x = Math.round(sx1 - 0.5 + (y > waist ? (y - waist) * 0.12 : 0)); if (S.get(x, y)) S.px(x, y, acc, (y % 3) === 0); }
  if (o.plates && acc) for (let y = Math.round(sh + 2); y < waist; y += 2) S.px(cx + 1, y, acc, true);
  // the front leg, over the body's hem
  if (o.coat !== 'long') leg(st[1], false);
  // the head: neck, skull, face, an ear, an eye, a brow, a nose, a mouth
  S.cap(cx + 0.4, sh, cx + 1, head + 3, 1.5, 1.4, sk);
  S.cap(cx + 0.6, head - 0.6, cx + 1.4, head + 0.8, 3.7, 3.3, sk);
  S.cap(cx + 2.4, head + 2.2, cx + 3.2, head + 2.4, 1.6, 1.3, sk); // the jaw and chin
  S.px(cx - 0.4, head + 0.6, sk[1]); S.px(cx - 0.4, head + 1.5, sk[2]);
  S.px(cx + 3.2, head - 0.2, '#0c080a'); S.px(cx + 3.2, head - 1.3, hair[1]); S.px(cx + 4.2, head - 1.3, hair[2]);
  S.px(cx + 4.9, head + 0.7, sk[4]); S.px(cx + 4.9, head + 1.5, sk[2]); S.px(cx + 3.9, head + 2.7, sk[1]);
  const hs = o.hair || 'short';
  if (hs === 'short' || hs === 'undercut') { S.cap(cx - 0.6, head - 2.6, cx + 2.6, head - 3.2, 2.4, 1.8, hair); S.cap(cx - 2.2, head - 1.6, cx - 1.8, head + 1, 1.8, 1.5, hair); if (hs === 'undercut') { S.cap(cx + 1, head - 3.6, cx + 4.6, head - 3, 1.7, 1.2, hair, { bias: 0.15 }); for (let y = Math.round(head - 1); y < head + 2; y++) S.px(cx - 2, y, sk[1]); } }
  if (hs === 'mohawk') { for (let x = -3; x <= 3; x++) { const hgt = 3 + (x >= -1 && x <= 1 ? 3 : x === -2 || x === 2 ? 1.5 : 0); for (let y = 0; y < hgt; y++) S.px(cx + x, head - 3.4 - y, mixRgb(hair[4], [255, 255, 255], y > hgt - 2 ? 0.45 : 0), !!o.hairGlow && y > hgt - 2); } }
  if (hs === 'bob') { S.cap(cx - 0.6, head - 2.2, cx + 2.8, head - 2.8, 2.8, 2.2, hair); S.cap(cx - 2.4, head - 1.4, cx - 2.2, head + 3, 2.1, 1.8, hair); for (let x = 1; x < 6; x++) S.px(cx + x, head - 2.4, hair[x < 3 ? 2 : 3]); }
  if (hs === 'long') { S.cap(cx - 0.6, head - 2.4, cx + 2.6, head - 3, 2.6, 2, hair); S.cap(cx - 2.4, head - 1.4, cx - 3, head + 7, 2.2, 1.8, hair); }
  if (hs === 'bun') { S.cap(cx - 0.6, head - 2.4, cx + 2.6, head - 3, 2.6, 2, hair); S.cap(cx - 3, head - 4.4, cx - 3, head - 4.4, 2, 2, hair); S.px(cx - 2.4, head - 6.4, '#d83a3a'); S.px(cx - 1.6, head - 6.8, '#d83a3a'); }
  if (hs === 'hood') { S.cap(cx - 1, head - 1, cx + 1.6, head - 1.6, 4.6, 4.2, top); S.cap(cx + 2.6, head + 0.6, cx + 3, head + 1.4, 2.4, 2, sk); S.px(cx + 3.4, head, '#0c080a'); }
  if (hs === 'cap') { const cc = rp(o.capCol || '#3a2a2a'); S.cap(cx - 0.6, head - 2.6, cx + 2.4, head - 3, 2.6, 2, cc); for (let x = 3; x < 8; x++) S.px(cx + x, head - 2, cc[x < 5 ? 2 : 1]); }
  if (hs === 'helmet') { const ar = rp(o.armor || '#c8ccd4', 7), vz = col3(o.visor || '#ff3040'); S.cap(cx + 0.2, head - 1, cx + 1.8, head, 4.4, 4.1, ar); for (let x = 1; x < 6; x++) { S.px(cx + x, head - 0.4, mixRgb(vz, [255, 255, 255], x === 3 ? 0.5 : 0), true); S.px(cx + x, head + 0.4, mixRgb(vz, [0, 0, 0], 0.45), true); } }
  if (hs === 'bald') { S.px(cx + 1, head - 3.4, sk[5]); S.px(cx + 2, head - 3.4, sk[4]); }
  if (o.eye) { const ec = col3(o.eye); for (let x = 2; x < 6; x++) S.px(cx + x, head - 0.3, mixRgb(ec, [255, 255, 255], x === 3 ? 0.55 : 0.1), true); S.px(cx + 1, head - 0.3, chrome[3]); S.px(cx + 1, head + 0.6, chrome[2]); }
  if (o.mask) for (let x = 1; x < 6; x++) for (let y = 1; y < 3; y++) S.px(cx + x, head + y + 0.5, rp(o.mask, 4)[y]);
  if (o.port && acc) S.px(cx - 1.5, head + 2.2, acc, true);
  // the front arm, and what it holds
  arm(cx + 1.6, hf[0], hf[1], false);
  const [hx, hy] = hf;
  if (o.cutter) { const c = col3(o.cutterCol || '#ffb040'); S.cap(hx - 1, hy, hx + 5, hy - 0.5, 1.2, 1.1, MAT.steel); S.cap(hx + 0.5, hy + 1, hx + 0.5, hy + 2.5, 0.9, 0.8, MAT.steelD); S.px(hx + 6, hy - 0.5, c, true); S.px(hx + 7, hy - 0.5, mixRgb(c, [255, 255, 255], 0.6), true); S.px(hx + 2, hy - 1.5, c, true); }
  if (o.blade) { const c = col3(o.blade); for (let q = 0; q < 11; q++) S.px(hx + 1 + q * 0.95, hy - 1 - q * 0.45, q < 2 ? chrome[2] : mixRgb(c, [255, 255, 255], q % 4 ? 0.25 : 0.7), q >= 2); }
  if (o.gun) { S.cap(hx - 1, hy - 1, hx + 6, hy - 1.4, 1.4, 1.2, MAT.steelD); S.px(hx + 1, hy + 0.8, MAT.steelD[2]); S.px(hx + 4, hy - 1.4, col3(o.visor || '#ff3040'), true); }
  if (o.bowl) { S.cap(hx - 0.5, hy - 1, hx + 3, hy - 1, 1.6, 1.4, ['#5a1a0e', '#a83a1e', '#e06a3a', '#ffa070']); S.px(hx + 1, hy - 4, '#d8d8e0'); S.px(hx + 2, hy - 6, '#b8b8c0'); S.px(hx + 1, hy - 8, '#9898a0'); }
  if (o.phone) { S.px(hx + 1, hy - 1, col3(o.phone), true); S.px(hx + 1, hy - 2, col3(o.phone), true); }
  if (o.umbrella) { const uc = rp(o.umbrella, 6); S.cap(hx, hy, hx, head - 9, 0.6, 0.6, ['#2a2a2a', '#5a5a5a', '#8a8a8a']); S.cap(hx - 9, head - 9, hx + 9, head - 9, 2.4, 2.4, uc, { mask: (x, y) => y <= head - 9 }); for (let x = -10; x <= 10; x++) S.px(hx + x, head - 8.6, o.umbrellaGlow ? col3(o.umbrellaGlow) : uc[0], !!o.umbrellaGlow && x % 2 === 0); }
  const out = S.done(); out.actor = true; return out;
}
// walking frames come from the same choices

// ---- the machines -----------------------------------------------------------
function drone(o = {}) {
  const S = new Spr(24, 14, 31); S.ax = 12; S.ay = 13;
  const b = rp(o.col || '#3a4048'), eye = o.eye || '#ff3040';
  S.ell(12, 7, 6, 3.4, b); for (let x = 1; x < 23; x++) if (x < 6 || x > 18) S.px(x, 4, MAT.steel[3]);
  for (const x of [3, 21]) { S.ell(x, 3.5, 3, 0.8, ['#3a3a40', '#8a8a96']); }
  S.px(14, 7, eye, true); S.px(15, 7, mixRgb(col3(eye), [255, 255, 255], 0.5), true); S.px(15, 8, eye, true);
  if (o.light) for (let y = 10; y < 14; y++) S.px(12, y, col3(o.light), true);
  return S.done();
}
function spider(o = {}) {
  const S = new Spr(30, 18, 33); S.ax = 15; S.ay = 17; const b = rp(o.col || '#2a2e34'), eye = o.eye || '#ff3040';
  for (const [a, b2, c] of [[8, 4, -1], [10, 7, 1], [20, 24, -1], [22, 27, 1]]) { S.limb(a + 3, 8, b2, 4 + c, 1.4, MAT.steel); S.limb(b2, 4 + c, b2 + (b2 < 15 ? -2 : 2), 17, 1.2, MAT.steel); }
  S.ell(15, 8, 7, 4.2, b); S.ell(17, 6, 3, 2, b, { bias: 0.2 });
  for (let x = 0; x < 3; x++) S.px(19 + x, 8, eye, true);
  return S.done();
}
// a security mech: the Stack's boss, the Warden
function mech(o = {}) {
  const S = new Spr(80, 86, 35); S.ax = 40; S.ay = 85; const pl = rp(o.col || '#c8c4bc', 7), dk = MAT.steelD, eye = o.eye || '#ff3040';
  // legs, reverse-jointed
  for (const [dx, sh] of [[-12, 0.1], [12, -0.1]]) {
    S.limb(40 + dx, 52, 40 + dx * 1.4 + 6, 64, 6, MAT.steel); S.limb(40 + dx * 1.4 + 6, 64, 40 + dx * 1.2, 82, 4.5, MAT.steel);
    S.box(40 + dx * 1.2 - 7, 81, 40 + dx * 1.2 + 6, 85, dk, { lo: 1, hi: 6 });
    S.px(40 + dx * 1.4 + 6, 64, eye, true);
  }
  // hull
  S.ell(40, 38, 21, 16, pl); S.box(22, 44, 58, 54, rp('#8a8680', 6), { lo: 0, hi: 5 });
  for (let x = 24; x < 57; x += 4) S.px(x, 49, dk[1]);
  // the cockpit slit and the warning stripes
  for (let x = 44; x < 58; x++) { S.px(x, 33, col3(eye), true); S.px(x, 34, mixRgb(col3(eye), [0, 0, 0], 0.4), true); }
  for (let x = 22; x < 40; x++) for (let y = 26; y < 29; y++) S.px(x, y, ((x + y) >> 1) % 2 ? '#e8b030' : '#1a1a1a');
  // arms: a gun and a claw
  S.box(56, 36, 76, 42, dk, { lo: 1, hi: 6 }); S.box(70, 34, 79, 44, MAT.steel, { lo: 1, hi: 7 }); for (let y = 36; y < 43; y += 2) S.px(79, y, '#ffb040', true);
  S.limb(22, 40, 10, 52, 5, MAT.steel); S.limb(10, 52, 5, 46, 2.5, MAT.chrome); S.limb(10, 52, 4, 58, 2.5, MAT.chrome);
  // stencil
  for (const [x, y] of [[30, 38], [31, 38], [32, 38], [30, 39], [30, 40], [31, 40], [32, 40], [32, 41], [30, 42], [31, 42], [32, 42]]) S.px(x, y, '#2a2a2a');
  return S.done();
}
