'use strict';
// ---------------------------------------------------------------------------
// The detective's panels: talking to people (questions, pressing them, the
// baseline test, the verdict, a quest's offer or its next step), the test
// itself, the photo enhancer, travel, the case file, the items you carry,
// and the end of the story. Each returns [title, html]; panelBind wires up
// the buttons after the panel is drawn.
// ---------------------------------------------------------------------------
const PANELS = {
  talk(s) {
    const n = Hud.who, name = n.def.name, line = n.def.lines[n.line % n.def.lines.length];
    let h = `<p class="sub">"${line}"</p>`;
    // the case's business with them
    for (const a of Cases.actionsFor(name)) {
      const C = Cases.def(a.id), c = Cases.st(a.id);
      if (a.kind === 'ask') h += `<div class="ask"><h3>${C.title}</h3><p class="dim">Ask them what happened.</p><div class="buttons"><button data-ask="${a.id}:${a.cid}" class="go">Ask what happened</button></div></div>`;
      // their story, the line in it that doesn't hold, and what you can show them
      if (a.kind === 'present') {
        const K = C.clues[a.cid], T = C.clues[a.tid], shown = Object.keys(C.clues).filter((k) => c.found[k] && k !== a.cid && C.clues[k].kind !== 'truth');
        h += `<div class="ask"><h3>${C.title}: their story</h3><p class="sub">${K.text}</p><p class="dim">Something in that doesn't hold up: ${T.claim}</p>`;
        if (a.clam) h += '<p class="dim">They won\'t talk to you again today.</p>';
        else h += `<p class="dim">Show them something from the case file that breaks it. Get it wrong twice and they clam up until tomorrow.</p><div class="buttons">${shown.length ? shown.map((k) => `<button data-present="${a.id}:${a.tid}:${k}">${C.clues[k].name}</button>`).join('') : '<span class="dim">You have nothing to show them yet. Find more.</span>'}</div>`;
        h += '</div>';
      }
      if (a.kind === 'suspect') {
        const read = c.test ? `Your read: <b class="${c.test}">${c.test === 'synth' ? 'a synth' : 'human'}</b>.` : 'You haven\'t tested them.';
        h += `<div class="ask"><h3>${C.title}: the suspect</h3><p class="dim">${read}</p><div class="buttons">${c.test ? '' : `<button data-test="${a.id}" class="go">Run the baseline test</button>`}`;
        if (C.ending) h += C.ending.map((E, i) => `<button data-end="${i}">${E.label}</button>`).join('');
        else h += `<button data-verdict="${a.id}:retire" class="warnb">Retire</button><button data-verdict="${a.id}:arrest">Arrest</button><button data-verdict="${a.id}:release" class="quiet">Let go</button>`;
        h += '</div></div>';
      }
    }
    // quests: offers, and the steps that need them
    for (const a of Quests.actionsFor(name)) {
      const Q = QUESTS[a.id], st = Quests.step(a.id);
      if (a.kind === 'offer') h += `<div class="ask"><h3>${Q.title}</h3><p class="dim">${Q.text}</p><div class="buttons"><button data-take="${a.id}" class="go">Take it</button></div></div>`;
      if (a.kind === 'talk') h += `<div class="ask"><h3>${Q.title}</h3>${st.lines.map((l) => `<p class="sub">"${l}"</p>`).join('')}<div class="buttons"><button data-talked="${a.id}" class="go">${a.id === 'drones' || st.npc === Q.giver ? 'Report' : 'Go on'}</button></div></div>`;
      if (a.kind === 'deliver') h += `<div class="ask"><h3>${Q.title}</h3><p class="dim">${st.text}: ${Hud.cost(st.items)}</p><div class="buttons"><button data-deliver="${a.id}" class="go" ${a.ok ? '' : 'disabled'}>Hand it over</button></div></div>`;
      if (a.kind === 'choice') h += `<div class="ask"><h3>${Q.title}</h3>${st.lines.map((l) => `<p class="sub">"${l}"</p>`).join('')}<div class="buttons">${st.options.map((o, i) => `<button data-choose="${a.id}:${i}">${o.label}</button>`).join('')}</div></div>`;
    }
    // jobs for the bench: an offer, a wait, a hand-back
    for (const a of Jobs.actionsFor(name)) h += Jobs.html(a);
    // the lieutenant: the cases, the night desk, the warrants board
    if (n.def.role === 'fixer') {
      const offers = CASE_ORDER.filter((id) => Cases.available(id));
      for (const id of offers) h += `<div class="ask"><h3>Case: ${CASES[id].title}</h3><p class="dim">${CASES[id].brief}</p><div class="buttons"><button data-case="${id}" class="go">Take the case</button></div></div>`;
      const N = Cases.closed('menagerie') ? Cases.nightOffer() : null;
      if (!Cases.closed('menagerie')) { // the night desk and the board open after the first case
      }
      else if (N) { const C = Cases.nightDef(N), on = Cases.st(N.id); h += `<div class="ask"><h3>The night desk: ${C.title}</h3><p class="dim">${C.brief} A few minutes' work. Pays ${C.reward.cr} cr.</p><div class="buttons">${on ? '<span class="tag">on it</span>' : `<button data-night="1">Take it</button>`}</div></div>`; }
      else h += '<p class="dim">The night desk opens once you can fly out to the districts.</p>';
      Warrants.refresh();
      const W = Cases.closed('menagerie') ? s.warrants.list : [];
      if (W.length) h += '<h3>Warrants board</h3><div class="rows">' + W.map((w) => `<div class="row ${w.done ? 'passed' : ''}"><div><b>${w.name}</b><small>Chrome, last seen in ${LEVELS[w.level].name}. ${w.reward} cr on the spot.</small></div>${w.done ? '<span class="tag">served</span>' : w.taken ? '<span class="tag">on it</span>' : `<button data-warrant="${w.id}">Take it</button>`}</div>`).join('') + '</div>';
      const r = Cases.rank(), nx = Cases.nextRank(); h += `<p class="dim">You: ${r[1]}. ${nx ? (nx[0] - s.xp) + ' to ' + nx[1] + '.' : 'As high as it goes.'}</p>`;
    }
    const role = n.def.role && n.def.role !== 'fixer' ? NPC_ROLE[n.def.role] : null;
    h += `<div class="buttons">${role ? `<button data-role="1">${role.verb}</button>` : ''}<button data-act="resume" class="quiet">Goodbye</button></div>`;
    return [name, h];
  },
  test() {
    const c = Cases.st(Baseline.id), C = Cases.def(Baseline.id);
    let h = '<div class="testgrid"><div><canvas id="testcv"></canvas><p class="dim">Ask, then watch the needles. A human reacts at once. A synth answers flat, then late, then too much. Hard questions read clearer but raise the stress, and at the top of it they won\'t sit still.</p></div><div>';
    h += `<p class="sub" id="testq">${Baseline.q ? '"' + Baseline.q.text + '"' : 'Ask your first question.'}</p>`;
    const tiers = [[1, 'Mild'], [2, 'Probing'], [3, 'Hard']];
    h += `<div class="buttons">${Baseline.asked >= 2 ? '<button data-call="human">Call it: human</button><button data-call="synth" class="warnb">Call it: synth</button>' : '<span class="dim">Ask at least two questions before you call it.</span>'}</div>`;
    h += tiers.map(([lv, nm]) => `<div class="qrow"><span class="tag">${nm}</span>${BASELINE_QS.map((q, i) => (q[0] === lv ? `<button data-q="${i}" class="q">${q[1]}</button>` : '')).join('')}</div>`).join('') + '</div></div>';
    return ['Baseline test · ' + C.suspect.name, h];
  },
  // the case board: every lead a question, its answers, the evidence you pin
  board() {
    const id = Board.id, C = Cases.def(id), c = Cases.st(id), d = Cases.doubt(id), keys = Object.keys(C.clues);
    let h = `<p class="dim">${C.brief}</p><p class="doubt">Doubt <b>${'●'.repeat(d)}${'○'.repeat(3 - d)}</b> <small>Each wrong call: the suspect hears you're asking, and the case pays less.</small></p>`;
    for (const L of C.leads) {
      if (c.leads[L.id]) { h += `<div class="bq done"><h3>${L.ask}</h3><p class="sub">✓ ${L.answers[0]}</p><p class="lead">Lead: <b>${L.name}</b>. ${L.text}</p></div>`; continue; }
      const pick = Board.ans[L.id], pins = Board.pins[L.id] || [];
      h += `<div class="bq"><h3>${L.ask}</h3><div class="answers">${Cases.answers(id, L).map((o) => `<button data-ans="${L.id}:${o.i}" class="${pick === o.i ? 'on' : ''}">${o.a}</button>`).join('')}</div>`;
      h += `<p class="dim">Pin the evidence that proves it, and nothing else:</p><div class="clues">` + keys.map((k) => { const K = C.clues[k]; if (!c.found[k]) return `<div class="clue"><b>?</b><small>${K.kind === 'truth' ? 'Something someone\'s hiding' : K.kind === 'talk' ? 'Someone knows something' : K.kind === 'photo' ? 'A picture to enhance' : 'Something left behind'}</small></div>`; return `<button class="clue on ${pins.includes(k) ? 'pinned' : ''}" data-pin="${L.id}:${k}"><b>${pins.includes(k) ? '📌 ' : ''}${K.name}</b><small>${K.text}</small></button>`; }).join('') + '</div>';
      const msg = Board.msg[L.id];
      h += `<div class="buttons"><button data-decide="${L.id}" class="go" ${pick === undefined || !pins.length ? 'disabled' : ''}>Make the call</button>${msg ? `<span class="bmsg">${msg}</span>` : ''}</div></div>`;
    }
    h += '<div class="buttons"><button data-act="resume" class="quiet">Close the board</button></div>';
    return ['Case board · ' + C.title, h];
  },
  net() { return [(Hack.p && Hack.p.term ? 'Terminal' : 'Data node') + ' · jacked in', Hack.html()]; },
  // the morning after: what your fixes did overnight
  morning(s) { return ['Morning · day ' + s.day, Jobs.news.map((l) => `<p class="sub">${l}</p>`).join('') + '<div class="buttons"><button data-act="resume" class="go">Get up</button></div>']; },
  // a parts stall: what they sell, by grade
  partshop(s) {
    const n = Hud.who, stock = PART_STOCK[n.def.stock];
    let h = `<p class="sub">"${n.def.lines[n.line % n.def.lines.length]}"</p><div class="parts">`;
    h += stock.map(([k, g, cr, gauge, note], i) => `<div class="part" style="--r:${GRADE[g].col}"><img class="picon" src="${Parts.icon(k, g)}" alt=""><b>${GRADE[g].name} ${PART[k].name.toLowerCase()}${gauge ? ' · ' + gauge + ' gauge' : ''}</b><small>${note || GRADE[g].note}</small><div class="tbtns"><button data-buypart="${i}" ${s.cr >= cr ? '' : 'disabled'}>${cr} cr</button></div></div>`).join('');
    return [n.def.name + '\'s parts', h + '</div>'];
  },
  // the grocery's till: whoever's on shift sells you things
  grocer(s) { const n = Hud.who; return [n.def.name + ' · Mo\'s Grocery', `<p class="sub">"${Town.talkLine(n)}"</p>` + Hud.shopHtml(SHOP[n.def.name])]; },
  bench() { return ['The bench · ' + Bench.b.name, Bench.html()]; },
  // the shelf: the parts you have, and the notebook
  shelf(s) {
    const n = s.notes; let h = '<h3>Parts</h3>';
    h += s.parts.length ? '<div class="parts">' + s.parts.map((p) => `<div class="part" style="--r:${GRADE[p.g].col}"><img class="picon" src="${Parts.icon(p.k, p.g)}" alt=""><b>${Parts.name(p)}${p.gauge ? ' · ' + p.gauge + ' gauge' : ''}</b><small>${PART_STATE[p.st]} · ${Parts.from(p)}</small></div>`).join('') + '</div>' : '<p class="dim">Empty shelves. Strip machines, trade at the stalls, or pull parts from what comes to the bench.</p>';
    h += '<h3>Notebook</h3>';
    const known = Object.keys(n.known);
    h += known.length ? known.map((d) => `<p><b>${DEVICE[d].name}</b> <span class="dim">(${DEVICE[d].kind.toLowerCase()})</span>: ${Parts.build(d).join(', ')}.</p>`).join('') : '<p class="dim">Nothing yet. Open things up and probe them, and the notebook learns how they\'re built.</p>';
    if (n.log.length) h += n.log.map((e) => `<p class="sub">Day ${e.day}. ${e.text}</p>`).join('');
    return ['The shelf', h];
  },
  photo() {
    const C = Cases.def(Enhancer.id), K = C.clues[Enhancer.cid];
    return ['Enhance · ' + K.name, `<div class="photowrap"><canvas id="photocv"></canvas></div><div class="photobar"><p class="sub" id="photonote"></p><div class="buttons"><button data-enh="out">− Pull back</button><button data-enh="reset">Whole picture</button><button data-act="resume" class="go">Done</button></div></div>`];
  },
  travel() { return ['The city', WorldMap.html(false)]; },
  citymap() { return ['The city', WorldMap.html(true)]; },
  ending(s) {
    const E = CASES.maker.ending.find((e) => e.flag === s.flags.ending) || CASES.maker.ending[0];
    const fates = ['iris', 'bishop', 'wren'].map((k) => `${CASES[k].suspect.name}: ${{ retire: 'retired', arrest: 'arrested', release: 'let go' }[s.flags[k]] || '?'}`).join(' · ');
    return ['The end of the case', `<p class="sub">${E.text}</p><p class="dim">${fates}. ${s.flags.misfire ? 'You retired ' + s.flags.misfire + ' human being' + (s.flags.misfire > 1 ? 's' : '') + ' along the way.' : 'You never retired a human being.'}</p><p class="sub">The city is still here in the morning. There's still chrome on the streets, and the night desk still has work. You're ${Cases.rank()[1].toLowerCase()} now.</p><div class="buttons"><button data-act="resume" class="go">Back to the city</button></div>`];
  },
};
// the board's state while it's open: per lead, the answer picked, the
// evidence pinned, and what the last call got
const Board = {
  id: null, ans: {}, pins: {}, msg: {},
  open(id) { if (this.id !== id) { this.ans = {}; this.pins = {}; this.msg = {}; } this.id = id; Hud.toggle('board'); },
};
// the work someone with a trade offers, shown above their trade
function workHtml(name) {
  return Quests.actionsFor(name).filter((a) => a.kind === 'offer').map((a) => { const Q = QUESTS[a.id]; return `<div class="ask"><h3>Work: ${Q.title}</h3><p class="dim">${Q.text}</p><div class="buttons"><button data-take="${a.id}" class="go">Take it</button></div></div>`; }).join('');
}
function lockText(id) {
  if (id === 'spires') return 'Meridian\'s air lanes: you need an access code';
  if (id === 'oldtown') return Game.s.pack.subwaypass > 0 ? 'Find the way down to street level first' : 'The old subway is sealed: Hale can get you a pass';
  return { street: 'Find the way down from the Stack first', under: 'Get down to street level first: the manholes are there', old: 'Ride the old subway down to Old Town first', works: 'Take the Mayor\'s lift down from Old Town first', bowels: 'Go down the shaft from the Works first' }[Travel.band(id)] || 'Not yet';
}
// the case file: rank, then each open case: what's found, what's left, the
// leads, the suspect; then open jobs and what's been closed
function caseFile(s) {
  const r = Cases.rank(), nx = Cases.nextRank(), pc = nx ? Math.round(((s.xp - r[0]) / (nx[0] - r[0])) * 100) : 100;
  let h = `<div class="rank"><b>${r[1]}</b><div class="bar"><i style="width:${pc}%"></i></div><small>${nx ? (nx[0] - s.xp) + ' to ' + nx[1] : 'The top of the ladder'} · ${s.closed || 0} cases closed</small></div>`;
  const open = Cases.open();
  for (const id of open) {
    const C = Cases.def(id), c = Cases.st(id), keys = Object.keys(C.clues), got = keys.filter((k) => c.found[k]);
    h += `<div class="case ${s.track === id ? 'tracked' : ''}"><h3>${C.main ? 'Case' : 'Night case'}: ${C.title}</h3><p class="dim">${C.brief}</p>`;
    h += `<p class="obj">▸ ${Cases.objective(id)}</p><div class="clues">` + keys.map((k) => (c.found[k] ? `<div class="clue on"><b>${C.clues[k].name}</b><small>${C.clues[k].text}</small></div>` : `<div class="clue"><b>?</b><small>${C.clues[k].kind === 'truth' ? 'Something someone\'s hiding' : C.clues[k].kind === 'talk' ? 'Someone knows something' : C.clues[k].kind === 'photo' ? 'A picture to enhance' : 'Something left behind'}</small></div>`)).join('') + '</div>';
    for (const L of C.leads) if (c.leads[L.id]) h += `<p class="lead">Lead: <b>${L.name}</b>. ${L.text}</p>`;
    h += `<div class="buttons"><button data-board="${id}" class="go">Case board</button>${s.track === id ? '<span class="tag">tracked</span>' : `<button data-track="${id}">Track this</button>`}${Cases.doubt(id) ? `<span class="tag">doubt ${'●'.repeat(Cases.doubt(id))}</span>` : ''}</div></div>`;
  }
  const jobs = Quests.open();
  if (jobs.length) h += '<h3>Jobs</h3><div class="rows">' + jobs.map((id) => `<div class="row ${s.track === id ? 'tracked' : ''}"><div><b>${QUESTS[id].title}</b><small>▸ ${Quests.objective(id)}</small></div>${s.track === id ? '<span class="tag">tracked</span>' : `<button data-track="${id}">Track</button>`}</div>`).join('') + '</div>';
  if (!open.length && !jobs.length) h += '<p class="dim">Nothing open. Lieutenant Hale at the precinct always has work.</p>';
  const closed = CASE_ORDER.filter((id) => Cases.closed(id));
  if (closed.length) h += '<h3>Closed</h3><div class="rows">' + closed.map((id) => { const c = Cases.st(id); return `<div class="row passed"><div><b>${CASES[id].title}</b><small>${CASES[id].suspect.name}: ${{ retire: 'retired', arrest: 'arrested', release: 'let go', ending: 'the end' }[c.verdict] || ''}${c.synth !== undefined ? (c.synth ? ', a synth' : ', human') : ''}</small></div></div>`; }).join('') + '</div>';
  return h;
}
// what you carry that you can use: by kind, with Use and the quick slot
function itemsTab(s) {
  const worth = SALVAGE_ORDER.reduce((a, k) => a + (s.pack[k] || 0) * SALVAGE[k].price, 0);
  let h = `<p class="sub">${s.cr} cr. Whatever you pick up is yours to keep. The Item button uses your quick item.</p>`;
  for (const kind of ['consumable', 'throwable', 'key', 'evidence', 'salvage']) {
    const ks = Object.keys(ITEM).filter((k) => ITEM[k].kind === kind && s.pack[k] > 0); if (!ks.length) continue;
    h += `<h3>${ITEM_KINDS[kind]}${kind === 'salvage' ? ' · worth about ' + worth + ' cr to Kit' : ''}</h3><div class="tiles">` + ks.map((k) => { const I = ITEM[k], usable = kind === 'consumable' || kind === 'throwable'; return `<div class="tile ${s.quick === k ? 'quick' : ''}" style="--r:${(I.col || SALVAGE.wire.col)[1]}"><img src="${Hud.icon(k)}" alt=""><b>${I.name}</b><span class="n">× ${s.pack[k]}</span><small>${I.note || (kind === 'salvage' ? SALVAGE[k].price + ' cr each at Kit\'s' : '')}</small>${usable ? `<div class="tbtns"><button data-use="${k}">Use</button><button data-quick="${k}" ${s.quick === k ? 'disabled' : ''}>${s.quick === k ? 'Quick' : 'Set quick'}</button></div>` : ''}</div>`; }).join('') + '</div>';
  }
  return h;
}
function panelBind(body, which) {
  const s = Game.s, n = Hud.who, re = () => Hud.panel(Hud.open);
  body.querySelectorAll('button[data-buypart]').forEach((b) => (b.onclick = () => { const [k, g, cr, gauge] = PART_STOCK[n.def.stock][+b.dataset.buypart]; if (!Game.pay({ cr })) return; Parts.give(Parts.make(k, g, { how: 'trade', gauge })); re(); }));
  body.querySelectorAll('button[data-job]').forEach((b) => (b.onclick = () => { const c = b.dataset.job; Jobs.act(c); if (!c.startsWith('back')) re(); }));
  body.querySelectorAll('button[data-ask]').forEach((b) => (b.onclick = () => { const [id, cid] = b.dataset.ask.split(':'); Cases.ask(id, cid); re(); }));
  body.querySelectorAll('button[data-net]').forEach((b) => (b.onclick = () => { Hack.go(+b.dataset.net); re(); }));
  body.querySelectorAll('button[data-netact]').forEach((b) => (b.onclick = () => { const a = b.dataset.netact; Hack.act(a); if (a !== 'out') re(); }));
  body.querySelectorAll('button[data-present]').forEach((b) => (b.onclick = () => { const [id, tid, by] = b.dataset.present.split(':'); Cases.present(id, tid, by); re(); }));
  body.querySelectorAll('button[data-board]').forEach((b) => (b.onclick = () => Board.open(b.dataset.board)));
  body.querySelectorAll('button[data-ans]').forEach((b) => (b.onclick = () => { const [lid, i] = b.dataset.ans.split(':'); Board.ans[lid] = +i; Board.msg[lid] = ''; re(); }));
  body.querySelectorAll('button[data-pin]').forEach((b) => (b.onclick = () => { const [lid, k] = b.dataset.pin.split(':'), p = (Board.pins[lid] = Board.pins[lid] || []); const at = p.indexOf(k); if (at >= 0) p.splice(at, 1); else p.push(k); Board.msg[lid] = ''; re(); }));
  body.querySelectorAll('button[data-decide]').forEach((b) => (b.onclick = () => { const lid = b.dataset.decide, r = Cases.deduce(Board.id, lid, Board.ans[lid], Board.pins[lid] || []); Board.msg[lid] = r === 'ok' ? '' : r === 'evidence' ? 'The idea\'s right, but that evidence won\'t hold up. Doubt +1.' : 'That doesn\'t fit what you have. Doubt +1.'; if (r !== 'ok') { Board.ans[lid] = undefined; } re(); }));
  body.querySelectorAll('button[data-test]').forEach((b) => (b.onclick = () => Baseline.open(b.dataset.test)));
  body.querySelectorAll('button[data-verdict]').forEach((b) => (b.onclick = () => { const [id, v] = b.dataset.verdict.split(':'); Cases.verdict(id, v); Hud.toggle(null); }));
  body.querySelectorAll('button[data-end]').forEach((b) => (b.onclick = () => Cases.endWith(+b.dataset.end)));
  body.querySelectorAll('button[data-take]').forEach((b) => (b.onclick = () => { Quests.start(b.dataset.take); re(); }));
  body.querySelectorAll('button[data-talked]').forEach((b) => (b.onclick = () => { Quests.talked(b.dataset.talked); re(); }));
  body.querySelectorAll('button[data-deliver]').forEach((b) => (b.onclick = () => { Quests.deliver(b.dataset.deliver); re(); }));
  body.querySelectorAll('button[data-choose]').forEach((b) => (b.onclick = () => { const [id, i] = b.dataset.choose.split(':'); Quests.choose(id, +i); re(); }));
  body.querySelectorAll('button[data-case]').forEach((b) => (b.onclick = () => { Cases.start(b.dataset.case); re(); }));
  body.querySelectorAll('button[data-night]').forEach((b) => (b.onclick = () => { Cases.takeNight(); re(); }));
  body.querySelectorAll('button[data-warrant]').forEach((b) => (b.onclick = () => { Warrants.take(+b.dataset.warrant); re(); }));
  body.querySelectorAll('button[data-role]').forEach((b) => (b.onclick = () => { Hud.toggle(null); NPC_ROLE[n.def.role].use(n); }));
  body.querySelectorAll('button[data-track]').forEach((b) => (b.onclick = () => { s.track = b.dataset.track; re(); }));
  body.querySelectorAll('button[data-use]').forEach((b) => (b.onclick = () => { if (ITEM[b.dataset.use].kind === 'throwable') { s.quick = b.dataset.use; Hud.toggle(null); Game.useItem(b.dataset.use); } else { Game.useItem(b.dataset.use); re(); } }));
  body.querySelectorAll('button[data-quick]').forEach((b) => (b.onclick = () => { s.quick = b.dataset.quick; Hud.refresh(); }));
  body.querySelectorAll('button[data-q]').forEach((b) => (b.onclick = () => { Baseline.ask(+b.dataset.q); const c = Cases.st(Baseline.id); if (Baseline.stress >= 1) { Hud.toggle(null); Cases.bolt(Baseline.id); return; } $('testq').textContent = '"' + Baseline.q.text + '"'; if (Baseline.asked === 2) re(); }));
  body.querySelectorAll('button[data-call]').forEach((b) => (b.onclick = () => { const c = Cases.st(Baseline.id); c.test = b.dataset.call; Save.write(); const who = Actors.npcs.find((q) => q.def.name === Cases.def(Baseline.id).suspect.name); Hud.toggle('talk', who || Hud.who); }));
  if (which === 'test') { const cv = $('testcv'), dpr = window.devicePixelRatio || 1; cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; if (!Baseline.raf) Baseline.draw(); }
  if (which === 'photo') Enhancer.attach();
  if (which === 'bench') Bench.attach();
  if (which === 'travel' || which === 'citymap') WorldMap.attach();
}
