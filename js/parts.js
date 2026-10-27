'use strict';
// ---------------------------------------------------------------------------
// Parts, the things they go into, and the notebook. A part has a kind (a
// cell, a servo), a grade (scrap, street, clinic, Meridian), a state (fine,
// worn, dead, burnt), sometimes a gauge, and where it came from and how: a
// Meridian servo taken from a clinic cabinet carries a serial, and a serial is
// evidence. A device is a frame with slots, laid out for the bench (in bench
// pixels, the device's own top left at 0, 0). The notebook remembers how the
// things you've opened are built and what you found wrong with them.
// ---------------------------------------------------------------------------
const PART = {
  cell: { name: 'Power cell', col: ['#14301e', '#3ac86a', '#b8ffc8'], took: 'a power cell' },
  board: { name: 'Control board', col: ['#0e1a14', '#2a3a30', '#7a9a80'], took: 'a control board' },
  aerial: { name: 'Aerial coil', col: ['#4a1e0a', '#c87a3a', '#ffd0a0'], took: 'an aerial coil' },
  servo: { name: 'Servo', col: ['#22262e', '#6a7280', '#c8d0dc'], took: 'a servo' },
  relay: { name: 'Relay', col: ['#0e1a3a', '#3a5ac8', '#b8c8ff'], took: 'a relay' },
};
const GRADE = {
  scrap: { name: 'Scrap', col: '#c89a6a', note: 'Cheap, tired, and it might give out.' },
  street: { name: 'Street', col: '#b8c0d0', note: 'Ordinary parts from an ordinary stall.' },
  clinic: { name: 'Clinic', col: '#7ae8d8', note: 'Clean, and made to a fine tolerance.' },
  military: { name: 'Meridian', col: '#ff6a7a', note: 'Strong, and every one carries a serial.', trace: true },
};
const PART_STATE = { ok: 'fine', worn: 'worn', dead: 'dead', burnt: 'burnt' };
// what the probe reads, by kind and state
const PROBE = {
  cell: { ok: '4.1 volts, steady under load. A good cell.', worn: '3.2 volts, and it sags under load. Tired, but it\'ll run.', dead: '0.0 volts. Flat, and it won\'t take a charge.', burnt: 'The casing\'s swollen. Don\'t charge that.' },
  board: { ok: 'Continuity on every trace. The board\'s fine.', worn: 'A couple of traces read high. It\'ll do.', dead: 'Nothing past the regulator. The board\'s dead.', burnt: 'A trace is open, burnt clean through by the regulator.' },
  aerial: { ok: 'A clean signal off the coil.', worn: 'Signal, faint and noisy.', dead: 'No signal at all.', burnt: 'No signal: the coil\'s burnt open.' },
  servo: { ok: 'It turns clean and holds its torque.', worn: 'It grinds. The gears are chewed, but it turns.', dead: 'Seized solid. It draws power and goes nowhere.', burnt: 'The windings are burnt. It smells of it.' },
  relay: { ok: 'It clicks over clean.', worn: 'It clicks, mostly.', dead: 'It won\'t click.', burnt: 'The contacts are welded shut.' },
};
// how a part got to you, for its history line
const HOW = { strip: 'stripped', trade: 'bought', take: 'taken', gift: 'given', pull: 'pulled' };

// The things that come to the bench. Each slot: the kind it takes, a gauge if
// it's particular, and its box on the board.
const DEVICE = {
  navunit: {
    name: 'Cab nav unit', kind: 'Handheld', w: 150, h: 92, col: ['#1a1e26', '#3a4250', '#7a8494'],
    screws: [[9, 9], [141, 9], [9, 83], [141, 83]],
    slots: {
      board: { kind: 'board', x: 22, y: 20, w: 44, h: 30 },
      cell: { kind: 'cell', x: 84, y: 22, w: 46, h: 16 },
      aerial: { kind: 'aerial', x: 30, y: 62, w: 52, h: 12 },
    },
  },
  arm: {
    name: 'Synth forearm', kind: 'Limb', w: 166, h: 72, col: ['#2a2224', '#6a5a5a', '#c8b8b0'], led: [136, 58],
    screws: [[9, 10], [58, 7], [108, 7], [157, 12], [9, 62], [83, 66], [157, 60]],
    slots: {
      servo: { kind: 'servo', x: 14, y: 18, w: 34, h: 34, gauge: 'heavy' },
      board: { kind: 'board', x: 64, y: 22, w: 34, h: 26 },
      cell: { kind: 'cell', x: 114, y: 26, w: 38, h: 16 },
    },
  },
};

