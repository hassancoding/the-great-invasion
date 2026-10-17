/** Riftlands — full campaign runner. No Phaser. Canvas only. */

export type Phase = "menu" | "play" | "pause" | "dead" | "win" | "ad";

type Kind = "graveling" | "legion" | "hulk" | "boss";

interface Plat {
  x: number;
  y: number;
  w: number;
  h: number;
  well?: boolean;
  spike?: boolean;
  move?: number;
  baseY: number;
}

interface Foe {
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  max: number;
  vx: number;
  vy: number;
  hurt: number;
  cd: number;
  dead: boolean;
  dir: number;
}

interface Sector {
  name: string;
  sky0: string;
  sky1: string;
  rock: string;
  grass: string;
  accent: string;
  length: number;
  plats: Plat[];
  foes: Foe[];
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  max: number;
  face: number;
  on: boolean;
  jumps: number;
  dash: number;
  atk: number;
  atkKind: 0 | 1;
  inv: number;
  anim: number;
  coyote: number;
  buf: number;
}

const W = 1280;
const H = 720;
const GRAV = 2200;
const BEST_KEY = "riftlands-best-v1";

const NAMES = [
  "Halcyon Spire",
  "Verdant Scar",
  "Obsidian Depths",
  "Trade Isles",
  "Heart of the Rift",
];

const PAL = [
  { sky0: "#67b7ff", sky1: "#e7f6ff", rock: "#5c6b78", grass: "#3e9a4a", accent: "#f5c96a" },
  { sky0: "#1d8a62", sky1: "#b7f0c8", rock: "#3d5344", grass: "#1f7a3a", accent: "#d6ff6a" },
  { sky0: "#14081f", sky1: "#3a2158", rock: "#2a2438", grass: "#6a4a2a", accent: "#c084fc" },
  { sky0: "#0e4d6e", sky1: "#9ad7f0", rock: "#6a5438", grass: "#c4a15a", accent: "#7dd3fc" },
  { sky0: "#2a0610", sky1: "#7a2030", rock: "#3a2428", grass: "#8a3038", accent: "#fb7185" },
];

function buildSector(i: number): Sector {
  const pal = PAL[i]!;
  const plats: Plat[] = [];
  let x = 40;
  let y = 500;
  const steps = 22 + i * 3;
  for (let n = 0; n < steps; n++) {
    const w = 160 + ((n * 37 + i * 13) % 5) * 28;
    const gap = 78 + i * 16 + (n % 3) * 14;
    const dy = ((n * (3 + i) + i) % 5) - 2;
    y = Math.max(300, Math.min(540, y + dy * (28 + i * 2)));
    const spike = i >= 2 && n % 7 === 4;
    if (spike) {
      plats.push({ x: x + w + 8, y: 640, w: Math.max(40, gap - 24), h: 24, spike: true, baseY: 640 });
    }
    const move = i === 3 && n % 4 === 2 ? 46 : 0;
    plats.push({ x, y, w, h: 28, move, baseY: y });
    x += w + gap;
  }
  const wellX = x + 40;
  plats.push({ x: wellX, y: 470, w: 320, h: 28, well: true, baseY: 470 });
  const foes: Foe[] = [];
  for (let n = 2; n < steps - 1; n += i === 4 ? 3 : 4) {
    const p = plats[n];
    if (!p || p.spike || p.well) continue;
    const roll = (n + i * 5) % 10;
    const kind: Kind = i === 4 && n > steps - 5 ? "boss" : roll > 7 && i > 1 ? "hulk" : roll > 4 && i > 0 ? "legion" : "graveling";
    if (kind === "boss" && foes.some((f) => f.kind === "boss")) continue;
    foes.push(makeFoe(kind, p.x + p.w * 0.45, p.y));
  }
  if (i === 4 && !foes.some((f) => f.kind === "boss")) {
    foes.push(makeFoe("boss", wellX - 180, 470));
  }
  return { name: NAMES[i]!, ...pal, length: wellX + 360, plats, foes };
}

