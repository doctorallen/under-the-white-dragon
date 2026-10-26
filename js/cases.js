'use strict';
// ---------------------------------------------------------------------------
// Cases: detective work. A case has a scene or two with clues to find (things
// to pick up, photos to enhance, people to question, gently or not), leads
// that open when the right clues are in the case file, and a suspect at the
// end of them. Whether the suspect is a synth is for you to find out: the
// baseline test reads their eye and pulse as the questions get harder. Then
// your call: retire, arrest, or let them go. Push too hard and they run.
// The main cases are written; the night desk makes short ones, a few minutes
// each, in the districts you can reach. Closing a case pays and earns rank.
// ---------------------------------------------------------------------------
const SUSPECT_LOOKS = [
  { skin: SKINS[4], hair: 'bob', hairCol: '#1a1414', top: '#3a1a2a', coat: 'jacket', legs: '#1a1a1e', acc: '#3af0e0', trim: true },
  { skin: SKINS[1], hair: 'undercut', hairCol: '#c8c8c8', top: '#2a2a2a', coat: 'long', legs: '#1a1a24' },
  { skin: SKINS[3], hair: 'long', hairCol: '#3a2018', top: '#5a4a3a', legs: '#2a2a2a' },
  { skin: SKINS[0], hair: 'short', hairCol: '#8a6a4a', top: '#3a4a5a', coat: 'jacket', legs: '#2a2a34' },
  { skin: SKINS[2], hair: 'hood', top: '#2a3a2a', legs: '#1a1a1e' },
  { skin: SKINS[5], hair: 'bun', hairCol: '#2a2020', top: '#6a3a3a', coat: 'long', legs: '#2a2030' },
];
const CASES = {
  menagerie: {
    title: 'The Menagerie', main: true, xp: 80, reward: { cr: 220 },
    brief: 'Somebody walked into the Menagerie on Neon Row last night and shot every animal in the back room. Synth animals cost more than a year\'s pay, and a real one costs ten. The owner, Lio, is screaming at the front desk. Find out who.',
    clues: {
      casings: { name: 'Spent cells', kind: 'item', at: { level: 'd_neonrow', x: 610 }, text: 'Military-grade blaster cells, still warm. Not something you buy on Neon Row.' },
      still: { name: 'Security still', kind: 'photo', at: { level: 'd_neonrow', x: 668 }, text: 'Enhanced: in the window\'s reflection, a woman with a coiled snake tattooed on her neck.', detail: 'snake' },
      band: { name: 'Owl\'s ID band', kind: 'item', at: { level: 'd_neonrow', x: 720 }, text: 'Its serial says the owl was real. Twelve thousand credits of real, and somebody knew.' },
      lio: { name: 'Lio\'s story', kind: 'talk', npc: 'Lio', text: 'Lio owes money to the Coil, the club at the end of the Row. "They said they\'d take it out of my stock."', press: 'Pressed, Lio admits a dancer from the Coil came by the day before, asking which animals were real.' },
    },
    leads: [{ id: 'coil', name: 'The Coil, at the end of Neon Row', needs: ['still', 'lio'], text: 'The tattoo and Lio\'s debt both point at the Coil.' }],
    suspect: { name: 'Zola', needs: 'coil', at: { level: 'd_neonrow', x: 2050 }, synth: 'random', look: { skin: SKINS[4], hair: 'bob', hairCol: '#1a1414', top: '#1a3a3a', coat: 'jacket', legs: '#1a1a24', acc: '#3af0e0', trim: true, eye: null },
      lines: ['You\'re the cop who\'s been asking about me. I dance. That\'s all.', 'Lio owes the Coil. Everybody knows. I didn\'t shoot anything.'] },
    outcome: { synth: 'Zola was a synth working off Meridian\'s books for the Coil, sent to make an example of Lio. Hale nods. "Good work, tracer."', human: 'Zola shot the animals for the Coil\'s money. Human, and guilty. She\'ll do ten years.' },
  },
  iris: {
    title: 'Iris', main: true, after: ['clinic'], xp: 120, reward: { cr: 300 },
    brief: 'The chop clinic\'s record says a woman with no ID had a serial cut out of her wrist and asked the way to the subway. The old line runs to Old Town. She\'s the first of the four. Go down after her.',
    clues: {
      ticket: { name: 'Punched ticket', kind: 'item', at: { level: 'oldtown', x: 300 }, text: 'Old Town line, one way, three days ago. Punched at the Mayor\'s stop.' },
      bandage: { name: 'Clean bandage', kind: 'item', at: { level: 'd_arcade', spot: 5 }, text: 'From a wrist. No blood: synths don\'t bleed like that.' },
      plate: { name: 'Market photo', kind: 'photo', at: { level: 'd_lantern', spot: 3 }, text: 'Enhanced: a serial plate for sale on a stall, IR-4, and behind it, the Mayor\'s hall.', detail: 'plate' },
      ferry: { name: 'The Ferryman\'s word', kind: 'talk', npc: 'The Ferryman', text: '"A woman with a cut wrist came through, polite. Too polite. She went looking for the Mayor."', press: 'Pressed: "The Mayor sells synths back to whoever lost them. She didn\'t know that. Go, quickly."' },
    },
    leads: [{ id: 'hall', name: 'The Old Mayor\'s hall, in Old Town', needs: ['plate', 'ferry'], text: 'She went to the Mayor. The Mayor sells synths back to Meridian.' }],
    gate: { boss: 'mayor', text: 'The Old Mayor stands between you and her' },
    suspect: { name: 'Iris', needs: 'hall', boss: 'mayor', at: { level: 'oldtown', x: 2960 }, synth: true, look: { skin: SKINS[0], hair: 'long', hairCol: '#2a1a14', top: '#d8d0c0', coat: 'long', legs: '#3a3a3a' },
      lines: ['You came for me. Of course you did.', 'I wanted to see the sun once, from underneath. That\'s all. Is that a crime here?', 'There are three more of us. We were made to come home.'] },
    outcome: { retire: 'It\'s quick. She doesn\'t run.', arrest: 'She holds out her wrists. The precinct will have questions for her, and so will you.', release: '"Find the others before Meridian does," she says, and goes.' },
  },
  bishop: {
    title: 'Bishop', main: true, after: ['iris'], xp: 140, reward: { cr: 360 },
    brief: 'The second synth works in the Works, under a name nobody checks. The Mayor\'s key opens the lift down from Old Town.',
    clues: {
      roster: { name: 'Shift roster', kind: 'item', at: { level: 'd_pumphall', spot: 4 }, text: 'One name on every shift for thirty years: Bishop. Nobody works every shift.' },
      badge: { name: 'Heat-scarred badge', kind: 'item', at: { level: 'd_foundry', spot: 6 }, text: 'Melted at the edges. The face on it hasn\'t aged a day.' },
      ledger: { name: 'Canteen camera', kind: 'photo', at: { level: 'works', x: 1500 }, text: 'Enhanced: a man drinking coolant from a canteen cup like it\'s coffee.', detail: 'cup' },
      cook: { name: 'Cookie\'s gossip', kind: 'talk', npc: 'Cookie', text: '"Never sleeps, never eats. That\'s Bishop. The Foreman keeps him close."', press: 'Pressed: "The Foreman sells the Works\' power upstairs. Bishop keeps the pumps running so nobody looks."' },
    },
    leads: [{ id: 'crane', name: 'The crane bay, past the Foreman', needs: ['ledger', 'cook'], text: 'Bishop is the Foreman\'s secret, and the Foreman guards him.' }],
    gate: { boss: 'foreman', text: 'The Foreman stands between you and him' },
    suspect: { name: 'Bishop', needs: 'crane', boss: 'foreman', at: { level: 'works', x: 2900 }, synth: true, look: { skin: SKINS[2], hair: 'short', hairCol: '#3a3a3a', top: '#4a4030', legs: '#2a2a24', hat: null },
      lines: ['I fix the pumps. If I stop, the Stack floods in a week.', 'I didn\'t run from anything. I came home. This is the closest thing.'] },
    outcome: { retire: 'The pumps slow, that night.', arrest: '"Tell them to keep pump seven greased," he says, and comes quietly.', release: '"The third went down past the Works," he says. "She\'s young. Be kind."' },
  },
  wren: {
    title: 'Wren', main: true, after: ['bishop'], xp: 160, reward: { cr: 420 },
    brief: 'The third synth went into the Bowels, under the Works. The Foreman\'s pass opens the shaft.',
    clues: {
      drawing: { name: 'Child\'s drawing', kind: 'item', at: { level: 'd_cables', spot: 4 }, text: 'A tower going up into the sky, and a girl at the bottom.' },
      tag: { name: 'Tracking tag', kind: 'item', at: { level: 'd_vaults', spot: 5 }, text: 'Meridian\'s. Still pinging, faintly. Meridian knows where she is.' },
      cam: { name: 'Chamber camera', kind: 'photo', at: { level: 'bowels', x: 1700 }, text: 'Enhanced: a small figure sitting by the Root, its cables curled round her like a cat.', detail: 'girl' },
      hermit: { name: 'The Hermit\'s word', kind: 'talk', npc: 'The Hermit', text: '"She talks to the Root. The Root talks back."', press: 'Pressed: "It made them. The synths. Meridian only stole the design. Leave her be."' },
    },
    leads: [{ id: 'root', name: 'The Root\'s chamber', needs: ['cam', 'hermit'], text: 'She\'s with the Root, and something guards it.' }],
    gate: { boss: 'root', text: 'The Root\'s guardian stands between you and her' },
    suspect: { name: 'Wren', needs: 'root', boss: 'root', at: { level: 'bowels', x: 3000 }, synth: true, look: { skin: SKINS[4], hair: 'bob', hairCol: '#c8c8d8', top: '#8a8aa0', legs: '#4a4a5a', tall: 0.72 },
      lines: ['It made us to come home. Meridian took us before we could.', 'The last one is up top. Ada. She\'s the one who remembers how.'] },
    outcome: { retire: 'The Root goes quiet, after.', arrest: 'She takes your hand like a child would. It doesn\'t make it easier.', release: 'She sits down by the Root and closes her eyes. The cables hum a little warmer.' },
    reward2: { items: { spirepass: 1 } },
  },
  maker: {
    title: 'The Maker', main: true, after: ['wren'], xp: 200, reward: { cr: 500 }, ending: true,
    brief: 'The last synth, Ada, is in the Spires, in Meridian\'s own tower. Your spinner can fly there now. Whatever happens up there, it ends tonight.',
    clues: {
      contract: { name: 'Meridian contract', kind: 'item', at: { level: 'spires', x: 900 }, text: 'Four units, delivered to the Spires. Signed by nobody.' },
      blueprint: { name: 'Neural blueprint', kind: 'item', at: { level: 'd_glasshouse', spot: 6 }, text: 'The design isn\'t Meridian\'s. It came up from below.' },
      memory: { name: 'Lobby camera', kind: 'photo', at: { level: 'spires', x: 1700 }, text: 'Enhanced: Halden, Meridian\'s head of security, carrying a woman up to the top floor.', detail: 'carry' },
      concierge: { name: 'The concierge\'s word', kind: 'talk', npc: 'Concierge', text: '"Top floor. Mr Halden doesn\'t like visitors."', press: 'Pressed: "She came in on her own. Halden put her in the vault. She hasn\'t asked to leave."' },
    },
    leads: [{ id: 'top', name: 'The top of Meridian\'s tower', needs: ['memory', 'concierge'], text: 'Ada is at the top, and Halden is in the way.' }],
    gate: { boss: 'halden', text: 'Halden stands between you and her' },
    suspect: { name: 'Ada', needs: 'top', boss: 'halden', at: { level: 'spires', x: 3000 }, synth: true, look: { skin: SKINS[0], hair: 'long', hairCol: '#e8e8f0', top: '#e8e8f0', coat: 'long', legs: '#c8c8d8' },
      lines: ['You came all the way up. The others said you would.', 'The Root made us to bring something back up to the city. Meridian wants to sell it. You get to choose, detective. That\'s what you\'re for.'] },
    ending: [
      { label: 'Expose Meridian', flag: 'expose', text: 'You send the contract, the blueprint and the camera to every screen in the city. The Spires go dark for a night.', reward: { cr: 500 } },
      { label: 'Take Meridian\'s deal', flag: 'deal', text: 'Halden\'s replacement pays well. Ada goes back in a box. Nobody ever asks you about any of it again.', reward: { cr: 3000, gear: 'circlet' } },
      { label: 'Send her home', flag: 'home', text: 'You fly her down, past the Stack, past the street, all the way down. The Root is waiting.', reward: { gear: 'synthweave' } },
    ],
  },
};
const CASE_ORDER = Object.keys(CASES);
// rank: closing cases and jobs earns it
const RANKS = [[0, 'Tracer, third grade'], [100, 'Tracer, second grade'], [260, 'Tracer, first grade'], [500, 'Senior tracer'], [850, 'Lead tracer'], [1300, 'Chief tracer']];

