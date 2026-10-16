import Phaser from 'phaser';
import type { HeroDef, HeroId } from '../data/heroes';
import type { ArinAttackId } from '../data/arinAttacks';
import type { ThreatDirector } from './threatDirector';

type ChampionId = Exclude<HeroId, 'arin'>;
export type ChampionHeroDef = HeroDef & { id: ChampionId };

export function isChampionHero(hero: HeroDef): hero is ChampionHeroDef {
  return hero.id === 'kaela' || hero.id === 'varkhul';
}

interface ChampionAttack {
  damage: number;
  radius: number;
  windupMs: number;
  recoveryMs: number;
  visualSize: number;
  hits?: number;
  dashSpeed?: number;
  dashDurationMs?: number;
  chargeMs?: number;
}

const CHAMPION_ATTACKS: Record<ChampionId, Record<ArinAttackId, ChampionAttack>> = {
  kaela: {
    light: { damage: 1, radius: 64, windupMs: 55, recoveryMs: 150, visualSize: 70 },
    heavy: { damage: 2, radius: 92, windupMs: 130, recoveryMs: 340, visualSize: 112 },
    dash: { damage: 2, radius: 84, windupMs: 35, recoveryMs: 310, visualSize: 104, dashSpeed: 420, dashDurationMs: 170 },
    air: { damage: 1, radius: 76, windupMs: 70, recoveryMs: 210, visualSize: 82 },
    charged: { damage: 3, radius: 110, windupMs: 55, recoveryMs: 440, visualSize: 132, chargeMs: 650 },
    spin: { damage: 1, radius: 98, windupMs: 115, recoveryMs: 410, visualSize: 126, hits: 2 },
    combo: { damage: 1, radius: 78, windupMs: 45, recoveryMs: 420, visualSize: 100, hits: 3 },
  },
  varkhul: {
    light: { damage: 1, radius: 80, windupMs: 135, recoveryMs: 350, visualSize: 98 },
    heavy: { damage: 3, radius: 118, windupMs: 250, recoveryMs: 590, visualSize: 152 },
    dash: { damage: 2, radius: 104, windupMs: 95, recoveryMs: 510, visualSize: 130, dashSpeed: 580, dashDurationMs: 200 },
    air: { damage: 2, radius: 94, windupMs: 170, recoveryMs: 430, visualSize: 116 },
    charged: { damage: 4, radius: 142, windupMs: 90, recoveryMs: 680, visualSize: 184, chargeMs: 850 },
    spin: { damage: 2, radius: 124, windupMs: 210, recoveryMs: 690, visualSize: 164, hits: 2 },
    combo: { damage: 2, radius: 96, windupMs: 105, recoveryMs: 610, visualSize: 122, hits: 3 },
  },
};

