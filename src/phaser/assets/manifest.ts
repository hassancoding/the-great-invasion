/**
 * Disk asset paths from the Game Asset Sheet extract.
 * Boot loads these when present (git-pushed). Missing files are non-fatal.
 * Procedural textureFactory + embedded sheetArt cover gaps.
 */

export type ImageAsset = { key: string; path: string };
export type SheetAsset = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
};

/** Static images — portraits, biomes, UI */
export const IMAGE_ASSETS: ImageAsset[] = [
  { key: 'art_arin', path: 'assets/characters/arin/arin.png' },
  { key: 'art_arin_menu', path: 'assets/characters/arin/arin_menu.png' },
  { key: 'art_kaela', path: 'assets/characters/kaela/kaela.png' },
  { key: 'art_kaela_menu', path: 'assets/characters/kaela/kaela_menu.png' },
  { key: 'art_varkhul', path: 'assets/characters/varkhul/varkhul.png' },
  { key: 'art_varkhul_menu', path: 'assets/characters/varkhul/varkhul_menu.png' },
  { key: 'art_graveling', path: 'assets/enemies/graveling/graveling.png' },
  { key: 'art_legionnaire', path: 'assets/enemies/legionnaire/legionnaire.png' },
  { key: 'art_hulk', path: 'assets/enemies/hulk/hulk.png' },
  { key: 'art_reaver', path: 'assets/enemies/reaver/reaver.png' },
  { key: 'art_skybound', path: 'assets/tiles/skybound/biome.png' },
  { key: 'art_verdant', path: 'assets/tiles/verdant/biome.png' },
  { key: 'art_obsidian', path: 'assets/tiles/obsidian/biome.png' },
  { key: 'art_menu_bg', path: 'assets/tiles/skybound/menu_bg.png' },
  { key: 'art_logo', path: 'assets/branding/logo_area.png' },
  { key: 'art_loading', path: 'assets/branding/loading.png' },
  { key: 'art_islands', path: 'assets/tiles/platforms/islands.png' },
];

/** Multi-frame strips cropped from the sheet */
export const SHEET_ASSETS: SheetAsset[] = [
  { key: 'sheet_arin', path: 'assets/characters/arin/spritesheet.png', frameWidth: 97, frameHeight: 40 },
  { key: 'sheet_kaela', path: 'assets/characters/kaela/spritesheet.png', frameWidth: 97, frameHeight: 40 },
  { key: 'sheet_varkhul', path: 'assets/characters/varkhul/spritesheet.png', frameWidth: 97, frameHeight: 45 },
  { key: 'sheet_graveling', path: 'assets/enemies/graveling/sheet.png', frameWidth: 80, frameHeight: 70 },
  { key: 'sheet_legionnaire', path: 'assets/enemies/legionnaire/sheet.png', frameWidth: 80, frameHeight: 75 },
  { key: 'sheet_hulk', path: 'assets/enemies/hulk/sheet.png', frameWidth: 80, frameHeight: 90 },
  { key: 'sheet_reaver', path: 'assets/enemies/reaver/sheet.png', frameWidth: 80, frameHeight: 85 },
];
