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

// Jobs from Juno, the fixer at the bar on the Stack.
const JOBS = [
  { id: 'coolant', title: 'Cold hands', text: 'Bring me three coolant. The cars down on street level are full of it, if you can get down there.', need: { coolant: 3 }, reward: { cr: 150 } },
  { id: 'drones', title: 'Clear the walkway', text: 'Block drones keep buzzing my customers on the upper walkway. Take down four of them.', kills: { drone: 4 }, reward: { cr: 120, chips: 1 } },
  { id: 'clinic', title: 'House call', after: ['coolant', 'drones'], text: 'There\'s a clinic on street level with a terminal full of somebody else\'s secrets. Jack in and bring me what\'s on it.', flag: 'clinicData', reward: { cr: 200, booster: true } },
];
