import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { PlayScene } from './scenes/PlayScene';
import { ResultsScene } from './scenes/ResultsScene';

/** Fixed simulation feel — matches GDD 60–180s sector runs */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TILE = 32;

export const GAME_NAME = 'The Great Invasion';
export const GAME_TAGLINE = 'Hold the line. Claim the Well.';

export const PHYSICS = {
  gravityY: 980,
  playerSpeed: 220,
  jumpVelocity: -440,
  coyoteMs: 100,
  jumpBufferMs: 120,
  /** Horizontal burst — GDD "movement is combat" */
  dashSpeed: 520,
  dashDuration: 0.14,
  dashCooldown: 0.55,
  dashInvuln: 0.18,
  wallSlideGravity: 220,
  wallJumpPush: 280,
  wallJumpUp: -400,
  wallCoyoteMs: 90,
};

export const COMBAT = {
  lightDuration: 0.22,
  heavyDuration: 0.34,
  lightReach: 36,
  heavyReach: 48,
  lightDamage: 1,
  heavyDamage: 2,
  claimSeconds: 1.6,
  dashStrikeDamage: 1,
  comboWindow: 1.1,
};

export function createGameConfig(parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#060b1a',
    pixelArt: false,
    antialias: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: PHYSICS.gravityY },
        debug: false,
      },
    },
    scene: [BootScene, MenuScene, PlayScene, ResultsScene],
    input: {
      activePointers: 3,
    },
    audio: {
      disableWebAudio: false,
    },
  };
}
