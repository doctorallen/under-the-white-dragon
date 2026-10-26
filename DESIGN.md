# Downlevel: design

The full design doc with painted art for every level: https://claude.ai/artifact/Jr4SRs1tDLfp29Q5UrXr1s

## The pitch

A side-scrolling noir for the phone. You're a detective with the Stack precinct, in a trench coat with a blaster on your hip. Four synths walked off a corporate transport in the Spires and dropped out of sight; the precinct wants them found, and their trail goes down. You follow it level by level, deeper than anyone has mapped: strip machines for parts, crack terminals, hunt the illegal chrome, and carry better gadgets and gear to get further. In this city implants are a crime; you're one of the people who chase them down. At the bottom is the machine that runs the city, and the synths seem to think it's who made them. What you find there sends you up to the Spires, to the people who say they did.

## The loop

**Go down → strip and crack → bring it home → wire it in.** Short phone sessions: a trip down and back takes a few minutes.

| Underhill had | Downlevel has |
|---|---|
| Dig through rock | Cut through grates, shutters, vents and hatches. Your gadgets decide what opens. |
| Ore in veins | Salvage in machines: vending machines, AC units, server racks, cars, junk, downed drones. |
| Curios for the catalog | Programs from data nodes. |
| Picks, lamps, packs at the bench | Gadgets from the quartermaster, gear from the fabricator, programs on the deck. |
| Ladders home | Ladders and freight lifts you get running again. |
| Strata | Levels of city, from crowded and human at the top to machine and strange at the bottom. |

## The city

| Level | Depth | What's there | The way down |
|---|---|---|---|
| L0 The Spires | +300 m | Corporate towers above the smog. The ending. | (proposed) |
| Floor 31 | +40 m | Home: your apartment, the hall, the elevator | The elevator |
| L1 The Stack | 0 m | Capsule hotel, market, bar, clinic, walkways, drones | The Warden, then Breach on the shaft hatch |
| L2 Street level | −60 m | Under the overpasses: fence, clinic, gang turf | (proposed) the Gutter King, then the subway |
| L3 Old Town | −140 m | The first city, sunk under the new one | (proposed) the Old Mayor |
| L4 The Works | −260 m | Pumps, power, server farms | (proposed) the Foreman; heat needs a heat sink |
| L5 The Bowels | −400 m | The core that runs the city | (proposed) the Root |

## Built (first slice)

- **Home:** an apartment on floor 31 of the block above the Stack: a bed (sleep heals you and passes the night), a closet (your gear), a window on the city. You walk out past the neighbours' doors and the people in the hall to the elevator, which goes to every level you've reached.
- **Two levels below:** the Stack and street level, joined by the shaft from the Stack's service yard, by the freight lift once you restore it (4 wire, 2 chips), and by the block's elevator once you've been down.
- **Movement:** the stick sets the pace: a light push walks, a full push runs (Shift walks on a keyboard). Jump, drop through walkways, stairs, ladders, a second jump with jump jets.
- **Salvage:** hold Use on a machine to strip it. Yields are fixed per kind of machine (`things.js`). There's no limit to what you carry and nothing to bank: once you have it, it's yours.
- **Cutting:** grates take the hand cutter; heavy shutters need the plasma cutter.
- **Gadgets** (`GADGETS` in `items.js`), built by Quartermaster Ito at the precinct for credits and parts (short parts bought at Mags's price). Implants are illegal, so there's no ware and no neural load; a gadget works once it's yours, and shows on the detective:
  - spectral lenses (goggles): see in the dark, see hidden panels
  - jump jets (on the heels): double jump
  - plasma cutter: heavy shutters, faster cutting, much harder blows
- **Getting around:** the elevator in your block reaches every level you've been to. Your spinner on the pad at the end of your hall flies to the precinct, the Stack (setting down on the block's roof) and street level, with a flight through the city each time (tap to skip). From anywhere, a cab takes you home for a fare (30 cr, 45 from street level).
- **Programs**, from data nodes, run for RAM (3, refilling over time). Jacking in is a short timing puzzle; failing costs health.
  - Breach: locked hatches, stuns a drone
  - Ghost: enemies lose you
  - Puppet: a drone fights for you
- **People:** a day passes in 20 minutes. People keep schedules (work, sit, wander, go home) and talk.
  - Vendors buy salvage: Kit at base price, Ozu at 1.4×.
  - Mama Ruiz sells noodles that heal.
  - Lieutenant Hale at the precinct gives three cases: the hacked drones on the walkway, a chrome warrant on the street gang (three of them down), then the clinic's record. Juno at the bar is an informant who talks.
