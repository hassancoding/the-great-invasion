import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';
import { SHEET_ART, registerSheetArt } from '../assets/sheetArt';

/**
 * Boot — embedded Game Asset Sheet art + audio + procedural gameplay frames.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('[Boot] optional asset missing:', file.key);
    });
    const barBg = this.add.rectangle(480, 300, 320, 14, 0x1e293b).setOrigin(0.5);
    const bar = this.add.rectangle(320, 300, 0, 10, 0x38bdf8).setOrigin(0, 0.5);
    this.add
      .text(480, 270, 'Loading Riftlands…', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.load.on('progress', (v: number) => {
      bar.width = 320 * v;
      bar.x = 320;
    });
    this.load.on('complete', () => {
      barBg.destroy();
      bar.destroy();
    });

    for (const { key, path } of AUDIO_LOAD_LIST) {
      this.load.audio(key, path);
    }

    // Embedded sheet art data-URIs — ready when create() runs
    for (const [key, uri] of Object.entries(SHEET_ART)) {
      this.load.image(key, uri);
    }
  }

  create() {
    registerSheetArt(this);
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
