# Underhill

A small folk digs down under the hill, through old cellars and dwarf halls, to where the rock turns strange.

**Play:** https://doctorallen.github.io/underhill/ (best on a phone held sideways).

Dig down from your burrow. Bring ore and curios home in your pack. Ore goes to the bins, and the bench turns it into better picks, lamps, packs, torches and ladders. Curios go on the shelves and into the catalog. A better pick gets through harder rock, and harder rock is where the stranger things are.

## Controls

| | Keyboard | Phone |
|---|---|---|
| Move, aim | Arrows / WASD | Drag on the left half |
| Climb | Up, against rock or on a ladder | Stick up |
| Jump | Space / K | Jump |
| Dig | J / X (hold; aim with up/down) | Dig (hold) |
| Torch | T | Torch |
| Ladder | L | Ladder |
| Bench (at home) | E | Bench |
| Catalog | C | Catalog |
| Pause | Esc | II |

## Strata

| Depth | Stratum | Rock (pick) | Ore | Curios |
|---|---|---|---|---|
| 0–15 m | Cellars & roots | earth (old) | copper, some coal | coin, spoon, brass button |
| 15–45 m | The Old Diggings | clay (old) | copper, tin, coal | rusted ironwork, copper wire |
| 45–95 m | Old Growth | stone (bronze), dressed stone (iron) | iron ore, mithril (iron), glow shard (iron) | rune-stone, old goggles |
| 95–135 m | The Seam | seam rock (mithril) | | spice crystal, neon crystal, circuit chip |

## Files

| File | What it is |
|---|---|
| `index.html` | The page; loads every script in order |
| `css/style.css` | HUD, touch controls, panels |
| `js/util.js` | Maths, `hash`, `noise`, `Rng`, colours, `rampOf`, `strokeRow` |
| `js/tuning.js` | Every number (`T`) |
| `js/world.js` | Materials, items, `World`, `generateWorld(seed)` |
| `js/paint.js` | The painted chunks and the finds in the rock |
| `js/sprites.js` | The shape painter `Spr`, the small folk's frames, props, icons |
| `js/craft.js` | Picks, lamps, packs and the bench's recipes |
| `js/game.js` | `Game` state, toasts, the bag and unpacking |
| `js/save.js` | localStorage save and load |
| `js/input.js` | Keyboard and touch |
| `js/player.js` | Movement, climbing, digging, torches, ladders, chips |
| `js/render.js` | The frame: sky, chunks, props, light map, glow and bloom |
| `js/hud.js` | Depth, bag, toasts, the bench, catalog and pause panels |
| `js/main.js` | Boot and the loop |
| `test/check.sh` | Static checks |
| `test/smoke.js` | Headless play-through on phone and desktop |

Plain JavaScript, no build. `python3 -m http.server` and open `localhost:8000`.
