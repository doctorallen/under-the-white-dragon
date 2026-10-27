'use strict';
// ---------------------------------------------------------------------------
// Dev settings, for testing: cheats and switches, kept in this browser only
// (localStorage `downlevel.dev`), never in the save.
// ---------------------------------------------------------------------------
const Dev = {
  // only for testing: ?dev in the address, or once it's been opened that way
  shown() { return /[?&]dev\b/.test(location.search) || !!(this.s && this.s.shown); },
  s: { god: false, ammo: false, freeze: false, fps: false, teleport: false, speed: 1, res: 'auto' },
  fps: 0, fa: 0, fn: 0,
  load() { try { Object.assign(this.s, JSON.parse(localStorage.getItem('downlevel.dev') || '{}')); } catch (e) { /* storage unavailable */ } if (/[?&]dev\b/.test(location.search) && !this.s.shown) { this.s.shown = true; this.save(); } },
  save() { try { localStorage.setItem('downlevel.dev', JSON.stringify(this.s)); } catch (e) { /* storage unavailable */ } },
  frame(dt) { this.fa += dt; this.fn++; if (this.fa >= 0.5) { this.fps = Math.round(this.fn / this.fa); this.fa = 0; this.fn = 0; } },
  html() {
    const s = Game.s, tog = (k, name, note) => `<label class="tog"><input type="checkbox" data-dev="${k}" ${this.s[k] ? 'checked' : ''}><span><b>${name}</b><small>${note}</small></span></label>`;
    const btn = (k, name) => `<button data-devdo="${k}">${name}</button>`;
    const spawns = Object.keys(LEVELS).map((id) => { const L = LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); return Object.keys(L.spawns).map((sp) => `<button data-devgo="${id}:${sp}">${LEVELS[id].name} · ${sp}</button>`).join(''); }).join('');
    return `<p class="sub">For testing. These live in this browser only, not in your save.</p>
      <h3>Switches</h3><div class="togs">${tog('god', 'God mode', 'Nothing hurts you.')}${tog('ammo', 'Endless charge', 'The blaster never runs dry.')}${tog('freeze', 'Stop the clock', 'Time of day stays put.')}${tog('teleport', 'Teleport from the map', 'Tap anywhere on the map to go there.')}${tog('fps', 'Frame rate', 'Shown by the clock.')}</div>
      <h3>Resolution · now ${View.out}× the view</h3><div class="buttons">${['auto', '1', '2', '3'].map((r) => `<button data-devres="${r}" class="${(this.s.res || 'auto') === r ? 'go' : ''}">${r === 'auto' ? 'Auto' : r + '×'}</button>`).join('')}</div><p class="dim">Auto starts at 3× and drops a step when frames run under 40 a second.</p>
      <h3>Run speed · ×${this.s.speed}</h3><input type="range" min="0.5" max="4" step="0.25" value="${this.s.speed}" data-devrange="speed">
      <h3>Time of day · ${Game.clock()}</h3><input type="range" min="0" max="23.99" step="0.25" value="${Game.hour()}" data-devrange="time">
      <h3>Give</h3><div class="buttons">${btn('cr', '+1000 cr')}${btn('parts', '+10 of every part')}${btn('gear', 'All gear')}${btn('gadgets', 'All gadgets')}${btn('programs', 'All programs')}${btn('heal', 'Heal, fill RAM')}${btn('levels', 'Every piece +1')}</div>
      <h3>The world</h3><div class="buttons">${btn('warden', 'Warden down')}${btn('lift', 'Lift restored')}${btn('been', 'Been everywhere')}${btn('nextcase', 'Skip to the next suspect')}${btn('cases', 'Close every case')}${btn('resetcases', 'Reset the cases')}${btn('kill', 'Kill everything here')}${btn('respawn', 'Respawn enemies')}${btn('undo', 'Restore stripped machines')}</div>
      <h3>Go to</h3><div class="buttons">${spawns}</div>
      <p class="dim">Credits ${s.cr} · day ${s.day} · level ${World.L.id} at ${Math.round(Player.x)}, ${Math.round(Player.y)}</p>`;
  },
  bind(body) {
    const s = Game.s;
    body.querySelectorAll('input[data-dev]').forEach((i) => (i.onchange = () => { this.s[i.dataset.dev] = i.checked; this.save(); }));
    body.querySelectorAll('input[data-devrange]').forEach((i) => (i.oninput = () => { const v = +i.value; if (i.dataset.devrange === 'speed') { this.s.speed = v; this.save(); } else { s.time = v; Actors.load(); } i.previousElementSibling.textContent = i.dataset.devrange === 'speed' ? 'Run speed · ×' + v : 'Time of day · ' + Game.clock(); }));
    const all = (o, keys) => { for (const k of keys) o[k] = 1; };
    const act = {
      cr: () => { s.cr += 1000; }, parts: () => { for (const k of SALVAGE_ORDER) Game.give(k, 10); },
      gear: () => all(s.gear.owned, Object.keys(GEAR)), gadgets: () => { all(s.gadgets, GADGET_ORDER); RunnerArt.cache.clear(); }, programs: () => { all(s.programs, PROGRAM_ORDER); s.prog = s.prog || 'breach'; },
      heal: () => { s.hp = T.player.hp; s.ram = T.ram.max; }, levels: () => { for (const id in s.gear.owned) s.gear.lvl[id] = Math.min(FAB.maxLevel, (s.gear.lvl[id] || 0) + 1); },
      warden: () => { s.flags.warden = true; Actors.load(); }, lift: () => { s.flags.lift = true; for (const p of World.props) p.spr = null; },
      been: () => { for (const id in LEVELS) s.flags['been:' + id] = true; },
      cases: () => { for (const id of QUEST_ORDER) s.quests[id] = { st: QUESTS[id].steps.length, n: 0, done: true }; for (const id of CASE_ORDER) s.cases[id] = { found: {}, leads: {}, done: true, verdict: 'arrest', synth: true }; }, resetcases: () => { s.quests = {}; s.cases = {}; s.night = null; s.track = null; },
      nextcase: () => { const id = CASE_ORDER.find((q) => !Cases.closed(q)); if (!id) return; if (!Cases.st(id)) { const C = CASES[id]; for (const a of C.after || []) if (QUESTS[a]) s.quests[a] = { st: 9, n: 0, done: true }; else s.cases[a] = { found: {}, leads: {}, done: true, verdict: 'arrest', synth: true }; Cases.start(id); } const C = CASES[id], c = Cases.st(id); for (const k in C.clues) c.found[k] = 1; for (const L of C.leads) c.leads[L.id] = 1; if (C.gate) s.flags[ENEMY[C.gate.boss].flag] = true; World.questProps(); Actors.questSpawns(); },
      kill: () => { for (const e of Actors.enemies.slice()) if (!e.ally) Actors.damage(e, 1e6, 1); }, respawn: () => Actors.load(),
      undo: () => { for (const p of World.props) if (p.done) { p.done = false; delete s.done[p.id]; p.spr = null; Props.init(p); } },
    };
    body.querySelectorAll('button[data-devdo]').forEach((b) => (b.onclick = () => { act[b.dataset.devdo](); Game.toast('Dev: ' + b.textContent + '.'); Hud.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-devres]').forEach((b) => (b.onclick = () => { this.s.res = b.dataset.devres; if (this.s.res === 'auto') View.q = 3; this.save(); View.resize(); Hud.panel('dev'); }));
    body.querySelectorAll('button[data-devgo]').forEach((b) => (b.onclick = () => { const [l, sp] = b.dataset.devgo.split(':'); Hud.toggle(null); Game.go(l, sp); }));
  },
};
