'use strict';
// ---------------------------------------------------------------------------
// Chat: what passes between the city's residents, on Tyrell's Bree
// (vendor/tycho/tyrell/docs/modules/bree.md). Two residents doing something
// in the same place (stools side by side at a bar, the till and the queue,
// a kitchen table, the depot's floor) now and then strike up a few words:
// small talk on what's going round the block (TOWN_SMALL), a pair's own
// (TOWN_PAIR), the news once your work's out in the street (TOWN_NEWS). How
// it goes is theirs: by their natures (City.nature), moods and how they
// stand with each other, words land well or badly (and meet no need: a chat at
// home mustn't keep anyone from the bar or the park); a sour turn can turn
// into an argument, and an argument leaves grudges that keep people apart
// till they fade or are made up. Arriving at the till, a bar's counter or a
// neighbor's door begins its own few words (`interact` on the pay, drink, eat
// and visit actions, with whoever's there: City.make). Off screen it all
// happens the same, and it saves and rewinds with the minds.
//
// On screen, each turn goes up over the speaker's head as it's said (Bree's
// `bree:turn`, the words its Cityspeak line), a beat after their last.
// Greetings in passing and a word between two walking together stay the
// game's barks (Town.chatter): Tyrell doesn't know who passes whom in the
// street (the game owns space), so they change nothing, but their words are
// lines here, read from the minds (no greeting for someone you've a grudge
// against). Lin isn't a resident, so what's said to her over the counter
// stays Town.arrived's. What people say when they see you strip a machine
// (Chat.react) is lines here too: the owner first, then a couple of others,
// some residents in their own words.
// Without Tyrell, the old way: the same words, drawn by the clock.
// ---------------------------------------------------------------------------
const CHAT = {
  beat: 1.2, // seconds between two lines from the same person
  beside: 200, // in a room you can see, how far apart (px) two people can be and still talk (a few stools)
};
// small talk: for any two neighbors, and for some, their own
const TOWN_SMALL = {
  drones: ['Did you hear the drone go over last night?', 'Three of them. Low. Looking for somebody.'],
  elevator: ['Elevator\'s broken in Kessler again.', 'Elevator\'s broken everywhere.'],
  rain: ['Rain\'s not stopping.', 'Rain\'s never stopping.'],
  prices: ['Lin put the price up.', 'Lin put the portions up too. Don\'t complain.'],
  tired: ['You look tired.', 'I am tired. Everyone\'s tired.'],
  meridian: ['Meridian\'s hiring at the Spires.', 'Meridian\'s always hiring. Nobody comes back down.'],
};
// (only while it's raining, with the minds on: CHAT_IF)
const CHAT_IF = { rain: ['fact:raining'] };
const TOWN_PAIR = {
  'okonkwo:sato': [['Your move.', 'I moved. You were asleep.'], ['Black stones today.', 'You always want black.'], ['My knee says rain.', 'Your knee always says rain.']],
  'ines:teo': [['Good soy?', 'Good soy.'], ['Long day?', 'Long day.'], ['We should go up to the Gardens one weekend.', 'We should.']],
  'dara:teo': [['You watching the race?', 'I\'m watching the snacks.'], ['Bike\'s busted again.', 'Bring it to the basement guy. Lin knows him.']],
  'jun:mo': [['Count the till twice.', 'I always count it twice.'], ['Night, Mo.', 'Night. Don\'t let anyone steal the plums.']],
};
// what people say once your work's out in the street: each a fact of the
// game's, kept in the world (Chat.keepFacts) so the minds can talk of it
const TOWN_NEWS = [
  { fact: 'ozzy_rides', said: [['Ozzy\'s cab is flying again.', 'Some fixer sorted it. Down here, someone said.']] },
  { fact: 'vey_walks', said: [['That girl with the arm\'s been about.', 'Walks like nothing\'s wrong now.']] },
  { fact: 'heat_noticed', said: [['A detective was asking about the White Dragon.', 'Asking what? Lin\'s noodles?'], ['Somebody\'s been noticed round here.', 'Not me. I\'m never noticed.']] },
];
const TOWN_FACTS = { ozzy_rides: () => Game.flag('ozzy:rides'), vey_walks: () => Game.flag('vey:schematic'), heat_noticed: () => Game.s.heat >= 40 };
function townNews() { const out = []; for (const n of TOWN_NEWS) if (TOWN_FACTS[n.fact]()) out.push(...n.said); return out; }

