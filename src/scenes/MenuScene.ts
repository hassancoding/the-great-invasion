import Phaser from 'phaser';

/**
 * Main menu — cinematic Halcyon sky, hero plate, clear CTAs.
 * Target feel: Aether Bridge / floating kingdoms.
 */
export class MenuScene extends Phaser.Scene {
  private reducedMotion = false;
  private menuActions: Array<() => void> = [];
  private focusDrawers: Array<(focused: boolean) => void> = [];
  private focusedButton = -1;
  private dismissInfo?: () => void;

  constructor() {
    super('Menu');
  }

  create() {
    const { width: w, height: h } = this.scale;
    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'The Great Invasion game canvas');
    canvas.focus({ preventScroll: true });
    const compact = w < 760 || h < 440;
    const unit = Math.min(w / 960, h / 540);
    const titleX = w < 600 ? w / 2 : compact ? w * 0.34 : w * 0.31;
    const titleSize = Math.max(34, Math.min(compact ? 46 : 58, 58 * unit));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.menuActions = [];
    this.focusDrawers = [];
    this.focusedButton = -1;
    this.dismissInfo = undefined;

    this.cameras.main.setBackgroundColor('#020617');
    if (this.reducedMotion) this.cameras.main.setAlpha(1);
    else this.cameras.main.fadeIn(500, 2, 6, 18);

