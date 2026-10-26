'use strict';
// ---------------------------------------------------------------------------
// Cases and side work. A quest is a list of steps, done in order:
//   go       be in a level (near x, if given)
//   talk     speak to someone (they say `lines`)
//   collect  hold items (`items`: ids; `at` puts a pickup in a level while
//            the step is on: {level, x, y} or {level, spot} for a district)
//   kill     bring down `n` of a type ('chrome' counts any implanted foe;
//            `named` is a particular one, spawned for the step; `boss` a boss)
//   board    analyse the case's evidence at the precinct's evidence board
//   deliver  hand `items` ({id: n}) to someone
//   choice   someone asks; each option sets flags and pays its own way
//   use      use `n` of an item; hack: jack into `n` nodes at a depth
// The last step is usually a talk back to whoever gave it, which pays the
// reward. Quests with `after` wait for those to be done; main cases are
// Lieutenant Hale's, side work comes from people around the city.
// ---------------------------------------------------------------------------
const QUESTS = {
  // ---- the main cases --------------------------------------------------------
  drones: { title: 'Clear the walkway', giver: 'Lieutenant Hale', text: 'Somebody\'s hacked the block drones on the Stack\'s upper walkway and they\'re buzzing civilians. Take down four.',
    steps: [{ do: 'kill', type: 'drone', n: 4, level: 'stack', text: 'Take down four block drones on the Stack' }, { do: 'talk', npc: 'Lieutenant Hale', text: 'Report to Hale at the precinct', lines: ['Four drones down. Good. Somebody hacked them; I\'ll find who.'] }],
    reward: { cr: 120, items: { chips: 1 }, gear: 'shades' } },
  chrome: { title: 'Chrome warrant', giver: 'Lieutenant Hale', text: 'The gang on street level runs illegal implants out of their turf. Anyone carrying chrome is under arrest, or under the ground. Bring three of them down.',
    steps: [{ do: 'kill', type: 'chrome', n: 3, text: 'Bring down three chromed gangers' }, { do: 'talk', npc: 'Lieutenant Hale', text: 'Report to Hale', lines: ['Three fewer chromers on my streets. Here, you\'ve earned a better coat.'] }],
    reward: { cr: 180, gear: 'armtrench' } },
  clinic: { title: 'House call', giver: 'Lieutenant Hale', main: true, after: ['menagerie'], text: 'One of your synths came through a back-alley chop clinic on street level two nights ago. Its terminal remembers. Jack in and bring me the record.',
    steps: [{ do: 'flag', flag: 'clinicData', level: 'street', x: 1000, text: 'Jack into the chop clinic\'s terminal on street level' }, { do: 'talk', npc: 'Lieutenant Hale', text: 'Bring Hale the record', lines: ['A woman, no ID, paid cash to have a serial cut out of her wrist. She asked the way to the subway.', 'The old line\'s been sealed for years. Here\'s a pass for the gates. Go down after her.'] }],
    reward: { cr: 200, gear: 'tracer', items: { subwaypass: 1 } } },
  // ---- side work -----------------------------------------------------------------
  okafor: { title: 'Pump crew seven', giver: 'Mrs Okafor', text: 'Her son went down to the Works in sixty-one and never wrote. She wants to know, one way or the other.',
    steps: [{ do: 'collect', items: ['dogtag'], at: { dogtag: { level: 'd_pumphall', spot: 8 } }, text: 'Look for Kofi Okafor in Pump Hall 7 in the Works' }, { do: 'talk', npc: 'Mrs Okafor', text: 'Take the tag to Mrs Okafor', lines: ['Oh. Oh, Kofi.', 'Thank you, detective. Sit. You\'ll eat something before you go.'], take: { dogtag: 1 } }],
    reward: { items: { noodlecup: 4, medpatch: 2 }, gear: 'undersuit' } },
  tam: { title: 'Tam\'s drone', giver: 'Tam', text: 'Tam\'s toy drone flew off the walkway and down to street level. Its rotor is still down there somewhere.',
    steps: [{ do: 'collect', items: ['rotor'], at: { rotor: { level: 'street', x: 1450, y: 'G' } }, text: 'Find the toy rotor on street level' }, { do: 'talk', npc: 'Tam', text: 'Give Tam the rotor', lines: ['You found it! It\'s bent. I\'ll fix it. Detectives are okay, actually.'], take: { rotor: 1 } }],
    reward: { cr: 60, items: { noodlecup: 2 } } },
  bulk: { title: 'Bulk order', giver: 'Kit', text: 'Kit has a buyer upstairs for copper wire, a lot of it, and no time to strip it.',
    steps: [{ do: 'deliver', npc: 'Kit', items: { wire: 10 }, text: 'Bring Kit ten copper wire' }], reward: { cr: 150, mod: 'barrel' } },
  exotic: { title: 'Rare earths', giver: 'Mags', text: 'Mags wants chips and coolant to build things she\'s only drawn.',
    steps: [{ do: 'deliver', npc: 'Mags', items: { chips: 3, coolant: 3 }, text: 'Bring Mags three chips and three coolant' }], reward: { cr: 100, gear: 'knuckles' } },
  collector: { title: 'Debt collector', giver: 'Juno', text: 'A collector named Vance is leaning on Juno for money she doesn\'t owe. He works the Overpass Market.',
    steps: [{ do: 'kill', named: 'collector', n: 1, level: 'd_overpass', text: 'Find Vance in the Overpass Market' }, { do: 'talk', npc: 'Juno', text: 'Tell Juno', lines: ['Vance? Gone? Huh. I didn\'t ask you to do that. Thanks anyway.'] }],
    reward: { cr: 150, items: { frag: 3 } } },
  clean: { title: 'Clean hands', giver: 'Doc Vasquez', text: 'Doc Vasquez\'s arms are chrome. He wants to talk to you about it before someone else does.',
    steps: [{ do: 'choice', npc: 'Doc Vasquez', text: 'Hear the Doc out', lines: ['These were put in before the law, detective. I can\'t take them out. I\'d die.', 'I patch up your neighbours for nothing. You know that. So: what are you going to do?'],
      options: [
        { label: 'Report him', flags: { doc: 'reported' }, reward: { cr: 200 }, text: 'Hale takes the report without looking up. The clinic is closed by morning.' },
        { label: 'Keep quiet', flags: { doc: 'quiet' }, reward: { items: { medpatch: 5 } }, text: '"I won\'t forget it," he says, and he doesn\'t.' },
      ] }], reward: {} },
  rival: { title: 'Rival fence', giver: 'Ozu', text: 'A fence called Marr has set up in the Scrapyard and is undercutting Ozu. Ozu would like him to stop.',
    steps: [{ do: 'kill', named: 'marr', n: 1, level: 'd_scrapyard', text: 'Find Marr in the Scrapyard' }, { do: 'talk', npc: 'Ozu', text: 'Tell Ozu', lines: ['Marr\'s done? Good. Here, take this. Don\'t tell Kit.'] }],
    reward: { cr: 200, gear: 'scatter' } },
  lockbox: { title: 'Stolen evidence', giver: 'Sergeant Oyelaran', text: 'An evidence lockbox walked out of the precinct. The sergeant hears it\'s in Chop Shop Alley.',
    steps: [{ do: 'collect', items: ['lockbox'], at: { lockbox: { level: 'd_chopshop', spot: 7 } }, text: 'Find the lockbox in Chop Shop Alley' }, { do: 'talk', npc: 'Sergeant Oyelaran', text: 'Return it to the sergeant', lines: ['Still sealed. Good. You didn\'t see what was in it, and neither did I.'], take: { lockbox: 1 } }],
    reward: { cr: 180, items: { emp: 2 } } },
  letter: { title: 'A message out', giver: 'Prisoner', text: 'The prisoner wants a letter taken to his sister Esi in Old Town. It\'s sealed. You could read it.',
    steps: [{ do: 'talk', npc: 'Esi', text: 'Take the letter to Esi in Old Town', lines: ['From my brother? Still alive, then. Still stupid.', 'Thank you. Here, it\'s not much.'], take: { letter: 1 } }],
    start: { items: { letter: 1 } }, reward: { cr: 120, items: { medpatch: 1 } } },
  oil: { title: 'Lantern glass', giver: 'The Ferryman', text: 'The Ferryman needs optic glass for the lanterns that keep Old Town lit.',
    steps: [{ do: 'deliver', npc: 'The Ferryman', items: { glass: 4 }, text: 'Bring the Ferryman four optic glass' }], reward: { cr: 120, gear: 'respirator' } },
  coldstore: { title: 'Cold store', giver: 'Cookie', text: 'Spider-bots have nested in the Works\' cold stores. Cookie can\'t get at the food.',
    steps: [{ do: 'kill', type: 'spider', n: 8, tier: 4, text: 'Clear eight spider-bots in the Works' }, { do: 'talk', npc: 'Cookie', text: 'Tell Cookie', lines: ['Clear? Bless you. Eat. Here, take these for later.'] }],
    reward: { cr: 200, items: { stim: 3 } } },
  listening: { title: 'Listening', giver: 'The Hermit', text: 'The Hermit wants to hear what the Root says. Jack into three nodes in the Bowels for him.',
    steps: [{ do: 'hack', n: 3, tier: 5, text: 'Jack into three data nodes in the Bowels' }, { do: 'talk', npc: 'The Hermit', text: 'Tell the Hermit what you heard', lines: ['It said that? Then it\'s waking up. Here, for your trouble.'] }],
    reward: { cr: 220, items: { medpatch: 3 } } },
  fieldtest: { title: 'Field test', giver: 'Quartermaster Ito', text: 'Ito has a new batch of EMP charges and wants to know they work. Use three on anything.',
    steps: [{ do: 'use', item: 'emp', n: 3, text: 'Use three EMP charges', start: { items: { emp: 3 } } }, { do: 'talk', npc: 'Quartermaster Ito', text: 'Report to Ito', lines: ['They work? Good. Keep a couple. Don\'t tell accounting.'] }],
    start: { items: { emp: 3 } }, reward: { cr: 150, items: { emp: 2 } } },
  uptop: { title: 'Up top', giver: 'Rook', text: 'Rook bets you can\'t get up onto the hotel\'s roof, by the billboard.',
    steps: [{ do: 'go', level: 'stack', x: 560, maxY: 145, text: 'Get onto the hotel roof by the billboard' }, { do: 'talk', npc: 'Rook', text: 'Collect from Rook', lines: ['No way. Fine. Fine! Here.'] }],
    reward: { cr: 150, items: { stim: 2 } } },
  supply: { title: 'Supply run', giver: 'Mama Ruiz', text: 'The noodle stall\'s cooler is dying. Mama Ruiz needs coolant.',
    steps: [{ do: 'deliver', npc: 'Mama Ruiz', items: { coolant: 3 }, text: 'Bring Mama Ruiz three coolant' }], reward: { items: { noodlecup: 6 }, cr: 40 } },
  discretion: { title: 'Discretion', giver: 'Concierge', text: 'The Spires\' concierge would like three of Meridian\'s enforcers to stop existing, quietly.',
    steps: [{ do: 'kill', type: 'enforcer', n: 3, level: 'spires', text: 'Bring down three Meridian enforcers in the Spires' }, { do: 'talk', npc: 'Concierge', text: 'See the concierge', lines: ['Discreet. We noticed. Wear this; it opens doors up here.'] }],
    reward: { gear: 'circlet', cr: 300 } },
};
const QUEST_ORDER = Object.keys(QUESTS);
// named targets: spawned in their level while a step wants them
const ELITES = {
  collector: { type: 'gunner', name: 'Vance, debt collector', level: 'd_overpass', hp: 3, look: { hair: 'cap', capCol: '#ffd040', top: '#5a4a1a' } },
  marr: { type: 'bruiser', name: 'Marr the fence', level: 'd_scrapyard', hp: 2 },
};

