import Phaser from 'phaser';
import type { PlatformSpec, SectorDef } from '../data/environments';

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

  const themedSkyKey = sector.id === 'halcyon' && scene.textures.exists('halcyon_custom_sky') ? 'halcyon_custom_sky' : sector.id === 'halcyon' ? 'halcyon_sky' : sector.id === 'ashfall' ? 'ashfall_sky' : sector.id === 'ruins' ? 'ruins_sky' : sector.id === 'trade-isles' ? 'trade_isles_sky' : sector.id === 'heart-of-rift' ? 'heart_rift_sky' : '';
  if (themedSkyKey && scene.textures.exists(themedSkyKey)) {
    scene.add.image(worldW / 2, worldH / 2, themedSkyKey)
      .setDisplaySize(worldW, worldH)
      .setScrollFactor(1, 1)
      .setDepth(-22);
  } else if (scene.textures.exists(sector.skyKey)) {
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

  const themedLayers: Record<string, { far: string; mid: string; foreground: string; architecture?: string }> = {
    halcyon: { far: 'halcyon_far_islands', architecture: 'halcyon_distant_citadel', mid: 'halcyon_midground_ruins', foreground: 'halcyon_foreground_crystals' },
    ashfall: { far: 'ashfall_far', mid: 'ashfall_mid', foreground: 'ashfall_foreground' },
    ruins: { far: 'ruins_far', mid: 'ruins_mid', foreground: 'ruins_foreground' },
    'trade-isles': { far: 'trade_isles_far', mid: 'trade_isles_mid', foreground: 'trade_isles_foreground' },
    'heart-of-rift': { far: 'heart_rift_far', mid: 'heart_rift_mid', foreground: 'heart_rift_foreground' },
  };
  const layerKeys = themedLayers[sector.id];
  if (layerKeys && scene.textures.exists(layerKeys.far)) {
    const addLayer = (key: string, scroll: number, depth: number, alpha = 1, preserveAspect = false) => {
      const image = scene.add.image(worldW / 2, worldH / 2, key);
      if (preserveAspect) image.setDisplaySize(worldW, worldW * image.height / image.width);
      else image.setDisplaySize(worldW, worldH);
      image.setScrollFactor(scroll, scroll).setDepth(depth).setAlpha(alpha);
    };
    addLayer(layerKeys.far, 0.12, -16, 0.9);
    if (layerKeys.architecture && scene.textures.exists(layerKeys.architecture)) {
      addLayer(layerKeys.architecture, 0.24, -13, 0.94, sector.id === 'halcyon');
    }
    if (scene.textures.exists(layerKeys.mid)) addLayer(layerKeys.mid, 0.42, -11, 0.95);
    if (scene.textures.exists(layerKeys.foreground)) addLayer(layerKeys.foreground, 0.72, 8, 0.55);
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

  if (sector.id === 'halcyon') {
    composeHalcyonSky(scene, worldW, worldH);
  }

  const motes = scene.add.graphics().setDepth(-8).setScrollFactor(0.6);
  for (let i = 0; i < 28; i++) {
    const mx = ((i * 97 + 13) % worldW) + (i % 5) * 17;
    const my = 40 + ((i * 53) % (worldH - 120));
    const r = 1 + (i % 3);
    motes.fillStyle(sector.fog, 0.15 + (i % 4) * 0.05);
    motes.fillCircle(mx, my, r);
  }

  // Halcyon wind motes drift at different depths to keep the skyline alive.
  if (sector.id === 'halcyon') {
    for (let i = 0; i < 22; i++) {
      const x = 80 + ((i * 173) % (worldW - 160));
      const y = 70 + ((i * 67) % 310);
      const mote = scene.add.circle(x, y, i % 6 === 0 ? 2.4 : 1.3, i % 4 === 0 ? 0xfde68a : 0x9be7ff, 0.25 + (i % 4) * 0.1).setDepth(-6).setScrollFactor(0.35 + (i % 3) * 0.12);
      scene.tweens.add({ targets: mote, x: x + 25 + (i % 5) * 8, y: y - 18 - (i % 4) * 9, alpha: { from: 0.12, to: 0.6 }, duration: 2600 + (i * 149) % 2600, yoyo: true, repeat: -1, delay: i * 85, ease: 'Sine.easeInOut' });
    }
  }

  const platforms = scene.physics.add.staticGroup();
  const tileKey = ensureSectorTile(scene, sector);
  const halcyonArtReady = sector.id === 'halcyon' && scene.textures.exists('halcyon_platform_top');

  for (let x = 16; x < worldW + 32; x += 32) {
    const tile = platforms.create(x, groundY, tileKey);
    if (halcyonArtReady) tile.setAlpha(0);
  }
  if (halcyonArtReady) addHalcyonGround(scene, worldW, groundY);

  sector.platforms.forEach((p, index) => {
    for (let i = 0; i < p.tiles; i++) {
      const tile = platforms.create(p.x + i * 32, p.y, tileKey);
      if (halcyonArtReady) tile.setAlpha(0);
    }

    if (halcyonArtReady) {
      addHalcyonLedge(scene, p, index);
      return;
    }

    const platformKey =
      sector.id === 'ashfall' ? 'ashfall_platform' :
      sector.id === 'ruins' ? 'ruins_platform' :
      sector.id === 'trade-isles' ? 'trade_isles_platform' :
      sector.id === 'heart-of-rift' ? 'heart_rift_platform' : '';
    const pngPlatforms = ['png_platform_a', 'png_platform_b', 'png_platform_c', 'png_platform_d'];
    const pngKey = sector.id === 'halcyon' ? pngPlatforms[index % pngPlatforms.length] : '';
    if (pngKey && scene.textures.exists(pngKey)) {
      const img = scene.add.image(p.x + (p.tiles * 32) / 2, p.y + 6, pngKey)
        .setDepth(2)
        .setOrigin(0.5, 0.15);
      const targetW = Math.max(p.tiles * 32, 80);
      img.setScale(targetW / Math.max(img.width, 1));
    } else if (platformKey && scene.textures.exists(platformKey)) {
      scene.add.image(p.x + (p.tiles * 32) / 2, p.y + 4, platformKey)
        .setDisplaySize(p.tiles * 32, 48)
        .setDepth(2);
    }
  });

  for (let i = 0; i < sector.platforms.length; i += 2) {
    const p = sector.platforms[i];
    const cx = p.x + (p.tiles * 32) / 2;
    const crystalKey = sector.id === 'halcyon' ? 'halcyon_crystal_cluster' : sector.id === 'ashfall' ? 'ashfall_energy_cluster' : sector.id === 'ruins' ? 'ruins_energy_cluster' : sector.id === 'trade-isles' ? 'trade_isles_energy_cluster' : sector.id === 'heart-of-rift' ? 'heart_rift_energy_cluster' : '';
    if (crystalKey && scene.textures.exists(crystalKey)) {
      const crystal = scene.add.image(cx, p.y - 20, crystalKey).setDepth(5);
      if (sector.id === 'halcyon') crystal.setScale(Math.min(38 / crystal.width, 42 / crystal.height));
      else crystal.setDisplaySize(38, 42);
      scene.tweens.add({ targets: crystal, y: crystal.y - 5, angle: { from: -3, to: 3 }, alpha: { from: 0.82, to: 1 }, duration: 1700 + (i * 137) % 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const aura = scene.add.circle(cx, p.y - 14, 17, sector.accent, 0.12).setDepth(4);
      scene.tweens.add({ targets: aura, scaleX: { from: 0.75, to: 1.35 }, scaleY: { from: 0.75, to: 1.35 }, alpha: { from: 0.06, to: 0.22 }, duration: 1900 + (i * 113) % 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      const crystal = scene.add.graphics().setDepth(5);
      crystal.fillStyle(sector.accent, 0.85);
      crystal.fillTriangle(cx, p.y - 28, cx - 6, p.y - 8, cx + 6, p.y - 8);
      crystal.fillStyle(sector.fog, 0.35);
      crystal.fillCircle(cx, p.y - 22, 10);
    }
  }

  if (sector.id === 'halcyon') {
    composeHalcyonForeground(scene, worldW, groundY);
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


/** Far sky + citadel + floating islands (parallax, no collision). */
function composeHalcyonSky(scene: Phaser.Scene, worldW: number, worldH: number) {
  // Prefer painted citadel sky when available for the target floating-kingdom look.
  if (scene.textures.exists('sky_citadel')) {
    const sky = scene.add.image(worldW * 0.45, worldH * 0.42, 'sky_citadel').setDepth(-21).setScrollFactor(0.08, 0.12).setAlpha(0.88);
    const scale = Math.max(worldW / sky.width, worldH / sky.height) * 0.55;
    sky.setScale(scale);
  }

  if (scene.textures.exists('halcyon_fortress_skyline')) {
    scene.add
      .image(worldW * 0.62, worldH * 0.28, 'halcyon_fortress_skyline')
      .setOrigin(0.5, 1)
      .setScale(0.42)
      .setScrollFactor(0.18, 0.22)
      .setDepth(-16)
      .setAlpha(0.92);
  }
  if (scene.textures.exists('halcyon_fortress_skyline_layer')) {
    scene.add
      .image(worldW * 0.7, worldH * 0.34, 'halcyon_fortress_skyline_layer')
      .setOrigin(0.5, 1)
      .setScale(0.38)
      .setScrollFactor(0.22, 0.26)
      .setDepth(-15)
      .setAlpha(0.75);
  }

  // Soft aether-sea band (no dedicated water asset yet)
  const sea = scene.add.graphics().setDepth(-10).setScrollFactor(0.35, 0.4);
  sea.fillGradientStyle(0x0c4a6e, 0.0, 0x0ea5e9, 0.22, 0x38bdf8, 0.18, 0x0c4a6e, 0.0);
  sea.fillRect(0, worldH * 0.55, worldW, worldH * 0.35);

  const placeIsland = (key: string, x: number, y: number, scale: number, scroll: number, depth: number, alpha = 0.95) => {
    if (!scene.textures.exists(key)) return;
    scene.add.image(x, y, key).setOrigin(0.5, 1).setScale(scale).setScrollFactor(scroll, scroll * 0.9).setDepth(depth).setAlpha(alpha);
  };

  placeIsland('halcyon_island_c', worldW * 0.18, worldH * 0.38, 0.22, 0.2, -14);
  placeIsland('halcyon_island_a', worldW * 0.38, worldH * 0.32, 0.18, 0.24, -13, 0.9);
  placeIsland('halcyon_island_d', worldW * 0.82, worldH * 0.4, 0.2, 0.28, -12);
  placeIsland('halcyon_island_b', worldW * 0.55, worldH * 0.48, 0.16, 0.32, -11);
  placeIsland('halcyon_island_f', worldW * 0.28, worldH * 0.5, 0.2, 0.34, -11, 0.85);
  placeIsland('halcyon_fortress_bridge', worldW * 0.48, worldH * 0.36, 0.28, 0.3, -12, 0.8);
  placeIsland('halcyon_fortress_cloud', worldW * 0.75, worldH * 0.22, 0.45, 0.15, -17, 0.55);

  // Horizon haze
  const haze = scene.add.graphics().setDepth(-9).setScrollFactor(0.3, 0.35);
  haze.fillStyle(0x7dd3fc, 0.08);
  haze.fillRect(0, worldH * 0.4, worldW, worldH * 0.2);
}

/** Near-ground trees, arches, plants, crystals — framing the play space. */
function composeHalcyonForeground(scene: Phaser.Scene, worldW: number, groundY: number) {
  const tree = (key: string, x: number, scale: number) => {
    if (!scene.textures.exists(key)) return;
    scene.add.image(x, groundY - 4, key).setOrigin(0.5, 1).setScale(scale).setDepth(3).setScrollFactor(1);
  };
  tree('png_tree_a', 140, 0.2);
  tree('png_tree_b', worldW - 160, 0.18);
  tree('png_tree_c', 620, 0.16);
  tree('png_tree_a', 1480, 0.17);

  if (scene.textures.exists('png_arch_a')) {
    scene.add.image(980, groundY - 6, 'png_arch_a').setOrigin(0.5, 1).setScale(0.32).setDepth(4);
  }
  if (scene.textures.exists('halcyon_fortress_arch')) {
    scene.add.image(1760, groundY - 8, 'halcyon_fortress_arch').setOrigin(0.5, 1).setScale(0.28).setDepth(4).setAlpha(0.95);
  } else if (scene.textures.exists('halcyon_ancient_arch_prop')) {
    scene.add.image(1760, groundY - 82, 'halcyon_ancient_arch_prop').setDisplaySize(96, 104).setDepth(4).setAlpha(0.94);
  }

  // Edge plants on ground
  const plantKeys = ['png_plant_a', 'png_plant_b', 'png_plant_c'];
  for (let i = 0; i < 14; i++) {
    const key = plantKeys[i % plantKeys.length];
    if (!scene.textures.exists(key)) continue;
    const x = 80 + i * 165 + (i % 3) * 20;
    scene.add.image(x, groundY - 2, key).setOrigin(0.5, 1).setScale(0.55 + (i % 3) * 0.08).setDepth(5);
  }

  // Blue crystals along route
  const crystalKeys = ['halcyon_fortress_crystal', 'png_crystal_a', 'png_crystal_b', 'halcyon_sky_crystal_prop'];
  const crystalXs = [350, 720, 1100, 1460, 1880, 2150];
  crystalXs.forEach((x, i) => {
    const key = crystalKeys[i % crystalKeys.length];
    if (!scene.textures.exists(key)) return;
    const c = scene.add.image(x, groundY - 14, key).setOrigin(0.5, 1).setDepth(5);
    if (key.startsWith('png_') || key === 'halcyon_fortress_crystal') c.setScale(0.22 + (i % 3) * 0.04);
    else c.setDisplaySize(28, 42);
    scene.tweens.add({
      targets: c,
      y: c.y - 5,
      angle: { from: -3, to: 3 },
      duration: 1500 + i * 160,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });
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

function addHalcyonGround(scene: Phaser.Scene, worldW: number, groundY: number) {
  for (let x = 128; x < worldW + 128; x += 256) {
    if (scene.textures.exists('halcyon_platform_middle')) {
      scene.add.image(x, groundY + 50, 'halcyon_platform_middle')
        .setDisplaySize(256, 80)
        .setDepth(1);
    }
    scene.add.image(x, groundY + 4, 'halcyon_platform_top')
      .setDisplaySize(256, 48)
      .setDepth(2);
  }
}

function addHalcyonLedge(scene: Phaser.Scene, platform: PlatformSpec, index: number) {
  const width = platform.tiles * 32;
  const centerX = platform.x + width / 2;

  if (index % 2 === 0 && scene.textures.exists('halcyon_cliff_face')) {
    scene.add.image(centerX, platform.y + 92, 'halcyon_cliff_face')
      .setDisplaySize(width, 144)
      .setDepth(1);
  }
  if (scene.textures.exists('halcyon_platform_middle')) {
    scene.add.image(centerX, platform.y + 48, 'halcyon_platform_middle')
      .setDisplaySize(width, 48)
      .setDepth(2);
  }
  scene.add.image(centerX, platform.y + 4, 'halcyon_platform_top')
    .setDisplaySize(width, 48)
    .setDepth(3);

  const edgeWidth = Math.min(58, width / 2);
  if (scene.textures.exists('halcyon_platform_edge_left')) {
    scene.add.image(platform.x + edgeWidth / 2, platform.y + 4, 'halcyon_platform_edge_left')
      .setDisplaySize(edgeWidth, 48)
      .setDepth(4);
  }
  if (scene.textures.exists('halcyon_platform_edge_right')) {
    scene.add.image(platform.x + width - edgeWidth / 2, platform.y + 4, 'halcyon_platform_edge_right')
      .setDisplaySize(edgeWidth, 48)
      .setDepth(4);
  }
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
