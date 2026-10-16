import Phaser from 'phaser';
import { ARIN_ATTACKS, getArinAttackTextureKey, type ArinAttackDefinition, type ArinAttackId } from '../data/arinAttacks';
import type { ThreatDirector } from './threatDirector';

export class ArinCombatController {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.Physics.Arcade.Sprite;
  private readonly attackVisual: Phaser.GameObjects.Sprite;
  private readonly threat: ThreatDirector;
  private readonly onKills: (kills: number) => void;
  private readonly onBusyChange: (busy: boolean) => void;
  private currentAttack?: ArinAttackDefinition;
  private hitWindows = new Set<string>();
  private busy = false;
  private charging = false;
  private chargeElapsed = 0;
  private recoveryTimer?: Phaser.Time.TimerEvent;
  private dashTimer?: Phaser.Time.TimerEvent;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    threat: ThreatDirector,
    onKills: (kills: number) => void,
    onBusyChange: (busy: boolean) => void
  ) {
    this.scene = scene;
    this.player = player;
    this.threat = threat;
    this.onKills = onKills;
    this.onBusyChange = onBusyChange;
    this.attackVisual = scene.add.sprite(player.x, player.y, 'arin', 'arin_idle_0')
      .setOrigin(0.5, 1)
      .setDepth(player.depth + 1)
      .setVisible(false);
    this.attackVisual.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.handleAnimationUpdate, this);
    this.attackVisual.on(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);
  }

  get isBusy() {
    return this.busy;
  }

  get isCharging() {
    return this.charging;
  }

  get chargeProgress() {
    const required = ARIN_ATTACKS.charged.chargeMs ?? 1;
    return Math.min(1, this.chargeElapsed / required);
  }

  start(attackId: ArinAttackId) {
    if (this.destroyed || this.busy) return false;
    return this.playAttack(attackId);
  }

  beginCharge() {
    if (this.destroyed || this.busy || !this.scene.anims.exists('arin_charge_loop')) return false;
    this.setBusy(true);
    this.charging = true;
    this.chargeElapsed = 0;
    this.player.setVisible(false);
    this.attackVisual
      .setPosition(this.player.x, this.player.y)
      .setFlipX(this.player.flipX)
      .setScale(this.scaleForAttack(ARIN_ATTACKS.charged))
      .setTint(0x8be9ff)
      .setVisible(true)
      .play('arin_charge_loop', true);
    return true;
  }

  releaseCharge() {
    if (!this.charging) return false;
    const fullyCharged = this.chargeElapsed >= (ARIN_ATTACKS.charged.chargeMs ?? 0);
    this.charging = false;
    if (!fullyCharged) {
      this.finishBusy();
      return false;
    }
    return this.playAttack('charged', true);
  }

  update(delta: number) {
    if (!this.busy) return;
    if (this.charging) this.chargeElapsed += delta;
    this.attackVisual
      .setPosition(this.player.x, this.player.y)
      .setFlipX(this.player.flipX);
  }

  interrupt() {
    if (!this.busy) return;
    this.recoveryTimer?.remove(false);
    this.dashTimer?.remove(false);
    this.recoveryTimer = undefined;
    this.dashTimer = undefined;
    this.currentAttack = undefined;
    this.charging = false;
    this.hitWindows.clear();
    this.attackVisual.anims.stop();
    this.attackVisual.clearTint().setVisible(false);
    this.player.setVisible(true);
    if (this.scene.anims.exists('arin_idle')) this.player.play('arin_idle', true);
    this.setBusy(false);
  }

  destroy() {
    if (this.destroyed) return;
    this.interrupt();
    this.destroyed = true;
    this.attackVisual.off(Phaser.Animations.Events.ANIMATION_UPDATE, this.handleAnimationUpdate, this);
    this.attackVisual.off(Phaser.Animations.Events.ANIMATION_COMPLETE, this.handleAnimationComplete, this);
    this.attackVisual.destroy();
  }

  private playAttack(attackId: ArinAttackId, fromCharge = false) {
    const attack = ARIN_ATTACKS[attackId];
    if (!fromCharge) this.setBusy(true);
    this.charging = false;
    this.currentAttack = attack;
    this.hitWindows.clear();
    this.player.setVisible(false);
    this.attackVisual
      .clearTint()
      .setPosition(this.player.x, this.player.y)
      .setFlipX(this.player.flipX)
      .setScale(this.scaleForAttack(attack))
      .setVisible(true);

    if (attack.dashSpeed && attack.dashDurationMs) {
      const direction = this.player.flipX ? -1 : 1;
      this.player.setVelocityX(direction * attack.dashSpeed);
      this.dashTimer = this.scene.time.delayedCall(attack.dashDurationMs, () => {
        if (!this.destroyed) this.player.setVelocityX(0);
        this.dashTimer = undefined;
      });
    }
    this.attackVisual.play(attack.animationKey, true);
    return true;
  }

  private scaleForAttack(attack: ArinAttackDefinition) {
    let largestDimension = 1;
    for (const file of attack.playbackFiles) {
      const texture = this.scene.textures.get(getArinAttackTextureKey(attack.category, file));
      const image = texture.getSourceImage() as HTMLImageElement;
      largestDimension = Math.max(largestDimension, image.width, image.height);
    }
    return Math.min(Math.abs(this.player.scaleX), 360 / largestDimension);
  }

  private handleAnimationUpdate(animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) {
    const attack = this.currentAttack;
    if (!attack || animation.key !== attack.animationKey || !attack.activeFrames.length) return;
    if (!attack.activeFrames.some((file) => getArinAttackTextureKey(attack.category, file) === frame.textureKey)) return;
    if (this.hitWindows.has(frame.textureKey)) return;
    this.hitWindows.add(frame.textureKey);

    const direction = this.player.flipX ? -1 : 1;
    const verticalOffset = attack.id === 'air' ? 60 : 44;
    const kills = this.threat.damageAt(
      this.player.x + direction * 42,
      this.player.y - verticalOffset,
      attack.hitRadius,
      attack.damage
    );
    this.onKills(kills);
  }

  private handleAnimationComplete(animation: Phaser.Animations.Animation) {
    if (!this.currentAttack || animation.key !== this.currentAttack.animationKey) return;
    const recovery = this.currentAttack.recoveryMs;
    this.currentAttack = undefined;
    this.attackVisual.setVisible(false);
    this.player.setVisible(true);
    if (this.scene.anims.exists('arin_idle')) this.player.play('arin_idle', true);
    this.recoveryTimer = this.scene.time.delayedCall(recovery, () => {
      this.recoveryTimer = undefined;
      this.hitWindows.clear();
      this.setBusy(false);
    });
  }

  private finishBusy() {
    this.currentAttack = undefined;
    this.charging = false;
    this.chargeElapsed = 0;
    this.hitWindows.clear();
    this.attackVisual.anims.stop();
    this.attackVisual.clearTint().setVisible(false);
    this.player.setVisible(true);
    if (this.scene.anims.exists('arin_idle')) this.player.play('arin_idle', true);
    this.setBusy(false);
  }

  private setBusy(busy: boolean) {
    this.busy = busy;
    this.onBusyChange(busy);
  }
}