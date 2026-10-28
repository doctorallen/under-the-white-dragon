# Under the White Dragon

A side-scrolling cyberpunk game for the phone. You fix what the city breaks, in a hidden basement under the White Dragon, a noodle bar high in a vertical city; the way down is a trapdoor under a rug in the storeroom, and some of what you fix is illegal.

**Play:** https://doctorallen.github.io/under-the-white-dragon/ (best on a phone held sideways).

People bring broken things to the bar: Ozzy's cab nav unit, Vey's seizing arm. Take a job to your bench and open it up for real: back the screws out (ease off when one binds, or strip it), probe each part, melt the joints of the bad one with the iron (not too long, or you cook the board), seat a good one and solder it in, close it up and power it up. Parts have a kind, a grade (scrap, street, clinic, Meridian) and a history: strip them from machines, buy them at the Overpass Market and Clinic Row, or take them from where you shouldn't. Hand the fix back at the counter, and the next morning you hear what it did. Heat is how close the precinct is to your door: illegal work and traceable parts raise it, honest repairs and time bring it down. The design is in [the design doc](https://claude.ai/artifact/6q6FiLoTUN74PSnhsy7hNT).

There's no fighting: the danger is heat. The game grew out of Downlevel, a detective game in the same city; its cases, enemies, gear and the precinct are gone, and its deeper districts are part of the city now.

## The basement

