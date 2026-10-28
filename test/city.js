'use strict';
// The city run headless for a few days, and what passes between its
// residents counted: a season runner for tuning Bree (chat.js, CITY_BREE in
// city.js), not part of npm test. Each day it watches a few places at their
// busy hours as you would (the runner standing there, the game stepping a
// frame at a time) and counts the lines said over residents' heads, by where
// they came from, and how much of the time someone's talking; then it runs
// whole days off screen and counts the exchanges between residents (by kind,
// how they came out, how they ended), escalations, grudges and feuds, regard
// grown, gossip told, what people did with their days (the actions they
// started), and the time a day takes (main-thread CPU).
//   node test/city.js [days]          BREE='{"strike":0.25}' for other settings
// (run it on another checkout to compare: the output is the same shape there,
// with no exchanges)
const fs = require('fs'), path = require('path');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const ROOT = path.join(__dirname, '..'), DAYS = +(process.argv[2] || 2), OUT = path.join(__dirname, 'out');

// In the page: counting what's said and what passes between people
const PAGE = `
window.CR = {
  on: false,
  reset() { this.acts = {}; this.says = {}; this.lines = 0; this.steps = 0; this.talking = 0; this.seen = 0; this.ev = {}; this.kinds = {}; this.outcomes = {}; this.whys = {}; this.turns = 0; },
  init() {
    this.reset();
    const self = this, say = Actors.say;
    // (where a line came from: Bree's turns, the barks of Town.chatter, Lin at the counter, a witness)
    Actors.say = function (n, text) {
      if (self.on && n && n.def && n.def.town) { const st = String(new Error().stack), k = /\\.turn /.test(st) ? 'between residents' : /\\.react /.test(st) ? 'witnesses' : /\\.arrived /.test(st) ? 'at the counter' : /^(Morning|Afternoon|Evening)/.test(text) ? 'greetings' : 'walking together'; self.says[k] = (self.says[k] || 0) + 1; self.lines++; }
      return say.apply(this, arguments);
    };
    return true;
  },
  hook() {
    const w = City.w; if (!w || w.__cr) return; w.__cr = true;
    w.hooks.push({ name: 'city-runner', started: (p, d) => { if (d.kind === 'act') this.acts[d.action] = (this.acts[d.action] || 0) + 1; } });
    for (const k of ['bree:start', 'bree:end', 'bree:turn', 'bree:escalated', 'bree:grudge', 'bree:feud', 'bree:mended', 'bree:witnessed', 'told']) w.on(k, (e) => {
      this.ev[k] = (this.ev[k] || 0) + 1;
      if (k === 'bree:end') { const kind = e.first + (e.kind !== e.first ? ' to ' + e.kind : ''); this.kinds[kind] = (this.kinds[kind] || 0) + 1; this.outcomes[e.outcome] = (this.outcomes[e.outcome] || 0) + 1; this.whys[e.why] = (this.whys[e.why] || 0) + 1; this.turns += e.n; }
    });
  },
  regard() {
    const w = City.w, rel = (w.s.mod.fellowship && w.s.mod.fellowship.rel) || {}, o = { known: 0, friends: 0, sour: 0, sum: 0 };
    for (const k in rel) { const [a, b] = k.split('>'); if (!RESIDENTS[a] || !RESIDENTS[b]) continue; const r = w.fellowship.regard(a, b); o.known++; o.sum += r; if (r >= 0.3) o.friends++; if (r < -0.15) o.sour++; }
    o.sum = Math.round(o.sum); return o;
  },
  between() {
    const w = City.w, st = w.s.mod.bree; if (!st) return null;
    let n = 0, sum = 0; for (const a in st.g) for (const b in st.g[a]) { const g = w.bree.grudge(a, b); if (g > 0) { n++; sum += g; } }
    return { grudges: n, strength: Math.round(sum * 100) / 100, feuds: w.bree.feuds().length, pairs: Object.keys(st.pairs).length };
  },
  // the clock on to an hour (the minds run there)
  to(h) { this.hook(); Game.pass((h - Game.hour() + 24) % 24); City.sync(); },
  // a day off screen
  day() {
    this.hook(); this.reset(); const r0 = this.regard();
    Game.pass(24); City.sync();
    const r = this.regard();
    return { exchanges: this.ev['bree:start'] || 0, turns: this.ev['bree:turn'] || 0, kinds: this.kinds, outcomes: this.outcomes, ended: this.whys, escalated: this.ev['bree:escalated'] || 0, grudgesFormed: this.ev['bree:grudge'] || 0, madeUp: this.ev['bree:mended'] || 0, witnessed: this.ev['bree:witnessed'] || 0, told: this.ev.told || 0, acts: this.acts, regardGrown: r.sum - r0.sum, regard: r, between: this.between(), state: JSON.stringify(City.w.s).length };
  },
  // watching a place for a while, a frame at a time (the game's own beats run on its clock)
  watch(level, spawn, x, hours) {
    this.hook(); Game.arrive(level, spawn); Hud.toggle(null); Game.fade = 0; Game.fadeTo = null;
    for (let i = 0; i < 40; i++) step(1 / 60);
    if (x !== null) Player.place(x, Player.y);
    this.reset(); this.on = true;
    const real = window.setTimeout, due = []; window.setTimeout = (fn, ms) => { due.push({ t: Game.t + (ms || 0) / 1000, fn }); return due.length; };
    const n = Math.round(hours * 3000);
    for (let i = 0; i < n; i++) {
      if (Hud.open) Hud.toggle(null);
      for (let k = 0; k < due.length; k++) if (due[k].t <= Game.t) { const f = due[k].fn; due.splice(k--, 1); f(); }
      step(1 / 60);
      const here = Actors.npcs.filter((q) => q.def.town && !q.hidden);
      this.steps++; this.seen += here.length; if (here.some((q) => q.bubble)) this.talking++;
    }
    this.on = false; window.setTimeout = real;
    return { level, hours, lines: this.lines, says: this.says, talking: this.talking / this.steps, people: this.seen / this.steps };
  },
};
true`;
// the places watched, at their busy hours: [hour, level, spawn, where to stand, hours]
const SCENES = [[7, 'd_dragon', 'door', 600, 2], [9.2, 'd_grocery', 'door', null, 1.5], [12, 'd_dragon', 'door', 900, 1], [14.2, 'd_apartments', 'door', null, 1.2], [17.2, 'd_grocery', 'door', null, 1.5], [18.8, 'd_noodles', 'door', 300, 2.2], [21.1, 'd_neonrow', 'west', 600, 1.4], [22.6, 'd_izakaya', 'door', null, 1]];