- **Fights:** the blaster fires a bolt at the nearest hostile ahead (aim-assisted, up or down a little), six shots that recharge one at a time; up close, Fire is a blow instead (the melee weapon's, and the plasma cutter's on top).
  - Block drones hover and shoot.
  - Gangers close in with blades.
  - The Warden walks, fires bursts, stomps a shockwave you jump over, and charges. Beating it unlocks the shaft.
- **The retinal overlay:** the runner's stock eye tags hostiles in sight with a thin red outline and a segmented health bar over the head; a drone taken over with Puppet is tagged green. Tags brighten once the enemy has seen you and dim under Ghost.
- **A lived-in city:** everyone breathes when standing still; vendors work their hands; people glance about, and some smoke. Passers-by wander their stretch of floor most of the night with a line or two each. Signs breathe and now and then blink, a bad one stutters, tubes buzz, fires dance, and their light does the same. Adverts play on screens (scrolling glyphs, a koi, a three-scene billboard, an equaliser) and tint their own light. Behind the Stack the city stands in three layers of towers of every height and shape, moving at their own depths: setbacks, cantilevers, spires, masts, water tanks and rooftop billboards under a broken cloud deck. Giant holograms (a projected advert for a drink and a scent, a koi, a turning corporate mark) play between the layers and a monorail train runs the nearest. Flying cars cross the sky in three lanes of depth. Rats run the gutters and scatter from you, a cat keeps the walkway, newspapers, bags and cans blow along in a gusting wind, steam and smoke rise, water drips from the underside of the Stack onto the street, rain splashes.
- **Gear,** in the spirit of Cyberpunk 2077: a slot each for head, face, outer torso, inner torso, legs, feet, a ranged weapon and a melee one. Every piece has a rarity (common, uncommon, rare, epic, legendary), armour or weapon stats, sometimes a perk (faster running, recharge, RAM), and shows on the runner. Every piece changes how the runner looks (hats, helmets, visors, masks, coats and vests, pockets and knee pads, lit soles, a heavier gun, a baton at the hip or a katana across the back). The inventory takes the whole screen: on the Gear tab your loadout is on the left, you between your slots with a thumbnail of each piece, and the piece you pick is on the right with its stats against what you wear; the other tabs are items, gadgets and programs, and cases. Gear comes from vendors (Kit sells clothes, Ozu sells weapons and armour), jobs, stashes, the hidden panel and the Warden.
- **The fabricator:** Mags, at her stall in the Stack's market, makes gear from parts and money, upgrades any piece you own up to +3 (each level adds a quarter of its base armour or damage), and breaks pieces down into about half their parts. She sells parts at two and a half times what Kit pays; when you make or upgrade something you're short of parts for, the button buys what's missing at her price as part of the same payment.
- **Salvage** shows as icons in a grid, in the inventory and at Mags's.
- **Bodies:** a ganger you take down stays where they fell until you leave the level.
- **The map:** paused, the whole level as one picture to drag and zoom, with you, the people who matter, the ways in and out and the hostiles marked.
- **Dev settings** (pause menu): god mode, endless charge, stop the clock, teleport from the map, frame rate, run speed, time of day, give credits, parts, gear, gadgets and programs, set the world's flags, close or reset cases, kill or respawn enemies, restore stripped machines, and go to any level's spawn.
- **Menus** take the whole screen.
- **Death:** you wake in your own bed six hours later, with everything you had.

## Story (light)

Told through Lieutenant Hale's cases, Juno (an informant), the people, and what the nodes remember. Original, in the spirit of Blade Runner rather than borrowing from it.
- **The case:** four synths ran from the Spires. The precinct calls you a tracer.
- **First lead:** the street clinic's records show a woman with no ID who paid to have a serial cut from her wrist and asked the way to the subway.
- **Further down:** the synths are looking for whoever made them. Nobody up top did. The Root at the bottom is the city's mind, or what's left of it. What you learn there sends you up to the Spires for the ending.
- (proposed) Each synth is a case with a choice at the end: retire them, let them go, or something else. People react to what you chose.

## Proposed (not built)

- **(proposed)** The Gutter King, the subway, and Old Town (L3), then the Works and the Bowels.
- **(proposed)** More gadgets: a grapple, a drone of your own, a heat sink, thermal camo, a better deck. Chrome warrants on more levels.
- **(proposed)** Standing with each level's crowd, and more jobs with real choices.
- **(proposed)** Better places to live as you earn, with your gear on display.
- **(proposed)** The Spires as the ending.
- **(proposed)** Sound.
