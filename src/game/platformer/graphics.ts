/**
 * Riftlands Canvas 2D art — The Great Invasion (P0)
 * Floating islands, cyan aether, Arin scout, Dominion foes, Aether Wells.
 */

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Deep rift void → cyan horizon
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#050814');
  g.addColorStop(0.25, '#0c1228');
  g.addColorStop(0.55, '#12203a');
  g.addColorStop(0.8, '#0e3a4a');
  g.addColorStop(1, '#134e4a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Distant aether rift glow
  const rx = w * 0.72;
  const ry = h * 0.1;
  const rift = ctx.createRadialGradient(rx, ry, 2, rx, ry, 110);
  rift.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
  rift.addColorStop(0.35, 'rgba(6, 182, 212, 0.2)');
  rift.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = rift;
  ctx.fillRect(rx - 120, ry - 120, 240, 240);

  // Subtle stars
  ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
  for (let i = 0; i < 18; i++) {
    const sx = ((i * 97 + t * 3) % w);
    const sy = (i * 37) % (h * 0.45);
    ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
  }
}

export function drawParallaxCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cameraX: number,
  t: number
) {
  // Floating island silhouettes (far)
  const baseY = h * 0.52;
  for (let i = -1; i < 10; i++) {
    const bx = ((i * 110 - cameraX * 0.1) % (w + 140)) - 50;
    const bh = 28 + ((i * 41) % 70);
    const bw = 60 + (i % 4) * 18;

    // Island body
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.lineTo(bx + bw * 0.15, baseY - bh);
    ctx.lineTo(bx + bw * 0.85, baseY - bh * 0.9);
    ctx.lineTo(bx + bw, baseY);
    ctx.lineTo(bx + bw * 0.9, baseY + 18 + (i % 3) * 10);
    ctx.lineTo(bx + bw * 0.1, baseY + 22);
    ctx.closePath();
    ctx.fill();

    // Aether crystal tip
    if (i % 3 === 0) {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.5, baseY - bh - 12);
      ctx.lineTo(bx + bw * 0.42, baseY - bh);
      ctx.lineTo(bx + bw * 0.58, baseY - bh);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Mid void haze
  const haze = ctx.createLinearGradient(0, baseY - 20, 0, h);
  haze.addColorStop(0, 'rgba(6, 182, 212, 0)');
  haze.addColorStop(1, 'rgba(6, 182, 212, 0.12)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, baseY - 20, w, h - baseY + 20);
}

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  cameraX: number,
  t: number
) {
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 170 - cameraX * 0.16 + t * 5) % (w + 170)) - 50;
    const cy = 24 + (i % 4) * 32;
    const s = 0.65 + (i % 3) * 0.22;
    drawSoftCloud(ctx, cx, cy, 44 * s);
  }
}

function drawSoftCloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.4, y - r * 0.1, r * 0.42, r * 0.24, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.8, y, r * 0.48, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Rift-stone platform
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#64748b');
  body.addColorStop(0.12, '#475569');
  body.addColorStop(0.7, '#334155');
  body.addColorStop(1, '#1e293b');
  ctx.fillStyle = body;
  ctx.fillRect(x, y, w, h);

  // Aether vein on top edge
  ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.fillRect(x, y, w, 3);

  ctx.fillStyle = 'rgba(226, 232, 240, 0.2)';
  ctx.fillRect(x, y + 3, w, 2);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fillRect(x, y + h - 5, w, 5);

  // Stone seams
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 1;
  for (let tx = x + 32; tx < x + w; tx += 32) {
    ctx.beginPath();
    ctx.moveTo(tx, y + 3);
    ctx.lineTo(tx, y + h - 2);
    ctx.stroke();
  }

  // Cyan rune dots
  ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
  for (let tx = x + 10; tx < x + w; tx += 32) {
    ctx.beginPath();
    ctx.arc(tx, y + 10, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Aether crystal
  const bob = Math.sin(t * 6 + x * 0.04) * 3;
  const cy = y + bob;

  const glow = ctx.createRadialGradient(x, cy, 2, x, cy, 16);
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.5)');
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, cy, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, cy);
  // Crystal diamond
  const g = ctx.createLinearGradient(-6, -10, 6, 10);
  g.addColorStop(0, '#ecfeff');
  g.addColorStop(0.4, '#22d3ee');
  g.addColorStop(1, '#0e7490');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 11);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // facet
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(3, -1);
  ctx.lineTo(0, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const tips = 3;
  const seg = w / tips;
  for (let i = 0; i < tips; i++) {
    const sx = x + i * seg;
    const g = ctx.createLinearGradient(sx, y, sx, y + h);
    g.addColorStop(0, '#a5f3fc');
    g.addColorStop(0.4, '#67e8f9');
    g.addColorStop(1, '#0e7490');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + seg / 2, y);
    ctx.lineTo(sx + seg, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(22, 78, 99, 0.7)';
    ctx.stroke();
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: number,
  t: number,
  kind: 'graveling' | 'legionnaire' | 'hulk' | 'elite' = 'legionnaire',
  hp = 1,
  maxHp = 1,
  hitFlash = 0,
  charging = false
) {
  const bounce =
    Math.abs(Math.sin(t * (kind === 'hulk' || kind === 'elite' ? 5 : 9))) *
    (kind === 'hulk' || kind === 'elite' ? 1 : 2);
  const yy = y + bounce;
  const flash = hitFlash > 0;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 2, w * 0.4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === 'graveling') {
    // Small fast swarm unit
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#e7e5e4' : '#78716c');
    body.addColorStop(1, flash ? '#a8a29e' : '#292524');
    ctx.fillStyle = body;
    roundRect(ctx, x, yy + 2, w, h - 2, 4);
    ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(x + w / 2 + dir * 3, yy + 10, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'elite') {
    // Orun Reaver Captain — taller, horned helm, ember core, charge telegraph
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#fecaca' : '#7f1d1d');
    body.addColorStop(0.35, flash ? '#fca5a5' : '#450a0a');
    body.addColorStop(1, '#1c0a0a');
    ctx.fillStyle = body;
    roundRect(ctx, x, yy + 4, w, h - 4, 5);
    ctx.fill();
    // horned helm
    ctx.fillStyle = flash ? '#e7e5e4' : '#292524';
    ctx.beginPath();
    ctx.moveTo(x + 4, yy + 14);
    ctx.lineTo(x + w * 0.5, yy - 4);
    ctx.lineTo(x + w - 4, yy + 14);
    ctx.closePath();
    ctx.fill();
    // horns
    ctx.strokeStyle = flash ? '#fef2f2' : '#f97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 6, yy + 8);
    ctx.lineTo(x - 2, yy - 2);
    ctx.moveTo(x + w - 6, yy + 8);
    ctx.lineTo(x + w + 2, yy - 2);
    ctx.stroke();
    // ember core
    const pulse = 0.55 + Math.sin(t * 8) * 0.25;
    ctx.fillStyle = `rgba(251, 146, 60, ${pulse})`;
    ctx.beginPath();
    ctx.arc(x + w / 2, yy + h * 0.48, 6, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 8, yy + 16, 5, 3);
    ctx.fillRect(x + w - 13, yy + 16, 5, 3);
    // charge telegraph slash
    if (charging) {
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const cx = x + (dir > 0 ? w + 6 : -6);
      ctx.moveTo(cx, yy + 10);
      ctx.lineTo(cx + dir * 18, yy + h * 0.5);
      ctx.lineTo(cx, yy + h - 8);
      ctx.stroke();
    }
  } else if (kind === 'hulk') {
    // Heavy armored construct
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#e7e5e4' : '#44403c');
    body.addColorStop(0.4, flash ? '#a8a29e' : '#1c1917');
    body.addColorStop(1, '#0c0a09');
    ctx.fillStyle = body;
    roundRect(ctx, x, yy + 2, w, h - 2, 4);
    ctx.fill();
    // shoulder plates
    ctx.fillStyle = flash ? '#d6d3d1' : '#57534e';
    ctx.fillRect(x - 2, yy + 6, 6, 12);
    ctx.fillRect(x + w - 4, yy + 6, 6, 12);
    // cyan core
    ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.beginPath();
    ctx.arc(x + w / 2, yy + h * 0.45, 5, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#f87171';
    ctx.fillRect(x + 6, yy + 10, 4, 3);
    ctx.fillRect(x + w - 10, yy + 10, 4, 3);
  } else {
    // Legionnaire — standard
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#e7e5e4' : '#57534e');
    body.addColorStop(0.5, flash ? '#a8a29e' : '#292524');
    body.addColorStop(1, '#1c1917');
    ctx.fillStyle = body;
    roundRect(ctx, x, yy + 4, w, h - 4, 5);
    ctx.fill();
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, yy + 8, w * 0.4, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, yy + 12);
    ctx.lineTo(x + w * 0.5, yy + 22);
    ctx.lineTo(x + w * 0.65, yy + 16);
    ctx.stroke();
    const ex = dir > 0 ? x + w - 11 : x + 5;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(ex + 3, yy + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#083344';
    ctx.beginPath();
    ctx.arc(ex + 3 + dir * 1.2, yy + 14, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP pips for multi-hit foes
  if (maxHp > 1 && hp > 0) {
    const pipW = maxHp > 6 ? 4 : 5;
    const total = maxHp * (pipW + 1) - 1;
    let px = x + (w - total) / 2;
    for (let i = 0; i < maxHp; i++) {
      ctx.fillStyle = i < hp ? (kind === 'elite' ? '#fb923c' : '#22d3ee') : 'rgba(15,23,42,0.7)';
      ctx.fillRect(px, y - 6, pipW, 3);
      px += pipW + 1;
    }
  }
}

/** Slash arc in front of player */
export function drawSlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  progress: number,
  heavy: boolean
) {
  if (progress <= 0 || progress > 1) return;
  const reach = heavy ? 42 : 30;
  const cx = x + (facing > 0 ? 20 : 4);
  const cy = y + 16;
  const start = facing > 0 ? -1.1 : Math.PI - 0.3;
  const sweep = facing > 0 ? 1.8 : -1.8;
  const a0 = start + sweep * Math.min(1, progress * 1.4);
  const a1 = start + sweep * Math.max(0, progress * 1.4 - 0.35);
  ctx.strokeStyle = heavy ? `rgba(165, 243, 252, ${0.9 - progress * 0.6})` : `rgba(125, 211, 252, ${0.85 - progress * 0.7})`;
  ctx.lineWidth = heavy ? 5 : 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, reach * (0.7 + progress * 0.3), Math.min(a0, a1), Math.max(a0, a1));
  ctx.stroke();
  if (heavy) {
    ctx.strokeStyle = `rgba(255,255,255,${0.5 - progress * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, reach * 0.85, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
  }
}

export function drawGoal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
) {
  // Aether Well — stone base + rising cyan column
  const cx = x + w / 2;
  const pulse = 0.5 + Math.sin(t * 4) * 0.25;

  // Base plinth
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 14, y + h - 10, 28, 10);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 18, y + h - 4, 36, 4);

  // Well ring
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Rising aether column
  const col = ctx.createLinearGradient(cx, y, cx, y + h - 12);
  col.addColorStop(0, `rgba(34, 211, 238, ${0.15 + pulse * 0.2})`);
  col.addColorStop(0.5, `rgba(6, 182, 212, ${0.45 + pulse * 0.2})`);
  col.addColorStop(1, 'rgba(165, 243, 252, 0.8)');
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - 5, y + h - 14);
  ctx.quadraticCurveTo(cx - 8 - pulse * 4, y + h * 0.4, cx - 3, y + 4);
  ctx.lineTo(cx + 3, y + 4);
  ctx.quadraticCurveTo(cx + 8 + pulse * 4, y + h * 0.4, cx + 5, y + h - 14);
  ctx.closePath();
  ctx.fill();

  // Core orb
  const orb = ctx.createRadialGradient(cx, y + 8, 1, cx, y + 8, 14);
  orb.addColorStop(0, '#ecfeff');
  orb.addColorStop(0.4, '#22d3ee');
  orb.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(cx, y + 8, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ecfeff';
  ctx.beginPath();
  ctx.arc(cx, y + 8, 4 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Arin Solwright — Skybound Concord scout (default hero)
 */
export function drawCourier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  facing: number,
  onGround: boolean,
  vx: number,
  t: number
) {
  const f = facing >= 0 ? 1 : -1;
  const cx = x + w / 2;
  const moving = onGround && Math.abs(vx) > 25;
  const walk = moving ? Math.sin(t * 14) : 0;
  const legSwing = walk * 7;
  const jumpBend = !onGround ? 1 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 1, w * 0.42, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, y + h);
  ctx.scale(f, 1);

  // Legs — dark tactical
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -18);
  ctx.lineTo(-4 - legSwing, -8 + jumpBend * 2);
  ctx.lineTo(-5 - legSwing * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -18);
  ctx.lineTo(4 + legSwing, -8 + jumpBend * 2);
  ctx.lineTo(6 + legSwing * 0.5, 0);
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(-5 - legSwing * 0.5, 1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(6 + legSwing * 0.5, 1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso — Concord sky-blue armor
  const torsoG = ctx.createLinearGradient(-8, -32, 8, -10);
  torsoG.addColorStop(0, '#38bdf8');
  torsoG.addColorStop(0.5, '#0ea5e9');
  torsoG.addColorStop(1, '#0369a1');
  ctx.fillStyle = torsoG;
  roundRect(ctx, -9, -32, 18, 18, 4);
  ctx.fill();

  // Chest plate highlight
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(0, -16);
  ctx.stroke();

  // Aether pack
  ctx.fillStyle = '#0c4a6e';
  roundRect(ctx, -11, -28, 6, 12, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
  ctx.beginPath();
  ctx.arc(-8, -22, 2, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-7, -28);
  ctx.lineTo(-10 - walk * 4, -18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, -28);
  ctx.lineTo(11 + walk * 3, -16);
  ctx.stroke();

  // Energy blade (aether lance shortened)
  ctx.strokeStyle = '#a5f3fc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11 + walk * 3, -16);
  ctx.lineTo(18 + walk * 3, -22);
  ctx.stroke();
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(18 + walk * 3, -22, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headY = -36;
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(0, headY, 7, 0, Math.PI * 2);
  ctx.fill();

  // Concord helm stripe
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(-6, headY - 7, 12, 3);
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.moveTo(-2, headY - 7);
  ctx.lineTo(0, headY - 12);
  ctx.lineTo(2, headY - 7);
  ctx.closePath();
  ctx.fill();

  // Face
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(2.5, headY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawMover(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
) {
  const pulse = 0.5 + Math.sin(t * 4) * 0.15;
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#94a3b8');
  body.addColorStop(0.2, '#64748b');
  body.addColorStop(1, '#334155');
  ctx.fillStyle = body;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.fillStyle = `rgba(34, 211, 238, ${0.35 + pulse * 0.4})`;
  ctx.fillRect(x + 4, y + h - 3, w - 8, 3);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.fillRect(x + 2, y + 2, w - 4, 3);
  ctx.fillStyle = 'rgba(34, 211, 238, 0.45)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 8 + i * 18, y + 8, 10, 3);
  }
}

export function drawBouncePad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
) {
  const bounce = Math.abs(Math.sin(t * 8)) * 2;
  const yy = y - bounce;
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, x, y + h - 6, w, 6, 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x, yy, x, yy + h);
  g.addColorStop(0, '#a5f3fc');
  g.addColorStop(1, '#0891b2');
  ctx.fillStyle = g;
  roundRect(ctx, x + 2, yy, w - 4, h - 4, 3);
  ctx.fill();
  ctx.fillStyle = '#ecfeff';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, yy + 2);
  ctx.lineTo(x + w / 2 - 5, yy + 9);
  ctx.lineTo(x + w / 2 + 5, yy + 9);
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