const Quests = {
  st(id) { return Game.s.quests[id] || null; },
  done(id) { const q = this.st(id); return !!(q && q.done) || Cases.closed(id); },
  active(id) { const q = this.st(id); return !!(q && !q.done); },
  open() { return QUEST_ORDER.filter((id) => this.active(id)); },
  available(id) { const Q = QUESTS[id]; return !this.st(id) && (!Q.after || Q.after.every((a) => this.done(a))); },
  step(id) { const q = this.st(id); return q && !q.done ? QUESTS[id].steps[q.st] : null; },
  start(id) {
    if (!this.available(id)) return;
    Game.s.quests[id] = { st: 0, n: 0 }; const Q = QUESTS[id];
    if (Q.start && Q.start.items) for (const k in Q.start.items) Game.give(k, Q.start.items[k]);
    if (!Game.s.track || !this.active(Game.s.track)) Game.s.track = id;
    Game.toast((Q.main ? 'Case' : 'Job') + ': ' + Q.title + '. ' + this.objective(id), 'good');
    this.tick(); Hud.refresh(); Save.write();
  },
  objective(id) { const s = this.step(id); return s ? s.text : 'Done'; },
  // move a quest on a step; past its last, it's done and pays
  advance(id) {
    const q = this.st(id), Q = QUESTS[id]; q.st++; q.n = 0;
    if (q.st >= Q.steps.length) { q.done = true; this.pay(Q.reward, Q.title); if (Game.s.track === id) Game.s.track = this.open()[0] || null; if (Q.ending) Hud.toggle('ending'); }
    else Game.toast(Q.title + ': ' + this.objective(id), 'good');
    Actors.questSpawns(); World.questProps(); Hud.refresh(); Save.write();
  },
  pay(r, title) {
    if (!r) return; const got = [];
    if (r.cr) { Game.s.cr += r.cr; got.push(r.cr + ' cr'); }
    if (r.items) for (const k in r.items) { Game.give(k, r.items[k]); got.push(r.items[k] + ' ' + ITEM[k].name.toLowerCase()); }
    if (r.gear && Game.giveGear(r.gear)) got.push(GEAR[r.gear].name.toLowerCase());
    if (got.length) Game.toast((title ? title + ' done. ' : '') + '+ ' + got.join(', '), 'good');
  },
  // the city's depth for a level: 1 high up, 5 the Bowels
  tier(level) { const L = LEVELS[level]; return L ? L.tier || 1 : 1; },
  // things that happen: a kill, an item used, a node hacked
  event(type, arg, extra = {}) {
    for (const id of this.open()) {
      const s = this.step(id); if (!s) continue; const q = this.st(id);
      const here = (!s.level || World.L.id === s.level) && (!s.tier || this.tier(World.L.id) === s.tier);
      let hit = false;
      if (type === 'kill' && s.do === 'kill' && here) hit = (s.type && (s.type === arg || (s.type === 'chrome' && extra.chrome))) || (s.named && s.named === extra.named) || (s.boss && s.boss === arg);
      if (type === 'use' && s.do === 'use' && s.item === arg) hit = true;
      if (type === 'hack' && s.do === 'hack' && here) hit = true;
      if (hit) { q.n++; const n = s.n || 1; if (q.n >= n) this.advance(id); else Game.toast(QUESTS[id].title + ': ' + q.n + ' of ' + n, 'good'); }
    }
  },
  // every so often: steps that are done by being somewhere, holding something, or a flag
  tick() {
    for (const id of this.open()) {
      const s = this.step(id); if (!s) continue;
      if (s.do === 'go' && World.L.id === s.level && (s.x === undefined || Math.abs(Player.x - s.x) < 40) && (s.maxY === undefined || Player.y <= s.maxY)) this.advance(id);
      else if (s.do === 'collect' && s.items.every((k) => Game.s.pack[k] > 0)) this.advance(id);
      else if (s.do === 'flag' && Game.flag(s.flag)) this.advance(id);
    }
  },
  // what someone has to say for the quests: offers, steps that need them
  actionsFor(name) {
    const out = [];
    for (const id of QUEST_ORDER) {
      const Q = QUESTS[id];
      if (Q.giver === name && this.available(id)) out.push({ id, kind: 'offer' });
      const s = this.step(id); if (!s || s.npc !== name) continue;
      if (s.do === 'talk' || s.do === 'choice') out.push({ id, kind: s.do });
      if (s.do === 'deliver') out.push({ id, kind: 'deliver', ok: Object.keys(s.items).every((k) => (Game.s.pack[k] || 0) >= s.items[k]) });
    }
    return out;
  },
  talked(id) { const s = this.step(id); if (s.take) for (const k in s.take) Game.s.pack[k] = Math.max(0, (Game.s.pack[k] || 0) - s.take[k]); this.advance(id); },
  deliver(id) { const s = this.step(id); if (!Object.keys(s.items).every((k) => (Game.s.pack[k] || 0) >= s.items[k])) return; for (const k in s.items) Game.s.pack[k] -= s.items[k]; this.advance(id); },
  choose(id, i) { const s = this.step(id), o = s.options[i]; Game.s.quests[id].choice = i; Object.assign(Game.s.flags, o.flags || {}); Game.toast(o.text, 'good'); this.pay(o.reward); this.advance(id); },
  // the evidence board at the precinct: a case whose evidence is all in hand
  boardReady(id) { const s = this.step(id); return !!(s && s.do === 'board' && QUESTS[id].steps.some((t) => t.do === 'collect' && t.items.every((k) => Game.s.pack[k] > 0))); },
  // pickups for collect steps in this level, while the step is on and the item not yet held
  pickups(level) {
    const out = [];
    for (const id of this.open()) {
      const s = this.step(id); if (!s || s.do !== 'collect' || !s.at) continue;
      for (const k of s.items) { const a = s.at[k]; if (!a || a.level !== level || Game.s.pack[k] > 0) continue; out.push({ item: k, a }); }
    }
    return out;
  },
  // named targets wanted in this level
  elites(level) { const out = []; for (const id of this.open()) { const s = this.step(id); if (s && s.do === 'kill' && s.named && ELITES[s.named].level === level) out.push(s.named); } return out; },
  // where the tracked quest wants you, for the map and the HUD
  where(id = Game.s.track) {
    const s = id && this.step(id); if (!s) return null;
    if (s.do === 'board') return { level: 'precinct', name: 'the evidence board' };
    if (s.npc) { const at = npcWhere(s.npc); return at ? { level: at.level, x: at.x, name: s.npc } : null; }
    if (s.do === 'collect' && s.at) { for (const k of s.items) { const a = s.at[k]; if (a && !(Game.s.pack[k] > 0)) return { level: a.level, x: a.x, item: k, name: ITEM[k].name }; } }
    if (s.named) return { level: ELITES[s.named].level, name: ELITES[s.named].name };
    if (s.level) return { level: s.level, x: s.x };
    return null;
  },
  // people who only appear for a quest: `show: {quest, from}` once that quest
  // reaches step `from`; after it's done they stay only if they were let go
  npcShown(def) {
    const sh = def.show, q = this.st(sh.quest); if (!q) return false;
    if (!q.done) return q.st >= sh.from;
    return sh.stays ? Game.s.flags[sh.stays[0]] === sh.stays[1] : false;
  },
  // a save from before quests: the old jobs become quests
  migrate(s) {
    s.quests = s.quests || {};
    if (s.jobs) for (const id of ['drones', 'chrome', 'clinic']) { if (s.jobs.done && s.jobs.done[id]) s.quests[id] = { st: QUESTS[id].steps.length, n: 0, done: true }; else if (s.jobs.taken && s.jobs.taken[id]) s.quests[id] = { st: 0, n: (s.jobs.kills && s.jobs.kills[id + ':' + (id === 'drones' ? 'drone' : 'gang')]) || 0 }; }
    if (s.quests.clinic && s.quests.clinic.done && !(s.pack.subwaypass > 0)) s.pack.subwaypass = 1;
    delete s.jobs;
  },
};
// where someone is: the level they're in and where they stand
function npcWhere(name) {
  if (!npcWhere.cache) {
    npcWhere.cache = {};
    for (const id in LEVELS) { const L = LEVELS[id].built || (LEVELS[id].built = LEVELS[id].make()); for (const d of L.npcs) if (!npcWhere.cache[d.name]) npcWhere.cache[d.name] = { level: id, x: d.x }; }
  }
  return npcWhere.cache[name];
}

