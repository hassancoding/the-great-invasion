/** Playable champions — Concord / Clans / Riftbound. */

export type HeroId = 'arin' | 'kaela' | 'varkhul';

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  faction: string;
  color: number;
  accent: number;
  blurb: string;
  speed: number;
  jump: number;
  scale: number;
  atlas?: string;
  bodyW: number;
  bodyH: number;
}

export const HEROES: HeroDef[] = [
  {
    id: 'arin',
    name: 'Arin Solwright',
    title: 'Concord Blade',
    faction: 'Concord',
    color: 0x38bdf8,
    accent: 0x7dd3fc,
    blurb: 'Balanced swordplay. Dash. Claim the Well.',
    speed: 240,
    jump: 520,
    scale: 0.9,
    atlas: 'arin',
    bodyW: 36,
    bodyH: 88,
  },
  {
    id: 'kaela',
    name: 'Kaela',
    title: 'Verdant Warden',
    faction: 'Clans',
    color: 0x4ade80,
    accent: 0x86efac,
    blurb: 'Agile strikes. Forest-born resilience.',
    speed: 270,
    jump: 560,
    scale: 0.82,
    bodyW: 44,
    bodyH: 86,
  },
  {
    id: 'varkhul',
    name: 'Varkhul',
    title: 'Riftbound',
    faction: 'Dominion',
    color: 0xa78bfa,
    accent: 0xc4b5fd,
    blurb: 'Heavy hits. Built for the surge.',
    speed: 200,
    jump: 480,
    scale: 0.95,
    bodyW: 56,
    bodyH: 96,
  },
];

export function getHero(id: string | undefined | null): HeroDef {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}
