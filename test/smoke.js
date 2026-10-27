'use strict';
// The game played headlessly in Chrome, sideways on a phone and on a desktop:
// it boots without an error in the apartment (the desktop run without
// WebGL2, so the 2D path is played too); the spinner on the pad flies to the
// precinct, where Lieutenant Hale gives a job and the first case and the
// quartermaster builds spectral lenses; a cab flies home; the elevator goes down to the Stack; a
// vending machine is stripped for parts; Kit's panel opens; Mags makes a
// mask, buying the glass that's missing; the stairs carry the runner up to
// both walkways; the data node gives Breach; the strike downs a drone; the
// grate into the service yard is cut; the Warden falls and drops its helmet,
// which is worn from the Gear tab; the hatch is breached and the shaft leads
// down to street level; a car there gives coolant; a ganger downed stays
// down; the elevator there goes home; the spinner flies to Neon Row, where
// the case's clues are found (a photo enhanced, a witness asked), the suspect
// tested and arrested; a medpatch heals and a frag hurts; every level loads
// and draws; a reload brings it all back.
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
  if (st.level !== 'home' || Math.abs(st.x - 116) > 40) fail('the runner does not start by the bed ' + JSON.stringify(st));
  if (!st.frame) fail('the loop is not running');
  await shot('home');
  // out to the pad and the spinner, up to the precinct
  const fly = await E(() => { T_.walkTo(1760); T_.tap('useHit'); const o = Hud.open; WorldMap.sel = 'precinct'; WorldMap.info(); const b = document.querySelector('button[data-go="precinct"]'); if (b) b.click(); const on = Flight.on; T_.run({}, 330); return { o, on, level: Game.s.level }; });
  if (fly.o !== 'travel' || !fly.on || fly.level !== 'precinct') fail('the spinner did not fly to the precinct ' + JSON.stringify(fly));
  await shot('precinct');
  // Hale's job and the first case, and the quartermaster's lenses
  const hale = await E(() => { T_.walkTo(1130); T_.tap('useHit'); const o = Hud.open; let b = document.querySelector('button[data-take="drones"]'); if (b) b.click(); b = document.querySelector('button[data-case="menagerie"]'); if (b) b.click(); Hud.toggle(null); return { o, taken: Quests.active('drones'), case: !!Cases.st('menagerie') }; });
  if (hale.o !== 'talk' || !hale.taken || !hale.case) fail('Hale did not give the job and the case ' + JSON.stringify(hale));
  await shot('hale');
  const qm = await E(() => { Object.assign(Game.s.pack, { glass: 2, chips: 1 }); Game.s.cr += 80; T_.walkTo(1400); T_.tap('useHit'); const o = Hud.open; const b = document.querySelector('button[data-gadget="scanner"]'); if (b) b.click(); Hud.toggle(null); return { o, has: Game.has('scanner') }; });
  if (qm.o !== 'qm' || !qm.has) fail('the quartermaster did not build the lenses ' + JSON.stringify(qm));
  // a cab home
  const cab = await E(() => { Game.s.cr += 30; const c0 = Game.s.cr; Hud.toggle('cab'); const b = document.querySelector('button[data-act="cab"]'); if (b) b.click(); T_.run({}, 330); return { level: Game.s.level, paid: c0 - Game.s.cr, x: Math.round(Player.x) }; });
  if (cab.level !== 'home' || cab.paid !== 30) fail('the cab did not take the runner home ' + JSON.stringify(cab));
  // down the hall to the elevator, and down to the Stack
  const lift = await E(() => { T_.walkTo(1470); T_.tap('useHit'); const o = Hud.open; const b = document.querySelector('button[data-floor="stack"]'); if (b) b.click(); T_.run({}, 90); return { o, level: Game.s.level, x: Math.round(Player.x) }; });
  if (lift.o !== 'elevator' || lift.level !== 'stack' || Math.abs(lift.x - 158) > 20) fail('the elevator did not take the runner down to the Stack ' + JSON.stringify(lift));
  await shot('stack');
  // a vending machine, stripped
  const strip = await E(() => { T_.walkTo(966); T_.hold(200); return { done: World.props.find((p) => p.kind === 'vending').done, pack: Game.packCount(), cr: Game.s.cr }; });
  if (!strip.done || !strip.pack) fail('stripping the vending machine gave nothing ' + JSON.stringify(strip));
  // Kit
  const kit = await E(() => { T_.walkTo(1110); T_.tap('useHit'); const o = Hud.open; Hud.toggle(null); return o; });
  if (kit !== 'vendor') fail('Kit\'s trade panel did not open (' + kit + ')');
  await shot('market');
  // the map draws the whole level, and a dev button works
  const mapdev = await E(() => { Hud.toggle('map'); const ok = !!MapView.cache.stack && MapView.s > 0; Hud.toggle(null); Hud.toggle('dev'); const c0 = Game.s.cr; document.querySelector('button[data-devdo="cr"]').click(); Hud.toggle(null); return { ok, cr: Game.s.cr - c0 }; });
  if (!mapdev.ok || mapdev.cr !== 1000) fail('the map or dev settings failed ' + JSON.stringify(mapdev));
  // Mags makes a filter mask, buying the glass that's missing
  const fab = await E(() => { Game.s.cr += 100; Game.s.pack.glass = 0; Game.s.pack.wire = (Game.s.pack.wire || 0) + 1; T_.walkTo(1215); T_.tap('useHit'); const o = Hud.open; const b = document.querySelector('button[data-make="mask"]'); if (b) b.click(); Hud.toggle(null); return { o, mask: !!Game.s.gear.owned.mask }; });
  if (fab.o !== 'fab' || !fab.mask) fail('Mags did not make the mask ' + JSON.stringify(fab));
  // up the stairs to both walkways
  const up = await E(() => { T_.walkTo(1700); const mid = Math.round(Player.y); T_.walkTo(1000); return { mid, top: Math.round(Player.y) }; });
  if (up.mid !== 500 || up.top !== 360) fail('the stairs did not carry the runner up ' + JSON.stringify(up));
  // the data node: jack in (the puzzle is won for the test)
  const node = await E(() => { T_.walkTo(1070); T_.tap('useHit'); const on = Hack.on; Hack.finish(true); Hack.close(); return { on, breach: !!Game.s.programs.breach }; });
  if (!node.on || !node.breach) fail('the data node did not give Breach ' + JSON.stringify(node));
  // a drone, struck down
  const drone = await E(() => { const d = Actors.enemies.find((e) => e.type === 'drone' && e.y < 400); Player.place(d.x - 40, 360); let n = 0; for (let k = 0; k < 900 && d.hp > 0; k++) { Game.s.hp = 100; Input.bot = { ax: Math.sign(d.x - Player.x) * (Math.abs(d.x - Player.x) > 18 ? 1 : 0) }; if (k % 12 === 0) { Player.face = Math.sign(d.x - Player.x) || 1; Input.strikeHit = true; } step(1 / 60); n++; } Input.bot = null; return { hp: d.hp, kills: Quests.st('drones').n, steps: n }; });
  if (drone.hp > 0 || drone.kills !== 1) fail('the strike did not down a drone ' + JSON.stringify(drone));
  await shot('walkway');
  // the grate into the yard, then the Warden
  const yard = await E(() => { Player.place(2150, 640); T_.walkTo(2178); T_.hold(150); const g = World.props.find((p) => p.kind === 'grate').done; T_.walkTo(2300); return { g, x: Math.round(Player.x) }; });
  if (!yard.g || yard.x < 2290) fail('the grate was not cut through ' + JSON.stringify(yard));
  const boss = await E(() => { const w = Actors.boss; for (let k = 0; k < 60 * 60 && w.hp > 0; k++) { Game.s.hp = 100; const d = w.x - Player.x; Input.bot = { ax: Math.abs(d) > 34 ? Math.sign(d) : 0, jump: w.state === 'stomp' }; if (w.state === 'stomp' && k % 20 === 0) Input.jumpHit = true; if (k % 14 === 0) { Player.face = Math.sign(d) || 1; Input.strikeHit = true; } step(1 / 60); } Input.bot = null; return { hp: w.hp, flag: !!Game.s.flags.warden }; });
  if (!boss.flag) fail('the Warden did not fall ' + JSON.stringify(boss));
  await shot('yard');
  // its helmet, worn from the Gear tab
  const gear = await E(() => { const a0 = Game.armor(); Hud.tab = 'gear'; Hud.slot = 'head'; Hud.toggle('pack'); const pk = document.querySelector('button[data-pick="helmet"]'); if (pk) pk.click(); const b = document.querySelector('button[data-equip="helmet"]'); if (b) b.click(); Hud.toggle(null); return { owned: !!Game.s.gear.owned.helmet, on: Game.s.gear.on.head, a0, a1: Game.armor() }; });
  if (!gear.owned || gear.on !== 'helmet' || gear.a1 <= gear.a0) fail('the Warden\'s helmet was not worn ' + JSON.stringify(gear));
  // the hatch: breached, and down to street level
  const down = await E(() => { T_.walkTo(2500); T_.tap('useHit'); const h = World.props.find((p) => p.kind === 'hatch').done; T_.tap('useHit'); T_.run({}, 90); return { h, level: Game.s.level }; });
  if (!down.h || down.level !== 'street') fail('the hatch did not open the way down ' + JSON.stringify(down));
  await shot('street');
  // a car's coolant
  const car = await E(() => { T_.walkTo(700); T_.hold(260); return Game.s.pack.coolant || 0; });
  if (!car) fail('the car gave no coolant');
  // a ganger downed stays down
  const body = await E(() => { const e = Actors.enemies.find((q) => q.type === 'gang'); Actors.damage(e, 999, 1); T_.run({}, 30); return Actors.bodies.length; });
  if (body !== 1) fail('the ganger left no body (' + body + ')');
  await shot('street2');
  // the elevator on street level goes home
  const home = await E(() => { T_.walkTo(350); T_.tap('useHit'); const b = document.querySelector('button[data-floor="home"]'); if (b) b.click(); T_.run({}, 90); return Game.s.level; });
  if (home !== 'home') fail('the street elevator did not go home (' + home + ')');
  // the spinner to Neon Row and the Menagerie case
  const row = await E(() => { T_.walkTo(1760); T_.tap('useHit'); WorldMap.sel = 'd_neonrow'; WorldMap.info(); const b = document.querySelector('button[data-go="d_neonrow"]'); if (b) b.click(); T_.run({}, 330); return { level: Game.s.level, clues: World.props.filter((p) => p.kind === 'clue').length }; });
  if (row.level !== 'd_neonrow' || row.clues !== 3) fail('the spinner did not reach Neon Row with its clues ' + JSON.stringify(row));
  const clues = await E(() => {
    const out = {};
    // the spent cells, picked up
    T_.walkTo(610); T_.tap('useHit'); out.casings = !!Cases.st('menagerie').found.casings;
    // the still, enhanced: zoom in on the right spot, and it sharpens
    T_.walkTo(668); T_.tap('useHit'); out.photo = Hud.open;
    const sp = Enhancer.spots.find((q) => q.real); for (let k = 0; k < 2; k++) Enhancer.enhance(Enhancer.ox + (sp.x + sp.w / 2) * Enhancer.s, Enhancer.oy + (sp.y + sp.h / 2) * Enhancer.s);
    out.scan = !!(Enhancer.scan && Enhancer.scan.sp === sp); if (out.scan) Enhancer.reveal(sp);
    out.still = !!Cases.st('menagerie').found.still;
    return out;
  });
  await shot('photo');
  const lio = await E(() => {
    Hud.toggle(null); T_.walkTo(720); T_.tap('useHit');
    const L = Actors.npcs.find((n) => n.def.name === 'Lio'); Player.place(L.x - 12, L.y); T_.run({}, 10); T_.tap('useHit'); const o = Hud.open;
    let b = document.querySelector('button[data-ask^="menagerie:lio"]'); if (b) b.click();
    // his story doesn't hold: show him the wrong thing, then the notice that breaks it
    b = document.querySelector('button[data-present="menagerie:lioTruth:casings"]'); if (b) b.click(); const wrong = !Cases.st('menagerie').found.lioTruth;
    b = document.querySelector('button[data-present="menagerie:lioTruth:notice"]'); if (b) b.click(); Hud.toggle(null);
    const c = Cases.st('menagerie'); return { o, wrong, found: Object.keys(c.found).sort().join(), lead: !!c.leads.coil };
  });
  // the case board: a call with too much evidence costs doubt; the right one opens the lead
  const board = await E(() => {
    Board.open('menagerie'); const o = Hud.open, click = (sel) => { const b = document.querySelector(sel); if (b) b.click(); return !!b; };
    click('button[data-ans="coil:0"]'); for (const k of ['still', 'lioTruth', 'casings']) click(`button[data-pin="coil:${k}"]`); click('button[data-decide="coil"]');
    const d1 = Cases.doubt('menagerie'), lead1 = !!Cases.st('menagerie').leads.coil;
    click('button[data-ans="coil:0"]'); click('button[data-pin="coil:casings"]'); click('button[data-decide="coil"]');
    return { o, d1, lead1, lead: !!Cases.st('menagerie').leads.coil, zola: !!Actors.npcs.find((n) => n.def.name === 'Zola') };
  });
  await shot('board');
  await E(() => Hud.toggle(null));
  if (!clues.casings || clues.photo !== 'photo' || !clues.scan || !clues.still || lio.o !== 'talk' || !lio.wrong || lio.found !== 'casings,lio,lioTruth,notice,still' || lio.lead || board.o !== 'board' || board.d1 !== 1 || board.lead1 || !board.lead || !board.zola) fail('the clues did not come together ' + JSON.stringify({ clues, lio, board }));
  const test = await E(() => {
    const z = Actors.npcs.find((n) => n.def.name === 'Zola'); Player.place(z.x - 12, z.y); T_.run({}, 10); T_.tap('useHit'); const o = Hud.open;
    let b = document.querySelector('button[data-test="menagerie"]'); if (b) b.click(); const t = Hud.open;
    let asked = 0; for (const i of [0, 3]) { const q = document.querySelector('button[data-q="' + i + '"]'); if (q) { q.click(); asked++; Baseline.t = 3; } }
    return { o, t, asked, btns: [...document.querySelectorAll('#panelBody button')].map((x) => Object.keys(x.dataset).join()).join(' ') };
  });
  await sleep(300); await shot('test');
  const verdict = await E(() => {
    let b = document.querySelector('button[data-call="synth"]'); if (b) b.click(); const o = Hud.open;
    b = document.querySelector('button[data-verdict="menagerie:arrest"]'); if (b) b.click();
    return { o, closed: Cases.closed('menagerie'), clinic: !!Quests.available('clinic') };
  });
  if (test.o !== 'talk' || test.t !== 'test' || verdict.o !== 'talk' || !verdict.closed || !verdict.clinic) fail('the suspect was not tested and arrested ' + JSON.stringify({ test, verdict }));
  // a medpatch heals, a frag hurts
  const items = await E(() => {
    Hud.toggle(null); Game.s.hp = 40; Game.give('medpatch', 1); Game.give('frag', 1); Game.useItem('medpatch'); const hp = Game.s.hp;
    const e = Actors.enemies.find((q) => !ENEMY[q.type].boss && ENEMY[q.type].ai !== 'flyer' && q.hp > 0); Player.place(e.x - 50, e.y); Player.face = 1; const h0 = e.hp;
    Game.useItem('frag'); T_.run({}, 120); return { hp, hit: h0 - Math.max(0, e.hp) };
  });
  if (items.hp !== 75 || items.hit <= 0) fail('a medpatch or a frag did nothing ' + JSON.stringify(items));
  // every level loads and draws
  if (name === 'phone') {
    const lv = await E(() => { const bad = []; const here = Game.s.level; for (const id of Object.keys(LEVELS)) { try { Game.arrive(id, Object.keys((LEVELS[id].built || LEVELS[id].make()).spawns)[0]); for (const f of [0.2, 0.6]) { Player.x = World.L.w * f; for (let k = 0; k < 10; k++) step(1 / 60); render(); } } catch (e) { bad.push(id + ': ' + e.message); } } Game.arrive(here, 'enter'); return { n: Object.keys(LEVELS).length, bad }; });
    if (lv.bad.length || lv.n < 30) fail('levels failed to load: ' + JSON.stringify(lv));
    const cm = await E(() => { Hud.toggle('citymap'); const ok = !!WorldMap.img && !!$('worldcv'); const off = Object.keys(LEVELS).filter((id) => LEVELS[id].metres === undefined || LEVELS[id].mapX === undefined); Hud.toggle(null); return { ok, off }; });
    if (!cm.ok || cm.off.length) fail('the city map did not open, or places are missing from it ' + JSON.stringify(cm));
  }
  // a reload brings it back
  const before = await E(() => { Save.write(); return JSON.stringify({ l: Game.s.level, p: Game.s.programs, m: Game.s.gadgets, w: Game.s.flags.warden, g: Game.s.gear.on }); });
  await page.reload(); for (let i = 0; i < 60 && !(await page.evaluate(() => !!window.Downlevel)); i++) await sleep(200);
  const after = await E(() => JSON.stringify({ l: Game.s.level, p: Game.s.programs, m: Game.s.gadgets, w: Game.s.flags.warden, g: Game.s.gear.on }));
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