export class ChampionCombatController {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.Physics.Arcade.Sprite;
  private readonly hero: ChampionHeroDef;
  private readonly threat: ThreatDirector;
  private readonly onKills: (kills: number) => void;
  private readonly onBusyChange: (busy: boolean) => void;
  private readonly effect: Phaser.GameObjects.Image;
  private busy = false;
  private charging = false;
  private chargeElapsed = 0;
  private destroyed = false;
  private windupTimer?: Phaser.Time.TimerEvent;
  private impactTimer?: Phaser.Time.TimerEvent;
  private recoveryTimer?: Phaser.Time.TimerEvent;
  private dashTimer?: Phaser.Time.TimerEvent;
  private chargeTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    hero: ChampionHeroDef,
    threat: ThreatDirector,
    onKills: (kills: number) => void,
    onBusyChange: (busy: boolean) => void
  ) {
    this.scene = scene;
    this.player = player;
    this.hero = hero;
    this.threat = threat;
    this.onKills = onKills;
    this.onBusyChange = onBusyChange;
    const texture = scene.textures.exists('halcyon_rift_burst_effect')
      ? 'halcyon_rift_burst_effect'
      : 'shared_energy_burst';
    this.effect = scene.add.image(player.x, player.y, texture)
      .setOrigin(0.5)
      .setDepth(player.depth + 1)
      .setVisible(false);
  }

  get isBusy() {
    return this.busy;
  }

  start(attackId: ArinAttackId) {
    if (this.destroyed || this.busy) return false;
    this.executeAttack(attackId);
    return true;
  }

  beginCharge() {
    if (this.destroyed || this.busy) return false;
    this.busy = true;
    this.charging = true;
    this.chargeElapsed = 0;
    this.onBusyChange(true);
    this.player.setTint(this.hero.accent);
    this.effect
      .setPosition(this.player.x, this.player.y - 44)
      .setTint(this.hero.accent)
      .setFlipX(this.player.flipX)
      .setScale(0.18)
      .setAlpha(0.35)
      .setVisible(true);
    this.chargeTween = this.scene.tweens.add({
      targets: this.effect,
      scale: 0.42,
      alpha: 0.85,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return true;
  }

  releaseCharge() {
    if (!this.charging) return false;
    const required = CHAMPION_ATTACKS[this.hero.id].charged.chargeMs ?? 1;
    this.charging = false;
    this.chargeTween?.stop();
    this.chargeTween = undefined;
    if (this.chargeElapsed < required) {
      this.finishAttack();
      return false;
    }
    this.executeAttack('charged', true);
    return true;
  }

  update(delta: number) {
    if (!this.busy) return;
    if (this.charging) {
      this.chargeElapsed += delta;
      this.effect
        .setPosition(this.player.x, this.player.y - 44)
        .setFlipX(this.player.flipX);
    }
  }

  interrupt() {
    if (!this.busy) return;
    this.cancelTimers();
    this.charging = false;
    this.chargeElapsed = 0;
    this.effect.setVisible(false);
    this.player.clearTint();
    this.busy = false;
    this.onBusyChange(false);
  }

  destroy() {
    if (this.destroyed) return;
    this.interrupt();
    this.destroyed = true;
    this.effect.destroy();
  }

  private executeAttack(attackId: ArinAttackId, alreadyBusy = false) {
    if (!alreadyBusy) {
      this.busy = true;
      this.onBusyChange(true);
    }
    const attack = CHAMPION_ATTACKS[this.hero.id][attackId];
    const direction = this.player.flipX ? -1 : 1;
    if (this.charging) {
      this.chargeTween?.stop();
      this.chargeTween = undefined;
      this.charging = false;
    }
    this.player.setTint(this.hero.accent);
    this.showStrike(attack, direction);
    if (attack.dashSpeed && attack.dashDurationMs) {
      this.player.setVelocityX(direction * attack.dashSpeed);
      this.dashTimer = this.scene.time.delayedCall(attack.dashDurationMs, () => {
        if (!this.destroyed) this.player.setVelocityX(0);
        this.dashTimer = undefined;
      });
    }
    this.windupTimer = this.scene.time.delayedCall(attack.windupMs, () => {
      this.windupTimer = undefined;
      this.applyStrike(attack, direction, 0);
    });
  }

  private showStrike(attack: ChampionAttack, direction: number) {
    const targetScale = attack.visualSize / this.effect.width;
    this.effect
      .setPosition(this.player.x + direction * 38, this.player.y - 44)
      .setTint(this.hero.accent)
      .setFlipX(direction < 0)
      .setAngle(direction * (this.hero.id === 'kaela' ? -18 : 12))
      .setScale(targetScale * 0.35)
      .setAlpha(0.9)
      .setVisible(true);
    this.scene.tweens.add({
      targets: this.effect,
      scale: targetScale * (this.hero.id === 'kaela' ? 1.15 : 1.35),
      alpha: 0,
      angle: direction * (this.hero.id === 'kaela' ? 24 : -18),
      duration: attack.windupMs + 190,
      onComplete: () => this.effect.setVisible(false),
    });
  }

  private applyStrike(attack: ChampionAttack, direction: number, hitIndex: number) {
    if (this.destroyed) return;
    const verticalOffset = this.player.body && (this.player.body as Phaser.Physics.Arcade.Body).blocked.down
      ? 44
      : 60;
    const kills = this.threat.damageAt(
      this.player.x + direction * 42,
      this.player.y - verticalOffset,
      attack.radius,
      attack.damage
    );
    this.onKills(kills);
    const hitCount = attack.hits ?? 1;
    if (hitIndex + 1 < hitCount) {
      this.impactTimer = this.scene.time.delayedCall(100, () => {
        this.impactTimer = undefined;
        this.applyStrike(attack, direction, hitIndex + 1);
      });
      return;
    }
    this.recoveryTimer = this.scene.time.delayedCall(attack.recoveryMs, () => {
      this.recoveryTimer = undefined;
      this.finishAttack();
    });
  }

  private finishAttack() {
    this.cancelTimers();
    this.charging = false;
    this.chargeElapsed = 0;
    this.effect.setVisible(false);
    this.player.clearTint();
    this.busy = false;
    this.onBusyChange(false);
  }

  private cancelTimers() {
    this.windupTimer?.remove(false);
    this.impactTimer?.remove(false);
    this.recoveryTimer?.remove(false);
    this.dashTimer?.remove(false);
    this.windupTimer = undefined;
    this.impactTimer = undefined;
    this.recoveryTimer = undefined;
    this.dashTimer = undefined;
    this.chargeTween?.stop();
    this.chargeTween = undefined;
  }
}