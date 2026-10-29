'use strict';
// ---------------------------------------------------------------------------
// Sound, made in code with Web Audio: nothing is loaded. The engine is
// Tycho's (Tycho.audio: vendor/tycho/docs/audio.md); this file is the
// White Dragon's own: the mix's chain and its space, the waves, the settings,
// and the effects' recipes. The music and each place's own sound are in
// music.js, which also listens to the game every frame for what it doesn't
// call itself (footsteps, the cutter, the bench's tools in hand, talk).
//
// snd(name, opts) plays a named cue (SND_CUES). A name it doesn't know does
// nothing, and nothing plays or throws before the first tap, when the
// browser lets a page make sound. Cues with opts.x, opts.y (world px) are
// quieter further from the runner and panned toward where they are. Each
// cue has a least gap between plays, and only T.sound.voices play at once
// (the important ones always play). Sound never touches the game: it only
// reads it, and its variation comes from its own generator (SND_RAND, shared
// with the music), never the game's.
//
// The settings (music and sound: on, soft or off) are kept apart from the
// save (localStorage whitedragon.sound), so a new game keeps them; they're
// set on the pause menu. The page hidden, the sound sleeps.
// ---------------------------------------------------------------------------

const SND_RAND = new Tycho.audio.Rand(0x5eed1e55);
function sndRand() { return SND_RAND.next(); }
function sndRange(a, b) { return a + (b - a) * sndRand(); }
function sndPick(list) { return list[Math.floor(sndRand() * list.length)]; }
// A pitch, in semitones from A3 (the city's key is A minor).
const SND_ROOT = 220;
function sndHz(semi) { return Tycho.audio.hz(semi, SND_ROOT); }
function sndClamp(v, a, b) { return v < a ? a : v > b ? b : v; }

// Tones with a few soft harmonics, so a low note still sounds on a phone
// without being harsh: warm (a soft saw), hollow (mostly odd: a clarinet's),
// glass (a pad's, bright and thin) and reed (a buzz with a hump in it).
const SND_WAVE_AMPS = {
  warm: [12, (k) => 1 / Math.pow(k, 1.45)],
  hollow: [11, (k) => (k % 2 ? 1 / Math.pow(k, 1.1) : 0.12 / k)],
  glass: [10, (k) => (k === 1 ? 1 : k === 2 ? 0.5 : k === 4 ? 0.3 : 0.1 / k)],
  reed: [10, (k) => (k === 3 || k === 4 ? 0.7 : 1) / k],
};

