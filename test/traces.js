'use strict';
// The runner's movement, held to traces recorded from the code as it was
// before it moved onto Tycho's mover (Tycho.move.Platform): walking, running
// at every pace, stopping, turning in the air, short hops and full jumps,
// running up stairs and onto walkways, jumping up through them and dropping
// back down, stepping up ledges, walls and ceilings, coyote jumps, ladders up
// and down, jumping and stepping off them, and long falls; then seeded
// stretches of random input in a few places. Each trace starts the runner
// somewhere, plays its input a frame at a time through Player.step(1/60),
// and must give the same position every frame and the same full state
// (velocity, footing, timers, ladder, facing, distance walked) bit for bit.
//   node test/traces.js            replay test/traces.json and compare
//   node test/traces.js --record   record it again from the code as it is
//                                  (only ever from code that moves as it should)
const fs = require('fs'), path = require('path');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const ROOT = path.join(__dirname, '..'), FILE = path.join(__dirname, 'traces.json');
const record = process.argv.includes('--record');

// In the page: run a trace's input through the runner a frame at a time.
// A segment is [frames, ax, ay, jump held, jump pressed on its first frame].
const PAGE = `
window.TR = {
  begin(t) {
    Game.arrive(t.level, Object.keys(World.L && World.L.id === t.level ? World.L.spawns : (LEVELS[t.level].built || LEVELS[t.level].make()).spawns)[0]);
    Hud.toggle(null); Game.fade = 0; Game.fadeTo = null;
    Player.place(t.at[0], t.at[1]);
    Object.assign(Player, { face: 1, coyote: 0, drop: 0, walked: 0, vx: 0, vy: 0, hold: null });
    Input.bot = null; Input.jumpHit = false; Input.useHit = false; Input.ax = Input.ay = 0; Input.jump = Input.use = false;
  },
  full() { const P = Player; return [P.x, P.y, P.vx, P.vy, P.ground ? 1 : 0, P.coyote, P.drop, P.face, P.walked, World.L.ladders.indexOf(P.ladder)]; },
  flags() { const P = Player; return (P.ground ? 1 : 0) + (P.drop > 0 ? 2 : 0) + (P.coyote > 0 ? 4 : 0) + (World.L.ladders.indexOf(P.ladder) + 1) * 8; },
  hash(h, s) { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; },
  frame(seg, first) {
    Input.bot = { ax: seg[1], ay: seg[2], jump: !!seg[3] };
    if (first && seg[4]) Input.jumpHit = true;
    Player.step(1 / 60);
    Game.fadeTo = null; Game.fade = 0;
    return [Player.x, Player.y, this.flags()];
  },
  // a trace's input played through: every frame's position and footing, and
  // one hash of every frame's full state
  play(t) {
    this.begin(t);
    const frames = []; let h = 2166136261;
    for (const seg of t.input) for (let i = 0; i < seg[0]; i++) { frames.push(this.frame(seg, i === 0)); h = this.hash(h, JSON.stringify(this.full())); }
    Input.bot = null;
    return { frames, hash: h, end: this.full() };
  },
  // recording: a script of moves, some for a set number of frames and some
  // until the runner gets somewhere (the count found is what's kept)
  script(t, moves) {
    this.begin(t);
    const input = [];
    for (const m of moves) {
      // (to: walk toward x at a pace until there, or past it)
      const dir = m.to !== undefined ? Math.sign(m.to - Player.x) : 0;
      const seg = [0, m.to !== undefined ? dir * m.pace : m.ax || 0, m.ay || 0, m.jump ? 1 : 0, m.hit ? 1 : 0];
      const until = m.to !== undefined ? (P) => Math.abs(P.x - m.to) < 2 || Math.sign(m.to - P.x) !== dir : m.until ? new Function('P', 'L', 'return ' + m.until) : null;
      const max = m.n || 600;
      for (let i = 0; i < max; i++) { if (until && until(Player, World.L)) break; this.frame(seg, i === 0); seg[0]++; }
      if (seg[0]) input.push(seg);
    }
    Input.bot = null;
    return input;
  },
  // seeded random input: the stick and the buttons changed every 6 to 40 frames
  fuzz(t, n, seed) {
    const r = new Rng(seed), input = []; let left = n;
    const AX = [-1, -1, -0.75, -0.5, -0.3, 0, 0, 0.3, 0.5, 0.75, 1, 1], AY = [-1, 0, 0, 0, 0, 1];
    while (left > 0) { const k = Math.min(left, r.i(6, 40)); input.push([k, r.pick(AX), r.pick(AY), r.f() < 0.5 ? 1 : 0, r.f() < 0.35 ? 1 : 0]); left -= k; }
    return input;
  },
};
true`;

