'use strict';
// ---------------------------------------------------------------------------
// Knowing people. What you learn of someone in a talk (their work, what they
// like, who's at home, their story: talk.js) Tyrell's Voice keeps for good,
// with how familiar the two of you are: half a point a talk, a point a thing
// learned (vendor/tycho/tyrell/docs/modules/voice.md#knowing-someone). Here
// it counts for something:
//   - the People page of your notebook (Known.html, the pack's People tab):
//     everyone you've talked to, their face, what you remember of them, how
//     well you know each other, how they stand with you, what they've done
//     for you, and the work you've done for them, open and done;
//   - in a talk, someone who knows you takes what you say better, and you can
//     ask after what they've told you (Voice's familiarLand and recalls,
//     T.known; the recall threads are talk.js's);
//   - a witness who knows you is slower to report you (Wormtongue's
//     familiarReport);
//   - they go higher on a job's pay (Jobs.haggle) and give better prices at
//     their stall or counter (Known.rate, Known.price);
//   - known well enough (T.known.favor), they offer what they'd offer nobody
//     else, once: a friend's price, a lead only they know of, a job they'd
//     bring only to you (Known.favorFor, the favor thread in talk.js), kept
//     in Game.s.favors;
//   - doors name who lives behind them only once you know them (Known.homes,
//     census.js's doorText and mapLabel).
// Without the minds there's nobody to know, and the doors say what they
// always did.
// ---------------------------------------------------------------------------
const KNOWN_AT = T.known; // (the numbers, by a name talk.js can reach where its own T is the talk's context)
const KNOWN_BAND = ['a face you know', 'an acquaintance', 'you know each other', 'you know each other well'];

