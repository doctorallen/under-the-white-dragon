'use strict';
// The sound, rendered offline in the page (an OfflineAudioContext, so no
// speaker or tap is needed): every cue in sound.js with a spread of its
// options, and every place's music (music.js) for a few bars, by night in
// the rain and by day, must make sound, stay finite, and come out of the
// limiter under full scale; Lin's broken radio plays static and no music.
// Then the game is played on that context: walking, jumping, the ladder,
// the cutter on a machine, the bench's tools and a cab ride make the
// sounds they should, and nothing throws. It runs on Tycho's test kit.
const path = require('path'), fs = require('fs');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'out');
// with --wav, what each place sounds like (at night, dry, half a minute) and
// every cue one after another go to test/out as .wav files, to listen to
const WAV = process.argv.includes('--wav');

// the options each cue is tried with (the rest are tried with none)
const OPTS = {
  step: [{ ground: 'concrete' }, { ground: 'metal' }, { ground: 'wood' }, { ground: 'wet', k: 1 }],
  land: [{ k: 1, ground: 'metal' }, { k: 0.2 }],
  door: [{ look: 'noren' }, { look: 'glass' }, { look: 'steel' }, {}],
  probe: [{ r: 'ok' }, { r: 'worn' }, { r: 'dead' }, {}],
  power: [{ res: 'works' }, { res: 'half' }, { res: 'dead' }, { res: 'smoke' }],
  screw: [{ in: true }, {}], flow: [{}, { set: true }], scorch: [{}, { cooked: true }], casing: [{}, { on: true }],
  heat: [{ n: 5 }, { n: 25 }], coins: [{ n: 1 }, { n: 5 }], blip: [{ pitch: 260 }], murmur: [{ pitch: 200 }],
};