// the night desk: short cases made up from a seed, in districts you can reach
const NIGHT = {
  kinds: {
    pet: { title: (v) => 'The ' + v.animal, brief: (v) => `Someone destroyed ${v.owner}'s synth ${v.animal} in ${v.place}. ${v.owner} wants whoever did it found tonight.`,
      clues: (v) => ({ marks: { name: 'Scorch marks', kind: 'item', text: `Blaster burns on the wall where the ${v.animal} was kept.` }, cam: { name: 'Doorbell camera', kind: 'photo', text: `Enhanced: someone leaving in a hurry. ${v.tell}.`, detail: 'figure' }, owner: { name: v.owner + '\'s story', kind: 'talk', text: `"${v.suspect} wanted the ${v.animal}. Offered me half what it was worth."`, press: `Pressed, ${v.owner} admits the ${v.animal} was a fake, and ${v.suspect} found out.` } }) },
    chrome: { title: () => 'Chrome for sale', brief: (v) => `Someone is selling illegal implants out of ${v.place}. A buyer nearly died on the table. Find the dealer.`,
      clues: (v) => ({ kit: { name: 'Surgical kit', kind: 'item', text: 'Dirty tools and an empty implant case.' }, ledger: { name: 'Buyer\'s photo', kind: 'photo', text: `Enhanced: the dealer handing over a case. ${v.tell}.`, detail: 'figure' }, buyer: { name: 'The buyer\'s story', kind: 'talk', text: `"${v.suspect}. Said the arm was clean. It wasn't."`, press: `Pressed: "${v.suspect} works out of ${v.place}, late. Don't say I told you."` } }) },
    missing: { title: (v) => 'Where is ' + v.victim, brief: (v) => `${v.victim} hasn't been seen in ${v.place} for three days, but their door code was used last night.`,
      clues: (v) => ({ bag: { name: v.victim + '\'s bag', kind: 'item', text: 'Dropped in a hurry. The ID is still in it.' }, cam: { name: 'Street camera', kind: 'photo', text: `Enhanced: ${v.victim}'s face, on someone walking wrong. ${v.tell}.`, detail: 'figure' }, friend: { name: 'A neighbour\'s word', kind: 'talk', text: `"${v.victim} came home last night. Didn't know my name."`, press: `Pressed: "${v.suspect}, they call themselves now. They're still around ${v.place}."` } }) },
  },
  animals: ['owl', 'cat', 'snake', 'dog', 'heron', 'fox'], owners: ['Mr Abara', 'Ms Lindqvist', 'Old Hosseini', 'Dee Marsh', 'the Tanakas', 'Mrs Petrov'],
  suspects: ['Kell', 'Rhea', 'Moss', 'Ivo', 'Saffi', 'Dane', 'Petra', 'Luca', 'Noor', 'Teague'], victims: ['Amos Reyes', 'Lena Cho', 'Jonah Pike', 'Mara Quist', 'Felix Obi'],
  tells: ['A scar through the left eyebrow', 'A red scarf', 'Walks with a limp', 'A shaved head and silver rings', 'A long grey coat'],
};

