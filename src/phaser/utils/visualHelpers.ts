import Phaser from 'phaser';
import type { EnemyKind } from '../systems/ThreatDirector';
import { ENEMY_STATS } from '../systems/ThreatDirector';
import { TILE } from '../config';

/** Player: 96×96 frame, origin at feet, hitbox feet-aligned */
export function setupPlayerBody(player: Phaser.Physics.Arcade.Sprite) {
  player
    .setOrigin(0.5, 1)
    .setCollideWorldBounds(true)
    .setSize(22, 42)
    .setOffset(37, 48)
    .setDepth(10)
    .setScale(0.92);
}

/** Enemy body aligned to feet of procedural frame */
export function setupEnemyBody(
  e: Phaser.Physics.Arcade.Sprite,
  kind: EnemyKind
) {
  const st = ENEMY_STATS[kind];
  const frameH = e.height || (kind === 'elite' || kind === 'hulk' ? 128 : 64);
  const bw = Math.max(18, st.w * 0.55);
  const bh = Math.max(24, st.h * 0.7);
  const scale =
    kind === 'graveling' ? 0.95 : kind === 'hulk' ? 0.85 : 0.9;
  e.setOrigin(0.5, 1)
    .setSize(bw, bh)
    .setOffset((e.width - bw) / 2, frameH - bh - 4)
    .setCollideWorldBounds(true)
    .setBounce(0)
    .setScale(scale)
    .setDepth(8);
}

export function platformTopY(tileCenterY: number) {
  return tileCenterY - TILE / 2;
}

export function applyPlayCamera(cam: Phaser.Cameras.Scene2D.Camera) {
  cam.setDeadzone(60, 36);
  cam.setZoom(1.12);
}
