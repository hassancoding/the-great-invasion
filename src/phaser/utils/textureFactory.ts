/**
 * Procedural textures matching Game Asset Sheet.
 * Multi-frame sheets for Arin + Dominion roster; biome tiles; FX; HUD.
 * Specs: Arin 96², small enemies 64², large 128², tiles 32².
 * Swap for transparent PNG atlases when production sheets land.
 */
import Phaser from 'phaser';

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function canvas(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.createCanvas(key, w, h);
}

/** Generate all runtime textures + register animations */
export function generateSheetTextures(scene: Phaser.Scene) {
  makeArinSheet(scene);
  makeGravelingSheet(scene);
  makeLegionnaireSheet(scene);
  makeHulkSheet(scene);
  makeReaverSheet(scene);
  makeTiles(scene);
  makeWell(scene);
  makeCrystal(scene);
  makeSlashFx(scene);
  makeParticle(scene);
  makeSkyVariants(scene);
  makeHud(scene);
  makeProps(scene);
  registerAnimations(scene);
}

// ─── Arin Solwright 96×96 × frames (idle/run/jump/atk) ─────

function drawArinFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  pose: 'idle' | 'run0' | 'run1' | 'jump' | 'atk' | 'heavy'
) {
  const s = 96;
  const cx = ox + s / 2;
  ctx.clearRect(ox, 0, s, s);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 6, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  let legL = 0, legR = 0, armSwing = 0, bladeExt = 14;
  if (pose === 'run0') { legL = -6; legR = 6; armSwing = 4; }
  if (pose === 'run1') { legL = 6; legR = -6; armSwing = -4; }
  if (pose === 'jump') { legL = -4; legR = 4; }
  if (pose === 'atk') { armSwing = 10; bladeExt = 22; }
  if (pose === 'heavy') { armSwing = 12; bladeExt = 26; }

  // legs
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, 58);
  ctx.lineTo(cx - 12 + legL, 88);
  ctx.moveTo(cx + 8, 58);
  ctx.lineTo(cx + 14 + legR, 88);
  ctx.stroke();
  // boots
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(cx - 12 + legL, 90, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 14 + legR, 90, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // torso — Concord silver-blue plate
  const body = ctx.createLinearGradient(cx - 16, 28, cx + 16, 60);
  body.addColorStop(0, '#e0f2fe');
  body.addColorStop(0.35, '#7dd3fc');
  body.addColorStop(0.7, '#0ea5e9');
  body.addColorStop(1, '#0369a1');
  ctx.fillStyle = body;
  rr(ctx, cx - 16, 32, 32, 30, 6);
  ctx.fill();
  // chest V
  ctx.strokeStyle = 'rgba(224,242,254,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, 34);
  ctx.lineTo(cx - 6, 52);
  ctx.moveTo(cx, 34);
  ctx.lineTo(cx + 6, 52);
  ctx.stroke();
  // shoulders
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.ellipse(cx - 16, 36, 8, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 16, 36, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // aether pack
  ctx.fillStyle = '#0c4a6e';
  rr(ctx, cx - 22, 36, 8, 16, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(56,189,248,0.9)';
  ctx.beginPath();
  ctx.arc(cx - 18, 44, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // arms
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx - 12, 40);
  ctx.lineTo(cx - 18 - armSwing * 0.3, 56);
  ctx.moveTo(cx + 12, 40);
  ctx.lineTo(cx + 18 + armSwing * 0.5, 52);
  ctx.stroke();

  // energy blade
  const bx = cx + 18 + armSwing * 0.5;
  const by = 52;
  ctx.strokeStyle = 'rgba(125,211,252,0.4)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bladeExt * 0.7, by - bladeExt * 0.7);
  ctx.stroke();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bladeExt * 0.75, by - bladeExt * 0.75);
  ctx.stroke();
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(bx + bladeExt * 0.75, by - bladeExt * 0.75, 3, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(cx, 22, 12, 10, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(cx, 24, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(cx - 10, 16, 20, 4);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(cx - 3, 12, 6, 4);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx + 4, 24, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cx + 5, 23.5, 1, 0, Math.PI * 2);
  ctx.fill();
}

function makeArinSheet(scene: Phaser.Scene) {
  const fw = 96;
  const poses: Array<'idle' | 'run0' | 'run1' | 'jump' | 'atk' | 'heavy'> = [
    'idle', 'run0', 'run1', 'jump', 'atk', 'heavy',
  ];
  const tex = canvas(scene, 'arin_sheet', fw * poses.length, fw);
  if (!tex) return;
  const ctx = tex.getContext();
  poses.forEach((p, i) => drawArinFrame(ctx, i * fw, p));
  tex.refresh();
  // single-frame fallback key
  const single = canvas(scene, 'arin', fw, fw);
  if (single) {
    drawArinFrame(single.getContext(), 0, 'idle');
    single.refresh();
  }
}

// ─── Graveling 64×64 × 2 ───────────────────────────────────

function drawGraveling(ctx: CanvasRenderingContext2D, ox: number, frame: number) {
  const s = 64;
  const cx = ox + s / 2;
  const bob = frame === 1 ? 2 : 0;
  ctx.clearRect(ox, 0, s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 4, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(cx, 16, cx, 56);
  body.addColorStop(0, '#a78bfa');
  body.addColorStop(0.5, '#6d28d9');
  body.addColorStop(1, '#2e1065');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(cx, 38 + bob, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 2, 22 + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b21b6';
  for (let i = 0; i < 3; i++) {
    const sx = ox + 18 + i * 10;
    ctx.beginPath();
    ctx.moveTo(sx, 20 + bob);
    ctx.lineTo(sx + 4, 8 + bob);
    ctx.lineTo(sx + 8, 20 + bob);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.arc(cx + 6, 22 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0e7490';
  ctx.beginPath();
  ctx.arc(cx + 7, 22 + bob, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function makeGravelingSheet(scene: Phaser.Scene) {
  const fw = 64;
  const tex = canvas(scene, 'graveling_sheet', fw * 2, fw);
  if (!tex) return;
  const ctx = tex.getContext();
  drawGraveling(ctx, 0, 0);
  drawGraveling(ctx, fw, 1);
  tex.refresh();
  const single = canvas(scene, 'graveling', fw, fw);
  if (single) {
    drawGraveling(single.getContext(), 0, 0);
    single.refresh();
  }
}

// ─── Legionnaire 96×96 × 2 ─────────────────────────────────

function drawLegionnaire(ctx: CanvasRenderingContext2D, ox: number, frame: number) {
  const s = 96;
  const cx = ox + s / 2;
  const bob = frame === 1 ? 1 : 0;
  ctx.clearRect(ox, 0, s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 6, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(cx, 20, cx, 80);
  body.addColorStop(0, '#7c3aed');
  body.addColorStop(0.5, '#4c1d95');
  body.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = body;
  rr(ctx, cx - 14, 30 + bob, 28, 48, 6);
  ctx.fill();
  ctx.fillStyle = '#2e1065';
  ctx.beginPath();
  ctx.ellipse(cx, 28 + bob, 16, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#67e8f9';
  ctx.fillRect(cx - 8, 26 + bob, 16, 3);
  // shield
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.ellipse(cx - 22, 52 + bob, 10, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(165,243,252,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx - 22, 52 + bob, 10, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  // spear
  const spearTip = frame === 1 ? 6 : 0;
  ctx.strokeStyle = '#a5b4fc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 16, 40 + bob);
  ctx.lineTo(cx + 34 + spearTip, 22 + bob - spearTip);
  ctx.stroke();
  ctx.fillStyle = '#c4b5fd';
  ctx.beginPath();
  ctx.moveTo(cx + 34 + spearTip, 22 + bob - spearTip);
  ctx.lineTo(cx + 40 + spearTip, 18 + bob - spearTip);
  ctx.lineTo(cx + 34 + spearTip, 28 + bob - spearTip);
  ctx.closePath();
  ctx.fill();
}

function makeLegionnaireSheet(scene: Phaser.Scene) {
  const fw = 96;
  const tex = canvas(scene, 'legionnaire_sheet', fw * 2, fw);
  if (!tex) return;
  const ctx = tex.getContext();
  drawLegionnaire(ctx, 0, 0);
  drawLegionnaire(ctx, fw, 1);
  tex.refresh();
  const single = canvas(scene, 'legionnaire', fw, fw);
  if (single) {
    drawLegionnaire(single.getContext(), 0, 0);
    single.refresh();
  }
}

// ─── Hulk 128×128 × 2 ──────────────────────────────────────

function drawHulk(ctx: CanvasRenderingContext2D, ox: number, frame: number) {
  const s = 128;
  const cx = ox + s / 2;
  const bob = frame === 1 ? 2 : 0;
  ctx.clearRect(ox, 0, s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 8, 36, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(cx, 20, cx, 110);
  body.addColorStop(0, '#6b7280');
  body.addColorStop(0.3, '#4c1d95');
  body.addColorStop(1, '#0c0a1a');
  ctx.fillStyle = body;
  rr(ctx, cx - 36, 28 + bob, 72, 88, 8);
  ctx.fill();
  ctx.fillStyle = '#5b21b6';
  ctx.fillRect(cx - 44, 36 + bob, 14, 28);
  ctx.fillRect(cx + 30, 36 + bob, 14, 28);
  ctx.strokeStyle = 'rgba(167,139,250,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, 40 + bob);
  ctx.lineTo(cx - 8, 70 + bob);
  ctx.lineTo(cx - 16, 95 + bob);
  ctx.stroke();
  ctx.fillStyle = 'rgba(192,132,252,0.95)';
  ctx.beginPath();
  ctx.arc(cx, 70 + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5d0fe';
  ctx.beginPath();
  ctx.arc(cx, 70 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0abfc';
  ctx.fillRect(cx - 18, 40 + bob, 8, 6);
  ctx.fillRect(cx + 10, 40 + bob, 8, 6);
}

function makeHulkSheet(scene: Phaser.Scene) {
  const fw = 128;
  const tex = canvas(scene, 'hulk_sheet', fw * 2, fw);
  if (!tex) return;
  const ctx = tex.getContext();
  drawHulk(ctx, 0, 0);
  drawHulk(ctx, fw, 1);
  tex.refresh();
  const single = canvas(scene, 'hulk', fw, fw);
  if (single) {
    drawHulk(single.getContext(), 0, 0);
    single.refresh();
  }
}

// ─── Aether Reaver 128×128 × 3 (idle / charge / strike) ────

function drawReaver(ctx: CanvasRenderingContext2D, ox: number, frame: number) {
  const s = 128;
  const cx = ox + s / 2;
  const charging = frame === 1;
  const strike = frame === 2;
  ctx.clearRect(ox, 0, s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 8, 28, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(cx, 24, cx, 110);
  body.addColorStop(0, '#c026d3');
  body.addColorStop(0.4, '#86198f');
  body.addColorStop(1, '#4a044e');
  ctx.fillStyle = body;
  rr(ctx, cx - 24, 36, 48, 70, 8);
  ctx.fill();
  // wing energy
  ctx.fillStyle = charging ? '#f0abfc' : '#a21caf';
  ctx.beginPath();
  ctx.moveTo(cx - 24, 48);
  ctx.lineTo(cx - (charging ? 56 : 48), 28);
  ctx.lineTo(cx - 16, 60);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 24, 48);
  ctx.lineTo(cx + (charging ? 56 : 48), 28);
  ctx.lineTo(cx + 16, 60);
  ctx.closePath();
  ctx.fill();
  // head + crest
  ctx.fillStyle = '#701a75';
  ctx.beginPath();
  ctx.arc(cx, 32, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d946ef';
  ctx.beginPath();
  ctx.moveTo(cx - 8, 24);
  ctx.lineTo(cx, 8);
  ctx.lineTo(cx + 8, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0abfc';
  ctx.fillRect(cx - 10, 28, 6, 4);
  ctx.fillRect(cx + 4, 28, 6, 4);
  // claws
  const clawReach = strike ? 22 : charging ? 16 : 12;
  ctx.strokeStyle = charging || strike ? '#fae8ff' : '#f0abfc';
  ctx.lineWidth = charging ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(cx + 28, 50);
  ctx.lineTo(cx + 28 + clawReach, 40);
  ctx.moveTo(cx + 28, 60);
  ctx.lineTo(cx + 28 + clawReach + 2, 60);
  ctx.moveTo(cx + 28, 70);
  ctx.lineTo(cx + 28 + clawReach, 80);
  ctx.stroke();
  // core
  const pulse = charging ? 10 : 8;
  ctx.fillStyle = charging ? 'rgba(250,232,255,0.95)' : 'rgba(232,121,249,0.9)';
  ctx.beginPath();
  ctx.arc(cx, 64, pulse, 0, Math.PI * 2);
  ctx.fill();
  if (charging) {
    ctx.strokeStyle = 'rgba(232,121,249,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 64, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function makeReaverSheet(scene: Phaser.Scene) {
  const fw = 128;
  const tex = canvas(scene, 'elite_sheet', fw * 3, fw);
  if (!tex) return;
  const ctx = tex.getContext();
  drawReaver(ctx, 0, 0);
  drawReaver(ctx, fw, 1);
  drawReaver(ctx, fw * 2, 2);
  tex.refresh();
  const single = canvas(scene, 'elite', fw, fw);
  if (single) {
    drawReaver(single.getContext(), 0, 0);
    single.refresh();
  }
}

// ─── Tiles (skybound / verdant / obsidian / ashfall) ───────

function makeTiles(scene: Phaser.Scene) {
  const s = 32;
  const variants: { key: string; top: string; mid: string; bot: string; accent: string }[] = [
    { key: 'tile', top: '#4ade80', mid: '#3d8b5a', bot: '#1e293b', accent: 'rgba(56,189,248,0.45)' },
    { key: 'tile_skybound', top: '#94a3b8', mid: '#64748b', bot: '#1e293b', accent: 'rgba(56,189,248,0.55)' },
    { key: 'tile_verdant', top: '#4ade80', mid: '#166534', bot: '#14532d', accent: 'rgba(74,222,128,0.4)' },
    { key: 'tile_obsidian', top: '#a78bfa', mid: '#4c1d95', bot: '#1e1b4b', accent: 'rgba(192,132,252,0.5)' },
    { key: 'tile_ashfall', top: '#fb923c', mid: '#7c2d12', bot: '#1c1917', accent: 'rgba(251,146,60,0.45)' },
  ];
  for (const v of variants) {
    const tex = canvas(scene, v.key, s, s);
    if (!tex) continue;
    const ctx = tex.getContext();
    const body = ctx.createLinearGradient(0, 0, 0, s);
    body.addColorStop(0, v.mid);
    body.addColorStop(0.2, v.mid);
    body.addColorStop(1, v.bot);
    ctx.fillStyle = body;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = v.top;
    ctx.fillRect(0, 0, s, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 0, s, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, s - 4, s, 4);
    ctx.fillStyle = v.accent;
    ctx.beginPath();
    ctx.arc(12, 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
    tex.refresh();
  }
}

function makeWell(scene: Phaser.Scene) {
  const w = 48;
  const h = 64;
  const tex = canvas(scene, 'well', w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx - 16, h - 12, 32, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 20, h - 4, 40, 4);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, h - 14, 14, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(250,204,21,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, h - 14, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  const col = ctx.createLinearGradient(cx, 8, cx, h - 14);
  col.addColorStop(0, 'rgba(125,211,252,0.3)');
  col.addColorStop(0.5, 'rgba(56,189,248,0.7)');
  col.addColorStop(1, 'rgba(224,242,254,0.95)');
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - 6, h - 16);
  ctx.lineTo(cx - 4, 12);
  ctx.lineTo(cx + 4, 12);
  ctx.lineTo(cx + 6, h - 16);
  ctx.closePath();
  ctx.fill();
  const orb = ctx.createRadialGradient(cx, 12, 1, cx, 12, 16);
  orb.addColorStop(0, '#f0f9ff');
  orb.addColorStop(0.4, '#38bdf8');
  orb.addColorStop(1, 'rgba(14,165,233,0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(cx, 12, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.moveTo(cx, 2);
  ctx.lineTo(cx + 5, 12);
  ctx.lineTo(cx, 16);
  ctx.lineTo(cx - 5, 12);
  ctx.closePath();
  ctx.fill();
  tex.refresh();
}

function makeCrystal(scene: Phaser.Scene) {
  const s = 32;
  const tex = canvas(scene, 'crystal', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  const cy = s / 2;
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
  glow.addColorStop(0, 'rgba(56,189,248,0.5)');
  glow.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(cx - 6, cy - 10, cx + 6, cy + 10);
  g.addColorStop(0, '#e0f2fe');
  g.addColorStop(0.4, '#38bdf8');
  g.addColorStop(1, '#0369a1');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11);
  ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx, cy + 11);
  ctx.lineTo(cx - 7, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 3, cy - 1);
  ctx.lineTo(cx, cy + 1);
  ctx.closePath();
  ctx.fill();
  tex.refresh();
}

function makeSlashFx(scene: Phaser.Scene) {
  const s = 64;
  for (const [key, color] of [
    ['slash_fx', '#67e8f9'],
    ['slash_fx_heavy', '#e0f2fe'],
  ] as const) {
    const tex = canvas(scene, key, s, s);
    if (!tex) continue;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = color;
    ctx.lineWidth = key.includes('heavy') ? 6 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 22, -1.0, 1.0);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 18, -0.8, 0.8);
    ctx.stroke();
    tex.refresh();
  }
}

function makeParticle(scene: Phaser.Scene) {
  for (const [key, color] of [
    ['particle', '#67e8f9'],
    ['particle_purple', '#e879f9'],
    ['particle_orange', '#fb923c'],
  ] as const) {
    const tex = canvas(scene, key, 8, 8);
    if (!tex) continue;
    const ctx = tex.getContext();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(4, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    tex.refresh();
  }
}

function makeSkyVariants(scene: Phaser.Scene) {
  const w = 960;
  const h = 540;
  const skies: { key: string; stops: [number, string][] }[] = [
    {
      key: 'sky',
      stops: [
        [0, '#060b1a'],
        [0.3, '#0b1630'],
        [0.65, '#12304a'],
        [1, '#0f5c56'],
      ],
    },
    {
      key: 'sky_obsidian',
      stops: [
        [0, '#0c0a1a'],
        [0.4, '#1e1b4b'],
        [0.7, '#3b0764'],
        [1, '#4c1d95'],
      ],
    },
    {
      key: 'sky_ashfall',
      stops: [
        [0, '#1c0a0a'],
        [0.4, '#431407'],
        [0.75, '#7c2d12'],
        [1, '#9a3412'],
      ],
    },
  ];
  for (const sky of skies) {
    const tex = canvas(scene, sky.key, w, h);
    if (!tex) continue;
    const ctx = tex.getContext();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    for (const [p, c] of sky.stops) g.addColorStop(p, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // rift glow
    const rx = w * 0.78;
    const ry = h * 0.1;
    const rift = ctx.createRadialGradient(rx, ry, 2, rx, ry, 140);
    rift.addColorStop(0, 'rgba(56,189,248,0.5)');
    rift.addColorStop(0.35, 'rgba(14,165,233,0.2)');
    rift.addColorStop(1, 'rgba(14,165,233,0)');
    ctx.fillStyle = rift;
    ctx.fillRect(rx - 150, ry - 150, 300, 300);
    // far floating islands
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    for (let i = 0; i < 8; i++) {
      const bx = 40 + i * 120;
      const by = h * 0.48 + (i % 3) * 18;
      const bw = 70 + (i % 4) * 20;
      const bh = 30 + (i % 3) * 16;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw * 0.15, by - bh);
      ctx.lineTo(bx + bw * 0.85, by - bh * 0.9);
      ctx.lineTo(bx + bw, by);
      ctx.closePath();
      ctx.fill();
    }
    tex.refresh();
  }
}

function makeHud(scene: Phaser.Scene) {
  // heart icon
  const heart = canvas(scene, 'hud_heart', 24, 24);
  if (heart) {
    const ctx = heart.getContext();
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.moveTo(12, 20);
    ctx.bezierCurveTo(4, 14, 2, 8, 6, 5);
    ctx.bezierCurveTo(9, 3, 12, 6, 12, 6);
    ctx.bezierCurveTo(12, 6, 15, 3, 18, 5);
    ctx.bezierCurveTo(22, 8, 20, 14, 12, 20);
    ctx.fill();
    heart.refresh();
  }
  // crystal icon small
  const cry = canvas(scene, 'hud_crystal', 16, 16);
  if (cry) {
    const ctx = cry.getContext();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(8, 1);
    ctx.lineTo(14, 8);
    ctx.lineTo(8, 15);
    ctx.lineTo(2, 8);
    ctx.closePath();
    ctx.fill();
    cry.refresh();
  }
}

function makeProps(scene: Phaser.Scene) {
  // barrel
  const barrel = canvas(scene, 'prop_barrel', 32, 40);
  if (barrel) {
    const ctx = barrel.getContext();
    ctx.fillStyle = '#78350f';
    rr(ctx, 4, 4, 24, 32, 4);
    ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 10, 20, 3);
    ctx.strokeRect(6, 24, 20, 3);
    barrel.refresh();
  }
  // crate
  const crate = canvas(scene, 'prop_crate', 36, 36);
  if (crate) {
    const ctx = crate.getContext();
    ctx.fillStyle = '#a16207';
    ctx.fillRect(2, 2, 32, 32);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 32, 32);
    ctx.beginPath();
    ctx.moveTo(2, 18);
    ctx.lineTo(34, 18);
    ctx.moveTo(18, 2);
    ctx.lineTo(18, 34);
    ctx.stroke();
    crate.refresh();
  }
  // banner
  const banner = canvas(scene, 'prop_banner', 24, 48);
  if (banner) {
    const ctx = banner.getContext();
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 0, 4, 48);
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(14, 4);
    ctx.lineTo(24, 10);
    ctx.lineTo(14, 28);
    ctx.closePath();
    ctx.fill();
    banner.refresh();
  }
}

function registerAnimations(scene: Phaser.Scene) {
  const anims = scene.anims;
  const add = (key: string, sheet: string, fw: number, fh: number, frames: number[], rate: number, repeat = -1) => {
    if (anims.exists(key)) return;
    // Build frame textures as separate canvas crops via addSpriteSheet-like approach
    // Phaser canvas textures: use generateFrameNumbers after addSpriteSheet
    if (!scene.textures.exists(sheet)) return;
    // Ensure sheet is treated as spritesheet
    const tex = scene.textures.get(sheet);
    if (!tex) return;
    // Manually add frames if needed
    const totalW = tex.source[0]?.width ?? 0;
    const count = Math.floor(totalW / fw) || 1;
    for (let i = 0; i < count; i++) {
      const fname = `${sheet}_f${i}`;
      if (!tex.has(fname)) {
        tex.add(fname, 0, i * fw, 0, fw, fh);
      }
    }
    anims.create({
      key,
      frames: frames.map((i) => ({ key: sheet, frame: `${sheet}_f${i}` })),
      frameRate: rate,
      repeat,
    });
  };

  add('arin_idle', 'arin_sheet', 96, 96, [0], 4, -1);
  add('arin_run', 'arin_sheet', 96, 96, [1, 2], 10, -1);
  add('arin_jump', 'arin_sheet', 96, 96, [3], 8, 0);
  add('arin_attack', 'arin_sheet', 96, 96, [4], 12, 0);
  add('arin_heavy', 'arin_sheet', 96, 96, [5], 10, 0);

  add('graveling_walk', 'graveling_sheet', 64, 64, [0, 1], 6, -1);
  add('legionnaire_walk', 'legionnaire_sheet', 96, 96, [0, 1], 5, -1);
  add('hulk_walk', 'hulk_sheet', 128, 128, [0, 1], 4, -1);
  add('elite_idle', 'elite_sheet', 128, 128, [0], 4, -1);
  add('elite_charge', 'elite_sheet', 128, 128, [1], 6, -1);
  add('elite_strike', 'elite_sheet', 128, 128, [2], 8, 0);
}
