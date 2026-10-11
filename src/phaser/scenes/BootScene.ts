import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';
import { SHEET_ART, registerSheetArt } from '../assets/sheetArt';
import { IMAGE_ASSETS, SHEET_ASSETS } from '../assets/manifest';
import { GAMEPLAY_SHEETS } from '../assets/gameplayData';

/**
 * Boot — Arin atlas (production sprites) + enemies + presentation art.
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

    // Production Arin atlas — 64×80 frames
    this.load.atlas(
      'arin',
      'assets/sprites/arin/arin_sprites.png',
      'assets/sprites/arin/arin_atlas.json'
    );

    for (const [key, spec] of Object.entries(GAMEPLAY_SHEETS)) {
      this.load.spritesheet(key, spec.uri, {
        frameWidth: spec.frameWidth,
        frameHeight: spec.frameHeight,
      });
    }
    for (const { key, path, frameWidth, frameHeight } of SHEET_ASSETS) {
      if (key === 'arin' || key === 'kaela' || key === 'varkhul') continue;
      if (!(key in GAMEPLAY_SHEETS)) {
        this.load.spritesheet(key, path, { frameWidth, frameHeight });
      }
    }
    for (const [key, uri] of Object.entries(SHEET_ART)) {
      if (!IMAGE_ASSETS.some((a) => a.key === key)) {
        this.load.image(key, uri);
      }
    }
  }

  create() {
    registerSheetArt(this);
    generateSheetTextures(this);
    this.registerArinAnims();
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

  /** Animations from arin_atlas.json frame names */
  private registerArinAnims() {
    if (!this.textures.exists('arin')) return;
    const tex = this.textures.get('arin');
    // Painted art — linear filtering (not nearest/pixel-art)
    try {
      tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    } catch {
      /* older phaser */
    }

    const mk = (key: string, frames: string[], frameRate: number, repeat: number) => {
      const valid = frames.filter((f) => tex.has(f));
      if (!valid.length) {
        console.warn('[Boot] missing frames for', key, frames);
        return;
      }
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({
        key,
        frames: valid.map((frame) => ({ key: 'arin', frame })),
        frameRate,
        repeat,
      });
    };

    mk('arin_idle', ['arin_idle_0', 'arin_idle_1', 'arin_idle_2', 'arin_idle_3'], 6, -1);
    mk(
      'arin_run',
      ['arin_run_0', 'arin_run_1', 'arin_run_2', 'arin_run_3', 'arin_run_4', 'arin_run_5'],
      10,
      -1
    );
    mk('arin_jump', ['arin_jump_0', 'arin_jump_1'], 6, 0);
    mk(
      'arin_attack',
      ['arin_attack_light_0', 'arin_attack_light_1', 'arin_attack_light_2', 'arin_attack_light_3'],
      12,
      0
    );
    mk(
      'arin_heavy',
      [
        'arin_attack_heavy_0',
        'arin_attack_heavy_1',
        'arin_attack_heavy_2',
        'arin_attack_heavy_3',
        'arin_attack_heavy_4',
      ],
      10,
      0
    );
    mk('arin_dash', ['arin_dash_0', 'arin_dash_1', 'arin_dash_2', 'arin_dash_3'], 12, 0);
    mk('arin_hurt', ['arin_hurt_0', 'arin_hurt_1', 'arin_hurt_2'], 8, 0);
    mk(
      'arin_death',
      [
        'arin_death_0',
        'arin_death_1',
        'arin_death_2',
        'arin_death_3',
        'arin_death_4',
        'arin_death_5',
      ],
      8,
      0
    );
  }

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

    if (!this.anims.exists('arin_idle')) {
      console.warn('[Boot] Arin atlas anims missing — procedural fallback');
      mk('arin_idle', 'arin', [0], 4, -1);
      mk('arin_run', 'arin', [0], 8, -1);
    }

    mk('kaela_idle', 'kaela', [0], 4, -1);
    mk('kaela_run', 'kaela', [1, 2], 10, -1);
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