// ---------------------------------------------------------------------------
// The voices a cue is made of (Tycho's). Each starts at t, rises over `a`,
// holds for `hold`, then dies away with time constant `d`. g: its level
// within the cue; send: how much goes to the space. A tone: f (gliding to f2
// over glide), w a wave, lp a low pass, vib [rate, Hz]. Noise: ft the
// filter's type (bandpass unless said), f (sweeping to f2), q. FM: ratio, the
// index i0 falling to i1 with time constant id.
// ---------------------------------------------------------------------------
const sndTone = Tycho.audio.tone, sndNoise = Tycho.audio.noise, sndFm = Tycho.audio.fm;
// A struck bell or glass: a few partials, the higher dying sooner.
function sndBell(S, o, t, f, g, d, send) {
  for (const [k, gk, dk] of [[1, 1, 1], [2.76, 0.28, 0.45], [5.4, 0.08, 0.22]]) {
    if (f * k > 8000) break;
    sndTone(S, o, t, { f: f * k, a: 0.002, g: g * gk, d: d * dk, send });
  }
}
// Little clicks of sparks, fire or static: n over `spread` s.
function sndCrackle(S, o, t, n, spread, g, f) {
  for (let i = 0; i < n; i++) sndNoise(S, o, t + sndRand() * spread, { f: f * sndRange(0.7, 1.3), q: 3, a: 0.001, d: 0.006, g: g * sndRange(0.4, 1) });
}
// Struck metal: a clank, a rung, a panel (f, how bright i, how long d).
function sndMetal(S, o, t, f, g, d, i = 2.5, send = 0.15) {
  sndFm(S, o, t, { f, ratio: 1.41, i0: i, i1: 0, id: d * 0.4, a: 0.001, d, g, send });
  sndFm(S, o, t, { f: f * 2.13, ratio: 2.76, i0: i * 0.6, i1: 0, id: d * 0.2, a: 0.001, d: d * 0.5, g: g * 0.35 });
}
// A soft thump: something set down, a knock, a landing.
function sndThump(S, o, t, f, g, d = 0.05) {
  sndTone(S, o, t, { f, f2: f * 0.6, glide: d, w: 'warm', lp: 500, a: 0.002, d, g });
  sndNoise(S, o, t, { ft: 'lowpass', f: f * 4, a: 0.001, d: d * 0.6, g: g * 0.8 });
}
// A footstep on concrete, metal grating, wood, or wet ground; k how hard.
function sndStep(S, o, t, ground, k) {
  if (ground === 'metal') {
    sndFm(S, o, t, { f: sndRange(300, 380), ratio: 2.71, i0: 1.2, i1: 0, id: 0.02, a: 0.001, d: 0.045, g: 0.3 * k, send: 0.1 });
    sndNoise(S, o, t, { ft: 'lowpass', f: 900, a: 0.001, d: 0.03, g: 0.7 * k });
  } else if (ground === 'wood') {
    sndTone(S, o, t, { f: sndRange(150, 190), f2: 110, glide: 0.04, w: 'warm', lp: 700, a: 0.002, d: 0.04, g: 0.7 * k });
    sndNoise(S, o, t, { f: 1000, q: 1.2, a: 0.001, d: 0.02, g: 0.4 * k });
  } else {
    sndNoise(S, o, t, { ft: 'lowpass', f: sndRange(500, 700), a: 0.002, d: 0.035, g: 0.9 * k });
    sndNoise(S, o, t, { f: sndRange(2500, 3500), q: 1.5, a: 0.001, d: 0.012, g: 0.25 * k });
  }
  if (ground === 'wet') sndNoise(S, o, t + 0.01, { f: sndRange(1500, 2200), q: 0.9, a: 0.003, d: 0.05, g: 0.5 * k });
}
// A short chirp of a voice: a talking pace's letters, a word over a head.
function sndSyllable(S, o, t, f, g) {
  sndTone(S, o, t, { f, f2: f * sndRange(0.9, 1.12), glide: 0.05, w: 'hollow', lp: 1500, a: 0.008, d: 0.03, hold: 0.02, g });
  sndNoise(S, o, t, { f: f * 3, q: 4, a: 0.005, d: 0.02, g: g * 0.3 });
}
// A name's own pitch, the same every time (a person's voice).
function sndVoiceOf(name) { let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 180 + (h % 160); }

// What a door's made of: its own look, or (a way in from the street) the
// look of the way back out, on the room's back wall.
function sndDoorLook(p) {
  if (p.look) return p.look;
  const B = p.to && LEVELS[p.to[0]] && LEVELS[p.to[0]].built, d = B && B.props.find((q) => q.kind === 'door' && q.out);
  return d ? d.look : '';
}

