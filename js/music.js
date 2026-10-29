'use strict';
// ---------------------------------------------------------------------------
// The music, and each place's own sound (the engine is sound.js).
//
// The score is the city at night in A minor: a pad of four voices and a bass
// under it moving through a progression (MUS_PROGS) two bars a chord, and
// over it what the place calls for (MUS_MOODS): an arpeggio echoing off the
// concrete on the streets, a few notes of electric piano now and then, a
// koto in Old Town, an air of high voices up in the Spires, a machine's beat
// in the Works, a dread in the deep, a kick through the floor in the Coil.
// Its beat is scheduled a little ahead of the clock (T.sound.ahead), an eighth
// at a time. By day it's sparser; with heat, a darker rub creeps in under it.
// At home it's warm and slow, the bar's noise through the ceiling. In the
// White Dragon the music is Lin's kitchen radio, through its little speaker,
// and until you've fixed it, only static.
//
// Under the music each place has its own sound (MUS_BEDS): two bands of noise
// for its traffic, wind, room or machines, rising and falling, and what
// happens now and then (cars passing, a siren, a horn, the monorail, drips,
// a temple bell, pipes knocking, bowls clinking). Rain where it rains, its
// patter muffled under a roof, and thunder in a downpour. Near a buzzing
// tube, a hissing vent or a fire, you hear it, and less as you walk away.
// The places' sound is on the effects' bus, so the music can be off and the
// city still heard.
//
// Music.listen (every frame) listens to the game for what it doesn't call
// itself: footsteps, jumps, landings and ladder rungs, the cutter while you
// hold Use on a machine, the driver and the iron on the bench, someone's
// words said aloud in a talk, a line over someone's head, money in and out,
// and the cab's engine in flight.
// ---------------------------------------------------------------------------

// The continuous layers (Tycho's drones; their notes are moved with each
// chord). notes: [semis from A3, detune cents]; w: wave; lp, lfo, trem; g.
const MUS_LAYERS = {
  pad: { notes: [[3, -7], [7, 6], [10, -5], [14, 7]], w: 'glass', lp: 1250, lfo: [0.05, 320], trem: [0.09, 0.25], g: 0.05 },
  bass: { notes: [[-12, -3], [-12, 4]], w: 'warm', lp: 360, trem: [0.07, 0.15], g: 0.075 },
  air: { notes: [[19, -4], [26, 5]], w: 'sine', lp: 5000, trem: [0.13, 0.6], g: 0.013 },
  dark: { notes: [[1, 0], [6, 9]], w: 'hollow', lp: 760, trem: [0.21, 0.6], g: 0.035 },
};
// The progressions: each chord its bass (b) and the pad's four notes (p),
// semis from A3; and the scale the melodies keep to.
const MUS_PROGS = {
  // Am9, Fmaj9, Dm9, Em7: the city's
  city: { scale: 'minor', ch: [{ b: -12, p: [3, 7, 10, 14] }, { b: -16, p: [0, 3, 7, 10] }, { b: -19, p: [-4, 0, 3, 7] }, { b: -17, p: [-2, 2, 5, 7] }] },
  // Am9, D9, Fmaj9, G6/9: home, warmer
  home: { scale: 'dorian', ch: [{ b: -12, p: [3, 7, 10, 14] }, { b: -19, p: [-3, 0, 3, 7] }, { b: -16, p: [0, 3, 7, 10] }, { b: -14, p: [2, 5, 7, 12] }] },
  // Fmaj9, Cmaj7, G, Am: up above the cloud
  sky: { scale: 'minor', ch: [{ b: -16, p: [0, 3, 7, 10] }, { b: -9, p: [3, 7, 10, 14] }, { b: -14, p: [2, 5, 10, 14] }, { b: -12, p: [3, 7, 12, 14] }] },
  // A minor and B flat over an A that never moves: the undercity
  under: { scale: 'phrygian', ch: [{ b: -12, p: [0, 3, 7, 14] }, { b: -12, p: [1, 5, 8, 12] }] },
  // Asus, Dm, B flat, Esus in the old scale (miyako-bushi): Old Town
  old: { scale: 'miyako', ch: [{ b: -12, p: [0, 5, 7, 12] }, { b: -19, p: [0, 5, 8, 12] }, { b: -11, p: [1, 5, 8, 13] }, { b: -17, p: [-5, 0, 2, 5] }] },
  // E, E, C, D: the Works' grind
  works: { scale: 'minor', ch: [{ b: -17, p: [-5, 2, 7, 10] }, { b: -17, p: [-5, 2, 7, 10] }, { b: -21, p: [-2, 3, 7, 10] }, { b: -19, p: [-3, 2, 5, 9] }] },
  // a cluster over a low A, barely moving: the Bowels
  bowels: { scale: 'dread', ch: [{ b: -24, p: [-12, -11, -5, 0] }, { b: -24, p: [-12, -6, -5, 1] }] },
  // Am, F, C, G: the club's
  club: { scale: 'minor', ch: [{ b: -12, p: [3, 7, 12, 15] }, { b: -16, p: [0, 3, 7, 12] }, { b: -9, p: [3, 7, 10, 15] }, { b: -14, p: [2, 7, 10, 14] }] },
};
const MUS_SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], miyako: [0, 1, 5, 7, 8], dread: [0, 1, 6, 7] };
// The arpeggio's order through the pad's notes, an eighth each.
const MUS_ARP = [0, 1, 2, 3, 2, 1, 3, 1];

