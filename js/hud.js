'use strict';
// ---------------------------------------------------------------------------
// The HUD (DOM over the canvas): health, RAM, money, the time and place, the
// prompt for Use, toasts, a boss's bar, what people say over their heads;
// and the panels: your pack, your capsule (stash and sleep), a vendor, the
// fixer's jobs, the ripperdoc, the pause menu.
// ---------------------------------------------------------------------------
const Hud = {
  open: null, who: null, last: {},
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
    $('cr').textContent = s.cr + ' cr';
    $('packn').textContent = Game.packCount() + '/' + T.pack.cap;
    $('bProg').textContent = s.prog ? PROGRAMS[s.prog].name : 'No program';
    $('bProg').classList.toggle('none', !s.prog);
    if (this.open) this.panel(this.open);
  },
  nextProgram() { const have = PROGRAM_ORDER.filter((p) => Game.s.programs[p]); if (!have.length) return; const i = have.indexOf(Game.s.prog); Game.s.prog = have[(i + 1) % have.length]; Game.toast('Program: ' + PROGRAMS[Game.s.prog].name); this.refresh(); },
  toggle(which, who) {
    if (!which || (this.open === which && !who)) { this.open = null; this.who = null; $('panel').hidden = true; Game.paused = false; return; }
    this.open = which; this.who = who || this.who; Game.paused = true; $('panel').hidden = false; this.panel(which);
  },
  items(o, cls = '') { return SALVAGE_ORDER.filter((k) => o[k]).map((k) => `<span class="item ${cls}"><i style="background:${SALVAGE[k].col[1]}"></i>${SALVAGE[k].name} <b>${o[k]}</b></span>`).join('') || '<span class="dim">Nothing.</span>'; },
  cost(c) { return Object.keys(c).map((k) => { const ok = k === 'cr' ? Game.s.cr >= c.cr : (Game.s.pack[k] || 0) + (Game.s.stash[k] || 0) >= c[k]; return `<span class="need ${ok ? 'ok' : ''}">${k === 'cr' ? c.cr + ' cr' : c[k] + ' ' + SALVAGE[k].name.toLowerCase()}</span>`; }).join(' · '); },
  panel(which) {
    const s = Game.s, body = $('panelBody'), title = $('panelTitle'); let h = '';
    if (which === 'pack') {
      title.textContent = 'Pack';
      h += `<p class="sub">${Game.packCount()} of ${T.pack.cap} carried · ${s.cr} cr · health ${Math.round(s.hp)}</p><div class="items">${this.items(s.pack)}</div>`;
      h += `<h3>Ware · neural load ${Game.neuralLoad()} of ${Game.neuralCap()}</h3><div class="rows">` + (MOD_ORDER.filter((m) => s.mods.owned[m]).map((m) => `<div class="row"><div><b>${MODS[m].name}</b><small>${MODS[m].slot} · ${MODS[m].note}</small></div><span class="tag">${s.mods.on[m] ? 'installed' : 'in your stash'}</span></div>`).join('') || '<p class="dim">No ware yet. The ripperdoc on the Stack fits it.</p>') + '</div>';
      h += `<h3>Programs · RAM ${s.ram} of ${T.ram.max}</h3><div class="rows">` + (PROGRAM_ORDER.filter((p) => s.programs[p]).map((p) => `<div class="row"><div><b>${PROGRAMS[p].name}</b><small>${PROGRAMS[p].ram} RAM · ${PROGRAMS[p].note}</small></div><button data-prog="${p}" ${s.prog === p ? 'disabled' : ''}>${s.prog === p ? 'Selected' : 'Select'}</button></div>`).join('') || '<p class="dim">No programs yet. Jack into data nodes to find them.</p>') + '</div>';
      h += `<h3>Jobs</h3><div class="rows">` + (JOBS.filter((j) => s.jobs.taken[j.id] && !s.jobs.done[j.id]).map((j) => `<div class="row"><div><b>${j.title}</b><small>${j.text}</small></div><span class="tag">${Game.jobReady(j) ? 'ready' : ''}</span></div>`).join('') || '<p class="dim">No work on. Juno at the bar on the Stack has some.</p>') + '</div>';
    } else if (which === 'home') {
      title.textContent = 'Your capsule';
      h += `<p class="sub">Two metres of foam and a lock. It\'s ${Game.clock()}.</p><h3>Pack</h3><div class="items">${this.items(s.pack)}</div><h3>Stash</h3><div class="items">${this.items(s.stash)}</div>`;
      h += `<div class="buttons"><button data-act="stashAll">Stash everything</button><button data-act="takeAll">Take what fits</button><button data-act="sleep">Sleep till morning</button></div>`;
    } else if (which === 'vendor') {
      const n = this.who, rate = (n && n.def.rate) || 1, worth = SALVAGE_ORDER.reduce((a, k) => a + Math.round((s.pack[k] || 0) * SALVAGE[k].price * rate), 0);
      title.textContent = n ? n.def.name : 'Vendor';
      h += `<p class="sub">${n ? n.def.lines[0] : ''}</p><div class="rows">` + SALVAGE_ORDER.map((k) => `<div class="row"><div><b>${SALVAGE[k].name}</b><small>${Math.round(SALVAGE[k].price * rate)} cr each · you carry ${s.pack[k] || 0}</small></div><button data-sell="${k}" ${s.pack[k] ? '' : 'disabled'}>Sell</button></div>`).join('') + '</div>';
      h += `<div class="buttons"><button data-act="sellAll" ${worth ? '' : 'disabled'}>Sell everything for ${worth} cr</button></div><p class="dim">Keep what the ripperdoc wants: wire, alloy, glass, coolant and chips all go into ware.</p>`;
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
      if (JOBS.every((j) => s.jobs.done[j.id])) h += '<p class="sub">"You\'ve been useful. The clinic data mentions the Works. Someone down there is buying up the city\'s old code. When the subway opens, I\'ll have more."</p>';
    } else if (which === 'doc') {
      title.textContent = 'Doc Vasquez';
      h += `<p class="sub">Neural load ${Game.neuralLoad()} of ${Game.neuralCap()}. Ware costs parts and money to build; fitting and removing is free.</p><div class="rows">`;
      for (const m of MOD_ORDER) {
        const M = MODS[m], owned = s.mods.owned[m], on = s.mods.on[m];
        const btn = !owned ? `<button data-buy="${m}" ${Game.canPay(M.cost) ? '' : 'disabled'}>Build and fit</button>` : on ? `<button data-off="${m}">Remove</button>` : `<button data-on="${m}" ${Game.neuralLoad() + M.load <= Game.neuralCap() ? '' : 'disabled'}>Fit</button>`;
        h += `<div class="row"><div><b>${M.name}</b><small>${M.slot} · load ${M.load} · ${M.note}</small>${owned ? '' : `<small>${this.cost(M.cost)}</small>`}</div>${btn}</div>`;
      }
      h += '</div><p class="dim">Parts come out of your pack first, then your stash.</p>';
    } else if (which === 'pause') {
      title.textContent = 'Downlevel';
      h += `<p class="sub">${World.L.name} · ${Game.clock()} · day ${s.day}. Saved as you go.</p>
        <div class="help"><p><b>Move</b> arrows or WASD, or the left side of the screen. <b>Ladders</b> up and down. <b>Drop</b> through a walkway: down and jump.<br><b>Jump</b> Space or K. <b>Strike</b> J. <b>Use</b> E (hold it to strip machines and cut). <b>Program</b> Q to run, R to pick. <b>Pack</b> I.</p>
        <p>Strip machines for parts, sell them, or take them to the ripperdoc for ware. Jack into data nodes for programs. Juno at the bar has work. The way down is in the service yard at the east end of the Stack, past the Warden.</p></div>
        <div class="buttons"><button data-act="resume">Resume</button><button data-act="newgame" class="quiet">New game…</button></div>` + Pwa.html();
    }
    body.innerHTML = h;
    // the buttons
    const act = { resume: () => this.toggle(null), sleep: () => { Game.s.hp = T.player.hp; Game.s.ram = T.ram.max; const h0 = Game.hour(); Game.pass(((8 - h0) + 24) % 24 || 24); Actors.load(); Game.toast('You sleep. Morning, or what passes for it.'); this.toggle(null); Save.write(); },
      stashAll: () => { for (const k in s.pack) { s.stash[k] = (s.stash[k] || 0) + s.pack[k]; } s.pack = {}; this.refresh(); Save.write(); },
      takeAll: () => { for (const k of SALVAGE_ORDER) { const room = T.pack.cap - Game.packCount(), n = Math.min(room, s.stash[k] || 0); if (n > 0) { s.pack[k] = (s.pack[k] || 0) + n; s.stash[k] -= n; } } this.refresh(); },
      sellAll: () => { const rate = (this.who && this.who.def.rate) || 1; let cr = 0; for (const k of SALVAGE_ORDER) { cr += Math.round((s.pack[k] || 0) * SALVAGE[k].price * rate); s.pack[k] = 0; } s.cr += cr; Game.toast('Sold for ' + cr + ' cr.'); this.refresh(); Save.write(); },
      install: () => Pwa.install(),
      newgame: (b) => { if (b.dataset.sure) { Save.wipe(); location.reload(); } else { b.dataset.sure = 1; b.textContent = 'Tap again: this wipes your save'; } } };
    body.querySelectorAll('button[data-act]').forEach((b) => (b.onclick = () => act[b.dataset.act](b)));
    body.querySelectorAll('button[data-prog]').forEach((b) => (b.onclick = () => { s.prog = b.dataset.prog; this.refresh(); }));
    body.querySelectorAll('button[data-sell]').forEach((b) => (b.onclick = () => { const k = b.dataset.sell, rate = (this.who && this.who.def.rate) || 1, n = s.pack[k] || 0; s.cr += Math.round(n * SALVAGE[k].price * rate); s.pack[k] = 0; this.refresh(); }));
    body.querySelectorAll('button[data-take]').forEach((b) => (b.onclick = () => Game.takeJob(JOBS.find((j) => j.id === b.dataset.take))));
    body.querySelectorAll('button[data-finish]').forEach((b) => (b.onclick = () => Game.finishJob(JOBS.find((j) => j.id === b.dataset.finish))));
    body.querySelectorAll('button[data-buy]').forEach((b) => (b.onclick = () => { const m = b.dataset.buy; if (!Game.pay(MODS[m].cost)) return; s.mods.owned[m] = true; if (Game.neuralLoad() + MODS[m].load <= Game.neuralCap()) { s.mods.on[m] = true; Game.toast(MODS[m].name + ' fitted. ' + MODS[m].note, 'good'); } else Game.toast(MODS[m].name + ' built, but your nervous system is full. Remove something to fit it.', 'warn'); RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-on]').forEach((b) => (b.onclick = () => { s.mods.on[b.dataset.on] = true; RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
    body.querySelectorAll('button[data-off]').forEach((b) => (b.onclick = () => { s.mods.on[b.dataset.off] = false; RunnerArt.cache.clear(); this.refresh(); Save.write(); }));
  },
};
