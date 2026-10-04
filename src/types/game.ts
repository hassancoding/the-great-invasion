export type GameState =
  | "LOADING"
  | "MENU"
  | "COUNTDOWN"
  | "PLAYING"
  | "PAUSED"
  | "GAME_OVER"
  | "RESULTS";

export type NationId = "player" | "red" | "blue" | "green" | "yellow" | "purple";

export interface Nation {
  id: NationId;
  name: string;
  color: string;
  secondaryColor: string;
  territories: number[];
  isPlayer: boolean;
  aggression: number;
  expansionRate: number;
}

export interface Territory {
  id: number;
  name: string;
  x: number;
  y: number;
  owner: NationId | null;
  contested: boolean;
  adjacent: number[];
  value: number;
}

export interface GameSession {
  score: number;
  territoriesHeld: number;
  contestedWins: number;
  expansionSpeed: number;
  streak: number;
  maxStreak: number;
  timeSurvived: number;
  level: number;
  isNewRecord: boolean;
}

export interface PersonalBest {
  score: number;
  territories: number;
  date: string;
}

export interface DailyChallenge {
  date: string;
  seed: number;
  mapId: string;
  targetTerritories: number;
  timeLimit: number;
  bestScore: number | null;
  playerScore: number | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
}

export interface ShareResult {
  score: number;
  territories: number;
  percentage: number;
  message: string;
}
