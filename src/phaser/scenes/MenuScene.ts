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

    // Asset-sheet skybound biome as backdrop
    if (this.textures.exists('art_menu_bg')) {
      this.add.image(width / 2, height / 2, 'art_menu_bg').setDisplaySize(width, height).setAlpha(0.55);
      this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.45);
    } else {
      this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height);
    }

    // Logo strip from sheet when available
    if (this.textures.exists('art_logo')) {
      this.add
        .image(width / 2, height * 0.1, 'art_logo')
        .setOrigin(0.5)
        .setScale(0.85)
        .setAlpha(0.95);
    } else {
      this.add
        .text(width / 2, height * 0.12, GAME_NAME, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '40px',
          color: '#e0f2fe',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.2, GAME_TAGLINE, {
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
        height * 0.27,
        pb > 0 ? `Best ${pb.toLocaleString()}` : 'First run awaits',
        { fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#94a3b8' }
      )
      .setOrigin(0.5);

    if (daily > 0) {
      this.add
        .text(width / 2, height * 0.31, `Today’s Rift best ${daily.toLocaleString()}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#64748b',
        })
        .setOrigin(0.5);
    }

    // Hero showcase — real Game Asset Sheet portraits
    const heroY = height * 0.48;
    const arinKey = this.textures.exists('art_arin_menu')
      ? 'art_arin_menu'
      : this.textures.exists('art_arin')
        ? 'art_arin'
        : 'arin';
    const arin = this.add.image(width / 2 - (unlocks.kaela ? 70 : 0), heroY, arinKey);
    if (arinKey.startsWith('art_')) arin.setScale(0.95);
    else arin.setScale(1.35);

    if (unlocks.kaela) {
      const kaelaKey = this.textures.exists('art_kaela_menu')
        ? 'art_kaela_menu'
        : this.textures.exists('art_kaela')
          ? 'art_kaela'
          : 'arin';
      const kaela = this.add.image(width / 2 + 70, heroY, kaelaKey);
      if (kaelaKey.startsWith('art_')) kaela.setScale(0.95);
      else kaela.setScale(1.2).setTint(0xa7f3d0);
      this.add
        .text(width / 2 + 70, heroY + 100, 'Kaela', {
          fontFamily: 'system-ui',
          fontSize: '11px',
          color: '#6ee7b7',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2 - (unlocks.kaela ? 70 : 0), heroY + 100, 'Arin Solwright', {
        fontFamily: 'system-ui',
        fontSize: '11px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);

    const play = this.mkButton(width / 2, height * 0.7, '▶  HOLD THE LINE', '#38bdf8', () => {
      Audio.sfxUiConfirm();
      Audio.stopMusic();
      this.scene.start('Play', { mode: 'campaign', hero: 'arin' });
    });

    const dailyBtn = this.mkButton(width / 2, height * 0.8, `DAILY RIFT · ${todayKey()}`, '#0c4a6e', () => {
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
      .text(width / 2, height * 0.96, 'WASD · SHIFT dash · J light · K heavy · wall-jump', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#64748b',
      })
      .setOrigin(0.5);

    void play;
    void dailyBtn;

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
