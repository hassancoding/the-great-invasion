import Phaser from 'phaser';
import { ARIN_ATTACKS, ARIN_ATTACK_FRAME_FILES, getArinAttackTextureKey } from '../data/arinAttacks';
import { ensureHeroTextures } from '../systems/envBuilder';

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
    this.load.svg('halcyon_aether_well_prop', 'assets/env/halcyon/aether-well.svg', { width: 320, height: 320 });
    this.load.spritesheet('halcyon_rift_hound', 'assets/env/halcyon/sprites/crystal-wolf-walk.png', { frameWidth: 192, frameHeight: 160 });
    this.load.svg('halcyon_ancient_arch_prop', 'assets/env/halcyon/props/ancient-arch.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_sky_crystal_prop', 'assets/env/halcyon/props/sky-crystal.svg', { width: 160, height: 192 });
    this.load.svg('halcyon_orun_boss_sprite', 'assets/env/halcyon/sprites/orun-boss.svg', { width: 384, height: 384 });
    this.load.svg('halcyon_platform_tile_prop', 'assets/env/halcyon/props/platform-tile.svg', { width: 256, height: 96 });
    this.load.svg('halcyon_spike_trap_prop', 'assets/env/halcyon/props/spike-trap.svg', { width: 256, height: 96 });
    this.load.svg('halcyon_rift_burst_effect', 'assets/env/halcyon/effects/rift-burst.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_arin_hero', 'assets/env/halcyon/sprites/arin-idle.svg', { width: 256, height: 256 });
    this.load.svg('halcyon_kaela_hero', 'assets/env/halcyon/sprites/kaela-verdant-warden.svg', { width: 320, height: 400 });
    this.load.svg('halcyon_varkhul_hero', 'assets/env/halcyon/sprites/varkhul-riftbound.svg', { width: 320, height: 400 });
    this.load.svg('portrait_kaela', 'assets/env/halcyon/sprites/kaela-verdant-warden.svg', { width: 320, height: 400 });
    this.load.svg('portrait_varkhul', 'assets/env/halcyon/sprites/varkhul-riftbound.svg', { width: 320, height: 400 });

    this.load.image('halcyon_fortress_skyline', 'assets/env/halcyon/backgrounds/fortress/skyline.png');
    this.load.image('halcyon_fortress_skyline_layer', 'assets/env/halcyon/backgrounds/fortress/skyline-layer.png');
    this.load.image('halcyon_fortress_bridge', 'assets/env/halcyon/backgrounds/fortress/island-bridge.png');
    this.load.image('halcyon_fortress_clouds', 'assets/env/halcyon/backgrounds/fortress/cloud-bank.png');
    this.load.image('halcyon_fortress_arch_island', 'assets/env/halcyon/props/fortress/arch-island.png');
    this.load.image('halcyon_fortress_aether_crystal', 'assets/env/halcyon/props/fortress/aether-crystal.png');

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
    this.load.atlas('arin', 'assets/sprites/arin/arin_sprites.png', 'assets/sprites/arin/arin_atlas.json');
    this.load.image('portrait_arin', 'assets/sprites/arin/arin_portrait.png');

    // === PNG environment pack (Halcyon) — prefer these over SVGs when present ===
    this.load.image('png_platform_a', 'assets/env/platforms/plat_03.png');
    this.load.image('png_platform_b', 'assets/env/platforms/plat_05.png');
    this.load.image('png_platform_c', 'assets/env/platforms/plat_07.png');
    this.load.image('png_platform_d', 'assets/env/platforms/plat_13.png');
    this.load.image('png_arch_a', 'assets/env/arches/foliage_06.png');
    this.load.image('png_arch_b', 'assets/env/arches/foliage_07.png');
    this.load.image('png_tree_a', 'assets/env/trees/foliage_00.png');
    this.load.image('png_tree_b', 'assets/env/trees/foliage_01.png');
    this.load.image('png_crystal_a', 'assets/env/props/cel_03.png');
    this.load.image('png_crystal_b', 'assets/env/props/cel_04.png');
    this.load.image('png_island_far', 'assets/env/cel_00.png');
    this.load.image('png_island_mid', 'assets/env/cel_01.png');
    this.load.image('png_prop_crate', 'assets/env/props/cel_20.png');

    // Arin attack frame images (individual PNGs) — only existing files
    const loadAtk = (cat: string, ids: number[]) => {
      for (const i of ids) {
        const id = String(i).padStart(2, '0');
        this.load.image(`arin_atk_${cat}_${id}`, `assets/sprites/arin/attacks/${cat}/${cat}_${id}.png`);
      }
    };
    loadAtk('light', [1, 2, 3, 4, 5]);
    loadAtk('heavy', [1, 2, 3, 4, 5, 6]);
    loadAtk('dash', [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
    loadAtk('air', [1, 2, 3, 4, 5, 6, 7, 8]);
    loadAtk('charged', [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
    loadAtk('spin', [1, 2, 3, 4, 5, 6, 7, 8]);

    // Production Arin atlas (cropped from provided sheets)
    this.load.image('arin_sheet', 'assets/sprites/arin/arin_sprites.png');
  }

  create() {
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
    this.createArinAnimations();
    this.createArinAttackAnimations();
    this.createEnemyAnimations();

    this.scene.start('Menu');
  }

  private createArinAnimations() {
    if (!this.textures.exists('arin')) return;

    const createAnimation = (key: string, state: string, count: number, frameRate: number, repeat: number) => {
      const frames = Array.from({ length: count }, (_, index) => `arin_${state}_${index}`)
        .filter((frame) => this.textures.get('arin').has(frame));
      if (!frames.length || this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: 'arin', frame })),
        frameRate,
        repeat,
      });
    };

    createAnimation('arin_idle', 'idle', 8, 6, -1);
    createAnimation('arin_run', 'run', 24, 14, -1);
    createAnimation('arin_jump', 'jump', 22, 12, 0);
  }

  private createEnemyAnimations() {
    if (!this.textures.exists('halcyon_rift_hound') || this.anims.exists('halcyon_rift_hound_walk')) return;
    this.anims.create({
      key: 'halcyon_rift_hound_walk',
      frames: this.anims.generateFrameNumbers('halcyon_rift_hound', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  private createArinAttackAnimations() {
    for (const attack of Object.values(ARIN_ATTACKS)) {
      if (this.anims.exists(attack.animationKey)) continue;
      const frames = attack.playbackFiles
        .map((file) => getArinAttackTextureKey(attack.category, file))
        .filter((key) => this.textures.exists(key))
        .map((key) => ({ key }));
      if (!frames.length) continue;
      this.anims.create({
        key: attack.animationKey,
        frames,
        frameRate: attack.frameRate,
        repeat: 0,
      });
    }

    // Individual attack frame sequences (PNG pack)
    const mkImg = (key: string, frames: string[], rate: number, repeat = 0) => {
      if (this.anims.exists(key)) this.anims.remove(key);
      const valid = frames.filter((f) => this.textures.exists(f));
      if (!valid.length) return;
      this.anims.create({
        key,
        frames: valid.map((f) => ({ key: f })),
        frameRate: rate,
        repeat,
      });
    };
    const seq = (cat: string, ids: number[]) =>
      ids.map((i) => `arin_atk_${cat}_${String(i).padStart(2, '0')}`);
    mkImg('arin_attack_light', seq('light', [1, 2, 3, 4, 5]), 14, 0);
    mkImg('arin_attack_heavy', seq('heavy', [1, 2, 3, 4, 5, 6]), 10, 0);
    mkImg('arin_attack_dash', seq('dash', [2, 3, 4, 5, 6, 8, 9, 10]), 16, 0);
    mkImg('arin_attack_air', seq('air', [1, 2, 3, 4, 5, 6, 7, 8]), 14, 0);
    mkImg('arin_attack_charged', seq('charged', [2, 3, 4, 5, 6, 8, 9, 10]), 12, 0);
    mkImg('arin_attack_spin', seq('spin', [1, 2, 3, 4, 5, 6, 7, 8]), 14, 0);
    // Default light maps to arin_attack if present
    if (this.anims.exists('arin_attack_light') && !this.anims.exists('arin_attack')) {
      // already created above as placeholder; replace with light if available
    }
    if (this.anims.exists('arin_attack_light')) {
      if (this.anims.exists('arin_attack')) this.anims.remove('arin_attack');
      // alias: copy light as default attack
      const light = this.anims.get('arin_attack_light');
      this.anims.create({
        key: 'arin_attack',
        frames: light.frames.map((f) => ({ key: f.textureKey, frame: f.frame.name })),
        frameRate: 14,
        repeat: 0,
      });
    }

    this.scene.start('Menu');
  }
}
