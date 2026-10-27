'use strict';
// The game played headlessly in Chrome, sideways on a phone and on a desktop:
// it boots without an error in the back room of the White Dragon (the desktop
// run without WebGL2, so the 2D path is played too); the bench and the shelf
// answer Use; a nav unit is opened, probed, fixed and powered up on the bench;
// Ozzy's job is taken, fixed, handed back and slept on; the vending machine
// out front gives a scrap part; there's no gun, and the help and the pack talk
// about the back room; the spinner flies to the Overpass Market, where Ana
// sells a part; the map and dev settings work; on Clinic Row Kade's stall
// opens, a ganger is taken down from behind and one in front notices, and the
// cabinet gives a Meridian servo and heat; a terminal is jacked into; Ozzy's
// cab flies home for free; a medpatch heals; every level loads and draws; a
// reload brings it all back.
// Screenshots go to test/out. Chrome comes from $CHROME (puppeteer-core), or,
// where that isn't installed, playwright's Chromium.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const PHONE = { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 };

function serve() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      // the deploy writes version.json; here it's a local build
      if (req.url.startsWith('/version.json')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"build": "local"}'); return; }
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
    });
    s.listen(0, () => ok(s));
  });
}
async function browser() {
  try {
    const pp = require('puppeteer-core');
    const b = await pp.launch({ executablePath: process.env.CHROME, headless: true, args: ['--no-sandbox'] });
    return { b, page: async (vp) => { const p = await b.newPage(); await p.setViewport(vp); return p; } };
  } catch (e) {
    if (process.env.CHROME) throw e;
    const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), '/opt/node22/lib/node_modules'] }));
    const b = await chromium.launch();
    return { b, page: async (vp) => b.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch }) };
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// helpers put into the page: step the game with the controls set
const HELPERS = `
window.T_ = {
  run(bot, n) { Input.bot = bot; for (let i = 0; i < n; i++) { if (Game.paused) break; step(1 / 60); } Input.bot = null; Input.ax = Input.ay = 0; Input.use = Input.jump = false; },
  tap(name, bot = {}) { Input[name] = true; this.run(bot, 2); },
  walkTo(x, max = 1800) { for (let i = 0; i < max && Math.abs(Player.x - x) > 3; i++) { Input.bot = { ax: Math.sign(x - Player.x) * (Math.abs(Player.x - x) < 12 ? 0.4 : 1) }; step(1 / 60); } Input.bot = null; this.run({}, 20); return Math.round(Player.x); },
  hold(n) { Input.useHit = true; this.run({ use: true }, n); },
};
true`;

