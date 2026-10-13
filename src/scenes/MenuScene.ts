import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor('#020617');

    this.add
      .text(w / 2, h * 0.28, 'THE GREAT INVASION', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '36px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h * 0.38, 'Blank slate — rebuild in progress', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(w / 2, h * 0.55, 'PLAY', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '22px',
        color: '#0f172a',
        backgroundColor: '#38bdf8',
        padding: { x: 36, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7dd3fc' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#38bdf8' }));
    btn.on('pointerdown', () => this.scene.start('Play'));
  }
}
