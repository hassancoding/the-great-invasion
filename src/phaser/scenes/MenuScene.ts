import Phaser from 'phaser';
import { GAME_NAME, GAME_TAGLINE } from '../config';
import { Audio } from '../systems/AudioManager';
import { getPb, loadDailyBest, loadUnlocks, todayKey } from '../systems/Progression';

/**
 * Title menu — floating-island backdrop, logo, hero portraits, clear CTAs.
 * Uses transparent gameplay portraits when present.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;

    // Backdrop
    if (this.textures.exists('art_menu_bg')) {
      this.add
        .image(width / 2, height / 2, 'art_menu_bg')
        .setDisplaySize(width, height)
        .setAlpha(0.7);
      this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.35);
    } else if (this.textures.exists('sky')) {
      this.add.image(width / 2, height / 2, 'sky').setDisplaySize(width, height);
    } else {
      this.cameras.main.setBackgroundColor('#060b1a');
    }

    // Parallax islands
    if (this.textures.exists('art_islands')) {
      this.add
        .image(width * 0.78, height * 0.38, 'art_islands')
        .setScale(0.7)
        .setAlpha(0.55)
        .setDepth(1);
      this.add
        .image(width * 0.18, height * 0.55, 'art_islands')
        .setScale(0.45)
        .setAlpha(0.35)
        .setFlipX(true)
        .setDepth(1);
    }

    // Logo
    if (this.textures.exists('art_logo')) {
      this.add
        .image(width / 2, height * 0.11, 'art_logo')
        .setOrigin(0.5)
        .setScale(Math.min(0.95, (width * 0.55) / 380))
        .setDepth(5);
    } else {
      this.add
        .text(width / 2, height * 0.1, GAME_NAME, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '36px',
          color: '#e0f2fe',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(5);
    }

    this.add
      .text(width / 2, height * 0.2, GAME_TAGLINE, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5)
      .setDepth(5);

    const pb = getPb();
    const daily = loadDailyBest();
    const unlocks = loadUnlocks();

    this.add
      .text(width / 2, height * 0.26, pb > 0 ? `Best ${pb.toLocaleString()}` : 'First run awaits', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setDepth(5);

    if (daily > 0) {
      this.add
        .text(width / 2, height * 0.3, `Today’s Rift best ${daily.toLocaleString()}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#64748b',
        })
        .setOrigin(0.5)
        .setDepth(5);
    }

    // Hero portraits — prefer transparent gameplay cutouts, then menu crops
    const heroY = height * 0.48;
    const pick = (...keys: string[]) => keys.find((k) => this.textures.exists(k)) ?? 'arin';
    const arinKey = pick('art_arin', 'art_arin_menu', 'arin');
    const arin = this.add.image(width / 2 - (unlocks.kaela ? 90 : 0), heroY, arinKey).setDepth(6);
    this.fitHeroPortrait(arin, arinKey);

    this.add
      .text(width / 2 - (unlocks.kaela ? 90 : 0), heroY + 110, 'Arin Solwright', {
        fontFamily: 'system-ui',
        fontSize: '12px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5)
      .setDepth(6);

    if (unlocks.kaela) {
      const kaelaKey = pick('art_kaela', 'art_kaela_menu', 'kaela');
      const kaela = this.add.image(width / 2 + 90, heroY, kaelaKey).setDepth(6);
      this.fitHeroPortrait(kaela, kaelaKey);
      this.add
        .text(width / 2 + 90, heroY + 110, 'Kaela Thornstride', {
          fontFamily: 'system-ui',
          fontSize: '12px',
          color: '#6ee7b7',
        })
        .setOrigin(0.5)
        .setDepth(6);
    }

    this.mkButton(width / 2, height * 0.72, '▶  HOLD THE LINE', '#38bdf8', () => {
      Audio.sfxUiConfirm();
      Audio.stopMusic();
      this.scene.start('Play', { mode: 'campaign', hero: 'arin' });
    });

    this.mkButton(width / 2, height * 0.81, `DAILY RIFT · ${todayKey()}`, '#0c4a6e', () => {
      Audio.sfxUiConfirm();
      Audio.stopMusic();
      this.scene.start('Play', { mode: 'daily', hero: unlocks.kaela ? 'kaela' : 'arin' });
    });

    if (unlocks.kaela) {
      this.mkButton(width / 2, height * 0.89, 'PLAY AS KAELA', '#065f46', () => {
        Audio.sfxUiConfirm();
        Audio.stopMusic();
        this.scene.start('Play', { mode: 'campaign', hero: 'kaela' });
      });
    } else {
      this.add
        .text(width / 2, height * 0.89, 'Clear all 3 sectors to unlock Kaela', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#475569',
        })
        .setOrigin(0.5)
        .setDepth(6);
    }

    this.add
      .text(width / 2, height * 0.96, 'WASD · SHIFT dash · J light · K heavy · wall-jump', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setDepth(6);

    Audio.unlock();
    Audio.setMusic('menu');
  }

  private fitHeroPortrait(img: Phaser.GameObjects.Image, key: string) {
    // Transparent portraits ~128×185; scale to ~150px tall
    const targetH = 150;
    if (key.startsWith('art_')) {
      const scale = targetH / Math.max(1, img.height);
      img.setScale(scale);
    } else {
      img.setScale(1.6);
    }
  }

  private mkButton(x: number, y: number, label: string, bg: string, onClick: () => void) {
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#0f172a',
        backgroundColor: bg,
        padding: { x: 22, y: 11 },
      })
      .setOrigin(0.5)
      .setDepth(10)
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
