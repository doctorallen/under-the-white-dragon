'use strict';
// ---------------------------------------------------------------------------
// Props in play: what each kind looks like and what Use does with it.
// Stripping is held (a bar fills); the rest happen on a tap. A prop that's
// been stripped is `done`, and that's kept in the save by its id.
// ---------------------------------------------------------------------------
const PROP_ART = {
  vending: (p) => vending(p.look || {}), ac: () => acUnit(), rack: (p) => rack({ h: 40, seed: p.x, warn: true }), car: (p) => car(p.look || {}),
  junk: (p) => junk({ seed: p.x % 7 }), wreck: () => wreck(),
  register: (p) => cashRegister(p), dryer: (p) => handDryer(p), jukebox: () => jukebox(), arcadecab: (p) => arcadeCab({ col: p.col, body: p.body, seed: p.x }), pachinko: () => pachinko(), coffee: (p) => coffeeMachine(p), atm: () => atm(), ticket: () => ticketMachine(), karaoke: () => karaoke(), offering: () => offeringBox(), dronewreck: () => droneWreck(), substation: () => junctionBox(), autodoc: () => autodoc(), door: (p) => (p.out ? innerDoor({ kind: p.look, seed: p.x }) : null), workbench: () => workbench(), trapdoor: (p) => (p.up ? null : rug()), cabinet: (p) => medCabinet(p.done), shelf: () => partsShelf(), bed: () => bed(), transit: (p) => (p.mode === 'spinner' ? cabStand() : p.mode === 'subway' ? subwayDoor() : p.mode === 'hatch' ? manholeLadder() : p.mode === 'manhole' ? manholeCover() : elevatorCage({ on: true })),
  deco: (p) => p.art(),
};
// what each kind gives when stripped: [item, min, max]
const YIELDS = {
  vending: [['wire', 1, 2], ['glass', 1, 1], ['cr', 3, 12]], ac: [['alloy', 1, 2], ['coolant', 0, 1]], rack: [['chips', 1, 2], ['wire', 1, 2]],
  car: [['coolant', 1, 2], ['alloy', 1, 2], ['wire', 0, 1]], junk: [['alloy', 1, 2], ['wire', 0, 1]], wreck: [['chips', 0, 1], ['glass', 1, 1], ['wire', 1, 1]],
  dronewreck: [['wire', 1, 2], ['chips', 0, 1]], register: [['cr', 8, 24], ['wire', 0, 1]], dryer: [['wire', 1, 1]], jukebox: [['wire', 1, 2], ['glass', 0, 1]], arcadecab: [['wire', 1, 1], ['glass', 1, 1]], pachinko: [['alloy', 1, 2], ['cr', 2, 9]], coffee: [['alloy', 1, 1]], atm: [['cr', 20, 45], ['chips', 0, 1]], ticket: [['cr', 3, 10]], karaoke: [['wire', 1, 2]], offering: [['cr', 4, 16]], substation: [['wire', 2, 3], ['alloy', 1, 1]], autodoc: [['chips', 1, 2], ['glass', 1, 1]],
};
const RESTOCK = { junk: 3, vending: 5, car: 4, register: 6, dryer: 6, jukebox: 6, arcadecab: 6, pachinko: 6, coffee: 6, atm: 8, ticket: 6, karaoke: 6, offering: 2 };
// what's someone's: stripping it is theft, and it's heat (more if anyone sees)
const OWNED = { vending: 3, car: 3, register: 6, dryer: 2, jukebox: 5, arcadecab: 4, pachinko: 4, coffee: 3, atm: 10, ticket: 3, karaoke: 4, offering: 6 };
const STRIP_TIME = { register: 1.4, dryer: 0.9, jukebox: 2.0, arcadecab: 1.8, pachinko: 1.6, coffee: 1.1, atm: 3.0, ticket: 1.4, karaoke: 1.6, offering: 0.8, dronewreck: 1.8, substation: 2.0, autodoc: 2.6, vending: 1.6, ac: 1.2, rack: 1.8, car: 2.4, junk: 1.0, wreck: 1.0 };

