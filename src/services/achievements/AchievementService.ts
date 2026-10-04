import { ACHIEVEMENTS_LIST } from "@/config/gameConfig";
import { Achievement, GameSession } from "@/types/game";

const STORAGE_KEY = "tgi_achievements";

function loadUnlocked(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveUnlocked(data: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function getAchievements(): Achievement[] {
  const unlocked = loadUnlocked();
  return ACHIEVEMENTS_LIST.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    unlocked: !!unlocked[a.id],
    unlockedAt: unlocked[a.id],
  }));
}

export function checkAndUnlock(
  session: GameSession,
  isDaily: boolean,
  held: number,
  total: number
): Achievement[] {
  const unlocked = loadUnlocked();
  const newly: Achievement[] = [];
  const now = new Date().toISOString();

  const tryUnlock = (id: string) => {
    if (unlocked[id]) return;
    unlocked[id] = now;
    const def = ACHIEVEMENTS_LIST.find((a) => a.id === id);
    if (def) {
      newly.push({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        unlocked: true,
        unlockedAt: now,
      });
    }
  };

  tryUnlock("first_game");
  if (held > total * 0.4) tryUnlock("first_win");
  if (session.isNewRecord) tryUnlock("new_record");
  if (session.score >= 1000) tryUnlock("score_1000");
  if (session.score >= 5000) tryUnlock("score_5000");
  if (session.score >= 10000) tryUnlock("score_10000");
  if (held >= 15) tryUnlock("territories_15");
  if (session.maxStreak >= 5) tryUnlock("streak_5");
  if (session.maxStreak >= 10) tryUnlock("streak_10");
  if (isDaily) tryUnlock("daily_challenge");
  if (held / total >= 0.7) tryUnlock("perfect_round");
  if (session.timeSurvived <= 20 && held >= 8) tryUnlock("speed_master");

  if (newly.length > 0) saveUnlocked(unlocked);
  return newly;
}
