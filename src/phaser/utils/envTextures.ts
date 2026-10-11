import Phaser from 'phaser';

type Theme = 'skybound' | 'verdant' | 'ashfall';

/**
 * High-quality procedural environment layers (not concept-sheet images).
 * Keys: env_far_{theme}, env_mid_{theme}, env_ground_{theme}
 */
export function generateEnvTextures(scene: Phaser.Scene) {
  for (const theme of ['skybound', 'verdant', 'ashfall'] as Theme[]) {
    makeFar(scene, theme);
    makeMid(scene, theme);
    makeGroundStrip(scene, theme);
  }
}

function canvas(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.createCanvas(key, w, h);
}

function makeFar(scene: Phaser.Scene, theme: Theme) {
  const w = 960;
  const h = 540;
  const tex = canvas(scene, `env_far_${theme}`, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  const sky =
    theme === 'verdant'
      ? ['#0c1f14', '#14532d', '#1a3a2a']
      : theme === 'ashfall'
        ? ['#1c0a05', '#7c2d12', '#431407']
        : ['#020617', '#0c4a6e', '#0369a1'];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.45, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Atmospheric glow
  const glowX = theme === 'ashfall' ? w * 0.3 : w * 0.75;
  const rg = ctx.createRadialGradient(glowX, h * 0.15, 10, glowX, h * 0.15, 200);
  rg.addColorStop(
    0,
    theme === 'verdant' ? 'rgba(74,222,128,0.25)' : theme === 'ashfall' ? 'rgba(251,146,60,0.3)' : 'rgba(56,189,248,0.35)'
  );
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);

  // Distant ruin silhouettes
  ctx.fillStyle = 'rgba(15,23,42,0.55)';
  for (let i = 0; i < 6; i++) {
    const bx = 30 + i * 160;
    const by = h * 0.52 + (i % 2) * 20;
    const bw = 90 + (i % 3) * 30;
    const bh = 50 + (i % 4) * 25;
    // pillar / ruin block
    ctx.fillRect(bx + bw * 0.3, by - bh, bw * 0.4, bh);
    ctx.fillRect(bx, by - bh * 0.4, bw, bh * 0.4);
    // arch
    ctx.beginPath();
    ctx.moveTo(bx + 10, by - bh * 0.4);
    ctx.quadraticCurveTo(bx + bw / 2, by - bh * 0.7, bx + bw - 10, by - bh * 0.4);
    ctx.fill();
  }

  // Far mountain ridge
  ctx.fillStyle = 'rgba(2,6,23,0.65)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) {
    const y = h * 0.58 + Math.sin(x * 0.01 + 1) * 35 + Math.cos(x * 0.02) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  tex.refresh();
}

function makeMid(scene: Phaser.Scene, theme: Theme) {
  const w = 960;
  const h = 400;
  const tex = canvas(scene, `env_mid_${theme}`, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);

  const rock =
    theme === 'verdant' ? '#14532d' : theme === 'ashfall' ? '#44403c' : '#334155';
  const moss =
    theme === 'verdant' ? '#4ade80' : theme === 'ashfall' ? '#fb923c' : '#64748b';

  // Cliffs with overgrown edges
  for (let i = 0; i < 5; i++) {
    const x = i * 200 - 20;
    const top = 80 + (i % 3) * 40;
    const cw = 180;
    // cliff body
    const lg = ctx.createLinearGradient(x, top, x, h);
    lg.addColorStop(0, rock);
    lg.addColorStop(1, '#0f172a');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x, top + 40);
    ctx.lineTo(x + 30, top);
    ctx.lineTo(x + cw - 30, top + 10);
    ctx.lineTo(x + cw, top + 50);
    ctx.lineTo(x + cw, h);
    ctx.closePath();
    ctx.fill();
    // moss / glow rim
    ctx.fillStyle = moss;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x + 20, top, cw - 40, 8);
    ctx.globalAlpha = 1;
    // vine strokes
    if (theme !== 'ashfall') {
      ctx.strokeStyle = 'rgba(74,222,128,0.5)';
      ctx.lineWidth = 2;
      for (let v = 0; v < 4; v++) {
        ctx.beginPath();
        ctx.moveTo(x + 40 + v * 30, top + 8);
        ctx.quadraticCurveTo(x + 50 + v * 30, top + 60, x + 35 + v * 30, top + 120);
        ctx.stroke();
      }
    }
    // ruin window holes
    ctx.fillStyle = 'rgba(2,6,23,0.7)';
    ctx.fillRect(x + cw * 0.35, top + 50, 24, 36);
    ctx.fillRect(x + cw * 0.55, top + 55, 18, 28);
  }
  tex.refresh();
}

function makeGroundStrip(scene: Phaser.Scene, theme: Theme) {
  const w = 128;
  const h = 64;
  const tex = canvas(scene, `env_ground_${theme}`, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  const top =
    theme === 'verdant' ? '#4ade80' : theme === 'ashfall' ? '#a8a29e' : '#94a3b8';
  const mid =
    theme === 'verdant' ? '#166534' : theme === 'ashfall' ? '#57534e' : '#475569';
  const bot = '#0f172a';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(0.18, mid);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // stone cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 20);
  ctx.lineTo(40, 28);
  ctx.lineTo(70, 22);
  ctx.moveTo(50, 35);
  ctx.lineTo(90, 42);
  ctx.stroke();
  // grass tufts / embers
  if (theme === 'verdant') {
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 2;
    for (const gx of [16, 40, 64, 96, 112]) {
      ctx.beginPath();
      ctx.moveTo(gx, 14);
      ctx.lineTo(gx - 3, 2);
      ctx.moveTo(gx, 14);
      ctx.lineTo(gx + 3, 3);
      ctx.stroke();
    }
  } else if (theme === 'skybound') {
    ctx.fillStyle = 'rgba(56,189,248,0.4)';
    for (const ax of [24, 56, 88]) {
      ctx.beginPath();
      ctx.arc(ax, 18, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  tex.refresh();
}
