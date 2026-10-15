# Halcyon Spire Sprite Asset Specification

## Current Asset Audit

Arin's production atlas from GitHub commit `b516ba625325c77e254f72ba4b156ae7c40654c6`
is integrated for idle, run, and jump/land gameplay animation:

- Arin atlas: `public/assets/sprites/arin/arin_sprites.png` (2304 x 1960),
  indexed by `public/assets/sprites/arin/arin_atlas.json` with 78 named frames:
  32 idle/turnaround, 24 run, and 22 jump/land.
- Arin portrait: `public/assets/sprites/arin/arin_portrait.png` (192 x 280),
  used by the Arin champion-selection card.
- The older `sprites/arin-idle.svg` remains the no-atlas fallback.
- Kaela and Varkhul illustrations: `sprites/kaela-verdant-warden.svg` and
  `sprites/varkhul-riftbound.svg` (320 x 400 each).
- Graveling and Orun artwork: `sprites/graveling.svg` (192 x 192) and
  `sprites/orun-boss.svg` (384 x 384).
- The atlas does not contain attack, hurt, or death frames; those states still
  need approved art and the attack currently uses the existing gameplay effect.

The selected Fortress pack files from GitHub commit
`7deda52fa5f9702e01e4e3dce62fe2f3ef2c5d92` are integrated as non-colliding
Halcyon scenery: `frt_00.png` (skyline), `frt_02.png` (island bridge),
`frt_08.png` (cloud strip), `frt_13.png` (arch island), and `frt_18.png`
(crystal prop). They are organized under `backgrounds/fortress/` and
`props/fortress/`; their collision remains governed by sector/platform data.

The current enemy renderer still creates geometric textures for WALL, REAVER,
MIXED, and any missing enemy texture. These are functional fallbacks, not final
character art. The Halcyon environment is also authored as SVG illustrations;
it is not a finished pixel-art environment.

## Required Production Art

Deliver transparent PNG sheets with uniform frame canvases per character,
consistent pixel density, a shared outline/light direction, and no baked-in
backgrounds. Keep physics bodies in game data rather than deriving them from
the artwork. Use one named-frame JSON atlas per sheet and verify every atlas
rectangle stays inside its PNG before registering Phaser animations.

| Character | Frame canvas | Required states |
| --- | ---: | --- |
| Arin Solwright | 192 x 280 | Integrated: idle (8 of 32), run (24), jump/land (22); still needed: attack, hurt, death |
| Kaela | 128 x 160 | idle (6), run (8), jump (4), fall (2), attack (6), hurt (2), death (6) |
| Varkhul | 128 x 160 | idle (6), run (8), jump (4), fall (2), attack (6), hurt (2), death (6) |
| Graveling / SWARM | 96 x 96 | idle (4), move (6), telegraph (3), attack (5), hurt (2), death (6) |
| WALL | 128 x 160 | idle (4), move (6), telegraph (4), attack (6), hurt (2), death (6) |
| REAVER | 128 x 160 | idle (4), move (6), telegraph (4), attack (6), hurt (2), death (6) |
| MIXED breach unit | 128 x 160 | idle (4), move (6), telegraph (4), attack (6), hurt (2), death (6) |
| Orun | 256 x 256 | idle (6), move (6), phase-one telegraph (4), phase-one attack (8), phase-two telegraph (4), phase-two attack (8), hurt (3), defeat (8) |

Frame names should follow `<character>_<state>_<zero-based-index>`. Attack
telegraphs and recovery poses must be visually distinct and leave sufficient
frames for gameplay timing. Champion portraits should be cropped from the
matching champion's approved source art, never borrowed from another character.

## Integration Gate

The imported Arin atlas dimensions, frame names, alpha, and rendered poses have
been checked. Kaela/Varkhul animation sheets, enemy state sheets, and Arin's
missing combat states still require production art and visual sign-off before
the complete pixel-art acceptance criteria are met.