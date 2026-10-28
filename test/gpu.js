'use strict';
// The frame drawn on the GPU (Tycho's batcher and smooth light) against the
// same frame drawn on the 2D canvases: in a few places by day and by night,
// the lit picture and the glow, before the finish, must agree within a few
// tones (the light map is scaled up smooth by the shader on one side and by
// the canvas on the other). Both are drawn in the same page from the same
// moment, the GPU's read back. Pictures of any that don't agree go to
// test/out.
const path = require('path'), fs = require('fs');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'out');
const PLACES = [['d_dragon', 22], ['d_dragon', 13], ['d_noodles', 20], ['d_neonrow', 23], ['d_cellar', 9], ['d_drain', 2], ['d_gardens', 12]];
// within this many tones in any channel, for all but a sliver of pixels
const TONE = 6, SHARE = 0.002;

async function main() {
  const kit = await tk.launch({ gl: true }), server = await tk.serve(ROOT), failures = [];
  try {
    const { page, errors } = await tk.open(kit, { url: server.url + 'index.html', viewport: tk.PHONE_WIDE, ready: '!!window.Downlevel', timeout: 120000 });
    await page.evaluate(() => Save.wipe()); await page.reload();
    await tk.waitFor(page, '!!window.Downlevel', { timeout: 120000 });
    if (!(await page.evaluate(() => !!View.gpu))) failures.push('no WebGL2 here: the GPU path did not start');
    for (const [id, hour] of PLACES) {
      const r = await page.evaluate(([id, hour, TONE]) => {
        Hud.toggle(null); Game.s.day = 3; Game.s.time = hour;
        Game.arrive(id, Object.keys((LEVELS[id].built || LEVELS[id].make()).spawns)[0]);
        Hud.toggle(null); Game.fade = 0; Game.fadeTo = null;
        for (let i = 0; i < 30; i++) step(1 / 60);
        Game.paused = true; Game.cam.x = Player.x; Game.cam.y = Player.y - 52;
        const V = View, G = V.gpu, fin = finishFrame;
        // the GPU's frame, read back before its finish
        let lit, glow;
        finishFrame = () => { lit = G.read('lit'); glow = G.read('glow'); };
        render();
        // the same frame on 2D canvases
        const keep = { lg: V.lg, gg: V.gg, g: V.g };
        const [low, lg] = canvasOf(V.w, V.h), [gl, gg] = canvasOf(V.w, V.h);
        V.gpu = null; V.low = low; V.lg = lg; V.gl = gl; V.gg = gg;
        let c2, e2;
        finishFrame = () => { c2 = lg.getImageData(0, 0, V.w, V.h).data; e2 = gg.getImageData(0, 0, V.w, V.h).data; };
        try { render(); } finally { finishFrame = fin; V.gpu = G; V.lg = keep.lg; V.gg = keep.gg; V.g = keep.g; Game.paused = false; }
        const cmp = (a, b, premul) => {
          let max = 0, over = 0, sum = 0; const n = a.length / 4;
          for (let i = 0; i < a.length; i += 4) {
            const k = premul ? b[i + 3] / 255 : 1;
            const d = Math.max(Math.abs(a[i] - b[i] * k), Math.abs(a[i + 1] - b[i + 1] * k), Math.abs(a[i + 2] - b[i + 2] * k));
            if (d > max) max = d; if (d > TONE) over++; sum += d;
          }
          return { max: Math.round(max), share: over / n, mean: +(sum / n).toFixed(2) };
        };
        const pic = (d) => { const [c, x] = canvasOf(V.w, V.h); const im = x.createImageData(V.w, V.h); for (let i = 0; i < d.length; i += 4) { im.data[i] = d[i]; im.data[i + 1] = d[i + 1]; im.data[i + 2] = d[i + 2]; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c.toDataURL('image/png').split(',')[1]; };
        const p = cmp(lit.data, c2, false), g = cmp(glow.data, e2, true);
        return { p, g, w: V.w, h: V.h, pics: [pic(lit.data), pic(c2)] };
      }, [id, hour, TONE]);
      const line = `${id} ${hour}h: picture worst ${r.p.max}, over ${TONE}: ${(r.p.share * 100).toFixed(2)}%, mean ${r.p.mean}; glow worst ${r.g.max}, over: ${(r.g.share * 100).toFixed(2)}%, mean ${r.g.mean}`;
      console.log('  ' + line);
      if (r.p.share > SHARE || r.g.share > SHARE) {
        failures.push(line);
        fs.mkdirSync(OUT, { recursive: true });
        fs.writeFileSync(path.join(OUT, `gpu-${id}-${hour}-gpu.png`), Buffer.from(r.pics[0], 'base64'));
        fs.writeFileSync(path.join(OUT, `gpu-${id}-${hour}-2d.png`), Buffer.from(r.pics[1], 'base64'));
      }
    }
    for (const e of errors) failures.push('page error: ' + e);
  } finally { await kit.close(); await server.close(); }
  tk.finish('gpu', failures);
}
main().catch((e) => { console.error(e); process.exit(1); });
