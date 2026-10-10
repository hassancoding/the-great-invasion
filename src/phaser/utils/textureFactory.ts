/**
 * Procedural textures matching Game Asset Sheet palettes.
 * Replace with transparent PNG atlases when production sheets land.
 * Specs: Arin 96², small enemies 64², large 128², tiles 32².
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
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Generate all runtime textures into the Phaser texture manager */
export function generateSheetTextures(scene: Phaser.Scene) {
  makeArin(scene);
  makeGraveling(scene);
  makeLegionnaire(scene);
  makeHulk(scene);
  makeReaver(scene);
  makeTile(scene);
  makeWell(scene);
  makeCrystal(scene);
  makeParticle(scene);
  makeSky(scene);
}

function makeArin(scene: Phaser.Scene) {
  const s = 96;
  const g = scene.make.graphics({ x: 0, y: 0 });
  // transparent clear via fill then redraw — use canvas texture
  const tex = scene.textures.createCanvas('arin', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 6, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // legs
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, 58);
  ctx.lineTo(cx - 12, 88);
  ctx.moveTo(cx + 8, 58);
  ctx.lineTo(cx + 14, 88);
  ctx.stroke();
  // boots
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(cx - 12, 90, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 14, 90, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // torso plate (Concord silver-blue)
  const body = ctx.createLinearGradient(cx - 16, 28, cx + 16, 60);
  body.addColorStop(0, '#e0f2fe');
  body.addColorStop(0.35, '#7dd3fc');
  body.addColorStop(0.7, '#0ea5e9');
  body.addColorStop(1, '#0369a1');
  ctx.fillStyle = body;
  rr(ctx, cx - 16, 32, 32, 30, 6);
  ctx.fill();
  // shoulders
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.ellipse(cx - 16, 36, 8, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 16, 36, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // energy blade
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 18, 48);
  ctx.lineTo(cx + 36, 28);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(125,211,252,0.45)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx + 20, 46);
  ctx.lineTo(cx + 34, 30);
  ctx.stroke();
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
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx + 4, 24, 2.5, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function makeGraveling(scene: Phaser.Scene) {
  const s = 64;
  const tex = scene.textures.createCanvas('graveling', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
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
  ctx.ellipse(cx, 38, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 2, 22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b21b6';
  for (let i = 0; i < 3; i++) {
    const sx = 18 + i * 10;
    ctx.beginPath();
    ctx.moveTo(sx, 20);
    ctx.lineTo(sx + 4, 8);
    ctx.lineTo(sx + 8, 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.arc(cx + 6, 22, 4, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function makeLegionnaire(scene: Phaser.Scene) {
  const s = 96;
  const tex = scene.textures.createCanvas('legionnaire', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 6, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(cx, 20, cx, 80);
  body.addColorStop(0, '#7c3aed');
  body.addColorStop(0.5, '#4c1d95');
  body.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = body;
  rr(ctx, cx - 14, 30, 28, 48, 6);
  ctx.fill();
  // helmet
  ctx.fillStyle = '#2e1065';
  ctx.beginPath();
  ctx.ellipse(cx, 28, 16, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#67e8f9';
  ctx.fillRect(cx - 8, 26, 16, 3);
  // shield
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.ellipse(cx - 22, 52, 10, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(165,243,252,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx - 22, 52, 10, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  // spear
  ctx.strokeStyle = '#a5b4fc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 16, 40);
  ctx.lineTo(cx + 34, 22);
  ctx.stroke();
  tex.refresh();
}

function makeHulk(scene: Phaser.Scene) {
  const s = 128;
  const tex = scene.textures.createCanvas('hulk', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, s - 8, 36, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(cx, 20, cx, 110);
  body.addColorStop(0, '#6b7280');
  body.addColorStop(0.3, '#4c1d95');
  body.addColorStop(1, '#0c0a1a');
  ctx.fillStyle = body;
  rr(ctx, cx - 36, 28, 72, 88, 8);
  ctx.fill();
  ctx.fillStyle = '#5b21b6';
  ctx.fillRect(cx - 44, 36, 14, 28);
  ctx.fillRect(cx + 30, 36, 14, 28);
  ctx.fillStyle = 'rgba(192,132,252,0.95)';
  ctx.beginPath();
  ctx.arc(cx, 70, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5d0fe';
  ctx.beginPath();
  ctx.arc(cx, 70, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0abfc';
  ctx.fillRect(cx - 18, 40, 8, 6);
  ctx.fillRect(cx + 10, 40, 8, 6);
  tex.refresh();
}

function makeReaver(scene: Phaser.Scene) {
  const s = 128;
  const tex = scene.textures.createCanvas('elite', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2;
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
  ctx.fillStyle = '#a21caf';
  ctx.beginPath();
  ctx.moveTo(cx - 24, 48);
  ctx.lineTo(cx - 48, 28);
  ctx.lineTo(cx - 16, 60);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 24, 48);
  ctx.lineTo(cx + 48, 28);
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
  ctx.strokeStyle = '#f0abfc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 28, 50);
  ctx.lineTo(cx + 48, 40);
  ctx.moveTo(cx + 28, 60);
  ctx.lineTo(cx + 50, 60);
  ctx.moveTo(cx + 28, 70);
  ctx.lineTo(cx + 46, 80);
  ctx.stroke();
  // core
  ctx.fillStyle = 'rgba(232,121,249,0.9)';
  ctx.beginPath();
  ctx.arc(cx, 64, 8, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function makeTile(scene: Phaser.Scene) {
  const s = 32;
  const tex = scene.textures.createCanvas('tile', s, s);
  if (!tex) return;
  const ctx = tex.getContext();
  const body = ctx.createLinearGradient(0, 0, 0, s);
  body.addColorStop(0, '#6b7c8f');
  body.addColorStop(0.15, '#4b5c6e');
  body.addColorStop(1, '#1e293b');
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#3d8b5a';
  ctx.fillRect(0, 0, s, 5);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, s, 2);
  ctx.fillStyle = 'rgba(56,189,248,0.45)';
  ctx.beginPath();
  ctx.arc(12, 14, 1.5, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function makeWell(scene: Phaser.Scene) {
  const w = 48;
  const h = 64;
  const tex = scene.textures.createCanvas('well', w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx - 16, h - 12, 32, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 20, h - 4, 40, 4);
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
  tex.refresh();
}

function makeCrystal(scene: Phaser.Scene) {
  const s = 32;
  const tex = scene.textures.createCanvas('crystal', s, s);
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
  tex.refresh();
}

function makeParticle(scene: Phaser.Scene) {
  const tex = scene.textures.createCanvas('particle', 8, 8);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.arc(4, 4, 3, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function makeSky(scene: Phaser.Scene) {
  const w = 960;
  const h = 540;
  const tex = scene.textures.createCanvas('sky', w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#060b1a');
  g.addColorStop(0.3, '#0b1630');
  g.addColorStop(0.65, '#12304a');
  g.addColorStop(1, '#0f5c56');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const rx = w * 0.78;
  const ry = h * 0.1;
  const rift = ctx.createRadialGradient(rx, ry, 2, rx, ry, 140);
  rift.addColorStop(0, 'rgba(56,189,248,0.5)');
  rift.addColorStop(0.35, 'rgba(14,165,233,0.2)');
  rift.addColorStop(1, 'rgba(14,165,233,0)');
  ctx.fillStyle = rift;
  ctx.fillRect(rx - 150, ry - 150, 300, 300);
  tex.refresh();
}
