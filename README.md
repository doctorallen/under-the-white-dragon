# Downlevel

A side-scrolling cyberpunk game for the phone. You live in a capsule in a megablock, and the city goes down further than anyone has mapped.

**Play:** https://doctorallen.github.io/underhill/ (best on a phone held sideways). The repo keeps the name of the game it replaced, Underhill, until it's renamed.

Strip machines for parts. Cut through grates and shutters. Jack into data nodes for programs. Sell salvage to vendors, take jobs from Juno the fixer, and have the ripperdoc build and fit ware into your body. Every piece of ware changes how you move or fight, and your nervous system only takes so much. The way down from each level is guarded.

## Controls

| | Keyboard | Phone |
|---|---|---|
| Move | Arrows / WASD | Drag on the left side |
| Ladders | Up / down | Stick up / down |
| Drop through a walkway | Down + jump | Stick down + Jump |
| Jump (twice with spring legs) | Space / K | Jump |
| Strike | J | Strike |
| Use (hold to strip or cut) | E | The button names the action: Trade, Talk, Strip, Cut, Hack, Climb… |
| Run program / pick next | Q / R | Program (hold to pick) |
| Pack | I | Pack |
| Pause | Esc | II |

## The first slice

- **The Stack (L1):** your capsule, Doc Vasquez's clinic, the market with Mama Ruiz's noodles and Kit's salvage stand, Juno's bar, two walkways up, the residential block, block drones, a data node with Breach, and the service yard with the Warden, the freight lift and the shaft down.
- **Street level (L2):** under the overpasses. Ozu pays more for salvage, a back-alley clinic hides a node with Puppet, a fire escape leads to a rooftop node with Ghost (spring legs needed), gangers hold the turf past the fire, a heavy shutter hides their stash (mantis blades needed), and the old subway to Old Town is sealed for now.
- **Ware:** lowlight optics, spring legs, mantis blades. **Programs:** Breach, Ghost, Puppet. **Jobs:** three from Juno, the last of which pays a neural booster.

## Files

| File | What it is |
|---|---|
| `index.html` | The page; loads every script in order |
| `css/style.css` | HUD, touch controls, panels, jacking in |
| `js/util.js` | Maths, `hash`, `noise`, `Rng`, colours, `rampOf`, `strokeRow` |
| `js/tuning.js` | Every number (`T`) |
| `js/spr.js` | The shape painter for sprites (`Spr`) |
| `js/paint.js` | Materials, the city painter (`Pix`), decals, the chunk cache |
| `js/people.js` | People, drones, the Warden |
| `js/props.js` | Props: stalls, machines, doors, grates, nodes, the lift |
| `js/items.js` | Salvage, mods, programs, jobs |
| `js/world.js` | The level builder and `World` |
| `js/levels.js` | The Stack and street level |
| `js/things.js` | Props in play: looks, yields, prompts, uses |
| `js/game.js` | `Game`: state and rules; programs |
| `js/save.js` | localStorage save and load |
| `js/input.js` | Keyboard and touch |
| `js/player.js` | The runner: movement, ladders, strikes, Use; effects |
| `js/actors.js` | People's routines and roles, enemies, the Warden, bolts |
| `js/hack.js` | Jacking in |
| `js/render.js` | The frame: layers, light, actors, glow, reflections, rain |
| `js/hud.js` | HUD and panels |
| `js/main.js` | Boot and the loop |
| `test/check.sh` | Static checks |
| `test/smoke.js` | Headless play-through on phone and desktop |

Plain JavaScript, no build. `python3 -m http.server` and open `localhost:8000`.
