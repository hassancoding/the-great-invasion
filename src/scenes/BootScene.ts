import Phaser from 'phaser';
import { ensureHeroTextures } from '../systems/envBuilder';

/** Boot — preload menu + skies + Arin art, generate fallbacks, enter Menu. */
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
    this.load.image('portrait_arin', 'assets/menu/portrait_arin.png');

    this.load.atlas(
      'arin',
      'assets/sprites/arin/arin_sheet.png',
      'assets/sprites/arin/arin_atlas.json'
    );
    this.load.image('arin_run', 'assets/sprites/arin/arin_run.png');
    this.load.image('arin_attack', 'assets/sprites/arin/arin_attack.png');
  }

  create() {
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
      mk('arin_idle', ['arin_idle_0'], 4, -1);
      mk('arin_run', ['arin_run_0'], 8, -1);
      mk('arin_attack', ['arin_attack_0'], 10, 0);
      mk('arin_jump', ['arin_run_0'], 6, 0);
    }

    this.scene.start('Menu');
  }
}
