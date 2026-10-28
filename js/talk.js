'use strict';
// ---------------------------------------------------------------------------
// Talk: conversations, on Tyrell's Voice (vendor/tycho/tyrell/docs/modules/voice.md).
// Stop someone and they greet you with what they're about; then they raise
// what's theirs to raise (a job for the bench, the thing you fixed coming
// back, a lead on a wreck, what they saw you do to a till), and you raise
// what you like from a few subjects (their work, what they do for fun, who's
// at home, what's going round). Each answer comes at them some way (straight,
// warm, a joke, a question, haggling, a lie, money: TALK_HOW) that lands well
// or badly with them, by their nature and how things stand; it warms or
// cools the talk, and a strong one moves their regard for you. Everyone runs
// out of patience in the end.
//
// The talk is Tyrell's state (Voice keeps it with the residents' minds, saved
// by City.stash), and every choice is an input Esper records. So that a
// replay offers the same, what the game knows that the minds don't (the jobs
// on offer, a lead due, your money) is kept in the world before a talk starts
// (`game:talk`, Talk.context), and what a talk does to the game (take a job,
// hand one back, pay, heat) comes out as 'talk:do' events, silent on a
// replay, carried out once the answer's done (Talk.flush): Jobs.take,
// Jobs.handBack, Tips.tell, Jobs.heat, as before.
//
// The words: most are Cityspeak lines (TALK_LINES: the most specific for the
// speaker and the moment), or a beat's own; the ones made from the game's own
// data (a customer's offer, a resident's day, a lead) are looked up here by
// their key (TALK_WORDS). Lin and the customers at the counter (Ozzy, Vey)
// aren't residents: they join Tyrell's world the first time you talk to them
// (TALK_STORY), each off in a place of their own, so they never meet the city.
// ---------------------------------------------------------------------------

// the ways of coming at someone, and how each lands (the listener as the
// person, you as the target): above 0 well, below badly
const TALK_HOW = { straight: 'straight', warm: 'warm', joke: 'joke', ask: 'ask', haggle: 'haggle', bluff: 'lie', bribe: 'bribe' };
const TALK_HARD = ['sal', 'goro', 'vin', 'vey']; // (warmth and jokes go down badly)
const talkHard = (c) => TALK_HARD.includes(c.person.id);
const TALK_APPROACH = [
  { id: 'straight', lands: [{ if: ['trait.honesty>0.65'], by: 1 }, { if: ['trait.talkative>0.8'], by: -1 }] },
  { id: 'warm', lands: [{ if: ['need.company>0.5'], by: 1 }, { if: ['mood<0.35'], by: 1 }, { if: [talkHard], by: -1 }] },
  { id: 'joke', lands: [{ if: ['trait.talkative>0.6'], by: 1 }, { if: ['mood>0.6'], by: 1 }, { if: ['mood<0.3'], by: -2 }, { if: ['need.energy>0.75'], by: -1 }, { if: ['is:child'], by: 1 }, { if: [talkHard], by: -1 }] },
  { id: 'ask', lands: [{ if: ['trait.talkative>0.5'], by: 1 }, { if: ['doing:work'], by: -1 }] },
  { id: 'haggle', lands: [{ if: ['trait.thrift>0.6'], by: -1 }, { if: ['regard>0.2'], by: 1 }, { if: ['file:target.fixed>0'], by: 1 }] },
  { id: 'bluff', base: -1, lands: [{ if: ['trait.courage<0.35'], by: 2 }, { if: ['regard>0.3'], by: 2 }, { if: ['trait.honesty>0.75'], by: -1 }] },
  { id: 'bribe', base: 1, lands: [{ if: ['trait.honesty>0.7'], by: -3 }, { if: ['trait.thrift>0.6'], by: 1 }, { if: ['money<60'], by: 1 }, { if: ['is:child'], by: 2 }] },
];
// the three at the counter who aren't residents
const TALK_STORY = {
  lin: { name: 'Auntie Lin', traits: { honesty: 0.9, talkative: 0.55, courage: 0.85, thrift: 0.9 } },
  ozzy: { name: 'Ozzy', traits: { honesty: 0.7, talkative: 0.85, courage: 0.5, thrift: 0.45 } },
  vey: { name: 'Vey', traits: { honesty: 0.6, talkative: 0.2, courage: 0.9, thrift: 0.5 } },
};
const TALK_BRIBE = 20; // what it costs to have someone not see what they saw

