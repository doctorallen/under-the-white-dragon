'use strict';
// ---------------------------------------------------------------------------
// The census: every place in the city where its people live, work and spend
// their time, read once from the levels as they're built (Census.take, at
// start, before the population is made: folk.js).
//   streets: the open levels, each with its ground, its ends and its way out
//     of the band (the cab stand, the manhole, the subway, the cage elevator)
//   places: where someone can be, each reached from a street:
//     room: behind a door, a hidden level you can walk into (the noodle bar,
//       the Red Lantern), with spots inside for what's done there
//     door: a door with nothing to show behind it (homes, a school, a bath,
//       offices, shops): someone in there isn't drawn
//     spot: somewhere in the open: a stall, a post, a park bench, a temple's
//       steps, a corner of a platform
//   The people the levels were built with become posts: whoever works (the
//   ramen cook, the bridge warden, Mechanic Ana) is a job with shifts, its
//   first worker keeping their name and look and the others its uniform;
//   whoever was only doing something (the audience, the patients) becomes a
//   spot where residents do it. The passers-by go: everyone on a street now
//   is somebody on their way somewhere.
// ---------------------------------------------------------------------------
// what each post is, by its title (or a named person's name): the kind of
// work, and so its shifts. A kind not here is a stall.
const POST_KIND = {
  'ramen cook': 'food', 'grill man': 'food', 'dumpling auntie': 'food', 'skewer kid': 'food', 'tea seller': 'food', 'kiosk cook': 'food', 'Old Sato': 'food', 'Auntie Bo': 'food', 'tea master': 'food', 'Cookie': 'canteen',
  'bouncer': 'night', 'DJ Halcyon': 'club', 'lookout': 'night',
  'bridge warden': 'watch', 'porter': 'dock', 'dock worker': 'dock', 'Harbormaster Ilse': 'dock', 'picker': 'yard', 'boatwoman': 'dock', 'The Ferryman': 'dock',
  'office worker': 'office', 'archivist': 'office', 'keeper': 'keeper', 'shopkeeper': 'stall',
  'Head gardener Mori': 'garden', 'gardener': 'garden',
  'Doctor Reyes': 'clinic', 'Doc Nine': 'clinic',
  'Sewerman Dodd': 'plant', 'Engineer Okoro': 'plant', 'Stoker Ama': 'plant', 'Chief Engineer Wu': 'plant', 'Lineman Bex': 'plant', 'Pump Hand Joss': 'plant', 'Keeper Ines': 'plant',
  'worker': 'plant', 'pump hand': 'plant', 'smelter': 'plant', 'Operator Vey': 'plant', 'night tech': 'plant', 'Chemist Orr': 'plant', 'lab hand': 'plant', 'vat hand': 'plant', 'linesman': 'plant',
  'scavenger': 'scavenge',
};
// the shifts each kind of work runs in ([start, end) hours; one person each)
const POST_SHIFTS = {
  food: [[8, 20]], foodnight: [[16, 4]], canteen: [[5, 13], [13, 21]], stall: [[9, 19]], trade: [[8, 20], [20, 8]], night: [[20, 4]], club: [[22, 4]],
  watch: [[6, 18], [18, 6]], dock: [[6, 14], [14, 22]], yard: [[7, 19]], office: [[9, 18]], keeper: [[6, 20]], garden: [[7, 16]], clinic: [[8, 20], [20, 8]], plant: [[6, 18], [18, 6]], hand: [[7, 19]], scavenge: [[10, 18]],
};
// the people who were only doing something: what residents do at that spot
const POST_SPOT = {
  'patient': 'clinic', 'old patient': 'clinic', 'mother': 'clinic', 'in the audience': 'watch', 'at the pachinko': 'pachi', 'regular': 'pachi', 'housewife': 'pachi', 'on the night shift': 'pachi',
  'salaryman': 'drink', 'office girl': 'drink', 'old drunk': 'drink', 'a regular': 'eat', 'dancer': 'dance', 'clubber': 'dance', 'festival-goer': 'festival', 'resident': 'loaf', 'old-timer': 'loaf', 'kid': 'play', 'pilgrim': 'pray',
};
// people who live where they stand (the hermit in the deep, the platform's squatter)
const POST_LIVES = { 'The Hermit': 1, 'platform squatter': 1, 'scavenger': 1 };
// people with a name and no work: residents who keep to their spot for a few hours a day
const POST_REGULAR = { 'Mrs Ueda': 'loaf', 'Esi': 'loaf' };
const CROWD_TITLES = ['lives near here', 'commuter', 'passer-by', 'night worker'];
// a named person's work, in a word, by its kind
const POST_WORD = { trade: 'trader', plant: 'engineer', dock: 'dock hand', clinic: 'doctor', office: 'clerk', food: 'cook', watch: 'warden', garden: 'gardener', keeper: 'keeper', club: 'DJ', canteen: 'canteen cook', stall: 'stallholder', yard: 'picker', scavenge: 'scavenger', night: 'doorman' };
// the staff each kind of door needs (people per shift) and what's done there
const AMEN = {
  eatery: { staff: 1, act: 'eat', tags: ['food', 'social'] }, bar: { staff: 1, act: 'drink', tags: ['social', 'fun', 'adult'] }, club: { staff: 2, act: 'dance', tags: ['fun', 'adult'] },
  pachinko: { staff: 1, act: 'pachi', tags: ['fun', 'adult'] }, arcade: { staff: 1, act: 'arcade', tags: ['fun'] }, shop: { staff: 1, act: 'shop', tags: ['shop'] },
  clinic: { staff: 1, act: 'clinic', tags: ['clinic'] }, temple: { staff: 1, act: 'pray', tags: ['faith'] }, office: { staff: 1, act: null, tags: ['work'] }, theater: { staff: 2, act: 'watch', tags: ['fun'] },
  bath: { staff: 1, act: 'bathe', tags: ['fun', 'social'] }, school: { staff: 2, act: 'school', tags: ['school'] }, hospital: { staff: 2, act: 'clinic', tags: ['clinic'] },
  depot: { staff: 3, act: null, tags: ['work'] }, hotel: { staff: 3, act: null, tags: ['work'] }, laundry: { staff: 1, act: 'laundry', tags: ['shop'] },
};
const AMEN_DAY = ['office', 'school', 'depot'], AMEN_ROUND = ['hospital', 'hotel'];
// what each hangout is for
const HANGOUT_ACT = { park: 'loaf', bench: 'loaf', play: 'play', temple: 'pray', food: 'eat', market: 'shop', festival: 'festival' };
// which way people face there, standing (sitting, the seat says: Town.seatAt)
const HANGOUT_VIEW = { temple: 'back', market: 'back' };

