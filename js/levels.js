'use strict';
// ---------------------------------------------------------------------------
// What the places share: deco sprites by name, everyone's names, people
// passing through, and the city behind. The places themselves are in the
// d_*.js files, built through the builder in world.js.
// ---------------------------------------------------------------------------

// a few deco sprites a level places by name
const DECO = {
  stall: (look) => () => stall(look), stool: () => () => stool(), crate: (o) => () => crate(o), barrel: () => () => barrelFire(),
  capsule: (o) => () => capsule(o), chair: () => () => docChair(), door: (o) => () => door(o), shutter: (o) => () => shutter(o), terminal: (o) => () => terminal(o),
};

// what the city's people say about their lives, when there's nothing more to
// the moment (folk.js deals them out)
const STREET_LINES = [
  'Third shift this week. Fourth if you count this one.', 'Rain\'s warm tonight. That\'s the chemicals.', 'Elevator\'s out again. Elevator\'s always out.',
  'My kid wants a chrome arm for her birthday. She\'s nine.', 'They\'re hiring at the Works. Nobody comes back up to say how it is.', 'You see the fish on the billboard? It follows you if you look at it.',
  'Got any change? No? Me neither.', 'They say synths don\'t sleep. I don\'t sleep either. Doesn\'t make me one.', 'Don\'t eat the street noodles. Eat Lin\'s.',
  'You fix things? My whole life\'s broken. Kidding. Mostly.', 'I haven\'t seen the sky in eleven years. I hear it\'s overrated.', 'Somebody stole the copper out of my wall again.',
];
// ---- everyone has a name -----------------------------------------------------
// The people a level's builder only gave a part to play ("Commuter", "Fruit
// seller") get a name of their own as the level is built, chosen from the
// level and where they stand: the same person has it on every visit, and
// nobody in the city shares one (test/smoke.js checks). The part stays, as
// the title under their name.
const PARTS = ['Local', 'Commuter', 'Passer-by', 'Night worker', 'Dumpling auntie', 'Mask maker', 'Fruit seller', 'Grill man', 'Skewer kid', 'Tea seller', 'Fishmonger', 'Watching', 'Parts dealer', 'Ramen cook', 'Book seller', 'Flower seller', 'Patient', 'Dancer', 'Herbalist', 'Street medic', 'Archivist', 'Bouncer', 'Kid', 'Resident', 'Office worker', 'Bridge warden', 'Tea master', 'Gardener', 'Porter', 'Dock worker', 'Picker', 'Cold-box man', 'Fence', 'Lookout', 'Old patient', 'Mother', 'Old-timer', 'Shopkeeper', 'Keeper', 'Kiosk cook', 'Platform squatter', 'Raft trader', 'Boatwoman', 'Festival-goer', 'Worker', 'Pump hand', 'Smelter', 'Night tech', 'Lab hand', 'Vat hand', 'Linesman', 'Scavenger', 'Pilgrim', 'A regular', 'Salaryman', 'Office girl', 'Old drunk', 'Player', 'Regular', 'Housewife', 'Night shift', 'Clubber', 'Concierge'];
const PART_TITLE = { Watching: 'in the audience', Player: 'at the pachinko', 'A regular': 'a regular', Local: 'lives near here', 'Night shift': 'on the night shift' };
const NAME_F = ['Mei', 'Yuki', 'Aiko', 'Sora', 'Rin', 'Jia', 'Lan', 'Xiu', 'Linh', 'Thu', 'Mai', 'Anh', 'Ji-woo', 'Seo-yeon', 'Hye-jin', 'Priya', 'Asha', 'Nadia', 'Leila', 'Amara', 'Zainab', 'Ngozi', 'Adaeze', 'Efua', 'Abena', 'Rosa', 'Lucia', 'Marisol', 'Pilar', 'Olga', 'Vera', 'Katya', 'Mirela', 'Tamar', 'Noa', 'Ayla', 'Selin', 'Tala', 'Maricel', 'Joy', 'Bea', 'Imelda', 'Kiri', 'Moana', 'Haruka', 'Emi', 'Naoko', 'Chiyo', 'Fumiko', 'Xin', 'Ying', 'Qing', 'Hoa', 'Trang', 'Sun-hee', 'Eun-ji', 'Meera', 'Kavya', 'Farah', 'Yasmin', 'Kemi', 'Folake', 'Ama', 'Yaa', 'Carmen', 'Elena', 'Paz', 'Irina', 'Zora', 'Dana', 'Ilse', 'Greta', 'Lourdes', 'Perla', 'Nia', 'Wren', 'Iris', 'June', 'Odile', 'Suki'];
const NAME_M = ['Kenji', 'Hiro', 'Taro', 'Daichi', 'Ren', 'Sho', 'Wei', 'Bao', 'Minh', 'Duc', 'Tuan', 'Hoang', 'Min-jun', 'Ji-ho', 'Seung', 'Arjun', 'Ravi', 'Dev', 'Omar', 'Tariq', 'Yusuf', 'Chidi', 'Emeka', 'Kwame', 'Kofi', 'Tunde', 'Diego', 'Mateo', 'Rafael', 'Joaquin', 'Andrei', 'Pavel', 'Dmitri', 'Luka', 'Marek', 'Ivo', 'Tomas', 'Ezra', 'Amir', 'Kemal', 'Paolo', 'Nando', 'Ramon', 'Joel', 'Ben', 'Sam', 'Nico', 'Akira', 'Masa', 'Shin', 'Yuto', 'Haruto', 'Lei', 'Hao', 'Cheng', 'Quang', 'Long', 'Dong-hyun', 'Tae', 'Sanjay', 'Vikram', 'Karim', 'Bilal', 'Obi', 'Femi', 'Yaw', 'Kojo', 'Ignacio', 'Raul', 'Sergei', 'Bogdan', 'Henrik', 'Lars', 'Efren', 'Rolando', 'Caleb', 'Felix', 'Otto', 'Silas', 'Abel'];
const NAME_LAST = ['Tanaka', 'Nakamura', 'Watanabe', 'Yamada', 'Kobayashi', 'Hayashi', 'Shimizu', 'Fujita', 'Okada', 'Matsuda', 'Kimura', 'Endo', 'Chen', 'Lin', 'Huang', 'Zhou', 'Xu', 'Guo', 'Liang', 'Tang', 'Feng', 'Deng', 'Nguyen', 'Tran', 'Le', 'Pham', 'Vu', 'Dang', 'Bui', 'Park', 'Kim', 'Choi', 'Jung', 'Kang', 'Yoon', 'Han', 'Seo', 'Patel', 'Rao', 'Iyer', 'Menon', 'Khan', 'Haddad', 'Nasser', 'Aziz', 'Adeyemi', 'Mensah', 'Boateng', 'Asante', 'Eze', 'Nwosu', 'Balogun', 'Santos', 'Cruz', 'Mendoza', 'Delgado', 'Navarro', 'Morales', 'Ortega', 'Petrov', 'Novak', 'Horvat', 'Kovac', 'Lund', 'Berg', 'Aquino', 'Bautista', 'Dizon', 'Castillo', 'Ocampo', 'Villanueva', 'Tan', 'Lim', 'Ong', 'Goh', 'Koh', 'Wong', 'Chua', 'Sasaki', 'Ishikawa', 'Ogawa', 'Arai', 'Kwan', 'Leung', 'Ho', 'Mak', 'Ngo', 'Do', 'Lam', 'Cho', 'Shin', 'Bose', 'Sen', 'Das', 'Farouk', 'Salah', 'Okoye', 'Obi', 'Amadi', 'Darko', 'Owusu', 'Vargas', 'Rojas', 'Flores', 'Ibarra', 'Volkov', 'Sokol', 'Marin', 'Dahl', 'Holm', 'Reyes', 'Garcia', 'Medina', 'Soto', 'Ito', 'Hart', 'Quill', 'Vance', 'Marsh'];
const NAME_SALT = 1;
function personName(L, def) {
  if (!PARTS.includes(def.name)) return;
  let id = 0; for (const c of L.id) id = (id * 31 + c.charCodeAt(0)) % 100003;
  const part = def.name, k = L.npcs.length, h = (j) => hash(k * 7 + j, Math.round(def.x || 0) + id, NAME_SALT * 17 + j);
  const pick = (a, j) => a[Math.floor(h(j) * a.length)];
  const fem = /auntie|girl|mother|housewife|woman/i.test(part), masc = /\bman\b|salaryman|grill man/i.test(part) && !fem;
  const first = pick(fem ? NAME_F : masc ? NAME_M : h(9) < 0.5 ? NAME_F : NAME_M, 1), last = pick(NAME_LAST, 2);
  def.name = /auntie/i.test(part) ? 'Auntie ' + first : /^old/i.test(part) ? 'Old ' + last : /kid/i.test(part) ? first : first + ' ' + last;
  def.title = PART_TITLE[part] || part.toLowerCase();
}


