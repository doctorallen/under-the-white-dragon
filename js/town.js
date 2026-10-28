'use strict';
// ---------------------------------------------------------------------------
// The people who live on the White Dragon's block. Each has a home in the
// flats (or somewhere off the block), a job, friends, and a day: sleep, get up,
// go to work, buy groceries, eat at the White Dragon, visit a neighbour, walk
// somewhere with a friend, go home. Nobody wanders: everyone is on their way
// to something.
//
// Their minds are Tyrell's (city.js): it keeps their days as routines, lets
// needs bend them, remembers, and saves them. Without the engine, where a
// person is comes from the clock alone: their plan says when they set out for each thing, the route
// goes out of one place's door, along the street and in at another's (up the
// stairs, in the flats), and they walk it at a walking pace from the moment
// they set out. So whenever you walk into the grocery, the people whose errand
// it is are in there, mid-errand. Town.sync puts whoever is in the place
// you're in among the people (Actors.npcs, def.town) and moves them, and
// Town.chatter has them talk: greetings in passing, small talk over noodles
// and at a neighbour's table, the till.
// ---------------------------------------------------------------------------
const PXH = 1300; // pixels walked in a game hour (26 px a second, 50 seconds an hour)
// the places, the level each is in, its door on the street and the door inside
// (a place on another street names it; `spots` are where people sit or stand
// in there, by what they're doing)
const TOWN_PLACE = {
  street: { level: 'd_dragon' },
  noodles: { level: 'd_noodles', door: 424, inside: 340 },
  grocery: { level: 'd_grocery', door: 216, inside: 114 },
  flats: { level: 'd_flats', door: 1041, inside: 86 },
  izakaya: { level: 'd_izakaya', street: 'd_neonrow', door: 355, inside: 140, spots: { drink: [450, 390], work: [380] } },
  menagerie: { level: 'd_menagerie', street: 'd_neonrow', door: 652, inside: 290, spots: { browse: [120, 160, 350, 410], work: [214] } },
  pachinko: { level: 'd_pachinko', street: 'd_neonrow', door: 1050, inside: 320, spots: { pachi: [104, 200, 448, 520], work: [260] } },
  cinema: { level: 'd_cinema', street: 'd_neonrow', door: 1365, inside: 110, spots: { watch: [440, 500, 540, 584], work: [210] } },
  coil: { level: 'd_coil', street: 'd_neonrow', door: 2065, inside: 120, spots: { work: [600] } },
  shrine: { level: 'd_shrine', street: 'd_neonrow', door: 2600, inside: 370, spots: { pray: [200, 240], work: [326] } },
};
const TOWN_GAP = 0.3; // game hours to cross a street between two you can see someone on (off screen)
// a street's ends, out to the next street or the rest of the city
function townEnd(street, side) { const L = LEVELS[street].built || (LEVELS[street].built = LEVELS[street].make()); return side === 'west' ? 18 : L.w - 18; }
const NOODLE_SEAT = [144, 214, 284, 400, 450, 500, 550];
const SHELF = [175, 259, 335, 392, 424]; // the grocery's shelves and fridges
// what they're up to, in a word, for their poses: sit, work (hands busy) or stand
const TOWN_POSE = { eat: 'sit', home: 'sit', visit: 'sit', host: 'sit', work: 'work', browse: 'work', stock: 'work', sweep: 'work', pay: 'stand', play: 'stand', sleep: 'stand', drink: 'sit', pachi: 'sit', watch: 'sit', pray: 'stand', eat_home: 'sit' };

