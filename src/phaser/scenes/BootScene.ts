import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';
import { SHEET_ART, registerSheetArt } from '../assets/sheetArt';
import { IMAGE_ASSETS, SHEET_ASSETS } from '../assets/manifest';

/**
 * Boot — load disk Game Asset Sheet extracts + audio,
 * then register embedded fallbacks + procedural gameplay frames.
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

    // Real sheet PNGs (when git-pushed to public/assets)
    for (const { key, path } of IMAGE_ASSETS) {
      this.load.image(key, path);
    }
    for (const { key, path, frameWidth, frameHeight } of SHEET_ASSETS) {
      this.load.spritesheet(key, path, { frameWidth, frameHeight });
    }

    // Tiny embedded JPEG fallbacks for menu when disk PNGs are absent
    for (const [key, uri] of Object.entries(SHEET_ART)) {
      if (!IMAGE_ASSETS.some((a) => a.key === key)) {
        this.load.image(key, uri);
      }
    }
  }

  create() {
    // Fill any keys that failed disk load from embedded data-URIs
    registerSheetArt(this);

    // Procedural 96×96 gameplay frames + anims (always — reliable combat size)
    generateSheetTextures(this);

    // Prefer sheet strip anims when real spritesheets loaded
    this.registerSheetAnims();

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

  /** Build anims from disk spritesheets when present (menu/FX scale). */
  private registerSheetAnims() {
    const mk = (
      key: string,
      sheet: string,
      frames: number[],
      frameRate: number,
      repeat = -1
    ) => {
      if (!this.textures.exists(sheet)) return;
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sheet, { frames }),
        frameRate,
        repeat,
      });
    };

    // Concept strips are short — map to gameplay anim keys for optional use
    mk('sheet_arin_idle', 'sheet_arin', [0], 4, -1);
    mk('sheet_arin_run', 'sheet_arin', [1, 2], 8, -1);
    mk('sheet_graveling_walk', 'sheet_graveling', [0, 1], 6, -1);
    mk('sheet_legionnaire_walk', 'sheet_legionnaire', [0, 1], 6, -1);
    mk('sheet_hulk_walk', 'sheet_hulk', [0, 1], 5, -1);
    mk('sheet_reaver_idle', 'sheet_reaver', [0, 1], 5, -1);
  }
}
