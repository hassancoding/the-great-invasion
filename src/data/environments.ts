/** Sector / biome definitions for Riftlands runner. */

export type SectorId = 'halcyon' | 'ashfall' | 'ruins';

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
    name: 'Ashfall Reach',
    tagline: 'Scorched ridges under ember skies',
    skyKey: 'sky_vista',
    skyTop: 0xf97316,
    skyBot: 0x431407,
    farTint: 0xea580c,
    midTint: 0x9a3412,
    ground: 0x44403c,
    groundTop: 0xa8a29e,
    accent: 0xfbbf24,
    fog: 0xfdba74,
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
    name: 'Shattered Ruins',
    tagline: 'Broken towers in the violet dusk',
    skyKey: 'sky_ruins',
    skyTop: 0xa78bfa,
    skyBot: 0x1e1b4b,
    farTint: 0x7c3aed,
    midTint: 0x4c1d95,
    ground: 0x3f3f46,
    groundTop: 0xa1a1aa,
    accent: 0xc4b5fd,
    fog: 0xddd6fe,
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
];

export function getSector(id: string | undefined | null): SectorDef {
  return SECTORS.find((s) => s.id === id) ?? SECTORS[0];
}

export function nextSector(id: SectorId): SectorDef {
  const i = SECTORS.findIndex((s) => s.id === id);
  return SECTORS[(i + 1) % SECTORS.length];
}
