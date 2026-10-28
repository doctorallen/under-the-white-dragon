'use strict';
// ---------------------------------------------------------------------------
// The city's people. Folk.make (once, at start, after the census) makes the
// households that fill its jobs and homes, the same people every game:
//   - every post's shifts need someone, the first shift its own person (the
//     ramen cook keeps her name and look), the rest someone in its uniform;
//   - whoever takes a job lives in a home near enough to it: a single in a
//     capsule or a shack, a couple or a family in a flat or a house; the
//     deep's jobs go to people from street level and Old Town, who ride down;
//   - a family's children go to the school in their part of the city, and
//     play near home after; some adults keep house; some couples are retired,
//     and a few old people live alone;
//   - everyone has a hobby or two (a bar, pachinko, the pictures, the bath,
//     the temple, a bench in the park) that their free time leans toward.
// The block's own residents (RESIDENTS in town.js, written by hand) are
// among them: they keep their days, and Folk gives the ones who live off the
// block a home on their street. Their minds are Tyrell's (city.js).
// ---------------------------------------------------------------------------
const FOLK = {
  // the kinds of household made to fill a job, and how often
  kinds: [['single', 0.42], ['couple', 0.2], ['family', 0.3], ['parent', 0.05], ['three', 0.03]],
  stayHome: 0.12, // a second adult who keeps house
  retiredCouple: 0.22, // a couple who've stopped working (made after the jobs are filled)
  seniors: 18, // old people living alone or together, besides
  // which bands someone who works in a band may live in, nearest first
  live: { sky: ['high'], high: ['high', 'street'], street: ['street', 'high', 'old'], under: ['street', 'old'], old: ['old', 'street'], works: ['old', 'street'], bowels: ['old', 'street'] },
  // homes a household fits, by its size
  fits: { 1: ['capsule', 'shack', 'flat', 'squat'], 2: ['flat', 'house', 'shack', 'penthouse'], 3: ['flat', 'house'], 4: ['flat', 'house'] },
  hobbies: { adult: ['drink', 'pachi', 'watch', 'dance', 'arcade', 'bathe', 'loaf', 'festival', 'pray'], young: ['dance', 'arcade', 'drink', 'watch', 'festival'], senior: ['pray', 'bathe', 'loaf', 'watch', 'drink', 'pachi'], kid: ['play', 'arcade'] },
};
// what generated people say about their day, by what they're doing
const FOLK_SAY = {
  work: ['Busy. Buy something or let me work.', 'Another shift. Same as the last one.', 'Can\'t stop. The boss counts minutes.', 'Work\'s work.'],
  home: ['Home. Feet up.', 'Off to my own four walls.', 'Home, before it rains again.'],
  school: ['School. We\'re doing fractions. Fractions!', 'Teacher says I talk too much.', 'I\'m not late. I\'m nearly on time.'],
  play: ['It\'s my turn!', 'You can play if you\'re fast.', 'We\'re playing drones and cops. I\'m the drone.'],
  eat: ['Hungry. Don\'t keep me.', 'Something hot, then home.'], drink: ['One drink. Maybe two.', 'Off to wash the day down.'], pachi: ['The machines owe me.', 'Just an hour of pachinko.'],
  watch: ['The late picture.', 'They\'re showing something with explosions.'], dance: ['Dancing. Don\'t wait up.', 'The Coil, if they let me in.'], arcade: ['High score\'s mine. Going to keep it.'],
  bathe: ['The bath. Hot water and gossip.', 'A soak. My back\'s forty years older than me.'], loaf: ['Just sitting a while.', 'Watching the city go by.'], festival: ['Lanterns! Come and see.'],
  pray: ['To light one for my mother.', 'A minute with the gods. They don\'t answer either.'], shop: ['Errands.', 'Shopping, before they shut.'], laundry: ['Laundry. The glamour of it.'], clinic: ['The doctor. It\'s nothing. Probably.'],
};
const FOLK_HAIR = ['short', 'bob', 'long', 'cap', 'hood', 'bun', 'bald', 'undercut'], FOLK_HAIRCOL = ['#1a1414', '#2a1a14', '#3a2a20', '#5a3a1a', '#8a6a4a', '#1a1414', '#ff4ab0', '#3af0e0', '#c83a2a'];
const FOLK_TOP = ['#3a4a5a', '#5a3a3a', '#3a5a3a', '#4a4a4a', '#6a5a3a', '#2a2a3a', '#5a3a5a', '#c8c0b0', '#7a5a2a', '#2a4a5a', '#6a2a3a', '#3a3a2a'];