// Lines (Cityspeak): the goodbyes, the closings, how things land, and the
// words of the beats that don't come from the game's data. The most specific
// line that fits wins; {pay}, {more}, {mid}, {thing}, {what} are filled in.
const TALK_LINES = [
  { key: 'bye', topic: 'bye', text: ['Later.', 'Mind how you go.', 'See you around.'] },
  { key: 'bye.night', topic: 'bye', when: ['hour>=22'], text: ['Night.', 'Go home. It\'s late.'] },
  { key: 'bye.early', topic: 'bye', when: ['hour<6'], text: ['Get some sleep.'] },
  { key: 'bye.work', topic: 'bye', when: ['doing:work'], text: ['Back to it.', 'Shift\'s not over.'] },
  { key: 'bye.kid', topic: 'bye', who: ['is:child'], text: ['Bye!', 'See ya!'] },
  { key: 'bye.warm', topic: 'bye', when: ['regard>0.3'], text: ['Take care of yourself.', 'Come by any time.'] },
  { key: 'bye.cold', topic: 'bye', when: ['regard<-0.2'], text: ['Yeah. Go.', 'Mm.'] },
  { key: 'bye.lin', topic: 'bye', who: 'lin', text: ['Eat something.', 'Rent\'s Friday.'] },
  { key: 'bye.ozzy', topic: 'bye', who: 'ozzy', text: ['Stay dry.'] },
  { key: 'bye.vey', topic: 'bye', who: 'vey', text: ['...'] },
  { key: 'close', topic: 'close', text: ['Anyway. I\'ve got things to do.', 'I should go.'] },
  { key: 'close.work', topic: 'close', when: ['doing:work'], text: ['I\'m working. Go on.'] },
  { key: 'close.kid', topic: 'close', who: ['is:child'], text: ['I have to go now.'] },
  { key: 'close.lin', topic: 'close', who: 'lin', text: ['Customers. Go on.'] },
  { key: 'close.vey', topic: 'close', who: 'vey', text: ['That\'s enough talking.'] },
  // how it landed, when it landed hard
  { key: 'react.well', topic: 'react.well', text: ['Mm.'] },
  { key: 'react.badly', topic: 'react.badly', text: ['...'] },
  { key: 'react.joke.well', topic: 'react.joke.well', text: ['Ha!', 'Ha. Good one.'] },
  { key: 'react.joke.badly', topic: 'react.joke.badly', text: ['Funny.', 'Not funny.'] },
  { key: 'react.warm.well', topic: 'react.warm.well', text: ['That\'s kind.'] },
  { key: 'react.warm.badly', topic: 'react.warm.badly', text: ['Save it.'] },
  { key: 'react.haggle.badly', topic: 'react.haggle.badly', text: ['Don\'t push it.'] },
  { key: 'react.bluff.badly', topic: 'react.bluff.badly', text: ['Sure.'] },
  { key: 'react.bribe.badly', topic: 'react.bribe.badly', text: ['Put that away.'] },
  // a job for the bench
  { key: 'job.again', topic: 'job.again', text: 'Still broken. Still {pay} cr, if you want it.' },
  { key: 'job.again.ozzy', topic: 'job.again', who: 'ozzy', text: 'Still dark. Still eighty, still honest.' },
  { key: 'job.again.vey', topic: 'job.again', who: 'vey', text: 'The offer stands. I still can\'t pay.' },
  { key: 'job.agree', topic: 'job.agree', text: 'Fine. {more}. It had better work.' },
  { key: 'job.agree.ozzy', topic: 'job.agree', who: 'ozzy', text: '{more}. Don\'t tell Lin I paid it.' },
  { key: 'job.split', topic: 'job.split', text: 'Call it {mid}.' },
  { key: 'job.firm', topic: 'job.firm', text: '{pay}. That\'s what it\'s worth.' },
  { key: 'job.firm.kid', topic: 'job.firm', who: ['is:child'], text: 'It\'s all I\'ve got!' },
  { key: 'job.no', topic: 'job.no', text: ['Suit yourself.', 'Fine. Someone else, then.'] },
  { key: 'job.no.kid', topic: 'job.no', who: ['is:child'], text: 'Aw.' },
  { key: 'job.no.ozzy', topic: 'job.no', who: 'ozzy', text: 'I\'ll be at the counter if you change your mind.' },
  { key: 'job.no.vey', topic: 'job.no', who: 'vey', text: 'Then I\'ll find someone who asks fewer questions. There isn\'t anyone.' },
  // the hand-back
  { key: 'back.ask', topic: 'back.ask', text: 'Is it done?' },
  { key: 'back.ask.lin', topic: 'back.ask', who: 'lin', text: 'Well? Does it play?' },
  { key: 'back.ask.ozzy', topic: 'back.ask', who: 'ozzy', text: 'Tell me it lights up.' },
  { key: 'back.ask.vey', topic: 'back.ask', who: 'vey', text: 'Does it open?' },
  { key: 'back.half', topic: 'back.half', text: 'It\'ll do. Better than it was.' },
  { key: 'back.half.lin', topic: 'back.half', who: 'lin', text: 'It crackles. It\'ll do. I\'ll hit it when it goes.' },
  { key: 'back.flat', topic: 'back.flat', text: 'Don\'t joke. Does it work or not?' },
  // a witness: what they saw, and what you say to it
  { key: 'saw.doubt', topic: 'saw.doubt', text: '...Maybe I didn\'t see it right. Maybe.' },
  { key: 'saw.liar', topic: 'saw.liar', text: 'Don\'t lie to me as well.' },
  { key: 'saw.square', topic: 'saw.square', text: 'At least you say so. Not on this street again.' },
  { key: 'saw.owned', topic: 'saw.owned', text: 'Then you can tell it to the precinct.' },
  { key: 'saw.paid', topic: 'saw.paid', text: 'Didn\'t see a thing.' },
  { key: 'saw.insulted', topic: 'saw.insulted', text: 'You think I\'m for sale? Get out of my sight.' },
  { key: 'saw.kid.paid', topic: 'saw.paid', who: ['is:child'], text: 'Twenty! I didn\'t see ANYTHING.' },
  { key: 'saw.kid.insulted', topic: 'saw.insulted', who: ['is:child'], text: 'I\'m not taking that. I\'m telling my mom.' },
  { key: 'saw.kid.liar', topic: 'saw.liar', who: ['is:child'], text: 'Liar! I SAW you.' },
  { key: 'heard.shrug', topic: 'heard.shrug', text: 'They do. Forget I asked.' },
  { key: 'heard.doubt', topic: 'heard.doubt', text: 'Mm. If you say so.' },
  { key: 'heard.fair', topic: 'heard.fair', text: 'Junk\'s junk, I suppose.' },
];

