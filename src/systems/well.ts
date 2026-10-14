import Phaser from 'phaser';
import type { SectorDef } from '../data/environments';

export type WellState = 'unstable' | 'claiming' | 'stabilized';

/** Aether Well — stand in radius to claim. Progress decays when leaving. */
export class AetherWell {
  readonly x: number;
  readonly y: number;
  readonly radius = 70;
  private scene: Phaser.Scene;
  private sector: SectorDef;
  private progress = 0;
  private state: WellState = 'unstable';
  private readonly claimRate = 0.22;
  private readonly decayRate = 0.08;

  private beacon!: Phaser.GameObjects.Graphics;
  private ring!: Phaser.GameObjects.Graphics;
  private barBg!: Phaser.GameObjects.Rectangle;
  private barFill!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, sector: SectorDef, groundY: number) {
    this.scene = scene;
    this.sector = sector;
    this.x = Math.floor(sector.worldW * 0.72);
    this.y = groundY;
    this.buildVisuals();
  }

  get claimProgress() {
    return this.progress;
  }

  get isStabilized() {
    return this.state === 'stabilized';
  }

  get currentState() {
    return this.state;
  }

  update(delta: number, playerX: number, playerY: number) {
    if (this.state === 'stabilized') return;
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const inside = dist <= this.radius;
    const dt = delta / 1000;
    if (inside) {
      this.progress = Math.min(1, this.progress + this.claimRate * dt);
      this.state = this.progress >= 1 ? 'stabilized' : 'claiming';
    } else if (this.progress > 0) {
      this.progress = Math.max(0, this.progress - this.decayRate * dt);
      this.state = 'unstable';
    }
    this.refreshVisuals(inside);
    if (this.state === 'stabilized') this.onStabilized();
  }

  private buildVisuals() {
    const accent = this.sector.accent;
    const fog = this.sector.fog;
    this.beacon = this.scene.add.graphics().setDepth(6);
    this.beacon.fillStyle(accent, 0.25);
    this.beacon.fillCircle(this.x, this.y - 4, this.radius);
    this.beacon.lineStyle(2, accent, 0.7);
    this.beacon.strokeCircle(this.x, this.y - 4, this.radius);
    this.beacon.fillStyle(fog, 0.9);
    this.beacon.fillCircle(this.x, this.y - 28, 10);
    this.beacon.fillStyle(accent, 1);
    this.beacon.fillTriangle(
      this.x,
      this.y - 56,
      this.x - 10,
      this.y - 28,
      this.x + 10,
      this.y - 28
    );
    this.ring = this.scene.add.graphics().setDepth(7);
    this.barBg = this.scene.add
      .rectangle(this.x, this.y - 78, 90, 10, 0x020617, 0.85)
      .setDepth(15);
    this.barFill = this.scene.add
      .rectangle(this.x - 44, this.y - 78, 2, 8, accent, 1)
      .setOrigin(0, 0.5)
      .setDepth(16);
    this.label = this.scene.add
      .text(this.x, this.y - 96, 'AETHER WELL', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '11px',
        color: '#e0f2fe',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(16);
    this.pulseTween = this.scene.tweens.add({
      targets: this.beacon,
      alpha: { from: 0.85, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  private refreshVisuals(inside: boolean) {
    const accent = this.sector.accent;
    this.barFill.width = Math.max(2, 88 * this.progress);
    this.barFill.setFillStyle(inside ? 0x4ade80 : accent, 1);
    this.ring.clear();
    if (inside && this.state !== 'stabilized') {
      this.ring.lineStyle(3, 0x4ade80, 0.7);
      this.ring.strokeCircle(this.x, this.y - 4, this.radius);
      this.label.setText('HOLD TO STABILIZE');
      this.label.setColor('#86efac');
    } else if (this.state === 'stabilized') {
      this.label.setText('WELL STABILIZED');
      this.label.setColor('#4ade80');
    } else {
      this.label.setText('AETHER WELL');
      this.label.setColor('#e0f2fe');
    }
  }

  private onStabilized() {
    this.pulseTween?.stop();
    this.beacon.setAlpha(1);
    this.ring.clear();
    this.ring.lineStyle(4, 0x4ade80, 1);
    this.ring.strokeCircle(this.x, this.y - 4, this.radius);
    this.barFill.width = 88;
    this.barFill.setFillStyle(0x4ade80, 1);
    const burst = this.scene.add.graphics().setDepth(20);
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      duration: 600,
      onUpdate: () => {
        burst.clear();
        const t = 1 - (burst.alpha || 0);
        burst.lineStyle(2, 0x4ade80, 1 - t);
        burst.strokeCircle(this.x, this.y - 28, 12 + t * 50);
      },
      onComplete: () => burst.destroy(),
    });
  }

  destroy() {
    this.pulseTween?.stop();
    this.beacon.destroy();
    this.ring.destroy();
    this.barBg.destroy();
    this.barFill.destroy();
    this.label.destroy();
  }
}
