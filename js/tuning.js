'use strict';
// ---------------------------------------------------------------------------
// Every number the game runs on. Positions are world pixels, which are also
// art pixels: one tile is T.tile px, and the view shows about T.view.min px
// on its shorter side, scaled up by whole device pixels.
// ---------------------------------------------------------------------------
const T = {
  tile: 12,
  view: { min: 180, maxScale: 6 },
  // the world: w tiles across, h tiles down; the surface lies about `surface`
  // tiles down, the hill over the burrow rises above that on the left
  world: { w: 128, h: 300, surface: 30, chunk: 32 },
  metresPerTile: 0.5,
  // the strata, by depth below the surface (tiles)
  strata: [
    { id: 'cellars', name: 'Cellars & roots', from: 0, to: 30 },
    { id: 'diggings', name: 'The Old Diggings', from: 30, to: 90 },
    { id: 'oldgrowth', name: 'Old Growth', from: 90, to: 190 },
    { id: 'seam', name: 'The Seam', from: 190, to: 270 },
  ],
  player: {
    w: 10, h: 22, speed: 64, accel: 900, airAccel: 520, friction: 1100,
    jump: 205, gravity: 620, maxFall: 330, climb: 46, coyote: 0.1,
  },
  // digging: seconds a tile takes, times its hardness, divided by the pick
  dig: { base: 0.28, reach: 1 },
  // the pack: slots to start with; curios stack to `stack`, ore to `oreStack`
  bag: { slots: 8, stack: 5, oreStack: 10 },
  torch: { reach: 54 },
  light: {
    bands: 9,
    // the ambient by depth below the surface (tiles): [depth, light]
    ambient: [[0, 1], [4, 0.86], [14, 0.6], [40, 0.42], [100, 0.32], [200, 0.27], [270, 0.3]],
    lantern: [84, 108, 136], // the lantern's reach by kit stage (px)
    lanternCol: [1.0, 0.86, 0.62],
  },
};
