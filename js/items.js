'use strict';
// ---------------------------------------------------------------------------
// What there is to find, carry, wear and do: salvage and the other things
// you carry (consumables, throwables, keys, evidence), gadgets, programs,
// gear and weapon mods, loot, shops and the fabricator. Cases and side
// work are in quests.js.
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

// Gear: what you wear and carry, slot by slot. Rarity is the colour of its
// frame; armour takes a share off every hit; a few pieces have a perk.
// `look` is how it changes the runner's sprite (people.js options).
const RARITY = {
  common: { name: 'Common', col: '#a8a8b4' }, uncommon: { name: 'Uncommon', col: '#5ad86a' }, rare: { name: 'Rare', col: '#40a8ff' },
  epic: { name: 'Epic', col: '#c060ff' }, legendary: { name: 'Legendary', col: '#ffb030' },
};
const SLOTS = { head: 'Head', face: 'Face', outer: 'Outer torso', inner: 'Inner torso', legs: 'Legs', feet: 'Feet', ranged: 'Ranged', melee: 'Melee' };
const SLOT_ORDER = Object.keys(SLOTS);
const PERKS = { speed: (v) => `Runs ${Math.round(v * 100)}% faster`, recharge: (v) => `Blaster recharges ${Math.round(v * 100)}% faster`, ram: (v) => `RAM comes back ${Math.round(v * 100)}% faster`, strike: (v) => `Blows hit ${v} harder`, stealth: (v) => `Enemies notice you ${Math.round(v * 100)}% closer`, regen: (v) => `Heals ${v} a second`, loot: (v) => `${Math.round(v * 100)}% more credits from the fallen` };
// More things you carry, by kind. All of them live in the pack by count.
// Consumables: used from the Item button (or the Items tab); `heal` restores
// health, `ram` RAM, `buff` lasts `dur` seconds (speed: faster, dmg: harder).
const CONSUMABLES = {
  noodlecup: { name: 'Noodle cup', price: 8, heal: 15, col: ['#5a1a0e', '#e8e0d0', '#d83a1a'], note: 'Just add hot water. Or don\'t.' },
  medpatch: { name: 'Med-patch', price: 25, heal: 35, col: ['#1a3a2a', '#e8f0e8', '#3ad88a'], note: 'Slaps on, knits you up.' },
  stim: { name: 'Reflex stim', price: 40, buff: { speed: 0.35 }, dur: 20, col: ['#0e2a3a', '#3af0e0', '#c8ffff'], note: 'Twenty seconds of quick feet.' },
};
// Throwables: thrown from the Item button in an arc. Frags hurt; EMPs stop
// machines and drop shields.
const THROWABLES = {
  frag: { name: 'Frag grenade', price: 40, dmg: 48, radius: 36, col: ['#1a2a1a', '#5a7a4a', '#c8e8a0'], note: 'Bounces once, then it doesn\'t.' },
  emp: { name: 'EMP charge', price: 45, stun: 4, radius: 48, emp: true, col: ['#0e1a3a', '#3a8aff', '#c8e0ff'], note: 'Drones, turrets and bots stop dead. Shields drop.' },
};
// Keys and passes: open the ways down. Evidence and quest items: for cases.
const KEYS = {
  subwaypass: { name: 'Transit pass', col: ['#0e2a3a', '#3ad8e8', '#c8ffff'], note: 'Opens the old subway gates. Hale signed it herself.' },
  mayorkey: { name: 'Mayor\'s key', col: ['#3a2a0e', '#d8a83a', '#fff0b0'], note: 'Brass, heavy, warm. Opens the lift down to the Works.' },
  workspass: { name: 'Works foreman\'s pass', col: ['#3a1a0e', '#ff8a3a', '#ffd8b0'], note: 'Opens the shaft below the Works.' },
  rootsigil: { name: 'Root sigil', col: ['#1a0e2a', '#a83aff', '#e8c8ff'], note: 'Something the city grew. It hums near data.' },
  spirepass: { name: 'Meridian access', col: ['#2a2a3a', '#e8e8ff', '#ffffff'], note: 'Gets a spinner through the Spires\' air lanes.' },
};
const EVIDENCE = {
  ticket: { name: 'Torn subway ticket', case: 'iris', note: 'Old Town line. Punched three days ago.' },
  bandage: { name: 'Clean bandage', case: 'iris', note: 'From a wrist. No blood on it: synths don\'t bleed like that.' },
  serial: { name: 'Cut serial plate', case: 'iris', note: 'Meridian Dynamics, unit IR-4. Pried out with a knife.' },
  roster: { name: 'Shift roster', case: 'bishop', note: 'One name on it works every shift. Nobody works every shift.' },
  badge: { name: 'Heat-scarred badge', case: 'bishop', note: 'Melted at the edges. The face on it hasn\'t aged in thirty years.' },
  ledger: { name: 'Coolant ledger', case: 'bishop', note: 'Coolant drawn by the litre that no machine in the Works uses.' },
  drawing: { name: 'Child\'s drawing', case: 'wren', note: 'A tower going up into the sky, and a girl at the bottom.' },
  tag: { name: 'Tracking tag', case: 'wren', note: 'Meridian\'s. Still pinging, faintly.' },
  recording: { name: 'Data recording', case: 'wren', note: 'A voice, the Root\'s maybe, saying "You came back."' },
  contract: { name: 'Meridian contract', case: 'maker', note: 'Four units, delivered to the Spires. Signed by nobody.' },
  blueprint: { name: 'Neural blueprint', case: 'maker', note: 'The design isn\'t Meridian\'s. It came up from below.' },
  memory: { name: 'Memory core', case: 'maker', note: 'Whoever made the synths made them to come home.' },
  // side work
  dogtag: { name: 'Works dog tag', note: 'K. OKAFOR, PUMP CREW 7.' }, rotor: { name: 'Toy rotor', note: 'Tam\'s drone, or what\'s left.' },
  letter: { name: 'Sealed letter', note: 'For a woman named Esi, in Old Town.' }, lockbox: { name: 'Evidence lockbox', note: 'Precinct property. Still sealed.' },
};
// one look-up for everything that counts in the pack
const ITEM = {};
for (const [kind, M] of [['salvage', SALVAGE], ['consumable', CONSUMABLES], ['throwable', THROWABLES], ['key', KEYS], ['evidence', EVIDENCE]]) for (const k in M) ITEM[k] = Object.assign({ kind }, M[k]);
const ITEM_KINDS = { consumable: 'Consumables', throwable: 'Throwables', salvage: 'Salvage', key: 'Keys and passes', evidence: 'Evidence and case items' };