// what a stall sells: [kind, grade, price, gauge, a line about it]
const PART_STOCK = {
  ana: [['cell', 'street', 25], ['aerial', 'street', 30], ['board', 'street', 45], ['relay', 'street', 20]],
  kade: [['servo', 'scrap', 80, 'heavy', 'Refurbished. It\'s been in three arms already. It might have one more in it.'], ['servo', 'clinic', 70, 'light', 'Clinic grade, light gauge: made for a nurse\'s hand, not a soldier\'s.'], ['cell', 'clinic', 40]],
};
// what stripping a machine gets you, besides salvage: one tired part
const PART_YIELD = { vending: 'cell', car: 'aerial', ac: 'relay', rack: 'board', wreck: 'board', junk: 'cell' };
// what the machines residents tip you off about hold: [kind, grade, gauge, chance]
const TIP_YIELD = {
  dronewreck: [['aerial', 'street'], ['board', 'street', null, 0.6]],
  substation: [['relay', 'street'], ['relay', 'street', null, 0.5], ['cell', 'street', null, 0.5]],
  autodoc: [['servo', 'clinic', 'heavy'], ['cell', 'clinic', null, 0.7]],
};

// the everyday things the block's residents bring in (jobs.js, ODD)
Object.assign(DEVICE, {
  radio: { name: 'Kitchen radio', kind: 'Handheld', face: 'radio', w: 132, h: 80, col: ['#3a2418', '#7a5236', '#b88a5a'],
    screws: [[8, 8], [124, 8], [8, 72], [124, 72]],
    slots: { board: { kind: 'board', x: 16, y: 16, w: 40, h: 26 }, relay: { kind: 'relay', x: 72, y: 18, w: 26, h: 14 }, aerial: { kind: 'aerial', x: 66, y: 52, w: 50, h: 12 }, cell: { kind: 'cell', x: 16, y: 54, w: 36, h: 14 } } },
  cooker: { name: 'Rice cooker', kind: 'Fixture', face: 'cooker', w: 116, h: 84, col: ['#8a8478', '#d8d0c0', '#f4eee2'],
    screws: [[10, 10], [106, 10], [58, 76]],
    slots: { relay: { kind: 'relay', x: 18, y: 20, w: 30, h: 16 }, board: { kind: 'board', x: 62, y: 18, w: 38, h: 26 }, cell: { kind: 'cell', x: 32, y: 54, w: 44, h: 14 } } },
  toydrone: { name: 'Toy drone', kind: 'Drone', face: 'drone', w: 146, h: 70, col: ['#8a3a10', '#e8702a', '#ffb070'],
    screws: [[10, 10], [136, 10], [10, 60], [136, 60]],
    slots: { cell: { kind: 'cell', x: 14, y: 28, w: 30, h: 14 }, board: { kind: 'board', x: 56, y: 22, w: 36, h: 26 }, aerial: { kind: 'aerial', x: 104, y: 30, w: 30, h: 10 } } },
  fan: { name: 'Desk fan', kind: 'Fixture', face: 'fan', w: 124, h: 80, col: ['#2a3a44', '#5a7a88', '#9ac0cc'],
    screws: [[8, 8], [116, 8], [8, 72], [116, 72]],
    slots: { relay: { kind: 'relay', x: 16, y: 18, w: 28, h: 16 }, board: { kind: 'board', x: 58, y: 16, w: 46, h: 28 }, cell: { kind: 'cell', x: 30, y: 54, w: 44, h: 14 } } },
});