tk.run('city', async () => {
  const kit = await tk.launch(), server = await tk.serve(ROOT);
  try {
    const page = await kit.page(tk.DESKTOP), errors = tk.errorsOf(page);
    await page.goto(server.url + 'index.html?nogl'); await tk.sleep(800);
    await page.evaluate(() => Save.wipe()); await page.reload();
    await tk.waitFor(page, () => !!window.Downlevel, { timeout: 180000 });
    await page.evaluate(PAGE); await page.evaluate(() => { Hud.toggle(null); return CR.init(); });
    if (process.env.BREE) await page.evaluate((cfg) => { if (typeof CITY_BREE !== 'undefined') Object.assign(CITY_BREE, JSON.parse(cfg)); City.make(City.minutes(), null); }, process.env.BREE);
    const cdp = page.context ? await page.context().newCDPSession(page) : await page.createCDPSession(); await cdp.send('Performance.enable'); // (Playwright's, or puppeteer's)
    const cpu = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'ThreadTime').value * 1000;
    const E = (fn, arg) => page.evaluate(fn, arg);
    const watched = {}, days = [];
    for (let d = 0; d < DAYS; d++) for (const [h, lv, sp, x, hrs] of SCENES) {
      await E((h) => CR.to(h), h);
      const s = await E((a) => CR.watch(...a), [lv, sp, x, hrs]), W = (watched[lv] = watched[lv] || { hours: 0, lines: 0, talking: 0, people: 0, says: {} });
      W.hours += s.hours; W.lines += s.lines; W.talking += s.talking * s.hours; W.people += s.people * s.hours;
      for (const k in s.says) W.says[k] = (W.says[k] || 0) + s.says[k];
    }
    for (let d = 0; d < DAYS; d++) { const c0 = await cpu(), day = await E(() => CR.day()); day.cpuMs = Math.round((await cpu()) - c0); days.push(day); }
    // what was said on screen, a place at a time, and all together
    const all = { hours: 0, lines: 0, talking: 0, says: {} };
    console.log('On screen (lines over residents\' heads):');
    for (const lv in watched) {
      const W = watched[lv]; all.hours += W.hours; all.lines += W.lines; all.talking += W.talking; for (const k in W.says) all.says[k] = (all.says[k] || 0) + W.says[k];
      console.log(`  ${lv.padEnd(13)} ${(W.lines / W.hours).toFixed(1).padStart(5)} lines an hour, someone talking ${Math.round(W.talking / W.hours * 100)}% of the time, ${(W.people / W.hours).toFixed(1)} people about`);
    }
    console.log(`  all           ${(all.lines / all.hours).toFixed(1).padStart(5)} lines an hour, someone talking ${Math.round(all.talking / all.hours * 100)}% of the time, over ${all.hours.toFixed(1)} hours: ${JSON.stringify(all.says)}`);
    console.log('Off screen, a day at a time:');
    for (const d of days) console.log(`  ${d.cpuMs} ms: ${Object.entries(d.acts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ' ' + v).join(', ')}; ${d.exchanges} exchanges (${d.turns} turns) ${JSON.stringify(d.kinds)}, came out ${JSON.stringify(d.outcomes)}, ended ${JSON.stringify(d.ended)}; ${d.escalated} escalated, ${d.grudgesFormed} grudges formed or deepened, ${d.madeUp} made up, ${d.witnessed} seen, ${d.told} told on; regard grown ${d.regardGrown} (${JSON.stringify(d.regard)}); between them now ${JSON.stringify(d.between)}; the minds ${Math.round(d.state / 1024)} KB`);
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'city.json'), JSON.stringify({ bree: process.env.BREE || null, watched, days }, null, 1));
    return errors.map((e) => 'page error: ' + e);
  } finally { await kit.close(); await server.close(); }
});
