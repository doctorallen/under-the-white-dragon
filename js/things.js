'use strict';
// ---------------------------------------------------------------------------
// Props in play: what each kind looks like, whether it blocks the way, and
// what Use does with it. Salvage and cutting are held (a bar fills); the rest
// happen on a tap. A prop that's been stripped, cut, opened or spent is
// `done`, and that's kept in the save by its id.
// ---------------------------------------------------------------------------
const PROP_ART = {
  vending: (p) => vending(p.look || {}), ac: () => acUnit(), rack: (p) => rack({ h: 40, seed: p.x, warn: true }), car: (p) => car(p.look || {}),
  junk: (p) => junk({ seed: p.x % 7 }), wreck: () => wreck(), cache: () => { const S = new Spr(16, 12, 81); S.ax = 8; S.ay = 11; S.box(0, 0, 15, 11, MAT.concreteD, { lo: 1, hi: 5 }); for (let x = 2; x < 14; x += 3) S.px(x, 5, '#a85ad8', true); return S.done(); },
  grate: (p) => grate({ w: p.w || 12, h: p.h || 32 }), heavy: (p) => heavyShutter({ w: p.w || 30, h: p.h || 32 }), hatch: (p) => hatch({ w: p.w || 26, h: p.h || 34, stripe: true }),
  node: (p) => node({ col: p.col }), lift: (p) => liftCage({ on: Game.s.flags.lift }), capsule: (p) => capsule({ lit: true, col: '#e8c088' }), exit: () => null, deco: (p) => p.art(),
  sealed: (p) => hatch({ w: 40, h: 40, col: '#3a3a40', lock: '#ffb040', stripe: true }),
};
// what each kind gives when stripped: [item, min, max]
const YIELDS = {
  vending: [['wire', 1, 2], ['glass', 1, 1], ['cr', 3, 12]], ac: [['alloy', 1, 2], ['coolant', 0, 1]], rack: [['chips', 1, 2], ['wire', 1, 2]],
  car: [['coolant', 1, 2], ['alloy', 1, 2], ['wire', 0, 1]], junk: [['alloy', 1, 2], ['wire', 0, 1]], wreck: [['chips', 0, 1], ['glass', 1, 1], ['wire', 1, 1]],
  cache: [['chips', 2, 3], ['cr', 30, 60]], stash: [['chips', 2, 3], ['coolant', 1, 1], ['cr', 60, 90]],
};
const STRIP_TIME = { vending: 1.6, ac: 1.2, rack: 1.8, car: 2.4, junk: 1.0, wreck: 1.0, cache: 1.4, stash: 1.2 };

