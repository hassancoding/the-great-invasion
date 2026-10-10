/**
 * Lightweight Web Audio SFX for Bolt Hop — no external assets.
 * Safe no-op if AudioContext is blocked.
 */

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'square',
  gain = 0.08,
  slideTo?: number
) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function sfxJump() {
  tone(280, 0.09, 'square', 0.06, 420);
}

export function sfxCoin() {
  tone(880, 0.07, 'sine', 0.07);
  setTimeout(() => tone(1320, 0.08, 'sine', 0.05), 40);
}

export function sfxStomp() {
  tone(180, 0.12, 'triangle', 0.1, 90);
}

export function sfxHurt() {
  tone(220, 0.18, 'sawtooth', 0.07, 80);
}

export function sfxWin() {
  tone(523, 0.1, 'sine', 0.06);
  setTimeout(() => tone(659, 0.1, 'sine', 0.06), 90);
  setTimeout(() => tone(784, 0.18, 'sine', 0.07), 180);
}

export function sfxLose() {
  tone(300, 0.2, 'sawtooth', 0.06, 100);
}

export function sfxBounce() {
  tone(360, 0.1, 'triangle', 0.08, 620);
}

export function sfxLand() {
  tone(120, 0.04, 'triangle', 0.04);
}

export function sfxSlash() {
  tone(520, 0.06, 'square', 0.05, 280);
}

export function sfxHeavy() {
  tone(160, 0.14, 'sawtooth', 0.08, 70);
}

export function sfxHit() {
  tone(240, 0.07, 'triangle', 0.07, 120);
}