// Warrants: Hale's board of bounties on named chrome, three a day, in the
// districts you can reach. Take one, find them, bring them down: the bounty
// pays on the spot.
const WARRANT_NAMES = { first: ['Rizzo', 'Kade', 'Nyx', 'Sol', 'Brick', 'Juniper', 'Vex', 'Moth', 'Tallis', 'Quill', 'Fen', 'Ash', 'Coil', 'Dray', 'Pike', 'Wren-Nine'], last: ['the Tooth', 'Chrome-Eye', 'Six Fingers', 'the Butcher', 'Low', 'Hotwire', 'Ironjaw', 'the Saint', 'Glass', 'the Twin', 'Rust', 'Ninefold'] };
const Warrants = {
  // districts you can reach, by the travel you've unlocked
  places() { return Object.keys(LEVELS).filter((id) => LEVELS[id].district && Travel.open(id)); },
  refresh() {
    const s = Game.s, W = s.warrants; if (W.day === s.day && W.list.length) return;
    W.day = s.day; W.list = W.list.filter((w) => w.taken && !w.done);
    const places = this.places(); if (!places.length) return;
    for (let k = 0; W.list.filter((w) => !w.taken).length < 3 && k < 12; k++) {
      const r = (q) => hash(s.day, k, q), level = places[Math.floor(r(1) * places.length)], tier = LEVELS[level].tier;
      const type = tier >= 5 ? 'bruiser' : tier >= 4 ? (r(2) < 0.5 ? 'gunner' : 'bruiser') : ['gang', 'gunner', 'bruiser'][Math.floor(r(2) * 3)];
      const name = WARRANT_NAMES.first[Math.floor(r(3) * 16)] + ' ' + WARRANT_NAMES.last[Math.floor(r(4) * 12)];
      if (W.list.some((w) => w.name === name)) continue;
      W.list.push({ id: s.day * 10 + k, name, type, level, tier, reward: 80 + tier * 70 + Math.round(r(5) * 60), hp: 2.5 });
    }
  },
  take(id) { const w = Game.s.warrants.list.find((q) => q.id === id); if (w) { w.taken = true; Game.toast('Warrant: ' + w.name + ', last seen in ' + LEVELS[w.level].name + '.', 'good'); if (World.L.id === w.level) Actors.questSpawns(); Save.write(); } },
  here(level) { return Game.s.warrants.list.filter((w) => w.taken && !w.done && w.level === level); },
  kill(e) {
    if (!e || !e.warrant) return; const w = Game.s.warrants.list.find((q) => q.id === e.warrant); if (!w || w.done) return;
    w.done = true; Game.s.cr += w.reward; Game.toast('Warrant served: ' + w.name + '. + ' + w.reward + ' cr', 'good'); Save.write();
  },
};
