'use strict';
// ---------------------------------------------------------------------------
// Boot, and the loop: fixed steps of 1/60 s, a camera that follows, a frame.
// ---------------------------------------------------------------------------
function boot() {
  const loaded = Save.start();
  Ladders.load();
  View.init(); Input.init();
  const sp = World.home.spawn;
  if (loaded && Game.s.px) Player.place(Game.s.px, Game.s.py); else Player.place(sp.x, sp.y);
  Game.cam.x = Player.x; Game.cam.y = Player.y - 20;
  Hud.init();
  if (!loaded) Game.toast('Your burrow under the hill. Something odd is down there. Dig with J (or the Dig button).');
  else Game.toast('Welcome back.');
  addEventListener('visibilitychange', () => { if (document.hidden) Save.write(); });
  addEventListener('pagehide', () => Save.write());
  window.Underhill = { Game, World, Player, Save, Craft }; // for tests and poking about
  requestAnimationFrame(loop);
}
function step(dt) {
  Game.t += dt; Game.frame++;
  Player.step(dt);
  Fx.step(dt);
  // the camera leads a little the way you face, and down when you're falling
  const tx = Player.x + Player.face * 14, ty = Player.y - 20 + clamp(Player.vy * 0.15, -10, 30);
  Game.cam.x += (tx - Game.cam.x) * Math.min(1, dt * 6); Game.cam.y += (ty - Game.cam.y) * Math.min(1, dt * 7);
  const W = World.w * T.tile, H = World.h * T.tile;
  Game.cam.x = clamp(Game.cam.x, View.w / 2, W - View.w / 2); Game.cam.y = clamp(Game.cam.y, -200 + View.h / 2, H - View.h / 2);
  if (Game.t - Save.last > 8) Save.write();
}
function loop(now) {
  const dt = Math.min(0.1, (now - (Game.last || now)) / 1000); Game.last = now;
  if (!Game.paused) { Game.acc += dt; while (Game.acc >= 1 / 60) { step(1 / 60); Game.acc -= 1 / 60; } }
  else Game.acc = 0;
  render(); Hud.tick();
  requestAnimationFrame(loop);
}
addEventListener('load', boot);
