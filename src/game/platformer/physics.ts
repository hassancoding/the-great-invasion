import type { Rect, Solid } from './types';

export function aabb(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Move rect with velocity against solids. Returns resolved position + grounded flag */
export function moveAndCollide(
  body: Rect,
  vx: number,
  vy: number,
  solids: Solid[],
  dt: number
): { x: number; y: number; vx: number; vy: number; onGround: boolean } {
  let x = body.x;
  let y = body.y;
  let onGround = false;

  // Horizontal
  x += vx * dt;
  const hb = { x, y, w: body.w, h: body.h };
  for (const s of solids) {
    if (!aabb(hb, s)) continue;
    if (vx > 0) x = s.x - body.w;
    else if (vx < 0) x = s.x + s.w;
    vx = 0;
    hb.x = x;
  }

  // Vertical
  y += vy * dt;
  const vb = { x, y, w: body.w, h: body.h };
  for (const s of solids) {
    if (!aabb(vb, s)) continue;
    if (vy > 0) {
      y = s.y - body.h;
      onGround = true;
    } else if (vy < 0) {
      y = s.y + s.h;
    }
    vy = 0;
    vb.y = y;
  }

  return { x, y, vx, vy, onGround };
}