const Folk = {
  households: [], byHome: {}, made: false,
  make() {
    if (this.made) return; this.made = true;
    const r = new Rng(20261027), C = Census, names = new Set(), homes = [];
    const band = (pid) => Travel.band(C.places[pid].street);
    // ---- homes: each door's households, as rooms to fill
    for (const h of C.homes) { this.byHome[h.id] = []; for (let k = 0; k < h.n; k++) homes.push({ place: h.id, kind: h.home, band: band(h.id), free: true }); }
    // the block's flats, written by hand (d_block.js), and the people in them
    for (const k in FLATS) { const id = 'flat:' + k; C.places[id] = { id, kind: 'room', level: 'd_flats', street: 'd_dragon', x: TOWN_PLACE.flats.door, y: BK.G, inside: TOWN_PLACE.flats.inside, G: BK.G, flat: k, spots: {}, tags: ['home'], label: 'Flat ' + k, home: 'flat' }; this.byHome[id] = []; }
    // a name nobody else in the city has
    for (const id in RESIDENTS) names.add(RESIDENTS[id].name);
    for (const p of C.posts) if (p.name) names.add(p.name);
    const name = (fem, last, o = {}) => { for (let t = 0; t < 40; t++) { const first = r.pick(fem ? NAME_F : NAME_M), n = o.old && r.f() < 0.4 ? (fem ? 'Mrs ' : 'Mr ') + last : o.kid ? first : first + ' ' + last; if (!names.has(n)) { names.add(n); return n; } last = r.pick(NAME_LAST); } return 'Someone ' + names.size; };
    // ---- the block's own residents: their homes off the block, their jobs
    for (const id in RESIDENTS) {
      const R = RESIDENTS[id];
      R.age = R.age || 'adult'; R.likes = R.likes || {};
      if (typeof R.job === 'string') R.job = { place: TOWN_PLACE[R.job].level, title: { grocery: 'grocer', izakaya: 'keeps the bar', menagerie: 'pet shop hand', pachinko: 'floor man', cinema: 'usher', coil: 'bartender', shrine: 'shrine keeper' }[R.job] || 'staff', hand: R.job };
      if (typeof R.school === 'string' && R.school.startsWith('@')) { const sc = Object.values(C.places).find((q) => q.label === R.school.slice(1)); R.school = sc ? sc.id : null; }
      if (R.home && FLATS[R.home]) R.homePlace = 'flat:' + R.home;
      else if (R.lives) { const h = homes.find((q) => q.free && C.places[q.place].street === R.lives && (q.kind === 'capsule' || q.kind === 'shack' || q.kind === 'flat' || q.kind === 'house')) || homes.find((q) => q.free && band(q.place) === Travel.band(R.lives)); h.free = false; R.homePlace = h.place; }
      if (R.homePlace) { const hh = { id: 'hh:' + id, home: R.homePlace, members: [id], label: R.name + '\'s home', kind: 'single' }; const twin = this.households.find((q) => q.home === R.homePlace && R.homePlace.startsWith('flat:')); if (twin) twin.members.push(id); else { this.households.push(hh); this.byHome[R.homePlace].push(hh); } R.hh = (twin || hh).id; }
    }
    // ---- the jobs: every shift of every post, the deep's first (fewest homes near them)
    const jobs = [];
    for (const p of C.posts) {
      if (p.regular) continue;
      p.shifts.forEach((sh, k) => jobs.push({ post: p, k, shift: sh, band: band(p.place) }));
    }
    // the hand-made residents' jobs at the city's doors take those shifts
    for (const id in RESIDENTS) {
      const R = RESIDENTS[id]; if (!R.workAt) continue;
      const [label, hour] = R.workAt, at = jobs.filter((q) => !q.who && C.places[q.post.place].label === label).sort((a, b) => Math.abs(a.shift[0] - hour) - Math.abs(b.shift[0] - hour));
      if (at.length) { at[0].who = id; R.job = { place: at[0].post.place, shift: at[0].shift, title: at[0].post.title, kind: at[0].post.kind }; }
    }
    const order = ['bowels', 'works', 'under', 'old', 'street', 'sky', 'high'];
    jobs.sort((a, b) => order.indexOf(a.band) - order.indexOf(b.band) || (a.post.lives ? -1 : 0) - (b.post.lives ? -1 : 0));
    const idle = []; // adults without work yet
    let n = 0; const nid = () => 'f' + (++n);
    // a household made in a home in one of these bands, around a job
    // how far a home's street is from a job's: along the row of streets, or a ride
    const far = (a, b) => { const A = C.streets[a], B = C.streets[b]; return a === b ? 0 : A.band === B.band && A.row >= 0 && B.row >= 0 ? Math.abs(A.row - B.row) : 3; };
    const makeHH = (bands, kind, near) => {
      const size = { single: 1, couple: 2, family: 2 + (r.f() < 0.55 ? 1 : 2), parent: 1 + (r.f() < 0.6 ? 1 : 2), three: 3 + (r.f() < 0.5 ? 1 : 0) }[kind];
      const fits = FOLK.fits[Math.min(4, size)];
      // the nearest free home that fits, near the work, give or take (people don't all live next door to it)
      const pick = (ok) => { let best = null, bs = Infinity; for (const q of homes) { if (!q.free || !ok(q)) continue; const bi = bands.indexOf(q.band); if (bi < 0) continue; const sc = bi * 10 + (near ? far(near, C.places[q.place].street) : 0) + r.f() * 2.5; if (sc < bs) { bs = sc; best = q; } } return best; };
      let h = pick((q) => fits.includes(q.kind)) || (size <= 2 ? pick((q) => q.kind !== 'squat') : null);
      if (!h) for (const b of bands) { h = homes.find((q) => q.free && q.band === b); if (h) break; }
      if (!h) return null;
      h.free = false;
      const last = r.pick(NAME_LAST), hh = { id: 'hh:' + nid(), home: h.place, members: [], kind, last };
      const adultsN = kind === 'single' || kind === 'parent' ? 1 : 2, kidsN = kind === 'family' ? size - 2 : kind === 'parent' ? size - 1 : kind === 'three' ? size - 3 : 0;
      const fem0 = r.f() < 0.5;
      for (let a = 0; a < adultsN; a++) hh.members.push(this.person(nid(), { fem: a ? !fem0 : fem0, last, age: kind === 'single' && r.f() < 0.45 ? 'young' : 'adult', hh, name, r }));
      for (let c = 0; c < kidsN; c++) hh.members.push(this.person(nid(), { fem: r.f() < 0.5, last, age: 'kid', hh, name, r }));
      if (kind === 'three') hh.members.push(this.person(nid(), { fem: r.f() < 0.6, last, age: 'senior', hh, name, r }));
      hh.label = this.hhLabel(hh);
      this.households.push(hh); this.byHome[h.place].push(hh);
      for (const id of hh.members) if (RESIDENTS[id].age !== 'kid' && RESIDENTS[id].age !== 'senior') idle.push(id);
      // (in a household of two adults with children, one may keep house)
      if (adultsN === 2 && kidsN && r.f() < FOLK.stayHome) { const k = idle.lastIndexOf(hh.members[1]); if (k >= 0) { idle.splice(k, 1); RESIDENTS[hh.members[1]].keepsHouse = true; } }
      return hh;
    };
    // ---- fill the jobs
    for (const j of jobs) {
      if (j.who) continue;
      const bands = FOLK.live[j.band] || [j.band];
      if (j.post.lives && j.k === 0) {
        // someone who lives where they work: a corner of a platform, a shack in the deep
        const id = this.person(nid(), { fem: r.f() < 0.4, last: r.pick(NAME_LAST), age: 'adult', name, r }), R = RESIDENTS[id];
        const pid = j.post.place; C.places[pid].home = 'squat'; C.places[pid].tags.push('home'); this.byHome[pid] = this.byHome[pid] || [];
        const hh = { id: 'hh:' + id, home: pid, members: [id], kind: 'single', label: R.name + '\'s corner' }; this.households.push(hh); this.byHome[pid].push(hh); R.hh = hh.id; R.homePlace = pid;
        if (POST_KIND[j.post.title] || POST_KIND[j.post.name]) this.employ(id, j); // (the scavenger works; the hermit just lives)
        continue;
      }
      let who = null;
      const js = C.places[j.post.place].street;
      for (const b of bands) { let k = -1, bs = Infinity; idle.forEach((id, i) => { const hs = C.places[RESIDENTS[id].homePlace].street; if (Travel.band(hs) !== b) return; const sc = far(js, hs); if (sc < bs) { bs = sc; k = i; } }); if (k >= 0 && bs <= 2) { who = idle.splice(k, 1)[0]; break; } }
      if (!who) { let x = r.f(), kind = 'single'; for (const [k, p] of FOLK.kinds) { if (x < p) { kind = k; break; } x -= p; } const hh = makeHH(bands, kind, C.places[j.post.place].street) || makeHH(Object.keys(FOLK.live), 'single'); if (!hh) continue; who = idle.splice(idle.indexOf(hh.members.find((id) => idle.includes(id))), 1)[0]; }
      this.employ(who, j);
    }
    // whoever's still without work keeps house, or is between jobs
    for (const id of idle) RESIDENTS[id].keepsHouse = true;
    // ---- the old: retired couples and people living alone
    for (let k = 0; k < FOLK.seniors; k++) {
      const b = r.pick(['high', 'high', 'street', 'old']), h = homes.find((q) => q.free && q.band === b && (q.kind === 'flat' || q.kind === 'house')) || homes.find((q) => q.free && q.kind === 'flat');
      if (!h) break;
      h.free = false;
      const last = r.pick(NAME_LAST), pair = r.f() < 0.5, hh = { id: 'hh:' + nid(), home: h.place, members: [], kind: pair ? 'couple' : 'single', last };
      const fem0 = r.f() < 0.55;
      hh.members.push(this.person(nid(), { fem: fem0, last, age: 'senior', hh, name, r }));
      if (pair) hh.members.push(this.person(nid(), { fem: !fem0, last, age: 'senior', hh, name, r }));
      hh.label = this.hhLabel(hh); this.households.push(hh); this.byHome[h.place].push(hh);
    }
    // ---- the regulars: named people who keep to a spot, living near it
    for (const p of C.posts) {
      if (!p.regular) continue;
      const b = Travel.band(C.places[p.place].street), h = homes.find((q) => q.free && C.places[q.place].street === C.places[p.place].street) || homes.find((q) => q.free && q.band === b);
      if (!h) continue;
      h.free = false;
      const id = this.person(nid(), { fem: /Mrs|Esi/.test(p.name), last: r.pick(NAME_LAST), age: /Mrs|Old/.test(p.name) ? 'senior' : 'adult', name, r }), R = RESIDENTS[id];
      names.delete(R.name); R.name = p.name; R.look = p.look; R.say.loaf = p.lines[0]; R.lines = p.lines; R.regular = { place: p.place, act: p.act };
      const hh = { id: 'hh:' + id, home: h.place, members: [id], kind: 'single', label: R.name + '\'s home' }; this.households.push(hh); this.byHome[h.place].push(hh); R.hh = hh.id; R.homePlace = h.place;
    }
    // ---- children go to the school of their part of the city
    const schools = Object.values(C.places).filter((p) => p.amen === 'school');
    for (const id in RESIDENTS) {
      const R = RESIDENTS[id]; if (R.age !== 'kid' || R.school) continue;
      const b = Travel.band(C.places[R.homePlace].street), s = schools.find((q) => Travel.band(q.street) === b) || schools.find((q) => Travel.band(q.street) === 'street') || schools[0];
      if (s) R.school = s.id;
    }
    TOWN_ORDER.length = 0; TOWN_ORDER.push(...Object.keys(RESIDENTS));
  },
  // someone new: a look, a name, hobbies, things to say
  person(id, o) {
    const r = o.r, age = o.age, kid = age === 'kid', old = age === 'senior';
    const look = { skin: r.pick(SKINS), hair: kid ? r.pick(['cap', 'short', 'bob', 'bun']) : old ? r.pick(['bald', 'short', 'bun', 'long']) : r.pick(FOLK_HAIR), hairCol: old ? r.pick(['#c8c8c8', '#e8e8e8', '#8a8a8a']) : r.pick(FOLK_HAIRCOL), top: r.pick(FOLK_TOP), legs: r.pick(['#2a2a2a', '#1a1a24', '#3a3028', '#2a2a3a']), tall: kid ? 0.64 + r.f() * 0.14 : old ? 0.86 + r.f() * 0.08 : 0.9 + r.f() * 0.12 };
    if (!o.fem && look.hair === 'bun') look.hair = 'short';
    if (look.hair === 'cap') look.capCol = r.pick(['#3aff80', '#ff8a20', '#3af0e0', '#c83a2a', '#2a3a5a']);
    if (!kid && r.f() < 0.45) look.coat = r.pick(['long', 'jacket']);
    if (kid) look.top = r.pick(['#ff8a20', '#3af0e0', '#c83a3a', '#ffd040', '#3aff80', '#9a6aff']);
    if (!kid && r.f() < 0.12) { look.cyArm = true; look.acc = r.pick(['#3af0e0', '#ff4ab0', '#ffb040']); }
    const pool = FOLK.hobbies[kid ? 'kid' : old ? 'senior' : age === 'young' ? 'young' : 'adult'], likes = {};
    likes[r.pick(pool)] = 1; if (r.f() < 0.6) likes[r.pick(pool)] = 1;
    const say = {}; for (const k in FOLK_SAY) say[k] = r.pick(FOLK_SAY[k]);
    if (!kid) say.walk = r.pick(STREET_LINES), say.home = r.f() < 0.5 ? say.home : r.pick(STREET_LINES);
    const R = (RESIDENTS[id] = { name: o.name(o.fem, o.last, { kid, old }), look, fem: o.fem, age, likes, say, gen: true, hh: o.hh && o.hh.id, homePlace: o.hh && o.hh.home, smoke: !kid && r.f() < 0.12 });
    return id;
  },
  // a job: the post's shift, and for its first shift, the post's own person
  employ(id, j) {
    const R = RESIDENTS[id], p = j.post;
    R.job = { place: p.place, shift: j.shift, pos: p.pos, title: p.title, role: p.role, rate: p.rate, stock: p.stock, kind: p.kind, weekdays: !!p.weekdays, lines: p.lines };
    if (p.look) R.look = j.k === 0 ? Object.assign({}, p.look) : Object.assign({}, p.look, { skin: R.look.skin, hair: R.look.hair, hairCol: R.look.hairCol, tall: R.look.tall, capCol: R.look.capCol });
    if (j.k === 0 && p.name && !RESIDENTS[id].fixedName) { R.name = p.name; R.post = true; }
    if (p.lines && p.lines.length) R.say.work = p.lines[0], R.lines = p.lines;
    if (p.smoke) R.smoke = true;
  },
  hhLabel(hh) {
    const R = hh.members.map((id) => RESIDENTS[id]), kids = R.filter((q) => q.age === 'kid').length;
    if (R.length === 1) return R[0].name + '\'s home';
    return 'The ' + (hh.last || R[0].name.split(' ').pop()) + (/s$/.test(hh.last || '') ? 'es' : 's') + (kids ? ` and ${kids === 1 ? 'their child' : 'their ' + kids + ' children'}` : '');
  },
  householdsAt(pid) { return this.byHome[pid] || []; },
  // how many are behind a door now (from the minds: city.js)
  inside(pid) { if (!City.on) return 0; let n = 0; for (const id of TOWN_ORDER) { const p = City.w.get(id); if (p && p.place === pid && (!p.doing || p.doing.kind !== 'travel')) n++; } return n; },
  // in a few words: who they are
  who(id) {
    const R = RESIDENTS[id]; if (R.who) return R.who;
    const P = Census.places, home = P[R.homePlace], where = home ? LEVELS[home.street].name : 'the city';
    if (R.age === 'kid') return `a kid from ${where}, at ${R.school && P[R.school] ? P[R.school].label : 'school'} on weekdays`;
    if (R.job) { const at = P[R.job.place]; return `${/^[aeiou]/i.test(R.job.title) ? 'an' : 'a'} ${R.job.title.toLowerCase()} at ${at.kind === 'door' ? at.label : LEVELS[at.street].name}, lives in ${where}`; }
    if (R.age === 'senior') return `retired, lives in ${where}`;
    return `keeps house in ${where}`;
  },
};
