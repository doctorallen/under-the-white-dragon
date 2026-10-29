'use strict';
// ---------------------------------------------------------------------------
// Dev tools, for testing (?dev in the address, or once it's been opened that
// way): Tycho's dev drawer (Tycho.dev.Drawer, vendor/tycho/docs/dev.md),
// docked at the right while the game runs on behind it, opened with the `
// key or the Dev button (or Dev in the pause menu). Its tabs:
//   Mind    the picked resident's mind (tap one on screen, or pick from a
//           list): what they're doing and until when, needs, mood, why they
//           chose it and what they'd choose now, today, lately, who they
//           know (Tycho.inspect.mind), live
//   Events  what's happening in the city: Tyrell's log (Westmarch) and the
//           game's own notes (a strip, a job taken or handed back, heat), by kind
//   World   the clock, the weather, the city's counts, this level and who's
//           in it, you, the frame
//   Tools   the switches, the weather, resolution, run speed and time of day
//           (steppers, never sliders), give, the world, time walk, Tyrell
//           mode's city map, Go to someone, Go to a place
// and overlays over the game: names and what they're doing over heads, the
// collision boxes, what Use reaches, the spots and doors the residents use,
// the painted chunks. A tag at the foot of the screen stays up while a
// setting that changes play (run speed, the clock, the weather, the
// resolution) is off its default. Settings live in this browser only
// (localStorage `downlevel.dev`), never in the save.
// ---------------------------------------------------------------------------
const DEV_FLAGS = new Tycho.dev.Flags('downlevel.dev', { freeze: false, fps: false, teleport: false, speed: 1, res: 'auto', weather: 'auto' });
// the settings that change play, with their defaults (the tag names them while they're off)
const DEV_PLAY = [
  { key: 'speed', def: 1, word: (v) => 'run ×' + v },
  { key: 'freeze', def: false, word: () => 'clock stopped' },
  { key: 'weather', def: 'auto', word: (v) => 'weather: ' + v },
  { key: 'res', def: 'auto', word: (v) => 'resolution ' + v + '×' },
];
const DEV_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
// Tyrell's log as the events show it: each kind of entry, the events' kind
// it goes under, and its words (N a person's name, P a place's)
const DEV_LOG = {
  'set-out': ['moves', (e, d, N, P) => `${N(e.who)} sets out for ${P(d.to)}${d.for ? ' (' + d.for + ')' : ''}`],
  arrived: ['moves', (e, d, N, P) => `${N(e.who)} gets to ${P(d.place)}`],
  started: ['doing', (e, d, N, P) => `${N(e.who)}: ${d.action}${d.place ? ' at ' + P(d.place) : ''}${d.target ? ' with ' + N(d.target) : ''}`],
  finished: ['doing', (e, d, N) => `${N(e.who)} finishes ${d.action}`],
  stopped: ['doing', (e, d, N) => `${N(e.who)} stops ${d.action} part way (${Math.round((d.frac || 0) * 100)}%)`],
  interrupted: ['doing', (e, d, N) => `${N(e.who)} is interrupted at ${d.action}: ${d.why}`],
  failed: ['doing', (e, d, N) => `${N(e.who)} couldn't: ${d.why}`],
  directed: ['doing', (e, d, N) => `${N(e.who)} is told to ${d.do}${d.label ? ': ' + d.label : ''}`],
  released: ['doing', (e, d, N) => `${N(e.who)} is let off ${d.do}`],
  exchanged: ['talk', (e, d, N) => `${N(e.who)} and ${(d.with || []).map(N).join(', ')}: ${d.kind}, ${d.outcome} (${d.turns} turns)`],
  talked: ['talk', (e, d, N) => `${N(e.who)} talked with ${N(d.by)}${d.threads && d.threads.length ? ': ' + d.threads.join(', ') : ''}`],
  escalated: ['rows', (e, d, N) => `${N(e.who)}'s ${d.from} with ${N(d.against)} turns into ${d.to}`],
  grudge: ['rows', (e, d, N) => `${N(e.who)} holds a grudge against ${N(d.against)} (${d.why}, ${(+d.strength).toFixed(2)})`],
  feud: ['rows', (e, d, N) => `${N(e.who)} and ${N(d.with)}: a feud${d.strength ? ' ' + (+d.strength).toFixed(2) : ' over'} (${d.why})`],
  mended: ['rows', (e, d, N) => `${N(e.who)} and ${N(d.with)} make it up (${d.why})`],
  saw: ['rows', (e, d, N) => `${N(e.who)} sees ${N(d.actor)}'s ${d.kind}${d.against ? ' with ' + N(d.against) : ''}`],
  sensed: ['crime', (e, d, N) => `${N(e.who)}: ${d.kind}${d.what ? ' (' + d.what + ')' : ''}, seen by ${(d.by || []).map(N).join(', ') || 'nobody'}`],
  witnessed: ['crime', (e, d, N) => `${N(e.who)} saw ${N(d.actor)} ${d.kind}${d.what ? ' the ' + d.what : ''}${d.recognized === false ? ', not knowing who' : ''}`],
  report: ['crime', (e, d, N) => `${N(e.who)} reports ${N(d.actor)}'s ${d.kind}`],
  silenced: ['crime', (e, d, N) => `${N(e.who)} keeps quiet about ${N(d.actor)} (${d.how}${d.ok === false ? ', not believed' : ''})`],
  exposed: ['crime', (e, d, N) => `everyone knows about ${N(e.who)}: ${d.key}`],
  told: ['word', (e, d, N) => `${N(e.who)} tells ${N(d.to)} about ${d.key}${d.lie ? ' (a lie)' : ''}`],
  owes: ['word', (e, d, N) => `${N(e.who)} owes ${N(d.target)}`],
  felt: ['feel', (e, d, N) => `${N(e.who)} feels ${d.label || d.feeling}${d.cause && !/^[a-z]\d+$/.test(d.cause) ? ' (' + N(d.cause) + ')' : ''}`], // (a cause that's only an exchange's number left out)
  broke: ['feel', (e, d, N) => `${N(e.who)} breaks down: ${d.kind}`],
  met: ['bonds', (e, d, N) => `${N(e.who)} spends time with ${N(d.target)} (${d.minutes} min)`],
  regard: ['bonds', (e, d, N) => `${N(e.who)} thinks ${d.by > 0 ? 'more' : 'less'} of ${N(d.target)} (${d.why})`],
  sentiment: ['bonds', (e, d, N) => `${N(e.who)} feels ${d.label} toward ${N(d.target)}`],
  did: ['deeds', (e, d, N) => { const t = d.for || d.to || d.target; return `${N(e.who)}: ${d.verb}${t ? ' → ' + N(t) : ''}`; }],
  fact: ['world', (e, d) => `${d.key} = ${JSON.stringify(d.value)}`],
  day: ['world', (e, d) => `day ${d.day}`],
  director: ['world', (e, d, N, P) => `the city's director: ${d.storylet}${d.place ? ' at ' + P(d.place) : ''}`],
  gone: ['world', (e, d, N) => `${N(e.who)} leaves for good (${d.why})`],
};
const DEV_KINDS = ['strip', 'job', 'heat', 'crime', 'rows', 'word', 'deeds', 'feel', 'world', 'talk', 'bonds', 'doing', 'moves'];

