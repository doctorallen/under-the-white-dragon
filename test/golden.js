'use strict';
// Golden values: what the city is and how it's painted, pinned so a change to
// the engine underneath (Tycho) that changes a level, a painted chunk, a
// sprite or a frame shows up. Recorded in test/golden.json; after a change
// that's meant, `node test/golden.js --update` writes them again (and the
// commit says why).
//   levels  every level's shape (solids, walkways, ladders, props, people)
//   paint   every level's painted chunks (color and glow) and its far layers
//   sprites the runner in every pose, the people in a few poses, every prop
//   frames  the lit picture and its glow, the 2D path's finished frame, in a
//           few places by day and by night (?nogl)
const path = require('path');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const ROOT = path.join(__dirname, '..'), FILE = path.join(__dirname, 'golden.json');

async function main() {
  const kit = await tk.launch();
  const server = await tk.serve(ROOT);
  const failures = [];
  try {
    const { page, errors } = await tk.open(kit, { url: server.url + 'index.html?nogl', viewport: tk.DESKTOP, ready: '!!window.Downlevel', timeout: 60000 });
    await page.evaluate(() => { Save.wipe(); });
    await page.reload();
    await tk.waitFor(page, '!!window.Downlevel', { timeout: 60000 });
    await page.evaluate(tk.PAGE);
    const now = await page.evaluate(() => {
      const enc = new TextEncoder(), hs = (s) => TK.hash(enc.encode(s)), out = {};
      const can = (c) => (c ? TK.canvas(c) : '-');
      const spr = (s) => (s ? TK.canvas(s) + '@' + s.ax + ',' + s.ay : '-');
      Hud.toggle(null);
      // the levels and their painting
      for (const id of Object.keys(LEVELS).sort()) {
        World.load(id);
        const L = World.L, CS = T.chunk;
        out['levels.' + id] = hs(JSON.stringify({
          w: L.w, h: L.h, solids: L.solids, ways: L.ways, ladders: L.ladders, spawns: L.spawns, lights: L.lights.map((l) => [Math.round(l.x), Math.round(l.y), l.r, l.c, l.k]),
          props: L.props.map((p) => [p.kind, p.id, Math.round(p.x), Math.round(p.y), p.label || '', p.to || '']),
          npcs: (L.npcs || []).map((n) => [n.name, n.title || '', Math.round(n.x)]),
        }));
        const chunks = [];
        for (let cy = 0; cy * CS < L.h; cy++) for (let cx = 0; cx * CS < L.w; cx++) { const k = Paint.get(cx, cy); chunks.push(can(k.c) + '/' + can(k.e)); }
        Paint.reset(L);
        out['paint.' + id] = hs(chunks.join('|') + '#' + (World.far ? can(World.far.c) + can(World.far.e) : '') + '#' + World.layers.map((F) => can(F.c) + can(F.e)).join(','));
        out['props.' + id] = hs(World.props.map((p) => spr(Props.sprite(p))).join('|'));
      }
      // the runner, every pose both ways
      const poses = Object.keys(POSE_HANDS).concat([0, 1, 2, 3, 4, 5].map((i) => 'walk' + i), [0, 1, 2, 3, 4, 5].map((i) => 'run' + i));
      out['sprites.runner'] = hs(poses.map((p) => spr(RunnerArt.get(p, false)) + spr(RunnerArt.get(p, true))).join('|'));
      // the block's own people, and a sample of everyone else, in a few poses and views
      const ids = Object.keys(RESIDENTS).sort(), some = ids.filter((id, i) => i < 24 || i % 9 === 0);
      out['sprites.people'] = hs(some.map((id) => {
        const look = RESIDENTS[id].look || {};
        return ['stand', 'walk2', 'sit'].map((pose) => spr(person(Object.assign({}, look, { pose, seed: 20 })))).join(',') + spr(person(Object.assign({}, look, { pose: 'sit', view: 'back', seed: 20 }))) + spr(person(Object.assign({}, look, { pose: 'sit', view: 'front', seed: 20 })));
      }).join('|'));
      out['sprites.people.count'] = some.length;
      // frames: a few places by day and by night
      const PLACES = ['d_cellar', 'd_dragon', 'd_noodles', 'd_neonrow', 'd_overpass', 'd_drain', 'd_gardens'].filter((id) => LEVELS[id]);
      for (const id of PLACES) for (const hour of [13, 22]) {
        Game.s.day = 3; Game.s.time = hour;
        Game.arrive(id, Object.keys((LEVELS[id].built || LEVELS[id].make()).spawns)[0]);
        Hud.toggle(null); Game.fade = 0; Game.fadeTo = null;
        for (let i = 0; i < 30; i++) step(1 / 60);
        Game.cam.x = Player.x; Game.cam.y = Player.y - 52;
        render();
        out[`frames.${id}.${hour}`] = can(View.low) + '/' + can(View.gl) + '/' + can(View.cv);
      }
      return out;
    });
    for (const e of errors) failures.push('page error: ' + e);
    failures.push(...tk.golden(FILE, now));
    console.log(`golden: ${Object.keys(now).length} values`);
  } finally {
    await kit.close(); await server.close();
  }
  tk.finish('golden', failures);
}
main().catch((e) => { console.error(e); process.exit(1); });
