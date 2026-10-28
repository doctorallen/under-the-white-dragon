'use strict';
// The game played headlessly in Chrome, sideways on a phone and on a desktop:
// it boots without an error in the basement under the White Dragon (the
// desktop run without WebGL2, so the 2D path is played too); the bench and the
// shelf answer Use, and the basement isn't on the city map; the tutorial walks Lin's radio through the bench, and it goes back to her;
// the ladder leads up through the trapdoor into the noodle bar's storeroom,
// where people eat; Ozzy's job is taken, fixed, handed back and slept on; the
// front door leads out onto the street; the block's residents shop, work the
// till and eat when their days say, and talk when stopped; the vending machine
// out front gives a scrap part; the old game (enemies, guns, gear, cases) is
// gone; the help and the pack talk
// about the basement; a cab flies from the stand to the Overpass Market, where Ana
// sells a part; the map and dev settings work; on Clinic Row Kade's stall
// opens, and the cabinet gives a Meridian servo and heat; Ozzy's
// cab flies home for free; every level loads and draws, and
// nobody in them is only a part ("Commuter") or shares a name; a
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
  // a new game opens on how things stand; Get up closes it
  const intro = await E(() => { const was = Hud.open; const b = document.querySelector('button[data-act="resume"]'); if (b) b.click(); T_.run({}, 10); return was; });
  if (intro !== 'intro') fail('a new game did not open on the intro (' + intro + ')');
  const st = await E(() => ({ level: Game.s.level, x: Player.x, frame: Game.frame }));
  if (st.level !== 'd_cellar' || Math.abs(st.x - 630) > 40) fail('the game does not start in the basement by the cot ' + JSON.stringify(st));
  if (!st.frame) fail('the loop is not running');
  await shot('basement');
  // the bench and the shelf answer Use; the basement isn't on the city map
  const room = await E(() => {
    const at = (k) => World.props.find((p) => p.kind === k);
    T_.walkTo(at('workbench').x); const bench = Player.target && Player.target.p && Player.target.p.kind;
    T_.walkTo(at('shelf').x); const shelf = Player.target && Player.target.p && Player.target.p.kind;
    return { bench, shelf, hidden: !WorldMap.places().some((p) => p.id === 'd_cellar') && !Travel.open('d_cellar') };
  });
  if (room.bench !== 'workbench' || room.shelf !== 'shelf' || !room.hidden) fail('the basement is not set up ' + JSON.stringify(room));
  // a new game opens on the tutorial: Lin's radio on the bench, the coil it needs on the shelf, the card up
  const tut0 = await E(() => { Tutorial.tick(); return { i: Tutorial.s && Tutorial.s.i, job: Game.s.bench && Game.s.bench.job, coil: Parts.have('aerial').some((p) => p.st === 'ok'), card: !!Tutorial.card() }; });
  if (tut0.i !== 0 || tut0.job !== 'lin' || !tut0.coil || !tut0.card) fail('a new game does not open on the tutorial ' + JSON.stringify(tut0));
  // the bench, as the tutorial walks it: screws out (easing off whenever one
  // binds), casing off, probe, melt the burnt coil free, swap it, solder it,
  // close up, screws home, power up; the card moves on a step at each
  const fix = await E(() => {
    const B = Bench, hold = (x, y, n, fn) => { B.press(x, y); for (let k = 0; k < n; k++) { B.step(1 / 60); if (fn) fn(); } B.release(); }, steps = [], at = () => { Tutorial.tick(); steps.push(Tutorial.s.i); };
    const screws = (want) => B.b.screws.forEach((_, i) => { const [x, y] = B.screwAt(i); for (let t = 0; t < 4 && (B.b.screws[i].st === 'in') !== want; t++) hold(x, y, 120, () => { if (B.rt[i] && B.rt[i].bind > 0.1) B.release(); }); });
    T_.walkTo(World.props.find((p) => p.kind === 'workbench').x); T_.tap('useHit'); const open = Hud.open; at();
    const marked = !!Tutorial.mark(); screws(false); at();
    B.tool = 'hands'; B.lift(); at();
    B.tool = 'probe'; for (const k in B.D.slots) { const S = B.D.slots[k]; B.press(B.ox + S.x + 4, B.oy + S.y + 4); B.release(); } at();
    B.tool = 'iron'; for (const [x, y] of B.joints('aerial')) hold(x, y, 60); at();
    B.tool = 'hands'; const S = B.D.slots.aerial; B.press(B.ox + S.x + 8, B.oy + S.y + 4); B.release(); at();
    const pick = Parts.choices('aerial', B.b.name).find((c) => c.st === 'ok'); B.fit(pick.id); at();
    for (const [x, y] of B.joints('aerial')) hold(x, y, 60); at();
    B.close(); at(); screws(true); at();
    B.test(); B.draw(); at();
    return { open, marked, steps, learned: Parts.knows('radio'), res: B.b.tested && B.b.tested.res, loose: B.loose(), scorch: B.b.scorch.length };
  });
  await shot('bench');
  if (fix.open !== 'bench' || !fix.marked || fix.steps.join() !== '1,2,3,4,5,6,7,8,9,10,11' || !fix.learned || fix.res !== 'works' || fix.loose || fix.scorch) fail('the tutorial\'s bench repair did not work ' + JSON.stringify(fix));
  // up the ladder, through the trapdoor, into the storeroom: Lin at the bar, the sign out front
  const up = await E(() => {
    Hud.toggle(null); T_.walkTo(World.props.find((p) => p.kind === 'trapdoor').x); const pr = Player.target && Player.target.p && Player.target.p.kind; T_.tap('useHit'); T_.run({}, 90);
    return { pr, level: Game.s.level, x: Math.round(Player.x), rug: !!World.props.find((p) => p.kind === 'trapdoor'), diners: Actors.npcs.filter((n) => n.act === 'sit').length, lin: !!Actors.npcs.find((n) => n.def.name === 'Auntie Lin') };
  });
  if (up.pr !== 'trapdoor' || up.level !== 'd_noodles' || Math.abs(up.x - 846) > 30 || !up.rug || up.diners < 2 || !up.lin) fail('the ladder did not lead up to the storeroom of the noodle bar ' + JSON.stringify(up));
  await shot('storeroom');
  // the radio goes back to Lin at the counter, by hand: she pays, and the tutorial moves on to Ozzy
  const lin = await E(() => {
    Hud.toggle(null); const n = Actors.npcs.find((q) => q.def.name === 'Auntie Lin'); if (!n) return {};
    Actors.talk(n); const talk = Hud.open; Tutorial.tick(); Hud.panel('talk'); const b = document.querySelector('button[data-job="back:lin"]'), pulse = !!(b && b.classList.contains('tut')), cr = Game.s.cr;
    if (b) b.click(); Tutorial.tick(); return { talk, pulse, paid: Game.s.cr - cr, st: Jobs.st('lin').st, i: Tutorial.s.i, bench: !!Game.s.bench };
  });
  if (lin.talk !== 'talk' || !lin.pulse || lin.paid !== 50 || lin.st !== 'back' || lin.i !== 12 || lin.bench) fail('Lin\'s radio did not go back to her ' + JSON.stringify(lin));
  // a job: Ozzy's waiting at the bar; take it, fix it, hand it back, sleep on it
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
  // an odd job from a resident: take it, swap the bad parts, hand it back for pay
  const odd = await E(() => {
    Hud.toggle(null); const ids = Jobs.oddToday(); if (!ids.length) return { n: 0 };
    const a = ids[0]; Jobs.take(a); const B = Bench, D = B.D; B.b.open = true;
    for (const k in D.slots) { const s = B.b.slots[k]; if (s.p.st !== 'ok') s.p = Parts.make(D.slots[k].kind, 'street'); B.b.probed[k] = 1; }
    B.close(); B.b.screws.forEach((s) => (s.st = 'in')); B.test(); const res = B.b.tested.res, c0 = Game.s.cr;
    Jobs.handBack(a); return { n: ids.length, res, paid: Game.s.cr - c0, st: Game.s.jobs[a].st, bench: Game.s.bench };
  });
  if (odd.n < 1 || odd.res !== 'works' || odd.paid <= 0 || odd.st !== 'done' || odd.bench) fail('a resident\'s odd job did not play through ' + JSON.stringify(odd));
  // and one they come to collect: fixed and tested, then left; its owner comes
  // by the White Dragon for it when they can, and pays then
  const coll = await E(() => {
    const ids = Jobs.oddToday().filter((id) => !Game.s.jobs[id]); if (!ids.length) return { n: 0 };
    const a = ids[0], t0 = Game.s.time, d0 = Game.s.day; Jobs.take(a); const B = Bench, D = B.D; B.b.open = true;
    for (const k in D.slots) { const s = B.b.slots[k]; if (s.p.st !== 'ok') s.p = Parts.make(D.slots[k].kind, 'street'); B.b.probed[k] = 1; }
    B.close(); B.b.screws.forEach((s) => (s.st = 'in')); B.test(); Hud.toggle(null); const c0 = Game.s.cr;
    let h = 0; for (; h < 30 && Game.s.jobs[a].st === 'bench'; h += 0.5) { Game.pass(0.5); City.sync(); }
    const out = { n: 1, st: Game.s.jobs[a].st, paid: Game.s.cr - c0, hours: h, at: Game.s.time };
    Game.s.time = t0; Game.s.day = d0; City.sync(); return out;
  });
  if (coll.n && (coll.st !== 'done' || coll.paid <= 0)) fail('nobody came to collect a finished job ' + JSON.stringify(coll));
  // a tip: a resident's message in the morning puts a wreck in the city, and it
  // needs better tools than the hand kit (the morning after Ozzy's job may have brought it already)
  const tip = await E(() => {
    const s = Game.s, day = s.day, news = []; s.day = Math.max(day, 2); Tips.morning(news); const id = Object.keys(s.tips)[0]; if (!id) return { id };
    const T = TIPS[id], here = s.level; World.load(T.level); const w = World.props.find((q) => q.id === 'tip:' + id), locked = !!(w && Props.prompt(w).no);
    s.tools = 2; const open = !!(w && !Props.prompt(w).no), n0 = s.parts.length; if (w) Props.use(w); const got = s.parts.length - n0;
    const st = Tips.st(id); s.tools = 1; s.day = day; World.load(here); return { id, msg: news.length, w: !!w, locked, open, got, st };
  });
  if (!tip.id || !tip.w || !tip.locked || !tip.open || tip.got < 1 || tip.st !== 'done') fail('a resident\'s tip did not lead to a wreck to strip ' + JSON.stringify(tip));
  // out through the dining room and the front door, onto the street: the sign, the cab stand
  await E(() => { Hud.toggle(null); T_.walkTo(300); });
  await shot('diningroom');
  const out = await E(() => { const d = World.props.find((p) => p.kind === 'door'); T_.walkTo(d.x); const pr = Player.target && Player.target.p && Player.target.p.kind; T_.tap('useHit'); T_.run({}, 90); return { pr, level: Game.s.level, x: Math.round(Player.x), sign: !!World.props.find((p) => p.id === 'wdsign'), door: !!World.props.find((p) => p.kind === 'door') }; });
  if (out.pr !== 'door' || out.level !== 'd_dragon' || Math.abs(out.x - 424) > 30 || !out.sign || !out.door) fail('the front door did not lead out to the street ' + JSON.stringify(out));
  await E(() => { T_.walkTo(380); });
  await shot('frontage');
  // the block's people keep their own days: at a quarter to seven Mo's on the till
  // and people are shopping; stop one and they say what they're about; the
  // clerk sells you things; just after eight people are eating at the White Dragon
  const town = await E(() => {
    const t0 = Game.s.time, see = (lv, h) => { Game.s.time = h; Game.arrive(lv, 'door'); T_.run({}, 30); return Actors.npcs.filter((n) => n.def.town); };
    let g = see('d_grocery', 18.75); const mo = g.find((n) => n.def.town === 'mo');
    // (someone's in doing their shopping at some hour of the day)
    let shoppers = 0; for (let h = 9; h < 20 && !shoppers; h += 0.5) { g = see('d_grocery', h); shoppers = g.filter((n) => RESIDENTS[n.def.town].job === undefined || RESIDENTS[n.def.town].job.place !== 'd_grocery').length; }
    const shopper = g.find((n) => n.def.town !== 'mo' && n.def.town !== 'jun'); if (shopper) Actors.talk(shopper); const said = shopper && shopper.bubble && shopper.bubble.text;
    g = see('d_grocery', 18.75); const mo2 = g.find((n) => n.def.town === 'mo'); if (mo2) Actors.talk(mo2); const till = Hud.open; Hud.toggle(null);
    const eating = see('d_noodles', 20.1).filter((n) => !n.moving && n.act === 'sit').length;
    Game.s.time = t0; Game.arrive('d_dragon', 'door'); T_.run({}, 10);
    return { mo: !!(mo && mo.act === 'work'), shoppers, said, till, eating };
  });
  if (!town.mo || !town.shoppers || !town.said || town.till !== 'grocer' || town.eating < 2) fail('the block\'s people are not keeping their days ' + JSON.stringify(town));
  // the residents' minds are Tyrell's: everyone's there, they remember what they
  // saw you do and what you fixed, a rewind gives back the very same block, and
  // the minds go in the save
  const minds = await E(() => {
    const w = City.w, out = { on: City.on, people: w ? w.people().length : 0, n: TOWN_ORDER.length };
    const oddRes = Object.values(Game.s.jobs).map((c) => c.res).find((r) => r && RESIDENTS[r]);
    out.fixed = oddRes ? (w.reverie.file(oddRes, 'player') || { tally: {} }).tally.fixed || 0 : -1;
    City.did('talked', 'okonkwo'); // he knows your face
    w.sense({ kind: 'strip', actor: 'player', what: 'till', seenBy: ['okonkwo'] });
    City.remarked = {}; out.remark = City.remark('okonkwo');
    City.sync(); const t0 = Game.s.time, d0 = Game.s.day, h0 = City.w.hash(), at0 = JSON.stringify(City.state('sato'));
    Game.pass(2); T_.run({}, 3); const moved = City.w.hash() !== h0;
    Game.s.time = t0; Game.s.day = d0; City.sync();
    out.rewound = moved && City.w.hash() === h0 && JSON.stringify(City.state('sato')) === at0;
    City.stash(); const copy = JSON.parse(JSON.stringify(Game.s.city)); out.saved = copy.s.now === w.s.now && Object.keys(copy.s.people).length === out.people;
    return out;
  });
  if (!minds.on || minds.people !== minds.n || minds.fixed === 0 || !/saw you take the till apart/.test(minds.remark || '') || !minds.rewound || !minds.saved) fail('the residents\' minds (Tyrell) are not working ' + JSON.stringify(minds));
  // the city: everyone a resident, with a name of their own and a home, every
  // child at a school, and nobody in the server farm but the people who work there
  const city = await E(() => {
    const bad = [], seen = {};
    for (const id of TOWN_ORDER) { const R = RESIDENTS[id]; if (seen[R.name]) bad.push(R.name + ' twice'); seen[R.name] = 1; if (PARTS.includes(R.name)) bad.push('someone called ' + R.name); if (!R.homePlace) bad.push(R.name + ' has no home'); if (R.age === 'kid' && !R.school) bad.push(R.name + ' has no school'); }
    const t0 = Game.s.time, staff = (id) => { const j = RESIDENTS[id].job; return j && Census.places[j.place] && Census.places[j.place].street === 'd_servers'; };
    for (let h = 1; h <= 24; h += 2) { Game.s.time = (t0 + h) % 24; if (Game.s.time < t0) Game.s.day++; City.sync(); for (const id of TOWN_ORDER) if (City.mayBeIn(id, 'd_servers') && City.state(id).level === 'd_servers' && !staff(id)) bad.push(RESIDENTS[id].name + ' in the server farm'); }
    return { n: TOWN_ORDER.length, bad: [...new Set(bad)].slice(0, 8) };
  });
  if (city.n < 200 || city.bad.length) fail('the city\'s people ' + JSON.stringify(city));
  // Tyrell mode: everyone drawn, someone's mind open, the clock run on and back
  const tm = await E(() => {
    Hud.toggle('tyrell'); const dots = TyrellMode.dots.length, t0 = Game.s.day * 24 + Game.s.time;
    TyrellMode.step(30); TyrellMode.sel = TyrellMode.dots[0] && TyrellMode.dots[0].id; TyrellMode.side(true);
    const mind = (document.getElementById('tmside') || {}).textContent || ''; TyrellMode.open('d_neonrow'); const street = TyrellMode.dots.length + TyrellMode.badges.length;
    TyrellMode.step(-30); const back = Math.abs(Game.s.day * 24 + Game.s.time - t0) < 1e-6; TyrellMode.sel = null; Hud.toggle(null);
    return { dots, mind: /Today/.test(mind), street, back };
  });
  if (tm.dots < 200 || !tm.mind || !tm.street || !tm.back) fail('Tyrell mode did not show the city ' + JSON.stringify(tm));
  // the machine out front, stripped: salvage and a scrap part
  const strip = await E(() => { const v = World.props.find((p) => p.kind === 'vending'); T_.walkTo(v.x); T_.hold(200); return { done: v.done, parts: Game.s.parts.filter((p) => p.how === 'strip' && p.g === 'scrap').length }; });
  if (!strip.done || !strip.parts) fail('stripping the vending machine gave no part ' + JSON.stringify(strip));
  // the old game is gone: no enemies, guns, gear, programs, cases or side jobs, and no buttons for them
  const old = await E(() => ({ code: ['ENEMY', 'Foes', 'Cases', 'Quests', 'Hack', 'GEAR', 'PROGRAMS', 'Enhancer', 'LEGACY'].filter((g) => typeof window[g] !== 'undefined' || (() => { try { return eval('typeof ' + g) !== 'undefined'; } catch (e) { return false; } })()), dom: ['bStrike', 'bItem', 'bProg', 'hp', 'ram', 'boss'].filter((id) => document.getElementById(id)), places: ['home', 'precinct', 'stack', 'street'].filter((id) => LEVELS[id]) }));
  if (old.code.length || old.dom.length || old.places.length) fail('the old game is still here ' + JSON.stringify(old));
  // the help and the pack talk about the basement, not the precinct
  const words = await E(() => { Hud.toggle('pause'); const p = $('panelBody').textContent; Hud.toggle(null); Hud.toggle('pack'); const k = $('panelBody').textContent; Hud.toggle(null); return { old: /tracer|detective|Hale|case board/i.test(p + k), jobs: /Ozzy/.test(k) }; });
  if (words.old || !words.jobs) fail('the help or the pack still talks about the detective ' + JSON.stringify(words));
  // out to the spinner, to the Overpass Market, and Ana's parts stall (whoever's on shift)
  const fly = await E(() => { T_.walkTo(70); T_.tap('useHit'); const o = Hud.open; WorldMap.sel = 'd_overpass'; WorldMap.info(); const b = document.querySelector('button[data-go="d_overpass"]'); if (b) b.click(); const on = Flight.on; T_.run({}, 330); return { o, on, level: Game.s.level }; });
  if (fly.o !== 'travel' || !fly.on || fly.level !== 'd_overpass') fail('the spinner did not fly to the Overpass Market ' + JSON.stringify(fly));
  const ana = await E(() => { const a = Actors.npcs.find((n) => n.def.role === 'parts'); if (!a) return { o: 'nobody on the parts stall at ' + Game.hour().toFixed(2), who: Actors.npcs.map((n) => n.def.name + ':' + (n.townState && n.townState.act)).join(',') }; Player.place(a.x - 14, a.y); T_.run({}, 4); T_.tap('useHit'); const o = Hud.open, n = Game.s.parts.length; Game.s.cr += 30; Hud.panel('partshop'); const b = document.querySelector('button[data-buypart="0"]'); if (b) b.click(); Hud.toggle(null); return { o, bought: Game.s.parts.length - n }; });
  if (ana.o !== 'partshop' || ana.bought !== 1) fail('the parts stall did not sell a part ' + JSON.stringify(ana));
  await shot('overpass');
  // the map draws the whole level, and a dev button works
  const mapdev = await E(() => { Hud.toggle('map'); const ok = !!MapView.cache.d_overpass && MapView.s > 0; Hud.toggle(null); Hud.toggle('dev'); const c0 = Game.s.cr; document.querySelector('button[data-devdo="cr"]').click(); Hud.toggle(null); return { ok, cr: Game.s.cr - c0 }; });
  if (!mapdev.ok || mapdev.cr !== 1000) fail('the map or dev settings failed ' + JSON.stringify(mapdev));
  // Clinic Row: Kade's stall (whoever's on shift), and the cabinet, for heat
  await E(() => { Game.arrive('d_clinicrow', 'enter'); T_.run({}, 10); });
  const kade = await E(() => { const k = Actors.npcs.find((n) => n.def.role === 'parts'); if (!k) return 'nobody on shift: ' + Actors.npcs.map((n) => n.def.name + ':' + (n.townState && n.townState.act)).join(','); Player.place(k.x - 14, k.y); T_.run({}, 4); T_.tap('useHit'); const o = Hud.open; Hud.toggle(null); return o; });
  if (kade !== 'partshop') fail('Kade\'s stall did not open (' + kade + ')');
  const cab0 = await E(() => { const c = World.props.find((p) => p.kind === 'cabinet'), h0 = Game.s.heat; Player.place(c.x, c.y); T_.run({}, 4); T_.hold(140); return { done: c.done, servo: Game.s.parts.some((p) => p.k === 'servo' && p.g === 'military' && p.how === 'take'), heat: Game.s.heat - h0 }; });
  if (!cab0.done || !cab0.servo || cab0.heat < 15) fail('the cabinet did not give a Meridian servo and heat ' + JSON.stringify(cab0));
  await shot('clinicrow');
  // no terminals to jack into, no lockers of loot: those were the detective's
  const legacy = await E(() => World.props.filter((p) => ['node', 'locker', 'cache', 'stash'].includes(p.kind)).length);
  if (legacy) fail('Clinic Row still has terminals or lockers (' + legacy + ')');
  // a cab home: Ozzy flies you for nothing now
  const cab = await E(() => { const c0 = Game.s.cr; Hud.toggle('cab'); const b = document.querySelector('button[data-act="cab"]'); if (b) b.click(); T_.run({}, 330); return { level: Game.s.level, paid: c0 - Game.s.cr }; });
  if (cab.level !== 'd_dragon' || cab.paid !== 0) fail('Ozzy did not fly the runner home to the White Dragon for free ' + JSON.stringify(cab));
  // every level loads and draws, and everyone in them has a name of their own
  if (name === 'phone') {
    const lv = await E(() => { const bad = [], names = {}, res = new Set(Object.values(RESIDENTS).map((r) => r.name)); const here = Game.s.level; for (const id of Object.keys(LEVELS)) { try { Game.arrive(id, Object.keys((LEVELS[id].built || LEVELS[id].make()).spawns)[0]); for (const d of World.L.npcs) { if (PARTS.includes(d.name)) bad.push(id + ': someone still called ' + d.name); if (d.title) { const w = names[d.name]; if (w && w !== id + d.x) bad.push(d.name + ' twice (' + w + ', ' + id + ')'); if (res.has(d.name)) bad.push(d.name + ' is a resident\'s name'); names[d.name] = id + d.x; } } for (const f of [0.2, 0.6]) { Player.x = World.L.w * f; for (let k = 0; k < 10; k++) step(1 / 60); render(); } } catch (e) { bad.push(id + ': ' + e.message); } } Game.arrive(here, 'enter'); return { n: Object.keys(LEVELS).length, bad }; });
    if (lv.bad.length || lv.n < 30) fail('levels failed to load: ' + JSON.stringify(lv));
    const cm = await E(() => { Hud.toggle('citymap'); const ok = !!WorldMap.img && !!$('worldcv'); const off = Object.keys(LEVELS).filter((id) => LEVELS[id].meters === undefined || LEVELS[id].mapX === undefined); Hud.toggle(null); return { ok, off }; });
    if (!cm.ok || cm.off.length) fail('the city map did not open, or places are missing from it ' + JSON.stringify(cm));
  }
  // a reload brings it back
  const before = await E(() => { Save.write(); return JSON.stringify({ l: Game.s.level, parts: Game.s.parts.length, heat: Game.s.heat, jobs: Game.s.jobs, notes: Game.s.notes }); });
  await page.reload(); for (let i = 0; i < 60 && !(await page.evaluate(() => !!window.Downlevel)); i++) await sleep(200);
  const after = await E(() => JSON.stringify({ l: Game.s.level, parts: Game.s.parts.length, heat: Game.s.heat, jobs: Game.s.jobs, notes: Game.s.notes }));
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
