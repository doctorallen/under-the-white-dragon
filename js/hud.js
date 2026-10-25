'use strict';
// ---------------------------------------------------------------------------
// The HUD (DOM over the canvas): how deep, the bag, toasts, and the panels:
// the bench (craft), the catalog (everything found), and the pause menu.
// ---------------------------------------------------------------------------
const Hud = {
  open: null, icons: {}, lastDepth: null,
  icon(item) {
    if (!this.icons[item]) { const s = Icons.get(item), [c, g] = canvasOf(12, 12); g.drawImage(s.c, 0, 0); this.icons[item] = c.toDataURL(); }
    return this.icons[item];
  },
  init() {
    $('bBench').onclick = () => this.toggle('bench');
    $('bCat').onclick = () => this.toggle('catalog');
    $('bMenu').onclick = () => this.toggle('pause');
    $('panelClose').onclick = () => this.toggle(null);
    this.refresh(); this.bag();
  },
  // the depth line, every frame (cheap: only touches the DOM on change)
  tick() {
    const ty = Math.floor((Player.y - 6) / T.tile), m = Math.round(World.metres(Player.y - 6)), st = World.depth(ty) < 0 ? null : World.stratum(ty);
    const name = Player.home ? 'Home' : World.isSky(Math.floor(Player.x / T.tile), ty) || !st ? 'Thistledown' : st.name;
    const key = m + '|' + name;
    if (key !== this.lastDepth) { this.lastDepth = key; $('depth').textContent = m + ' m'; $('stratum').textContent = name; }
    // toasts fade
    const el = $('toasts');
    for (const n of el.children) { const age = Game.t - +n.dataset.t; n.style.opacity = age > 3.2 ? 0 : 1; }
    if (Game.toasts.length && Game.t - Game.toasts[0].t > 4) { Game.toasts.shift(); this.toasts(); }
  },
  toasts() {
    $('toasts').innerHTML = Game.toasts.map((t) => `<div class="toast ${t.kind}" data-t="${t.t}">${t.text}</div>`).join('');
  },
  bag() {
    const b = Game.s.bag, n = Game.s.slots;
    let h = '';
    for (let i = 0; i < n; i++) { const sl = b[i]; h += sl ? `<div class="slot"><img src="${this.icon(sl.item)}" alt="${ITEMS[sl.item].name}"><i>${sl.n}</i></div>` : '<div class="slot"></div>'; }
    $('bag').innerHTML = h;
    $('bag').classList.toggle('full', b.length >= n && b.every((sl) => sl.n >= Bag.stackOf(sl.item)));
  },
  refresh() {
    $('kit').textContent = PICKS[Game.s.pick].name + ' · ' + LAMPS[Game.s.lamp] + ' · ' + Game.s.torches + ' torch' + (Game.s.torches === 1 ? '' : 'es') + ' · ' + Game.s.ladders + ' ladder' + (Game.s.ladders === 1 ? '' : 's');
    $('bBench').hidden = !Player.home;
    if (this.open) this.panel(this.open);
  },
  toggle(which) {
    if (!which || this.open === which) { this.open = null; $('panel').hidden = true; Game.paused = false; return; }
    this.open = which; Game.paused = true; $('panel').hidden = false; this.panel(which);
  },
  panel(which) {
    const body = $('panelBody'), title = $('panelTitle');
    if (which === 'bench') {
      title.textContent = 'The bench';
      const st = Game.s.store;
      const bins = ITEM_ORDER.filter((k) => ITEMS[k].kind === 'ore').map((k) => `<span class="bin ${st[k] ? '' : 'none'}"><img src="${this.icon(k)}">${st[k] || 0}</span>`).join('');
      let h = `<p class="sub">${Player.home ? 'Ore in the bins:' : 'The bench is at home, in the burrow. Ore in the bins:'}</p><div class="bins">${bins}</div>`;
      for (const r of RECIPES) {
        const passed = !r.repeat && Craft.passed(r), open = r.ok(Game.s), can = open && Craft.canAfford(r) && Player.home;
        const needs = Object.keys(r.needs).map((k) => `<span class="need ${(st[k] || 0) >= r.needs[k] ? 'ok' : ''}"><img src="${this.icon(k)}">${st[k] || 0}/${r.needs[k]}</span>`).join('');
        const state = passed ? '<span class="tag">Made</span>' : !open ? `<span class="tag">${RECIPE_AFTER[r.id] || ''}</span>` : `<button data-r="${r.id}" ${can ? '' : 'disabled'}>Make</button>`;
        h += `<div class="recipe ${passed ? 'passed' : ''} ${!open && !passed ? 'locked' : ''}"><div><b>${r.name}</b><small>${r.note}</small><div class="needs">${needs}</div></div>${state}</div>`;
      }
      body.innerHTML = h;
      body.querySelectorAll('button[data-r]').forEach((b) => (b.onclick = () => { const r = RECIPES.find((q) => q.id === b.dataset.r); if (Craft.make(r)) { Game.toast('Made: ' + r.name, 'home'); this.refresh(); } }));
    } else if (which === 'catalog') {
      const found = ITEM_ORDER.filter((k) => Game.s.catalog[k]).length;
      title.textContent = `Catalog · ${found} of ${ITEM_ORDER.length}`;
      let h = '<div class="cat">';
      for (const k of ITEM_ORDER) {
        const it = ITEMS[k], got = Game.s.catalog[k], seen = Game.s.seen[k];
        const strat = (T.strata.find((s) => s.id === it.stratum) || {}).name || '';
        h += `<div class="entry ${got ? '' : 'unknown'}"><img src="${this.icon(k)}"><div><b>${got ? it.name : seen ? it.name + ' (in your pack)' : '???'}</b><small>${got ? it.note : 'Somewhere in ' + strat + '.'}</small>${got ? `<small class="count">${it.kind === 'ore' ? 'In the bins' : 'On the shelves'}: ${Game.s.store[k] || 0}</small>` : ''}</div></div>`;
      }
      body.innerHTML = h + '</div>';
    } else if (which === 'pause') {
      title.textContent = 'Underhill';
      body.innerHTML = `<p class="sub">Deepest: ${Math.round(Math.max(0, Game.s.deepest) * T.metresPerTile)} m. Saved as you go.</p>
        <div class="help"><p><b>Move</b> arrows / WASD, or the left side of the screen.<br><b>Climb</b> up against any rock.<br><b>Jump</b> Space / K. <b>Dig</b> J / X (aim with up or down).<br><b>Torch</b> T. <b>Ladder</b> L. <b>Bench</b> E (at home). <b>Catalog</b> C.</p>
        <p>Dig ore and curios, climb home to unpack, and make better kit at the bench. A better pick gets through harder rock.</p></div>
        <button id="bResume">Resume</button> <button id="bNew" class="quiet">New world…</button>`;
      $('bResume').onclick = () => this.toggle(null);
      $('bNew').onclick = () => { if ($('bNew').dataset.sure) { Save.wipe(); location.reload(); } else { $('bNew').dataset.sure = 1; $('bNew').textContent = 'Tap again: this wipes your save'; } };
    }
  },
};
