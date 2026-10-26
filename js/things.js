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
  node: (p) => node({ col: p.col }), lift: (p) => liftCage({ on: Game.s.flags.lift }), bed: () => bed(), spinner: () => spinner({}), transit: (p) => (p.mode === 'spinner' ? spinner({}) : p.mode === 'subway' ? subwayDoor() : p.mode === 'hatch' ? manholeLadder() : p.mode === 'manhole' ? manholeCover() : liftCage({ on: true })),
  keydoor: (p) => (p.mode === 'subway' ? subwayDoor() : hatch({ w: 40, h: 44, col: '#3a3a40', lock: Game.s.pack[p.key] > 0 ? '#3aff80' : '#ffb040', stripe: true })), locker: () => locker(), clue: (p) => marker({ col: p.K.kind === 'photo' ? '#3af0e0' : '#ffd040' }), pickup: () => marker({ col: '#ff9ad8' }), closet: () => closet(), elevator: (p) => elevator({ at: ELEVATOR.findIndex((f) => f.level === p.level) }), exit: () => null, deco: (p) => p.art(),
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
    if (p.kind === 'cache' && !Game.has('scanner')) return null;
    if (YIELDS[p.kind]) return p.done ? null : { verb: 'Strip', text: 'Strip ' + (p.label || p.kind), hold: STRIP_TIME[p.kind] };
    if (p.kind === 'grate') return p.done ? null : { verb: 'Cut', text: 'Cut the grate', hold: 1.3 };
    if (p.kind === 'heavy') return p.done ? null : Game.has('cutter') ? { verb: 'Cut', text: 'Cut the shutter', hold: 2.0 } : { verb: 'Cut', text: 'Too heavy for a hand cutter: it needs a plasma cutter', tap: true, no: true };
    if (p.kind === 'hatch') {
      if (p.done) return p.to ? { verb: 'Climb', text: p.goLabel || 'Go through', tap: true } : null;
      if (p.needs && !Game.flag(p.needs)) return { verb: 'Locked', text: p.needsLabel || 'Locked', tap: true, no: true };
      return Game.s.programs.breach ? { verb: 'Breach', text: 'Run Breach (1 RAM)', tap: true } : { verb: 'Locked', text: 'Locked. A Breach program would open it', tap: true, no: true };
    }
    if (p.kind === 'sealed') return { verb: 'Sealed', text: p.label || 'Sealed', tap: true, no: true };
    if (p.kind === 'node') return p.done ? null : { verb: 'Hack', text: 'Jack in', tap: true };
    if (p.kind === 'lift') return Game.s.flags.lift ? { verb: 'Ride', text: 'Take the lift ' + (p.dir || ''), tap: true } : { verb: 'Repair', text: 'Restore the lift: 4 wire, 2 chips', tap: true, no: !Game.canPay({ wire: 4, chips: 2 }) };
    if (p.kind === 'bed') return { verb: 'Sleep', text: 'Your bed', tap: true };
    if (p.kind === 'spinner') return { verb: 'Fly', text: 'Your spinner', tap: true };
    if (p.kind === 'transit') return { verb: p.mode === 'spinner' ? 'Fly' : p.mode === 'hatch' ? 'Climb' : p.mode === 'manhole' ? 'Climb down' : 'Ride', text: p.mode === 'spinner' ? 'Your spinner' : p.mode === 'subway' ? 'The subway' : p.mode === 'hatch' ? 'The ladder up to the street' : p.mode === 'manhole' ? 'The manhole, down into the undercity' : 'The lift cage', tap: true };
    if (p.kind === 'keydoor') return Game.s.pack[p.key] > 0 ? { verb: 'Ride', text: p.label, tap: true } : { verb: 'Locked', text: p.label + ': it needs the ' + ITEM[p.key].name.toLowerCase(), tap: true, no: true };
    if (p.kind === 'locker') return p.done ? null : { verb: 'Open', text: 'Open the ' + (p.label || 'locker'), hold: 0.8 };
    if (p.kind === 'clue') return { verb: p.K.kind === 'photo' ? 'Enhance' : 'Examine', text: (p.K.kind === 'photo' ? 'A photo: ' : '') + p.K.name, tap: true };
    if (p.kind === 'pickup') return { verb: 'Take', text: ITEM[p.item].name, tap: true };
    if (p.kind === 'closet') return { verb: 'Gear', text: 'Your closet: change what you wear', tap: true };
    if (p.kind === 'elevator') return { verb: 'Call', text: 'Call the elevator', tap: true };
    if (p.kind === 'exit') return { verb: 'Climb', text: p.label || 'Climb', tap: true };
    return null;
  },
  // Use, done: on a tap, or when a held bar fills
  use(p) {
    if (YIELDS[p.kind]) {
      const got = [];
      for (const [item, a, b] of YIELDS[p.kind]) { const n = a + Math.floor(hash(p.x, p.y, item.length + Game.s.day) * (b - a + 1)); if (n <= 0) continue; if (item === 'cr') { Game.s.cr += n; got.push(n + ' cr'); } else { const took = Game.give(item, n); if (took) got.push(took + ' ' + SALVAGE[item].name.toLowerCase()); } }
      this.finish(p); Fx.sparks(p.x, p.y - 8, 10);
      Game.toast(got.length ? '+ ' + got.join(', ') : 'Nothing worth taking.');
      // some hold something to wear
      if (p.gear) for (const g of [].concat(p.gear)) Game.giveGear(g);
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
    if (p.kind === 'bed') { Hud.toggle('bed'); return; }
    if (p.kind === 'spinner') { Hud.mode = 'spinner'; Hud.toggle('travel'); return; }
    if (p.kind === 'transit') { Hud.mode = p.mode; Hud.toggle('travel'); return; }
    if (p.kind === 'keydoor') { if (Game.s.pack[p.key] > 0) Travel.go(Travel.KEYS[p.key] || 'street'); else Game.toast(p.label + '. Locked: it needs the ' + ITEM[p.key].name.toLowerCase() + '.'); return; }
    if (p.kind === 'locker') { const got = Game.loot(p.tier || Quests.tier(World.L.id), hash(p.x, p.y, 91) * 1e6, 1); this.finish(p); Fx.sparks(p.x, p.y - 12, 6); Game.toast('+ ' + got.join(', ')); return; }
    if (p.kind === 'clue') { if (p.K.kind === 'photo') Enhancer.open(p.caseId, p.cid, p.x, p.y); else { Cases.found(p.caseId, p.cid); } return; }
    if (p.kind === 'pickup') { Game.give(p.item, 1); Game.toast('Got: ' + ITEM[p.item].name + '. ' + (ITEM[p.item].note || ''), 'good'); World.questProps(); return; }
    if (p.kind === 'closet') { Hud.tab = 'gear'; Hud.toggle('pack'); return; }
    if (p.kind === 'elevator') { Hud.toggle('elevator'); return; }
    if (p.kind === 'exit') { Game.go(p.to[0], p.to[1]); return; }
  },
  finish(p) { p.done = true; Game.s.done[p.id] = 1; p.spr = null; Save.write(); },
};
