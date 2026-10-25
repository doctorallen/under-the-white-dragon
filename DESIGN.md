# Downlevel: design

The full design doc with painted art for every level: https://claude.ai/artifact/Jr4SRs1tDLfp29Q5UrXr1s

## The pitch

A side-scrolling cyberpunk game for the phone. You live in a capsule on the Stack, a megablock level of a vertical city, and the city goes down further than anyone has mapped. Each trip takes you lower to strip machines for parts, crack terminals for programs, and bring it home to wire into your body. At the bottom is the machine that runs the city. What you find there sends you up to the Spires for the ending.

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
- **Movement:** run, jump, drop through walkways, stairs, ladders, a second jump with spring legs.
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
- **Fights:** strike up close.
  - Block drones hover and shoot.
  - Gangers close in with blades.
  - The Warden walks, fires bursts, stomps a shockwave you jump over, and charges. Beating it unlocks the shaft.
- **The retinal overlay:** the runner's stock eye tags hostiles in sight with a thin red outline and a segmented health bar over the head; a drone taken over with Puppet is tagged green. Tags brighten once the enemy has seen you and dim under Ghost.
- **Death:** you wake in your capsule with an empty pack, six hours later.

## Story (light)

Told through the fixer, the people and the nodes. The city's code is being bought up from below. The clinic data points to the Works. The Root at the bottom is the city's mind, or what's left of it, and what you learn there sends you up to the Spires.

## Proposed (not built)

- **(proposed)** The Gutter King, the subway, and Old Town (L3), then the Works and the Bowels.
- **(proposed)** More ware: scanner optics, gorilla arms, grip feet, heat sink, reflex booster, subdermal armour, thermal camo, deck slots.
- **(proposed)** Standing with each level's crowd, and more jobs with real choices.
- **(proposed)** Better places to live as you earn, with the stash as a wall of ware.
- **(proposed)** The Spires as the ending.
- **(proposed)** Sound.
