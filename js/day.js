'use strict';
// ---------------------------------------------------------------------------
// Day and night. The city never really gets bright: by day the sky's a low
// gray-blue overcast, the towers behind go pale in
// the haze and the neon shows less; dawn and dusk come in rose and amber. Only
// places open to the sky (L.open, from district's sky) change; interiors,
// the undercity and the basement keep their own light. Driven by the clock
// alone (Game.hour), so nothing here is saved.
// ---------------------------------------------------------------------------
const DAY = {
  sun: [5.2, 7.4, 17.2, 19.6], // light comes up between the first two hours, goes between the last two
  amb: [0.74, 0.77, 0.84], // the overcast at midday
  warm: [1.0, 0.62, 0.46], // what dawn and dusk tint it toward
  sky: [146, 158, 174], warmSky: [222, 140, 104], // the haze over the city behind
  haze: 0.8, glow: 0.5, // how much of the city behind the haze hides by day, and of the neon's bloom
};
const Day = {
  // daylight at an hour: 0 night, 1 full day, smooth in between
  light(h = Game.hour()) {
    const [a, b, c, d] = DAY.sun, s = (t) => t * t * (3 - 2 * t);
    return h <= a || h >= d ? 0 : h < b ? s((h - a) / (b - a)) : h > c ? s((d - h) / (d - c)) : 1;
  },
  // how much of the light is sunrise or sunset
  warmth(h = Game.hour()) { return Math.max(0, 1 - Math.abs(h - 6.3) / 1.4) + Math.max(0, 1 - Math.abs(h - 18.4) / 1.4); },
  open(L = World.L) { return !!(L && L.open); },
  // the ambient light at a place: the level's own by night, the overcast by day
  amb(a, d, w) {
    if (d <= 0) return a;
    const day = DAY.amb.map((v, i) => v + (DAY.warm[i] - v) * Math.min(1, w) * 0.85);
    return [a[0] + (day[0] - a[0]) * d, a[1] + (day[1] - a[1]) * d, a[2] + (day[2] - a[2]) * d];
  },
  // over the city behind: the day's haze, and less of its glow
  haze(g, gg, w, h) {
    const d = this.light(); if (d <= 0) return;
    const k = this.warmth(), c = DAY.sky.map((v, i) => Math.round(v + (DAY.warmSky[i] - v) * Math.min(1, k)));
    const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, `rgba(${c},${d * DAY.haze})`); grad.addColorStop(1, `rgba(${c.map((v) => Math.round(v * 0.82))},${d * DAY.haze * 0.85})`);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    gg.globalCompositeOperation = 'destination-out'; gg.fillStyle = `rgba(0,0,0,${d * 0.8})`; gg.fillRect(0, 0, w, h); gg.globalCompositeOperation = 'source-over';
  },
  // the neon blooms less by day
  dim(gg, w, h) { const d = this.light(); if (d <= 0) return; gg.globalCompositeOperation = 'destination-out'; gg.fillStyle = `rgba(0,0,0,${d * DAY.glow})`; gg.fillRect(0, 0, w, h); gg.globalCompositeOperation = 'source-over'; },
};

// ---------------------------------------------------------------------------
// The weather: rain comes and goes in spells through the day, some drizzle,
// some downpour, worked out from the day's number (so the same day always
// rains the same, and nothing is saved). The streets stay wet a while after
// a spell and then dry, and only wet ground reflects: Weather.wet() scales
// the reflections of a level's rain-wet strips (L.wet entries with rain:
// true); water and anything meant to shine keep theirs. Dev can force it.
// ---------------------------------------------------------------------------
const WEATHER = {
  spells: [0, 4], // spells a day, at most
  len: [1, 6.5], // hours a spell lasts
  ease: 0.35, // hours it takes to start and to stop
  dry: 2.5, // hours the ground takes to dry after
};
const Weather = {
  // the spells of a day: [start, end, how hard] in hours from the day's midnight
  spells(d) {
    const out = [], n = Math.floor(hash(d, 1, 811) * (WEATHER.spells[1] + 0.999));
    for (let k = 0; k < n; k++) { const a = hash(d, k + 2, 811) * 24, len = WEATHER.len[0] + hash(d, k + 2, 812) * (WEATHER.len[1] - WEATHER.len[0]); out.push([a, a + len, 0.35 + hash(d, k + 2, 813) * 0.65]); }
    return out;
  },
  // the spells near now, in hours from day 0's midnight
  near() { const d = Game.s ? Game.s.day : 0, out = []; for (const dd of [d - 1, d]) for (const [a, b, k] of this.spells(dd)) out.push([dd * 24 + a, dd * 24 + b, k]); return out; },
  now() { return Game.s ? Game.s.day * 24 + Game.hour() : 0; },
  // how hard it's raining, 0 to 1
  rain() {
    if (Dev.s.weather === 'rain') return 1; if (Dev.s.weather === 'dry') return 0;
    return this.rainAt(this.now());
  },
  // how hard it rains at a time (hours from day 0's midnight), whatever the dev settings say (the minds ask: City.check)
  rainAt(t) {
    const e = WEATHER.ease, d = Math.floor(t / 24); let r = 0;
    for (const dd of [d - 1, d]) for (const [a0, b0, k] of this.spells(dd)) { const a = dd * 24 + a0, b = dd * 24 + b0; if (t > a && t < b) r = Math.max(r, k * Math.min(1, (t - a) / e, (b - t) / e)); }
    return r;
  },
  // how wet the ground is, 0 to 1: wet through while it rains, drying after
  wet() {
    if (Dev.s.weather === 'rain') return 1; if (Dev.s.weather === 'dry') return 0;
    const t = this.now(); let w = 0;
    for (const [a, b] of this.near()) { if (t < a) continue; w = Math.max(w, t < b ? Math.min(1, (t - a) / WEATHER.ease) : Math.max(0, 1 - (t - b) / WEATHER.dry)); }
    return w;
  },
};
