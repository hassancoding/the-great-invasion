import { LEVELS, TILE, type LevelDef } from '@/config/platformerConfig';
import type {
  LevelState,
  Coin,
  Enemy,
  EnemyKind,
  Spike,
  Solid,
  Goal,
  Mover,
  BouncePad,
} from './types';

function makeEnemy(kind: EnemyKind, x: number, y: number): Enemy {
  if (kind === 'graveling') {
    return {
      kind,
      x: x + 6,
      y: y + 10,
      w: 20,
      h: 22,
      vx: 95,
      alive: true,
      dir: 1,
      hp: 1,
      maxHp: 1,
      stun: 0,
      hitFlash: 0,
    };
  }
  if (kind === 'hulk') {
    return {
      kind,
      x: x + 2,
      y: y - 4,
      w: 30,
      h: 36,
      vx: 40,
      alive: true,
      dir: 1,
      hp: 4,
      maxHp: 4,
      stun: 0,
      hitFlash: 0,
    };
  }
  // legionnaire
  return {
    kind: 'legionnaire',
    x: x + 4,
    y: y + 2,
    w: 24,
    h: 30,
    vx: 65,
    alive: true,
    dir: 1,
    hp: 2,
    maxHp: 2,
    stun: 0,
    hitFlash: 0,
  };
}

export function loadLevel(index: number): LevelState {
  const def: LevelDef = LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
  const rows = def.rows;
  const h = rows.length * TILE;
  const w = def.width * TILE;

  const solids: Solid[] = [];
  const coins: Coin[] = [];
  const spikes: Spike[] = [];
  const enemies: Enemy[] = [];
  const movers: Mover[] = [];
  const pads: BouncePad[] = [];
  let goal: Goal | null = null;
  let spawn = { x: TILE, y: h - TILE * 3 };

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r].padEnd(def.width, '.');
    for (let c = 0; c < def.width; c++) {
      const ch = row[c];
      const x = c * TILE;
      const y = r * TILE;
      if (ch === '#') {
        solids.push({ x, y, w: TILE, h: TILE });
      } else if (ch === 'C') {
        coins.push({ x: x + 8, y: y + 8, w: 16, h: 16, taken: false });
      } else if (ch === 'S') {
        spikes.push({ x: x + 4, y: y + 16, w: 24, h: 16 });
      } else if (ch === 'E') {
        enemies.push(makeEnemy('graveling', x, y));
      } else if (ch === 'L') {
        enemies.push(makeEnemy('legionnaire', x, y));
      } else if (ch === 'H') {
        enemies.push(makeEnemy('hulk', x, y));
      } else if (ch === 'G') {
        goal = { x: x + 4, y: y - 16, w: 24, h: 48 };
      } else if (ch === 'P') {
        spawn = { x, y: y - 4 };
      } else if (ch === 'M') {
        const m: Mover = {
          x,
          y,
          w: TILE * 2,
          h: TILE,
          ox: x,
          oy: y,
          rangeX: TILE * 4,
          rangeY: 0,
          speed: 1.1,
          phase: Math.random() * Math.PI * 2,
          px: x,
          py: y,
        };
        movers.push(m);
      } else if (ch === 'V') {
        const m: Mover = {
          x,
          y,
          w: TILE * 2,
          h: TILE,
          ox: x,
          oy: y,
          rangeX: 0,
          rangeY: TILE * 3,
          speed: 0.9,
          phase: Math.random() * Math.PI * 2,
          px: x,
          py: y,
        };
        movers.push(m);
      } else if (ch === 'B') {
        pads.push({ x: x + 2, y: y + 18, w: TILE - 4, h: 14, power: -620 });
      }
    }
  }

  const merged = mergeSolids(solids);

  return {
    solids: merged,
    coins,
    spikes,
    enemies,
    movers,
    pads,
    goal,
    spawn,
    width: w,
    height: h,
  };
}

function mergeSolids(solids: Solid[]): Solid[] {
  const byRow = new Map<number, Solid[]>();
  for (const s of solids) {
    const list = byRow.get(s.y) ?? [];
    list.push(s);
    byRow.set(s.y, list);
  }
  const out: Solid[] = [];
  for (const [, list] of byRow) {
    list.sort((a, b) => a.x - b.x);
    let cur = { ...list[0] };
    for (let i = 1; i < list.length; i++) {
      const n = list[i];
      if (n.x <= cur.x + cur.w + 1 && n.y === cur.y && n.h === cur.h) {
        cur.w = Math.max(cur.x + cur.w, n.x + n.w) - cur.x;
      } else {
        out.push(cur);
        cur = { ...n };
      }
    }
    out.push(cur);
  }
  return out;
}

export function levelCount() {
  return LEVELS.length;
}
