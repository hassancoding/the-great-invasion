import Phaser from 'phaser';

/**
 * Main menu — cinematic Halcyon sky, hero plate, clear CTAs.
 * Target feel: Aether Bridge / floating kingdoms.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor('#020617');
    this.cameras.main.fadeIn(500, 2, 6, 18);

    // Background
    if (this.textures.exists('menu_bg')) {
      const bg = this.add.image(w / 2, h / 2, 'menu_bg').setDepth(0);
      const scale = Math.max(w / bg.width, h / bg.height) * 1.05;
      bg.setScale(scale);
      this.tweens.add({
        targets: bg,
        x: w / 2 + 18,
        duration: 14000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      const g = this.add.graphics().setDepth(0);
      g.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x0c4a6e, 0x020617, 1);
      g.fillRect(0, 0, w, h);
    }

    // Vignette
    const vig = this.add.graphics().setDepth(2);
    vig.fillStyle(0x020617, 0.45);
    vig.fillRect(0, 0, w, 70);
    vig.fillRect(0, h - 90, w, 90);
    vig.fillStyle(0x020617, 0.25);
    vig.fillRect(0, 0, 48, h);
    vig.fillRect(w - 48, 0, 48, h);

    // Ambient motes
    for (let i = 0; i < 18; i++) {
      const m = this.add
        .circle(
          Phaser.Math.Between(20, w - 20),
          Phaser.Math.Between(20, h - 20),
          Phaser.Math.Between(1, 3),
          0x7dd3fc,
          Phaser.Math.FloatBetween(0.15, 0.55)
        )
        .setDepth(3);
      this.tweens.add({
        targets: m,
        y: m.y - Phaser.Math.Between(20, 50),
        alpha: 0.1,
        duration: Phaser.Math.Between(2800, 5200),
        yoyo: true,
        repeat: -1,
        delay: i * 90,
      });
    }

    // Hero plate (right)
    if (this.textures.exists('menu_hero')) {
      const hero = this.add
        .image(w * 0.78, h * 0.52, 'menu_hero')
        .setDepth(5)
        .setScale(0.95);
      const frame = this.add.graphics().setDepth(4);
      const fw = hero.displayWidth + 16;
      const fh = hero.displayHeight + 16;
      frame.fillStyle(0x0b1220, 0.28);
      frame.fillRoundedRect(hero.x - fw / 2, hero.y - fh / 2, fw, fh, 10);
      frame.lineStyle(2, 0x38bdf8, 0.4);
      frame.strokeRoundedRect(hero.x - fw / 2, hero.y - fh / 2, fw, fh, 10);
      this.tweens.add({
        targets: hero,
        y: hero.y - 8,
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Title block
    const titleX = w * 0.32;
    this.add
      .text(titleX, h * 0.22, 'THE GREAT', {
        fontFamily: 'system-ui,Segoe UI,sans-serif',
        fontSize: '18px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(titleX, h * 0.30, 'INVASION', {
        fontFamily: 'system-ui,Segoe UI,sans-serif',
        fontSize: '48px',
        color: '#f0f9ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(0, 4, '#0c4a6e', 12, true, true);

    this.add
      .text(titleX, h * 0.40, 'Hold the line. Claim the Well.', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '15px',
        color: '#bae6fd',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Buttons
    const btnY = h * 0.55;
    this.makeButton(titleX, btnY, 'NEW GAME', 0x38bdf8, '#0f172a', () => {
      this.cameras.main.fadeOut(280, 2, 6, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HeroSelect'));
    });
    this.makeButton(titleX, btnY + 56, 'DAILY RIFT', 0x1e293b, '#e0f2fe', () => {
      this.cameras.main.fadeOut(280, 2, 6, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('HeroSelect'));
    }, true);
    this.makeButton(titleX, btnY + 112, 'OPTIONS', 0x1e293b, '#94a3b8', () => {
      this.flashNote('Options coming soon');
    }, true);

    this.add
      .text(w / 2, h - 22, 'v5.0 · Phaser · Arrow keys in game', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '11px',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    bg: number,
    fg: string,
    onClick: () => void,
    outline = false
  ) {
    const padX = 40;
    const padY = 12;
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '18px',
        color: fg,
        fontStyle: 'bold',
        padding: { x: padX, y: padY },
      })
      .setOrigin(0.5)
      .setDepth(12);

    const bw = text.width;
    const bh = text.height;
    const g = this.add.graphics().setDepth(11);
    const draw = (hover: boolean) => {
      g.clear();
      if (outline) {
        g.lineStyle(2, hover ? 0x38bdf8 : 0x475569, hover ? 0.9 : 0.55);
        g.fillStyle(hover ? 0x1e293b : bg, 0.92);
      } else {
        g.fillStyle(hover ? 0x7dd3fc : bg, 1);
      }
      g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
      if (outline) g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    };
    draw(false);

    const hit = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(13);
    hit.on('pointerover', () => {
      draw(true);
      text.setColor(outline ? '#e0f2fe' : '#0f172a');
      text.setScale(1.03);
    });
    hit.on('pointerout', () => {
      draw(false);
      text.setColor(fg);
      text.setScale(1);
    });
    hit.on('pointerdown', onClick);
  }

  private flashNote(msg: string) {
    const { width: w, height: h } = this.scale;
    const t = this.add
      .text(w / 2, h * 0.88, msg, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#fde68a',
        backgroundColor: '#0b1220cc',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);
    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 180,
      yoyo: true,
      hold: 900,
      onComplete: () => t.destroy(),
    });
  }
}
