'use strict';
// ---------------------------------------------------------------------------
// Every number the game runs on. Positions are world pixels, which are also
// art pixels; the view shows about T.view.min px on its shorter side, scaled
// up by whole device pixels.
// ---------------------------------------------------------------------------
const T = {
  view: { min: 200, maxScale: 8 },
  chunk: 256,
  player: {
    w: 10, h: 30, speed: 72, accel: 1000, airAccel: 640, friction: 1300,
    jump: 232, doubleJump: 205, gravity: 720, maxFall: 400, coyote: 0.1, climb: 62,
    hp: 100, iframes: 0.7,
  },
  strike: { reach: 20, dmg: 12, mantis: 26, cd: 0.32, knock: 120 },
  // cutting things open: seconds at tier 1; the mantis arms are quicker
  cut: { speedMantis: 1.7 },
  pack: { cap: 24 },
  ram: { max: 3, regen: 7 },
  neural: { base: 5, booster: 1 },
  day: { length: 1200, start: 20.5 }, // seconds in a day; the clock starts at 20:30
  light: { bands: 9, lamp: 70, lowlight: 0.34 },
};