// the city behind, seen from the Stack and through windows above it: three
// layers of towers, holograms between them, the monorail
function cityLayers(L) {
  L.layersKey = 'city';
  // ---- the city behind: three layers of towers, nearer ones bigger, warmer
  // and quicker to move; the sky and its clouds go with the farthest
  L.layers = [
    { f: 0.1, fy: 0.08, w: 960, h: 310, paint(P) {
      P.area(0, 0, 960, 310, R(['#060c18', '#0c1a2c', '#163248', '#245068', '#3e7a88', '#6aa4a8'], 12, 0.3, 0.3), (x, y) => 0.12 + Math.pow(y / 310, 1.2) * 0.7, { jit: 0.4 });
      cloudBands(P, 0, 960, 24, 170, R(['#0e2032', '#1a3448', '#2c5064', '#6a9aa4'], 9, 0.3, 0.2), 5);
      skylineLayer(P, { w: 960, base: 300, wmin: 8, wmax: 26, hmin: 50, hmax: 170, pal: SKY_PAL.far, fog: 0.35, fogc: [40, 80, 112], seed: 11, styles: ['grid', 'dark', 'columns'], crowns: ['flat', 'spire', 'masts', 'flat'], signs: 0.05, cant: 0.1, glow: 0.35 });
      haze(P, 0, 960, 200, 310, [52, 104, 122], 0.5);
    } },
    { f: 0.22, fy: 0.18, w: 1270, h: 390, paint(P) {
      skylineLayer(P, { w: 1270, base: 390, wmin: 16, wmax: 46, hmin: 90, hmax: 250, pal: SKY_PAL.mid, fog: 0.3, fogc: [20, 34, 58], seed: 23, signs: 0.15, cant: 0.25, glow: 0.45 });
      haze(P, 0, 1270, 300, 390, [22, 30, 56], 0.4);
    } },
    { f: 0.38, fy: 0.32, w: 1680, h: 460, paint(P) {
      skylineLayer(P, { w: 1680, base: 460, wmin: 26, wmax: 70, hmin: 150, hmax: 330, gmin: 2, gmax: 26, pal: SKY_PAL.near, fog: 0.1, fogc: [18, 20, 40], seed: 37, signs: 0.4, cant: 0.4, rim: [58, 200, 210], glow: 0.55, crowns: ['flat', 'slope', 'billboard', 'tank', 'masts', 'billboard', 'spire'] });
      // the monorail: a track on legs, across the whole layer
      P.block(0, 300, 1680, 304, SKY_PAL.near, { base: 0.5, lip: 0.6 });
      for (let x = 30; x < 1680; x += 140) P.block(x, 304, x + 5, 460, SKY_PAL.near, { base: 0.35, lip: 0 });
      for (let x = 0; x < 1680; x += 6) P.put(x, 305, [58, 200, 210], 0.25);
    } },
  ];
  L.holos.push({ layer: 2, kind: 'ad', x: 380, y: 112, w: 92, h: 128, cols: [[255, 90, 190], [120, 220, 255]] });
  L.holos.push({ layer: 1, kind: 'koi', x: 640, y: 96, w: 150, h: 80, cols: [[58, 240, 224], [255, 176, 64]] });
  L.holos.push({ layer: 2, kind: 'ring', x: 1180, y: 150, w: 64, h: 64, cols: [[255, 176, 64], [255, 74, 176]] });
  L.train = { layer: 2, y: 300, speed: 70, cars: 5, span: 1680 };
}
