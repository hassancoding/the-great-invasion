import {
  COIN_VALUE,
  GAME_NAME,
  GRAVITY,
  JUMP_VELOCITY,
  PLAYER_SPEED,
  TIME_BONUS_PER_SEC,
  STOMP_SCORE,
  MAX_LIVES,
  LEVELS,
} from '@/config/platformerConfig';
import { loadLevel, levelCount } from './levelLoader';
import { aabb, moveAndCollide } from './physics';
import type { GamePhase, LevelState, Player, RunStats, Solid } from './types';
import {
  gameReady,
  gameplayStart,
  gameplayStop,
  initYandex,
  showInterstitial,
  showRewarded,
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
  drawMover,
  drawBouncePad,
  drawSlash,
} from './graphics';
import { ParticleSystem } from './particles';
import {
  sfxJump,
  sfxCoin,
  sfxStomp,
  sfxHurt,
  sfxWin,
  sfxLose,
  sfxBounce,
  sfxLand,
  sfxSlash,
  sfxHeavy,
  sfxHit,
} from './audio';
import type { Enemy } from './types';
import {
  emptyStats,
  planSurge,
  planApexElite,
  spawnEnemyAt,
  type ThreatStats,
  type WavePlan,
} from './threatDirector';

type Input = {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  attack: boolean;
  attackPressed: boolean;
  heavy: boolean;
  heavyPressed: boolean;
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
    banner: string;
    claimProgress: number;
  }) => void;
  onResults: (stats: RunStats & { stars: number; message: string; pb: number }) => void;
};

const PB_KEY = 'tgi_riftlands_pb';
const RUNS_KEY = 'tgi_riftlands_runs';

