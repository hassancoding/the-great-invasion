import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Wave 1 generated OGG assets
    for (const { key, path } of AUDIO_LOAD_LIST) {
      this.load.audio(key, path);
    }
    // Optional production atlases later:
    // this.load.atlas('arin', 'assets/characters/arin.png', 'assets/characters/arin.json');
  }

  create() {
    generateSheetTextures(this);
    Audio.attach(this);

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
