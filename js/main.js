'use strict';
// ---------------------------------------------------------------------------
// Boot, and the loop: fixed steps of 1/60 s, a camera that follows, a frame,
// and a spare chunk painted ahead of the camera when there's time.
// ---------------------------------------------------------------------------
function boot() {
  const loaded = Save.start();
  View.init(); Input.init();
  World.load(Game.s.level);
  const sp = World.L.spawns[Game.s.spawn] || Object.values(World.L.spawns)[0];
  if (loaded && Game.s.px) Player.place(Game.s.px, Game.s.py); else Player.place(sp[0], sp[1]);
  Actors.load();
  Game.cam.x = Player.x; Game.cam.y = Player.y - 30;
  Hud.init();
  Game.toast(loaded ? 'Back on ' + World.L.name + '.' : 'Your capsule on the Stack. Rent\'s due, the rain hasn\'t stopped, and the city goes down further than anyone has mapped.');
  if (!loaded) setTimeout(() => Game.toast('Strip machines for parts (hold Use). Juno at the bar has work. The ripperdoc is next door.'), 2500);
  addEventListener('visibilitychange', () => { if (document.hidden) Save.write(); });
  addEventListener('pagehide', () => Save.write());
  $('loading').hidden = true;
  window.Downlevel = { Game, World, Player, Actors, Save };
  requestAnimationFrame(loop);
}
function step(dt) {
  Game.t += dt; Game.frame++;
  // between levels: fade out, arrive, fade in
  if (Game.fadeTo) { Game.fade += dt * 3; if (Game.fade >= 1) { const f = Game.fadeTo; Game.fadeTo = null; Game.arrive(f.level, f.spawn); } return; }
  if (Game.fade > 0) Game.fade = Math.max(0, Game.fade - dt * 2.5);
  Game.pass(dt * 24 / T.day.length);
  Game.ghost = Math.max(0, Game.ghost - dt);
  Player.step(dt);
  Actors.step(dt);
  Fx.step(dt);
  // the camera leads a little the way you face
  const tx = Player.x + Player.face * 24, ty = Player.y - 52 + clamp(Player.vy * 0.12, -10, 30);
  Game.cam.x += (tx - Game.cam.x) * Math.min(1, dt * 5); Game.cam.y += (ty - Game.cam.y) * Math.min(1, dt * 6);
  if (Game.t - Save.last > 8) Save.write();
}
function loop(now) {
  const dt = Math.min(0.1, (now - (Game.last || now)) / 1000); Game.last = now;
  if (!Game.paused) { Game.acc += dt; let n = 0; while (Game.acc >= 1 / 60 && n < 6) { step(1 / 60); Game.acc -= 1 / 60; n++; } if (n >= 6) Game.acc = 0; }
  else Game.acc = 0;
  render(); Hud.tick();
  if (performance.now() - now < 9 || Game.frame % 4 === 0) Paint.ahead(Game.cam.x, Game.cam.y);
  requestAnimationFrame(loop);
}
addEventListener('load', () => setTimeout(boot, 30));
