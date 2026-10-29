'use strict';
// ---------------------------------------------------------------------------
// The opening. A new game starts with a job already on the bench (Auntie
// Lin's kitchen radio, gone to static) and the part it needs on the shelf,
// and a card walks you through it: the driver, the casing, the probe, the
// iron, the swap, closing up and powering up, then taking it up to Lin.
// Then Ozzy's nav unit, which needs parts you haven't got: stripping the junk
// pile on the street, a cab to the Overpass Market, buying at the parts
// stall, selling salvage, and home to fix it. Each step is done when the game
// says it is (TUT[i].done), so doing things early or out of order just moves
// it on, and Skip ends it. Where you are in it is Game.s.tut ({ i, off }); a
// save from before there was a tutorial has none, and never sees it. The
// step machine is Tycho's guide (Tycho.guide.Guide); what it says and shows
// is this file's.
// The card sits under money and heat; on the bench it's beside the tools,
// with the tool to take and the place to touch marked; in a panel (talking,
// a stall) it's a line at the top, and the button to press pulses.
// ---------------------------------------------------------------------------
const TUT_CH = { bench: 'First job', parts: 'Parts', end: 'The trade' };
const TUT_PANELS = ['talk', 'partshop', 'vendor', 'grocer', 'shelf', 'pack'];
// small helpers for the steps
const tutDev = (id) => Jobs.dev(id);
const tutSlot = (id, k) => { const d = tutDev(id); return d && d.slots[k]; };
const tutMine = (k) => Parts.have(k).some((p) => p.st === 'ok' && p.how !== 'pull');
const tutHome = () => ['d_cellar', 'd_noodles', 'd_dragon'].includes(Game.s.level);
const tutSalvage = () => bag.total(Game.s.pack, SALVAGE_ORDER);
// where on the bench to touch: a screw, a joint (a point), or a part (a box)
const tutPt = ([x, y]) => ({ x: x - 1, y: y - 1, w: 3, h: 3, pt: true });
const tutBox = (k) => { const S = Bench.D.slots[k]; return { x: Bench.ox + S.x, y: Bench.oy + S.y, w: S.w, h: S.h }; };
const tutScrew = (want) => { const i = Bench.b.screws.findIndex((s) => (want === 'in' ? s.st === 'in' : s.st !== 'in')); return i < 0 ? null : tutPt(Bench.screwAt(i)); };
const tutJoint = (k, want) => { const s = Bench.b.slots[k], ji = s.j.indexOf(want); return ji < 0 ? null : tutPt(Bench.joints(k)[ji]); };
const tutUnprobed = () => { const k = Object.keys(Bench.D.slots).find((q) => !Bench.b.probed[q]); return k ? tutBox(k) : null; };

