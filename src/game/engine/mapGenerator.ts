import { Territory, NationId } from "@/types/game";
import { GAME_CONFIG } from "@/config/gameConfig";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMap(seed: number = Date.now()): Territory[] {
  const rand = seededRandom(seed);
  const count = GAME_CONFIG.territoryCount;
  const territories: Territory[] = [];

  const cols = 6;
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (rand() - 0.5) * 0.08;
    const jitterY = (rand() - 0.5) * 0.08;
    const x = (col + 0.5) / cols + jitterX;
    const y = (row + 0.5) / rows + jitterY;
    const clampedX = Math.max(0.05, Math.min(0.95, x));
    const clampedY = Math.max(0.08, Math.min(0.92, y));
    const distFromCenter = Math.hypot(clampedX - 0.5, clampedY - 0.5);
    const value = Math.max(1, Math.round(5 - distFromCenter * 6));

    territories.push({
      id: i,
      name: `Sector ${String.fromCharCode(65 + col)}${row + 1}`,
      x: clampedX,
      y: clampedY,
      owner: null,
      contested: false,
      adjacent: [],
      value,
    });
  }

  for (let i = 0; i < count; i++) {
    const distances: { id: number; dist: number }[] = [];
    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const dx = territories[i].x - territories[j].x;
      const dy = territories[i].y - territories[j].y;
      distances.push({ id: j, dist: Math.hypot(dx, dy) });
    }
    distances.sort((a, b) => a.dist - b.dist);
    const linkCount = 3 + Math.floor(rand() * 3);
    territories[i].adjacent = distances.slice(0, linkCount).map((d) => d.id);
  }

  for (const t of territories) {
    for (const adj of t.adjacent) {
      if (!territories[adj].adjacent.includes(t.id)) {
        territories[adj].adjacent.push(t.id);
      }
    }
  }

  return territories;
}

export function assignStartingTerritories(
  territories: Territory[],
  rivalCount: number,
  seed: number
): { playerStart: number[]; rivals: { id: NationId; starts: number[] }[] } {
  const rand = seededRandom(seed + 999);
  const available = [...Array(territories.length).keys()];
  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  shuffle(available);

  const playerStart = available.splice(0, GAME_CONFIG.startingTerritories);

  const rivalIds: NationId[] = (["red", "blue", "green", "yellow", "purple"] as NationId[]).slice(0, rivalCount);
  const rivals = rivalIds.map((id) => {
    const starts = available.splice(0, 2 + Math.floor(rand() * 2));
    return { id, starts };
  });

  playerStart.forEach((id) => {
    territories[id].owner = "player";
  });
  rivals.forEach((r) => {
    r.starts.forEach((id) => {
      territories[id].owner = r.id;
    });
  });

  return { playerStart, rivals };
}