// What each place's music is: its progression and tempo (eighths at twice
// it), how much of each layer, the arpeggio, the keys' phrases, the koto's,
// its beat (hats, works or club) and its level, its bed (MUS_BEDS), and
// whether it's heard through a radio's speaker or a wall.
const MUS_MOODS = {
  city: { prog: 'city', tempo: 80, pad: 1, bass: 1, air: 0.3, arp: 0.8, keys: 1, bed: 'street' },
  street: { prog: 'city', tempo: 84, pad: 0.9, bass: 1, air: 0.1, arp: 0.7, keys: 0.6, beat: 'hats', beatG: 0.6, bed: 'market' },
  sky: { prog: 'sky', tempo: 66, pad: 0.9, bass: 0.5, air: 1, arp: 0.45, keys: 1, bed: 'sky' },
  under: { prog: 'under', tempo: 60, pad: 0.55, bass: 0.7, dark: 1, keys: 0.35, bed: 'under' },
  old: { prog: 'old', tempo: 64, pad: 0.6, bass: 0.6, air: 0.3, koto: 1, bed: 'old' },
  works: { prog: 'works', tempo: 96, pad: 0.4, bass: 0.9, dark: 0.5, arp: 0.3, beat: 'works', beatG: 1, bed: 'works' },
  bowels: { prog: 'bowels', tempo: 50, pad: 0.45, bass: 0.6, dark: 1, bed: 'bowels' },
  home: { prog: 'home', tempo: 70, pad: 0.7, bass: 0.6, air: 0.1, keys: 1, bed: 'cellar' },
  bar: { prog: 'home', tempo: 76, pad: 0.8, bass: 0.8, arp: 0.5, keys: 1, beat: 'hats', beatG: 0.5, bed: 'bar', radio: true, lin: true },
  izakaya: { prog: 'old', tempo: 66, pad: 0.5, bass: 0.5, koto: 1, bed: 'bar', radio: true },
  club: { prog: 'club', tempo: 120, pad: 0.7, bass: 1, arp: 1, beat: 'club', beatG: 1, bed: 'club' },
  pachinko: { prog: 'sky', tempo: 132, pad: 0.3, arp: 1, bed: 'pachinko', radio: true },
  cinema: { prog: 'sky', tempo: 56, pad: 0.7, bass: 0.6, air: 0.7, bed: 'cinema', wall: true },
  shrine: { prog: 'old', tempo: 56, pad: 0.4, koto: 0.6, bed: 'shrine' },
  shop: { prog: 'home', tempo: 72, pad: 0.6, bass: 0.5, keys: 0.6, bed: 'shop', radio: true },
  pets: { prog: 'home', tempo: 72, pad: 0.6, bass: 0.5, keys: 0.6, bed: 'pets', radio: true },
  room: { prog: 'home', tempo: 66, pad: 0.4, keys: 0.3, bed: 'room', wall: true },
  flight: { prog: 'city', tempo: 92, pad: 1, bass: 1, air: 0.6, arp: 1, keys: 0.6, bed: 'flight' },
};
// Places with music of their own; the rest by their band.
const MUS_PLACE = { d_cellar: 'home', d_noodles: 'bar', d_izakaya: 'izakaya', d_coil: 'club', d_pachinko: 'pachinko', d_cinema: 'cinema', d_shrine: 'shrine', d_grocery: 'shop', d_menagerie: 'pets', d_apartments: 'room' };
const MUS_BAND = { sky: 'sky', high: 'city', street: 'street', under: 'under', old: 'old', works: 'works', bowels: 'bowels' };