const Parts = {
  make(k, g, o = {}) { const s = Game.s; s.pid = (s.pid || 1) + 1; return Object.assign({ id: s.pid, k, g, st: 'ok', from: World.L ? World.L.id : 'd_dragon', how: 'strip' }, o); },
  give(p, quiet) { Game.s.parts.push(p); if (!quiet) Game.toast('Onto the shelf: ' + this.name(p) + '.', 'good'); return p; },
  take(id) { const s = Game.s, i = s.parts.findIndex((p) => p.id === id); return i < 0 ? null : s.parts.splice(i, 1)[0]; },
  have(k) { return Game.s.parts.filter((p) => p.k === k); },
  name(p) { return GRADE[p.g].name + ' ' + PART[p.k].name.toLowerCase(); },
  // where it's from: "bought at the Overpass Market"
  from(p) { const L = LEVELS[p.from]; return (HOW[p.how] || 'found') + (p.how === 'pull' ? ' from ' + (p.out || 'a job') : L ? (p.how === 'trade' ? ' at ' : ' in ') + L.name : ''); },
  // what the probe reads in a slot (a part that fits badly says so)
  reading(p, slot) {
    let r = PROBE[p.k][p.st];
    if (slot && slot.gauge && p.gauge !== slot.gauge && p.st !== 'dead' && p.st !== 'burnt') r += ` But it's ${p.gauge || 'light'} gauge in a ${slot.gauge} mount: it'll strain.`;
    return r;
  },
  // a part from a machine you've stripped: scrap, and maybe worn
  // (better tools get them out cleaner: with the precision kit, a rack's board
  // and some of the rest come out street grade)
  strip(p) {
    const T = TIP_YIELD[p.kind];
    if (T) return T.filter(([, , , ch], i) => !ch || hash(p.x, i, 78) < ch).map(([k, g, gauge]) => this.give(this.make(k, g, gauge ? { gauge } : {}), true));
    const k = PART_YIELD[p.kind]; if (!k) return [];
    const t = Tips.tier(), g = p.kind === 'rack' || (t >= 2 && hash(p.x, p.y, 79) < 0.4) ? 'street' : 'scrap';
    return [this.give(this.make(k, g, { st: hash(p.x, p.y, 77) < (t >= 2 ? 0.9 : 0.7) ? 'ok' : 'worn' }), true)];
  },
  // a part's picture, as on the bench (made once a kind and grade)
  icons: {},
  icon(k, g = 'street') { const key = k + g; if (this.icons[key]) return this.icons[key]; const [c, x] = canvasOf(40, 24); partArt(x, { id: 3, k, g, st: 'ok' }, 2, 4, 36, 16, false, 0); return (this.icons[key] = c.toDataURL()); },
  // where to get a kind of part (of a gauge, if it's particular): the stalls
  // that sell it, the machines that give it, and the one place you shouldn't
  sources(k, gauge) {
    const out = [], WHO = { ana: 'Mechanic Ana, Overpass Market', kade: 'Nurse Kade, Clinic Row' };
    for (const s in PART_STOCK) for (const [kk, g, cr, ga] of PART_STOCK[s]) if (kk === k && (!gauge || ga === gauge)) out.push(`${WHO[s]}: ${GRADE[g].name.toLowerCase()}, ${cr} cr`);
    const strip = Object.keys(PART_YIELD).filter((m) => PART_YIELD[m] === k);
    if (strip.length && !gauge) out.push('strip a ' + strip.map((m) => ({ vending: 'vending machine', car: 'parked car', ac: 'air conditioner', rack: 'server rack', wreck: 'wreck', junk: 'junk pile' }[m] || m)).join(' or ') + ' (scrap)');
    for (const m in TIP_YIELD) if (TIP_YIELD[m].some(([kk, , ga]) => kk === k && (!gauge || ga === gauge))) out.push(`a ${({ dronewreck: 'crashed drone', substation: 'junction box', autodoc: 'dumped autodoc' })[m]}, if someone tips you off (${TOOLS[STRIP_TIER[m]].name.toLowerCase()})`);
    if (k === 'servo' && gauge === 'heavy') out.push('the parts cabinet on Clinic Row: Meridian, taken (heat)');
    return out;
  },
  // ---- the notebook ----
  knows(dev) { return !!Game.s.notes.known[dev]; },
  learn(dev) { if (this.knows(dev)) return; Game.s.notes.known[dev] = 1; Game.toast('Notebook: how a ' + DEVICE[dev].name.toLowerCase() + ' is put together.', 'good'); },
  jot(key, text) { const n = Game.s.notes; if (n.log.some((e) => e.key === key)) return; n.log.unshift({ key, text, day: Game.s.day }); },
  // a device's build, as the notebook writes it
  build(dev) { const D = DEVICE[dev]; return Object.keys(D.slots).map((k) => { const S = D.slots[k]; return PART[S.kind].took + (S.gauge ? ' (' + S.gauge + ' gauge)' : ''); }); },
};
