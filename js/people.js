'use strict';
// People, painted from shapes like everything else: a figure from a few
// choices (hair, coat, cyberware, what they carry), facing right, anchored at
// the feet, about 30 px tall.
const rp = (h, n = 6) => { const c = col3(h); return rampOf([mixRgb(c, [6, 4, 10], 0.55), c, mixRgb(c, [255, 245, 230], 0.3)], n, 0.5, 0.25); };
const SKINS = ['#e8b48a', '#c88a5a', '#8a5a3a', '#5a3a26', '#f0c8a8', '#b07850'];
function person(o = {}) {
  if (o.view === 'back') return personBack(o);
  if (o.view === 'front') return personFront(o);
  // a canvas 40 x 50, the feet at the bottom middle; heights in units of a
  // 33 px adult, so `tall` scales the whole figure from the feet
  const S = Spr.figure(44, 52, o.seed || 1); S.ax = 20; S.ay = 51;
  const pose0 = o.pose || 'stand';
  // a gait: walkN or runN, N of 6 steps round the cycle. Each leg swings
  // forward lifted and back planted, opposite to the other; the arms swing
  // against the legs; the body rises as the legs pass and dips as they part.
  // Running strides further, lifts higher, leans in and pumps the arms.
  const gait = /^(walk|run)(\d)$/.exec(pose0);
  let gaitSt = null, gbob = 0, lean = 0;
  if (gait) {
    const run = gait[1] === 'run', ph = (+gait[2] / 6) * Math.PI * 2, A = run ? 6.6 : 4.6, lift = run ? 4.2 : 2, sA = Math.sin(ph), cA = Math.cos(ph);
    gaitSt = [[-A * sA, Math.max(0, -cA) * lift], [A * sA, Math.max(0, cA) * lift]];
    gbob = run ? -1.3 * Math.abs(cA) + 0.3 : -0.7 * (1 - Math.abs(sA));
    lean = run ? 1.6 : 0.4;
    if (!o.fixedHands) { const sw = run ? 3.2 : 2.2, hy = run ? 33 : 37; o = Object.assign({}, o, { hands: Object.assign({}, o.hands || {}, { fx: 24 + lean - sw * sA * (o.holding ? 0.4 : 1), fy: hy - (run ? Math.abs(sA) * 1.5 : 0), bx: 17 + lean + sw * sA, by: hy + 1 - (run ? Math.abs(sA) : 0) }) }); }
  }
  const F = 51, u = o.tall || 1, Y = (h) => F - h * u, lx = 20, cx = 20 + lean, wd = o.wide || 0;
  const sk = rp(o.skin || SKINS[0], 6), top = rp(o.top || '#3a3a48', 7), legs = rp(o.legs || '#2a2a34', 6), boots = rp(o.boots || '#18161c', 5);
  const hair = rp(o.hairCol || '#1a1414', 6), chrome = MAT.chrome, acc = o.acc ? col3(o.acc) : null, dark = (r) => r.map((c) => mixRgb(c, [8, 6, 12], 0.3));
  const hs0 = o.hair || 'short', pose = pose0, bob = gait ? gbob : pose === 'breathe' ? -0.75 : 0;
  // the stride: [back, front] foot offsets and lifts
  const st = { stand: [[-1.2, 0], [1.6, 0]], sit: [[2, 0], [5, 0]], jump: [[-2.5, 3.2], [2.5, 1.6]], fall: [[-1.5, 1], [2, 2.2]], climb0: [[-0.5, 3], [0.5, 0]], climb1: [[-0.5, 0], [0.5, 3]], strike: [[-3.5, 0], [3.5, 0]], cut: [[-2, 0], [2.6, 0]], hurt: [[-2.5, 1], [1, 0]] }[pose] || gaitSt || [[-1, 0], [1.5, 0]];
  const head = Y(29.5) + bob, sh = Y(24) + bob, waist = Y(16) + bob, hip = Y(14) + bob, knee = Y(7.2), ank = Y(1.6);
  // a leg: thigh, shin, boot; chrome if it's cyberware
  const leg = (f, back) => {
    const [dx, lift] = f, ramp = o.cyLegs ? chrome : legs, R = back ? dark(ramp) : ramp, kx = lx + lean * 0.5 + dx * 0.55 + (pose === 'sit' ? 5 : 0.6), ky = pose === 'sit' ? hip + 1 : knee - lift * 0.6, ax = lx + dx + (pose === 'sit' ? 6 : 0), ay = pose === 'sit' ? F - 2 : ank - lift;
    S.cap(lx + lean * 0.7 + (back ? -1.2 : 1) + dx * 0.15, hip, kx, ky, 2.3 + wd * 0.3, 1.9, R);
    S.cap(kx, ky, ax, ay, 1.8, 1.4, R);
    if (o.cyLegs && acc) { S.px(kx, ky, acc, true); S.px(ax, ay - 2, acc, true); }
    if (o.kneePad) S.cap(kx - 0.3, ky - 0.6, kx + 0.6, ky + 0.6, 1.4, 1.2, back ? dark(rp(o.kneePad, 5)) : rp(o.kneePad, 5));
    if (o.pockets && pose !== 'sit') S.cap(kx - 0.6 - dx * 0.15, ky - 3, kx - 0.4 - dx * 0.12, ky - 1.4, 1.2, 1.1, back ? dark(dark(legs)) : dark(legs));
    S.part(); const B = back ? dark(boots) : boots;
    S.cap(ax - 0.5, ay + 0.1, ax + 2.8, ay + 0.5, 1.7, 1.35, B, { bias: 0.05 });
    S.px(ax + 2.6, ay - 0.4, B[4]); S.px(ax - 1, ay - 1.2, B[3]); S.px(ax, ay - 1.2, B[3]);
    for (let x = Math.round(ax - 1.5); x <= Math.round(ax + 3.5); x++) if (S.get(x, Math.round(ay + 1.6))) S.px(x, ay + 1.6, o.soles ? (back ? dark([col3(o.soles)])[0] : col3(o.soles)) : B[0], !!o.soles && !back);
  };
  // an arm to a hand, the elbow found by bending it down and back
  const arm = (shx, hx, hy, back) => {
    const cy = o.cyArm === 'both' || (o.cyArm && !back), ramp = cy ? chrome : top, R = back ? dark(ramp) : ramp;
    const L = 5.6 * u, dx = hx - shx, dy = hy - sh, D = Math.min(Math.hypot(dx, dy), 2 * L - 0.1), a = Math.atan2(dy, dx), k = Math.acos(D / (2 * L));
    const ex = shx + Math.cos(a + k) * L, ey = sh + 1 + Math.sin(a + k) * L;
    S.cap(shx, sh + 1, ex, ey, 1.9 + wd * 0.2, 1.6, R);
    S.cap(ex, ey, hx, hy, 1.6, 1.3, R);
    if (!cy && acc && o.trim !== false) S.px(hx - Math.sign(hx - ex), hy - Math.sign(hy - ey), acc, true);
    S.part(); S.cap(hx, hy, hx + 0.6, hy + 0.4, 1.3, 1.2, cy ? chrome : back ? dark(sk) : sk);
    if (cy && acc) { S.px(ex, ey, acc, true); S.px((ex + hx) / 2, (ey + hy) / 2, acc, true); }
  };
  const H = o.hands || {}, hb = [H.bx === undefined ? cx - 2.5 : H.bx, H.by === undefined ? hip + 0.5 : H.by], hf = [H.fx === undefined ? cx + 4.8 : H.fx, H.fy === undefined ? hip + 1 : H.fy];
  // behind: a pack, an umbrella's shaft, the back arm and leg
  if (o.pack) { const pk = rp(o.pack, 6); S.shape([[cx - 8.6, sh], [cx - 3, sh - 0.5], [cx - 3, waist + 1], [cx - 9, waist + 1]], pk, { down: 0.3 }); S.cap(cx - 8.4, sh - 1.2, cx - 3.6, sh - 1.4, 1.4, 1.4, rp('#5a4a3a', 5)); for (let y = Math.round(sh + 2); y < waist; y += 3) S.px(cx - 8, y, pk[0]); if (acc) S.px(cx - 7, sh + 4, acc, true); }
  S.part(); arm(cx - 2.6, hb[0], hb[1], true);
  S.part(); leg(st[0], true);
  S.part();
  // the body: a coat to the knee or a jacket to the hip, a collar, a belt
  const w0 = 4.4 + wd, sx0 = cx - w0, sx1 = cx + w0 - 0.6;
  if (o.coat === 'long') { leg(st[1], false); S.part(); } // under a long coat the front leg goes first
  // the skirt of a long coat opens over the front knee and trails behind,
  // further and higher at a run
  if (o.coat === 'long') {
    const run = gait && gait[1] === 'run', fdx = gait ? Math.max(0, st[1][0], st[0][0]) : 0, hem = run ? Y(7.5) : gait ? Y(6.2) : Y(5.5);
    S.shape([[sx0 - 0.4, waist], [sx1 + 0.3, waist], [sx1 + 1.6 + fdx * 0.45, hem], [cx + 0.5, hem - 1], [sx0 - 1.8 - (run ? 2.6 : gait ? 0.8 : 0), hem + (run ? -2 : 0.3)]], top, { down: 0.3, folds: true });
  }
  S.shape([[sx0 + 0.6, sh - 0.6], [sx1 - 0.2, sh - 0.6], [sx1 + 0.6, sh + 2], [sx1 - 0.4, waist], [sx1, hip + 0.8], [sx0, hip + 0.8], [sx0 + 0.4, waist], [sx0 - 0.4, sh + 2]], top);
  if (o.shirt) S.shape([[cx + 1.6, sh], [sx1 - 0.6, sh], [sx1 - 0.8, waist - 1], [cx + 2.4, waist - 1]], rp(o.shirt, 5));
  // a vest over the shirt: a plate and its straps, where the coat's open
  if (o.vest) { const vr = rp(o.vest, 6), x0 = o.coat === 'long' || o.coat === 'jacket' ? cx + 1.4 : sx0 + 0.6; S.shape([[x0, sh + 1.5], [sx1 - 0.4, sh + 1.5], [sx1 - 0.6, waist + 0.5], [x0 + 0.6, waist + 0.5]], vr, { down: 0.2 }); for (let x = Math.round(x0 + 1); x < sx1 - 1; x += 2) S.px(x, waist - 2, vr[1]); }
  if (o.apron) S.shape([[cx - 1, sh + 3], [sx1 + 0.8, sh + 3], [sx1 + 1.6, Y(5)], [cx - 1.5, Y(5)]], rp(o.apron, 6), { down: 0.25 });
  if (o.armor) { S.cap(cx - 2.5, sh + 2.5, cx + 2.5, sh + 2.5, 3.4, 3.4, rp(o.armor, 7)); S.cap(cx - 3.5, sh + 1, cx - 4.5, sh + 1.5, 2.6, 2.6, rp(o.armor, 7)); }
  if (o.collar) S.cap(cx - 3, sh - 1, cx + 0.5, sh - 1.8, 2.2, 1.6, top, { bias: 0.12 });
  // the cut of it: a coat's opening and lapel, its buttons and a pocket; a
  // shirt's placket and a breast pocket
  const fr = Math.round(cx + 2.4), bottom = o.coat === 'long' ? Y(6) : hip;
  if (!o.armor && !o.apron) {
    if (o.coat === 'long' || o.coat === 'jacket') {
      for (let y = Math.round(sh + 1); y < bottom; y++) { const x = Math.round(fr + 0.5 + (y > hip ? (y - hip) * 0.15 : 0)); if (S.get(x, y) && !o.vest && !o.shirt) S.px(x, y, top[0]); }
      for (let y = Math.round(sh); y < Math.round(waist - 1); y++) { const x = Math.round(cx + 0.6 + (y - sh) * 0.45); if (S.get(x, y)) S.px(x, y, top[5]); }
      if (o.coat === 'long') { S.px(fr - 0.5, hip + 2.5, top[0]); S.px(fr - 0.5, hip + 5, top[0]); for (let x = fr - 4; x < fr - 1; x++) S.px(x, hip + 3, top[1]); }
      else S.px(fr - 0.5, waist - 1, top[0]);
    } else if (!o.vest) {
      for (let y = Math.round(sh + 2); y < hip; y++) S.px(fr, y, top[1]);
      S.px(fr - 2, sh + 3, top[1]); S.px(fr - 1, sh + 3, top[1]);
    }
  }
  for (let x = Math.round(sx0); x <= Math.round(sx1); x++) if (S.get(x, Math.round(hip))) S.px(x, hip, rp(o.belt || '#141216')[1]);
  if (!o.apron && S.get(Math.round(sx1) - 1, Math.round(hip))) S.px(Math.round(sx1) - 1, hip, '#b8a070');
  if (acc && o.trim !== false) for (let y = Math.round(sh + 1); y < (o.coat === 'long' ? Y(6) : hip); y++) { const x = Math.round(sx1 - 0.5 + (y > waist ? (y - waist) * 0.12 : 0)); if (S.get(x, y)) S.px(x, y, acc, (y % 3) === 0); }
  // the front leg, over the body's hem
  if (o.coat !== 'long') { S.part(); leg(st[1], false); }
  S.part();
  // the head: neck, skull, face, an ear, an eye, a brow, a nose, a mouth
  S.cap(cx + 0.4, sh, cx + 1, head + 3, 1.5, 1.4, sk);
  S.cap(cx + 0.6, head - 0.6, cx + 1.4, head + 0.8, 3.7, 3.3, sk);
  S.cap(cx + 2.4, head + 2.2, cx + 3.2, head + 2.4, 1.6, 1.3, sk); // the jaw and chin
  S.px(cx - 0.4, head + 0.6, sk[1]); S.px(cx - 0.4, head + 1.5, sk[2]);
  S.px(cx + 3.2, head - 0.2, '#0c080a'); S.px(cx + 3.2, head - 1.3, hair[1]); S.px(cx + 4.2, head - 1.3, hair[2]);
  S.px(cx + 4.9, head + 0.7, sk[4]); S.px(cx + 4.9, head + 1.5, sk[2]); S.px(cx + 3.9, head + 2.7, sk[1]);
  // the white of the eye, behind the pupil
  if (!o.eye && !o.shades && hs0 !== 'helmet' && hs0 !== 'hood') S.px(cx + 2.2, head - 0.2, mixRgb([236, 230, 220], col3(o.skin || SKINS[0]), 0.25));
  S.part(false); const hs = o.hair || 'short';
  if (hs === 'short' || hs === 'undercut') { S.cap(cx - 0.6, head - 2.6, cx + 2.6, head - 3.2, 2.4, 1.8, hair); S.cap(cx - 2.2, head - 1.6, cx - 1.8, head + 1, 1.8, 1.5, hair); if (hs === 'undercut') { S.cap(cx + 1, head - 3.6, cx + 4.6, head - 3, 1.7, 1.2, hair, { bias: 0.15 }); for (let y = Math.round(head - 1); y < head + 2; y++) S.px(cx - 2, y, sk[1]); } }
  if (hs === 'mohawk') { for (let x = -3; x <= 3; x++) { const hgt = 3 + (x >= -1 && x <= 1 ? 3 : x === -2 || x === 2 ? 1.5 : 0); for (let y = 0; y < hgt; y++) S.px(cx + x, head - 3.4 - y, mixRgb(hair[4], [255, 255, 255], y > hgt - 2 ? 0.45 : 0), !!o.hairGlow && y > hgt - 2); } }
  if (hs === 'bob') { S.cap(cx - 0.6, head - 2.2, cx + 2.8, head - 2.8, 2.8, 2.2, hair); S.cap(cx - 2.4, head - 1.4, cx - 2.2, head + 3, 2.1, 1.8, hair); for (let x = 1; x < 6; x++) S.px(cx + x, head - 2.4, hair[x < 3 ? 2 : 3]); }
  if (hs === 'long') { S.cap(cx - 0.6, head - 2.4, cx + 2.6, head - 3, 2.6, 2, hair); S.cap(cx - 2.4, head - 1.4, cx - 3, head + 7, 2.2, 1.8, hair); }
  if (hs === 'bun') { S.cap(cx - 0.6, head - 2.4, cx + 2.6, head - 3, 2.6, 2, hair); S.cap(cx - 3, head - 4.4, cx - 3, head - 4.4, 2, 2, hair); S.px(cx - 2.4, head - 6.4, '#d83a3a'); S.px(cx - 1.6, head - 6.8, '#d83a3a'); }
  if (hs === 'hood') { S.cap(cx - 1, head - 1, cx + 1.6, head - 1.6, 4.6, 4.2, top); S.cap(cx + 2.6, head + 0.6, cx + 3, head + 1.4, 2.4, 2, sk); S.px(cx + 3.4, head, '#0c080a'); }
  if (hs === 'cap') { const cc = rp(o.capCol || '#3a2a2a'); S.cap(cx - 0.6, head - 2.6, cx + 2.4, head - 3, 2.6, 2, cc); for (let x = 3; x < 8; x++) S.px(cx + x, head - 2, cc[x < 5 ? 2 : 1]); }
  if (hs === 'helmet') { const ar = rp(o.armor || '#c8ccd4', 7), vz = col3(o.visor || '#ff3040'); S.cap(cx + 0.2, head - 1, cx + 1.8, head, 4.4, 4.1, ar); for (let x = 1; x < 6; x++) { S.px(cx + x, head - 0.4, mixRgb(vz, [255, 255, 255], x === 3 ? 0.5 : 0), true); S.px(cx + x, head + 0.4, mixRgb(vz, [0, 0, 0], 0.45), true); } }
  if (hs === 'bald') { S.px(cx + 1, head - 3.4, sk[5]); S.px(cx + 2, head - 3.4, sk[4]); }
  // a shine on the hair, up front
  if (['short', 'undercut', 'bob', 'long', 'bun'].includes(hs) && !o.hat) { S.px(cx + 1, head - 4.4, hair[5]); S.px(cx + 2, head - 4.2, hair[4]); S.px(cx, head - 4.2, hair[4]); }
  if (o.eye) { const ec = col3(o.eye); for (let x = 2; x < 6; x++) S.px(cx + x, head - 0.3, mixRgb(ec, [255, 255, 255], x === 3 ? 0.55 : 0.1), true); S.px(cx + 1, head - 0.3, chrome[3]); S.px(cx + 1, head + 0.6, chrome[2]); }
  // a hat over the hair: a fedora's crown, its band, a brim wide of the face
  if (o.hat === 'fedora') { const hc = rp(o.hatCol || '#3a3028', 6); S.cap(cx - 1.2, head - 3.4, cx + 2.6, head - 3.8, 3, 2, hc); for (let x = -5; x <= 7; x++) S.px(cx + x, head - 2 + (x > 4 || x < -3 ? 0.6 : 0), hc[x < 0 ? 1 : 2]); for (let x = -2; x <= 4; x++) S.px(cx + x, head - 2.9, hc[0]); }
  // a thin band round the brow, a stone of light at the front
  if (o.hat === 'circlet') { const hc = col3(o.hatCol || '#e8e8ff'); for (let x = -2; x <= 5; x++) S.px(cx + x, head - 2.2, mixRgb(hc, [80, 80, 100], x < 1 ? 0.4 : 0)); S.px(cx + 4, head - 2.4, '#3af0e0', true); }
  // goggles: over the eyes, or pushed up on the forehead if the face is taken
  if (o.goggles) { const gc = col3(o.goggles), up = o.shades || o.mask, gy = up ? head - 3.2 : head - 0.4; for (let x = -2; x < 6; x++) S.px(cx + x, gy + (up ? 0 : 0.6), '#1a1a20'); for (const lx of [2, 4]) { S.px(cx + lx, gy, gc, true); S.px(cx + lx + 1, gy, mixRgb(gc, [255, 255, 255], 0.4), true); } }
  // a visor band across the eyes, lit
  if (o.shades) { const vc = col3(o.shades); for (let x = 1; x < 6; x++) S.px(cx + x, head - 0.3, mixRgb(vc, [255, 255, 255], x === 4 ? 0.6 : 0.05), true); S.px(cx, head - 0.3, '#14141a'); }
  if (o.mask) for (let x = 1; x < 6; x++) for (let y = 1; y < 3; y++) S.px(cx + x, head + y + 0.5, rp(o.mask, 4)[y]);
  if (o.port && acc) S.px(cx - 1.5, head + 2.2, acc, true);
  // the front arm, and what it holds
  S.part(); arm(cx + 1.6, hf[0], hf[1], false);
  const [hx, hy] = hf; S.part();
  if (o.cutter) { const c = col3(o.cutterCol || '#ffb040'); S.cap(hx - 1, hy, hx + 5, hy - 0.5, 1.2, 1.1, MAT.steel); S.cap(hx + 0.5, hy + 1, hx + 0.5, hy + 2.5, 0.9, 0.8, MAT.steelD); S.px(hx + 6, hy - 0.5, c, true); S.px(hx + 7, hy - 0.5, mixRgb(c, [255, 255, 255], 0.6), true); S.px(hx + 2, hy - 1.5, c, true); }
  if (o.blade) { const c = col3(o.blade); for (let q = 0; q < 11; q++) S.px(hx + 1 + q * 0.95, hy - 1 - q * 0.45, q < 2 ? chrome[2] : mixRgb(c, [255, 255, 255], q % 4 ? 0.25 : 0.7), q >= 2); }
  if (o.bowl) { S.cap(hx - 0.5, hy - 1, hx + 3, hy - 1, 1.6, 1.4, ['#5a1a0e', '#a83a1e', '#e06a3a', '#ffa070']); S.px(hx + 1, hy - 4, '#d8d8e0'); S.px(hx + 2, hy - 6, '#b8b8c0'); S.px(hx + 1, hy - 8, '#9898a0'); }
  if (o.phone) { S.px(hx + 1, hy - 1, col3(o.phone), true); S.px(hx + 1, hy - 2, col3(o.phone), true); }
  if (o.umbrella) { const uc = rp(o.umbrella, 6); S.cap(hx, hy, hx, head - 9, 0.6, 0.6, ['#2a2a2a', '#5a5a5a', '#8a8a8a']); S.cap(hx - 9, head - 9, hx + 9, head - 9, 2.4, 2.4, uc, { mask: (x, y) => y <= head - 9 }); for (let x = -10; x <= 10; x++) S.px(hx + x, head - 8.6, o.umbrellaGlow ? col3(o.umbrellaGlow) : uc[0], !!o.umbrellaGlow && x % 2 === 0); }
  const out = S.done(); out.actor = true; return out;
}
// The same person from behind, as they climb a ladder: legs side by side,
// one foot a rung up; the back of the coat with its seam (and a long coat's
// vent); both arms reaching up to the rungs, the other way round from the
// feet; and the back of the head, which is mostly hair (or a hood, a cap, a
// hat). climb0 and climb1 are the two halves of a climb; anything else
// stands with the arms down.
function personBack(o = {}) {
  const S = Spr.figure(44, 52, (o.seed || 1) + 7); S.ax = 20; S.ay = 51;
  const F = 51, u = o.tall || 1, Y = (h) => F - h * u, cx = 20, wd = o.wide || 0, pose = o.pose || 'stand';
  const sk = rp(o.skin || SKINS[0], 6), top = rp(o.top || '#3a3a48', 7), legs = rp(o.legs || '#2a2a34', 6), boots = rp(o.boots || '#18161c', 5);
  const hair = rp(o.hairCol || '#1a1414', 6), chrome = MAT.chrome, acc = o.acc ? col3(o.acc) : null, dark = (r) => r.map((c) => mixRgb(c, [8, 6, 12], 0.3));
  const climb = /^climb/.test(pose), side = pose === 'climb1' ? 1 : -1; // (the side whose foot is up a rung; its hand is down)
  // sitting (on a stool at a counter, in a cinema seat): the body a little
  // lower, the hips on the seat, the thighs out of sight in front and the
  // calves hanging down either side of the seat to the heels
  const sit = pose === 'sit', dn = sit ? 3 * u : 0;
  const head = Y(29.5) + dn, sh = Y(24) + dn, waist = Y(16) + dn, hip = Y(14) + dn, knee = Y(7.2), ank = Y(1.6);
  // the legs, from the hips to the heels
  if (!sit) for (const sd of [-1, 1]) {
    const up = climb && sd === side ? 3.5 : 0, R = o.cyLegs ? chrome : legs, hx = cx + sd * 1.9, kx = cx + sd * 2.1, ky = knee - up * 0.8, ax = cx + sd * 2, ay = ank - up;
    S.cap(hx, hip, kx, ky, 2.3 + wd * 0.3, 1.9, sd < 0 ? R : dark(R)); S.cap(kx, ky, ax, ay, 1.8, 1.4, sd < 0 ? R : dark(R));
    S.part(); S.cap(ax - 1, ay + 0.3, ax + 1, ay + 0.3, 1.6, 1.3, boots);
    if (o.cyLegs && acc) S.px(kx, ky, acc, true);
  }
  if (sit) for (const sd of [-1, 1]) { // (the heels up on the stool's footrest, its post and foot showing under them)
    const R = o.cyLegs ? chrome : legs, ax = cx + sd * 2.4, ay = F - 4.6;
    S.cap(cx + sd * 2.2, hip + 1.5, ax, ay - 1, 1.7, 1.4, dark(R)); S.part(); S.cap(ax - 0.6, ay, ax + 0.6, ay, 1.4, 1.2, dark(boots));
  }
  S.part();
  // the arms: up to the rungs when climbing, else hanging
  const w0 = 4.4 + wd, arm = (sd) => {
    const cyb = o.cyArm === 'both' || (o.cyArm && sd > 0), R = cyb ? chrome : top, shx = cx + sd * (w0 - 1), hx = climb ? cx + sd * 5.6 : cx + sd * (w0 + 0.6), hy = climb ? (sd === side ? sh + 0.5 : head - 5.5) : hip + 0.5;
    const ex = climb ? shx + sd * 2.6 : shx + sd * 0.8, ey = climb ? (sh + 1 + hy) / 2 + 1 : (sh + hy) / 2;
    S.cap(shx, sh + 1, ex, ey, 1.9 + wd * 0.2, 1.6, R); S.cap(ex, ey, hx, hy, 1.6, 1.3, R);
    S.part(); S.cap(hx, hy, hx, hy - 0.4, 1.3, 1.2, cyb ? chrome : sk);
    if (cyb && acc) S.px(ex, ey, acc, true);
  };
  // the body: the back of a coat or a jacket, its seam, a collar, a belt
  const hem = o.coat === 'long' ? (sit ? hip + 3.5 : Y(5.5)) : hip + 0.8;
  S.shape([[cx - w0 + 0.4, sh - 0.6], [cx + w0 - 0.4, sh - 0.6], [cx + w0 + 0.4, sh + 2], [cx + w0 - 0.4, waist], [cx + w0 + (o.coat === 'long' ? 1.2 : 0), hem], [cx - w0 - (o.coat === 'long' ? 1.2 : 0), hem], [cx - w0 + 0.4, waist], [cx - w0 - 0.4, sh + 2]], top, { down: 0.3, folds: o.coat === 'long' });
  for (let y = Math.round(sh + 1); y < Math.round(o.coat === 'long' ? hem : hip); y++) if (S.get(cx, y)) S.px(cx, y, top[1]);
  if (o.coat === 'long') for (let y = Math.round(hip + 3); y < Math.round(hem); y++) S.px(cx, y, top[0]);
  if (o.coat !== 'long') for (let x = Math.round(cx - w0); x <= Math.round(cx + w0); x++) if (S.get(x, Math.round(hip))) S.px(x, hip, rp(o.belt || '#141216')[1]);
  if (acc && o.trim !== false) for (let y = Math.round(sh + 1); y < Math.round(hem); y += 2) { S.px(cx - w0 + 0.6, y, acc, true); S.px(cx + w0 - 0.6, y, acc, true); }
  if (o.armor) S.cap(cx - 3, sh + 2.5, cx + 3, sh + 2.5, 3.4, 3.4, rp(o.armor, 7));
  if (o.pack) { const pk = rp(o.pack, 6); S.box(cx - 3.5, sh + 1, cx + 3.5, waist + 1, pk, { lo: 1, hi: 4 }); S.px(cx, sh + 4, pk[0]); if (acc) S.px(cx + 2, sh + 3, acc, true); }
  S.part(); arm(-1); S.part(); arm(1);
  // the collar and the head: the nape, the ears, and over them the hair
  S.part();
  if (o.collar) S.cap(cx - 3, sh - 1, cx + 3, sh - 1, 2, 1.6, top);
  S.cap(cx, sh, cx, head + 3, 1.5, 1.4, sk);
  S.cap(cx, head - 0.6, cx, head + 0.8, 3.7, 3.3, sk);
  S.px(cx - 3.8, head + 0.4, sk[2]); S.px(cx + 3.8, head + 0.4, sk[1]);
  S.part(false); const hs = o.hair || 'short';
  if (hs === 'short' || hs === 'undercut') { S.cap(cx, head - 1.6, cx, head + 0.2, 3.6, 3.2, hair); if (hs === 'undercut') for (let x = -2; x <= 2; x++) S.px(cx + x, head + 2, sk[1]); }
  if (hs === 'bob') { S.cap(cx, head - 1.4, cx, head + 2.2, 4, 3.6, hair); for (let x = -3; x <= 3; x++) S.px(cx + x, head + 3.6, hair[1]); }
  if (hs === 'long') { S.cap(cx, head - 1.4, cx, head + 1.5, 4, 3.6, hair); S.shape([[cx - 3.6, head + 1], [cx + 3.6, head + 1], [cx + 3, sh + 6], [cx - 3, sh + 6]], hair, { down: 0.2 }); }
  if (hs === 'bun') { S.cap(cx, head - 1.6, cx, head + 0.4, 3.8, 3.4, hair); S.cap(cx, head - 4.6, cx, head - 4.6, 2, 2, hair); S.px(cx - 1, head - 6.6, '#d83a3a'); }
  if (hs === 'mohawk') { for (let y = 0; y < 8; y++) { const hy = head - 4 + y * 0.9; for (let x = -1; x <= 1; x++) S.px(cx + x, hy - (y < 2 ? 2 : 0), mixRgb(hair[4], [255, 255, 255], y < 1 ? 0.45 : 0), !!o.hairGlow && y < 1); } }
  if (hs === 'hood') S.cap(cx, head - 0.6, cx, head + 1.6, 4.6, 4.4, top);
  if (hs === 'cap') { const cc = rp(o.capCol || '#3a2a2a'); S.cap(cx, head - 2.6, cx, head - 2, 3.8, 2.4, cc); S.px(cx, head - 0.6, cc[0]); S.cap(cx, head + 0.6, cx, head + 1.4, 3, 2, hair); }
  if (hs === 'helmet') S.cap(cx, head - 0.6, cx, head + 0.6, 4.4, 4.2, rp(o.armor || '#c8ccd4', 7));
  if (hs === 'bald') { S.px(cx - 1, head - 3.2, sk[5]); S.px(cx, head - 3.4, sk[4]); }
  if (o.hat === 'fedora') { const hc = rp(o.hatCol || '#3a3028', 6); S.cap(cx, head - 3.6, cx, head - 3.4, 3.2, 2, hc); for (let x = -6; x <= 6; x++) S.px(cx + x, head - 2 + (Math.abs(x) > 4 ? 0.6 : 0), hc[1]); }
  if (o.goggles) { for (let x = -4; x <= 4; x++) S.px(cx + x, head - 0.4, '#1a1a20'); }
  if (o.port && acc) S.px(cx, head + 2.4, acc, true);
  const out = S.done(); out.actor = true; return out;
}
// The same person facing us: sitting on a bench (the body down by a thigh's
// length, the thighs coming toward us and the shins hanging, knees a little
// apart, hands on the knees or round a cup or a bowl), or standing. The
// coat's front with its opening and buttons, a shirt in the V, both arms; the
// face (two eyes, brows, a nose, a mouth) with the hair round it: what falls
// behind the head (long hair, a bob, a hood, a bun) drawn first, the fringe
// and what's worn on top after.
function personFront(o = {}) {
  const S = Spr.figure(44, 52, (o.seed || 1) + 13); S.ax = 20; S.ay = 51;
  const F = 51, u = o.tall || 1, Y = (h) => F - h * u, cx = 20, wd = o.wide || 0, pose = o.pose || 'stand';
  const sk = rp(o.skin || SKINS[0], 6), top = rp(o.top || '#3a3a48', 7), legs = rp(o.legs || '#2a2a34', 6), boots = rp(o.boots || '#18161c', 5);
  const hair = rp(o.hairCol || '#1a1414', 6), chrome = MAT.chrome, acc = o.acc ? col3(o.acc) : null, dark = (r) => r.map((c) => mixRgb(c, [8, 6, 12], 0.3));
  const sit = pose === 'sit', dn = sit ? 5 * u : 0, bob = pose === 'breathe' ? -0.75 : 0; // (sitting, the hips on a bench's seat, 9 px up)
  const head = Y(29.5) + dn + bob, sh = Y(24) + dn + bob, waist = Y(16) + dn + bob, hip = Y(14) + dn, ank = Y(1.6);
  const w0 = 4.4 + wd, hs = o.hair || 'short', long = o.coat === 'long', open = long || o.coat === 'jacket';
  // behind it all: long hair down the back, a bob, a hood, a bun over the crown
  if (hs === 'long') S.shape([[cx - 4.2, head - 1], [cx + 4.2, head - 1], [cx + 4.6, sh + 5], [cx - 4.6, sh + 5]], hair, { down: 0.2 });
  if (hs === 'bob') S.cap(cx, head - 0.6, cx, head + 2, 4.4, 4.2, hair);
  if (hs === 'hood') S.cap(cx, head - 0.4, cx, head + 1.8, 5, 4.8, top);
  if (hs === 'bun') { S.cap(cx, head - 5, cx, head - 5, 2.2, 2.2, hair); S.px(cx + 1.6, head - 6.4, '#d83a3a'); S.px(cx + 2.2, head - 6.8, '#d83a3a'); }
  if (o.pack) { const pk = rp(o.pack, 6); S.box(cx - w0 - 1.2, sh + 1, cx - w0 + 0.6, waist, pk, { lo: 1, hi: 4 }); S.box(cx + w0 - 0.6, sh + 1, cx + w0 + 1.2, waist, pk, { lo: 1, hi: 4 }); }
  S.part();
  // the legs: standing, side by side; sitting, the shins hanging from the
  // knees to boots that point at us (the thighs come over the hem, below)
  const LR = o.cyLegs ? chrome : legs, kneeY = hip + 2.2;
  for (const sd of [-1, 1]) {
    const Rl = sd < 0 ? LR : dark(LR), ax = cx + sd * (sit ? 3 : 2), ay = ank;
    if (sit) S.cap(cx + sd * 2.9, kneeY, ax, ay, 1.8, 1.5, dark(Rl));
    else { S.cap(cx + sd * 1.9, hip, cx + sd * 2.1, Y(7.2), 2.3 + wd * 0.3, 1.9, Rl); S.cap(cx + sd * 2.1, Y(7.2), ax, ay, 1.8, 1.5, Rl); }
    if (o.cyLegs && acc && !sit) S.px(cx + sd * 2.1, Y(7.2), acc, true);
    S.part(); S.cap(ax - 0.4, ay + 0.2, ax + 0.4, ay + 0.2, 1.8, 1.5, sd < 0 ? boots : dark(boots)); S.px(ax, ay - 0.4, boots[3]);
  }
  S.part();
  // the body: a coat or jacket's front, the shirt in its V, a belt; a long
  // coat falls open over the legs (over the lap, sitting)
  const hem = long ? (sit ? hip + 3 : Y(5.5)) : hip + 0.8;
  S.shape([[cx - w0 + 0.4, sh - 0.6], [cx + w0 - 0.4, sh - 0.6], [cx + w0 + 0.4, sh + 2], [cx + w0 - 0.4, waist], [cx + w0 + (long ? 1 : 0), hem], [cx - w0 - (long ? 1 : 0), hem], [cx - w0 + 0.4, waist], [cx - w0 - 0.4, sh + 2]], top, { down: 0.3, folds: long });
  const inner = o.shirt ? rp(o.shirt, 5) : dark(top);
  if (open) {
    for (let y = Math.round(sh); y < Math.round(sh + 4); y++) { const k = (y - sh) * 0.45; for (let x = Math.round(cx - 1.4 + k); x <= Math.round(cx + 1.4 - k); x++) if (S.get(x, y)) S.px(x, y, inner[2]); }
    for (let y = Math.round(sh + 4); y < Math.round(hem); y++) if (S.get(cx, y)) S.px(cx, y, top[0]);
    if (long) for (let y = Math.round(hip + 1); y < Math.round(hem); y++) { S.px(cx - 0.5, y, top[0]); S.px(cx + 0.5, y, legs[1]); }
    for (let y = Math.round(sh + 5); y < Math.round(hip); y += 3) S.px(cx + 1, y, top[5]);
  } else if (!o.vest && !o.apron && !o.armor) for (let y = Math.round(sh + 1); y < Math.round(sh + 4); y++) S.px(cx, y, top[1]);
  if (o.vest) { const vr = rp(o.vest, 6); S.shape([[cx - 2.6, sh + 1.5], [cx + 2.6, sh + 1.5], [cx + 2.4, waist + 0.5], [cx - 2.4, waist + 0.5]], vr, { down: 0.2 }); }
  if (o.apron) S.shape([[cx - 3.2, sh + 3], [cx + 3.2, sh + 3], [cx + 3.6, sit ? hip + 2.6 : Y(5)], [cx - 3.6, sit ? hip + 2.6 : Y(5)]], rp(o.apron, 6), { down: 0.25 });
  if (o.armor) S.cap(cx - 2.4, sh + 2.5, cx + 2.4, sh + 2.5, 3.4, 3.4, rp(o.armor, 7));
  if (o.pack) for (const sd of [-1, 1]) for (let y = Math.round(sh); y < Math.round(waist); y++) S.px(cx + sd * (w0 - 1.6), y, rp('#5a4a3a', 5)[1]);
  if (!long || !open) for (let x = Math.round(cx - w0); x <= Math.round(cx + w0); x++) if (S.get(x, Math.round(hip))) S.px(x, hip, rp(o.belt || '#141216')[1]);
  if (!o.apron && S.get(cx, Math.round(hip))) S.px(cx, hip, '#b8a070');
  if (acc && o.trim !== false) for (let y = Math.round(sh + 1); y < Math.round(hem); y += 2) { S.px(cx - w0 + 0.6, y, acc, true); S.px(cx + w0 - 0.6, y, acc, true); }
  if (o.collar) for (const sd of [-1, 1]) S.cap(cx + sd * 2, sh - 0.8, cx + sd * 1, sh + 1.2, 1.4, 1, top, { bias: 0.12 });
  S.part();
  // sitting: the lap, each thigh coming toward us over the hem (a long coat
  // over it, open between), lit along the top, the knee at the end
  if (sit) {
    for (const sd of [-1, 1]) {
      const R = long ? top : LR, x0 = cx + sd * 0.6, x1 = cx + sd * 4.4;
      S.cap(cx + sd * 2.2, hip + 0.4, cx + sd * 2.6, kneeY - 0.4, 2.3 + wd * 0.3, 2.1, sd < 0 ? R : dark(R));
      for (let x = Math.round(Math.min(x0, x1)); x <= Math.round(Math.max(x0, x1)); x++) if (S.get(x, Math.round(hip - 1.2))) S.px(x, hip - 1.2, R[5]);
      if (o.cyLegs && acc) S.px(cx + sd * 2.6, kneeY, acc, true);
    }
    if (long) for (let y = Math.round(hip - 1); y <= Math.round(kneeY + 1); y++) S.px(cx, y, LR[1]);
    S.part();
  }
  // the arms: sitting, the hands on the knees, or round a cup or a bowl held
  // at the chest; standing, hanging
  const held = o.bowl || o.cup || o.phone, arm = (sd) => {
    const cyb = o.cyArm === 'both' || (o.cyArm && sd > 0), R = cyb ? chrome : sd < 0 ? top : dark(top), shx = cx + sd * (w0 - 0.6);
    const hx = held ? cx + sd * 1.6 : sit ? cx + sd * 3 : cx + sd * (w0 + 0.6), hy = held ? waist - 1.5 : sit ? hip - 0.6 : hip + 0.5;
    const ex = cx + sd * (w0 + (held ? 0.8 : 0.9)), ey = held ? waist + 0.5 : (sh + hy) / 2 + 0.5;
    S.cap(shx, sh + 1, ex, ey, 1.9 + wd * 0.2, 1.6, R); S.cap(ex, ey, hx, hy, 1.6, 1.3, R);
    S.part(); S.cap(hx, hy, hx, hy + 0.3, 1.3, 1.2, cyb ? chrome : sk);
    if (cyb && acc) S.px(ex, ey, acc, true);
  };
  arm(-1); S.part(); arm(1); S.part();
  if (o.bowl) { S.cap(cx - 2.4, waist - 2, cx + 2.4, waist - 2, 1.6, 1.4, ['#5a1a0e', '#a83a1e', '#e06a3a', '#ffa070']); S.px(cx - 0.5, waist - 5, '#d8d8e0'); S.px(cx + 0.5, waist - 7, '#b8b8c0'); }
  else if (o.cup) { const cc = rp(o.cup === true ? '#e8e0d0' : o.cup, 4); S.box(cx - 1, waist - 4, cx + 1, waist - 1.5, cc, { lo: 1, hi: 3 }); S.px(cx, waist - 6, '#b8b8c0'); }
  else if (o.phone) { S.px(cx, waist - 2, col3(o.phone), true); S.px(cx + 1, waist - 2, col3(o.phone), true); }
  S.part();
  // the head: the neck, the skull, the ears, and the face
  S.cap(cx, sh, cx, head + 3, 1.5, 1.4, sk);
  S.cap(cx, head - 0.6, cx, head + 0.8, 3.7, 3.3, sk);
  // the face itself flat, lit from in front: only its edges shade
  for (let y = Math.round(head - 1.6); y <= Math.round(head + 2.4); y++) for (let x = Math.round(cx - 2.4); x <= Math.round(cx + 2.4); x++) if (S.get(x, y)) S.px(x, y, sk[3]);
  S.px(cx - 3.8, head + 0.6, sk[2]); S.px(cx + 3.8, head + 0.6, sk[1]);
  const eyeY = head + 0.2;
  if (!o.shades && hs !== 'helmet') { S.px(cx - 1.6, eyeY, '#0c080a'); S.px(cx + 1.6, eyeY, '#0c080a'); S.px(cx - 1.6, eyeY - 1.2, hair[1]); S.px(cx + 1.6, eyeY - 1.2, hair[1]); }
  S.px(cx, head + 1.4, sk[1]); S.px(cx, head + 2.6, mixRgb(sk[1], [120, 40, 40], 0.25));
  if (o.eye) { S.px(cx + 1.6, eyeY, col3(o.eye), true); S.px(cx + 2.6, eyeY, chrome[2]); }
  if (o.mask) for (let x = -2; x <= 2; x++) for (let y = 1; y < 3; y++) S.px(cx + x, head + y + 0.6, rp(o.mask, 4)[y]);
  if (o.port && acc) S.px(cx + 3.6, head + 1.8, acc, true);
  // the hair over the brow, and what's worn on the head
  S.part(false);
  const crown = (r = 3.9) => S.cap(cx, head - 2.4, cx, head - 2.2, r, 2.6, hair, { mask: (x, y) => y <= head - 1.3 });
  if (hs === 'short' || hs === 'undercut') { crown(); if (hs === 'short') { S.px(cx - 3.6, head - 0.6, hair[1]); S.px(cx + 3.6, head - 0.6, hair[2]); } }
  if (hs === 'bob' || hs === 'long' || hs === 'bun') { crown(4.1); for (let x = -3; x <= 1; x++) S.px(cx + x, head - 1.3, hair[x < 0 ? 2 : 3]); }
  if (hs === 'mohawk') for (let y = 0; y < 7; y++) for (let x = -1; x <= 1; x++) S.px(cx + x, head - 3 - y, mixRgb(hair[4], [255, 255, 255], y > 5 ? 0.45 : 0), !!o.hairGlow && y > 5);
  if (hs === 'hood') S.cap(cx, head - 2.6, cx, head - 2.2, 4.4, 2.4, top, { mask: (x, y) => y <= head - 1.4 });
  if (hs === 'cap') { const cc = rp(o.capCol || '#3a2a2a'); S.cap(cx, head - 2.6, cx, head - 2.4, 3.9, 2.4, cc, { mask: (x, y) => y <= head - 1.6 }); for (let x = -4; x <= 4; x++) S.px(cx + x, head - 1.4, cc[Math.abs(x) > 3 ? 0 : 1]); }
  if (hs === 'helmet') { const ar = rp(o.armor || '#c8ccd4', 7), vz = col3(o.visor || '#ff3040'); S.cap(cx, head - 1, cx, head, 4.4, 4.1, ar); for (let x = -3; x <= 3; x++) { S.px(cx + x, head - 0.2, mixRgb(vz, [255, 255, 255], x === 0 ? 0.5 : 0), true); S.px(cx + x, head + 0.6, mixRgb(vz, [0, 0, 0], 0.45), true); } }
  if (hs === 'bald') { S.px(cx - 1, head - 3.2, sk[5]); S.px(cx, head - 3.4, sk[4]); }
  if (['short', 'undercut', 'bob', 'long', 'bun'].includes(hs) && !o.hat) { S.px(cx - 1, head - 4.2, hair[5]); S.px(cx, head - 4.4, hair[4]); }
  if (o.hat === 'fedora') { const hc = rp(o.hatCol || '#3a3028', 6); S.cap(cx, head - 3.6, cx, head - 3.2, 3.2, 2, hc); for (let x = -6; x <= 6; x++) S.px(cx + x, head - 2 + (Math.abs(x) > 4 ? 0.6 : 0), hc[Math.abs(x) > 4 ? 1 : 2]); for (let x = -3; x <= 3; x++) S.px(cx + x, head - 2.9, hc[0]); }
  if (o.hat === 'circlet') { const hc = col3(o.hatCol || '#e8e8ff'); for (let x = -3; x <= 3; x++) S.px(cx + x, head - 2.2, hc); S.px(cx, head - 2.4, '#3af0e0', true); }
  if (o.goggles) { const gc = col3(o.goggles), up = o.shades || o.mask, gy = up ? head - 3 : eyeY; for (let x = -4; x <= 4; x++) S.px(cx + x, gy, '#1a1a20'); for (const gx of [-1.6, 1.6]) S.px(cx + gx, gy, gc, true); }
  if (o.shades) { const vc = col3(o.shades); for (let x = -3; x <= 3; x++) S.px(cx + x, eyeY, mixRgb(vc, [255, 255, 255], x === 1 ? 0.6 : 0.05), true); }
  const out = S.done(); out.actor = true; return out;
}