// Words made from the game's own data, by key: (T, the kept context; n, the
// person; id, their id) => words, or a list of them. Their own quotes, if
// they have any (an offer that's half narration), are kept as they are.
const talkJob = (T, ...kinds) => { for (const k of kinds) { const j = (T.jobs || []).find((q) => q.kind === k || (k === 'took' && q.took) || (k === 'given' && q.kind === 'done')); if (j) return j; } return null; };
const TALK_WORDS = {
  greet: (T, n) => Talk.greeting(n),
  'job.offer': (T) => { const j = talkJob(T, 'job', 'took'); return j ? Jobs.def(j.id).offer : ''; },
  'job.what': (T) => { const j = talkJob(T, 'job', 'took'); return j ? TALK_WHAT[j.id] || TALK_WHAT[Jobs.def(j.id).dev] : ''; },
  'job.took': (T) => { const j = talkJob(T, 'took', 'job'), J = j && Jobs.def(j.id); return !J ? '' : J.odd ? 'Thank you. Send word through Lin when it\'s done.' : J.waiting; },
  'wait.ask': (T) => { const j = talkJob(T, 'jobwait'); return j ? Jobs.def(j.id).waiting : ''; },
  coming: () => 'It\'s fixed? I\'ll come by the White Dragon for it as soon as I can.',
  'back.thanks': (T) => { const j = talkJob(T, 'given', 'handback'), J = j && Jobs.def(j.id); return !J ? '' : J.pay ? J.thanks || 'That\'s it working. Thank you.' : 'I owe you.'; },
  'back.laugh': (T) => 'Ha. ' + TALK_WORDS['back.thanks'](T),
  'tip.start': (T) => { const id = T.tip || T.told; return id ? TIPS[id].say : ''; },
  'saw.start': (T, n, id) => { const b = City.w.reverie.beliefRecord(id, 'did:player:strip'), what = b && typeof b.v === 'string' ? b.v.replace(/^(a|an|the) /i, '') : 'machine'; return (TALK_SAW[id] || 'I saw you take the {what} apart. I\'m not blind.').replace('{what}', what); },
  'heard.start': (T, n, id) => { const b = City.w.reverie.beliefRecord(id, 'did:player:strip'), from = b && b.from && City.w.get(b.from); return `${from ? from.name : 'Someone'} says you've been stripping machines. Is that right?`; },
  'fixed.start': (T) => T.fixed ? (T.fixed.sour ? `That ${T.fixed.thing} you fixed for me died again. I'll think about it.` : `That ${T.fixed.thing} you fixed for me? Still going.`) : '',
  'small.work': (T, n, id) => { const R = RESIDENTS[id]; if (!R.gen && R.say.work) return R.say.work; const j = R.job, at = j && Census.places[j.place], where = at ? (at.kind === 'door' ? at.label : LEVELS[at.street].name) : 'the city'; return j ? `${talkA(j.title)} at ${where}. ${R.say.work || ''}`.trim() : ''; },
  'small.workmore': (T, n, id) => { const R = RESIDENTS[id], j = R.job, [a, b] = j ? j.shift : [9, 17], h = (x) => talkHour(x); return TALK_WORK[id] || `On at ${h(a)}, off at ${h(b)}. ${talkPick(['It pays. Mostly on time.', 'You meet people. You meet too many people.', 'Same as anywhere. Long.', 'The boss counts minutes. I count them back.'], id)}`; },
  'small.likes': (T, n, id) => { const R = RESIDENTS[id], k = Object.keys(R.likes || {})[0]; return TALK_LIKES[k] || 'Sleep. Is sleep a hobby?'; },
  'small.home': (T, n, id) => talkHome(id),
  'small.next': (T, n, id) => talkNext(id),
  'small.news': (T, n, id) => { const pool = townNews().concat(TOWN_SMALL), p = pool[Math.floor(hash(Game.s.day, Town.idn(id), 41) * pool.length)]; return p.join(' '); },
  'small.about': (T, n, id) => TALK_ABOUT[id] || Folk.who(id),
  'lin.word': () => {
    const w = City.w, talk = w.wormtongue.witnesses('player', 'strip').filter((q) => RESIDENTS[q]).length, h = Game.s.heat;
    const lines = [talk === 0 ? 'Mo\'s plums. Dara\'s knees. The usual.' : talk === 1 ? 'One of them\'s saying you strip machines. Not on my street.' : `${talk} of them are saying you strip machines. Not on my street.`];
    if (h >= 40) lines.push('And a detective had noodles here last night. Paid cash. Asked about the cellar.');
    if (Game.flag('ozzy:rides')) lines.push('Ozzy tells everyone his cab flies because of you. Tell him to stop.');
    return lines.join(' ');
  },
};
// what's wrong with it, asked: by job or by device
const TALK_WHAT = {
  ozzy: '"Dead since the Overpass run. It smelled like a fuse going, then nothing. The cell might be gone too."',
  vey: '"The servo in the elbow. It grinds, then it locks. The rest I can live with."',
  radio: '"Static. Then nothing. Then static again."', cooker: '"It clicks, the light comes on, and it never gets hot."',
  toydrone: '"The lights come on but the propellers don\'t!"', fan: '"It hums like it wants to, and doesn\'t."',
};
// what a witness says to your face, for some of the block's own
const TALK_SAW = {
  mo: 'My shop. My {what}. I saw you, you know.', ueda: 'In my bar. My {what}. I saw every second of it.', goro: 'The floor\'s got eyes, friend. I saw you at the {what}.',
  vin: 'I saw you at the {what}. Everybody in here did.', kai: 'I saw you take the {what} apart! That was so cool. And bad.', okonkwo: 'I saw you take the {what} apart. Forty years I worked machines. I know what I saw.',
  sato: 'I saw what you did to that {what}. I\'m old, not blind.', hana: 'The fox saw you at the {what}. So did I.',
};
// hobbies, said
const TALK_LIKES = {
  drink: 'A drink at the end of it. Somewhere with a lantern over the door.', pachi: 'Pachinko. The balls go down and the money goes with them. I love it.',
  watch: 'The pictures. Anything with rain in it.', dance: 'Dancing, at the Coil, when my feet let me.', arcade: 'The arcade. I hold the high score on two cabinets.',
  bathe: 'The bath. Hot water and other people\'s gossip.', loaf: 'Sitting. Watching. The city\'s a show if you let it be one.', festival: 'Lantern nights. Any festival, really.',
  pray: 'The shrine. Somebody should be asking.', play: 'Drones and cops! I\'m always the drone.', eat: 'Eating. Lin\'s, mostly. Don\'t tell my mother.',
};
// the block's own, about themselves
const TALK_ABOUT = {
  okonkwo: 'Forty years on the pumps under this street. Now I listen to them through the floor and tell them when they\'re wrong.',
  sato: 'Since before the towers went up. I keep a shrine for my brother, and I beat Mr Okonkwo at go.',
  teo: 'Ines and I came down from Kessler for the rent. We stayed for the noodles.', ines: 'Three years. Teo says two. Teo can\'t count.',
  rina: 'Kai was born at the Mercy, and I\'ve worked nights there since. Lin feeds him when I can\'t.', kai: 'My whole life! I\'m eleven.',
  dara: 'I ride the whole city and sleep on this street. It\'s the only one that doesn\'t smell of the Works.',
  mo: 'Twenty years behind that counter. The train from the Docks has been late for all of them.', jun: 'A year. I study at night and sell batteries between chapters.',
  sal: 'Long enough to know who to nod at. You, I\'m still deciding.', wen: 'The block association pays me to sweep. Nobody pays me to remember, but I do that too.',
  ueda: 'The Red Lantern was my father\'s. The sake was his too, some of it.', mina: 'Lio owns the Menagerie. I run it. The owl knows the difference.',
  goro: 'I walk the floor at Lucky Seven. Twelve years. The machines know me.', pip: 'I show the pictures at the Orpheum and I tear the tickets. Same pay as one job.',
  vin: 'I pour at the Coil. Before that I don\'t talk about.', hana: 'The fox and I keep the shrine. The fox does most of it.',
};
// the work, asked about, for some of the block's own
const TALK_WORK = {
  dara: 'Forty drops a day. Stairs, mostly. The lifts are all broken or watched.', mo: 'Up at five for the delivery, and the delivery\'s never all there.',
  jun: 'Graveyard shift. People buy strange things at three in the morning. I don\'t ask.', rina: 'Nights on the ward. Burns, mostly, from the Works. And chrome that won\'t take.',
  teo: 'Room service for people who send it back. I eat what comes back.', ines: 'Parcels. Some tick. Some leak. You learn not to shake them.',
  ueda: 'You pour, you listen, you don\'t repeat. That\'s the whole trade.', goro: 'Walk the floor. Watch the hands. Everyone thinks they\'re the first to try it.',
};
const talkA = (t) => (/^[aeiou]/i.test(t) ? 'An ' : 'A ') + t.toLowerCase();
const talkHour = (h) => { h = ((h % 24) + 24) % 24; const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return (hh % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (hh < 12 ? ' in the morning' : hh < 18 ? ' in the afternoon' : ' at night'); };
const talkPick = (list, id) => list[Math.floor(hash(Town.idn(id), list.length, 43) * list.length)];
const talkFirst = (name) => name.replace(/^(Mr|Mrs|Old|Master|Keeper|Mechanic|Nurse) /, '').split(' ')[0];
// who's at home with them
function talkHome(id) {
  const R = RESIDENTS[id], hh = R.hh && Folk.households.find((h) => h.id === R.hh), others = hh ? hh.members.filter((m) => m !== id) : [];
  const kids = others.filter((m) => RESIDENTS[m].age === 'kid').map((m) => RESIDENTS[m].name), big = others.filter((m) => RESIDENTS[m].age !== 'kid').map((m) => talkFirst(RESIDENTS[m].name));
  if (R.age === 'kid') return big.length ? `${big.join(' and ')}. ${kids.length ? 'And ' + kids.join(' and ') + '. They\'re the worst.' : 'Just us.'}` : 'Just me and my mom.';
  if (!others.length) return R.age === 'senior' ? 'Just me and the radio.' : 'Just me. It\'s a capsule. There\'s room for me or my shoes.';
  if (kids.length) return `${big.length ? big.join(' and ') + ', and ' : ''}the kids: ${kids.join(' and ')}. It\'s loud. It\'s good.`;
  return `${big.join(' and ')}. ${R.age === 'senior' ? 'Forty years. She still laughs at my jokes.' : 'Small place. We manage.'}`;
}
// what's next in their day
function talkNext(id) {
  const plan = Town.plans && Town.plans[id], h = Game.hour();
  if (plan) { const e = plan.find((q) => q.h > h + 0.2) || plan[0]; return `${TOWN_GOING[e.act] || 'Then home.'} About ${talkHour(e.h)}.`; }
  const R = RESIDENTS[id];
  if (R.job) { const [a] = R.job.shift; return `Work, ${talkHour(a)}. Then sleep, if the neighbors let me.`; }
  if (R.age === 'kid') return 'Play! Then dinner. Then more play, if Mom\'s not looking.';
  return 'Home, eventually. The day goes where it wants.';
}

const Talk = {
  n: null, id: null, view: null, queue: [], how: null,
  // ---- the definitions: once per world (from City.make) -------------------
  declare(w) {
    const v = w.voice;
    // Lin, Ozzy and Vey: a place of their own each, and a life there that
    // needs nothing (they join the world when first talked to: Talk.ensure)
    for (const id in TALK_STORY) w.place({ id: 'story:' + id, name: TALK_STORY[id].name, tags: ['story'] });
    w.action({ id: 'own', at: 'home', minutes: 720, who: ['is:story'], relieves: { hunger: 1, energy: 1, fun: 1, company: 1, chores: 1 }, rates: { hunger: 0, energy: 0, fun: 0, company: 0, chores: 0 }, label: 'their own life', pose: 'stand' });
    for (const a of TALK_APPROACH) v.approach(a);
    w.cityspeak.addLines(TALK_LINES);
    // patience: more for the chatty, less at work or worn out; the three at the counter have time
    const L = (c, t) => Number(c.world.lang.value(t, c)) || 0;
    v.patience = (c) => (c.person.def.tags.includes('story') ? 8 : Math.max(3, 5 + (L(c, 'trait.talkative') > 0.7 ? 2 : 0) - (c.world.lang.value('doing:work', c) ? 2 : 0) - (L(c, 'need.energy') > 0.75 ? 1 : 0)));
    w.on('talk:do', (d) => this.queue.push(d));
    // ---- reading the kept context, and changing it as the talk goes
    const T = (c) => { const t = c.world.s.game.talk; return t && c.person && t.who === c.person.id ? t : null; };
    const J = (c, k) => { const t = T(c); return (t && t.jobs.find((j) => j.kind === k)) || null; };
    const has = (k) => (c) => !!J(c, k);
    const res = (r) => (c) => { const j = J(c, 'handback'); return !!j && j.res === r; };
    const does = (what, o = {}) => (c) => {
      const t = T(c); if (!t) return;
      const out = Object.assign({ what, who: c.person.id }, o);
      if (what === 'take' || what === 'deal') { const j = J(c, 'job'); if (!j) return; out.job = j.id; if (what === 'take') { j.kind = 'jobwait'; j.took = true; out.pay = j.deal; } else out.pay = j.deal = j[o.at]; }
      if (what === 'back') { const j = J(c, 'handback'); if (!j) return; j.kind = 'done'; out.job = j.id; }
      if (what === 'tip') { if (!t.tip) return; out.tip = t.told = t.tip; t.tip = null; }
      if (what === 'pay') t.cr -= o.n;
      c.world.emit('talk:do', out);
    };
    const who = (id) => (c) => c.person.id === id;
    const resident = (c) => !!RESIDENTS[c.person.id];
    const learn = (key, val) => (c) => c.world.voice.applyLearn(c.person.id, c.target, key, val(c));
    // what someone believes they saw you do (or heard), not yet had out with you
    const strip = (src, thread) => (c) => {
      const rv = c.world.reverie, b = rv.beliefRecord(c.person.id, 'did:player:strip');
      if (!b || b.silenced || rv.belief(c.person.id, 'did:player:strip') === undefined || (src === 'saw') !== (b.src === 'saw')) return false;
      const seen = c.world.voice.history(c.person.id, c.target).seen[thread];
      return seen === undefined || seen < b.t;
    };
    const hush = (c) => c.world.reverie.applySilence(c.person.id, 'did:player:strip');
    // (what they saw comes first, then what they heard; business after)
    const calm = (c) => !strip('saw', 'saw')(c) && !strip('told', 'heard')(c);
    // ---- a job for the bench: pitched by them, or raised again by you
    const TAKE = { say: 'I\'ll take it.', job: 'take', then: [does('take')], to: 'took' };
    const HAGGLE = { say: 'Make it {more}.', approach: 'haggle', if: [(c) => { const j = J(c, 'job'); return !!j && j.more > j.pay && j.deal === undefined; }], to: [{ landed: 'well', to: 'agree' }, { landed: 'even', to: 'split' }, { to: 'firm' }] };
    const NO = { say: 'Not this one.', to: 'no' };
    const jobBeats = (first) => ({
      start: { line: first ? 'job.offer' : 'job.again', answers: [TAKE, { say: 'What\'s wrong with it?', approach: 'ask', to: 'what' }, HAGGLE, NO] },
      what: { line: 'job.what', answers: [TAKE, HAGGLE, NO] },
      agree: { line: 'job.agree', then: [does('deal', { at: 'more' })], answers: [TAKE, NO] },
      split: { line: 'job.split', then: [does('deal', { at: 'mid' })], answers: [TAKE, NO] },
      firm: { line: 'job.firm', then: ['warmth-=1'], answers: [TAKE, NO] },
      took: { line: 'job.took', end: true },
      no: { line: 'job.no', end: true },
    });
    const thing = (k) => (c) => { const j = J(c, k); return j ? j.thing : 'it'; };
    v.thread({ id: 'job', theirs: true, cooldown: 60, if: [has('job'), calm], label: (c) => 'The ' + thing('job')(c), beats: jobBeats(true) });
    v.thread({ id: 'job.again', weight: 4, cooldown: 1, if: [has('job'), 'talked:job'], label: (c) => 'About the ' + thing('job')(c), beats: jobBeats(false) });
    v.thread({ id: 'wait', weight: 3, cooldown: 120, if: [has('jobwait')], label: (c) => 'About the ' + thing('jobwait')(c), beats: {
      start: { line: 'wait.ask', answers: [
        { say: 'It\'s on the bench. Soon.', approach: 'straight', to: 'ok' },
        { say: 'Genius takes time.', approach: 'joke', to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] }] },
      ok: { text: ['Good.', 'Good. I\'m counting on it.'], end: true }, laugh: { text: 'Ha. Genius. Sure.', end: true }, flat: { text: 'So does rent.', end: true } } });
    v.thread({ id: 'coming', weight: 3, cooldown: 120, if: [has('coming')], label: (c) => 'Your ' + thing('coming')(c) + '\'s fixed', beats: { start: { line: 'coming', end: true } } });
    // ---- the hand-back: what they ask, what you say, what they say
    const GOOD = { say: 'Good as new.', approach: 'straight', if: [res('works')], job: 'back', to: 'thanks' };
    const HALF = { say: 'It works. Mostly.', approach: 'straight', if: [res('half')], job: 'back', to: 'half' };
    v.thread({ id: 'back', theirs: true, cooldown: 1, if: [has('handback'), calm], label: 'The hand-back', beats: {
      start: { line: 'back.ask', answers: [GOOD, HALF, { say: 'Only smoked a little.', approach: 'joke', to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] }] },
      flat: { line: 'back.flat', answers: [GOOD, HALF] },
      thanks: { line: 'back.thanks', then: [does('back')], end: true },
      half: { line: 'back.half', then: [does('back')], end: true },
      laugh: { line: 'back.laugh', then: [does('back')], end: true } } });
    // ---- a lead: something they've heard of, for you
    v.thread({ id: 'tip', theirs: true, cooldown: 1, if: [(c) => !!(T(c) && T(c).tip), calm], label: 'A lead', beats: {
      start: { line: 'tip.start', then: [does('tip')], answers: [{ say: 'Thanks. I\'ll take a look.', approach: 'warm' }, { say: 'What do you want for it?', approach: 'ask', to: 'why' }] },
      why: { text: 'Nothing. Somebody ought to get some use out of it.', then: ['regard+=0.02'], end: true } } });
    // ---- a witness: they saw you strip a machine, or heard you did
    v.thread({ id: 'saw', theirs: true, cooldown: 1, if: [strip('saw', 'saw')], label: 'What they saw', beats: {
      start: { line: 'saw.start', answers: [
        { say: 'Wasn\'t me.', approach: 'bluff', to: [{ landed: 'well', to: 'doubt' }, { to: 'liar' }] },
        { say: 'It was me. I needed the parts.', approach: 'straight', to: [{ landed: 'well', to: 'square' }, { to: 'owned' }] },
        { say: 'Here. ' + TALK_BRIBE + ' cr. You didn\'t see it.', label: 'Pay them off · ' + TALK_BRIBE + ' cr', approach: 'bribe', soft: true, if: [(c) => (T(c) || { cr: 0 }).cr >= TALK_BRIBE], to: [{ landed: 'badly', to: 'insulted' }, { to: 'paid' }] }] },
      doubt: { line: 'saw.doubt', then: [hush], end: true },
      liar: { line: 'saw.liar', then: ['regard-=0.1', does('heat', { n: 4, why: 'didn\'t believe you' })], end: true },
      square: { line: 'saw.square', then: [hush, 'regard-=0.02'], end: true },
      owned: { line: 'saw.owned', then: ['regard-=0.05', does('heat', { n: 3, why: 'won\'t keep it quiet' })], end: true },
      paid: { line: 'saw.paid', then: [hush, 'money+=' + TALK_BRIBE, does('pay', { n: TALK_BRIBE })], end: true },
      insulted: { line: 'saw.insulted', then: ['regard-=0.15', does('heat', { n: 6, why: 'won\'t be bought' })], end: true } } });
    v.thread({ id: 'heard', theirs: true, cooldown: 1, if: [strip('told', 'heard'), (c) => !strip('saw', 'saw')(c)], label: 'What they heard', beats: {
      start: { line: 'heard.start', answers: [
        { say: 'People talk.', approach: 'bluff', to: [{ landed: 'well', to: 'shrug' }, { to: 'doubt' }] },
        { say: 'Only junk nobody wanted.', approach: 'straight', to: 'fair' },
        { say: 'Me? I can\'t fix my own kettle.', approach: 'joke', to: [{ landed: 'badly', to: 'doubt' }, { to: 'shrug' }] }] },
      shrug: { line: 'heard.shrug', then: ['forget:did:player:strip'], end: true },
      doubt: { line: 'heard.doubt', then: ['regard-=0.03'], end: true },
      fair: { line: 'heard.fair', then: [hush], end: true } } });
    // ---- the thing you fixed for them, after
    const sour = (c) => !!(T(c) && T(c).fixed && T(c).fixed.sour);
    v.thread({ id: 'fixed', theirs: true, cooldown: 3 * 1440, if: [(c) => !!(T(c) && T(c).fixed), calm], label: 'What you fixed', beats: {
      start: { line: 'fixed.start', answers: [
        { say: 'Glad it\'s holding.', approach: 'warm', if: [(c) => !sour(c)] },
        { say: 'Bring me the next thing that breaks.', approach: 'straight', if: [(c) => !sour(c)], to: 'more' },
        { say: 'Bring it by. I\'ll look at it again.', approach: 'warm', if: [sour], to: 'sorry' },
        { say: 'Scrap does that.', approach: 'straight', if: [sour], to: 'cold' }] },
      more: { text: 'I will. I\'ll tell people, too.', then: ['regard+=0.02'], end: true },
      sorry: { text: 'Maybe. When I trust it again.', then: ['regard+=0.03'], end: true },
      cold: { text: 'So do promises.', then: ['regard-=0.03'], end: true } } });
    // ---- small talk, from their lives: work, fun, home, the day, the news
    const R = (c) => RESIDENTS[c.person.id];
    v.thread({ id: 'work', if: [resident, (c) => !!R(c).job], reveals: 'work', label: (c) => (c.person.doing && c.person.doing.action === 'work' ? 'Busy?' : 'How\'s work?'), beats: {
      start: { line: 'small.work', then: [learn('work', (c) => R(c).job.title)], answers: [
        { say: 'What\'s that like?', approach: 'ask', to: 'like' },
        { say: 'Sounds hard.', approach: 'warm', to: 'warm' },
        { say: 'Ever think of robbing the place?', approach: 'joke', to: [{ landed: 'badly', to: 'shocked' }, { to: 'laugh' }] }] },
      like: { line: 'small.workmore', end: true },
      warm: { text: ['It is. Thanks for asking.', 'Somebody has to. Thanks.'], then: ['need.company-=0.05'], end: true },
      laugh: { text: ['Every day. Then I count the till.', 'Ha. Don\'t tempt me.'], end: true },
      shocked: { text: ['Don\'t even joke.', 'Not funny. People lose jobs for less.'], then: ['regard-=0.02'], end: true } } });
    v.thread({ id: 'likes', if: [resident, (c) => Object.keys(R(c).likes || {}).length > 0], reveals: 'likes', label: 'What do you do for fun?', beats: {
      start: { line: 'small.likes', then: [learn('likes', (c) => Object.keys(R(c).likes)[0])], answers: [
        { say: 'Sounds good.', approach: 'warm' },
        { say: 'Take me along sometime.', approach: 'joke', warmth: 1, soft: true, to: [{ landed: 'badly', to: 'alone' }, { to: 'yes' }] },
        { say: 'Doesn\'t sound like much.', approach: 'straight', to: 'cold' }] },
      yes: { text: 'Maybe. If you\'re buying.', then: ['regard+=0.02'], end: true }, alone: { text: 'I go alone. That\'s the point.', end: true },
      cold: { text: 'It\'s mine. That\'s enough.', then: ['regard-=0.02'], end: true } } });
    v.thread({ id: 'home', if: [resident, (c) => !!R(c).homePlace], reveals: 'home', label: 'Who\'s at home?', weight: 0.8, beats: {
      start: { line: 'small.home', then: [learn('home', (c) => R(c).hh || 'alone')], answers: [
        { say: 'Sounds nice.', approach: 'warm' },
        { say: 'Sounds crowded.', approach: 'joke', to: [{ landed: 'badly', to: 'cold' }, { to: 'laugh' }] }] },
      laugh: { text: 'Ha. You have no idea.', end: true }, cold: { text: 'It\'s home.', end: true } } });
    v.thread({ id: 'next', if: [resident], label: 'What\'s after this?', weight: 0.7, beats: { start: { line: 'small.next', end: true } } });
    v.thread({ id: 'news', if: [(c) => resident(c) || c.person.id === 'ozzy'], label: 'Heard anything?', weight: 0.9, beats: {
      start: { line: 'small.news', answers: [{ say: 'Sounds about right.', approach: 'straight' }, { say: 'This city.', approach: 'joke' }] } } });
    v.thread({ id: 'about', if: [(c) => !!TALK_ABOUT[c.person.id]], reveals: 'about', label: 'How long have you been around here?', beats: {
      start: { line: 'small.about', then: [learn('about', () => true)], answers: [{ say: 'Glad you stayed.', approach: 'warm' }, { say: 'Why stay?', approach: 'ask', to: 'why' }] },
      why: { text: ['Where else? Up is for people with money. Down is for people with less.', 'Lin\'s noodles. Don\'t laugh. It\'s true.'], end: true } } });
    // ---- Lin, and the two at the counter
    v.thread({ id: 'lin.bar', if: [who('lin')], label: 'How\'s business?', beats: {
      start: { text: 'Full at six, empty at two, and the rent\'s the same either way.', answers: [
        { say: 'The broth\'s worth it.', approach: 'warm', to: 'pleased' }, { say: 'Put the prices up.', approach: 'straight', to: 'prices' }] },
      pleased: { text: 'Flattery. Eat, then.', end: true }, prices: { text: 'And lose Mr Okonkwo? He\'s been on that stool since his wife.', end: true } } });
    v.thread({ id: 'lin.cellar', if: [who('lin')], label: 'About the cellar', beats: {
      start: { text: 'The cellar is yours as long as the rent comes and nobody lifts that rug.', answers: [
        { say: 'I owe you, Lin.', approach: 'warm', to: 'owe' }, { say: 'What\'s really in the broth?', approach: 'joke', to: 'broth' }] },
      owe: { text: 'You do. Fix the radio when it goes again.', then: ['regard+=0.02'], end: true },
      broth: { text: 'Nobody asks what you do down there. Nobody asks me what\'s in the broth either.', end: true } } });
    v.thread({ id: 'lin.word', if: [who('lin')], label: 'What are people saying?', weight: 1.4, cooldown: 360, beats: { start: { line: 'lin.word', end: true } } });
    v.thread({ id: 'ozzy.cab', if: [who('ozzy')], label: 'How\'s the cab trade?', beats: {
      start: { text: 'Fares are down. Everyone flies themselves now, or doesn\'t fly at all.', answers: [{ say: 'Rain\'ll bring them back.', approach: 'warm' }, { say: 'Fly lower. Cheaper.', approach: 'joke' }] } } });
    v.thread({ id: 'vey.arm', if: [who('vey')], label: 'About the arm', approach: 'ask', beats: {
      start: { text: 'Don\'t look at the arm. Everyone looks at the arm.', answers: [
        { say: 'I wasn\'t looking.', approach: 'warm', to: 'thanks' }, { say: 'Where\'s it from?', approach: 'ask', to: 'from' }] },
      thanks: { text: '...Thank you.', then: ['regard+=0.03'], end: true },
      from: { text: 'Somebody cut the serials off before I got it. Don\'t ask where I got it.', then: ['sore:vey.arm=2'], end: true } } });
  },
  // ---- who someone is to the minds -----------------------------------------
  // a resident, or one of the three at the counter (Lin, Ozzy, Vey); null for
  // anyone else (they keep their lines in a bubble)
  idOf(n) { return n.def.town || (n.def.job && TALK_STORY[n.def.job] ? n.def.job : n.def.role === 'noodles' ? 'lin' : null); },
  can(n) { return City.on && !!City.w.voice && !!this.idOf(n); },
  // Lin, Ozzy and Vey join the world the first time they're talked to
  ensure(id) {
    const S = TALK_STORY[id]; if (!S || City.w.get(id)) return;
    City.w.person(id, { name: S.name, home: 'story:' + id, place: 'story:' + id, tags: ['story'], traits: S.traits, routine: [[0, 'home', 'own', { rank: 2 }]], needs: { hunger: 0, energy: 0, fun: 0, company: 0, chores: 0 }, vars: { money: 100 } });
  },
  // what the game knows that the minds don't, kept in the world for the talk
  context(n, id) {
    const s = Game.s, jobs = Jobs.actionsFor(n.def.name).map((a) => {
      const J = Jobs.def(a.id), d = Jobs.dev(a.id), hg = Jobs.haggle(a.id);
      return { id: a.id, kind: a.kind, thing: J.title.replace(/^.*?'s /, ''), pay: J.pay || 0, more: hg.more, mid: hg.mid, res: d && d.tested ? d.tested.res : null };
    });
    const done = RESIDENTS[id] ? Object.keys(s.jobs).filter((k) => k.startsWith('odd:') && s.jobs[k].res === id && s.jobs[k].st === 'done') : [], last = done.length ? s.jobs[done[done.length - 1]] : null;
    return { who: id, jobs, cr: s.cr, tip: RESIDENTS[id] ? Tips.dueFrom(id) : null, fixed: last ? { thing: ODD[last.tpl].name, sour: (s.flags['sour:' + id] || 0) > s.day } : null };
  },
  kept() { const t = City.on && City.w.s.game.talk; return t && t.who === this.id ? t : {}; },
  // ---- the talk, from the game's side ---------------------------------------
  // start one and show it (false if Voice can't: the caller does what it did before)
  open(n) {
    if (!this.can(n)) return false;
    const w = City.w, id = this.idOf(n);
    this.ensure(id);
    if (w.voice.current()) w.voice.end(); // (a talk left over from before a reload)
    w.keep('talk', this.context(n, id));
    const v = w.voice.start(id); if (!v) return false;
    this.n = n; this.id = id; this.view = v; this.how = null;
    n.face = Math.sign(Player.x - n.x) || n.face;
    this.flush();
    Hud.toggle('talk', n);
    return true;
  },
  showing(n) { return !!this.view && this.n === n && Hud.open === 'talk'; },
  // an answer: said, and what it leads to; goodbye ends it, their last word over their head
  answer(i) {
    if (!this.view) return;
    const opt = this.view.answers.find((a) => a.i === i);
    this.how = opt && (opt.kind === 'answer' || opt.kind === 'thread') ? opt.approach || null : null; // (how what you said came at them, for the panel)
    const v = City.w.voice.answer(i); this.view = v;
    this.flush();
    if (!v || v.ended) {
      const n = this.n, bye = v && v.lines.filter((l) => l.who === 'them').pop();
      Hud.toggle(null);
      if (n && bye) Actors.say(n, this.words(bye, n));
      return;
    }
    Hud.panel('talk');
  },
  // the panel closed (walked off): the talk's over, without a goodbye
  close() { if (this.view && City.on && City.w.voice.current()) City.w.voice.end(); this.n = this.id = this.view = null; },
  // what the talk did to the game, carried out now it's done
  flush() {
    const q = this.queue; this.queue = [];
    for (const d of q) {
      const R = this.n ? this.n.def.name : (City.w.get(d.who) || {}).name;
      if (d.what === 'take') Jobs.take(d.job, d.pay);
      if (d.what === 'back') Jobs.handBack(d.job, false, true);
      if (d.what === 'tip') Tips.tell(d.tip);
      if (d.what === 'heat') Jobs.heat(d.n, `${R} ${d.why}.`);
      if (d.what === 'pay') { Game.pay({ cr: d.n }); Game.toast(`You pay ${R} ${d.n} cr.`); }
    }
    if (q.length) { Hud.refresh(); Save.write(); }
  },
  // ---- the words -------------------------------------------------------------
  greeting(n) { const id = this.idOf(n); if (n.def.town) return Town.talkLine(n, true); if (id === 'lin') return n.def.lines[(n.line || 0) % n.def.lines.length]; const J = JOBS[id]; return J && J.lines ? J.lines[0] : '...'; },
  fills(n) {
    const T = this.kept(), j = talkJob(T, 'job', 'took') || {};
    return { name: n.def.name, pay: j.deal || j.pay, more: j.more, mid: j.mid, thing: j.thing };
  },
  fill(s, F) { return String(s).replace(/\{(\w+)\}/g, (m, k) => (F[k] !== undefined ? F[k] : m)); },
  // a line as words (or a list of them)
  words(l, n) {
    const T = this.kept(), F = this.fills(n);
    if (l.who === 'note') return TALK_NOTE[l.learned] ? TALK_NOTE[l.learned](this.id, l.value) : '';
    const w = l.text !== undefined ? l.text : TALK_WORDS[l.key] ? TALK_WORDS[l.key](T, n, this.id) : '';
    return Array.isArray(w) ? w.map((q) => this.fill(q, F)) : this.fill(w, F);
  },
  quote(s) { return /"/.test(s) ? s : `"${s}"`; },
  // ---- the panel -----------------------------------------------------------
  panel(n) {
    const v = this.view, F = this.fills(n), T = this.kept();
    let h = '<div class="talk">';
    for (const l of v.lines.filter((q) => q.who !== 'note').concat(v.lines.filter((q) => q.who === 'note'))) { // (what you learned, after what they said)
      const w = this.words(l, n); if (!w || (Array.isArray(w) && !w.length)) continue;
      if (l.who === 'you') h += `<p class="you">${this.quote(w)}${this.how && v.landed !== 'even' && l === v.lines.find((q) => q.who === 'you') ? ` <i class="${v.landed}">${v.landed === 'well' ? '· it lands' : '· it falls flat'}</i>` : ''}</p>`;
      else if (l.who === 'note') h += `<p class="note">${w}</p>`;
      else if (l.who === 'aside') h += `<p class="dim">${w}</p>`;
      else h += (Array.isArray(w) ? w : [w]).map((q) => `<p class="sub">${this.quote(q)}</p>`).join('');
    }
    h += '</div>' + this.card(v, T);
    const pick = v.answers.filter((a) => a.kind === 'answer' || a.kind === 'thread'), rest = v.answers.filter((a) => a.kind === 'drop' || a.kind === 'bye');
    if (pick.length) h += '<div class="buttons answers">' + pick.map((a) => this.button(a, v, T, F)).join('') + '</div>';
    const role = n.def.role ? NPC_ROLE[n.def.role] : null;
    h += `<div class="buttons">${role ? `<button data-role="1">${role.verb}</button>` : ''}${rest.map((a) => `<button data-say="${a.i}" class="quiet">${a.kind === 'drop' ? 'Let it lie' : 'Goodbye'}</button>`).join('')}</div>`;
    return [n.def.title ? `${n.def.name} · ${n.def.title}` : n.def.name, h];
  },
  // an answer, as a button: a job's take and hand-back are the main ones
  button(a, v, T, F) {
    const def = a.kind === 'answer' && v.thread ? City.w.voice.threads.get(v.thread.id).beats[v.thread.beat].answers[+a.id.slice(1)] : null;
    const j = def && def.job ? talkJob(T, def.job === 'take' ? 'job' : 'handback') : null;
    const text = this.fill(a.kind === 'thread' ? a.label : a.label || a.say, F);
    return `<button data-say="${a.i}"${j ? ` data-job="${def.job}:${j.id}" class="go"` : ''}${a.ok ? '' : ' disabled'}>${text}${a.approach ? ` <small>${TALK_HOW[a.approach] || a.approach}</small>` : ''}</button>`;
  },
  // the job the talk is about, as a card: the offer (what it pays, what it'd
  // mean), the hand-back (how it tested), what it's waiting on, when they'll come
  card(v, T) {
    const th = v.thread && v.thread.id, jobs = T.jobs || [];
    if (th === 'job' || th === 'job.again') {
      const j = talkJob(T, 'job', 'took'); if (!j) return '';
      const J = Jobs.def(j.id), pay = j.deal || j.pay, aside = Game.s.bench && !j.took ? 'It\'ll wait in the basement, set aside, till your bench is free.' : '';
      return `<div class="ask"><h3>${J.title}${pay ? ' · ' + pay + ' cr' : ' · a favor'}</h3>${J.illegal ? '<p class="dim">Illegal work: while it\'s on your bench, it\'s heat.</p>' : ''}${aside ? `<p class="dim">${aside}</p>` : ''}</div>`;
    }
    if (th === 'back') {
      const j = talkJob(T, 'handback', 'given'), b = j && Jobs.dev(j.id); if (!b || !b.tested) return '';
      const J = Jobs.def(j.id), t = b.tested, trace = Jobs.traced(b), pay = J.pay ? (t.res === 'works' ? J.pay : Math.round(J.pay / 2)) : 0;
      return `<div class="ask"><h3>${J.title}</h3><p class="dim">${t.res === 'works' ? 'It works' : 'It half works'}${t.loose ? `, and ${t.loose} screw${t.loose > 1 ? 's' : ''} won't hold` : ''}.${trace ? ' There\'s a Meridian serial in it that isn\'t theirs.' : ''}${pay ? ` ${pay} cr.` : ''}</p></div>`;
    }
    if (th) return '';
    // at the hub: what's waiting on you, and what's ready for them
    return jobs.filter((j) => j.kind === 'jobwait' || j.kind === 'coming').map((j) => {
      const J = Jobs.def(j.id);
      if (j.kind === 'coming') { const d = Jobs.dev(j.id); return d && d.tested ? `<div class="ask"><h3>${J.title}</h3><p class="dim">Lin will hand it over when they come in, and they'll pay you then: ${d.tested.res === 'works' ? J.pay : Math.round(J.pay / 2)} cr.</p></div>` : ''; }
      return `<div class="ask"><h3>${J.title}</h3>${Jobs.needs(j.id) || '<p class="dim">It\'s on your bench in the basement.</p>'}</div>`;
    }).join('');
  },
};
// what you'll remember of them, when you've learned it
const TALK_NOTE = {
  work: (id, v) => `You'll remember: ${RESIDENTS[id].name}, ${String(v).toLowerCase()}.`,
  likes: (id, v) => `You'll remember: ${RESIDENTS[id].name} likes ${TALK_LIKE_WORD[v] || v}.`,
  home: (id) => `You'll remember who's at home with ${talkFirst(RESIDENTS[id].name)}.`,
  about: (id) => `You'll remember ${talkFirst(RESIDENTS[id].name)}'s story.`,
};
const TALK_LIKE_WORD = { drink: 'a drink', pachi: 'pachinko', watch: 'the pictures', dance: 'dancing', arcade: 'the arcade', bathe: 'the bath', loaf: 'sitting and watching', festival: 'festivals', pray: 'the shrine', play: 'playing out', eat: 'Lin\'s noodles' };
