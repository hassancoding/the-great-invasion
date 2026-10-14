import Phaser from 'phaser';
import { ensureHeroTextures } from '../systems/envBuilder';
import { ARIN_ATLAS_JSON } from '../assets/arinAtlasJson';

/** Boot — preload menu + skies + Arin production atlas, enter Menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor('#020617');
    this.add.rectangle(w / 2, h / 2, 260, 14, 0x1e293b).setOrigin(0.5);
    const bar = this.add.rectangle(w / 2 - 128, h / 2, 4, 10, 0x38bdf8).setOrigin(0, 0.5);
    this.add
      .text(w / 2, h / 2 - 40, 'THE GREAT INVASION', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '22px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, h / 2 + 32, 'Loading…', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.width = Math.max(4, 256 * v);
    });

    this.load.image('menu_bg', 'assets/menu/bg.jpg');
    this.load.image('sky_vista', 'assets/env/sky_vista.jpg');
    this.load.image('sky_citadel', 'assets/env/sky_citadel.jpg');
    this.load.image('sky_ruins', 'assets/env/sky_ruins.jpg');

    // Newly added standalone Halcyon assets (Sector I pack)
    this.load.svg('halcyon_custom_sky', 'assets/env/halcyon/backgrounds/halcyon-sky.svg', { width: 1920, height: 1080 });
    this.load.svg('halcyon_arin_idle_prop', 'assets/env/halcyon/sprites/arin-idle.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_graveling_sprite', 'assets/env/halcyon/sprites/graveling.svg', { width: 192, height: 192 });
    this.load.svg('halcyon_aether_well_prop', 'assets/env/halcyon/props/aether-well.svg', { width: 320, height: 320 });
    this.load.svg('halcyon_ancient_arch_prop', 'assets/env/halcyon/props/ancient-arch.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_sky_crystal_prop', 'assets/env/halcyon/props/sky-crystal.svg', { width: 160, height: 192 });
    this.load.svg('halcyon_orun_boss_sprite', 'assets/env/halcyon/sprites/orun-boss.svg', { width: 384, height: 384 });
    this.load.svg('halcyon_platform_tile_prop', 'assets/env/halcyon/props/platform-tile.svg', { width: 256, height: 96 });
    this.load.svg('halcyon_spike_trap_prop', 'assets/env/halcyon/props/spike-trap.svg', { width: 256, height: 96 });
    this.load.svg('halcyon_rift_burst_effect', 'assets/env/halcyon/effects/rift-burst.svg', { width: 256, height: 256 });

    // Halcyon Spire layered vector environment pack (standalone assets)
    this.load.svg('halcyon_sky', 'assets/env/halcyon/sky.svg', { width: 2400, height: 540 });
    this.load.svg('halcyon_far_islands', 'assets/env/halcyon/far-islands.svg', { width: 2400, height: 540 });
    this.load.svg('halcyon_distant_citadel', 'assets/env/halcyon/distant-citadel.svg', { width: 2400, height: 540 });
    this.load.svg('halcyon_midground_ruins', 'assets/env/halcyon/midground-ruins.svg', { width: 2400, height: 540 });
    this.load.svg('halcyon_foreground_crystals', 'assets/env/halcyon/foreground-crystals.svg', { width: 2400, height: 540 });
    this.load.svg('halcyon_platform_top', 'assets/env/halcyon/platform-top.svg', { width: 256, height: 96 });
    this.load.svg('halcyon_platform_middle', 'assets/env/halcyon/platform-middle.svg', { width: 256, height: 96 });
    this.load.svg('halcyon_platform_edge_left', 'assets/env/halcyon/platform-edge-left.svg', { width: 128, height: 96 });
    this.load.svg('halcyon_platform_edge_right', 'assets/env/halcyon/platform-edge-right.svg', { width: 128, height: 96 });
    this.load.svg('halcyon_cliff_face', 'assets/env/halcyon/cliff-face.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_crystal_cluster', 'assets/env/halcyon/crystal-cluster.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_ancient_arch', 'assets/env/halcyon/ancient-arch.svg', { width: 320, height: 384 });
    this.load.svg('halcyon_aether_well', 'assets/env/halcyon/aether-well.svg', { width: 320, height: 320 });

    // Additional standalone layers for the existing Ashfall Reach and Shattered Ruins sectors.
    this.load.svg('ashfall_sky', 'assets/env/ashfall/sky.svg', { width: 2400, height: 540 });
    this.load.svg('ashfall_far', 'assets/env/ashfall/far-landscape.svg', { width: 2400, height: 540 });
    this.load.svg('ashfall_mid', 'assets/env/ashfall/midground-structures.svg', { width: 2400, height: 540 });
    this.load.svg('ashfall_foreground', 'assets/env/ashfall/foreground-effects.svg', { width: 2400, height: 540 });
    this.load.svg('ashfall_platform', 'assets/env/ashfall/platform.svg', { width: 256, height: 96 });
    this.load.svg('ashfall_energy_cluster', 'assets/env/ashfall/energy-cluster.svg', { width: 256, height: 256 });
    this.load.svg('ruins_sky', 'assets/env/ruins/sky.svg', { width: 2400, height: 540 });
    this.load.svg('ruins_far', 'assets/env/ruins/far-landscape.svg', { width: 2400, height: 540 });
    this.load.svg('ruins_mid', 'assets/env/ruins/midground-structures.svg', { width: 2400, height: 540 });
    this.load.svg('ruins_foreground', 'assets/env/ruins/foreground-effects.svg', { width: 2400, height: 540 });
    this.load.svg('ruins_platform', 'assets/env/ruins/platform.svg', { width: 256, height: 96 });
    this.load.svg('ruins_energy_cluster', 'assets/env/ruins/energy-cluster.svg', { width: 256, height: 256 });
    this.load.svg('trade_isles_sky', 'assets/env/trade-isles/sky.svg', { width: 2400, height: 540 });
    this.load.svg('trade_isles_far', 'assets/env/trade-isles/far-landscape.svg', { width: 2400, height: 540 });
    this.load.svg('trade_isles_mid', 'assets/env/trade-isles/midground-structures.svg', { width: 2400, height: 540 });
    this.load.svg('trade_isles_foreground', 'assets/env/trade-isles/foreground-effects.svg', { width: 2400, height: 540 });
    this.load.svg('trade_isles_platform', 'assets/env/trade-isles/platform.svg', { width: 256, height: 96 });
    this.load.svg('trade_isles_energy_cluster', 'assets/env/trade-isles/energy-cluster.svg', { width: 256, height: 256 });
    this.load.svg('heart_rift_sky', 'assets/env/heart-of-rift/sky.svg', { width: 2400, height: 540 });
    this.load.svg('heart_rift_far', 'assets/env/heart-of-rift/far-landscape.svg', { width: 2400, height: 540 });
    this.load.svg('heart_rift_mid', 'assets/env/heart-of-rift/midground-structures.svg', { width: 2400, height: 540 });
    this.load.svg('heart_rift_foreground', 'assets/env/heart-of-rift/foreground-effects.svg', { width: 2400, height: 540 });
    this.load.svg('heart_rift_platform', 'assets/env/heart-of-rift/platform.svg', { width: 256, height: 96 });
    this.load.svg('heart_rift_energy_cluster', 'assets/env/heart-of-rift/energy-cluster.svg', { width: 256, height: 256 });
    this.load.svg('shared_bounce_pad', 'assets/env/shared/bounce-pad.svg', { width: 192, height: 96 });
    this.load.svg('shared_spike_hazard', 'assets/env/shared/spike-hazard.svg', { width: 256, height: 96 });
    this.load.svg('shared_rift_gate', 'assets/env/shared/rift-gate.svg', { width: 256, height: 384 });
    this.load.svg('shared_energy_burst', 'assets/env/shared/energy-burst.svg', { width: 256, height: 256 });
    this.load.image('menu_hero', 'assets/menu/hero.png');
    this.load.image('portrait_arin', 'assets/sprites/arin/arin_portrait.png');

    // Production Arin atlas (cropped from provided sheets)
    this.load.image('arin_sheet', 'assets/sprites/arin/arin_sprites.png');
  }

  create() {
    if (this.textures.exists('arin_sheet') && !this.textures.exists('arin')) {
      const src = this.textures.get('arin_sheet').getSourceImage() as HTMLImageElement;
      this.textures.addAtlas('arin', src, ARIN_ATLAS_JSON as unknown as object);
    }

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    if (!this.textures.exists('tile')) {
      g.fillStyle(0x64748b, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x8bc34a, 0.85);
      g.fillRect(0, 0, 32, 5);
      g.generateTexture('tile', 32, 32);
    }
    if (!this.textures.exists('player')) {
      g.clear();
      g.fillStyle(0x38bdf8, 1);
      g.fillCircle(16, 22, 12);
      g.fillStyle(0xe0f2fe, 1);
      g.fillCircle(16, 12, 9);
      g.generateTexture('player', 32, 40);
    }
    if (!this.textures.exists('enemy')) {
      g.clear();
      g.fillStyle(0x7c3aed, 1);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0xc4b5fd, 0.9);
      g.fillCircle(16, 12, 6);
      g.generateTexture('enemy', 32, 32);
    }
    g.destroy();

    ensureHeroTextures(this);

    if (this.textures.exists('arin')) {
      const mk = (key: string, frames: string[], rate: number, repeat: number) => {
        if (this.anims.exists(key)) this.anims.remove(key);
        const valid = frames.filter((f) => this.textures.get('arin').has(f));
        if (!valid.length) return;
        this.anims.create({
          key,
          frames: valid.map((f) => ({ key: 'arin', frame: f })),
          frameRate: rate,
          repeat,
        });
      };

      // Idle: first 8 front/standing variations (smooth loop)
      mk(
        'arin_idle',
        Array.from({ length: 8 }, (_, i) => `arin_idle_${i}`),
        4,
        -1,
      );

      // Run: full 24-frame cycle
      mk(
        'arin_run',
        Array.from({ length: 24 }, (_, i) => `arin_run_${i}`),
        14,
        -1,
      );

      // Jump: ascending + peak + fall (use first ~12 of jump sheet)
      mk(
        'arin_jump',
        Array.from({ length: 12 }, (_, i) => `arin_jump_${i}`),
        12,
        0,
      );

      // Landing / recover (remaining jump frames)
      mk(
        'arin_land',
        Array.from({ length: 10 }, (_, i) => `arin_jump_${12 + i}`),
        10,
        0,
      );

      // Keep attack placeholder if old frames still present; otherwise reuse a few idle
      mk('arin_attack', ['arin_idle_0', 'arin_idle_1', 'arin_idle_2'], 12, 0);
    }

    this.scene.start('Menu');
  }
}
