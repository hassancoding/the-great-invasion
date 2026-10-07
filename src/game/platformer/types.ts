export type GamePhase = 'menu' | 'playing' | 'paused' | 'won' | 'lost';

export type Rect = { x: number; y: number; w: number; h: number };

export type Player = Rect & {
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  alive: boolean;
};

export type Enemy = Rect & {
  vx: number;
  alive: boolean;
  dir: 1 | -1;
};

export type Coin = Rect & { taken: boolean };
export type Spike = Rect;
export type Goal = Rect;
export type Solid = Rect;

export type LevelState = {
  solids: Solid[];
  coins: Coin[];
  spikes: Spike[];
  enemies: Enemy[];
  goal: Goal | null;
  spawn: { x: number; y: number };
  width: number;
  height: number;
};

export type RunStats = {
  score: number;
  coins: number;
  time: number;
  deaths: number;
  level: number;
};
