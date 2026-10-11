import Phaser from 'phaser';
import { TILE, GAME_WIDTH, GAME_HEIGHT } from '../config';

export type EnvTheme = 'skybound' | 'verdant' | 'ashfall';

const THEME: Record<
  EnvTheme,
  { fog: number; haze: number; accent: number; ground: number; mid: number }
> = {
  skybound: {
    fog: 0x0c4a6e,
    haze: 0x38bdf8,
    accent: 0x7dd3fc,
    ground: 0x1e293b,
    mid: 0x334155,
  },
  verdant: {
    fog: 0x14532d,
    haze: 0x4ade80,
    accent: 0x86efac,
    ground: 0x14532d,
    mid: 0x166534,
  },
  ashfall: {
    fog: 0x7c2d12,
    haze: 0xfb923c,
    accent: 0xfdbA74,
    ground: 0x1c1917,
    mid: 0x431407,
  },
};

/** Multi-layer parallax world dressing — keeps arcade colliders separate. */
export function buildCinematicBackdrop(
  scene: Phaser.Scene,
  theme: EnvTheme,
  worldW: number,
  worldH: number
) {
  const t = THEME[theme];
  const camH = scene.scale.height;
  const camW = scene.scale.width;

  // Far sky already drawn by caller — add atmospheric bands
  const haze = scene.add.graphics().setScrollFactor(0).setDepth(-18);
  haze.fillStyle(t.haze, 0.08);
  haze.fillRect(0, 0, camW, camH * 0.45);
  haze.fillStyle(t.fog, 0.18);
  haze.fillRect(0, camH * 0.55, camW, camH * 0.45);

  // Distant cliffs / mountains (procedural silhouettes)
  const far = scene.add.graphics().setScrollFactor(0.08).setDepth(-16);
  far.fillStyle(t.mid, 0.55);
  drawMountainRange(far, worldW * 1.2, camH * 0.42, 7, 0.55);
  const mid = scene.add.graphics().setScrollFactor(0.22).setDepth(-14);
  mid.fillStyle(t.ground, 0.7);
  drawMountainRange(mid, worldW * 1.1, camH * 0.55, 9, 0.7);

  // Biome panel as soft mid-ground painting
  const biomeKey =
    theme === 'ashfall'
      ? 'art_obsidian'
      : theme === 'verdant'
        ? 'art_verdant'
        : 'art_skybound';
  if (scene.textures.exists(biomeKey)) {
    const b = scene.add
      .image(worldW * 0.35, worldH * 0.35, biomeKey)
      .setScrollFactor(0.28)
      .setAlpha(0.35)
      .setDepth(-12)
      .setScale(1.8);
    void b;
  }
  if (scene.textures.exists('art_islands')) {
    scene.add
      .image(worldW * 0.7, worldH * 0.22, 'art_islands')
      .setScrollFactor(0.18)
      .setAlpha(0.4)
      .setScale(0.85)
      .setDepth(-13);
    scene.add
      .image(worldW * 0.25, worldH * 0.28, 'art_islands')
      .setScrollFactor(0.15)
      .setAlpha(0.28)
      .setScale(0.55)
      .setFlipX(true)
      .setDepth(-13);
  }

  // Near fog strips for depth
  const nearFog = scene.add.graphics().setScrollFactor(0.55).setDepth(3);
  nearFog.fillStyle(t.fog, 0.12);
  for (let i = 0; i < 6; i++) {
    const fx = i * 220 + 40;
    nearFog.fillEllipse(fx, worldH - 20, 160, 28);
  }

  // Ambient motes
  spawnAmbientMotes(scene, theme, worldW, worldH);
}

function drawMountainRange(
  g: Phaser.GameObjects.Graphics,
  width: number,
  baseY: number,
  peaks: number,
  scale: number
) {
  g.beginPath();
  g.moveTo(0, baseY + 120);
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * width;
    const h = (40 + ((i * 37) % 90)) * scale;
    g.lineTo(x, baseY - h);
  }
  g.lineTo(width, baseY + 120);
  g.closePath();
  g.fillPath();
}

function spawnAmbientMotes(
  scene: Phaser.Scene,
  theme: EnvTheme,
  worldW: number,
  worldH: number
) {
  const color = THEME[theme].accent;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const x = Phaser.Math.Between(20, Math.max(40, worldW - 20));
    const y = Phaser.Math.Between(40, Math.max(60, worldH - 40));
    const r = Phaser.Math.FloatBetween(1.2, 2.8);
    const mote = scene.add.circle(x, y, r, color, Phaser.Math.FloatBetween(0.15, 0.4));
    mote.setScrollFactor(Phaser.Math.FloatBetween(0.3, 0.7)).setDepth(4);
    scene.tweens.add({
      targets: mote,
      y: y - Phaser.Math.Between(12, 40),
      x: x + Phaser.Math.Between(-20, 20),
      alpha: 0.05,
      duration: Phaser.Math.Between(2200, 4800),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: i * 90,
    });
  }
}

/** Dress platform tiles: edge highlights + occasional vegetation silhouettes */
export function dressPlatforms(
  scene: Phaser.Scene,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  theme: EnvTheme
) {
  const accent = THEME[theme].accent;
  platforms.getChildren().forEach((obj, i) => {
    const s = obj as Phaser.Physics.Arcade.Sprite;
    s.setDepth(2);
    // Soft top edge light
    if (i % 3 === 0) {
      const edge = scene.add
        .rectangle(s.x, s.y - TILE / 2 + 2, TILE * 0.9, 3, accent, 0.25)
        .setDepth(2.5);
      void edge;
    }
    // Occasional vine/grass tick
    if (theme !== 'ashfall' && i % 5 === 0) {
      const vine = scene.add
        .rectangle(s.x + 8, s.y + 6, 2, 10, 0x4ade80, 0.55)
        .setDepth(2.6);
      void vine;
    }
  });
}

/** Full-screen soft vignette for cinematic framing */
export function addVignette(scene: Phaser.Scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(90);
  // Approximate vignette with 4 edge gradients
  g.fillStyle(0x000000, 0.35);
  g.fillRect(0, 0, w, 28);
  g.fillRect(0, h - 36, w, 36);
  g.fillRect(0, 0, 36, h);
  g.fillRect(w - 36, 0, 36, h);
}

/** Impact burst at world position */
export function spawnImpactBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color = 0x67e8f9,
  count = 8
) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const dist = Phaser.Math.Between(12, 28);
    const p = scene.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.9).setDepth(30);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist,
      alpha: 0,
      scale: 0.2,
      duration: 220,
      onComplete: () => p.destroy(),
    });
  }
}

/** Slash arc graphic in facing direction */
export function spawnSlashArc(
  scene: Phaser.Scene,
  x: number,
  y: number,
  facing: 1 | -1,
  reach: number,
  heavy: boolean
) {
  const g = scene.add.graphics().setDepth(25);
  const col = heavy ? 0xe0f2fe : 0x67e8f9;
  g.lineStyle(heavy ? 5 : 3, col, 0.95);
  g.beginPath();
  const start = facing > 0 ? -0.9 : Math.PI - 0.9;
  const end = facing > 0 ? 0.9 : Math.PI + 0.9;
  g.arc(x + facing * 8, y - 6, reach * 0.75, start, end);
  g.strokePath();
  // energy trail
  g.lineStyle(2, 0xffffff, 0.35);
  g.beginPath();
  g.arc(x + facing * 10, y - 6, reach * 0.55, start * 0.8, end * 0.8);
  g.strokePath();
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: heavy ? 220 : 160,
    onComplete: () => g.destroy(),
  });
}