const Dev = {
  flags: DEV_FLAGS,
  get s() { return this.flags.s; },
  shown() { return this.flags.shown(); },
  // the frame rate, by the drawer (shown by the clock with the fps switch)
  get fps() { return Math.round(this.drawer.fps); },
  load() { this.flags.load(); },
  save() { this.flags.save(); },
  start() { this.drawer.start(); this.hook(); },
  q: '', lastM: 0,
  // a Tyrell time (game minutes) as day and clock
  when(t) { const h = (t / 60) % 24; return 'day ' + Math.floor(t / 1440) + ' ' + String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); },
  // every frame: the drawer (and, when the clock went back, the game's notes from the future gone)
  frame(dt) {
    const m = City.minutes(); if (m < this.lastM) this.drawer.notes.rewind(m); this.lastM = m;
    this.drawer.frame(dt);
  },
  // how the frame's time went (ms), for the drawer's line
  times(sim, draw, hud) { const D = this.drawer; D.time('sim', sim); D.time('draw', draw); D.time('hud', hud); },
  note(kind, text) { this.drawer.note(kind, text); },
  // with the drawer docked over the right of the screen, the camera keeps
  // the runner in the middle of what's left (view px)
  shift() { const c = this.drawer.cover; return c.right || c.left ? ((c.right - c.left) / 2) * (window.devicePixelRatio || 1) / View.scale : 0; },
  name(id) { return id === 'player' ? 'you' : RESIDENTS[id] ? RESIDENTS[id].name : (City.on && City.w.get(id) && City.w.get(id).name) || id || 'someone'; },
  place(pid) { return Census.places[pid] ? Census.places[pid].label : pid || 'anywhere'; },

  // ---- a setting changed (a stepper, a switch, a choice) ----------------------------------
  set(k, v, d) {
    const s = Game.s;
    if (k === 'time') { // (the time of day: forward, the clock runs on; back, the minds walk back)
      const dh = v - s.time;
      if (dh > 0) Game.pass(dh); else { s.time = v; while (s.time < 0) { s.time += 24; s.day--; } }
      City.sync(); Actors.load(); return;
    }
    d.store(k, v);
    if (k === 'res') { if (v === 'auto') View.q = 3; View.resize(); }
  },
  // ---- the drawer's buttons -------------------------------------------------------------------
  acts: {
    cr: () => { Game.s.cr += 1000; Dev.done('+1000 cr'); },
    salvage: () => { for (const k of SALVAGE_ORDER) Game.give(k, 10); Dev.done('+10 of every salvage'); },
    been: () => { for (const id in LEVELS) Game.s.flags['been:' + id] = true; Dev.done('been everywhere'); },
    undo: () => { for (const p of World.props) if (p.done) { p.done = false; delete Game.s.done[p.id]; p.spr = null; Props.init(p); } Dev.done('stripped machines restored'); },
    // Tyrell mode, the whole city's minds on its map (the drawer steps aside for it)
    tyrell: (id) => { Dev.drawer.close(); TyrellMode.view = 'city'; TyrellMode.level = null; Hud.toggle('tyrell'); if (id && RESIDENTS[id]) TyrellMode.ins.select(id); },
    // to someone: into their level, beside them
    go: (id) => { const st = Town.state(id, Game.hour()); if (!st.level || st.hidden) { Game.toast('Dev: ' + Dev.name(id) + ' is out of sight.', 'warn'); return false; } if (Hud.open) Hud.toggle(null); Dev.landAt = { level: st.level, x: st.x + 14, y: st.y }; Game.go(st.level, Object.keys(Census.built(st.level).spawns)[0]); return false; },
    // to a place, at its way in
    goto: (arg) => { const [l, sp] = arg.split(':'); if (Hud.open) Hud.toggle(null); Game.go(l, sp); return false; },
    pick: () => { Dev.drawer.select(null); },
  },
  done(what) { Game.toast('Dev: ' + what + '.'); Hud.refresh(); Save.write(); },

  // ---- picking someone: a tap on the game, near their feet ---------------------------------------
  pick(x, y) {
    if (Hud.open || Flight.on || !World.L || !City.on) return null;
    const V = View, sc = V.scale / (window.devicePixelRatio || 1), wx = x / sc + V.cx, wy = y / sc + V.cy;
    let best = null, bd = 14;
    for (const n of Actors.npcs) { if (n.hidden || !n.def.town || wy < n.y - 40 || wy > n.y + 6) continue; const dx = Math.abs(n.x - wx); if (dx < bd) { bd = dx; best = n; } }
    return best ? best.def.town : null;
  },

  // ---- Mind ---------------------------------------------------------------------------------------
  mindHtml(d) {
    if (!City.on) return d.hint('Tyrell isn\'t running: there are no minds to read.');
    const id = d.sel;
    if (!id || !RESIDENTS[id]) return this.pickHtml(d);
    const st = City.state(id), O = TyrellMode.ins.o;
    const where = st.gap ? 'between streets' : st.level ? LEVELS[st.level].name + (st.hidden ? ', indoors' : ` at x ${Math.round(st.x)}`) + (st.level === World.L.id ? ' (here)' : '') : 'nowhere drawn';
    return d.hint(`On screen: ${where} · ${st.act}${st.moving ? ', on the move' : ''} · <a data-devact="pick">someone else</a>`)
      + Tycho.inspect.mind(City.w, id, { prefix: 'dev', name: O.name, who: O.who, place: O.place, walking: O.walking, about: O.about, selectable: O.selectable, numbers: true, chances: true, table: true, now: true, options: 8,
        buttons: () => `<button data-devdo="go" ${st.level && !st.hidden ? '' : 'disabled'}>Go there</button><button data-devdo="tyrell">On the city map</button>` });
  },
  // nobody picked: who's here, and a box to find anyone
  pickHtml(d) {
    const here = Actors.npcs.filter((n) => n.def.town && !n.hidden), q = this.q.trim().toLowerCase();
    const btn = (id, note) => `<button data-devsel="${id}">${RESIDENTS[id].name} <small>${note}</small></button>`;
    let h = d.hint('Tap someone on screen to read their mind, or pick them here.');
    h += d.section('Here', World.L.name) + (here.length ? `<div class="buttons">${here.map((n) => btn(n.def.town, (n.townState && n.townState.act) || '')).join('')}</div>` : d.hint('Nobody about.'));
    h += d.section('Anyone') + `<div class="dev-chips"><input type="search" id="dev-who" data-findmind placeholder="find someone by name" value="${d.attr(this.q)}" autocomplete="off" spellcheck="false"></div>`;
    if (q) { const ids = TOWN_ORDER.filter((id) => RESIDENTS[id].name.toLowerCase().includes(q)); h += ids.length ? `<div class="buttons">${ids.slice(0, 40).map((id) => btn(id, Folk.who(id))).join('')}</div>` + (ids.length > 40 ? d.hint(`and ${ids.length - 40} more`) : '') : d.hint('Nobody by that name.'); }
    return h;
  },

  // ---- World ----------------------------------------------------------------------------------------
  worldHtml(d) {
    const s = Game.s, L = World.L, B = LEVELS[L.id];
    let h = d.section('Clock') + d.kv(`Day ${s.day} · ${Game.clock()}${this.s.freeze ? ' <span class="down">(stopped)</span>' : ''} · a day is ${T.day.length / 60} min${City.on ? ` · the minds at ${this.when(City.w.now)}, remembering back to ${this.when(City.w.esper.earliest())}` : ''}`);
    h += d.section('Weather') + d.kv(`${Weather.rain() > 0.01 ? 'raining ' + d.num(Weather.rain()) : Weather.wet() > 0.02 ? 'drying' : 'dry'} · wet ${d.num(Weather.wet())}${(this.s.weather || 'auto') !== 'auto' ? ` <span class="down">(forced ${this.s.weather})</span>` : ''} · here ${L.rain ? 'open to it' : 'under cover'}`);
    if (City.on) {
      const n = {}, out = { street: 0, inside: 0, between: 0 };
      for (const id of TOWN_ORDER) { const w = TyrellMode.where(id), k = TyrellMode.kind(w.st); n[k] = (n[k] || 0) + 1; if (w.between) out.between++; else if (w.out) out.street++; else out.inside++; }
      h += d.section('The city', TOWN_ORDER.length + ' people') + d.kv(Object.keys(TM_COL).filter((k) => n[k]).map((k) => `<span style="color:${TM_COL[k]}">●</span> ${TM_WORD[k]} <b>${n[k]}</b>`).join(' · '))
        + d.kv(`out in the streets ${out.street} · indoors ${out.inside} · between streets or riding ${out.between}`);
    }
    h += d.section('Here', `${L.id} · ${Travel.band(L.id) || 'hidden'}${B.meters !== undefined ? ' · ' + B.meters + ' m' : ''}`) + d.kv(`${L.name} · ${L.w}×${L.h} px · ${World.props.length} props (${World.props.filter((p) => p.done).length} done) · ${L.lights.length} lights · chunks ${Paint.count}`);
    const npcs = Actors.npcs.filter((n) => !n.hidden);
    h += npcs.length ? d.table(['who', 'doing'], npcs.map((n) => ({ cells: [n.def.town ? d.who(n.def.town, n.def.name) : d.esc(n.def.name), d.esc((n.townState && n.townState.act) || n.def.title || '') + (n.def.town && City.on && City.w.get(n.def.town) && City.w.get(n.def.town).doing ? ` <small>till ${Tycho.inspect.hhmm(City.w.get(n.def.town).doing.end)}</small>` : '')], cls: n.def.town && n.def.town === d.sel ? 'cur' : '' }))) : d.hint('Nobody about.');
    h += d.section('You') + d.kv(`x ${Math.round(Player.x)}, y ${Math.round(Player.y)} · ${s.cr} cr · heat ${s.heat} · ${Object.values(s.jobs).filter((j) => j.st === 'bench').length} on the bench · ${s.parts.length} parts`);
    h += d.section('The frame') + d.kv(`${d.frameText()} · ${View.gpu ? 'WebGL2' : '2D'} · ${View.w}×${View.h} view px at ${View.scale}× (finished at ${View.out}×, quality ${View.q})`);
    return h;
  },

  // ---- Tools -----------------------------------------------------------------------------------------
  toolsHtml(d) {
    const s = this.s, hh = (v) => { const t = ((v % 24) + 24) % 24; return String(Math.floor(t)).padStart(2, '0') + ':' + String(Math.floor((t % 1) * 60)).padStart(2, '0'); };
    let h = d.section('Switches') + d.chips(d.toggle({ key: 'freeze', on: !!s.freeze, label: 'Stop the clock', def: false }) + d.toggle({ key: 'teleport', on: !!s.teleport, label: 'Teleport from the map', title: 'Tap anywhere on the pause map to go there' }) + d.toggle({ key: 'fps', on: !!s.fps, label: 'Frame rate by the clock' }));
    h += d.section('Play') + '<div>' + d.stepper({ key: 'speed', label: 'Run speed', value: s.speed || 1, values: DEV_SPEEDS, fmt: (v) => '×' + v })
      + d.stepper({ key: 'time', label: 'Time of day', value: Game.s.time, step: [0.25, 1], fmt: hh, stepWord: (x) => (x >= 1 ? x + 'h' : x * 60 + 'm'), title: 'Forward, the clock runs on; back, the minds walk back (time walk)' }) + '</div>'
      + '<div>' + d.choice({ key: 'weather', label: 'Weather', value: s.weather || 'auto', options: [['auto', 'by the clock'], ['rain', 'rain'], ['dry', 'dry']] })
      + d.choice({ key: 'res', label: 'Resolution', value: s.res || 'auto', options: [['auto', 'auto'], ['1', '1×'], ['2', '2×'], ['3', '3×']] }) + '</div>'
      + d.hint(`Now ${View.out}× the view. Auto starts at 3× and drops a step when frames run under 40 a second.`);
    h += d.section('Give') + d.chips(d.button('cr', '+1000 cr') + d.button('salvage', '+10 of every salvage'));
    h += d.section('The world') + d.chips(d.button('been', 'Been everywhere') + d.button('undo', 'Restore stripped machines'));
    if (City.on) h += d.section('The city\'s minds', 'Tyrell') + d.chips(d.button('tyrell', 'Tyrell mode: the city map', { arg: d.sel || '' })) + d.hint(`Time walk is the time of day stepped back: the city remembers back to ${this.when(City.w.esper.earliest())}.`);
    h += d.section('Go to someone') + this.peopleHtml();
    h += d.section('Go to a place') + `<div class="dev-goto">${this.goHtml()}</div>`;
    return h;
  },
  // Go to, organized: the bands of the city from the top down, each street
  // with the rooms you walk into from it (and the rooms off those) beside it
  rooms() {
    if (this.kids) return this.kids;
    const kids = {};
    for (const id in LEVELS) { const L = LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); for (const p of L.props) if (p.to && (p.kind === 'door' || p.kind === 'trapdoor') && !p.out && !p.up && LEVELS[p.to[0]] && LEVELS[p.to[0]].hidden && p.to[0] !== id) (kids[id] = kids[id] || []).includes(p.to[0]) || (kids[id] = kids[id] || []).push(p.to[0]); }
    return (this.kids = kids);
  },
  goHtml() {
    const kids = this.rooms(), here = World.L.id, b = (id, sp, cls = '') => `<button data-devact="goto" data-devarg="${id}:${sp}" class="${cls}${id === here ? ' on' : ''}">${LEVELS[id].name}</button>`;
    const spawn = (id) => { const L = LEVELS[id].built; return L.spawns.enter ? 'enter' : L.spawns.door ? 'door' : Object.keys(L.spawns)[0]; };
    const seen = new Set(), tree = (id) => { seen.add(id); return (kids[id] || []).filter((k) => !seen.has(k)).map((k) => { seen.add(k); return b(k, spawn(k), 'room') + tree(k); }).join(''); };
    return STRATA.map((S) => {
      const ids = Object.keys(LEVELS).filter((id) => !LEVELS[id].hidden && LEVELS[id].meters !== undefined && Travel.band(id) === S.id).sort((a, c) => (LEVELS[a].mapX || 0) - (LEVELS[c].mapX || 0));
      if (!ids.length) return '';
      return `<details data-keep="band:${S.id}"><summary>${S.name} · ${ids.length}</summary>` + ids.map((id) => `<div class="dev-chips">${b(id, spawn(id))}${tree(id)}</div>`).join('') + '</details>';
    }).join('');
  },
  // Go to someone: grouped by where they live (the block's own first), each
  // with what they do and where they are now; a box to find someone by name
  peopleHtml() {
    const C = Census.places, groups = {};
    for (const id of TOWN_ORDER) { const R = RESIDENTS[id], k = !R.gen ? 'block' : C[R.homePlace] ? C[R.homePlace].street : 'block'; (groups[k] = groups[k] || []).push(id); }
    const who = (id) => { const R = RESIDENTS[id]; return R.age === 'kid' ? 'kid' : R.job ? R.job.title : R.age === 'senior' ? 'retired' : 'at home'; };
    const btn = (id) => { const st = Town.state(id, Game.hour()), at = st.level ? LEVELS[st.level].name : st.moving ? 'between streets' : st.hidden ? 'indoors' : 'away'; return `<button data-devact="go" data-devarg="${id}" data-name="${RESIDENTS[id].name.toLowerCase()}" ${st.level && !st.hidden ? '' : 'disabled'}>${RESIDENTS[id].name} <small>${who(id)} · ${at}${st.act ? ' · ' + st.act : ''}</small></button>`; };
    const order = ['block'].concat(STRATA.flatMap((S) => Object.keys(Census.streets).filter((k) => Census.streets[k].band === S.id)));
    return `<div class="dev-chips"><input type="search" id="dev-findwho" data-findwho placeholder="find someone by name" autocomplete="off" spellcheck="false"></div>` + order.filter((k) => groups[k]).map((k) => `<details class="dev-folk" data-keep="folk:${k}"${k === 'block' ? ' open' : ''}><summary>${k === 'block' ? 'The block' : 'Live in ' + LEVELS[k].name} · ${groups[k].length}</summary><div class="buttons">${groups[k].map(btn).join('')}</div></details>`).join('');
  },
  // the people found by name: only theirs shown, their groups opened
  filterWho(body) {
    const find = body.querySelector('#dev-findwho'); if (!find) return;
    const q = find.value.trim().toLowerCase();
    body.querySelectorAll('button[data-name]').forEach((b) => (b.hidden = !!q && !b.dataset.name.includes(q)));
    body.querySelectorAll('details.dev-folk').forEach((g) => { const any = [...g.querySelectorAll('button[data-name]')].some((b) => !b.hidden); g.hidden = !any; if (q) g.open = any; });
  },

  // ---- the events: Tyrell's log, as events (made once each) -------------------------------------------
  made: new WeakMap(), logList: [], logOf: null, logLast: null, logN: 0,
  logEvents() {
    if (!City.on) return [];
    const log = City.w.s.log, last = log[log.length - 1];
    if (log === this.logOf && last === this.logLast && log.length === this.logN) return this.logList;
    const N = (id) => this.name(id), P = (pid) => this.place(pid), out = [];
    for (const e of log) {
      let ev = this.made.get(e);
      if (ev === undefined) {
        const f = DEV_LOG[e.k], dd = e.d || {};
        // (Bree's 'joined' and 'parted' are someone joining or leaving a conversation; the core's 'joined', someone new in the world)
        ev = !f || (e.k === 'joined' || e.k === 'parted') ? null : { t: e.t, kind: f[0], text: f[1](e, dd, N, P) };
        this.made.set(e, ev);
      }
      if (ev) out.push(ev);
    }
    this.logOf = log; this.logLast = last; this.logN = log.length; this.logList = out;
    return out;
  },
  // the game's own notes: what you strip, the jobs, heat (hooked on here, so
  // the game's files needn't know the drawer)
  hook() {
    const wrap = (obj, key, after) => { const f = obj[key]; obj[key] = function (...a) { const before = after.before ? after.before.apply(this, a) : null; const r = f.apply(this, a); try { after.call(this, a, r, before); } catch (e) { /* (a note never breaks the game) */ } return r; }; };
    wrap(City, 'strip', function ([p]) { const saw = this.witnesses(p).filter((n) => n.def.town).map((n) => n.def.name); Dev.note('strip', `You strip ${p.label || 'the ' + p.kind} at ${World.L.name}: ${saw.length ? 'seen by ' + saw.join(', ') : 'nobody saw'}`); });
    const take = function ([id, pay]) { const J = this.def(id), c = this.st(id); Dev.note('job', `You take ${J.title} from ${J.name}${c.pay || pay ? ' for ' + (pay !== undefined ? pay : c.pay) + ' cr' : ''}`); };
    wrap(Jobs, 'take', take);
    const back = function ([id, collected], r, b) { if (!b) return; Dev.note('job', `${b.name} goes back to ${b.who}${collected ? ' (collected)' : ''}: ${b.res}`); };
    back.before = function (id) { const J = this.def(id), b = this.dev(id); return b && b.tested ? { name: J.title, who: J.name, res: b.tested.res } : null; };
    wrap(Jobs, 'handBack', back);
    const heat = function ([n, why], r, was) { if (Game.s.heat !== was) Dev.note('heat', `Heat ${Game.s.heat > was ? '+' : ''}${Game.s.heat - was} to ${Game.s.heat}${why ? ': ' + why : ''}`); };
    heat.before = () => Game.s.heat;
    wrap(Jobs, 'heat', heat);
  },

  // ---- the overlays, drawn over the game each frame ------------------------------------------------------
  overlays() {
    const D = this.drawer, lay = D.layer();
    if (!lay || Hud.open || Flight.on || !World.L) return;
    const g = lay.g, V = View, sc = V.scale / (window.devicePixelRatio || 1), X = (x) => (x - V.cx) * sc, Y = (y) => (y - V.cy) * sc, L = World.L;
    const box = (x0, y0, x1, y1, fill, line) => { if (fill) { g.fillStyle = fill; g.fillRect(X(x0), Y(y0), (x1 - x0) * sc, (y1 - y0) * sc); } if (line) { g.strokeStyle = line; g.lineWidth = 1; g.strokeRect(X(x0) + 0.5, Y(y0) + 0.5, (x1 - x0) * sc - 1, (y1 - y0) * sc - 1); } };
    const text = (s, x, y, col, bg) => { const w = g.measureText(s).width + 6; g.fillStyle = bg || 'rgba(10,14,20,0.75)'; g.fillRect(x - w / 2, y - 7, w, 13); g.fillStyle = col; g.fillText(s, x - w / 2 + 3, y); };
    g.font = '11px ui-monospace, Menlo, monospace'; g.textBaseline = 'middle';
    if (D.overlay('chunks')) {
      const CS = T.chunk;
      for (let ky = Math.floor(V.cy / CS); ky * CS < V.cy + V.h; ky++) for (let kx = Math.floor(V.cx / CS); kx * CS < V.cx + V.w; kx++) { if (kx < 0 || ky < 0 || kx * CS >= L.w || ky * CS >= L.h) continue; box(kx * CS, ky * CS, (kx + 1) * CS, (ky + 1) * CS, null, Paint.has(kx, ky) ? 'rgba(80,255,120,0.6)' : 'rgba(255,60,60,0.8)'); text(`${kx},${ky}`, X(kx * CS) + 22, Y(ky * CS) + 10, '#d8e6f0'); }
    }
    if (D.overlay('boxes')) {
      for (const b of L.solids) box(b.x0, b.y0, b.x1, b.y1, 'rgba(255,60,60,0.14)', 'rgba(255,80,80,0.8)');
      for (const p of World.props) if (p.block && !p.done) box(p.block.x0, p.block.y0, p.block.x1, p.block.y1, 'rgba(255,170,40,0.16)', 'rgba(255,170,40,0.9)');
      g.lineWidth = 2;
      for (const w of L.ways) { g.strokeStyle = 'rgba(80,255,140,0.9)'; g.beginPath(); g.moveTo(X(w.x0), Y(w.y0)); g.lineTo(X(w.x1), Y(w.y1)); g.stroke(); }
      for (const l of L.ladders) { g.strokeStyle = 'rgba(80,200,255,0.9)'; g.beginPath(); g.moveTo(X(l.x), Y(l.y0)); g.lineTo(X(l.x), Y(l.y1)); g.stroke(); }
      const P = T.player; box(Player.x - P.w / 2, Player.y - P.h, Player.x + P.w / 2, Player.y, 'rgba(255,225,74,0.2)', '#ffe14a');
    }
    if (D.overlay('use')) {
      for (const p of World.props) {
        if (p.kind === 'deco') continue;
        const reach = p.kind === 'exit' ? 14 : p.kind === 'car' ? 44 : 18 + (p.block ? (p.block.x1 - p.block.x0) / 2 : 0), dy = p.kind === 'exit' ? 24 : 26, cy = p.kind === 'exit' ? p.y + 16 : p.y;
        const on = Player.target && Player.target.p === p;
        box(p.x - reach, cy - dy, p.x + reach, cy + dy, on ? 'rgba(58,240,224,0.16)' : null, on ? '#3af0e0' : 'rgba(200,160,255,0.45)');
        text(p.kind + (p.done ? ' (done)' : ''), X(p.x), Y(cy - dy) - 8, on ? '#3af0e0' : '#c8b0ff');
      }
    }
    if (D.overlay('spots')) {
      const C = Census.places;
      for (const pid in C) {
        const pl = C[pid];
        if (pl.kind === 'door' ? pl.street !== L.id : pl.level !== L.id) continue;
        if (pl.kind === 'door') { text(pl.label, X(pl.x), Y(pl.G || L.ground || 0) - 60 * sc / 2, '#b0a6c0'); continue; }
        for (const act in pl.spots) for (const q of pl.spots[act]) { g.fillStyle = '#ff4ab0'; g.fillRect(X(q.x) - 2, Y(q.y) - 2, 4, 4); text(act, X(q.x), Y(q.y) + 9, '#ff9ad0'); }
      }
    }
    if (D.overlay('names')) {
      const placed = []; // (a label that would cover another goes up over it)
      for (const n of Actors.npcs.filter((q) => !q.hidden).sort((a, b) => a.x - b.x)) {
        const x = X(n.x), id = n.def.town, p = id && City.on ? City.w.get(id) : null, sel = id && id === D.sel;
        const d = p && p.doing, l1 = n.def.name + (d ? ` · ${d.action} ${Tycho.inspect.hhmm(d.end)}` : n.townState ? ' · ' + n.townState.act : n.def.title ? ' · ' + n.def.title : '');
        let worst = null; if (p) for (const k of Object.keys(p.needs)) { const v = City.w.needOf(id, k); if (!worst || v > worst[1]) worst = [k, v]; }
        const l2 = worst ? `${worst[0]} ${worst[1].toFixed(2)}${City.w.reverie ? ' · mood ' + (City.w.reverie.mood(id) || 0).toFixed(2) : ''}` : '';
        const w = Math.max(g.measureText(l1).width, l2 ? g.measureText(l2).width : 0) + 8, h = l2 ? 26 : 14;
        let y = Y(n.y - 42);
        for (let moved = true, k = 0; moved && k < 6; k++) { moved = false; for (const q of placed) if (Math.abs(x - q.x) < (w + q.w) / 2 + 2 && y > q.y - q.h - 2 && y - h < q.y + 2) { y = q.y - q.h - 2; moved = true; } }
        placed.push({ x, y, w, h });
        g.fillStyle = sel ? 'rgba(80,60,0,0.88)' : 'rgba(10,14,20,0.72)'; g.fillRect(x - w / 2, y - h, w, h);
        g.fillStyle = sel ? '#ffe14a' : '#e8f6ff'; g.fillText(l1, x - w / 2 + 4, y - h + 7);
        if (l2) { g.fillStyle = worst[1] > 0.7 ? '#ff8a7a' : '#9ad0a8'; g.fillText(l2, x - w / 2 + 4, y - h + 19); }
      }
    }
  },
};

