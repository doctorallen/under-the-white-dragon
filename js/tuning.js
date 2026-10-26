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
    w: 10, h: 30, speed: 98, walk: 42, accel: 1000, airAccel: 640, friction: 1300,
    jump: 232, doubleJump: 205, gravity: 720, maxFall: 400, coyote: 0.1, climb: 62,
    hp: 100, iframes: 0.7,
  },
  // bolts: seconds per shot back, speed, life, aim range; each gun's damage,
  // shots and cycle are in GEAR (items.js)
  blaster: { recharge: 0.8, speed: 300, life: 0.9, range: 200 },
  // a blow: bare-handed damage, or the melee weapon's; the plasma cutter adds its own
  strike: { reach: 20, dmg: 12, cutter: 14, cd: 0.32, knock: 120 },
  // cutting things open: the plasma cutter is quicker
  cut: { speedCutter: 1.7 },
  ram: { max: 3, regen: 7 },
  day: { length: 1200, start: 20.5 }, // seconds in a day; the clock starts at 20:30
  light: { lamp: 70, lowlight: 0.34 },
};
