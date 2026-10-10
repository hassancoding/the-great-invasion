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
  mode?: 'campaign' | 'daily';
  dailyPb?: number;
  unlockedKaela?: boolean;
  dateKey?: string;
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

    const isDaily = data.mode === 'daily';
    const title = data.won
      ? isDaily
        ? 'DAILY RIFT HELD'
        : 'ALL WELLS STABLE'
      : isDaily
        ? 'RIFT OVERUN'
        : 'OVERRUN';

    this.add
      .text(width / 2, height * 0.16, title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        color: data.won ? '#67e8f9' : '#f87171',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (isDaily && data.dateKey) {
      this.add
        .text(width / 2, height * 0.24, data.dateKey, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: '#94a3b8',
        })
        .setOrigin(0.5);
    }

    const starStr = '\u2605'.repeat(data.stars) + '\u2606'.repeat(Math.max(0, 3 - data.stars));
    this.add
      .text(width / 2, height * 0.3, starStr, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.4,
        `${data.score.toLocaleString()} pts  \u00b7  Lv ${data.level}  \u00b7  \u2726 ${data.crystals}`,
        { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#e0f2fe' }
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.47, `Best ${data.pb.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    if (isDaily && (data.dailyPb ?? 0) > 0) {
      this.add
        .text(width / 2, height * 0.52, `Daily best ${data.dailyPb!.toLocaleString()}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: '#7dd3fc',
        })
        .setOrigin(0.5);
    }

    if (data.unlockedKaela) {
      this.add
        .text(width / 2, height * 0.58, 'UNLOCKED \u00b7 Kaela Thornstride', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: '#6ee7b7',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

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
      this.scene.start('Play', { mode: data.mode ?? 'campaign' });
    });

    const share = this.add
      .text(width / 2, height * 0.78, 'SHARE', {
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
      const tag = isDaily ? `Daily Rift ${data.dateKey ?? ''}` : 'held the Well';
      const text = `${GAME_NAME}: ${tag} \u2014 ${data.score.toLocaleString()} pts ${starStr}. Can you hold the line? https://the-great-invasion.vercel.app`;
      try {
        if (navigator.share) await navigator.share({ text, url: 'https://the-great-invasion.vercel.app' });
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