// The residents. `plan`: [hour they set out, where, what, extra]. `where` is
// home, visit:<id>, noodles, grocery, street (with an x), or away:east/west
// (off to the rest of the city). `shop` expands into a few shelves and the
// till. `with` walks a step behind a friend going the same way.
const RESIDENTS = {
  okonkwo: { name: 'Mr Okonkwo', home: 'A', seat: 3, look: { skin: SKINS[5], hair: 'bald', top: '#3a4a3a', coat: 'jacket', legs: '#2a2a2a' }, who: 'retired, a widower, forty years on the pumps',
    plan: [[0, 'home', 'sleep'], [7, 'home', 'home'], [9.5, 'grocery', 'shop'], [11, 'home', 'home'], [14.4, 'visit:sato', 'visit'], [16.6, 'home', 'home'], [18.4, 'noodles', 'eat'], [20.3, 'izakaya', 'drink'], [22.6, 'home', 'sleep']],
    say: { shop: 'Rice, ginger, and whatever Mo says is fresh. He lies, but nicely.', eat: 'Six o\'clock, the White Dragon. Every day since my wife.', drink: 'One cup of Ueda\'s sake. One. Then home.', visit: 'Mrs Sato and I play go. She cheats. I let her.', home: 'Forty years on the pumps. Now I listen to them through the floor.', walk: 'Mind out, young one.' } },
  sato: { name: 'Mrs Sato', home: 'B', seat: 4, look: { skin: SKINS[0], hair: 'bun', hairCol: '#d8d8d8', top: '#6a3a5a', coat: 'long', legs: '#2a2030', tall: 0.9 }, who: 'retired, keeps a shrine, plays go',
    plan: [[0, 'home', 'sleep'], [6.5, 'home', 'home'], [8, 'away:west', 'temple'], [10, 'home', 'home'], [11.6, 'grocery', 'shop'], [13.2, 'home', 'home'], [14.3, 'home', 'host'], [16.7, 'home', 'home'], [18.6, 'noodles', 'eat', { with: 'okonkwo' }], [21.2, 'home', 'home', { with: 'okonkwo' }], [22.5, 'home', 'sleep']],
    say: { shop: 'Plums, if Mo has them. He never has them.', eat: 'Mr Okonkwo walks me down. He says it\'s for my sake.', host: 'Sit, sit. He\'s late. He\'s always late.', temple: 'To the temple, to light one for my brother.', home: 'The shrine wants fresh water every day. So do I.' } },
  teo: { name: 'Teo', home: 'C', seat: 1, look: { skin: SKINS[3], hair: 'mohawk', hairCol: '#ff4ab0', hairGlow: true, top: '#1a1a1a', coat: 'jacket', legs: '#2a1a2a' }, who: 'line cook at a Glasshouse hotel',
    plan: [[0, 'home', 'sleep'], [7, 'home', 'home'], [8.5, 'away:east', 'work'], [17.5, 'grocery', 'shop'], [18.6, 'noodles', 'eat'], [20.5, 'cinema', 'watch']],
    say: { work: 'Ten hours making food for people who don\'t eat it.', shop: 'Ines wants the good soy. The good soy is twice the price.', eat: 'I cook all day. I don\'t cook at night.', home: 'Ines picks the shows. I fall asleep in them.', watch: 'The Orpheum, the late picture. I sleep, she watches.' } },
  ines: { name: 'Ines', home: 'C', seat: 2, look: { skin: SKINS[1], hair: 'short', hairCol: '#2a1a14', top: '#3a5a7a', legs: '#2a2a3a' }, who: 'sorts parcels at the Docks',
    plan: [[0, 'home', 'sleep', { with: 'teo' }], [7, 'home', 'home'], [8.5, 'away:east', 'work', { with: 'teo' }], [17.5, 'grocery', 'shop', { with: 'teo' }], [18.6, 'noodles', 'eat', { with: 'teo' }], [20.5, 'cinema', 'watch', { with: 'teo' }]],
    say: { work: 'Nine hours of other people\'s parcels. Some of them tick.', shop: 'The good soy. Don\'t let him talk you out of it.', eat: 'Date night. It\'s always noodles. I don\'t mind.', home: 'Teo\'s asleep before the titles.', watch: 'Shh. It\'s the good bit.' } },
  rina: { name: 'Rina', home: 'D', seat: 6, look: { skin: SKINS[2], hair: 'bun', hairCol: '#1a1414', top: '#7ae8d8', legs: '#3a4a4a' }, who: 'night nurse at the Mercy, Kai\'s mum',
    plan: [[0, 'away:east', 'work'], [7.4, 'home', 'home'], [8.2, 'home', 'sleep'], [15, 'home', 'home'], [16, 'grocery', 'shop'], [17.2, 'home', 'home'], [18.6, 'away:east', 'work']],
    say: { work: 'Night shift at the Mercy. Lin feeds Kai. I owe that woman everything.', shop: 'Milk, bread, whatever Kai\'s decided he eats this week.', home: 'Two hours with my boy, then back on shift.' } },
  kai: { name: 'Kai', home: 'D', seat: 6, look: { skin: SKINS[2], hair: 'cap', capCol: '#3aff80', top: '#ff8a20', legs: '#2a2a3a', tall: 0.72 }, who: 'eleven, Rina\'s boy, wants a drone',
    plan: [[0, 'home', 'sleep'], [7, 'home', 'home'], [8, 'away:west', 'school'], [15.4, 'home', 'home'], [16, 'menagerie', 'browse'], [18.4, 'noodles', 'eat'], [21, 'home', 'home'], [21.7, 'home', 'sleep']],
    say: { school: 'School. Boring. Do you fix drones? Can you make one fly?', play: 'I\'m waiting for the drones to go over. Sometimes one drops something.', browse: 'There\'s a dog here that bites synths. I want it.', eat: 'Auntie Lin says I have to finish the broth.', home: 'Mum\'s on nights. I\'m allowed the screen till nine.' } },
  dara: { name: 'Dara', home: 'E', seat: 0, look: { skin: SKINS[4], hair: 'cap', capCol: '#ff8a20', top: '#2a2a3a', legs: '#2a2a34' }, who: 'bike courier',
    plan: [[0, 'home', 'sleep'], [8, 'home', 'home'], [9.5, 'away:west', 'work'], [13, 'noodles', 'eat'], [14, 'away:west', 'work'], [19.2, 'noodles', 'eat'], [20.2, 'pachinko', 'pachi']],
    say: { work: 'Forty drops today. My knees are older than me.', eat: 'Lunch is noodles. Dinner is noodles. Ask me why I\'m fast.', pachi: 'Lucky Seven owes me a week\'s wages. I\'m collecting.', home: 'Bike\'s busted. Again.' } },
  mo: { name: 'Mo', job: 'grocery', look: { skin: SKINS[1], hair: 'short', hairCol: '#5a3a1a', top: '#e8e0d0', apron: '#2a6a3a', legs: '#2a2a2a', wide: 1 }, who: 'keeps the grocery, lives out past the canal',
    plan: [[0, 'away:east', 'home'], [6.3, 'grocery', 'work'], [20.1, 'away:east', 'home']],
    say: { work: 'Fresh today. Mostly today. Today-ish.', home: 'Twenty minutes on the train, and the train\'s always late.' } },
  jun: { name: 'Jun', job: 'grocery', look: { skin: SKINS[0], hair: 'hood', top: '#3a3a5a', legs: '#2a2a2a' }, who: 'the night clerk, studying',
    plan: [[0, 'grocery', 'work'], [7.7, 'away:west', 'home'], [19.4, 'grocery', 'stock'], [20.15, 'grocery', 'work']],
    say: { work: 'Graveyard shift. I study between customers. I fail between customers too.', stock: 'Stock the shelves, then Mo goes home, then it\'s me and the hum of the fridges.', home: 'Sleep. Lectures. Sleep.' } },
  sal: { name: 'Sal', seat: 6, look: { skin: SKINS[4], hair: 'mohawk', hairCol: '#3af0e0', hairGlow: true, top: '#1a1a1e', legs: '#2a1a1e', cyArm: true }, who: 'a ganger, off duty',
    plan: [[3, 'away:west@d_neonrow', 'home'], [18.2, 'noodles', 'eat'], [20.6, 'pachinko', 'pachi']],
    say: { eat: 'Even we eat. Not here for trouble.', home: 'Places to be.', pachi: 'Don\'t stand behind me. Bad luck.' } },
  wen: { name: 'Old Wen', look: { skin: SKINS[3], hair: 'bald', top: '#5a6a3a', legs: '#3a3a2a', tall: 0.92 }, who: 'sweeps the street for the block association',
    plan: [[0, 'away:west', 'home'], [6, 'street', 'sweep', { x: 360 }], [6.8, 'street', 'sweep', { x: 760 }], [7.6, 'street', 'sweep', { x: 1180 }], [8.4, 'away:west', 'home'], [17, 'street', 'sweep', { x: 520 }], [17.8, 'street', 'sweep', { x: 980 }], [18.6, 'away:west', 'home']],
    say: { sweep: 'Somebody has to. Nobody else is somebody.', home: 'Home for tea.' } },
  // the people who work on Neon Row: in from the Row's ends, and home again
  ueda: { name: 'Master Ueda', job: 'izakaya', look: { skin: SKINS[0], hair: 'short', hairCol: '#c8c8c8', top: '#e8e0d0', apron: '#1a1a2a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, who: 'keeps the Red Lantern',
    plan: [[0, 'izakaya', 'work'], [2.5, 'away:west@d_neonrow', 'home'], [16.2, 'izakaya', 'work']],
    say: { work: 'Sit, sit. Sake or beer. Nothing else here is honest.', home: 'Home. The lanterns can light themselves.' } },
  mina: { name: 'Mina', job: 'menagerie', look: { skin: SKINS[3], hair: 'bun', hairCol: '#3a2418', top: '#3a5a4a', apron: '#2a3a30', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, who: 'runs the Menagerie while Lio talks to the owl',
    plan: [[0, 'away:west@d_neonrow', 'home'], [9.4, 'menagerie', 'work'], [20.3, 'away:west@d_neonrow', 'home']],
    say: { work: 'Don\'t tap the glass. The fish are real. Mostly.', home: 'Feeding time\'s done. I\'m done.' } },
  goro: { name: 'Goro', job: 'pachinko', look: { skin: SKINS[5], hair: 'short', top: '#1a1a1a', coat: 'jacket', legs: '#1a1a1a' }, who: 'the floor man at Lucky Seven',
    plan: [[0, 'pachinko', 'work'], [1.2, 'away:east@d_neonrow', 'home'], [9.6, 'pachinko', 'work']],
    say: { work: 'Play or move along. That machine\'s hot. Don\'t touch it.', home: 'Fourteen hours of bells. Home to silence.' } },
  pip: { name: 'Pip', job: 'cinema', look: { skin: SKINS[2], hair: 'cap', capCol: '#c83a2a', top: '#8a1a24', legs: '#1a1a1a', hands: { fx: 26, fy: 38 } }, who: 'the Orpheum\'s usher and projectionist both',
    plan: [[0, 'cinema', 'work'], [0.6, 'away:west@d_neonrow', 'home'], [15.4, 'cinema', 'work']],
    say: { work: 'Tonight: "Rain on Glass". It\'s about rain. On glass.', home: 'Last reel\'s done. So am I.' } },
  vin: { name: 'Vin', job: 'coil', look: { skin: SKINS[5], hair: 'bald', top: '#1a1a1a', legs: '#1a1a1a', hands: { fx: 26, fy: 38 } }, who: 'pours at the Coil',
    plan: [[0, 'coil', 'work'], [5, 'away:east@d_neonrow', 'home'], [20.4, 'coil', 'work']],
    say: { work: 'What\'ll it be. Don\'t say water.', home: 'Sun\'s coming. I\'m going.' } },
  hana: { name: 'Keeper Hana', job: 'shrine', look: { skin: SKINS[0], hair: 'long', hairCol: '#1a1414', top: '#e8e4dc', legs: '#a82a24' }, who: 'keeps the fox shrine',
    plan: [[0, 'away:east@d_neonrow', 'home'], [5.6, 'shrine', 'work'], [19.4, 'away:east@d_neonrow', 'home']],
    say: { work: 'People wish for the same three things. Money, love, a way out.', home: 'The fox keeps the night shift.' } },
};
const TOWN_ORDER = Object.keys(RESIDENTS);

// what anyone might say, by what they're doing, when you stop them
const TOWN_GOING = {
  home: 'Home. My feet have opinions.', sleep: 'Bed.', shop: 'To Mo\'s, before I forget what for.', eat: 'Noodles. Lin\'s, where else?', work: 'Work. Don\'t make me late.',
  visit: 'Visiting. Don\'t keep me.', drink: 'One drink at the Red Lantern.', pachi: 'Lucky Seven. Don\'t judge me.', watch: 'The pictures, at the Orpheum.', browse: 'The pet shop!', pray: 'To the shrine.', temple: 'To the temple.', school: 'School. Ugh.', play: 'Out.', sweep: 'Next stretch of street.', stock: 'Shift\'s starting.',
};
// small talk: for any two neighbours, and for some, their own
const TOWN_SMALL = [
  ['Did you hear the drone go over last night?', 'Three of them. Low. Looking for somebody.'],
  ['Lift\'s broken in Kessler again.', 'Lift\'s broken everywhere.'],
  ['Rain\'s not stopping.', 'Rain\'s never stopping.'],
  ['Lin put the price up.', 'Lin put the portions up too. Don\'t complain.'],
  ['You look tired.', 'I am tired. Everyone\'s tired.'],
  ['Meridian\'s hiring at the Spires.', 'Meridian\'s always hiring. Nobody comes back down.'],
];
const TOWN_PAIR = {
  'okonkwo:sato': [['Your move.', 'I moved. You were asleep.'], ['Black stones today.', 'You always want black.'], ['My knee says rain.', 'Your knee always says rain.']],
  'ines:teo': [['Good soy?', 'Good soy.'], ['Long day?', 'Long day.'], ['We should go up to the Gardens one weekend.', 'We should.']],
  'dara:teo': [['You watching the race?', 'I\'m watching the snacks.'], ['Bike\'s busted again.', 'Bring it to the basement guy. Lin knows him.']],
  'jun:mo': [['Count the till twice.', 'I always count it twice.'], ['Night, Mo.', 'Night. Don\'t let anyone steal the plums.']],
};
// what people say once your work's out in the street
function townNews() {
  const out = [];
  if (Game.flag('ozzy:rides')) out.push(['Ozzy\'s cab is flying again.', 'Some fixer sorted it. Down here, someone said.']);
  if (Game.flag('vey:schematic')) out.push(['That girl with the arm\'s been about.', 'Walks like nothing\'s wrong now.']);
  if (Game.s.heat >= 40) out.push(['A detective was asking about the White Dragon.', 'Asking what? Lin\'s noodles?'], ['Somebody\'s been noticed round here.', 'Not me. I\'m never noticed.']);
  return out;
}

const Town = {
  plans: null, said: {}, lastAct: {}, greeted: {}, chatT: 0,
  // ---- the plans, made walkable: every errand expanded, every departure after
  // the last arrival
  init() {
    this.plans = {};
    for (const id of TOWN_ORDER) {
      const R = RESIDENTS[id], out = [];
      for (const [h, at, act, o = {}] of R.plan) {
        if (act === 'shop') { const s = Math.floor(hash(id.length, h * 10, 7) * 3); out.push({ h, at: 'grocery', act: 'browse', x: SHELF[s], o }); out.push({ h: h + 0.3, at: 'grocery', act: 'browse', x: SHELF[s + 2], o, after: true }); out.push({ h: h + 0.5, at: 'grocery', act: 'pay', x: 470, o, after: true }); }
        else out.push({ h, at, act, x: o.x, o });
      }
      // a sub-step of an errand starts once you're there, not before
      // and nothing sets out before the last thing's done: errands that run
      // long push the rest of the day back a little
      for (let i = 0; i < out.length; i++) {
        const e = out[i], prev = out[(i - 1 + out.length) % out.length];
        if (i > 0) e.h = Math.min(23.95, Math.max(e.h, prev.arrive + (e.act === 'pay' ? 0.12 : e.after ? 0.18 : 0.08)));
        e.arrive = e.h + this.length(this.route(this.point(id, prev), this.point(id, e))) / PXH;
      }
      this.plans[id] = out;
    }
  },
  // where a step of the plan puts them: a place, an x and y there
  point(id, e) {
    const R = RESIDENTS[id];
    if (e.at.startsWith('away')) { const [side, street = 'd_dragon'] = e.at.split(':')[1].split('@'); return { place: 'away', side, street, x: townEnd(street, side) }; }
    const TP = TOWN_PLACE[e.at]; if (TP && TP.spots) { const xs = TP.spots[e.act] || TP.spots.work, i = Math.floor(hash(id.length * 7 + id.charCodeAt(0), e.act.length, 9) * xs.length); return { place: e.at, x: xs[i], y: BK.G }; }
    if (e.at === 'street') return { place: 'street', x: e.x, y: BK.G };
    if (e.at === 'noodles') return { place: 'noodles', x: NOODLE_SEAT[R.seat === undefined ? 5 : R.seat], y: BK.G - 2 };
    if (e.at === 'grocery') return { place: 'grocery', x: e.act === 'work' ? 488 : e.act === 'stock' ? SHELF[1] + 6 : e.x, y: BK.G };
    const home = e.at === 'home' ? R.home : RESIDENTS[e.at.split(':')[1]].home, F = FLATS[home];
    const twin = TOWN_ORDER.filter((q) => RESIDENTS[q].home === home).indexOf(id);
    if (e.act === 'sleep') return { place: 'flats', flat: home, x: F.bed + (twin > 0 ? (home === 'C' ? 36 : -36) : 0), y: F.y };
    return { place: 'flats', flat: home, x: F.table + (e.at === 'home' ? (twin > 0 ? 12 : -12) : 14), y: F.y };
  },
  // inside the flats: across a floor, or by the stairs between floors
  inFlats(a, b) {
    if (a.y === b.y) return [a, b];
    const lo = { x: FLAT_STAIRS.x0, y: BK.G }, hi = { x: FLAT_STAIRS.x1, y: BK.F1 };
    return a.y === BK.G ? [a, lo, hi, b] : [a, hi, lo, b];
  },
  inside(place, a, b) { return place === 'flats' ? this.inFlats(a, b) : [a, b]; },
  // the way from one point to the next: legs, each in one level
  route(a, b) {
    const legs = [], P = TOWN_PLACE, door = (q) => (q.place === 'away' ? q.x : q.place === 'street' ? q.x : P[q.place].door);
    const street = (q) => (q.place === 'away' ? q.street : P[q.place].street || 'd_dragon');
    if (a.place === b.place && a.place !== 'away') { if (a.place !== 'street' || a.x !== b.x) legs.push({ level: P[a.place].level, pts: this.inside(a.place, a, b) }); return legs; }
    if (a.place === 'away' && b.place === 'away') return legs;
    if (a.place !== 'away' && a.place !== 'street') legs.push({ level: P[a.place].level, pts: this.inside(a.place, a, { x: P[a.place].inside, y: BK.G }) });
    const sa = street(a), sb = street(b);
    if (sa === sb) legs.push({ level: sa, pts: [{ x: door(a), y: BK.G }, { x: door(b), y: BK.G }] });
    else {
      // along to the end of this street, along (or past) the ones between, on from the end of that one
      const row = Travel.row(Travel.band(sa)), ia = row.indexOf(sa), ib = row.indexOf(sb), dir = ib > ia ? 'east' : 'west', back = dir === 'east' ? 'west' : 'east';
      legs.push({ level: sa, pts: [{ x: door(a), y: BK.G }, { x: townEnd(sa, dir), y: BK.G }] });
      legs.push({ level: null, len: TOWN_GAP * PXH * Math.max(1, Math.abs(ib - ia)) });
      legs.push({ level: sb, pts: [{ x: townEnd(sb, back), y: BK.G }, { x: door(b), y: BK.G }] });
    }
    if (b.place !== 'away' && b.place !== 'street') legs.push({ level: P[b.place].level, pts: this.inside(b.place, { x: P[b.place].inside, y: BK.G }, b) });
    return legs;
  },
  length(legs) { let n = 0; for (const L of legs) if (L.len) n += L.len; else for (let i = 1; i < L.pts.length; i++) n += Math.hypot(L.pts[i].x - L.pts[i - 1].x, L.pts[i].y - L.pts[i - 1].y); return n; },
  // where someone is: from Tyrell's minds when the engine's there (city.js),
  // otherwise from the clock alone
  state(id, hour) { return City.on ? City.state(id) : this.clockState(id, hour); },
  // where someone is at an hour, by the clock: walking a leg, or there and at it
  clockState(id, hour) {
    const plan = this.plans[id], n = plan.length;
    let i = n - 1; for (let k = 0; k < n; k++) if (plan[k].h <= hour) i = k;
    const e = plan[i], prev = plan[(i - 1 + n) % n], a = this.point(id, prev), b = this.point(id, e);
    let d = (((hour - e.h) % 24) + 24) % 24 * PXH - (e.o.with ? 16 : 0);
    if (d < 0) d = 0;
    for (const L of this.route(a, b)) {
      if (L.len) { if (d < L.len) return { level: null, moving: true, act: e.act, e, to: b }; d -= L.len; continue; } // (off between streets)
      for (let k = 1; k < L.pts.length; k++) {
        const p = L.pts[k - 1], q = L.pts[k], len = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < len) { const f = d / len; return { level: L.level, x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, moving: true, dir: Math.sign(q.x - p.x) || 1, act: e.act, e, to: b }; }
        d -= len;
      }
    }
    if (b.place === 'away') return { level: null, act: e.act, e };
    return { level: TOWN_PLACE[b.place].level, x: b.x, y: b.y, moving: false, act: e.act, e, flat: b.flat, hidden: e.act === 'sleep' };
  },
  // ---- the people here, now: in the level you're in, moved to where the clock says
  sync() {
    if (!World.L || !this.plans) return;
    City.sync(); // the minds keep up with the clock
    const here = World.L.id, hour = Game.hour();
    for (const id of TOWN_ORDER) {
      const R = RESIDENTS[id], st = this.state(id, hour), on = st.level === here && !st.hidden;
      let n = Actors.npcs.find((q) => q.def.town === id);
      if (!on) { if (n) Actors.npcs.splice(Actors.npcs.indexOf(n), 1); continue; }
      if (!n) { n = { def: { name: R.name, look: R.look, town: id, sched: [[0, 24, st.x, 'stand']], lines: [R.who] }, i: 120 + TOWN_ORDER.indexOf(id), x: st.x, y: st.y, face: st.dir || 1, hidden: false, tx: st.x, wt: 0, bubble: null, line: 0, art: new Map() }; Actors.npcs.push(n); if (!st.moving) this.lastAct[id] = st.act + st.e.h; } // (already there when you walk in: nothing to say about arriving)
      const dx = st.x - n.x;
      if (st.moving) { n.face = st.dir; n.walked = (n.walked || 0) + Math.abs(dx); }
      else if (st.act === 'eat') n.face = 1;
      else if (st.flat && TOWN_POSE[st.act] === 'sit') n.face = st.x > FLATS[st.flat].table ? -1 : 1;
      else if (st.act === 'work' && here === 'd_grocery') n.face = -1;
      else if (st.act === 'pay') n.face = 1;
      n.x = st.x; n.y = st.y; n.moving = st.moving; n.act = st.moving ? 'walk' : TOWN_POSE[st.act] || 'stand'; n.townState = st;
      // something said on getting there
      if (!st.moving && this.lastAct[id] !== st.act + st.e.h) { this.lastAct[id] = st.act + st.e.h; this.arrived(n, id, st); }
      if (st.moving) this.lastAct[id] = null;
    }
  },
  // on arriving: the till, the counter, a neighbour's door
  arrived(n, id, st) {
    const other = (pred) => Actors.npcs.find((q) => q !== n && pred(q));
    if (st.act === 'pay') { Actors.say(n, ['Just these.', 'And a bag, please.', 'Put it on my tab?'][Math.floor(hash(id.length, Game.s.day, 3) * 3)]); const clerk = other((q) => q.def.town && RESIDENTS[q.def.town].job === 'grocery'); if (clerk) setTimeout(() => Actors.say(clerk, ['Fourteen.', 'Nine-fifty. Call it nine.', 'No tabs. Fine. Tab.'][Math.floor(hash(id.length, Game.s.day, 4) * 3)]), 1300); }
    if (st.act === 'eat') { Actors.say(n, id === 'kai' ? 'Auntie Lin! I\'m starving.' : 'The usual, Lin.'); const lin = other((q) => q.def.name === 'Auntie Lin'); if (lin) setTimeout(() => Actors.say(lin, id === 'kai' ? 'Sit. Broth first.' : 'Sit.'), 1300); }
    if (st.act === 'drink') { Actors.say(n, 'The usual, Master.'); const m = other((q) => q.def.town === 'ueda'); if (m) setTimeout(() => Actors.say(m, 'One cup. I\'m counting.'), 1300); }
    if (st.act === 'visit') { const host = other((q) => q.def.town && this.state(q.def.town, Game.hour()).act !== 'sleep'); Actors.say(n, 'Only me.'); if (host) setTimeout(() => Actors.say(host, 'Come in, come in.'), 1200); }
  },
  // ---- talk: small talk at a table or a counter, greetings in passing
  chatter(dt) {
    City.speak(); // (what witnesses say, as it comes)
    this.chatT -= dt; if (this.chatT > 0) return; this.chatT = 1.5;
    const people = Actors.npcs.filter((n) => n.def.town && !n.hidden), day = Game.s.day;
    for (const n of people) for (const m of people) {
      if (n === m || n.def.town > m.def.town) continue;
      const a = n.def.town, b = m.def.town, key = a + ':' + b, d = Math.abs(n.x - m.x) + Math.abs(n.y - m.y);
      // passing in the street or a doorway: a greeting, once a day
      if (n.moving && m.moving && d < 18 && n.face !== m.face && this.greeted[key] !== day) { this.greeted[key] = day; const h = Game.hour(), tod = h >= 5 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Afternoon' : 'Evening'; Actors.say(n, tod + ', ' + RESIDENTS[b].name.replace(/^(Mr|Mrs|Old) /, '') + '.'); setTimeout(() => Actors.say(m, tod + '.'), 900); continue; }
      // side by side, both settled or walking together: now and then, a few words
      if (d < 70 && !n.bubble && !m.bubble && (n.moving === m.moving) && hash(Math.floor(Game.t / 1.5), a.length * 7 + b.length, 11) < 0.12) {
        const pool = (TOWN_PAIR[key] || []).concat(TOWN_SMALL, townNews(), townNews()), [l1, l2] = pool[Math.floor(hash(Math.floor(Game.t / 9), key.length, 12) * pool.length)];
        Actors.say(n, l1); setTimeout(() => { if (Actors.npcs.includes(m)) Actors.say(m, l2); }, 1600);
      }
    }
  },
  // when you stop someone: where they're going, or what they're at
  talkLine(n) {
    const id = n.def.town, R = RESIDENTS[id], st = n.townState || this.state(id, Game.hour());
    const remark = City.remark(id); if (remark) return remark; // (something they saw, heard or remember of you)
    if (st.moving) return (st.e.act === 'browse' || st.e.act === 'pay' ? R.say.shop : R.say[st.e.act]) || TOWN_GOING[st.e.act] || 'Busy. Sorry.';
    return (st.act === 'browse' || st.act === 'pay' ? R.say.shop : R.say[st.act]) || R.who;
  },
  talk(n) {
    City.did('talked', n.def.town); // (they know your face now)
    // something broken to ask you about, or something of theirs you've fixed: the talk panel
    if (Jobs.actionsFor(n.def.name).length) { n.face = Math.sign(Player.x - n.x) || n.face; Hud.toggle('talk', n); return; }
    const id = n.def.town, R = RESIDENTS[id], st = n.townState || this.state(id, Game.hour());
    const line = this.talkLine(n);
    // the clerk at the till sells you things
    if (R.job === 'grocery' && st.act === 'work' && !st.moving) { n.face = Math.sign(Player.x - n.x) || n.face; Hud.toggle('grocer', n); return; }
    n.face = Math.sign(Player.x - n.x) || n.face;
    if (Tips.talk(n)) return; // (something they've heard of, for you)
    Actors.say(n, line);
  },
};