const Props = {
  init(p) { p.spr = null; },
  sprite(p) {
    if (p.spr && p.sprDone === p.done) return p.spr;
    const art = PROP_ART[p.kind]; let s = art ? art(p) : null;
    if (s && p.done && YIELDS[p.kind]) s = stripped(s);
    if (s && p.flip) s = flipSprite(s);
    p.spr = s; p.sprDone = p.done; return s;
  },
  // can Use reach it, and what would it do (a prompt), or null
  prompt(p) {
    if (p.kind === 'deco') return null;
    if (YIELDS[p.kind]) return p.done ? null : Tips.canStrip(p.kind) ? { verb: 'Strip', text: 'Strip ' + (p.label || p.kind) + (OWNED[p.kind] ? ' · someone\'s: heat' : ''), hold: STRIP_TIME[p.kind] } : { verb: 'Strip', text: (p.label || p.kind)[0].toUpperCase() + (p.label || p.kind).slice(1) + ': it needs the ' + Tips.need(p.kind).name.toLowerCase(), tap: true, no: true };
    if (p.kind === 'bed') return { verb: 'Sleep', text: p.label || 'Your cot', tap: true };
    if (p.kind === 'workbench') return { verb: 'Work', text: 'Your bench', tap: true };
    if (p.kind === 'door' && !p.to) return { verb: p.home ? 'Knock' : 'Look', text: Census.doorText(p), tap: true }; // (homes, and the doors the city goes in and out of: census.js)
    if (p.kind === 'door') { if (p.hours && !Props.openNow(p.hours)) return { verb: 'Closed', text: `${p.label}: opens at ${String(p.hours[0]).padStart(2, '0')}:00`, tap: true, no: true }; return p.out ? { verb: 'Leave', text: p.label, tap: true } : { verb: 'Enter', text: p.label, tap: true }; }
    if (p.kind === 'trapdoor') return p.up ? { verb: 'Climb', text: 'Up the ladder, into the storeroom', tap: true } : { verb: 'Climb down', text: 'The rug, and the trapdoor under it', tap: true };
    if (p.kind === 'cabinet') return p.done ? null : { verb: 'Jimmy', text: 'A locked parts cabinet: Meridian stock', hold: 1.6 };
    if (p.kind === 'shelf') return { verb: 'Look', text: 'The parts shelf', tap: true };
    if (p.kind === 'transit' && p.mode === 'spinner') { const f = Flight.cabFare(); return { verb: 'Hail', text: f ? `A cab: ${f} cr a ride` : 'Ozzy\'s cab: free', tap: true }; }
    if (p.kind === 'transit') return { verb: p.mode === 'spinner' ? 'Fly' : p.mode === 'hatch' ? 'Climb' : p.mode === 'manhole' ? 'Climb down' : 'Ride', text: p.mode === 'spinner' ? 'Your spinner' : p.mode === 'subway' ? 'The subway' : p.mode === 'hatch' ? 'The ladder up to the street' : p.mode === 'manhole' ? 'The manhole, down into the undercity' : 'The cage elevator', tap: true };
    return null;
  },
  // Use, done: on a tap, or when a held bar fills
  use(p) {
    if (YIELDS[p.kind]) {
      // what came out of it, a line each: "+1 coil  scrap", "+2 wire", "+12 cr"
      const got = [];
      for (const [item, a, b] of YIELDS[p.kind]) { const n = a + Math.floor(hash(p.x, p.y, item.length + Game.s.day) * (b - a + 1)); if (n <= 0) continue; if (item === 'cr') { Game.s.cr += n; got.push({ n, name: 'cr', kind: 'cr' }); } else { const took = Game.give(item, n); if (took) got.push({ n: took, name: SALVAGE[item].name.toLowerCase() }); } }
      for (const part of Parts.strip(p)) got.push({ n: 1, name: PART[part.k].name.toLowerCase(), tag: [GRADE[part.g].name.toLowerCase(), part.gauge, part.st === 'worn' ? 'worn' : ''].filter(Boolean).join(', '), icon: Parts.icon(part.k, part.g) });
      this.finish(p); Fx.sparks(p.x, p.y - 8, 10); Game.s.flags.stripped = 1;
      snd('strip', { x: p.x, y: p.y - 8 }); if (got.some((g) => g.icon)) snd('part'); // (and the coins: music.js hears the money)
      if (got.length) Game.gain(p.x, p.y - 28, got); else Game.toast('Nothing worth taking.');
      if (OWNED[p.kind]) { const seen = City.witnesses(p).length > 0; Jobs.heat(OWNED[p.kind] + (seen ? 4 : 0), seen ? 'Somebody saw you do it.' : 'That was somebody\'s.'); City.strip(p); }
      return;
    }
    if (p.kind === 'bed') { Hud.toggle('bed'); return; }
    if (p.kind === 'workbench') { Bench.open(); return; }
    if (p.kind === 'door' && !p.to) { if (p.home) snd('knock'); Game.toast(Census.doorUse(p)); return; }
    if (p.kind === 'trapdoor' || p.kind === 'door') { snd(p.kind === 'trapdoor' ? 'trapdoor' : 'door', { look: sndDoorLook(p) }); Game.go(p.to[0], p.to[1]); return; }
    if (p.kind === 'cabinet') {
      this.finish(p); Fx.sparks(p.x, p.y - 20, 6); snd('jimmy');
      Parts.give(Parts.make('servo', 'military', { gauge: 'heavy', how: 'take' }));
      Jobs.heat(15, 'Meridian counts its stock.'); return;
    }
    if (p.kind === 'shelf') { Hud.toggle('shelf'); return; }
    if (p.kind === 'transit') { Hud.mode = p.mode; Hud.toggle('travel'); return; }
  },
  finish(p) { p.done = true; Game.s.done[p.id] = RESTOCK[p.kind] ? Game.s.day : 1; p.spr = null; Save.write(); },
  // a door's hours [open, close], round midnight or not
  openNow([a, b], h = Game.hour()) { return a < b ? h >= a && h < b : h >= a || h < b; },
  // is it still done? Junk piles, vending machines and parked cars come back:
  // new junk, a restocked machine, another car (RESTOCK, in days)
  isDone(p) { const d = Game.s.done[p.id]; return !!d && !(RESTOCK[p.kind] && Game.s.day - d >= RESTOCK[p.kind]); },
};
