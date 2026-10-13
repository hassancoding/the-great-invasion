import Phaser from 'phaser';

/** Minimal boot — blank slate. Load real assets when supplied. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width: w, height: h } = this.scale;
    this.add.rectangle(w / 2, h / 2, 240, 12, 0x1e293b).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 118, h / 2, 4, 8, 0x38bdf8).setOrigin(0, 0.5);
    this.add
      .text(w / 2, h / 2 - 36, 'THE GREAT INVASION', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '22px',
        color: '#e0f2fe',
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, h / 2 + 28, 'v5 blank slate', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = Math.max(4, 236 * v);
    });
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x64748b, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(0, 0, 32, 4);
    g.generateTexture('tile', 32, 32);
    g.clear();
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(16, 20, 12);
    g.fillStyle(0x0ea5e9, 1);
    g.fillCircle(16, 12, 8);
    g.generateTexture('player', 32, 40);
    g.clear();
    g.fillStyle(0xa78bfa, 1);
    g.fillCircle(16, 16, 14);
    g.generateTexture('enemy', 32, 32);
    g.destroy();

    this.scene.start('Menu');
  }
}
