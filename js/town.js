'use strict';
// ---------------------------------------------------------------------------
// The city's people, on screen. Everyone is a resident: the block's own (the
// RESIDENTS below, written by hand, with their days) and the households
// folk.js makes to fill the city's jobs and homes. Each has a home, most a
// job, friends, and a day: sleep, get up, go to work, eat, a drink or the
// pictures, go home. Nobody wanders: everyone is on their way to something.
//
// Their minds are Tyrell's (city.js): it keeps their days as routines, lets
// needs and hobbies fill their free time, remembers, and saves them. Town
// draws them: where someone is comes from what Tyrell has them doing (a walk
// from one place to another, or something at a place), and the route between
// two places is worked out here, through the census's places (census.js): out
// of a room's door, along the street, off the end to the next street (or to the
// cab stand, the manhole, the subway, the elevator, and off screen to another band
// of the city), and in at another door. Town.sync puts whoever is in the level
// you're in among the people (Actors.npcs, def.town) and moves them, and
// Town.chatter has them talk: greetings in passing, small talk over noodles
// and at a neighbor's table, the till.
//
// Without the engine, the block's own residents keep their written days by
// the clock alone (Town.clockState), and nobody else is about.
// ---------------------------------------------------------------------------
const PXH = 1300; // pixels walked in a game hour (26 px a second, 50 seconds an hour)
// the places, the level each is in, its door on the street and the door inside
// (a place on another street names it; `spots` are where people sit or stand
// in there, by what they're doing)
const TOWN_PLACE = {
  noodles: { level: 'd_noodles', door: 424, inside: 340, spots: { eat: [144, 214, 284, 400, 450, 500, 550], collect: [425, 590] } },
  grocery: { level: 'd_grocery', door: 216, inside: 114, spots: { shop: [175, 259, 335, 392, 424], browse: [175, 259, 335, 392, 424], pay: [470], work: [488], stock: [265] }, view: { shop: 'back', browse: 'back', stock: 'back' } },
  apartments: { level: 'd_apartments', door: 1041, inside: 86 },
  izakaya: { level: 'd_izakaya', street: 'd_neonrow', door: 355, inside: 140, spots: { drink: [454, 394], work: [380] }, depth: { work: { lift: 4 } } },
  menagerie: { level: 'd_menagerie', street: 'd_neonrow', door: 652, inside: 290, spots: { browse: [120, 160, 350, 410], work: [214] }, depth: { work: { lift: 4 } }, view: { browse: 'back' } },
  pachinko: { level: 'd_pachinko', street: 'd_neonrow', door: 1050, inside: 320, spots: { pachi: [104, 200, 448, 520], work: [260] }, view: { pachi: 'back' } },
  cinema: { level: 'd_cinema', street: 'd_neonrow', door: 1365, inside: 110, spots: { watch: [450, 510, 550, 590], work: [210] }, depth: { work: { lift: 4 }, watch: { back: true, lift: 2 } } },
  coil: { level: 'd_coil', street: 'd_neonrow', door: 2065, inside: 120, spots: { work: [600] }, depth: { work: { lift: 4 } } },
  shrine: { level: 'd_shrine', street: 'd_neonrow', door: 2600, inside: 370, spots: { pray: [200, 240], work: [326] }, view: { pray: 'back' } },
};
// (`depth`: where in the room someone doing that is: behind the counter,
// lifted onto its step, or in the seats seen from behind; drawn behind the
// counter or the row of seats in front of them. `view`: which way someone
// doing that faces, when it isn't side-on: 'back' to a shelf or a shrine on
// the back wall. Sitting, the seat decides: see Town.seatAt)
const TOWN_GAP = 0.3; // game hours to cross a street between two you can see someone on (off screen)
const TOWN_RIDE = 0.25; // game hours in a cab, down a manhole, on the subway or in an elevator, and a tenth more a band
// a street's ends, out to the next street
// (just past the edge of what you can see, so people walk on and off the screen
// rather than appearing or vanishing at the end of the street)
function townEnd(street, side) { const L = LEVELS[street].built || (LEVELS[street].built = LEVELS[street].make()); return side === 'west' ? -24 : L.w + 24; }
const SHELF = [175, 259, 335, 392, 424]; // the grocery's shelves and fridges
// what each act is done at, when a place has no spot of its own for it
const SPOT_ALIAS = { browse: 'shop', pay: 'shop', stock: 'work', drink: 'eat', host: 'home', visit: 'home', eat_home: 'home', temple: 'pray', bathe: 'loaf' };
// what they're up to, in a word, for their poses: sit, work (hands busy) or stand
const TOWN_POSE = { eat: 'sit', home: 'sit', visit: 'sit', host: 'sit', work: 'work', browse: 'work', stock: 'work', sweep: 'work', pay: 'stand', play: 'stand', sleep: 'stand', drink: 'sit', pachi: 'sit', watch: 'sit', pray: 'stand', collect: 'stand', eat_home: 'sit', school: 'sit', loaf: 'sit', play: 'stand', dance: 'stand', festival: 'stand', arcade: 'stand', bathe: 'sit', clinic: 'sit', shop: 'work', laundry: 'work', scavenge: 'work' };

