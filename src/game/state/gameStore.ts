import { GameState, Nation, Territory, GameSession, PersonalBest, NationId, Achievement } from "@/types/game";
import { GAME_CONFIG } from "@/config/gameConfig";
import { generateMap, assignStartingTerritories } from "@/game/engine/mapGenerator";
import { loadDailyChallenge, recordDailyScore } from "@/services/daily/DailyChallengeService";
import { checkAndUnlock } from "@/services/achievements/AchievementService";
import { submitLocalScore } from "@/services/leaderboard/LeaderboardService";
import { analytics } from "@/services/analytics/AnalyticsService";
import { audio } from "@/game/audio/AudioService";

export interface GameStore {
  state: GameState;
  territories: Territory[];
  nations: Nation[];
  session: GameSession;
  personalBest: PersonalBest;
  seed: number;
  rivalCount: number;
  lastClaimTime: number;
  timeLeft: number;
  isDaily: boolean;
  lastUnlocked: Achievement[];
  initGame: (isDaily?: boolean, dailySeed?: number) => void;
  startCountdown: () => void;
  startPlaying: () => void;
  claimTerritory: (territoryId: number) => boolean;
  tick: (deltaMs: number) => void;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  resetToMenu: () => void;
  getPlayerTerritoryCount: () => number;
  getShareMessage: () => string;
  clearUnlocked: () => void;
}

function emptySession(): GameSession {
  return { score: 0, territoriesHeld: 0, contestedWins: 0, expansionSpeed: 0, streak: 0, maxStreak: 0, timeSurvived: 0, level: 1, isNewRecord: false };
}

function loadPB(): PersonalBest {
  if (typeof window === "undefined") return { score: 0, territories: 0, date: "" };
  try { const r = localStorage.getItem("tgi_personal_best"); if (r) return JSON.parse(r); } catch {}
  return { score: 0, territories: 0, date: "" };
}

function savePB(pb: PersonalBest) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("tgi_personal_best", JSON.stringify(pb)); } catch {}
}

