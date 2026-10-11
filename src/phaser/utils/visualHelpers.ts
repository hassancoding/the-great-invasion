import Phaser from 'phaser';
import type { EnemyKind } from '../systems/ThreatDirector';
import { ENEMY_STATS } from '../systems/ThreatDirector';
import { TILE } from '../config';

/** Player: 96×96 atlas (or 64×80 fallback), origin at feet */
export function setupPlayerBody(player: Phaser.Physics.Arcade.Sprite) {
  const fw = player.width || 96;
  const fh = player.height || 96;
  const bw = 26;
  const bh = 52;
  player
    .setOrigin(0.5, 1)
    .setCollideWorldBounds(true)
    .setSize(bw, bh)
    .setOffset((fw - bw) / 2, fh - bh - 2)
    .setDepth(10)
    .setScale(1);
}

/** Enemy body aligned to feet of gameplay frame */
export function setupEnemyBody(
  e: Phaser.Physics.Arcade.Sprite,
  kind: EnemyKind
) {
  const st = ENEMY_STATS[kind];
  const fw = e.width || st.w;
  const fh = e.height || st.h;
  const bw = Math.max(16, st.w * 0.5);
  const bh = Math.max(22, st.h * 0.65);
  const scale =
    kind === 'graveling' ? 1 : kind === 'hulk' ? 1 : kind === 'elite' ? 1.05 : 1;
  e.setOrigin(0.5, 1)
    .setSize(bw, bh)
    .setOffset((fw - bw) / 2, Math.max(0, fh - bh - 2))
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
