/**
 * The Great Invasion — Audio system (Wave 1)
 *
 * Loads OGG from public/assets/audio when available (Phaser sound).
 * Falls back to Web Audio synthesis if a key is missing.
 *
 * Buses: master / music / sfx / ambience
 * Mobile: unlock() on first gesture.
 */

import type Phaser from 'phaser';

export type MusicState =
  | 'none'
  | 'menu'
  | 'explore'
  | 'combat'
  | 'well'
  | 'boss'
  | 'victory'
  | 'defeat';

type Bus = 'master' | 'music' | 'sfx' | 'ambience';

type ToneOpts = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  delay?: number;
  bus?: Bus;
};

const MUSIC_KEYS: Record<Exclude<MusicState, 'none' | 'victory' | 'defeat'>, string> = {
  menu: 'music_menu',
  explore: 'music_explore',
  combat: 'music_combat',
  well: 'music_well',
  boss: 'music_boss',
};

const SFX_FILES: Record<string, string> = {
  jump: 'sfx_jump',
  land: 'sfx_land',
  dash: 'sfx_dash',
  slash: 'sfx_slash',
  heavy: 'sfx_heavy',
  hit: 'sfx_hit',
  stomp: 'sfx_stomp',
  hurt: 'sfx_hurt',
  crystal: 'sfx_crystal',
  bounce: 'sfx_bounce',
  well_hum: 'sfx_well_hum',
  well_charge: 'sfx_well_charge',
  well_stable: 'sfx_well_stable',
  surge: 'sfx_surge',
  reaver_charge: 'sfx_reaver_charge',
  hulk_slam: 'sfx_hulk_slam',
  shield_block: 'sfx_shield_block',
  victory: 'sfx_victory',
  defeat: 'sfx_defeat',
  ui_click: 'sfx_ui_click',
  ui_confirm: 'sfx_ui_confirm',
  star: 'sfx_star',
};

/** Phaser load keys → file paths (relative to public/) */
export const AUDIO_LOAD_LIST: { key: string; path: string }[] = [
  { key: 'music_menu', path: 'assets/audio/music/echoes_of_the_riftlands.ogg' },
  { key: 'music_explore', path: 'assets/audio/music/the_failing_well.ogg' },
  { key: 'music_combat', path: 'assets/audio/music/dominion_rising.ogg' },
  { key: 'music_well', path: 'assets/audio/music/wells_of_fate.ogg' },
  { key: 'music_boss', path: 'assets/audio/music/heart_of_the_rift.ogg' },
  { key: 'sfx_jump', path: 'assets/audio/sfx/jump.ogg' },
  { key: 'sfx_land', path: 'assets/audio/sfx/land.ogg' },
  { key: 'sfx_dash', path: 'assets/audio/sfx/dash.ogg' },
  { key: 'sfx_slash', path: 'assets/audio/sfx/slash.ogg' },
  { key: 'sfx_heavy', path: 'assets/audio/sfx/heavy.ogg' },
  { key: 'sfx_hit', path: 'assets/audio/sfx/hit.ogg' },
  { key: 'sfx_stomp', path: 'assets/audio/sfx/stomp.ogg' },
  { key: 'sfx_hurt', path: 'assets/audio/sfx/hurt.ogg' },
  { key: 'sfx_crystal', path: 'assets/audio/sfx/crystal.ogg' },
  { key: 'sfx_bounce', path: 'assets/audio/sfx/bounce.ogg' },
  { key: 'sfx_well_hum', path: 'assets/audio/sfx/well_hum.ogg' },
  { key: 'sfx_well_charge', path: 'assets/audio/sfx/well_charge.ogg' },
  { key: 'sfx_well_stable', path: 'assets/audio/sfx/well_stable.ogg' },
  { key: 'sfx_surge', path: 'assets/audio/sfx/surge.ogg' },
  { key: 'sfx_reaver_charge', path: 'assets/audio/sfx/reaver_charge.ogg' },
  { key: 'sfx_hulk_slam', path: 'assets/audio/sfx/hulk_slam.ogg' },
  { key: 'sfx_shield_block', path: 'assets/audio/sfx/shield_block.ogg' },
  { key: 'sfx_victory', path: 'assets/audio/sfx/victory.ogg' },
  { key: 'sfx_defeat', path: 'assets/audio/sfx/defeat.ogg' },
  { key: 'sfx_ui_click', path: 'assets/audio/sfx/ui_click.ogg' },
  { key: 'sfx_ui_confirm', path: 'assets/audio/sfx/ui_confirm.ogg' },
  { key: 'sfx_star', path: 'assets/audio/sfx/star.ogg' },
];