export function createGameStore(): GameStore {
  let state: GameState = "MENU";
  let territories: Territory[] = [];
  let nations: Nation[] = [];
  let session = emptySession();
  let personalBest = loadPB();
  let seed = Date.now();
  let rivalCount = GAME_CONFIG.baseRivalCount as number;
  let lastClaimTime = 0;
  let timeLeft = GAME_CONFIG.roundDuration as number;
  let isDaily = false;
  let rivalTimers: Record<string, number> = {};
  let lastUnlocked: Achievement[] = [];

  function attemptRivalExpand(rival: Nation) {
    const owned = rival.territories;
    if (!owned.length) return;
    const candidates: number[] = [];
    owned.forEach((tid) => {
      territories[tid].adjacent.forEach((adj) => {
        if (territories[adj].owner !== rival.id && !candidates.includes(adj)) candidates.push(adj);
      });
    });
    if (!candidates.length) return;
    candidates.sort((a, b) => {
      const ta = territories[a], tb = territories[b];
      if (ta.owner === null && tb.owner !== null) return -1;
      if (tb.owner === null && ta.owner !== null) return 1;
      return tb.value - ta.value;
    });
    if (Math.random() > rival.aggression * 0.85) return;
    const targetId = candidates[0];
    const target = territories[targetId];
    const prev = target.owner;
    target.owner = rival.id;
    target.contested = prev === "player";
    if (!rival.territories.includes(targetId)) rival.territories.push(targetId);
    if (prev === "player") {
      const pn = nations.find((n) => n.id === "player")!;
      pn.territories = pn.territories.filter((id) => id !== targetId);
      session.streak = 0;
    } else if (prev) {
      const other = nations.find((n) => n.id === prev);
      if (other) other.territories = other.territories.filter((id) => id !== targetId);
    }
  }

  const store: GameStore = {
    get state() { return state; },
    get territories() { return territories; },
    get nations() { return nations; },
    get session() { return session; },
    get personalBest() { return personalBest; },
    get seed() { return seed; },
    get rivalCount() { return rivalCount; },
    get lastClaimTime() { return lastClaimTime; },
    get timeLeft() { return timeLeft; },
    get isDaily() { return isDaily; },
    get lastUnlocked() { return lastUnlocked; },
    clearUnlocked() { lastUnlocked = []; },

    initGame(isDailyChallenge = false, dailySeed?: number) {
      isDaily = isDailyChallenge;
      lastUnlocked = [];
      if (isDailyChallenge) {
        const daily = loadDailyChallenge();
        seed = dailySeed ?? daily.seed;
        timeLeft = daily.timeLimit;
      } else {
        seed = dailySeed ?? Date.now();
        timeLeft = GAME_CONFIG.roundDuration;
      }
      rivalCount = Math.min(GAME_CONFIG.baseRivalCount + Math.floor(session.level / 3), GAME_CONFIG.maxRivalCount);
      analytics.track(isDailyChallenge ? "daily_challenge_started" : "game_started");
      territories = generateMap(seed);
      const { playerStart, rivals } = assignStartingTerritories(territories, rivalCount, seed);
      const nd = GAME_CONFIG.nations;
      nations = [
        { id: "player", name: nd.player.name, color: nd.player.color, secondaryColor: nd.player.secondary, territories: playerStart, isPlayer: true, aggression: 1, expansionRate: 1 },
        ...rivals.map((r, idx) => ({
          id: r.id, name: nd[r.id].name, color: nd[r.id].color, secondaryColor: nd[r.id].secondary,
          territories: r.starts, isPlayer: false, aggression: 0.7 + idx * 0.15, expansionRate: 0.8 + idx * 0.1,
        })),
      ];
      session = emptySession();
      session.territoriesHeld = playerStart.length;
      lastClaimTime = 0;
      rivalTimers = {};
      rivals.forEach((r) => { rivalTimers[r.id] = 0; });
      state = "COUNTDOWN";
    },

    startCountdown() { state = "COUNTDOWN"; },
    startPlaying() { state = "PLAYING"; },

    claimTerritory(territoryId: number): boolean {
      if (state !== "PLAYING") return false;
      const now = performance.now();
      if (now - lastClaimTime < GAME_CONFIG.claimCooldown) return false;
      const t = territories[territoryId];
      if (!t || t.owner === "player") return false;
      const playerOwned = territories.filter((x) => x.owner === "player").map((x) => x.id);
      if (playerOwned.length > 0 && !t.adjacent.some((adj) => playerOwned.includes(adj))) return false;
      const wasContested = t.owner !== null;
      const previousOwner = t.owner;
      t.owner = "player";
      t.contested = false;
      const playerNation = nations.find((n) => n.id === "player")!;
      if (!playerNation.territories.includes(territoryId)) playerNation.territories.push(territoryId);
      if (previousOwner) {
        const rival = nations.find((n) => n.id === previousOwner);
        if (rival) rival.territories = rival.territories.filter((id) => id !== territoryId);
      }
      session.streak += 1;
      session.maxStreak = Math.max(session.maxStreak, session.streak);
      const streakMult = Math.pow(GAME_CONFIG.streakMultiplierBase, Math.min(session.streak - 1, 12));
      let points = Math.round(GAME_CONFIG.pointsPerTerritory * t.value * streakMult);
      if (wasContested) { session.contestedWins += 1; points += GAME_CONFIG.pointsPerContestedWin; }
      session.score += points;
      session.territoriesHeld = playerNation.territories.length;
      lastClaimTime = now;
      if (session.streak >= 3) audio.play("combo"); else audio.play("claim");
      return true;
    },

    tick(deltaMs: number) {
      if (state !== "PLAYING") return;
      timeLeft -= deltaMs / 1000;
      session.timeSurvived += deltaMs / 1000;
      if (timeLeft <= 0) { timeLeft = 0; this.endGame(); return; }
      nations.filter((n) => !n.isPlayer).forEach((rival) => {
        rivalTimers[rival.id] = (rivalTimers[rival.id] || 0) + deltaMs;
        const interval = GAME_CONFIG.baseExpansionInterval / (rival.expansionRate * (1 + session.level * 0.08));
        if (rivalTimers[rival.id] >= interval) { rivalTimers[rival.id] = 0; attemptRivalExpand(rival); }
      });
    },

    pause() { if (state === "PLAYING") state = "PAUSED"; },
    resume() { if (state === "PAUSED") state = "PLAYING"; },

    endGame() {
      state = "GAME_OVER";
      const held = this.getPlayerTerritoryCount();
      session.territoriesHeld = held;
      const total = territories.length || 1;
      if (session.timeSurvived <= 20 && held >= GAME_CONFIG.speedBonusThreshold) session.score += GAME_CONFIG.speedBonusPoints;
      if (session.score > personalBest.score) {
        session.isNewRecord = true;
        personalBest = { score: session.score, territories: held, date: new Date().toISOString() };
        savePB(personalBest);
        analytics.track("new_high_score", { score: session.score });
      }
      if (isDaily) { recordDailyScore(session.score); analytics.track("daily_challenge_completed", { score: session.score }); }
      lastUnlocked = checkAndUnlock(session, isDaily, held, total);
      submitLocalScore("Commander", session.score, held);
      analytics.track("game_completed", { score: session.score, territories: held, isDaily });
      if (session.isNewRecord) audio.play("record"); else audio.play("fail");
      setTimeout(() => { if (state === "GAME_OVER") state = "RESULTS"; }, 800);
    },

    resetToMenu() {
      state = "MENU";
      territories = [];
      nations = [];
      session = emptySession();
    },

    getPlayerTerritoryCount() {
      return territories.filter((t) => t.owner === "player").length;
    },

    getShareMessage() {
      const held = this.getPlayerTerritoryCount();
      const total = territories.length;
      const pct = total > 0 ? Math.round((held / total) * 100) : 0;
      return `I conquered ${held} regions (${pct}% of the map) and scored ${session.score.toLocaleString()} in The Great Invasion. Can you hold more territory?`;
    },
  };

  return store;
}

let clientStore: GameStore | null = null;

export function getGameStore(): GameStore {
  if (typeof window === "undefined") return createGameStore();
  if (!clientStore) clientStore = createGameStore();
  return clientStore;
}