// What each trace does (recording only: the input found is kept in the file).
const SCRIPTS = [
  { name: 'noodles: walk and run into the walls, stop, turn, hop and jump', level: 'd_noodles', at: [340, 386], moves: [
    { n: 50, ax: -0.4 }, { n: 40, ax: -0.62 }, { n: 30, ax: -0.75 }, { until: 'P.vx === 0', ax: -1, n: 300 }, { n: 20, ax: -1 }, { n: 30 },
    { n: 6, jump: 1, hit: 1 }, { n: 40 }, { n: 70, jump: 1, hit: 1 }, { n: 20 },
    { n: 30, ax: 1, jump: 1, hit: 1 }, { n: 12, ax: -1, jump: 1 }, { n: 30, ax: 1 }, { until: 'P.vx === 0', ax: 1, n: 600 },
    { n: 50, ax: 1, jump: 1, hit: 1 }, { n: 20, ax: 0.5 }, { n: 25, ax: -1 }, { n: 15, ax: 1 }, { n: 40 },
    { n: 3, jump: 1, hit: 1 }, { n: 3, hit: 1 }, { n: 1, ay: 1, hit: 1 }, { n: 50 },
  ] },
  { name: 'docks: up the stairs onto the crates, up through a walkway and down through it, a drop that jumps over a crate, the short ladders', level: 'd_docks', at: [720, 386], moves: [
    { until: 'P.x >= 850', ax: 1 }, { n: 45, ax: 0.3, jump: 1, hit: 1 }, { n: 20 },
    { n: 1, ay: 1, hit: 1 }, { n: 40, ay: 1 }, { n: 10 }, { n: 1, ay: 1, hit: 1 }, { n: 50 },
    { to: 870, pace: 0.4, n: 200 }, { n: 10, ay: -1 }, { n: 40, ay: -1 }, { n: 20 },
    { until: 'P.x >= 980 || !P.ground', ax: 1, n: 300 }, { n: 60, ax: 1 },
    { to: 1050, pace: 0.4, n: 300 }, { n: 50, ay: -1 }, { n: 30, ax: 1 }, { n: 30 },
    { to: 1050, pace: 0.4, n: 200 }, { n: 50, ay: 1 }, { n: 20 },
    { until: 'P.x >= 1300', ax: 1, n: 400 }, { n: 20 }, { until: 'P.x <= 760', ax: -1, n: 600 }, { n: 20 },
  ] },
  { name: 'docks: the tall ladder up to the gantry, off its end, back up, down, jumped off and let go of', level: 'd_docks', at: [2400, 386], moves: [
    { to: 2462, pace: 0.5, n: 400 }, { n: 10 }, { n: 140, ay: -1 }, { n: 20 },
    { until: 'P.x <= 2410', ax: -0.5, n: 200 }, { n: 50 },
    { to: 2462, pace: 0.5, n: 400 }, { n: 60, ay: -1 }, { n: 20 }, { n: 30, ay: 1 }, { n: 1, ay: 0.2, hit: 1 }, { n: 50 },
    { to: 2462, pace: 0.5, n: 300 }, { n: 70, ay: -1 }, { n: 10, ax: -1 }, { n: 50 },
    { to: 2462, pace: 0.5, n: 300 }, { n: 140, ay: -1 }, { n: 10, ay: 1 }, { n: 130, ay: 1 }, { n: 20 },
  ] },
  { name: 'cables: up a ladder to a walkway, down through it, up again, across the ramp, coyote jumps off edges, jumped off a ladder', level: 'd_cables', at: [340, 386], moves: [
    { to: 370, pace: 0.5, n: 200 }, { n: 110, ay: -1 }, { until: 'P.x >= 500', ax: 0.6, n: 300 }, { n: 10 },
    { n: 1, ay: 1, hit: 1 }, { n: 60, ay: 0.8 }, { to: 370, pace: 0.5, n: 300 }, { n: 110, ay: -1 },
    { until: 'P.x >= 760', ax: 1, n: 500 }, { until: 'P.x >= 1060 || !P.ground', ax: 1, n: 500 }, { n: 4, ax: 1 }, { n: 30, ax: 1, jump: 1, hit: 1 }, { n: 50 },
    { to: 1870, pace: 1, n: 900 }, { n: 50, ay: -1 }, { n: 40, ax: -1, jump: 1, hit: 1 }, { n: 50 },
    { to: 1870, pace: 0.5, n: 300 }, { n: 80, ay: -1 }, { until: 'P.x >= 1890 || !P.ground', ax: 1, n: 200 }, { n: 7, ax: 1 }, { n: 40, ax: 1, jump: 1, hit: 1 }, { n: 50 },
  ] },
  { name: 'gardens: up and down the stairs of the raised beds and over the hump, running and walking, jumping and dropping on slopes', level: 'd_gardens', at: [600, 386], moves: [
    { until: 'P.x >= 1060', ax: 1, n: 600 }, { until: 'P.x <= 700', ax: -0.5, n: 1200 }, { n: 10 }, { n: 1, ay: 1, hit: 1 }, { n: 40 },
    { until: 'P.x >= 700', ax: 1 }, { n: 40, ax: 1, jump: 1, hit: 1 },
    { until: 'P.x >= 1140', ax: 0.7, n: 600 }, { n: 30, jump: 1, hit: 1 }, { n: 20 }, { until: 'P.x >= 1300', ax: 1 }, { n: 20 },
    { until: 'P.x <= 990', ax: -1, n: 600 }, { n: 30, ax: -1, jump: 1, hit: 1 }, { n: 30 },
  ] },
  { name: 'scrapyard: the stairs up the heap and down, into the stack\'s wall, up the ladder by it onto its top', level: 'd_scrapyard', at: [1050, 386], moves: [
    { until: 'P.x >= 1250', ax: 1, n: 600 }, { until: 'P.x >= 1420', ax: 1, n: 600 }, { n: 20 },
    { until: 'P.x >= 2100', ax: 1, n: 900 }, { until: 'P.vx === 0', ax: 1, n: 300 }, { n: 20, ax: 1 }, { n: 50, ax: 1, jump: 1, hit: 1 }, { n: 20 },
    { n: 20, ax: -1 }, { n: 30 },
  ] },
  { name: 'scrapyard: up the ladder beside the stack and onto its top, off the far end', level: 'd_scrapyard', at: [2320, 386], moves: [
    { to: 2268, pace: 0.4, n: 300 }, { n: 100, ay: -1 }, { n: 30, ax: -1 }, { n: 30 },
    { until: 'P.x <= 2120 || !P.ground', ax: -1, n: 400 }, { n: 60 },
  ] },
  { name: 'skybridge: up to the bridge, down through it, off its end and down a long fall, a coyote jump, up the stairs and the ladder to the deck', level: 'd_skybridge', at: [760, 386], moves: [
    { to: 820, pace: 0.5, n: 300 }, { n: 130, ay: -1 }, { until: 'P.x >= 950', ax: 1, n: 300 }, { n: 1, ay: 1, hit: 1 }, { n: 60 },
    { to: 820, pace: 1, n: 600 }, { n: 130, ay: -1 }, { until: 'P.x >= 1110 || !P.ground', ax: 1, n: 600 }, { n: 70 },
    { to: 820, pace: 1, n: 600 }, { n: 130, ay: -1 }, { until: '!P.ground', ax: -1, n: 300 }, { n: 3, ax: -1 }, { n: 40, ax: -1, jump: 1, hit: 1 }, { n: 50 },
    { until: 'P.x >= 1860', ax: 1, n: 900 }, { until: 'P.x >= 2060', ax: 1, n: 600 }, { to: 2096, pace: 0.4, n: 200 }, { n: 110, ay: -1 }, { n: 40, ax: -1 }, { n: 30 },
  ] },
];
const FUZZ = [
  { name: 'docks: random input round the crates and walkways', level: 'd_docks', at: [900, 364], n: 600, seed: 11 },
  { name: 'cables: random input under the walkways and their ladders', level: 'd_cables', at: [400, 386], n: 600, seed: 23 },
  { name: 'gardens: random input on the slopes', level: 'd_gardens', at: [760, 356], n: 600, seed: 37 },
  { name: 'skybridge: random input by the stairs and the deck', level: 'd_skybridge', at: [1990, 306], n: 600, seed: 41 },
  { name: 'scrapyard: random input on the heap', level: 'd_scrapyard', at: [1250, 332], n: 600, seed: 53 },
  { name: 'noodles: random input between the walls', level: 'd_noodles', at: [470, 386], n: 400, seed: 67 },
];