// Each place's own sound. a, b: two bands of noise [Hz, Q, level]; gust: how
// much they rise and fall, and rate how quickly; ev: what happens now and
// then [kind, least gap, most gap, level] (MUS_EVENTS).
const MUS_BEDS = {
  street: { a: [150, 0.5, 0.09], b: [2400, 0.4, 0.01], gust: 0.3, rate: 0.1, ev: [['whoosh', 4, 11, 0.5], ['horn', 20, 50, 0.22], ['siren', 45, 120, 0.2], ['train', 50, 120, 0.35]] },
  market: { a: [180, 0.5, 0.1], b: [800, 0.8, 0.03], gust: 0.4, rate: 0.15, ev: [['whoosh', 6, 14, 0.4], ['chatter', 3, 8, 0.45], ['horn', 15, 40, 0.25], ['clink', 6, 14, 0.3]] },
  sky: { a: [420, 0.5, 0.05], b: [1500, 0.6, 0.05], gust: 0.8, rate: 0.25, ev: [['whoosh', 6, 14, 0.3], ['chime', 9, 22, 0.3]] },
  under: { a: [110, 0.8, 0.1], b: [1100, 0.7, 0.012], gust: 0.3, rate: 0.06, ev: [['drip', 1.5, 4, 0.6], ['groan', 10, 25, 0.5], ['rat', 12, 30, 0.4], ['pipe', 15, 40, 0.4]] },
  old: { a: [220, 0.6, 0.06], b: [1800, 0.7, 0.014], gust: 0.4, rate: 0.1, ev: [['drip', 3, 8, 0.4], ['chime', 8, 20, 0.35], ['train', 60, 140, 0.3]] },
  works: { a: [90, 0.7, 0.13], b: [3200, 0.6, 0.02], gust: 0.3, rate: 0.2, ev: [['steam', 6, 15, 0.5], ['clank', 3, 9, 0.5]] },
  bowels: { a: [70, 0.9, 0.14], b: [900, 1, 0.01], gust: 0.4, rate: 0.05, ev: [['groan', 6, 15, 0.6], ['drip', 2, 6, 0.4], ['crackle', 8, 20, 0.3]] },
  // the bar's noise through the ceiling, footsteps over your head
  cellar: { a: [260, 0.7, 0.04], b: [1200, 1.2, 0], gust: 0.5, rate: 0.12, ev: [['thud', 8, 20, 0.35], ['clink', 12, 28, 0.15], ['pipe', 25, 60, 0.3]] },
  bar: { a: [520, 1, 0.06], b: [3800, 0.8, 0.006], gust: 0.5, rate: 0.3, ev: [['clink', 3, 8, 0.45], ['bubble', 0.8, 2.2, 0.3], ['chatter', 4, 10, 0.4], ['laugh', 15, 40, 0.3]] },
  club: { a: [140, 0.6, 0.05], b: [700, 1, 0.05], gust: 0.4, rate: 0.3, ev: [['chatter', 3, 7, 0.35]] },
  pachinko: { a: [3600, 0.7, 0.05], b: [600, 1, 0.04], gust: 0.3, rate: 0.5, ev: [['jingle', 2, 6, 0.35], ['rattle', 0.4, 1.4, 0.5]] },
  cinema: { a: [300, 0.6, 0.02], b: [2000, 1, 0], gust: 0.2, rate: 0.05, ev: [['cough', 20, 50, 0.3]] },
  shrine: { a: [500, 0.6, 0.03], b: [2000, 0.7, 0.01], gust: 0.6, rate: 0.12, ev: [['chime', 5, 14, 0.4], ['bell', 30, 70, 0.5]] },
  shop: { a: [120, 3, 0.04], b: [2000, 1, 0], gust: 0.1, rate: 0.05, ev: [['beep', 10, 30, 0.25]] },
  pets: { a: [120, 3, 0.03], b: [2000, 1, 0], gust: 0.1, rate: 0.05, ev: [['bird', 2, 7, 0.4], ['beep', 20, 40, 0.2]] },
  room: { a: [200, 0.6, 0.03], b: [2000, 1, 0], gust: 0.2, rate: 0.05, ev: [['tv', 4, 10, 0.3], ['pipe', 20, 50, 0.3]] },
  flight: { a: [300, 0.5, 0.12], b: [1800, 0.5, 0.05], gust: 0.5, rate: 0.4, ev: [['whoosh', 1, 3, 0.7]] },
};

