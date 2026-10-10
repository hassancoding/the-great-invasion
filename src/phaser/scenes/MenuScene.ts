import Phaser from 'phaser';
import { GAME_NAME, GAME_TAGLINE } from '../config';
import { Audio } from '../systems/AudioManager';
import { getPb, loadDailyBest, loadUnlocks, todayKey } from '../systems/Progression';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height);

    this.add
      .text(width / 2, height * 0.14, GAME_NAME, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.22, GAME_TAGLINE, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);

    const pb = getPb();
    const daily = loadDailyBest();
    const unlocks = loadUnlocks();

    this.add
      .text(
        width / 2,
        height * 0.3,
        pb > 0 ? `Best ${pb.toLocaleString()}` : 'First run awaits',
        { fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#94a3b8' }
      )
      .setOrigin(0.5);

    if (daily > 0) {
      this.add
        .text(width / 2, height * 0.35, `Today's Rift best ${daily.toLocaleString()}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#64748b',
        })
        .setOrigin(0.5);
    }

    const arin = this.add.image(width / 2 - (unlocks.kaela ? 40 : 0), height * 0.5, 'arin').setScale(1.35);
    if (unlocks.kaela) {
      const kaela = this.add.image(width / 2 + 50, height * 0.5, 'arin').setScale(1.2).setTint(0xa7f3d0);
      this.add
        .text(width / 2 + 50, height * 0.58, 'Kaela', {
          fontFamily: 'system-ui',
          fontSize: '11px',
          color: '#6ee7b7',
        })
        .setOrigin(0.5);
      void kaela;
    }
    void arin;

    this.mkButton(width / 2, height * 0.7, '\u25B6  HOLD THE LINE', '#38bdf8', () => {
      Audio.sfxUiConfirm();
      Audio.stopMusic();
      this.scene.start('Play', { mode: 'campaign', hero: 'arin' });
    });

    this.mkButton(width / 2, height * 0.8, `DAILY RIFT \u00B7 ${todayKey()}`, '#0c4a6e', () => {
      Audio.sfxUiConfirm();
      Audio.stopMusic();
      this.scene.start('Play', { mode: 'daily', hero: unlocks.kaela ? 'kaela' : 'arin' });
    });

    if (unlocks.kaela) {
      this.mkButton(width / 2, height * 0.88, 'PLAY AS KAELA', '#065f46', () => {
        Audio.sfxUiConfirm();
        Audio.stopMusic();
        this.scene.start('Play', { mode: 'campaign', hero: 'kaela' });
      });
    } else {
      this.add
        .text(width / 2, height * 0.88, 'Clear all 3 sectors to unlock Kaela', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#475569',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.96, 'WASD \u00B7 SHIFT dash \u00B7 J light \u00B7 K heavy \u00B7 wall-jump', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#64748b',
      })
      .setOrigin(0.5);

    Audio.unlock();
    Audio.setMusic('menu');
  }

  private mkButton(x: number, y: number, label: string, bg: string, onClick: () => void) {
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#0f172a',
        backgroundColor: bg,
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerover', () => {
      t.setAlpha(0.9);
      Audio.sfxUiClick();
    });
    t.on('pointerout', () => t.setAlpha(1));
    t.on('pointerdown', () => {
      Audio.unlock();
      onClick();
    });
    return t;
  }
}
