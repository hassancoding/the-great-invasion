/**
 * Higher-fidelity Canvas 2D art for Bolt Hop.
 * Stylized-realistic courier character + polished environment (no external assets).
 */

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0b1220');
  g.addColorStop(0.35, '#1e3a5f');
  g.addColorStop(0.7, '#3b82c4');
  g.addColorStop(1, '#93c5fd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const sx = w * 0.78;
  const sy = h * 0.12;
  const sun = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90);
  sun.addColorStop(0, 'rgba(254, 243, 199, 0.95)');
  sun.addColorStop(0.4, 'rgba(251, 191, 36, 0.35)');
  sun.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(sx - 100, sy - 100, 200, 200);
}

export function drawParallaxCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cameraX: number,
  t: number
) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  const baseY = h * 0.55;
  for (let i = -1; i < 12; i++) {
    const bx = ((i * 90 - cameraX * 0.12) % (w + 120)) - 40;
    const bh = 40 + ((i * 37) % 80);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(bx, baseY - bh, 50 + (i % 3) * 12, bh + h);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
    for (let wy = baseY - bh + 8; wy < baseY - 10; wy += 12) {
      for (let wx = bx + 6; wx < bx + 40; wx += 10) {
        if ((wx + wy) % 23 < 14) ctx.fillRect(wx, wy, 4, 5);
      }
    }
  }

  const haze = ctx.createLinearGradient(0, baseY - 30, 0, h);
  haze.addColorStop(0, 'rgba(125, 211, 252, 0)');
  haze.addColorStop(1, 'rgba(125, 211, 252, 0.25)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, baseY - 30, w, h - baseY + 30);
}

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  cameraX: number,
  t: number
) {
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 160 - cameraX * 0.18 + t * 6) % (w + 160)) - 50;
    const cy = 28 + (i % 4) * 36;
    const s = 0.7 + (i % 3) * 0.25;
    drawSoftCloud(ctx, cx, cy, 48 * s);
  }
}

function drawSoftCloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r * 0.32, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.4, y - r * 0.12, r * 0.45, r * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.85, y, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.35, y + r * 0.08, r * 0.5, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.2, y - r * 0.15, r * 0.3, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#64748b');
  body.addColorStop(0.15, '#475569');
  body.addColorStop(1, '#334155');
  ctx.fillStyle = body;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
  ctx.fillRect(x, y + h - 5, w, 5);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.lineWidth = 1;
  for (let tx = x + 32; tx < x + w; tx += 32) {
    ctx.beginPath();
    ctx.moveTo(tx, y + 2);
    ctx.lineTo(tx, y + h - 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  for (let tx = x + 8; tx < x + w; tx += 32) {
    ctx.beginPath();
    ctx.arc(tx, y + 10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 6 + x * 0.04) * 3;
  const cy = y + bob;
  const glow = ctx.createRadialGradient(x, cy, 2, x, cy, 16);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
  glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, cy, 16, 0, Math.PI * 2);
  ctx.fill();
  const squash = 0.85 + Math.sin(t * 4) * 0.08;
  ctx.save();
  ctx.translate(x, cy);
  ctx.scale(squash, 1);
  const coin = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
  coin.addColorStop(0, '#fef3c7');
  coin.addColorStop(0.5, '#fbbf24');
  coin.addColorStop(1, '#d97706');
  ctx.fillStyle = coin;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);
  ctx.restore();
}

