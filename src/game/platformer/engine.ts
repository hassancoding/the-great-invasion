import {
  COIN_VALUE,
  GAME_NAME,
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_SPEED,
  TILE,
  TIME_BONUS_PER_SEC,
  LEVELS,
} from '@/config/platformerConfig';
import { loadLevel, levelCount } from './levelLoader';
import { aabb, moveAndCollide } from './physics';
import type { GamePhase, LevelState, Player, RunStats } from './types';
import {
  gameReady,
  gameplayStart,
  gameplayStop,
  initYandex,
  showInterstitial,
} from './yandexSdk';
import {
  drawSky,
  drawParallaxCity,
  drawClouds,
  drawBlock,
  drawCoin,
  drawSpike,
  drawEnemy,
  drawGoal,
  drawCourier,
} from './graphics';

type Input = {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
};

export type EngineHooks = {
  onPhase: (phase: GamePhase) => void;
  onHud: (hud: {
    coins: number;
    score: number;
    time: number;
    level: number;
    levelName: string;
    lives: number;
  }) => void;
  onResults: (stats: RunStats & { stars: number; message: string; pb: number }) => void;
};

const PB_KEY = 'bolthop_pb';

export class BoltHopEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  hooks: EngineHooks;
  phase: GamePhase = 'menu';
  levelIndex = 0;
  level!: LevelState;
  player!: Player;
  input: Input = { left: false, right: false, jump: false, jumpPressed: false };
  cameraX = 0;
  coins = 0;
  score = 0;
  time = 0;
  lives = 3;
  deaths = 0;
  anim = 0;
  raf = 0;
  last = 0;
  w = 360;
  h = 640;
  dpr = 1;
  touchLeft = false;
  touchRight = false;
  touchJump = false;
  jumpBuffered = 0;
  coyote = 0;
  invuln = 0;
  running = false;

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.hooks = hooks;
  }

  async start() {
    await initYandex();
    this.resize();
    this.bindInput();
    window.addEventListener('resize', this.resize);
    gameReady();
    this.setPhase('menu');
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.unbindInput();
  }

  resize = () => {
    const parent = this.canvas.parentElement;
    this.w = parent?.clientWidth || window.innerWidth || 360;
    this.h = parent?.clientHeight || window.innerHeight || 640;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  setPhase(p: GamePhase) {
    this.phase = p;
    this.hooks.onPhase(p);
    if (p === 'playing') gameplayStart();
    else gameplayStop();
  }

  startLevel(index: number) {
    this.levelIndex = index;
    this.level = loadLevel(index);
    this.player = {
      x: this.level.spawn.x,
      y: this.level.spawn.y,
      w: 24,
      h: 36,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      alive: true,
    };
    this.coins = 0;
    this.score = 0;
    this.time = 0;
    this.cameraX = 0;
    this.invuln = 0;
    this.setPhase('playing');
    this.pushHud();
  }

  play() {
    this.lives = 3;
    this.deaths = 0;
    this.startLevel(0);
  }

  private pushHud() {
    this.hooks.onHud({
      coins: this.coins,
      score: this.score + Math.floor(this.coins * COIN_VALUE),
      time: this.time,
      level: this.levelIndex + 1,
      levelName: LEVELS[this.levelIndex]?.name ?? 'Level',
      lives: this.lives,
    });
  }

  private bindInput() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private unbindInput() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (!this.input.jump) this.input.jumpPressed = true;
      this.input.jump = true;
      e.preventDefault();
    }
    if (e.code === 'Enter' && this.phase === 'menu') this.play();
    if (e.code === 'KeyR' && (this.phase === 'won' || this.phase === 'lost')) this.play();
    if (e.code === 'KeyP' && this.phase === 'playing') this.setPhase('paused');
    else if (e.code === 'KeyP' && this.phase === 'paused') this.setPhase('playing');
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.input.jump = false;
  };

  setTouch(side: 'left' | 'right' | 'jump', down: boolean) {
    if (side === 'left') this.touchLeft = down;
    if (side === 'right') this.touchRight = down;
    if (side === 'jump') {
      if (down && !this.touchJump) this.input.jumpPressed = true;
      this.touchJump = down;
      this.input.jump = down;
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.anim += dt;
    if (this.phase === 'playing') this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const p = this.player;
    if (!p.alive) return;

    this.time += dt;
    this.jumpBuffered = Math.max(0, this.jumpBuffered - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.invuln = Math.max(0, this.invuln - dt);

    if (this.input.jumpPressed) {
      this.jumpBuffered = 0.12;
      this.input.jumpPressed = false;
    }

    const left = this.input.left || this.touchLeft;
    const right = this.input.right || this.touchRight;
    let move = 0;
    if (left) move -= 1;
    if (right) move += 1;
    p.vx = move * PLAYER_SPEED;
    if (move !== 0) p.facing = move > 0 ? 1 : -1;

    if (p.onGround) this.coyote = 0.1;
    if (this.jumpBuffered > 0 && this.coyote > 0) {
      p.vy = JUMP_VELOCITY;
      p.onGround = false;
      this.jumpBuffered = 0;
      this.coyote = 0;
    }
    if (!this.input.jump && !this.touchJump && p.vy < -120) {
      p.vy *= 0.55;
    }

    p.vy += GRAVITY * dt;
    if (p.vy > 700) p.vy = 700;

    const res = moveAndCollide(p, p.vx, p.vy, this.level.solids, dt);
    p.x = res.x;
    p.y = res.y;
    p.vx = res.vx;
    p.vy = res.vy;
    p.onGround = res.onGround;

    for (const c of this.level.coins) {
      if (c.taken) continue;
      if (aabb(p, c)) {
        c.taken = true;
        this.coins += 1;
        this.score += COIN_VALUE;
      }
    }

    for (const s of this.level.spikes) {
      if (this.invuln <= 0 && aabb(p, s)) this.hurt();
    }

    for (const e of this.level.enemies) {
      if (!e.alive) continue;
      e.x += e.dir * e.vx * dt;
      const foot = { x: e.x + (e.dir > 0 ? e.w : -2), y: e.y + e.h + 2, w: 4, h: 4 };
      const wall = { x: e.x + (e.dir > 0 ? e.w : -2), y: e.y + 4, w: 4, h: e.h - 8 };
      let hasFloor = false;
      let hitWall = false;
      for (const s of this.level.solids) {
        if (aabb(foot, s)) hasFloor = true;
        if (aabb(wall, s)) hitWall = true;
      }
      if (!hasFloor || hitWall) e.dir = (e.dir === 1 ? -1 : 1) as 1 | -1;

      if (!aabb(p, e)) continue;
      if (p.vy > 0 && p.y + p.h - e.y < 16) {
        e.alive = false;
        p.vy = JUMP_VELOCITY * 0.65;
        this.score += 100;
      } else if (this.invuln <= 0) {
        this.hurt();
      }
    }

    if (this.level.goal && aabb(p, this.level.goal)) {
      this.winLevel();
      return;
    }

    if (p.y > this.level.height + 80) this.hurt(true);

    const target = p.x - this.w * 0.35;
    this.cameraX += (target - this.cameraX) * Math.min(1, dt * 6);
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.level.width - this.w));

    if (Math.floor(this.time * 10) % 3 === 0) this.pushHud();
  }

  private hurt(instant = false) {
    if (this.invuln > 0 && !instant) return;
    this.lives -= 1;
    this.deaths += 1;
    this.invuln = 1.2;
    if (this.lives <= 0) {
      this.player.alive = false;
      this.endRun(false);
      return;
    }
    this.player.x = this.level.spawn.x;
    this.player.y = this.level.spawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.pushHud();
  }

  private winLevel() {
    const timeBonus = Math.max(0, Math.floor((90 - this.time) * TIME_BONUS_PER_SEC));
    this.score += timeBonus + this.coins * COIN_VALUE;
    const total = this.score;
    if (this.levelIndex + 1 < levelCount()) {
      this.startLevel(this.levelIndex + 1);
    } else {
      this.endRun(true, total);
    }
  }

  private endRun(won: boolean, finalScore?: number) {
    const score = finalScore ?? this.score + this.coins * COIN_VALUE;
    let pb = 0;
    try {
      pb = Number(localStorage.getItem(PB_KEY) || 0);
      if (score > pb) {
        pb = score;
        localStorage.setItem(PB_KEY, String(pb));
      }
    } catch {}
    const stars = score > 2000 ? 3 : score > 1000 ? 2 : score > 400 ? 1 : 0;
    const message = won ? 'ALL DELIVERIES DONE!' : 'OUT OF LIVES';
    this.setPhase(won ? 'won' : 'lost');
    this.hooks.onResults({
      score,
      coins: this.coins,
      time: this.time,
      deaths: this.deaths,
      level: this.levelIndex + 1,
      stars,
      message,
      pb,
    });
    void showInterstitial();
  }

  private draw() {
    const ctx = this.ctx;
    const W = this.w;
    const H = this.h;

    drawSky(ctx, W, H, this.anim);
    drawParallaxCity(ctx, W, H, this.cameraX, this.anim);
    drawClouds(ctx, W, this.cameraX, this.anim);

    if (this.phase === 'menu') {
      this.drawMenu();
      return;
    }

    const groundY = this.level.height;
    const viewY = Math.min(0, H - groundY - 40);

    ctx.save();
    ctx.translate(-Math.floor(this.cameraX), viewY);

    for (const s of this.level.solids) drawBlock(ctx, s.x, s.y, s.w, s.h);
    for (const c of this.level.coins) {
      if (!c.taken) drawCoin(ctx, c.x + c.w / 2, c.y + c.h / 2, this.anim);
    }
    for (const s of this.level.spikes) drawSpike(ctx, s.x, s.y, s.w, s.h);
    for (const e of this.level.enemies) {
      if (e.alive) drawEnemy(ctx, e.x, e.y, e.w, e.h, e.dir, this.anim);
    }
    if (this.level.goal) {
      drawGoal(ctx, this.level.goal.x, this.level.goal.y, this.level.goal.w, this.level.goal.h, this.anim);
    }
    if (this.player.alive) {
      const blink = this.invuln > 0 && Math.floor(this.anim * 15) % 2 === 0;
      if (!blink) {
        drawCourier(
          ctx,
          this.player.x,
          this.player.y,
          this.player.w,
          this.player.h,
          this.player.facing,
          this.player.onGround,
          this.player.vx,
          this.anim
        );
      }
    }
    ctx.restore();
  }

  private drawMenu() {
    const ctx = this.ctx;
    const W = this.w;
    const H = this.h;
    ctx.fillStyle = 'rgba(15,23,42,0.4)';
    ctx.fillRect(0, 0, W, H);

    drawCourier(ctx, W / 2 - 12, H * 0.38, 24, 36, 1, true, 80, this.anim);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px system-ui,sans-serif';
    ctx.fillText(GAME_NAME, W / 2, H * 0.22);
    ctx.font = '16px system-ui,sans-serif';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('Leap. Loot. Deliver.', W / 2, H * 0.22 + 32);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px system-ui,sans-serif';
    ctx.fillText('Tap PLAY or press Enter', W / 2, H * 0.62);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui,sans-serif';
    ctx.fillText('Arrow keys / WASD · Space jump', W / 2, H * 0.62 + 22);
    ctx.fillText('Mobile: on-screen buttons', W / 2, H * 0.62 + 40);
  }
}