const Cases = {
  st(id) { return Game.s.cases[id] || null; },
  def(id) { return CASES[id] || (Game.s.night && Game.s.night.id === id ? this.nightDef(Game.s.night) : null); },
  closed(id) { const c = this.st(id); return !!(c && c.done); },
  open() { const out = CASE_ORDER.filter((id) => this.st(id) && !this.st(id).done); if (Game.s.night && !this.closed(Game.s.night.id) && this.st(Game.s.night.id)) out.push(Game.s.night.id); return out; },
  available(id) { const C = CASES[id]; return C && !this.st(id) && (!C.after || C.after.every((a) => this.closed(a) || Quests.done(a))); },
  start(id) {
    const C = this.def(id); if (!C || this.st(id)) return;
    Game.s.cases[id] = { found: {}, leads: {}, test: null, done: false, synth: C.suspect.synth === 'random' ? hash(Game.s.day, id.length, Game.s.deaths + 9) < 0.5 : !!C.suspect.synth };
    Game.s.track = id;
    Game.toast('Case: ' + C.title + '. ' + this.objective(id), 'good');
    World.questProps(); Actors.questSpawns(); Hud.refresh(); Save.write();
  },
  rank() { let r = RANKS[0]; for (const R of RANKS) if (Game.s.xp >= R[0]) r = R; return r; },
  nextRank() { return RANKS.find((R) => R[0] > Game.s.xp) || null; },
  xp(n) {
    const before = this.rank()[1]; Game.s.xp += n; const after = this.rank()[1];
    Game.toast('+ ' + n + ' rank', 'good'); if (after !== before) setTimeout(() => Game.toast('Promoted: ' + after + '. Hale pays you more now.', 'good'), 1500);
  },
  // a clue found: into the case file; leads open when their clues are in
  found(id, cid) {
    const c = this.st(id), C = this.def(id); if (!c || c.found[cid]) return;
    c.found[cid] = 1; const K = C.clues[cid];
    Game.toast('Clue: ' + K.name + '. ' + K.text, 'good');
    for (const L of C.leads) if (!c.leads[L.id] && L.needs.every((n) => c.found[n])) { c.leads[L.id] = 1; setTimeout(() => Game.toast('New lead: ' + L.name + '. ' + L.text, 'good'), 1800); }
    World.questProps(); Actors.questSpawns(); Hud.refresh(); Save.write();
  },
  suspectOut(id) { const c = this.st(id), C = this.def(id), S = C.suspect; return !!(c && !c.done && c.leads[S.needs] && (!S.boss || Game.flag(ENEMY[S.boss].flag))); },
  objective(id) {
    const c = this.st(id), C = this.def(id); if (!c) return C.brief; if (c.done) return 'Closed';
    const left = Object.keys(C.clues).filter((k) => !c.found[k]);
    if (this.suspectOut(id)) return 'Find ' + C.suspect.name + ' and decide what they are';
    if (c.leads[C.suspect.needs] && C.gate) return C.gate.text;
    return 'Follow the clues: ' + left.length + ' still to find';
  },
  // clue props in this level: things to pick up or photos to enhance
  props(level) {
    const out = [];
    for (const id of this.open()) {
      const c = this.st(id), C = this.def(id);
      for (const cid in C.clues) { const K = C.clues[cid]; if (c.found[cid] || K.kind === 'talk' || !K.at || K.at.level !== level) continue; out.push({ id, cid, K }); }
    }
    return out;
  },
  // people a case puts in this level: night witnesses, suspects once found
  npcs(level) {
    const out = [];
    for (const id of this.open()) {
      const c = this.st(id), C = this.def(id);
      for (const cid in C.clues) { const K = C.clues[cid]; if (K.kind === 'talk' && K.at && K.at.level === level) out.push({ name: K.npc, look: K.look, at: K.at, lines: K.lines || ['...'], caseId: id }); }
      const sat = c.at || C.suspect.at; if (this.suspectOut(id) && sat.level === level && !c.fled) out.push({ name: C.suspect.name, look: C.suspect.look, at: sat, lines: C.suspect.lines, caseId: id, suspect: true });
    }
    return out;
  },
  // what someone can do for a case when you talk to them
  actionsFor(name) {
    const out = [];
    for (const id of this.open()) {
      const c = this.st(id), C = this.def(id);
      for (const cid in C.clues) { const K = C.clues[cid]; if (K.kind === 'talk' && K.npc === name && !c.found[cid]) out.push({ id, kind: 'ask', cid }); }
      if (this.suspectOut(id) && C.suspect.name === name) out.push({ id, kind: 'suspect' });
    }
    return out;
  },
  ask(id, cid, press) { const C = this.def(id), K = C.clues[cid]; this.found(id, cid); if (press) Game.toast(K.press, 'good'); },
  // the verdict, and what it earns
  verdict(id, action) {
    const c = this.st(id), C = this.def(id); if (!c || c.done) return;
    c.done = true; c.verdict = action; c.suspected = c.test;
    const synth = c.synth, wrong = (action === 'retire' && !synth);
    let text = C.outcome ? (C.outcome[action] || C.outcome[synth ? 'synth' : 'human']) : '';
    if (wrong) { text = (C.suspect.name + ' was human. You retired a human being. The precinct fines you, and Hale won\'t look at you.'); Game.s.cr = Math.max(0, Game.s.cr - 300); Game.s.flags.misfire = (Game.s.flags.misfire || 0) + 1; }
    else {
      const pay = (C.reward && C.reward.cr ? C.reward.cr : 0) * (action === 'release' && synth && !C.main ? 0.5 : 1) * (1 + 0.1 * RANKS.indexOf(this.rank()));
      Game.s.cr += Math.round(pay); if (C.reward2) Quests.pay(C.reward2);
      this.xp(Math.round((C.xp || 40) * (c.test ? 1.25 : 1)));
      Game.toast('Case closed: ' + C.title + '. + ' + Math.round(pay) + ' cr', 'good');
    }
    if (C.main) Game.s.flags[id] = action;
    Game.s.closed = (Game.s.closed || 0) + 1;
    if (text) setTimeout(() => Game.toast(text, wrong ? 'warn' : 'good'), 1200);
    if (Game.s.track === id) Game.s.track = this.open()[0] || Quests.open()[0] || null;
    Actors.load(); Hud.refresh(); Save.write();
  },
  endWith(i) { const E = CASES.maker.ending[i]; Game.s.flags.ending = E.flag; Quests.pay(E.reward); this.verdict('maker', 'ending'); Hud.toggle('ending'); },
  // where the tracked case wants you next
  where(id) {
    const c = this.st(id), C = this.def(id); if (!c || c.done) return null;
    if (this.suspectOut(id)) return { level: C.suspect.at.level, x: C.suspect.at.x, name: C.suspect.name };
    if (c.leads[C.suspect.needs] && C.gate) { const b = C.suspect.at.level; return { level: b, name: ENEMY[C.gate.boss].name }; }
    for (const cid in C.clues) { const K = C.clues[cid]; if (c.found[cid]) continue; if (K.kind === 'talk') { const at = K.at || npcWhere(K.npc); if (at) return { level: at.level, x: at.x, name: K.npc }; } else return { level: K.at.level, x: K.at.x, spot: K.at.spot, name: K.name }; }
    return null;
  },
  // ---- the night desk ----
  // a night case is made from the day and how many you've closed: the same
  // offer all night, a new one after you close it
  nightOffer() {
    const s = Game.s; if (s.night && !this.closed(s.night.id)) return s.night;
    const places = Object.keys(LEVELS).filter((id) => LEVELS[id].district && Travel.open(id)); if (!places.length) return null;
    const n = (s.closed || 0) * 7 + s.day, r = (k) => hash(n, k, 61), pick = (a, k) => a[Math.floor(r(k) * a.length)];
    const kinds = Object.keys(NIGHT.kinds), kind = pick(kinds, 1), level = pick(places, 2), tier = LEVELS[level].tier;
    const v = { animal: pick(NIGHT.animals, 3), owner: pick(NIGHT.owners, 4), suspect: pick(NIGHT.suspects, 5), victim: pick(NIGHT.victims, 6), tell: pick(NIGHT.tells, 7), place: LEVELS[level].name };
    s.night = { id: 'night' + n, kind, level, tier, v, look: Math.floor(r(8) * SUSPECT_LOOKS.length), spots: [Math.floor(r(9) * 1000), Math.floor(r(10) * 1000), Math.floor(r(11) * 1000), Math.floor(r(12) * 1000)], synth: r(13) < (kind === 'chrome' ? 0.25 : 0.6) };
    return s.night;
  },
  nightDef(N) {
    const K = NIGHT.kinds[N.kind], v = N.v, clues = K.clues(v), keys = Object.keys(clues), L = LEVELS[N.level];
    keys.forEach((k, i) => { const cl = clues[k]; if (cl.kind === 'talk') { cl.npc = { pet: v.owner, chrome: 'The buyer', missing: 'A neighbour' }[N.kind]; cl.at = { level: N.level, spot: N.spots[i] }; cl.look = SUSPECT_LOOKS[(N.look + 2) % SUSPECT_LOOKS.length]; cl.lines = ['You\'re the tracer? Ask, then.']; } else cl.at = { level: N.level, spot: N.spots[i] }; });
    return { title: K.title(v), night: true, xp: 40 + N.tier * 6, reward: { cr: 90 + N.tier * 45 }, brief: K.brief(v), clues, leads: [{ id: 'lead', name: v.suspect + ', in ' + L.name, needs: keys.filter((k) => clues[k].kind !== 'item'), text: 'You know who, and roughly where.' }],
      suspect: { name: v.suspect, needs: 'lead', at: { level: N.level, spot: N.spots[3] }, synth: N.synth, look: SUSPECT_LOOKS[N.look], lines: ['What do you want? I\'ve got nothing to say to a tracer.', 'Fine. Ask your questions.'] } };
  },
  takeNight() { const N = this.nightOffer(); if (N) this.start(N.id); },
  // the suspect ran: a synth bolts, a human just stops talking
  bolt(id) {
    const c = this.st(id), C = this.def(id);
    if (!c.synth) { Game.toast(C.suspect.name + ' has had enough. "Charge me or let me go, tracer."', 'warn'); c.test = null; c.asked = 0; Hud.toggle('talk', Actors.npcs.find((q) => q.def.name === C.suspect.name)); return; }
    c.fled = true; const n = Actors.npcs.find((q) => q.def.name === C.suspect.name), x = n ? n.x : Player.x + 60, y = n ? n.y : Player.y;
    Actors.caseNpcs(); Actors.spawn('fugitive', x, y, { look: C.suspect.look, caseId: id, named: C.suspect.name, elite: 'fug' + id, i: 70 });
    Game.toast(C.suspect.name + ' bolts! Bring them down before they get away.', 'warn');
  },
  surrender(id, x, y) {
    const c = this.st(id), C = this.def(id); c.fled = false; c.test = 'synth'; c.at = { level: World.L.id, x, y };
    Game.toast(C.suspect.name + ' goes down on one knee. "All right. All right."', 'good'); Actors.caseNpcs(); Save.write();
  },
  escaped(id) {
    const c = this.st(id), C = this.def(id); if (!c || c.done) return;
    c.done = true; c.verdict = 'escaped'; Game.s.closed = (Game.s.closed || 0) + 1; this.xp(10);
    Game.toast(C.suspect.name + ' got away. Hale will hear about it. Case closed, badly.', 'warn'); if (Game.s.track === id) Game.s.track = this.open()[0] || null; Save.write();
  },
  migrate(s) { s.cases = s.cases || {}; s.xp = s.xp || 0; },
};