async function run(B, url, vp, name, failures) {
  const fail = (m) => failures.push(name + ': ' + m);
  const page = await B.page(vp), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url); await sleep(800);
  await page.evaluate(() => Save.wipe()); await page.reload();
  for (let i = 0; i < 60 && !(await page.evaluate(() => !!window.Downlevel)); i++) await sleep(200);
  await sleep(600);
  await page.evaluate(HELPERS);
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${name}-${n}.png`) });
  const E = (fn, arg) => page.evaluate(fn, arg);
  console.log(name + ': finishing frames with ' + (await E(() => (GL.ok ? 'WebGL2' : '2D'))));
  const st = await E(() => ({ level: Game.s.level, x: Player.x, frame: Game.frame }));
  if (st.level !== 'd_dragon' || Math.abs(st.x - 1000) > 40) fail('the game does not start in the back room by the cot ' + JSON.stringify(st));
  if (!st.frame) fail('the loop is not running');
  await shot('backroom');
  // the bench and the shelf answer Use; the sign hangs out front
  const room = await E(() => {
    const at = (k) => World.props.find((p) => p.kind === k);
    T_.walkTo(at('workbench').x); const bench = Player.target && Player.target.p && Player.target.p.kind;
    T_.walkTo(at('shelf').x); const shelf = Player.target && Player.target.p && Player.target.p.kind;
    return { bench, shelf, sign: !!World.props.find((p) => p.id === 'wdsign'), lin: !!Actors.npcs.find((n) => n.def.name === 'Auntie Lin') };
  });
  if (room.bench !== 'workbench' || room.shelf !== 'shelf' || !room.sign || !room.lin) fail('the back room is not set up ' + JSON.stringify(room));
  // the bench: open a nav unit with a dead cell, find it, swap it, test it
  const fix = await E(() => {
    const B = Bench, hold = (x, y, n, fn) => { B.press(x, y); for (let k = 0; k < n; k++) { B.step(1 / 60); if (fn) fn(); } B.release(); };
    Bench.put('navunit', { name: 'A nav unit', parts: { cell: ['street', 'dead'] } });
    Parts.give(Parts.make('cell', 'street'), true);
    T_.walkTo(World.props.find((p) => p.kind === 'workbench').x); T_.tap('useHit'); const open = Hud.open;
    // screws out, easing off whenever one binds
    B.b.screws.forEach((_, i) => { const [x, y] = B.screwAt(i); for (let t = 0; t < 4 && B.b.screws[i].st === 'in'; t++) hold(x, y, 120, () => { if (B.rt[i] && B.rt[i].bind > 0.1) B.release(); }); });
    B.tool = 'hands'; B.lift(); B.tool = 'probe'; for (const k in B.D.slots) { const S = B.D.slots[k]; B.press(B.ox + S.x + 4, B.oy + S.y + 4); B.release(); }
    const learnt = Parts.knows('navunit');
    B.tool = 'iron'; for (const [x, y] of B.joints('cell')) hold(x, y, 60);
    B.tool = 'hands'; const S = B.D.slots.cell; B.press(B.ox + S.x + 8, B.oy + S.y + 4); B.release();
    B.fit(Parts.have('cell').find((p) => p.st === 'ok').id); for (const [x, y] of B.joints('cell')) hold(x, y, 60);
    B.close(); B.b.screws.forEach((_, i) => { const [x, y] = B.screwAt(i); for (let t = 0; t < 4 && B.b.screws[i].st !== 'in'; t++) hold(x, y, 120, () => { if (B.rt[i] && B.rt[i].bind > 0.1) B.release(); }); });
    B.test(); B.draw();
    return { open, learnt, res: B.b.tested && B.b.tested.res, loose: B.loose(), scorch: B.b.scorch.length };
  });
  await shot('bench');
  if (fix.open !== 'bench' || !fix.learnt || fix.res !== 'works' || fix.loose || fix.scorch) fail('the bench repair did not work ' + JSON.stringify(fix));
  // a job: Ozzy's waiting in the back room; take it, fix it, hand it back, sleep on it
  const job = await E(() => {
    Hud.toggle(null); Bench.clear(); const oz = Actors.npcs.find((n) => n.def.name === 'Ozzy'); if (!oz) return { oz: false };
    Actors.talk(oz); const talk = Hud.open; Jobs.take('ozzy'); const on = Bench.b && Bench.b.job;
    Parts.give(Parts.make('cell', 'street'), true); Parts.give(Parts.make('aerial', 'street'), true);
    const B = Bench; B.b.open = true; for (const k of ['cell', 'aerial']) { B.b.slots[k].j = ['open', 'open']; B.sel = k; Parts.give(B.b.slots[k].p, true); B.b.slots[k].p = null; B.fit(Parts.have(k).find((p) => p.st === 'ok').id); B.b.slots[k].j = ['solid', 'solid']; }
    B.close(); B.b.screws.forEach((s) => (s.st = 'in')); B.test(); const res = B.b.tested.res, cr = Game.s.cr;
    Jobs.handBack('ozzy'); const paid = Game.s.cr - cr;
    Hud.toggle('bed'); document.querySelector('button[data-act="sleep"]').click();
    return { oz: true, talk, on, res, paid, morning: Hud.open, rides: Game.flag('ozzy:rides'), fare: Flight.cabFare() };
  });
  await shot('morning');
  if (!job.oz || job.talk !== 'talk' || job.on !== 'ozzy' || job.res !== 'works' || job.paid !== 80 || job.morning !== 'morning' || !job.rides || job.fare) fail('Ozzy\'s job did not play through ' + JSON.stringify(job));
  await E(() => { Hud.toggle(null); T_.walkTo(300); });
  await shot('frontage');
  // the machine out front, stripped: salvage and a scrap part
  const strip = await E(() => { const v = World.props.find((p) => p.kind === 'vending'); T_.walkTo(v.x); T_.hold(200); return { done: v.done, parts: Game.s.parts.filter((p) => p.how === 'strip' && p.g === 'scrap').length }; });
  if (!strip.done || !strip.parts) fail('stripping the vending machine gave no part ' + JSON.stringify(strip));
  // no gun: nothing to fire, and the button only shows for a takedown
  const nogun = await E(() => { const b0 = Actors.bolts.length; Input.strikeHit = true; T_.run({}, 4); Hud.tick(); return { bolts: Actors.bolts.length - b0, hidden: $('bStrike').classList.contains('gone'), blaster: RUNNER.blaster || !!Game.s.gear.on.ranged };
  });
  if (nogun.bolts || !nogun.hidden || nogun.blaster) fail('there is still a gun ' + JSON.stringify(nogun));
  // the help and the pack talk about the back room, not the precinct
  const words = await E(() => { Hud.toggle('pause'); const p = $('panelBody').textContent; Hud.toggle(null); Hud.toggle('pack'); const k = $('panelBody').textContent; Hud.toggle(null); return { old: /tracer|detective|Hale|case board/i.test(p + k), jobs: /Ozzy/.test(k) }; });
  if (words.old || !words.jobs) fail('the help or the pack still talks about the detective ' + JSON.stringify(words));
  // out to the spinner, to the Overpass Market, and Ana's parts
  const fly = await E(() => { T_.walkTo(70); T_.tap('useHit'); const o = Hud.open, open = { home: Travel.open('home'), precinct: Travel.open('precinct') }; WorldMap.sel = 'd_overpass'; WorldMap.info(); const b = document.querySelector('button[data-go="d_overpass"]'); if (b) b.click(); const on = Flight.on; T_.run({}, 330); return { o, on, open, level: Game.s.level }; });
  if (fly.o !== 'travel' || !fly.on || fly.level !== 'd_overpass' || fly.open.home || fly.open.precinct) fail('the spinner did not fly to the Overpass Market (or the old places are open) ' + JSON.stringify(fly));
  const ana = await E(() => { const a = Actors.npcs.find((n) => n.def.name === 'Mechanic Ana'); Player.place(a.x - 14, a.y); T_.run({}, 4); T_.tap('useHit'); const o = Hud.open, n = Game.s.parts.length; Game.s.cr += 30; Hud.panel('partshop'); const b = document.querySelector('button[data-buypart="0"]'); if (b) b.click(); Hud.toggle(null); return { o, bought: Game.s.parts.length - n }; });
  if (ana.o !== 'partshop' || ana.bought !== 1) fail('Ana did not sell a part ' + JSON.stringify(ana));
  await shot('overpass');
  // the map draws the whole level, and a dev button works
  const mapdev = await E(() => { Hud.toggle('map'); const ok = !!MapView.cache.d_overpass && MapView.s > 0; Hud.toggle(null); Hud.toggle('dev'); const c0 = Game.s.cr; document.querySelector('button[data-devdo="cr"]').click(); Hud.toggle(null); return { ok, cr: Game.s.cr - c0 }; });
  if (!mapdev.ok || mapdev.cr !== 1000) fail('the map or dev settings failed ' + JSON.stringify(mapdev));
  // Clinic Row: Kade's stall, a takedown from behind, one in front notices; the cabinet, for heat
  await E(() => { Game.arrive('d_clinicrow', 'enter'); T_.run({}, 10); });
  const kade = await E(() => { const k = Actors.npcs.find((n) => n.def.name === 'Nurse Kade'); Player.place(k.x - 14, k.y); T_.run({}, 4); T_.tap('useHit'); const o = Hud.open; Hud.toggle(null); return o; });
  if (kade !== 'partshop') fail('Kade\'s stall did not open (' + kade + ')');
  const sneak = await E(() => {
    const g = Actors.enemies.find((q) => q.type === 'gang'); g.alert = false; g.aware = 0; g.state = 'idle'; g.range = [g.x - 1, g.x + 200]; g.face = 1; g.dir = 1;
    Player.place(g.x - 14, g.y); Player.face = 1; T_.run({}, 2); Hud.tick(); const unseen = !g.alert, btn = !$('bStrike').classList.contains('gone'); Input.strikeHit = true; T_.run({}, 3);
    const h = Actors.enemies.find((q) => q.type === 'gang' && q.hp > 0); h.alert = false; h.aware = 0; h.range = [h.x - 200, h.x + 1]; h.face = -1; h.dir = -1; Player.place(h.x - 45, h.y); T_.run({}, 240);
    return { unseen, btn, down: g.hp <= 0, quiet: !!g.subdued, noticed: !!h.alert };
  });
  if (!sneak.unseen || !sneak.btn || !sneak.down || !sneak.quiet || !sneak.noticed) fail('sneaking did not work ' + JSON.stringify(sneak));
  const cab0 = await E(() => { for (const e of Actors.enemies) { e.alert = false; e.aware = 0; } const c = World.props.find((p) => p.kind === 'cabinet'), h0 = Game.s.heat; Player.place(c.x, c.y); T_.run({}, 4); T_.hold(140); return { done: c.done, servo: Game.s.parts.some((p) => p.k === 'servo' && p.g === 'military' && p.how === 'take'), heat: Game.s.heat - h0 }; });
  if (!cab0.done || !cab0.servo || cab0.heat < 15) fail('the cabinet did not give a Meridian servo and heat ' + JSON.stringify(cab0));
  await shot('clinicrow');
  // a terminal: jack in, cross the network to the core, forcing any ICE in the way
  const node = await E(() => {
    const t = World.props.find((p) => p.kind === 'node'); Player.place(t.x, t.y); T_.run({}, 4); T_.tap('useHit'); const on = Hud.open === 'net' && !!Hack.net, N = Hack.net; if (!N) return { on };
    const core = N.nodes.length - 1;
    for (let k = 0; k < 12 && !N.out; k++) {
      const prev = {}, q = [N.at]; prev[N.at] = -1; while (q.length) { const a = q.shift(); for (const l of N.nodes[a].links) if (prev[l] === undefined) { prev[l] = a; q.push(l); } }
      let s = core; while (prev[s] !== N.at) s = prev[s];
      Hack.go(s); if (N.ask !== null) Hack.act('force');
    }
    Hack.act('out'); return { on, open: Hud.open };
  });
  if (!node.on || node.open) fail('the terminal did not jack in and out ' + JSON.stringify(node));
  // a cab home: Ozzy flies you for nothing now
  const cab = await E(() => { const c0 = Game.s.cr; Hud.toggle('cab'); const b = document.querySelector('button[data-act="cab"]'); if (b) b.click(); T_.run({}, 330); return { level: Game.s.level, paid: c0 - Game.s.cr }; });
  if (cab.level !== 'd_dragon' || cab.paid !== 0) fail('Ozzy did not fly the runner home to the White Dragon for free ' + JSON.stringify(cab));
  // a medpatch heals
  const items = await E(() => { Game.s.hp = 40; Game.give('medpatch', 1); Game.useItem('medpatch'); return Game.s.hp; });
  if (items !== 75) fail('a medpatch did nothing (' + items + ')');
  // every level loads and draws
  if (name === 'phone') {
    const lv = await E(() => { const bad = []; const here = Game.s.level; for (const id of Object.keys(LEVELS)) { try { Game.arrive(id, Object.keys((LEVELS[id].built || LEVELS[id].make()).spawns)[0]); for (const f of [0.2, 0.6]) { Player.x = World.L.w * f; for (let k = 0; k < 10; k++) step(1 / 60); render(); } } catch (e) { bad.push(id + ': ' + e.message); } } Game.arrive(here, 'enter'); return { n: Object.keys(LEVELS).length, bad }; });
    if (lv.bad.length || lv.n < 30) fail('levels failed to load: ' + JSON.stringify(lv));
    const cm = await E(() => { Hud.toggle('citymap'); const ok = !!WorldMap.img && !!$('worldcv'); const off = Object.keys(LEVELS).filter((id) => LEVELS[id].metres === undefined || LEVELS[id].mapX === undefined); Hud.toggle(null); return { ok, off }; });
    if (!cm.ok || cm.off.length) fail('the city map did not open, or places are missing from it ' + JSON.stringify(cm));
  }
  // a reload brings it back
  const before = await E(() => { Save.write(); return JSON.stringify({ l: Game.s.level, parts: Game.s.parts.length, heat: Game.s.heat, jobs: Game.s.jobs, notes: Game.s.notes, g: Game.s.gear.on }); });
  await page.reload(); for (let i = 0; i < 60 && !(await page.evaluate(() => !!window.Downlevel)); i++) await sleep(200);
  const after = await E(() => JSON.stringify({ l: Game.s.level, parts: Game.s.parts.length, heat: Game.s.heat, jobs: Game.s.jobs, notes: Game.s.notes, g: Game.s.gear.on }));
  if (before !== after) fail('the save did not come back: ' + before + ' / ' + after);
  if (errors.length) fail('errors: ' + errors.slice(0, 5).join(' | '));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve(), url = `http://localhost:${server.address().port}/index.html`;
  let B; const failures = [];
  try { B = await browser(); } catch (e) { console.log('::error title=smoke::no browser: ' + String(e.stack || e).replace(/\n/g, ' ')); throw e; }
  try {
    await run(B, url, PHONE, 'phone', failures);
    await run(B, url + '?nogl', DESKTOP, 'desktop', failures); // the 2D path, as without WebGL2
  } catch (e) { failures.push('crashed: ' + (e.stack || e)); }
  await B.b.close(); server.close();
  if (failures.length) {
    console.log('smoke: FAILED\n  ' + failures.join('\n  '));
    if (process.env.GITHUB_ACTIONS) for (const f of failures) console.log('::error title=smoke::' + f.replace(/\n/g, ' ').slice(0, 900));
    process.exit(1);
  }
  console.log('smoke: ok');
})();
