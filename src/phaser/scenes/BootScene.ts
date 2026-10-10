import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio } from '../systems/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Production: this.load.audio('music_menu', 'assets/audio/music/echoes_of_the_riftlands.ogg');
    // Until files exist, AudioManager uses Web Audio synthesis (Wave 1).
  }

  create() {
    generateSheetTextures(this);

    const unlock = () => {
      Audio.unlock();
      this.input.off('pointerdown', unlock);
      this.input.keyboard?.off('keydown', unlock);
    };
    this.input.once('pointerdown', unlock);
    this.input.keyboard?.once('keydown', unlock);

    this.scene.start('Menu');
  }
}
