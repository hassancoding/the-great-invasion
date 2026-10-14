import Phaser from 'phaser';
import type { SectorDef } from '../data/environments';

export interface BuiltEnvironment {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  groundY: number;
}

/**
 * Builds parallax sky, silhouette layers, fog, and themed platforms for a sector.
 */
export function buildEnvironment(
  scene: Phaser.Scene,
  sector: SectorDef
): BuiltEnvironment {
  const { width: sw, height: sh } = scene.scale;
  const worldW = sector.worldW;
  const worldH = sector.worldH;
  const groundY = worldH - 16;

  scene.physics.world.setBounds(0, 0, worldW, worldH);
  scene.cameras.main.setBounds(0, 0, worldW, worldH);
  scene.cameras.main.setBackgroundColor(sector.skyBot);

  if (scene.textures.exists(sector.skyKey)) {
    const sky = scene.add
      .image(sw / 2, sh / 2, sector.skyKey)
      .setScrollFactor(0)
      .setDepth(-20)
      .setAlpha(0.92);
    const s = Math.max(sw / sky.width, sh / sky.height) * 1.05;
    sky.setScale(s);
  } else {
    const g = scene.add.graphics().setScrollFactor(0).setDepth(-20);
    g.fillGradientStyle(sector.skyTop, sector.skyTop, sector.skyBot, sector.skyBot, 1);
    g.fillRect(0, 0, sw, sh);
  }

  const vignette = scene.add.graphics().setScrollFactor(0).setDepth(-19);
  vignette.fillStyle(sector.skyBot, 0.35);
  vignette.fillRect(0, 0, sw, sh * 0.18);
  vignette.fillStyle(sector.skyBot, 0.45);
  vignette.fillRect(0, sh * 0.75, sw, sh * 0.25);

  const hasHalcyonLayers = sector.id === 'halcyon' && scene.textures.exists('halcyon_far_islands');

  if (hasHalcyonLayers) {
    const addLayer = (key: string, scroll: number, depth: number, alpha = 1) => {
      scene.add.image(worldW / 2, worldH / 2, key)
        .setDisplaySize(worldW, worldH)
        .setScrollFactor(scroll, scroll)
        .setDepth(depth)
        .setAlpha(alpha);
    };
    if (scene.textures.exists('halcyon_sky')) addLayer('halcyon_sky', 0.02, -21, 0.98);
    addLayer('halcyon_far_islands', 0.12, -16, 0.88);
    addLayer('halcyon_distant_citadel', 0.24, -13, 0.94);
    addLayer('halcyon_midground_ruins', 0.43, -11, 0.92);
    addLayer('halcyon_foreground_crystals', 0.72, 8, 0.72);
  } else {
    drawSilhouetteBand(scene, {
      depth: -15,
      scroll: 0.15,
      color: sector.farTint,
      alpha: 0.35,
      baseY: worldH * 0.55,
      worldW,
      peaks: 7,
      amp: 90,
      seed: sector.id.charCodeAt(0),
    });

    drawSilhouetteBand(scene, {
      depth: -12,
      scroll: 0.35,
      color: sector.midTint,
      alpha: 0.5,
      baseY: worldH * 0.62,
      worldW,
      peaks: 11,
      amp: 70,
      seed: sector.id.charCodeAt(1) || 2,
    });
  }

  const motes = scene.add.graphics().setDepth(-8).setScrollFactor(0.6);
  for (let i = 0; i < 28; i++) {
    const mx = ((i * 97 + 13) % worldW) + (i % 5) * 17;
    const my = 40 + ((i * 53) % (worldH - 120));
    const r = 1 + (i % 3);
    motes.fillStyle(sector.fog, 0.15 + (i % 4) * 0.05);
    motes.fillCircle(mx, my, r);
  }

  const platforms = scene.physics.add.staticGroup();
  const tileKey = ensureSectorTile(scene, sector);

  for (let x = 16; x < worldW + 32; x += 32) {
    platforms.create(x, groundY, tileKey);
  }

  for (const p of sector.platforms) {
    for (let i = 0; i < p.tiles; i++) {
      platforms.create(p.x + i * 32, p.y, tileKey);
    }
  }

  for (let i = 0; i < sector.platforms.length; i += 2) {
    const p = sector.platforms[i];
    const cx = p.x + (p.tiles * 32) / 2;
    if (sector.id === 'halcyon' && scene.textures.exists('halcyon_crystal_cluster')) {
      scene.add.image(cx, p.y - 20, 'halcyon_crystal_cluster')
        .setDisplaySize(38, 42)
        .setDepth(5);
    } else {
      const crystal = scene.add.graphics().setDepth(5);
      crystal.fillStyle(sector.accent, 0.85);
      crystal.fillTriangle(cx, p.y - 28, cx - 6, p.y - 8, cx + 6, p.y - 8);
      crystal.fillStyle(sector.fog, 0.35);
      crystal.fillCircle(cx, p.y - 22, 10);
    }
  }

  if (sector.id === 'halcyon' && scene.textures.exists('halcyon_ancient_arch')) {
    scene.add.image(1760, groundY - 88, 'halcyon_ancient_arch')
      .setDisplaySize(92, 112)
      .setDepth(4)
      .setAlpha(0.82);
  }

  const label = scene.add
    .text(sw / 2, 48, sector.name.toUpperCase(), {
      fontFamily: 'system-ui,sans-serif',
      fontSize: '20px',
      color: '#f0f9ff',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(90)
    .setAlpha(0);
  const sub = scene.add
    .text(sw / 2, 72, sector.tagline, {
      fontFamily: 'system-ui,sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(90)
    .setAlpha(0);

  scene.tweens.add({
    targets: [label, sub],
    alpha: 1,
    duration: 600,
    ease: 'Sine.easeOut',
    hold: 1800,
    yoyo: true,
    onComplete: () => {
      label.destroy();
      sub.destroy();
    },
  });

  return { platforms, groundY };
}

function drawSilhouetteBand(
  scene: Phaser.Scene,
  opts: {
    depth: number;
    scroll: number;
    color: number;
    alpha: number;
    baseY: number;
    worldW: number;
    peaks: number;
    amp: number;
    seed: number;
  }
) {
  const g = scene.add.graphics().setDepth(opts.depth).setScrollFactor(opts.scroll, 1);
  g.fillStyle(opts.color, opts.alpha);
  g.beginPath();
  g.moveTo(0, opts.baseY + opts.amp);
  const step = opts.worldW / opts.peaks;
  for (let i = 0; i <= opts.peaks; i++) {
    const x = i * step;
    const n =
      Math.sin(i * 1.7 + opts.seed) * 0.5 + Math.sin(i * 0.4 + opts.seed * 0.3) * 0.5;
    const y = opts.baseY - n * opts.amp;
    g.lineTo(x, y);
  }
  g.lineTo(opts.worldW, opts.baseY + opts.amp + 80);
  g.lineTo(0, opts.baseY + opts.amp + 80);
  g.closePath();
  g.fillPath();
}

function ensureSectorTile(scene: Phaser.Scene, sector: SectorDef): string {
  const key = `tile_${sector.id}`;
  if (scene.textures.exists(key)) return key;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(sector.ground, 1);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(sector.groundTop, 1);
  g.fillRect(0, 0, 32, 6);
  g.fillStyle(sector.accent, 0.55);
  g.fillRect(0, 5, 32, 2);
  g.lineStyle(1, 0x000000, 0.25);
  g.lineBetween(8, 10, 10, 28);
  g.lineBetween(22, 8, 20, 30);
  g.generateTexture(key, 32, 32);
  g.destroy();
  return key;
}

/** Procedural hero body textures for Kaela / Varkhul. */
export function ensureHeroTextures(scene: Phaser.Scene) {
  makeHeroTexture(scene, 'hero_kaela', 0x4ade80, 0x166534, 0x86efac);
  makeHeroTexture(scene, 'hero_varkhul', 0xa78bfa, 0x4c1d95, 0xc4b5fd);
  makeHeroTexture(scene, 'hero_arin_fb', 0x38bdf8, 0x0c4a6e, 0x7dd3fc);
}

function makeHeroTexture(
  scene: Phaser.Scene,
  key: string,
  primary: number,
  dark: number,
  light: number
) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = 48;
  const h = 64;
  g.fillStyle(dark, 1);
  g.fillRoundedRect(10, 52, 12, 12, 2);
  g.fillRoundedRect(26, 52, 12, 12, 2);
  g.fillStyle(primary, 1);
  g.fillRect(14, 36, 8, 18);
  g.fillRect(26, 36, 8, 18);
  g.fillStyle(primary, 1);
  g.fillRoundedRect(12, 18, 24, 22, 4);
  g.fillStyle(dark, 1);
  g.fillCircle(12, 22, 7);
  g.fillCircle(36, 22, 7);
  g.fillStyle(light, 1);
  g.fillCircle(24, 12, 10);
  g.fillStyle(primary, 1);
  g.fillTriangle(24, 0, 18, 10, 30, 10);
  g.generateTexture(key, w, h);
  g.destroy();
}
