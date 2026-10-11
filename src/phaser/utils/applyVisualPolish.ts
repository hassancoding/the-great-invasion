import Phaser from 'phaser';
import { setupPlayerBody, setupEnemyBody, applyPlayCamera } from './visualHelpers';
import { TILE } from '../config';

/**
 * Hot-fix visual alignment on a running PlayScene after loadSector.
 * Called from create/loadSector until full PlayScene file is republished.
 */
export function polishPlayer(player: Phaser.Physics.Arcade.Sprite) {
  setupPlayerBody(player);
}

export function polishEnemy(e: Phaser.Physics.Arcade.Sprite, kind: string) {
  setupEnemyBody(e as any, kind as any);
}

export function polishCamera(cam: Phaser.Cameras.Scene2D.Camera, player: Phaser.GameObjects.GameObject) {
  cam.startFollow(player, true, 0.14, 0.14);
  applyPlayCamera(cam);
}

export { TILE };
