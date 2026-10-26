'use strict';
// ---------------------------------------------------------------------------
// The HUD (DOM over the canvas): health, RAM, money, the time and place, the
// prompt for Use, toasts, a boss's bar, what people say over their heads;
// and the panels: your inventory (gear, items, ware, jobs), your bed, the
// elevator, a vendor, the fixer's jobs, the ripperdoc, the pause menu.
// ---------------------------------------------------------------------------
const Hud = {
  open: null, who: null, last: {}, tab: 'gear', slot: 'outer', pick: null,
  init() {
    $('bPack').onclick = () => this.toggle('pack');
    $('bMenu').onclick = () => this.toggle('pause');
    $('panelClose').onclick = () => this.toggle(null);
    this.refresh();
  },
  set(id, v, prop = 'textContent') { if (this.last[id] !== v) { this.last[id] = v; $(id)[prop] = v; } },
  // every frame: cheap, only touches the DOM on change
  tick() {
    const s = Game.s;
    this.set('clock', Game.clock() + ' · day ' + s.day);
    this.set('place', World.L.name);
    const tg = Player.target;
    this.set('prompt', tg && !Game.paused ? (Player.hold ? tg.pr.text + '…' : tg.pr.text) : '');
    // the Use button says what it would do, in a word
    const verb = tg && !Game.paused ? tg.pr.verb || 'Use' : 'Use';
    this.set('bUse', verb);
    if (this.last.useState !== (tg ? (tg.pr.no ? 'no' : 'on') : 'off')) { this.last.useState = tg ? (tg.pr.no ? 'no' : 'on') : 'off'; $('bUse').classList.toggle('idle', !tg); $('bUse').classList.toggle('no', !!(tg && tg.pr.no)); }
    $('prompt').classList.toggle('no', !!(tg && tg.pr.no));
    $('holdbar').style.width = Player.hold ? Math.min(100, (Player.hold.t / Player.hold.need) * 100) + '%' : '0';
    const b = Actors.boss; if (b && b.state !== 'idle') { $('boss').hidden = false; $('bossfill').style.width = Math.max(0, (b.hp / b.max) * 100) + '%'; } else $('boss').hidden = true;
    const el = $('toasts'); for (const n of el.children) n.style.opacity = Game.t - +n.dataset.t > 3.6 ? 0 : 1;
    if (Game.toasts.length && Game.t - Game.toasts[0].t > 4.2) { Game.toasts.shift(); this.toasts(); }
    // speech over heads
    let h = ''; const V = View, sc = V.scale / (window.devicePixelRatio || 1);
    for (const n of Actors.npcs) if (n.bubble && !n.hidden) { const x = (n.x - V.cx) * sc, y = (n.y - 44 - V.cy) * sc; h += `<div class="bubble" style="left:${x}px;top:${y}px"><b>${n.def.name}</b> ${n.bubble.text}</div>`; }
    this.set('bubbles', h, 'innerHTML');
  },
  toasts() { $('toasts').innerHTML = Game.toasts.map((t) => `<div class="toast ${t.kind}" data-t="${t.t}">${t.text}</div>`).join(''); },
  refresh() {
    const s = Game.s; if (!s) return;
    $('hpfill').style.width = Math.max(0, (s.hp / T.player.hp) * 100) + '%';
    $('ram').innerHTML = '<i class="on"></i>'.repeat(s.ram) + '<i></i>'.repeat(T.ram.max - s.ram);
    $('charge').innerHTML = '<i class="on"></i>'.repeat(Player.charge) + '<i></i>'.repeat(Math.max(0, Game.weapon().shots - Player.charge));
    $('cr').textContent = s.cr + ' cr';
    $('bProg').textContent = s.prog ? PROGRAMS[s.prog].name : 'No program';
    $('bProg').classList.toggle('none', !s.prog);
    if (this.open) this.panel(this.open);
  },
  nextProgram() { const have = PROGRAM_ORDER.filter((p) => Game.s.programs[p]); if (!have.length) return; const i = have.indexOf(Game.s.prog); Game.s.prog = have[(i + 1) % have.length]; Game.toast('Program: ' + PROGRAMS[Game.s.prog].name); this.refresh(); },
  toggle(which, who) {
    if (!which || (this.open === which && !who)) { this.open = null; this.who = null; $('panel').hidden = true; Game.paused = false; return; }
    this.open = which; this.who = who || this.who; Game.paused = true; $('panel').hidden = false; $('panel').classList.toggle('full', which === 'pack' || which === 'fab'); this.panel(which);
  },
  items(o, cls = '') { return SALVAGE_ORDER.filter((k) => o[k]).map((k) => `<span class="item ${cls}"><i style="background:${SALVAGE[k].col[1]}"></i>${SALVAGE[k].name} <b>${o[k]}</b></span>`).join('') || '<span class="dim">Nothing.</span>'; },
  cost(c) { return Object.keys(c).map((k) => { const ok = k === 'cr' ? Game.s.cr >= c.cr : (Game.s.pack[k] || 0) >= c[k]; return `<span class="need ${ok ? 'ok' : ''}">${k === 'cr' ? c.cr + ' cr' : `<img class="ico" src="${this.icon(k)}" alt="">${c[k]} ${SALVAGE[k].name.toLowerCase()}`}${k !== 'cr' && !ok ? ` <i class="have">(${Game.s.pack[k] || 0})</i>` : ''}</span>`; }).join(' '); },
  // salvage icons, as images (made once)
  icons: {},
  icon(k) { if (this.icons[k]) return this.icons[k]; const sp = salvageIcon(k), [c, g] = canvasOf(48, 48); g.drawImage(sp.c, 0, 0, 48, 48); return (this.icons[k] = c.toDataURL()); },
  // a grid of salvage tiles; `btn(k)` adds a button under each
  tiles(o, btn) { const ks = SALVAGE_ORDER.filter((k) => o === null || o[k]); return ks.length ? '<div class="tiles">' + ks.map((k) => `<div class="tile" style="--r:${SALVAGE[k].col[1]}"><img src="${this.icon(k)}" alt=""><b>${SALVAGE[k].name}</b>${o ? `<span class="n">× ${o[k]}</span>` : ''}${btn ? btn(k) : ''}</div>`).join('') + '</div>' : '<p class="dim">No salvage. Hold Use on a machine to strip it.</p>'; },
  gearCard(id, btn) {
    const G = GEAR[id], R = RARITY[G.rarity], st = [];
    if (G.armor) st.push('Armour ' + Game.stat(id, 'armor')); if (G.dmg) st.push(Game.stat(id, 'dmg') + ' damage × ' + G.shots + ' shots'); if (G.strike) st.push('Blows ' + Game.stat(id, 'strike'));
    if (G.perk) for (const p in G.perk) st.push(PERKS[p](G.perk[p]));
    return `<div class="card" style="--r:${R.col}"><img src="${this.thumb(id)}" alt=""><div class="cardtext"><b>${Game.gearName(id)}</b><small class="rar">${R.name} · ${SLOTS[G.slot]}</small><small>${st.join(' · ')}</small><small class="dim">${G.note}</small></div>${btn}</div>`;
  },
  // a thumbnail of a piece of gear: the detective wearing or holding just
  // that, cropped to where it is, as an image (made once)
  thumbs: {},
  thumb(id) {
    if (this.thumbs[id]) return this.thumbs[id];
    const G = GEAR[id], crop = { head: [11, 11, 20, 18], face: [15, 14, 14, 12], outer: [8, 21, 26, 28], inner: [10, 21, 22, 20], legs: [10, 33, 22, 19], feet: [12, 43, 18, 9], ranged: [25, 23, 20, 11], melee: [27, 17, 18, 18] }[G.slot];
    const o = Object.assign({}, RUNNER, { pose: 'stand', seed: 5, holding: true, blaster: false });
    if (G.slot === 'inner' || G.slot === 'outer') o.shirt = '#8a8a84';
    Object.assign(o, G.look || {});
    if (G.slot === 'inner') o.top = o.shirt;
    if (G.slot === 'feet') Object.assign(o, { pose: 'walk1', fixedHands: true });
    if (G.slot === 'ranged') Object.assign(o, { pose: 'aim', blaster: true, hands: POSE_HANDS.aim });
    if (G.slot === 'melee') Object.assign(o, { pose: 'strike', blade: G.look.bladeCol, sheath: null, hands: POSE_HANDS.strike });
    const sp = person(o), [sx, sy, sw, sh] = crop, N = 48, k = N / Math.max(sw, sh), c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const dx = (N - sw * k) / 2, dy = (N - sh * k) / 2;
    g.drawImage(sp.c, sx, sy, sw, sh, dx, dy, sw * k, sh * k);
    return (this.thumbs[id] = c.toDataURL());
  },
  gearDetail(id) {
    const G = GEAR[id], R = RARITY[G.rarity], wid = Game.s.gear.on[G.slot], on = wid === id;
    const row = (name, key, unit = '') => { const v = Game.stat(id, key), w = wid && !on ? Game.stat(wid, key) : undefined, d = w !== undefined ? v - w : 0; return `<div class="stat"><span>${name}</span><b>${v}${unit}</b>${d ? `<i class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</i>` : ''}</div>`; };
    let st = '';
    if (G.armor !== undefined) st += row('Armour', 'armor');
    if (G.dmg) st += row('Damage', 'dmg') + row('Shots', 'shots') + row('Cycle', 'cd', ' s');
    if (G.strike) st += row('Blow', 'strike');
    if (G.perk) for (const p in G.perk) st += `<div class="stat perk"><span>${PERKS[p](G.perk[p])}</span></div>`;
    const lv = Game.lvl(id); if (Game.s.gear.owned[id]) st += `<div class="stat"><span>Level</span><b class="pips">${'◆'.repeat(lv)}${'◇'.repeat(FAB.maxLevel - lv)}</b></div>`;
    const btn = on ? (G.slot === 'ranged' ? '<span class="tag">wearing</span>' : `<button data-unequip="${G.slot}">Take off</button>`) : `<button data-equip="${id}" class="go">Wear</button>`;
    return `<div class="big" style="--r:${R.col}"><img class="bigimg" src="${this.thumb(id)}" alt=""><small class="rar">${R.name} · ${SLOTS[G.slot]}</small><h4>${Game.gearName(id)}</h4><p class="dim">${G.note}</p><div class="stats2">${st}</div><div class="buttons">${btn}</div></div>`;
  },
  // the fabricator's panel: make, upgrade, break down, parts
  fab() {
    const s = Game.s, tab = this.fabTab || 'make';
    let h = `<p class="sub">"Bring me parts and money and I'll make you something. Short a part? I'll sell you one, at my price." · you have <b class="cr">${s.cr} cr</b></p>`;
    h += '<nav class="tabs">' + [['make', 'Make'], ['upgrade', 'Upgrade'], ['salvage', 'Break down'], ['parts', 'Parts']].map(([k, n]) => `<button data-fab="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('') + '</nav>';
    // a button that pays for parts you lack as it goes
    const payBtn = (act, id, cost, label) => { const f = Game.shortfall(cost), ok = s.cr >= f.total; return `<div class="pay">${this.cost(cost)}${f.extra ? `<small class="buy">+ ${f.extra} cr to buy what you're missing</small>` : ''}<button data-${act}="${id}" class="go" ${ok ? '' : 'disabled'}>${label} · ${f.total} cr</button></div>`; };
    if (tab === 'make') {
      const ids = Object.keys(FAB.make).filter((id) => !s.gear.owned[id]);
      h += '<div class="cards">' + (ids.map((id) => this.gearCard(id, payBtn('make', id, FAB.make[id], 'Make'))).join('') || '<p class="dim">You own everything she knows how to make.</p>') + '</div>';
    } else if (tab === 'upgrade') {
      const ids = Object.keys(s.gear.owned);
      h += '<div class="cards">' + ids.map((id) => { const l = Game.lvl(id); return this.gearCard(id, l >= FAB.maxLevel ? '<span class="tag">as good as it gets</span>' : payBtn('upgrade', id, FAB.upgrade(id, l), 'To +' + (l + 1))); }).join('') + '</div><p class="dim">Each level adds a quarter of the piece\'s base armour or damage.</p>';
    } else if (tab === 'salvage') {
      const ids = Object.keys(s.gear.owned).filter((id) => s.gear.on[GEAR[id].slot] !== id);
      h += '<div class="cards">' + (ids.map((id) => { const got = FAB.salvage(id, Game.lvl(id)); return this.gearCard(id, `<div class="pay"><span class="need ok">${Object.keys(got).map((k) => `<img class="ico" src="${this.icon(k)}" alt="">${got[k]}`).join(' ')}</span><button data-break="${id}">Break down</button></div>`); }).join('') || '<p class="dim">Nothing to break down. What you\'re wearing has to come off first.</p>') + '</div>';
    } else {
      h += this.tiles(null, (k) => { const c = Math.round(SALVAGE[k].price * FAB.markup); return `<span class="n">you have ${s.pack[k] || 0}</span><div class="tbtns"><button data-part="${k}:1" ${s.cr >= c ? '' : 'disabled'}>1 · ${c} cr</button><button data-part="${k}:5" ${s.cr >= c * 5 ? '' : 'disabled'}>5 · ${c * 5}</button></div>`; });
    }
    return h;
  },
  panel(which) {
    const s = Game.s, body = $('panelBody'), title = $('panelTitle'); let h = '';
    if (which === 'pack') {
      // what you carry, in four tabs: gear on a figure of you, items, ware and programs, jobs
      title.textContent = 'Inventory';
      const tab = this.tab || 'gear';
      h += '<nav class="tabs">' + [['gear', 'Gear'], ['items', 'Items'], ['ware', 'Ware'], ['jobs', 'Jobs']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('') + '</nav>';
      if (tab === 'gear') {
        const slot = (k) => { const g = Game.worn(k), spare = Object.keys(s.gear.owned).some((id) => GEAR[id].slot === k && s.gear.on[k] !== id); return `<button class="slot ${g ? 'r-' + g.rarity : 'empty'} ${this.slot === k ? 'sel' : ''}" data-slot="${k}">${g ? `<img src="${this.thumb(s.gear.on[k])}" alt="">` : '<span class="noimg"></span>'}<span><small>${SLOTS[k]}${spare ? ' <i class="new">+</i>' : ''}</small><b>${g ? Game.gearName(s.gear.on[k]) : 'Empty'}</b></span></button>`; };
        const W = Game.weapon();
        // the loadout on the left: you, between your slots; on the right, the
        // piece picked (what's worn in the slot unless you pick another) and
        // everything else you own for that slot
        const k = this.slot || 'outer', mine = Object.keys(s.gear.owned).filter((id) => GEAR[id].slot === k);
        const pick = mine.includes(this.pick) ? this.pick : s.gear.on[k] || mine[0];
        h += `<div class="loadout"><div class="doll"><div class="slots">${['head', 'face', 'outer', 'inner'].map(slot).join('')}</div>
          <div class="fig"><canvas id="dollcv" width="132" height="150"></canvas><div class="stats"><span>Armour <b>${Game.armor()}</b></span><span>Blaster <b>${W.dmg}×${W.shots}</b></span><span>Blow <b>${Game.strikeDmg()}</b></span></div></div>
          <div class="slots">${['legs', 'feet', 'ranged', 'melee'].map(slot).join('')}</div></div>
          <div class="detail">${pick ? this.gearDetail(pick) : `<h3>${SLOTS[k]}</h3><p class="dim">Nothing for this slot yet. Vendors sell gear, and it turns up in stashes and on the people you take down.</p>`}
          ${mine.length > 1 ? `<h3>Your ${SLOTS[k].toLowerCase()} gear</h3><div class="picks">` + mine.map((id) => { const G = GEAR[id]; return `<button class="slot r-${G.rarity} ${id === pick ? 'sel' : ''}" data-pick="${id}"><img src="${this.thumb(id)}" alt=""><span><small>${RARITY[G.rarity].name}${s.gear.on[k] === id ? ' · worn' : ''}</small><b>${Game.gearName(id)}</b></span></button>`; }).join('') + '</div>' : ''}</div></div>`;
      } else if (tab === 'items') {
        const worth = SALVAGE_ORDER.reduce((a, k) => a + (s.pack[k] || 0) * SALVAGE[k].price, 0);
        h += `<p class="sub">${s.cr} cr · ${Game.packCount()} pieces of salvage, worth about ${worth} cr to Kit. Whatever you pick up is yours to keep.</p>` + this.tiles(s.pack, (k) => `<small>${SALVAGE[k].price} cr each at Kit's</small>`);
      } else if (tab === 'ware') {
        h += `<h3>Cyberware · neural load ${Game.neuralLoad()} of ${Game.neuralCap()}</h3><div class="rows">` + ['Optics', 'Legs', 'Arms'].map((sl) => { const m = MOD_ORDER.find((q) => MODS[q].slot === sl && s.mods.on[q]); return `<div class="row"><div><b>${sl}: ${m ? MODS[m].name : '<span class="dim">empty</span>'}</b><small>${m ? MODS[m].note : 'Doc Vasquez on the Stack fits ware.'}</small></div>${m ? '<span class="tag">load ' + MODS[m].load + '</span>' : ''}</div>`; }).join('') + '</div>';
        h += `<h3>Programs · RAM ${s.ram} of ${T.ram.max}</h3><div class="rows">` + (PROGRAM_ORDER.filter((p) => s.programs[p]).map((p) => `<div class="row"><div><b>${PROGRAMS[p].name}</b><small>${PROGRAMS[p].ram} RAM · ${PROGRAMS[p].note}</small></div><button data-prog="${p}" ${s.prog === p ? 'disabled' : ''}>${s.prog === p ? 'Selected' : 'Select'}</button></div>`).join('') || '<p class="dim">No programs yet. Jack into data nodes to find them.</p>') + '</div>';
      } else {
        h += `<div class="rows">` + (JOBS.filter((j) => s.jobs.taken[j.id] && !s.jobs.done[j.id]).map((j) => `<div class="row"><div><b>${j.title}</b><small>${j.text}</small></div><span class="tag">${Game.jobReady(j) ? 'ready' : ''}</span></div>`).join('') || '<p class="dim">No work on. Juno at the bar on the Stack has some.</p>') + '</div>';
        const story = JOBS.filter((j) => s.jobs.done[j.id] && j.story);
        if (story.length) h += '<h3>Case notes</h3>' + story.map((j) => `<p class="sub">${j.story}</p>`).join('');
      }
    } else if (which === 'bed') {
      title.textContent = 'Home';
      h += `<p class="sub">Your bed, your window, your city. It's ${Game.clock()}, day ${s.day}.</p><div class="buttons"><button data-act="sleep">Sleep till morning</button></div><p class="dim">Sleeping heals you and fills your RAM.</p>`;
    } else if (which === 'elevator') {
      title.textContent = 'Elevator';
      h += `<p class="sub">A lift cage that groans. Buttons for the floors you know.</p><div class="rows">` + ELEVATOR.map((f) => { const here = World.L.id === f.level, known = !f.needs || Game.flag(f.needs); return `<div class="row ${known ? '' : 'passed'}"><div><b>${f.name}</b><small>${known ? f.note : 'The button is dead. You haven\'t found a way there yet.'}</small></div>${here ? '<span class="tag">you\'re here</span>' : `<button data-floor="${f.level}" ${known ? '' : 'disabled'}>Go</button>`}</div>`; }).join('') + '</div>';
    } else if (which === 'fab') {
      title.textContent = 'Mags · fabricator';
      h += this.fab();
    } else if (which === 'vendor') {
      const n = this.who, rate = (n && n.def.rate) || 1, worth = SALVAGE_ORDER.reduce((a, k) => a + Math.round((s.pack[k] || 0) * SALVAGE[k].price * rate), 0);
      title.textContent = n ? n.def.name : 'Vendor';
      h += `<p class="sub">${n ? n.def.lines[0] : ''}</p><div class="rows">` + SALVAGE_ORDER.map((k) => `<div class="row"><img class="rowico" src="${this.icon(k)}" alt=""><div class="grow"><b>${SALVAGE[k].name}</b><small>${Math.round(SALVAGE[k].price * rate)} cr each · you carry ${s.pack[k] || 0}</small></div><button data-sell="${k}" ${s.pack[k] ? '' : 'disabled'}>Sell</button></div>`).join('') + '</div>';
      h += `<div class="buttons"><button data-act="sellAll" ${worth ? '' : 'disabled'}>Sell everything for ${worth} cr</button></div><p class="dim">Keep what the ripperdoc wants: wire, alloy, glass, coolant and chips all go into ware.</p>`;
      const shop = n && SHOP[n.def.name];
      if (shop) h += `<h3>Gear for sale · you have ${s.cr} cr</h3><div class="cards">` + Object.keys(shop).map((id) => this.gearCard(id, s.gear.owned[id] ? '<span class="tag">yours</span>' : `<button data-buygear="${id}" ${s.cr >= shop[id] ? '' : 'disabled'}>${shop[id]} cr</button>`)).join('') + '</div>';
    } else if (which === 'fixer') {
      title.textContent = 'Juno';
      h += `<p class="sub">"${Actors.npcs.find((q) => q.def.role === 'fixer')?.def.lines[s.jobs.done.coolant ? 1 : 0] || ''}"</p><div class="rows">`;
      for (const j of JOBS) {
        const st = Game.jobState(j); if (st === 'locked') continue;
        const btn = st === 'open' ? `<button data-take="${j.id}">Take it</button>` : st === 'ready' ? `<button data-finish="${j.id}">Hand it over</button>` : st === 'done' ? '<span class="tag">done</span>' : `<span class="tag">${j.kills ? (s.jobs.kills[j.id + ':' + Object.keys(j.kills)[0]] || 0) + ' of ' + Object.values(j.kills)[0] : 'on it'}</span>`;
        const rw = [j.reward.cr ? j.reward.cr + ' cr' : '', j.reward.chips ? j.reward.chips + ' chips' : '', j.reward.booster ? 'a neural booster' : ''].filter(Boolean).join(', ');
        h += `<div class="row ${st === 'done' ? 'passed' : ''}"><div><b>${j.title}</b><small>${j.text}</small><small class="gold">Pays ${rw}</small></div>${btn}</div>`;
      }
      h += '</div>';
      if (JOBS.every((j) => s.jobs.done[j.id])) h += '<p class="sub">"Your woman went down the old subway, and she wasn\'t alone. People down there say the synths are looking for whoever made them. Nobody up here made them, detective. When the subway opens, I\'ll have more."</p>';
    } else if (which === 'doc') {
      title.textContent = 'Doc Vasquez';
      h += `<p class="sub">Neural load ${Game.neuralLoad()} of ${Game.neuralCap()}. Ware costs parts and money to build; fitting and removing is free.</p><div class="rows">`;
      for (const m of MOD_ORDER) {
        const M = MODS[m], owned = s.mods.owned[m], on = s.mods.on[m];
        const btn = !owned ? `<button data-buy="${m}" ${Game.canPay(M.cost) ? '' : 'disabled'}>Build and fit</button>` : on ? `<button data-off="${m}">Remove</button>` : `<button data-on="${m}" ${Game.neuralLoad() + M.load <= Game.neuralCap() ? '' : 'disabled'}>Fit</button>`;
        h += `<div class="row"><div><b>${M.name}</b><small>${M.slot} · load ${M.load} · ${M.note}</small>${owned ? '' : `<small>${this.cost(M.cost)}</small>`}</div>${btn}</div>`;
      }
      h += '</div>';
    } else if (which === 'pause') {
      title.textContent = 'Downlevel';
      h += `<p class="sub">${World.L.name} · ${Game.clock()} · day ${s.day}. Saved as you go.</p>
        <div class="help"><p><b>Move</b> arrows or WASD, or the left side of the screen. <b>Ladders</b> up and down. <b>Drop</b> through a walkway: down and jump.<br><b>Jump</b> Space or K. <b>Fire</b> J (up close, a blow instead). <b>Use</b> E (hold it to strip machines and cut). <b>Program</b> Q to run, R to pick. <b>Pack</b> I.</p>
        <p>You\'re a detective with the Stack precinct, tracing four synths who ran from the Spires and went down. Juno at the bar sells leads for favours. Strip machines for parts, sell them, or take them to the ripperdoc for ware. Jack into data nodes for programs. The way down is in the service yard at the east end of the Stack, past the Warden.</p></div>
        <div class="buttons"><button data-act="resume">Resume</button><button data-act="newgame" class="quiet">New game…</button></div>` + Pwa.html();
    }
    const keep = this.lastPanel === which + (this.tab || '') + (this.fabTab || '') ? body.scrollTop : 0; this.lastPanel = which + (this.tab || '') + (this.fabTab || '');
    body.innerHTML = h; body.scrollTop = keep;
    // the buttons
    const act = { resume: () => this.toggle(null), sleep: () => { Game.s.hp = T.player.hp; Game.s.ram = T.ram.max; const h0 = Game.hour(); Game.pass(((8 - h0) + 24) % 24 || 24); Actors.load(); Game.toast('You sleep. Morning, or what passes for it. You wake healed, your RAM full.', 'good'); this.toggle(null); this.refresh(); Save.write(); },
      sellAll: () => { const rate = (this.who && this.who.def.rate) || 1; let cr = 0; for (const k of SALVAGE_ORDER) { cr += Math.round((s.pack[k] || 0) * SALVAGE[k].price * rate); s.pack[k] = 0; } s.cr += cr; Game.toast('Sold for ' + cr + ' cr.'); this.refresh(); Save.write(); },
      install: () => Pwa.install(),
      newgame: (b) => { if (b.dataset.sure) { Save.wipe(); location.reload(); } else { b.dataset.sure = 1; b.textContent = 'Tap again: this wipes your save'; } } };
    body.querySelectorAll('button[data-act]').forEach((b) => (b.onclick = () => act[b.dataset.act](b)));
    body.querySelectorAll('button[data-tab]').forEach((b) => (b.onclick = () => { this.tab = b.dataset.tab; this.panel('pack'); }));
    body.querySelectorAll('button[data-slot]').forEach((b) => (b.onclick = () => { this.slot = b.dataset.slot; this.pick = null; this.panel('pack'); }));
    body.querySelectorAll('button[data-pick]').forEach((b) => (b.onclick = () => { this.pick = b.dataset.pick; this.panel('pack'); }));
    body.querySelectorAll('button[data-equip]').forEach((b) => (b.onclick = () => Game.equip(b.dataset.equip)));
    body.querySelectorAll('button[data-unequip]').forEach((b) => (b.onclick = () => Game.unequip(b.dataset.unequip)));
    body.querySelectorAll('button[data-buygear]').forEach((b) => (b.onclick = () => { const id = b.dataset.buygear, n = this.who && this.who.def.name, c = SHOP[n] && SHOP[n][id]; if (!c || s.cr < c || s.gear.owned[id]) return; s.cr -= c; Game.giveGear(id); this.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-fab]').forEach((b) => (b.onclick = () => { this.fabTab = b.dataset.fab; this.panel('fab'); }));
    body.querySelectorAll('button[data-make]').forEach((b) => (b.onclick = () => { Game.make(b.dataset.make); this.refresh(); }));
    body.querySelectorAll('button[data-upgrade]').forEach((b) => (b.onclick = () => { Game.upgrade(b.dataset.upgrade); this.refresh(); }));
    body.querySelectorAll('button[data-break]').forEach((b) => (b.onclick = () => { Game.breakDown(b.dataset.break); this.refresh(); }));
    body.querySelectorAll('button[data-part]').forEach((b) => (b.onclick = () => { const [k, n] = b.dataset.part.split(':'); Game.buyPart(k, +n); this.refresh(); }));
    body.querySelectorAll('button[data-floor]').forEach((b) => (b.onclick = () => { this.toggle(null); Game.go(b.dataset.floor, 'elevator'); }));
    const dc = $('dollcv'); if (dc) { const g = dc.getContext('2d'), sp = RunnerArt.get('stand', false); g.imageSmoothingEnabled = false; g.clearRect(0, 0, dc.width, dc.height); g.drawImage(sp.c, (dc.width - sp.w * 3) / 2, dc.height - sp.h * 3, sp.w * 3, sp.h * 3); if (sp.e) { g.globalCompositeOperation = 'lighter'; g.drawImage(sp.e, (dc.width - sp.w * 3) / 2, dc.height - sp.h * 3, sp.w * 3, sp.h * 3); g.globalCompositeOperation = 'source-over'; } }
    body.querySelectorAll('button[data-prog]').forEach((b) => (b.onclick = () => { s.prog = b.dataset.prog; this.refresh(); }));
    body.querySelectorAll('button[data-sell]').forEach((b) => (b.onclick = () => { const k = b.dataset.sell, rate = (this.who && this.who.def.rate) || 1, n = s.pack[k] || 0; s.cr += Math.round(n * SALVAGE[k].price * rate); s.pack[k] = 0; this.refresh(); }));
    body.querySelectorAll('button[data-take]').forEach((b) => (b.onclick = () => Game.takeJob(JOBS.find((j) => j.id === b.dataset.take))));
    body.querySelectorAll('button[data-finish]').forEach((b) => (b.onclick = () => Game.finishJob(JOBS.find((j) => j.id === b.dataset.finish))));
    body.querySelectorAll('button[data-buy]').forEach((b) => (b.onclick = () => { const m = b.dataset.buy; if (!Game.pay(MODS[m].cost)) return; s.mods.owned[m] = true; if (Game.neuralLoad() + MODS[m].load <= Game.neuralCap()) { s.mods.on[m] = true; Game.toast(MODS[m].name + ' fitted. ' + MODS[m].note, 'good'); } else Game.toast(MODS[m].name + ' built, but your nervous system is full. Remove something to fit it.', 'warn'); RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-on]').forEach((b) => (b.onclick = () => { s.mods.on[b.dataset.on] = true; RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-off]').forEach((b) => (b.onclick = () => { s.mods.on[b.dataset.off] = false; RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
  },
};
