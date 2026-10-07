export const GAME_CONFIG = {
  name: "The Great Invasion",
  tagline: "Survive the zone. Command your squad. Secure Iron Gate.",
  version: "2.0.0",

  // Round settings
  roundDuration: 60, // seconds
  countdownDuration: 3,

  // Scoring
  pointsPerTerritory: 100,
  pointsPerContestedWin: 250,
  streakMultiplierBase: 1.15,
  speedBonusThreshold: 8, // territories in first 20s
  speedBonusPoints: 500,

  // Difficulty
  baseRivalCount: 2,
  maxRivalCount: 5,
  baseExpansionInterval: 1800, // ms
  minExpansionInterval: 600,

  // Map
  territoryCount: 24,
  mapAspect: 1.4,

  // Player
  startingTerritories: 3,
  claimCooldown: 280, // ms between claims

  // Visual
  colors: {
    background: "#0a0e17",
    mapBg: "#111827",
    grid: "#1f2937",
    player: "#3b82f6",
    playerSecondary: "#1d4ed8",
    contested: "#f59e0b",
    neutral: "#374151",
  },

  nations: {
    player: { name: "Your Forces", color: "#3b82f6", secondary: "#1d4ed8" },
    red: { name: "Crimson Alliance", color: "#ef4444", secondary: "#b91c1c" },
    blue: { name: "Azure Coalition", color: "#06b6d4", secondary: "#0e7490" },
    green: { name: "Emerald Pact", color: "#22c55e", secondary: "#15803d" },
    yellow: { name: "Solar Empire", color: "#eab308", secondary: "#a16207" },
    purple: { name: "Violet Front", color: "#a855f7", secondary: "#7e22ce" },
  },
} as const;

export const ACHIEVEMENTS_LIST = [
  { id: "first_game", name: "First Deployment", description: "Play your first game", icon: "🎖️" },
  { id: "first_win", name: "First Victory", description: "Control more territory than any rival", icon: "🏆" },
  { id: "new_record", name: "New High Score", description: "Beat your personal best", icon: "📈" },
  { id: "score_1000", name: "Rising Power", description: "Score 1,000 points", icon: "⭐" },
  { id: "score_5000", name: "Regional Power", description: "Score 5,000 points", icon: "🌟" },
  { id: "score_10000", name: "Superpower", description: "Score 10,000 points", icon: "💫" },
  { id: "territories_15", name: "Continental Control", description: "Hold 15+ territories", icon: "🗺️" },
  { id: "streak_5", name: "Blitzkrieg", description: "Claim 5 territories in a row", icon: "⚡" },
  { id: "streak_10", name: "Unstoppable Advance", description: "Claim 10 territories in a row", icon: "🔥" },
  { id: "daily_challenge", name: "Daily Commander", description: "Complete a Daily Challenge", icon: "📅" },
  { id: "perfect_round", name: "Total Domination", description: "Control over 70% of the map", icon: "👑" },
  { id: "speed_master", name: "Rapid Deployment", description: "Claim 8 territories in the first 20 seconds", icon: "🚀" },
] as const;

/** Battle-royale style shrinking zone (PUBG / Free Fire inspired) */
export const ZONE_CONFIG = {
  startRadius: 110,
  phases: [
    { radius: 90, wait: 45, shrink: 25 },
    { radius: 65, wait: 40, shrink: 22 },
    { radius: 42, wait: 35, shrink: 20 },
    { radius: 24, wait: 30, shrink: 18 },
    { radius: 12, wait: 25, shrink: 15 },
    { radius: 5, wait: 20, shrink: 12 },
  ],
} as const;
