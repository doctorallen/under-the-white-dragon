'use strict';
// ---------------------------------------------------------------------------
// What there is to find, wire in and do: salvage, mods, programs, jobs.
// ---------------------------------------------------------------------------
// Salvage: what machines are made of. price: what a vendor pays for one.
const SALVAGE = {
  wire: { name: 'Copper wire', price: 4, col: ['#6a2e0e', '#d8823a', '#ffc080'] },
  alloy: { name: 'Scrap alloy', price: 3, col: ['#3a4048', '#7a8490', '#c8d0d8'] },
  glass: { name: 'Optic glass', price: 6, col: ['#0e3a44', '#3ab8c8', '#c8fbff'] },
  coolant: { name: 'Coolant', price: 8, col: ['#0e3a2a', '#3ad88a', '#c8ffe0'] },
  chips: { name: 'Rare-earth chips', price: 14, col: ['#2a1a3a', '#a85ad8', '#f0c8ff'] },
};
const SALVAGE_ORDER = Object.keys(SALVAGE);

// Gadgets: implants are illegal in this city, so a detective carries tools
// instead. The precinct's quartermaster builds them; once yours, they work.
const GADGETS = {
  scanner: { name: 'Spectral lenses', kind: 'Goggles', cost: { cr: 80, glass: 2, chips: 1 }, note: 'See in the dark, and see the salvage hidden in walls.' },
  jets: { name: 'Jump jets', kind: 'Boots', cost: { cr: 140, alloy: 4, coolant: 2 }, note: 'Thrusters on your heels: a second jump in the air.' },
  cutter: { name: 'Plasma cutter', kind: 'Tool', cost: { cr: 220, alloy: 4, chips: 2, wire: 3 }, note: 'Cuts reinforced shutters, and cuts everything faster. A blow with it hits much harder.' },
};
const GADGET_ORDER = Object.keys(GADGETS);

// Programs: on the deck, run for RAM.
const PROGRAMS = {
  breach: { name: 'Breach', ram: 1, note: 'Opens locked doors and hatches. Stuns a drone for a moment.' },
  ghost: { name: 'Ghost', ram: 2, note: 'Cameras, drones and guards lose you for six seconds.' },
  puppet: { name: 'Puppet', ram: 2, note: 'The nearest drone fights for you for twelve seconds.' },
};
const PROGRAM_ORDER = Object.keys(PROGRAMS);

// Cases from Lieutenant Hale at the precinct. Implants are illegal; the
// precinct hunts the chrome, and the four synths.
const JOBS = [
  { id: 'drones', title: 'Clear the walkway', text: 'Somebody\'s hacked the block drones on the Stack\'s upper walkway and they\'re buzzing civilians. Take down four.', kills: { drone: 4 }, reward: { cr: 120, chips: 1, gear: 'shades' } },
  { id: 'chrome', title: 'Chrome warrant', text: 'The gang on street level runs illegal implants out of their turf. Anyone carrying chrome is under arrest, or under the ground. Bring three of them down.', kills: { gang: 3 }, reward: { cr: 180, gear: 'armtrench' } },
  { id: 'clinic', title: 'House call', after: ['drones', 'chrome'], text: 'One of your synths came through a back-alley chop clinic on street level two nights ago. Its terminal remembers. Jack in and bring me the record.', story: 'The record: a woman, no ID, paid cash to have a serial cut out of her wrist. She asked the way to the subway.', flag: 'clinicData', reward: { cr: 200, gear: 'tracer' } },
];

