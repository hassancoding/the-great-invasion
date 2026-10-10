/**
 * The Great Invasion — Audio system (Wave 1)
 *
 * Buses: master / music / sfx / ambience
 * Wave 1: Web Audio synthesized SFX + layered procedural music beds
 * Production path: swap in OGG/MP3 via manifest keys without changing call sites
 *
 * Mobile: unlock() on first pointer/key — browsers block autoplay until gesture.
 */

export type MusicState =
  | 'none'
  | 'menu' // Echoes of the Riftlands
  | 'explore' // The Failing Well
  | 'combat' // Dominion Rising
  | 'well' // Wells of Fate
  | 'boss' // Heart of the Rift
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

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private musicState: MusicState = 'none';
  private musicNodes: { stop: () => void }[] = [];
  private musicTimer: ReturnType<typeof setInterval> | null = null;

  /** Linear gains 0–1 */
  private volumes: Record<Bus, number> = {
    master: 1,
    music: 0.45,
    sfx: 0.7,
    ambience: 0.35,
  };

  private muted = false;

  // ─── lifecycle ───────────────────────────────────────────

  unlock() {
    const c = this.ensure();
    if (!c) return;
    if (c.state === 'suspended') void c.resume();
    this.unlocked = true;
  }

  isUnlocked() {
    return this.unlocked;
  }

  setVolume(bus: Bus, value: number) {
    this.volumes[bus] = Math.max(0, Math.min(1, value));
  }

  getVolume(bus: Bus) {
    return this.volumes[bus];
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (m) this.stopMusic();
  }

  // ─── music state machine ─────────────────────────────────

  /** Crossfade-style switch of procedural beds by gameplay state */
  setMusic(state: MusicState) {
    if (state === this.musicState) return;
    this.musicState = state;
    this.stopMusic();
    if (this.muted || state === 'none') return;
    this.unlock();

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
      case 'victory':
        this.sfxVictory();
        break;
      case 'defeat':
        this.sfxDefeat();
        break;
    }
  }

  /** Layer pressure into current bed (Threat Director escalation) */
  addTensionLayer() {
    if (this.muted || !this.unlocked) return;
    // Short taiko-like hit + rising drone pulse
    this.tone({ freq: 90, dur: 0.35, type: 'triangle', gain: 0.06, bus: 'music' });
    this.tone({ freq: 55, dur: 0.5, type: 'sine', gain: 0.04, slideTo: 70, bus: 'music', delay: 20 });
  }

  stopMusic() {
    for (const n of this.musicNodes) n.stop();
    this.musicNodes = [];
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // ─── Wave 1 SFX (combat / movement / well / UI) ───────────

  sfxJump() {
    this.tone({ freq: 280, dur: 0.09, type: 'square', gain: 0.055, slideTo: 420 });
  }
  sfxLand() {
    this.tone({ freq: 120, dur: 0.04, type: 'triangle', gain: 0.035 });
  }
  sfxDash() {
    this.tone({ freq: 400, dur: 0.1, type: 'sawtooth', gain: 0.04, slideTo: 180 });
  }
  sfxSlash() {
    this.tone({ freq: 520, dur: 0.06, type: 'square', gain: 0.05, slideTo: 280 });
  }
  sfxHeavy() {
    this.tone({ freq: 160, dur: 0.14, type: 'sawtooth', gain: 0.07, slideTo: 70 });
  }
  sfxHit() {
    this.tone({ freq: 240, dur: 0.07, type: 'triangle', gain: 0.06, slideTo: 120 });
  }
  sfxStomp() {
    this.tone({ freq: 180, dur: 0.12, type: 'triangle', gain: 0.09, slideTo: 90 });
  }
  sfxHurt() {
    this.tone({ freq: 220, dur: 0.18, type: 'sawtooth', gain: 0.06, slideTo: 80 });
    this.duckMusic(0.25, 0.2);
  }
  sfxCrystal() {
    this.tone({ freq: 880, dur: 0.07, type: 'sine', gain: 0.06 });
    this.tone({ freq: 1320, dur: 0.08, type: 'sine', gain: 0.045, delay: 40 });
  }
  sfxBounce() {
    this.tone({ freq: 360, dur: 0.1, type: 'triangle', gain: 0.07, slideTo: 620 });
  }
  sfxWellHum() {
    this.tone({ freq: 196, dur: 0.4, type: 'sine', gain: 0.03, bus: 'ambience' });
    this.tone({ freq: 392, dur: 0.35, type: 'sine', gain: 0.02, bus: 'ambience', delay: 30 });
  }
  sfxWellCharge() {
    this.tone({ freq: 220, dur: 0.25, type: 'sine', gain: 0.04, slideTo: 440, bus: 'ambience' });
  }
  sfxWellStable() {
    this.tone({ freq: 523, dur: 0.12, type: 'sine', gain: 0.06 });
    this.tone({ freq: 659, dur: 0.12, type: 'sine', gain: 0.055, delay: 90 });
    this.tone({ freq: 784, dur: 0.2, type: 'sine', gain: 0.06, delay: 180 });
  }
  sfxSurge() {
    this.tone({ freq: 100, dur: 0.25, type: 'sawtooth', gain: 0.08, slideTo: 50 });
    this.tone({ freq: 60, dur: 0.35, type: 'triangle', gain: 0.05, delay: 40 });
  }
  sfxReaverCharge() {
    this.tone({ freq: 180, dur: 0.2, type: 'sawtooth', gain: 0.05, slideTo: 320 });
  }
  sfxHulkSlam() {
    this.tone({ freq: 70, dur: 0.28, type: 'triangle', gain: 0.1, slideTo: 40 });
  }
  sfxShieldBlock() {
    this.tone({ freq: 600, dur: 0.05, type: 'square', gain: 0.04, slideTo: 200 });
  }
  sfxVictory() {
    this.tone({ freq: 523, dur: 0.1, type: 'sine', gain: 0.06 });
    this.tone({ freq: 659, dur: 0.1, type: 'sine', gain: 0.06, delay: 90 });
    this.tone({ freq: 784, dur: 0.22, type: 'sine', gain: 0.07, delay: 180 });
  }
  sfxDefeat() {
    this.tone({ freq: 300, dur: 0.25, type: 'sawtooth', gain: 0.06, slideTo: 90 });
  }
  sfxUiClick() {
    this.tone({ freq: 660, dur: 0.04, type: 'sine', gain: 0.035 });
  }
  sfxUiConfirm() {
    this.tone({ freq: 520, dur: 0.06, type: 'sine', gain: 0.04 });
    this.tone({ freq: 780, dur: 0.08, type: 'sine', gain: 0.035, delay: 50 });
  }
  sfxStar() {
    this.tone({ freq: 988, dur: 0.08, type: 'sine', gain: 0.05 });
    this.tone({ freq: 1319, dur: 0.12, type: 'sine', gain: 0.04, delay: 60 });
  }

  // ─── internals ───────────────────────────────────────────

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
    setTimeout(() => {
      this.volumes.music = prev;
    }, seconds * 1000);
  }

  /** Soft looping pad — menu / Echoes of the Riftlands */
  private startMenuBed() {
    const c = this.ensure();
    if (!c) return;
    const playChord = () => {
      // Aether motif: A minor-ish open intervals
      for (const f of [220, 330, 440, 554]) {
        this.tone({ freq: f, dur: 1.8, type: 'sine', gain: 0.018, bus: 'music' });
      }
    };
    playChord();
    this.musicTimer = setInterval(playChord, 3200);
  }

  /** Exploration — restrained pulse */
  private startExploreBed() {
    const pulse = () => {
      this.tone({ freq: 110, dur: 0.5, type: 'sine', gain: 0.022, bus: 'music' });
      this.tone({ freq: 164, dur: 0.45, type: 'sine', gain: 0.012, bus: 'music', delay: 80 });
    };
    pulse();
    this.musicTimer = setInterval(pulse, 2400);
  }

  /** Combat — Dominion Rising percussion bed */
  private startCombatBed() {
    const beat = () => {
      this.tone({ freq: 80, dur: 0.12, type: 'triangle', gain: 0.05, bus: 'music' });
      this.tone({ freq: 120, dur: 0.08, type: 'square', gain: 0.02, bus: 'music', delay: 200 });
      this.tone({ freq: 60, dur: 0.18, type: 'sine', gain: 0.03, bus: 'music', delay: 400 });
    };
    beat();
    this.musicTimer = setInterval(beat, 900);
  }

  /** Well stabilization — crystal resolution */
  private startWellBed() {
    const shimmer = () => {
      this.tone({ freq: 523, dur: 0.6, type: 'sine', gain: 0.02, bus: 'music' });
      this.tone({ freq: 784, dur: 0.5, type: 'sine', gain: 0.015, bus: 'music', delay: 100 });
      this.tone({ freq: 1046, dur: 0.4, type: 'sine', gain: 0.01, bus: 'music', delay: 200 });
    };
    shimmer();
    this.musicTimer = setInterval(shimmer, 1800);
  }

  /** Boss — heavier pulse */
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

/** Singleton — import anywhere in Phaser scenes */
export const Audio = new AudioManagerImpl();