async function main() {
  const kit = await tk.launch();
  const server = await tk.serve(ROOT);
  const failures = [];
  try {
    const { page, errors } = await tk.open(kit, { url: server.url + 'index.html?nogl', viewport: tk.DESKTOP, ready: '!!window.Downlevel', timeout: 60000 });
    await page.evaluate(() => { Save.wipe(); });
    await page.reload();
    await tk.waitFor(page, '!!window.Downlevel', { timeout: 60000 });
    await page.evaluate(PAGE);
    if (record) {
      const traces = [];
      for (const s of SCRIPTS) traces.push({ name: s.name, level: s.level, at: s.at, input: await page.evaluate((a) => TR.script(a.s, a.s.moves), { s }) });
      for (const s of FUZZ) traces.push({ name: s.name, level: s.level, at: s.at, input: await page.evaluate((a) => TR.fuzz(a.s, a.s.n, a.s.seed), { s }) });
      for (const t of traces) Object.assign(t, await page.evaluate((a) => TR.play(a.t), { t }));
      const lines = traces.map((t) => '    ' + JSON.stringify(t));
      fs.writeFileSync(FILE, '{\n  "about": "The runner\'s positions frame by frame (x, y, footing: 1 on the ground, 2 dropping through, 4 coyote time, 8 × (ladder + 1)), recorded from the original code by node test/traces.js --record; hash covers every frame\'s full state.",\n  "traces": [\n' + lines.join(',\n') + '\n  ]\n}\n');
      console.log(`traces: recorded ${traces.length} traces, ${traces.reduce((n, t) => n + t.frames.length, 0)} frames`);
    } else {
      const want = JSON.parse(fs.readFileSync(FILE, 'utf8')).traces;
      let frames = 0;
      for (const t of want) {
        const got = await page.evaluate((a) => TR.play(a.t), { t: { level: t.level, at: t.at, input: t.input } });
        frames += got.frames.length;
        const k = got.frames.findIndex((f, i) => !t.frames[i] || f[0] !== t.frames[i][0] || f[1] !== t.frames[i][1] || f[2] !== t.frames[i][2]);
        if (k >= 0 || got.frames.length !== t.frames.length) failures.push(`${t.name}: frame ${k} is ${JSON.stringify(got.frames[k])}, was ${JSON.stringify(t.frames[k])}`);
        else if (got.hash !== t.hash) failures.push(`${t.name}: the positions agree but the full state doesn't (ended ${JSON.stringify(got.end)}, was ${JSON.stringify(t.end)})`);
      }
      console.log(`traces: ${want.length} traces, ${frames} frames replayed`);
    }
    for (const e of errors) failures.push('page error: ' + e);
  } finally {
    await kit.close(); await server.close();
  }
  tk.finish('traces', failures);
}
main().catch((e) => { console.error(e); process.exit(1); });
