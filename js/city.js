'use strict';
// ---------------------------------------------------------------------------
// The block's minds: Tyrell (vendor/tyrell, a git submodule; dist/tyrell.js is
// loaded before everything else) runs the residents. This file is the White
// Dragon's shell for it.
//
// Their days (RESIDENTS' plans in town.js, laid out by Town.init) become
// routines Tyrell keeps: be at the noodle bar from 18:24, at the till from
// 6:18. Time at home is theirs to spend: rest, a nap, a bite from the cupboard,
// bed. Under all of it run needs: hunger, sleep, fun, company, so someone who
// skipped a meal goes for noodles on their own. Tyrell decides where everyone
// is and what they're doing, on screen or off, and Town still draws them along
// the same routes (City.state stands in for the old clock-only Town.state).
//
// Residents remember now. Strip a till in front of someone and they believe it
// was you, may tell someone at the bar, and may report it (heat). Fix their
// radio and it goes in their file on you. Their minds are saved with the game
// (Game.s.city), and the game's clock drives Tyrell's: when the clock jumps
// (sleeping, the dev slider) the city runs on, or, going back, rewinds with
// Esper, Tyrell's time walk.
// ---------------------------------------------------------------------------
const CITY = {
  // needs, per game hour (0 calm, 1 desperate); fun and company never break a routine
  hunger: 0.04, energy: 0.045, fun: 0.03, company: 0.03,
  reportHeat: 6, // heat when someone reports what they saw you do
  money: [40, 160], // what residents start with
};
const City = {
  w: null, on: false, here: null, pts: new Map(), reported: [], remarked: {},
  // ---- making the world: once, after the save is read --------------------
  init() {
    if (typeof Tyrell === 'undefined' || !Town.plans) return; // the engine isn't there: the old clock-only town
    const saved = Game.s.city && Game.s.city.s ? Game.s.city : null;
    this.make(this.minutes(), saved);
  },
  // the world, from a save, or new: a new one starts a day early and runs that
  // day, so everyone is somewhere sensible, mid-errand, when you first look
  make(now, saved) {
    this.here = null; this.pts.clear(); this.reported = [];
    const w = (this.w = Tyrell.create({
      seed: 'white-dragon',
      start: now - 24 * 60, // (a save, if there is one, replaces all of this)
      modules: ['reverie', 'fellowship', 'wormtongue', 'cityspeak', 'mentat', 'ceres'],
      shell: { travel: (a, b) => this.travel(a, b), near: (b) => this.near(b) },
      config: { logSize: 300, decisions: 6 },
      esper: { every: 15, keep: 26 * 60, sparseAfter: 120, sparseEvery: 60 },
    }));
    // needs
    w.need({ id: 'hunger', rise: CITY.hunger, start: 0.3, emotion: 'hungry' });
    w.need({ id: 'energy', rise: CITY.energy, start: 0.2, emotion: 'tired' });
    w.need({ id: 'fun', rise: CITY.fun, start: 0.3, urgent: 1.1, emotion: 'bored' });
    w.need({ id: 'company', rise: CITY.company, start: 0.3, urgent: 1.1, emotion: 'lonely' });
    // places: every one the residents' days name
    const ids = new Set(Object.keys(TOWN_PLACE).filter((k) => k !== 'street'));
    for (const id of TOWN_ORDER) for (const e of Town.plans[id]) ids.add(this.placeOf(id, e));
    for (const id of TOWN_ORDER) ids.add(this.homeOf(id));
    for (const id of ids) {
      const tags = id === 'noodles' ? ['food', 'social'] : id.startsWith('flat:') ? ['home'] : ['izakaya', 'pachinko', 'cinema', 'coil'].includes(id) ? ['social', 'fun'] : [];
      const def = { id, tags, region: this.regionOf(id) };
      if (id === 'noodles') def.slots = { stool: 7 };
      w.place(def);
    }
    // actions: what the days are made of, and what needs can choose
    const night = { name: 'night', input: 'hour', range: [0, 24], curve: [[0, 1], [6 / 24, 1], [8 / 24, 0.15], [20 / 24, 0.3], [22.5 / 24, 1], [1, 1]] };
    const A = (id, o) => w.action(Object.assign({ id, minutes: 60, pose: TOWN_POSE[id] || 'stand' }, o));
    A('sleep', { at: 'home', minutes: [420, 480], relieves: { energy: 0.95 }, rates: { hunger: 0.4, fun: 0.2, company: 0.2 }, tags: ['sleep'], considerations: [night] });
    A('home', { at: 'home', relieves: { energy: 0.12, fun: 0.08 }, base: 0.04, label: 'at home' });
    A('eat_home', { at: 'home', minutes: 25, relieves: { hunger: 0.45 }, pose: 'sit', label: 'something from the cupboard' });
    A('eat', { at: 'tag:food', slot: 'stool', minutes: 45, relieves: { hunger: 0.65, company: 0.15 }, price: 6, tags: ['social', 'food'], label: 'noodles at the White Dragon' });
    A('drink', { at: 'izakaya', minutes: 90, relieves: { fun: 0.3, company: 0.3 }, price: 5, tags: ['social'] });
    A('pachi', { at: 'pachinko', minutes: 120, relieves: { fun: 0.5 }, price: 5 });
    A('watch', { at: 'cinema', minutes: 120, relieves: { fun: 0.5, company: 0.1 }, price: 6 });
    A('pray', { at: 'shrine', minutes: 30, relieves: { fun: 0.1 }, base: 0.02 });
    // only when the day says so (rank -1)
    for (const id of ['work', 'stock', 'sweep', 'school', 'temple', 'visit', 'host', 'browse', 'play']) A(id, { rank: -1, relieves: id === 'visit' || id === 'host' ? { company: 0.4 } : id === 'browse' ? { fun: 0.1 } : undefined });
    A('pay', { at: 'grocery', minutes: 8, rank: -1, price: 8, fill: false });
    // what deeds mean to the people they're done to
    w.deed('fixed', { feeling: 'helped', regard: 0.2, memory: 6, sentiment: 'fixed my things' });
    w.deed('botched', { feeling: 'wronged', regard: -0.25, memory: 6, sentiment: 'botched a repair' });
    w.wormtongue.crime({ kind: 'strip', severity: 0.6, heat: CITY.reportHeat });
    w.on('report', (r) => { if (r.actor === 'player') this.reported.push(r); });
    // the residents
    for (let i = 0; i < TOWN_ORDER.length; i++) {
      const id = TOWN_ORDER[i], R = RESIDENTS[id];
      w.person(id, {
        name: R.name, home: this.homeOf(id), tags: ['resident'],
        routine: this.routineOf(id),
        traits: { honesty: 0.3 + hash(i, 3, 71) * 0.7, talkative: hash(i, 4, 71), courage: hash(i, 5, 71), thrift: hash(i, 6, 71) },
        vars: { money: Math.round(CITY.money[0] + hash(i, 7, 71) * (CITY.money[1] - CITY.money[0])) },
        needs: { hunger: 0.2 + hash(i, 8, 71) * 0.3, energy: 0.2 },
      });
      if (!w.kept('income:' + id)) { w.ceres.income(id, 140, 7); w.keep('income:' + id, true); }
    }
    let loaded = false;
    if (saved) { try { w.load(saved); loaded = true; } catch (e) { /* an unreadable city: start it over */ } }
    if (!loaded) w.advanceTo(now);
    this.on = true;
  },
  // Tyrell's clock: game minutes since day 0
  minutes() { return (Game.s.day * 24 + Game.s.time) * 60; },
  // ---- places -----------------------------------------------------------
  homeOf(id) {
    const R = RESIDENTS[id];
    if (R.home) return 'flat:' + R.home;
    const e = Town.plans[id].find((x) => x.at.startsWith('away') && x.act === 'home');
    return e ? this.placeOf(id, e) : 'away:east@d_dragon';
  },
  // a plan entry's place, as Tyrell knows it
  placeOf(id, e) {
    const R = RESIDENTS[id];
    if (e.at === 'home') return R.home ? 'flat:' + R.home : this.homeOf(id);
    if (e.at.startsWith('visit:')) return 'flat:' + RESIDENTS[e.at.slice(6)].home;
    if (e.at === 'street') return 'street@' + e.x;
    if (e.at.startsWith('away')) { const [side, street = 'd_dragon'] = e.at.split(':')[1].split('@'); return 'away:' + side + '@' + street; }
    return e.at;
  },
  regionOf(place) {
    if (place.startsWith('flat:')) return 'd_flats';
    if (place.startsWith('street@')) return 'd_dragon';
    if (place.startsWith('away:')) return 'away';
    return TOWN_PLACE[place] ? TOWN_PLACE[place].level : 'away';
  },
  // a resident's day as a Tyrell routine: the same hours Town.init worked out
  routineOf(id) {
    return Town.plans[id].map((e) => {
      const place = this.placeOf(id, e), extra = {};
      if (e.o && e.o.with) extra.with = e.o.with;
      // work holds like a job: only a desperate need gets them off the till
      if (e.act === 'work' || e.act === 'stock' || e.act === 'sweep' || e.act === 'school') extra.rank = 2;
      // time at home is theirs: anything they can do there
      const act = e.act === 'home' ? '*' : e.act;
      return Object.keys(extra).length ? [e.h, place, act, extra] : [e.h, place, act];
    });
  },
  // where a place is, for working out walks: a WD point (Town.point's shape)
  point(place) {
    if (place.startsWith('flat:')) { const F = FLATS[place.slice(5)]; return { place: 'flats', flat: place.slice(5), x: F.table, y: F.y }; }
    if (place.startsWith('street@')) return { place: 'street', x: +place.slice(7), y: BK.G };
    if (place.startsWith('away:')) { const [side, street] = place.slice(5).split('@'); return { place: 'away', side, street, x: townEnd(street, side) }; }
    return { place, x: TOWN_PLACE[place].inside, y: BK.G };
  },
  // the walk between two places, in game minutes, at the residents' pace
  travel(a, b) {
    if (a === b) return 0;
    const k = a + '>' + b;
    let m = this.pts.get(k);
    if (m === undefined) { m = Math.max(0.5, (Town.length(Town.route(this.point(a), this.point(b))) / PXH) * 60); this.pts.set(k, m); }
    return m;
  },
  // where a resident stands for an activity at a place (their seat, their bed, a shelf)
  spot(id, place, act, start) {
    let at;
    if (place.startsWith('flat:')) { const R = RESIDENTS[id]; at = R.home && place === 'flat:' + R.home ? 'home' : 'visit:' + (TOWN_ORDER.find((q) => RESIDENTS[q].home === place.slice(5)) || id); }
    else if (place.startsWith('street@')) return { place: 'street', x: +place.slice(7), y: BK.G };
    else if (place.startsWith('away:')) at = place;
    else at = place;
    const e = { at, act: act === 'eat_home' || act === 'wait' ? 'home' : act, o: {} };
    if (place === 'grocery' && act === 'browse') e.x = SHELF[Math.floor(hash(id.length, Math.floor(start), 13) * SHELF.length)];
    if (place === 'grocery' && act === 'pay') e.x = 470;
    if (at.startsWith('visit:') && at.slice(6) === id) e.at = 'home';
    return Town.point(id, e);
  },
  // ---- where someone is now: Town.state's shape, from Tyrell ------------
  state(id) {
    const w = this.w, p = w.get(id), hourAt = (t) => (((t / 60) % 24) + 24) % 24;
    const none = { level: null, act: 'home', e: { act: 'home', h: 0, o: {} } };
    if (!p || p.status !== 'active') return none;
    const d = p.doing;
    if (d && d.kind === 'travel') {
      const route = w.mind.routineAt(p), withId = route && route.entry[3] && route.entry[3].with;
      const a = this.spot(id, d.from || this.homeOf(id), p.last || 'home', d.start), b = this.spot(id, d.to, d.action, d.end);
      const legs = Town.route(a, b), L = Town.length(legs), f = clamp((w.now - d.start) / Math.max(1e-6, d.end - d.start), 0, 1);
      const e = { act: d.action, h: hourAt(d.start), o: withId ? { with: withId } : {} };
      let dist = Math.max(0, f * L - (withId ? 16 : 0));
      for (const leg of legs) {
        if (leg.len) { if (dist < leg.len) return { level: null, moving: true, act: d.action, e, to: b }; dist -= leg.len; continue; }
        for (let k = 1; k < leg.pts.length; k++) {
          const P = leg.pts[k - 1], Q = leg.pts[k], len = Math.hypot(Q.x - P.x, Q.y - P.y);
          if (dist < len) { const t = dist / len; return { level: leg.level, x: P.x + (Q.x - P.x) * t, y: P.y + (Q.y - P.y) * t, moving: true, dir: Math.sign(Q.x - P.x) || 1, act: d.action, e, to: b }; }
          dist -= len;
        }
      }
      return this.at(id, d.to, d.action, d.end);
    }
    const act = !d || d.kind === 'wait' ? p.last || 'home' : d.action;
    return this.at(id, p.place || this.homeOf(id), act, d ? d.start : w.now);
  },
  at(id, place, act, start) {
    const b = this.spot(id, place, act, start), e = { act, h: (((start / 60) % 24) + 24) % 24, o: {} };
    if (b.place === 'away') return { level: null, act, e };
    return { level: TOWN_PLACE[b.place].level, x: b.x, y: b.y, moving: false, act, e, flat: b.flat, hidden: act === 'sleep' };
  },
  near(body) { const st = this.state(body.id); return !!(World.L && st.level === World.L.id && !st.hidden); },
  // ---- every frame (from Town.sync): keep up with the game's clock --------
  sync() {
    if (!this.on) return;
    const t = this.minutes();
    // back as well as forward: Esper rewinds. Further back than it remembers
    // (the dev clock), the block starts over at that hour, memories and all.
    if (t < this.w.esper.earliest() - 1e-6) this.make(t, null);
    else if (Math.abs(t - this.w.now) > 1e-6) this.w.advanceTo(t);
    const here = World.L && World.L.id;
    if (here !== this.here) { this.here = here; this.w.focus(here ? [here] : []); }
    if (this.reported.length) {
      const who = this.reported.map((r) => this.w.get(r.witness)).filter(Boolean).map((p) => p.name);
      const names = [...new Set(who)];
      Jobs.heat(CITY.reportHeat * this.reported.length, (names.length === 1 ? names[0] + ' told someone' : names.length + ' people told someone') + ' what they saw you do.');
      this.reported = [];
    }
  },
  // ---- the player's doings, as the residents see them ---------------------
  // stripping someone's machine in front of people: they saw, and they'll remember
  // who sees something done at a prop: in a room, everyone in it; on the
  // street, whoever's within shouting distance on the same floor
  witnesses(p) {
    const room = LEVELS[World.L.id].hidden, near = (n) => room || (Math.abs(n.x - p.x) < 180 && Math.abs(n.y - p.y) < 40);
    return Actors.npcs.filter((n) => !n.hidden && near(n)).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
  },
  strip(p) {
    const saw = this.witnesses(p);
    const seenBy = saw.filter((n) => n.def.town).map((n) => n.def.town);
    if (this.on && seenBy.length) this.w.sense({ kind: 'strip', actor: 'player', what: p.label || p.kind, seenBy });
    this.react(p, saw);
  },
  // Said out loud, there and then, by whoever saw: the one whose place it is
  // first (they work here), then a couple of the others, a beat apart, each
  // turning to look at you. Some residents have their own way of putting it.
  REACT: {
    owner: ['Hey! That\'s my {what}!', 'Put that down! That\'s the {place}\'s {what}!', 'What do you think you\'re doing to my {what}?', 'That {what} is not yours!'],
    first: ['Hey! That\'s not yours!', 'Did you just strip that {what}?', 'You can\'t just take that apart!', 'Whoa. Whose {what} is that?'],
    other: ['Yeah, we were going to use that!', '{owner}, are you seeing this?', 'Unbelievable.', 'I\'m not getting involved.', 'Somebody call someone.', 'In front of everyone, too.'],
    by: {
      kai: ['Whoa. You\'re gonna get it.', 'Can I have a bit?'], wen: ['In my day we paid for things.', 'Shameful. In broad light.'],
      sato: ['Oh! Oh, that\'s not right.', 'I\'ll be telling people about this.'], okonkwo: ['Forty years I worked machines. You don\'t treat them like that.'],
      sal: ['Ha. Nice.', 'Not my business. But nice.'], ueda: ['The regulars use that!', 'Out. Out of my bar.'], mo: ['My shop! My shop!', 'I\'ve got cameras, you know. Probably.'],
      goro: ['Floor\'s got eyes, friend.', 'That\'s the house\'s.'], vin: ['You\'re done in here.', 'Bad idea. Real bad idea.'], hana: ['Not here. Not in front of the fox.'],
    },
  },
  react(p, saw) {
    if (!saw.length) return;
    const R = this.REACT, what = (p.label || p.kind).replace(/^(a|an|the) /i, ''), here = World.L.id;
    const used = new Set(), pick = (list, n, k) => { const free = list.filter((l) => !used.has(l)), from = free.length ? free : list, l = from[Math.floor(hash(n.i + k, Game.s.day, what.length) * from.length)]; used.add(l); return l; }; // (nobody says the same thing twice)
    const fill = (t, owner) => t.replace(/\{what\}/g, what).replace(/\{place\}/g, World.L.name.replace(/^the /i, '')).replace(/\{owner\}/g, owner ? owner.def.name : 'Hey');
    // the one whose place this is: a resident who works in this level, if they're here
    const owner = saw.find((n) => n.def.town && RESIDENTS[n.def.town].job && TOWN_PLACE[RESIDENTS[n.def.town].job] && TOWN_PLACE[RESIDENTS[n.def.town].job].level === here);
    const order = owner ? [owner].concat(saw.filter((n) => n !== owner)) : saw;
    order.slice(0, 3).forEach((n, i) => {
      const own = R.by[n.def.town];
      let line = i === 0 ? pick(owner ? R.owner : R.first, n, 1) : pick(R.other.filter((l) => owner || !l.includes('{owner}')), n, 2 + i);
      if (own && hash(n.i, Game.s.day, 7) < 0.6 && !(i === 0 && owner && n !== owner)) line = pick(own, n, 3);
      this.said.push({ t: Game.t + 0.35 + i * 1.3, n, text: fill(line, owner) });
    });
  },
  said: [],
  // what was said, when its moment comes (Town.chatter calls this every frame)
  speak() {
    if (!this.said.length) return;
    const now = Game.t;
    for (const q of this.said) if (q.t <= now && !q.done) { q.done = true; if (!q.n.hidden && Actors.npcs.includes(q.n)) { q.n.face = Math.sign(Player.x - q.n.x) || q.n.face; Actors.say(q.n, q.text); } }
    this.said = this.said.filter((q) => !q.done);
  },
  // a deed done for (or to) a resident: 'fixed', 'botched'
  did(verb, res, what) { if (this.on && this.w.get(res)) this.w.did('player', verb, { for: res, what: what || '' }); },
  // something a resident has to say about you, now and then: what they saw, what they heard, what you fixed
  remark(id) {
    if (!this.on || !this.w.get(id)) return null;
    const day = Game.s.day; if (this.remarked[id] === day) return null;
    const rv = this.w.reverie, beliefs = rv.beliefs(id).filter((b) => b.key.startsWith('did:player:strip'));
    let line = null;
    if (beliefs.some((b) => b.src === 'saw')) { const b = beliefs.find((x) => x.src === 'saw'); line = `I saw you take the ${typeof b.v === 'string' ? b.v : 'machine'} apart. I'm not blind.`; }
    else if (beliefs.length) { const b = beliefs[0], from = this.w.get(b.from); line = `${from ? from.name : 'Someone'} says you've been stripping machines. Is that right?`; }
    else { const f = rv.file(id, 'player'); if (f && f.tally.fixed) line = f.tally.botched ? 'You fixed it, then it broke. I\'ll think about it.' : 'That thing you fixed for me? Still going.'; }
    if (line) this.remarked[id] = day;
    return line;
  },
  // ---- the morning after: what's going round the block about you ----------
  morning(news) {
    if (!this.on) return;
    const w = this.w, since = w.now - 24 * 60;
    const heard = w.people().filter((p) => { const b = w.reverie.beliefRecord(p.id, 'did:player:strip'); return b && b.src === 'told' && b.t >= since; });
    if (heard.length === 1) news.push(`Word's going round the block: ${heard[0].name} has heard you've been stripping machines.`);
    else if (heard.length > 1) news.push(`Word's going round the block: ${heard.length} of your neighbors have heard you've been stripping machines.`);
  },
  // ---- saving: the minds go in the save, as they are ----------------------
  stash() { if (this.on) Game.s.city = { tyrell: 'world', v: this.w.s.v, s: this.w.s }; },
  // ---- for the dev drawer and the console --------------------------------
  inspect(name) { if (!this.on) return 'Tyrell is off'; const id = TOWN_ORDER.find((k) => k === name || RESIDENTS[k].name === name) || name; return this.w.describe(id); },
};