// ---------------------------------------------------------------------------
// The cues. g: the cue's level; gap: the least time between two (else
// T.sound.gap); pri: always plays, however many are sounding.
// fn(S, out, t, opts).
// ---------------------------------------------------------------------------
const SND_CUES = {
  // ---- the menus: barely there
  tap: { g: 0.05, gap: 0.04, fn(S, o, t) { sndTone(S, o, t, { f: 1400, a: 0.002, d: 0.016 }); sndNoise(S, o, t, { f: 3200, q: 2, a: 0.001, d: 0.005, g: 0.4 }); } },
  open: { g: 0.07, gap: 0.12, fn(S, o, t) { sndTone(S, o, t, { f: 660, f2: 990, glide: 0.05, w: 'triangle', a: 0.004, d: 0.05, g: 0.8 }); sndNoise(S, o, t, { f: 2000, q: 0.8, a: 0.02, d: 0.05, g: 0.25 }); } },
  close: { g: 0.06, gap: 0.12, fn(S, o, t) { sndTone(S, o, t, { f: 880, f2: 600, glide: 0.05, w: 'triangle', a: 0.004, d: 0.045, g: 0.8 }); } },
  // something you can't do yet
  nope: { g: 0.08, gap: 0.3, fn(S, o, t) { for (const dt of [0, 0.09]) sndTone(S, o, t + dt, { f: 150, w: 'square', lp: 700, a: 0.003, d: 0.035, hold: 0.03, g: 0.6 }); } },

  // ---- the runner (music.js plays these from the runner's moves)
  // ground: concrete, metal, wood, wet; k how hard (a walk's softer than a sprint)
  step: { g: 0.22, gap: 0.07, fn(S, o, t, a) { sndStep(S, o, t, a.ground, a.k || 0.7); } },
  jump: { g: 0.14, gap: 0.15, fn(S, o, t) { sndNoise(S, o, t, { f: 700, f2: 1800, glide: 0.08, q: 0.8, a: 0.015, d: 0.05, g: 0.6 }); sndNoise(S, o, t, { ft: 'lowpass', f: 600, a: 0.001, d: 0.02, g: 0.5 }); } },
  // k: how hard, by how fast the fall
  land: { g: 0.16, gap: 0.12, fn(S, o, t, a) { const k = a.k || 0.5; sndThump(S, o, t, 120 - k * 40, 0.7 * k + 0.3, 0.05 + k * 0.04); sndStep(S, o, t + 0.005, a.ground, k); } },
  rung: { g: 0.14, gap: 0.1, fn(S, o, t) { sndMetal(S, o, t, sndRange(480, 560), 0.4, 0.05, 1.4, 0.05); } },

  // ---- machines
  // the cutter breaks a machine open: a clatter of panels and bits, and a pop
  strip: { g: 0.24, gap: 0.3, pri: true, fn(S, o, t) {
    sndNoise(S, o, t, { ft: 'lowpass', f: 3000, f2: 400, glide: 0.2, a: 0.002, d: 0.08, g: 0.7 });
    for (let i = 0; i < 5; i++) sndMetal(S, o, t + 0.04 + i * sndRange(0.04, 0.08), sndRange(500, 1400), sndRange(0.15, 0.35), 0.06, 2, 0.1);
    sndCrackle(S, o, t, 8, 0.15, 0.5, 3200);
    sndThump(S, o, t + 0.28, 140, 0.5, 0.05);
  } },
  // the cabinet jimmied: a pry bar's squeal, then the lock gives
  jimmy: { g: 0.22, gap: 0.5, pri: true, fn(S, o, t) {
    sndTone(S, o, t, { f: 900, f2: 1300, glide: 0.18, w: 'reed', lp: 2500, vib: [30, 20], a: 0.02, hold: 0.1, d: 0.05, g: 0.3 });
    sndMetal(S, o, t + 0.22, 330, 0.8, 0.18, 3, 0.25);
  } },
  // what came out of it: coins (n), or parts
  coins: { g: 0.12, gap: 0.08, fn(S, o, t, a) { const n = sndClamp(a.n || 3, 1, 5); for (let i = 0; i < n; i++) sndBell(S, o, t + i * sndRange(0.04, 0.06), sndRange(2300, 3300), 0.4, 0.06, 0.1); } },
  part: { g: 0.12, gap: 0.08, fn(S, o, t) { sndMetal(S, o, t, sndRange(1600, 2000), 0.5, 0.09, 1.2, 0.15); } },
  // money changes hands: a till's ring, or a few coins handed over
  cash: { g: 0.14, gap: 0.3, fn(S, o, t) { sndNoise(S, o, t, { f: 2600, q: 3, a: 0.001, d: 0.01, g: 0.6 }); sndBell(S, o, t + 0.03, 2637, 0.5, 0.18, 0.2); sndBell(S, o, t + 0.1, 3520, 0.45, 0.3, 0.25); } },
  spend: { g: 0.09, gap: 0.2, fn(S, o, t) { sndBell(S, o, t, 1980, 0.5, 0.08, 0.1); sndBell(S, o, t + 0.06, 1760, 0.4, 0.1, 0.1); } },

  // ---- ways in and out
  // look: the door's (noren cloth, glass that slides, steel), a wooden one by default
  door: { g: 0.16, gap: 0.4, fn(S, o, t, a) {
    if (a.look === 'noren') { sndNoise(S, o, t, { f: 1500, f2: 900, glide: 0.2, q: 0.7, a: 0.04, d: 0.12, g: 0.6 }); sndBell(S, o, t + 0.05, 2794, 0.25, 0.4, 0.3); sndBell(S, o, t + 0.12, 3520, 0.18, 0.35, 0.3); }
    else if (a.look === 'glass') { sndNoise(S, o, t, { f: 2600, f2: 1800, glide: 0.25, q: 1.2, a: 0.03, d: 0.1, hold: 0.1, g: 0.5 }); sndNoise(S, o, t + 0.3, { f: 3500, q: 3, a: 0.001, d: 0.012, g: 0.6 }); }
    else if (a.look === 'steel') { sndThump(S, o, t, 90, 0.9, 0.08); sndMetal(S, o, t + 0.01, 180, 0.5, 0.25, 2.5, 0.3); sndNoise(S, o, t + 0.25, { f: 2500, q: 3, a: 0.001, d: 0.015, g: 0.5 }); }
    else { sndTone(S, o, t, { f: 220, f2: 300, glide: 0.25, w: 'reed', lp: 900, vib: [11, 4], a: 0.05, d: 0.08, g: 0.25 }); sndThump(S, o, t + 0.3, 110, 0.7, 0.06); }
  } },
  trapdoor: { g: 0.18, gap: 0.5, fn(S, o, t) { sndTone(S, o, t, { f: 180, f2: 240, glide: 0.35, w: 'reed', lp: 800, vib: [9, 4], a: 0.08, d: 0.1, g: 0.35 }); sndThump(S, o, t + 0.38, 90, 0.9, 0.08); sndNoise(S, o, t + 0.4, { f: 600, q: 0.6, a: 0.01, d: 0.2, g: 0.15 }); } },
  // a knock at a home's door
  knock: { g: 0.16, gap: 0.6, fn(S, o, t) { for (const dt of [0, 0.17, 0.32]) sndThump(S, o, t + dt, 170, 0.9, 0.035); } },
  // a cab hailed: a beep back, and it lifts off; it sets down
  liftoff: { g: 0.22, gap: 2, pri: true, fn(S, o, t) {
    sndTone(S, o, t, { f: 1200, a: 0.002, d: 0.03, hold: 0.04, g: 0.25 }); sndTone(S, o, t + 0.1, { f: 1600, a: 0.002, d: 0.03, hold: 0.04, g: 0.25 });
    sndNoise(S, o, t + 0.2, { ft: 'lowpass', f: 200, f2: 1400, glide: 1.4, a: 0.4, d: 0.9, g: 0.8, send: 0.2 });
    sndTone(S, o, t + 0.2, { f: 400, f2: 1300, glide: 1.6, w: 'triangle', a: 0.5, d: 0.5, g: 0.1 });
  } },
  touchdown: { g: 0.2, gap: 2, pri: true, fn(S, o, t) { sndNoise(S, o, t, { ft: 'lowpass', f: 1600, f2: 250, glide: 0.8, a: 0.05, d: 0.5, g: 0.7 }); sndThump(S, o, t + 0.5, 80, 0.8, 0.1); sndNoise(S, o, t + 0.55, { f: 3000, q: 0.6, a: 0.02, d: 0.25, g: 0.2 }); } },
  // down a manhole: an iron lid dragged, and its ring
  manhole: { g: 0.2, gap: 1, pri: true, fn(S, o, t) { sndNoise(S, o, t, { f: 700, f2: 1100, glide: 0.4, q: 4, a: 0.05, hold: 0.3, d: 0.1, g: 0.5 }); sndMetal(S, o, t + 0.45, 160, 0.9, 0.6, 3, 0.5); } },
  // the old subway: its chime, the doors, and away
  subway: { g: 0.2, gap: 1, pri: true, fn(S, o, t) {
    sndBell(S, o, t, 880, 0.4, 0.5, 0.4); sndBell(S, o, t + 0.35, 659, 0.4, 0.7, 0.4);
    sndNoise(S, o, t + 0.8, { f: 3000, f2: 1500, glide: 0.4, q: 0.8, a: 0.02, d: 0.2, g: 0.35 });
    sndNoise(S, o, t + 1.1, { ft: 'lowpass', f: 150, f2: 400, glide: 1.2, a: 0.6, d: 0.6, g: 0.7 });
  } },
  // a cage elevator: the gate clanks shut, the chain, the motor
  cage: { g: 0.2, gap: 1, pri: true, fn(S, o, t) {
    sndMetal(S, o, t, 210, 0.9, 0.3, 3, 0.4); sndCrackle(S, o, t + 0.3, 14, 0.6, 0.5, 1800);
    sndTone(S, o, t + 0.4, { f: 55, f2: 62, glide: 1, w: 'warm', lp: 300, a: 0.3, hold: 0.6, d: 0.4, g: 0.6 });
  } },

  // ---- the bench
  // a screw comes out (or goes home)
  screw: { g: 0.12, gap: 0.08, fn(S, o, t, a) { sndMetal(S, o, t, a.in ? 1400 : 1900, 0.4, 0.04, 1.2, 0.05); if (!a.in) sndBell(S, o, t + 0.12, 2400, 0.2, 0.05); } },
  // it binds: a squeal in the thread
  bind: { g: 0.12, gap: 0.3, fn(S, o, t) { sndTone(S, o, t, { f: 720, f2: 660, glide: 0.15, w: 'reed', lp: 2400, vib: [34, 9], a: 0.01, hold: 0.12, d: 0.08, g: 0.5 }); } },
  // the head stripped: the driver jumps and grinds
  chew: { g: 0.15, gap: 0.3, fn(S, o, t) { sndNoise(S, o, t, { f: 2600, q: 2, a: 0.002, hold: 0.15, d: 0.06, g: 0.6 }); sndTone(S, o, t, { f: 170, w: 'sawtooth', lp: 1200, vib: [40, 30], a: 0.002, hold: 0.15, d: 0.05, g: 0.3 }); sndMetal(S, o, t, 1300, 0.4, 0.05); } },
  // solder melting free, or flowing and setting
  flow: { g: 0.1, gap: 0.15, fn(S, o, t, a) { sndNoise(S, o, t, { ft: 'highpass', f: 5000, a: 0.01, hold: 0.08, d: 0.08, g: 0.6 }); if (a.set) sndBell(S, o, t + 0.12, 3136, 0.2, 0.08); } },
  // the board browns under the tip
  scorch: { g: 0.14, gap: 0.3, fn(S, o, t, a) { sndCrackle(S, o, t, 8, 0.25, 0.6, 2400); sndNoise(S, o, t, { f: 1400, q: 0.6, a: 0.05, d: 0.3, g: 0.25 }); if (a.cooked) sndTone(S, o, t, { f: 90, w: 'square', lp: 400, a: 0.002, d: 0.15, g: 0.4 }); } },
  // the probe's reading: r ok, worn, dead (or burnt), or none (an empty mount)
  probe: { g: 0.09, gap: 0.12, fn(S, o, t, a) {
    if (a.r === 'ok') { sndTone(S, o, t, { f: 1320, w: 'square', lp: 2600, a: 0.002, d: 0.03, hold: 0.03, g: 0.4 }); sndTone(S, o, t + 0.08, { f: 1760, w: 'square', lp: 2600, a: 0.002, d: 0.04, hold: 0.04, g: 0.4 }); }
    else if (a.r === 'worn') sndTone(S, o, t, { f: 990, w: 'square', lp: 2200, vib: [14, 40], a: 0.002, d: 0.05, hold: 0.14, g: 0.35 });
    else if (a.r === 'dead') sndTone(S, o, t, { f: 220, w: 'square', lp: 900, a: 0.002, d: 0.06, hold: 0.2, g: 0.5 });
    else sndNoise(S, o, t, { f: 3000, q: 3, a: 0.001, d: 0.01, g: 0.5 });
  } },
  // the casing lifted off, or set back on
  casing: { g: 0.14, gap: 0.2, fn(S, o, t, a) { sndNoise(S, o, t, { f: a.on ? 900 : 1400, f2: a.on ? 600 : 1900, glide: 0.1, q: 1.5, a: 0.01, d: 0.04, g: 0.5 }); sndThump(S, o, t + 0.08, a.on ? 200 : 260, 0.6, 0.03); } },
  // a part lifted out, or seated in its mount
  pull: { g: 0.12, gap: 0.12, fn(S, o, t) { sndNoise(S, o, t, { f: 3200, q: 2, a: 0.001, d: 0.008, g: 0.7 }); sndTone(S, o, t, { f: 900, f2: 1300, glide: 0.04, a: 0.002, d: 0.02, g: 0.3 }); } },
  seat: { g: 0.12, gap: 0.12, fn(S, o, t) { sndNoise(S, o, t, { f: 2600, q: 2, a: 0.001, d: 0.01, g: 0.7 }); sndThump(S, o, t, 300, 0.4, 0.02); } },
  // powered up: res works, half, dead or smoke
  power: { g: 0.2, gap: 0.6, pri: true, fn(S, o, t, a) {
    sndNoise(S, o, t, { f: 2200, q: 3, a: 0.001, d: 0.012, g: 0.6 }); // (the switch)
    if (a.res === 'works') {
      sndTone(S, o, t + 0.05, { f: 180, f2: 880, glide: 0.35, w: 'triangle', a: 0.03, hold: 0.15, d: 0.2, g: 0.3 });
      [12, 16, 19, 24].forEach((s, i) => sndBell(S, o, t + 0.4 + i * 0.08, sndHz(s + 12), 0.3, 0.4, 0.3));
    } else if (a.res === 'half') {
      for (let i = 0; i < 3; i++) sndTone(S, o, t + 0.05 + i * 0.16, { f: 200 + i * 120, f2: 500 + i * 120, glide: 0.1, w: 'triangle', a: 0.01, d: 0.04, hold: 0.04, g: 0.3 });
      sndTone(S, o, t + 0.6, { f: 520, w: 'triangle', vib: [7, 12], a: 0.02, hold: 0.3, d: 0.2, g: 0.2 });
    } else if (a.res === 'smoke') {
      sndCrackle(S, o, t + 0.05, 14, 0.3, 0.8, 2600);
      sndThump(S, o, t + 0.3, 160, 0.8, 0.04); sndNoise(S, o, t + 0.3, { f: 2000, q: 0.5, a: 0.05, hold: 0.4, d: 0.6, g: 0.35 });
    } else sndTone(S, o, t + 0.05, { f: 120, f2: 60, glide: 0.4, w: 'warm', lp: 400, a: 0.02, d: 0.15, g: 0.35 });
  } },
  lens: { g: 0.08, gap: 0.12, fn(S, o, t) { sndBell(S, o, t, 2093, 0.3, 0.05); sndNoise(S, o, t, { f: 1800, q: 1, a: 0.02, d: 0.04, g: 0.3 }); } },

  // ---- news
  good: { g: 0.1, gap: 0.6, fn(S, o, t) { sndBell(S, o, t, sndHz(19), 0.45, 0.35, 0.3); sndBell(S, o, t + 0.11, sndHz(24), 0.45, 0.5, 0.35); } },
  // heat: a low hit and a rub that hangs, harder for more (n)
  heat: { g: 0.18, gap: 1, pri: true, fn(S, o, t, a) {
    const k = sndClamp((a.n || 5) / 15, 0.4, 1);
    sndThump(S, o, t, 70, 0.9 * k, 0.12);
    sndTone(S, o, t, { f: sndHz(-12), w: 'hollow', lp: 900, a: 0.05, d: 0.6, g: 0.3 * k, send: 0.4 });
    sndTone(S, o, t, { f: sndHz(-6), w: 'hollow', lp: 900, a: 0.08, d: 0.6, g: 0.25 * k, det: -8, send: 0.4 });
  } },
  // a step of the tutorial done
  tut: { g: 0.08, gap: 0.5, fn(S, o, t) { [7, 12, 16].forEach((s, i) => sndBell(S, o, t + i * 0.07, sndHz(s + 12), 0.35, 0.3, 0.3)); } },
  // lying down on the cot
  sleep: { g: 0.12, gap: 2, pri: true, fn(S, o, t) { [19, 15, 12, 7].forEach((s, i) => sndTone(S, o, t + i * 0.32, { f: sndHz(s), w: 'hollow', lp: 1600, a: 0.04, d: 0.5, hold: 0.1, g: 0.4, send: 0.5 })); } },

  // ---- the city (from life.js and music.js)
  // a drip landing: positioned
  drip: { g: 0.1, gap: 0.08, fn(S, o, t) { const f = sndRange(1300, 2400); sndTone(S, o, t, { f, f2: f * 0.6, glide: 0.04, a: 0.001, d: 0.03, g: 0.8, send: 0.4 }); } },
  // a letter of someone's words, said aloud in a talk (pitch: their voice)
  blip: { g: 0.035, gap: 0.05, fn(S, o, t, a) { sndSyllable(S, o, t, (a.pitch || 240) * sndRange(0.92, 1.1), 0.9); } },
  // a line said over someone's head, where they are
  murmur: { g: 0.06, gap: 0.25, fn(S, o, t, a) { const f = a.pitch || 240, n = 2 + Math.floor(sndRand() * 3); for (let i = 0; i < n; i++) sndSyllable(S, o, t + i * sndRange(0.08, 0.13), f * sndRange(0.9, 1.15), 0.8); } },
};

