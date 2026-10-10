import Phaser from 'phaser';
import { GAME_NAME, GAME_TAGLINE } from '../config';
import { Audio } from '../systems/AudioManager';

const PB_KEY = 'tgi_riftlands_pb';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height);

    this.add
      .text(width / 2, height * 0.22, GAME_NAME, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.32, GAME_TAGLINE, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);

    let pb = 0;
    try {
      pb = Number(localStorage.getItem(PB_KEY) || 0);
    } catch {}
    this.add
      .text(width / 2, height * 0.4, pb > 0 ? `Best ${pb.toLocaleString()}` : 'First run awaits', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add.image(width / 2, height * 0.58, 'arin').setScale(1.4);

    const play = this.add
      .text(width / 2, height * 0.78, '▶  HOLD THE LINE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#0f172a',
        backgroundColor: '#38bdf8',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    play.on('pointerover', () => {
      play.setStyle({ backgroundColor: '#7dd3fc' });
      Audio.sfxUiClick();
    });
    play.on('pointerout', () => play.setStyle({ backgroundColor: '#38bdf8' }));
    play.on('pointerdown', () => {
      Audio.unlock();
      Audio.sfxUiConfirm();
      Audio.stopMusic();
      this.scene.start('Play');
    });

    this.add
      .text(width / 2, height * 0.92, 'WASD / Arrows · J light · K heavy · Mobile: on-screen', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#64748b',
      })
      .setOrigin(0.5);

    Audio.unlock();
    Audio.setMusic('menu');
  }
}