// The block's own residents, written by hand. `plan`: [hour they set out,
// where, what, extra]. `where` is home, visit:<id>, a room (noodles, grocery,
// izakaya...: TOWN_PLACE), a spot on a street (at:<level>@<x>), a door by its
// name (@The Mercy), or the nearest place of a kind (near:faith). `shop`
// expands into a few shelves and the till. `with` walks a step behind a
// friend going the same way. `lives`: the street the home is on, for those
// who don't live in the block's apartments; `workAt`: the city's door they work
// behind ([its name, the hour they start]), so nobody else is hired for it.
const RESIDENTS = {
  okonkwo: { name: 'Mr Okonkwo', home: 'A', seat: 3, age: 'senior', look: { skin: SKINS[5], hair: 'bald', top: '#3a4a3a', coat: 'jacket', legs: '#2a2a2a' }, who: 'retired, a widower, forty years on the pumps',
    plan: [[0, 'home', 'sleep'], [7, 'home', 'home'], [9.5, 'grocery', 'shop'], [11, 'home', 'home'], [14.4, 'visit:sato', 'visit'], [16.6, 'home', 'home'], [18.4, 'noodles', 'eat'], [20.3, 'izakaya', 'drink'], [22.6, 'home', 'sleep']],
    say: { shop: 'Rice, ginger, and whatever Mo says is fresh. He lies, but nicely.', eat: 'Six o\'clock, the White Dragon. Every day since my wife.', drink: 'One cup of Ueda\'s sake. One. Then home.', visit: 'Mrs Sato and I play go. She cheats. I let her.', home: 'Forty years on the pumps. Now I listen to them through the floor.', walk: 'Mind out, young one.' } },
  sato: { name: 'Mrs Sato', home: 'B', seat: 4, age: 'senior', look: { skin: SKINS[0], hair: 'bun', hairCol: '#d8d8d8', top: '#6a3a5a', coat: 'long', legs: '#2a2030', tall: 0.9 }, who: 'retired, keeps a shrine, plays go',
    plan: [[0, 'home', 'sleep'], [6.5, 'home', 'home'], [8, 'near:faith', 'pray'], [10, 'home', 'home'], [11.6, 'grocery', 'shop'], [13.2, 'home', 'home'], [14.3, 'home', 'host'], [16.7, 'home', 'home'], [18.6, 'noodles', 'eat', { with: 'okonkwo' }], [21.2, 'home', 'home', { with: 'okonkwo' }], [22.5, 'home', 'sleep']],
    say: { shop: 'Plums, if Mo has them. He never has them.', eat: 'Mr Okonkwo walks me down. He says it\'s for my sake.', host: 'Sit, sit. He\'s late. He\'s always late.', pray: 'To the temple, to light one for my brother.', home: 'The shrine wants fresh water every day. So do I.' } },
  teo: { name: 'Teo', home: 'C', seat: 1, workAt: ['The Glasshouse Hotel', 8.5], look: { skin: SKINS[3], hair: 'mohawk', hairCol: '#ff4ab0', hairGlow: true, top: '#1a1a1a', coat: 'jacket', legs: '#2a1a2a' }, who: 'line cook at a Glasshouse hotel',
    plan: [[0, 'home', 'sleep'], [7, 'home', 'home'], [8.5, '@The Glasshouse Hotel', 'work'], [17.5, 'grocery', 'shop'], [18.6, 'noodles', 'eat'], [20.5, 'cinema', 'watch']],
    say: { work: 'Ten hours making food for people who don\'t eat it.', shop: 'Ines wants the good soy. The good soy is twice the price.', eat: 'I cook all day. I don\'t cook at night.', home: 'Ines picks the shows. I fall asleep in them.', watch: 'The Orpheum, the late picture. I sleep, she watches.' } },
  ines: { name: 'Ines', home: 'C', seat: 2, workAt: ['The canal parcel depot', 8.5], look: { skin: SKINS[1], hair: 'short', hairCol: '#2a1a14', top: '#3a5a7a', legs: '#2a2a3a' }, who: 'sorts parcels at the Docks',
    plan: [[0, 'home', 'sleep', { with: 'teo' }], [7, 'home', 'home'], [8.5, '@The canal parcel depot', 'work'], [17.5, 'grocery', 'shop', { with: 'teo' }], [18.6, 'noodles', 'eat', { with: 'teo' }], [20.5, 'cinema', 'watch', { with: 'teo' }]],
    say: { work: 'Nine hours of other people\'s parcels. Some of them tick.', shop: 'The good soy. Don\'t let him talk you out of it.', eat: 'Date night. It\'s always noodles. I don\'t mind.', home: 'Teo\'s asleep before the titles.', watch: 'Shh. It\'s the good bit.' } },
  rina: { name: 'Rina', home: 'D', seat: 6, workAt: ['The Mercy', 18.6], look: { skin: SKINS[2], hair: 'bun', hairCol: '#1a1414', top: '#7ae8d8', legs: '#3a4a4a' }, who: 'night nurse at the Mercy, Kai\'s mom',
    plan: [[0, '@The Mercy', 'work'], [7.4, 'home', 'home'], [8.2, 'home', 'sleep'], [15, 'home', 'home'], [16, 'grocery', 'shop'], [17.2, 'home', 'home'], [18.6, '@The Mercy', 'work']],
    say: { work: 'Night shift at the Mercy. Lin feeds Kai. I owe that woman everything.', shop: 'Milk, bread, whatever Kai\'s decided he eats this week.', home: 'Two hours with my boy, then back on shift.' } },
  kai: { name: 'Kai', home: 'D', seat: 6, age: 'kid', school: '@Kessler Primary', look: { skin: SKINS[2], hair: 'cap', capCol: '#3aff80', top: '#ff8a20', legs: '#2a2a3a', tall: 0.72 }, who: 'eleven, Rina\'s boy, wants a drone',
    plan: [[0, 'home', 'sleep'], [7, 'home', 'home'], [7.6, '@Kessler Primary', 'school'], [15.4, 'home', 'home'], [16, 'menagerie', 'browse'], [18.4, 'noodles', 'eat'], [21, 'home', 'home'], [21.7, 'home', 'sleep']],
    say: { school: 'School. Boring. Do you fix drones? Can you make one fly?', play: 'I\'m waiting for the drones to go over. Sometimes one drops something.', browse: 'There\'s a dog here that bites synths. I want it.', eat: 'Auntie Lin says I have to finish the broth.', home: 'Mom\'s on nights. I\'m allowed the screen till nine.' } },
  dara: { name: 'Dara', home: 'E', seat: 0, workAt: ['Overpass Couriers', 9.5], look: { skin: SKINS[4], hair: 'cap', capCol: '#ff8a20', top: '#2a2a3a', legs: '#2a2a34' }, who: 'bike courier',
    plan: [[0, 'home', 'sleep'], [8, 'home', 'home'], [9.5, '@Overpass Couriers', 'work'], [13, 'noodles', 'eat'], [14, '@Overpass Couriers', 'work'], [19.2, 'noodles', 'eat'], [20.2, 'pachinko', 'pachi']],
    say: { work: 'Forty drops today. My knees are older than me.', eat: 'Lunch is noodles. Dinner is noodles. Ask me why I\'m fast.', pachi: 'Lucky Seven owes me a week\'s wages. I\'m collecting.', home: 'Bike\'s busted. Again.' } },
  mo: { name: 'Mo', job: 'grocery', lives: 'd_docks', look: { skin: SKINS[1], hair: 'short', hairCol: '#5a3a1a', top: '#e8e0d0', apron: '#2a6a3a', legs: '#2a2a2a', wide: 1 }, who: 'keeps the grocery, lives down by the Canal Docks',
    plan: [[0, 'home', 'sleep'], [5.2, 'home', 'home'], [6.3, 'grocery', 'work'], [20.1, 'home', 'home'], [22.6, 'home', 'sleep']],
    say: { work: 'Fresh today. Mostly today. Today-ish.', home: 'Twenty minutes on the train, and the train\'s always late.' } },
  jun: { name: 'Jun', job: 'grocery', lives: 'd_kessler', look: { skin: SKINS[0], hair: 'hood', top: '#3a3a5a', legs: '#2a2a2a' }, who: 'the night clerk, studying',
    plan: [[0, 'grocery', 'work'], [7.7, 'home', 'home'], [8.6, 'home', 'sleep'], [16.4, 'home', 'home'], [19.4, 'grocery', 'stock'], [20.15, 'grocery', 'work']],
    say: { work: 'Graveyard shift. I study between customers. I fail between customers too.', stock: 'Stock the shelves, then Mo goes home, then it\'s me and the hum of the fridges.', home: 'Sleep. Lectures. Sleep.' } },
  sal: { name: 'Sal', seat: 6, lives: 'd_dragon', look: { skin: SKINS[4], hair: 'mohawk', hairCol: '#3af0e0', hairGlow: true, top: '#1a1a1e', legs: '#2a1a1e', cyArm: true }, who: 'a ganger, off duty',
    plan: [[3, 'home', 'sleep'], [11, 'home', 'home'], [18.2, 'noodles', 'eat'], [20.6, 'pachinko', 'pachi']],
    say: { eat: 'Even we eat. Not here for trouble.', home: 'Places to be.', pachi: 'Don\'t stand behind me. Bad luck.' } },
  wen: { name: 'Old Wen', age: 'senior', lives: 'd_dragon', look: { skin: SKINS[3], hair: 'bald', top: '#5a6a3a', legs: '#3a3a2a', tall: 0.92 }, who: 'sweeps the street for the block association',
    plan: [[0, 'home', 'sleep'], [5.2, 'home', 'home'], [6, 'at:d_dragon@360', 'sweep'], [6.8, 'at:d_dragon@760', 'sweep'], [7.6, 'at:d_dragon@1180', 'sweep'], [8.4, 'home', 'home'], [17, 'at:d_dragon@520', 'sweep'], [17.8, 'at:d_dragon@980', 'sweep'], [18.6, 'home', 'home'], [21.5, 'home', 'sleep']],
    say: { sweep: 'Somebody has to. Nobody else is somebody.', home: 'Home for tea.' } },
  // the people who work on Neon Row, home nearby
  ueda: { name: 'Master Ueda', job: 'izakaya', lives: 'd_neonrow', look: { skin: SKINS[0], hair: 'short', hairCol: '#c8c8c8', top: '#e8e0d0', apron: '#1a1a2a', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, who: 'keeps the Red Lantern',
    plan: [[0, 'izakaya', 'work'], [2.5, 'home', 'sleep'], [11, 'home', 'home'], [16.2, 'izakaya', 'work']],
    say: { work: 'Sit, sit. Sake or beer. Nothing else here is honest.', home: 'Home. The lanterns can light themselves.' } },
  mina: { name: 'Mina', job: 'menagerie', lives: 'd_kessler', look: { skin: SKINS[3], hair: 'bun', hairCol: '#3a2418', top: '#3a5a4a', apron: '#2a3a30', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, who: 'runs the Menagerie while Lio talks to the owl',
    plan: [[0, 'home', 'sleep'], [7.6, 'home', 'home'], [9.4, 'menagerie', 'work'], [20.3, 'home', 'home'], [22.8, 'home', 'sleep']],
    say: { work: 'Don\'t tap the glass. The fish are real. Mostly.', home: 'Feeding time\'s done. I\'m done.' } },
  goro: { name: 'Goro', job: 'pachinko', lives: 'd_neonrow', look: { skin: SKINS[5], hair: 'short', top: '#1a1a1a', coat: 'jacket', legs: '#1a1a1a' }, who: 'the floor man at Lucky Seven',
    plan: [[0, 'pachinko', 'work'], [1.2, 'home', 'sleep'], [8.4, 'home', 'home'], [9.6, 'pachinko', 'work']],
    say: { work: 'Play or move along. That machine\'s hot. Don\'t touch it.', home: 'Fourteen hours of bells. Home to silence.' } },
  pip: { name: 'Pip', job: 'cinema', lives: 'd_neonrow', look: { skin: SKINS[2], hair: 'cap', capCol: '#c83a2a', top: '#8a1a24', legs: '#1a1a1a', hands: { fx: 26, fy: 38 } }, who: 'the Orpheum\'s usher and projectionist both',
    plan: [[0, 'cinema', 'work'], [0.6, 'home', 'sleep'], [9, 'home', 'home'], [15.4, 'cinema', 'work']],
    say: { work: 'Tonight: "Rain on Glass". It\'s about rain. On glass.', home: 'Last reel\'s done. So am I.' } },
  vin: { name: 'Vin', job: 'coil', lives: 'd_kessler', look: { skin: SKINS[5], hair: 'bald', top: '#1a1a1a', legs: '#1a1a1a', hands: { fx: 26, fy: 38 } }, who: 'pours at the Coil',
    plan: [[0, 'coil', 'work'], [5, 'home', 'sleep'], [13, 'home', 'home'], [20.4, 'coil', 'work']],
    say: { work: 'What\'ll it be. Don\'t say water.', home: 'Sun\'s coming. I\'m going.' } },
  hana: { name: 'Keeper Hana', job: 'shrine', lives: 'd_neonrow', look: { skin: SKINS[0], hair: 'long', hairCol: '#1a1414', top: '#e8e4dc', legs: '#a82a24' }, who: 'keeps the fox shrine',
    plan: [[0, 'home', 'sleep'], [4.4, 'home', 'home'], [5.6, 'shrine', 'work'], [19.4, 'home', 'home'], [22, 'home', 'sleep']],
    say: { work: 'People wish for the same three things. Money, love, a way out.', home: 'The fox keeps the night shift.' } },
};
const TOWN_ORDER = Object.keys(RESIDENTS);

// what anyone might say, by what they're doing, when you stop them
const TOWN_GOING = {
  home: 'Home. My feet have opinions.', sleep: 'Bed.', shop: 'To Mo\'s, before I forget what for.', eat: 'Noodles. Lin\'s, where else?', work: 'Work. Don\'t make me late.',
  visit: 'Visiting. Don\'t keep me.', collect: 'To the White Dragon. Something of mine\'s fixed.', drink: 'One drink at the Red Lantern.', pachi: 'Lucky Seven. Don\'t judge me.', watch: 'The pictures, at the Orpheum.', browse: 'The pet shop!', pray: 'To the shrine.', temple: 'To the temple.', school: 'School. Ugh.', play: 'Out.', sweep: 'Next stretch of street.', stock: 'Shift\'s starting.',
};
// small talk: for any two neighbors, and for some, their own
const TOWN_SMALL = [
  ['Did you hear the drone go over last night?', 'Three of them. Low. Looking for somebody.'],
  ['Elevator\'s broken in Kessler again.', 'Elevator\'s broken everywhere.'],
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

const WORK_ACTS = ['work', 'stock', 'sweep', 'scavenge'];
const Town = {
  plans: null, said: {}, lastAct: {}, greeted: {}, chatT: 0,
  // ---- the block's own: their plans, made walkable: every errand expanded,
  // every place found, every departure after the last arrival
  init() {
    this.plans = {};
    for (const id of TOWN_ORDER) {
      const R = RESIDENTS[id]; if (!R.plan) continue;
      const out = [];
      for (const [h, at, act, o = {}] of R.plan) {
        if (act === 'shop') { const s = Math.floor(hash(id.length, h * 10, 7) * 3); out.push({ h, at: 'grocery', act: 'browse', x: SHELF[s], o }); out.push({ h: h + 0.3, at: 'grocery', act: 'browse', x: SHELF[s + 2], o, after: true }); out.push({ h: h + 0.5, at: 'grocery', act: 'pay', x: 470, o, after: true }); }
        else out.push({ h, at, act, x: o.x, o });
      }
      for (const e of out) e.place = this.resolve(id, e.at);
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
  // a plan's `where` as a place in the census
  resolve(id, at) {
    const R = RESIDENTS[id], C = Census.places;
    if (at === 'home') return R.homePlace;
    if (at.startsWith('visit:')) return RESIDENTS[at.slice(6)].homePlace;
    if (TOWN_PLACE[at]) return TOWN_PLACE[at].level;
    if (at.startsWith('at:')) { const [lid, x] = at.slice(3).split('@'), pid = 'at:' + lid + '@' + x; if (!C[pid]) C[pid] = { id: pid, kind: 'spot', level: lid, street: lid, x: +x, y: Census.streets[lid].G, spots: { sweep: [{ x: +x, y: Census.streets[lid].G }] }, tags: [], label: LEVELS[lid].name }; return pid; }
    if (at.startsWith('@')) { const p = Object.values(C).find((q) => q.label === at.slice(1)); return p ? p.id : R.homePlace; }
    if (at.startsWith('near:')) { const tag = at.slice(5), from = this.spot(id, R.homePlace, 'home'); let best = null, bl = Infinity; for (const k in C) { if (!C[k].tags.includes(tag)) continue; const l = this.length(this.route(from, this.spot(id, k, 'pray'))); if (l < bl) { bl = l; best = k; } } return best || R.homePlace; }
    return at;
  },
  point(id, e) { return this.spot(id, e.place, e.act, e.h, e.x); },
  // Where someone stands in a place, doing something: their own post at work,
  // their stool at the noodle bar, a seat in the pictures, a shelf, a bench.
  // A door hides them (they're inside); so does sleep.
  spot(id, pid, act, t = 0, xo, seat) {
    const R = RESIDENTS[id], P = Census.places[pid], idn = this.idn(id);
    if (!P) return { place: pid, level: null, hidden: true, x: 0, y: 0 };
    if (P.apt) { // the block's apartments: the table, the bed, a visit
      const F = APARTMENTS[P.apt], mine = R.homePlace === pid, twin = Folk.householdsAt(pid).flatMap((hh) => hh.members).indexOf(id);
      if (act === 'sleep') return { place: pid, level: 'd_apartments', apt: P.apt, x: F.bed + (twin > 0 ? (P.apt === 'C' ? 36 : -36) : 0), y: F.y, hidden: true };
      return { place: pid, level: 'd_apartments', apt: P.apt, x: F.table + (mine ? (twin > 0 ? 12 : -12) : 14), y: F.y };
    }
    if (P.kind === 'door') return { place: pid, level: null, hidden: true, x: P.x, y: P.y };
    let pos = null;
    if (R.job && R.job.place === pid && R.job.pos && WORK_ACTS.includes(act)) pos = R.job.pos;
    else if (xo !== undefined) pos = { x: xo, y: P.kind === 'room' ? P.G : P.y };
    else if (pid === 'd_noodles' && act === 'eat' && R.seat !== undefined) pos = { x: TOWN_PLACE.noodles.spots.eat[R.seat], y: BK.G - 2 };
    else if (pid === 'd_grocery' && (act === 'browse' || act === 'shop')) pos = { x: SHELF[Math.floor(hash(idn, Math.floor(t), 13) * SHELF.length)], y: BK.G };
    else {
      const list = P.spots[act] || P.spots[SPOT_ALIAS[act]] || (WORK_ACTS.includes(act) ? P.spots.work : null);
      if (list && list.length) pos = list[seat !== undefined ? seat % list.length : Math.floor(hash(idn, act.length, 9) * list.length)];
    }
    if (!pos) pos = P.kind === 'room' ? { x: P.inside + 24 + Math.round(hash(idn, 2, 9) * 80), y: P.G } : { x: P.x + Math.round((hash(idn, 2, 9) - 0.5) * 30), y: P.y };
    // (in the open, a step to one side or the other, so nobody stands in anybody)
    const x = P.kind === 'spot' && !(R.job && R.job.pos === pos) ? pos.x + Math.round((hash(idn, 4, 9) - 0.5) * 8) : pos.x;
    const dp = (P.depth && P.depth[act]) || (pos.behind || pos.back ? { lift: pos.lift || 0, back: pos.back } : null);
    return { place: pid, level: P.level, x, y: pos.y, hidden: act === 'sleep', depth: dp, face: pos.face, view: pos.view || (P.view && P.view[act]) };
  },
  // the seat at x in this level, if there's one (a prop with `seat`: the way
  // its sitter faces, and `seatW`, how far either side of it counts as on it)
  seatAt(x) {
    const L = World.L; if (!L) return null;
    if (this.seatsOf !== L) { this.seatsOf = L; this.seats = World.props.filter((p) => p.seat); }
    return this.seats.find((p) => Math.abs(p.x - x) <= p.seatW) || null;
  },
  idn(id) { let n = 7; for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 100003; return n; },
  // inside the apartments: across a floor, or by the stairs between floors
  inApartments(a, b) {
    if (a.y === b.y) return [a, b];
    const lo = { x: APT_STAIRS.x0, y: BK.G }, hi = { x: APT_STAIRS.x1, y: BK.F1 };
    return a.y === BK.G ? [a, lo, hi, b] : [a, hi, lo, b];
  },
  inside(P, a, b) { return P.apt || P.id === 'd_apartments' ? this.inApartments(a, b) : [a, b]; },
  // where someone gets a ride from on a street, going from x: up where the
  // cabs fly, the cab stand or either end of the street (a cab picks you up
  // round the corner), whichever's nearest; below, the manhole, the subway
  // or the elevator, wherever it is
  rank(sid, x) { const S = Census.streets[sid]; if (!['sky', 'high', 'street'].includes(S.band)) return S.transit; return [S.transit, townEnd(sid, 'west'), townEnd(sid, 'east')].reduce((q, t) => (Math.abs(t - x) < Math.abs(q - x) ? t : q)); },
  // a ride between bands of the city: a cab, a manhole, the subway, an elevator
  ride(ba, bb) { const ids = STRATA.map((q) => q.id); return TOWN_RIDE + 0.1 * Math.abs(ids.indexOf(ba) - ids.indexOf(bb)); },
  // the way from one point to the next: legs, each in one level (or off
  // screen, between streets and bands: `len`, in pixels at walking pace)
  route(a, b) {
    const legs = [], C = Census.places, S = Census.streets, A = C[a.place], B = C[b.place];
    if (!A || !B) return legs;
    if (a.place === b.place) { if (A.kind !== 'door' && (a.x !== b.x || a.y !== b.y)) legs.push({ level: A.level, pts: this.inside(A, a, b) }); return legs; }
    const sa = A.street, sb = B.street, ga = S[sa].G, gb = S[sb].G;
    // out of a room by its door; from a spot up a gantry, down to the street first
    if (A.kind === 'room') legs.push({ level: A.level, pts: this.inside(A, a, { x: A.inside, y: A.G }) });
    const xa = A.kind === 'spot' ? a.x : A.x, xb = B.kind === 'spot' ? b.x : B.x;
    const first = A.kind === 'spot' && a.y !== ga ? [{ x: a.x, y: a.y }] : [], last = B.kind === 'spot' && b.y !== gb ? [{ x: b.x, y: b.y }] : [];
    if (sa === sb) legs.push({ level: sa, pts: [...first, { x: xa, y: ga }, { x: xb, y: gb }, ...last] });
    else {
      const ba = S[sa].band, bb = S[sb].band, ia = S[sa].row, ib = S[sb].row;
      // on foot along the row of streets, or a ride if that's quicker (or the only way)
      const walk = ba === bb && ia >= 0 && ib >= 0 ? Math.abs(xa - townEnd(sa, ib > ia ? 'east' : 'west')) + TOWN_GAP * PXH * Math.abs(ib - ia) + Math.abs(townEnd(sb, ib > ia ? 'west' : 'east') - xb) : Infinity;
      const ta = this.rank(sa, xa), tb = this.rank(sb, xb), ride = Math.abs(xa - ta) + this.ride(ba, bb) * PXH + Math.abs(tb - xb);
      if (walk <= ride) {
        // on foot: off the end of this street, past the ones between, on from the end of that one
        const dir = ib > ia ? 'east' : 'west', back = dir === 'east' ? 'west' : 'east';
        legs.push({ level: sa, pts: [...first, { x: xa, y: ga }, { x: townEnd(sa, dir), y: ga }] });
        legs.push({ level: null, len: TOWN_GAP * PXH * Math.abs(ib - ia) });
        legs.push({ level: sb, pts: [{ x: townEnd(sb, back), y: gb }, { x: xb, y: gb }, ...last] });
      } else {
        // to the way out of the band, a ride, and from the way in at the other end
        legs.push({ level: sa, pts: [...first, { x: xa, y: ga }, { x: ta, y: ga }] });
        legs.push({ level: null, len: this.ride(ba, bb) * PXH });
        legs.push({ level: sb, pts: [{ x: tb, y: gb }, { x: xb, y: gb }, ...last] });
      }
    }
    if (B.kind === 'room') legs.push({ level: B.level, pts: this.inside(B, { x: B.inside, y: B.G }, b) });
    return legs;
  },
  length(legs) { let n = 0; for (const L of legs) if (L.len) n += L.len; else for (let i = 1; i < L.pts.length; i++) n += Math.hypot(L.pts[i].x - L.pts[i - 1].x, L.pts[i].y - L.pts[i - 1].y); return n; },
  // the levels a route goes through (to know who might be in view)
  levels(legs) { const out = new Set(); for (const L of legs) if (L.level) out.add(L.level); return out; },
  // where someone is: from Tyrell's minds when the engine's there (city.js),
  // otherwise, for the block's own, from the clock alone
  state(id, hour) { return City.on ? City.state(id) : this.plans[id] ? this.clockState(id, hour) : { level: null, act: 'home', e: { act: 'home', h: 0, o: {} } }; },
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
    return { level: b.hidden ? b.level || null : b.level, x: b.x, y: b.y, moving: false, act: e.act, e, apt: b.apt, hidden: b.hidden, depth: b.depth, view: b.view, place: b.place };
  },
  // ---- the people here, now: in the level you're in, moved to where they are
  sync() {
    if (!World.L || !this.plans) return;
    City.sync(); // the minds keep up with the clock
    const here = World.L.id, hour = Game.hour(), have = new Map();
    for (const n of Actors.npcs) if (n.def.town) have.set(n.def.town, n);
    for (let i = 0; i < TOWN_ORDER.length; i++) {
      const id = TOWN_ORDER[i];
      let n = have.get(id);
      // (most of the city is somewhere else: only work out where the ones who might be here are)
      if (!City.mayBeIn(id, here) && !(this.plans[id] && !City.on)) { if (n) Actors.npcs.splice(Actors.npcs.indexOf(n), 1); continue; }
      const R = RESIDENTS[id], st = this.state(id, hour), on = st.level === here && !st.hidden;
      if (!on) { if (n) Actors.npcs.splice(Actors.npcs.indexOf(n), 1); continue; }
      if (!n) { n = { def: { name: R.name, look: R.look, town: id, sched: [[0, 24, st.x, 'stand']], lines: R.lines || [Folk.who(id)], smoke: R.smoke }, i: 120 + i, x: st.x, y: st.y, face: st.dir || st.face || 1, hidden: false, tx: st.x, wt: 0, bubble: null, line: 0, art: new Map() }; Actors.npcs.push(n); if (!st.moving) this.lastAct[id] = st.act + st.e.h; } // (already there when you walk in: nothing to say about arriving)
      const dx = st.x - n.x;
      if (st.moving) { n.face = st.dir; n.walked = (n.walked || 0) + Math.abs(dx); }
      else if (st.act === 'eat' && st.place === 'd_noodles') n.face = 1;
      else if (st.apt && TOWN_POSE[st.act] === 'sit') n.face = st.x > APARTMENTS[st.apt].table ? -1 : 1;
      else if (st.act === 'work' && here === 'd_grocery') n.face = -1;
      else if (st.act === 'pay') n.face = 1;
      else if (st.face) n.face = st.face;
      n.x = st.x; n.y = st.y; n.moving = st.moving; n.act = st.moving ? 'walk' : TOWN_POSE[st.act] || 'stand'; n.townState = st;
      const dp = !st.moving && st.depth; n.behind = !!dp; n.lift = (dp && dp.lift) || 0;
      // which way they face: the seat they're on (a stool at a counter, their
      // back to us; a bench, facing us), or what they're doing there
      const seat = !st.moving && !dp && TOWN_POSE[st.act] === 'sit' ? this.seatAt(st.x) : null;
      n.view = dp && dp.back ? 'back' : seat ? seat.seat : (!st.moving && st.view) || undefined;
      if (seat && seat.seat === 'side') n.view = undefined; // (a chair side-on: sat on as before)
      else if (seat) { n.y = seat.y; if (seat.seatW <= 5) n.x = seat.x; } // (on a stool, square on it)
      // on shift at a post with a trade (a stall that buys, a parts dealer), they trade
      const onShift = !st.moving && R.job && R.job.role && st.place === R.job.place && WORK_ACTS.includes(st.act);
      n.def.role = onShift ? R.job.role : undefined; n.def.rate = onShift ? R.job.rate : undefined; n.def.stock = onShift ? R.job.stock : undefined;
      // something said on getting there
      if (!st.moving && this.lastAct[id] !== st.act + st.e.h) { this.lastAct[id] = st.act + st.e.h; this.arrived(n, id, st); }
      if (st.moving) this.lastAct[id] = null;
    }
  },
  // on arriving: the till, the counter, a neighbor's door
  arrived(n, id, st) {
    const other = (pred) => Actors.npcs.find((q) => q !== n && pred(q));
    if (st.act === 'pay') { Actors.say(n, ['Just these.', 'And a bag, please.', 'Put it on my tab?'][Math.floor(hash(id.length, Game.s.day, 3) * 3)]); const clerk = other((q) => q.def.town && RESIDENTS[q.def.town].job && RESIDENTS[q.def.town].job.place === 'd_grocery'); if (clerk) setTimeout(() => Actors.say(clerk, ['Fourteen.', 'Nine-fifty. Call it nine.', 'No tabs. Fine. Tab.'][Math.floor(hash(id.length, Game.s.day, 4) * 3)]), 1300); }
    if (st.act === 'eat' && st.place === 'd_noodles') { Actors.say(n, id === 'kai' ? 'Auntie Lin! I\'m starving.' : 'The usual, Lin.'); const lin = other((q) => q.def.name === 'Auntie Lin'); if (lin) setTimeout(() => Actors.say(lin, id === 'kai' ? 'Sit. Broth first.' : 'Sit.'), 1300); }
    if (st.act === 'collect') { Actors.say(n, 'Lin! I hear it\'s fixed.'); const lin = other((q) => q.def.name === 'Auntie Lin'); if (lin) setTimeout(() => Actors.say(lin, 'Here. Good as new. Better.'), 1300); }
    if (st.act === 'drink' && st.place === 'd_izakaya') { Actors.say(n, 'The usual, Master.'); const m = other((q) => q.def.town === 'ueda'); if (m) setTimeout(() => Actors.say(m, 'One cup. I\'m counting.'), 1300); }
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
      // passing in the street or a doorway: a greeting, once a day, for a neighbor
      if (n.moving && m.moving && d < 18 && n.face !== m.face && this.greeted[key] !== day && this.neighbors(a, b)) { this.greeted[key] = day; const h = Game.hour(), tod = h >= 5 && h < 12 ? 'Morning' : h >= 12 && h < 17 ? 'Afternoon' : 'Evening'; Actors.say(n, tod + ', ' + RESIDENTS[b].name.replace(/^(Mr|Mrs|Old) /, '') + '.'); setTimeout(() => Actors.say(m, tod + '.'), 900); continue; }
      // side by side, both settled or walking together: now and then, a few words
      if (d < 70 && !n.bubble && !m.bubble && (n.moving === m.moving) && hash(Math.floor(Game.t / 1.5), a.length * 7 + b.length, 11) < (this.neighbors(a, b) ? 0.12 : 0.03)) {
        const pool = (TOWN_PAIR[key] || []).concat(TOWN_SMALL, townNews(), townNews()), [l1, l2] = pool[Math.floor(hash(Math.floor(Game.t / 9), key.length, 12) * pool.length)];
        Actors.say(n, l1); setTimeout(() => { if (Actors.npcs.includes(m)) Actors.say(m, l2); }, 1600);
      }
    }
  },
  // people who'd know each other: the same street, the same household, the same work
  neighbors(a, b) {
    const A = RESIDENTS[a], B = RESIDENTS[b], P = Census.places, st = (R) => R.homePlace && P[R.homePlace] && P[R.homePlace].street;
    return (!A.gen && !B.gen) || A.hh === B.hh || st(A) === st(B) || !!(A.job && B.job && A.job.place === B.job.place);
  },
  // when you stop someone: where they're going, or what they're at
  talkLine(n) {
    const id = n.def.town, R = RESIDENTS[id], st = n.townState || this.state(id, Game.hour());
    const remark = City.remark(id); if (remark) return remark; // (something they saw, heard or remember of you)
    if (st.moving) return (st.e.act === 'browse' || st.e.act === 'pay' ? R.say.shop : R.say[st.e.act]) || TOWN_GOING[st.e.act] || 'Busy. Sorry.';
    return (st.act === 'browse' || st.act === 'pay' ? R.say.shop : R.say[st.act]) || Folk.who(id);
  },
  talk(n) {
    City.did('talked', n.def.town); // (they know your face now)
    // something broken to ask you about, or something of theirs you've fixed: the talk panel
    if (Jobs.actionsFor(n.def.name).length) { n.face = Math.sign(Player.x - n.x) || n.face; Hud.toggle('talk', n); return; }
    const id = n.def.town, R = RESIDENTS[id], st = n.townState || this.state(id, Game.hour());
    const line = this.talkLine(n);
    // the clerk at the till sells you things
    if (R.job && R.job.place === 'd_grocery' && st.act === 'work' && !st.moving) { n.face = Math.sign(Player.x - n.x) || n.face; Hud.toggle('grocer', n); return; }
    n.face = Math.sign(Player.x - n.x) || n.face;
    // on shift at a stall that buys or a parts counter: they trade
    if (n.def.role && NPC_ROLE[n.def.role]) { NPC_ROLE[n.def.role].use(n); return; }
    if (Tips.talk(n)) return; // (something they've heard of, for you)
    Actors.say(n, line);
  },
};
