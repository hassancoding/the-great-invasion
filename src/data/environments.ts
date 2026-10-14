/** Sector / biome definitions for Riftlands runner. */

export type SectorId = 'halcyon' | 'ashfall' | 'ruins' | 'trade-isles' | 'heart-of-rift';

export interface PlatformSpec {
  x: number;
  y: number;
  tiles: number;
}

export interface SectorDef {
  id: SectorId;
  name: string;
  tagline: string;
  skyKey: string;
  skyTop: number;
  skyBot: number;
  farTint: number;
  midTint: number;
  ground: number;
  groundTop: number;
  accent: number;
  fog: number;
  worldW: number;
  worldH: number;
  platforms: PlatformSpec[];
}

export const SECTORS: SectorDef[] = [
  {
    id: 'halcyon',
    name: 'Halcyon Spire',
    tagline: 'Floating citadel above the aether sea',
    skyKey: 'sky_citadel',
    skyTop: 0x38bdf8,
    skyBot: 0x0c4a6e,
    farTint: 0x0ea5e9,
    midTint: 0x0369a1,
    ground: 0x475569,
    groundTop: 0x94a3b8,
    accent: 0x38bdf8,
    fog: 0x7dd3fc,
    worldW: 2400,
    worldH: 540,
    platforms: [
      { x: 180, y: 400, tiles: 7 },
      { x: 460, y: 310, tiles: 5 },
      { x: 720, y: 380, tiles: 6 },
      { x: 1000, y: 280, tiles: 8 },
      { x: 1320, y: 360, tiles: 5 },
      { x: 1580, y: 250, tiles: 6 },
      { x: 1900, y: 340, tiles: 7 },
      { x: 2150, y: 300, tiles: 5 },
    ],
  },
  {
    id: 'ashfall',
    name: 'Verdant Scar',
    tagline: 'Overgrown cliffs reclaim a shattered frontier',
    skyKey: 'sky_vista',
    skyTop: 0x166534,
    skyBot: 0x052e16,
    farTint: 0x15803d,
    midTint: 0x14532d,
    ground: 0x365344,
    groundTop: 0x86a879,
    accent: 0x86efac,
    fog: 0xbbf7d0,
    worldW: 2200,
    worldH: 540,
    platforms: [
      { x: 160, y: 420, tiles: 6 },
      { x: 420, y: 340, tiles: 4 },
      { x: 680, y: 400, tiles: 7 },
      { x: 980, y: 290, tiles: 5 },
      { x: 1280, y: 370, tiles: 6 },
      { x: 1560, y: 260, tiles: 8 },
      { x: 1880, y: 330, tiles: 5 },
    ],
  },
  {
    id: 'ruins',
    name: 'Obsidian Depths',
    tagline: 'Ancient black-stone halls beneath a violet dusk',
    skyKey: 'sky_ruins',
    skyTop: 0x6d28d9,
    skyBot: 0x09090b,
    farTint: 0x3f3f46,
    midTint: 0x18181b,
    ground: 0x27272a,
    groundTop: 0x71717a,
    accent: 0xa78bfa,
    fog: 0xd8b4fe,
    worldW: 2300,
    worldH: 540,
    platforms: [
      { x: 200, y: 390, tiles: 5 },
      { x: 480, y: 300, tiles: 6 },
      { x: 780, y: 360, tiles: 4 },
      { x: 1050, y: 260, tiles: 7 },
      { x: 1380, y: 340, tiles: 5 },
      { x: 1680, y: 280, tiles: 6 },
      { x: 1980, y: 350, tiles: 8 },
    ],
  },
  {
    id: 'trade-isles',
    name: 'Collapsed Trade Isles',
    tagline: 'Broken sky-bridges above a drowned trade route',
    skyKey: 'sky_vista',
    skyTop: 0x164e63,
    skyBot: 0x082f49,
    farTint: 0x155e75,
    midTint: 0x164e63,
    ground: 0x475569,
    groundTop: 0xd6a66f,
    accent: 0xf0c27b,
    fog: 0xa5f3fc,
    worldW: 2400,
    worldH: 540,
    platforms: [
      { x: 170, y: 410, tiles: 6 },
      { x: 430, y: 330, tiles: 5 },
      { x: 710, y: 390, tiles: 6 },
      { x: 990, y: 285, tiles: 7 },
      { x: 1280, y: 370, tiles: 6 },
      { x: 1570, y: 260, tiles: 7 },
      { x: 1880, y: 345, tiles: 6 },
      { x: 2160, y: 300, tiles: 5 },
    ],
  },
  {
    id: 'heart-of-rift',
    name: 'Heart of the Rift',
    tagline: 'The unstable source tears through the edge of reality',
    skyKey: 'sky_ruins',
    skyTop: 0x581c87,
    skyBot: 0x090016,
    farTint: 0x6b21a8,
    midTint: 0x3b0764,
    ground: 0x27213a,
    groundTop: 0x8b5cf6,
    accent: 0x67e8f9,
    fog: 0xc4b5fd,
    worldW: 2600,
    worldH: 540,
    platforms: [
      { x: 180, y: 400, tiles: 6 },
      { x: 450, y: 320, tiles: 5 },
      { x: 730, y: 380, tiles: 6 },
      { x: 1010, y: 275, tiles: 7 },
      { x: 1310, y: 360, tiles: 6 },
      { x: 1600, y: 245, tiles: 7 },
      { x: 1900, y: 330, tiles: 7 },
      { x: 2220, y: 285, tiles: 6 },
    ],
  },
];

export function getSector(id: string | undefined | null): SectorDef {
  return SECTORS.find((s) => s.id === id) ?? SECTORS[0];
}

export function nextSector(id: SectorId): SectorDef {
  const i = SECTORS.findIndex((s) => s.id === id);
  return SECTORS[(i + 1) % SECTORS.length];
}
