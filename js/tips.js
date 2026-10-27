'use strict';
// ---------------------------------------------------------------------------
// Tips and tools. The block's residents hear of things: a drone down behind
// the market, a junction box the city forgot, an autodoc a clinic threw out.
// They tell you, in a message in the morning or to your face, and the thing is
// there to strip until you do. The good ones need better tools than the hand
// kit you start with: the precision kit from Ana, then the clinic micro-kit
// from Kade. Each tier strips what the last couldn't (STRIP_TIER), and gets
// cleaner parts out of the ordinary machines.
// ---------------------------------------------------------------------------
const TOOLS = {
  1: { name: 'Hand kit', note: 'Screwdrivers, pliers, a soldering iron. Enough for vending machines, cars and junk.' },
  2: { name: 'Precision kit', cr: 150, at: 'ana', note: 'Security bits, a torque driver, a hot-air pen. Server racks, drones and junction boxes give up their parts to it.' },
  3: { name: 'Clinic micro-kit', cr: 400, at: 'kade', note: 'Micro-drivers and a clean desoldering station. Medical machines, and the clinic-grade parts in them.' },
};
// what each kind of machine needs to strip (anything else, the hand kit)
const STRIP_TIER = { rack: 2, dronewreck: 2, substation: 2, autodoc: 3 };

// who tells you what, where, and from what day
const TIPS = {
  overpass: { who: 'dara', day: 2, level: 'd_overpass', x: 870, kind: 'dronewreck', label: 'a crashed courier drone', say: 'A courier drone came down behind the Overpass Market last night. Nobody\'s claimed it. It\'s all security bits, mind: you\'d want proper drivers.' },
  drain: { who: 'okonkwo', day: 3, level: 'd_drain', x: 470, kind: 'substation', label: 'a forgotten junction box', say: 'There\'s a junction box in the Main Drain the city forgot about. Forty years I walked past it. The relays in those are made to last.' },
  scrapyard: { who: 'rina', day: 4, level: 'd_scrapyard', x: 400, kind: 'autodoc', label: 'a dumped autodoc', say: 'The Mercy threw out an autodoc. It\'s at the Scrapyard. There\'s a heavy servo in its arm, clinic grade. You\'d need a clinic kit to get it out whole.' },
  chopshop: { who: 'kai', day: 5, level: 'd_chopshop', x: 480, kind: 'dronewreck', label: 'a crashed delivery drone', say: 'A delivery drone crashed in Chop Shop Alley! Go before they strip it! Can I have the propellers?' },
  glasshouse: { who: 'ines', day: 6, level: 'd_glasshouse', x: 300, kind: 'substation', label: 'a junction box left open', say: 'The plaza crew left a junction box open on Glasshouse Plaza. They\'ve been on break for three days.' },
  clinicrow: { who: 'sal', day: 7, level: 'd_clinicrow', x: 600, kind: 'autodoc', label: 'an autodoc out back', say: 'A clinic on the Row got raided. They put their autodoc out the back before anyone could ask about it. Nobody\'s asking about it.' },
  neonrow: { who: 'sato', day: 8, level: 'd_neonrow', x: 380, kind: 'dronewreck', label: 'a fallen news drone', say: 'A news drone fell on Neon Row in the night. It missed my friend Mrs Ito by a metre. She\'d like it gone.' },
};
const TIP_ORDER = Object.keys(TIPS);

const Tips = {
  tier() { return Game.s.tools || 1; },
  // can you strip this kind of machine, and if not, what you'd need
  canStrip(kind) { return this.tier() >= (STRIP_TIER[kind] || 1); },
  need(kind) { return TOOLS[STRIP_TIER[kind] || 1]; },
  st(id) { return Game.s.done['tip:' + id] ? 'done' : Game.s.tips[id] ? 'known' : null; },
  // the next tip someone has for you: due by today, not told yet
  due() { return TIP_ORDER.find((id) => !Game.s.tips[id] && TIPS[id].day <= Game.s.day); },
  dueFrom(res) { const id = this.due(); return id && TIPS[id].who === res ? id : null; },
  tell(id) { Game.s.tips[id] = Game.s.day; const T = TIPS[id]; Game.toast('New lead: ' + T.label + ', ' + LEVELS[T.level].name + '.', 'good'); World.questProps(); },
  // a message in the morning, from whoever's heard something
  morning(news) { const id = this.due(); if (!id) return; const T = TIPS[id], R = RESIDENTS[T.who]; Game.s.tips[id] = Game.s.day; news.push(`A message from ${R.name}: "${T.say}"`); },
  // in person: a resident with a tip for you tells you it instead of small talk
  talk(n) { const id = this.dueFrom(n.def.town); if (!id) return false; Actors.say(n, TIPS[id].say); this.tell(id); return true; },
  // the props the leads put in this level
  props(level) { return TIP_ORDER.filter((id) => this.st(id) === 'known' && TIPS[id].level === level).map((id) => ({ id: 'tip:' + id, kind: TIPS[id].kind, x: TIPS[id].x, label: TIPS[id].label, tip: id })); },
  // the leads, for the Jobs tab
  list() {
    const ids = TIP_ORDER.filter((id) => this.st(id) === 'known'); if (!ids.length) return '';
    return '<h3>Leads</h3>' + ids.map((id) => { const T = TIPS[id], R = RESIDENTS[T.who], ok = this.canStrip(T.kind), what = (TIP_YIELD[T.kind] || []).map(([k, g]) => GRADE[g].name.toLowerCase() + ' ' + PART[k].name.toLowerCase()).join(', ');
      return `<div class="need2 ${ok ? 'ok' : 'no'}"><img class="picon" src="${Parts.icon(TIP_YIELD[T.kind][0][0], TIP_YIELD[T.kind][0][1])}" alt=""><div><b>${T.label[0].toUpperCase() + T.label.slice(1)} · ${LEVELS[T.level].name}</b><small>From ${R.name}. Inside: ${what}.${ok ? '' : ' Needs the ' + this.need(T.kind).name.toLowerCase() + ' (' + this.need(T.kind).cr + ' cr, ' + (this.need(T.kind).at === 'ana' ? 'Mechanic Ana, Overpass Market' : 'Nurse Kade, Clinic Row') + ').'}</small></div><span class="have">${ok ? '✓ your tools' : '✕ tools'}</span></div>`; }).join('');
  },
  // the line at the top of the screen, when there's nothing on the bench
  objective() { const id = TIP_ORDER.find((k) => this.st(k) === 'known' && this.canStrip(TIPS[k].kind)); return id ? `▸ Lead: ${TIPS[id].label}, ${LEVELS[TIPS[id].level].name}` : ''; },
  // a stall's tool upgrade, if it has the next one
  forSale(stock) { return +Object.keys(TOOLS).find((k) => TOOLS[k].at === stock && +k > this.tier()) || 0; },
  buy(t) { if (this.tier() !== t - 1 || !Game.pay({ cr: TOOLS[t].cr })) return false; Game.s.tools = t; Game.toast('New tools: the ' + TOOLS[t].name.toLowerCase() + '. ' + TOOLS[t].note, 'good'); World.questProps(); Save.write(); return true; },
};