export function drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const tips = 3;
  const seg = w / tips;
  for (let i = 0; i < tips; i++) {
    const sx = x + i * seg;
    const g = ctx.createLinearGradient(sx, y, sx, y + h);
    g.addColorStop(0, '#fda4af');
    g.addColorStop(1, '#e11d48');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + seg / 2, y);
    ctx.lineTo(sx + seg, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(127, 29, 29, 0.6)';
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
  t: number
) {
  const bounce = Math.abs(Math.sin(t * 9)) * 2;
  const yy = y + bounce;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 2, w * 0.4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(x, yy, x, yy + h);
  body.addColorStop(0, '#f87171');
  body.addColorStop(1, '#b91c1c');
  ctx.fillStyle = body;
  roundRect(ctx, x, yy + 4, w, h - 4, 6);
  ctx.fill();
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, yy + 8, w * 0.42, 10, 0, Math.PI, 0);
  ctx.fill();
  const ex = dir > 0 ? x + w - 12 : x + 4;
  ctx.fillStyle = '#fef2f2';
  ctx.beginPath();
  ctx.arc(ex + 4, yy + 14, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(ex + 4 + dir * 1.5, yy + 14, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, yy + 2);
  ctx.lineTo(x + w / 2, yy - 6);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x + w / 2, yy - 7, 3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGoal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
) {
  const pole = ctx.createLinearGradient(x + w / 2 - 3, y, x + w / 2 + 3, y);
  pole.addColorStop(0, '#cbd5e1');
  pole.addColorStop(1, '#64748b');
  ctx.fillStyle = pole;
  ctx.fillRect(x + w / 2 - 3, y, 6, h);
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + w / 2 - 10, y + h - 6, 20, 6);
  const wave = Math.sin(t * 5) * 4;
  const fg = ctx.createLinearGradient(x + w / 2, y, x + w / 2 + 28, y + 20);
  fg.addColorStop(0, '#4ade80');
  fg.addColorStop(1, '#16a34a');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 3, y + 6);
  ctx.quadraticCurveTo(x + w / 2 + 18, y + 10 + wave, x + w / 2 + 28, y + 14 + wave * 0.5);
  ctx.lineTo(x + w / 2 + 3, y + 26);
  ctx.closePath();
  ctx.fill();
  const glow = ctx.createRadialGradient(x + w / 2, y + 8, 2, x + w / 2, y + 8, 28);
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
  glow.addColorStop(1, 'rgba(74, 222, 128, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 8, 28, 0, Math.PI * 2);
  ctx.fill();
}

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
  const armSwing = walk * 6;
  const jumpBend = !onGround ? 1 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 1, w * 0.42, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, y + h);
  ctx.scale(f, 1);

  const legY = -10;
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, legY - 8);
  ctx.lineTo(-4 - legSwing, legY + 2 + jumpBend * 2);
  ctx.lineTo(-5 - legSwing * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, legY - 8);
  ctx.lineTo(4 + legSwing, legY + 2 + jumpBend * 2);
  ctx.lineTo(6 + legSwing * 0.5, 0);
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(-5 - legSwing * 0.5, 1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(6 + legSwing * 0.5, 1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const torsoG = ctx.createLinearGradient(-8, -28, 8, -8);
  torsoG.addColorStop(0, '#38bdf8');
  torsoG.addColorStop(1, '#0284c7');
  ctx.fillStyle = torsoG;
  roundRect(ctx, -9, -30, 18, 20, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.fillStyle = '#0ea5e9';
  roundRect(ctx, -7, -28, 8, 12, 2);
  ctx.fill();
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(-6, -26, 6, 3);

  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-7, -26);
  ctx.lineTo(-10 - armSwing * 0.3, -18);
  ctx.lineTo(-11 - armSwing, -10 + jumpBend * 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, -26);
  ctx.lineTo(10 + armSwing * 0.3, -18);
  ctx.lineTo(12 + armSwing, -10 + jumpBend * 3);
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(-11 - armSwing, -9 + jumpBend * 3, 3, 0, Math.PI * 2);
  ctx.arc(12 + armSwing, -9 + jumpBend * 3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-2.5, -34, 5, 5);

  const headY = -42;
  const skin = ctx.createRadialGradient(-2, headY - 2, 1, 0, headY, 10);
  skin.addColorStop(0, '#fde68a');
  skin.addColorStop(1, '#d97706');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, headY, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(0, headY - 4, 9.5, 7, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-9, headY - 6, 18, 4);
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(2, headY - 3);
  ctx.lineTo(14, headY - 1);
  ctx.lineTo(2, headY + 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(3, headY, 3.2, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(3.8, headY + 0.3, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(4.2, headY - 0.4, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, headY - 4);
  ctx.lineTo(7, headY - 3.5);
  ctx.stroke();

  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(3, headY + 4, 2.5, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(-8, headY, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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
