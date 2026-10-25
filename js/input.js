'use strict';
// ---------------------------------------------------------------------------
// Input. Keyboard: arrows/WASD move and aim (up climbs), Space/K jump, J/X
// dig, T leaves a torch, L sets a ladder, E the bench (at home), C the catalog, Esc pauses.
// Touch: the left half of the screen is a stick wherever the thumb lands;
// the buttons on the right jump, dig and leave a torch.
// ---------------------------------------------------------------------------
const Input = {
  ax: 0, ay: 0, jump: false, dig: false, jumpHit: false, torchHit: false, ladderHit: false,
  keys: new Set(), stick: null, touch: false,
  init() {
    const map = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', Space: 'j', KeyK: 'j', KeyJ: 'x', KeyX: 'x' };
    addEventListener('keydown', (e) => {
      if (e.repeat) { if (map[e.code]) e.preventDefault(); return; }
      const k = map[e.code];
      if (k) { this.keys.add(k); if (k === 'j') this.jumpHit = true; e.preventDefault(); }
      if (e.code === 'KeyT') this.torchHit = true;
      if (e.code === 'KeyL') this.ladderHit = true;
      if (e.code === 'KeyE') Hud.toggle('bench');
      if (e.code === 'KeyC') Hud.toggle('catalog');
      if (e.code === 'Escape') Hud.toggle(Hud.open ? Hud.open : 'pause');
      this.fromKeys();
    });
    addEventListener('keyup', (e) => { const k = map[e.code]; if (k) { this.keys.delete(k); this.fromKeys(); } });
    addEventListener('blur', () => { this.keys.clear(); this.fromKeys(); this.dig = false; this.jump = false; });
    // the stick
    const pad = $('stickzone'), base = $('stick'), knob = $('knob');
    pad.addEventListener('pointerdown', (e) => {
      this.touch = true; document.body.classList.add('touch');
      this.stick = { id: e.pointerId, x: e.clientX, y: e.clientY };
      pad.setPointerCapture(e.pointerId);
      base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; base.classList.add('on');
      knob.style.transform = 'translate(-50%,-50%)';
      e.preventDefault();
    });
    pad.addEventListener('pointermove', (e) => {
      if (!this.stick || e.pointerId !== this.stick.id) return;
      const R = 34, dx = clamp(e.clientX - this.stick.x, -R, R), dy = clamp(e.clientY - this.stick.y, -R, R);
      this.ax = Math.abs(dx) > R * 0.28 ? dx / R : 0; this.ay = Math.abs(dy) > R * 0.4 ? dy / R : 0;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    const up = (e) => { if (!this.stick || e.pointerId !== this.stick.id) return; this.stick = null; this.ax = 0; this.ay = 0; base.classList.remove('on'); };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    // the buttons
    const hold = (el, on, off) => {
      el.addEventListener('pointerdown', (e) => { this.touch = true; document.body.classList.add('touch'); el.setPointerCapture(e.pointerId); el.classList.add('down'); on(); e.preventDefault(); });
      const end = () => { el.classList.remove('down'); off(); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    };
    hold($('bJump'), () => { this.jump = true; this.jumpHit = true; }, () => { this.jump = false; });
    hold($('bDig'), () => { this.dig = true; }, () => { this.dig = false; });
    hold($('bTorch'), () => { this.torchHit = true; }, () => {});
    hold($('bLadder'), () => { this.ladderHit = true; }, () => {});
  },
  fromKeys() {
    const k = this.keys;
    if (!this.stick) { this.ax = (k.has('r') ? 1 : 0) - (k.has('l') ? 1 : 0); this.ay = (k.has('d') ? 1 : 0) - (k.has('u') ? 1 : 0); }
    this.jump = k.has('j') || ($('bJump') && $('bJump').classList.contains('down'));
    this.dig = k.has('x') || ($('bDig') && $('bDig').classList.contains('down'));
  },
  // edges are read once per step
  take(name) { const v = this[name]; this[name] = false; return v; },
};