- **The White Dragon** (`d_dragon.js`): the street with the tall neon sign, Auntie Lin's bar and her storeroom, with a rug over the trapdoor; down the ladder, the basement (`d_cellar`, kept off the city map), a ripper's den made out of a cellar: red neon over grimy tile, the work chair under articulated lamps, monitors on arms, glowing canisters, spare chrome on hooks, teal screens round the cot; the bench, the parts shelf (your parts and the notebook), a terminal. Sleeping brings the morning after.
- **The bench** (`bench.js`): Driver, Probe, Iron, Hands and the Lens on a close-up of the thing.
- **Parts and the notebook** (`parts.js`): `PART`, `GRADE`, `DEVICE` (frames with slots), stall stock, what stripping a machine gives.
- **Jobs and heat** (`jobs.js`): Ozzy (an honest repair) and Vey (a synth's arm: a scrap servo from Nurse Kade, or a Meridian one from the clinic cabinet that can be traced). At 40 heat the block starts to talk; at 70 a detective knocks before dawn and searches upstairs; at 90 he finds the trapdoor and takes any illegal work off the bench.
- **Where parts come from**: machines you strip (junk piles, vending machines and parked cars come back after a few days, `RESTOCK` in `things.js`), Mo's grocery (cells and relays), Mechanic Ana and Nurse Kade, and residents' tips. The stalls' scrap bins take dead parts and salvage.
- **Tips and tools** (`tips.js`): residents message you in the morning (or tell you to your face) about a crashed drone, a forgotten junction box, a dumped autodoc. It's there to strip until you do, but the good ones need better tools: the precision kit (150 cr, Ana) and the clinic micro-kit (400 cr, Kade). Better tools also strip server racks and get cleaner parts out of everything.

## Running it

The engine, Tycho, and the residents' minds, Tyrell, which lives inside it, come in as a git submodule. After cloning, `git submodule update --init` (or clone with `--recurse-submodules`), then serve the folder: `python3 -m http.server 8000`.

## Install

On Android the browser offers to install it the first time you tap; after that, use Install in the pause menu (or the browser's menu). On iPhone, Share, then Add to Home Screen. The installed game plays offline, and always checks for a new version: whenever it comes back to the foreground it looks for one, and if there is one it saves and reloads onto it. The pause menu shows the build.

## Controls

| | Keyboard | Phone |
|---|---|---|
| Move (walk or run) | Arrows / WASD, hold Shift to walk | Drag on the left side: a little to walk, all the way to run |
| Ladders | Up / down | Stick up / down |
| Drop through a walkway | Down + jump | Stick down + Jump |
| Jump | Space / K | Jump |
| Use (hold to strip) | E | The button names the action: Trade, Talk, Strip, Climb… |
| Jobs and pockets | I | Jobs |
| A cab home | | Cab |
| The map (drag, zoom) | M | Pause, then Map |
| Dev settings | | Pause, then Dev settings |
| Pause | Esc | II |

## The city

- **Every place built by hand**, from the Spires above the clouds down to the Bowels: up high the White Dragon's block, Neon Row, Kessler Blocks, Glasshouse Plaza, the Skybridge and the Arcology Gardens; on the street the Overpass Market, the Canal Docks, the Scrapyard, Chop Shop Alley and Clinic Row; under the street the Main Drain, Boiler House Nine, Substation Seven and the Waterworks; then Old Town and its districts, the Works and its districts, and the Bowels. Each band down opens once you've been in the one above.
- **The city map:** every way out (a cab stand, a subway platform, a cage elevator, a manhole) opens a cross-section of the whole city with every place pinned at its depth; tap one and go. The pause menu shows it too.
- **Its people:** the block's residents live their days (homes, jobs, friends, errands) whether you're watching or not, and remember what you do in front of them; everyone else has a name of their own.
- **Talk** (`talk.js`): stop someone and you talk. They raise what's theirs first (what they saw you strip, a job for the bench, the thing you fixed, a lead), then you ask after their work, their fun, who's at home, what's going round. How you say it (straight, warm, a joke, a question, haggling, a lie, money) lands well or badly by who they are and how things stand, and moves their regard; a witness you talk round, or pay off, keeps quiet.
- **Weather:** rain comes and goes through the day, and the streets shine only while they're wet.

## Files

| File | What it is |
|---|---|
| `index.html` | The page; loads every script in order |
| `css/style.css` | HUD, touch controls, panels |
| `js/util.js` | Math, `hash`, `noise`, `Rng`, colors, `rampOf`, `strokeRow` |
| `js/tuning.js` | Every number (`T`) |
| `js/spr.js` | The shape painter for sprites (`Spr`) |
| `js/paint.js` | Materials, the city painter (`Pix`), decals, the chunk cache |
| `js/people.js` | People, side-on and from behind |
| `js/props.js` | Props: stalls, machines, doors, the bench and shelf |
| `js/dragon.js` | The White Dragon's neon sign and the dragon drawn as tubes (also the icon) |
| `js/items.js` | Salvage: what you carry |
| `js/world.js` | The level builder and `World` |
| `js/levels.js` | What places share: deco by name, everyone's names, what people say, `cityLayers` |
| `js/kit.js` | The architect's kit: shophouses, capsule towers, townhouses, temples, shrine gates, pagodas, glass towers, shanty stacks, slab blocks, theaters, bathhouses, arcades, shopfronts, trees, fifteen kinds of stall; and `district()`, the frame every place is built in |
| `js/travel.js` | `Travel` (what's open and how you get there), great halls, locals' lines |
| `js/d_high.js` | Up high: Neon Row, Kessler Blocks, Glasshouse Plaza, the Skybridge, the Arcology Gardens, the Spires |
| `js/d_street.js` | Street level: the Overpass Market, the Canal Docks, the Scrapyard, Chop Shop Alley, Clinic Row |
| `js/d_under.js` | The undercity: the Main Drain, Boiler House Nine, Substation Seven, the Waterworks |
| `js/d_old.js` | Old Town and its districts |
| `js/d_works.js` | The Works and its districts |
| `js/d_deep.js` | The Bowels and its districts |
| `js/d_dragon.js` | The White Dragon: its street, the noodle bar and storeroom, and the basement under it |
| `js/d_block.js` | The block's other interiors: Mo's grocery, the apartments |
| `js/things.js` | Props in play: looks, yields, prompts, uses |
| `js/game.js` | `Game`: state and rules |
| `js/save.js` | localStorage save and load |
| `js/input.js` | Keyboard and touch |
| `js/player.js` | The runner: movement, ladders, Use; sparks |
| `js/actors.js` | People's routines, roles and talk |
| `js/parts.js` | Parts, devices, stall stock and the notebook (`Parts`) |
| `js/bench.js` | The bench: the repair, its tools and its drawing (`Bench`) |
| `js/jobs.js` | Jobs at the White Dragon, residents' odd jobs, heat, the morning after (`Jobs`) |
| `js/tips.js` | Residents' tips about parts out in the city, and the tool tiers that strip them (`Tips`, `TOOLS`, `TIPS`) |
| `js/tutorial.js` | The opening: Lin's radio on the bench, walked through step by step, then Ozzy's nav unit and where parts come from (`Tutorial`, `TUT`) |
| `js/town.js` | The city's people on screen: the block's own residents and their days, the routes between places, who's in your level now (`Town`, `RESIDENTS`) |
| `js/census.js` | Every place in the city people live, work and spend time, read from the levels: streets, rooms, doors, spots, posts (`Census`) |
| `js/folk.js` | The city's population: households made to fill the jobs and homes, with schools and hobbies (`Folk`) |
| `js/tyrellmode.js` | Dev: Tyrell mode, the city's minds on a map, each mind open to read, and the clock to run (`TyrellMode`, on Tycho's inspector) |
| `js/city.js` | The residents' minds: the White Dragon's shell for Tyrell, which runs their days, needs, hobbies, memories and gossip, and saves them (`City`) |
| `js/talk.js` | Conversations, on Tyrell's Voice: the ways of coming at someone, the subjects (a job pitched and haggled, the hand-back, a lead, a witness having it out with you, small talk from their lives) and their words (`Talk`) |
| `vendor/tycho/` | Tycho, the engine, with Tyrell, the minds engine, inside it (a git submodule; the game loads the built scripts in `dist/`) |
| `js/day.js` | Day and night, and the weather (`Day`, `Weather`) |
| `js/life.js` | The living city: flicker, adverts, flying traffic, rats and a cat, litter, smoke, drips |
| `js/map.js` | The map: the whole level painted at once, dragged and zoomed, with markers |
| `js/worldmap.js` | The city map: the city in cross-section, every place at its depth; travel from it |
| `js/dev.js` | Dev settings for testing, kept in this browser only: switches, weather, go to a place or someone |
| `js/flight.js` | Flying: the spinner's destinations, cabs, the flight through the city |
| `js/skyline.js` | The city behind: layered towers, clouds, giant holograms, the monorail |
| `js/render.js` | The frame: layers, light, actors, rain, drawn on the GPU through Tycho's renderer (or on 2D canvases without WebGL2, finished in 2D) |
| `js/hud.js` | HUD and panels (toasts and rising lines on Tycho's `Tycho.ui`) |
| `js/panels.js` | Panels: talk, the morning, the stalls, the bench, the shelf, travel, pockets |
| `js/pwa.js` | Installing, and reloading onto a new deploy |
| `js/main.js` | Boot and the loop |
| `fonts/dragon.woff`, `tools/mkfont.py` | Dragon Pixel, the game's own pixel font, and the script that builds it from its glyphs |
| `sw.js`, `manifest.webmanifest`, `icons/` | The service worker (network first), the app manifest and icons |
| `test/check.sh` | Static checks |
| `test/smoke.js` | Headless play-through on phone and desktop |

Plain JavaScript, no build. `python3 -m http.server` and open `localhost:8000`.
