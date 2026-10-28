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
    jump: 232, gravity: 720, maxFall: 400, coyote: 0.1, climb: 62,
  },
  day: { length: 1200, start: 20.5 }, // seconds in a day; the clock starts at 20:30
  light: { lamp: 70 }, // the runner's work lamp
};
