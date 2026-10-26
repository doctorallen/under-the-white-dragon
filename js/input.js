'use strict';
// ---------------------------------------------------------------------------
// Input. Keyboard: arrows/WASD move (up and down climb ladders; down and jump
// drops through a walkway), Space/K jump, J strike, E use (hold to strip or
// cut), Q runs your program, R picks the next one, I the pack, Esc pauses.
// Touch: the left half of the screen is a stick wherever the thumb lands; the
// buttons on the right jump, strike, use and run the program (hold it to
// pick another).
// ---------------------------------------------------------------------------
const Input = {
  ax: 0, ay: 0, jump: false, use: false, jumpHit: false, strikeHit: false, useHit: false, progHit: false,
  keys: new Set(), stick: null, touch: false, bot: null,
  init() {
    const map = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', Space: 'j', KeyK: 'j', KeyE: 'e', KeyF: 'e', ShiftLeft: 'slow', ShiftRight: 'slow' };
    addEventListener('keydown', (e) => {
      if (Hack.on) { if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'KeyJ' || e.code === 'Enter') { Hack.tap(); e.preventDefault(); } if (e.code === 'Escape') Hack.quit(); return; }
      if (e.repeat) { if (map[e.code]) e.preventDefault(); return; }
      const k = map[e.code];
      if (k) { this.keys.add(k); if (k === 'j') this.jumpHit = true; if (k === 'e') this.useHit = true; e.preventDefault(); }
      if (e.code === 'KeyJ' || e.code === 'KeyX') this.strikeHit = true;
      if (e.code === 'KeyQ') this.progHit = true;
      if (e.code === 'KeyR') Hud.nextProgram();
      if (e.code === 'KeyI' || e.code === 'Tab') { Hud.toggle('pack'); e.preventDefault(); }
      if (e.code === 'KeyM') Hud.toggle('map');
      if (e.code === 'Escape') Hud.toggle(Hud.open ? Hud.open : 'pause');
      this.fromKeys();
    });
    addEventListener('keyup', (e) => { const k = map[e.code]; if (k) { this.keys.delete(k); this.fromKeys(); } });
    addEventListener('blur', () => { this.keys.clear(); this.fromKeys(); });
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
      this.ax = Math.abs(dx) > R * 0.2 ? dx / R : 0; this.ay = Math.abs(dy) > R * 0.45 ? dy / R : 0;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    const up = (e) => { if (!this.stick || e.pointerId !== this.stick.id) return; this.stick = null; this.ax = 0; this.ay = 0; base.classList.remove('on'); };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    // the buttons
    const hold = (el, on, off) => {
      el.addEventListener('pointerdown', (e) => { this.touch = true; document.body.classList.add('touch'); el.setPointerCapture(e.pointerId); el.classList.add('down'); on(); e.preventDefault(); });
      const end = () => { if (!el.classList.contains('down')) return; el.classList.remove('down'); off(); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    };
    hold($('bJump'), () => { this.jump = true; this.jumpHit = true; }, () => { this.jump = false; });
    hold($('bStrike'), () => { this.strikeHit = true; }, () => {});
    hold($('bUse'), () => { this.use = true; this.useHit = true; }, () => { this.use = false; });
    let progT = 0;
    hold($('bProg'), () => { progT = performance.now(); }, () => { if (performance.now() - progT > 450) Hud.nextProgram(); else this.progHit = true; });
  },
  fromKeys() {
    const k = this.keys;
    if (!this.stick) { this.ax = ((k.has('r') ? 1 : 0) - (k.has('l') ? 1 : 0)) * (k.has('slow') ? 0.4 : 1); this.ay = (k.has('d') ? 1 : 0) - (k.has('u') ? 1 : 0); }
    this.jump = k.has('j') || $('bJump').classList.contains('down');
    this.use = k.has('e') || $('bUse').classList.contains('down');
  },
  // edges are read once per step
  take(name) { const v = this[name]; this[name] = false; return v; },
  // a test can drive the controls: { ax, ay, jump, use }
  apply() { if (!this.bot) return; const b = this.bot; this.ax = b.ax || 0; this.ay = b.ay || 0; this.jump = !!b.jump; this.use = !!b.use; },
};
