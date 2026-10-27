'use strict';
// ---------------------------------------------------------------------------
// The jobs that come to the White Dragon, the heat, and the morning after.
// A job is a person, a broken thing and a choice: they turn up at the White
// Dragon with it (Jobs.spawn puts them there), you take it to the bench,
// fix it, and hand it back at the counter. The next morning (after you've
// slept) you hear what your fix did. Their state is in Game.s.jobs; the thing
// itself is on your bench in the basement (Game.s.bench) while you work on it.
// Heat (Game.s.heat, 0 to 100) is how close the precinct is to your trapdoor:
// illegal work on the bench, parts taken from where you shouldn't be, a
// Meridian serial that gets traced. Honest repairs and time bring it down. At
// 40 a patrol drone works your street; at 70 there's a knock before dawn,
// and a search of the bar and the storeroom; at 90 they find the trapdoor.
// ---------------------------------------------------------------------------
const JOBS = {
  ozzy: {
    name: 'Ozzy', title: 'Ozzy\'s nav unit', dev: 'navunit', at: 500, wait: 520, pay: 80, honest: true,
    look: { skin: SKINS[1], hair: 'cap', capCol: '#ffd040', top: '#4a4430', coat: 'jacket', legs: '#2a2a34', wide: 1 },
    parts: { board: ['street', 'ok'], cell: ['street', 'dead'], aerial: ['street', 'burnt'] },
    lines: ['Rain\'s bad for business. Good for yours, I guess.'],
    offer: ['"You the one who fixes things? Auntie Lin said ask for the noodles with nothing in them."', '"My cab\'s nav went dark mid-run. Smelled like a fuse. No nav, no fares; no fares, no rent."', '"Eighty when it works. Honest money, for once in this room."'],
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
  // ---- the people, at the bar ----
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
    Game.toast(`You take ${J.title} down to your bench.`, 'good');
    if (J.illegal) this.heat(5, 'Illegal chrome under the bar.');
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
  // the jobs, for the Jobs tab: who, what, where it stands
  list() {
    const b = Game.s.bench, rows = JOB_ORDER.map((id) => {
      const J = JOBS[id], c = this.st(id);
      const st = { offer: 'Waiting at the bar upstairs.', bench: b && b.job === id ? (b.tested ? `On your bench: tested, ${{ works: 'it works', half: 'it half works', dead: 'nothing', smoke: 'it smoked' }[b.tested.res]}.` : 'On your bench.') : 'Waiting.', back: 'Handed back. You\'ll hear how it went in the morning.', done: 'Done.', seized: 'Seized by the precinct.' }[c.st];
      const notes = c.st === 'bench' ? Game.s.notes.log.filter((e) => e.key.startsWith(id + ':')).map((e) => e.text.replace(/^[^:]*: /, '')).join(' ') : '';
      return `<div class="row ${c.st === 'done' || c.st === 'seized' ? 'passed' : ''}"><div><b>${J.title}</b><small>${st}${notes ? ' ' + notes : ''}</small></div></div>`;
    }).join('');
    return `<p class="sub">Heat ${Game.s.heat} of 100.${Game.s.heat >= 70 ? ' Expect a knock.' : Game.s.heat >= 40 ? ' A drone is working your street.' : ''}</p><div class="rows">${rows}</div>`;
  },
  // the line at the top of the screen: what the job on the bench needs next
  objective() {
    const b = Game.s.bench;
    if (!b) { const id = JOB_ORDER.find((k) => this.st(k).st === 'offer'); return id ? `▸ ${JOBS[id].name} is waiting at the bar upstairs` : ''; }
    if (b.tested && (b.tested.res === 'works' || b.tested.res === 'half')) return `▸ Hand ${b.name.toLowerCase().replace(/^\w+'s /, 'back the ')} to ${JOBS[b.job] ? JOBS[b.job].name : 'them'}`;
    const need = Object.keys(DEVICE[b.dev].slots).filter((k) => b.probed[k] && b.slots[k].p && (b.slots[k].p.st !== 'ok' || (DEVICE[b.dev].slots[k].gauge && b.slots[k].p.gauge !== DEVICE[b.dev].slots[k].gauge))).map((k) => PART[DEVICE[b.dev].slots[k].kind].took);
    return need.length ? `▸ ${b.name} needs ${need.join(' and ')}` : `▸ ${b.name} is on your bench`;
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
      const found = s.heat >= 90;
      news.push('A knock before dawn: a precinct detective, polite, wet coat. He goes through the bar and the storeroom for a long time, and Auntie Lin watches him do it.');
      if (found && b && b.job && JOBS[b.job].illegal) { const J = JOBS[b.job]; news.push(`He moves the rug. He finds the trapdoor, and ${J.title} on your bench, and takes it as evidence. ${J.name} won't be coming back for it.`); this.st(b.job).st = 'seized'; Bench.clear(); }
      else if (found) news.push('He moves the rug and finds the trapdoor. Down there he finds a cold iron and nothing he can use, and leaves. He knows where you work now.');
      else news.push('He stands on the rug for a while, talking to Lin about the weather. Then he leaves.');
      this.heat(-30);
    } else this.heat(-5);
    this.news = news; return news;
  },
};
