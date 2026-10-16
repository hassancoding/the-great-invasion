import Phaser from 'phaser';
import type { SectorDef } from '../data/environments';

export type WaveKind = 'SWARM' | 'WALL' | 'REAVER' | 'MIXED' | 'ORUN';

export interface WavePlan {
  kind: WaveKind;
  label: string;
  count: number;
  hp: number;
  speed: number;
  tint: number;
  scale: number;
  atMs: number;
}

export interface EnemyUnit {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  speed: number;
  kind: WaveKind;
  waveIndex: number;
  defeated: boolean;
  behavior: 'chase' | 'crystal-wolf';
  houndState: 'approach' | 'telegraph' | 'lunge' | 'recovery';
  houndTimer: number;
  houndDirection: number;
}

export type ThreatEvent =
  | { type: 'enemy-defeated'; kind: WaveKind; waveIndex: number }
  | { type: 'wave-cleared'; kind: WaveKind; waveIndex: number };

export function buildWaveTimeline(sector: SectorDef): WavePlan[] {
  const accent = sector.accent;
  // Halcyon is the current campaign focus: the escalating siege must be survived,
  // not bypassed by simply standing on the Aether Well.
  const base: WavePlan[] = [
    { kind: 'SWARM', label: 'SCOUTS — FIRST CONTACT', count: 3, hp: 1, speed: 82, tint: accent, scale: 0.72, atMs: 3500 },
    { kind: 'SWARM', label: 'GRAVELING PACK', count: 5, hp: 1, speed: 100, tint: 0x7dd3fc, scale: 0.82, atMs: 11000 },
    { kind: 'WALL', label: 'SHARD LEGIONNAIRES', count: 2, hp: 3, speed: 48, tint: 0xf87171, scale: 1.25, atMs: 19500 },
    { kind: 'REAVER', label: 'AETHER STALKERS', count: 4, hp: 2, speed: 145, tint: 0xfbbf24, scale: 0.88, atMs: 28000 },
    { kind: 'MIXED', label: 'THE SECOND BREACH', count: 6, hp: 2, speed: 105, tint: 0xc084fc, scale: 1, atMs: 39000 },
    { kind: 'WALL', label: 'ARMORED BREAKERS', count: 3, hp: 4, speed: 58, tint: 0xfb7185, scale: 1.4, atMs: 51000 },
    { kind: 'REAVER', label: 'RIFT HOUNDS', count: 5, hp: 2, speed: 165, tint: 0xf59e0b, scale: 0.78, atMs: 63000 },
    { kind: 'MIXED', label: 'SIEGE WAVE', count: 8, hp: 3, speed: 112, tint: 0xe879f9, scale: 1.05, atMs: 76000 },
    { kind: 'WALL', label: 'ELITE LEGION', count: 4, hp: 5, speed: 62, tint: 0xef4444, scale: 1.5, atMs: 90000 },
    { kind: 'ORUN', label: 'ORUN, RIFT-BOUND COLOSSUS', count: 1, hp: 18, speed: 74, tint: 0xf43f5e, scale: 2.05, atMs: 106000 },
    { kind: 'MIXED', label: 'FINAL BREACH — HOLD THE WELL', count: 8, hp: 3, speed: 125, tint: 0x67e8f9, scale: 1.12, atMs: 124000 },
  ];
  if (sector.id === 'halcyon') return base;
  // Other sectors retain their existing prototype difficulty until their own pass.
  return base.slice(0, 5);
}

export class ThreatDirector {
  private scene: Phaser.Scene;
  private sector: SectorDef;
  private plans: WavePlan[];
  private nextIndex = 0;
  private elapsed = 0;
  private enemies: EnemyUnit[] = [];
  private group: Phaser.Physics.Arcade.Group;
  private readonly remainingByWave = new Map<number, number>();
  private banner?: Phaser.GameObjects.Text;
  private claimPressure = 0;
  private defeatedCount = 0;
  private readonly onEvent?: (event: ThreatEvent) => void;

  constructor(scene: Phaser.Scene, sector: SectorDef, onEvent?: (event: ThreatEvent) => void) {
    this.scene = scene;
    this.sector = sector;
    this.plans = buildWaveTimeline(sector);
    this.group = scene.physics.add.group();
    this.onEvent = onEvent;
  }

  get enemyGroup() {
    return this.group;
  }

  get activeEnemies() {
    return this.enemies.filter((enemy) => enemy.sprite.active && !enemy.defeated);
  }

