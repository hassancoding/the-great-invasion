export type GamePhase = 'menu' | 'playing' | 'paused' | 'won' | 'lost';

export type Rect = { x: number; y: number; w: number; h: number };

export type Player = Rect & {
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  alive: boolean;
};

/** Dominion roster — P1 combat + P3 elite */
export type EnemyKind = 'graveling' | 'legionnaire' | 'hulk' | 'elite';

export type Enemy = Rect & {
  kind: EnemyKind;
  vx: number;
  alive: boolean;
  dir: 1 | -1;
  hp: number;
  maxHp: number;
  /** stun timer after hit */
  stun: number;
  /** flash white on hit */
  hitFlash: number;
  /** elite charge cooldown / windup */
  chargeCd?: number;
  charging?: boolean;
};

export type Coin = Rect & { taken: boolean };
export type Spike = Rect;
export type Goal = Rect;
export type Solid = Rect;

/** Moving platform: oscillates between origin and origin+range */
export type Mover = Rect & {
  ox: number;
  oy: number;
  rangeX: number;
  rangeY: number;
  speed: number;
  phase: number;
  /** previous frame position for carry */
  px: number;
  py: number;
};

/** Bounce pad launches player upward */
export type BouncePad = Rect & { power: number };

export type LevelState = {
  solids: Solid[];
  coins: Coin[];
  spikes: Spike[];
  enemies: Enemy[];
  movers: Mover[];
  pads: BouncePad[];
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

export type AttackKind = 'light' | 'heavy';
