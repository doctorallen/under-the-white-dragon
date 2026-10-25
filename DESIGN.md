# Downlevel: design

The full design doc with painted art for every level: https://claude.ai/artifact/Jr4SRs1tDLfp29Q5UrXr1s

## The pitch

A side-scrolling noir for the phone. You're a detective with the Stack precinct, in a trench coat with a blaster on your hip. Four synths walked off a corporate transport in the Spires and dropped out of sight; the precinct wants them found, and their trail goes down. You follow it level by level, deeper than anyone has mapped: strip machines for parts, crack terminals, buy leads, and wire ware into your body to get further. At the bottom is the machine that runs the city, and the synths seem to think it's who made them. What you find there sends you up to the Spires, to the people who say they did.

## The loop

**Go down → strip and crack → bring it home → wire it in.** Short phone sessions: a trip down and back takes a few minutes.

| Underhill had | Downlevel has |
|---|---|
| Dig through rock | Cut through grates, shutters, vents and hatches. Your ware decides what opens. |
| Ore in veins | Salvage in machines: vending machines, AC units, server racks, cars, junk, downed drones. |
| Curios for the catalog | Programs from data nodes. |
| Picks, lamps, packs at the bench | Ware from the ripperdoc, programs on the deck. |
| Ladders home | Ladders and freight lifts you get running again. |
| Strata | Levels of city, from crowded and human at the top to machine and strange at the bottom. |

## The city

| Level | Depth | What's there | The way down |
|---|---|---|---|
| L0 The Spires | +300 m | Corporate towers above the smog. The ending. | (proposed) |
| L1 The Stack | 0 m | Home: capsules, market, bar, clinic, walkways, drones | The Warden, then Breach on the shaft hatch |
| L2 Street level | −60 m | Under the overpasses: fence, clinic, gang turf | (proposed) the Gutter King, then the subway |
| L3 Old Town | −140 m | The first city, sunk under the new one | (proposed) the Old Mayor |
| L4 The Works | −260 m | Pumps, power, server farms | (proposed) the Foreman; heat needs a heat sink |
| L5 The Bowels | −400 m | The core that runs the city | (proposed) the Root |

## Built (first slice)

- **Two levels:** the Stack and street level, joined by the shaft from the Stack's service yard and by the freight lift once you restore it (4 wire, 2 chips).
- **Movement:** the stick sets the pace: a light push walks, a full push runs (Shift walks on a keyboard). Jump, drop through walkways, stairs, ladders, a second jump with spring legs.
- **Salvage:** hold Use on a machine to strip it. Yields are fixed per kind of machine (`things.js`). The pack holds 24 pieces. The capsule has an unlimited stash, and sleeping there heals you and passes the night.
- **Cutting:** grates take the cutter; heavy shutters need mantis blades.
- **Ware** (`items.js`), built and fitted by Doc Vasquez for credits and salvage. Each has a neural load; your nervous system takes 5, or 6 with the booster:
  - lowlight optics (1): see in the dark, see hidden panels
  - spring legs (2): double jump
  - mantis blades (3): damage, heavy shutters, faster cutting
- **Programs**, from data nodes, run for RAM (3, refilling over time). Jacking in is a short timing puzzle; failing costs health.
  - Breach: locked hatches, stuns a drone
  - Ghost: enemies lose you
  - Puppet: a drone fights for you
- **People:** a day passes in 20 minutes. People keep schedules (work, sit, wander, go home) and talk.
  - Vendors buy salvage: Kit at base price, Ozu at 1.4×.
  - Mama Ruiz sells noodles that heal.
  - Juno gives three jobs: coolant, drones, then the clinic data, which pays a neural booster.
- **Fights:** the blaster fires a bolt at the nearest hostile ahead (aim-assisted, up or down a little), six shots that recharge one at a time; up close, Fire is a blow instead (the blades, with mantis arms).
  - Block drones hover and shoot.
  - Gangers close in with blades.
  - The Warden walks, fires bursts, stomps a shockwave you jump over, and charges. Beating it unlocks the shaft.
- **The retinal overlay:** the runner's stock eye tags hostiles in sight with a thin red outline and a segmented health bar over the head; a drone taken over with Puppet is tagged green. Tags brighten once the enemy has seen you and dim under Ghost.
- **A lived-in city:** everyone breathes when standing still; vendors work their hands; people glance about, and some smoke. Passers-by wander their stretch of floor most of the night with a line or two each. Signs breathe and now and then blink, a bad one stutters, tubes buzz, fires dance, and their light does the same. Adverts play on screens (scrolling glyphs, a koi, a three-scene billboard, an equaliser) and tint their own light. Behind the Stack the city stands in three layers of towers of every height and shape, moving at their own depths: setbacks, cantilevers, spires, masts, water tanks and rooftop billboards under a broken cloud deck. Giant holograms (a face, a koi, a ring) play between the layers and a monorail train runs the nearest. Flying cars cross the sky in three lanes of depth. Rats run the gutters and scatter from you, a cat keeps the walkway, newspapers, bags and cans blow along in a gusting wind, steam and smoke rise, water drips from the underside of the Stack onto the street, rain splashes.
- **Death:** you wake in your capsule with an empty pack, six hours later.

## Story (light)

Told through Juno (an informant who trades leads for favours), the people, and what the nodes remember. Original, in the spirit of Blade Runner rather than borrowing from it.
- **The case:** four synths ran from the Spires. The precinct calls you a tracer.
- **First lead:** the street clinic's records show a woman with no ID who paid to have a serial cut from her wrist and asked the way to the subway.
- **Further down:** the synths are looking for whoever made them. Nobody up top did. The Root at the bottom is the city's mind, or what's left of it. What you learn there sends you up to the Spires for the ending.
- (proposed) Each synth is a case with a choice at the end: retire them, let them go, or something else. People react to what you chose.

## Proposed (not built)

- **(proposed)** The Gutter King, the subway, and Old Town (L3), then the Works and the Bowels.
- **(proposed)** More ware: scanner optics, gorilla arms, grip feet, heat sink, reflex booster, subdermal armour, thermal camo, deck slots.
- **(proposed)** Standing with each level's crowd, and more jobs with real choices.
- **(proposed)** Better places to live as you earn, with the stash as a wall of ware.
- **(proposed)** The Spires as the ending.
- **(proposed)** Sound.
