'use strict';
// ---------------------------------------------------------------------------
// The panels: talking to people (and the work they bring), a new game, the
// morning after, a parts stall, the grocery's till, the bench and what's
// waiting for it, the shelf, the city map, and what you carry. Each returns
// [title, html]; panelBind wires up the buttons after the panel is drawn.
// ---------------------------------------------------------------------------
const PANELS = {
  tyrell() { return ['Tyrell mode', TyrellMode.html()]; },
  talk(s) {
    const n = Hud.who, name = n.def.name, line = n.def.town ? Town.talkLine(n) : n.def.lines[n.line % n.def.lines.length];
    let h = `<p class="sub">"${line}"</p>`;
    // jobs for the bench: an offer, a wait, a hand-back
    for (const a of Jobs.actionsFor(name)) h += Jobs.html(a);
    const role = n.def.role ? NPC_ROLE[n.def.role] : null;
    h += `<div class="buttons">${role ? `<button data-role="1">${role.verb}</button>` : ''}<button data-act="resume" class="quiet">Goodbye</button></div>`;
    return [n.def.title ? `${name} · ${n.def.title}` : name, h];
  },
  // a new game: how things stand
  intro(s) { return ['Under the White Dragon', '<p class="sub">The basement is yours: a bench, a parts shelf and a cot, under a trapdoor in Auntie Lin\'s storeroom. Nobody upstairs knows what you do down here. People who need something fixed and can\'t ask a licensed shop know to ask at the bar.</p><p class="sub">Someone\'s already waiting up there. Climb the ladder, talk to them, and bring the job down to your bench.</p><p class="dim">Move with the stick or the arrow keys. Use (E) works the bench, the ladder, doors and people.</p><div class="buttons"><button data-act="resume" class="go">Get up</button></div>']; },
  // the morning after: what your fixes did overnight
  morning(s) { return ['Morning · day ' + s.day, Jobs.news.map((l) => `<p class="sub">${l}</p>`).join('') + '<div class="buttons"><button data-act="resume" class="go">Get up</button></div>']; },
  // a parts stall: what they sell, by grade
  partshop(s) {
    const n = Hud.who, stock = PART_STOCK[n.def.stock];
    let h = `<p class="sub">"${n.def.lines[n.line % n.def.lines.length]}"</p><div class="parts">`;
    h += stockHtml(n.def.stock, s);
    const jn = Parts.junk().length, sv = SALVAGE_ORDER.reduce((a, k) => a + (s.pack[k] || 0), 0); if (jn || sv) h += `<div class="part tool" style="--r:#8a8a90"><b>The scrap bin</b><small>${[jn ? jn + ' dead or burnt part' + (jn > 1 ? 's' : '') + ' off your shelf' : '', sv ? sv + ' bits of salvage' : ''].filter(Boolean).join(' and ')}: good for nothing but the metal.</small><div class="tbtns"><button data-selljunk>Sell for ${Parts.junkValue()} cr</button></div></div>`;
    const t = Tips.forSale(n.def.stock);
    if (t) { const T = TOOLS[t], can = Tips.tier() === t - 1; h += `<div class="part tool" style="--r:#ffd040"><b>${T.name} · tools</b><small>${T.note}${can ? '' : ' (After the ' + TOOLS[t - 1].name.toLowerCase() + ': one thing at a time.)'}</small><div class="tbtns"><button data-buytool="${t}" ${can && s.cr >= T.cr ? '' : 'disabled'}>${T.cr} cr</button></div></div>`; }
    return [n.def.name + '\'s parts', h + '</div>'];
  },
  // the grocery's till: whoever's on shift sells you things
  grocer(s) { const n = Hud.who; return [n.def.name + ' · Mo\'s Grocery', `<p class="sub">"${Town.talkLine(n)}"</p><p class="dim">Behind the counter, with the batteries and the fuses:</p><div class="parts">` + stockHtml('mo', s) + '</div>']; },
  // what's waiting in the basement, set aside: pick one to put on the bench
  benchpick(s) {
    const ids = Object.keys(s.aside);
    return ['The bench · what\'s waiting', '<p class="sub">Your bench is clear. What\'s waiting:</p><div class="rows">' + ids.map((id) => { const b = s.aside[id]; return `<div class="row"><div><b>${b.name}</b><small>${b.tested ? 'Tested: ' + ({ works: 'it works', half: 'it half works', dead: 'nothing', smoke: 'it smoked' })[b.tested.res] : b.open ? 'Open on the mat.' : 'Not opened yet.'}</small></div><button data-benchload="${id}" class="go">Put it on the bench</button></div>`; }).join('') + '</div>'];
  },
  bench() { return ['The bench · ' + Bench.b.name, Bench.html()]; },
  // the shelf: the parts you have, and the notebook
  shelf(s) {
    const n = s.notes, tl = TOOLS[Tips.tier()], up = TOOLS[Tips.tier() + 1]; let h = `<h3>Tools</h3><p><b>${tl.name}.</b> ${tl.note}${up ? ` <span class="dim">Next: the ${up.name.toLowerCase()}, ${up.cr} cr from ${up.at === 'ana' ? 'Mechanic Ana at the Overpass Market' : 'Nurse Kade on Clinic Row'}.</span>` : ''}</p><h3>Parts</h3>`;
    h += s.parts.length ? '<div class="parts">' + s.parts.map((p) => `<div class="part" style="--r:${GRADE[p.g].col}"><img class="picon" src="${Parts.icon(p.k, p.g)}" alt=""><b>${Parts.name(p)}${p.gauge ? ' · ' + p.gauge + ' gauge' : ''}</b><small>${PART_STATE[p.st]} · ${Parts.from(p)}</small></div>`).join('') + '</div>' : '<p class="dim">Empty shelves. Strip machines, trade at the stalls, or pull parts from what comes to the bench.</p>';
    h += '<h3>Notebook</h3>';
    const known = Object.keys(n.known);
    h += known.length ? known.map((d) => `<p><b>${DEVICE[d].name}</b> <span class="dim">(${DEVICE[d].kind.toLowerCase()})</span>: ${Parts.build(d).join(', ')}.</p>`).join('') : '<p class="dim">Nothing yet. Open things up and probe them, and the notebook learns how they\'re built.</p>';
    if (n.log.length) h += n.log.map((e) => `<p class="sub">Day ${e.day}. ${e.text}</p>`).join('');
    return ['The shelf', h];
  },
  travel() { return ['The city', WorldMap.html(false)]; },
  citymap() { return ['The city', WorldMap.html(true)]; },
};
// a stall's parts, by grade, each with a buy button
function stockHtml(key, s) {
  return PART_STOCK[key].map(([k, g, cr, gauge, note], i) => `<div class="part" style="--r:${GRADE[g].col}"><img class="picon" src="${Parts.icon(k, g)}" alt=""><b>${GRADE[g].name} ${PART[k].name.toLowerCase()}${gauge ? ' · ' + gauge + ' gauge' : ''}</b><small>${note || GRADE[g].note}</small><div class="tbtns"><button data-buypart="${i}" ${s.cr >= cr ? '' : 'disabled'}>${cr} cr</button></div></div>`).join('');
}
// what you carry: the parts on your shelf at home (out in the city it helps
// to know), and the salvage in your pockets
function itemsTab(s) {
  const worth = SALVAGE_ORDER.reduce((a, k) => a + (s.pack[k] || 0) * SALVAGE[k].price, 0);
  let h = `<p class="sub">${s.cr} cr. Salvage sells at the stalls' scrap bins.</p>`;
  h += `<h3>On your shelf at home · ${TOOLS[Tips.tier()].name.toLowerCase()}</h3>` + (s.parts.length ? '<div class="parts">' + s.parts.map((p) => `<div class="part" style="--r:${GRADE[p.g].col}"><img class="picon" src="${Parts.icon(p.k, p.g)}" alt=""><b>${Parts.name(p)}${p.gauge ? ' · ' + p.gauge + ' gauge' : ''}</b><small>${PART_STATE[p.st]} · ${Parts.from(p)}</small></div>`).join('') + '</div>' : '<p class="dim">No parts yet. Strip machines, or buy them at the stalls.</p>');
  const ks = SALVAGE_ORDER.filter((k) => s.pack[k] > 0);
  if (ks.length) h += `<h3>Salvage · worth about ${worth} cr for scrap</h3><div class="tiles">` + ks.map((k) => `<div class="tile" style="--r:${SALVAGE[k].col[1]}"><img src="${Hud.icon(k)}" alt=""><b>${SALVAGE[k].name}</b><span class="n">× ${s.pack[k]}</span><small>${SALVAGE[k].price} cr each for scrap</small></div>`).join('') + '</div>';
  return h;
}
function panelBind(body, which) {
  const s = Game.s, n = Hud.who, re = () => Hud.panel(Hud.open);
  body.querySelectorAll('button[data-selljunk]').forEach((b) => (b.onclick = () => { Parts.sellJunk(); re(); }));
  body.querySelectorAll('button[data-buytool]').forEach((b) => (b.onclick = () => { if (Tips.buy(+b.dataset.buytool)) re(); }));
  body.querySelectorAll('button[data-buypart]').forEach((b) => (b.onclick = () => { const [k, g, cr, gauge] = PART_STOCK[Hud.open === 'grocer' ? 'mo' : n.def.stock][+b.dataset.buypart]; if (!Game.pay({ cr })) return; Parts.give(Parts.make(k, g, { how: 'trade', gauge })); re(); }));
  body.querySelectorAll('button[data-benchload]').forEach((b) => (b.onclick = () => Bench.load(b.dataset.benchload)));
  body.querySelectorAll('button[data-job]').forEach((b) => (b.onclick = () => { const c = b.dataset.job; Jobs.act(c); if (!c.startsWith('back')) re(); }));
  body.querySelectorAll('button[data-role]').forEach((b) => (b.onclick = () => { Hud.toggle(null); NPC_ROLE[n.def.role].use(n); }));
  if (which === 'bench') Bench.attach();
  if (which === 'travel' || which === 'citymap') WorldMap.attach();
}