// a reply to small talk that lands badly, or worse
const CHAT_SOUR = { sour: ['Mm.', 'If you say so.', 'Not now.'], row: ['Mind your own business.', 'Who asked you?'] };
// the steps of an argument, and the rest of how things go between people
// (Bree's own steps: open, reply, more, back; calm, step_in, leave)
const CHAT_LINES = [
  { key: 'argue.open', topic: 'argue.open', text: ['Say that again.', 'What\'s that supposed to mean?', 'Don\'t you start.'] },
  { key: 'argue.open.sal', topic: 'argue.open', who: 'sal', text: 'You got a problem?' },
  { key: 'argue.open.wen', topic: 'argue.open', who: 'wen', text: 'In my day people had manners.' },
  { key: 'argue.open.goro', topic: 'argue.open', who: 'goro', text: 'Watch it, friend.' },
  { key: 'argue.reply', topic: 'argue.reply', text: ['You heard me.', 'You know what it means.', 'I\'ll start if I like.'] },
  { key: 'argue.reply.kid', topic: 'argue.reply', who: ['is:child'], text: ['Am not!', 'You\'re not my mom!'] },
  { key: 'argue.more', topic: 'argue.more', text: ['Every time. Every single time.', 'You always do this.', 'I\'m sick of it.'] },
  { key: 'argue.back', topic: 'argue.back', text: ['Keep your voice down.', 'Fine. Whatever you say.', 'Are you finished?'] },
  { key: 'argue.back.okonkwo', topic: 'argue.back', who: 'okonkwo', text: 'I am too old to shout. Listen instead.' },
  { key: 'calm', topic: 'bree.calm', text: ['All right. All right. Forget I said it.', 'Easy. I didn\'t mean it like that.'] },
  { key: 'step_in', topic: 'bree.step_in', text: ['Enough, you two.', 'Hey. Not in here.'] },
  { key: 'leave', topic: 'bree.leave', text: ['I\'m done talking to you.', 'Forget it.'] },
  { key: 'avoid', topic: 'avoid.open', text: ['Hm.', '...'] },
  { key: 'sorry', topic: 'apologize.open', text: ['About before. I\'m sorry.', 'Look. I was out of line.'] },
  { key: 'sorry.ok', topic: 'apologize.reply', text: ['Forget it.', 'All right.'] },
  { key: 'sorry.no', topic: 'apologize.reply', when: ['turn:sour'], text: 'Save it.' },
  { key: 'makeup', topic: 'make_up.open', text: 'Are we all right?' },
  { key: 'makeup.ok', topic: 'make_up.reply', text: 'We\'re all right.' },
  { key: 'makeup.no', topic: 'make_up.reply', when: ['turn:sour'], text: 'Not yet.' },
  // at the counter: the Red Lantern (anywhere else, behind a door, nobody hears)
  { key: 'order', topic: 'order.open', when: ['at:d_izakaya'], text: 'The usual, Master.' },
  { key: 'order.ueda', topic: 'order.reply', who: 'ueda', text: 'One cup. I\'m counting.' },
  // at a neighbor's door
  { key: 'visit', topic: 'visit.open', text: 'Only me.' },
  { key: 'visit.in', topic: 'visit.reply', text: 'Come in, come in.' },
  // greetings in passing (barks: Town.chatter; not 'greet', which is how they greet you in a talk)
  { key: 'passing', topic: 'passing', text: 'Evening, {name}.' },
  { key: 'passing.morning', topic: 'passing', when: ['hour>=5', 'hour<12'], text: 'Morning, {name}.' },
  { key: 'passing.afternoon', topic: 'passing', when: ['hour>=12', 'hour<17'], text: 'Afternoon, {name}.' },
  { key: 'passing.cold', topic: 'passing', to: ['grudge>0.15'], pri: 3, text: '' }, // (they walk on by)
  { key: 'passing.back', topic: 'passing.back', text: 'Evening.' },
  { key: 'passing.back.morning', topic: 'passing.back', when: ['hour>=5', 'hour<12'], text: 'Morning.' },
  { key: 'passing.back.afternoon', topic: 'passing.back', when: ['hour>=12', 'hour<17'], text: 'Afternoon.' },
  { key: 'passing.back.cold', topic: 'passing.back', to: ['grudge>0.15'], pri: 3, text: 'Hm.' },
];
// the till: what's asked, and what the clerk says back
const CHAT_TILL = {
  just: ['Just these.', 'Fourteen.'], bag: ['And a bag, please.', 'Nine-fifty. Call it nine.'], tab: ['Put it on my tab?', 'No tabs. Fine. Tab.', 'No tabs.'],
};
// Said out loud, there and then, by whoever saw you strip a machine: the one
// whose place it is first (they work here), then a couple of the others, a
// beat apart, each turning to look at you. Some residents have their own way
// of putting it (more often than not).
const CHAT_REACT = {
  owner: ['Hey! That\'s my {what}!', 'Put that down! That\'s the {place}\'s {what}!', 'What do you think you\'re doing to my {what}?', 'That {what} is not yours!'],
  first: ['Hey! That\'s not yours!', 'Did you just strip that {what}?', 'You can\'t just take that apart!', 'Whoa. Whose {what} is that?'],
  other: ['Yeah, we were going to use that!', '{owner}, are you seeing this?', 'Unbelievable.', 'I\'m not getting involved.', 'Somebody call someone.', 'In front of everyone, too.'],
  by: {
    kai: ['Whoa. You\'re gonna get it.', 'Can I have a bit?'], wen: ['In my day we paid for things.', 'Shameful. In broad light.'],
    sato: ['Oh! Oh, that\'s not right.', 'I\'ll be telling people about this.'], okonkwo: ['Forty years I worked machines. You don\'t treat them like that.'],
    sal: ['Ha. Nice.', 'Not my business. But nice.'], ueda: ['The regulars use that!', 'Out. Out of my bar.'], mo: ['My shop! My shop!', 'I\'ve got cameras, you know. Probably.'],
    goro: ['Floor\'s got eyes, friend.', 'That\'s the house\'s.'], vin: ['You\'re done in here.', 'Bad idea. Real bad idea.'], hana: ['Not here. Not in front of the fox.'],
  },
  own: 0.6, // how often a resident with words of their own uses them
};

