'use strict';
// ---------------------------------------------------------------------------
// Jacking in: a few seconds of timing. A cursor runs back and forth along the
// node's trace; tap while it's inside the lit window to break a layer of
// ICE. Break three layers before the ICE closes (three misses, or the timer)
// and the node is yours. Harder nodes run faster with smaller windows.
// ---------------------------------------------------------------------------
const Hack = {
  on: false, level: 1, done: null, cv: null, g: null,
  open(level, done) {
    this.on = true; this.level = level; this.done = done; this.layer = 0; this.miss = 0; this.time = 12 - level * 2; this.pos = 0; this.dir = 1; this.flash = 0; this.msg = '';
    this.newWindow();
    Game.paused = true; $('hack').hidden = false;
    this.cv = $('hackcv'); this.g = this.cv.getContext('2d');
    $('hack').onpointerdown = (e) => { e.preventDefault(); this.tap(); };
    this.last = performance.now(); requestAnimationFrame((t) => this.tick(t));
  },
  newWindow() { const w = (0.2 - this.level * 0.03) * (1 - this.layer * 0.15); this.w = Math.max(0.07, w); this.at = 0.12 + hash(this.layer, this.level, Game.frame) * (0.76 - this.w); this.speed = 0.9 + this.level * 0.35 + this.layer * 0.25; },
  tap() {
    if (!this.on || this.end) return;
    if (this.pos >= this.at && this.pos <= this.at + this.w) { this.layer++; this.flash = 0.25; this.flashOk = true; if (this.layer >= 3) { this.finish(true); return; } this.newWindow(); }
    else { this.miss++; this.flash = 0.25; this.flashOk = false; if (this.miss >= 3) this.finish(false); }
  },
  finish(ok) {
    this.end = { ok, t: 0.9 };
    if (!ok) { Game.s.hp = Math.max(1, Game.s.hp - 15); Hud.refresh(); }
  },
  quit() { if (!this.on) return; this.finish(false); },
  close() { const ok = this.end && this.end.ok, done = this.done; this.on = false; this.end = null; $('hack').hidden = true; Game.paused = false; Input.useHit = false; if (ok && done) done(); else if (!ok) Game.toast('The ICE threw you out. 15 damage. Try again.', 'warn'); },
  tick(now) {
    if (!this.on) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.end) { this.end.t -= dt; if (this.end.t <= 0) { this.close(); return; } }
    else {
      this.pos += this.dir * this.speed * dt; if (this.pos > 1) { this.pos = 1; this.dir = -1; } if (this.pos < 0) { this.pos = 0; this.dir = 1; }
      this.time -= dt; if (this.time <= 0) this.finish(false);
    }
    this.flash = Math.max(0, this.flash - dt);
    this.draw(); requestAnimationFrame((t) => this.tick(t));
  },
  draw() {
    const c = this.cv, g = this.g, W = (c.width = c.clientWidth * (devicePixelRatio || 1)), H = (c.height = c.clientHeight * (devicePixelRatio || 1)), u = W / 100;
    g.fillStyle = '#05080a'; g.fillRect(0, 0, W, H);
    // the trace: a line of nodes, the window lit
    const y = H * 0.55, x0 = u * 6, x1 = W - u * 6, L = x1 - x0;
    g.strokeStyle = '#123a3a'; g.lineWidth = u * 0.8; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    for (let k = 0; k <= 20; k++) { g.fillStyle = '#1a5a58'; g.fillRect(x0 + (L * k) / 20 - u * 0.4, y - u * 1.4, u * 0.8, u * 2.8); }
    g.fillStyle = this.end && this.end.ok ? '#3aff80' : 'rgba(58,240,224,0.85)'; g.fillRect(x0 + L * this.at, y - u * 3, L * this.w, u * 6);
    g.fillStyle = '#ffffff'; g.fillRect(x0 + L * this.pos - u * 0.6, y - u * 6, u * 1.2, u * 12);
    if (this.flash) { g.fillStyle = this.flashOk ? 'rgba(58,255,128,' + this.flash * 2 + ')' : 'rgba(255,60,80,' + this.flash * 2 + ')'; g.fillRect(0, 0, W, H); }
    // layers broken, ICE, time
    g.font = `${Math.round(u * 2.6)}px "IBM Plex Mono", ui-monospace, monospace`; g.textBaseline = 'top';
    g.fillStyle = '#3af0e0'; g.fillText('LAYERS ' + '■'.repeat(this.layer) + '□'.repeat(3 - this.layer), x0, u * 4);
    g.fillStyle = '#ff4a6a'; g.fillText('ICE ' + '■'.repeat(this.miss) + '□'.repeat(3 - this.miss), x0 + L * 0.42, u * 4);
    g.fillStyle = '#c8d0d8'; g.fillText(Math.max(0, this.time).toFixed(1) + 's', x1 - u * 9, u * 4);
    g.fillStyle = '#7a8a90'; g.fillText(this.end ? (this.end.ok ? 'ACCESS' : 'REJECTED') : 'TAP WHILE THE CURSOR IS IN THE WINDOW', x0, H - u * 6);
  },
};
