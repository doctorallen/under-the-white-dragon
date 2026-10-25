# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Underhill is a side-on painted-pixel digging game for the phone browser (held sideways) in plain JavaScript: no build step, no dependencies, no modules. A small folk lives in a burrow under a hill in Thistledown and digs down through the cellars, the Old Diggings, the dwarves' Old Growth and into the Seam, where the rock turns to circuitry and a rift hangs open. Ore and curios come home in the pack; ore goes to the bins and the bench makes better kit from it, and curios go on the shelves and fill the catalog. Read `README.md` for the file map and controls, `js/tuning.js` for every number, and `DESIGN.md` for the design. Sections of `DESIGN.md` marked **(proposed)** aren't built yet. Ask before building on them in a way that's hard to undo.

## Commands

```sh
python3 -m http.server 8000     # play at http://localhost:8000
npm install                     # test tools only (puppeteer-core)
npm test                        # everything CI runs: test/check.sh, then test/smoke.js
```

`test/smoke.js` uses puppeteer-core with `$CHROME`. Where that isn't installed it falls back to the `playwright` package's Chromium.

## Architecture

- **Globals and load order.** Every file is a classic script in one global scope, loaded in order by `index.html` (`util.js` first, `main.js` last). A new file needs its `<script>` tag. `test/check.sh` fails on duplicate top-level names.
- **Seeded.** The world comes from `generateWorld(seed)` (`world.js`) using `Rng` and `hash` only. Painting and sprites use `hash` only, never `Math.random` (enforced by `check.sh`). A save is the seed, the indices of dug tiles (`World.dug`) and `Game.s` (`save.js`, localStorage `underhill.save.v1`).
- **Tiles.** `T.tile` is 12 px. Collision and digging work on the grid (`World.tiles`, materials `M`/`MAT`). `World.room` marks home (1), tunnels (2), halls (3) and cellars (4). A material's `tier` is the pick it needs (`PICKS` in `craft.js`). An ore material names the item it gives and the rock it sits in (`host`).
- **Time.** `step(dt)` (`main.js`) is one fixed 1/60 s step. Panels set `Game.paused`.
- **Rendering.** The view is small (`T.view.min` px on the short side) and scaled up by whole device pixels (`render.js View`). Nothing is drawn as a tile. `paint.js` paints chunks (32 tiles square) lazily: the tiles' solidity smoothed and wobbled by noise, laid in short strokes of close tones (`strokeRow`), and lit side-on (lit lips, west faces, soot undersides). A chunk is repainted when a tile in or near it is dug (`Paint.changed`). Each chunk and sprite has a colour canvas and an optional glow canvas. A frame is the sky, then the chunks, props, ladders, torches and the folk. Then the banded light map (`lightMap`, a 4 px grid fixed to the world) is multiplied over it, and the glow and its bloom are added back on top. Sprites are painted from shapes (`Spr` in `sprites.js`: `ell`, `box`, `limb`, `poly`) and cached. They carry anchors `ax`/`ay` at the feet.
- **Art style.** Painted: strokes of a few close tones, no outlines, light from the upper left. Only the strange things glow (the wire, the seam's circuitry and crystals, the rift, goggle lenses, lamps). New ramps go through `rampOf` so neighbouring tones are evenly spaced.

## Testing changes

`node test/smoke.js` drives the game headlessly on a phone and a desktop, steps it with `step(1/60)` while setting `Input.ax/ay/dig/ladderHit`, and writes screenshots to `test/out/` (gitignored). Look at them for visual changes.

## Conventions

- Comments and in-game text are plain English. Match the surrounding density.
- Commits go to `main` with short sentence-case subjects. Every push to `main` deploys to GitHub Pages once the checks pass.