// Gear: what you wear and carry, slot by slot. Rarity is the colour of its
// frame; armour takes a share off every hit; a few pieces have a perk.
// `look` is how it changes the runner's sprite (people.js options).
const RARITY = {
  common: { name: 'Common', col: '#a8a8b4' }, uncommon: { name: 'Uncommon', col: '#5ad86a' }, rare: { name: 'Rare', col: '#40a8ff' },
  epic: { name: 'Epic', col: '#c060ff' }, legendary: { name: 'Legendary', col: '#ffb030' },
};
const SLOTS = { head: 'Head', face: 'Face', outer: 'Outer torso', inner: 'Inner torso', legs: 'Legs', feet: 'Feet', ranged: 'Ranged', melee: 'Melee' };
const SLOT_ORDER = Object.keys(SLOTS);
const PERKS = { speed: (v) => `Runs ${Math.round(v * 100)}% faster`, recharge: (v) => `Blaster recharges ${Math.round(v * 100)}% faster`, ram: (v) => `RAM comes back ${Math.round(v * 100)}% faster`, strike: (v) => `Blows hit ${v} harder` };
const GEAR = {
  // head
  fedora: { slot: 'head', name: 'Precinct fedora', rarity: 'common', armor: 2, look: { hat: 'fedora', hatCol: '#3a3028' }, note: 'Keeps the rain off your face. Mostly.' },
  beanie: { slot: 'head', name: 'Knit cap', rarity: 'common', armor: 1, look: { hair: 'cap', capCol: '#2a3a4a' }, note: 'Warm, cheap, forgettable.' },
  helmet: { slot: 'head', name: 'Riot helmet', rarity: 'rare', armor: 16, look: { hair: 'helmet', armor: '#4a4e58', visor: '#ffb040' }, note: 'Pulled off the Warden. It still smells of hydraulic oil.' },
  // face
  shades: { slot: 'face', name: 'Rain visor', rarity: 'uncommon', armor: 2, look: { shades: '#3af0e0' }, perk: { recharge: 0.15 }, note: 'A wraparound band. Feeds your aim into the blaster.' },
  mask: { slot: 'face', name: 'Filter mask', rarity: 'uncommon', armor: 4, look: { mask: '#2a2a30' }, note: 'For the air below the Stack.' },
  lenses: { slot: 'face', name: 'Tracer lenses', rarity: 'epic', armor: 3, look: { shades: '#ff4ab0' }, perk: { ram: 0.4 }, note: 'Old precinct issue. They take load off your deck.' },
  // outer torso
  trench: { slot: 'outer', name: 'Precinct trench', rarity: 'common', armor: 6, look: { coat: 'long', top: '#5e4c38', collar: true }, note: 'The coat. Every detective has one; yours has been rained on for nine years.' },
  bomber: { slot: 'outer', name: 'Neon bomber', rarity: 'uncommon', armor: 10, look: { coat: 'jacket', top: '#2a2438', collar: true, trim: true, acc: '#ff4ab0' }, note: 'Lit seams. Nobody will mistake you for a cop.' },
  armtrench: { slot: 'outer', name: 'Armoured trench', rarity: 'rare', armor: 18, look: { coat: 'long', top: '#34343c', collar: true, plates: true, acc: '#ffb040' }, note: 'Ceramic plates sewn into the lining.' },
  // inner torso
  shirt: { slot: 'inner', name: 'Work shirt', rarity: 'common', armor: 1, look: { shirt: '#8a8a84' }, note: 'Pressed, once.' },
  mesh: { slot: 'inner', name: 'Mesh vest', rarity: 'uncommon', armor: 8, look: { shirt: '#3a4a3a', vest: '#4a5a3a' }, note: 'Gang issue. Stops a knife, nearly.' },
  ballistic: { slot: 'inner', name: 'Ballistic vest', rarity: 'rare', armor: 14, look: { shirt: '#2a2a30', vest: '#3a3e4a', vestLight: '#3af0e0' }, note: 'Stops a bolt, mostly.' },
  // legs
  slacks: { slot: 'legs', name: 'Old slacks', rarity: 'common', armor: 2, look: { legs: '#26262c' }, note: 'Good for sitting in a car all night.' },
  cargo: { slot: 'legs', name: 'Cargo pants', rarity: 'uncommon', armor: 5, look: { legs: '#4a4a32', pockets: true }, note: 'Pockets for everything you strip.' },
  plated: { slot: 'legs', name: 'Plated trousers', rarity: 'rare', armor: 10, look: { legs: '#2a2e38', kneePad: '#5a6070' }, note: 'Kevlar knees.' },
  // feet
  boots: { slot: 'feet', name: 'Worn boots', rarity: 'common', armor: 2, look: { boots: '#161214' }, note: 'Resoled twice.' },
  grips: { slot: 'feet', name: 'Grip runners', rarity: 'rare', armor: 3, look: { boots: '#d8d8e0', soles: '#3af0e0' }, perk: { speed: 0.12 }, note: 'Soles that bite on wet steel.' },
  // weapons
  blaster: { slot: 'ranged', name: 'Precinct blaster', rarity: 'common', dmg: 16, shots: 6, cd: 0.28, bolt: [255, 170, 70], note: 'Six shots, then it needs a moment.' },
  heavy: { slot: 'ranged', name: 'Heavy blaster', rarity: 'rare', dmg: 30, shots: 4, cd: 0.45, bolt: [255, 90, 50], look: { blasterCol: '#ff5a32', blasterBig: true }, note: 'Four big shots. Slow to cycle.' },
  tracer: { slot: 'ranged', name: 'Tracer pistol', rarity: 'epic', dmg: 13, shots: 10, cd: 0.16, bolt: [58, 240, 224], look: { blasterCol: '#3af0e0' }, note: 'Ten quick shots that find their mark.' },
  baton: { slot: 'melee', name: 'Shock baton', rarity: 'uncommon', strike: 20, look: { bladeCol: '#5aa8ff', sheath: 'baton', sheathCol: '#5aa8ff' }, note: 'A gang enforcer\'s. It still bites.' },
  katana: { slot: 'melee', name: 'Mono-katana', rarity: 'epic', strike: 34, look: { bladeCol: '#ff4ab0', sheath: 'katana', sheathCol: '#ff4ab0' }, note: 'An edge one molecule thick.' },
};
// what the detective owns and wears on day one
const GEAR_START = { head: 'fedora', outer: 'trench', inner: 'shirt', legs: 'slacks', feet: 'boots', ranged: 'blaster' };
// what the vendors sell, and for how much
const SHOP = {
  Kit: { beanie: 30, mask: 90, bomber: 160, cargo: 110 },
  Ozu: { heavy: 380, ballistic: 300, plated: 240, grips: 320, katana: 600 },
};

