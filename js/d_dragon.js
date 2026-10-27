'use strict';
// ---------------------------------------------------------------------------
// The White Dragon: the noodle bar on the corner, and your workshop under it.
// The street out front with the neon sign on the corner; through the curtain,
// the bar, Auntie Lin at the pots; through the next curtain, her storeroom, and
// under a rug in it the trapdoor down to the basement (d_cellar, its own place,
// hidden from the city map): the bench, the parts shelf, the cot. Home.
// Helpers carry the prefix `wd`.
// ---------------------------------------------------------------------------
const WD = { IN: 380, PART: 762, BACK: 774, END: 1092, CEIL: 122 };

addDistrict('d_dragon', 'The White Dragon', 1, 2, 230, 'The noodle bar on the corner, and what nobody knows is under it.', 'The White Dragon', () => district({
  id: 'd_dragon', name: 'The White Dragon', tier: 1, W: 1120, crowd: 3, crowdFrom: 150, crowdTo: 330, amb: [0.2, 0.17, 0.26], layerDy: 0,
  build(L, G) {
    const C = G - WD.CEIL;
    // next door: a shophouse, flats above
    bShophouse(L, 150, 282, G, { floors: 4, wall: KMAT.teal, shops: [['glass', '#9af0ff']], roof: 'tank', seed: 911 });
    // a gap between the buildings: pipes, a drainpipe, the dark
    L.paint(282, G - 330, 300, G, (P) => { kFill(P, 282, G - 330, 300, G, '#08070c'); for (let y = G - 330; y < G; y++) { P.put(286, y, [26, 28, 34]); P.put(287, y, [44, 48, 56]); } for (let y = G - 300; y < G; y += 46) for (let x = 282; x < 300; x++) P.put(x, y, [30, 30, 38]); });
    // the White Dragon's building: flats above the bar, a slab between
    L.paint(300, G - 330, WD.END + 28, C + 6, (P) => {
      P.block(300, G - 320, WD.END + 28, C, KMAT.plaster, { base: 0.4, panels: [60, 34], drips: 0.12, dripLen: 24 });
      for (let fy = G - 306; fy < C - 24; fy += 34) for (let fx = 316; fx < WD.END + 10; fx += 26) if (fx > 352 || fy + 18 < G - 150) kWin(P, fx, fy, 14, 18, { lit: hash(fx, fy, 31) < 0.45 ? (hash(fx, fy, 32) < 0.5 ? '#ffd8a0' : '#a8e0ff') : null, blinds: hash(fx, fy, 33) < 0.4, curtain: hash(fx, fy, 34) < 0.3 ? '#5a2a3a' : null });
      P.block(296, G - 330, WD.END + 30, G - 320, KMAT.kawara, { base: 0.5 });
      P.block(300, C, WD.END + 28, C + 6, MAT.concreteD, { base: 0.5 });
    });
    // the front: a pier at the corner, the entrance with its curtain
    L.paint(300, C, WD.IN, G, (P) => {
      P.block(300, C + 6, 330, G, KMAT.lacquer, { base: 0.42 });
      kFill(P, 330, C + 6, WD.IN, G, '#140c0a');
      kNoren(P, 334, WD.IN - 2, C + 10, 30, '#e8e4dc');
    });
    // ---- the bar: warm tiles, a counter, stools, lanterns, the menu
    L.paint(WD.IN, C + 6, WD.PART, G, (P) => {
      P.block(WD.IN, C + 6, WD.PART, G, KMAT.terracotta, { base: 0.36, lip: 0, panels: [8, 8] });
      // the menu boards over the pots, steam stains on the tiles
      for (const [x, w] of [[470, 60], [560, 80], [668, 50]]) { kFill(P, x, C + 18, x + w, C + 40, '#120806'); for (let k = 0; k < w - 10; k += 5) P.put(x + 5 + k, C + 24 + (k % 3) * 5, [255, 210, 150], 0.4); }
      // the counter
      P.block(440, G - 30, 720, G - 26, KMAT.darkwood, { base: 0.62 }); P.block(446, G - 26, 714, G, KMAT.lacquer, { base: 0.38, panels: [34, 26] });
      // a skirting, the floor's edge
      for (let x = WD.IN; x < WD.PART; x++) P.put(x, G - 2, [30, 14, 10]);
    });
    bLanterns(L, WD.IN + 10, WD.PART - 10, C + 10, ['#ff3a3a', '#ffb040'], { step: 26 });
    for (const x of [470, 520, 570, 620, 670]) L.prop('deco', x, G, { art: () => stool(), id: 'wdstool' + x });
    L.light(580, G - 50, 120, [1, 0.62, 0.38], 0.9); L.vents.push && L.vents.push({ x: 600, y: G - 34, kind: 'steam' });
    L.npc({ name: 'Auntie Lin', role: 'noodles', look: { skin: SKINS[0], hair: 'bun', hairCol: '#c8c8c8', top: '#e8e0d0', apron: '#8a1a24', legs: '#2a2a2a', hands: { fx: 26, fy: 38 } }, x: 600, y: G - 2, face: 1, sched: [[0, 24, 600, 'work']], lines: ['Eat first. Then fix things.', 'The cellar is yours as long as the rent comes and nobody lifts that rug.', 'Nobody asks what you do down there. Nobody asks me what\'s in the broth either.'] });
    // ---- the partition: a curtain through to the back
    L.paint(WD.PART, C + 6, WD.BACK, G, (P) => { P.block(WD.PART, C + 6, WD.BACK, G - 40, MAT.concreteD, { base: 0.4 }); kNoren(P, WD.PART - 2, WD.BACK + 2, G - 40, 26, '#2a2a3a'); });
    // ---- the storeroom: sacks and crates, the cold room, a mop, and a rug
    L.paint(WD.BACK, C + 6, WD.END, G, (P) => {
      P.block(WD.BACK, C + 6, WD.END, G, MAT.concreteD, { base: 0.3, lip: 0, panels: [46, 30], drips: 0.06, dripLen: 12 });
      // shelves of sacks and tins along the wall
      for (const y of [C + 40, C + 70]) { P.block(790, y, 900, y + 3, KMAT.darkwood, { base: 0.5 }); for (let x = 794; x < 896; x += 12) { const top = y - 12 + (x % 3), c = [[200, 184, 144], [168, 152, 112], [216, 200, 160]][(x >> 2) % 3]; for (let yy = top; yy < y; yy++) { const k = yy - top, inset = k < 2 ? 3 - k : 0; for (let xx = x + inset; xx < x + 10 - inset; xx++) P.put(xx, yy, k === 2 ? [90, 70, 50] : xx === x + inset ? mixRgb(c, [255, 240, 210], 0.3) : xx === x + 9 - inset ? mixRgb(c, [20, 14, 10], 0.4) : c); } for (let xx = x + 3; xx < x + 7; xx++) P.put(xx, top + 6, mixRgb(c, [120, 30, 30], 0.6)); } }
      // the cold room's steel door, a strip of light under it
      P.block(930, C + 24, 976, G, MAT.steelD, { base: 0.45, panels: [46, 24] }); kFill(P, 966, C + 60, 972, C + 76, '#8a909c'); for (let x = 930; x < 976; x++) P.put(x, G - 1, [120, 200, 230]);
      for (let x = WD.BACK; x < WD.END; x++) P.put(x, C + 9 + Math.round(Math.sin(x * 0.05) * 1.5), [20, 20, 24]);
      for (let x = WD.BACK; x < WD.END; x++) P.put(x, G - 2, [22, 22, 26]);
    });
    L.light(880, C + 16, 60, [1, 0.8, 0.55], 0.7); L.light(953, G - 4, 26, [0.5, 0.8, 1], 0.4);
    for (const [x, w, h, col] of [[808, 14, 12, '#5a4a32'], [824, 12, 10, '#4a3a2a'], [814, 12, 9, '#6a5a3a'], [1050, 16, 14, '#4a4a3a'], [1068, 12, 10, '#5a4a32']]) L.prop('deco', x, x === 814 ? G - 12 : G, { art: () => crate({ w, h, col }), id: 'wdcrate' + x + h });
    // the rug, and under it the trapdoor down
    L.prop('trapdoor', 1010, G, { to: ['d_cellar', 'ladder'] });
    L.spawns.trapdoor = [1010, G];
    L.wall(WD.END, C, WD.END + 28, G, MAT.concreteD, { base: 0.35 });
    L.dry.push([330, 0, 1120, L.h]); // (no rain indoors, nor under the eaves)
    for (const w of L.wet) w.x1 = Math.min(w.x1, 330); // (the street is wet; the bar's floor isn't)
    // ---- the street out front: a machine and a junk pile to strip
    L.prop('vending', 250, G, { look: { col: '#3af0e0', body: '#2a3a4a' }, label: 'vending machine' }); L.light(250, G - 12, 30, [0.3, 0.9, 1], 0.5);
    L.prop('junk', 186, G, { label: 'junk pile' });
    // ---- the sign: on the corner, over the street
    // a conduit from the sign down the pier into the wall
    L.paint(318, G - 48, 324, G, (P) => { for (let y = G - 48; y < G - 4; y++) { P.put(320, y, [20, 22, 28]); P.put(321, y, [58, 62, 72]); } for (const y of [G - 40, G - 24, G - 10]) { P.put(319, y, [90, 96, 108]); P.put(322, y, [90, 96, 108]); } });
    L.prop('deco', 312, G - 46, { art: () => dragonSign(), id: 'wdsign' });
    L.light(316, G - 100, 90, [0.75, 0.9, 1], 0.8); L.light(296, G - 120, 40, [1, 0.3, 0.38], 0.5);
  },
}));

