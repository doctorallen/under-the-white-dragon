'use strict';
// ---------------------------------------------------------------------------
// Day and night. The city never really gets bright: by day the sky's a low
// grey-blue overcast with the rain still coming, the towers behind go pale in
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
