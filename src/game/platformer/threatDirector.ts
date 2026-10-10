/**
 * Threat Director — adaptive surge composition from run habits (P2).
 * Lightweight: no full RTS sim, just a small decision table.
 */

import type { Enemy, EnemyKind } from './types';

export type ThreatStats = {
  slashHits: number;
  heavyHits: number;
  stomps: number;
  kills: number;
  crystals: number;
  airTime: number;
};

export type WavePlan = {
  label: string;
  kinds: EnemyKind[];
};

export function emptyStats(): ThreatStats {
  return {
    slashHits: 0,
    heavyHits: 0,
    stomps: 0,
    kills: 0,
    crystals: 0,
    airTime: 0,
  };
}

/** Pick surge composition from how the player fought this sector */
export function planSurge(stats: ThreatStats, sectorIndex: number): WavePlan {
  const totalHits = stats.slashHits + stats.heavyHits + stats.stomps;
  const meleeRatio = totalHits > 0 ? (stats.slashHits + stats.stomps) / totalHits : 0.5;
  const heavyRatio = totalHits > 0 ? stats.heavyHits / totalHits : 0;
  const scale = Math.min(2, 1 + sectorIndex * 0.25);

  // Crystal greed / passive play → aggressive mixed pressure
  if (stats.crystals >= 5 && totalHits < 3) {
    return {
      label: 'REAVER HUNT',
      kinds: scaleKinds(['legionnaire', 'legionnaire', 'graveling', 'graveling'], scale),
    };
  }

  // Heavy / stomp focused → armored response
  if (heavyRatio > 0.45 || stats.stomps >= 3) {
    return {
      label: 'OBSIDIAN WALL',
      kinds: scaleKinds(['hulk', 'legionnaire', 'graveling'], scale),
    };
  }

  // Light melee spam → swarm
  if (meleeRatio > 0.6) {
    return {
      label: 'GRAVELING SWARM',
      kinds: scaleKinds(['graveling', 'graveling', 'graveling', 'legionnaire'], scale),
    };
  }

  // Default mixed
  return {
    label: 'DOMINION SURGE',
    kinds: scaleKinds(['graveling', 'legionnaire', 'graveling', 'hulk'], scale),
  };
}

function scaleKinds(base: EnemyKind[], scale: number): EnemyKind[] {
  if (scale < 1.4) return base;
  // Add one extra graveling on later sectors
  return [...base, 'graveling'];
}

export function spawnEnemyAt(
  kind: EnemyKind,
  x: number,
  y: number,
  dir: 1 | -1
): Enemy {
  if (kind === 'graveling') {
    return {
      kind,
      x,
      y,
      w: 20,
      h: 22,
      vx: 100,
      alive: true,
      dir,
      hp: 1,
      maxHp: 1,
      stun: 0,
      hitFlash: 0,
    };
  }
  if (kind === 'hulk') {
    return {
      kind,
      x,
      y: y - 6,
      w: 30,
      h: 36,
      vx: 45,
      alive: true,
      dir,
      hp: 4,
      maxHp: 4,
      stun: 0,
      hitFlash: 0,
    };
  }
  return {
    kind: 'legionnaire',
    x,
    y,
    w: 24,
    h: 30,
    vx: 70,
    alive: true,
    dir,
    hp: 2,
    maxHp: 2,
    stun: 0,
    hitFlash: 0,
  };
}
