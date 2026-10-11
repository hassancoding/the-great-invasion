import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';
import { SHEET_ART, registerSheetArt } from '../assets/sheetArt';
import { IMAGE_ASSETS, SHEET_ASSETS } from '../assets/manifest';
import { GAMEPLAY_SHEETS } from '../assets/gameplayData';

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
    // Prefer embedded transparent sheets (always available in bundle)
    for (const [key, spec] of Object.entries(GAMEPLAY_SHEETS)) {
      this.load.spritesheet(key, spec.uri, {
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
      });
    }
    // Optional disk overrides (same keys — last wins if both load; embedded is enough)
    for (const { key, path, frameWidth, frameHeight } of SHEET_ASSETS) {
      if (!(key in GAMEPLAY_SHEETS)) {
        this.load.spritesheet(key, path, { frameWidth, frameHeight });
      }
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
   * Hero frames: 0 idle, 1 idle-b, 2 run-a, 3 run-b, 4 jump, 5 attack
   * Enemy frames: concept-strip cells 0..n
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

    // Heroes: multi-pose frames drawn by textureFactory (not portrait transforms)
    // 0 idle, 1 run0, 2 run1, 3 jump, 4 atk, 5 heavy
    mk('arin_idle', 'arin', [0], 4, -1);
    mk('arin_run', 'arin', [1, 2], 10, -1);
    mk('arin_jump', 'arin', [3], 1, 0);
    mk('arin_attack', 'arin', [4], 10, 0);
    mk('arin_heavy', 'arin', [5], 8, 0);

    mk('kaela_idle', 'kaela', [0], 4, -1);
    mk('kaela_run', 'kaela', [1, 2], 10, -1);
    mk('kaela_jump', 'kaela', [3], 1, 0);
    mk('kaela_attack', 'kaela', [4], 10, 0);
    mk('varkhul_idle', 'varkhul', [0], 4, -1);
    mk('varkhul_run', 'varkhul', [1, 2], 10, -1);

    mk('graveling_walk', 'graveling', [0, 1, 2, 3], 8, -1);
    mk('legionnaire_walk', 'legionnaire', [0, 1, 2, 3], 7, -1);
    mk('hulk_walk', 'hulk', [0, 1, 2, 3], 5, -1);
    mk('elite_idle', 'elite', [0, 1], 5, -1);
    mk('elite_charge', 'elite', [2, 3], 10, -1);
    mk('reaver_idle', 'reaver', [0, 1], 5, -1);
  }
}
