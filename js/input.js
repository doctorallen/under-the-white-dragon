'use strict';
// ---------------------------------------------------------------------------
// Input. Keyboard: arrows/WASD run (hold Shift to sprint, C to walk; up and
// down climb ladders; down and jump drops through a walkway), Space/K jump, E
// use (hold to strip), I your jobs and pockets, M the map, Esc pauses. Touch:
// the left half of the screen is a stick wherever the thumb lands (a little
// walks, further runs, all the way sprints: T.pace); the buttons on the right
// jump and use.
// The controls are Tycho's (Tycho.input.Controls); this keeps the names the
// game reads, refreshed each step by apply(): the axes (ax, ay), what's held
// (jump, use) and the presses waiting (jumpHit, useHit, read once by take).
// ---------------------------------------------------------------------------
const Input = {
  ax: 0, ay: 0, jump: false, use: false, touch: false,
  C: new Tycho.input.Controls({
    keys: { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'jump', KeyK: 'jump', KeyE: 'use', KeyF: 'use', ShiftLeft: 'sprint', ShiftRight: 'sprint', KeyC: 'walk' },
    // (the keys run, as a push of the stick does; Shift sprints and C walks)
    axes: { left: 'left', right: 'right', up: 'up', down: 'down', scale: { x: T.stick.keys }, slow: { action: 'walk', x: T.stick.walk }, fast: { action: 'sprint', x: T.stick.sprint } },
    presses: ['jump', 'use'],
    stick: { radius: T.stick.radius, deadAxes: [0.2, 0.45], retake: true, onChange: (s) => Input.drawStick(s) },
    bot: { x: 'ax', y: 'ay' },
  }),
  // a test can drive the controls: { ax, ay, jump, use }
  get bot() { return this.C.bot; },
  set bot(b) { this.C.bot = b; },
  get jumpHit() { return this.C.presses.jump || false; },
  set jumpHit(v) { this.C.presses.jump = v; },
  get useHit() { return this.C.presses.use || false; },
  set useHit(v) { this.C.presses.use = v; },
  init() {
    this.C.listen({ stick: $('stickzone'), buttons: { jump: $('bJump'), use: $('bUse') }, heldClass: 'down', onTouch: () => { this.touch = true; document.body.classList.add('touch'); } });
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyI' || e.code === 'Tab') { Hud.toggle('pack'); e.preventDefault(); }
      if (e.code === 'KeyM') Hud.toggle('map');
      if (e.code === 'Escape') Hud.toggle(Hud.open ? Hud.open : 'pause');
    });
  },
  // the stick where the thumb landed, the knob as far as it's pushed
  drawStick(s) {
    const base = $('stick'), knob = $('knob');
    if (!s) { base.classList.remove('on'); return; }
    if (s.x === s.x0 && s.y === s.y0) { base.style.left = s.bx + 'px'; base.style.top = s.by + 'px'; base.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)'; return; }
    const R = T.stick.radius, dx = clamp(s.x - s.bx, -R, R), dy = clamp(s.y - s.by, -R, R);
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  },
  // edges are read once per step
  take(name) { const v = this[name]; this[name] = false; return v; },
  // each step: the axes, and what's held
  apply() { const C = this.C; C.update(); this.ax = C.move.x; this.ay = C.move.y; this.jump = C.held('jump'); this.use = C.held('use'); },
};
