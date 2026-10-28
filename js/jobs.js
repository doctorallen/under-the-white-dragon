'use strict';
// ---------------------------------------------------------------------------
// The jobs that come to the White Dragon, the heat, and the morning after.
// A job is a person, a broken thing and a choice: they turn up at the White
// Dragon with it (Jobs.spawn puts them there), you take it to the bench, and
// fix it. Once it's tested, it's collected: whoever's waiting at the counter
// takes it a little after, and a resident comes by the White Dragon for it as
// soon as they can (not in the night, not off their work), and Auntie Lin
// hands it over; they pay then (Jobs.collections). The next morning (after
// you've slept) you hear what your fix did. Their state is in Game.s.jobs; the thing
// itself is on your bench in the basement (Game.s.bench) while you work on it.
// Heat (Game.s.heat, 0 to 100) is how close the precinct is to your trapdoor:
// illegal work on the bench, parts taken from where you shouldn't be, a
// Meridian serial that gets traced. Honest repairs and time bring it down. At
// 40 people on the block start to talk; at 70 there's a knock before dawn,
// and a search of the bar and the storeroom; at 90 they find the trapdoor.
// ---------------------------------------------------------------------------
const JOBS = {
  // the first job, already on the bench when you start (tutorial.js): Lin
  // keeps the bar over your head, and you take it back to her yourself (self)
  lin: {
    name: 'Auntie Lin', title: 'Lin\'s radio', dev: 'radio', at: null, wait: null, pay: 50, honest: true, self: true,
    parts: { board: ['street', 'ok'], relay: ['street', 'ok'], aerial: ['street', 'burnt'], cell: ['street', 'ok'] },
    offer: ['"The kitchen radio\'s gone to static. Thirty years behind this counter and it picks tonight."', '"Fifty, and don\'t argue. The bar\'s too quiet without it."'],
    waiting: '"Static all evening. The cooks are singing to fill the gap. Please."',
    thanks: 'There. Now the place sounds like itself.',
  },
  ozzy: {
    name: 'Ozzy', title: 'Ozzy\'s nav unit', dev: 'navunit', at: 425, wait: 425, pay: 80, honest: true,
    look: { skin: SKINS[1], hair: 'cap', capCol: '#ffd040', top: '#4a4430', coat: 'jacket', legs: '#2a2a34', wide: 1 },
    parts: { board: ['street', 'ok'], cell: ['street', 'dead'], aerial: ['street', 'burnt'] },
    lines: ['Rain\'s bad for business. Good for yours, I guess.'],
    offer: ['"You the one who fixes things? Auntie Lin said ask for the noodles with nothing in them."', '"My cab\'s nav went dark mid-run. Smelled like a fuse. No nav, no fares; no fares, no rent."', '"Eighty when it works. Honest money, for once in this room."'],
    waiting: '"I\'ll be at the counter. Lin\'s noodles are the only thing in this city that still works."',
  },
  vey: {
    name: 'Vey', title: 'Vey\'s arm', dev: 'arm', at: 575, wait: 575, pay: 0, illegal: true, rusty: true,
    look: { skin: SKINS[0], hair: 'bob', hairCol: '#e8e8f2', top: '#2a2a3a', coat: 'long', legs: '#1a1a24', cyArm: true },
    parts: { servo: ['military', 'dead', 'heavy'], board: ['clinic', 'ok'], cell: ['clinic', 'worn'] },
    lines: ['Don\'t look at the arm. Everyone looks at the arm.'],
    offer: ['She keeps her right arm close, the hand half shut. "It locks. The elbow. Some days it won\'t open, and a hand that won\'t open gets noticed."', '"Somebody cut the serials off before I got it. Don\'t ask where I got it."', '"I can\'t pay. I can owe you, and I always pay what I owe."'],
    waiting: '"I\'ll wait. I\'m good at waiting. It\'s the one thing they built me for."',
  },
};
const JOB_ORDER = ['lin', 'ozzy', 'vey'];

