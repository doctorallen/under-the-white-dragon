'use strict';
// ---------------------------------------------------------------------------
// The HUD (DOM over the canvas): money and heat, the time and place, the
// prompt for Use, toasts, what people say over their heads and what you just
// got; and the panels: your jobs and pockets, your cot, a vendor, a cab, the
// pause menu (the rest are PANELS in panels.js).
// ---------------------------------------------------------------------------
const Hud = {
  open: null, who: null, last: {}, tab: 'jobs', mode: 'spinner',
  // toasts (Tycho.ui): two at most, on the game's clock, faded at 3.6 s and
  // gone at 4.2, the same words again within 2.5 s keeping the last one up
  toaster: new Tycho.ui.Toasts({ box: () => $('toasts'), redraw: true, html: true, most: 2, life: 4.2, fadeAt: 3.6, merge: 2.5, clock: () => Game.t, cls: (kind) => 'toast ' + kind }),
  // what you just got, a line each over where it came from (Game.gain)
  rising: new Tycho.ui.Rising({ clock: () => Game.t, line: (g) => `<b>+${g.n}</b> ${g.name}${g.icon ? `<img src="${g.icon}" alt="">` : ''}${g.tag ? `<i>${g.tag}</i>` : ''}` }),
  init() {
    $('bPack').onclick = () => this.toggle('pack');
    $('bMenu').onclick = () => this.toggle('pause');
    $('bCab').onclick = () => this.toggle('cab');
    // the job line opens your jobs
    $('obj').onclick = () => { this.tab = 'jobs'; this.toggle('pack'); };
    $('panelClose').onclick = () => this.toggle(null);
    Tutorial.init();
    this.refresh();
  },
  set(id, v, prop = 'textContent') { if (this.last[id] !== v) { this.last[id] = v; $(id)[prop] = v; } },
  // every frame: cheap, only touches the DOM on change
  tick() {
    const s = Game.s;
    this.set('clock', Game.clock() + ' · day ' + s.day + (Dev.s.fps ? ' · ' + Dev.fps + ' fps' : ''));
    this.set('place', World.L.name);
    Tutorial.tick();
    this.set('obj', Tutorial.active() ? '' : Jobs.objective());
    this.set('guide', Game.paused ? '' : Tutorial.card(), 'innerHTML');
    const tg = Player.target;
    const edge = !tg && !Game.paused ? Travel.edgeAhead() : null;
    this.set('prompt', tg && !Game.paused ? (Player.hold ? tg.pr.text + '…' : tg.pr.text) : edge ? (edge.dir === 'west' ? '← On foot to ' : 'On foot to ') + LEVELS[edge.to].name + (edge.dir === 'east' ? ' →' : '') : '');
    // the Use button says what it would do, in a word
    const verb = tg && !Game.paused ? tg.pr.verb || 'Use' : 'Use';
    this.set('bUse', verb);
    if (this.last.useState !== (tg ? (tg.pr.no ? 'no' : 'on') : 'off')) { this.last.useState = tg ? (tg.pr.no ? 'no' : 'on') : 'off'; $('bUse').classList.toggle('idle', !tg); $('bUse').classList.toggle('no', !!(tg && tg.pr.no)); }
    $('prompt').classList.toggle('no', !!(tg && tg.pr.no));
    $('holdbar').style.width = Player.hold ? Math.min(100, (Player.hold.t / Player.hold.need) * 100) + '%' : '0';
    this.toaster.tick();
    // speech over heads
    let h = ''; const V = View, sc = V.scale / (window.devicePixelRatio || 1);
    // oldest first, so the newest is drawn on top; then any older one it
    // would cover is lifted up above it
    const said = Actors.npcs.filter((n) => n.bubble && !n.hidden).sort((a, b) => (a.bubble.seq || 0) - (b.bubble.seq || 0));
    for (const n of said) { const x = (n.x - V.cx) * sc, y = (n.y - 44 - V.cy) * sc; h += `<div class="bubble${n === said[said.length - 1] ? ' new' : ''}" style="left:${x}px;top:${y}px"><b>${n.def.name}</b> ${n.bubble.text}</div>`; }
    // what you just got: a line each, stacked first on top, rising and fading
    this.set('gains', this.rising.html((x, y) => [(x - V.cx) * sc, (y - V.cy) * sc]), 'innerHTML');
    if (this.set('bubbles', h, 'innerHTML') !== false && said.length > 1) {
      const els = [...$('bubbles').children], placed = [];
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i], w = el.offsetWidth, hh = el.offsetHeight, x = parseFloat(el.style.left); let top = parseFloat(el.style.top);
        for (let moved = true, k = 0; moved && k < 8; k++) { moved = false; for (const p of placed) if (Math.abs(x - p.x) < (w + p.w) / 2 + 4 && top - hh < p.top && top > p.top - p.h - 4) { top = p.top - p.h - 6; moved = true; } }
        el.style.top = top + 'px'; placed.push({ x, w, h: hh, top });
      }
    }
  },
  refresh() {
    const s = Game.s; if (!s) return;
    $('cr').textContent = s.cr + ' cr';
    $('heatfill').style.width = s.heat + '%'; $('heat').classList.toggle('hot', s.heat >= 40); $('heat').classList.toggle('none', !s.heat);
    if (this.open) this.panel(this.open);
  },
  toggle(which, who) {
    if (this.open === 'talk' && (which !== 'talk' || (who && who !== this.who))) Talk.close(); // (a talk ends with its panel)
    if (!which || (this.open === which && !who)) { if (this.open) snd('close'); this.open = null; this.who = null; $('panel').hidden = true; Game.paused = false; return; }
    if (!this.open) snd('open');
    this.open = which; this.who = who || this.who; Game.paused = true; $('panel').hidden = false; this.panel(which);
  },
  items(o, cls = '') { return SALVAGE_ORDER.filter((k) => o[k]).map((k) => `<span class="item ${cls}"><i style="background:${SALVAGE[k].col[1]}"></i>${SALVAGE[k].name} <b>${o[k]}</b></span>`).join('') || '<span class="dim">Nothing.</span>'; },
  cost(c) { return Object.keys(c).map((k) => { const ok = k === 'cr' ? Game.s.cr >= c.cr : bag.count(Game.s.pack, k) >= c[k]; return `<span class="need ${ok ? 'ok' : ''}">${k === 'cr' ? c.cr + ' cr' : `<img class="ico" src="${this.icon(k)}" alt="">${c[k]} ${SALVAGE[k].name.toLowerCase()}`}${k !== 'cr' && !ok ? ` <i class="have">(${bag.count(Game.s.pack, k)})</i>` : ''}</span>`; }).join(' '); },
  // salvage icons, as images (made once)
  icons: {},
  icon(k) { if (this.icons[k]) return this.icons[k]; const sp = itemIcon(k), [c, g] = canvasOf(48, 48); g.drawImage(sp.c, 0, 0, 48, 48); if (sp.e) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(sp.e, 0, 0, 48, 48); } return (this.icons[k] = c.toDataURL()); },
  // a grid of salvage tiles; `btn(k)` adds a button under each
  tiles(o, btn) { const ks = SALVAGE_ORDER.filter((k) => o === null || o[k]); return ks.length ? '<div class="tiles">' + ks.map((k) => `<div class="tile" style="--r:${SALVAGE[k].col[1]}"><img src="${this.icon(k)}" alt=""><b>${SALVAGE[k].name}</b>${o ? `<span class="n">× ${o[k]}</span>` : ''}${btn ? btn(k) : ''}</div>`).join('') + '</div>' : '<p class="dim">No salvage. Hold Use on a machine to strip it.</p>'; },
  panel(which) {
    const s = Game.s, body = $('panelBody'), title = $('panelTitle'); let h = '';
    const talking = which === 'talk' && Talk.showing(this.who); $('panel').classList.toggle('talking', talking); if (!talking) $('panel').classList.remove('typing');
    if (which === 'pack') {
      // your jobs, what's in your pockets, and the people you know (your notebook's People page: known.js)
      const tab = ['items', 'people'].includes(this.tab) ? this.tab : 'jobs';
      title.textContent = { jobs: 'Jobs', items: 'Pockets', people: 'Notebook · People' }[tab];
      h += '<nav class="tabs">' + [['jobs', 'Jobs'], ['items', 'Items'], ['people', 'People']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('') + '</nav>';
      h += tab === 'items' ? itemsTab(s) : tab === 'people' ? Known.html() : Jobs.list();
    } else if (which === 'bed') {
      title.textContent = 'Your cot';
      h += `<p class="sub">A cot behind the shelves, the bar's noise through the ceiling. It's ${Game.clock()}, day ${s.day}.</p><div class="buttons"><button data-act="sleep" class="go">Sleep till morning</button></div><p class="dim">In the morning you hear how your fixes held up, and who's been asking.</p>`;
    } else if (which === 'cab') {
      const fare = Flight.cabFare(), home = ['d_dragon', 'd_noodles', 'd_cellar'].includes(World.L.id);
      title.textContent = 'Call a cab';
      h += `<p class="sub">${home ? 'You\'re home already.' : `A cab home, from anywhere in the city: ${fare} cr. It sets you down out front of the White Dragon.`}</p><div class="buttons"><button data-act="cab" class="go" ${!home && s.cr >= fare ? '' : 'disabled'}>${fare ? `Call a cab · ${fare} cr` : 'Call Ozzy · free'}</button></div>${!home && s.cr < fare ? '<p class="dim">You can\'t afford the fare.</p>' : ''}`;
    } else if (which === 'vendor') {
      const n = this.who, rate = Known.rate(n), worth = bag.worth(s.pack, (k, c) => Math.round(c * SALVAGE[k].price * rate), SALVAGE_ORDER); // (better for you, the better they know you: known.js)
      title.textContent = n ? n.def.name : 'Vendor';
      h += `<p class="sub">${n ? n.def.lines[0] : ''}</p>${n ? Known.deal(n, false) : ''}${talkBtn(n)}<div class="rows">` + SALVAGE_ORDER.map((k) => `<div class="row"><img class="rowico" src="${this.icon(k)}" alt=""><div class="grow"><b>${SALVAGE[k].name}</b><small>${Math.round(SALVAGE[k].price * rate)} cr each · you carry ${bag.count(s.pack, k)}</small></div><button data-sell="${k}" ${s.pack[k] ? '' : 'disabled'}>Sell</button></div>`).join('') + '</div>';
      h += `<div class="buttons"><button data-act="sellAll" ${worth ? '' : 'disabled'}>Sell everything for ${worth} cr</button></div>`;
    } else if (PANELS[which]) {
      const [t, html] = PANELS[which](s); title.textContent = t; h += html;
    } else if (which === 'map') {
      title.textContent = 'Map · ' + World.L.name;
      h += MapView.html();
    } else if (which === 'pause') {
      title.textContent = 'Under the White Dragon';
      h += `<p class="sub">${World.L.name} · ${Game.clock()} · day ${s.day}. Saved as you go.</p>
        <div class="help"><p><b>Move</b> arrows or WASD, or the left side of the screen. <b>Ladders</b> up and down. <b>Drop</b> through a walkway: down and jump.<br><b>Jump</b> Space or K. <b>Use</b> E (hold it to strip machines). <b>Jobs</b> I. <b>Map</b> M. On a phone: the stick on the left, Use and Jump on the right.</p>
        <p>You fix what the city breaks, in a hidden basement under the White Dragon, Auntie Lin\'s noodle bar, and some of what you fix is illegal. The way down is a trapdoor under the rug in Auntie Lin\'s storeroom. People bring their broken things to the bar: talk to them, take the job down to your bench, and open it up. Hold the driver on the screws (ease off when one binds), probe the parts, melt the bad one free with the iron, seat a good one, solder it, close it up and power it up. Parts come from machines you strip, from the stalls (Mechanic Ana at the Overpass Market, Nurse Kade on Clinic Row), or from places you shouldn\'t be. Hand the fix back to whoever brought it, and sleep on it: in the morning you hear what it did. People on the block bring small repairs too, and tell you where there are parts to be had; better tools from the stalls let you strip the good ones.</p>
        <p>Heat is how close the precinct is to your trapdoor. Illegal work, stolen parts and traceable serials raise it; honest repairs and time bring it down. There\'s a cab stand out front, and a cab gets you home from anywhere: you pay the fare, until someone owes you a ride.</p></div>
        <div class="buttons"><button data-act="resume" class="go">Resume</button><button data-act="map">Map</button><button data-act="citymap">The city</button><button data-act="music">Music · ${SndSet.word('music')}</button><button data-act="sfx">Sound · ${SndSet.word('sfx')}</button>${Dev.shown() ? '<button data-act="dev">Dev</button>' : ''}<button data-act="newgame" class="quiet">New game…</button></div>` + Pwa.html();
    }
    const keep = this.lastPanel === which + (this.tab || '') ? body.scrollTop : 0; this.lastPanel = which + (this.tab || '');
    body.innerHTML = h; body.scrollTop = keep;
    // where money changes hands, what you have is in the header
    const crEl = $('panelCr'); crEl.hidden = !['vendor', 'cab', 'pack', 'partshop', 'grocer'].includes(which); crEl.textContent = s.cr + ' cr';
    // the buttons
    const act = { resume: () => this.toggle(null), sleep: () => { snd('sleep'); const h0 = Game.hour(); Game.pass(h0 < 8 ? 8 - h0 : 32 - h0); const fresh = Game.s.morning !== Game.s.day; Game.s.morning = Game.s.day; const news = fresh ? Jobs.morning() : (Jobs.news = []); /* (one morning a day: a nap before eight doesn't bring another) */ Actors.load(); Game.toast('You sleep. Morning, or what passes for it.', 'good'); if (news.length) this.toggle('morning'); else this.toggle(null); this.refresh(); Save.write(); },
      sellAll: () => { const rate = Known.rate(this.who), cr = bag.worth(s.pack, (k, n) => Math.round(n * SALVAGE[k].price * rate), SALVAGE_ORDER); bag.empty(s.pack, SALVAGE_ORDER); s.cr += cr; s.flags.sold = 1; Game.toast('Sold for ' + cr + ' cr.'); this.refresh(); Save.write(); },
      install: () => Pwa.install(),
      music: () => { SndSet.cycle('music'); this.panel('pause'); }, sfx: () => { SndSet.cycle('sfx'); this.panel('pause'); }, // (on, soft, off: sound.js)
      map: () => this.toggle('map'), citymap: () => this.toggle('citymap'), dev: () => { this.toggle(null); Dev.drawer.open(); },
      cab: () => { const fare = Flight.cabFare(); if (['d_dragon', 'd_noodles', 'd_cellar'].includes(World.L.id) || (fare && !Game.pay({ cr: fare }))) return; Flight.start('d_dragon', 'enter', true); },
      newgame: (b) => { if (b.dataset.sure) { Save.wipe(); location.reload(); } else { b.dataset.sure = 1; b.textContent = 'Tap again: this wipes your save'; } } };
    body.querySelectorAll('button[data-act]').forEach((b) => (b.onclick = () => act[b.dataset.act](b)));
    panelBind(body, which);
    Tutorial.decorate(body, which);
    if (talking) Talk.after(body); // (what's not been said yet, said)
    if (which === 'map') MapView.attach();
    if (which === 'tyrell') TyrellMode.attach();
    body.querySelectorAll('button[data-tab]').forEach((b) => (b.onclick = () => { this.tab = b.dataset.tab; this.panel('pack'); }));
    body.querySelectorAll('button[data-sell]').forEach((b) => (b.onclick = () => { const k = b.dataset.sell, rate = Known.rate(this.who), n = bag.count(s.pack, k); s.cr += Math.round(n * SALVAGE[k].price * rate); bag.empty(s.pack, [k]); s.flags.sold = 1; this.refresh(); }));
  },
};
