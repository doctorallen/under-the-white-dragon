'use strict';
// ---------------------------------------------------------------------------
// Flying: your spinner, or a cab you pay for. A flight is a few seconds
// through the city: the three layers of towers streaming past at their own
// depths, holograms and the monorail among them, traffic in the lanes, rain
// in streaks; the car banks and bobs in the middle. Tap to skip. Then you
// arrive where it was going.
// ---------------------------------------------------------------------------
const Flight = {
  on: false, t: 0, dur: 4.6, to: null, spawn: null, cab: false, L: null, layers: null, skip: false,
  // the destinations: where the spinner sets down on each level
  PLACES: [
    { level: 'home', spawn: 'pad', name: 'Home', note: 'The pad on floor 31.' },
    { level: 'precinct', spawn: 'pad', name: 'Precinct 9', note: 'Cases from Lieutenant Hale; the quartermaster\'s gadgets.' },
    { level: 'stack', spawn: 'elevator', name: 'The Stack', note: 'You set down on the block\'s roof and ride the elevator down.' },
    { level: 'street', spawn: 'elevator', name: 'Street level', note: 'Down through the overpasses to the block\'s street door.', needs: 'been:street' },
  ],
  cabFare() { return World.L.id === 'street' ? 45 : 30; },
  init() { addEventListener('pointerdown', () => { if (this.on && this.t > 0.6) this.skip = true; }); },
  start(level, spawn, cab) {
    if (!this.layers) {
      // the city to fly through, painted once
      const L = (this.L = newLevel('sky', '', 1, 1)); cityLayers(L);
      this.layers = L.layers.map((f, i) => { const P = new Pix(f.w, f.h, 0, 0); P.n = 900 + i * 100; f.paint(P); return Object.assign({ w: f.w, h: f.h }, P.canvases()); });
    }
    Object.assign(this, { on: true, t: 0, to: level, spawn, cab: !!cab, skip: false });
    Input.useHit = Input.jumpHit = Input.strikeHit = false;
    this.art = spinner({ cab }); Hud.toggle(null); $('hud').classList.add('flying');
    Game.toast(cab ? 'The cab lifts off. "Where to? Home? Home."' : 'You lift off.');
  },
  step(dt) {
    this.t += dt;
    if (Input.take('useHit') || Input.take('jumpHit') || Input.take('strikeHit')) this.skip = true;
    Game.fade = this.t < 0.35 ? 1 - this.t / 0.35 : Math.max(0, (this.t - (this.dur - 0.45)) / 0.45);
    if (this.t >= this.dur || this.skip) { this.on = false; $('hud').classList.remove('flying'); Game.fade = 1; Game.arrive(this.to, this.spawn); Save.write(); }
  },
  draw(g, gg, w, h) {
    const t = this.t, X = t * 520 + 200, bank = Math.sin(t * 1.3) * 0.5;
    g.fillStyle = '#0a1422'; g.fillRect(0, 0, w, h);
    this.layers.forEach((F, i) => {
      const f = [0.1, 0.22, 0.38][i], sp = f / 0.38, ox = -((X * sp) % F.w), oy = -Math.round((F.h - h) * 0.72 + bank * 6 * (i + 1));
      for (const x of [ox, ox + F.w]) {
        if (x > w || x + F.w < 0) continue;
        g.drawImage(F.c, x, oy);
        gg.globalCompositeOperation = 'destination-out'; gg.drawImage(F.c, x, oy); gg.globalCompositeOperation = 'source-over';
        if (F.e) gg.drawImage(F.e, x, oy);
        for (const ho of this.L.holos) if (ho.layer === i) Skyline.holo(ho, g, gg, x, oy, t);
        if (this.L.train && this.L.train.layer === i) Skyline.train(this.L.train, g, gg, x, oy, t);
      }
      // traffic in this layer's lane, slower and smaller further off
      for (let k = 0; k < 3; k++) {
        const dir = hash(k, i, 3) < 0.5 ? -1 : 1, v = (60 + hash(k, i, 4) * 80) * (i + 1) * dir, span = w + 60, x = ((hash(k, i, 5) * span - X * sp * 0.9 + t * v) % span + span) % span - 30, y = h * (0.25 + i * 0.12) + hash(k, i, 6) * 30;
        g.fillStyle = '#10141c'; g.fillRect(Math.round(x), Math.round(y), 4 + i * 2, 1 + (i > 1 ? 1 : 0));
        gg.fillStyle = dir > 0 ? '#fff0d0' : '#ff3040'; gg.fillRect(Math.round(x + (dir > 0 ? 3 + i * 2 : 0)), Math.round(y), 1, 1);
      }
    });
    // the car, in the middle, banking and bobbing, its thrusters and lights glowing
    const s = this.art, cx = Math.round(w * 0.42), cy = Math.round(h * 0.55 + Math.sin(t * 2.3) * 3 + bank * 4);
    g.save(); g.translate(cx, cy); g.rotate(bank * 0.06 - 0.03); g.drawImage(s.c, -s.ax, -s.ay); g.restore();
    gg.save(); gg.translate(cx, cy); gg.rotate(bank * 0.06 - 0.03); if (s.e) gg.drawImage(s.e, -s.ax, -s.ay);
    gg.globalAlpha = 0.5; gg.fillStyle = '#3af0e0'; gg.fillRect(-s.ax + 10, -2, 12, 2); gg.fillRect(-s.ax + 42, -2, 12, 2);
    for (let k = 0; k < 22; k++) { gg.globalAlpha = 0.16 * (1 - k / 22); gg.fillStyle = '#fff4d8'; gg.fillRect(s.ax - 2 + k * 3, -12 - k * 0.25, 3, 2 + k * 0.6); } // headlight beam
    if (!this.cab) { const on = Math.floor(t * 6) % 2; gg.globalAlpha = 0.9; gg.fillStyle = on ? '#ff3040' : '#3a8aff'; gg.fillRect(-s.ax + (on ? 29 : 41), -s.ay + 1, 4, 2); }
    gg.restore(); gg.globalAlpha = 1;
    // rain in streaks, raked back by the speed
    g.fillStyle = 'rgba(170,190,230,0.22)';
    for (let k = 0; k < 90; k++) { const y = (hash(k, 2, 9) * h + t * 300) % h, x = ((hash(k, 1, 9) * w - t * 900) % w + w) % w; g.fillRect(Math.round(x), Math.round(y), 6, 1); }
  },
};
