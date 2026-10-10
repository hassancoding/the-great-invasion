# Game Asset Sheet — extracted assets

Source: **The Great Invasion Game Asset Sheet** (exact crops).

## Layout

```
characters/
  arin/          portrait, arin.png, arin_menu.png, spritesheet
  kaela/         portrait, kaela.png, kaela_menu.png, spritesheet
  varkhul/       portrait, varkhul.png, spritesheet
  skins/         alternate skin variants
enemies/
  graveling/     sheet + graveling.png
  legionnaire/   sheet + legionnaire.png
  hulk/          sheet + hulk.png
  reaver/        sheet + reaver.png
allies/          wingborne, aether_guard, verdant_spirit
props/           environmental props
tiles/
  skybound/      biome + menu_bg
  verdant/       biome
  obsidian/      biome
  platforms/     islands, parallax, biomes_strip
items/           weapons, armor, potions, treasure
fx/              combat, elemental, spells, environment
ui/              hud, menus, icons
branding/        logo, loading, share cards, favicon, achievements
reference/       full sheet + section panels
audio/           music + sfx (OGG)
```

BootScene preloads `art_*` keys from these files. Gameplay still uses
procedural sheets (`textureFactory`) for collision-sized frames until
transparent atlases replace them.
