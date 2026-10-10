/**
 * Local progression — PBs, Daily Rift seed, unlocks (Kaela skin).
 * Keeps retention hooks offline-first for viral web sessions.
 */

export const STORAGE = {
  pb: 'tgi_riftlands_pb',
  unlocks: 'tgi_riftlands_unlocks',
  dailyBest: 'tgi_riftlands_daily_best',
  runs: 'tgi_riftlands_runs',
} as const;

export type Unlocks = {
  kaela: boolean;
  varkhul: boolean;
  phaseDash: boolean;
  wellsCleared: number;
};

export function defaultUnlocks(): Unlocks {
  return { kaela: false, varkhul: false, phaseDash: false, wellsCleared: 0 };
}

export function loadUnlocks(): Unlocks {
  try {
    const raw = localStorage.getItem(STORAGE.unlocks);
    if (!raw) return defaultUnlocks();
    return { ...defaultUnlocks(), ...JSON.parse(raw) };
  } catch {
    return defaultUnlocks();
  }
}

export function saveUnlocks(u: Unlocks) {
  try {
    localStorage.setItem(STORAGE.unlocks, JSON.stringify(u));
  } catch {}
}

/** Call after a full route clear (all sectors). */
export function onFullClear(score: number): Unlocks {
  const u = loadUnlocks();
  u.wellsCleared = Math.max(u.wellsCleared, 3);
  if (!u.kaela) {
    u.kaela = true;
  }
  if (score >= 2000) u.phaseDash = true;
  saveUnlocks(u);
  return u;
}

export function onWellStabilized() {
  const u = loadUnlocks();
  u.wellsCleared += 1;
  if (u.wellsCleared >= 3 && !u.kaela) u.kaela = true;
  saveUnlocks(u);
  return u;
}

export function getPb(): number {
  try {
    return Number(localStorage.getItem(STORAGE.pb) || 0);
  } catch {
    return 0;
  }
}

export function setPb(score: number): number {
  const cur = getPb();
  if (score > cur) {
    try {
      localStorage.setItem(STORAGE.pb, String(score));
    } catch {}
    return score;
  }
  return cur;
}

/** YYYY-MM-DD in local time for Daily Rift. */
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Deterministic seed from date string. */
export function dailySeed(dateKey = todayKey()): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function loadDailyBest(dateKey = todayKey()): number {
  try {
    const raw = localStorage.getItem(STORAGE.dailyBest);
    if (!raw) return 0;
    const obj = JSON.parse(raw) as { date: string; score: number };
    return obj.date === dateKey ? obj.score : 0;
  } catch {
    return 0;
  }
}

export function setDailyBest(score: number, dateKey = todayKey()): number {
  const cur = loadDailyBest(dateKey);
  if (score > cur) {
    try {
      localStorage.setItem(STORAGE.dailyBest, JSON.stringify({ date: dateKey, score }));
    } catch {}
    return score;
  }
  return cur;
}

export function bumpRunCount() {
  try {
    const n = Number(localStorage.getItem(STORAGE.runs) || 0) + 1;
    localStorage.setItem(STORAGE.runs, String(n));
    return n;
  } catch {
    return 0;
  }
}