// the drawer itself: its tabs, overlays and settings
Dev.drawer = new Tycho.dev.Drawer({
  flags: DEV_FLAGS, prefix: 'dev', title: 'DEV', label: 'Dev tools', side: 'right', layer: true,
  button: () => $('bDev'),
  tabs: [
    { id: 'mind', every: 0.5, html: (d) => Dev.mindHtml(d) },
    { id: 'events', events: true },
    { id: 'world', every: 0.5, html: (d) => Dev.worldHtml(d) },
    { id: 'tools', every: 0, html: (d) => Dev.toolsHtml(d), bind: (body) => Dev.filterWho(body) },
  ],
  overlays: [
    { id: 'names', on: true, title: 'Names and what they\'re doing over heads' },
    { id: 'boxes', title: 'What\'s solid, the walkways and stairs, the ladders, the runner' },
    { id: 'use', title: 'What Use reaches' },
    { id: 'spots', title: 'Where the residents sit and stand, and the doors they go in' },
    { id: 'chunks', title: 'The painted chunks' },
  ],
  play: DEV_PLAY, tagTab: 'tools',
  frame: (d) => d.esc(d.frameText()) + ` · ${View.gpu ? 'GPU' : '2D'} ${View.out}×`,
  set: (k, v, d) => Dev.set(k, v, d),
  acts: Dev.acts,
  input: { findwho: (v, el, e, d) => Dev.filterWho(d.body), findmind: (v, el, e, d) => { Dev.q = el.value; d.refresh(true); } },
  pick: (x, y) => Dev.pick(x, y), selectTab: 'mind',
  events: {
    most: 800, kinds: DEV_KINDS, apart: ['talk', 'bonds', 'doing', 'moves'], find: true,
    clock: () => City.minutes(),
    when: (t) => { const h = (t / 60) % 24; return 'd' + Math.floor(t / 1440) + ' ' + String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); },
    from: () => Dev.logEvents(),
    colors: { strip: '#ff4a6a', job: '#3aff80', heat: '#ffb040', crime: '#ff7a9a', rows: '#ff9a5a', talk: '#8ae6a0', word: '#c8a0ff', feel: '#ffd040', deeds: '#3af0e0' },
    hint: (f) => (['talk', 'bonds', 'doing', 'moves'].includes(f) ? '<small>left out of all: there are a lot of them</small>' : ''),
  },
});