const TUT = [
  // ---- the first job: Lin's radio, start to finish ----
  { ch: 'bench', name: 'At the bench', text: 'Your first job is on the bench: Auntie Lin\'s kitchen radio, gone to static. The part it needs is on your shelf. Walk to the bench and press Use.',
    done: () => Hud.open === 'bench' || !tutDev('lin') || tutDev('lin').screws.some((s) => s.st !== 'in') },
  { ch: 'bench', name: 'Screws out', bench: true, tool: 'driver', text: 'Hold the Driver on each screw till it\'s out. Ring gone red? It\'s binding: let go, then hold again.',
    done: () => { const d = tutDev('lin'); return !d || d.open || d.screws.every((s) => s.st !== 'in'); }, mark: () => tutScrew('in') },
  { ch: 'bench', name: 'Casing off', bench: true, tool: 'hands', text: 'Hands: tap the radio to lift the casing off.',
    done: () => { const d = tutDev('lin'); return !d || d.open; }, mark: () => ({ x: Bench.ox, y: Bench.oy, w: Bench.D.w, h: Bench.D.h }) },
  { ch: 'bench', name: 'Probed', bench: true, tool: 'probe', text: 'Probe: touch each of the four parts to read it.',
    done: () => { const d = tutDev('lin'); return !d || Object.keys(DEVICE.radio.slots).every((k) => d.probed[k]); }, mark: tutUnprobed },
  { ch: 'bench', name: 'Coil melted free', bench: true, tool: 'iron', text: 'The aerial coil\'s burnt. Iron: hold it on each end of the coil till the solder melts. Not too long.',
    done: () => { const s = tutSlot('lin', 'aerial'); return !s || !s.p || s.p.how !== 'pull' || s.j.every((j) => j === 'open'); }, mark: () => tutJoint('aerial', 'solid') },
  { ch: 'bench', name: 'Coil out', bench: true, tool: 'hands', text: 'Hands: tap the coil to lift it out.',
    done: () => { const s = tutSlot('lin', 'aerial'); return !s || !s.p || s.p.how !== 'pull'; }, mark: () => tutBox('aerial') },
  { ch: 'bench', name: 'New coil seated', bench: true, tool: 'hands', pulse: 'button[data-fit]', text: 'Tap the empty mount, then pick your new coil below.',
    done: () => { const s = tutSlot('lin', 'aerial'); return !s || (s.p && s.p.how !== 'pull'); }, mark: () => tutBox('aerial') },
  { ch: 'bench', name: 'Soldered in', bench: true, tool: 'iron', text: 'Iron both ends again: the solder flows and sets.',
    done: () => { const s = tutSlot('lin', 'aerial'); return !s || (s.p && s.j.every((j) => j === 'solid')); }, mark: () => tutJoint('aerial', 'open') },
  { ch: 'bench', name: 'Closed up', bench: true, pulse: 'button[data-bench="close"]', text: 'Close it up: the button below.',
    done: () => { const d = tutDev('lin'); return !d || !d.open; } },
  { ch: 'bench', name: 'Screws in', bench: true, tool: 'driver', text: 'Driver: hold it on each screw to drive it home.',
    done: () => { const d = tutDev('lin'); return !d || d.screws.every((s) => s.st === 'in'); }, mark: () => tutScrew('out') },
  { ch: 'bench', name: 'It plays', bench: true, pulse: 'button[data-bench="test"]', text: () => { const d = tutDev('lin'); return d && d.tested ? 'It didn\'t come on. Open it up, probe it again, and put right what\'s wrong.' : 'Power it up.'; },
    done: () => { const d = tutDev('lin'); return !d || (d.tested && (d.tested.res === 'works' || d.tested.res === 'half')); } },
  { ch: 'bench', name: 'Lin paid you', panel: ['talk'], pulse: 'button[data-job="back:lin"]',
    text: () => Game.s.level === 'd_noodles' ? 'Lin\'s behind the counter. Talk to her and hand the radio back.' : Game.s.level === 'd_cellar' ? 'It plays. Take it up to Lin: close the bench, climb the ladder in the corner, and go through to the bar.' : 'Take the radio back to Lin, behind the counter at the White Dragon.',
    done: () => !tutDev('lin') || Jobs.st('lin').st !== 'bench' },
  // ---- parts: what to do when you haven't got them ----
  { ch: 'parts', name: 'Ozzy\'s job', panel: ['talk'], pulse: 'button[data-job="take:ozzy"]', text: 'That\'s Ozzy at the end of the counter, a cab driver whose nav unit died mid-run. Talk to him and take the job.',
    done: () => Jobs.st('ozzy').st !== 'offer' },
  { ch: 'parts', name: 'Probed', bench: true, text: 'Down at the bench, open it up and probe it to see what it needs.',
    done: () => { const d = tutDev('ozzy'); return !d || Object.keys(DEVICE.navunit.slots).every((k) => d.probed[k]); }, mark: () => (Bench.b && Bench.b.job === 'ozzy' ? (Bench.b.open ? tutUnprobed() : tutScrew('in')) : null) },
  { ch: 'parts', name: 'Stripped', text: 'It needs a power cell and an aerial coil, and you have neither. Machines have parts in them: out on the street, by Mo\'s door, hold Use on the junk pile to strip it.',
    done: () => !!Game.s.flags.stripped || (tutMine('cell') && tutMine('aerial')) },
  { ch: 'parts', name: 'At the market', text: () => (Parts.have('cell').some((p) => p.how !== 'pull') ? 'It gave you a scrap power cell and some salvage. ' : '') + 'For the aerial coil, try the Overpass Market. Hail a cab at the stand on the street, 30 cr, and pick the market.',
    done: () => Game.s.level === 'd_overpass' || tutMine('aerial') },
  { ch: 'parts', name: 'Coil bought', panel: ['partshop'], pulse: () => { const k = Hud.who && Hud.who.def.stock, i = k && PART_STOCK[k] ? PART_STOCK[k].findIndex(([q]) => q === 'aerial') : -1; return i < 0 ? null : `button[data-buypart="${i}"]`; },
    text: 'Find the parts stall (Mechanic Ana\'s, by day) and buy a street aerial coil. Stalls sell parts by grade: scrap, street, clinic.',
    done: () => tutMine('aerial') },
  { ch: 'parts', name: 'Salvage sold', panel: ['vendor', 'partshop'], pulse: 'button[data-act="sellAll"], button[data-selljunk]', text: 'Salvage is money. Sell what you stripped to Hollis, the salvage buyer here, or tip it into the parts stall\'s scrap bin.',
    done: () => !!Game.s.flags.sold || !tutSalvage() },
  { ch: 'parts', name: 'Nav unit fixed', text: () => tutHome() ? 'Fix the nav unit: the dead cell and the burnt coil out, the new ones in, closed up and powered.' : 'Now home: hail a cab back, or tap Cab at the top. Then fix the nav unit on your bench.',
    done: () => Jobs.ready('ozzy') || !['offer', 'bench'].includes(Jobs.st('ozzy').st) },
  // ---- and the rest of it ----
  { ch: 'end', end: true, text: 'That\'s the trade. Ozzy takes it from the counter and pays. Sleep on the cot at night: in the morning you hear how your fixes held. Heat, top left, is the precinct getting close: stealing and illegal work raise it, honest work brings it down.' },
];

