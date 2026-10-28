'use strict';
// ---------------------------------------------------------------------------
// What you carry in your pockets: salvage, what machines are made of, by
// count. Parts (with a grade and a history) are in parts.js.
// ---------------------------------------------------------------------------
// price: what a stall's scrap bin pays for one.
const SALVAGE = {
  wire: { name: 'Copper wire', price: 4, col: ['#6a2e0e', '#d8823a', '#ffc080'] },
  alloy: { name: 'Scrap alloy', price: 3, col: ['#3a4048', '#7a8490', '#c8d0d8'] },
  glass: { name: 'Optic glass', price: 6, col: ['#0e3a44', '#3ab8c8', '#c8fbff'] },
  coolant: { name: 'Coolant', price: 8, col: ['#0e3a2a', '#3ad88a', '#c8ffe0'] },
  chips: { name: 'Rare-earth chips', price: 14, col: ['#2a1a3a', '#a85ad8', '#f0c8ff'] },
};
const SALVAGE_ORDER = Object.keys(SALVAGE);