  isEnemySprite(sprite: Phaser.Physics.Arcade.Sprite) {
    return this.enemies.some((enemy) => enemy.sprite === sprite);
  }

  isContactThreat(sprite: Phaser.Physics.Arcade.Sprite) {
    const enemy = this.enemies.find((unit) => unit.sprite === sprite);
    if (!enemy || enemy.defeated || !enemy.sprite.active) return false;
    return enemy.behavior !== 'crystal-wolf' || enemy.houndState === 'lunge';
  }

  get allWavesDispatched() {
    return this.nextIndex >= this.plans.length;
  }

  get isClear() {
    return this.allWavesDispatched && this.enemies.length === 0;
  }

  get waveProgress() {
    return { current: this.nextIndex, total: this.plans.length, defeated: this.defeatedCount };
  }

  setClaimPressure(t: number) {
    this.claimPressure = Phaser.Math.Clamp(t, 0, 1);
  }

  update(delta: number, playerX: number, groundY: number) {
    this.elapsed += delta * (1 + this.claimPressure * 0.55);
    while (
      this.nextIndex < this.plans.length &&
      this.elapsed >= this.plans[this.nextIndex].atMs
    ) {
      const waveIndex = this.nextIndex;
      this.spawnWave(this.plans[waveIndex], playerX, groundY, waveIndex);
      this.nextIndex++;
    }
    for (const e of this.enemies) {
      if (!e.sprite.active || e.defeated) continue;
      if (e.behavior === 'crystal-wolf') {
        this.updateCrystalWolf(e, playerX, delta);
        continue;
      }
      const body = e.sprite.body as Phaser.Physics.Arcade.Body;
      const dx = playerX - e.sprite.x;
      const dir = Math.sign(dx) || 1;
      body.setVelocityX(dir * e.speed);
      e.sprite.setFlipX(dir < 0);
    }
    this.enemies = this.enemies.filter((e) => e.sprite.active && !e.defeated);
  }

  private spawnWave(plan: WavePlan, playerX: number, groundY: number, waveIndex: number) {
    this.flashBanner(plan.label);
    const worldW = this.sector.worldW;
    this.remainingByWave.set(waveIndex, plan.count);
    for (let i = 0; i < plan.count; i++) {
      const left = playerX < worldW * 0.5;
      const side = left ? 1 : -1;
      const spread = (waveIndex * 17 + i * 23) % 41;
      const flank = (waveIndex + i) % 2 === 0 ? 120 : 0;
      const x = playerX + side * (280 + i * 48 + spread + flank);
      const clamped = Phaser.Math.Clamp(x, 40, worldW - 40);
      this.spawnOne(plan, clamped, groundY - 8, waveIndex, i);
    }
  }