// The fabricator: Mags, at her stall in the Stack's market, makes gear from
// parts, upgrades it, breaks it down for parts, and sells parts at a markup.
// Short of parts when you make or upgrade something, you can buy what's
// missing from her at the same time.
const FAB = {
  markup: 2.5, maxLevel: 3, perLevel: 0.25, // each level adds a quarter of the piece's base stats
  make: {
    mask: { cr: 40, glass: 2, wire: 1 }, cargo: { cr: 50, alloy: 2, wire: 2 }, mesh: { cr: 60, alloy: 3, wire: 2 }, baton: { cr: 70, wire: 3, coolant: 1 },
    plated: { cr: 110, alloy: 4, wire: 2 }, ballistic: { cr: 140, alloy: 5, chips: 1, coolant: 1 }, grips: { cr: 150, alloy: 2, coolant: 2, chips: 1 },
    heavy: { cr: 180, alloy: 4, coolant: 2, chips: 2 }, armtrench: { cr: 200, alloy: 6, wire: 3 }, katana: { cr: 280, alloy: 5, chips: 3, glass: 1 },
  },
  rarityCost: { common: 1, uncommon: 1.5, rare: 2.2, epic: 3, legendary: 4 },
  // what taking a piece to the next level costs
  upgrade(id, lvl) {
    const G = GEAR[id], r = this.rarityCost[G.rarity], n = lvl + 1, c = { cr: Math.round(30 * r * n / 5) * 5 };
    if (G.slot === 'ranged') Object.assign(c, { chips: n, coolant: n });
    else if (G.slot === 'melee') Object.assign(c, { alloy: n + 1, chips: n });
    else if (G.slot === 'face') Object.assign(c, { glass: n + 1, chips: lvl });
    else Object.assign(c, { alloy: n + 1, wire: n });
    for (const k in c) if (!c[k]) delete c[k];
    return c;
  },
  // what breaking a piece down gives back: about half of what it took
  salvage(id, lvl) {
    const G = GEAR[id], base = this.make[id] || { common: { alloy: 2, wire: 1 }, uncommon: { alloy: 3, wire: 2 }, rare: { alloy: 4, chips: 1, wire: 2 }, epic: { alloy: 4, chips: 3, glass: 1 }, legendary: { chips: 5, alloy: 4 } }[G.rarity], out = {};
    for (const k in base) if (k !== 'cr') out[k] = Math.max(1, Math.round(base[k] / 2));
    for (let l = 0; l < lvl; l++) { const u = this.upgrade(id, l); for (const k in u) if (k !== 'cr') out[k] = (out[k] || 0) + Math.max(1, Math.round(u[k] / 2)); }
    return out;
  },
};
