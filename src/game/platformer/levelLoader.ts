import { LEVELS, TILE, type LevelDef } from '@/config/platformerConfig';
import type { LevelState, Coin, Enemy, Spike, Solid, Goal } from './types';

export function loadLevel(index: number): LevelState {
  const def: LevelDef = LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
  const rows = def.rows;
  const h = rows.length * TILE;
  const w = def.width * TILE;

  const solids: Solid[] = [];
  const coins: Coin[] = [];
  const spikes: Spike[] = [];
  const enemies: Enemy[] = [];
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
        enemies.push({ x: x + 4, y: y + 4, w: 24, h: 28, vx: 60, alive: true, dir: 1 });
      } else if (ch === 'G') {
        goal = { x: x + 4, y: y - 16, w: 24, h: 48 };
      } else if (ch === 'P') {
        spawn = { x, y: y - 4 };
      }
    }
  }

  const merged = mergeSolids(solids);

  return {
    solids: merged,
    coins,
    spikes,
    enemies,
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
