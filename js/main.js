'use strict';
// ---------------------------------------------------------------------------
// Boot, and the loop: fixed steps of 1/60 s, a camera that follows, a frame,
// and a spare chunk painted ahead of the camera when there's time.
// ---------------------------------------------------------------------------
function boot() {
  Dev.load(); Census.take(); Folk.make(); Town.init(); // (the city's places, its people, the block's written days)
  const loaded = Save.start();
  if (!loaded) Tutorial.begin(); // (a new game: the first job's on the bench)
  City.init(); // the residents' minds (Tyrell), from the save if there is one
  View.init(); Input.init();
  World.load(Game.s.level);
  const sp = World.L.spawns[Game.s.spawn] || Object.values(World.L.spawns)[0];
  if (loaded && Game.s.px) Player.place(Game.s.px, Game.s.py); else Player.place(sp[0], sp[1]);
  Actors.load(); Life.load();
  Game.cam.x = Player.x; Game.cam.y = Player.y - 30;
  Hud.init();
  if (loaded) Game.toast('Back at ' + World.L.name + '.'); else Hud.toggle('intro'); // (a new game opens on how things stand)
  addEventListener('visibilitychange', () => { if (document.hidden) Save.write(); });
  addEventListener('pagehide', () => Save.write());
  $('loading').hidden = true;
  Pwa.init(); Flight.init();
  window.Downlevel = { Game, World, Player, Actors, Save };
  requestAnimationFrame(loop);
}
function step(dt) {
  Game.t += dt; Game.frame++;
  if (Flight.on) { Flight.step(dt); return; }
  // between levels: fade out, arrive, fade in
  if (Game.fadeTo) { Game.fade += dt * 3; if (Game.fade >= 1) { const f = Game.fadeTo; Game.fadeTo = null; if (f.hours) Game.pass(f.hours); if (f.stay) { Actors.spawns(); Save.write(); } else Game.arrive(f.level, f.spawn); } return; }
  if (Game.fade > 0) Game.fade = Math.max(0, Game.fade - dt * 2.5);
  if (!Dev.s.freeze) Game.pass(dt * 24 / T.day.length);
  Player.step(dt);
  Actors.step(dt);
  Life.step(dt);
  Fx.step(dt);
  // the camera leads a little the way you face
  const tx = Player.x + Player.face * 24, ty = Player.y - 52 + clamp(Player.vy * 0.12, -10, 30);
  Game.cam.x += (tx - Game.cam.x) * Math.min(1, dt * 5); Game.cam.y += (ty - Game.cam.y) * Math.min(1, dt * 6);
  if (Game.t - Save.last > 8) Save.write();
}
// frames running slow (under 40 a second for two seconds of play): finish
// them at a lower resolution, a step at a time (Tycho's governor)
const Perf = new Tycho.loop.Governor({ window: 2, below: 40, lower: () => {
  if ((Dev.s.res || 'auto') !== 'auto' || View.q <= 1) return false;
  View.q--; View.resize(); return true;
} });
// fixed steps of 1/60 s, at most four a frame (then the rest is dropped, so
// a slow phone slows down rather than walking through walls)
const Steps = new Tycho.loop.Stepper({ dt: 1 / 60, max: 4 });
function loop(now) {
  const dt = Steps.since(now); Dev.frame(dt); Perf.check(dt, !(Game.paused || Flight.on || document.hidden));
  if (!Game.paused) Steps.advance(dt, step); else Steps.hold();
  render(); Hud.tick();
  if (performance.now() - now < 9 || Game.frame % 4 === 0) Paint.ahead(Game.cam.x, Game.cam.y);
  requestAnimationFrame(loop);
}
addEventListener('load', () => setTimeout(boot, 30));