export class BoltHopEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  hooks: EngineHooks;
  phase: GamePhase = 'menu';
  levelIndex = 0;
  level!: LevelState;
  player!: Player;
  input: Input = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    attack: false,
    attackPressed: false,
    heavy: false,
    heavyPressed: false,
  };
  cameraX = 0;
  /** Active attack window */
  attackTimer = 0;
  attackKind: 'light' | 'heavy' | null = null;
  attackHit = new Set<Enemy>();
  attackCooldown = 0;
  touchAttack = false;
  touchHeavy = false;
  /** explore → claiming Well → survive surge */
  sectorMode: 'explore' | 'claiming' | 'surge' = 'explore';
  claimProgress = 0;
  threat: ThreatStats = emptyStats();
  surgePlan: WavePlan | null = null;
  surgeBannerTimer = 0;
  banner = '';
  /** Campaign totals (persist across levels in a run) */
  coins = 0;
  score = 0;
  time = 0;
  levelStartTime = 0;
  lives = MAX_LIVES;
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
  particles = new ParticleSystem();
  shake = 0;
  wasOnGround = false;
  menuPb = 0;
  menuRuns = 0;

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
    this.readMeta();
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

  private readMeta() {
    try {
      this.menuPb = Number(localStorage.getItem(PB_KEY) || 0);
      this.menuRuns = Number(localStorage.getItem(RUNS_KEY) || 0);
    } catch {
      this.menuPb = 0;
      this.menuRuns = 0;
    }
  }

  /** Start a specific level without wiping campaign score */
  startLevel(index: number, resetScore = false) {
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
    if (resetScore) {
      this.coins = 0;
      this.score = 0;
      this.time = 0;
      this.deaths = 0;
    }
    this.levelStartTime = this.time;
    this.cameraX = 0;
    this.invuln = 0;
    this.particles.clear();
    this.shake = 0;
    this.wasOnGround = false;
    this.sectorMode = 'explore';
    this.claimProgress = 0;
    this.threat = emptyStats();
    this.surgePlan = null;
    this.surgeBannerTimer = 0;
    this.banner = '';
    this.attackTimer = 0;
    this.attackKind = null;
    this.attackHit.clear();
    this.setPhase('playing');
    this.pushHud();
  }

  play() {
    this.lives = MAX_LIVES;
    this.deaths = 0;
    this.coins = 0;
    this.score = 0;
    this.time = 0;
    try {
      const runs = Number(localStorage.getItem(RUNS_KEY) || 0) + 1;
      localStorage.setItem(RUNS_KEY, String(runs));
      this.menuRuns = runs;
    } catch {}
    this.startLevel(0, true);
  }

  /** Continue after death via rewarded ad */
  async continueWithReward() {
    const ok = await showRewarded();
    if (!ok) return false;
    this.lives = 1;
    this.player.alive = true;
    this.player.x = this.level.spawn.x;
    this.player.y = this.level.spawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.invuln = 2;
    this.setPhase('playing');
    this.pushHud();
    return true;
  }

  private pushHud() {
    this.hooks.onHud({
      coins: this.coins,
      score: this.score,
      time: this.time,
      level: this.levelIndex + 1,
      levelName: LEVELS[this.levelIndex]?.name ?? 'Level',
      lives: this.lives,
      banner: this.banner,
      claimProgress: this.claimProgress,
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
    if (e.code === 'KeyJ' || e.code === 'KeyZ') {
      if (!this.input.attack) this.input.attackPressed = true;
      this.input.attack = true;
      e.preventDefault();
    }
    if (e.code === 'KeyK' || e.code === 'KeyX') {
      if (!this.input.heavy) this.input.heavyPressed = true;
      this.input.heavy = true;
      e.preventDefault();
    }
    if (e.code === 'Enter' && this.phase === 'menu') this.play();
    if (e.code === 'KeyR' && (this.phase === 'won' || this.phase === 'lost')) this.play();
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.phase === 'playing') this.setPhase('paused');
      else if (this.phase === 'paused') this.setPhase('playing');
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.input.jump = false;
    if (e.code === 'KeyJ' || e.code === 'KeyZ') this.input.attack = false;
    if (e.code === 'KeyK' || e.code === 'KeyX') this.input.heavy = false;
  };

  setTouch(side: 'left' | 'right' | 'jump' | 'attack' | 'heavy', down: boolean) {
    if (side === 'left') this.touchLeft = down;
    if (side === 'right') this.touchRight = down;
    if (side === 'jump') {
      if (down && !this.touchJump) this.input.jumpPressed = true;
      this.touchJump = down;
      this.input.jump = down;
    }
    if (side === 'attack') {
      if (down && !this.touchAttack) this.input.attackPressed = true;
      this.touchAttack = down;
      this.input.attack = down;
    }
    if (side === 'heavy') {
      if (down && !this.touchHeavy) this.input.heavyPressed = true;
      this.touchHeavy = down;
      this.input.heavy = down;
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.anim += dt;
    if (this.phase === 'playing') this.update(dt);
    this.particles.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 8);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private allSolids(): Solid[] {
    // movers act as solids at their current position
    return [...this.level.solids, ...this.level.movers];
  }

  private updateMovers(dt: number) {
    for (const m of this.level.movers) {
      m.px = m.x;
      m.py = m.y;
      m.phase += m.speed * dt;
      m.x = m.ox + Math.sin(m.phase) * m.rangeX;
      m.y = m.oy + Math.sin(m.phase) * m.rangeY;
    }
  }

  private update(dt: number) {
    const p = this.player;
    if (!p.alive) return;

    this.time += dt;
    this.jumpBuffered = Math.max(0, this.jumpBuffered - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (!p.onGround) this.threat.airTime += dt;
    if (this.surgeBannerTimer > 0) {
      this.surgeBannerTimer = Math.max(0, this.surgeBannerTimer - dt);
      if (this.surgeBannerTimer <= 0 && this.sectorMode === 'surge') {
        this.banner = 'HOLD THE LINE';
      }
    }

    this.updateMovers(dt);

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
      sfxJump();
    }
    // Variable jump height
    if (!this.input.jump && !this.touchJump && p.vy < -120) {
      p.vy *= 0.55;
    }

    p.vy += GRAVITY * dt;
    if (p.vy > 720) p.vy = 720;

    const solids = this.allSolids();
    const res = moveAndCollide(p, p.vx, p.vy, solids, dt);
    p.x = res.x;
    p.y = res.y;
    p.vx = res.vx;
    p.vy = res.vy;
    p.onGround = res.onGround;

    // Carry with movers when standing on them
    if (p.onGround) {
      for (const m of this.level.movers) {
        const feet = { x: p.x + 2, y: p.y + p.h - 2, w: p.w - 4, h: 6 };
        if (aabb(feet, m)) {
          p.x += m.x - m.px;
          p.y += m.y - m.py;
        }
      }
    }

    if (p.onGround && !this.wasOnGround && Math.abs(p.vy) < 1) {
      // landed — subtle
      sfxLand();
    }
    this.wasOnGround = p.onGround;

    // Bounce pads
    for (const pad of this.level.pads) {
      if (aabb(p, pad) && p.vy >= 0) {
        p.vy = pad.power;
        p.onGround = false;
        this.coyote = 0;
        sfxBounce();
        this.particles.spark(pad.x + pad.w / 2, pad.y, '#38bdf8');
        this.shake = 0.12;
      }
    }

    // Coins
    for (const c of this.level.coins) {
      if (c.taken) continue;
      if (aabb(p, c)) {
        c.taken = true;
        this.coins += 1;
        this.threat.crystals += 1;
        this.score += COIN_VALUE;
        sfxCoin();
        this.particles.burst(c.x + c.w / 2, c.y + c.h / 2, '#22d3ee', 8, 100);
      }
    }

    // Spikes
    for (const s of this.level.spikes) {
      if (this.invuln <= 0 && aabb(p, s)) this.hurt();
    }

    // Combat attacks
    this.updateAttack(dt);

    // Enemies
    for (const e of this.level.enemies) {
      if (!e.alive) continue;
      e.stun = Math.max(0, e.stun - dt);
      e.hitFlash = Math.max(0, e.hitFlash - dt);

      if (e.stun <= 0) {
        // Elite: face player + periodic charge
        if (e.kind === 'elite') {
          e.chargeCd = (e.chargeCd ?? 1.5) - dt;
          const dx = p.x + p.w / 2 - (e.x + e.w / 2);
          if (Math.abs(dx) > 8) e.dir = (dx > 0 ? 1 : -1) as 1 | -1;
          if (e.chargeCd <= 0 && Math.abs(dx) < 160) {
            e.charging = true;
            e.chargeCd = 2.4;
            this.shake = Math.max(this.shake, 0.15);
            this.particles.spark(e.x + e.w / 2, e.y + e.h * 0.4, '#fb923c');
          }
          const speed = e.charging ? e.vx * 2.6 : e.vx * 0.85;
          e.x += e.dir * speed * dt;
          if (e.charging && e.chargeCd < 1.9) e.charging = false;
        } else {
          e.x += e.dir * e.vx * dt;
        }
        const foot = { x: e.x + (e.dir > 0 ? e.w : -2), y: e.y + e.h + 2, w: 4, h: 4 };
        const wall = { x: e.x + (e.dir > 0 ? e.w : -2), y: e.y + 4, w: 4, h: e.h - 8 };
        let hasFloor = false;
        let hitWall = false;
        for (const s of solids) {
          if (aabb(foot, s)) hasFloor = true;
          if (aabb(wall, s)) hitWall = true;
        }
        if ((!hasFloor || hitWall) && e.kind !== 'elite') {
          e.dir = (e.dir === 1 ? -1 : 1) as 1 | -1;
        } else if (hitWall && e.kind === 'elite') {
          e.charging = false;
          e.dir = (e.dir === 1 ? -1 : 1) as 1 | -1;
        }
      }

      if (!aabb(p, e)) continue;
      // Stomp — full kill on graveling/legionnaire, 2 on hulk, 2 on elite
      if (p.vy > 0 && p.y + p.h - e.y < 18) {
        p.vy = JUMP_VELOCITY * 0.7;
        const stompDmg = e.kind === 'hulk' || e.kind === 'elite' ? 2 : 99;
        this.damageEnemy(e, stompDmg, true);
      } else if (this.invuln <= 0 && e.stun <= 0) {
        this.hurt();
      }
    }

    // Well claim + surge
    this.updateWellAndSurge(dt, p);

    // Fell
    if (p.y > this.level.height + 80) this.hurt(true);

    // Camera
    const target = p.x - this.w * 0.35;
    this.cameraX += (target - this.cameraX) * Math.min(1, dt * 6);
    this.cameraX = Math.max(0, Math.min(this.cameraX, Math.max(0, this.level.width - this.w)));

    if (Math.floor(this.time * 10) % 3 === 0) this.pushHud();
  }

  private updateAttack(dt: number) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.input.attackPressed || this.input.heavyPressed) {
      const wantHeavy = this.input.heavyPressed;
      this.input.attackPressed = false;
      this.input.heavyPressed = false;
      if (this.attackCooldown <= 0 && this.attackTimer <= 0) {
        this.attackKind = wantHeavy ? 'heavy' : 'light';
        this.attackTimer = wantHeavy ? 0.28 : 0.16;
        this.attackCooldown = wantHeavy ? 0.45 : 0.22;
        this.attackHit.clear();
        if (wantHeavy) sfxHeavy();
        else sfxSlash();
      }
    }

    if (this.attackTimer <= 0) {
      this.attackKind = null;
      return;
    }

    this.attackTimer -= dt;
    const p = this.player;
    const heavy = this.attackKind === 'heavy';
    const reach = heavy ? 40 : 28;
    const hitbox = {
      x: p.facing > 0 ? p.x + p.w - 4 : p.x - reach + 4,
      y: p.y + 4,
      w: reach,
      h: p.h - 8,
    };

    // Active frames: middle of swing
    const progress = 1 - this.attackTimer / (heavy ? 0.28 : 0.16);
    if (progress < 0.15 || progress > 0.85) return;

    for (const e of this.level.enemies) {
      if (!e.alive || this.attackHit.has(e)) continue;
      if (!aabb(hitbox, e)) continue;
      this.attackHit.add(e);
      if (heavy) this.threat.heavyHits += 1;
      else this.threat.slashHits += 1;
      let dmg = heavy ? 2 : 1;
      if ((e.kind === 'hulk' || e.kind === 'elite') && !heavy) dmg = 1;
      this.damageEnemy(e, dmg, false);
      // knockback
      e.x += p.facing * (heavy ? 14 : 8);
      e.stun = heavy ? 0.35 : 0.18;
    }
  }

  private damageEnemy(e: Enemy, dmg: number, fromStomp: boolean) {
    e.hp -= dmg;
    e.hitFlash = 0.12;
    e.stun = Math.max(e.stun, 0.15);
    sfxHit();
    this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, '#22d3ee', 6, 90);
    this.shake = Math.max(this.shake, fromStomp ? 0.18 : 0.1);
    if (e.hp <= 0) {
      e.alive = false;
      this.threat.kills += 1;
      if (fromStomp) this.threat.stomps += 1;
      const pts =
        e.kind === 'elite'
          ? STOMP_SCORE * 4
          : e.kind === 'hulk'
            ? STOMP_SCORE * 2
            : e.kind === 'legionnaire'
              ? STOMP_SCORE
              : 80;
      this.score += pts;
      if (e.kind === 'elite') {
        this.banner = 'ORUN FALLEN';
        this.surgeBannerTimer = 1.6;
        this.particles.confetti(e.x + e.w / 2, e.y);
      }
      if (fromStomp) sfxStomp();
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, '#f87171', 12, 140);
    }
  }

  private updateWellAndSurge(dt: number, p: Player) {
    const goal = this.level.goal;
    if (!goal) return;

    if (this.sectorMode === 'explore') {
      if (aabb(p, goal)) {
        this.sectorMode = 'claiming';
        this.claimProgress = 0;
        this.banner = 'STABILIZING WELL…';
        this.pushHud();
      }
      return;
    }

    if (this.sectorMode === 'claiming') {
      if (aabb(p, { x: goal.x - 12, y: goal.y - 8, w: goal.w + 24, h: goal.h + 16 })) {
        this.claimProgress = Math.min(1, this.claimProgress + dt / 1.6);
        if (this.claimProgress >= 1) {
          this.beginSurge();
        }
      } else {
        this.claimProgress = Math.max(0, this.claimProgress - dt * 0.5);
        if (this.claimProgress <= 0) {
          this.sectorMode = 'explore';
          this.banner = '';
        }
      }
      this.pushHud();
      return;
    }

    if (this.sectorMode === 'surge') {
      const alive = this.level.enemies.some((e) => e.alive);
      if (!alive) {
        this.score += 200;
        this.winLevel();
      }
    }
  }

  private beginSurge() {
    this.sectorMode = 'surge';
    this.claimProgress = 1;
    // Apex elite plan can override late sectors
    const apex = planApexElite(this.threat, this.levelIndex);
    this.surgePlan = apex ?? planSurge(this.threat, this.levelIndex);
    this.banner = this.surgePlan.label;
    this.surgeBannerTimer = this.surgePlan.label.includes('ORUN') ? 2.8 : 2.2;
    this.shake = this.surgePlan.label.includes('ORUN') ? 0.45 : 0.3;
    sfxHeavy();

    // Clear leftover patrols; spawn adaptive wave near Well / sides
    for (const e of this.level.enemies) e.alive = false;
    const goal = this.level.goal!;
    const groundY = this.level.spawn.y;
    const kinds = this.surgePlan.kinds;
    kinds.forEach((kind, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const x = goal.x + side * (48 + i * 36);
      const clampedX = Math.max(8, Math.min(x, this.level.width - 40));
      const dir: 1 | -1 = side < 0 ? 1 : -1;
      this.level.enemies.push(spawnEnemyAt(kind, clampedX, groundY, dir));
    });
    this.particles.confetti(goal.x + 12, goal.y + 10);
    this.pushHud();
  }

  private hurt(instant = false) {
    if (this.invuln > 0 && !instant) return;
    this.lives -= 1;
    this.deaths += 1;
    this.invuln = 1.2;
    this.shake = 0.35;
    sfxHurt();
    this.particles.burst(this.player.x + 12, this.player.y + 18, '#fda4af', 10, 110);
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
    const levelTime = this.time - this.levelStartTime;
    const timeBonus = Math.max(0, Math.floor((75 - levelTime) * TIME_BONUS_PER_SEC));
    this.score += timeBonus;
    if (this.level.goal) {
      this.particles.confetti(this.level.goal.x + 12, this.level.goal.y + 10);
    }
    sfxWin();
    this.shake = 0.2;
    if (this.levelIndex + 1 < levelCount()) {
      // brief delay feel — start next immediately for pace
      this.startLevel(this.levelIndex + 1, false);
    } else {
      this.endRun(true);
    }
  }

  private endRun(won: boolean) {
    const score = this.score;
    let pb = 0;
    try {
      pb = Number(localStorage.getItem(PB_KEY) || 0);
      if (score > pb) {
        pb = score;
        localStorage.setItem(PB_KEY, String(pb));
      }
      this.menuPb = pb;
    } catch {}
    const stars = score >= 3500 ? 3 : score >= 2000 ? 2 : score >= 800 ? 1 : 0;
    const message = won
      ? score >= pb && score > 0
        ? 'NEW BEST — WELL HELD!'
        : 'ALL WELLS STABLE!'
      : 'OVERRUN';
    if (won) sfxWin();
    else sfxLose();
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

    const sx = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;
    const sy = this.shake > 0 ? (Math.random() - 0.5) * 10 * this.shake : 0;

    ctx.save();
    ctx.translate(sx, sy);

    drawSky(ctx, W, H, this.anim);
    drawParallaxCity(ctx, W, H, this.cameraX, this.anim);
    drawClouds(ctx, W, this.cameraX, this.anim);

    if (this.phase === 'menu') {
      this.drawMenu();
      ctx.restore();
      return;
    }

    const groundY = this.level.height;
    const viewY = Math.min(0, H - groundY - 40);

    ctx.save();
    ctx.translate(-Math.floor(this.cameraX), viewY);

    for (const s of this.level.solids) drawBlock(ctx, s.x, s.y, s.w, s.h);
    for (const m of this.level.movers) drawMover(ctx, m.x, m.y, m.w, m.h, this.anim);
    for (const pad of this.level.pads) drawBouncePad(ctx, pad.x, pad.y, pad.w, pad.h, this.anim);
    for (const c of this.level.coins) {
      if (!c.taken) drawCoin(ctx, c.x + c.w / 2, c.y + c.h / 2, this.anim);
    }
    for (const s of this.level.spikes) drawSpike(ctx, s.x, s.y, s.w, s.h);
    for (const e of this.level.enemies) {
      if (e.alive) {
        drawEnemy(
          ctx,
          e.x,
          e.y,
          e.w,
          e.h,
          e.dir,
          this.anim,
          e.kind,
          e.hp,
          e.maxHp,
          e.hitFlash,
          !!e.charging
        );
      }
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
      if (this.attackTimer > 0 && this.attackKind) {
        const maxT = this.attackKind === 'heavy' ? 0.28 : 0.16;
        drawSlash(
          ctx,
          this.player.x,
          this.player.y,
          this.player.facing,
          1 - this.attackTimer / maxT,
          this.attackKind === 'heavy'
        );
      }
    }
    this.particles.draw(ctx);
    ctx.restore();
    ctx.restore();
  }

  private drawMenu() {
    const ctx = this.ctx;
    const W = this.w;
    const H = this.h;
    ctx.fillStyle = 'rgba(15,23,42,0.35)';
    ctx.fillRect(0, 0, W, H);

    drawCourier(ctx, W / 2 - 12, H * 0.36, 24, 36, 1, true, 80, this.anim);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px system-ui,sans-serif';
    ctx.fillText(GAME_NAME, W / 2, H * 0.2);
    ctx.font = '15px system-ui,sans-serif';
    ctx.fillStyle = '#a5f3fc';
    ctx.fillText('Hold the line. Claim the Well.', W / 2, H * 0.2 + 30);

    if (this.menuPb > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px system-ui,sans-serif';
      ctx.fillText(`Best ${this.menuPb.toLocaleString()}`, W / 2, H * 0.2 + 56);
    }
    if (this.menuRuns > 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText(`${this.menuRuns} runs`, W / 2, H * 0.2 + 74);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px system-ui,sans-serif';
    ctx.fillText('Tap PLAY or press Enter', W / 2, H * 0.62);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui,sans-serif';
    ctx.fillText('WASD/Arrows · Space jump · J slash · K heavy', W / 2, H * 0.62 + 22);
    ctx.fillText('Mobile: buttons · P pause', W / 2, H * 0.62 + 40);
  }
}
