import Phaser from 'phaser';
import { GAME_NAME } from '../config';
import { Audio } from '../systems/AudioManager';

type ResultsData = {
  score: number;
  stars: number;
  won: boolean;
  pb: number;
  level: number;
  crystals: number;
};

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(data: ResultsData) {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height);

    Audio.stopMusic();
    if (data.won) {
      Audio.setMusic('victory');
      for (let i = 0; i < data.stars; i++) {
        this.time.delayedCall(200 + i * 180, () => Audio.sfxStar());
      }
    } else {
      Audio.setMusic('defeat');
    }

    const title = data.won ? 'ALL WELLS STABLE' : 'OVERRUN';
    this.add
      .text(width / 2, height * 0.2, title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
        color: data.won ? '#67e8f9' : '#f87171',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const starStr = '★'.repeat(data.stars) + '☆'.repeat(Math.max(0, 3 - data.stars));
    this.add
      .text(width / 2, height * 0.32, starStr, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.42,
        `${data.score.toLocaleString()} pts  ·  Lv ${data.level}  ·  ✦ ${data.crystals}`,
        { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#e0f2fe' }
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.5, `Best ${data.pb.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const again = this.add
      .text(width / 2, height * 0.68, 'PLAY AGAIN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#0f172a',
        backgroundColor: '#38bdf8',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    again.on('pointerover', () => Audio.sfxUiClick());
    again.on('pointerdown', () => {
      Audio.sfxUiConfirm();
      this.scene.start('Play');
    });

    const share = this.add
      .text(width / 2, height * 0.8, 'SHARE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#e0f2fe',
        backgroundColor: '#0c4a6e',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    share.on('pointerdown', async () => {
      Audio.sfxUiClick();
      const text = `${GAME_NAME}: held the Well — ${data.score.toLocaleString()} pts ${starStr}. Can you hold the line?`;
      try {
        if (navigator.share) await navigator.share({ text });
        else await navigator.clipboard.writeText(text);
      } catch {}
    });

    const menu = this.add
      .text(width / 2, height * 0.9, 'MENU', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => {
      Audio.sfxUiClick();
      this.scene.start('Menu');
    });
  }
}
