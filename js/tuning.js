'use strict';
// ---------------------------------------------------------------------------
// Every number the game runs on. Positions are world pixels, which are also
// art pixels; the view shows about T.view.min px on its shorter side, scaled
// up by whole device pixels.
// ---------------------------------------------------------------------------
const T = {
  view: { min: 200, maxScale: 8 },
  chunk: 256,
  // the runner: a walk, a run (speed) and a sprint, px/s, by how far the stick's
  // pushed (`pace`: a walk under walkUnder, up to the run over runSpan, then
  // past sprintFrom up to the sprint over sprintSpan; the stick's radius in
  // CSS px, and the keys' run, walk and sprint as pushes of it)
  player: {
    w: 10, h: 30, speed: 98, walk: 56, sprint: 196, accel: 1000, airAccel: 640, friction: 1300,
    jump: 232, gravity: 720, maxFall: 400, coyote: 0.1, climb: 62,
  },
  pace: { walkUnder: 0.45, runSpan: 0.1, sprintFrom: 0.78, sprintSpan: 0.12 },
  stick: { radius: 46, keys: 0.66, walk: 0.5, sprint: 1.6 },
  day: { length: 1200, start: 20.5 }, // seconds in a day; the clock starts at 20:30
  light: { lamp: 70 }, // the runner's work lamp
  // knowing people (known.js): how familiar someone is with you is Voice's,
  // half a point a talk and a point a thing learned about them
  known: {
    land: 0.2, landMax: 1, // in a talk, everything you say lands this much better a point, up to the most (Voice's familiarLand)
    recall: 1, // asking after something they told you lands this much better (Voice's recallLand)
    report: 0.1, reportMax: 0.6, // a witness who knows you is this much less likely to report you a point, up to the most (Wormtongue's familiarReport)
    haggle: 0.05, haggleMax: 0.25, // on a job's pay they'll go a quarter more, and this much more a point, up to the most
    price: 0.025, priceMax: 0.12, // at their stall or counter, this much better for you a point (what they pay, what you pay), up to the most
    friend: 0.1, // a friend's price, on top of that
    favor: 4, // known this well, they offer what they'd offer nobody else (a friend's price, a lead, a job)
    bands: [1, 2.5, 4], // how well you know each other: a face you know, an acquaintance, you know each other, well
  },
  // a talk (talk.js): a subject about what was just said is worth this much
  // more among those offered (Voice's followPull)
  talk: { follow: 3 },
  // sound (sound.js, music.js): the mix (the master, the music's and the
  // effects' levels, the space's echoes, voices at once, the least gap
  // between two plays of a cue; full within near[0] px of the runner, gone at
  // near[1], panned dx / panW up to panMax) and soft, a setting at soft.
  // The music: its beat scheduled `ahead` s; each chord a phrase this likely
  // (keysChance, kotoChance); the arpeggio's, the beat's, the keys' and the
  // koto's levels; heat from heatFrom brings the dark layer in up to
  // heatDark; the music ducks to duckTalk while someone's speaking and to
  // duckBench at the bench. The places' sound: their bands (bed), events,
  // rain open and on a roof; what's held (the cutter, the driver, the iron's
  // sizzle) and what's near (a tube's buzz, a vent's steam, a fire), and the
  // cab's engine in flight.
  sound: {
    master: 0.9, music: 0.45, sfx: 0.85, space: 0.3, voices: 14, gap: 0.03, near: [60, 320], panW: 260, panMax: 0.7, soft: 0.4,
    ahead: 0.3, keysChance: 0.45, kotoChance: 0.55, arp: 0.07, beat: 0.12, keys: 0.12, koto: 0.11,
    heatFrom: 40, heatDark: 0.8, duckTalk: 0.65, duckBench: 0.75,
    bed: 1.8, events: 0.22, rain: 0.055, roof: 0.045,
    cutter: 0.035, driver: 0.03, sizzle: 0.05, buzz: 0.012, steam: 0.06, fire: 0.08, engine: 0.06,
  },
};
