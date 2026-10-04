import { DailyChallenge } from "@/types/game";

const STORAGE_KEY = "tgi_daily_challenge";

export function getDailySeed(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10000 + m * 100 + d + 7919;
}

export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function loadDailyChallenge(): DailyChallenge {
  const today = getTodayKey();
  if (typeof window === "undefined") {
    return {
      date: today,
      seed: getDailySeed(),
      mapId: `daily-${today}`,
      targetTerritories: 12,
      timeLimit: 60,
      bestScore: null,
      playerScore: null,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as DailyChallenge;
      if (data.date === today) return data;
    }
  } catch {}

  const challenge: DailyChallenge = {
    date: today,
    seed: getDailySeed(),
    mapId: `daily-${today}`,
    targetTerritories: 12,
    timeLimit: 60,
    bestScore: null,
    playerScore: null,
  };
  saveDailyChallenge(challenge);
  return challenge;
}

export function saveDailyChallenge(challenge: DailyChallenge) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
  } catch {}
}

export function recordDailyScore(score: number): DailyChallenge {
  const challenge = loadDailyChallenge();
  challenge.playerScore = score;
  if (challenge.bestScore === null || score > challenge.bestScore) {
    challenge.bestScore = score;
  }
  saveDailyChallenge(challenge);
  return challenge;
}
