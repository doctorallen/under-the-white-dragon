# Downlevel

A side-scrolling cyberpunk noir for the phone. You're a detective in a trench coat with a blaster, tracing four runaway synths down through a vertical city that goes deeper than anyone has mapped.

**Play:** https://doctorallen.github.io/underhill/ (best on a phone held sideways). The repo keeps the name of the game it replaced, Underhill, until it's renamed.

Strip machines for parts. Cut through grates and shutters. Jack into data nodes for programs. Sell salvage to vendors, take cases from Lieutenant Hale at the precinct, and fly there and back in your spinner. Implants are illegal and you hunt the people who carry them; you carry gadgets instead, built by the precinct's quartermaster, and gear made and upgraded by Mags the fabricator. The way down from each level is guarded.

## Install

On Android the browser offers to install it the first time you tap; after that, use Install in the pause menu (or the browser's menu). On iPhone, Share, then Add to Home Screen. The installed game plays offline, and always checks for a new version: whenever it comes back to the foreground it looks for one, and if there is one it saves and reloads onto it. The pause menu shows the build.

## Controls

| | Keyboard | Phone |
|---|---|---|
| Move (walk or run) | Arrows / WASD, hold Shift to walk | Drag on the left side: a little to walk, all the way to run |
| Ladders | Up / down | Stick up / down |
| Drop through a walkway | Down + jump | Stick down + Jump |
| Jump (twice with jump jets) | Space / K | Jump |
| Fire (a blow up close) | J | Fire |
| Use (hold to strip or cut) | E | The button names the action: Trade, Talk, Strip, Cut, Hack, Climb… |
| Run program / pick next | Q / R | Program (hold to pick) |
| Inventory (gear, items, gadgets, cases) | I | Gear |
| A cab home | | Cab |
| The map (drag, zoom) | M | Pause, then Map |
| Dev settings | | Pause, then Dev settings |
| Pause | Esc | II |

## The first slice

- **Floor 31 (home):** your apartment (bed, closet, a window on the city), the hall past the neighbours' doors, the elevator to the Stack and, once you've been there, street level, and the landing pad with your spinner.
- **Precinct 9:** a pad for the spinner, the desk sergeant, the cells, Lieutenant Hale's office (cases) and Quartermaster Ito's armoury (gadgets).
- **The Stack (L1):** the elevator up home, Doc Vasquez's clinic (he doesn't fit chrome any more, he says), the market with Mama Ruiz's noodles, Kit's salvage stand and Mags's fabrication stall, Juno's bar (she's an informant now), two walkways up, the residential block, block drones, a data node with Breach, and the service yard with the Warden, the freight lift and the shaft down.
- **Street level (L2):** under the overpasses. Ozu pays more for salvage, a back-alley clinic hides a node with Puppet, a fire escape leads to a rooftop node with Ghost (jump jets needed), gangers hold the turf past the fire, a heavy shutter hides their stash (a plasma cutter needed), and the old subway to Old Town is sealed for now.
- **Gadgets:** spectral lenses, jump jets, a plasma cutter. **Programs:** Breach, Ghost, Puppet. **Cases:** three from Hale: the walkway drones, a chrome warrant on the street gang, then the clinic's record.

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
| `js/life.js` | The living city: flicker, adverts, flying traffic, rats and a cat, litter, smoke, drips |
| `js/map.js` | The map: the whole level painted at once, dragged and zoomed, with markers |
| `js/dev.js` | Dev settings: switches and cheats for testing, kept in this browser only |
| `js/flight.js` | Flying: the spinner's destinations, cabs, the flight through the city |
| `js/skyline.js` | The city behind: layered towers, clouds, giant holograms, the monorail |
| `js/gl.js` | The frame's last stage in WebGL2: bloom, reflections, the scale-up |
| `js/render.js` | The frame: layers, light, actors, rain; a 2D finish without WebGL2 |
| `js/hud.js` | HUD and panels |
| `js/pwa.js` | Installing, and reloading onto a new deploy |
| `js/main.js` | Boot and the loop |
| `sw.js`, `manifest.webmanifest`, `icons/` | The service worker (network first), the app manifest and icons |
| `test/check.sh` | Static checks |
| `test/smoke.js` | Headless play-through on phone and desktop |

Plain JavaScript, no build. `python3 -m http.server` and open `localhost:8000`.
