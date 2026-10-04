export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  territories: number;
  date: string;
}

const STORAGE_KEY = "tgi_local_leaderboard";
const MAX_ENTRIES = 20;

function loadLocal(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function saveLocal(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {}
}

export function getLocalLeaderboard(): LeaderboardEntry[] {
  return loadLocal().sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
}

export function submitLocalScore(name: string, score: number, territories: number): LeaderboardEntry[] {
  const entries = loadLocal();
  entries.push({
    rank: 0,
    name: name.slice(0, 16) || "Commander",
    score,
    territories,
    date: new Date().toISOString().slice(0, 10),
  });
  entries.sort((a, b) => b.score - a.score);
  const ranked = entries.slice(0, MAX_ENTRIES).map((e, i) => ({ ...e, rank: i + 1 }));
  saveLocal(ranked);
  return ranked;
}

export async function submitScoreToServer(
  _payload: { score: number; territories: number; seed: number; timeSurvived: number }
): Promise<{ ok: boolean; rank?: number }> {
  return { ok: false };
}