const GEAR = {
  // head
  fedora: { slot: 'head', name: 'Precinct fedora', rarity: 'common', armor: 2, look: { hat: 'fedora', hatCol: '#3a3028' }, note: 'Keeps the rain off your face. Mostly.' },
  beanie: { slot: 'head', name: 'Knit cap', rarity: 'common', armor: 1, look: { hair: 'cap', capCol: '#2a3a4a' }, note: 'Warm, cheap, forgettable.' },
  circlet: { slot: 'head', name: 'Spire circlet', rarity: 'legendary', armor: 10, look: { hat: 'circlet', hatCol: '#e8e8ff' }, perk: { ram: 0.6, recharge: 0.2 }, note: 'Worn by the people who own the sky.' },
  helmet: { slot: 'head', name: 'Riot helmet', rarity: 'rare', armor: 16, look: { hair: 'helmet', armor: '#4a4e58', visor: '#ffb040' }, note: 'Pulled off the Warden. It still smells of hydraulic oil.' },
  // face
  shades: { slot: 'face', name: 'Rain visor', rarity: 'uncommon', armor: 2, look: { shades: '#3af0e0' }, perk: { recharge: 0.15 }, note: 'A wraparound band. Feeds your aim into the blaster.' },
  mask: { slot: 'face', name: 'Filter mask', rarity: 'uncommon', armor: 4, look: { mask: '#2a2a30' }, note: 'For the air below the Stack.' },
  respirator: { slot: 'face', name: 'Respirator', rarity: 'rare', armor: 7, look: { mask: '#3a4a3a' }, perk: { regen: 0.3 }, note: 'Scrubs the Bowels\' air. You breathe easier and heal a little.' },
  lenses: { slot: 'face', name: 'Tracer lenses', rarity: 'epic', armor: 3, look: { shades: '#ff4ab0' }, perk: { ram: 0.4 }, note: 'Old precinct issue. They take load off your deck.' },
  // outer torso
  workjacket: { slot: 'outer', name: 'Work jacket', rarity: 'common', armor: 4, look: { coat: 'jacket', top: '#4a4632', collar: true }, note: 'Canvas, scorched at the cuffs, a pocket for every tool.' },
  trench: { slot: 'outer', name: 'Precinct trench', rarity: 'common', armor: 6, look: { coat: 'long', top: '#5e4c38', collar: true }, note: 'The coat. Every detective has one; yours has been rained on for nine years.' },
  bomber: { slot: 'outer', name: 'Neon bomber', rarity: 'uncommon', armor: 10, look: { coat: 'jacket', top: '#2a2438', collar: true, trim: true, acc: '#ff4ab0' }, note: 'Lit seams. Nobody will mistake you for a cop.' },
  armtrench: { slot: 'outer', name: 'Armoured trench', rarity: 'rare', armor: 18, look: { coat: 'long', top: '#34343c', collar: true, plates: true, acc: '#ffb040' }, note: 'Ceramic plates sewn into the lining.' },
  riotcoat: { slot: 'outer', name: 'Riot coat', rarity: 'rare', armor: 20, look: { coat: 'long', top: '#1e2430', collar: true, plates: true, acc: '#3a8aff' }, note: 'Precinct riot issue. Heavy as sin.' },
  synthweave: { slot: 'outer', name: 'Synthweave coat', rarity: 'legendary', armor: 34, look: { coat: 'long', top: '#e8e8f0', collar: true, trim: true, acc: '#3af0e0' }, perk: { regen: 0.6 }, note: 'Grown, not woven. It mends itself, and you.' },
  // inner torso
  shirt: { slot: 'inner', name: 'Work shirt', rarity: 'common', armor: 1, look: { shirt: '#8a8a84' }, note: 'Pressed, once.' },
  mesh: { slot: 'inner', name: 'Mesh vest', rarity: 'uncommon', armor: 8, look: { shirt: '#3a4a3a', vest: '#4a5a3a' }, note: 'Gang issue. Stops a knife, nearly.' },
  ballistic: { slot: 'inner', name: 'Ballistic vest', rarity: 'rare', armor: 14, look: { shirt: '#2a2a30', vest: '#3a3e4a', vestLight: '#3af0e0' }, note: 'Stops a bolt, mostly.' },
  // legs
  slacks: { slot: 'legs', name: 'Old slacks', rarity: 'common', armor: 2, look: { legs: '#26262c' }, note: 'Good for sitting in a car all night.' },
  cargo: { slot: 'legs', name: 'Cargo pants', rarity: 'uncommon', armor: 5, look: { legs: '#4a4a32', pockets: true }, note: 'Pockets for everything you strip.' },
  plated: { slot: 'legs', name: 'Plated trousers', rarity: 'rare', armor: 10, look: { legs: '#2a2e38', kneePad: '#5a6070' }, note: 'Kevlar knees.' },
  // feet
  silent: { slot: 'feet', name: 'Silent soles', rarity: 'epic', armor: 4, look: { boots: '#1a1a20', soles: '#a83aff' }, perk: { stealth: 0.35, speed: 0.06 }, note: 'You don\'t hear yourself coming. Neither do they.' },
  boots: { slot: 'feet', name: 'Worn boots', rarity: 'common', armor: 2, look: { boots: '#161214' }, note: 'Resoled twice.' },
  grips: { slot: 'feet', name: 'Grip runners', rarity: 'rare', armor: 3, look: { boots: '#d8d8e0', soles: '#3af0e0' }, perk: { speed: 0.12 }, note: 'Soles that bite on wet steel.' },
  // weapons
  blaster: { slot: 'ranged', name: 'Precinct blaster', rarity: 'common', dmg: 16, shots: 6, cd: 0.28, bolt: [255, 170, 70], note: 'Six shots, then it needs a moment.' },
  heavy: { slot: 'ranged', name: 'Heavy blaster', rarity: 'rare', dmg: 30, shots: 4, cd: 0.45, bolt: [255, 90, 50], look: { blasterCol: '#ff5a32', blasterBig: true }, note: 'Four big shots. Slow to cycle.' },
  tracer: { slot: 'ranged', name: 'Tracer pistol', rarity: 'epic', dmg: 13, shots: 10, cd: 0.16, bolt: [58, 240, 224], look: { blasterCol: '#3af0e0' }, note: 'Ten quick shots that find their mark.' },
  scatter: { slot: 'ranged', name: 'Scattergun', rarity: 'uncommon', dmg: 9, pellets: 5, spread: 0.32, shots: 4, cd: 0.6, range: 120, bolt: [255, 210, 110], look: { blasterCol: '#ffd060', blasterBig: true }, note: 'Five pellets, a wide spread. Up close it\'s brutal.' },
  rail: { slot: 'ranged', name: 'Rail rifle', rarity: 'epic', dmg: 62, pierce: true, shots: 3, cd: 0.9, range: 330, speed: 620, bolt: [255, 255, 255], look: { blasterCol: '#e8e8ff', blasterBig: true }, note: 'Goes through whatever it hits, and whatever\'s behind that.' },
  knuckles: { slot: 'melee', name: 'Shock knuckles', rarity: 'uncommon', strike: 22, stun: 0.4, look: { bladeCol: '#3af0e0' }, note: 'Every blow stuns for a moment.' },
  baton: { slot: 'melee', name: 'Shock baton', rarity: 'uncommon', strike: 20, look: { bladeCol: '#5aa8ff', sheath: 'baton', sheathCol: '#5aa8ff' }, note: 'A gang enforcer\'s. It still bites.' },
  katana: { slot: 'melee', name: 'Mono-katana', rarity: 'epic', strike: 34, look: { bladeCol: '#ff4ab0', sheath: 'katana', sheathCol: '#ff4ab0' }, note: 'An edge one molecule thick.' },
};
// what the detective owns and wears on day one
const GEAR_START = { head: 'beanie', outer: 'workjacket', inner: 'shirt', legs: 'slacks', feet: 'boots' };
// what the vendors sell, and for how much
// (gear, mods and items alike, by id)
const SHOP = {
  Mo: { noodlecup: 8, medpatch: 25, stim: 40 }, Jun: { noodlecup: 8, medpatch: 25, stim: 40 },
  Kit: { beanie: 30, mask: 90, bomber: 160, cargo: 110, noodlecup: 10, medpatch: 30 },
  Ozu: { heavy: 380, ballistic: 300, plated: 240, grips: 320, katana: 600, scatter: 260 },
  'Quartermaster Ito': { emp: 45, medpatch: 25, stim: 45 },
  'Ferrin': { respirator: 380, knuckles: 220, medpatch: 28, stim: 45, noodlecup: 10 },
  'Concierge': { riotcoat: 700, silent: 950, rail: 1200, circlet: 1500 },
}
// what you can find, by how deep you are (tier 1 the Stack's height, 5 the
// Bowels): salvage, things to carry, and now and then gear or a mod
const LOOT = {
  1: { cr: [6, 24], salvage: ['wire', 'alloy', 'glass'], items: ['noodlecup', 'medpatch'], rare: ['beanie', 'mask', 'cargo'] },
  2: { cr: [10, 34], salvage: ['wire', 'alloy', 'glass', 'coolant', 'chips'], items: ['medpatch', 'noodlecup'], rare: ['mesh', 'cargo', 'scatter', 'knuckles'] },
  3: { cr: [16, 48], salvage: ['glass', 'chips', 'coolant', 'wire'], items: ['medpatch', 'stim'], rare: ['ballistic', 'plated', 'knuckles', 'respirator'] },
  4: { cr: [24, 64], salvage: ['alloy', 'chips', 'coolant'], items: ['medpatch', 'emp'], rare: ['grips', 'riotcoat', 'heavy'] },
  5: { cr: [30, 80], salvage: ['chips', 'coolant', 'glass'], items: ['medpatch', 'stim', 'emp'], rare: ['respirator', 'silent', 'rail'] },
  6: { cr: [60, 140], salvage: ['chips', 'glass'], items: ['medpatch', 'stim'], rare: ['silent', 'riotcoat', 'synthweave', 'circlet'] },
}

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
    knuckles: { cr: 90, wire: 3, chips: 1 }, scatter: { cr: 160, alloy: 4, coolant: 1 }, respirator: { cr: 240, glass: 2, coolant: 2 }, riotcoat: { cr: 420, alloy: 8, wire: 4 },
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
