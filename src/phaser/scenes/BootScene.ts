import Phaser from 'phaser';
import { generateSheetTextures } from '../utils/textureFactory';
import { Audio, AUDIO_LOAD_LIST } from '../systems/AudioManager';
import { registerSheetArt } from '../assets/sheetArt';

/**
 * Boot — embedded Game Asset Sheet art + audio + procedural gameplay frames.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Missing on-disk PNGs are OK — embedded sheetArt registers fallbacks in create()
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('[Boot] optional asset missing:', file.key);
    });
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

    // Optional on-disk assets (when git-pushed); embedded sheetArt covers critical keys
    this.load.image('art_arin', 'assets/characters/arin/arin.png');
    this.load.image('art_arin_menu', 'assets/characters/arin/arin_menu.png');
    this.load.image('art_kaela', 'assets/characters/kaela/kaela.png');
    this.load.image('art_kaela_menu', 'assets/characters/kaela/kaela_menu.png');
    this.load.image('art_varkhul', 'assets/characters/varkhul/varkhul.png');
    this.load.image('art_varkhul_menu', 'assets/characters/varkhul/varkhul_menu.png');
    this.load.image('art_graveling', 'assets/enemies/graveling/graveling.png');
    this.load.image('art_legionnaire', 'assets/enemies/legionnaire/legionnaire.png');
    this.load.image('art_hulk', 'assets/enemies/hulk/hulk.png');
    this.load.image('art_reaver', 'assets/enemies/reaver/reaver.png');
    this.load.image('art_skybound', 'assets/tiles/skybound/biome.png');
    this.load.image('art_verdant', 'assets/tiles/verdant/biome.png');
    this.load.image('art_obsidian', 'assets/tiles/obsidian/biome.png');
    this.load.image('art_menu_bg', 'assets/tiles/skybound/menu_bg.png');
    this.load.image('art_logo', 'assets/branding/logo_area.png');
  }

  create() {
    // Embedded sheet art fills any keys that failed to load from disk
    registerSheetArt(this);
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
