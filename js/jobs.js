'use strict';
// ---------------------------------------------------------------------------
// The jobs that come to the back room, the heat, and the morning after.
// A job is a person, a broken thing and a choice: they turn up at the White
// Dragon with it (Jobs.spawn puts them there), you take it to the bench,
// fix it, and hand it back at the counter. The next morning (after you've
// slept) you hear what your fix did. Their state is in Game.s.jobs; the thing
// itself is on the bench (Game.s.bench) while you work on it.
// Heat (Game.s.heat, 0 to 100) is how close the precinct is to your door:
// illegal work on the bench, parts taken from where you shouldn't be, a
// Meridian serial that gets traced. Honest repairs and time bring it down. At
// 40 a patrol drone works your street; at 70 there's a knock before dawn.
// ---------------------------------------------------------------------------
const JOBS = {
  ozzy: {
    name: 'Ozzy', title: 'Ozzy\'s nav unit', dev: 'navunit', at: 792, wait: 520, pay: 80, honest: true,
    look: { skin: SKINS[1], hair: 'cap', capCol: '#ffd040', top: '#4a4430', coat: 'jacket', legs: '#2a2a34', wide: 1 },
    parts: { board: ['street', 'ok'], cell: ['street', 'dead'], aerial: ['street', 'burnt'] },
    lines: ['Rain\'s bad for business. Good for yours, I guess.'],
    offer: ['"You the one who fixes things? Auntie Lin said knock."', '"My cab\'s nav went dark mid-run. Smelled like a fuse. No nav, no fares; no fares, no rent."', '"Eighty when it works. Honest money, for once in this room."'],
    waiting: '"I\'ll be at the counter. Lin\'s noodles are the only thing in this city that still works."',
  },
  vey: {
    name: 'Vey', title: 'Vey\'s arm', dev: 'arm', at: 690, wait: 690, pay: 0, illegal: true, rusty: true,
    look: { skin: SKINS[0], hair: 'bob', hairCol: '#e8e8f2', top: '#2a2a3a', coat: 'long', legs: '#1a1a24', cyArm: true },
    parts: { servo: ['military', 'dead', 'heavy'], board: ['clinic', 'ok'], cell: ['clinic', 'worn'] },
    lines: ['Don\'t look at the arm. Everyone looks at the arm.'],
    offer: ['She keeps her right arm close, the hand half shut. "It locks. The elbow. Some days it won\'t open, and a hand that won\'t open gets noticed."', '"Somebody cut the serials off before I got it. Don\'t ask where I got it."', '"I can\'t pay. I can owe you, and I always pay what I owe."'],
    waiting: '"I\'ll wait. I\'m good at waiting. It\'s the one thing they built me for."',
  },
};
const JOB_ORDER = ['ozzy', 'vey'];

