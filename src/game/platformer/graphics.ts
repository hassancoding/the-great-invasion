/**
 * The Great Invasion — Canvas 2D art matching Game Asset Sheet
 * Arin Solwright (Skybound Concord), Dominion roster, Aether Wells, Riftlands tiles.
 * Logic-agnostic draw layer only — signatures preserved for engine compatibility.
 */

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Asset sheet sky: deep navy → cyan horizon (Skybound Concord)
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#060b1a');
  g.addColorStop(0.2, '#0b1630');
  g.addColorStop(0.5, '#12304a');
  g.addColorStop(0.78, '#0e4a5c');
  g.addColorStop(1, '#0f5c56');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Distant aether rift (sheet banner crystal glow)
  const rx = w * 0.78;
  const ry = h * 0.08;
  const rift = ctx.createRadialGradient(rx, ry, 2, rx, ry, 130);
  rift.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
  rift.addColorStop(0.3, 'rgba(14, 165, 233, 0.22)');
  rift.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = rift;
  ctx.fillRect(rx - 140, ry - 140, 280, 280);

  // Stars
  ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
  for (let i = 0; i < 22; i++) {
    const sx = (i * 97 + t * 2.5) % w;
    const sy = (i * 41) % (h * 0.42);
    ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }
}

export function drawParallaxCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cameraX: number,
  t: number
) {
  // Floating citadel islands (asset sheet environments)
  const baseY = h * 0.5;
  for (let i = -1; i < 11; i++) {
    const bx = ((i * 120 - cameraX * 0.09) % (w + 160)) - 60;
    const bh = 32 + ((i * 47) % 78);
    const bw = 70 + (i % 4) * 22;

    // Island body — stone under, grass top suggestion
    ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.lineTo(bx + bw * 0.12, baseY - bh);
    ctx.lineTo(bx + bw * 0.88, baseY - bh * 0.92);
    ctx.lineTo(bx + bw, baseY);
    ctx.lineTo(bx + bw * 0.92, baseY + 20 + (i % 3) * 8);
    ctx.lineTo(bx + bw * 0.08, baseY + 24);
    ctx.closePath();
    ctx.fill();

    // Grass / moss rim
    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.fillRect(bx + bw * 0.12, baseY - bh - 2, bw * 0.76, 4);

    // Crystal tip on some islands (sheet floating citadels)
    if (i % 3 === 0) {
      const cx = bx + bw * 0.5;
      const cy = baseY - bh - 4;
      const cg = ctx.createLinearGradient(cx, cy - 18, cx, cy);
      cg.addColorStop(0, 'rgba(125, 211, 252, 0.9)');
      cg.addColorStop(1, 'rgba(14, 165, 233, 0.35)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      ctx.closePath();
      ctx.fill();
    }

    // Tiny citadel silhouette
    if (i % 4 === 1) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.fillRect(bx + bw * 0.35, baseY - bh - 16, 8, 16);
      ctx.fillRect(bx + bw * 0.48, baseY - bh - 22, 6, 22);
    }
  }

  // Mid haze
  const haze = ctx.createLinearGradient(0, baseY - 24, 0, h);
  haze.addColorStop(0, 'rgba(6, 182, 212, 0)');
  haze.addColorStop(1, 'rgba(6, 182, 212, 0.14)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, baseY - 24, w, h - baseY + 24);
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
  ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.4, y - r * 0.1, r * 0.42, r * 0.24, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.8, y, r * 0.48, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Floating island tile — stone body + moss/grass lip (asset sheet tiles)
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#6b7c8f');
  body.addColorStop(0.1, '#4b5c6e');
  body.addColorStop(0.65, '#334155');
  body.addColorStop(1, '#1e293b');
  ctx.fillStyle = body;
  ctx.fillRect(x, y, w, h);

  // Grass / aether moss top
  ctx.fillStyle = '#3d8b5a';
  ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(x, y, w, 2);

  // Highlight edge
  ctx.fillStyle = 'rgba(226, 232, 240, 0.18)';
  ctx.fillRect(x, y + 5, w, 2);

  // Underside shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(x, y + h - 5, w, 5);

  // Stone seams
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 1;
  for (let tx = x + 32; tx < x + w; tx += 32) {
    ctx.beginPath();
    ctx.moveTo(tx, y + 5);
    ctx.lineTo(tx, y + h - 2);
    ctx.stroke();
  }

  // Cyan rune dots (Concord tech)
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  for (let tx = x + 12; tx < x + w; tx += 32) {
    ctx.beginPath();
    ctx.arc(tx, y + 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Aether crystal collectible (sheet materials / treasure)
  const bob = Math.sin(t * 6 + x * 0.04) * 3;
  const cy = y + bob;

  const glow = ctx.createRadialGradient(x, cy, 2, x, cy, 16);
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
  glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, cy, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, cy);
  const g = ctx.createLinearGradient(-6, -11, 6, 11);
  g.addColorStop(0, '#e0f2fe');
  g.addColorStop(0.35, '#38bdf8');
  g.addColorStop(1, '#0369a1');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(3, -1);
  ctx.lineTo(0, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Corrupted aether spikes (Obsidian Dominion hazard)
  const tips = 3;
  const seg = w / tips;
  for (let i = 0; i < tips; i++) {
    const sx = x + i * seg;
    const g = ctx.createLinearGradient(sx, y, sx, y + h);
    g.addColorStop(0, '#c084fc');
    g.addColorStop(0.45, '#7c3aed');
    g.addColorStop(1, '#3b0764');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + seg / 2, y);
    ctx.lineTo(sx + seg, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
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

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 2, w * 0.42, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === 'graveling') {
    // Sheet: small purple swarm unit, hunched, cyan eye
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#e9d5ff' : '#a78bfa');
    body.addColorStop(0.5, flash ? '#c4b5fd' : '#6d28d9');
    body.addColorStop(1, '#2e1065');
    ctx.fillStyle = body;
    // hunched body
    ctx.beginPath();
    ctx.ellipse(x + w / 2, yy + h * 0.55, w * 0.48, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    // head lump
    ctx.beginPath();
    ctx.arc(x + w / 2 + dir * 2, yy + h * 0.28, w * 0.32, 0, Math.PI * 2);
    ctx.fill();
    // spikes on back
    ctx.fillStyle = flash ? '#ddd6fe' : '#5b21b6';
    for (let i = 0; i < 3; i++) {
      const sx = x + 4 + i * 5;
      ctx.beginPath();
      ctx.moveTo(sx, yy + 8);
      ctx.lineTo(sx + 2.5, yy + 1);
      ctx.lineTo(sx + 5, yy + 8);
      ctx.closePath();
      ctx.fill();
    }
    // cyan eye
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.arc(x + w / 2 + dir * 4, yy + h * 0.28, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e7490';
    ctx.beginPath();
    ctx.arc(x + w / 2 + dir * 4.5, yy + h * 0.28, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'elite') {
    // Sheet: Aether Reaver — upright purple humanoid, energy claws, charge telegraph
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#f5d0fe' : '#c026d3');
    body.addColorStop(0.4, flash ? '#e879f9' : '#86198f');
    body.addColorStop(1, '#4a044e');
    ctx.fillStyle = body;
    roundRect(ctx, x + 2, yy + 8, w - 4, h - 10, 5);
    ctx.fill();
    // shoulders / wing energy
    ctx.fillStyle = flash ? '#f0abfc' : '#a21caf';
    ctx.beginPath();
    ctx.moveTo(x, yy + 12);
    ctx.lineTo(x - 6, yy + 4);
    ctx.lineTo(x + 4, yy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w, yy + 12);
    ctx.lineTo(x + w + 6, yy + 4);
    ctx.lineTo(x + w - 4, yy + 18);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.fillStyle = flash ? '#fae8ff' : '#701a75';
    ctx.beginPath();
    ctx.arc(x + w / 2, yy + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    // crest
    ctx.fillStyle = '#d946ef';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 4, yy + 4);
    ctx.lineTo(x + w / 2, yy - 4);
    ctx.lineTo(x + w / 2 + 4, yy + 4);
    ctx.closePath();
    ctx.fill();
    // eyes
    ctx.fillStyle = '#f0abfc';
    ctx.fillRect(x + w / 2 - 5, yy + 6, 3, 2);
    ctx.fillRect(x + w / 2 + 2, yy + 6, 3, 2);
    // energy core
    const pulse = 0.5 + Math.sin(t * 9) * 0.3;
    ctx.fillStyle = `rgba(232, 121, 249, ${pulse})`;
    ctx.beginPath();
    ctx.arc(x + w / 2, yy + h * 0.5, 4, 0, Math.PI * 2);
    ctx.fill();
    // energy claws
    ctx.strokeStyle = charging ? 'rgba(250, 232, 255, 0.95)' : 'rgba(240, 171, 252, 0.85)';
    ctx.lineWidth = charging ? 3 : 2;
    const clawX = dir > 0 ? x + w + 2 : x - 2;
    ctx.beginPath();
    ctx.moveTo(clawX, yy + 16);
    ctx.lineTo(clawX + dir * (charging ? 16 : 10), yy + 12);
    ctx.moveTo(clawX, yy + 22);
    ctx.lineTo(clawX + dir * (charging ? 18 : 12), yy + 22);
    ctx.moveTo(clawX, yy + 28);
    ctx.lineTo(clawX + dir * (charging ? 14 : 9), yy + 32);
    ctx.stroke();
    // charge telegraph
    if (charging) {
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, yy + h / 2, 22 + Math.sin(t * 20) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'hulk') {
    // Sheet: Obsidian Hulk — bulky purple stone construct, glowing core
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#e9d5ff' : '#6b7280');
    body.addColorStop(0.25, flash ? '#c4b5fd' : '#4c1d95');
    body.addColorStop(0.7, '#1e1b4b');
    body.addColorStop(1, '#0c0a1a');
    ctx.fillStyle = body;
    roundRect(ctx, x, yy + 2, w, h - 2, 4);
    ctx.fill();
    // shoulder plates
    ctx.fillStyle = flash ? '#ddd6fe' : '#5b21b6';
    ctx.fillRect(x - 3, yy + 6, 8, 14);
    ctx.fillRect(x + w - 5, yy + 6, 8, 14);
    // rock cracks
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 6, yy + 10);
    ctx.lineTo(x + 12, yy + 22);
    ctx.lineTo(x + 8, yy + 30);
    ctx.stroke();
    // purple core
    ctx.fillStyle = 'rgba(192, 132, 252, 0.9)';
    ctx.beginPath();
    ctx.arc(x + w / 2, yy + h * 0.45, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5d0fe';
    ctx.beginPath();
    ctx.arc(x + w / 2, yy + h * 0.45, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#f0abfc';
    ctx.fillRect(x + 7, yy + 10, 4, 3);
    ctx.fillRect(x + w - 11, yy + 10, 4, 3);
  } else {
    // Sheet: Shard Legionnaire — armored, shield + weapon, purple/steel
    const body = ctx.createLinearGradient(x, yy, x, yy + h);
    body.addColorStop(0, flash ? '#e9d5ff' : '#7c3aed');
    body.addColorStop(0.45, flash ? '#c4b5fd' : '#4c1d95');
    body.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = body;
    roundRect(ctx, x + 2, yy + 6, w - 4, h - 8, 4);
    ctx.fill();
    // helmet
    ctx.fillStyle = flash ? '#ddd6fe' : '#2e1065';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, yy + 9, w * 0.38, 9, 0, Math.PI, 0);
    ctx.fill();
    // visor glow
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(x + w / 2 - 5, yy + 8, 10, 2);
    // shield (asset sheet: shield on heavy)
    const shieldX = dir > 0 ? x - 4 : x + w - 2;
    ctx.fillStyle = flash ? '#e0e7ff' : '#6366f1';
    ctx.beginPath();
    ctx.ellipse(shieldX + 4, yy + h * 0.5, 6, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(shieldX + 4, yy + h * 0.5, 6, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    // spear tip
    const spearX = dir > 0 ? x + w : x;
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spearX, yy + 12);
    ctx.lineTo(spearX + dir * 10, yy + 4);
    ctx.stroke();
    ctx.fillStyle = '#c4b5fd';
    ctx.beginPath();
    ctx.moveTo(spearX + dir * 10, yy + 4);
    ctx.lineTo(spearX + dir * 14, yy + 2);
    ctx.lineTo(spearX + dir * 10, yy + 8);
    ctx.closePath();
    ctx.fill();
  }

  // HP pips
  if (maxHp > 1 && hp > 0) {
    const pipW = maxHp > 6 ? 4 : 5;
    const total = maxHp * (pipW + 1) - 1;
    let px = x + (w - total) / 2;
    for (let i = 0; i < maxHp; i++) {
      const filled = i < hp;
      ctx.fillStyle = filled
        ? kind === 'elite'
          ? '#e879f9'
          : kind === 'hulk'
            ? '#c084fc'
            : '#67e8f9'
        : 'rgba(15,23,42,0.7)';
      ctx.fillRect(px, y - 6, pipW, 3);
      px += pipW + 1;
    }
  }
}

/** Slash arc — asset sheet combat VFX (cyan Concord energy) */
export function drawSlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  progress: number,
  heavy: boolean
) {
  if (progress <= 0 || progress > 1) return;
  const reach = heavy ? 44 : 32;
  const cx = x + (facing > 0 ? 20 : 4);
  const cy = y + 16;
  const start = facing > 0 ? -1.1 : Math.PI - 0.3;
  const sweep = facing > 0 ? 1.8 : -1.8;
  const a0 = start + sweep * Math.min(1, progress * 1.4);
  const a1 = start + sweep * Math.max(0, progress * 1.4 - 0.35);
  ctx.strokeStyle = heavy
    ? `rgba(165, 243, 252, ${0.95 - progress * 0.55})`
    : `rgba(125, 211, 252, ${0.9 - progress * 0.65})`;
  ctx.lineWidth = heavy ? 6 : 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, reach * (0.7 + progress * 0.3), Math.min(a0, a1), Math.max(a0, a1));
  ctx.stroke();
  // inner white core (sheet combat flash)
  ctx.strokeStyle = `rgba(255,255,255,${0.55 - progress * 0.4})`;
  ctx.lineWidth = heavy ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, reach * 0.82, Math.min(a0, a1), Math.max(a0, a1));
  ctx.stroke();
  if (heavy) {
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 - progress * 0.3})`;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, reach * 0.55, Math.min(a0, a1), Math.max(a0, a1));
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
  // Aether Well / Beacon — matches sheet crystal citadel beacons
  const cx = x + w / 2;
  const pulse = 0.5 + Math.sin(t * 4) * 0.25;

  // Stone plinth
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx - 16, y + h - 12, 32, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 20, y + h - 4, 40, 4);
  // gold/cyan ring (sheet UI accent)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 14, 14, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, y + h - 14, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Rising crystal column
  const col = ctx.createLinearGradient(cx, y, cx, y + h - 14);
  col.addColorStop(0, `rgba(125, 211, 252, ${0.2 + pulse * 0.25})`);
  col.addColorStop(0.45, `rgba(56, 189, 248, ${0.55 + pulse * 0.2})`);
  col.addColorStop(1, 'rgba(224, 242, 254, 0.95)');
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - 6, y + h - 16);
  ctx.lineTo(cx - 4, y + 6);
  ctx.lineTo(cx + 4, y + 6);
  ctx.lineTo(cx + 6, y + h - 16);
  ctx.closePath();
  ctx.fill();

  // Crystal facets
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, y + 6);
  ctx.lineTo(cx, y + h - 16);
  ctx.stroke();

  // Apex crystal
  const orb = ctx.createRadialGradient(cx, y + 4, 1, cx, y + 4, 16);
  orb.addColorStop(0, '#f0f9ff');
  orb.addColorStop(0.35, '#38bdf8');
  orb.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(cx, y + 4, 14, 0, Math.PI * 2);
  ctx.fill();

  // Diamond tip
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.moveTo(cx, y - 6);
  ctx.lineTo(cx + 5, y + 4);
  ctx.lineTo(cx, y + 10);
  ctx.lineTo(cx - 5, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(cx, y + 4, 3 + pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Arin Solwright — Skybound Concord default hero (asset sheet)
 * Silver-blue plate, blue energy blade, brown hair, determined stance.
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

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 1, w * 0.42, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, y + h);
  ctx.scale(f, 1);

  // Legs — dark under-armor
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3.5, -18);
  ctx.lineTo(-4.5 - legSwing, -8 + jumpBend * 2);
  ctx.lineTo(-5.5 - legSwing * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3.5, -18);
  ctx.lineTo(4.5 + legSwing, -8 + jumpBend * 2);
  ctx.lineTo(6.5 + legSwing * 0.5, 0);
  ctx.stroke();
  // boots
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(-5.5 - legSwing * 0.5, 1.5, 5.5, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(6.5 + legSwing * 0.5, 1.5, 5.5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torso — silver-blue Concord plate (sheet Arin)
  const torsoG = ctx.createLinearGradient(-9, -34, 9, -12);
  torsoG.addColorStop(0, '#e0f2fe');
  torsoG.addColorStop(0.25, '#7dd3fc');
  torsoG.addColorStop(0.55, '#0ea5e9');
  torsoG.addColorStop(1, '#0369a1');
  ctx.fillStyle = torsoG;
  roundRect(ctx, -9, -34, 18, 20, 4);
  ctx.fill();

  // Chest plate V
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(-5, -18);
  ctx.moveTo(0, -32);
  ctx.lineTo(5, -18);
  ctx.stroke();

  // Shoulder pads
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.ellipse(-9, -30, 5, 4, -0.3, 0, Math.PI * 2);
  ctx.ellipse(9, -30, 5, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.ellipse(-9, -30, 3, 2.5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(9, -30, 3, 2.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Aether pack (back)
  ctx.fillStyle = '#0c4a6e';
  roundRect(ctx, -12, -30, 5, 14, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.beginPath();
  ctx.arc(-9.5, -24, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-7, -30);
  ctx.lineTo(-11 - walk * 3, -18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, -30);
  ctx.lineTo(12 + walk * 2, -16);
  ctx.stroke();

  // Blue energy blade (sheet Arin sword)
  const bx = 12 + walk * 2;
  const by = -16;
  const blade = ctx.createLinearGradient(bx, by, bx + 14, by - 10);
  blade.addColorStop(0, '#e0f2fe');
  blade.addColorStop(0.4, '#38bdf8');
  blade.addColorStop(1, '#0284c7');
  ctx.strokeStyle = blade;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + 14, by - 10);
  ctx.stroke();
  // blade glow
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(bx + 2, by - 1);
  ctx.lineTo(bx + 12, by - 8);
  ctx.stroke();
  // hilt
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(bx - 2, by - 2, 5, 4);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(bx + 14, by - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headY = -40;
  // hair (brown, short — sheet Arin)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(0, headY - 2, 8, 7, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-7, headY - 4, 14, 5);

  // face
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(0, headY + 1, 7, 0, Math.PI * 2);
  ctx.fill();

  // Concord brow plate
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(-6, headY - 5, 12, 3);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(-2, headY - 8, 4, 3);

  // eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(2.8, headY + 1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(3.2, headY + 0.8, 0.7, 0, Math.PI * 2);
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
  // Floating platform — Concord stone with aether rim
  const pulse = 0.5 + Math.sin(t * 4) * 0.15;
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#94a3b8');
  body.addColorStop(0.2, '#64748b');
  body.addColorStop(1, '#334155');
  ctx.fillStyle = body;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
  ctx.fillRect(x + 4, y + h - 3, w - 8, 3);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.fillRect(x + 2, y + 2, w - 4, 3);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
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
  // Aether bounce pad (sheet ability / environmental)
  const bounce = Math.abs(Math.sin(t * 8)) * 2;
  const yy = y - bounce;
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, x, y + h - 6, w, 6, 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x, yy, x, yy + h);
  g.addColorStop(0, '#bae6fd');
  g.addColorStop(0.5, '#38bdf8');
  g.addColorStop(1, '#0284c7');
  ctx.fillStyle = g;
  roundRect(ctx, x + 2, yy, w - 4, h - 4, 3);
  ctx.fill();
  ctx.fillStyle = '#f0f9ff';
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
