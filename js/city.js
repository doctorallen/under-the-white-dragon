'use strict';
// ---------------------------------------------------------------------------
// The city's minds: Tyrell (vendor/tyrell, a git submodule; dist/tyrell.js is
// loaded before everything else) runs every resident. This file is the White
// Dragon's shell for it.
//
// The places are the census's (census.js): rooms, doors, spots in the open,
// each tagged with what can be done there (do:eat, do:drink, do:play...).
// The block's own residents keep their written days (RESIDENTS' plans in
// town.js, laid out by Town.init) as routines: be at the noodle bar from 18:24,
// at the till from 6:18. Everyone else (folk.js) gets a routine from their
// life: a shift at their job, set out in time to get there, sleep fitted round
// it; school on weekdays for the children; and free time, which their needs
// and hobbies fill: noodles when they're hungry, a drink or pachinko or the
// pictures when they're bored, the park or the bath when they're lonely,
// errands when the chores pile up. Tyrell decides where everyone is and what
// they're doing, on screen or off, and Town draws them along the same routes
// it measured for Tyrell (City.travel), so a walk takes as long watched as not.
//
// Residents remember. Strip a till in front of someone and they believe it
// was you, may tell someone at the bar, and may report it (heat). Fix their
// radio and it goes in their file on you. Their minds are saved with the game
// (Game.s.city), and the game's clock drives Tyrell's: when the clock jumps
// (sleeping, the dev slider) the city runs on, or, going back, rewinds with
// Esper, Tyrell's time walk.
// ---------------------------------------------------------------------------
const CITY = {
  // needs, per game hour (0 calm, 1 desperate); fun, company and chores never break a routine
  hunger: 0.04, energy: 0.045, fun: 0.03, company: 0.03, chores: 0.018,
  reportHeat: 6, // heat when someone reports what they saw you do
  money: [40, 160], // what residents start with
  pop: 2, // the population's version: a save with another starts the city over
};
// what's done where: the free choices, each at the places tagged for it
const CITY_FREE = {
  eat: { relieves: { hunger: 0.65, company: 0.1 }, minutes: 40, price: 6, sit: true },
  drink: { relieves: { fun: 0.3, company: 0.35 }, minutes: 90, price: 5, adult: true },
  pachi: { relieves: { fun: 0.5 }, minutes: 120, price: 5, adult: true },
  watch: { relieves: { fun: 0.5, company: 0.1 }, minutes: 120, price: 6 },
  dance: { relieves: { fun: 0.55, company: 0.3 }, minutes: 120, price: 8, adult: true },
  arcade: { relieves: { fun: 0.4 }, minutes: 75, price: 3 },
  bathe: { relieves: { fun: 0.25, company: 0.3, energy: 0.1 }, minutes: 60, price: 3, adult: true },
  pray: { relieves: { fun: 0.12, company: 0.05 }, minutes: 30, base: 0.02 },
  loaf: { relieves: { company: 0.25, fun: 0.12 }, minutes: 45, base: 0.02 },
  festival: { relieves: { fun: 0.45, company: 0.2 }, minutes: 90, price: 2 },
  play: { relieves: { fun: 0.5, company: 0.3 }, minutes: 60, kid: true },
  shop: { relieves: { chores: 0.55 }, minutes: 25, price: 4 },
  laundry: { relieves: { chores: 0.7 }, minutes: 50, price: 3 },
  clinic: { relieves: { energy: 0.05 }, minutes: 60, base: 0.012, cooldown: 4 * 1440, adult: true },
};
const City = {
  w: null, on: false, here: null, pts: new Map(), lv: new Map(), seats: new Map(), reported: [], remarked: {},
  // ---- making the world: once, after the save is read --------------------
  init() {
    if (typeof Tyrell === 'undefined' || !Town.plans) return; // the engine isn't there: the old clock-only town
    const saved = Game.s.city && Game.s.city.s && Game.s.city.pop === CITY.pop ? Game.s.city : null;
    this.make(this.minutes(), saved);
  },
  // the world, from a save, or new: a new one starts a few hours early and
  // runs them, so everyone is somewhere sensible, mid-errand, when you first look
  make(now, saved) {
    this.here = null; this.pts.clear(); this.lv.clear(); this.seats.clear(); this.reported = [];
    const w = (this.w = Tyrell.create({
      seed: 'white-dragon',
      start: now - 5 * 60, // (a save, if there is one, replaces all of this)
      modules: ['reverie', 'fellowship', 'wormtongue', 'cityspeak', 'mentat', 'ceres'],
      shell: { travel: (a, b) => this.travel(a, b) },
      config: { logSize: 200, decisions: 4 },
      moduleConfig: { fellowship: { forget: 6 } }, // (a face in the crowd is forgotten in a week: a city's too big to know everyone)
      esper: { every: 60, keep: 26 * 60, sparseAfter: 180, sparseEvery: 240 }, // (hourly for three hours back, every four hours to a day: a big city's snapshots are big)
    }));
    // needs
    w.need({ id: 'hunger', rise: CITY.hunger, start: 0.3, emotion: 'hungry' });
    w.need({ id: 'energy', rise: CITY.energy, start: 0.2, emotion: 'tired' });
    w.need({ id: 'fun', rise: CITY.fun, start: 0.3, urgent: 1.1, emotion: 'bored' });
    w.need({ id: 'company', rise: CITY.company, start: 0.3, urgent: 1.1, emotion: 'lonely' });
    w.need({ id: 'chores', rise: CITY.chores, start: 0.2, urgent: 1.1 });
    // places: every one in the census, tagged with what can be done there
    for (const id in Census.places) {
      const P = Census.places[id], tags = P.tags.slice(), slots = {};
      for (const act in P.spots) { tags.push('do:' + act); if (CITY_FREE[act] && P.kind !== 'door') slots[act] = Math.max(1, P.spots[act].length); }
      if (P.act) tags.push('do:' + P.act);
      if (P.home) tags.push('home');
      w.place({ id, tags, region: P.level || P.street, hours: P.hours && P.hours[0] !== P.hours[1] ? P.hours : undefined, slots });
    }
    // actions: what the days are made of, and what needs and hobbies choose
    const night = { name: 'night', input: 'hour', range: [0, 24], curve: [[0, 1], [6 / 24, 1], [8 / 24, 0.15], [20 / 24, 0.3], [22.5 / 24, 1], [1, 1]] };
    const near = { name: 'near', input: 'travel', range: [0, 180], curve: [[0, 1], [0.15, 0.75], [0.5, 0.25], [1, 0.05]] }, close = { name: 'near home', input: 'travel', range: [0, 60], curve: [[0, 1], [0.3, 0.5], [0.7, 0.03], [1, 0]] };
    const A = (id, o) => w.action(Object.assign({ id, minutes: 60, pose: TOWN_POSE[id] || 'stand' }, o));
    A('sleep', { at: 'home', minutes: [420, 480], relieves: { energy: 0.95 }, rates: { hunger: 0.4, fun: 0.2, company: 0.2, chores: 0.2 }, tags: ['sleep'], considerations: [night] });
    A('home', { at: 'home', relieves: { energy: 0.12, fun: 0.08 }, base: 0.04, label: 'at home' });
    A('eat_home', { at: 'home', minutes: 25, relieves: { hunger: 0.45 }, pose: 'sit', label: 'something from the cupboard' });
    for (const act in CITY_FREE) {
      const F = CITY_FREE[act], who = F.adult ? ['!is:child'] : F.kid ? ['is:child'] : undefined;
      A(act, { at: 'tag:do:' + act, minutes: F.minutes, relieves: F.relieves, price: F.price, base: F.base, cooldown: F.cooldown, who, slot: act, tags: F.relieves.company ? ['social'] : undefined,
        considerations: [F.kid ? close : near, { name: 'likes it', input: 'trait.like_' + act, out: [0.15, 1.5] }].concat(act !== 'play' && act !== 'arcade' ? [{ name: 'a child', input: 'trait.kid', out: [1, 0.2] }] : []) });
    }
    // only when the day says so (rank -1)
    // (each where it's done, so time at home never turns into sweeping the kitchen)
    w.term('ownhome', (ctx) => !!ctx.place && ctx.place === ctx.person.def.home);
    for (const id of ['work', 'stock', 'sweep', 'school', 'browse']) A(id, { rank: -1, at: 'tag:do:' + id, relieves: id === 'browse' ? { fun: 0.1 } : id === 'school' ? { company: 0.3 } : undefined });
    A('visit', { rank: -1, at: 'tag:home', if: ['!ownhome'], who: ['is:visits'], relieves: { company: 0.4 } });
    A('host', { rank: -1, at: 'home', who: ['is:visits'], relieves: { company: 0.4 } }); // (the block's own visit each other: their days say when)
    A('pay', { at: 'tag:do:pay', minutes: 8, rank: -1, price: 8, fill: false });
    // coming by the White Dragon for something you fixed (Jobs.collections sends them; never arriving in the night)
    A('collect', { at: 'd_noodles', minutes: 12, rank: -1, hours: [7, 22.5], fill: false, label: 'picking something up from Lin' });
    // what deeds mean to the people they're done to
    w.deed('fixed', { feeling: 'helped', regard: 0.2, memory: 6, sentiment: 'fixed my things' });
    w.deed('botched', { feeling: 'wronged', regard: -0.25, memory: 6, sentiment: 'botched a repair' });
    w.wormtongue.crime({ kind: 'strip', severity: 0.6, heat: CITY.reportHeat });
    w.on('report', (r) => { if (r.actor === 'player') this.reported.push(r); });
    // the people
    for (let i = 0; i < TOWN_ORDER.length; i++) {
      const id = TOWN_ORDER[i], R = RESIDENTS[id], traits = { honesty: 0.3 + hash(i, 3, 71) * 0.7, talkative: hash(i, 4, 71), courage: hash(i, 5, 71), thrift: hash(i, 6, 71), kid: R.age === 'kid' ? 1 : 0 };
      for (const act in CITY_FREE) traits['like_' + act] = R.likes[act] ? 1 : 0.1;
      w.person(id, {
        name: R.name, home: R.homePlace, tags: ['resident'].concat(R.age === 'kid' ? ['child'] : [], R.plan && R.plan.some((e) => e[2] === 'visit' || e[2] === 'host') ? ['visits'] : []), groups: R.hh ? [R.hh] : undefined,
        routine: this.routineOf(id), traits,
        vars: { money: Math.round(CITY.money[0] + hash(i, 7, 71) * (CITY.money[1] - CITY.money[0])) },
        needs: { hunger: 0.2 + hash(i, 8, 71) * 0.3, energy: 0.2, chores: hash(i, 9, 71) * 0.5 },
      });
      if (!w.kept('income:' + id) && R.age !== 'kid') { w.ceres.income(id, R.job ? 140 : 60, 7); w.keep('income:' + id, true); }
      else if (!w.kept('income:' + id)) { w.ceres.income(id, 20, 7); w.keep('income:' + id, true); }
    }
    let loaded = false;
    if (saved) { try { w.load(saved); loaded = true; } catch (e) { /* an unreadable city: start it over */ } }
    if (!loaded) w.advanceTo(now);
    this.on = true;
  },
  // Tyrell's clock: game minutes since day 0
  minutes() { return (Game.s.day * 24 + Game.s.time) * 60; },
  // ---- a resident's day as a Tyrell routine -------------------------------
  routineOf(id) {
    const R = RESIDENTS[id], H = (h) => ((h % 24) + 24) % 24;
    // the block's own: the hours Town.init worked out
    if (R.plan) return Town.plans[id].map((e) => {
      const extra = {};
      if (e.o && e.o.with) extra.with = e.o.with;
      if (WORK_ACTS.includes(e.act) || e.act === 'school') extra.rank = 2; // (work holds like a job: only a desperate need gets them off the till)
      const act = e.act === 'home' ? '*' : e.act; // (time at home is theirs: anything they can do there)
      return Object.keys(extra).length ? [e.h, e.place, act, extra] : [e.h, e.place, act];
    });
    const hours = (pid) => this.travel(R.homePlace, pid) / 60, kids = R.hh && Folk.households.find((h) => h.id === R.hh), hasKids = kids && kids.members.some((m) => RESIDENTS[m].age === 'kid');
    const sort = (plan) => plan.map(([h, ...rest]) => [Math.round(H(h) * 100) / 100, ...rest]).sort((a, b) => a[0] - b[0]);
    const leisure = R.age === 'senior' ? [[6.5, 'home', '*'], [8, null, '*'], [11.5, 'home', '*'], [13, null, '*'], [17.5, 'home', '*'], [21.5, 'home', 'sleep']]
      : [[7.2, 'home', '*'], [9, null, '*'], [12, 'home', '*'], [13.5, null, '*'], [hasKids ? 18 : 19, hasKids ? 'home' : null, '*'], [hasKids ? 22.6 : 23.4, 'home', 'sleep']];
    if (R.age === 'kid') {
      const c = R.school ? hours(R.school) : 0, school = [[7, 'home', '*'], [8.1 - c, R.school, 'school', { rank: 2 }], [15, null, '*'], [18.4, 'home', '*'], [20.6, 'home', 'sleep']];
      const free = [[8, 'home', '*'], [9.5, null, '*'], [12.2, 'home', '*'], [13.2, null, '*'], [18.4, 'home', '*'], [21, 'home', 'sleep']];
      return R.school ? [{ days: [0, 1, 2, 3, 4], plan: sort(school) }, { plan: sort(free) }] : sort(free);
    }
    if (R.regular) { const plan = leisure.filter((e) => e[0] < 18.5 || e[2] === 'sleep').concat([[19, R.regular.place, R.regular.act, { rank: 2 }], [21, 'home', '*']]); return sort(plan); }
    if (!R.job) return sort(leisure);
    // a shift: set out in time to be there at its start, home after (to the
    // family, if there is one), and sleep fitted in at the best hour it can be
    const [a, b] = R.job.shift, len = ((b - a) + 24) % 24 || 24, c = hours(R.job.place), out = a - c - 0.1, end = a + len;
    const lo = end + c + 1, hi = out + 24 - 9; let sleep;
    if (lo > hi) sleep = lo;
    else { const up = 23 + 24 * Math.ceil((lo - 23) / 24); sleep = up <= hi ? up : (lo - (up - 24) < up - hi ? lo : hi); }
    const wake = Math.min(sleep + 8, out + 24 - 0.6), plan = [[out, R.job.place, 'work', { rank: 2 }], [end, hasKids ? 'home' : null, '*']];
    if (sleep - 1 > end + c + 0.3) plan.push([sleep - 1, 'home', '*']);
    plan.push([sleep, 'home', 'sleep'], [wake, 'home', '*']);
    if (out + 24 - wake > 1.6) plan.push([wake + 0.8, null, '*']);
    if (!R.job.weekdays) return sort(plan);
    return [{ days: [0, 1, 2, 3, 4], plan: sort(plan) }, { plan: sort([[sleep, 'home', 'sleep'], [wake, 'home', '*'], [wake + 1, null, '*'], [sleep - 1.5, 'home', '*']]) }];
  },
  // ---- places -----------------------------------------------------------
  // where a place is, for working out walks: a point Town.route takes
  anchor(pid) {
    const P = Census.places[pid];
    if (!P) return { place: pid, x: 0, y: 0 };
    if (P.flat) { const F = FLATS[P.flat]; return { place: pid, x: F.table, y: F.y }; }
    if (P.kind === 'room') return { place: pid, x: P.inside, y: P.G };
    return { place: pid, x: P.x, y: P.y };
  },
  // the walk between two places, in game minutes, at the residents' pace
  // (the same route Town draws them along, so on screen and off agree)
  travel(a, b) {
    if (a === b) return 0;
    let row = this.pts.get(a); if (!row) this.pts.set(a, (row = new Map()));
    let m = row.get(b);
    if (m === undefined) { m = Math.max(0.5, (Town.length(Town.route(this.anchor(a), this.anchor(b))) / PXH) * 60); row.set(b, m); }
    return m;
  },
  // could someone be in this level now? (worked out once per thing they do)
  mayBeIn(id, level) {
    if (!this.on) return true;
    const p = this.w.get(id); if (!p || p.status !== 'active') return false;
    const d = p.doing, key = d ? d.kind + d.start + '|' + d.to + '|' + d.place : 'idle|' + p.place;
    let c = this.lv.get(id);
    if (!c || c.key !== key) {
      let set;
      if (d && d.kind === 'travel') set = Town.levels(Town.route(this.anchor(d.from || p.place || RESIDENTS[id].homePlace), this.anchor(d.to)));
      else { const P = Census.places[p.place]; set = new Set(P && P.level ? [P.level] : []); }
      c = { key, set }; this.lv.set(id, c);
    }
    return c.set.has(level);
  },
  // a seat for someone at a place, kept while they're doing that there: the
  // first free one from the one they'd pick, so nobody sits in anybody
  seat(id, pid, act, start) {
    const P = Census.places[pid], list = P && (P.spots[act] || P.spots[SPOT_ALIAS[act]]);
    if (!list || list.length < 2 || P.kind === 'door') return undefined;
    const k = pid + '|' + act; let m = this.seats.get(k); if (!m) this.seats.set(k, (m = new Map()));
    const mine = m.get(id); if (mine && mine.start === start) return mine.i;
    for (const [q, v] of m) { const p = this.w.get(q); if (!p || p.place !== pid || !p.doing || p.doing.kind === 'travel' || p.doing.action !== act) m.delete(q); }
    const used = new Set([...m.values()].map((v) => v.i)), first = Math.floor(hash(Town.idn(id), act.length, 9) * list.length);
    let i = first; for (let t = 0; t < list.length; t++) { const j = (first + t) % list.length; if (!used.has(j)) { i = j; break; } }
    m.set(id, { i, start }); return i;
  },
  // ---- where someone is now: Town.state's shape, from Tyrell ------------
  state(id) {
    const w = this.w, p = w.get(id), hourAt = (t) => (((t / 60) % 24) + 24) % 24;
    const none = { level: null, act: 'home', e: { act: 'home', h: 0, o: {} } };
    if (!p || p.status !== 'active') return none;
    const d = p.doing;
    if (d && d.kind === 'travel') {
      const route = w.mind.routineAt(p), withId = route && route.entry[3] && route.entry[3].with;
      const from = d.from || p.place || RESIDENTS[id].homePlace;
      const a = Town.spot(id, from, p.last || 'home', d.start), b = Town.spot(id, d.to, d.action, d.end, undefined, this.seat(id, d.to, d.action, d.end));
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
    return this.at(id, p.place || RESIDENTS[id].homePlace, act, d ? d.start : w.now);
  },
  at(id, place, act, start) {
    const b = Town.spot(id, place, act, start, undefined, this.seat(id, place, act, start)), e = { act, h: (((start / 60) % 24) + 24) % 24, o: {} };
    return { level: b.level, x: b.x, y: b.y, moving: false, act, e, flat: b.flat, hidden: b.hidden, depth: b.depth, face: b.face, place };
  },
  // ---- every frame (from Town.sync): keep up with the game's clock --------
  sync() {
    if (!this.on) return;
    const t = this.minutes();
    // back as well as forward: Esper rewinds. Further back than it remembers
    // (the dev clock), the block starts over at that hour, memories and all.
    if (t < this.w.esper.earliest() - 1e-6) this.make(t, null);
    else if (Math.abs(t - this.w.now) > 1e-6) this.w.advanceTo(t);
    Jobs.collections(); // (what's fixed gets collected)
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
    const owner = saw.find((n) => { const j = n.def.town && RESIDENTS[n.def.town].job; return j && Census.places[j.place] && Census.places[j.place].level === here; });
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
  // tell a resident to do something (a Tyrell directive), or null to release them
  direct(id, d) { if (this.on && this.w.get(id)) this.w.direct(id, d); },
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
  stash() { if (this.on) Game.s.city = { tyrell: 'world', v: this.w.s.v, pop: CITY.pop, s: this.w.s }; },
  // ---- for the dev drawer and the console --------------------------------
  inspect(name) { if (!this.on) return 'Tyrell is off'; const id = TOWN_ORDER.find((k) => k === name || RESIDENTS[k].name === name) || name; return this.w.describe(id); },
};
