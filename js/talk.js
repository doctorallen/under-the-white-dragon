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
//
// What you learn of someone (their work, what they like, who's at home, their
// story) you keep, and once you know it you can ask after it: "How's the
// sweeping?", their children by name, their hobby (the recall subjects and
// answers, Voice's `recalls`, landing better than small talk; the words fill
// {learned.<key>:<form>} through talkRemembered). Someone who knows you takes
// everything better, and known well, offers what they'd offer nobody else
// (the favor thread: a friend's price, a lead, a job). That's known.js.
//
// A talk follows itself. It opens on what they're at when you stop them (on
// shift, at their fun, on an errand, on their way: Voice's `opens`, their
// greeting with answers to it), every subject says what it's about (work,
// fun, home, the day, the street, a job: `about`), and what comes up next
// is what's near what was just said (Voice's followPull, T.talk.follow);
// answers lead on into the subject they touch (doors, 'thread:<id>'), and
// what you've just learned isn't asked after in the same breath.
// ---------------------------------------------------------------------------

// the ways of coming at someone, and how each lands (the listener as the
// person, you as the target): above 0 well, below badly
// narrower than this (CSS px), the talk takes the whole screen
const TALK_NARROW = 700;
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
  'small.work': (T, n, id) => { const R = RESIDENTS[id], shift = T.moment && T.moment.kind === 'work'; if (!R.gen && R.say.work && !shift) return R.say.work; // (stopped at it, their greeting was that already)
    if (shift) { const j = talkWork(id); return !j ? '' : j.duty ? j.title + '.' : `${talkA(j.title)} at ${talkWorkWhere(id)}.`; } const j = talkWork(id); if (j && j.duty) return R.say.sweep || j.title + '.'; return j ? `${talkA(j.title)} at ${talkWorkWhere(id)}. ${R.say.work || ''}`.trim() : ''; },
  'small.shift': (T, n, id) => { const j = talkWork(id), [a, b] = j && j.shift ? j.shift : [9, 17]; return `${TALK_WORK[id] && j && j.duty ? TALK_WORK[id] : `On at ${talkHour(a)}, off at ${talkHour(b)}.`} ${talkPick(['Not that I\'m counting.', 'If they let me go on time.', 'The clock\'s slower on shift. Everyone knows that.'], id + 's')}`; },
  'small.workmore': (T, n, id) => { const R = RESIDENTS[id], j = talkWork(id), [a, b] = j && j.shift ? j.shift : [9, 17], h = (x) => talkHour(x); return TALK_WORK[id] || `On at ${h(a)}, off at ${h(b)}. ${talkPick(['It pays. Mostly on time.', 'You meet people. You meet too many people.', 'Same as anywhere. Long.', 'The boss counts minutes. I count them back.'], id)}`; },
  'small.likes': (T, n, id) => { const R = RESIDENTS[id], k = Object.keys(R.likes || {})[0]; return TALK_LIKES[k] ? talkPick(TALK_LIKES[k], id) : 'Sleep. Is sleep a hobby?'; },
  'small.likesmore': (T, n, id) => { const k = City.w.voice.learned(id).likes; return TALK_LIKES_ASK[k] ? talkPick(TALK_LIKES_ASK[k][1], id) : ''; },
  'small.likeswith': (T, n, id) => talkWith(id),
  'small.kids': (T, n, id) => talkKids(id),
  'small.met': (T, n, id) => talkPick(TALK_MET, id),
  'small.home': (T, n, id) => talkHome(id),
  'small.next': (T, n, id) => talkNext(id),
  'small.news': (T, n, id) => { const pool = townNews().concat(Object.values(TOWN_SMALL)), p = pool[Math.floor(hash(Game.s.day, Town.idn(id), 41) * pool.length)]; return p.join(' '); },
  'small.about': (T, n, id) => TALK_ABOUT[id] || Folk.who(id),
  // what you've asked after, once you know: their work, their fun, who's at home
  'small.workagain': (T, n, id) => `${talkPick(TALK_AGAIN, id)} ${TALK_WORDS['small.workmore'](T, n, id)}`,
  'small.likesagain': (T, n, id) => { const k = City.w.voice.learned(id).likes, L = TALK_LIKES_AGAIN[k]; return `${talkPick(TALK_AGAIN, id + 'l')} ${L ? L[Math.floor(hash(Town.idn(id), Game.s.day, 53) * L.length)] : 'Not as often as I\'d like.'}`; },
  // what they're at when you stop them
  'at.often': (T, n, id) => { const a = T.moment && T.moment.act, likes = Object.keys(RESIDENTS[id].likes || {}); return (likes.includes(a) || !likes.length) && TALK_AT_FUN[a] ? talkPick(TALK_AT_FUN[a].often, id) : likes.length ? `Not really. I'm more for ${TALK_LIKE_WORD[likes[0]] || likes[0]}.` : 'Not really. Just passing the time.'; },
  'at.funwell': (T) => (TALK_AT_FUN[T.moment && T.moment.act] || {}).well || 'Ha.',
  'at.funbadly': (T) => (TALK_AT_FUN[T.moment && T.moment.act] || {}).badly || 'Mm.',
  'at.errand': (T, n, id) => { const a = T.moment && T.moment.act; return talkPick(TALK_AT_ERRAND[a === 'laundry' || a === 'clinic' ? a : 'shop'], id); },
  'small.homeagain': (T, n, id) => talkHomeAgain(id),
  // what they'd offer nobody else: a friend's price, a lead, a job
  'favor.start': (T) => {
    const f = T.favor; if (!f) return '';
    if (f.kind === 'price') return `You've been decent to me. From now on, at ${f.at}, you pay what my family pays. Don't tell anyone.`;
    if (f.kind === 'tip') return `I wouldn't tell just anyone. ${TIPS[f.tip].say}`;
    return `I wouldn't ask just anyone, but you're not just anyone. My ${f.thing}'s given up on me. ${f.pay} cr, if you'll look at it.`;
  },
  'favor.what': (T) => (T.favor && T.favor.dev && TALK_WHAT[T.favor.dev]) || '"It just stopped. Like it had had enough."',
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
// hobbies, said (one each, by who's saying it)
const TALK_LIKES = {
  drink: ['A drink at the end of it. Somewhere with a lantern over the door.', 'A cup of something with friends. Or without them.', 'The Red Lantern, most nights. Ueda knows my order.'],
  pachi: ['Pachinko. The balls go down and the money goes with them. I love it.', 'Lucky Seven. The noise stops me thinking.', 'Pachinko. Don\'t look at me like that.'],
  watch: ['The pictures. Anything with rain in it.', 'The Orpheum. The late picture, the cheap seats.', 'Films. Old ones, where the sky\'s still blue.'],
  dance: ['Dancing, at the Coil, when my feet let me.', 'The Coil. You can\'t think in there. That\'s the point.', 'Dancing. Badly. Happily.'],
  arcade: ['The arcade. I hold the high score on two cabinets.', 'The cabinets. I\'m very good at shooting things that aren\'t there.', 'Arcade. Don\'t laugh. I\'m ranked.'],
  bathe: ['The bath. Hot water and other people\'s gossip.', 'A long soak. It\'s the only time nobody asks me for anything.', 'The bath house. My back would leave me otherwise.'],
  loaf: ['Sitting. Watching. The city\'s a show if you let it be one.', 'Nothing. I\'m good at it.', 'Finding a step and sitting on it.'],
  festival: ['Lantern nights. Any festival, really.', 'Festivals. Food on sticks, paper in the air.', 'Whatever the street\'s celebrating. I don\'t ask what.'],
  pray: ['The shrine. Somebody should be asking.', 'The temple. It\'s quiet. Quiet\'s rare.', 'Lighting a candle now and then. Old habit.'],
  play: ['Drones and cops! I\'m always the drone.', 'Racing! I\'m the fastest on the street. Nearly.', 'Hide and seek. Nobody ever finds me.'],
  eat: ['Eating. Lin\'s, mostly. Don\'t tell my mother.', 'Food. Any food. Good food, if I\'m lucky.', 'Noodles. Is that a hobby? It\'s my hobby.'],
};
// asked about their hobby: what you might ask after it, and what they say to it
const TALK_LIKES_ASK = {
  drink: ['Where\'s good?', ['The Red Lantern. Ueda pours like he means it.', 'Anywhere with a stool that doesn\'t wobble.']],
  pachi: ['Ever win big?', ['Once. I bought everyone noodles and was broke by Friday.', 'Big enough to come back. Never big enough to stop.']],
  watch: ['Best one you\'ve seen?', ['"The Last Spinner." Twice. I fell asleep at the same bit both times.', '"Paper Moon Over Kessler." Nobody\'s heard of it. Their loss.']],
  dance: ['Are you any good?', ['Good enough that people get out of the way. Or they\'re scared.', 'No. That\'s not the point of it.']],
  arcade: ['What\'s your game?', ['"Neon Drift." Some kid from Kessler is coming for my score.', 'Anything with a gun that isn\'t real.']],
  bathe: ['Which one?', ['The old one on the Row. The water\'s the only honest thing in it.', 'Whichever has the hot pool working.']],
  loaf: ['What\'s the best of it?', ['The trains at dusk. All those windows.', 'People arguing. You learn a lot.']],
  festival: ['Which is the best?', ['Lantern night. The whole street floats.', 'The one with the fried things on sticks.']],
  pray: ['What do you ask for?', ['That the rain stops. It never does. I keep asking.', 'That my people are all right. That\'s all anyone asks.']],
  play: ['Can I play?', ['You\'re too big! You can be the cop.', 'Only if you\'re the drone. Nobody wants to be the drone.']],
  eat: ['What\'s your order?', ['The pork. Always the pork.', 'Whatever Lin says. You don\'t argue with Lin.']],
};
// stopped at their fun: what you might joke, how it lands back, and how often they come
const TALK_AT_FUN = {
  eat: { joke: 'Any good, or just hot?', well: 'Both, tonight. Lucky me.', badly: 'Let me eat.', often: ['Most nights. I can\'t cook and I won\'t learn.', 'Whenever I\'ve got the coin.'] },
  drink: { joke: 'Is that your first?', well: 'First of the second round.', badly: 'Counting my drinks, are you?', often: ['More than I should. Less than I\'d like.', 'Once a week. Twice, in a bad week.'] },
  pachi: { joke: 'Are the machines winning?', well: 'They always win. I just like watching.', badly: 'Don\'t jinx it.', often: ['Every payday. Sometimes the day after.', 'Too often, my mother says.'] },
  watch: { joke: 'Who dies?', well: 'Everybody, by the end. It\'s a good one.', badly: 'Don\'t. I haven\'t seen it yet.', often: ['Every new picture. The old ones twice.', 'Whenever they change the bill.'] },
  dance: { joke: 'Teach me that step?', well: 'Ha. It took me ten years. Have you got ten minutes?', badly: 'It\'s not a step. It\'s a feeling.', often: ['Whenever my feet let me.', 'Every Saturday, and some Tuesdays.'] },
  arcade: { joke: 'Let me have a go.', well: 'One credit. Don\'t embarrass me.', badly: 'Get your own cabinet.', often: ['Every day after work. It\'s cheaper than a drink.', 'More than a grown-up should.'] },
  bathe: { joke: 'Hot enough?', well: 'Hot enough to forget my own name.', badly: 'It was relaxing. Until now.', often: ['Every week. My back insists.', 'Whenever the day\'s been long. So, often.'] },
  loaf: { joke: 'Hard at work, I see.', well: 'Somebody has to watch the street.', badly: 'I earned this sit.', often: ['Every evening. The city puts on a show.', 'When my legs say so.'] },
  festival: { joke: 'Which lantern\'s yours?', well: 'The crooked one. I made it myself.', badly: 'They\'re not for laughing at.', often: ['Every one I can get to.', 'All of them. I count down to the next.'] },
  pray: { joke: 'Put one in for me.', well: 'Already did. You looked like you needed it.', badly: 'Ask them yourself.', often: ['Every morning. Someone should be asking.', 'Every week, since my mother passed.'] },
  play: { joke: 'Who\'s winning?', well: 'Me! Always me!', badly: 'You\'re not even playing.', often: ['Every day! Every single day!', 'After school. And before, if I\'m quick.'] },
};
// stopped on an errand: what they came for
const TALK_AT_ERRAND = {
  shop: ['Mo says the plums are fresh. Mo says that every day.', 'Batteries and noodles. The essentials.', 'Half of it. The other half\'s on the train from the Docks, apparently.'],
  laundry: ['Somebody\'s red sock got in with my whites. Somebody is me.', 'Clean shirts. For a week. Then again.'],
  clinic: ['It\'s nothing. They said it\'s nothing. I came anyway.', 'A long wait for a short answer.'],
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
  wen: 'Six till half past eight, and again at five. The street doesn\'t sweep itself. I\'ve checked.',
  dara: 'Forty drops a day. Stairs, mostly. The lifts are all broken or watched.', mo: 'Up at five for the delivery, and the delivery\'s never all there.',
  jun: 'Graveyard shift. People buy strange things at three in the morning. I don\'t ask.', rina: 'Nights on the ward. Burns, mostly, from the Works. And chrome that won\'t take.',
  teo: 'Room service for people who send it back. I eat what comes back.', ines: 'Parcels. Some tick. Some leak. You learn not to shake them.',
  ueda: 'You pour, you listen, you don\'t repeat. That\'s the whole trade.', goro: 'Walk the floor. Watch the hands. Everyone thinks they\'re the first to try it.',
};
const talkA = (t) => (/^(keeps|sweeps|runs) /i.test(t) ? talkCap(t) : (/^[aeiou]/i.test(t) ? 'An ' : 'A ') + t.toLowerCase()); // ("Keeps the bar")
const talkHour = (h) => { h = ((h % 24) + 24) % 24; const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return (hh % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (hh < 12 ? ' in the morning' : hh < 18 ? ' in the afternoon' : ' at night'); };
const talkPick = (list, id) => list[Math.floor(hash(Town.idn(id), list.length, 43) * list.length)];
const talkFirst = (name) => name.replace(/^(Mr|Mrs|Old|Master|Keeper|Mechanic|Nurse) /, '').split(' ')[0];
const talkCap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const talkAnd = (list) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]);
// someone's work, for the talk: their job, or a duty of the block's own
// (Old Wen sweeps for the block association, and nobody hired him)
const TALK_DUTY = { wen: { title: 'Sweeps for the block association', duty: true, boss: 'the block association' } };
function talkWork(id) { const R = RESIDENTS[id]; return (R && R.job) || TALK_DUTY[id] || null; }
// where it's done, in a word or two
function talkWorkWhere(id) {
  const j = talkWork(id), at = j && j.place && Census.places[j.place];
  const w = !at ? (j && j.duty ? 'this street' : 'the city') : at.kind === 'door' ? at.label : at.kind === 'room' ? LEVELS[at.level].name : LEVELS[at.street].name;
  return w.replace(/^The /, 'the ');
}
// their work, as your notebook has it
function talkWorkNote(id) { const j = talkWork(id); return !j ? '' : j.duty ? j.title + '.' : `${talkA(j.title)} at ${talkWorkWhere(id)}.`; }
// who's at home with them, by first name: the grown-ups and the children
function talkHousehold(id) {
  const R = RESIDENTS[id], hh = R && R.hh && Folk.households.find((h) => h.id === R.hh), others = hh ? hh.members.filter((m) => m !== id) : [];
  return { kids: others.filter((m) => RESIDENTS[m].age === 'kid').map((m) => talkFirst(RESIDENTS[m].name)), big: others.filter((m) => RESIDENTS[m].age !== 'kid').map((m) => talkFirst(RESIDENTS[m].name)) };
}
// who's at home, as your notebook has it, and where
function talkHomeNote(id) {
  const R = RESIDENTS[id], H = talkHousehold(id), home = Census.places[R.homePlace];
  const where = !home ? '' : home.apt ? 'in Apartment ' + home.apt + ', over the White Dragon' : home.street === 'd_dragon' ? 'on the White Dragon\'s street' : 'in ' + LEVELS[home.street].name.replace(/^The /, 'the ');
  const kids = H.kids.length ? [(H.kids.length === 1 ? 'their child, ' : 'the kids, ') + talkAnd(H.kids)] : [];
  const who = R.age === 'kid' ? (H.big.length ? 'With ' + talkAnd(H.big.concat(H.kids)) : 'With their mom') : H.big.length || kids.length ? 'With ' + talkAnd(H.big.concat(kids)) : 'Lives alone';
  return who + (where ? ', ' + where : '') + '.';
}
// what you've learned of them, in the words a line asks for: Voice fills
// {learned.<key>} and {learned.<key>:<form>} with this (talkRemembered)
function talkRemembered(id, key, v, form) {
  if (key === 'home') { const H = talkHousehold(id); return form === 'kids' ? talkAnd(H.kids) || 'the family' : talkAnd(H.big.concat(H.kids.length ? ['the kids'] : [])) || 'everyone'; }
  if (key === 'likes') return form === 'place' ? TALK_LIKE_PLACE[v] || 'there' : TALK_LIKE_WORD[v] || String(v);
  if (key === 'work') { const j = talkWork(id); return form === 'place' ? talkWorkWhere(id) : form === 'boss' ? (j && j.boss) || talkWorkWhere(id) : String(v).toLowerCase(); }
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}
// what's asked after, once you know: their work (the block's own by name,
// everyone else by their work's kind), their fun, who's at home
const TALK_ASK_WORK = {
  wen: 'How\'s the sweeping?', mo: 'How\'s the shop?', jun: 'How\'s the graveyard shift?', ueda: 'How\'s the Red Lantern?', mina: 'How are the animals?', goro: 'Lucky Seven treating you right?', pip: 'What\'s showing tonight?',
  vin: 'Busy at the Coil?', hana: 'How\'s the fox?', teo: 'How\'s the hotel kitchen?', ines: 'Any parcels tick today?', rina: 'How are the nights on the ward?', dara: 'How many drops today?',
};
const TALK_ASK_KIND = {
  food: 'How\'s the stall?', eatery: 'How\'s the kitchen?', trade: 'How\'s trade?', plant: 'How\'s the plant?', dock: 'How are the docks?', clinic: 'How\'s the clinic?', hospital: 'How are things on the ward?', office: 'How\'s the office?',
  watch: 'Quiet on the watch?', garden: 'How are the gardens?', keeper: 'How\'s the old place?', club: 'Busy at the club?', canteen: 'How\'s the canteen?', stall: 'How\'s the stall?', yard: 'Find anything good in the yard?',
  scavenge: 'Find anything good?', night: 'Quiet on the door?', bar: 'Busy behind the bar?', pachinko: 'How\'s the floor?', arcade: 'How\'s the arcade?', shop: 'How\'s the shop?', temple: 'How\'s the temple?', theater: 'What\'s showing?',
  bath: 'How\'s the bath house?', school: 'How\'s the class?', depot: 'How\'s the depot?', hotel: 'How\'s the hotel?', laundry: 'How\'s the laundry?',
};
const TALK_ASK_LIKES = {
  drink: 'Been for a drink lately?', pachi: 'Win anything at pachinko?', watch: 'Seen anything good at the pictures?', dance: 'Been dancing lately?', arcade: 'Still holding the high score?', bathe: 'Been to the bath lately?',
  loaf: 'Still watching the city go by?', festival: 'Any lantern nights coming?', pray: 'Been to the shrine lately?', play: 'Who won at drones and cops?', eat: 'Had Lin\'s noodles lately?',
};
// where each hobby's done, for "take me along to..."
const TALK_LIKE_PLACE = { drink: 'the Red Lantern', pachi: 'Lucky Seven', watch: 'the Orpheum', dance: 'the Coil', arcade: 'the arcade', bathe: 'the bath', loaf: 'your bench', festival: 'the next lantern night', pray: 'the shrine', play: 'drones and cops', eat: 'Lin\'s' };
// asked after: their hobby, lately (it changes day to day)
const TALK_LIKES_AGAIN = {
  drink: ['Last night. One drink. It brought friends.', 'Not this week. The week\'s been the drink.'], pachi: ['Won forty. Lost sixty. I\'m up, in spirit.', 'A machine paid out for the man next to me. I\'m still angry.'],
  watch: ['"Rain on Glass." It\'s about rain. I cried anyway.', 'Some picture about a detective. I guessed it in the first reel.'], dance: ['Saturday. My feet are still talking to me about it.', 'The Coil\'s got a new DJ. Too loud. Perfect.'],
  arcade: ['Still mine. Some kid from Kessler is coming for it.', 'Lost a score. Got it back. War.'], bathe: ['Tuesday. Hot enough to forget my own name.', 'The hot pool was broken. I sat in the warm one and sulked.'],
  loaf: ['Every day. The city puts on a show if you sit still for it.', 'Two drones crashed over the Row yesterday. Best thing all week.'], festival: ['Next month, they say. They always say next month.', 'They\'re making the lanterns already. I can smell the glue.'],
  pray: ['This morning. I asked for the rain to stop. It didn\'t.', 'Last night. The fox was there. The fox is always there.'], play: ['Me! I was the drone and nobody caught me!', 'We lost the ball down a vent. It\'s the vent\'s ball now.'],
  eat: ['Last night. Lin gave me extra. Don\'t tell anyone.', 'Tried somewhere new. Went back to Lin\'s the next night.'],
};
// how it starts, when you ask after something they told you
const TALK_AGAIN = ['You remembered.', 'You remembered. Nobody remembers.', 'Ha. You were listening.', 'Fancy you asking.'];
const talkAskWork = (id) => TALK_ASK_WORK[id] || TALK_ASK_KIND[(talkWork(id) || {}).kind] || `How's work at ${talkWorkWhere(id)}?`;
function talkAskHome(id) {
  const R = RESIDENTS[id], H = talkHousehold(id), all = H.big.concat(H.kids);
  if (R.age === 'kid') return H.big.length ? `How's ${H.big[0]}?` : 'How\'s your mom?';
  if (H.kids.length) return H.kids.length === 1 ? `How's ${H.kids[0]}?` : `How are ${talkAnd(H.kids)}?`;
  if (all.length) return all.length === 1 ? `How's ${all[0]}?` : `How are ${talkAnd(all)}?`;
  return R.age === 'senior' ? 'Still just you and the radio?' : 'Still just you at home?';
}
// asked after, at home
function talkHomeAgain(id) {
  const R = RESIDENTS[id], H = talkHousehold(id), pick = (k, list) => list[Math.floor(hash(Town.idn(id), k, 47) * list.length)];
  const kid = ['lost a tooth', 'wants a drone', 'won\'t eat anything green', 'drew Lin a picture of Lin', 'is taller than me, nearly', 'asked where rain comes from. I said the Spires.'];
  if (R.age === 'kid') return `${H.big[0] || 'Mom'}'s ${pick(1, ['tired. Always tired.', 'on nights again.', 'fine. She says to say thank you, for asking.'])}`;
  if (H.kids.length) return `${talkPick(TALK_AGAIN, id + 'h')} ${H.kids[0]} ${pick(2, kid)}${H.kids[1] ? `, and ${H.kids[1]} ${pick(3, kid.filter((q) => q !== pick(2, kid)))}` : ''}.`;
  if (H.big.length) return `${talkPick(TALK_AGAIN, id + 'h')} ${talkAnd(H.big)}${H.big.length > 1 ? ' are' : '\'s'} ${pick(4, ['well. Tired. Everyone\'s tired.', 'fine, thanks. Working too much. Like me.', 'good. We manage. Small place, big arguments.'])}`;
  return R.age === 'senior' ? 'Me and the radio. It argues less than people.' : 'Just me. The shoes and I have an understanding.';
}
// who's at home with them
function talkHome(id) {
  const R = RESIDENTS[id], hh = R.hh && Folk.households.find((h) => h.id === R.hh), others = hh ? hh.members.filter((m) => m !== id) : [];
  const kids = others.filter((m) => RESIDENTS[m].age === 'kid').map((m) => RESIDENTS[m].name), big = others.filter((m) => RESIDENTS[m].age !== 'kid').map((m) => talkFirst(RESIDENTS[m].name));
  if (R.age === 'kid') return big.length ? `${big.join(' and ')}. ${kids.length ? 'And ' + kids.join(' and ') + '. They\'re the worst.' : 'Just us.'}` : 'Just me and my mom.';
  if (!others.length) return R.age === 'senior' ? 'Just me and the radio.' : 'Just me. It\'s a capsule. There\'s room for me or my shoes.';
  if (kids.length) return `${big.length ? big.join(' and ') + ', and ' : ''}the kids: ${kids.join(' and ')}. It\'s loud. It\'s good.`;
  return `${big.join(' and ')}. ${R.age === 'senior' ? 'Forty years. She still laughs at my jokes.' : 'Small place. We manage.'}`;
}
// who they go to their fun with
function talkWith(id) {
  const R = RESIDENTS[id], H = talkHousehold(id);
  if (R.age === 'kid') return 'My friends! And my mom, if she\'s not working.';
  if (H.big.length) return `${H.big[0]}, when they can get away. Mostly on my own.`;
  if (H.kids.length) return 'On my own. The kids think it\'s boring.';
  return 'On my own. That\'s the point of it.';
}
// how old the children are
function talkKids(id) {
  const H = talkHousehold(id), age = (k) => 3 + Math.floor(hash(Town.idn(id), k, 59) * 10);
  return H.kids.map((k, i) => `${k}'s ${age(i)}`).join(', and ') + '. ' + talkPick(['Going on forty.', 'Old enough to argue.', 'They grow while you\'re at work.'], id);
}
// how a couple met
const TALK_MET = ['At the Coil. I stood on their foot. Twice.', 'In the queue at Lin\'s. Forty minutes is a long time to talk.', 'Same shift, years ago. Neither of us ever left.', 'They fixed my door. Then they never left.', 'Lantern night. I don\'t remember much else of it.'];
// what someone's at when you stop them: on shift, at their fun, on an
// errand, or on their way (the talk opens on it: the at.* threads)
const TALK_FUN = ['eat', 'drink', 'pachi', 'watch', 'dance', 'arcade', 'bathe', 'loaf', 'festival', 'pray', 'play'];
const TALK_ERRAND = ['shop', 'browse', 'pay', 'laundry', 'clinic'];
function talkMoment(n, id) {
  if (!RESIDENTS[id]) return null;
  const st = n.townState || Town.state(id, Game.hour()), a = st.moving ? st.e && st.e.act : st.act, act = a === 'temple' ? 'pray' : a;
  const kind = st.moving ? 'going' : WORK_ACTS.includes(act) ? 'work' : TALK_FUN.includes(act) ? 'fun' : TALK_ERRAND.includes(act) ? 'errand' : null;
  return kind ? { kind, act } : null;
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
  // the conversation so far, as it's shown (a thread, oldest first: their
  // lines, yours, what you learned, a job's card), how much of it has been
  // said aloud, and the typer that says the rest (Tycho's: their words come
  // out at a talking pace, yours at once; a tap on the thread hurries it)
  log: [], shown: 0, lastCard: '', typer: null, faces: new Map(),
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
    // what you've learned of them, in the words a line asks for ({learned.<key>:<form>})
    v.remembered = (c, key, val, form) => talkRemembered(c.person.id, key, val, form);
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
      if (what === 'favor') { const f = t.favor; if (!f || f.given) return; f.given = true; out.kind = f.kind; if (f.tip) out.tip = f.tip; if (f.job) { out.job = f.job; out.pay = f.pay; } }
      if (what === 'pay') t.cr -= o.n;
      c.world.emit('talk:do', out);
    };
    const who = (id) => (c) => c.person.id === id;
    const resident = (c) => !!RESIDENTS[c.person.id];
    // (what's learned in this talk is kept in it, so it isn't asked after in the same breath: fresh)
    const learn = (key, val) => (c) => {
      const v = val(c); if (v === undefined || v === null) return;
      const had = c.world.voice.learned(c.person.id, c.target)[key] !== undefined, t = T(c);
      c.world.voice.applyLearn(c.person.id, c.target, key, v);
      if (!had && t) (t.now = t.now || {})[key] = true;
    };
    const fresh = (k) => (c) => !(T(c) && T(c).now && T(c).now[k]);
    // (a subject not yet talked of in this talk: a door into it doesn't go round again)
    const notYet = (id) => (c) => { const s = c.world.voice.history(c.person.id, c.target).seen[id], t = T(c); return s === undefined || !t || s < t.t; };
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
    const canHaggle = (c) => { const j = J(c, 'job'); return !!j && j.more > j.pay && j.deal === undefined; };
    const HAGGLED = [{ landed: 'well', to: 'agree' }, { landed: 'even', to: 'split' }, { to: 'firm' }];
    // (knowing where they work, you know what it pays: a haggle that recalls it lands better)
    const HAGGLE_KNOWN = { say: 'Make it {more}. I know what {learned.work:boss} pays.', label: 'Make it {more}.', approach: 'haggle', recalls: 'work', if: [canHaggle], to: HAGGLED };
    const HAGGLE = { say: 'Make it {more}.', approach: 'haggle', if: [canHaggle, '!learned:work'], to: HAGGLED };
    const NO = { say: 'Not this one.', to: 'no' };
    const jobBeats = (first) => ({
      start: { line: first ? 'job.offer' : 'job.again', answers: [TAKE, { say: 'What\'s wrong with it?', approach: 'ask', to: 'what' }, HAGGLE_KNOWN, HAGGLE, NO] },
      what: { line: 'job.what', answers: [TAKE, HAGGLE_KNOWN, HAGGLE, NO] },
      agree: { line: 'job.agree', then: [does('deal', { at: 'more' })], answers: [TAKE, NO] },
      split: { line: 'job.split', then: [does('deal', { at: 'mid' })], answers: [TAKE, NO] },
      firm: { line: 'job.firm', then: ['warmth-=1'], answers: [TAKE, NO] },
      took: { line: 'job.took', end: true },
      no: { line: 'job.no', end: true },
    });
    const thing = (k) => (c) => { const j = J(c, k); return j ? j.thing : 'it'; };
    v.thread({ id: 'job', theirs: true, cooldown: 60, about: ['job'], if: [has('job'), calm], label: (c) => 'The ' + thing('job')(c), beats: jobBeats(true) });
    v.thread({ id: 'job.again', weight: 4, cooldown: 1, about: ['job'], if: [has('job'), 'talked:job'], label: (c) => 'About the ' + thing('job')(c), beats: jobBeats(false) });
    v.thread({ id: 'wait', weight: 3, cooldown: 120, about: ['job'], if: [has('jobwait')], label: (c) => 'About the ' + thing('jobwait')(c), beats: {
      start: { line: 'wait.ask', answers: [
        { say: 'It\'s on the bench. Soon.', approach: 'straight', to: 'ok' },
        { say: 'Genius takes time.', approach: 'joke', to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] }] },
      ok: { text: ['Good.', 'Good. I\'m counting on it.'], end: true }, laugh: { text: 'Ha. Genius. Sure.', end: true }, flat: { text: 'So does rent.', end: true } } });
    v.thread({ id: 'coming', weight: 3, cooldown: 120, about: ['job'], if: [has('coming')], label: (c) => 'Your ' + thing('coming')(c) + '\'s fixed', beats: { start: { line: 'coming', end: true } } });
    // ---- the hand-back: what they ask, what you say, what they say
    const GOOD = { say: 'Good as new.', approach: 'straight', if: [res('works')], job: 'back', to: 'thanks' };
    const HALF = { say: 'It works. Mostly.', approach: 'straight', if: [res('half')], job: 'back', to: 'half' };
    v.thread({ id: 'back', theirs: true, cooldown: 1, about: ['job'], if: [has('handback'), calm], label: 'The hand-back', beats: {
      start: { line: 'back.ask', answers: [GOOD, HALF, { say: 'Only smoked a little.', approach: 'joke', to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] }] },
      flat: { line: 'back.flat', answers: [GOOD, HALF] },
      thanks: { line: 'back.thanks', then: [does('back')], end: true },
      half: { line: 'back.half', then: [does('back')], end: true },
      laugh: { line: 'back.laugh', then: [does('back')], end: true } } });
    // ---- a lead: something they've heard of, for you
    v.thread({ id: 'tip', theirs: true, cooldown: 1, about: ['street'], if: [(c) => !!(T(c) && T(c).tip), calm], label: 'A lead', beats: {
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
    v.thread({ id: 'fixed', theirs: true, cooldown: 3 * 1440, about: ['job'], if: [(c) => !!(T(c) && T(c).fixed), calm], label: 'What you fixed', beats: {
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
    const work = (c) => !!talkWork(c.person.id);
    const others = (c) => { const H = talkHousehold(c.person.id); return H.big.length + H.kids.length > 0; };
    const kids = (c) => talkHousehold(c.person.id).kids.length > 0;
    v.thread({ id: 'work', about: ['work'], if: [resident, work, '!learned:work'], reveals: 'work', label: (c) => (c.person.doing && c.person.doing.action === 'work' ? 'Busy?' : 'How\'s work?'), beats: {
      start: { line: 'small.work', then: [learn('work', (c) => talkWork(c.person.id).title)], answers: [
        { say: 'What\'s that like?', approach: 'ask', to: 'like' },
        { say: 'Sounds hard.', approach: 'warm', to: 'warm' },
        { say: 'Ever think of robbing the place?', approach: 'joke', to: [{ landed: 'badly', to: 'shocked' }, { to: 'laugh' }] }] },
      like: { line: 'small.workmore', answers: [{ say: 'And after work?', approach: 'ask', if: [notYet('next')], to: 'thread:next' }, { say: 'That\'s a long day.', approach: 'warm', to: 'warm' }] },
      warm: { text: ['It is. Thanks for asking.', 'Somebody has to. Thanks.'], then: ['need.company-=0.05'], end: true },
      laugh: { text: ['Every day. Then I count the till.', 'Ha. Don\'t tempt me.'], end: true },
      shocked: { text: ['Don\'t even joke.', 'Not funny. People lose jobs for less.'], then: ['regard-=0.02'], end: true } } });
    // (what they like, learned: what you'd ask after it, and who they go with, which turns the talk to home)
    const liked = (c) => c.world.voice.learned(c.person.id, c.target).likes;
    const likeAsk = Object.keys(TALK_LIKES_ASK).map((k) => ({ say: TALK_LIKES_ASK[k][0], approach: 'ask', if: [(c) => liked(c) === k], to: 'more' }));
    const WITH = { say: 'Who do you go with?', approach: 'ask', if: [resident], then: ['about:home'], to: 'with' };
    v.thread({ id: 'likes', about: ['fun'], if: [resident, (c) => Object.keys(R(c).likes || {}).length > 0, '!learned:likes'], reveals: 'likes', label: 'What do you do for fun?', beats: {
      start: { line: 'small.likes', then: [learn('likes', (c) => Object.keys(R(c).likes)[0])], answers: [
        ...likeAsk,
        { say: 'Take me along sometime.', approach: 'joke', warmth: 1, soft: true, to: [{ landed: 'badly', to: 'alone' }, { to: 'yes' }] },
        WITH,
        { say: 'Doesn\'t sound like much.', approach: 'straight', to: 'cold' }] },
      more: { line: 'small.likesmore', answers: [WITH, { say: 'I\'ll have to try it.', approach: 'warm', to: 'try' }] },
      with: { line: 'small.likeswith', end: true },
      try: { text: ['You should. Tell them I sent you.', 'Do. Then we\'ll talk.'], then: ['regard+=0.01'], end: true },
      yes: { text: 'Maybe. If you\'re buying.', then: ['regard+=0.02'], end: true }, alone: { text: 'I go alone. That\'s the point.', end: true },
      cold: { text: 'It\'s mine. That\'s enough.', then: ['regard-=0.02'], end: true } } });
    const alone = (c) => { const H = talkHousehold(c.person.id); return !H.big.length && !H.kids.length; };
    const couple = (c) => { const H = talkHousehold(c.person.id); return R(c).age !== 'kid' && H.big.length === 1; };
    v.thread({ id: 'home', about: ['home'], if: [resident, (c) => !!R(c).homePlace, '!learned:home'], reveals: 'home', label: 'Who\'s at home?', weight: 0.8, beats: {
      start: { line: 'small.home', then: [learn('home', (c) => R(c).hh || 'alone')], answers: [
        { say: 'How old are they?', approach: 'ask', if: [(c) => R(c).age !== 'kid' && kids(c)], to: 'kids' },
        { say: 'How did you two meet?', approach: 'ask', if: [couple], to: 'met' },
        { say: 'Must be quiet.', approach: 'warm', if: [alone], to: 'quiet' },
        { say: 'Sounds crowded.', approach: 'joke', if: [(c) => { const H = talkHousehold(c.person.id); return H.big.length + H.kids.length > 1; }], to: [{ landed: 'badly', to: 'cold' }, { to: 'laugh' }] },
        { say: 'Sounds like home.', approach: 'warm' }] },
      kids: { line: 'small.kids', end: true }, met: { line: 'small.met', then: ['regard+=0.01'], end: true },
      quiet: { text: ['Quiet\'s fine. Quiet doesn\'t borrow money.', 'Too quiet, some nights.'], end: true },
      laugh: { text: 'Ha. You have no idea.', end: true }, cold: { text: 'It\'s home.', end: true } } });
    // ---- what they've told you, asked after (it lands better than small talk:
    // Voice's recalls), though not in the same talk as they told you
    v.thread({ id: 'work.again', about: ['work'], if: [resident, work, fresh('work')], recalls: 'work', approach: 'warm', weight: 1.1, label: (c) => talkAskWork(c.person.id), beats: {
      start: { line: 'small.workagain', answers: [
        { say: 'They don\'t pay you enough.', approach: 'warm', to: 'warm' },
        { say: 'Ever think of robbing {learned.work:boss}?', recalls: 'work', approach: 'joke', to: [{ landed: 'badly', to: 'shocked' }, { to: 'laugh' }] },
        { say: 'Sounds like the same as ever.', approach: 'straight' }] },
      warm: { text: ['They don\'t. Thanks for noticing.', 'Nobody does. You\'re kind to say.'], then: ['need.company-=0.05'], end: true },
      laugh: { text: ['Every day. Then I count the till.', 'Ha. You know me too well.'], end: true },
      shocked: { text: ['Don\'t even joke.', 'Not funny. People lose jobs for less.'], then: ['regard-=0.02'], end: true } } });
    v.thread({ id: 'likes.again', about: ['fun'], if: [resident, fresh('likes')], recalls: 'likes', approach: 'ask', weight: 1, label: (c) => TALK_ASK_LIKES[c.world.voice.learned(c.person.id, c.target).likes] || 'Still doing what you love?', beats: {
      start: { line: 'small.likesagain', answers: [
        { say: 'Take me along to {learned.likes:place} sometime.', recalls: 'likes', approach: 'joke', warmth: 1, soft: true, to: [{ landed: 'badly', to: 'alone' }, { to: 'yes' }] },
        { say: 'Sounds good.', approach: 'warm' }] },
      yes: { text: ['Maybe. If you\'re buying.', 'Any time. You know where.'], then: ['regard+=0.02'], end: true }, alone: { text: 'I go alone. That\'s the point.', end: true } } });
    v.thread({ id: 'home.again', about: ['home'], if: [resident, (c) => !!R(c).homePlace, fresh('home')], recalls: 'home', approach: 'warm', weight: 0.9, label: (c) => talkAskHome(c.person.id), beats: {
      start: { line: 'small.homeagain', answers: [
        { say: 'Say hello to {learned.home:them} for me.', recalls: 'home', approach: 'warm', if: [others] },
        { say: 'Bring {learned.home:kids} by the White Dragon. Lin feeds everyone.', recalls: 'home', approach: 'warm', if: [kids], to: 'lin' },
        { say: 'Sounds about right.', approach: 'straight' }] },
      lin: { text: 'She does. She fed me, once.', then: ['regard+=0.01'], end: true } } });
    v.thread({ id: 'next', about: ['day', 'work'], if: [resident], label: 'What\'s after this?', weight: 0.7, beats: {
      start: { line: 'small.next', answers: [
        { say: 'Save me a seat.', approach: 'joke', to: [{ landed: 'badly', to: 'no' }, { to: 'yes' }] },
        { say: 'Don\'t let me keep you, then.', approach: 'warm', to: 'go' },
        { say: 'Busy day.', approach: 'straight' }] },
      yes: { text: ['Bring your own.', 'Ha. First come, first served.'], end: true }, no: { text: 'It\'s not that kind of thing.', end: true },
      go: { text: ['You\'re not. Not yet.', 'Ha. Later, then.'], end: true } } });
    v.thread({ id: 'news', about: ['street'], if: [(c) => resident(c) || c.person.id === 'ozzy'], label: 'Heard anything?', weight: 0.9, beats: {
      start: { line: 'small.news', answers: [
        { say: 'Who told you that?', approach: 'ask', to: 'who' },
        { say: 'This city.', approach: 'joke' },
        { say: 'Sounds about right.', approach: 'straight' }] },
      who: { text: ['Everybody. Nobody. You know how it is.', 'Lin. Lin hears everything.', 'Somebody at the bath. The bath knows everything first.'], end: true } } });
    // ---- known well enough, what they'd offer nobody else, once: a friend's
    // price at their stall or counter, a lead only they know of, or something
    // of theirs that's broken (Known.favorFor; it's theirs to raise)
    const favor = (k) => (c) => { const t = T(c); return !!(t && t.favor && t.favor.kind === k); };
    const FAVOR_TAKE = { say: 'For you? Of course.', approach: 'warm', favor: true, if: [favor('job')], then: [does('favor', { took: true })], to: 'took' };
    const FAVOR_NO = { say: 'Not this time.', if: [favor('job')], then: [does('favor', { took: false })], to: 'no' };
    v.thread({ id: 'favor', theirs: true, cooldown: 1440, about: ['job'], if: ['familiar>=' + KNOWN_AT.favor, (c) => !!(T(c) && T(c).favor && !T(c).favor.given), calm], label: 'A favor', beats: {
      start: { line: 'favor.start', then: [(c) => { if (!favor('job')(c)) does('favor')(c); }], answers: [
        FAVOR_TAKE, { say: 'What\'s wrong with it?', approach: 'ask', if: [favor('job')], to: 'what' }, FAVOR_NO,
        { say: 'I owe you one.', approach: 'warm', if: [favor('tip')], to: 'owe' }, { say: 'Why tell me?', approach: 'ask', if: [favor('tip')], to: 'why' },
        { say: 'That\'s good of you.', approach: 'warm', if: [favor('price')], to: 'good' }, { say: 'Family? I\'m touched.', approach: 'joke', if: [favor('price')], to: 'family' }] },
      what: { line: 'favor.what', answers: [FAVOR_TAKE, FAVOR_NO] },
      took: { text: 'I knew I could ask you.', end: true }, no: { text: 'Fair enough. The offer was only ever for you.', end: true },
      owe: { text: 'You don\'t. Just don\'t say where you heard it.', end: true }, why: { text: 'Because you listen. Nobody listens.', then: ['regard+=0.02'], end: true },
      good: { text: 'Good of you to come round. That\'s all.', end: true }, family: { text: 'Don\'t push it. Second cousin.', end: true } } });
    v.thread({ id: 'about', about: ['street', 'home'], if: [(c) => !!TALK_ABOUT[c.person.id]], reveals: 'about', label: 'How long have you been around here?', beats: {
      start: { line: 'small.about', then: [learn('about', () => true)], answers: [{ say: 'Glad you stayed.', approach: 'warm' }, { say: 'Why stay?', approach: 'ask', to: 'why' }] },
      why: { text: ['Where else? Up is for people with money. Down is for people with less.', 'Lin\'s noodles. Don\'t laugh. It\'s true.'], end: true } } });
    // ---- what they're at when you stop them: the talk opens on it (Voice's
    // `opens`: their greeting, with answers to it), and leads on from there
    const M = (c) => { const t = T(c); return (t && t.moment) || {}; };
    const at = (k) => (c) => M(c).kind === k;
    // (not when there's business: what they saw, a job, the hand-back, a lead, a favor come first)
    const clear = (c) => { const t = T(c); return calm(c) && !!t && !has('job')(c) && !has('handback')(c) && !t.tip && !(t.favor && !t.favor.given && c.world.lang.value('familiar', c) >= KNOWN_AT.favor); };
    const OPEN = { opens: true, cooldown: 180 };
    v.thread({ ...OPEN, id: 'at.work', about: ['work'], if: [resident, at('work'), clear], beats: {
      start: { line: 'greet', answers: [
        { say: 'What do you do here?', approach: 'ask', if: [work, '!learned:work'], to: 'thread:work' },
        { say: 'When are you off?', approach: 'ask', if: [work], to: 'off' },
        { say: 'Quiet shift?', approach: 'joke', to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] },
        { say: 'Don\'t let me keep you.', approach: 'warm', to: 'go' }] },
      off: { line: 'small.shift', answers: [{ say: 'And after?', approach: 'ask', if: [notYet('next')], to: 'thread:next' }, { say: 'That\'s a long day.', approach: 'warm', to: 'long' }] },
      long: { text: ['It is. Thanks for noticing.', 'Longer every year.'], then: ['need.company-=0.05'], end: true },
      laugh: { text: ['Quiet? I wish.', 'Ha. Never quiet enough to sit down.'], end: true },
      flat: { text: ['Some of us are working.', 'Is that a joke? I\'m at work.'], end: true },
      go: { text: ['Appreciated.', 'Come back when I\'m off.'], then: ['regard+=0.01'], end: true } } });
    const momentLike = (c) => { const L = Object.keys(R(c).likes || {}); return L.includes(M(c).act) || !L.length ? M(c).act : L[0]; };
    v.thread({ ...OPEN, id: 'at.fun', about: ['fun'], if: [resident, at('fun'), clear], beats: {
      start: { line: 'greet', answers: [
        { say: 'Come here often?', approach: 'ask', if: ['!learned:likes'], to: 'often' },
        { say: 'Thought I\'d find you here.', recalls: 'likes', approach: 'warm', if: [(c) => liked(c) === M(c).act], to: 'usual' },
        { say: 'Not at {learned.likes:place} tonight?', recalls: 'likes', approach: 'ask', if: [(c) => liked(c) !== M(c).act], to: 'change' },
        ...TALK_FUN.map((k) => ({ say: TALK_AT_FUN[k].joke, approach: 'joke', if: [(c) => M(c).act === k], to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] })),
        { say: 'Mind if I join you?', approach: 'warm', warmth: 1, soft: true, to: [{ landed: 'badly', to: 'alone' }, { to: 'join' }] }] },
      often: { line: 'at.often', then: [learn('likes', momentLike)], answers: [WITH, { say: 'Enjoy it.', approach: 'warm' }] },
      with: { line: 'small.likeswith', end: true },
      usual: { text: ['Where else would I be?', 'You know me too well.'], then: ['regard+=0.01'], end: true },
      change: { text: ['A change does you good, they say.', 'Couldn\'t face it tonight. Don\'t ask.'], end: true },
      laugh: { line: 'at.funwell', end: true }, flat: { line: 'at.funbadly', end: true },
      join: { text: ['Suit yourself. You\'re buying.', 'If you like. Don\'t talk through it.'], then: ['need.company-=0.05', 'regard+=0.01'], end: true },
      alone: { text: 'I come here to be on my own.', end: true } } });
    v.thread({ ...OPEN, id: 'at.going', about: ['day'], if: [resident, at('going'), clear], beats: {
      start: { line: 'greet', answers: [
        { say: 'And after that?', approach: 'ask', if: [notYet('next')], to: 'thread:next' },
        { say: 'Wet enough for you?', approach: 'joke', if: ['fact:raining'], to: [{ landed: 'badly', to: 'wet' }, { to: 'dry' }] },
        { say: 'Walk with you a bit?', approach: 'warm', warmth: 1, soft: true, to: [{ landed: 'badly', to: 'alone' }, { to: 'walk' }] },
        { say: 'Don\'t let me hold you up.', approach: 'straight', to: 'go' }] },
      wet: { text: 'Funny. My socks don\'t think so.', end: true },
      dry: { text: ['Ha. It\'s the Spires. They wring it out on us.', 'Wet enough for two. Here, have some.'], end: true },
      walk: { text: ['If you can keep up.', 'Come on, then.'], then: ['need.company-=0.05', 'regard+=0.01'], end: true },
      alone: { text: 'I walk faster on my own.', end: true },
      go: { text: ['Later.', 'Ha. You\'re not.'], end: true } } });
    v.thread({ ...OPEN, id: 'at.errand', about: ['day'], if: [resident, at('errand'), clear], beats: {
      start: { line: 'greet', answers: [
        { say: 'Find what you came for?', approach: 'ask', to: 'what' },
        { say: 'Need a hand?', approach: 'warm', to: 'hand' },
        { say: 'Treat yourself.', approach: 'joke', to: [{ landed: 'badly', to: 'flat' }, { to: 'laugh' }] }] },
      what: { line: 'at.errand', end: true },
      hand: { text: ['I\'ve got it. Kind of you.', 'You can carry the rice. Joking. Mostly.'], then: ['regard+=0.01'], end: true },
      laugh: { text: ['On what I earn? Ha.', 'Maybe a plum. One plum.'], end: true }, flat: { text: 'It\'s errands. There\'s no treating in it.', end: true } } });
    // ---- Lin, and the two at the counter
    v.thread({ id: 'lin.bar', about: ['work'], if: [who('lin')], label: 'How\'s business?', beats: {
      start: { text: 'Full at six, empty at two, and the rent\'s the same either way.', answers: [
        { say: 'The broth\'s worth it.', approach: 'warm', to: 'pleased' }, { say: 'Put the prices up.', approach: 'straight', to: 'prices' }] },
      pleased: { text: 'Flattery. Eat, then.', end: true }, prices: { text: 'And lose Mr Okonkwo? He\'s been on that stool since his wife.', end: true } } });
    v.thread({ id: 'lin.cellar', about: ['home'], if: [who('lin')], label: 'About the cellar', beats: {
      start: { text: 'The cellar is yours as long as the rent comes and nobody lifts that rug.', answers: [
        { say: 'I owe you, Lin.', approach: 'warm', to: 'owe' }, { say: 'What\'s really in the broth?', approach: 'joke', to: 'broth' }] },
      owe: { text: 'You do. Fix the radio when it goes again.', then: ['regard+=0.02'], end: true },
      broth: { text: 'Nobody asks what you do down there. Nobody asks me what\'s in the broth either.', end: true } } });
    v.thread({ id: 'lin.word', about: ['street'], if: [who('lin')], label: 'What are people saying?', weight: 1.4, cooldown: 360, beats: { start: { line: 'lin.word', end: true } } });
    v.thread({ id: 'ozzy.cab', about: ['work'], if: [who('ozzy')], label: 'How\'s the cab trade?', beats: {
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
    const fv = RESIDENTS[id] ? Known.favorFor(id) : null;
    return { who: id, t: City.w.now, jobs, cr: s.cr, moment: talkMoment(n, id), tip: RESIDENTS[id] ? Tips.dueFrom(id) : null, fixed: last ? { thing: ODD[last.tpl].name, sour: (s.flags['sour:' + id] || 0) > s.day } : null, favor: fv };
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
    this.log = []; this.shown = 0; this.lastCard = ''; this.recall = false; this.record(v, n);
    this.frame(n);
    Hud.toggle('talk', n);
    return true;
  },
  showing(n) { return !!this.view && this.n === n && Hud.open === 'talk'; },
  // an answer: said, and what it leads to; goodbye ends it, their last word over their head
  answer(i) {
    if (!this.view) return;
    const opt = this.view.answers.find((a) => a.i === i);
    this.how = opt && (opt.kind === 'answer' || opt.kind === 'thread') ? opt.approach || null : null; // (how what you said came at them, for the panel)
    this.recall = !!(opt && opt.recalls); // (and whether it recalled something they'd told you)
    const v = City.w.voice.answer(i); this.view = v;
    this.flush();
    if (v && !v.ended) this.record(v, this.n);
    if (!v || v.ended) {
      const n = this.n, bye = v && v.lines.filter((l) => l.who === 'them').pop();
      Hud.toggle(null);
      if (n && bye) Actors.say(n, this.words(bye, n));
      return;
    }
    Hud.panel('talk');
  },
  // the panel closed (walked off): the talk's over, without a goodbye
  close() { if (this.typer) this.typer.stop(); if (this.view && City.on && City.w.voice.current()) City.w.voice.end(); this.n = this.id = this.view = null; this.log = []; this.shown = 0; Known.dirty(); },
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
      if (d.what === 'favor') {
        const f = { kind: d.kind, day: Game.s.day }; if (d.tip) f.tip = d.tip; if (d.job) { f.job = d.job; f.took = !!d.took; }
        Known.favors()[d.who] = f;
        if (d.kind === 'tip') Tips.tell(d.tip);
        if (d.kind === 'job' && d.took) Jobs.take(d.job, d.pay);
        if (d.kind === 'price') Game.toast(`${R} will give you a friend's price from now on.`, 'good');
      }
    }
    if (q.length) { Hud.refresh(); Save.write(); }
    Known.dirty(); // (what you know of them may have changed)
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
  // what was just said, added to the thread: their lines (each its own
  // bubble), yours with how it came at them and how it landed, what you
  // learned, and a job's card when it's new or changed
  record(v, n) {
    const T = this.kept(), you = v.lines.find((q) => q.who === 'you');
    for (const l of v.lines.filter((q) => q.who !== 'note').concat(v.lines.filter((q) => q.who === 'note'))) { // (what you learned, after what they said)
      const w = this.words(l, n); if (!w || (Array.isArray(w) && !w.length)) continue;
      if (l.who === 'you') this.log.push({ who: 'you', text: Array.isArray(w) ? w.join(' ') : w, how: l === you ? this.how : null, recall: l === you && this.recall, landed: l === you && (this.how || this.recall) ? v.landed : null });
      else if (l.who === 'note' || l.who === 'aside') this.log.push({ who: l.who, text: Array.isArray(w) ? w.join(' ') : w });
      else for (const q of Array.isArray(w) ? w : [w]) this.log.push({ who: 'them', text: q });
    }
    const card = this.card(v, T);
    if (card && card !== this.lastCard) this.log.push({ who: 'card', html: card });
    this.lastCard = card;
  },
  // the two of you framed in the open part of the screen, left of the talk
  frame(n) { if (innerWidth < TALK_NARROW) return; Game.cam.x = (Player.x + n.x) / 2 + View.w * 0.27; },
  // their face, for the head of the talk: the figure from the front, the
  // head and shoulders (made once a look)
  portrait(n) { return this.face(n.def.look, n.i); },
  face(look0, i) {
    if (!look0) return '';
    const k = JSON.stringify(look0) + i; if (this.faces.has(k)) return this.faces.get(k);
    const look = Object.assign({}, look0, { pose: 'stand', seed: 20 + i, view: 'front' }); delete look.umbrella; delete look.umbrellaGlow;
    const sp = person(look), c = sp.c, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const size = Math.max(16, Math.round((y1 - y0 + 1) * 0.55)), sx = Math.round((x0 + x1 + 1) / 2 - size / 2), sy = y0 - 1;
    const [out, g] = canvasOf(size, size); g.imageSmoothingEnabled = false;
    g.drawImage(c, sx, sy, size, size, 0, 0, size, size);
    if (sp.e) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(sp.e, sx, sy, size, size, 0, 0, size, size); }
    const url = out.toDataURL(); this.faces.set(k, url); return url;
  },
  // how they stand with you, in a word or two (nothing for most)
  stand() {
    const fs = City.on && City.w.fellowship; if (!fs || !this.id) return '';
    const r = fs.regard(this.id, 'player');
    return r >= 0.35 ? 'a friend' : r >= 0.15 ? 'likes you' : r <= -0.1 ? 'wary of you' : '';
  },
  panel(n) {
    const v = this.view, F = this.fills(n), T = this.kept(), first = talkFirst(n.def.name);
    const line = (e) => {
      if (e.who === 'them') return `<p class="tk-line them sub"><b>${first}</b>${e.text}</p>`;
      if (e.who === 'you') {
        const how = e.how || e.recall ? `<i class="${e.landed === 'well' || e.landed === 'badly' ? e.landed : ''}">${[e.recall ? '✎ remembered' : '', e.how ? TALK_HOW[e.how] || e.how : ''].filter(Boolean).join(' · ')}${e.landed === 'well' ? ' · it lands' : e.landed === 'badly' ? ' · it falls flat' : ''}</i>` : '';
        return `<p class="tk-line you"><b>You</b>${e.text}${how}</p>`;
      }
      if (e.who === 'note') return `<p class="tk-note note">${e.text}</p>`;
      if (e.who === 'aside') return `<p class="tk-aside dim">${e.text}</p>`;
      return `<div class="tk-card">${e.html}</div>`;
    };
    const f = Known.fam(this.id), face = this.portrait(n), sub = [n.def.title, f >= KNOWN_AT.bands[0] ? Known.band(f) : '', this.stand()].filter(Boolean).join(' · ');
    let h = `<div class="tk"><div class="tk-head">${face ? `<img class="tk-face" src="${face}" alt="">` : ''}<div class="tk-who"><b>${n.def.name}</b>${sub ? `<small>${sub}</small>` : ''}</div><button data-act="resume" class="tk-x quiet" aria-label="Close">✕</button></div>`;
    h += `<div class="talk tk-log">${this.log.map(line).join('')}</div><div class="tk-say">`;
    const pick = v.answers.filter((a) => a.kind === 'answer' || a.kind === 'thread'), rest = v.answers.filter((a) => a.kind === 'drop' || a.kind === 'bye');
    if (pick.length) h += '<div class="buttons answers">' + pick.map((a) => this.button(a, v, T, F)).join('') + '</div>';
    const role = n.def.role ? NPC_ROLE[n.def.role] : null;
    h += `<div class="buttons tk-foot">${role ? `<button data-role="1">${role.verb}</button>` : ''}${rest.map((a) => `<button data-say="${a.i}" class="quiet">${a.kind === 'drop' ? 'Let it lie' : 'Goodbye'}</button>`).join('')}</div></div></div>`;
    return [n.def.title ? `${n.def.name} · ${n.def.title}` : n.def.name, h];
  },
  // once the panel's drawn: what hasn't been said yet is said, their words at
  // a talking pace and yours at once, the answers waiting till it's done
  after(body) {
    const log = body.querySelector('.tk-log'), win = $('panel'); if (!log) return;
    const els = [...log.children].slice(this.shown), n = this.log.length;
    log.scrollTop = log.scrollHeight;
    if (!this.typer) this.typer = new Tycho.ui.Typer();
    if (!els.length) { win.classList.remove('typing'); return; }
    win.classList.add('typing');
    this.typer.type(els, (el) => el.classList.contains('them') || el.classList.contains('tk-aside'), {
      show: (el) => { const r = el.getBoundingClientRect(), b = log.getBoundingClientRect(); if (r.bottom > b.bottom) log.scrollTop += r.bottom - b.bottom; },
      done: () => { this.shown = Math.max(this.shown, n); win.classList.remove('typing'); log.scrollTop = log.scrollHeight; },
    });
    log.onclick = () => this.typer.finish();
  },
  // an answer, as a button: a job's take and hand-back are the main ones
  button(a, v, T, F) {
    const def = a.kind === 'answer' && v.thread ? City.w.voice.threads.get(v.thread.id).beats[v.thread.beat].answers[+a.id.slice(1)] : null;
    const j = def && def.job ? talkJob(T, def.job === 'take' ? 'job' : 'handback') : null, main = j || (def && def.favor);
    const text = this.fill(a.kind === 'thread' ? a.label : a.label || a.say, F), mark = a.recalls ? '✎ ' : '';
    const how = a.approach ? ` <small class="how-${a.approach}">${mark}${TALK_HOW[a.approach] || a.approach}</small>` : mark ? ' <small class="how-recall">✎ remembered</small>' : '';
    return `<button data-say="${a.i}"${j ? ` data-job="${def.job}:${j.id}"` : ''}${main ? ' class="go"' : ''}${a.ok ? '' : ' disabled'}>${text}${how}</button>`;
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
    if (th === 'favor' && T.favor && T.favor.kind === 'job') return `<div class="ask"><h3>${RESIDENTS[T.who].name}'s ${T.favor.thing} · ${T.favor.pay} cr</h3><p class="dim">A favor: they'd bring it to nobody else.</p></div>`;
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
