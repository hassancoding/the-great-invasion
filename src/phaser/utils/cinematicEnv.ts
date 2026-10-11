import Phaser from 'phaser';
import { TILE } from '../config';

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
    accent: 0xfdba74,
    ground: 0x1c1917,
    mid: 0x431407,
  },
};

/**
 * Parallax environment layers.
 * Uses generated env_* textures (ruins, cliffs, vegetation) — never concept sheets.
 */
export function buildCinematicBackdrop(
  scene: Phaser.Scene,
  theme: EnvTheme,
  worldW: number,
  worldH: number
) {
  const t = THEME[theme];
  const camH = scene.scale.height;
  const camW = scene.scale.width;

  const farKey = `env_far_${theme}`;
  const midKey = `env_mid_${theme}`;

  // Far painted sky + ruins (screen-space parallax)
  if (scene.textures.exists(farKey)) {
    scene.add
      .image(0, 0, farKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDisplaySize(camW, camH)
      .setDepth(-20);
  }

  // Soft haze overlay
  const haze = scene.add.graphics().setScrollFactor(0).setDepth(-18);
  haze.fillStyle(t.haze, 0.06);
  haze.fillRect(0, 0, camW, camH * 0.35);

  // Mid cliffs / overgrown ruins — world scroll slow
  if (scene.textures.exists(midKey)) {
    const tiles = Math.ceil(worldW / 960) + 1;
    for (let i = 0; i < tiles; i++) {
      scene.add
        .image(i * 960, worldH * 0.15, midKey)
        .setOrigin(0, 0)
        .setScrollFactor(0.25)
        .setAlpha(0.9)
        .setDepth(-14)
        .setDisplaySize(960, Math.min(400, worldH * 0.7));
    }
  } else {
    // Fallback silhouettes
    const mid = scene.add.graphics().setScrollFactor(0.22).setDepth(-14);
    mid.fillStyle(t.ground, 0.65);
    mid.fillRect(0, camH * 0.45, camW * 2, camH * 0.3);
  }

  // Near fog
  const nearFog = scene.add.graphics().setScrollFactor(0.5).setDepth(3);
  nearFog.fillStyle(t.fog, 0.1);
  for (let i = 0; i < Math.ceil(worldW / 200) + 2; i++) {
    nearFog.fillEllipse(i * 200 + 40, worldH - 16, 140, 24);
  }

  spawnAmbientMotes(scene, theme, worldW, worldH);
}

function spawnAmbientMotes(
  scene: Phaser.Scene,
  theme: EnvTheme,
  worldW: number,
  worldH: number
) {
  const color = THEME[theme].accent;
  for (let i = 0; i < 14; i++) {
    const x = Phaser.Math.Between(20, Math.max(40, worldW - 20));
    const y = Phaser.Math.Between(40, Math.max(60, worldH - 40));
    const r = Phaser.Math.FloatBetween(1.2, 2.6);
    const mote = scene.add.circle(x, y, r, color, Phaser.Math.FloatBetween(0.12, 0.35));
    mote.setScrollFactor(Phaser.Math.FloatBetween(0.3, 0.65)).setDepth(4);
    scene.tweens.add({
      targets: mote,
      y: y - Phaser.Math.Between(10, 36),
      x: x + Phaser.Math.Between(-16, 16),
      alpha: 0.04,
      duration: Phaser.Math.Between(2400, 5000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: i * 100,
    });
  }
}

/** Platform polish: optional ground-strip overlay edge */
export function dressPlatforms(
  scene: Phaser.Scene,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  theme: EnvTheme
) {
  const groundKey = `env_ground_${theme}`;
  const accent = THEME[theme].accent;
  platforms.getChildren().forEach((obj, i) => {
    const s = obj as Phaser.Physics.Arcade.Sprite;
    s.setDepth(2);
    // Prefer painted ground strip if available (visual only on top row look)
    if (scene.textures.exists(groundKey) && i % 2 === 0) {
      // subtle edge highlight only — avoid covering whole collider art
      scene.add
        .rectangle(s.x, s.y - TILE / 2 + 2, TILE * 0.9, 3, accent, 0.28)
        .setDepth(2.5);
    } else if (i % 4 === 0) {
      scene.add
        .rectangle(s.x, s.y - TILE / 2 + 2, TILE * 0.85, 2, accent, 0.22)
        .setDepth(2.5);
    }
  });
}

export function addVignette(scene: Phaser.Scene) {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(90);
  g.fillStyle(0x000000, 0.28);
  g.fillRect(0, 0, w, 22);
  g.fillRect(0, h - 30, w, 30);
  g.fillRect(0, 0, 28, h);
  g.fillRect(w - 28, 0, 28, h);
}

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
