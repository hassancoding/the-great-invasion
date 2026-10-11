/**
 * Production gameplay + presentation assets.
 * Paths relative to public/ (Vite serves /assets/...).
 * Frame sizes verified against generated transparent sheets.
 */

export type ImageAsset = { key: string; path: string };
export type SheetAsset = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
};

/** Menu / portraits / environments */
export const IMAGE_ASSETS: ImageAsset[] = [
  { key: 'art_arin', path: 'assets/gameplay/heroes/arin_portrait.png' },
  { key: 'art_kaela', path: 'assets/gameplay/heroes/kaela_portrait.png' },
  { key: 'art_varkhul', path: 'assets/gameplay/heroes/varkhul_portrait.png' },
  { key: 'art_arin_menu', path: 'assets/characters/arin/arin_menu.png' },
  { key: 'art_kaela_menu', path: 'assets/characters/kaela/kaela_menu.png' },
  { key: 'art_varkhul_menu', path: 'assets/characters/varkhul/varkhul_menu.png' },
  { key: 'art_logo', path: 'assets/gameplay/ui/logo.png' },
  { key: 'art_logo_area', path: 'assets/branding/logo_area.png' },
  { key: 'art_loading', path: 'assets/branding/loading.png' },
  { key: 'art_menu_bg', path: 'assets/tiles/skybound/menu_bg.png' },
  { key: 'art_islands', path: 'assets/gameplay/tiles/islands.png' },
  { key: 'art_skybound', path: 'assets/gameplay/tiles/skybound_biome.png' },
  { key: 'art_verdant', path: 'assets/gameplay/tiles/verdant_biome.png' },
  { key: 'art_obsidian', path: 'assets/gameplay/tiles/obsidian_biome.png' },
];

/**
 * Gameplay spritesheets — transparent RGBA.
 * Hero frames: 0 idle, 1 idle-b, 2 run-a, 3 run-b, 4 jump, 5 attack
 * Enemy frames: distinct cells from concept strips
 */
export const SHEET_ASSETS: SheetAsset[] = [
  { key: 'arin', path: 'assets/gameplay/heroes/arin_sheet.png', frameWidth: 64, frameHeight: 80 },
  { key: 'kaela', path: 'assets/gameplay/heroes/kaela_sheet.png', frameWidth: 64, frameHeight: 80 },
  { key: 'varkhul', path: 'assets/gameplay/heroes/varkhul_sheet.png', frameWidth: 64, frameHeight: 80 },
  { key: 'graveling', path: 'assets/gameplay/enemies/graveling_sheet.png', frameWidth: 48, frameHeight: 48 },
  { key: 'legionnaire', path: 'assets/gameplay/enemies/legionnaire_sheet.png', frameWidth: 48, frameHeight: 56 },
  { key: 'hulk', path: 'assets/gameplay/enemies/hulk_sheet.png', frameWidth: 64, frameHeight: 72 },
  { key: 'reaver', path: 'assets/gameplay/enemies/reaver_sheet.png', frameWidth: 56, frameHeight: 64 },
  { key: 'elite', path: 'assets/gameplay/enemies/reaver_sheet.png', frameWidth: 56, frameHeight: 64 },
];
