# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Downlevel (the repo is still named `underhill`, the game it replaced) is a side-scrolling cyberpunk game for the phone browser, held sideways, in plain JavaScript: no build step, no dependencies, no modules. You live in a capsule on the Stack, a megablock level of a vertical city, and go down level by level: strip machines for salvage, cut through grates and shutters, jack into data nodes for programs, sell to vendors, take jobs from the fixer, fit ware at the ripperdoc, fight drones, gangs and the Warden. Read `README.md` for the file map and controls, `js/tuning.js` for every number, `js/items.js` for salvage, mods, programs and jobs, and `DESIGN.md` for the design. Sections of `DESIGN.md` marked **(proposed)** aren't built yet. Ask before building on them in a way that's hard to undo.

## Commands

```sh
python3 -m http.server 8000     # play at http://localhost:8000
npm install                     # test tools only (puppeteer-core)
npm test                        # everything CI runs: test/check.sh, then test/smoke.js
```

`test/smoke.js` uses puppeteer-core with `$CHROME`. Where that isn't installed it falls back to the `playwright` package's Chromium.

## Architecture

- **Globals and load order.** Every file is a classic script in one global scope, loaded in order by `index.html` (`util.js` first, `main.js` last). A new file needs its `<script>` tag and a line in `sw.js`'s `FILES` (`test/check.sh` fails on either missing, and on duplicate top-level names).
- **Installable, never stale.** `manifest.webmanifest` and `sw.js` make it a PWA. The service worker goes to the network first for everything (revalidating past the HTTP cache) and uses its cache only offline. The deploy stamps `__BUILD__` in `sw.js` with the commit and writes `version.json`, so every deploy is a new worker; `js/pwa.js` checks for one whenever the game returns to the foreground and every 15 minutes, and when it takes over, saves and reloads. Don't make the worker cache-first.
- **Levels are code.** Each level in `levels.js` is built once through the builder in `world.js` (`newLevel`): painting operations (`L.paint`, `L.block`, `L.sign`, `L.tube`…), solid boxes (`L.solid`, `L.wall`, `L.floor`), one-way surfaces (`L.walk` walkways, `L.stairs`, stood on from above only), ladders, props, lights, people (`L.npc`, with a daily schedule) and enemies. `World.load(id)` makes it the current level. A save keeps only what changed: props done by id (`Game.s.done`), flags, the pack and stash, ware, programs, jobs and the time (`save.js`, localStorage `downlevel.save.v1`).
- **Seeded.** Painting and sprites use `hash` and `Rng` only, never `Math.random` (enforced by `check.sh`), so the city always paints the same.
- **Painting.** `paint.js` paints the level lazily in chunks (`T.chunk` px square). A chunk runs only the operations whose box touches it; each operation gets its own seed (`op.seed`), so strokes meet across chunk edges without seams. Everything is laid in short strokes of close tones (`strokeRow`), and blocks are lit side-on (`blockV`: lit lips, west faces, soot undersides, drips). A level can have a far layer (`L.far`), painted once and moved at a fraction of the camera's speed. A chunk is a colour canvas plus a glow canvas.
- **Rendering** (`render.js`). The view is small (`T.view.min` px on the short side) and scaled up by whole device pixels. Order: far layer, chunks (each erasing the far layer's glow behind it), props, then the light map (`lightMap`, a 4 px grid fixed to the world, scaled up smooth) multiplied over all of it. Keep it smooth: hard light cells read as a grid over the screen. People and enemies are lit after that, each by the light where they stand with a floor (`lightAt`), so figures always read. Then the parts of props in front of people (`p.front`) and rain. The 2D canvases stop there: `View.low` (the lit picture) and `View.gl` (what glows) go to `gl.js`, which finishes the frame in WebGL2: the glow halved by averaging and blurred into two bloom layers (averaging keeps the bloom steady as the camera moves), then picture + glow + bloom, wet reflections (`L.wet`) and the fade, scaled up to the screen. Without WebGL2, or with `?nogl` in the address, `render.js` finishes it in 2D; the smoke test plays the desktop run that way.
- **Sprites** are painted from shapes (`Spr` in `spr.js`: `ell`, `box`, `cap`, `shape`, `limb`, `poly`) and cached. People come from `person(o)` in `people.js` (hair, coat, ware, what they hold, a pose). The runner's ware shows on the sprite (`RunnerArt`). Sprites carry anchors `ax`/`ay` at the feet.
- **Play.** `player.js` moves the runner against the level and works Use (`Player.interact`: the nearest prop or person; salvage and cutting are held). Props' kinds, looks and uses are in `things.js`. People and enemies are in `actors.js`. Jacking in is `hack.js`. `Game` (`game.js`) has the rules: pack and payment, jobs, the clock, moving between levels (`Game.go`), damage and death.
- **Time.** `step(dt)` (`main.js`) is one fixed 1/60 s step. Panels and jacking in set `Game.paused`.

## Testing changes

`node test/smoke.js` plays through the slice headlessly on a phone and a desktop: it steps the game with `step(1/60)` and drives the controls through `Input.bot` and the edge flags (`Input.useHit`, `strikeHit`…), and writes screenshots to `test/out/` (gitignored). Look at them for visual changes. `?seed` isn't used; the levels are fixed.

## Conventions

- Comments and in-game text are plain English. Match the surrounding density.
- Commits go to `main` with short sentence-case subjects. Every push to `main` deploys to GitHub Pages once the checks pass.