// ---- the basement: under the storeroom, down the ladder. A ripper's den
// made out of a cellar: grimy white tile under a red neon strip, the work chair
// under two articulated lamps, monitors on arms, a rack of glowing canisters,
// spare chrome on hooks, cables across the floor, teal screens round the cot,
// and your bench. Its own place, but not on the city map: you can only get here
// through the trapdoor.
const CL = { W: 720, CEIL: 132 };
// a line of pixels, for arms and cables (glow > 0 lights it)
function clLine(P, x0, y0, x1, y1, col, glow = 0) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) P.put(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), col, glow); }
LEVELS.d_cellar = { name: 'Under the White Dragon', tier: 1, hidden: true, metres: -4, depth: '-4 m', mapX: 230, blurb: 'Your workshop, under the noodle bar. Nobody knows.', label: 'Workshop', make: () => district({
  id: 'd_cellar', name: 'Under the White Dragon', tier: 1, W: CL.W, sky: false, rain: 0, amb: [0.1, 0.09, 0.13], floor: MAT.concreteD,
  build(L, G) {
    const C = G - CL.CEIL, W = CL.W, TT = C + 24; // TT: the top of the tile
    // no way out but the ladder: the district's spinner pad isn't here
    L.props = L.props.filter((p) => p.kind !== 'transit');
    L.paint(0, 0, W, G + 14, (P) => {
      P.block(0, 0, W, C, MAT.concreteD, { base: 0.16, lip: 0, panels: [80, 40] }); // the storeroom's floor, seen from under
      P.block(0, C, W, G, MAT.brickD, { base: 0.22, lip: 0, panels: [40, 22], drips: 0.18, dripLen: 30 });
      kFill(P, 0, C, W, C + 4, '#141218');
      for (let x = 10; x < W; x += 48) kFill(P, x, C + 4, x + 6, C + 10, '#1e1a20'); // joists
      // pipes along the ceiling, a duct, one pipe down the wall to the sump
      for (let x = 0; x < W; x++) { P.put(x, C + 13, [30, 34, 40]); P.put(x, C + 14, [76, 82, 92]); P.put(x, C + 15, [22, 24, 30]); }
      for (let x = 120; x < 620; x++) { for (let y = C + 4; y < C + 11; y++) P.put(x, y, y === C + 5 ? [70, 66, 72] : [40, 36, 44]); if (x % 30 === 0) for (let y = C + 4; y < C + 11; y++) P.put(x, y, [24, 22, 28]); }
      for (let y = C + 15; y < G - 6; y++) { P.put(690, y, [30, 34, 40]); P.put(691, y, [76, 82, 92]); }
      kFill(P, 676, G - 6, 706, G - 2, '#0a0c10'); for (let x = 678; x < 704; x += 3) P.put(x, G - 4, [40, 44, 50]);
      // the work wall: grimy white tile from the chair to the bench, under the red strip
      for (let y = TT; y < G - 4; y++) for (let x = 200; x < 560; x++) {
        const gx = (x - 200) % 10, gy = (y - TT) % 8, grout = gx === 0 || gy === 0, dirt = hash(x >> 2, y >> 2, 71) * 0.5 + (y - TT) / (G - TT) * 0.35 + (hash(x >> 4, 3, 72) < 0.2 ? 0.25 : 0);
        P.put(x, y, grout ? [70, 66, 70] : mixRgb([200, 196, 192], [92, 80, 72], clamp(dirt, 0, 1)));
      }
      // rust and blood-brown streaks down the tile
      for (let k = 0; k < 14; k++) { const x = 206 + Math.floor(hash(k, 1, 73) * 350), y0 = TT + Math.floor(hash(k, 2, 73) * 30), n = 8 + Math.floor(hash(k, 3, 73) * 40); for (let y = y0; y < Math.min(G - 4, y0 + n); y++) P.tint(x, y, [90, 40, 30], 0.35); }
      // the red neon strip's channel, and a shelf of trophies under it
      kFill(P, 196, TT - 6, 564, TT - 2, '#1a0a0e');
      kFill(P, 470, TT + 22, 552, TT + 25, '#2a2430');
      for (const [x, h, c] of [[476, 9, [200, 170, 80]], [488, 13, [190, 190, 200]], [500, 7, [200, 170, 80]], [530, 11, [150, 150, 170]]]) { kFill(P, x, TT + 22 - h, x + 4, TT + 22, css(c)); P.put(x + 1, TT + 22 - h, mixRgb(c, [255, 255, 255], 0.6)); }
      // spare chrome on hooks: forearms and hands, a joint still lit
      kFill(P, 112, C + 30, 186, C + 33, '#3a3640');
      for (let k = 0; k < 4; k++) {
        const x = 120 + k * 18, y0 = C + 33, len = 26 + (k % 2) * 6, c = k === 2 ? [190, 160, 140] : [170, 178, 196];
        P.put(x + 2, y0, [90, 90, 100]); P.put(x + 2, y0 + 1, [90, 90, 100]);
        for (let y = y0 + 2; y < y0 + len; y++) for (let dx = 0; dx < 5; dx++) P.put(x + dx, y, dx === 0 ? mixRgb(c, [255, 255, 255], 0.35) : dx === 4 ? mixRgb(c, [0, 0, 0], 0.5) : (y % 6 === 0 ? mixRgb(c, [0, 0, 0], 0.3) : c));
        for (let f = 0; f < 4; f++) for (let y = y0 + len; y < y0 + len + 4 + (f % 2); y++) P.put(x + f + (f > 1 ? 1 : 0), y, mixRgb(c, [0, 0, 0], 0.2));
        P.put(x + 2, y0 + 10, k % 2 ? [255, 60, 80] : [60, 240, 230], 1); P.put(x + 2, y0 + 11, k % 2 ? [160, 30, 40] : [30, 140, 140], 0.6);
      }
      // the rack of canisters: steel frame, six glass tubes, amber and green
      kFill(P, 196, G - 64, 244, G - 60, '#2a2e36'); kFill(P, 196, G - 34, 244, G - 30, '#2a2e36'); kFill(P, 196, G - 64, 199, G, '#22262c'); kFill(P, 241, G - 64, 244, G, '#22262c');
      for (let k = 0; k < 6; k++) {
        const x = 202 + (k % 3) * 13, y0 = k < 3 ? G - 59 : G - 29, h = 22, c = [[255, 170, 60], [90, 255, 120], [255, 170, 60], [90, 255, 120], [255, 140, 40], [120, 255, 200]][k], lvl = 5 + Math.floor(hash(k, 1, 74) * 12);
        for (let y = y0; y < y0 + h; y++) for (let dx = 0; dx < 8; dx++) { const full = y >= y0 + lvl, edge = dx === 0 || dx === 7; P.put(x + dx, y, y === y0 || y === y0 + h - 1 ? [70, 74, 82] : full ? mixRgb(c, [0, 0, 0], edge ? 0.55 : 0.15) : edge ? [60, 70, 80] : [26, 30, 36], full && !edge ? 0.55 : 0); }
      }
      // the lamp arms over the chair: from the duct, two elbows each, lamp heads facing down
      for (const [bx, ex, ey, hx, hy] of [[300, 274, C + 40, 300, C + 58], [380, 406, C + 36, 378, C + 54]]) {
        for (const d of [0, 1]) { clLine(P, bx + d, C + 11, ex + d, ey, [56, 60, 70]); clLine(P, ex + d, ey, hx + d, hy, [56, 60, 70]); }
        clLine(P, bx - 1, C + 11, ex - 1, ey, [110, 116, 128]);
        kFill(P, ex - 2, ey - 2, ex + 3, ey + 3, '#3a3e48'); kFill(P, hx - 9, hy - 4, hx + 10, hy + 3, '#2a2e36');
        for (let x = hx - 8; x < hx + 9; x++) { P.put(x, hy + 2, [230, 250, 255], 1); P.put(x, hy + 3, [140, 220, 240], 0.8); }
      }
      // their light, a cone each down onto the chair
      for (const hx of [300, 378]) { const hy = C + 60; for (let y = hy; y < G - 2; y++) { const k = (y - hy) / (G - hy), half = 8 + k * 26; for (let x = Math.round(hx - half); x <= hx + half; x++) P.tint(x, y, [210, 245, 255], 0.16 * (1 - k) * (1 - Math.abs(x - hx) / half)); } }
      // the monitor arm from the wall to the screen by the chair
      clLine(P, 252, TT + 8, 262, TT + 18, [56, 60, 70]); clLine(P, 252, TT + 9, 262, TT + 19, [56, 60, 70]);
      // teal screens on feet round the cot: panels with a lit edge and warning marks
      for (const px of [566, 598]) {
        for (let y = G - 78; y < G - 6; y++) for (let x = px; x < px + 30; x++) { const edge = x === px || x === px + 29 || y === G - 78; P.put(x, y, edge ? [70, 230, 220] : mixRgb([14, 64, 66], [24, 92, 92], ((x + y) % 7) / 14), edge ? 0.7 : 0); }
        for (let x = px + 4; x < px + 26; x++) { P.put(x, G - 60, [120, 220, 210]); P.put(x, G - 30, [120, 220, 210]); }
        for (let k = 0; k < 5; k++) { P.put(px + 6 + k, G - 50 + k, [255, 120, 80]); P.put(px + 16 - k, G - 50 + k, [255, 120, 80]); } for (let x = px + 6; x < px + 17; x++) P.put(x, G - 45, [255, 120, 80]);
        for (let y = G - 26; y < G - 12; y += 3) for (let x = px + 18; x < px + 26; x++) P.put(x, y, [60, 150, 150]);
        kFill(P, px + 2, G - 6, px + 6, G, '#2a2e36'); kFill(P, px + 24, G - 6, px + 28, G, '#2a2e36');
      }
      // the hatch in the ceiling over the ladder, light through its edges
      kFill(P, 52, C - 2, 92, C + 2, '#2a2620'); for (let x = 54; x < 90; x++) P.put(x, C + 2, [255, 210, 150], 0.4);
      // the ladder
      for (let y = C; y < G; y++) for (const x of [62, 82]) { P.put(x, y, [40, 44, 52]); P.put(x + 1, y, [96, 102, 114]); }
      for (let y = C + 6; y < G - 2; y += 8) for (let x = 64; x < 82; x++) { P.put(x, y, [110, 116, 128]); P.put(x, y + 1, [36, 40, 48]); }
      // the old hidden panel's seam, by the cot (it opens later)
      for (let y = G - 34; y < G - 6; y++) P.put(668, y, [24, 22, 26]);
      // the floor: dark tile, a lit strip along the wall's foot, cables from the chair to the wall
      for (let y = G; y < G + 14; y++) for (let x = 0; x < W; x++) P.put(x, y, (x % 16 === 0 || (y - G) % 7 === 0) ? [18, 18, 22] : mixRgb([40, 40, 46], [28, 28, 34], hash(x >> 4, (y - G) >> 3, 75)));
      for (let x = 100; x < 660; x++) P.put(x, G - 1, [60, 220, 230], 0.8);
      for (const [x0, x1, c] of [[318, 200, [200, 90, 40]], [330, 248, [30, 30, 34]], [346, 470, [200, 90, 40]]]) { const n = Math.abs(x1 - x0); for (let k = 0; k <= n; k++) { const x = x0 + Math.sign(x1 - x0) * k, y = G + 2 + Math.round(Math.sin((k / n) * Math.PI) * 4 + Math.sin(k * 0.3) * 0.6); P.put(x, y, c); P.put(x, y + 1, mixRgb(c, [0, 0, 0], 0.5)); } }
    });
    L.wall(0, 0, 24, G, MAT.concreteD, { base: 0.3 }); L.wall(W - 24, 0, W, G, MAT.concreteD, { base: 0.3 });
    // the red strip: neon, across the work wall
    L.tube(198, TT - 4, 364, '#ff2a40', 0.42);
    // the ladder up
    L.prop('trapdoor', 72, G, { up: true, to: ['d_dragon', 'trapdoor'] });
    L.light(72, C + 6, 44, [1, 0.8, 0.55], 0.5);
    // the chair under its lamps, the tray of tools, the monitors
    L.prop('deco', 340, G, { art: () => workChair(), id: 'clchair' });
    L.prop('deco', 296, G, { art: () => toolTray(), id: 'cltray' });
    L.light(304, G - 30, 70, [0.75, 0.95, 1], 1.2); L.light(374, G - 30, 70, [0.75, 0.95, 1], 1.2); L.light(340, C + 60, 60, [0.75, 0.95, 1], 0.6);
    L.ad(256, TT + 14, 26, 16, 'ecg', ['#3aff80', '#3af0e0']);
    L.ad(410, TT + 8, 30, 20, 'readout', ['#3af0e0', '#ff4a6a']);
    L.light(220, G - 40, 40, [1, 0.75, 0.4], 0.6); L.light(220, G - 14, 30, [0.5, 1, 0.6], 0.5);
    L.light(150, C + 46, 50, [0.6, 0.85, 1], 0.6);
    // the bench, the shelf, the cot behind the screens
    L.prop('workbench', 470, G, { label: 'your bench' });
    L.light(470, G - 40, 50, [1, 0.88, 0.7], 0.7);
    L.prop('shelf', 530, G, { label: 'the parts shelf' });
    L.prop('bed', 650, G, {});
    L.light(600, G - 50, 70, [0.3, 0.9, 0.85], 0.45);
    L.vents.push({ x: 690, y: C + 20, kind: 'steam' });
    L.spawns = { ladder: [96, G], bed: [630, G] };
    // a terminal of your own, by the ladder
    L.spots = Array.from({ length: 10 }, () => [150, G]);
  },
}) };