const Props = {
  init(p) {
    const TL = p.x, base = p.y;
    if (p.kind === 'grate' || p.kind === 'heavy' || p.kind === 'hatch' || p.kind === 'sealed') { const w = p.bw || p.w || (p.kind === 'heavy' ? 30 : p.kind === 'sealed' ? 40 : p.kind === 'hatch' ? 26 : 12), h = p.h || (p.kind === 'sealed' ? 40 : p.kind === 'hatch' ? 34 : 32); p.block = { x0: TL - w / 2, y0: base - h, x1: TL + w / 2, y1: base }; }
    p.spr = null;
  },
  sprite(p) {
    if (p.spr && p.sprDone === p.done && p.sprKey === this.key(p)) return p.spr;
    const art = PROP_ART[p.kind]; let s = art ? art(p) : null;
    if (s && p.done) {
      if (YIELDS[p.kind]) s = stripped(s);
      else if (p.kind === 'node') s = node({ col: p.col, spent: true });
      else if (p.kind === 'grate' || p.kind === 'heavy' || p.kind === 'hatch') s = null;
    }
    if (s && p.flip) s = flipSprite(s);
    p.spr = s; p.sprDone = p.done; p.sprKey = this.key(p); return s;
  },
  key(p) { return p.kind === 'lift' ? !!Game.s.flags.lift : 0; },
  // can Use reach it, and what would it do (a prompt), or null
  prompt(p) {
    if (p.kind === 'deco') return null;
    if (p.kind === 'cache' && !Game.has('lowlight')) return null;
    if (YIELDS[p.kind]) return p.done ? null : { text: 'Strip ' + (p.label || p.kind), hold: STRIP_TIME[p.kind] };
    if (p.kind === 'grate') return p.done ? null : { text: 'Cut the grate', hold: 1.3 };
    if (p.kind === 'heavy') return p.done ? null : Game.has('mantis') ? { text: 'Cut the shutter', hold: 2.0 } : { text: 'Too heavy for the cutter', tap: true, no: true };
    if (p.kind === 'hatch') {
      if (p.done) return p.to ? { text: p.goLabel || 'Go through', tap: true } : null;
      if (p.needs && !Game.flag(p.needs)) return { text: p.needsLabel || 'Locked', tap: true, no: true };
      return Game.s.programs.breach ? { text: 'Run Breach (1 RAM)', tap: true } : { text: 'Locked. A Breach program would open it', tap: true, no: true };
    }
    if (p.kind === 'sealed') return { text: p.label || 'Sealed', tap: true, no: true };
    if (p.kind === 'node') return p.done ? null : { text: 'Jack in', tap: true };
    if (p.kind === 'lift') return Game.s.flags.lift ? { text: 'Take the lift ' + (p.dir || ''), tap: true } : { text: 'Restore the lift: 4 wire, 2 chips', tap: true, no: !Game.canPay({ wire: 4, chips: 2 }) };
    if (p.kind === 'capsule') return { text: 'Your capsule', tap: true };
    if (p.kind === 'exit') return { text: p.label || 'Climb', tap: true };
    return null;
  },
  // Use, done: on a tap, or when a held bar fills
  use(p) {
    if (YIELDS[p.kind]) {
      const got = [];
      for (const [item, a, b] of YIELDS[p.kind]) { const n = a + Math.floor(hash(p.x, p.y, item.length + Game.s.day) * (b - a + 1)); if (n <= 0) continue; if (item === 'cr') { Game.s.cr += n; got.push(n + ' cr'); } else { const took = Game.give(item, n); if (took) got.push(took + ' ' + SALVAGE[item].name.toLowerCase()); } }
      this.finish(p); Fx.sparks(p.x, p.y - 8, 10);
      Game.toast(got.length ? '+ ' + got.join(', ') : 'Nothing worth taking.');
      return;
    }
    if (p.kind === 'grate' || p.kind === 'heavy') { this.finish(p); Fx.sparks(p.x, p.y - 16, 16); Game.toast(p.kind === 'grate' ? 'Through.' : 'The shutter comes away.'); return; }
    if (p.kind === 'hatch') {
      if (p.done && p.to) { Game.go(p.to[0], p.to[1]); return; }
      if (p.needs && !Game.flag(p.needs)) { Game.toast((p.needsLabel || 'Locked') + '.'); return; }
      if (Programs.run('breach', p)) { this.finish(p); Game.toast('Breached.'); }
      return;
    }
    if (p.kind === 'node') { Hack.open(p.level || 1, () => { this.finish(p); Game.reward(p.gives); }); return; }
    if (p.kind === 'lift') {
      if (!Game.s.flags.lift) { if (Game.pay({ wire: 4, chips: 2 })) { Game.s.flags.lift = true; p.spr = null; Game.toast('The lift shudders and lights up. It runs between the Stack and street level now.', 'good'); Save.write(); } else Game.toast('You need 4 wire and 2 chips.'); return; }
      Game.go(p.to[0], p.to[1]); return;
    }
    if (p.kind === 'capsule') { Hud.toggle('home'); return; }
    if (p.kind === 'exit') { Game.go(p.to[0], p.to[1]); return; }
  },
  finish(p) { p.done = true; Game.s.done[p.id] = 1; p.spr = null; Save.write(); },
};
