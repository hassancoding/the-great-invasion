# Production assets — The Great Invasion

Drop transparent PNG sprite sheets + JSON atlases here when ready.

## Expected layout

```
assets/
  characters/
    arin.png          # 96×96 frames atlas
    arin.json
  enemies/
    graveling.png     # 64×64
    graveling.json
    legionnaire.png   # 96×96
    hulk.png          # 128×128
    elite.png         # Aether Reaver 128×128
  tiles/
    riftlands.png     # 32×32 modules
    riftlands.json
  fx/
    slash.png
    crystal.png
  ui/
    icons.png
```

Until these files exist, BootScene generates sheet-matched procedural textures
(Arin Concord palette, Dominion purple roster, Aether Well).

See `src/phaser/assets/manifest.json` for animation names and frame specs.
