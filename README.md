# Downlevel

A side-scrolling cyberpunk noir for the phone. You're a detective in a trench coat with a blaster, tracing four runaway synths down through a vertical city that goes deeper than anyone has mapped.

**Play:** https://doctorallen.github.io/underhill/ (best on a phone held sideways). The repo keeps the name of the game it replaced, Underhill, until it's renamed.

Take a case from Lieutenant Hale at the precinct, fly out in your spinner, find the clues (pick things up, enhance a photo, ask people and catch their lies with evidence), work out the leads on the case board, follow them to the suspect, run the baseline test, and decide: retire, arrest or let go. A case takes a few minutes; the night desk always has another. Strip machines for parts, cut through grates and shutters, jack into data nodes for programs, and take side work from the people you meet. Implants are illegal and you hunt the people who carry them; you carry gadgets instead, built by the precinct's quartermaster, and gear made and upgraded by Mags the fabricator. The way down from each level is guarded.

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
| Use the quick item / switch it | G / T | Item |
| Inventory (cases, gear, items, gadgets) | I | Gear |
| A cab home | | Cab |
| The map (drag, zoom) | M | Pause, then Map |
| Dev settings | | Pause, then Dev settings |
| Pause | Esc | II |

## The city

- **35 places, every one built by hand**, from the Spires above the clouds to the Bowels: home, the precinct, the Stack and street level; up high Neon Row, Kessler Blocks, Glasshouse Plaza, the Skybridge and the Arcology Gardens; on the street the Overpass Market, the Canal Docks, the Scrapyard, Chop Shop Alley and Clinic Row; under it the undercity (the Main Drain, Boiler House Nine, Substation Seven, the Waterworks); then Old Town and its arcade, chapel, old line, cistern market and lantern quarter; the Works with its pump hall, foundry, server farm and coolant vats; the Bowels with its cable run, cooling vaults, gut and old roots.
- **The city map:** every way out (a spinner pad, a subway platform, a lift cage, a manhole) opens a cross-section of the whole city with every place pinned at its depth; tap one and go. The pause menu shows it too.
- **Five story cases** (`CASES` in `cases.js`): the Menagerie on Neon Row, then Iris, Bishop and Wren (the synths who ran, each behind a boss), and the maker in the Spires, with three endings. **The night desk** makes a short case every night (a shot pet, a chrome deal, a missing person) somewhere you can reach.
- **Eighteen jobs** (`QUESTS` in `quests.js`) from Hale and the people of every hub, and a **warrants board** of named chromers.
- **Enemies** (`ENEMY` in `enemies.js`): drones, sentinels, gangers, gunners, bruisers, spider-bots, turrets, shielded corp guards, ferals, Meridian enforcers, and six bosses: the Warden, the Gutter King, the Old Mayor, the Foreman, the Root and Halden. A suspect who runs is a fugitive.
- **Items:** noodle cups, med-patches and stims; frag grenades and EMPs; keys that open the way down; evidence.

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
| `js/items.js` | Salvage, consumables, throwables, keys, evidence, gadgets, programs, gear, shops, loot, the fabricator |
| `js/quests.js` | Jobs and side work (`QUESTS`, `Quests`), named elites, the warrants board |
| `js/cases.js` | Cases (`CASES`, `Cases`), the night desk, ranks, the baseline test |
| `js/enhance.js` | The photo enhancer: a camera still, spots to zoom in on, the clue among decoys |
| `js/world.js` | The level builder and `World` |
| `js/levels.js` | Home, the precinct, the Stack and street level; `cityLayers` |
| `js/kit.js` | The architect's kit: shophouses, capsule towers, townhouses, temples, shrine gates, pagodas, glass towers, shanty stacks, slab blocks, theatres, bathhouses, arcades, shopfronts, trees, fifteen kinds of stall; and `district()`, the frame every place is built in |
| `js/travel.js` | `Travel` (what's open and how you get there), boss arenas, key doors, locals' lines |
| `js/d_high.js` | Up high: Neon Row, Kessler Blocks, Glasshouse Plaza, the Skybridge, the Arcology Gardens, the Spires |
| `js/d_street.js` | Street level: the Overpass Market, the Canal Docks, the Scrapyard, Chop Shop Alley, Clinic Row |
| `js/d_under.js` | The undercity: the Main Drain, Boiler House Nine, Substation Seven, the Waterworks |
| `js/d_old.js` | Old Town and its districts |
| `js/d_works.js` | The Works and its districts |
| `js/d_deep.js` | The Bowels and its districts |
| `js/things.js` | Props in play: looks, yields, prompts, uses |
| `js/game.js` | `Game`: state and rules; programs |
| `js/save.js` | localStorage save and load |
| `js/input.js` | Keyboard and touch |
| `js/player.js` | The runner: movement, ladders, strikes, Use; effects |
| `js/enemies.js` | `ENEMY` and `Foes`: what each enemy is and how it moves, fights and looks |
| `js/actors.js` | People's routines and roles, case witnesses and suspects, enemies in play, bolts, thrown things |
| `js/hack.js` | Jacking in |
| `js/life.js` | The living city: flicker, adverts, flying traffic, rats and a cat, litter, smoke, drips |
| `js/map.js` | The map: the whole level painted at once, dragged and zoomed, with markers |
| `js/worldmap.js` | The city map: the city in cross-section, every place at its depth; travel from it |
| `js/dev.js` | Dev settings: switches and cheats for testing, kept in this browser only |
| `js/flight.js` | Flying: the spinner's destinations, cabs, the flight through the city |
| `js/skyline.js` | The city behind: layered towers, clouds, giant holograms, the monorail |
| `js/gl.js` | The frame's last stage in WebGL2: bloom, reflections, the scale-up |
| `js/render.js` | The frame: layers, light, actors, rain; a 2D finish without WebGL2 |
| `js/hud.js` | HUD and panels |
| `js/panels.js` | The detective's panels: talk, the baseline test, the enhancer, travel, the case file, items |
| `js/pwa.js` | Installing, and reloading onto a new deploy |
| `js/main.js` | Boot and the loop |
| `sw.js`, `manifest.webmanifest`, `icons/` | The service worker (network first), the app manifest and icons |
| `test/check.sh` | Static checks |
| `test/smoke.js` | Headless play-through on phone and desktop |

Plain JavaScript, no build. `python3 -m http.server` and open `localhost:8000`.