const Census = {
  streets: {}, places: {}, posts: [], homes: [], taken: false,
  built(id) { return LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); },
  take() {
    if (this.taken) return; this.taken = true;
    const P = this.places, add = (o) => (P[o.id] = Object.assign({ spots: {}, tags: [] }, o));
    for (const id in LEVELS) this.built(id);
    // ---- the streets: each open level, its ground and its way out of the band
    for (const id in LEVELS) {
      const D = LEVELS[id]; if (D.meters === undefined || D.hidden) continue; // (the hubs too: Old Town, the Works, the Bowels, the Spires)
      const L = this.built(id), t = L.props.find((p) => p.kind === 'transit');
      this.streets[id] = { id, band: Travel.band(id), G: L.ground, w: L.w, transit: t ? t.x : 70 };
    }
    // where each street sits in its band's row, walking west to east (none: a hub, reached by transit)
    for (const id in this.streets) { const row = Travel.row(this.streets[id].band); this.streets[id].row = row.indexOf(id); }
    // ---- the rooms: hidden levels reached by a door on a street, with their spots
    for (const sid in this.streets) for (const p of this.built(sid).props) {
      if (p.kind !== 'door' || !p.to || !LEVELS[p.to[0]] || !LEVELS[p.to[0]].hidden) continue;
      const rid = p.to[0], R = this.built(rid), out = R.props.find((q) => q.kind === 'door' && q.out);
      if (!out) continue;
      const tp = Object.values(TOWN_PLACE).find((t) => t.level === rid) || {};
      const room = add({ id: rid, kind: 'room', level: rid, street: sid, x: p.x, y: this.streets[sid].G, inside: out.x, G: out.y, label: LEVELS[rid].name, hours: p.hours, depth: tp.depth, view: tp.view });
      for (const act in tp.spots || {}) room.spots[act] = tp.spots[act].map((x) => ({ x, y: out.y - (TOWN_POSE[act] === 'sit' && !(tp.depth && tp.depth[act] && tp.depth[act].back) ? 2 : 0) }));
    }
    // ---- the people the levels were built with: posts, spots, or gone
    for (const lid in LEVELS) {
      const L = this.built(lid), street = this.streets[lid] ? lid : P[lid] ? P[lid].street : null;
      if (!street) continue; // (the basement: nobody lives or works there but you)
      const keep = [];
      for (const def of L.npcs) {
        const title = def.title || '', key = POST_KIND[def.name] ? def.name : title || def.name;
        if (CROWD_TITLES.includes(title)) continue; // (the passers-by go)
        if (def.role === 'noodles' || def.keep || !street) { keep.push(def); continue; }
        const sched = def.sched.find((e) => e[3] !== 'away') || def.sched[0], x = Math.round(sched[2]), y = def.y;
        const pos = { x, y, behind: !!def.behind, lift: def.lift || 0, back: def.view === 'back', face: def.face || 0 };
        const spotAct = POST_SPOT[title] || POST_REGULAR[def.name];
        if (spotAct && !POST_LIVES[key]) {
          // a spot where residents do what this person was doing (a room's spots, or a spot in the open)
          if (P[lid] && P[lid].kind === 'room') (P[lid].spots[spotAct] = P[lid].spots[spotAct] || []).push(pos);
          else { const s = this.spotAt(lid, x, y, spotAct); s.spots[spotAct].push(pos); }
          if (POST_REGULAR[def.name]) this.posts.push({ regular: true, place: P[lid] && P[lid].kind === 'room' ? lid : this.spotAt(lid, x, y, spotAct).id, act: spotAct, name: def.name, look: def.look, lines: def.lines, level: lid });
          continue;
        }
        // a post: somewhere a job is done, by shifts
        const kind = def.role === 'vendor' || def.role === 'parts' ? 'trade' : POST_KIND[key] || 'stall';
        const inRoom = P[lid] && P[lid].kind === 'room';
        // (someone with a name of their own: their work in a word, and their stall or post)
        const word = title || (def.stall && STALL_NAMES[def.stall] ? STALL_NAMES[def.stall].toLowerCase() : POST_WORD[kind] || 'stallholder');
        const place = inRoom ? P[lid] : add({ id: 'post:' + lid + ':' + x, kind: 'spot', level: lid, street: lid, x, y: this.streets[lid].G, label: title ? title[0].toUpperCase() + title.slice(1) : def.name + '\'s ' + (def.stall || kind === 'stall' || kind === 'food' || kind === 'trade' ? 'stall' : 'post') });
        (place.spots.work = place.spots.work || []).push(pos); if (!place.tags.includes('do:work')) place.tags.push('do:work');
        // (half the food stalls keep night hours; the named engineers' plants run round the clock, the hands' by day)
        const shifts = kind === 'food' && hash(x, lid.length, 63) < 0.4 ? POST_SHIFTS.foodnight : kind === 'plant' && title ? POST_SHIFTS.hand : POST_SHIFTS[kind];
        const post = { id: 'job:' + lid + ':' + x, place: place.id, kind, shifts, name: def.name, title: word, proper: !title, look: def.look, lines: def.lines, role: def.role, rate: def.rate, stock: def.stock, stall: def.stall, smoke: def.smoke, level: lid, x, lives: !!POST_LIVES[key], pos };
        if (place.kind === 'spot' && (STALL_FOOD.includes(def.stall) || kind === 'canteen')) place.tags.push('food');
        this.posts.push(post);
      }
      L.npcs = keep;
    }
    // ---- doors: homes, and the doors the city goes in and out of
    for (const sid in this.streets) {
      const L = this.built(sid), G = this.streets[sid].G;
      const roomDoors = L.props.filter((p) => p.kind === 'door' && p.to).map((p) => p.x);
      for (const h of L.homes) {
        if (roomDoors.some((x) => Math.abs(x - h.x) < 30)) { L.props.splice(L.props.indexOf(h.door), 1); continue; } // (a room's door is there already)
        const pl = add({ id: 'home:' + sid + ':' + h.x, kind: 'door', level: null, street: sid, x: h.x, y: G, home: h.kind, n: h.n, label: h.door.label, tags: ['home'], door: h.door });
        h.door.place = pl.id; this.homes.push(pl);
      }
      for (const a of L.amens) {
        if (roomDoors.some((x) => Math.abs(x - a.x) < 40) || L.homes.some((h) => h.door.place && Math.abs(h.x - a.x) < 4)) { L.props.splice(L.props.indexOf(a.door), 1); continue; }
        const A = AMEN[a.kind] || { staff: 1, act: null, tags: [] };
        const pl = add({ id: 'amen:' + sid + ':' + a.x, kind: 'door', level: null, street: sid, x: a.x, y: G, amen: a.kind, label: a.label, hours: a.hours, tags: A.tags.concat(['do:work']), act: A.act, door: a.door });
        a.door.place = pl.id;
        // its staff: people per shift, the shifts from its hours
        // (a shop, a bar, a bath keeps one shift over its hours; the hospital and the hotel never close)
        const staff = a.staff || A.staff, shifts = AMEN_DAY.includes(a.kind) ? [[8, 17]] : AMEN_ROUND.includes(a.kind) ? [[8, 20], [20, 8]] : [a.hours || [9, 19]];
        for (let k = 0; k < staff; k++) this.posts.push({ id: 'job:' + pl.id + ':' + k, place: pl.id, kind: a.kind, shifts, title: AMEN_TITLE[a.kind] || 'staff', level: sid, x: a.x, weekdays: a.kind === 'office' || a.kind === 'school' });
      }
      for (const g of L.hangouts) {
        const act = HANGOUT_ACT[g.kind] || 'loaf', s = this.spotAt(sid, g.x, g.y, act, g.kind);
        for (let k = 0; k < g.n; k++) s.spots[act].push({ x: g.x + (k - (g.n - 1) / 2) * (act === 'play' ? 22 : 12), y: g.y, face: k % 2 ? -1 : 1, view: HANGOUT_VIEW[g.kind] }); // (children need room to run about)
      }
    }
    // somewhere to play on every street with homes on it, if its builder gave none
    for (const sid in this.streets) {
      if (!this.homes.some((h) => h.street === sid) || Object.values(P).some((p) => p.street === sid && p.spots.play)) continue;
      const G = this.streets[sid].G, spots = (this.built(sid).spots || []).filter((q) => q[1] === G);
      if (!spots.length) continue;
      const [x] = spots[Math.floor(spots.length / 2)], pl = this.spotAt(sid, x, G, 'play');
      for (let k = 0; k < 3; k++) pl.spots.play.push({ x: x + (k - 1) * 22, y: G, face: k % 2 ? -1 : 1 });
    }
    // the tags each place gets from what's done there
    for (const id in P) { const pl = P[id]; for (const act in pl.spots) if (ACT_TAG[act] && !pl.tags.includes(ACT_TAG[act])) pl.tags.push(ACT_TAG[act]); }
  },
  // a spot in the open at x on a level, for an activity (made the first time)
  spotAt(lid, x, y, act, kind) {
    const id = 'spot:' + lid + ':' + act + ':' + Math.round(x / 40), P = this.places;
    if (!P[id]) P[id] = { id, kind: 'spot', level: lid, street: lid, x, y: this.streets[lid] ? this.streets[lid].G : y, spots: {}, tags: [], label: SPOT_LABEL[kind || act] || act };
    P[id].spots[act] = P[id].spots[act] || [];
    return P[id];
  },
  // a place's hours as shifts: one under 11 hours, two under 17, else three
  shiftsFor(h) {
    if (!h) return [[8, 17]];
    const [a, b] = h, len = (b - a + 24) % 24 || 24, w = (x) => ((x % 24) + 24) % 24;
    if (len <= 11) return [[a, b]];
    if (len <= 17) { const m = w(a + Math.round(len / 2)); return [[a, m], [m, b]]; }
    return [[6, 14], [14, 22], [22, 6]];
  },
  // what a door is called on the map: who lives there, or what it is
  mapLabel(p) {
    const pl = this.places[p.place]; if (!pl) return p.label || 'Door';
    if (!pl.home) return pl.label;
    const hh = Folk.householdsAt(pl.id); if (!hh.length) return pl.label + ' · empty';
    const named = Known.door(pl, hh, true); if (named !== null) return named; // (who lives there, once you know them: known.js)
    return hh.length === 1 ? hh[0].label : `${pl.label} · ${hh.length} homes`;
  },
  // what a door says, and what knocking on it does (who lives there, once you know them)
  doorText(p) {
    const pl = this.places[p.place];
    if (!pl) return p.label || 'A door';
    if (pl.home) { const hh = Folk.householdsAt(pl.id), named = hh.length ? Known.door(pl, hh) : null; if (named !== null) return named; return (hh.length === 1 ? hh[0].label : pl.label + (hh.length ? ` · ${hh.length} homes` : '')); }
    const open = !pl.hours || Props.openNow(pl.hours), n = Folk.inside(pl.id);
    return pl.label + (open ? (n ? ` · ${n} inside` : ' · open') : ` · shut till ${String(pl.hours[0]).padStart(2, '0')}:00`);
  },
  doorUse(p) {
    const pl = this.places[p.place];
    if (!pl) return 'Nobody answers.';
    if (pl.home) { const hh = Folk.householdsAt(pl.id), inside = Folk.inside(pl.id); return inside ? 'Somebody\'s home. Nobody answers a stranger\'s knock.' : hh.length ? 'Nobody\'s home.' : 'Empty. Nobody lives here now.'; }
    if (pl.hours && !Props.openNow(pl.hours)) return `${pl.label} is shut. It opens at ${String(pl.hours[0]).padStart(2, '0')}:00.`;
    return AMEN_LOOK[pl.amen] || 'You look in. Nobody here needs anything fixed.';
  },
};
const ACT_TAG = { eat: 'food', drink: 'social', dance: 'fun', pachi: 'fun', watch: 'fun', arcade: 'fun', festival: 'fun', loaf: 'outdoors', play: 'play', pray: 'faith', clinic: 'clinic', shop: 'shop', bathe: 'fun' };
const SPOT_LABEL = { park: 'A park bench', bench: 'A bench', play: 'Somewhere to play', temple: 'The temple steps', food: 'A stall counter', market: 'A stall', festival: 'The festival', loaf: 'A corner', clinic: 'The clinic line', eat: 'Somewhere to eat', pray: 'Somewhere to pray' };
const AMEN_TITLE = { eatery: 'cook', bar: 'bartender', club: 'door and bar', pachinko: 'floor hand', arcade: 'arcade hand', shop: 'shopkeeper', clinic: 'clinic nurse', temple: 'temple keeper', office: 'office worker', theater: 'usher', bath: 'bath attendant', school: 'teacher', hospital: 'nurse', depot: 'depot hand', hotel: 'hotel hand', laundry: 'laundry hand' };
const AMEN_LOOK = {
  eatery: 'Steam, a counter, somebody eating with their head down. They don\'t serve tinkers in work clothes.', bar: 'Low light and a long counter. Nothing in there\'s broken that you could fix.', club: 'The bass comes through the door before you open it.',
  pachinko: 'Rows of machines and a wall of noise.', arcade: 'Screens and the clatter of buttons.', shop: 'Shelves and a counter. The keeper watches your hands.', clinic: 'A waiting room. Everybody in it looks at you, then away.',
  temple: 'Incense and quiet.', office: 'A lobby and a guard who doesn\'t look up. Staff only.', theater: 'The ticket hall. The picture\'s through the curtain.', bath: 'Steam, tile, the slap of sandals. Not now.',
  school: 'Children\'s voices and a teacher\'s over them. Not a place for you.', hospital: 'Strip light and the smell of disinfectant. Staff only past the desk.', depot: 'Crates and a loading bay. Staff only.', hotel: 'A lobby with a doorman. You\'re not dressed for it.', laundry: 'Machines turning and someone folding.',
};
