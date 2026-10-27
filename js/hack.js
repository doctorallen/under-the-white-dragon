'use strict';
// ---------------------------------------------------------------------------
// Jacking in: a small network to cross, from where you came in to the core.
// You see a node's kind once you're next to it. Every move spends trace, and
// when the trace runs out the system throws you out (it hurts). On the way:
//   ice      blocks the way: Breach it (1 RAM) or force it (3 trace)
//   sentry   costs 2 trace more to pass; Puppet turns it (2 RAM) and it
//            covers for you (3 trace back)
//   mail     someone's messages, sometimes a lead on your case
//   cache    credits, sometimes parts
//   camera   footage: if a case wants a photo here, you get it
//   security the machines on this level, blind for a while
//   core     what the node holds: a program, or a terminal's credits (once)
// Ghost (2 RAM) makes the next three moves cost nothing. Jack out whenever
// you like and keep what you've taken. The network is made from the node's
// place, so it's the same network every time you jack into it.
// ---------------------------------------------------------------------------
const NET_KIND = {
  entry: { label: 'IN', name: 'Your way in' }, relay: { label: '·', name: 'A relay' }, ice: { label: 'ICE', name: 'ICE' }, sentry: { label: 'SEN', name: 'A sentry' },
  mail: { label: 'MAIL', name: 'Mail' }, cache: { label: 'CR', name: 'A cache' }, cam: { label: 'CAM', name: 'Cameras' }, sec: { label: 'SEC', name: 'Security' }, core: { label: 'CORE', name: 'The core' },
};
const NET_MAIL = [
  '"Shift change moved to 03:00. Don\'t tell the floor until it happens."', '"Your rent is late again. The block\'s committee has your door code."',
  '"Stop sending me pictures of the koi. I know it\'s a hologram."', '"Whoever keeps eating my noodles: I will find you."', '"Meridian\'s men were asking about the old line again."',
  '"The drones on the walkway keep logging a cat as an intruder. Patch it or shoot it."', '"Mama says come home. Mama says that every week."',
];
const Hack = {
  on: false, net: null, done: null, p: null,
  // the network for a node: columns from the way in to the core, two or three
  // nodes a column, each linked to the nearest ones on
  make(p, level) {
    const seed = Math.round(p.x) * 7 + Math.round(p.y) + (World.L.id.length * 131), r = (a, b) => hash(seed, a, b);
    const nodes = [{ id: 0, col: 0, row: 1, kind: 'entry' }], cols = [[0]];
    for (let c = 1; c <= 3; c++) {
      const n = 2 + (r(c, 1) < 0.5 ? 1 : 0), rows = n === 3 ? [0, 1, 2] : r(c, 2) < 0.5 ? [0, 2] : r(c, 3) < 0.5 ? [0, 1] : [1, 2], ids = [];
      for (const row of rows) { ids.push(nodes.length); nodes.push({ id: nodes.length, col: c, row, kind: 'relay' }); }
      cols.push(ids);
    }
    cols.push([nodes.length]); nodes.push({ id: nodes.length, col: 4, row: 1, kind: 'core' });
    const links = new Set(), link = (a, b) => links.add(Math.min(a, b) + '-' + Math.max(a, b));
    for (let c = 0; c < 4; c++) {
      const A = cols[c], B = cols[c + 1];
      for (const a of A) { const near = B.slice().sort((x, y) => Math.abs(nodes[x].row - nodes[a].row) - Math.abs(nodes[y].row - nodes[a].row)); link(a, near[0]); if (r(a, 7) < 0.35 && near[1] !== undefined) link(a, near[1]); }
      for (const b of B) if (![...links].some((k) => k.split('-').map(Number).includes(b) && A.some((a) => k === Math.min(a, b) + '-' + Math.max(a, b)))) { const near = A.slice().sort((x, y) => Math.abs(nodes[x].row - nodes[b].row) - Math.abs(nodes[y].row - nodes[b].row)); link(near[0], b); }
    }
    // a column's nodes linked up and down now and then
    for (let c = 1; c <= 3; c++) for (let i = 0; i + 1 < cols[c].length; i++) if (r(c, 20 + i) < 0.3) link(cols[c][i], cols[c][i + 1]);
    const mid = nodes.filter((q) => q.col >= 1 && q.col <= 3), pick = (k, from) => { const free = mid.filter((q) => q.kind === 'relay' && (!from || q.col >= from)); if (!free.length) return null; const q = free[Math.floor(r(k, 9) * free.length)]; return q; };
    // what's here: a camera if a case wants a photo on this level, security if
    // there are machines, then mail and a cache, then ICE and sentries
    const photo = Cases.props(World.L.id).find((c) => c.K.kind === 'photo');
    if (photo) { const q = pick(31, 2); if (q) { q.kind = 'cam'; q.clue = { id: photo.id, cid: photo.cid }; } }
    if (Actors.enemies.some((e) => ENEMY[e.type].bot && e.hp > 0 && !ENEMY[e.type].boss)) { const q = pick(32, 1); if (q) q.kind = 'sec'; }
    for (const [k, kind] of [[33, 'mail'], [34, 'cache']]) { const q = pick(k); if (q) q.kind = kind; }
    const nIce = 1 + (level >= 2 ? 1 : 0) + (r(40, 1) < 0.4 ? 1 : 0), nSen = level >= 2 ? 1 + (r(41, 1) < 0.5 ? 1 : 0) : r(41, 1) < 0.5 ? 1 : 0;
    for (let k = 0; k < nIce; k++) { const q = pick(50 + k); if (q) q.kind = 'ice'; }
    for (let k = 0; k < nSen; k++) { const q = pick(60 + k); if (q) q.kind = 'sentry'; }
    if (level >= 2) nodes[nodes.length - 1].ice = true; // deeper, the core is behind ICE of its own
    for (const q of nodes) q.links = [...links].map((k) => k.split('-').map(Number)).filter(([a, b]) => a === q.id || b === q.id).map(([a, b]) => (a === q.id ? b : a));
    return { nodes, at: 0, seen: { 0: 1 }, been: { 0: 1 }, broke: {}, turned: {}, trace: 12 - level, max: 12 - level, ghost: 0, log: ['You\'re in. Every move spends trace.'], ask: null, out: null, after: null };
  },
  open(level, done, p) {
    this.p = p; this.done = done; this.net = this.make(p, level || 1); this.coreTaken = !!(p.term && Game.s.done[p.id + ':core']);
    this.reveal(); Hud.toggle('net');
  },
  reveal() { const N = this.net; for (const id in N.been) for (const l of N.nodes[id].links) N.seen[l] = 1; },
  // what blocks a node: unbroken ICE (the core's own too)
  iced(q) { return (q.kind === 'ice' || q.ice) && !this.net.broke[q.id]; },
  say(t) { this.net.log.unshift(t); if (this.net.log.length > 6) this.net.log.length = 6; },
  spend(n) {
    const N = this.net; if (N.ghost > 0) { N.ghost--; return; }
    N.trace -= n; if (N.trace <= 0) this.traced();
  },
  traced() { const N = this.net; N.trace = 0; N.out = 'traced'; Game.s.hp = Math.max(1, Game.s.hp - 12); this.say('TRACED. The system throws you out. 12 damage.'); Hud.refresh(); },
  // a tap on a node: go there if it's next to you
  go(id) {
    const N = this.net; if (N.out) return; const q = N.nodes[id];
    if (id === N.at) return; if (!N.nodes[N.at].links.includes(id)) { this.say('Not from here: you can only move along a link.'); return; }
    if (this.iced(q)) { N.ask = id; this.say((q.kind === 'core' ? 'The core\'s own ICE.' : 'ICE.') + ' Breach it, or force it and spend the trace.'); return; }
    N.ask = null; N.at = id; const first = !N.been[id]; N.been[id] = 1; this.reveal();
    this.spend(1); if (N.out) return;
    if (q.kind === 'sentry' && !N.turned[id] && N.ghost <= 0) { this.say('A sentry: it chases you through the system. 2 trace more.'); this.spend(2); if (N.out) return; }
    if (first) this.enter(q);
  },
  enter(q) {
    const N = this.net, tier = World.L.tier || Quests.tier(World.L.id) || 1;
    if (q.kind === 'mail') {
      const open = Cases.open().map((id) => ({ id, w: Cases.where(id) })).find((o) => o.w && o.w.name);
      if (open) this.say('Mail. A message mentions ' + open.w.name + (open.w.level !== World.L.id ? ', in ' + LEVELS[open.w.level].name : ', here') + '. Worth a look.');
      else this.say('Mail: ' + NET_MAIL[Math.floor(hash(q.id, World.L.id.length, 3) * NET_MAIL.length)]);
    }
    if (q.kind === 'cache') { const cr = 10 + Math.round(hash(q.id, this.p.x, 5) * 20) * tier; Game.s.cr += cr; const ch = hash(q.id, this.p.x, 6) < 0.4 ? Game.give('chips', 1) : 0; this.say('A cache: + ' + cr + ' cr' + (ch ? ', a chip' : '') + '.'); Hud.refresh(); }
    if (q.kind === 'cam') {
      const c = q.clue, pr = World.props.find((p) => p.kind === 'clue' && p.caseId === c.id && p.cid === c.cid);
      if (pr && !Cases.st(c.id).found[c.cid]) { N.after = () => Enhancer.open(c.id, c.cid, pr.x, pr.y); this.say('Camera footage: the still your case wants. It\'ll be on your screen when you jack out.'); }
      else this.say('Cameras: nothing you need.');
    }
    if (q.kind === 'sec') { let n = 0; for (const e of Actors.enemies) if (ENEMY[e.type].bot && !ENEMY[e.type].boss && e.hp > 0) { e.stun = Math.max(e.stun, 40); e.alert = false; e.aware = 0; n++; } this.say('Security: ' + n + ' machine' + (n === 1 ? '' : 's') + ' on this level go blind for forty seconds.'); }
    if (q.kind === 'core') this.core();
  },
  core() {
    const N = this.net;
    if (this.p.term) {
      if (this.coreTaken) this.say('The core: emptied already. It fills again some other day.');
      else { const tier = World.L.tier || 1, cr = 30 + tier * 25; Game.s.cr += cr; Game.give('chips', 1); Game.s.done[this.p.id + ':core'] = 1; this.coreTaken = true; this.say('The core: + ' + cr + ' cr and a chip.'); Hud.refresh(); }
    } else this.say('The core: it\'s yours.');
    N.out = 'done'; N.win = !this.p.term;
  },
  // what you can do at a blocked node, or with what you carry
  act(a) {
    const N = this.net; if (N.out && a !== 'out') return;
    const ram = (n, name) => { if (!Game.s.programs[name]) { this.say('You don\'t have ' + PROGRAMS[name].name + '.'); return false; } if (Game.s.ram < n) { this.say('Not enough RAM.'); return false; } Game.s.ram -= n; Hud.refresh(); return true; };
    if (a === 'breach' && N.ask !== null) { if (ram(1, 'breach')) { N.broke[N.ask] = 1; this.say('Breach: the ICE comes apart.'); const id = N.ask; N.ask = null; this.go(id); } return; }
    if (a === 'force' && N.ask !== null) { N.broke[N.ask] = 1; this.say('You force the ICE. It costs you.'); this.spend(3); if (N.out) return; const id = N.ask; N.ask = null; this.go(id); return; }
    if (a === 'ghost') { if (ram(2, 'ghost')) { N.ghost = 3; this.say('Ghost: the next three moves leave no trace.'); } return; }
    if (a.startsWith('puppet:')) { const id = +a.slice(7); if (ram(2, 'puppet')) { N.turned[id] = 1; N.trace = Math.min(N.max, N.trace + 3); this.say('Puppet: the sentry covers for you now. 3 trace back.'); } return; }
    if (a === 'out') this.close();
  },
  close() {
    const N = this.net, win = N && N.win, done = this.done, after = N && N.after;
    this.net = null; if (Hud.open === 'net') Hud.toggle(null);
    if (win && done) done();
    if (after) after();
  },
  // the network drawn as HTML: links as lines under the nodes
  html() {
    const N = this.net, X = (q) => 8 + q.col * 21, Y = (q) => 18 + q.row * 32;
    let h = '<div class="netwrap"><div class="net"><svg viewBox="0 0 100 100" preserveAspectRatio="none">';
    const drawn = new Set();
    for (const q of N.nodes) for (const l of q.links) { const k = Math.min(q.id, l) + '-' + Math.max(q.id, l); if (drawn.has(k)) continue; drawn.add(k); const o = N.nodes[l], lit = (N.been[q.id] && N.seen[l]) || (N.been[l] && N.seen[q.id]); h += `<line x1="${X(q)}" y1="${Y(q)}" x2="${X(o)}" y2="${Y(o)}" class="${lit ? 'lit' : ''}"/>`; }
    h += '</svg>';
    for (const q of N.nodes) {
      const seen = N.seen[q.id], K = NET_KIND[q.kind], near = N.nodes[N.at].links.includes(q.id);
      const cls = ['node', 'k-' + (seen ? q.kind : 'unknown'), q.id === N.at ? 'here' : '', N.been[q.id] ? 'been' : '', near && !N.out ? 'near' : '', this.iced(q) && seen ? 'iced' : '', N.turned[q.id] ? 'turned' : ''].join(' ');
      h += `<button class="${cls}" data-net="${q.id}" style="left:${X(q)}%;top:${Y(q)}%">${seen ? K.label + (q.ice && !N.broke[q.id] ? '<i>ICE</i>' : '') : '?'}</button>`;
    }
    h += '</div><div class="netside">';
    const tr = Math.max(0, N.trace);
    h += `<p class="trace">TRACE <b>${'■'.repeat(tr)}${'□'.repeat(Math.max(0, N.max - tr))}</b>${N.ghost > 0 ? ` <span class="ghosted">ghost ×${N.ghost}</span>` : ''}</p><p class="ram">RAM <b>${'■'.repeat(Game.s.ram)}${'□'.repeat(T.ram.max - Game.s.ram)}</b></p>`;
    h += '<div class="buttons">';
    if (N.ask !== null && !N.out) h += `${Game.s.programs.breach ? `<button data-netact="breach" class="go" ${Game.s.ram < 1 ? 'disabled' : ''}>Breach (1 RAM)</button>` : ''}<button data-netact="force" class="warnb">Force it (3 trace)</button>`;
    if (!N.out && Game.s.programs.ghost && N.ghost <= 0) h += `<button data-netact="ghost" ${Game.s.ram < 2 ? 'disabled' : ''}>Ghost (2 RAM)</button>`;
    if (!N.out && Game.s.programs.puppet) for (const l of N.nodes[N.at].links) { const q = N.nodes[l]; if (q.kind === 'sentry' && N.seen[l] && !N.turned[l]) h += `<button data-netact="puppet:${l}" ${Game.s.ram < 2 ? 'disabled' : ''}>Puppet the sentry (2 RAM)</button>`; }
    h += `<button data-netact="out" class="${N.out ? 'go' : 'quiet'}">Jack out</button></div>`;
    h += '<div class="netlog">' + N.log.map((t, i) => `<p class="${i ? 'dim' : ''}">${t}</p>`).join('') + '</div>';
    h += '<p class="dim small">Tap a node next to yours to move. You see what a node is once you\'re beside it.</p></div></div>';
    return h;
  },
};
