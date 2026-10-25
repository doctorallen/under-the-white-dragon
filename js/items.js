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

// Mods: one per slot. load: how much of your nervous system it takes.
const MODS = {
  lowlight: { slot: 'Optics', name: 'Lowlight optics', load: 1, cost: { cr: 80, glass: 2, chips: 1 }, note: 'See in the dark, and see the salvage hidden in walls.' },
  spring: { slot: 'Legs', name: 'Spring legs', load: 2, cost: { cr: 140, alloy: 4, coolant: 2 }, note: 'A second jump in the air.' },
  mantis: { slot: 'Arms', name: 'Mantis blades', load: 3, cost: { cr: 220, alloy: 4, chips: 2, wire: 3 }, note: 'Twice the damage. Cuts reinforced shutters, and cuts everything faster.' },
};
const MOD_ORDER = Object.keys(MODS);

// Programs: on the deck, run for RAM.
const PROGRAMS = {
  breach: { name: 'Breach', ram: 1, note: 'Opens locked doors and hatches. Stuns a drone for a moment.' },
  ghost: { name: 'Ghost', ram: 2, note: 'Cameras, drones and guards lose you for six seconds.' },
  puppet: { name: 'Puppet', ram: 2, note: 'The nearest drone fights for you for twelve seconds.' },
};
const PROGRAM_ORDER = Object.keys(PROGRAMS);

// Jobs from Juno, the fixer at the bar on the Stack: she trades in leads,
// and leads cost favours.
const JOBS = [
  { id: 'coolant', title: 'Cold hands', text: 'Leads cost, detective. Bring me three coolant. The cars down on street level are full of it, if you can get down there.', need: { coolant: 3 }, reward: { cr: 150 } },
  { id: 'drones', title: 'Clear the walkway', text: 'Block drones keep buzzing my customers on the upper walkway. Take down four of them.', kills: { drone: 4 }, reward: { cr: 120, chips: 1, gear: 'shades' } },
  { id: 'clinic', title: 'House call', after: ['coolant', 'drones'], text: 'One of your synths came through a back-alley clinic on street level two nights ago. Its terminal remembers. Jack in and bring me the record.', story: 'The record: a woman, no ID, paid cash to have a serial cut out of her wrist. She asked the way to the subway.', flag: 'clinicData', reward: { cr: 200, booster: true, gear: 'tracer' } },
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
  armtrench: { slot: 'outer', name: 'Armoured trench', rarity: 'rare', armor: 18, look: { coat: 'long', top: '#34343c', collar: true, plates: true }, note: 'Ceramic plates sewn into the lining.' },
  // inner torso
  shirt: { slot: 'inner', name: 'Work shirt', rarity: 'common', armor: 1, look: { shirt: '#8a8a84' }, note: 'Pressed, once.' },
  mesh: { slot: 'inner', name: 'Mesh vest', rarity: 'uncommon', armor: 8, look: { shirt: '#3a4a3a' }, note: 'Gang issue. Stops a knife, nearly.' },
  ballistic: { slot: 'inner', name: 'Ballistic vest', rarity: 'rare', armor: 14, look: { shirt: '#2a2a30' }, note: 'Stops a bolt, mostly.' },
  // legs
  slacks: { slot: 'legs', name: 'Old slacks', rarity: 'common', armor: 2, look: { legs: '#26262c' }, note: 'Good for sitting in a car all night.' },
  cargo: { slot: 'legs', name: 'Cargo pants', rarity: 'uncommon', armor: 5, look: { legs: '#3a3a2a' }, note: 'Pockets for everything you strip.' },
  plated: { slot: 'legs', name: 'Plated trousers', rarity: 'rare', armor: 10, look: { legs: '#2a2e38' }, note: 'Kevlar knees.' },
  // feet
  boots: { slot: 'feet', name: 'Worn boots', rarity: 'common', armor: 2, look: { boots: '#161214' }, note: 'Resoled twice.' },
  grips: { slot: 'feet', name: 'Grip runners', rarity: 'rare', armor: 3, look: { boots: '#e8e8f0' }, perk: { speed: 0.12 }, note: 'Soles that bite on wet steel.' },
  // weapons
  blaster: { slot: 'ranged', name: 'Precinct blaster', rarity: 'common', dmg: 16, shots: 6, cd: 0.28, bolt: [255, 170, 70], note: 'Six shots, then it needs a moment.' },
  heavy: { slot: 'ranged', name: 'Heavy blaster', rarity: 'rare', dmg: 30, shots: 4, cd: 0.45, bolt: [255, 90, 50], look: { blasterCol: '#ff5a32' }, note: 'Four big shots. Slow to cycle.' },
  tracer: { slot: 'ranged', name: 'Tracer pistol', rarity: 'epic', dmg: 13, shots: 10, cd: 0.16, bolt: [58, 240, 224], look: { blasterCol: '#3af0e0' }, note: 'Ten quick shots that find their mark.' },
  baton: { slot: 'melee', name: 'Shock baton', rarity: 'uncommon', strike: 20, look: { bladeCol: '#5aa8ff' }, note: 'A gang enforcer\'s. It still bites.' },
  katana: { slot: 'melee', name: 'Mono-katana', rarity: 'epic', strike: 34, look: { bladeCol: '#ff4ab0' }, note: 'An edge one molecule thick.' },
};
// what the detective owns and wears on day one
const GEAR_START = { head: 'fedora', outer: 'trench', inner: 'shirt', legs: 'slacks', feet: 'boots', ranged: 'blaster' };
// what the vendors sell, and for how much
const SHOP = {
  Kit: { beanie: 30, mask: 90, bomber: 160, cargo: 110 },
  Ozu: { heavy: 380, ballistic: 300, plated: 240, grips: 320, armtrench: 420, katana: 600 },
};
