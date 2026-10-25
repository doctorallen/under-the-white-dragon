# Underhill: design

## The pitch

You are a small folk in a burrow under a hill in Thistledown, a quiet Shire-like village. Under every hill there are cellars, under the cellars the old diggings, under those the dwarves' halls, and under those the rock has started turning into something else: circuitry, neon crystal, and a rift hanging open in an arch. Rifts lead sideways into other worlds (a neon city, a dry spice seam, a derelict station).

The loop: **descend → dig and haul → sort, catalog and craft → go deeper.** Sessions are short and phone-sized. A trip down and back is a few minutes.

## What makes it click

- **Mining and crafting.** Ore is the reason to dig. Each stratum has ore the next pick needs, and the next pick opens the next stratum.
- **Organizing loot.** Everything you bring home has a place: ore in the bins, curios on the shelves, a swatch pinned on the catalog board. The catalog is a list of everything there is to find, with silhouettes of what you haven't found yet.
- **Exploration with a gradient.** The deeper you go the stranger it gets. The first wrong thing is a copper wire running through the clay that nobody in Underhill made.

## Built (first slice)

- One seeded world, 128 × 300 tiles: the hill and the burrow, two neighbours' cellars, three shored runs of the Old Diggings with a cart and dead lanterns, the wire, two dwarf halls with pillars and rune doors, and the Seam with the rift arch at the bottom. Caves open up more the deeper you go.
- **Digging.** Hold Dig, aimed sideways, up or down. Time = `T.dig.base × hardness ÷ pick speed`. Each rock needs a pick tier: earth and clay take the old pick, stone bronze, dressed stone and mithril iron, seam rock mithril.
- **The pack.** 8 slots to start. Ore stacks to 10 and curios to 5. A full pack won't take more finds: go home.
- **Home.** Walk in and the pack unpacks. Ore goes to the bins, curios to the shelves (drawn on them), and everything new goes in the catalog.
- **The bench** (at home). Torches (4), ladders (8), then a chain of upgrades. Each upgrade needs the one before:
  - Picks: bronze (copper, tin, coal), then iron (iron ore, coal), then mithril (mithril, iron ore, coal).
  - Lamps: hooded (copper, coal), then shard (glow shard, copper, iron ore).
  - Packs: stitched, 10 slots (copper, tin, coal), then framed, 12 slots (iron ore, tin).
- **Getting home.** Climb any rock you're pressed against (stick up). Ladders (start with 16) go into open tiles and hold you. Torches stay lit where you leave them.
- **Kit on the sprite.** The goggles (a curio in an Old Growth hall wall) go on when you bring them home. The iron pick adds copper plates and a brow lamp. The pick head shows its metal.
- **Light.** Ambient light falls with depth and is tinted by stratum. The lamp's reach grows with the lamp. The light is drawn in dithered bands. Glowing things bloom.
- **Saving.** Automatic: every 8 s, on unpacking, on crafting, and when the page hides.

## Proposed (not built)

- **(proposed)** The rift: step through the arch into a sideways rift (Neon District, Dry Seam, Derelict Station), each a short side-scrolling level with its own ore and curios. Rift visitors come back up to Thistledown.
- **(proposed)** Creatures in the deep strata, and a reason to fight (Terraria-style). Boss-like guardians at the rift.
- **(proposed)** Sorting at home as play: shelves you arrange, sets that complete for a reward, a museum-like display room dug out of the burrow.
- **(proposed)** A lift or rope line once you've reached a depth, so long trips stay short.
- **(proposed)** More kit: a brow-lamp upgrade, gloves, spice-powered tools from beyond the rift.
- **(proposed)** Sound.