// 16-bit stereo PCM, with its header
function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function main() {
  const kit = await tk.launch(), server = await tk.serve(ROOT), failures = [];
  try {
    const { page, errors } = await tk.open(kit, { url: server.url + 'index.html', viewport: tk.DESKTOP, ready: '!!window.Downlevel', timeout: 120000 });
    await page.evaluate(() => Save.wipe()); await page.reload();
    await tk.waitFor(page, '!!window.Downlevel', { timeout: 120000 });
    const r = await page.evaluate(async ([OPTS, WAV]) => {
      const out = { cues: [], moods: [], played: {}, problems: [] }, RATE = 22050;
      Snd.tick = () => {}; // (the page's loop keeps out of it: what's heard is only what's scheduled here)
      // a render: the engine and the music built on an offline context, fn
      // schedules what's heard, then its peak and loudness
      const render = async (secs, fn) => {
        const c = new OfflineAudioContext(2, Math.round(RATE * secs), RATE);
        Snd.build(c, false); Music.build(Snd); fn(c);
        const b = await c.startRendering();
        let peak = 0, sum = 0, bad = false;
        for (let ch = 0; ch < b.numberOfChannels; ch++) for (const v of b.getChannelData(ch)) { if (!Number.isFinite(v)) bad = true; const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
        return { peak, rms: Math.sqrt(sum / (b.length * b.numberOfChannels)), bad };
      };
      Hud.toggle(null);
      // every cue, with its options
      for (const name of Object.keys(SND_CUES)) for (const o of OPTS[name] || [{}]) {
        let ok = false; const s = await render(2, () => { ok = Snd.play(name, o, 0.05); });
        out.cues.push({ name, o: JSON.stringify(o), ok, peak: +s.peak.toFixed(4), bad: s.bad });
      }
      // every place's music, by night in the rain and by day in the dry
      for (const id of Object.keys(MUS_MOODS)) for (const [day, rain] of [[0, 0.9], [1, 0]]) {
        const st = { id, m: MUS_MOODS[id], day, heat: 60, rain, roof: rain, radio: true, bench: false, talking: false };
        const s = await render(10, () => { for (let t = 0; t < 9.5; t += 0.1) Music.update(t, st); });
        out.moods.push({ id, day, peak: +s.peak.toFixed(4), rms: +s.rms.toFixed(5), bad: s.bad });
      }
      // Lin's radio, broken: static, and no music under it (the pad's level, as it was last set)
      for (const radio of [true, false]) {
        const st = { id: 'bar', m: MUS_MOODS.bar, day: 0, heat: 0, rain: 0, roof: 0, radio, bench: false, talking: false };
        const s = await render(4, () => { for (let t = 0; t < 3.5; t += 0.1) Music.update(t, st); });
        out['radio' + radio] = { pad: Music.targets.get(Music.v.pad.out.gain) || 0, rms: s.rms };
      }
      // previews to listen to: each place, and a reel of every cue
      if (WAV) {
        const pcm = async (secs, fn) => {
          const c = new OfflineAudioContext(2, RATE * secs, RATE); Snd.build(c, false); Music.build(Snd); fn(); const b = await c.startRendering();
          const L = b.getChannelData(0), R = b.getChannelData(1), i16 = new Int16Array(L.length * 2);
          for (let i = 0; i < L.length; i++) { i16[i * 2] = Math.max(-1, Math.min(1, L[i])) * 32767; i16[i * 2 + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
          let bin = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
          return btoa(bin);
        };
        out.wav = {};
        for (const id of Object.keys(MUS_MOODS)) { const st = { id, m: MUS_MOODS[id], day: 0, heat: 0, rain: 0, roof: 0, radio: true, bench: false, talking: false }; out.wav['music-' + id] = await pcm(30, () => { for (let t = 0; t < 29.5; t += 0.1) Music.update(t, st); }); }
        const reel = []; for (const name of Object.keys(SND_CUES)) for (const o of OPTS[name] || [{}]) reel.push([name, o]);
        out.wav.cues = await pcm(Math.ceil(reel.length * 0.9) + 2, () => reel.forEach(([n, o], i) => { Snd.last = {}; Snd.play(n, o, 0.3 + i * 0.9); }));
        out.reel = reel.map(([n, o], i) => `${(0.3 + i * 0.9).toFixed(1)}s ${n} ${JSON.stringify(o)}`);
      }
      // the game played on an offline context: what it calls for, by name
      const c = new OfflineAudioContext(2, RATE * 30, RATE); Snd.build(c, false); Music.build(Snd);
      const play = Snd.play.bind(Snd); Snd.play = (n, o, w) => { out.played[n] = (out.played[n] || 0) + 1; Snd.last = {}; return play(n, o, w); };
      let now = 0; const tick = (n) => { for (let i = 0; i < n; i++) { if (!Game.paused) step(1 / 60); now += 1 / 60; Music.tick(1 / 60); Music.lastUp = -9; } };
      const run = (bot, n) => { Input.bot = bot; tick(n); Input.bot = null; Input.ax = Input.ay = 0; Input.use = Input.jump = false; };
      try {
        run({ ax: 1 }, 90); run({ ax: 0.3 }, 60); run({ ax: -1 }, 60);
        Input.jumpHit = true; run({ jump: true }, 50);
        // up a ladder, on the first street with one
        const lid = Object.keys(LEVELS).find((k) => (LEVELS[k].built || LEVELS[k].make()).ladders.length);
        Game.arrive(lid, Object.keys(LEVELS[lid].built.spawns)[0]); Hud.toggle(null); Game.fade = 0;
        const L = World.L.ladders[0]; Player.place(L.x, L.y1); run({ ay: -1 }, 120);
        // the bench: a screw under the driver, the iron on a joint, the probe
        Game.arrive('d_cellar', 'bed'); Hud.toggle(null); Bench.open();
        const b = Bench.b; if (b) { const [sx, sy] = Bench.screwAt(0); Bench.tool = 'driver'; Bench.press(sx, sy); for (let i = 0; i < 160; i++) { Bench.step(1 / 60); tick(1); } Bench.release(); }
        Bench.test(); Hud.toggle(null);
        // a machine stripped out front, and a cab ride
        Game.arrive('d_dragon', 'enter'); Hud.toggle(null);
        const m = World.props.find((p) => YIELDS[p.kind] && !p.done && Tips.canStrip(p.kind));
        if (m) { Player.place(m.x - 10, m.y); Input.useHit = true; run({ use: true }, Math.ceil(STRIP_TIME[m.kind] * 60) + 30); }
        // in at the White Dragon's door, and a cab ride
        const door = World.props.find((p) => p.kind === 'door' && p.to); if (door) { Props.use(door); run({}, 40); }
        Flight.start('d_overpass', 'enter', true); run({}, 330);
      } catch (e) { out.problems.push(String(e && e.stack || e)); }
      Snd.play = play;
      return out;
    }, [OPTS, WAV]);
    if (r.wav) {
      fs.mkdirSync(OUT, { recursive: true });
      for (const [k, b64] of Object.entries(r.wav)) fs.writeFileSync(path.join(OUT, 'sound-' + k + '.wav'), wav(Buffer.from(b64, 'base64'), 22050));
      fs.writeFileSync(path.join(OUT, 'sound-cues.txt'), r.reel.join('\n') + '\n');
      console.log('sound: previews in test/out/sound-*.wav (what plays when in the cues reel: sound-cues.txt)');
    }

    for (const q of r.cues) {
      if (!q.ok) failures.push(`the cue ${q.name} ${q.o} did not play`);
      else if (q.bad) failures.push(`the cue ${q.name} ${q.o} made a sample that isn't a number`);
      else if (q.peak < 1e-4) failures.push(`the cue ${q.name} ${q.o} is silent`);
      else if (q.peak > 1) failures.push(`the cue ${q.name} ${q.o} clips (${q.peak})`);
    }
    for (const q of r.moods) {
      if (q.bad) failures.push(`${q.id}'s music made a sample that isn't a number`);
      else if (q.rms < 1e-4) failures.push(`${q.id}'s music is silent (${q.day ? 'by day' : 'by night'})`);
      else if (q.peak > 1) failures.push(`${q.id}'s music clips (${q.peak})`);
    }
    if (!(r.radiotrue.pad > 0)) failures.push('the bar\'s radio, fixed, plays no music');
    if (r.radiofalse.pad !== 0) failures.push('the bar\'s radio, broken, still plays music');
    if (!(r.radiofalse.rms > 1e-5)) failures.push('the bar\'s broken radio makes no static');
    for (const n of ['step', 'jump', 'rung', 'strip', 'screw', 'power', 'liftoff', 'touchdown', 'door']) if (!r.played[n]) failures.push(`playing the game never called for "${n}"`);
    for (const p of r.problems) failures.push('the game threw while it was heard: ' + p);
    const errs = errors;
    if (errs.length) failures.push('errors in the page: ' + errs.slice(0, 5).join(' | '));
    if (process.argv.includes("--levels")) { for (const q of r.moods) console.log(q.id.padEnd(9), q.day ? "day  " : "night", "rms", q.rms, "peak", q.peak); for (const q of r.cues) console.log(q.name.padEnd(9), q.o.padEnd(26), "peak", q.peak); }
    console.log(`sound: ${r.cues.length} cues and ${r.moods.length} moods rendered; the game called for ${Object.keys(r.played).sort().map((k) => k + ' ' + r.played[k]).join(', ')}`);
  } finally { await kit.close(); await server.close(); }
  tk.finish('sound', failures);
}
main().catch((e) => { console.error(e); process.exit(1); });
