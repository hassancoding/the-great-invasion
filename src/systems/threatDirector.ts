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
}

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
  private banner?: Phaser.GameObjects.Text;
  private claimPressure = 0;

  constructor(scene: Phaser.Scene, sector: SectorDef) {
    this.scene = scene;
    this.sector = sector;
    this.plans = buildWaveTimeline(sector);
    this.group = scene.physics.add.group();
  }

  get enemyGroup() {
    return this.group;
  }

  get activeEnemies() {
    return this.enemies;
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
      this.spawnWave(this.plans[this.nextIndex], playerX, groundY);
      this.nextIndex++;
    }
    for (const e of this.enemies) {
      if (!e.sprite.active) continue;
      const body = e.sprite.body as Phaser.Physics.Arcade.Body;
      const dx = playerX - e.sprite.x;
      const dir = Math.sign(dx) || 1;
      body.setVelocityX(dir * e.speed);
      e.sprite.setFlipX(dir < 0);
    }
    this.enemies = this.enemies.filter((e) => e.sprite.active);
  }

  private spawnWave(plan: WavePlan, playerX: number, groundY: number) {
    this.flashBanner(plan.label);
    const worldW = this.sector.worldW;
    for (let i = 0; i < plan.count; i++) {
      const left = playerX < worldW * 0.5;
      const side = left ? 1 : -1;
      const x =
        playerX +
        side * (280 + i * 48 + Math.random() * 40) +
        (Math.random() > 0.5 ? side * 120 : 0);
      const clamped = Phaser.Math.Clamp(x, 40, worldW - 40);
      this.spawnOne(plan, clamped, groundY - 8);
    }
  }

  private spawnOne(plan: WavePlan, x: number, y: number) {
    const key = this.scene.textures.exists('enemy') ? 'enemy' : 'player';
    const spr = this.group.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
    spr.setOrigin(0.5, 1);
    spr.setScale(plan.scale);
    spr.setTint(plan.tint);
    spr.setDepth(8);
    spr.setCollideWorldBounds(true);
    const body = spr.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setSize(22, 22);
    body.setOffset((spr.width - 22) / 2, spr.height - 22);
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
    });
  }

  damageAt(x: number, y: number, radius: number, dmg: number): number {
    let kills = 0;
    for (const e of this.enemies) {
      if (!e.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(x, y, e.sprite.x, e.sprite.y - 16);
      if (dist <= radius) {
        e.hp -= dmg;
        e.sprite.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => {
          if (e.sprite.active) e.sprite.clearTint();
        });
        if (e.hp <= 0) {
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
    this.banner?.destroy();
  }
}
