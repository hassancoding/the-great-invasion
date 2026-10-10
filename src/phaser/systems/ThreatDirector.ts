/**
 * Threat Director — adaptive surge composition (ported from Canvas engine).
 * Same decision table, Phaser-ready.
 */

export type EnemyKind = 'graveling' | 'legionnaire' | 'hulk' | 'elite';

export type ThreatStats = {
  slashHits: number;
  heavyHits: number;
  stomps: number;
  kills: number;
  crystals: number;
};

export type WavePlan = {
  label: string;
  kinds: EnemyKind[];
};

export function emptyStats(): ThreatStats {
  return { slashHits: 0, heavyHits: 0, stomps: 0, kills: 0, crystals: 0 };
}

export function planSurge(stats: ThreatStats, sectorIndex: number): WavePlan {
  const totalHits = stats.slashHits + stats.heavyHits + stats.stomps;
  const meleeRatio = totalHits > 0 ? (stats.slashHits + stats.stomps) / totalHits : 0.5;
  const heavyRatio = totalHits > 0 ? stats.heavyHits / totalHits : 0;
  const scale = Math.min(2, 1 + sectorIndex * 0.25);

  if (stats.crystals >= 5 && totalHits < 3) {
    return {
      label: 'REAVER HUNT',
      kinds: scaleKinds(['legionnaire', 'legionnaire', 'graveling', 'graveling'], scale),
    };
  }
  if (heavyRatio > 0.45 || stats.stomps >= 3) {
    return {
      label: 'OBSIDIAN WALL',
      kinds: scaleKinds(['hulk', 'legionnaire', 'graveling'], scale),
    };
  }
  if (meleeRatio > 0.6) {
    return {
      label: 'GRAVELING SWARM',
      kinds: scaleKinds(['graveling', 'graveling', 'graveling', 'legionnaire'], scale),
    };
  }
  if (sectorIndex >= 4 && (stats.kills >= 3 || heavyRatio > 0.3)) {
    return {
      label: 'REAVER ADVANCE',
      kinds: scaleKinds(['elite', 'graveling', 'legionnaire'], scale),
    };
  }
  return {
    label: 'DOMINION SURGE',
    kinds: scaleKinds(['graveling', 'legionnaire', 'graveling', 'hulk'], scale),
  };
}

export function planApexElite(stats: ThreatStats, sectorIndex: number): WavePlan | null {
  if (sectorIndex < 3) return null;
  const totalHits = stats.slashHits + stats.heavyHits + stats.stomps;
  if (stats.kills >= 4 || totalHits >= 6 || sectorIndex >= 5) {
    return { label: 'AETHER REAVER', kinds: ['elite', 'legionnaire', 'graveling'] };
  }
  return null;
}

function scaleKinds(base: EnemyKind[], scale: number): EnemyKind[] {
  if (scale < 1.4) return base;
  return [...base, 'graveling'];
}

export const ENEMY_STATS: Record<
  EnemyKind,
  { hp: number; speed: number; w: number; h: number; score: number }
> = {
  graveling: { hp: 1, speed: 100, w: 40, h: 40, score: 80 },
  legionnaire: { hp: 2, speed: 70, w: 48, h: 56, score: 120 },
  hulk: { hp: 4, speed: 45, w: 64, h: 72, score: 240 },
  elite: { hp: 8, speed: 55, w: 64, h: 80, score: 480 },
};
