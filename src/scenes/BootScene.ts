import Phaser from 'phaser';

/** Boot — preload menu art, generate fallback textures, enter Menu. */
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
    this.load.image('menu_hero', 'assets/menu/hero.png');
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x64748b, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x8bc34a, 0.85);
    g.fillRect(0, 0, 32, 5);
    g.generateTexture('tile', 32, 32);
    g.clear();
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(16, 22, 12);
    g.fillStyle(0xe0f2fe, 1);
    g.fillCircle(16, 12, 9);
    g.generateTexture('player', 32, 40);
    g.clear();
    g.fillStyle(0x7c3aed, 1);
    g.fillCircle(16, 16, 14);
    g.generateTexture('enemy', 32, 32);
    g.destroy();

    this.scene.start('Menu');
  }
}
