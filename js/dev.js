'use strict';
// ---------------------------------------------------------------------------
// Dev settings, for testing: cheats and switches, kept in this browser only
// (localStorage `downlevel.dev`), never in the save.
// ---------------------------------------------------------------------------
const Dev = {
  // only for testing: ?dev in the address, or once it's been opened that way
  shown() { return /[?&]dev\b/.test(location.search) || !!(this.s && this.s.shown); },
  s: { freeze: false, fps: false, teleport: false, speed: 1, res: 'auto' },
  fps: 0, fa: 0, fn: 0,
  load() { try { Object.assign(this.s, JSON.parse(localStorage.getItem('downlevel.dev') || '{}')); } catch (e) { /* storage unavailable */ } if (/[?&]dev\b/.test(location.search) && !this.s.shown) { this.s.shown = true; this.save(); } },
  save() { try { localStorage.setItem('downlevel.dev', JSON.stringify(this.s)); } catch (e) { /* storage unavailable */ } },
  // a Tyrell time (game minutes) as day and clock
  when(t) { const h = (t / 60) % 24; return 'day ' + Math.floor(t / 1440) + ' ' + String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); },
  frame(dt) { this.fa += dt; this.fn++; if (this.fa >= 0.5) { this.fps = Math.round(this.fn / this.fa); this.fa = 0; this.fn = 0; } },
  // Go to, organized: the bands of the city from the top down, each street
  // with the rooms you walk into from it (and the rooms off those) beside it
  rooms() {
    if (this.kids) return this.kids;
    const kids = {};
    for (const id in LEVELS) { const L = LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); for (const p of L.props) if (p.to && (p.kind === 'door' || p.kind === 'trapdoor') && !p.out && !p.up && LEVELS[p.to[0]] && LEVELS[p.to[0]].hidden && p.to[0] !== id) (kids[id] = kids[id] || []).includes(p.to[0]) || (kids[id] = kids[id] || []).push(p.to[0]); }
    return (this.kids = kids);
  },
  goHtml() {
    const kids = this.rooms(), here = World.L.id, b = (id, sp, cls = '') => `<button data-devgo="${id}:${sp}" class="${cls}${id === here ? ' go' : ''}">${LEVELS[id].name}</button>`;
    const spawn = (id) => { const L = LEVELS[id].built; return L.spawns.enter ? 'enter' : L.spawns.door ? 'door' : Object.keys(L.spawns)[0]; };
    const seen = new Set(), tree = (id) => { seen.add(id); return (kids[id] || []).filter((k) => !seen.has(k)).map((k) => { seen.add(k); return b(k, spawn(k), 'room') + tree(k); }).join(''); };
    return STRATA.map((S) => {
      const ids = Object.keys(LEVELS).filter((id) => !LEVELS[id].hidden && LEVELS[id].metres !== undefined && Travel.band(id) === S.id).sort((a, c) => (LEVELS[a].mapX || 0) - (LEVELS[c].mapX || 0));
      if (!ids.length) return '';
      return `<h4 class="band">${S.name}</h4><div class="streets">` + ids.map((id) => `<div class="street">${b(id, spawn(id))}${tree(id)}</div>`).join('') + '</div>';
    }).join('');
  },
  // Go to someone: where each resident is now, and what they're doing
  // grouped by where they live (the block's own first), each with what they
  // do and where they are now; a box to find someone by name
  peopleHtml() {
    const C = Census.places, groups = {};
    for (const id of TOWN_ORDER) { const R = RESIDENTS[id], k = !R.gen ? 'block' : C[R.homePlace] ? C[R.homePlace].street : 'block'; (groups[k] = groups[k] || []).push(id); }
    const who = (id) => { const R = RESIDENTS[id]; return R.age === 'kid' ? 'kid' : R.job ? R.job.title : R.age === 'senior' ? 'retired' : 'at home'; };
    const btn = (id) => { const st = Town.state(id, Game.hour()), at = st.level ? LEVELS[st.level].name : st.moving ? 'between streets' : st.hidden ? 'indoors' : 'away'; return `<button data-devwho="${id}" data-name="${RESIDENTS[id].name.toLowerCase()}" ${st.level && !st.hidden ? '' : 'disabled'}><b>${RESIDENTS[id].name}</b> <small>${who(id)} · ${at}${st.act ? ' · ' + st.act : ''}</small></button>`; };
    const order = ['block'].concat(STRATA.flatMap((S) => Object.keys(Census.streets).filter((k) => Census.streets[k].band === S.id)));
    return `<input class="devfind" data-devfind type="search" placeholder="Find someone by name" autocomplete="off">` + order.filter((k) => groups[k]).map((k) => `<details class="folk"${k === 'block' ? ' open' : ''}><summary>${k === 'block' ? 'The block' : 'Live in ' + LEVELS[k].name} · ${groups[k].length}</summary><div class="buttons">${groups[k].map(btn).join('')}</div></details>`).join('');
  },
  html() {
    const s = Game.s, tog = (k, name, note) => `<label class="tog"><input type="checkbox" data-dev="${k}" ${this.s[k] ? 'checked' : ''}><span><b>${name}</b><small>${note}</small></span></label>`;
    const btn = (k, name) => `<button data-devdo="${k}">${name}</button>`;
    return `<p class="sub">For testing. These live in this browser only, not in your save.</p>
      <h3>Switches</h3><div class="togs">${tog('freeze', 'Stop the clock', 'Time of day stays put.')}${tog('teleport', 'Teleport from the map', 'Tap anywhere on the map to go there.')}${tog('fps', 'Frame rate', 'Shown by the clock.')}</div>
      <h3>Weather · now ${Weather.rain() > 0.01 ? 'raining' : Weather.wet() > 0.02 ? 'drying' : 'dry'}</h3><div class="buttons">${['auto', 'rain', 'dry'].map((r) => `<button data-devwx="${r}" class="${(this.s.weather || 'auto') === r ? 'go' : ''}">${r === 'auto' ? 'By the clock' : r === 'rain' ? 'Rain' : 'Dry'}</button>`).join('')}</div>
      <h3>Resolution · now ${View.out}× the view</h3><div class="buttons">${['auto', '1', '2', '3'].map((r) => `<button data-devres="${r}" class="${(this.s.res || 'auto') === r ? 'go' : ''}">${r === 'auto' ? 'Auto' : r + '×'}</button>`).join('')}</div><p class="dim">Auto starts at 3× and drops a step when frames run under 40 a second.</p>
      <h3>Run speed · ×${this.s.speed}</h3><input type="range" min="0.5" max="4" step="0.25" value="${this.s.speed}" data-devrange="speed">
      <h3>Time of day · ${Game.clock()}</h3><input type="range" min="0" max="23.99" step="0.25" value="${Game.hour()}" data-devrange="time">
      <h3>Give</h3><div class="buttons">${btn('cr', '+1000 cr')}${btn('salvage', '+10 of every salvage')}</div>
      <h3>The world</h3><div class="buttons">${btn('been', 'Been everywhere')}${btn('undo', 'Restore stripped machines')}</div>
      ${City.on ? `<h3>The city's minds · Tyrell</h3><div class="buttons"><button data-devtyrell class="go">Tyrell mode</button>${btn('back', 'Back an hour (time walk)')}${btn('fwd', 'On an hour')}</div><p class="dim">Watch everyone on the map, see why they do what they do, and run the clock. The city remembers back to ${this.when(City.w.esper.earliest())}.</p>` : ''}
      <h3>Go to someone</h3>${this.peopleHtml()}
      <h3>Go to a place</h3><div class="goto">${this.goHtml()}</div>
      <p class="dim">Credits ${s.cr} · day ${s.day} · level ${World.L.id} at ${Math.round(Player.x)}, ${Math.round(Player.y)}</p>`;
  },
  bind(body) {
    const s = Game.s;
    body.querySelectorAll('input[data-dev]').forEach((i) => (i.onchange = () => { this.s[i.dataset.dev] = i.checked; this.save(); }));
    body.querySelectorAll('input[data-devrange]').forEach((i) => (i.oninput = () => { const v = +i.value; if (i.dataset.devrange === 'speed') { this.s.speed = v; this.save(); } else { s.time = v; Actors.load(); } i.previousElementSibling.textContent = i.dataset.devrange === 'speed' ? 'Run speed · ×' + v : 'Time of day · ' + Game.clock(); }));
    const act = {
      cr: () => { s.cr += 1000; }, salvage: () => { for (const k of SALVAGE_ORDER) Game.give(k, 10); },
      been: () => { for (const id in LEVELS) s.flags['been:' + id] = true; },
      back: () => { s.time -= 1; if (s.time < 0) { s.time += 24; s.day--; } City.sync(); Actors.load(); }, fwd: () => { Game.pass(1); City.sync(); Actors.load(); },
      undo: () => { for (const p of World.props) if (p.done) { p.done = false; delete s.done[p.id]; p.spr = null; Props.init(p); } },
    };
    body.querySelectorAll('button[data-devdo]').forEach((b) => (b.onclick = () => { act[b.dataset.devdo](); Game.toast('Dev: ' + b.textContent + '.'); Hud.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-devtyrell]').forEach((b) => (b.onclick = () => Hud.toggle('tyrell')));
    body.querySelectorAll('button[data-devwx]').forEach((b) => (b.onclick = () => { this.s.weather = b.dataset.devwx; this.save(); Hud.panel('dev'); }));
    body.querySelectorAll('button[data-devres]').forEach((b) => (b.onclick = () => { this.s.res = b.dataset.devres; if (this.s.res === 'auto') View.q = 3; this.save(); View.resize(); Hud.panel('dev'); }));
    body.querySelectorAll('button[data-devgo]').forEach((b) => (b.onclick = () => { const [l, sp] = b.dataset.devgo.split(':'); Hud.toggle(null); Game.go(l, sp); }));
    // to someone: into their level, beside them
    const find = body.querySelector('input[data-devfind]');
    if (find) find.oninput = () => { const q = find.value.trim().toLowerCase(); body.querySelectorAll('button[data-devwho]').forEach((b) => (b.hidden = !!q && !b.dataset.name.includes(q))); body.querySelectorAll('details.folk').forEach((d) => { const any = [...d.querySelectorAll('button[data-devwho]')].some((b) => !b.hidden); d.hidden = !any; if (q) d.open = any; }); };
    body.querySelectorAll('button[data-devwho]').forEach((b) => (b.onclick = () => { const st = Town.state(b.dataset.devwho, Game.hour()); if (!st.level) return; Hud.toggle(null); this.landAt = { level: st.level, x: st.x + 14, y: st.y }; Game.go(st.level, Object.keys((LEVELS[st.level].built || (LEVELS[st.level].built = LEVELS[st.level].make())).spawns)[0]); }));
  },
};