// Odd jobs: the block's residents bring their broken things, a couple of them
// a day. Each kind of thing: the device, who on the block owns one, which of
// its parts tend to go (one or two do), what they say and what they pay (a
// little over what the parts cost at a stall). Asked when you talk to them,
// wherever they are that day; handed back to them the same way. Their state
// is in Game.s.jobs under 'odd:<day>:<who>', with what went wrong.
const ODD = {
  radio: { dev: 'radio', name: 'radio', who: ['okonkwo', 'dara', 'mo'], faults: ['aerial', 'cell', 'relay'], base: 14,
    ask: ['"My radio\'s gone to nothing but static. Can you look at it?"', '"I\'ll pay what\'s fair, if it plays."'], waiting: '"Any luck with the radio?"', thanks: 'Music again. Thank you.' },
  cooker: { dev: 'cooker', name: 'rice cooker', who: ['sato', 'rina', 'ines'], faults: ['relay', 'cell', 'board'], base: 12,
    ask: ['"The rice cooker clicks and does nothing. Thirty years old, it\'s family."', '"You fix things, yes? Lin says you fix things."'], waiting: '"The rice cooker? No hurry. Some hurry."', thanks: 'Rice tonight. Bless you.' },
  drone: { dev: 'toydrone', name: 'toy drone', who: ['kai'], faults: ['aerial', 'cell'], base: 4, cap: 30,
    ask: ['"My drone won\'t fly! It just beeps at me."', '"Mom gave me money for it. Thirty. Is thirty enough?"'], waiting: '"Is it fixed? Is it fixed yet?"', thanks: 'IT FLIES! Thank you thank you.' },
  fan: { dev: 'fan', name: 'desk fan', who: ['teo', 'ines', 'jun'], faults: ['relay', 'cell'], base: 16,
    ask: ['"The fan died. Our apartment\'s an oven without it."', '"Can you get it going?"'], waiting: '"How\'s the fan?"', thanks: 'Air! Real moving air.' },
};
const STALL_COST = { cell: 25, aerial: 30, relay: 20, board: 45, servo: 80 };

