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
  if (Game.fadeTo) { Game.fade += dt * 3; if (Game.fade >= 1) { const f = Game.fadeTo; Game.fadeTo = null; Game.arrive(f.level, f.spawn); } return; }
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
// them at a lower resolution, a step at a time
const Perf = {
  t: 0, n: 0,
  check(dt) {
    if (Game.paused || Flight.on || document.hidden) { this.t = this.n = 0; return; }
    this.t += dt; this.n++;
    if (this.t < 2) return;
    const fps = this.n / this.t; this.t = this.n = 0;
    if ((Dev.s.res || 'auto') === 'auto' && fps < 40 && View.q > 1) { View.q--; View.resize(); }
  },
};
function loop(now) {
  const dt = Math.min(0.1, (now - (Game.last || now)) / 1000); Game.last = now; Dev.frame(dt); Perf.check(dt);
  if (!Game.paused) { Game.acc += dt; let n = 0; while (Game.acc >= 1 / 60 && n < 4) { step(1 / 60); Game.acc -= 1 / 60; n++; } if (n >= 4) Game.acc = 0; }
  else Game.acc = 0;
  render(); Hud.tick();
  if (performance.now() - now < 9 || Game.frame % 4 === 0) Paint.ahead(Game.cam.x, Game.cam.y);
  requestAnimationFrame(loop);
}
addEventListener('load', () => setTimeout(boot, 30));