const Chat = {
  waiting: [], // lines waiting for their moment: { t, n, text, look }
  // ---- the definitions: once per world (from City.make) -------------------
  declare(w) {
    const b = w.bree, cs = w.cityspeak, lines = CHAT_LINES.slice();
    // who started it, and whoever answered: side by side (a room you can see)
    const beside = (c) => City.beside(c.person, c.world.s.people[c.target]);
    const small = (id, said, o = {}) => {
      b.topic(Object.assign({ id, tags: ['small'], steps: 2 }, o));
      lines.push({ key: id + '.open', topic: id + '.open', text: said[0] }, { key: id + '.reply', topic: id + '.reply', text: said[1] });
      for (const out in CHAT_SOUR) lines.push({ key: id + '.' + out, topic: id + '.reply', when: ['turn:' + out], text: CHAT_SOUR[out] });
    };
    for (const id in TOWN_SMALL) small(id, TOWN_SMALL[id], CHAT_IF[id] ? { if: CHAT_IF[id] } : {});
    // a pair's own: the first of them raises it with the other
    for (const k in TOWN_PAIR) { const [a, z] = k.split(':'); TOWN_PAIR[k].forEach((said, i) => small('pair:' + k + ':' + i, said, { if: [(c) => c.person.id === a && c.target === z] })); }
    // the news: twice as likely as anything else
    for (const n of TOWN_NEWS) n.said.forEach((said, i) => small('news:' + n.fact + ':' + i, said, { if: ['fact:' + n.fact], weight: 2 }));
    // the till
    for (const k in CHAT_TILL) {
      const id = 'till:' + k, [ask, back, sour] = CHAT_TILL[k];
      b.topic({ id, tags: ['till'], kinds: ['till'], steps: 2 });
      lines.push({ key: id + '.open', topic: id + '.open', text: ask }, { key: id + '.reply', topic: id + '.reply', text: back });
      if (sour) lines.push({ key: id + '.sour', topic: id + '.reply', when: ['turn:sour'], text: sour }, { key: id + '.row', topic: id + '.reply', when: ['turn:row'], text: sour });
    }
    // what witnesses say: every line its own, so nobody there says the same thing twice
    for (const k of ['owner', 'first', 'other']) {
      CHAT_REACT[k].forEach((text, i) => lines.push({ key: 'strip.' + k + '.' + i, topic: 'strip.' + k, text }));
      for (const id in CHAT_REACT.by) CHAT_REACT.by[id].forEach((text, i) => lines.push({ key: 'strip.' + k + '.' + id + '.' + i, topic: 'strip.' + k, who: id, when: ['chance:' + CHAT_REACT.own], text }));
    }
    cs.addLines(lines);
    // the kinds: small talk, and what can come of it
    // (a word in passing meets no need: a chat at home shouldn't keep anyone from the bar, the bath or the park)
    b.kind({ id: 'chat', label: 'a word or two', tags: ['talk', 'friendly'], topics: ['tag:small'], if: [beside], escalates: 'argue', weight: [{ name: 'talkative', input: 'nature.talkative', out: [0.5, 1.5] }] });
    b.kind({ id: 'argue', label: 'words', tags: ['hostile', 'talk'], to: ['grudge>0.1'], if: [beside], turns: [2, 4], base: -1, traits: { temper: -1, patience: 1 }, regard: 1.5, weight: [{ name: 'grudge', input: 'grudge', out: [0.1, 1.5] }], on: { row: { memory: 5 } } });
    b.kind({ id: 'apologize', label: 'an apology', tags: ['friendly'], to: ['grudged>0.05'], if: [beside], turns: 2, base: 0.5, traits: { forgiveness: 1.5, temper: -0.5 }, skill: { warmth: 0.5 }, mends: 0.5, weight: [{ name: 'their grudge', input: 'grudged', out: [0.3, 2] }, { name: 'warmth', input: 'nature.warmth', out: [0.3, 1.5] }], on: { sour: { feel: ['snubbed', null] }, row: { feel: ['snubbed', null] } } });
    b.kind({ id: 'make_up', label: 'making up', tags: ['friendly'], to: ['grudge>0.05', 'grudged>0.05'], if: [beside], turns: 2, base: 0.5, traits: { forgiveness: 1.5 }, mends: 0.6, mutual: true, weight: [{ name: 'forgiveness', input: 'nature.forgiveness', out: [0.3, 2] }] });
    b.kind({ id: 'avoid', label: 'the cold shoulder', tags: ['hostile'], to: ['grudge>0.3'], turns: 1, base: -1, regard: 0.5, grudge: 0, weight: [{ name: 'grudge', input: 'grudge', out: [0, 2] }], on: { end: { feel: [null, 'snubbed'] } } });
    // and what's said on arriving somewhere (begun by the action: weight 0)
    b.kind({ id: 'till', label: 'paying', topics: ['tag:till'], turns: 2, weight: 0, base: 0.5, regard: 0.5 });
    b.kind({ id: 'order', label: 'an order', turns: 2, weight: 0, base: 0.5, regard: 0.5 });
    b.kind({ id: 'visit', label: 'a visit', tags: ['friendly'], turns: 2, weight: 0, base: 1 });
    // how people talk: plainly, warmly, or with an edge
    b.manner({ id: 'plain', base: 0.1 });
    b.manner({ id: 'warm', traits: { warmth: 1 }, fits: [{ if: ['mood>0.6'], by: 0.2 }], lands: [{ by: 0.25 }] });
    b.manner({ id: 'ornery', base: -0.3, traits: { temper: 1.5 }, fits: [{ if: ['mood<0.35'], by: 0.4 }, { if: ['stress>0.5'], by: 0.4 }], lands: [{ by: -0.5 }] });
    // who sees what passes between people: City.onlookers; the words, as they're said
    b.witnesses = (ex, world) => City.onlookers(ex, world);
    w.on('bree:turn', (t) => this.turn(t));
  },
  // the game's facts the minds talk of, kept in the world when they change
  // (an input each; read from the world each time, so a rewind is put right)
  keepFacts() {
    const w = City.w;
    for (const k in TOWN_FACTS) { const v = !!TOWN_FACTS[k](); if (!!w.s.facts[k] !== v) w.fact(k, v); }
  },
  // ---- on screen --------------------------------------------------------------
  // a turn of Bree's: up over the speaker's head, if they're here and it's now
  // (not the city catching up on hours slept)
  turn(t) {
    if (!t.text || City.minutes() - City.w.now > 1.5) return;
    const n = Actors.npcs.find((q) => q.def.town === t.who && !q.hidden);
    if (!n || Talk.showing(n)) return;
    this.say(n, this.fill(t.text, t.to));
  },
  // {name}: the one spoken to
  fill(text, to) { const R = RESIDENTS[to]; return text.replace(/\{name\}/g, R ? R.name.replace(/^(Mr|Mrs|Old) /, '') : 'friend'); },
  // something said, now or `after` seconds on, and never on top of the
  // speaker's own last words: a beat after them. `look`: they turn to you
  say(n, text, after = 0, look = false) {
    if (!text) return;
    const t = Game.t + after, q = this.waiting.filter((x) => x.n === n).pop(), last = q ? q.t : n.bubble ? Game.t - (3.6 - n.bubble.t) : -Infinity;
    const at = Math.max(t, last + CHAT.beat);
    if (at <= Game.t) this.out(n, text, look); else this.waiting.push({ t: at, n, text, look });
  },
  out(n, text, look) { if (look) n.face = Math.sign(Player.x - n.x) || n.face; Actors.say(n, text); },
  // every frame: what's waiting, when its moment comes (if they're still here)
  tick() {
    if (!this.waiting.length) return;
    const now = Game.t, due = this.waiting.filter((q) => q.t <= now);
    if (!due.length) return;
    this.waiting = this.waiting.filter((q) => q.t > now);
    for (const q of due) if (!q.n.hidden && Actors.npcs.includes(q.n)) this.out(q.n, q.text, q.look);
  },
  // ---- the barks: in passing, and walking together ----------------------------
  // a greeting from a to b and b's answer (none, if a has a grudge)
  greeting(a, b) {
    if (City.on && City.w.get(a) && City.w.get(b)) {
      const cs = City.w.cityspeak, l1 = cs.choose(a, { to: b, topic: 'passing', exact: true }), l2 = cs.choose(b, { to: a, topic: 'passing.back', exact: true });
      return [l1 && l1.text ? this.fill(l1.text, b) : null, l2 && l2.text ? l2.text : null];
    }
    const h = Game.hour(), tod = h >= 5 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Afternoon' : 'Evening';
    return [tod + ', ' + RESIDENTS[b].name.replace(/^(Mr|Mrs|Old) /, '') + '.', tod + '.'];
  },
  // a few words between a and b walking together: one of the topics they'd
  // talk of settled (what's going round, a pair's own, the news), drawn by the clock
  small(a, b, key) {
    const draw = (n) => Math.floor(hash(Math.floor(Game.t / 9), key.length, 12) * n);
    if (City.on && City.w.get(a) && City.w.get(b)) {
      const w = City.w, cs = w.cityspeak, pa = w.get(a), ctx = w.ctx(pa, { target: b });
      const topics = [...w.bree.topics.values()].filter((t) => t.tags && t.tags.includes('small') && w.peek(() => w.lang.all(t.if, ctx)));
      const pool = topics.flatMap((t) => Array(t.weight || 1).fill(t.id));
      if (!pool.length) return [null, null];
      const id = pool[draw(pool.length)], l1 = cs.choose(a, { to: b, topic: id + '.open', exact: true }), l2 = cs.choose(b, { to: a, topic: id + '.reply', exact: true });
      return [l1 && l1.text, l2 && l2.text];
    }
    const pool = (TOWN_PAIR[key] || []).concat(Object.values(TOWN_SMALL), townNews(), townNews());
    return pool[draw(pool.length)];
  },
  // ---- for Tyrell mode: who they're talking with, and who they've a grudge against
  about(id) {
    const w = City.w, b = w && w.bree; if (!b) return '';
    const name = (q) => (w.get(q) || { name: q }).name, ex = b.exchange(id), g = b.grudges(id)[0];
    return (ex ? ` · ${(b.kinds.get(ex.kind) || {}).label || ex.kind} with ${ex.who.filter((q) => q !== id).map(name).join(', ')}` : '') + (g ? ` · a grudge against ${name(g.id)}` : '');
  },
  // ---- what witnesses say when you strip a machine -----------------------------
  react(p, saw) {
    if (!saw.length) return;
    const R = CHAT_REACT, what = (p.label || p.kind).replace(/^(a|an|the) /i, ''), here = World.L.id;
    const fill = (t, owner) => t.replace(/\{what\}/g, what).replace(/\{place\}/g, World.L.name.replace(/^the /i, '')).replace(/\{owner\}/g, owner ? owner.def.name : 'Hey');
    // the one whose place this is: a resident who works in this level, if they're here
    const owner = saw.find((n) => { const j = n.def.town && RESIDENTS[n.def.town].job; return j && Census.places[j.place] && Census.places[j.place].level === here; });
    const order = owner ? [owner].concat(saw.filter((n) => n !== owner)) : saw;
    const used = new Set(), minds = City.on && City.w.cityspeak;
    order.slice(0, 3).forEach((n, i) => {
      const k = i === 0 ? (owner ? 'owner' : 'first') : 'other', id = n.def.town;
      let line = null;
      if (minds && id && City.w.get(id)) {
        // (nobody says the same thing twice; with nobody's place it is, nobody's asked if they're seeing this)
        const said = minds.choose(id, { topic: 'strip.' + k, exact: true, salt: [i], avoid: (key) => used.has(key), skip: (l) => !owner && /\{owner\}/.test(l.text) });
        if (said) { used.add(said.key); line = said.text; }
      } else {
        const pick = (list, j) => { const free = list.filter((l) => !used.has(l)), from = free.length ? free : list, l = from[Math.floor(hash(n.i + j, Game.s.day, what.length) * from.length)]; used.add(l); return l; };
        line = pick(R[k].filter((l) => owner || !l.includes('{owner}')), i === 0 ? 1 : 2 + i);
        if (R.by[id] && hash(n.i, Game.s.day, 7) < R.own) line = pick(R.by[id], 3);
      }
      if (line) this.say(n, fill(line, owner), 0.35 + i * 1.3, true);
    });
  },
};
