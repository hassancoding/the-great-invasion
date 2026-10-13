import Phaser from 'phaser';

export type HeroId = 'arin' | 'kaela' | 'varkhul';

export const HEROES: {
  id: HeroId;
  name: string;
  title: string;
  color: number;
  blurb: string;
}[] = [
  {
    id: 'arin',
    name: 'Arin Solwright',
    title: 'Concord Blade',
    color: 0x38bdf8,
    blurb: 'Balanced swordplay. Dash. Claim the Well.',
  },
  {
    id: 'kaela',
    name: 'Kaela',
    title: 'Verdant Warden',
    color: 0x4ade80,
    blurb: 'Agile strikes. Forest-born resilience.',
  },
  {
    id: 'varkhul',
    name: 'Varkhul',
    title: 'Riftbound',
    color: 0xa78bfa,
    blurb: 'Heavy hits. Built for the surge.',
  },
];

/**
 * Hero select — three cards, confirm → Play.
 * Selection stored on registry + localStorage.
 */
export class HeroSelectScene extends Phaser.Scene {
  private selected: HeroId = 'arin';
  private cards: {
    id: HeroId;
    root: Phaser.GameObjects.Container;
    ring: Phaser.GameObjects.Graphics;
  }[] = [];
  private detailText!: Phaser.GameObjects.Text;

  constructor() {
    super('HeroSelect');
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor('#020617');
    this.cameras.main.fadeIn(350, 2, 6, 18);

    // Soft bg
    if (this.textures.exists('menu_bg')) {
      const bg = this.add.image(w / 2, h / 2, 'menu_bg').setDepth(0).setAlpha(0.55);
      const scale = Math.max(w / bg.width, h / bg.height) * 1.08;
      bg.setScale(scale);
    }
    const dim = this.add.graphics().setDepth(1);
    dim.fillStyle(0x020617, 0.55);
    dim.fillRect(0, 0, w, h);

    this.add
      .text(w / 2, 36, 'CHOOSE YOUR CHAMPION', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '22px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(w / 2, 64, 'Halcyon Spire awaits', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Three cards
    const cardW = 200;
    const gap = 28;
    const total = 3 * cardW + 2 * gap;
    const startX = (w - total) / 2 + cardW / 2;
    const cardY = h * 0.48;

    HEROES.forEach((hero, i) => {
      const x = startX + i * (cardW + gap);
      this.buildCard(hero, x, cardY, cardW);
    });

    this.detailText = this.add
      .text(w / 2, h * 0.78, '', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#bae6fd',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Restore prior selection
    const saved = (this.registry.get('hero') as HeroId) || this.loadSavedHero();
    this.selectHero(saved);

    // Confirm
    this.makeCta(w / 2, h * 0.88, 'ENTER THE RIFT', () => {
      this.registry.set('hero', this.selected);
      try {
        localStorage.setItem('tgi_hero', this.selected);
      } catch {
        /* ignore */
      }
      this.cameras.main.fadeOut(280, 2, 6, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Play', { hero: this.selected });
      });
    });

    // Back
    const back = this.add
      .text(24, 24, '← Back', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setDepth(12)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#e0f2fe'));
    back.on('pointerout', () => back.setColor('#94a3b8'));
    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 2, 6, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
    });
  }

  private loadSavedHero(): HeroId {
    try {
      const v = localStorage.getItem('tgi_hero');
      if (v === 'kaela' || v === 'varkhul' || v === 'arin') return v;
    } catch {
      /* ignore */
    }
    return 'arin';
  }

  private buildCard(
    hero: (typeof HEROES)[number],
    x: number,
    y: number,
    cardW: number
  ) {
    const root = this.add.container(x, y).setDepth(8);
    const cardH = 260;

    const bg = this.add.graphics();
    bg.fillStyle(0x0b1220, 0.92);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
    root.add(bg);

    const ring = this.add.graphics();
    root.add(ring);

    const key = `portrait_${hero.id}`;
    if (this.textures.exists(key)) {
      const img = this.add.image(0, -28, key);
      const maxW = cardW - 24;
      const maxH = 150;
      const s = Math.min(maxW / img.width, maxH / img.height);
      img.setScale(s);
      root.add(img);
    } else {
      const ph = this.add.circle(0, -36, 48, hero.color, 0.85);
      root.add(ph);
    }

    const name = this.add
      .text(0, 72, hero.name, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '15px',
        color: '#f0f9ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    root.add(name);

    const title = this.add
      .text(0, 94, hero.title, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    root.add(title);

    const hit = this.add
      .zone(0, 0, cardW, cardH)
      .setInteractive({ useHandCursor: true });
    root.add(hit);
    hit.on('pointerdown', () => this.selectHero(hero.id));
    hit.on('pointerover', () => {
      if (this.selected !== hero.id) this.drawRing(ring, cardW, cardH, hero.color, 0.45);
    });
    hit.on('pointerout', () => {
      if (this.selected !== hero.id) ring.clear();
      else this.drawRing(ring, cardW, cardH, hero.color, 1);
    });

    this.cards.push({ id: hero.id, root, ring });
    // store size on ring for redraw
    (ring as unknown as { _cw: number; _ch: number; _color: number })._cw = cardW;
    (ring as unknown as { _cw: number; _ch: number; _color: number })._ch = cardH;
    (ring as unknown as { _cw: number; _ch: number; _color: number })._color = hero.color;
  }

  private drawRing(
    g: Phaser.GameObjects.Graphics,
    cardW: number,
    cardH: number,
    color: number,
    alpha: number
  ) {
    g.clear();
    g.lineStyle(3, color, alpha);
    g.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
  }

  private selectHero(id: HeroId) {
    this.selected = id;
    const meta = HEROES.find((h) => h.id === id)!;
    this.detailText.setText(meta.blurb);
    for (const c of this.cards) {
      const metaC = HEROES.find((h) => h.id === c.id)!;
      const cw = (c.ring as unknown as { _cw: number })._cw;
      const ch = (c.ring as unknown as { _ch: number })._ch;
      if (c.id === id) {
        this.drawRing(c.ring, cw, ch, metaC.color, 1);
        c.root.setScale(1.05);
      } else {
        c.ring.clear();
        c.root.setScale(1);
      }
    }
  }

  private makeCta(x: number, y: number, label: string, onClick: () => void) {
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '17px',
        color: '#0f172a',
        fontStyle: 'bold',
        padding: { x: 36, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(12);

    const bw = text.width;
    const bh = text.height;
    const g = this.add.graphics().setDepth(11);
    const draw = (hover: boolean) => {
      g.clear();
      g.fillStyle(hover ? 0x7dd3fc : 0x38bdf8, 1);
      g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    };
    draw(false);

    const hit = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(13);
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', onClick);
  }
}
