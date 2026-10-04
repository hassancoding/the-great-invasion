type SoundName = "click" | "claim" | "combo" | "fail" | "levelup" | "record";

class AudioService {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private musicEnabled = false;
  private unlocked = false;

  private ensureContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.unlocked = true;
  }

  unlock() {
    this.ensureContext();
  }

  setSoundEnabled(v: boolean) {
    this.enabled = v;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tgi_sound", v ? "1" : "0");
      } catch {}
    }
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tgi_music", v ? "1" : "0");
      } catch {}
    }
  }

  isSoundEnabled() {
    return this.enabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  loadPrefs() {
    if (typeof window === "undefined") return;
    try {
      const s = localStorage.getItem("tgi_sound");
      if (s !== null) this.enabled = s === "1";
      const m = localStorage.getItem("tgi_music");
      if (m !== null) this.musicEnabled = m === "1";
    } catch {}
  }

  play(name: SoundName) {
    if (!this.enabled || !this.unlocked) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (name) {
      case "click":
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      case "claim":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case "combo":
        osc.type = "square";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case "fail":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case "levelup":
      case "record":
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
    }
  }
}

export const audio = new AudioService();