// What happens now and then in a place: (S, out, t, level).
const MUS_EVENTS = {
  // a car passing, or a flying one overhead
  whoosh(S, o, t, g) { const f = sndRange(300, 600); sndNoise(S, o, t, { f, f2: f * 2.6, glide: 1, q: 0.9, a: 0.6, d: 0.35, g }); sndTone(S, o, t, { f: sndRange(180, 260), f2: sndRange(130, 160), glide: 1.2, w: 'warm', lp: 500, a: 0.6, d: 0.3, g: g * 0.25 }); },
  horn(S, o, t, g) { for (const s of [-5, -1]) sndTone(S, o, t, { f: sndHz(s + 12), w: 'sawtooth', lp: 1100, a: 0.02, hold: sndRange(0.15, 0.4), d: 0.08, g: g * 0.5, send: 0.5 }); },
  siren(S, o, t, g) { sndTone(S, o, t, { f: 820, w: 'triangle', lp: 1600, vib: [1.4, 140], a: 1.2, hold: 2.5, d: 1.2, g, send: 0.6 }); },
  // the monorail: a long rumble, its wheels clacking
  train(S, o, t, g) { sndNoise(S, o, t, { ft: 'lowpass', f: 180, f2: 420, glide: 2.5, a: 1.8, hold: 1.5, d: 1.5, g }); for (let i = 0; i < 8; i++) sndThump(S, o, t + 1.4 + i * 0.27 + (i % 2) * 0.09, 160, g * 0.25, 0.03); },
  drip(S, o, t, g) { const f = sndRange(1300, 2300); sndTone(S, o, t, { f, f2: f * 0.6, glide: 0.04, a: 0.001, d: 0.03, g, send: 0.45 }); },
  groan(S, o, t, g) { sndTone(S, o, t, { f: sndRange(95, 120), f2: sndRange(85, 100), glide: 1.5, w: 'reed', lp: 520, a: 0.6, d: 0.6, g, send: 0.35 }); },
  rat(S, o, t, g) { for (let i = 0; i < 2; i++) sndTone(S, o, t + i * 0.12, { f: sndRange(3000, 3800), f2: 4200, glide: 0.04, a: 0.003, d: 0.025, g: g * 0.5 }); },
  // pipes knocking, somewhere in the walls
  pipe(S, o, t, g) { const n = 2 + Math.floor(sndRand() * 3); for (let i = 0; i < n; i++) sndMetal(S, o, t + i * sndRange(0.15, 0.3), sndRange(160, 220), g * 0.6, 0.12, 1.5, 0.4); },
  chime(S, o, t, g) { const n = 3 + Math.floor(sndRand() * 4); for (let i = 0; i < n; i++) sndBell(S, o, t + i * sndRange(0.08, 0.25), sndHz(24 + sndPick([0, 1, 5, 7, 8, 12])), g * 0.4, 0.6, 0.4); },
  // a temple bell, far off
  bell(S, o, t, g) { sndBell(S, o, t, sndHz(-7), g, 3.2, 0.5); sndTone(S, o, t, { f: sndHz(-7) * 1.003, a: 0.01, d: 3.5, g: g * 0.5 }); },
  clank(S, o, t, g) { sndMetal(S, o, t, sndRange(150, 260), g * 0.8, 0.3, 3, 0.45); },
  steam(S, o, t, g) { sndNoise(S, o, t, { ft: 'highpass', f: 2800, a: 0.05, hold: sndRange(0.3, 0.9), d: 0.4, g: g * 0.5 }); },
  crackle(S, o, t, g) { sndCrackle(S, o, t, 4 + Math.floor(sndRand() * 6), 0.4, g, 2400); },
  // somebody walking about upstairs in the bar
  thud(S, o, t, g) { const n = 2 + Math.floor(sndRand() * 4); for (let i = 0; i < n; i++) sndThump(S, o, t + i * sndRange(0.42, 0.55), 70, g, 0.06); },
  clink(S, o, t, g) { const n = 1 + Math.floor(sndRand() * 2); for (let i = 0; i < n; i++) sndBell(S, o, t + i * sndRange(0.05, 0.14), sndRange(2300, 3400), g * 0.5, 0.12, 0.2); },
  // the broth on the stove
  bubble(S, o, t, g) { sndTone(S, o, t, { f: sndRange(250, 400), f2: sndRange(500, 700), glide: 0.04, a: 0.003, d: 0.03, g: g * 0.6 }); },
  // voices in a crowd, words you can't make out
  chatter(S, o, t, g) { const f = sndRange(150, 300), n = 3 + Math.floor(sndRand() * 5); for (let i = 0; i < n; i++) sndSyllable(S, o, t + i * sndRange(0.07, 0.14), f * sndRange(0.85, 1.2), g * 0.25); },
  laugh(S, o, t, g) { const f = sndRange(220, 360); for (let i = 0; i < 4; i++) sndSyllable(S, o, t + i * 0.13, f * (1 - i * 0.04), g * 0.3); },
  cough(S, o, t, g) { for (let i = 0; i < 2; i++) sndNoise(S, o, t + i * 0.22, { f: 700, q: 0.8, a: 0.005, d: 0.06, g: g * 0.4, send: 0.4 }); },
  // a pachinko machine paying out, and balls falling through the pins
  jingle(S, o, t, g) { [0, 4, 7, 12, 16, 19].forEach((s, i) => sndTone(S, o, t + i * 0.06, { f: sndHz(s + 24), w: 'square', lp: 3000, a: 0.002, d: 0.04, g: g * 0.25 })); },
  rattle(S, o, t, g) { sndCrackle(S, o, t, 10, 0.5, g * 0.6, 4200); },
  beep(S, o, t, g) { sndTone(S, o, t, { f: 1800, w: 'square', lp: 3000, a: 0.002, d: 0.03, hold: 0.06, g: g * 0.3 }); },
  bird(S, o, t, g) { const f = sndRange(2300, 3200), n = 2 + Math.floor(sndRand() * 3); for (let i = 0; i < n; i++) sndTone(S, o, t + i * 0.1, { f, f2: f * 1.3, glide: 0.05, a: 0.004, d: 0.025, g: g * 0.6 }); },
  // a television through a wall
  tv(S, o, t, g) { const f = sndRange(160, 260); for (let i = 0; i < 6; i++) sndSyllable(S, o, t + i * sndRange(0.1, 0.18), f * sndRange(0.9, 1.2), g * 0.25); },
  thunder(S, o, t, g) { sndNoise(S, o, t, { ft: 'lowpass', f: 400, f2: 120, glide: 2.5, a: 0.08, hold: 0.4, d: 1.4, g, send: 0.5 }); sndCrackle(S, o, t, 6, 0.3, g * 0.4, 900); },
  // a broken radio's static
  static(S, o, t, g) { sndNoise(S, o, t, { f: sndRange(1500, 3000), q: 0.6, a: 0.01, hold: sndRange(0.2, 1.2), d: 0.1, g: g * 0.4 }); if (sndRand() < 0.5) sndTone(S, o, t, { f: sndRange(800, 3000), f2: sndRange(800, 3000), glide: 0.5, a: 0.05, d: 0.2, g: g * 0.08 }); },
};