    // Background
    if (this.textures.exists('menu_bg')) {
      const bg = this.add.image(w / 2, h / 2, 'menu_bg').setDepth(0);
      const scale = Math.max(w / bg.width, h / bg.height) * 1.05;
      bg.setScale(scale);
      if (!this.reducedMotion) {
        this.tweens.add({
          targets: bg,
          x: w / 2 + 12,
          duration: 18000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      const g = this.add.graphics().setDepth(0);
      g.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x0c4a6e, 0x020617, 1);
      g.fillRect(0, 0, w, h);
    }

    if (this.textures.exists('halcyon_fortress_skyline')) {
      const skyline = this.add.image(w / 2, h / 2, 'halcyon_fortress_skyline').setDepth(1);
      skyline.setScale(Math.max(w / skyline.width, h / skyline.height));
      skyline.setAlpha(0.48);
    }

    // Vignette
    const vig = this.add.graphics().setDepth(2);
    vig.fillStyle(0x020617, 0.2);
    vig.fillRect(0, 0, w, h);
    vig.fillStyle(0x020617, 0.5);
    vig.fillRect(0, 0, w, h * 0.12);
    vig.fillRect(0, h * 0.84, w, h * 0.16);
    vig.fillStyle(0x020617, 0.3);
    vig.fillRect(0, 0, w * 0.08, h);
    vig.fillRect(w * 0.92, 0, w * 0.08, h);

    // Ambient motes
    for (let i = 0; !this.reducedMotion && i < 8; i++) {
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

    // Prefer the animated Arin atlas; retain the existing portrait as a fallback.
    const heroX = w * 0.77;
    const heroY = h * 0.9;
    let hero: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | undefined;
    if (this.textures.exists('arin') && this.anims.exists('arin_idle')) {
      const arin = this.add.sprite(heroX, heroY, 'arin', 'arin_idle_0').setOrigin(0.5, 1).setDepth(5);
      arin.setScale(Math.min((w * 0.3) / arin.width, (h * 0.68) / arin.height));
      arin.play('arin_idle');
      hero = arin;
    } else if (this.textures.exists('menu_hero')) {
      const portrait = this.add.image(heroX, heroY, 'menu_hero').setOrigin(0.5, 1).setDepth(5);
      portrait.setScale(Math.min((w * 0.3) / portrait.width, (h * 0.68) / portrait.height));
      hero = portrait;
    }

    if (hero) {
      const arch = this.add.graphics().setDepth(4);
      const archWidth = Math.min(w * 0.45, hero.displayWidth + 62);
      const archHeight = Math.min(h * 0.86, hero.displayHeight + 56);
      const left = heroX - archWidth / 2;
      const right = heroX + archWidth / 2;
      const top = heroY - archHeight;
      const bottom = heroY;
      arch.fillStyle(0x081426, 0.32);
      arch.fillEllipse(heroX, top + archHeight * 0.54, archWidth * 0.92, archHeight * 0.9);
      arch.lineStyle(2, 0xf5c96a, 0.76);
      arch.beginPath();
      arch.moveTo(left, bottom);
      arch.lineTo(left, top + archHeight * 0.27);
      arch.lineTo(heroX, top);
      arch.lineTo(right, top + archHeight * 0.27);
      arch.lineTo(right, bottom);
      arch.strokePath();
      arch.lineStyle(1, 0x67d9ee, 0.68);
      arch.beginPath();
      arch.moveTo(left + 10, bottom - 12);
      arch.lineTo(left + 10, top + archHeight * 0.29);
      arch.lineTo(heroX, top + 12);
      arch.lineTo(right - 10, top + archHeight * 0.29);
      arch.lineTo(right - 10, bottom - 12);
      arch.strokePath();
      arch.fillStyle(0xf5c96a, 0.95);
      arch.fillTriangle(heroX, top - 2, heroX - 7, top + 13, heroX + 7, top + 13);
      arch.lineStyle(2, 0xf5c96a, 0.82);
      arch.beginPath();
      arch.moveTo(left - 8, bottom);
      arch.lineTo(right + 8, bottom);
      arch.strokePath();

      if (!this.reducedMotion) {
        this.tweens.add({
          targets: hero,
          y: heroY - 6,
          duration: 4200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // Title block
    const titleTop = h * 0.18;
    this.add
      .text(titleX, titleTop, 'THE GREAT', {
        fontFamily: 'Georgia,Times New Roman,serif',
        fontSize: `${Math.max(14, Math.min(18, 18 * unit))}px`,
        color: '#f5c96a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(titleX, titleTop + h * 0.1, 'INVASION', {
        fontFamily: 'Georgia,Times New Roman,serif',
        fontSize: `${titleSize}px`,
        color: '#f0f9ff',
        fontStyle: 'bold',
        stroke: '#071426',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setShadow(0, 4, '#071426', 10, true, true);

    const ornament = this.add.graphics().setDepth(10);
    ornament.lineStyle(1, 0xf5c96a, 0.78);
    ornament.beginPath();
    ornament.moveTo(titleX - w * 0.14, titleTop + h * 0.17);
    ornament.lineTo(titleX - w * 0.045, titleTop + h * 0.17);
    ornament.moveTo(titleX + w * 0.045, titleTop + h * 0.17);
    ornament.lineTo(titleX + w * 0.14, titleTop + h * 0.17);
    ornament.strokePath();
    ornament.fillStyle(0xf5c96a, 0.9);
    ornament.fillTriangle(titleX, titleTop + h * 0.16, titleX - 5, titleTop + h * 0.17, titleX + 5, titleTop + h * 0.17);

    this.add
      .text(titleX, titleTop + h * 0.2, 'Hold the line. Claim the Well.', {
        fontFamily: 'Georgia,Times New Roman,serif',
        fontSize: `${Math.max(13, Math.min(17, 17 * unit))}px`,
        color: '#f1f7ff',
        stroke: '#071426',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Buttons
    const btnY = h * (compact ? 0.56 : 0.57);
    const buttonGap = Math.max(48, Math.min(58, h * 0.105));
    this.makeButton(titleX, btnY, 'ENTER HALCYON', 0x38bdf8, '#0f172a', () => {
      const enterHeroSelect = () => this.scene.start('HeroSelect');
      if (this.reducedMotion) enterHeroSelect();
      else {
        this.cameras.main.fadeOut(280, 2, 6, 18);
        this.cameras.main.once('camerafadeoutcomplete', enterHeroSelect);
      }
    });
    this.makeButton(titleX, btnY + buttonGap, 'HOW TO PLAY', 0x1e293b, '#e0f2fe', () => {
      this.showInfo('FIELD MANUAL', 'MOVE   A / D or LEFT / RIGHT\nJUMP   W / UP / SPACE\nATTACK   J or K\nPAUSE / MENU   ESC\n\nSURVIVE THE SIEGE\nDefeat every wave. Enemies grow faster, tougher, and larger.\n\nCLAIM THE AETHER WELL\nOnly after the final breach is defeated, stand inside the Well ring until it stabilizes.');
    }, true);
    this.makeButton(titleX, btnY + buttonGap * 2, 'THE RIFTLANDS', 0x1e293b, '#e0c987', () => {
      this.showInfo('THE RIFTLANDS', 'The invasion has reached Halcyon Spire.\n\nThree champions stand between the Rift and the Aether Well.\n\nSector I is the only open front. Clear its siege to earn the right to advance.');
    }, true);

    this.add
      .text(w / 2, h - Math.max(18, h * 0.035), 'SECTOR I: HALCYON SPIRE  ·  THE SIEGE OF THE AETHER WELL', {
        fontFamily: 'Georgia,Times New Roman,serif',
        fontSize: `${compact ? 10 : Math.max(11, Math.min(13, 13 * unit))}px`,
        color: '#f0d48a',
        stroke: '#071426',
        strokeThickness: 3,
        wordWrap: { width: w - 36 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.input.keyboard?.off('keydown', this.handleMenuKey, this);
    this.input.keyboard?.on('keydown', this.handleMenuKey, this);
  }

  private handleMenuKey(event: KeyboardEvent) {
    if (this.dismissInfo) {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') this.dismissInfo();
      return;
    }

    if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const next = this.focusedButton < 0
        ? (direction < 0 ? this.focusDrawers.length - 1 : 0)
        : (this.focusedButton + direction + this.focusDrawers.length) % this.focusDrawers.length;
      if (this.focusedButton >= 0) this.focusDrawers[this.focusedButton](false);
      this.focusedButton = next;
      this.focusDrawers[next](true);
    } else if ((event.key === 'Enter' || event.key === ' ') && this.focusedButton >= 0) {
      event.preventDefault();
      this.menuActions[this.focusedButton]?.();
    }
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
    const buttonWidth = Math.min(280, this.scale.width - 40);
    const buttonHeight = 46;
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Georgia,Times New Roman,serif',
        fontSize: '15px',
        color: fg,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(12);

    const bw = buttonWidth;
    const bh = buttonHeight;
    const g = this.add.graphics().setDepth(11);
    let focused = false;
    const draw = (hover: boolean) => {
      g.clear();
      if (outline) {
        g.lineStyle(focused ? 3 : 1, hover || focused ? 0x67d9ee : 0xb2c1d5, hover || focused ? 0.95 : 0.62);
        g.fillStyle(hover || focused ? 0x18344a : bg, 0.96);
      } else {
        g.fillStyle(hover || focused ? 0x7dd3fc : bg, 1);
      }
      g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 5);
      if (outline || focused) g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 5);
    };
    draw(false);

    const hit = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(13);
    hit.on('pointerover', () => {
      draw(true);
      text.setColor(outline ? '#ffffff' : '#071426');
    });
    hit.on('pointerout', () => {
      draw(focused);
      text.setColor(fg);
    });
    hit.on('pointerdown', onClick);
    this.menuActions.push(onClick);
    this.focusDrawers.push((isFocused) => {
      focused = isFocused;
      draw(isFocused);
      text.setColor(isFocused ? (outline ? '#ffffff' : '#071426') : fg);
    });
  }

  private showInfo(title: string, body: string) {
    const { width: w, height: h } = this.scale;
    const panelWidth = Math.min(560, w - 32);
    const panelHeight = Math.min(420, h - 32);
    const panelTop = (h - panelHeight) / 2;
    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x020617, 0.86).setDepth(30).setInteractive();
    const panel = this.add.rectangle(w / 2, h / 2, panelWidth, panelHeight, 0x0b1729, 0.99).setStrokeStyle(2, 0xf5c96a, 0.8).setDepth(31);
    const heading = this.add.text(w / 2, panelTop + 36, title, { fontFamily: 'Georgia,Times New Roman,serif', fontSize: '22px', color: '#f5c96a', fontStyle: 'bold', wordWrap: { width: panelWidth - 40 } }).setOrigin(0.5).setDepth(32);
    const copy = this.add.text(w / 2, h / 2, body, { fontFamily: 'Georgia,Times New Roman,serif', fontSize: '15px', color: '#f1f7ff', align: 'center', lineSpacing: 5, wordWrap: { width: panelWidth - 48 } }).setOrigin(0.5).setDepth(32);
    const close = this.add.text(w / 2, panelTop + panelHeight - 34, 'RETURN', { fontFamily: 'Georgia,Times New Roman,serif', fontSize: '15px', color: '#071426', backgroundColor: '#f5c96a', padding: { x: 28, y: 9 }, fontStyle: 'bold' }).setOrigin(0.5).setDepth(33).setInteractive({ useHandCursor: true });
    const dismiss = () => {
      shade.destroy(); panel.destroy(); heading.destroy(); copy.destroy(); close.destroy();
      this.dismissInfo = undefined;
    };
    this.dismissInfo = dismiss;
    close.on('pointerdown', dismiss);
    shade.on('pointerdown', dismiss);
    close.on('pointerover', () => close.setStyle({ backgroundColor: '#ffe39a' }));
    close.on('pointerout', () => close.setStyle({ backgroundColor: '#f5c96a' }));
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
    if (this.reducedMotion) {
      t.setAlpha(1);
      this.time.delayedCall(1100, () => t.destroy());
      return;
    }
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
