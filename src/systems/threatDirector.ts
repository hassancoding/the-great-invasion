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
  const base: WavePlan[] = [
    { kind: 'SWARM', label: 'SWARM', count: 4, hp: 1, speed: 90, tint: accent, scale: 0.85, atMs: 4000 },
    { kind: 'WALL', label: 'WALL', count: 2, hp: 3, speed: 55, tint: 0xf87171, scale: 1.25, atMs: 14000 },
    { kind: 'REAVER', label: 'REAVER', count: 3, hp: 2, speed: 140, tint: 0xfbbf24, scale: 0.95, atMs: 24000 },
    { kind: 'MIXED', label: 'MIXED SURGE', count: 5, hp: 2, speed: 100, tint: 0xc084fc, scale: 1.0, atMs: 36000 },
    { kind: 'ORUN', label: 'ORUN REAVER', count: 1, hp: 8, speed: 70, tint: 0xf43f5e, scale: 1.6, atMs: 50000 },
  ];
  if (sector.id === 'ashfall') {
    base[2].count += 1;
    base[3].count += 1;
  }
  if (sector.id === 'ruins') {
    base[1].hp += 1;
    base[4].hp += 2;
  }
  return base;
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