const Jobs = {
  news: [],
  st(id) { return Game.s.jobs[id] || (Game.s.jobs[id] = { st: 'offer' }); },
  // a job's definition: one of the story's, or a resident's odd job
  def(id) {
    if (JOBS[id]) return JOBS[id];
    const c = Game.s.jobs[id] || this.oddMake(id), T = ODD[c.tpl], R = RESIDENTS[c.res];
    return { name: R.name, title: R.name + '\'s ' + T.name, dev: T.dev, pay: c.pay, honest: true, look: R.look, parts: c.parts, odd: true, res: c.res, offer: T.ask, waiting: T.waiting, thanks: T.thanks };
  },
  // where the thing is: on the bench, or set aside in the basement
  dev(id) { const b = Game.s.bench; return b && b.job === id ? b : Game.s.aside[id] || null; },
  ready(id) { const d = this.dev(id); return !!(d && d.tested && (d.tested.res === 'works' || d.tested.res === 'half')); },
  // ---- odd jobs: today's, who has them, and what's wrong with each thing
  oddToday() {
    const day = Game.s.day, pairs = [];
    for (const k in ODD) for (const r of ODD[k].who) pairs.push([k, r]);
    const out = [], used = new Set();
    for (let i = 0; out.length < 2 && i < 16; i++) { const [k, r] = pairs[Math.floor(hash(day, i, 101) * pairs.length)]; if (used.has(r) || used.has(k) || (Game.s.flags['sour:' + r] || 0) > day) continue; used.add(r); used.add(k); out.push('odd:' + day + ':' + r + ':' + k); }
    return out;
  },
  oddMake(id) {
    const [, day, res, tpl] = id.split(':'), T = ODD[tpl], D = DEVICE[T.dev], sd = +day * 31 + res.length * 7 + tpl.length, n = 1 + (hash(sd, 1, 102) < 0.35 ? 1 : 0);
    const bad = T.faults.slice().sort((a, b) => hash(a.length, sd, 103) - hash(b.length, sd, 103) || (a < b ? -1 : 1)).slice(0, n), parts = {};
    for (const k in D.slots) parts[k] = [hash(sd, k.length, 105) < 0.5 ? 'street' : 'scrap', bad.includes(k) ? (hash(sd, k.length, 106) < 0.5 ? 'dead' : 'burnt') : 'ok'];
    const cost = bad.reduce((a, k) => a + STALL_COST[D.slots[k].kind], 0), pay = Math.min(T.cap || 999, Math.round((T.base + cost * 1.15) / 5) * 5);
    return { st: 'offer', tpl, res, pay, parts, day: +day };
  },
  oddOf(res) { return Object.keys(Game.s.jobs).filter((id) => id.startsWith('odd:') && Game.s.jobs[id].res === res && Game.s.jobs[id].st === 'bench'); },
  // ---- heat ----
  heat(n, why) {
    const s = Game.s, was = s.heat; s.heat = clamp(Math.round(s.heat + n), 0, 100);
    if (s.heat === was) { Hud.refresh(); return; }
    if (why && n > 0) Game.toast(`Heat +${s.heat - was}. ${why}`, 'warn');
    if (why && n < 0) Game.toast(`Heat ${s.heat - was}. ${why}`, 'good');
    Hud.refresh();
  },
  // ---- the people, at the bar ----
  // where each one stands today, if they're here at all
  where(id) {
    const J = JOBS[id], c = this.st(id);
    if (c.st === 'offer') return J.at;
    if (c.st === 'bench') return J.wait;
    return null;
  },
  spawn() {
    if (!World.L) return;
    const here = World.L.id === 'd_noodles', G = World.L.ground;
    Actors.npcs = Actors.npcs.filter((n) => !n.def.job || (here && this.where(n.def.job) === n.x));
    if (here) for (const id of JOB_ORDER) {
      const x = this.where(id); if (x === null || Actors.npcs.some((n) => n.def.job === id)) continue;
      const J = JOBS[id], def = { name: J.name, look: J.look, x, y: G - 2, sched: [[0, 24, x, 'stand']], lines: J.lines, job: id };
      Actors.npcs.push({ def, i: 80 + JOB_ORDER.indexOf(id), x, y: G - 2, face: id === 'ozzy' ? 1 : -1, hidden: false, tx: x, wt: 0, bubble: null, line: 0, art: new Map() });
    }
  },
  // what someone at the counter has for you: an offer, a wait, a hand-back
  actionsFor(name) {
    const id = JOB_ORDER.find((k) => JOBS[k].name === name);
    if (id) {
      const c = this.st(id);
      if (c.st === 'offer') return [{ kind: 'job', id }];
      if (c.st === 'bench') return [{ kind: this.ready(id) ? 'handback' : 'jobwait', id }];
      return [];
    }
    const res = typeof TOWN_ORDER !== 'undefined' && TOWN_ORDER.find((k) => RESIDENTS[k].name === name); if (!res) return [];
    const out = this.oddOf(res).map((j) => ({ kind: this.ready(j) ? 'coming' : 'jobwait', id: j }));
    for (const j of this.oddToday()) if (j.split(':')[2] === res && !Game.s.jobs[j]) out.push({ kind: 'job', id: j });
    return out;
  },
  html(a) {
    const J = this.def(a.id), b = this.dev(a.id);
    if (a.kind === 'job') {
      const where = Game.s.bench ? 'It\'ll wait in the basement, set aside, till your bench is free.' : '';
      return `<div class="ask"><h3>${J.title}${J.pay ? ' · ' + J.pay + ' cr' : ''}</h3>${J.offer.map((l) => `<p class="sub">${l}</p>`).join('')}${J.illegal ? '<p class="dim">Illegal work: while it\'s on your bench, it\'s heat.</p>' : ''}${where ? `<p class="dim">${where}</p>` : ''}<div class="buttons"><button data-job="take:${a.id}" class="go">Take it</button></div></div>`;
    }
    if (a.kind === 'jobwait') {
      const notes = Game.s.notes.log.filter((e) => e.key.startsWith(a.id + ':')).map((e) => e.text.replace(/^[^:]*: /, ''));
      return `<div class="ask"><h3>${J.title}</h3><p class="sub">${J.waiting}</p>${this.needs(a.id) || '<p class="dim">It\'s on your bench in the basement.</p>'}</div>`;
    }
    if (a.kind === 'coming') return `<div class="ask"><h3>${J.title}</h3><p class="sub">"It's fixed? I'll come by the White Dragon for it as soon as I can."</p><p class="dim">Lin will hand it over when they come in, and they'll pay you then: ${this.dev(a.id).tested.res === 'works' ? J.pay : Math.round(J.pay / 2)} cr.</p></div>`;
    if (a.kind === 'handback') {
      const t = b.tested, trace = this.traced(b);
      if (J.odd) return `<div class="ask"><h3>${J.title}</h3><p class="dim">${t.res === 'works' ? 'It works' : 'It half works'}. ${t.res === 'works' ? J.pay : Math.round(J.pay / 2)} cr.${Object.values(b.slots).some((s) => s.p && s.p.how !== 'pull' && s.p.g === 'scrap') ? ' There\'s scrap in it now: it might not last the night.' : ''}</p><div class="buttons"><button data-job="back:${a.id}" class="go">Hand it back</button></div></div>`;
      return `<div class="ask"><h3>${J.title}</h3><p class="dim">${t.res === 'works' ? 'It works' : 'It half works'}${t.loose ? `, and ${t.loose} screw${t.loose > 1 ? 's' : ''} won't hold` : ''}.${trace ? ' There\'s a Meridian serial in it that isn\'t theirs.' : ''}${J.pay ? ` ${t.res === 'works' ? J.pay : J.pay / 2} cr.` : ''}</p><div class="buttons"><button data-job="back:${a.id}" class="go">Hand it back</button></div></div>`;
    }
    return '';
  },
  act(cmd) {
    const i = cmd.indexOf(':'), what = cmd.slice(0, i), id = cmd.slice(i + 1); // (an odd job's id has colons of its own)
    if (what === 'take') this.take(id);
    if (what === 'back') this.handBack(id);
  },
  take(id) {
    if (id.startsWith('odd:') && !Game.s.jobs[id]) Game.s.jobs[id] = this.oddMake(id);
    const J = this.def(id), c = this.st(id), o = { job: id, name: J.title, parts: J.parts, rusty: J.rusty };
    if (Game.s.bench) Game.s.aside[id] = Bench.make(J.dev, o); else Bench.put(J.dev, o);
    c.st = 'bench'; c.since = Game.s.day;
    Game.toast(Game.s.aside[id] ? `You take ${J.title} down to the basement and set it aside.` : `You take ${J.title} down to your bench.`, 'good');
    if (J.illegal) this.heat(5, 'Illegal chrome under the bar.');
    this.spawn(); Save.write();
  },
  // a Meridian part that came from somewhere it shouldn't: a serial someone can trace
  traced(b) { return Object.values(b.slots).some((s) => s.p && s.p.g === 'military' && (s.p.how === 'take' || s.p.how === 'trade')); },
  // ---- collecting: what's tested goes back to whoever it belongs to. Someone
  // waiting at the counter takes it a quarter of an hour after; a resident is
  // sent for it (a Tyrell directive above their free time, below their work,
  // and never arriving in the night: the 'collect' action's hours), and it's
  // theirs once they've started collecting it at the bar. Not while it's open
  // in front of you on the bench.
  collections() {
    const s = Game.s, now = City.on ? City.w.now : (s.day * 24 + s.time) * 60;
    for (const id of Object.keys(s.jobs)) {
      const c = s.jobs[id]; if (c.st !== 'bench' || (JOBS[id] && JOBS[id].self)) continue;
      const b = this.dev(id), busy = Hud.open === 'bench' && s.bench === b;
      if (!this.ready(id)) { if (c.calling) { c.calling = 0; if (c.res) City.direct(c.res, null); } continue; }
      if (!c.calling) c.calling = now;
      if (busy) continue;
      if (JOBS[id] || !City.on) { if (now - c.calling >= (JOBS[id] ? 15 : 60)) this.handBack(id, true); continue; } // (at the counter already; or, with no minds about, an hour)
      const p = City.w.get(c.res), d = p && p.directive;
      if (d && d.do === 'collect' && d.done) { City.direct(c.res, null); this.handBack(id, true); }
      else if (!d || d.do !== 'collect') City.direct(c.res, { do: 'collect', at: 'd_noodles', rank: 1.6, label: 'collect their ' + ODD[c.tpl].name });
    }
  },
  handBack(id, collected) {
    const J = this.def(id), c = this.st(id), b = this.dev(id); if (!b || !b.tested) return;
    const t = b.tested, pay = J.pay ? (t.res === 'works' ? J.pay : Math.round(J.pay / 2)) : 0;
    if (!J.odd) Object.assign(c, { st: 'back', day: Game.s.day, res: t.res, loose: t.loose, scorch: b.scorch.length, traced: this.traced(b), parts: Object.fromEntries(Object.entries(b.slots).map(([k, s]) => [k, s.p && { g: s.p.g, how: s.p.how, st: s.p.st, gauge: s.p.gauge }])) });
    if (J.odd) City.did(t.res === 'works' ? 'fixed' : 'botched', c.res, ODD[c.tpl].name);
    if (J.odd) Object.assign(c, { st: 'done', back: Game.s.day, fitted: Object.values(b.slots).filter((s) => s.p && s.p.how !== 'pull').map((s) => ({ k: s.p.k, g: s.p.g })) });
    // (collected: they came to the White Dragon and Lin handed it over; if you're there, they say so)
    const there = World.L && Actors.npcs.find((n) => n.def.name === J.name && !n.hidden);
    if (there) Actors.say(there, pay ? J.thanks || 'That\'s it working. Thank you.' : 'I owe you.');
    if (pay) { Game.s.cr += pay; Game.toast(collected ? `${J.name} came by the White Dragon for ${J.title.replace(/^.*?'s /, 'the ')}. Lin took ${pay} cr for you.` : J.odd ? `"${J.thanks}" ${J.name} pays you ${pay} cr.` : `${J.name} pays you ${pay} cr.`, 'good'); }
    else Game.toast(collected ? `${J.name} took ${J.title.replace(/^.*?'s /, 'the ')} from Lin, and left a message: "I owe you."` : `${J.name} flexes the hand, slowly. "I owe you."`, 'good');
    if (J.honest) this.heat(J.odd ? -3 : -10, J.odd ? null : 'An honest repair, seen to be done.');
    if (Game.s.bench === b) Bench.clear(); else delete Game.s.aside[id];
    if (!collected) Hud.toggle(null); else if (Hud.open === 'jobs' || Hud.open === 'pack') Hud.panel(Hud.open);
    this.spawn(); Hud.refresh(); Save.write();
  },
  // a customer's face, for their card (made once)
  faces: {},
  face(id) {
    const fk = id.startsWith('odd:') ? id.split(':')[2] : id; if (this.faces[fk]) return this.faces[fk];
    const sp = person(Object.assign({}, this.def(id).look, { pose: 'stand', seed: 7 })), [c, g] = canvasOf(56, 56);
    g.imageSmoothingEnabled = false; g.fillStyle = '#0e0a14'; g.fillRect(0, 0, 56, 56); const d = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data; let top = 0; while (top < sp.h && ![...Array(sp.w).keys()].some((x) => d[(top * sp.w + x) * 4 + 3])) top++; g.drawImage(sp.c, Math.round(sp.ax - 11), top - 1, 22, 22, 0, 2, 56, 56); // (the head and shoulders, from the top of the head)
    return (this.faces[fk] = c.toDataURL());
  },
  // what a job needs: every part of the thing, and for each whether it's fine,
  // needs replacing (with what you have that would do, and where to get it),
  // or isn't checked yet
  needs(id) {
    const b = this.dev(id), J = this.def(id), D = DEVICE[J.dev];
    if (!b) return '';
    return '<div class="needs">' + Object.keys(D.slots).map((k) => {
      const S = D.slots[k], s = b.slots[k], P = PART[S.kind], gauge = S.gauge ? ', ' + S.gauge + ' gauge' : '';
      const have = Parts.have(S.kind).filter((p) => p.st === 'ok' && (!S.gauge || p.gauge === S.gauge)).length;
      const ico = `<img src="${Parts.icon(S.kind, s.p ? s.p.g : 'street')}" alt="">`;
      if (!b.probed[k]) return `<div class="need2 unk">${ico}<div><b>${P.name}</b><small>Not checked yet: probe it on the bench.</small></div><span class="have">?</span></div>`;
      const bad = !s.p || s.p.st !== 'ok' || (S.gauge && s.p.gauge !== S.gauge);
      if (!bad) return `<div class="need2 fine">${ico}<div><b>${P.name}</b><small>Fine.</small></div><span class="have">✓ fine</span></div>`;
      const why = !s.p ? 'missing' : s.p.st !== 'ok' ? PART_STATE[s.p.st] : 'wrong gauge';
      return `<div class="need2 ${have ? 'ok' : 'no'}">${ico}<div><b>${P.name}${gauge} · ${why}</b><small>${have ? 'You have one on the shelf.' : Parts.sources(S.kind, S.gauge).join(' · ')}</small></div><span class="have">${have ? '✓ have ' + have : '✕ need 1'}</span></div>`;
    }).join('') + '</div>';
  },
  // the jobs, for the Jobs tab: a card each, with a face, where it stands and what it needs
  list() {
    const h = Game.s.heat, place = (res) => { const st = Town.state(res, Game.hour()); return st.hidden ? 'asleep in the apartments' : !st.level ? 'out, off the block' : st.moving ? 'on the move' : st.level === 'd_noodles' ? 'at the White Dragon' : st.level === 'd_grocery' ? 'at Mo\'s' : st.level === 'd_apartments' ? 'in the apartments' : st.level === 'd_dragon' ? 'on the street' : 'at ' + LEVELS[st.level].name; };
    let out = `<div class="heatbar">HEAT ${h}<i style="--h:${h}%"></i>${h >= 70 ? 'Expect a knock.' : h >= 40 ? 'The block is talking.' : ''}</div>`;
    const card = (id, chip, state, extra, cls) => `<div class="jobcard ${cls || ''}"><img class="face" src="${this.face(id)}" alt=""><div><h3>${this.def(id).title}<span class="chip">${chip}</span></h3><div class="state">${state}</div></div>${extra || ''}</div>`;
    const doing = (id) => { const J = this.def(id), d = this.dev(id), on = Game.s.bench === d, ready = this.ready(id); return card(id, ready ? 'ready' : on ? 'on the bench' : 'set aside', ready ? `Tested: ${d.tested.res === 'works' ? 'it works' : 'it half works'}. ${J.self ? `Take it up to ${J.name}, behind the counter.` : J.odd ? `${J.name} will come by the White Dragon for it (${place(J.res)} now), and Lin will hand it over.` : `${J.name}'s at the counter and will take it shortly.`} ${J.pay ? 'Pays ' + (d.tested.res === 'works' ? J.pay : Math.round(J.pay / 2)) + ' cr on collection.' : ''}` : (on ? 'On your bench in the basement.' : 'Waiting in the basement: set it on the bench.') + (J.pay ? ' Pays ' + J.pay + ' cr.' : '') + (J.illegal ? ' <span style="color:#ff8aa0">Illegal: heat while it\'s down there.</span>' : ''), ready ? '' : this.needs(id), ready ? 'ready' : ''); };
    const busy = Object.keys(Game.s.jobs).filter((id) => Game.s.jobs[id].st === 'bench');
    if (busy.length) out += '<h3>In the basement</h3>' + busy.map(doing).join('');
    const asks = this.oddToday().filter((id) => !Game.s.jobs[id]), story = JOB_ORDER.filter((id) => this.st(id).st === 'offer');
    if (asks.length || story.length) out += '<h3>Asking for you</h3>' + story.map((id) => card(id, 'new', `${JOBS[id].name} is waiting at the bar upstairs. ${JOBS[id].pay ? JOBS[id].pay + ' cr.' : 'A favor.'}`)).join('') + asks.map((id) => { const c = this.oddMake(id), R = RESIDENTS[c.res]; return card(id, 'today', `${R.name}'s ${ODD[c.tpl].name} is broken. ${R.name} is ${place(c.res)} right now. Pays about ${c.pay} cr.`); }).join('');
    out += Tips.list();
    const past = Object.keys(Game.s.jobs).filter((id) => ['back', 'done', 'seized'].includes(Game.s.jobs[id].st));
    if (past.length) out += '<h3>Done</h3>' + past.slice(-6).map((id) => card(id, Game.s.jobs[id].st === 'seized' ? 'seized' : 'done', Game.s.jobs[id].st === 'back' ? 'You\'ll hear how it went in the morning.' : Game.s.jobs[id].st === 'seized' ? 'Taken by the precinct.' : 'Done.', '', 'done')).join('');
    return out;
  },
  // the line at the top of the screen: what the job on the bench needs next
  objective() {
    const b = Game.s.bench, ready = Object.keys(Game.s.jobs).find((id) => Game.s.jobs[id].st === 'bench' && this.ready(id));
    if (ready) { const J = this.def(ready); return J.self ? `▸ Take ${J.title.replace(/^.*?'s /, 'the ')} up to ${J.name}` : `▸ ${J.name} will collect ${J.title.replace(/^.*?'s /, 'the ')} from Lin`; }
    if (!b) { const id = JOB_ORDER.find((k) => this.st(k).st === 'offer'); if (id) return `▸ ${JOBS[id].name} is waiting at the bar upstairs`; const waiting = Object.keys(Game.s.aside)[0]; if (waiting) return `▸ ${Game.s.aside[waiting].name} is waiting on your bench`; const ask = this.oddToday().find((j) => !Game.s.jobs[j]); return ask ? `▸ ${RESIDENTS[ask.split(':')[2]].name} has something broken` : Tips.objective(); }
    const need = Object.keys(DEVICE[b.dev].slots).filter((k) => b.probed[k] && b.slots[k].p && (b.slots[k].p.st !== 'ok' || (DEVICE[b.dev].slots[k].gauge && b.slots[k].p.gauge !== DEVICE[b.dev].slots[k].gauge))).map((k) => PART[DEVICE[b.dev].slots[k].kind].took);
    return need.length ? `▸ ${b.name} needs ${need.join(' and ')}` : `▸ ${b.name} is on your bench`;
  },
  // ---- the morning after: what your fixes did, and who came knocking ----
  morning() {
    const s = Game.s, news = [];
    for (const id of JOB_ORDER) {
      const J = JOBS[id], c = this.st(id); if (c.st !== 'back' || c.day >= s.day) continue;
      c.st = 'done';
      const clean = c.res === 'works' && !c.loose && !c.scorch;
      if (id === 'lin') news.push(c.res === 'works' ? 'Lin\'s radio played all night behind the counter. She hums along when she thinks nobody\'s listening.' : 'Lin\'s radio crackles in and out. She\'s put it on the shelf by the broth and hits it when it goes.');
      if (id === 'ozzy') {
        if (c.res === 'works' && !c.loose) { s.flags['ozzy:rides'] = true; news.push('Ozzy\'s cab is back on the roofs. He left a note with Auntie Lin: your cab rides are on him, any time.'); }
        else if (c.res === 'works') news.push('Ozzy\'s nav works, but the casing rattles at speed and he\'s had to tape it. He paid. He\'ll tell people you\'re good, not careful.');
        else news.push('Ozzy\'s nav cut out twice on the night run. He\'s back on paper maps, and he\'s telling the rank at the Overpass about it.');
      }
      if (id === 'vey') {
        const servo = c.parts.servo || {};
        if (c.traced) { news.push('A Meridian serial lit up a checkpoint on the Overpass at dawn: a runaway synth with a stolen servo in her arm. Vey\'s in a precinct van, and they\'ll want to know who fitted it.'); this.heat(25); }
        else if (servo.g === 'scrap' && clean) { s.flags['vey:schematic'] = true; s.cr += 120; news.push('Vey came by before the bar opened. The arm holds. Under your door: an envelope with 120 cr in it, and no note. She pays what she owes.'); }
        else news.push(`The ${servo.g === 'scrap' ? 'scrap' : 'light'} servo gave out on Vey at a bad moment. She got away, just. She'll be back, and she'll remember.`);
      }
    }
    // what's on the bench overnight, and who noticed
    const b = s.bench, hot = [b && b.job, ...Object.keys(s.aside)].filter((id) => id && JOBS[id] && JOBS[id].illegal)[0];
    if (hot) { this.heat(10); news.push('Word gets around about what\'s on your bench. Heat +10.'); }
    if (s.heat >= 70) {
      const found = s.heat >= 90;
      news.push('A knock before dawn: a precinct detective, polite, wet coat. He goes through the bar and the storeroom for a long time, and Auntie Lin watches him do it.');
      if (found && hot) { const J = JOBS[hot]; news.push(`He moves the rug. He finds the trapdoor, and ${J.title} in your basement, and takes it as evidence. ${J.name} won't be coming back for it.`); this.st(hot).st = 'seized'; if (b && b.job === hot) Bench.clear(); else delete s.aside[hot]; this.heat(-30); } // (with the evidence gone, they ease off)
      else if (found) news.push('He moves the rug and finds the trapdoor. Down there he finds a cold iron and nothing he can use, and leaves. He knows where you work now.');
      else news.push('He stands on the rug for a while, talking to Lin about the weather. Then he leaves.');
      this.heat(-30);
    } else this.heat(-5);
    // scrap parts in the residents' things: some give out overnight, and the
    // owner remembers who fitted them
    for (const id in s.jobs) {
      const c = s.jobs[id]; if (!id.startsWith('odd:') || c.st !== 'done' || c.checked || c.back === undefined || c.back >= s.day) continue;
      c.checked = true; const R = RESIDENTS[c.res], bad = (c.fitted || []).find((p, i) => p.g === 'scrap' && hash(s.day, i, id.length + 107) < 0.35);
      if (bad) { s.flags['sour:' + c.res] = s.day + 3; City.did('botched', c.res, ODD[c.tpl].name); news.push(`${R.name}'s ${ODD[c.tpl].name} died again overnight: the scrap ${PART[bad.k].name.toLowerCase()} you fitted gave out. ${R.name} isn't asking for the money back, but won't be bringing you anything for a few days.`); }
    }
    Tips.morning(news);
    City.morning(news); // (what's going round the block about you)
    this.news = news; return news;
  },
};