// ---------------------------------------------------------------------------
// The settings: music and sound, each on, soft or off (a level 1, soft or 0),
// on unless set. Kept apart from the save, so a new game keeps them.
// ---------------------------------------------------------------------------
const SndSet = {
  key: 'whitedragon.sound', s: null,
  get() { if (!this.s) { try { this.s = JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { this.s = {}; } } return this.s; },
  level(kind) { const v = this.get()[kind]; return v === 'soft' ? T.sound.soft : Tycho.audio.setting(v === undefined ? true : v); },
  word(kind) { const v = this.level(kind); return v >= 1 ? 'On' : v > 0 ? 'Soft' : 'Off'; },
  // on, soft, off, round again
  cycle(kind) {
    const s = this.get(), v = this.level(kind);
    s[kind] = v >= 1 ? 'soft' : v > 0 ? false : true;
    try { localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) { /* storage full or missing: it holds for now */ }
    Snd.applyLevels(false);
  },
};

// The engine (Tycho.audio.Engine): the chain's and the space's numbers are
// the sound's; the mix is T.sound, read live. Distance is from the runner.
const Snd = new Tycho.audio.Engine({
  cues: SND_CUES, mix: T.sound, rand: SND_RAND, waves: SND_WAVE_AMPS, root: SND_ROOT,
  chain: { threshold: -10, knee: 6, ratio: 10, attack: 0.003, release: 0.25, lp: 10000, lpQ: 0.5, hp: 60, hpQ: 0.6 },
  // three delays fed back through a low pass, spread left and right: the
  // city's concrete, ringing on
  space: { taps: [[0.157, -0.6], [0.263, 0.6], [0.389, 0]], lp: 2400, fb: 0.42 },
  level: (kind) => SndSet.level(kind),
  listener: () => (typeof World !== 'undefined' && World.L && !Flight.on ? { x: Player.x, y: Player.y - 16 } : null),
  // (not before the game's up: the music reads where you are)
  canStart: () => typeof Music !== 'undefined' && !!Game.s && typeof World !== 'undefined' && !!World.L,
});

// The hook the game calls: a cue by name, never an error, nothing before the
// first tap.
function snd(name, opts) { Snd.cue(name, opts); }

// The first tap (or key) makes the sound, as browsers ask; later ones wake it
// if the browser put it to sleep. Hidden, it sleeps; back, it wakes.
Snd.listen();
// Every button on a panel ticks as it's pressed.
addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('#panel button, #guide button, #topbtns button')) snd('tap'); }, true);
