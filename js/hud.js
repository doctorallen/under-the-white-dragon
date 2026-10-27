'use strict';
// ---------------------------------------------------------------------------
// The HUD (DOM over the canvas): health, RAM, money, the time and place, the
// prompt for Use, toasts, a boss's bar, what people say over their heads;
// and the panels: your inventory (gear, items, ware, jobs), your bed, the
// elevator, a vendor, the lieutenant's cases, the quartermaster, the
// fabricator, the spinner, the pause menu.
// ---------------------------------------------------------------------------
const Hud = {
  open: null, who: null, last: {}, tab: 'jobs', slot: 'outer', pick: null, mode: 'spinner',
  init() {
    $('bPack').onclick = () => this.toggle('pack');
    $('bMenu').onclick = () => this.toggle('pause');
    $('bCab').onclick = () => this.toggle('cab');
    // the tracked case's line opens its board (a job's opens the case file)
    $('obj').onclick = () => { const id = Game.s.track; if (LEGACY && id && Cases.st(id) && !Cases.closed(id)) Board.open(id); else { this.tab = 'jobs'; this.toggle('pack'); } };
    $('bItem').onclick = () => { Input.itemHit = true; };
    $('panelClose').onclick = () => this.toggle(null);
    this.refresh();
  },
  set(id, v, prop = 'textContent') { if (this.last[id] !== v) { this.last[id] = v; $(id)[prop] = v; } },
  // every frame: cheap, only touches the DOM on change
  tick() {
    const s = Game.s;
    this.set('clock', Game.clock() + ' · day ' + s.day + (Dev.s.fps ? ' · ' + Dev.fps + ' fps' : ''));
    this.set('place', World.L.name);
    this.set('obj', this.objective());
    const tg = Player.target;
    // behind someone who hasn't seen you: Fire takes them down quietly
    const tk = !Game.paused && Actors.enemies.some((e) => e.hp > 0 && Math.sign(e.x - Player.x) === Player.face && Foes.canTakedown(e));
    this.set('prompt', tk ? 'Take them down quietly' : tg && !Game.paused ? (Player.hold ? tg.pr.text + '…' : tg.pr.text) : '');
    $('bStrike').classList.toggle('gone', !tk);
    // the Use button says what it would do, in a word
    const verb = tg && !Game.paused ? tg.pr.verb || 'Use' : 'Use';
    this.set('bUse', verb);
    if (this.last.useState !== (tg ? (tg.pr.no ? 'no' : 'on') : 'off')) { this.last.useState = tg ? (tg.pr.no ? 'no' : 'on') : 'off'; $('bUse').classList.toggle('idle', !tg); $('bUse').classList.toggle('no', !!(tg && tg.pr.no)); }
    $('prompt').classList.toggle('no', !!(tg && tg.pr.no));
    $('holdbar').style.width = Player.hold ? Math.min(100, (Player.hold.t / Player.hold.need) * 100) + '%' : '0';
    const b = Actors.boss; if (b && b.state !== 'idle') { $('boss').hidden = false; this.set('bossname', ENEMY[b.type].name.toUpperCase()); $('bossfill').style.width = Math.max(0, (b.hp / b.max) * 100) + '%'; } else $('boss').hidden = true;
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
    $('cr').textContent = s.cr + ' cr';
    $('heatfill').style.width = s.heat + '%'; $('heat').classList.toggle('hot', s.heat >= 40); $('heat').classList.toggle('none', !s.heat);
    const q = Game.quickItem(); $('bItem').textContent = q ? ITEM[q].name.split(' ')[0] + ' ' + s.pack[q] : 'Item'; $('bItem').classList.toggle('none', !q);
    $('bProg').textContent = s.prog ? PROGRAMS[s.prog].name : 'No program';
    $('bProg').classList.toggle('none', !s.prog);
    if (this.open) this.panel(this.open);
  },
  // the tracked case or job: what next, and where
  objective() {
    const id = Game.s.track; if (!id) return Jobs.objective();
    if (Cases.st(id) && !Cases.closed(id)) { const w = Cases.where(id); return '▸ ' + Cases.objective(id) + (w && w.level !== World.L.id ? ' · ' + LEVELS[w.level].name : ''); }
    if (Quests.active(id)) { const w = Quests.where(id); return '▸ ' + Quests.objective(id) + (w && w.level !== World.L.id ? ' · ' + LEVELS[w.level].name : ''); }
    return '';
  },
  nextItem() { const have = Object.keys(ITEM).filter((k) => (ITEM[k].kind === 'consumable' || ITEM[k].kind === 'throwable') && Game.s.pack[k] > 0); if (!have.length) return; const i = have.indexOf(Game.s.quick); Game.s.quick = have[(i + 1) % have.length]; Game.toast('Quick item: ' + ITEM[Game.s.quick].name); this.refresh(); },
  nextProgram() { const have = PROGRAM_ORDER.filter((p) => Game.s.programs[p]); if (!have.length) return; const i = have.indexOf(Game.s.prog); Game.s.prog = have[(i + 1) % have.length]; Game.toast('Program: ' + PROGRAMS[Game.s.prog].name); this.refresh(); },
  toggle(which, who) {
    if (!which && this.open === 'net' && Hack.net) { Hack.close(); return; } // closing the network jacks you out properly
    if (!which || (this.open === which && !who)) { this.open = null; this.who = null; $('panel').hidden = true; Game.paused = false; return; }
    this.open = which; this.who = who || this.who; Game.paused = true; $('panel').hidden = false; this.panel(which);
  },
  items(o, cls = '') { return SALVAGE_ORDER.filter((k) => o[k]).map((k) => `<span class="item ${cls}"><i style="background:${SALVAGE[k].col[1]}"></i>${SALVAGE[k].name} <b>${o[k]}</b></span>`).join('') || '<span class="dim">Nothing.</span>'; },
  cost(c) { return Object.keys(c).map((k) => { const ok = k === 'cr' ? Game.s.cr >= c.cr : (Game.s.pack[k] || 0) >= c[k]; return `<span class="need ${ok ? 'ok' : ''}">${k === 'cr' ? c.cr + ' cr' : `<img class="ico" src="${this.icon(k)}" alt="">${c[k]} ${SALVAGE[k].name.toLowerCase()}`}${k !== 'cr' && !ok ? ` <i class="have">(${Game.s.pack[k] || 0})</i>` : ''}</span>`; }).join(' '); },
  // a gadget's picture: the detective using it, cropped
  gadgetIcon(g) {
    const key = 'g:' + g; if (this.thumbs[key]) return this.thumbs[key];
    const o = Object.assign({}, RUNNER, { seed: 5, pose: 'stand', blaster: false }), crop = { scanner: [13, 12, 16, 14], jets: [12, 40, 20, 12], cutter: [22, 22, 22, 16] }[g];
    if (g === 'scanner') o.goggles = '#3af0e0'; if (g === 'jets') Object.assign(o, { jets: true, pose: 'jump', hands: POSE_HANDS.jump }); if (g === 'cutter') Object.assign(o, { pose: 'cut', cutter: true, hands: POSE_HANDS.cut });
    const sp = person(o), [sx, sy, sw, sh] = crop, [c, gg] = canvasOf(48, 48), k = 48 / Math.max(sw, sh);
    gg.drawImage(sp.c, sx, sy, sw, sh, (48 - sw * k) / 2, (48 - sh * k) / 2, sw * k, sh * k); if (sp.e) { gg.globalAlpha = 0.6; gg.drawImage(sp.e, sx, sy, sw, sh, (48 - sw * k) / 2, (48 - sh * k) / 2, sw * k, sh * k); }
    return (this.thumbs[key] = c.toDataURL());
  },
  // salvage icons, as images (made once)
  icons: {},
  icon(k) { if (this.icons[k]) return this.icons[k]; const sp = itemIcon(k), [c, g] = canvasOf(48, 48); g.drawImage(sp.c, 0, 0, 48, 48); if (sp.e) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(sp.e, 0, 0, 48, 48); } return (this.icons[k] = c.toDataURL()); },
  // a grid of salvage tiles; `btn(k)` adds a button under each
  tiles(o, btn) { const ks = SALVAGE_ORDER.filter((k) => o === null || o[k]); return ks.length ? '<div class="tiles">' + ks.map((k) => `<div class="tile" style="--r:${SALVAGE[k].col[1]}"><img src="${this.icon(k)}" alt=""><b>${SALVAGE[k].name}</b>${o ? `<span class="n">× ${o[k]}</span>` : ''}${btn ? btn(k) : ''}</div>`).join('') + '</div>' : '<p class="dim">No salvage. Hold Use on a machine to strip it.</p>'; },
  // a shop's stock: things to carry, then gear
  shopHtml(shop) {
    const s = Game.s, ids = Object.keys(shop), items = ids.filter((id) => ITEM[id]), gear = ids.filter((id) => GEAR[id] && GEAR[id].slot !== 'ranged');
    let h = '';
    if (items.length) h += '<h3>For sale</h3><div class="tiles">' + items.map((k) => `<div class="tile" style="--r:${(ITEM[k].col || ['', '#888'])[1]}"><img src="${this.icon(k)}" alt=""><b>${ITEM[k].name}</b><small>${ITEM[k].note || ''}</small><span class="n">you have ${s.pack[k] || 0}</span><div class="tbtns"><button data-buyitem="${k}" ${s.cr >= shop[k] ? '' : 'disabled'}>${shop[k]} cr</button></div></div>`).join('') + '</div>';
    if (gear.length) h += '<h3>Gear for sale</h3><div class="cards">' + gear.map((id) => this.gearCard(id, s.gear.owned[id] ? '<span class="tag">yours</span>' : `<button data-buygear="${id}" ${s.cr >= shop[id] ? '' : 'disabled'}>${shop[id]} cr</button>`)).join('') + '</div>';
    return h;
  },
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
    let h = `<p class="sub">"Bring me parts and money and I'll make you something. Short a part? I'll sell you one, at my price."</p>`;
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
      title.textContent = 'Pockets';
      const tab = this.tab === 'items' ? 'items' : 'jobs';
      h += '<nav class="tabs">' + [['jobs', 'Jobs'], ['items', 'Items']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('') + '</nav>';
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
        h += itemsTab(s);
      } else if (tab === 'ware') {
        h += `<h3>Gadgets</h3><div class="tiles">` + GADGET_ORDER.map((g) => `<div class="tile ${s.gadgets[g] ? '' : 'off'}" style="--r:#3af0e0"><img src="${this.gadgetIcon(g)}" alt=""><b>${GADGETS[g].name}</b><small>${s.gadgets[g] ? GADGETS[g].note : 'Quartermaster Ito at the precinct builds these.'}</small></div>`).join('') + '</div>';
        h += `<h3>Programs · RAM ${s.ram} of ${T.ram.max}</h3><div class="rows">` + (PROGRAM_ORDER.filter((p) => s.programs[p]).map((p) => `<div class="row"><div><b>${PROGRAMS[p].name}</b><small>${PROGRAMS[p].ram} RAM · ${PROGRAMS[p].note}</small></div><button data-prog="${p}" ${s.prog === p ? 'disabled' : ''}>${s.prog === p ? 'Selected' : 'Select'}</button></div>`).join('') || '<p class="dim">No programs yet. Jack into data nodes to find them.</p>') + '</div>';
      } else {
        h += Jobs.list();
      }
    } else if (which === 'bed') {
      title.textContent = 'Home';
      h += `<p class="sub">Your bed, your window, your city. It's ${Game.clock()}, day ${s.day}.</p><div class="buttons"><button data-act="sleep">Sleep till morning</button></div><p class="dim">Sleeping heals you and fills your RAM.</p>`;
    } else if (which === 'elevator') {
      title.textContent = 'Elevator';
      h += `<p class="sub">A lift cage that groans. Buttons for the floors you know.</p><div class="rows">` + ELEVATOR.map((f) => { const here = World.L.id === f.level, known = !f.needs || Game.flag(f.needs); return `<div class="row ${known ? '' : 'passed'}"><div><b>${f.name}</b><small>${known ? f.note : 'The button is dead. You haven\'t found a way there yet.'}</small></div>${here ? '<span class="tag">you\'re here</span>' : `<button data-floor="${f.level}" ${known ? '' : 'disabled'}>Go</button>`}</div>`; }).join('') + '</div>';
    } else if (which === 'cab') {
      const fare = Flight.cabFare(), home = ['d_dragon', 'd_noodles', 'd_cellar'].includes(World.L.id);
      title.textContent = 'Call a cab';
      h += `<p class="sub">${home ? 'You\'re home already.' : `A cab home, from anywhere in the city: ${fare} cr. It sets you down on your pad.`}</p><div class="buttons"><button data-act="cab" class="go" ${!home && s.cr >= fare ? '' : 'disabled'}>${fare ? `Call a cab · ${fare} cr` : 'Call Ozzy · free'}</button></div>${!home && s.cr < fare ? '<p class="dim">You can\'t afford the fare.</p>' : ''}`;
    } else if (which === 'fab') {
      title.textContent = 'Mags · fabricator';
      h += this.fab();
    } else if (which === 'vendor') {
      const n = this.who, rate = (n && n.def.rate) || 1, worth = SALVAGE_ORDER.reduce((a, k) => a + Math.round((s.pack[k] || 0) * SALVAGE[k].price * rate), 0);
      title.textContent = n ? n.def.name : 'Vendor';
      h += `<p class="sub">${n ? n.def.lines[0] : ''}</p><div class="rows">` + SALVAGE_ORDER.map((k) => `<div class="row"><img class="rowico" src="${this.icon(k)}" alt=""><div class="grow"><b>${SALVAGE[k].name}</b><small>${Math.round(SALVAGE[k].price * rate)} cr each · you carry ${s.pack[k] || 0}</small></div><button data-sell="${k}" ${s.pack[k] ? '' : 'disabled'}>Sell</button></div>`).join('') + '</div>';
      h += `<div class="buttons"><button data-act="sellAll" ${worth ? '' : 'disabled'}>Sell everything for ${worth} cr</button></div><p class="dim">Keep what Mags wants: she builds gear from wire, alloy, glass, coolant and chips.</p>`;
      const shop = n && SHOP[n.def.name];
      if (shop) h += this.shopHtml(shop);
    } else if (which === 'qm') {
      title.textContent = 'Quartermaster Ito';
      h += `<p class="sub">"Chrome's for criminals. You get tools. Bring me parts and the precinct covers the rest of the paperwork, not the money."</p><div class="cards">`;
      for (const g of GADGET_ORDER) {
        const G = GADGETS[g], owned = s.gadgets[g], f = Game.shortfall(G.cost);
        h += `<div class="card" style="--r:#3af0e0"><img src="${this.gadgetIcon(g)}" alt=""><div class="cardtext"><b>${G.name}</b><small class="rar">Gadget · ${G.kind}</small><small>${G.note}</small></div>${owned ? '<span class="tag">yours</span>' : `<div class="pay">${this.cost(G.cost)}${f.extra ? `<small class="buy">+ ${f.extra} cr for the parts you're missing</small>` : ''}<button data-gadget="${g}" class="go" ${s.cr >= f.total ? '' : 'disabled'}>Build · ${f.total} cr</button></div>`}</div>`;
      }
      h += '</div>' + this.shopHtml(SHOP['Quartermaster Ito']);
    } else if (PANELS[which]) {
      const [t, html] = PANELS[which](s); title.textContent = t; h += html;
    } else if (which === 'map') {
      title.textContent = 'Map · ' + World.L.name;
      h += MapView.html();
    } else if (which === 'dev') {
      title.textContent = 'Dev settings';
      h += Dev.html();
    } else if (which === 'pause') {
      title.textContent = 'Under the White Dragon';
      h += `<p class="sub">${World.L.name} · ${Game.clock()} · day ${s.day}. Saved as you go.</p>
        <div class="help"><p><b>Move</b> arrows or WASD, or the left side of the screen. <b>Ladders</b> up and down. <b>Drop</b> through a walkway: down and jump.<br><b>Jump</b> Space or K. <b>Use</b> E (hold it to strip machines). <b>Take down</b> J, from behind someone who hasn\'t seen you. <b>Program</b> Q to run, R to pick. <b>Item</b> G to use, T to switch. <b>Jobs</b> I. <b>Map</b> M.</p>
        <p>You fix what the city breaks, in a hidden basement under the White Dragon, a noodle bar in the Stack, and some of what you fix is illegal. The way down is a trapdoor under the rug in Auntie Lin\'s storeroom. People bring their broken things to the bar: talk to them, take the job down to your bench, and open it up. Hold the driver on the screws (ease off when one binds), probe the parts, melt the bad one free with the iron, seat a good one, solder it, close it up and power it up. Parts come from machines you strip, from the stalls (Mechanic Ana at the Overpass Market, Nurse Kade on Clinic Row), or from places you shouldn\'t be. Hand the fix back at the counter, and sleep on it: in the morning you hear what it did.</p>
        <p>Heat is how close the precinct is to your trapdoor. Illegal work, stolen parts and traceable serials raise it; honest repairs and time bring it down. You carry no gun: if you\'re seen, run. There\'s a cab stand out front, and a cab gets you home from anywhere: you pay the fare, until someone owes you a ride.</p></div>
        <div class="buttons"><button data-act="resume" class="go">Resume</button><button data-act="map">Map</button><button data-act="citymap">The city</button><button data-act="dev">Dev settings</button><button data-act="newgame" class="quiet">New game…</button></div>` + Pwa.html();
    }
    if (['vendor', 'qm', 'fab'].includes(which) && this.who) h = workHtml(this.who.def.name) + h;
    const keep = this.lastPanel === which + (this.tab || '') + (this.fabTab || '') ? body.scrollTop : 0; this.lastPanel = which + (this.tab || '') + (this.fabTab || '');
    body.innerHTML = h; body.scrollTop = keep;
    // where money changes hands, what you have is in the header
    const crEl = $('panelCr'); crEl.hidden = !['vendor', 'fab', 'qm', 'cab', 'pack', 'fixer', 'partshop'].includes(which); crEl.textContent = s.cr + ' cr';
    // the buttons
    const act = { resume: () => this.toggle(null), sleep: () => { Game.s.hp = T.player.hp; Game.s.ram = T.ram.max; const h0 = Game.hour(); Game.pass(((8 - h0) + 24) % 24 || 24); const news = Jobs.morning(); Actors.load(); Game.toast('You sleep. Morning, or what passes for it.', 'good'); if (news.length) this.toggle('morning'); else this.toggle(null); this.refresh(); Save.write(); },
      sellAll: () => { const rate = (this.who && this.who.def.rate) || 1; let cr = 0; for (const k of SALVAGE_ORDER) { cr += Math.round((s.pack[k] || 0) * SALVAGE[k].price * rate); s.pack[k] = 0; } s.cr += cr; Game.toast('Sold for ' + cr + ' cr.'); this.refresh(); Save.write(); },
      install: () => Pwa.install(),
      map: () => this.toggle('map'), citymap: () => this.toggle('citymap'), dev: () => this.toggle('dev'),
      cab: () => { const fare = Flight.cabFare(); if (['d_dragon', 'd_noodles', 'd_cellar'].includes(World.L.id) || (fare && !Game.pay({ cr: fare }))) return; Flight.start('d_dragon', 'enter', true); },
      newgame: (b) => { if (b.dataset.sure) { Save.wipe(); location.reload(); } else { b.dataset.sure = 1; b.textContent = 'Tap again: this wipes your save'; } } };
    body.querySelectorAll('button[data-act]').forEach((b) => (b.onclick = () => act[b.dataset.act](b)));
    panelBind(body, which);
    if (which === 'map') MapView.attach();
    if (which === 'dev') Dev.bind(body);
    body.querySelectorAll('button[data-tab]').forEach((b) => (b.onclick = () => { this.tab = b.dataset.tab; this.panel('pack'); }));
    body.querySelectorAll('button[data-slot]').forEach((b) => (b.onclick = () => { this.slot = b.dataset.slot; this.pick = null; this.panel('pack'); }));
    body.querySelectorAll('button[data-pick]').forEach((b) => (b.onclick = () => { this.pick = b.dataset.pick; this.panel('pack'); }));
    body.querySelectorAll('button[data-equip]').forEach((b) => (b.onclick = () => Game.equip(b.dataset.equip)));
    body.querySelectorAll('button[data-unequip]').forEach((b) => (b.onclick = () => Game.unequip(b.dataset.unequip)));
    body.querySelectorAll('button[data-buyitem]').forEach((b) => (b.onclick = () => { const k = b.dataset.buyitem, n = this.who, shop = SHOP[n && n.def.name] || SHOP['Quartermaster Ito'], c = shop[k]; if (!c || s.cr < c) return; s.cr -= c; Game.give(k, 1); if (!s.quick && (ITEM[k].kind === 'consumable' || ITEM[k].kind === 'throwable')) s.quick = k; this.refresh(); Save.write(); }));
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
    body.querySelectorAll('button[data-gadget]').forEach((b) => (b.onclick = () => { const g = b.dataset.gadget; if (s.gadgets[g] || !Game.payBuying(GADGETS[g].cost)) return; s.gadgets[g] = 1; Game.toast(GADGETS[g].name + '. ' + GADGETS[g].note, 'good'); RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
  },
};