// ---- the baseline test: a minigame in the talk panel ----------------------------
// Ask a question; watch the eye and the two needles for a couple of seconds.
// A human answers at once: the pupil opens, the pulse jumps. A synth answers
// flat, then, late, too much. Harder questions read clearer, but stress
// climbs, and at the top of the stress needle they won't sit still for it.
const BASELINE_QS = [
  [1, 'You\'re walking in the rain. A cab splashes you. What do you do?'], [1, 'Tell me about your mother.'], [1, 'You find a wallet on the walkway. It\'s full.'],
  [2, 'A child shows you her synth cat. It\'s broken. She asks you to fix it.'], [2, 'You\'re given a calf-skin coat as a gift.'], [2, 'You hear something crying in a locked capsule.'],
  [3, 'Your earliest memory. Tell me what it smells like.'], [3, 'Someone you love is a synth. They never told you. Do you forgive them?'], [3, 'An owl. A real one. Someone shoots it in front of you.'],
];
const Baseline = {
  on: false, id: null, asked: 0, stress: 0, t: 0, q: null, raf: 0, readings: [],
  open(id) { this.id = id; this.asked = 0; this.stress = 0; this.q = null; this.readings = []; Hud.toggle('test'); },
  ask(i) {
    if (this.q && this.t < 2.4) return;
    const [lvl, text] = BASELINE_QS[i]; this.q = { lvl, text, i }; this.t = 0; this.asked++;
    this.stress = Math.min(1, this.stress + lvl * 0.13 + (this.asked > 4 ? 0.1 : 0));
    const c = Cases.st(this.id); c.asked = (c.asked || 0) + 1;
  },
  // the reading at time t into an answer: [pupil 0..1, pulse 0..1]
  reading(t) {
    const q = this.q; if (!q) return [0.3, 0.3];
    const synth = Cases.st(this.id).synth, L = q.lvl, n = (k) => (hash(this.asked, k, Math.floor(t * 8)) - 0.5) * 0.04;
    if (!synth) { const a = clamp(t / 0.35, 0, 1) * Math.exp(-Math.max(0, t - 0.8) * 0.6); return [0.3 + a * (0.15 + L * 0.13) + n(1), 0.3 + a * (0.12 + L * 0.14) + n(2)]; }
    const late = clamp((t - 1.3) / 0.25, 0, 1) * Math.exp(-Math.max(0, t - 1.7) * 1.2), flat = clamp(t / 0.4, 0, 1) * 0.03;
    return [0.3 + flat + late * (0.25 + L * 0.12) + n(1), 0.3 + flat * 0.5 + late * (0.2 + L * 0.12) + n(2)];
  },
  draw() {
    const cv = $('testcv'); if (!cv || Hud.open !== 'test') { this.raf = 0; return; }
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, dpr = window.devicePixelRatio || 1;
    this.t += 1 / 60; const [pu, pl] = this.reading(this.t);
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    // the eye, close up: iris rings, a pupil that opens and closes, a glint
    const ex = W * 0.27, ey = H * 0.5, R = Math.min(W * 0.17, H * 0.4);
    g.fillStyle = '#d8d0c8'; g.beginPath(); g.ellipse(ex, ey, R * 1.35, R * 0.8, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 18; k++) { g.fillStyle = `hsl(${185 + k * 3}, 50%, ${18 + (k % 3) * 8}%)`; g.beginPath(); g.arc(ex, ey, R * (0.75 - k * 0.02), 0, Math.PI * 2); g.fill(); }
    for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; g.strokeStyle = 'rgba(160,220,230,0.25)'; g.lineWidth = dpr; g.beginPath(); g.moveTo(ex + Math.cos(a) * R * 0.2, ey + Math.sin(a) * R * 0.2); g.lineTo(ex + Math.cos(a) * R * 0.72, ey + Math.sin(a) * R * 0.72); g.stroke(); }
    g.fillStyle = '#020204'; g.beginPath(); g.arc(ex, ey, R * (0.12 + pu * 0.42), 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(ex - R * 0.22, ey - R * 0.24, R * 0.07, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(58,240,224,0.5)'; g.lineWidth = 2 * dpr; g.strokeRect(ex - R * 1.4, ey - R * 0.9, R * 2.8, R * 1.8);
    // the needles: pupil, pulse, stress
    const gauge = (x, label, v, col) => {
      const gy = H * 0.84, r = Math.min(W * 0.075, H * 0.2);
      g.strokeStyle = 'rgba(200,200,220,0.35)'; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(x, gy, r, Math.PI, 0); g.stroke();
      const a = Math.PI + clamp(v, 0, 1) * Math.PI; g.strokeStyle = col; g.lineWidth = 3 * dpr; g.beginPath(); g.moveTo(x, gy); g.lineTo(x + Math.cos(a) * r * 0.95, gy + Math.sin(a) * r * 0.95); g.stroke();
      g.fillStyle = '#a69cb6'; g.font = `${11 * dpr}px ui-monospace, monospace`; g.textAlign = 'center'; g.fillText(label, x, gy + 16 * dpr);
    };
    gauge(W * 0.66, 'PUPIL', pu, '#3af0e0'); gauge(W * 0.86, 'PULSE', pl, '#ff4ab0');
    // stress, a bar
    const sx = W * 0.6, sy = H * 0.12, sw = W * 0.34; g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(sx, sy, sw, 8 * dpr); g.fillStyle = this.stress > 0.75 ? '#ff4060' : '#ffb040'; g.fillRect(sx, sy, sw * this.stress, 8 * dpr);
    g.fillStyle = '#a69cb6'; g.textAlign = 'left'; g.font = `${11 * dpr}px ui-monospace, monospace`; g.fillText('STRESS', sx, sy - 4 * dpr);
    // a trace of this answer's pupil over time
    if (this.q) { g.strokeStyle = 'rgba(58,240,224,0.8)'; g.lineWidth = 1.5 * dpr; g.beginPath(); for (let k = 0; k <= 60; k++) { const tt = (k / 60) * Math.min(this.t, 2.4), v = this.reading(tt)[0]; const x = sx + (tt / 2.4) * sw, y = H * 0.5 - (v - 0.3) * H * 0.4; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.fillStyle = '#a69cb6'; g.fillText('ANSWER', sx, H * 0.3); }
    this.raf = requestAnimationFrame(() => this.draw());
  },
};

// ---- the photo enhancer: a picture of the scene, zoom in to find the detail ----
const Enhancer = {
  id: null, cid: null, img: null, s: 1, ox: 0, oy: 0, spot: null, found: false,
  open(id, cid, x, y) { this.id = id; this.cid = cid; this.found = false; this.make(x, y); Hud.toggle('photo'); },
  // the photo: the level painted round the scene, a little faded, with the
  // detail somewhere in it, small
  make(x, y) {
    const L = World.L, w = 320, h = 180, x0 = clamp(Math.round(x - w / 2), 0, Math.max(0, L.w - w)), y0 = clamp(Math.round(y - h + 30), 0, Math.max(0, L.h - h)), CS = T.chunk;
    const [c, g] = canvasOf(w, h); g.fillStyle = '#0a0c14'; g.fillRect(0, 0, w, h);
    for (let ky = Math.floor(y0 / CS); ky * CS < y0 + h; ky++) for (let kx = Math.floor(x0 / CS); kx * CS < x0 + w; kx++) { if (kx < 0 || ky < 0 || kx * CS >= L.w || ky * CS >= L.h) continue; const ch = Paint.get(kx, ky); g.drawImage(ch.c, ch.x - x0, ch.y - y0); }
    for (const p of World.props) { const s = Props.sprite(p); if (s) g.drawImage(s.c, Math.round(p.x - s.ax - x0), Math.round(p.y - s.ay - y0)); }
    // the detail: a figure at a window, small, somewhere off to one side
    const r = (k) => hash(Math.round(x), k, 33), dx = Math.round(30 + r(1) * (w - 70)), dy = Math.round(30 + r(2) * (h - 80));
    const C = Cases.def(this.id), look = (C.suspect && C.suspect.look) || SUSPECT_LOOKS[0], fig = person(Object.assign({}, look, { pose: 'stand', seed: 77 }));
    g.fillStyle = 'rgba(255,220,160,0.35)'; g.fillRect(dx - 4, dy - 2, 26, 34);
    g.drawImage(fig.c, 0, 0, fig.w, fig.h, dx - 4, dy - 4, fig.w * 0.6, fig.h * 0.6);
    this.spot = [dx + 9, dy + 14];
    // grain and scanlines, like an old camera
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const k = 0.75 + hash(i, 3, 9) * 0.2, ln = Math.floor(i / 4 / w) % 2 ? 0.9 : 1; d[i] = d[i] * k * ln + 8; d[i + 1] = d[i + 1] * k * ln + 10; d[i + 2] = d[i + 2] * k * ln + 14; }
    g.putImageData(id, 0, 0);
    this.img = c;
  },
  attach() {
    const cv = $('photocv'); if (!cv) return; const dpr = window.devicePixelRatio || 1; cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    this.s = Math.min(cv.width / this.img.width, cv.height / this.img.height); this.ox = (cv.width - this.img.width * this.s) / 2; this.oy = (cv.height - this.img.height * this.s) / 2; this.base = this.s;
    cv.onclick = (e) => { const r = cv.getBoundingClientRect(); this.enhance((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr); };
    this.draw();
  },
  // tap to zoom in twice as close on that point; close enough on the detail, found
  enhance(px, py) {
    const cv = $('photocv'); if (this.s >= this.base * 8) { this.reset(); return; }
    const ix = (px - this.ox) / this.s, iy = (py - this.oy) / this.s; this.s *= 2;
    this.ox = cv.width / 2 - ix * this.s; this.oy = cv.height / 2 - iy * this.s;
    const vx = (cv.width / 2 - this.ox) / this.s, vy = (cv.height / 2 - this.oy) / this.s;
    if (!this.found && this.s >= this.base * 4 && Math.abs(vx - this.spot[0]) < 22 && Math.abs(vy - this.spot[1]) < 22) { this.found = true; Cases.found(this.id, this.cid); }
    this.draw(); Hud.photoNote();
  },
  reset() { const cv = $('photocv'); this.s = this.base; this.ox = (cv.width - this.img.width * this.s) / 2; this.oy = (cv.height - this.img.height * this.s) / 2; this.draw(); },
  draw() {
    const cv = $('photocv'); if (!cv) return; const g = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    g.fillStyle = '#020306'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
    g.drawImage(this.img, this.ox, this.oy, this.img.width * this.s, this.img.height * this.s);
    g.strokeStyle = 'rgba(58,240,224,0.6)'; g.lineWidth = dpr; const c = 18 * dpr, m = 10 * dpr;
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [cv.width - m, m, -1, 1], [m, cv.height - m, 1, -1], [cv.width - m, cv.height - m, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * c); g.lineTo(x, y); g.lineTo(x + sx * c, y); g.stroke(); }
    g.fillStyle = '#3af0e0'; g.font = `${12 * dpr}px ui-monospace, monospace`; g.fillText('ENHANCE ' + Math.round(this.s / this.base) + '×', 16 * dpr, cv.height - 16 * dpr);
    if (this.found) { const [sx, sy] = this.spot; g.strokeStyle = '#ffd040'; g.lineWidth = 2 * dpr; g.strokeRect(this.ox + (sx - 14) * this.s, this.oy + (sy - 18) * this.s, 28 * this.s, 36 * this.s); }
  },
};