class AudioManagerImpl {
  private scene: Phaser.Scene | null = null;
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private musicState: MusicState = 'none';
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private useFiles = false;

  private volumes: Record<Bus, number> = {
    master: 1,
    music: 0.4,
    sfx: 0.75,
    ambience: 0.35,
  };
  private muted = false;

  attach(scene: Phaser.Scene) {
    this.scene = scene;
    this.useFiles = scene.cache.audio.exists('sfx_jump');
  }

  unlock() {
    const c = this.ensure();
    if (!c) return;
    if (c.state === 'suspended') void c.resume();
    this.unlocked = true;
    if (this.scene?.sound) {
      try {
        // Phaser 3 unlock
        const snd = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
        if (typeof (snd as unknown as { unlock: () => void }).unlock === 'function') {
          (snd as unknown as { unlock: () => void }).unlock();
        }
      } catch {
        /* ignore */
      }
    }
  }

  isUnlocked() {
    return this.unlocked;
  }

  setVolume(bus: Bus, value: number) {
    this.volumes[bus] = Math.max(0, Math.min(1, value));
    if (bus === 'music' && this.currentMusic && 'setVolume' in this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.busGain('music'));
    }
  }

  getVolume(bus: Bus) {
    return this.volumes[bus];
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (m) this.stopMusic();
  }

  setMusic(state: MusicState) {
    if (state === this.musicState && state !== 'victory' && state !== 'defeat') return;
    this.musicState = state;
    this.stopMusic();
    if (this.muted || state === 'none') return;
    this.unlock();

    if (state === 'victory') {
      this.playSfxKey('victory');
      return;
    }
    if (state === 'defeat') {
      this.playSfxKey('defeat');
      return;
    }

    const key = MUSIC_KEYS[state];
    if (this.useFiles && this.scene && this.scene.cache.audio.exists(key)) {
      try {
        this.currentMusic = this.scene.sound.add(key, {
          loop: true,
          volume: this.busGain('music'),
        });
        this.currentMusic.play();
        return;
      } catch {
        /* synth fallback */
      }
    }

    switch (state) {
      case 'menu':
        this.startMenuBed();
        break;
      case 'explore':
        this.startExploreBed();
        break;
      case 'combat':
        this.startCombatBed();
        break;
      case 'well':
        this.startWellBed();
        break;
      case 'boss':
        this.startBossBed();
        break;
    }
  }

  addTensionLayer() {
    if (this.muted || !this.unlocked) return;
    this.tone({ freq: 90, dur: 0.35, type: 'triangle', gain: 0.06, bus: 'music' });
    this.tone({ freq: 55, dur: 0.5, type: 'sine', gain: 0.04, slideTo: 70, bus: 'music', delay: 20 });
  }

  stopMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
        this.currentMusic.destroy();
      } catch {
        /* ignore */
      }
      this.currentMusic = null;
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  sfxJump() {
    this.playSfx('jump', () => this.tone({ freq: 280, dur: 0.09, type: 'square', gain: 0.055, slideTo: 420 }));
  }
  sfxLand() {
    this.playSfx('land', () => this.tone({ freq: 120, dur: 0.04, type: 'triangle', gain: 0.035 }));
  }
  sfxDash() {
    this.playSfx('dash', () => this.tone({ freq: 400, dur: 0.1, type: 'sawtooth', gain: 0.04, slideTo: 180 }));
  }
  sfxSlash() {
    this.playSfx('slash', () => this.tone({ freq: 520, dur: 0.06, type: 'square', gain: 0.05, slideTo: 280 }));
  }
  sfxHeavy() {
    this.playSfx('heavy', () => this.tone({ freq: 160, dur: 0.14, type: 'sawtooth', gain: 0.07, slideTo: 70 }));
  }
  sfxHit() {
    this.playSfx('hit', () => this.tone({ freq: 240, dur: 0.07, type: 'triangle', gain: 0.06, slideTo: 120 }));
  }
  sfxStomp() {
    this.playSfx('stomp', () => this.tone({ freq: 180, dur: 0.12, type: 'triangle', gain: 0.09, slideTo: 90 }));
  }
  sfxHurt() {
    this.playSfx('hurt', () => this.tone({ freq: 220, dur: 0.18, type: 'sawtooth', gain: 0.06, slideTo: 80 }));
    this.duckMusic(0.25, 0.2);
  }
  sfxCrystal() {
    this.playSfx('crystal', () => {
      this.tone({ freq: 880, dur: 0.07, type: 'sine', gain: 0.06 });
      this.tone({ freq: 1320, dur: 0.08, type: 'sine', gain: 0.045, delay: 40 });
    });
  }
  sfxBounce() {
    this.playSfx('bounce', () => this.tone({ freq: 360, dur: 0.1, type: 'triangle', gain: 0.07, slideTo: 620 }));
  }
  sfxWellHum() {
    this.playSfx('well_hum', () => {
      this.tone({ freq: 196, dur: 0.4, type: 'sine', gain: 0.03, bus: 'ambience' });
      this.tone({ freq: 392, dur: 0.35, type: 'sine', gain: 0.02, bus: 'ambience', delay: 30 });
    });
  }
  sfxWellCharge() {
    this.playSfx('well_charge', () =>
      this.tone({ freq: 220, dur: 0.25, type: 'sine', gain: 0.04, slideTo: 440, bus: 'ambience' })
    );
  }
  sfxWellStable() {
    this.playSfx('well_stable', () => {
      this.tone({ freq: 523, dur: 0.12, type: 'sine', gain: 0.06 });
      this.tone({ freq: 659, dur: 0.12, type: 'sine', gain: 0.055, delay: 90 });
      this.tone({ freq: 784, dur: 0.2, type: 'sine', gain: 0.06, delay: 180 });
    });
  }
  sfxSurge() {
    this.playSfx('surge', () => {
      this.tone({ freq: 100, dur: 0.25, type: 'sawtooth', gain: 0.08, slideTo: 50 });
      this.tone({ freq: 60, dur: 0.35, type: 'triangle', gain: 0.05, delay: 40 });
    });
  }
  sfxReaverCharge() {
    this.playSfx('reaver_charge', () =>
      this.tone({ freq: 180, dur: 0.2, type: 'sawtooth', gain: 0.05, slideTo: 320 })
    );
  }
  sfxHulkSlam() {
    this.playSfx('hulk_slam', () => this.tone({ freq: 70, dur: 0.28, type: 'triangle', gain: 0.1, slideTo: 40 }));
  }
  sfxShieldBlock() {
    this.playSfx('shield_block', () =>
      this.tone({ freq: 600, dur: 0.05, type: 'square', gain: 0.04, slideTo: 200 })
    );
  }
  sfxVictory() {
    this.playSfxKey('victory');
  }
  sfxDefeat() {
    this.playSfxKey('defeat');
  }
  sfxUiClick() {
    this.playSfx('ui_click', () => this.tone({ freq: 660, dur: 0.04, type: 'sine', gain: 0.035 }));
  }
  sfxUiConfirm() {
    this.playSfx('ui_confirm', () => {
      this.tone({ freq: 520, dur: 0.06, type: 'sine', gain: 0.04 });
      this.tone({ freq: 780, dur: 0.08, type: 'sine', gain: 0.035, delay: 50 });
    });
  }
  sfxStar() {
    this.playSfx('star', () => {
      this.tone({ freq: 988, dur: 0.08, type: 'sine', gain: 0.05 });
      this.tone({ freq: 1319, dur: 0.12, type: 'sine', gain: 0.04, delay: 60 });
    });
  }

  private playSfx(name: string, fallback: () => void) {
    if (this.playSfxKey(name)) return;
    fallback();
  }

  private playSfxKey(name: string): boolean {
    const key = SFX_FILES[name];
    if (!key || !this.useFiles || !this.scene || !this.scene.cache.audio.exists(key)) return false;
    try {
      this.unlock();
      this.scene.sound.play(key, { volume: this.busGain('sfx') });
      return true;
    } catch {
      return false;
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  private busGain(bus: Bus): number {
    if (this.muted) return 0;
    return this.volumes.master * this.volumes[bus];
  }

  private tone(opts: ToneOpts) {
    const c = this.ensure();
    if (!c || !this.unlocked) return;
    const bus = opts.bus ?? 'sfx';
    const run = () => {
      const t0 = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = opts.type ?? 'square';
      o.frequency.setValueAtTime(opts.freq, t0);
      if (opts.slideTo != null) {
        o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t0 + opts.dur);
      }
      const vol = (opts.gain ?? 0.08) * this.busGain(bus);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + opts.dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + opts.dur + 0.03);
    };
    if (opts.delay) setTimeout(run, opts.delay);
    else run();
  }

  private duckMusic(factor: number, seconds: number) {
    const prev = this.volumes.music;
    this.volumes.music = prev * factor;
    if (this.currentMusic && 'setVolume' in this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.busGain('music'));
    }
    setTimeout(() => {
      this.volumes.music = prev;
      if (this.currentMusic && 'setVolume' in this.currentMusic) {
        (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.busGain('music'));
      }
    }, seconds * 1000);
  }

  private startMenuBed() {
    const playChord = () => {
      for (const f of [220, 330, 440, 554]) {
        this.tone({ freq: f, dur: 1.8, type: 'sine', gain: 0.018, bus: 'music' });
      }
    };
    playChord();
    this.musicTimer = setInterval(playChord, 3200);
  }
  private startExploreBed() {
    const pulse = () => {
      this.tone({ freq: 110, dur: 0.5, type: 'sine', gain: 0.022, bus: 'music' });
      this.tone({ freq: 164, dur: 0.45, type: 'sine', gain: 0.012, bus: 'music', delay: 80 });
    };
    pulse();
    this.musicTimer = setInterval(pulse, 2400);
  }
  private startCombatBed() {
    const beat = () => {
      this.tone({ freq: 80, dur: 0.12, type: 'triangle', gain: 0.05, bus: 'music' });
      this.tone({ freq: 120, dur: 0.08, type: 'square', gain: 0.02, bus: 'music', delay: 200 });
      this.tone({ freq: 60, dur: 0.18, type: 'sine', gain: 0.03, bus: 'music', delay: 400 });
    };
    beat();
    this.musicTimer = setInterval(beat, 900);
  }
  private startWellBed() {
    const shimmer = () => {
      this.tone({ freq: 523, dur: 0.6, type: 'sine', gain: 0.02, bus: 'music' });
      this.tone({ freq: 784, dur: 0.5, type: 'sine', gain: 0.015, bus: 'music', delay: 100 });
      this.tone({ freq: 1046, dur: 0.4, type: 'sine', gain: 0.01, bus: 'music', delay: 200 });
    };
    shimmer();
    this.musicTimer = setInterval(shimmer, 1800);
  }
  private startBossBed() {
    const beat = () => {
      this.tone({ freq: 55, dur: 0.2, type: 'sawtooth', gain: 0.06, bus: 'music' });
      this.tone({ freq: 82, dur: 0.15, type: 'triangle', gain: 0.04, bus: 'music', delay: 150 });
      this.tone({ freq: 110, dur: 0.25, type: 'sine', gain: 0.03, bus: 'music', delay: 300 });
    };
    beat();
    this.musicTimer = setInterval(beat, 700);
  }
}

export const Audio = new AudioManagerImpl();
