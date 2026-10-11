import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';
import { SHEET_ART, registerSheetArt } from '../assets/sheetArt';
import { IMAGE_ASSETS, SHEET_ASSETS } from '../assets/manifest';

/**
 * Boot — load transparent gameplay sheets + presentation art,
 * then procedural-fill only missing keys (tiles, FX, sky).
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
    for (const { key, path } of IMAGE_ASSETS) {
      this.load.image(key, path);
    }
    for (const { key, path, frameWidth, frameHeight } of SHEET_ASSETS) {
      this.load.spritesheet(key, path, { frameWidth, frameHeight });
    }
    for (const [key, uri] of Object.entries(SHEET_ART)) {
      if (!IMAGE_ASSETS.some((a) => a.key === key) && !SHEET_ASSETS.some((a) => a.key === key)) {
        this.load.image(key, uri);
      }
    }
  }

  create() {
    registerSheetArt(this);
    generateSheetTextures(this);
    this.registerGameplayAnims();
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

  /**
   * Hero sheet frames: 0 idle, 1 idle-b, 2 run-a, 3 run-b, 4 jump, 5 attack
   * Enemy sheets: 0..n-1 walk/idle poses from concept strip cells
   */
  private registerGameplayAnims() {
    const mk = (
      key: string,
      sheet: string,
      frames: number[],
      frameRate: number,
      repeat = -1
    ) => {
      if (!this.textures.exists(sheet)) return;
      const tex = this.textures.get(sheet);
      const valid = frames.filter((f) => {
        try {
          return !!tex.get(f);
        } catch {
          return false;
        }
      });
      const use = valid.length ? valid : [0];
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sheet, { frames: use }),
        frameRate,
        repeat,
      });
    };

    mk('arin_idle', 'arin', [0, 1], 4, -1);
    mk('arin_run', 'arin', [2, 3], 10, -1);
    mk('arin_jump', 'arin', [4], 1, 0);
    mk('arin_attack', 'arin', [5], 8, 0);
    mk('arin_heavy', 'arin', [5], 6, 0);

    mk('kaela_idle', 'kaela', [0, 1], 4, -1);
    mk('kaela_run', 'kaela', [2, 3], 10, -1);
    mk('varkhul_idle', 'varkhul', [0, 1], 4, -1);

    mk('graveling_walk', 'graveling', [0, 1, 2, 3], 8, -1);
    mk('legionnaire_walk', 'legionnaire', [0, 1, 2, 3], 7, -1);
    mk('hulk_walk', 'hulk', [0, 1, 2, 3], 5, -1);
    mk('elite_idle', 'elite', [0, 1], 5, -1);
    mk('elite_charge', 'elite', [2, 3], 10, -1);
    mk('reaver_idle', 'reaver', [0, 1], 5, -1);
  }
}