const Music = Object.assign(new Tycho.audio.Music({ layers: MUS_LAYERS, every: 0.1 }), {
  bands: null, fx: null, tone: null, mood: null, C: null, prog: '', ci: -1, n: 0, nextBeat: 0, gust: 1, gustAt: 0,
  p: null, cr: null, said: null, blipAt: 0, near: null, nearAt: 0, crackAt: 0, sparkAt: 0,

  // The voices, built once on Snd's context and kept running (silent until
  // wanted): the layers (Tycho's, into the music's master), then the
  // master's way out (a radio's speaker, a wall, or neither), the place's
  // bands of noise, and the effects that sound for as long as something's
  // held (on the effects' bus).
  setup(S) {
    const c = S.ctx, m = this.master;
    // the music through a radio's little speaker, a wall, or neither
    const duck = c.createGain(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 20; hp.Q.value = 0.7; lp.type = 'lowpass'; lp.frequency.value = 12000; lp.Q.value = 0.7;
    m.disconnect(); m.connect(duck); duck.connect(hp); hp.connect(lp); lp.connect(S.music);
    this.tone = { duck, hp, lp };
    // a place's sound, its rain under the sky (or on a roof), and what's near
    const band = (type) => Tycho.audio.band(S, S.sfx, type);
    this.bands = { a: band(), b: band(), rain: band(), roof: band('lowpass'), steam: band('highpass'), sizzle: band('highpass'), hiss: band() };
    this.bands.rain.f.frequency.value = 3600; this.bands.rain.f.Q.value = 0.35;
    this.bands.roof.f.frequency.value = 650; this.bands.roof.f.Q.value = 0.5;
    this.bands.steam.f.frequency.value = 3000; this.bands.sizzle.f.frequency.value = 5200;
    this.bands.hiss.f.frequency.value = 2400; this.bands.hiss.f.Q.value = 0.8;
    // the cutter's plasma, the driver's motor, a tube's buzz, the cab's engine
    const drone = (L) => Tycho.audio.drone(S, L, S.sfx);
    this.fx = {
      cutter: drone({ notes: [[-17, 0], [-5, 9]], w: 'sawtooth', lp: 1500, trem: [31, 0.5] }),
      driver: drone({ notes: [[-9, 0]], w: 'square', lp: 900, trem: [22, 0.6] }),
      buzz: drone({ notes: [[-10.6, 0], [1.4, 0]], w: 'square', lp: 1400 }),
      engine: drone({ notes: [[-29, 0], [-17, 7]], w: 'sawtooth', lp: 420, trem: [3, 0.2] }),
    };
    this.mood = null; this.prog = ''; this.ci = -1; this.n = 0; this.nextBeat = c.currentTime + 0.3; this.nextEv = {};
    this.p = null; this.cr = null; this.said = null;
  },

  // What the music is doing now, read from the game: the mood (MUS_MOODS)
  // and its id; day (0-1, under the sky); rain where you are (and on a roof);
  // heat; whether Lin's radio plays; whether you're at work (a panel open).
  state() {
    const L = World.L, id = Flight.on ? 'flight' : MUS_PLACE[L.id] || MUS_BAND[Travel.band(L.id)] || 'city';
    const r = Weather.rain(), lin = Game.s.jobs.lin;
    return {
      id, m: MUS_MOODS[id], day: Flight.on || L.open ? Day.light() : 0, heat: Game.s.heat,
      rain: Flight.on ? r : L.rain ? r : 0, roof: !L.rain && LEVELS[L.id].hidden && L.id !== 'd_cellar' ? r : 0,
      radio: !!(lin && (lin.st === 'back' || lin.st === 'done') && (lin.res === 'works' || lin.res === 'half')),
      bench: Hud.open === 'bench', talking: !!(Talk.typer && Talk.typer.busy),
    };
  },

  // The music at `now` for state st, ten times a second (Tycho's Music.tick).
  update(now, st) {
    const X = T.sound, m = st.m, tc = st.id !== this.mood ? 1.6 : 0.8, night = 1 - st.day;
    this.mood = st.id;
    // Lin's radio, broken: no music in the bar but static
    const silent = m.lin && !st.radio, k = silent ? 0 : 1;
    const heat = sndClamp((st.heat - X.heatFrom) / (100 - X.heatFrom), 0, 1);
    for (const id of ['pad', 'bass', 'air', 'dark']) {
      let g = (m[id] || 0) * k;
      if (id === 'air') g += 0.2 * st.day * k;
      if (id === 'dark') g = Math.max(g, heat * X.heatDark * k);
      this.set(this.v[id].out.gain, MUS_LAYERS[id].g * g, now, tc);
    }
    // the way out: a radio's speaker, a wall, or the room itself; quieter
    // while someone's talking, and at the bench (it's work)
    const T0 = this.tone;
    this.set(T0.hp.frequency, m.radio ? 420 : 20, now, 0.3);
    this.set(T0.lp.frequency, m.radio ? 2800 : m.wall ? 650 : 12000, now, 0.3);
    this.set(T0.duck.gain, st.talking ? X.duckTalk : st.bench ? X.duckBench : 1, now, 0.4);
    this.schedule(now, st, silent);
    this.bed(now, st, silent, night);
  },

  // The beat, an eighth at a time, scheduled a little ahead (T.sound.ahead); a
  // chord every two bars.
  schedule(now, st, silent) {
    const m = st.m, e8 = 30 / m.tempo;
    if (this.nextBeat < now - 0.2) this.nextBeat = now + 0.05; // (back from sleep: start again)
    while (this.nextBeat < now + T.sound.ahead) {
      const t = this.nextBeat, i = this.n % 16;
      if (i === 0 || !this.C || this.prog !== m.prog) this.chord(t, st, silent);
      if (!silent) this.beat(t, i, st);
      this.n++; this.nextBeat += e8;
    }
  },
  // A new chord: the drones move to it, and maybe a phrase over it.
  chord(t, st, silent) {
    const m = st.m, P = MUS_PROGS[m.prog];
    if (this.prog !== m.prog) { this.prog = m.prog; this.ci = 0; this.n = 0; } else this.ci = (this.ci + 1) % P.ch.length;
    const C = (this.C = P.ch[this.ci]), V = this.v, hz = sndHz;
    V.pad.oscs.forEach((o, i) => o.frequency.setTargetAtTime(hz(C.p[i]), t, 0.25));
    V.bass.oscs.forEach((o) => o.frequency.setTargetAtTime(hz(C.b), t, 0.08));
    V.air.oscs[0].frequency.setTargetAtTime(hz(C.p[1] + 12), t, 0.4); V.air.oscs[1].frequency.setTargetAtTime(hz(C.p[3] + 12), t, 0.4);
    V.dark.oscs[0].frequency.setTargetAtTime(hz(C.b + 13), t, 0.4); V.dark.oscs[1].frequency.setTargetAtTime(hz(C.b + 18), t, 0.4);
    if (silent) return;
    const X = T.sound, sparse = 1 - 0.4 * st.day;
    if (m.keys && sndRand() < m.keys * X.keysChance * sparse) this.phrase(t + (30 / m.tempo) * 2 * Math.floor(sndRand() * 3), st, 'keys');
    if (m.koto && sndRand() < m.koto * X.kotoChance) this.phrase(t + (30 / m.tempo) * Math.floor(sndRand() * 4), st, 'koto');
  },
  // One eighth: the arpeggio's note, and the beat's.
  beat(t, i, st) {
    const m = st.m, S = this.S, X = T.sound, C = this.C, arp = (m.arp || 0) * (1 - 0.5 * st.day);
    if (arp > 0.02) {
      const f = sndHz(C.p[MUS_ARP[i % 8]] + 12), o = S.cueOut(t, X.arp * arp, (i % 2 ? 0.25 : -0.25), this.master);
      sndTone(S, o, t, { f, w: 'triangle', lp: 2200, a: 0.003, d: 0.13, g: 0.6, send: 0.35 });
      sndFm(S, o, t, { f, ratio: 2, i0: 0.8, i1: 0, id: 0.04, a: 0.002, d: 0.07, g: 0.25 });
      S.cueDone(o);
    }
    if (!m.beat) return;
    const o = S.cueOut(t, X.beat * (m.beatG || 1), 0, this.master);
    if (m.beat === 'hats') { if (i % 2) sndNoise(S, o, t, { ft: 'highpass', f: 7000, a: 0.001, d: 0.018, g: i % 4 === 3 ? 0.5 : 0.3 }); if (i === 12) sndNoise(S, o, t, { f: 1800, q: 4, a: 0.001, d: 0.012, g: 0.4, send: 0.3 }); }
    else if (m.beat === 'works') {
      if (i % 4 === 0) this.kick(o, t, 0.8);
      if (i % 8 === 6) sndMetal(S, o, t, 220, 0.5, 0.25, 3, 0.45);
      if (i % 2) sndNoise(S, o, t, { ft: 'highpass', f: 5000, a: 0.001, d: 0.03, g: 0.2 });
    } else if (m.beat === 'club') {
      if (i % 2 === 0) this.kick(o, t, 1);
      if (i % 8 === 4) { sndNoise(S, o, t, { f: 1500, q: 0.8, a: 0.001, d: 0.05, g: 0.5, send: 0.2 }); sndNoise(S, o, t + 0.012, { f: 1300, q: 0.8, a: 0.001, d: 0.06, g: 0.4 }); }
      if (i % 2) { sndNoise(S, o, t, { ft: 'highpass', f: 8000, a: 0.001, d: 0.025, g: 0.35 }); sndTone(S, o, t, { f: sndHz(C.b), w: 'warm', lp: 700, a: 0.004, d: 0.1, g: 0.8 }); }
    }
    S.cueDone(o);
  },
  kick(o, t, g) { sndTone(this.S, o, t, { f: 140, f2: 45, glide: 0.12, a: 0.002, d: 0.13, g }); sndNoise(this.S, o, t, { ft: 'lowpass', f: 300, a: 0.001, d: 0.02, g: g * 0.5 }); },
  // A few notes over the chord: the electric piano's, or the koto's in Old
  // Town. Up and down the scale from one of the chord's notes, coming to
  // rest on another.
  phrase(t, st, kind) {
    const S = this.S, X = T.sound, m = st.m, C = this.C, e8 = 30 / m.tempo, sc = MUS_SCALES[MUS_PROGS[m.prog].scale];
    const notes = []; for (let o = 0; o <= 24; o += 12) for (const s of sc) if (o + s >= 9 && o + s <= 27) notes.push(o + s);
    const near = (semi) => notes.reduce((b, n) => (Math.abs(n - semi) < Math.abs(b - semi) ? n : b), notes[0]);
    let at = notes.indexOf(near(sndPick(C.p) + 12)), time = t;
    const n = 3 + Math.floor(sndRand() * 4), o = S.cueOut(t, kind === 'koto' ? X.koto : X.keys, sndRange(-0.3, 0.3), this.master);
    for (let k = 0; k < n; k++) {
      const last = k === n - 1, semi = last ? near(sndPick(C.p) + 12) : notes[at], f = sndHz(semi), len = last ? 4 : sndPick([1, 1, 2, 2, 3]);
      if (kind === 'koto') {
        sndTone(S, o, time, { f, f2: f * 1.004, glide: 0.2, w: 'triangle', a: 0.002, d: 0.3 + len * 0.05, g: 0.6, send: 0.35 });
        sndFm(S, o, time, { f, ratio: 3, i0: 2, i1: 0, id: 0.03, a: 0.001, d: 0.05, g: 0.25 });
      } else {
        sndFm(S, o, time, { f, ratio: 1, i0: 1.4, i1: 0.1, id: 0.25, lp: 2400, a: 0.004, d: 0.45 + len * 0.1, g: 0.5, send: 0.4 });
        sndTone(S, o, time, { f: f * 2, a: 0.002, d: 0.15, g: 0.08 });
      }
      at = sndClamp(at + sndPick([-2, -1, -1, 1, 1, 2]), 0, notes.length - 1);
      time += len * e8;
    }
    S.cueDone(o);
  },

  // A place's sound: its two bands rising and falling, its rain, and now and
  // then its events.
  bed(now, st, silent, night) {
    const S = this.S, X = T.sound, B = MUS_BEDS[st.m.bed] || MUS_BEDS.street, bd = this.bands;
    if (now >= this.gustAt) { this.gust = 1 + sndRange(-B.gust, B.gust * 0.5); this.gustAt = now + sndRange(0.5, 1.5) / Math.max(0.05, B.rate * 4); }
    const tc = 0.6 / Math.max(0.1, B.rate * 2), k = X.bed;
    this.set(bd.a.f.frequency, B.a[0] * (1 + 0.2 * (this.gust - 1)), now, 1);
    this.set(bd.a.f.Q, B.a[1], now, 1);
    this.set(bd.a.g.gain, B.a[2] * k * this.gust, now, tc);
    this.set(bd.b.f.frequency, B.b[0], now, 1);
    this.set(bd.b.f.Q, B.b[1], now, 1);
    this.set(bd.b.g.gain, B.b[2] * k * (0.7 + 0.3 * this.gust), now, tc);
    // the rain: open to it, or drumming on a roof over you
    this.set(bd.rain.g.gain, X.rain * st.rain * (0.85 + 0.15 * this.gust), now, 1.2);
    this.set(bd.roof.g.gain, X.roof * st.roof, now, 1.2);
    // what happens now and then: more traffic by day, sirens at night, more
    // of them with heat; thunder in a downpour; the bar's broken radio
    const evs = B.ev.slice();
    if (st.rain > 0.7 || st.roof > 0.7) evs.push(['thunder', 18, 50, 0.6]);
    if (st.m.lin && silent) evs.push(['static', 2, 6, 0.5]);
    if (st.heat >= 70 && (st.m.bed === 'street' || st.m.bed === 'market')) evs.push(['siren', 20, 45, 0.25]);
    this.due(now, evs, ([kind, , , g0]) => {
      let g = g0 * X.events;
      if (kind === 'whoosh' && st.id !== 'flight') g *= 0.6 + 0.4 * (1 - night);
      if (kind === 'siren') g *= 0.6 + 0.4 * night;
      if (kind === 'thunder') g *= Math.max(st.rain, st.roof * 0.5);
      if (g < 0.01) return;
      const o = S.cueOut(now, g, sndRange(-0.6, 0.6));
      MUS_EVENTS[kind](S, o, now + sndRand() * 0.1, 1);
      S.cueDone(o);
    });
  },

  // Every frame (real time): what the game doesn't call itself.
  listen(now) {
    const X = T.sound, F = this.fx, bd = this.bands, play = !Game.paused && !Flight.on && World.L;
    // the cab's engine in flight
    this.set(F.engine.out.gain, Flight.on ? X.engine : 0, now, Flight.on ? 0.3 : 0.6);
    this.set(bd.hiss.g.gain, Flight.on ? X.engine * 0.3 : 0, now, 0.5);
    // money in and out (a till's ring, a few coins), however it changed hands
    if (this.cr !== null && Game.s.cr !== this.cr) snd(Game.s.cr > this.cr ? 'cash' : 'spend');
    this.cr = Game.s.cr;
    this.runner(now, play);
    this.bench(now);
    this.voices(now);
    this.nearby(now, play);
  },
  // The runner: a footstep each time a foot comes down (the walk's and the
  // run's own strides, as player.js poses them), a jump, a landing, a ladder's
  // rungs; and the cutter while Use is held on a machine.
  runner(now, play) {
    const P = Player, X = T.sound, F = this.fx;
    const h = play && P.hold, k = h ? sndClamp(h.t / h.need, 0, 1) : 0;
    this.set(F.cutter.out.gain, h ? X.cutter : 0, now, h ? 0.04 : 0.06);
    if (h) { F.cutter.oscs.forEach((o, i) => this.set(o.frequency, sndHz(i ? -5 : -17) * (1 + k * 0.5), now, 0.1)); if (now >= this.sparkAt) { this.sparkAt = now + sndRange(0.06, 0.16); const o = this.S.cueOut(now, X.cutter * 1.6, 0); sndCrackle(this.S, o, now, 3, 0.05, 0.5, 3600); this.S.cueDone(o); } }
    if (!play) { this.p = null; return; }
    const was = this.p, v = Math.abs(P.vx), ground = this.ground();
    this.p = { g: P.ground, w: P.walked, l: !!P.ladder, vy: P.vy };
    if (!was) return;
    if (P.ladder) { if (Math.floor(P.walked / 7) !== Math.floor(was.w / 7)) snd('rung'); return; }
    if (was.g && !P.ground && P.vy < -100) snd('jump');
    else if (!was.g && P.ground && !was.l && was.vy > 90) snd('land', { k: sndClamp(was.vy / 400, 0.2, 1), ground });
    else if (P.ground && v > 6) {
      const stride = v > 64 ? 19.5 : 13.8;
      if (Math.floor(P.walked / stride) !== Math.floor(was.w / stride)) snd('step', { ground, k: v > 150 ? 1 : v > 64 ? 0.8 : 0.55 });
    }
  },
  // What's underfoot: a walkway's or stairs' grating, a wooden floor, wet
  // ground in the rain, or concrete.
  ground() {
    const L = World.L, P = Player;
    if (World.way(P.x, P.y - 1, P.y + 1) !== null && !World.hits(P.x - 2, P.y, P.x + 2, P.y + 2)) return 'metal';
    if (['d_noodles', 'd_izakaya', 'd_shrine', 'd_apartments'].includes(L.id)) return 'wood';
    return L.rain && Weather.wet() > 0.3 ? 'wet' : 'concrete';
  },
  // The bench: the driver's motor while it turns a screw (straining when it
  // binds), the iron's sizzle while it's on a joint, hotter as it heats.
  bench(now) {
    const X = T.sound, F = this.fx, h = Hud.open === 'bench' && Bench.b ? Bench.hold : null;
    const screw = h && h.what === 'screw' && !h.done, r = screw ? Bench.rt[h.i] : null, bind = r && r.bind >= 0;
    this.set(F.driver.out.gain, screw ? X.driver * (bind ? 0.6 : 1) : 0, now, 0.03);
    if (screw) this.set(F.driver.oscs[0].frequency, sndHz(-9) * (bind ? 0.7 : 1 + 0.25 * ((r && r.p) || 0)), now, 0.05);
    const joint = h && h.what === 'joint', heat = joint ? Bench.heat[h.k + ':' + h.ji] || 0 : 0;
    this.set(this.bands.sizzle.g.gain, joint ? X.sizzle * sndClamp(0.3 + heat, 0, 1.6) : 0, now, 0.05);
  },
  // Voices: someone's words said aloud in a talk, a few letters at a time in
  // their own voice; a line over someone's head, where they stand.
  voices(now) {
    if (Talk.typer && Talk.typer.busy && Talk.n && now >= this.blipAt) { this.blipAt = now + sndRange(0.07, 0.11); snd('blip', { pitch: sndVoiceOf(Talk.n.def.name) }); }
    let top = this.said || 0, who = null;
    for (const n of Actors.npcs) if (n.bubble && !n.hidden && (n.bubble.seq || 0) > top) { top = n.bubble.seq || 0; who = n; }
    if (who && this.said !== null) snd('murmur', { x: who.x, y: who.y - 20, pitch: sndVoiceOf(who.def.name) });
    this.said = top;
  },
  // What's near you: a tube's or a bad sign's buzz, a vent's steam, a fire's
  // crackle; louder the nearer (asked a few times a second).
  nearby(now, play) {
    const X = T.sound, F = this.fx;
    if (!play) { this.set(F.buzz.out.gain, 0, now, 0.3); this.set(this.bands.steam.g.gain, 0, now, 0.3); return; }
    if (now >= this.nearAt) {
      this.nearAt = now + 0.15;
      const L = World.L, px = Player.x, py = Player.y - 16, close = (x, y, r) => { const d = Math.hypot(x - px, y - py); return d >= r ? 0 : (1 - d / r) * (1 - d / r); };
      let buzz = 0, steam = 0, fire = null, fd = 0;
      for (const f of L.flicks) buzz = Math.max(buzz, close((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 90) * (f.fl.mode === 'bad' ? 1 : f.fl.mode === 'tube' ? 0.6 : 0.25));
      for (const v of L.vents) if (v.kind === 'steam') steam = Math.max(steam, close(v.x, v.y, 110));
      for (const l of L.lights) if (l.flick && l.flick.mode === 'fire') { const k = close(l.x, l.y, 120); if (k > fd) { fd = k; fire = l; } }
      this.near = { buzz, steam, fire, fd };
    }
    const N = this.near;
    this.set(F.buzz.out.gain, X.buzz * N.buzz, now, 0.2);
    this.set(this.bands.steam.g.gain, X.steam * N.steam, now, 0.3);
    if (N.fire && now >= this.crackAt) { this.crackAt = now + sndRange(0.1, 0.5); const w = this.S.where({ x: N.fire.x, y: N.fire.y }), o = this.S.cueOut(now, X.fire * N.fd, w.pan); sndCrackle(this.S, o, now, 1 + Math.floor(sndRand() * 3), 0.2, 0.8, 1800); this.S.cueDone(o); }
  },
});
Snd.score = Music;