const Known = {
  cache: null, v: 0,
  on() { return City.on && !!City.w.voice; },
  // how familiar someone is with you, and what you've learned of them
  fam(id) { return this.on() && id ? City.w.voice.familiarity(id, 'player') : 0; },
  learned(id) { return this.on() && id ? City.w.voice.learned(id, 'player') : {}; },
  // a talk changed what you know (talk.js), so the list is made again
  dirty() { this.v++; },
  // everyone you've talked to who's somebody here (a resident, or one of the
  // three at the counter), the latest first; and the households you know of
  // (made again after a talk, a reload or a rewind)
  people() {
    if (!this.on()) return [];
    const w = City.w, c = this.cache;
    if (c && c.w === w && c.v === this.v && c.now <= w.now) return c.list;
    const list = w.voice.acquaintances('player').filter((a) => RESIDENTS[a.who] || TALK_STORY[a.who]), homes = new Set();
    for (const a of list) { const R = RESIDENTS[a.who]; if (R && R.hh) homes.add(R.hh); if (typeof a.learned.home === 'string' && a.learned.home.startsWith('hh:')) homes.add(a.learned.home); }
    this.cache = { w, v: this.v, now: w.now, list, homes };
    return list;
  },
  homes() { this.people(); return this.cache ? this.cache.homes : new Set(); },
  // how well you know each other, and how they stand with you, in words
  band(f) { const b = T.known.bands; let i = 0; while (i < b.length && f >= b[i]) i++; return KNOWN_BAND[i]; },
  standing(id) {
    const fs = City.on && City.w.fellowship; if (!fs) return '';
    const r = fs.regard(id, 'player');
    return r >= 0.35 ? 'a friend' : r >= 0.15 ? 'likes you' : r <= -0.3 ? 'can\'t stand you' : r <= -0.1 ? 'wary of you' : '';
  },
  // ---- their trade: how much better their prices are for you (a share) ----
  off(n) {
    const id = n && n.def && n.def.town; if (!id || !this.on()) return 0;
    const K = T.known, f = this.favors()[id];
    return Math.round((Math.min(K.priceMax, this.fam(id) * K.price) + (f && f.kind === 'price' ? K.friend : 0)) * 100) / 100;
  },
  // what they pay you for salvage, a rate; what a part costs you
  rate(n) { return ((n && n.def.rate) || 1) * (1 + this.off(n)); },
  price(n, cr) { const o = this.off(n); return o ? Math.max(1, Math.round(cr * (1 - o))) : cr; },
  // the line at the top of their trade, when they know you
  deal(n, buying) {
    const o = this.off(n); if (!o) return '';
    const f = this.favors()[n.def.town], pc = Math.round(o * 100) + '%';
    return `<p class="deal">${talkFirst(n.def.name)} knows you${f && f.kind === 'price' ? ', and gives you a friend\'s price' : ''}: ${buying ? pc + ' off for you' : pc + ' more for your salvage'}.</p>`;
  },
  // ---- a job's pay: how much further they'll go, haggled (Jobs.haggle) ----
  haggleUp(id) { return Math.min(T.known.haggleMax, this.fam(id) * T.known.haggle); },
  // ---- what they'd offer nobody else, once (the favor thread, talk.js) ----
  favors() { return Game.s.favors || (Game.s.favors = {}); },
  // whoever trades (a stall, a parts counter, the grocery's till) gives a
  // friend's price; someone who knows of something gives the lead; anyone
  // else brings you something of theirs that's broken
  favorFor(id) {
    const R = RESIDENTS[id]; if (!R || this.favors()[id]) return null;
    if (R.job && (R.job.role === 'vendor' || R.job.role === 'parts' || R.job.place === 'd_grocery')) return { kind: 'price', at: R.job.place === 'd_grocery' ? 'the counter' : 'my stall' };
    const tip = TIP_ORDER.find((t) => TIPS[t].friend && TIPS[t].who === id && !Game.s.tips[t]);
    if (tip) return { kind: 'tip', tip };
    const job = Jobs.favorJob(id); if (!job) return null;
    const c = Jobs.oddMake(job);
    return { kind: 'job', job, thing: ODD[c.tpl].name, pay: c.pay };
  },
  // what someone's done for you that they'd do for nobody else, in words
  favorText(id) {
    const f = this.favors()[id];
    if (!f) return KNOWN_OWED[id] && Game.flag(KNOWN_OWED[id][0]) ? KNOWN_OWED[id][1] : '';
    if (f.kind === 'price') return 'Gives you a friend\'s price.';
    if (f.kind === 'tip') return `Told you of ${TIPS[f.tip].label} (${LEVELS[TIPS[f.tip].level].name.replace(/^The /, 'the ')}), and nobody else knew of it.`;
    return f.took ? 'Brought you work they\'d bring nobody else.' : 'Offered you work they\'d offer nobody else.';
  },
  // ---- the work you've done for them, and what's open, newest first ------
  jobsOf(id) {
    const s = Game.s, out = [];
    const row = (jid, c, word, cls, open, t, text) => out.push({ jid, c, word, cls, open, t, text });
    if (JOBS[id]) {
      const c = s.jobs[id] || { st: 'offer' }, J = Jobs.def(id), pay = J.pay ? J.pay + ' cr' : 'a favor';
      if (c.st === 'offer') { if (J.at !== null) row(id, c, 'asking', 'unk', true, s.day + 1, `Waiting at the bar upstairs. ${pay}.`); }
      else this.benchRow(row, id, c, J);
    } else if (RESIDENTS[id]) {
      for (const jid of Object.keys(s.jobs)) { const c = s.jobs[jid]; if (jid.startsWith('odd:') && c.res === id) this.benchRow(row, jid, c, Jobs.def(jid)); }
      for (const jid of Jobs.oddToday()) if (jid.split(':')[2] === id && !s.jobs[jid]) { const c = Jobs.oddMake(jid); row(jid, c, 'asking', 'unk', true, s.day + 1, `Their ${ODD[c.tpl].name}'s broken. About ${c.pay} cr.`); }
    }
    return out.sort((a, b) => (b.open - a.open) || (b.t - a.t));
  },
  benchRow(row, id, c, J) {
    const d = Jobs.dev(id), on = Game.s.bench && d === Game.s.bench, paid = (res) => (c.paid !== undefined ? c.paid : J.pay && res ? (res === 'works' ? J.pay : Math.round(J.pay / 2)) : 0);
    const day = (n) => (n === Game.s.day ? 'today' : n === Game.s.day - 1 ? 'yesterday' : 'day ' + n);
    if (c.st === 'bench') {
      if (Jobs.ready(id)) return row(id, c, 'ready', 'ok', true, Game.s.day + 1, `Tested: it ${d.tested.res === 'works' ? 'works' : 'half works'}. ${J.self ? `Take it up to ${J.name}.` : J.odd ? 'They\'ll come by the White Dragon for it.' : 'They\'ll take it from the counter.'}${J.pay ? ' ' + paid(d.tested.res) + ' cr on collection.' : ''}`);
      return row(id, c, on ? 'on the bench' : 'set aside', 'unk', true, Game.s.day + 1, (on ? 'On your bench' : 'Set aside in the basement') + (c.since ? ', since ' + day(c.since) : '') + '.' + (J.pay ? ' Pays ' + J.pay + ' cr.' : ''));
    }
    const res = J.odd ? c.out : c.res, how = res === 'works' ? 'It works' : res === 'half' ? 'It half works' : 'Done', got = paid(res);
    const when = c.back !== undefined ? c.back : c.day !== undefined && !J.odd ? c.day : c.since || 0;
    if (c.st === 'seized') return row(id, c, 'seized', 'no', false, when, 'Taken from your basement by the precinct.');
    if (c.st === 'back') return row(id, c, 'handed back', 'fine', false, when, `${how}${got ? ', ' + got + ' cr' : ''}, ${day(when)}. You'll hear how it went in the morning.`);
    if (c.died) return row(id, c, 'died again', 'no', false, when, `${how} when it went back, ${day(when)}${got ? ', ' + got + ' cr' : ''}. The scrap part you fitted gave out overnight.`);
    return row(id, c, 'done', 'fine', false, when, `${how}${got ? ', ' + got + ' cr' : J.pay === 0 ? ', for a favor' : ''}. Handed back ${day(when)}.`);
  },
  // what an open job needs (the bench's checklist, Jobs.needs), folded away under how far it's got
  needs(id) {
    const d = Jobs.dev(id), html = Jobs.needs(id); if (!d || !html) return '';
    const D = DEVICE[d.dev], ks = Object.keys(D.slots), probed = ks.filter((k) => d.probed[k]).length;
    const bad = ks.filter((k) => d.probed[k] && (!d.slots[k].p || d.slots[k].p.st !== 'ok' || (D.slots[k].gauge && d.slots[k].p.gauge !== D.slots[k].gauge))).length;
    return `<details class="pc-need"><summary>What it needs · ${!probed ? 'not opened up yet' : probed < ks.length ? probed + ' of ' + ks.length + ' parts checked' : bad ? bad + ' part' + (bad > 1 ? 's' : '') + ' to replace' : 'every part fine'}</summary>${html}</details>`;
  },
  // a job's picture: a part you fitted, or the part it's built round
  jobIcon(id, c) {
    const J = Jobs.def(id), D = DEVICE[J.dev], fit = (c.fitted || []).find((p) => p.k) || (c.parts && Object.entries(c.parts).map(([k, p]) => p && p.how !== 'pull' && D.slots[k] && { k: D.slots[k].kind, g: p.g }).find(Boolean));
    if (fit) return Parts.icon(fit.k, fit.g);
    const k = Object.keys(D.slots)[0]; return Parts.icon(D.slots[k].kind, 'street');
  },
  // ---- the People page -----------------------------------------------------
  // a card each: their face, name and work; what you remember of them; how
  // well you know each other and how they stand with you; what they've done
  // for you; and the work you've done for them, with what's open first
  html() {
    const list = this.people();
    if (!list.length) return `<p class="sub">Nobody yet. Talk to people: what they tell you about themselves, you'll keep here.</p>`;
    let h = `<p class="sub">${list.length === 1 ? 'One person you\'ve' : list.length + ' people you\'ve'} talked to. What they've told you stays in your notebook, and the better you know someone, the better they take what you say.</p><div class="people">`;
    for (const a of list) h += this.card(a);
    return h + '</div>';
  },
  card(a) {
    const id = a.who, R = RESIDENTS[id], S = TALK_STORY[id], name = R ? R.name : S.name, L = a.learned, f = a.familiarity, K = T.known;
    const face = this.face(id), title = R ? this.titleOf(id, L) : { lin: 'keeps the White Dragon', ozzy: 'drives a cab', vey: 'a customer at the counter' }[id];
    const notes = this.remembers(id, L), favor = this.favorText(id), stand = this.standing(id), saw = this.saw(id);
    const meter = Math.min(100, Math.round((f / (K.favor + 1)) * 100));
    let h = `<div class="pcard${f >= K.favor ? ' well' : ''}">${face ? `<img class="face" src="${face}" alt="">` : '<i class="face"></i>'}<div class="pc-who"><h3>${name}${title ? `<small>${title}</small>` : ''}</h3>`;
    h += `<div class="pc-know"><span class="chip">${this.band(f)}</span>${stand ? `<span class="chip st">${stand}</span>` : ''}</div><div class="pc-meter"><i style="--f:${meter}%"></i><small>${!a.talks ? 'talking now' : a.talks === 1 ? 'a talk, ' + this.ago(a.last) : a.talks + ' talks, the last ' + this.ago(a.last)}</small></div></div>`;
    h += notes.length ? `<dl class="pc-notes">${notes.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : `<p class="pc-none dim">You don't know much about them yet. Ask.</p>`;
    if (favor || saw) h += `<div class="pc-flags">${favor ? `<p class="good">${favor}</p>` : ''}${saw ? `<p class="${saw.cls}">${saw.text}</p>` : ''}</div>`;
    const jobs = this.jobsOf(id);
    if (jobs.length) h += '<div class="needs pc-jobs">' + jobs.map((j) => `<div class="need2 ${j.cls}"><img src="${this.jobIcon(j.jid, j.c)}" alt=""><div><b>${talkCap(Jobs.def(j.jid).title.replace(/^.*?'s /, ''))}</b><small>${j.text}</small></div><span class="have">${j.word}</span></div>${j.open && j.word !== 'ready' && j.word !== 'asking' ? this.needs(j.jid) : ''}`).join('') + '</div>';
    return h + '</div>';
  },
  // who they are, in a few words, as far as you know (their work, once they've told you)
  titleOf(id, L) { const R = RESIDENTS[id], j = talkWork(id); return R.age === 'kid' ? 'a kid' : j && L.work !== undefined ? j.title.toLowerCase() : R.age === 'senior' && !j ? 'retired' : ''; },
  // what you remember of them, a line each, in the game's words
  remembers(id, L) {
    const out = [];
    if (L.work !== undefined && RESIDENTS[id]) out.push(['Work', talkWorkNote(id)]);
    if (L.likes !== undefined) out.push(['Likes', talkCap(TALK_LIKE_WORD[L.likes] || String(L.likes))]);
    if (L.home !== undefined && RESIDENTS[id]) out.push(['At home', talkHomeNote(id)]);
    if (L.about !== undefined && TALK_ABOUT[id]) out.push(['Their story', `"${TALK_ABOUT[id]}"`]);
    return out;
  },
  // what they saw or heard you do, and whether they're keeping it to themselves
  saw(id) {
    if (!City.on) return null;
    const b = City.w.reverie.beliefRecord(id, 'did:player:strip'); if (!b) return null;
    if (b.silenced) return { cls: 'dim', text: 'Knows what you did, and keeps it to themselves.' };
    return { cls: 'warn', text: b.src === 'saw' ? `Saw you strip ${typeof b.v === 'string' ? b.v : 'a machine'}.` : 'Has heard you strip machines.' };
  },
  ago(t) { const d = Math.floor((City.w.now - t) / 1440), h = Math.floor((City.w.now - t) / 60); return d >= 2 ? d + ' days ago' : d === 1 ? 'yesterday' : h >= 1 ? h + (h === 1 ? ' hour ago' : ' hours ago') : 'just now'; },
  // their face (the talk's: talk.js), from their look
  face(id) {
    if (RESIDENTS[id]) return Talk.face(RESIDENTS[id].look, 120 + TOWN_ORDER.indexOf(id));
    if (JOBS[id] && JOBS[id].look) return Talk.face(JOBS[id].look, 80 + JOB_ORDER.indexOf(id));
    const L = Census.built('d_noodles'), i = L.npcs.findIndex((d) => d.role === 'noodles');
    return i >= 0 ? Talk.face(L.npcs[i].look, i) : '';
  },
  // ---- doors: who lives behind one, once you know them (census.js) -------
  // one household: its name, or an unnamed home; several: the ones you know
  door(pl, hh, short) {
    if (!this.on()) return null; // (without the minds, the doors say what they always did)
    const known = this.homes(), named = hh.filter((q) => known.has(q.id)).map((q) => q.label);
    if (hh.length === 1) return named.length ? named[0] : KNOWN_HOME[pl.home] || 'A home';
    if (!named.length) return `${pl.label} · ${hh.length} homes`;
    const more = hh.length - named.length, list = named.slice(0, short ? 1 : 2), rest = more + named.length - list.length;
    return `${pl.label} · ${list.join(', ')}${rest ? `, and ${rest} more` : ''}`;
  },
};
// what the three at the counter have done for you, once your work held (jobs.js, the morning after)
const KNOWN_OWED = { ozzy: ['ozzy:rides', 'Your cab rides are on him, any time.'], vey: ['vey:schematic', 'Paid what she owed: 120 cr under your door.'] };
// a home whose people you don't know yet
const KNOWN_HOME = { capsule: 'A capsule home', apartment: 'An apartment', house: 'A house', shack: 'A shack', penthouse: 'A penthouse', squat: 'Somebody\'s corner' };
