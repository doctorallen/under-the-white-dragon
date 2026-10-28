# Under the White Dragon: design

You fix things in a hidden basement under a noodle bar, and heat, not shooting, is the danger. The full design is in [the design doc](https://claude.ai/artifact/6q6FiLoTUN74PSnhsy7hNT). The game grew out of Downlevel, a detective game in the same city: its cases, side jobs, enemies, gear, gadgets, programs and the precinct are gone from the code, and the deeper districts it built are part of the city now.

## Built: the basement

- **Home is under the White Dragon** (`d_dragon.js`): a street with the neon sign (`dragon.js`), Auntie Lin's bar, her storeroom with a rug over the trapdoor, and down the ladder the basement (`d_cellar`, its own place, `hidden` so it's not on the city map or open to travel): bench, parts shelf, cot, a terminal. New games start by the cot. Customers wait at the bar.
- **The bench** (`bench.js`), hands-on and saved as it stands (`Game.s.bench`), so a job waits: unscrew (a screw binds now and then: ease off, or strip it, and it never holds tight again), probe (fine, worn, dead, burnt, wrong gauge), desolder and solder with the iron (three scorches cook the control board), lift parts out and seat new ones, close up, power up: works, half works, dead or smoke. The lens shows wear, burns and serials.
- **Parts** (`parts.js`) have a kind, a grade (scrap, street, clinic, Meridian), a state, sometimes a gauge, and where they came from and how. Stripping a machine gives a scrap part; Mechanic Ana (Overpass Market) and Nurse Kade (Clinic Row) sell them; the clinic cabinet on Clinic Row holds a Meridian servo, for heat. **The notebook** learns a device once you've probed every part, and jots each fault.
- **Jobs** (`jobs.js`): Ozzy's dead nav unit (a dead cell and a burnt aerial; 80 cr; a clean fix means free cab rides) and Vey's seizing arm (a dead heavy servo and a worn cell; a scrap servo fitted cleanly holds and she leaves a Spires schematic; a sloppy fix gives out; a stolen Meridian servo gets traced and she's taken). Residents bring small paid repairs too, and tips about parts out in the city.
- **Heat** (`Game.s.heat`, the meter by your money): illegal work on the bench, the cabinet, a traced serial, a business's machine stripped (more if anyone sees). Honest repairs and each night bring it down. At 40 the block starts to talk; at 70 a detective knocks before dawn and searches the bar and the storeroom; at 90 he finds the trapdoor, and seizes illegal work on the bench.
- **The morning after:** sleeping in the cot shows what your fixes did, and what the block is saying.

## Built: the city

| Band | Depth | What's there | How you get there |
|---|---|---|---|
| Above the clouds | +300 m | The Spires: penthouse towers, a sky lounge | Cab |
| Up high | +110 m to +2 m | The White Dragon's block, Neon Row, Kessler Blocks, Glasshouse Plaza, the Skybridge, the Arcology Gardens | Cab |
| Street level | −40 m to −65 m | The Overpass Market, the Canal Docks, the Scrapyard, Chop Shop Alley, Clinic Row | Cab |
| The undercity | −80 m to −130 m | The Main Drain, Boiler House Nine, Substation Seven, the Waterworks | Down a manhole, from street level |
| Old Town | −140 m | The first city, sunk under the new one, and its districts | The old subway, from street level |
| The Works | −260 m | Pumps, power, the foundry, the server farm | Lift cage |
| The Bowels | −400 m | Cable runs, cooling vaults, the old roots | Lift cage |

Each band down opens once you've been in the one above (`Travel.open`).

- **Places, all by hand** (`d_*.js`, from the kit in `kit.js`): each looks like its name. Buildings with shops on the bottom and people living above, a capsule tower like the Nakagin, wooden townhouses, temples and shrine gates and pagodas, white-metal and glass towers, shanty stacks on old blocks, slab estates, a theatre, a bathhouse, pachinko halls, clinics and pharmacies, parks; stalls of fifteen kinds that each look their own (ramen carts, yakitori grills, dumpling steamers, fishmongers, herbalists, street medics...). The Docks are quays on piles over water with cranes and boats; Clinic Row is a street of clinics; the Lantern Quarter is lanterns and shrine gates.
- **The city map** (`worldmap.js`): the city in cross-section, from the Spires down to the Bowels, every place pinned at its depth, the subway and the lift shafts drawn in; open places lit, the ones a tip points to marked. From any way out it's how you travel; from the pause menu it's to look at.
- **On foot:** walking off the end of a street takes you to the next one at the same depth.
- **Its people:** the whole city is lived in, by about 320 residents run by Tyrell (`city.js`). Every one has a household and a home behind a door on a street (singles in capsules and shacks, couples and families in flats and houses, the old on their own or together), most a job at a real place with shifts (the stalls, the shops and bars behind every shopfront, the clinics, the Mercy, the depots, the hotel, the offices, the plants and the deep), and a hobby or two. Children go to school on weekdays and play after. Workplaces are staffed by the people whose job it is, and secured ones (the server farm) see nobody else. They keep their days on screen and off, and remember, gossip about and report what you do in front of them. Doors say who lives there, or what's inside and whether it's open.
- **A lived-in city:** everyone breathes when standing still; vendors work their hands; people glance about, and some smoke. Signs breathe and now and then blink, a bad one stutters, tubes buzz, fires dance, and their light does the same. Adverts play on screens (scrolling glyphs, a koi, a three-scene billboard, an equaliser) and tint their own light. Behind the city stands three layers of towers of every height and shape, moving at their own depths, under a broken cloud deck. Giant holograms play between the layers and a monorail train runs the nearest. Flying cars cross the sky in three lanes of depth. Rats run the gutters and scatter from you, cats keep the walkways, litter blows along in a gusting wind, steam and smoke rise, water drips.
- **Day and weather** (`day.js`): by day the sky's a low overcast, rose at dawn and amber at dusk; rain comes and goes in spells, and the streets shine only while they're wet.
- **Movement:** the stick sets the pace: a light push walks, a full push runs (Shift walks on a keyboard). Jump, drop through walkways, stairs, and ladders (climbed seen from behind).
- **Salvage:** hold Use on a machine to strip it; what came out rises over it a line each. There's no limit to what you carry: once you have it, it's yours. The stalls' scrap bins buy it.
- **The map:** paused, the whole level as one picture to drag and zoom, with you, the people who matter and the ways in and out marked.
- **Dev settings** (pause menu, with `?dev`): stop the clock, teleport from the map, frame rate, the weather, resolution, run speed, time of day, give credits and salvage, been everywhere, restore stripped machines, the block's minds with time walk, and go to any place (by band, each street with its rooms) or to anyone.
- **Menus** take the whole screen.

## Proposed (not built)

- **(proposed)** Customers come back for finished jobs, when they're awake, and pay then.
- **(proposed)** Better places to live as you earn.
- **(proposed)** Sound.
