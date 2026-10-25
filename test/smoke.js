'use strict';
// The game played headlessly in Chrome, sideways on a phone and on a desktop:
// it boots without an error; the folk stands in the burrow; digging down
// takes rock out and finds go in the bag; the old pick won't bite stone; a
// ladder line takes you home and the bag unpacks into the bins and shelves;
// the bench makes a bronze pick from the bins, which then digs stone; a
// reload brings back the dug tiles, the kit and the bins. Screenshots go to
// test/out. Chrome comes from $CHROME (puppeteer-core), or, where that isn't
// installed, the playwright package's own Chromium.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const PHONE = { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1 };

function serve() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
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

async function run(B, url, vp, name, failures) {
  const fail = (m) => failures.push(name + ': ' + m);
  const page = await B.page(vp), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  await sleep(1200);
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${name}-${n}.png`) });
  await page.evaluate(() => { Save.wipe(); }); // (wipe, not clear: leaving the page saves)
  await page.reload(); await sleep(1200);
  // in the burrow
  const st = await page.evaluate(() => ({ home: Player.home, ground: Player.ground, frame: Game.frame }));
  if (!st.home) fail('the folk does not start at home');
  if (!st.frame) fail('the loop is not running');
  await shot('home');
  // dig straight down for a while, leaving a ladder line behind
  const dug = await page.evaluate(() => {
    Hud.toggle(null); Game.s.ladders = 400; const y0 = Player.y, n0 = World.dug.length;
    for (let k = 0; k < 60 * 30; k++) { Input.dig = true; Input.ay = 1; Input.ax = 0; if (k % 6 === 0) Input.ladderHit = true; step(1 / 60); }
    Input.dig = false; Input.ay = 0;
    return { down: (Player.y - y0) / T.tile, tiles: World.dug.length - n0, bag: Game.s.bag.length, toasts: Game.toasts.map((t) => t.text) };
  });
  if (dug.down < 30) fail(`dug only ${dug.down.toFixed(1)} tiles down in 30 s`);
  if (!dug.bag) fail('nothing went in the bag on the way down');
  await shot('down');
  // the old pick on stone
  const hard = await page.evaluate(() => {
    const x = Math.floor(Player.x / T.tile), y = Math.floor((Player.y + 1) / T.tile);
    World.tiles[y * World.w + x] = M.STONE; Paint.changed(x, y);
    for (let k = 0; k < 120; k++) { Input.dig = true; Input.ay = 1; step(1 / 60); }
    Input.dig = false; Input.ay = 0;
    return { still: World.at(x, y) === M.STONE, said: Game.toasts.some((t) => /Too hard/.test(t.text)), x, y };
  });
  if (!hard.still) fail('the old pick dug stone');
  if (!hard.said) fail('no word that the rock is too hard');
  // up the ladders, home; the bag unpacks
  const up = await page.evaluate(() => {
    let t = 0; for (; t < 60 * 90 && !Player.home; t++) { Input.ay = -1; Input.ax = 0; step(1 / 60); }
    Input.ay = 0; for (let k = 0; k < 20; k++) step(1 / 60);
    return { home: Player.home, secs: t / 60, bag: Game.s.bag.length, store: Object.values(Game.s.store).reduce((a, b) => a + b, 0), cat: Object.keys(Game.s.catalog).length };
  });
  if (!up.home) fail('could not climb home by the ladders');
  if (up.bag) fail('the bag did not unpack at home');
  if (!up.store || !up.cat) fail('nothing reached the bins, shelves or catalog');
  await shot('unpacked');
  // the bench: a bronze pick from the bins
  const made = await page.evaluate(() => {
    Object.assign(Game.s.store, { copper: 12, tin: 5, coal: 5 });
    Hud.toggle('bench');
    const b = document.querySelector('button[data-r="bronzePick"]'); if (!b || b.disabled) return { ok: false, why: 'no Make button' };
    b.click();
    return { ok: Game.s.pick === 2, copper: Game.s.store.copper };
  });
  await shot('bench');
  if (!made.ok) fail('the bench did not make a bronze pick ' + (made.why || ''));
  if (made.copper !== 6) fail(`the bronze pick cost the wrong copper (left ${made.copper})`);
  // ... which bites stone
  const bites = await page.evaluate(({ x, y }) => {
    Hud.toggle(null); Player.place((x + 0.5) * T.tile, y * T.tile);
    for (let k = 0; k < 60 * 3; k++) { Input.dig = true; Input.ay = 1; Input.ax = 0; step(1 / 60); }
    Input.dig = false; Input.ay = 0; return World.at(x, y) !== M.STONE;
  }, hard);
  if (!bites) fail('the bronze pick does not dig stone');
  // a reload brings it all back
  const before = await page.evaluate(() => { Save.write(); return { dug: World.dug.length, pick: Game.s.pick, store: JSON.stringify(Game.s.store) }; });
  await page.reload(); await sleep(1200);
  const after = await page.evaluate(() => ({ dug: World.dug.length, pick: Game.s.pick, store: JSON.stringify(Game.s.store) }));
  if (after.dug !== before.dug) fail(`the dug tiles did not come back (${before.dug} to ${after.dug})`);
  if (after.pick !== 2 || after.store !== before.store) fail('the kit or the bins did not come back');
  await page.evaluate(() => Hud.toggle('catalog')); await sleep(200); await shot('catalog');
  if (errors.length) fail('errors: ' + errors.slice(0, 5).join(' | '));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve(), url = `http://localhost:${server.address().port}/index.html?seed=${process.env.SEED || 20261025}`;
  let B; const failures = [];
  try { B = await browser(); } catch (e) { console.log('::error title=smoke::no browser: ' + String(e.stack || e).replace(/\n/g, ' ')); throw e; }
  try {
    await run(B, url, PHONE, 'phone', failures);
    await run(B, url, DESKTOP, 'desktop', failures);
  } catch (e) { failures.push('crashed: ' + (e.stack || e)); }
  await B.b.close(); server.close();
  if (failures.length) {
    console.log('smoke: FAILED\n  ' + failures.join('\n  '));
    // on GitHub Actions, as annotations too, so they show on the run's page
    if (process.env.GITHUB_ACTIONS) for (const f of failures) console.log('::error title=smoke::' + f.replace(/\n/g, ' ').slice(0, 900));
    process.exit(1);
  }
  console.log('smoke: ok');
})();
