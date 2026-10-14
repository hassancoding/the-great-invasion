# Environment Asset Pack

The environment art is organized into five playable region themes:

- **Halcyon Spire** — floating citadel and Aether energy.
- **Verdant Scar** — green reclaimed frontier (legacy internal sector ID: `ashfall`).
- **Obsidian Depths** — dark stone halls (legacy internal sector ID: `ruins`).
- **Collapsed Trade Isles** — broken sky routes and floating islands.
- **Heart of the Rift** — unstable violet/cyan rift core.

Each region has independently authored SVG layers, terrain visuals, and an energy prop. Shared gameplay visuals include a bounce pad, spike hazard, rift gate, and energy burst. They are preloaded, but shared objects are not automatically spawned: only existing gameplay systems should place them.

## Integration rules

- Collision bodies remain defined by sector data and Phaser physics, not by artwork pixels.
- SVG files are source assets and should be visually checked at target display sizes.
- Alpha has not been marked verified until browser QA has been performed.
- Run `npm run build` and exercise each sector in-game before treating this pack as production-verified.
