import Phaser from 'phaser';
import type { EnemyKind } from '../systems/ThreatDirector';
import { ENEMY_STATS } from '../systems/ThreatDirector';
import { TILE } from '../config';

/** Display scale: 192×240 art → ~3 tiles tall (readable, not dominant) */
export const PLAYER_DISPLAY_SCALE = 0.42;

/** Player: high-res atlas art; physics body independent of display size */
export function setupPlayerBody(player: Phaser.Physics.Arcade.Sprite) {
  const fw = player.width || 192;
  const fh = player.height || 240;
  const bw = 22;
  const bh = 48;
  player
    .setOrigin(0.5, 1)
    .setCollideWorldBounds(true)
    .setScale(PLAYER_DISPLAY_SCALE)
    .setSize(bw, bh)
    // Offset in unscaled texture space so feet sit on platforms
    .setOffset((fw - bw) / 2, fh - bh - 2)
    .setDepth(10);
}

/** Enemy body — keep relative to player (~0.6–1.1 of player height) */
export function setupEnemyBody(e: Phaser.Physics.Arcade.Sprite, kind: EnemyKind) {
  const st = ENEMY_STATS[kind];
  const fw = e.width || st.w;
  const fh = e.height || st.h;
  const bw = Math.max(16, st.w * 0.5);
  const bh = Math.max(22, st.h * 0.65);
  const scale =
    kind === 'graveling' ? 1.15 : kind === 'hulk' ? 1.25 : kind === 'elite' ? 1.2 : 1.15;
  e.setOrigin(0.5, 1)
    .setSize(bw, bh)
    .setOffset((fw - bw) / 2, Math.max(0, fh - bh - 2))
    .setCollideWorldBounds(true)
    .setBounce(0)
    .setScale(scale)
    .setDepth(8);
}

/** Camera: moderate zoom so world context stays visible */
export function applyPlayCamera(cam: Phaser.Cameras.Scene2D.Camera) {
  cam.setDeadzone(80, 48);
  cam.setZoom(1.05);
}