const Tutorial = {
  flash: null, sure: false,
  G: new Tycho.guide.Guide({ steps: TUT, state: () => Game.s && Game.s.tut }),
  get s() { return this.G.s; },
  active() { return this.G.active(); },
  get step() { return this.G.step; },
  // a new game: Lin's radio on the bench, and the coil it needs on the shelf
  begin() {
    const s = Game.s; s.tut = Tycho.guide.fresh(); s.jobs.lin = { st: 'bench', since: s.day };
    Bench.put('radio', { job: 'lin', name: JOBS.lin.title, parts: JOBS.lin.parts });
    Parts.give(Parts.make('aerial', 'street', { how: 'gift', from: 'd_cellar' }), true);
  },
  init() {
    $('guide').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-tut]'); if (!b || !this.active()) return;
      if (b.dataset.tut === 'end') { this.G.finish(); Save.write(); return; }
      if (!this.sure) { this.sure = true; setTimeout(() => (this.sure = false), 3000); return; }
      this.G.skip(); this.sure = false; Save.write();
    });
  },
  // every frame: move on past whatever's done (more than one, if you're ahead)
  tick() {
    const passed = this.G.tick();
    if (!passed.length) return;
    this.flash = { t: performance.now(), name: passed[passed.length - 1].name }; snd('tut');
    Save.write();
    if (Hud.open === 'bench') Bench.side(); else if (TUT_PANELS.includes(Hud.open)) Hud.panel(Hud.open);
  },
  text() { const st = this.step, t = this.G.read('text'); return st.bench && Hud.open !== 'bench' ? t + ' (At the bench, press Use.)' : t; },
  head() { const { ch, at, of } = this.G.place(); return `${TUT_CH[ch]}${of > 1 ? ' · ' + at + '/' + of : ''}`; },
  // the card in the corner
  card() {
    if (!this.active()) return '';
    const fl = this.flash && performance.now() - this.flash.t < 1600 ? `<p class="tutdone">✓ ${this.flash.name}</p>` : '';
    return `${fl}<h4>${this.head()}</h4><p>${this.text()}</p>` + (this.step.end ? '<button data-tut="end" class="go">Got it</button>' : `<button data-tut="skip" class="quiet">${this.sure ? 'Tap again to skip' : 'Skip the tutorial'}</button>`);
  },
  // on the bench, beside the tools
  benchHtml() { return this.active() ? `<div class="tutbox"><h4>${this.head()}</h4><p>${this.text()}</p></div>` : ''; },
  // a panel: a line at the top when the step is about it, and its button pulsing
  decorate(el, which) {
    if (!el) return; el.querySelectorAll('.tut').forEach((b) => b.classList.remove('tut')); // (what the last step pointed at)
    if (!this.active()) return;
    const st = this.step, sel = this.G.read('pulse');
    if (sel) el.querySelectorAll(sel).forEach((b) => b.classList.add('tut'));
    if (which === 'bench') { if (st.tool && Bench.tool !== st.tool) { const b = el.querySelector(`button[data-tool="${st.tool}"]`); if (b) b.classList.add('tut'); } return; }
    if (st.panel && st.panel.includes(which)) el.insertAdjacentHTML('afterbegin', `<div class="tutline"><h4>${this.head()}</h4>${this.text()}</div>`);
  },
  // where on the bench to touch, in bench pixels (the job's own device only)
  mark() {
    if (!this.active() || !Bench.b || Bench.hold) return null;
    const st = this.step; if (!st.mark || (st.ch === 'bench' && Bench.b.job !== 'lin')) return null;
    if (st.tool && Bench.tool !== st.tool) return null; // (the tool first)
    return st.mark();
  },
};
// the mark, drawn on the bench's screen: corners round it, pulsing, and an
// arrow over it
function tutMark(out, B, m) {
  const dpr = window.devicePixelRatio || 1, t = performance.now(), a = 0.55 + Math.sin(t / 160) * 0.45, pad = (m.pt ? 6 : 2) * B.k;
  const x0 = B.offx + m.x * B.k - pad, y0 = B.offy + m.y * B.k - pad, x1 = B.offx + (m.x + m.w) * B.k + pad, y1 = B.offy + (m.y + m.h) * B.k + pad, L = Math.min(16 * dpr, (x1 - x0) / 3, (y1 - y0) / 3);
  out.strokeStyle = `rgba(58,240,224,${a})`; out.lineWidth = 3 * dpr; out.beginPath();
  for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { out.moveTo(x, y + sy * L); out.lineTo(x, y); out.lineTo(x + sx * L, y); }
  out.stroke();
  const cx = (x0 + x1) / 2, bob = Math.round(Math.abs(Math.sin(t / 220)) * 6 * dpr), ay = y0 - 8 * dpr - bob, s = 9 * dpr;
  out.fillStyle = `rgba(58,240,224,${0.6 + a * 0.4})`; out.beginPath(); out.moveTo(cx - s, ay - s); out.lineTo(cx + s, ay - s); out.lineTo(cx, ay); out.closePath(); out.fill();
}
