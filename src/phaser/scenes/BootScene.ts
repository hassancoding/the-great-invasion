import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';

/**
 * Boot — preload Game Asset Sheet extracts + audio, then procedural fallbacks.
 * Sheet art lives under public/assets/ (characters, enemies, tiles, branding…).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const barBg = this.add.rectangle(480, 300, 320, 14, 0x1e293b).setOrigin(0.5);
    const bar = this.add.rectangle(320, 300, 0, 10, 0x38bdf8).setOrigin(0, 0.5);
    this.add
      .text(480, 270, 'Loading Riftlands…', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.load.on('progress', (v: number) => {
      bar.width = 320 * v;
      bar.x = 320;
    });
    this.load.on('complete', () => {
      barBg.destroy();
      bar.destroy();
    });

    for (const { key, path } of AUDIO_LOAD_LIST) {
      this.load.audio(key, path);
    }

    // Game Asset Sheet extracts
    this.load.image('art_arin', 'assets/characters/arin/arin.png');
    this.load.image('art_arin_menu', 'assets/characters/arin/arin_menu.png');
    this.load.image('art_kaela', 'assets/characters/kaela/kaela.png');
    this.load.image('art_kaela_menu', 'assets/characters/kaela/kaela_menu.png');
    this.load.image('art_varkhul', 'assets/characters/varkhul/varkhul.png');
    this.load.image('art_varkhul_menu', 'assets/characters/varkhul/varkhul_menu.png');
    this.load.image('sheet_arin', 'assets/characters/arin/spritesheet.png');
    this.load.image('sheet_kaela', 'assets/characters/kaela/spritesheet.png');
    this.load.image('sheet_varkhul', 'assets/characters/varkhul/spritesheet.png');

    this.load.image('art_graveling', 'assets/enemies/graveling/graveling.png');
    this.load.image('art_legionnaire', 'assets/enemies/legionnaire/legionnaire.png');
    this.load.image('art_hulk', 'assets/enemies/hulk/hulk.png');
    this.load.image('art_reaver', 'assets/enemies/reaver/reaver.png');

    this.load.image('art_skybound', 'assets/tiles/skybound/biome.png');
    this.load.image('art_verdant', 'assets/tiles/verdant/biome.png');
    this.load.image('art_obsidian', 'assets/tiles/obsidian/biome.png');
    this.load.image('art_menu_bg', 'assets/tiles/skybound/menu_bg.png');
    this.load.image('art_islands', 'assets/tiles/platforms/islands.png');

    this.load.image('art_wingborne', 'assets/allies/wingborne.png');
    this.load.image('art_aether_guard', 'assets/allies/aether_guard.png');
    this.load.image('art_verdant_spirit', 'assets/allies/verdant_spirit.png');
    this.load.image('art_props', 'assets/props/environmental.png');
    this.load.image('art_weapons', 'assets/items/weapons/weapons.png');
    this.load.image('art_fx_combat', 'assets/fx/combat/combat.png');
    this.load.image('art_loading', 'assets/branding/loading.png');
    this.load.image('art_logo', 'assets/branding/logo_area.png');
    this.load.image('art_hud_ref', 'assets/ui/hud/hud.png');
  }

  create() {
    generateSheetTextures(this);
    Audio.attach(this);

    const unlock = () => {
      Audio.unlock();
      this.input.off('pointerdown', unlock);
      this.input.keyboard?.off('keydown', unlock);
    };
    this.input.once('pointerdown', unlock);
    this.input.keyboard?.once('keydown', unlock);

    this.scene.start('Menu');
  }
}
