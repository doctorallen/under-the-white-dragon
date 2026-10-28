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
};