const Jobs = {
  news: [],
  st(id) { return Game.s.jobs[id] || (Game.s.jobs[id] = { st: 'offer' }); },
  // ---- heat ----
  heat(n, why) {
    const s = Game.s, was = s.heat; s.heat = clamp(Math.round(s.heat + n), 0, 100);
    if (why && n > 0) Game.toast(`Heat +${s.heat - was}. ${why}`, 'warn');
    if (why && n < 0) Game.toast(`Heat ${s.heat - was}. ${why}`, 'good');
    Hud.refresh();
  },
  // ---- the people, in the bar and the back room ----
  // where each one stands today, if they're here at all
  where(id) {
    const J = JOBS[id], c = this.st(id);
    if (c.st === 'offer') return J.at;
    if (c.st === 'bench') return J.wait;
    return null;
  },
  spawn() {
    if (!World.L) return;
    const here = World.L.id === 'd_dragon', G = World.L.ground;
    Actors.npcs = Actors.npcs.filter((n) => !n.def.job || (here && this.where(n.def.job) === n.x));
    if (here) for (const id of JOB_ORDER) {
      const x = this.where(id); if (x === null || Actors.npcs.some((n) => n.def.job === id)) continue;
      const J = JOBS[id], def = { name: J.name, look: J.look, x, y: G - 2, sched: [[0, 24, x, 'stand']], lines: J.lines, job: id };
      Actors.npcs.push({ def, i: 80 + JOB_ORDER.indexOf(id), x, y: G - 2, face: id === 'ozzy' ? 1 : -1, hidden: false, tx: x, wt: 0, bubble: null, line: 0, art: new Map() });
    }
    // a drone on the street when the heat's up
    const want = here && Game.s.heat >= 40;
    if (want && !Actors.enemies.some((e) => e.heatDrone)) { const e = Actors.spawn('drone', 200, G - 70, { range: [40, 320] }); e.heatDrone = true; }
    if (!want) Actors.enemies = Actors.enemies.filter((e) => !e.heatDrone);
  },
  // what someone at the counter has for you: an offer, a wait, a hand-back
  actionsFor(name) {
    const id = JOB_ORDER.find((k) => JOBS[k].name === name); if (!id) return [];
    const c = this.st(id), b = Game.s.bench;
    if (c.st === 'offer') return [{ kind: 'job', id }];
    if (c.st === 'bench') return [{ kind: b && b.job === id && b.tested && (b.tested.res === 'works' || b.tested.res === 'half') ? 'handback' : 'jobwait', id }];
    return [];
  },
  html(a) {
    const J = JOBS[a.id], b = Game.s.bench;
    if (a.kind === 'job') {
      const busy = b && b.job !== a.id;
      return `<div class="ask"><h3>${J.title}</h3>${J.offer.map((l) => `<p class="sub">${l}</p>`).join('')}${J.illegal ? '<p class="dim">Illegal work: while it\'s on your bench, it\'s heat.</p>' : ''}<div class="buttons">${busy ? '<span class="dim">Your bench is taken. Finish what\'s on it first.</span>' : `<button data-job="take:${a.id}" class="go">Take it to the bench</button>`}</div></div>`;
    }
    if (a.kind === 'jobwait') {
      const notes = Game.s.notes.log.filter((e) => e.key.startsWith(a.id + ':')).map((e) => e.text.replace(/^[^:]*: /, ''));
      return `<div class="ask"><h3>${J.title}</h3><p class="sub">${J.waiting}</p><p class="dim">${notes.length ? 'Your notebook: ' + notes.join(' ') : 'It\'s on your bench in the back.'}</p></div>`;
    }
    if (a.kind === 'handback') {
      const t = b.tested, trace = this.traced(b);
      return `<div class="ask"><h3>${J.title}</h3><p class="dim">${t.res === 'works' ? 'It works' : 'It half works'}${t.loose ? `, and ${t.loose} screw${t.loose > 1 ? 's' : ''} won't hold` : ''}.${trace ? ' There\'s a Meridian serial in it that isn\'t theirs.' : ''}${J.pay ? ` ${t.res === 'works' ? J.pay : J.pay / 2} cr.` : ''}</p><div class="buttons"><button data-job="back:${a.id}" class="go">Hand it back</button></div></div>`;
    }
    return '';
  },
  act(cmd) {
    const [what, id] = cmd.split(':');
    if (what === 'take') this.take(id);
    if (what === 'back') this.handBack(id);
  },
  take(id) {
    const J = JOBS[id], c = this.st(id); if (Game.s.bench) return;
    Bench.put(J.dev, { job: id, name: J.title, parts: J.parts, rusty: J.rusty });
    c.st = 'bench'; c.since = Game.s.day;
    Game.toast(`${J.title} is on your bench.`, 'good');
    if (J.illegal) this.heat(5, 'Illegal chrome in the back room.');
    this.spawn(); Save.write();
  },
  // a Meridian part that came from somewhere it shouldn't: a serial someone can trace
  traced(b) { return Object.values(b.slots).some((s) => s.p && s.p.g === 'military' && (s.p.how === 'take' || s.p.how === 'trade')); },
  handBack(id) {
    const J = JOBS[id], c = this.st(id), b = Game.s.bench; if (!b || b.job !== id || !b.tested) return;
    const t = b.tested, pay = J.pay ? (t.res === 'works' ? J.pay : J.pay / 2) : 0;
    Object.assign(c, { st: 'back', day: Game.s.day, res: t.res, loose: t.loose, scorch: b.scorch.length, traced: this.traced(b), parts: Object.fromEntries(Object.entries(b.slots).map(([k, s]) => [k, s.p && { g: s.p.g, how: s.p.how, st: s.p.st, gauge: s.p.gauge }])) });
    if (pay) { Game.s.cr += pay; Game.toast(`${J.name} pays you ${pay} cr.`, 'good'); }
    else Game.toast(`${J.name} flexes the hand, slowly. "I owe you."`, 'good');
    if (J.honest) this.heat(-10, 'An honest repair, seen to be done.');
    Bench.clear(); Hud.toggle(null); this.spawn(); Hud.refresh(); Save.write();
  },
  // ---- the morning after: what your fixes did, and who came knocking ----
  morning() {
    const s = Game.s, news = [];
    for (const id of JOB_ORDER) {
      const J = JOBS[id], c = this.st(id); if (c.st !== 'back' || c.day >= s.day) continue;
      c.st = 'done';
      const clean = c.res === 'works' && !c.loose && !c.scorch;
      if (id === 'ozzy') {
        if (c.res === 'works' && !c.loose) { s.flags['ozzy:rides'] = true; news.push('Ozzy\'s cab is back on the roofs. He left a note with Auntie Lin: your cab rides are on him, any time.'); }
        else if (c.res === 'works') news.push('Ozzy\'s nav works, but the casing rattles at speed and he\'s had to tape it. He paid. He\'ll tell people you\'re good, not careful.');
        else news.push('Ozzy\'s nav cut out twice on the night run. He\'s back on paper maps, and he\'s telling the rank at the Overpass about it.');
      }
      if (id === 'vey') {
        const servo = c.parts.servo || {};
        if (c.traced) { news.push('A Meridian serial lit up a checkpoint on the Overpass at dawn: a runaway synth with a stolen servo in her arm. Vey\'s in a precinct van, and they\'ll want to know who fitted it.'); this.heat(25); }
        else if (servo.g === 'scrap' && clean) { s.flags['vey:schematic'] = true; Parts.jot('vey:schematic', 'Vey left a folded schematic under the door: the controller for a Spires service lift. It needs a relay and a control board to fool.'); news.push('Vey came by before the bar opened. The arm holds. She left a folded schematic under your door, a Spires service lift, and no note.'); }
        else news.push(`The ${servo.g === 'scrap' ? 'scrap' : 'light'} servo gave out on Vey at a bad moment. She got away, just. She'll be back, and she'll remember.`);
      }
    }
    // what's on the bench overnight, and who noticed
    const b = s.bench;
    if (b && b.job && JOBS[b.job].illegal) { this.heat(10); news.push('Word gets around about what\'s on your bench. Heat +10.'); }
    if (s.heat >= 70) {
      news.push('A knock before dawn: a precinct detective, polite, wet coat. He looks over the back room for a long time.');
      if (b && b.job && JOBS[b.job].illegal) { const J = JOBS[b.job]; news.push(`He takes ${J.title} off your bench as evidence. ${J.name} won't be coming back for it.`); this.st(b.job).st = 'seized'; Bench.clear(); }
      else news.push('He finds a cold iron and nothing he can use, and leaves. For now.');
      this.heat(-30);
    } else this.heat(-5);
    this.news = news; return news;
  },
};