function makeFoe(kind: Kind, x: number, platY: number): Foe {
  const spec = {
    graveling: { w: 42, h: 36, hp: 2, vx: 70 },
    legion: { w: 46, h: 58, hp: 3, vx: 40 },
    hulk: { w: 72, h: 70, hp: 7, vx: 28 },
    boss: { w: 110, h: 120, hp: 16, vx: 0 },
  }[kind];
  return {
    kind,
    x,
    y: platY - spec.h,
    w: spec.w,
    h: spec.h,
    hp: spec.hp,
    max: spec.hp,
    vx: spec.vx,
    vy: 0,
    hurt: 0,
    cd: 0.6,
    dead: false,
    dir: -1,
  };
}

function rects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function startRiftlands(host: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.background = "#020617";
  canvas.tabIndex = 0;
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const keys = new Set<string>();
  let holdWell = false;
  const touch = { left: false, right: false, jump: false, atk: false, dash: false, well: false };

  const bg = new Image();
  bg.src = "/assets/menu/bg.jpg";
  const hero = new Image();
  hero.src = "/assets/menu/hero.png";

  let phase: Phase = "menu";
  let sectorI = 0;
  let sector = buildSector(0);
  let camX = 0;
  let time = 0;
  let score = 0;
  let combo = 0;
  let comboT = 0;
  let stars = 0;
  let well = 0;
  let killed = 0;
  let hitsTaken = 0;
  let revives = 1;
  let adT = 0;
  let banner = "";
  let bannerT = 0;
  let best = 0;
  try {
    best = Number(localStorage.getItem(BEST_KEY) || 0);
  } catch {
    best = 0;
  }

  const player: Player = {
    x: 80,
    y: 200,
    vx: 0,
    vy: 0,
    w: 36,
    h: 62,
    hp: 5,
    max: 5,
    face: 1,
    on: false,
    jumps: 0,
    dash: 0,
    atk: 0,
    atkKind: 0,
    inv: 0,
    anim: 0,
    coyote: 0,
    buf: 0,
  };

  function resetRun(keepScore = false) {
    sectorI = 0;
    sector = buildSector(0);
    Object.assign(player, { x: 90, y: 200, vx: 0, vy: 0, hp: 5, face: 1, dash: 0, atk: 0, inv: 0, jumps: 0 });
    if (!keepScore) {
      score = 0;
      killed = 0;
      hitsTaken = 0;
      stars = 0;
      revives = 1;
    }
    combo = 0;
    well = 0;
    camX = 0;
    banner = sector.name;
    bannerT = 2.4;
  }

  function nextSector() {
    stars += player.hp >= 4 ? 1 : 0;
    stars += hitsTaken === 0 ? 1 : 0;
    stars += 1;
    score += 1000 + sectorI * 250;
    if (sectorI >= 4) {
      phase = "win";
      saveBest();
      return;
    }
    sectorI += 1;
    sector = buildSector(sectorI);
    player.x = 90;
    player.y = 180;
    player.vx = 0;
    player.vy = 0;
    well = 0;
    banner = sector.name;
    bannerT = 2.4;
  }

  function saveBest() {
    if (score > best) {
      best = score;
      try {
        localStorage.setItem(BEST_KEY, String(best));
      } catch {
        /* ignore */
      }
    }
  }

  function hurtPlayer(n: number) {
    if (player.inv > 0 || phase !== "play") return;
    player.hp -= n;
    hitsTaken += 1;
    combo = 0;
    player.inv = 0.8;
    player.vy = -280;
    player.vx = -player.face * 220;
    well = Math.max(0, well - 0.35);
    if (player.hp <= 0) {
      player.hp = 0;
      saveBest();
      phase = "dead";
    }
  }

  function tryJump() {
    player.buf = 0.12;
  }

  function doAttack(heavy: boolean) {
    if (player.atk > 0 || phase !== "play") return;
    player.atk = heavy ? 0.32 : 0.18;
    player.atkKind = heavy ? 1 : 0;
  }

  function tryDash() {
    if (player.dash > 0.4 || phase !== "play") return;
    player.dash = 0.16;
    player.vx = player.face * 620;
    player.inv = Math.max(player.inv, 0.16);
  }

  function share() {
    const text = `I scored ${score} in The Great Invasion: Riftlands (${sector.name}). Stars ${stars}. Can you reclaim the Aether Well?`;
    const url = "https://the-great-invasion.vercel.app";
    if (navigator.share) {
      navigator.share({ title: "Riftlands", text, url }).catch(() => undefined);
    } else {
      navigator.clipboard?.writeText(`${text} ${url}`).catch(() => undefined);
      banner = "Score copied";
      bannerT = 1.6;
    }
  }

  function onKey(e: KeyboardEvent, down: boolean) {
    keys[down ? "add" : "delete"](e.key.toLowerCase());
    if (!down) return;
    if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
      e.preventDefault();
      if (phase === "menu") {
        phase = "play";
        resetRun();
      } else if (phase === "play") tryJump();
      else if (phase === "dead" || phase === "win") {
        phase = "play";
        resetRun();
      }
    }
    if (e.key.toLowerCase() === "j" || e.key.toLowerCase() === "k") doAttack(e.key.toLowerCase() === "k");
    if (e.key === "Shift") tryDash();
    if (e.key === "Escape" || e.key.toLowerCase() === "p") {
      if (phase === "play") phase = "pause";
      else if (phase === "pause") phase = "play";
    }
    if (e.key.toLowerCase() === "e") holdWell = true;
    if ((phase === "dead" || phase === "win") && e.key.toLowerCase() === "c") share();
    if (phase === "dead" && e.key.toLowerCase() === "r" && revives > 0) startAd();
  }

  function startAd() {
    if (revives <= 0) return;
    phase = "ad";
    adT = 3;
  }

  const keyDown = (e: KeyboardEvent) => onKey(e, true);
  const keyUp = (e: KeyboardEvent) => {
    onKey(e, false);
    if (e.key.toLowerCase() === "e") holdWell = false;
  };

  function hitButton(px: number, py: number) {
    const r = canvas.getBoundingClientRect();
    const x = ((px - r.left) / r.width) * W;
    const y = ((py - r.top) / r.height) * H;
    const zones: [keyof typeof touch, number, number, number, number][] = [
      ["left", 36, H - 120, 90, 70],
      ["right", 140, H - 120, 90, 70],
      ["jump", W - 250, H - 130, 100, 80],
      ["atk", W - 130, H - 130, 100, 80],
      ["dash", W - 250, H - 220, 100, 64],
      ["well", W / 2 - 70, H - 86, 140, 52],
    ];
    return zones.find((z) => x > z[1] && x < z[1] + z[3] && y > z[2] && y < z[2] + z[4]);
  }

  let activeBtn: keyof typeof touch | null = null;
  const pointerDown = (e: PointerEvent) => {
    canvas.focus();
    const z = hitButton(e.clientX, e.clientY);
    if (phase === "menu" || phase === "win") {
      phase = "play";
      resetRun();
      return;
    }
    if (phase === "dead") {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      if (x < W * 0.45) {
        phase = "play";
        resetRun();
      } else if (revives > 0) startAd();
      return;
    }
    if (phase === "pause") {
      phase = "play";
      return;
    }
    if (!z) return;
    activeBtn = z[0];
    touch[z[0]] = true;
    if (z[0] === "jump") tryJump();
    if (z[0] === "atk") doAttack(false);
    if (z[0] === "dash") tryDash();
  };
  const pointerUp = () => {
    if (activeBtn) touch[activeBtn] = false;
    activeBtn = null;
    touch.well = false;
    touch.left = false;
    touch.right = false;
    touch.jump = false;
    touch.atk = false;
    touch.dash = false;
  };

  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  canvas.addEventListener("pointerdown", pointerDown);
  window.addEventListener("pointerup", pointerUp);

  let acc = 0;
  let last = performance.now();
  let raf = 0;

  function step(dt: number) {
    time += dt;
    if (bannerT > 0) bannerT -= dt;
    if (phase === "ad") {
      adT -= dt;
      if (adT <= 0) {
        revives -= 1;
        player.hp = 3;
        player.inv = 1.2;
        player.vy = -200;
        phase = "play";
      }
      return;
    }
    if (phase !== "play") return;

    sector.plats.forEach((p) => {
      if (p.move) p.y = p.baseY + Math.sin(time * 1.6 + p.x) * p.move;
    });

    const left = keys.has("arrowleft") || keys.has("a") || touch.left;
    const right = keys.has("arrowright") || keys.has("d") || touch.right;
    const holding = holdWell || keys.has("e") || touch.well;

    if (player.dash > 0) {
      player.dash -= dt;
    } else {
      const ax = (right ? 1 : 0) - (left ? 1 : 0);
      if (ax !== 0) player.face = ax;
      const target = ax * 320;
      player.vx += (target - player.vx) * Math.min(1, dt * 8);
    }

    if (player.buf > 0) player.buf -= dt;
    if (player.coyote > 0) player.coyote -= dt;
    if ((keys.has(" ") || keys.has("arrowup") || keys.has("w") || touch.jump) && player.buf > 0) {
      if (player.on || player.coyote > 0 || player.jumps < 2) {
        if (!player.on && player.coyote <= 0) player.jumps = Math.max(player.jumps, 1);
        player.vy = player.jumps >= 1 ? -560 : -640;
        player.jumps += 1;
        player.on = false;
        player.coyote = 0;
        player.buf = 0;
      }
    }

    player.vy = Math.min(980, player.vy + GRAV * dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.on = false;
    player.anim += dt;

    if (player.x < 20) player.x = 20;
    if (player.y > H + 80) hurtPlayer(5);

    for (const p of sector.plats) {
      if (p.spike) {
        if (rects(player, p)) hurtPlayer(2);
        continue;
      }
      const prevBottom = player.y + player.h - player.vy * dt;
      if (player.vy >= 0 && prevBottom <= p.y + 8 && rects({ ...player, y: player.y }, p) && player.x + player.w > p.x + 4 && player.x < p.x + p.w - 4) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.on = true;
        player.jumps = 0;
        player.coyote = 0.08;
      }
    }

    if (player.atk > 0) {
      player.atk -= dt;
      const hb = {
        x: player.x + (player.face > 0 ? player.w - 4 : -46 - (player.atkKind ? 16 : 0)),
        y: player.y + 8,
        w: 50 + (player.atkKind ? 20 : 0),
        h: 40,
      };
      for (const f of sector.foes) {
        if (f.dead || f.hurt > 0.12) continue;
        if (rects(hb, f)) {
          const dmg = player.atkKind ? 2 : 1;
          f.hp -= dmg;
          f.hurt = 0.28;
          f.x += player.face * (f.kind === "hulk" || f.kind === "boss" ? 8 : 22);
          combo += 1;
          comboT = 1.5;
          score += 100 * combo;
          if (f.hp <= 0) {
            f.dead = true;
            killed += 1;
            score += f.kind === "boss" ? 2000 : 150;
          }
        }
      }
    }

    if (comboT > 0) comboT -= dt;
    else combo = 0;
    if (player.inv > 0) player.inv -= dt;

    for (const f of sector.foes) {
      if (f.dead) continue;
      f.hurt = Math.max(0, f.hurt - dt);
      f.cd -= dt;
      f.vy = Math.min(900, f.vy + GRAV * dt);
      if (f.kind === "boss") {
        const dx = player.x - f.x;
        f.dir = dx < 0 ? -1 : 1;
        if (f.cd <= 0) {
          f.vx = f.dir * 380;
          f.cd = 1.6;
        }
        f.vx *= 1 - dt * 1.4;
      } else if (f.kind === "legion" && f.cd <= 0 && Math.abs(player.x - f.x) < 220) {
        f.vx = f.dir * 280;
        f.cd = 1.3;
      } else if (f.kind !== "legion") {
        f.vx = f.dir * (f.kind === "hulk" ? 50 : 80);
        if (f.cd <= 0) {
          f.dir *= -1;
          f.cd = 1.8 + Math.random();
        }
      } else f.vx *= 1 - dt * 3;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      for (const p of sector.plats) {
        if (p.spike) continue;
        if (f.vy >= 0 && f.y + f.h >= p.y && f.y + f.h <= p.y + 24 && f.x + f.w > p.x && f.x < p.x + p.w) {
          f.y = p.y - f.h;
          f.vy = 0;
        }
      }
      if (rects(player, f) && player.dash <= 0) hurtPlayer(f.kind === "boss" ? 2 : 1);
    }

    const wellPlat = sector.plats.find((p) => p.well);
    if (wellPlat && rects(player, { ...wellPlat, h: 80, y: wellPlat.y - 70 })) {
      const bossUp = sector.foes.some((f) => f.kind === "boss" && !f.dead);
      if (!bossUp && holding) well = Math.min(1, well + dt / 2.4);
      else well = Math.max(0, well - dt * 0.4);
      if (well >= 1) nextSector();
    } else well = Math.max(0, well - dt * 0.5);

    const look = player.x - 360;
    camX += (look - camX) * Math.min(1, dt * 4);
    camX = Math.max(0, Math.min(sector.length - W, camX));
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sector.sky0);
    g.addColorStop(1, sector.sky1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (bg.complete && bg.naturalWidth) {
      ctx.globalAlpha = sectorI === 0 ? 0.45 : 0.22;
      const sx = (camX * 0.15) % bg.width;
      ctx.drawImage(bg, -sx, 0, W, H * 0.72);
      ctx.globalAlpha = 1;
    }
    // distant islands
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 6; i++) {
      const ix = ((i * 280 - camX * 0.25) % (W + 200)) - 40;
      ctx.beginPath();
      ctx.ellipse(ix, 180 + (i % 3) * 24, 70, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(-camX, 0);
    for (const p of sector.plats) {
      if (p.spike) {
        ctx.fillStyle = "#fb7185";
        for (let s = 0; s < p.w; s += 16) {
          ctx.beginPath();
          ctx.moveTo(p.x + s, p.y + p.h);
          ctx.lineTo(p.x + s + 8, p.y);
          ctx.lineTo(p.x + s + 16, p.y + p.h);
          ctx.fill();
        }
        continue;
      }
      ctx.fillStyle = sector.rock;
      roundRect(p.x, p.y, p.w, 48, 6);
      ctx.fill();
      ctx.fillStyle = p.well ? sector.accent : sector.grass;
      ctx.fillRect(p.x, p.y, p.w, 10);
      if (p.well) {
        ctx.strokeStyle = sector.accent;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.3;
        ctx.strokeRect(p.x + 120, p.y - 78, 36, 78);
        ctx.beginPath();
        ctx.arc(p.x + 138, p.y - 90, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    for (const f of sector.foes) {
      if (f.dead) continue;
      ctx.save();
      ctx.translate(f.x + f.w / 2, f.y + f.h);
      ctx.scale(f.dir, 1);
      ctx.globalAlpha = f.hurt > 0 ? 0.55 : 1;
      if (f.kind === "graveling") {
        ctx.fillStyle = "#6b7280";
        ctx.fillRect(-16, -28, 32, 22);
        ctx.fillStyle = "#9ca3af";
        ctx.fillRect(-10, -36, 20, 12);
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(-8, -24, 5, 4);
        ctx.fillRect(3, -24, 5, 4);
      } else if (f.kind === "legion") {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(-16, -54, 32, 48);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-12, -50, 24, 10);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(6, -40, 22, 4);
      } else if (f.kind === "hulk") {
        ctx.fillStyle = "#111827";
        ctx.fillRect(-30, -68, 60, 62);
        ctx.fillStyle = "#f97316";
        ctx.fillRect(-8, -58, 16, 8);
      } else {
        ctx.fillStyle = "#4c0519";
        ctx.fillRect(-48, -116, 96, 110);
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(-16, -100, 32, 10);
        ctx.fillStyle = sector.accent;
        ctx.fillRect(20, -80, 46, 6);
      }
      ctx.restore();
      const bw = f.w;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(f.x, f.y - 10, bw, 5);
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(f.x, f.y - 10, bw * Math.max(0, f.hp / f.max), 5);
    }

    // player
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h);
    ctx.scale(player.face, 1);
    ctx.globalAlpha = player.inv > 0 && Math.floor(time * 20) % 2 === 0 ? 0.35 : 1;
    const bob = player.on && Math.abs(player.vx) > 20 ? Math.sin(player.anim * 12) * 2 : 0;
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.moveTo(-8, -30 + bob);
    ctx.lineTo(-28, -8);
    ctx.lineTo(6, -20);
    ctx.fill();
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(-14, -50 + bob, 28, 32);
    ctx.fillStyle = "#f5c96a";
    ctx.fillRect(-10, -64 + bob, 20, 16);
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(-4, -58 + bob, 12, 4);
    if (player.atk > 0) {
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = player.atkKind ? 6 : 3;
      ctx.beginPath();
      ctx.arc(10, -30, 28 + (player.atkKind ? 10 : 0), -0.8, 0.9);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(8, -36 + bob, 26, 4);
    }
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-12, -20, 8, 18);
    ctx.fillRect(2, -20, 8, 18);
    ctx.restore();
    ctx.restore();

    drawHud();
    if (phase !== "play") drawOverlay();
  }

  function drawHud() {
    ctx.fillStyle = "rgba(2,6,23,0.55)";
    roundRect(20, 16, 280, 22, 8);
    ctx.fill();
    ctx.fillStyle = "#fb7185";
    roundRect(20, 16, 280 * (player.hp / player.max), 22, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 16px system-ui";
    ctx.fillText(sector.name, 20, 60);
    ctx.font = "600 14px system-ui";
    ctx.fillText(`SCORE ${score}`, 20, 82);
    ctx.fillText(`BEST ${best}`, 160, 82);
    if (combo > 1) {
      ctx.fillStyle = "#f5c96a";
      ctx.font = "800 22px system-ui";
      ctx.fillText(`${combo}x`, 20, 112);
    }
    const wp = sector.plats.find((p) => p.well);
    if (wp && Math.abs(player.x - wp.x) < 420) {
      ctx.fillStyle = "rgba(2,6,23,0.6)";
      roundRect(W / 2 - 120, 24, 240, 16, 8);
      ctx.fill();
      ctx.fillStyle = sector.accent;
      roundRect(W / 2 - 120, 24, 240 * well, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "600 12px system-ui";
      ctx.fillText(sector.foes.some((f) => f.kind === "boss" && !f.dead) ? "DEFEAT THE REAVER" : "HOLD TO STABILIZE WELL", W / 2 - 88, 56);
    }
    if (bannerT > 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "800 36px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(banner, W / 2, 160);
      ctx.textAlign = "left";
    }
    drawPad("◀", 36, H - 120, 90, 70);
    drawPad("▶", 140, H - 120, 90, 70);
    drawPad("DASH", W - 250, H - 220, 100, 64);
    drawPad("JUMP", W - 250, H - 130, 100, 80);
    drawPad("SLASH", W - 130, H - 130, 100, 80);
    drawPad("WELL", W / 2 - 70, H - 86, 140, 52);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "500 12px system-ui";
    ctx.fillText("Arrows/WASD · Space jump · J slash · K heavy · Shift dash · E well · P pause", 20, H - 16);
  }

  function drawPad(label: string, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = "rgba(2,6,23,0.35)";
    roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + h / 2 + 5);
    ctx.textAlign = "left";
  }

  function drawOverlay() {
    ctx.fillStyle = "rgba(2,6,23,0.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5c96a";
    ctx.font = "800 18px system-ui";
    if (phase === "menu") {
      if (hero.complete && hero.naturalWidth) ctx.drawImage(hero, W - 520, 80, 460, 460);
      ctx.fillText("THE GREAT INVASION", W / 2, 180);
      ctx.fillStyle = "#fff";
      ctx.font = "800 54px system-ui";
      ctx.fillText("RIFTLANDS", W / 2, 250);
      ctx.font = "500 18px system-ui";
      ctx.fillStyle = "#e0f2fe";
      ctx.fillText("Five sectors. Reclaim every Aether Well. Slay the Reaver.", W / 2, 300);
      ctx.fillText("Tap, or press Space, to deploy", W / 2, 390);
      ctx.fillText(`Best score ${best}`, W / 2, 430);
    } else if (phase === "pause") {
      ctx.font = "800 48px system-ui";
      ctx.fillStyle = "#fff";
      ctx.fillText("PAUSED", W / 2, 320);
      ctx.font = "500 18px system-ui";
      ctx.fillText("Tap or P to resume", W / 2, 370);
    } else if (phase === "dead") {
      ctx.fillStyle = "#fb7185";
      ctx.font = "800 48px system-ui";
      ctx.fillText("WELL COLLAPSED", W / 2, 280);
      ctx.fillStyle = "#fff";
      ctx.font = "600 22px system-ui";
      ctx.fillText(`${sector.name}  ·  score ${score}  ·  ${killed} slain`, W / 2, 340);
      ctx.font = "500 18px system-ui";
      ctx.fillText("Tap left to retry   ·   tap right to watch a continue", W / 2, 400);
      ctx.fillText(revives > 0 ? "R continue   ·   C share" : "No continues left   ·   C share", W / 2, 440);
    } else if (phase === "win") {
      ctx.fillStyle = "#f5c96a";
      ctx.font = "800 46px system-ui";
      ctx.fillText("SPIRE RECLAIMED", W / 2, 260);
      ctx.fillStyle = "#fff";
      ctx.font = "600 22px system-ui";
      ctx.fillText(`Score ${score}   ·   ${stars} stars   ·   ${killed} slain`, W / 2, 330);
      ctx.font = "500 18px system-ui";
      ctx.fillText("Tap to run again   ·   C to share", W / 2, 390);
    } else if (phase === "ad") {
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px system-ui";
      ctx.fillText("SPONSORED CONTINUE", W / 2, 300);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      roundRect(W / 2 - 160, 340, 320, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#f5c96a";
      roundRect(W / 2 - 160, 340, 320 * (1 - adT / 3), 16, 8);
      ctx.fill();
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "500 16px system-ui";
      ctx.fillText("Hold the line…", W / 2, 390);
    }
    ctx.textAlign = "left";
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc > 1 / 60) {
      step(1 / 60);
      acc -= 1 / 60;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = host.getBoundingClientRect();
    const pw = Math.max(320, rect.width);
    const ph = Math.max(240, rect.height);
    if (canvas.width !== Math.floor(pw * dpr) || canvas.height !== Math.floor(ph * dpr)) {
      canvas.width = Math.floor(pw * dpr);
      canvas.height = Math.floor(ph * dpr);
    }
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  canvas.focus();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    canvas.removeEventListener("pointerdown", pointerDown);
    window.removeEventListener("pointerup", pointerUp);
    canvas.remove();
  };
}
