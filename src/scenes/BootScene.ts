import Phaser from 'phaser';
import { ensureHeroTextures } from '../systems/envBuilder';
import {
  ARIN_SHEET_DATA_URI,
  ARIN_PORTRAIT_DATA_URI,
  ARIN_ATLAS_JSON,
} from '../assets/arinEmbedded';

/** Boot — preload menu + skies + embedded Arin art, enter Menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor('#020617');
    this.add.rectangle(w / 2, h / 2, 260, 14, 0x1e293b).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 128, h / 2, 4, 10, 0x38bdf8).setOrigin(0, 0.5);
    this.add
      .text(w / 2, h / 2 - 40, 'THE GREAT INVASION', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '22px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, h / 2 + 32, 'Loading…', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = Math.max(4, 256 * v);
    });

    this.load.image('menu_bg', 'assets/menu/bg.jpg');
    this.load.image('sky_vista', 'assets/env/sky_vista.jpg');
    this.load.image('sky_citadel', 'assets/env/sky_citadel.jpg');
    this.load.image('sky_ruins', 'assets/env/sky_ruins.jpg');
    this.load.image('menu_hero', 'assets/menu/hero.png');

    // Embedded production Arin (from turnaround sheet)
    this.load.image('arin_sheet', ARIN_SHEET_DATA_URI);
    this.load.image('portrait_arin', ARIN_PORTRAIT_DATA_URI);
  }

  create() {
    if (this.textures.exists('arin_sheet') && !this.textures.exists('arin')) {
      const src = this.textures.get('arin_sheet').getSourceImage() as HTMLImageElement;
      this.textures.addAtlas('arin', src, ARIN_ATLAS_JSON as unknown as object);
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    if (!this.textures.exists('tile')) {
      g.fillStyle(0x64748b, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x8bc34a, 0.85);
      g.fillRect(0, 0, 32, 5);
      g.generateTexture('tile', 32, 32);
    }
    if (!this.textures.exists('player')) {
      g.clear();
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(16, 22, 12);
      g.fillStyle(0xe0f2fe, 1);
      g.fillCircle(16, 12, 9);
      g.generateTexture('player', 32, 40);
    }
    if (!this.textures.exists('enemy')) {
      g.clear();
      g.fillStyle(0x7c3aed, 1);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0xc4b5fd, 0.9);
      g.fillCircle(16, 12, 6);
      g.generateTexture('enemy', 32, 32);
    }
    g.destroy();

    ensureHeroTextures(this);

    if (this.textures.exists('arin')) {
      const mk = (key: string, frames: string[], rate: number, repeat: number) => {
        if (this.anims.exists(key)) this.anims.remove(key);
        const valid = frames.filter((f) => this.textures.get('arin').has(f));
        if (!valid.length) return;
        this.anims.create({
          key,
          frames: valid.map((f) => ({ key: 'arin', frame: f })),
          frameRate: rate,
          repeat,
        });
      };
      mk('arin_idle', ['arin_idle_0', 'arin_idle_1'], 3, -1);
      mk('arin_run', ['arin_run_0', 'arin_run_1', 'arin_run_2'], 10, -1);
      mk('arin_attack', ['arin_attack_0', 'arin_attack_1', 'arin_attack_2'], 12, 0);
      mk('arin_jump', ['arin_jump_0'], 6, 0);
    }

    this.scene.start('Menu');
  }
}