  private spawnOne(plan: WavePlan, x: number, y: number, waveIndex: number, unitIndex: number) {
    const useGraveling = this.sector.id === 'halcyon'
      && (plan.kind === 'SWARM' || (plan.kind === 'MIXED' && unitIndex % 3 === 0))
      && this.scene.textures.exists('halcyon_graveling_sprite');
    const useOrun = this.sector.id === 'halcyon' && plan.kind === 'ORUN' && this.scene.textures.exists('halcyon_orun_boss_sprite');
    const useRiftHound = this.sector.id === 'halcyon'
      && (plan.label === 'RIFT HOUNDS' || (plan.kind === 'MIXED' && unitIndex % 3 === 1))
      && this.scene.textures.exists('halcyon_rift_hound');
    const key = useGraveling ? 'halcyon_graveling_sprite' : useOrun ? 'halcyon_orun_boss_sprite' : useRiftHound ? 'halcyon_rift_hound' : ensureEnemyTexture(this.scene, plan.kind);
    const spr = this.group.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    spr.setOrigin(0.5, 1);
    spr.setScale(useGraveling ? 0.34 : useOrun ? 0.48 : useRiftHound ? 0.44 : plan.scale);
    if (!useGraveling && !useOrun && !useRiftHound) spr.setTint(plan.tint);
    if (useRiftHound && this.scene.anims.exists('halcyon_rift_hound_walk')) spr.play('halcyon_rift_hound_walk');
    spr.setDepth(8);
    spr.setCollideWorldBounds(true);
    const body = spr.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    if (this.sector.id === 'halcyon') {
      const bodyDimensions = useRiftHound
        ? { width: 48, height: 36 }
        : plan.kind === 'ORUN'
          ? { width: 92, height: 132 }
          : plan.kind === 'WALL'
            ? { width: 34, height: 48 }
            : plan.kind === 'REAVER'
              ? { width: 30, height: 30 }
              : { width: 24, height: 26 };
      const sourceWidth = bodyDimensions.width / (Math.abs(spr.scaleX) || 1);
      const sourceHeight = bodyDimensions.height / (Math.abs(spr.scaleY) || 1);
      body.setSize(sourceWidth, sourceHeight, false);
      body.setOffset((spr.width - sourceWidth) / 2, spr.height - sourceHeight);
    } else {
      const bodySize = plan.kind === 'ORUN' ? 34 : plan.kind === 'WALL' ? 28 : 20;
      body.setSize(bodySize, bodySize);
      body.setOffset((spr.width - bodySize) / 2, spr.height - bodySize);
    }
    if (plan.kind === 'REAVER' && !useRiftHound) {
      this.scene.tweens.add({ targets: spr, y: y - 9, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (plan.kind === 'ORUN') {
      this.scene.tweens.add({
        targets: spr,
        scaleX: plan.scale * 1.08,
        scaleY: plan.scale * 0.95,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
    this.enemies.push({
      sprite: spr,
      hp: plan.hp,
      maxHp: plan.hp,
      speed: plan.speed,
      kind: plan.kind,
      waveIndex,
      defeated: false,
      behavior: useRiftHound ? 'crystal-wolf' : 'chase',
      houndState: 'approach',
      houndTimer: 0,
      houndDirection: 1,
    });
  }

  private updateCrystalWolf(enemy: EnemyUnit, playerX: number, delta: number) {
    const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
    const distance = playerX - enemy.sprite.x;
    const direction = Math.sign(distance) || enemy.houndDirection;

    if (enemy.houndState === 'approach') {
      body.setVelocityX(direction * enemy.speed);
      enemy.sprite.setFlipX(direction < 0);
      if (Math.abs(distance) <= 152) {
        enemy.houndState = 'telegraph';
        enemy.houndTimer = 460;
        enemy.houndDirection = direction;
        body.setVelocityX(0);
        enemy.sprite.setTint(0xfef08a);
        enemy.sprite.anims.pause();
      }
      return;
    }

    enemy.houndTimer -= delta;
    if (enemy.houndState === 'telegraph') {
      body.setVelocityX(0);
      if (enemy.houndTimer <= 0) {
        enemy.houndState = 'lunge';
        enemy.houndTimer = 340;
        enemy.sprite.setFlipX(enemy.houndDirection < 0);
        enemy.sprite.setTint(0x67e8f9);
        enemy.sprite.anims.resume();
      }
      return;
    }

    if (enemy.houndState === 'lunge') {
      body.setVelocityX(enemy.houndDirection * 310);
      if (enemy.houndTimer <= 0) {
        enemy.houndState = 'recovery';
        enemy.houndTimer = 760;
        body.setVelocityX(0);
        enemy.sprite.setTint(0x94a3b8);
        enemy.sprite.anims.pause();
      }
      return;
    }

    body.setVelocityX(0);
    if (enemy.houndTimer <= 0) {
      enemy.houndState = 'approach';
      enemy.sprite.clearTint();
      enemy.sprite.anims.resume();
    }
  }

  damageAt(x: number, y: number, radius: number, dmg: number): number {
    let kills = 0;
    for (const e of this.enemies) {
      if (!e.sprite.active || e.defeated) continue;
      const dist = Phaser.Math.Distance.Between(x, y, e.sprite.x, e.sprite.y - 16);
      if (dist <= radius) {
        e.hp -= dmg;
        e.sprite.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => {
          if (!e.sprite.active) return;
          if (e.behavior === 'crystal-wolf' && e.houndState !== 'approach') {
            e.sprite.setTint(e.houndState === 'telegraph' ? 0xfef08a : e.houndState === 'lunge' ? 0x67e8f9 : 0x94a3b8);
          } else {
            e.sprite.clearTint();
          }
        });
        if (e.hp <= 0) {
          e.defeated = true;
          this.defeatedCount++;
          this.onEvent?.({ type: 'enemy-defeated', kind: e.kind, waveIndex: e.waveIndex });
          const remaining = (this.remainingByWave.get(e.waveIndex) ?? 1) - 1;
          if (remaining <= 0) {
            this.remainingByWave.delete(e.waveIndex);
            this.onEvent?.({ type: 'wave-cleared', kind: e.kind, waveIndex: e.waveIndex });
          } else {
            this.remainingByWave.set(e.waveIndex, remaining);
          }
          if (this.sector.id === 'halcyon' && this.scene.textures.exists('halcyon_rift_burst_effect')) {
            const burst = this.scene.add.image(e.sprite.x, e.sprite.y - 24, 'halcyon_rift_burst_effect')
              .setDisplaySize(e.kind === 'ORUN' ? 132 : 64, e.kind === 'ORUN' ? 132 : 64)
              .setDepth(9)
              .setBlendMode(Phaser.BlendModes.ADD)
              .setAlpha(0.9);
            this.scene.tweens.add({
              targets: burst,
              scale: { from: 0.45, to: 1.35 },
              alpha: { from: 0.9, to: 0 },
              angle: { from: 0, to: 35 },
              duration: e.kind === 'ORUN' ? 420 : 230,
              onComplete: () => burst.destroy(),
            });
          }
          this.scene.tweens.add({
            targets: e.sprite,
            alpha: 0,
            y: e.sprite.y - 20,
            duration: 180,
            onComplete: () => e.sprite.destroy(),
          });
          kills++;
        }
      }
    }
    return kills;
  }

  private flashBanner(label: string) {
    const { width: w } = this.scene.scale;
    if (this.banner) this.banner.destroy();
    this.banner = this.scene.add
      .text(w / 2, 100, `⚠ ${label}`, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '18px',
        color: '#fecaca',
        fontStyle: 'bold',
        backgroundColor: '#450a0acc',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: this.banner,
      alpha: 1,
      duration: 200,
      hold: 1400,
      yoyo: true,
      onComplete: () => {
        this.banner?.destroy();
        this.banner = undefined;
      },
    });
  }

  destroy() {
    this.group.clear(true, true);
    this.enemies = [];
    this.remainingByWave.clear();
    this.banner?.destroy();
  }
}

/** Distinct lightweight silhouettes keep enemy classes readable even without external sprites. */
function ensureEnemyTexture(scene: Phaser.Scene, kind: WaveKind): string {
  const key = `enemy_${kind.toLowerCase()}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const colors: Record<WaveKind, { main: number; dark: number; glow: number }> = {
    SWARM: { main: 0x60a5fa, dark: 0x1e3a8a, glow: 0xbfdbfe },
    WALL: { main: 0xf87171, dark: 0x7f1d1d, glow: 0xfecaca },
    REAVER: { main: 0xfbbf24, dark: 0x78350f, glow: 0xfef3c7 },
    MIXED: { main: 0xc084fc, dark: 0x581c87, glow: 0xf3e8ff },
    ORUN: { main: 0xf43f5e, dark: 0x4c0519, glow: 0xfda4af },
  };
  const color = colors[kind];
  g.fillStyle(color.dark, 1);
  if (kind === 'WALL' || kind === 'ORUN') g.fillRoundedRect(5, 8, 38, 48, kind === 'ORUN' ? 5 : 9);
  else if (kind === 'REAVER') g.fillTriangle(24, 2, 3, 46, 45, 46);
  else if (kind === 'MIXED') g.fillTriangle(24, 3, 46, 25, 24, 49);
  else g.fillCircle(24, 28, 19);
  g.fillStyle(color.main, 1);
  if (kind === 'WALL' || kind === 'ORUN') {
    g.fillRoundedRect(10, 12, 28, 38, 6);
    g.fillTriangle(10, 18, 2, 5, 20, 14);
    g.fillTriangle(38, 18, 46, 5, 28, 14);
  } else if (kind === 'REAVER') {
    g.fillTriangle(24, 8, 8, 40, 40, 40);
    g.fillTriangle(24, 4, 18, 21, 30, 21);
  } else if (kind === 'MIXED') {
    g.fillTriangle(24, 7, 40, 25, 24, 43);
    g.fillTriangle(24, 7, 8, 25, 24, 43);
  } else {
    g.fillCircle(24, 28, 15);
    g.fillTriangle(10, 16, 1, 4, 19, 14);
    g.fillTriangle(38, 16, 47, 4, 29, 14);
  }
  g.fillStyle(color.glow, 1);
  g.fillRect(14, 22, 6, 4);
  g.fillRect(28, 22, 6, 4);
  g.fillStyle(0xffffff, 0.65);
  g.fillRect(20, 34, 8, 3);
  g.generateTexture(key, 48, 56);
  g.destroy();
  return key;
}
