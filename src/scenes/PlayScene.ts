import Phaser from 'phaser';
import { getHero, type HeroDef } from '../data/heroes';
import { getSector, nextSector, type SectorDef, type SectorId } from '../data/environments';
import { buildEnvironment } from '../systems/envBuilder';
import { ThreatDirector } from '../systems/threatDirector';
import { type ThreatEvent } from '../systems/threatDirector';
import { AetherWell } from '../systems/well';
import { ObjectiveProgression, type ObjectiveEvent } from '../systems/objectiveProgression';
import { type ArinAttackId } from '../data/arinAttacks';
import { ArinCombatController } from '../systems/arinCombat';
import { ChampionCombatController, isChampionHero } from '../systems/championCombat';

/** Play — sector runner with Well claim + Threat Director surges. */
export class PlayScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key; w: Phaser.Input.Keyboard.Key };
  private attacking = false;
  private hero!: HeroDef;
  private sector!: SectorDef;
  private threat!: ThreatDirector;
  private well!: AetherWell;
  private objectives?: ObjectiveProgression;
  private arinCombat?: ArinCombatController;
  private championCombat?: ChampionCombatController;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private groundY = 524;
  private lives = 3;
  private kills = 0;
  private invulnUntil = 0;
  private hudHero!: Phaser.GameObjects.Text;
  private hudObjective!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private hudWaves!: Phaser.GameObjects.Text;
  private hudBoss!: Phaser.GameObjects.Text;
  private waveClearAnnounced = false;
  private objectiveNotices: string[] = [];
  private objectiveNoticeShowing = false;
  private ended = false;
  private resourcesCleaned = true;
  private readonly onEscapeKey = () => {
    this.cleanup();
    this.scene.start('Menu');
  };
  private readonly onJumpKey = () => this.tryJump();
  private readonly onLightAttackKey = () => this.tryAttack('light');
  private readonly onHeavyAttackKey = () => this.tryAttack('heavy');
  private readonly onDashAttackKey = () => this.tryAttack('dash');
  private readonly onSpinAttackKey = () => this.tryAttack('spin');
  private readonly onComboAttackKey = () => this.tryAttack('combo');
  private readonly onChargeStart = () => {
    if (!this.arinCombat?.beginCharge()) this.championCombat?.beginCharge();
  };
  private readonly onChargeRelease = () => {
    if (!this.arinCombat?.releaseCharge()) this.championCombat?.releaseCharge();
  };

  constructor() {
    super('Play');
  }

  create(data?: { hero?: string; sector?: string }) {
    this.resourcesCleaned = false;
    this.ended = false;
    this.lives = 3;
    this.kills = 0;
    this.invulnUntil = 0;
    this.attacking = false;
    this.waveClearAnnounced = false;
    this.objectiveNotices = [];
    this.objectiveNoticeShowing = false;

    const heroId = data?.hero || this.registry.get('hero') || 'arin';
    const sectorId = data?.sector || this.registry.get('sector') || 'halcyon';
    this.hero = getHero(heroId);
    this.sector = getSector(sectorId);
    this.registry.set('hero', this.hero.id);
    this.registry.set('sector', this.sector.id);

    const built = buildEnvironment(this, this.sector);
    this.platforms = built.platforms;
    this.groundY = built.groundY;

    this.well = new AetherWell(this, this.sector, this.groundY);
    this.threat = new ThreatDirector(this, this.sector, this.handleThreatEvent);
    this.objectives = this.hero.id === 'arin' && this.sector.id === 'halcyon'
      ? new ObjectiveProgression(this.threat.waveProgress.total)
      : undefined;

    this.spawnPlayer(120, this.groundY - 4);
    if (this.hero.id === 'arin' && this.sector.id === 'halcyon') {
      this.arinCombat = new ArinCombatController(
        this,
        this.player,
        this.threat,
        (kills) => {
          this.kills += kills;
          this.refreshHud();
        },
        (busy) => { this.attacking = busy; }
      );
    } else if (isChampionHero(this.hero)) {
      this.championCombat = new ChampionCombatController(
        this,
        this.player,
        this.hero,
        this.threat,
        (kills) => {
          this.kills += kills;
          this.refreshHud();
        },
        (busy) => { this.attacking = busy; }
      );
    }
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.threat.enemyGroup, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.threat.enemyGroup,
      this.onPlayerHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    if (this.sector.id === 'halcyon') this.buildHalcyonChallenges();

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      a: this.input.keyboard!.addKey('A'),
      d: this.input.keyboard!.addKey('D'),
      w: this.input.keyboard!.addKey('W'),
    };

    this.buildHud();

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-ESC', this.onEscapeKey);
    keyboard.on('keydown-SPACE', this.onJumpKey);
    keyboard.on('keydown-W', this.onJumpKey);
    keyboard.on('keydown-UP', this.onJumpKey);
    keyboard.on('keydown-J', this.onLightAttackKey);
    keyboard.on('keydown-K', this.onHeavyAttackKey);
    keyboard.on('keydown-L', this.onDashAttackKey);
    keyboard.on('keydown-E', this.onChargeStart);
    keyboard.on('keyup-E', this.onChargeRelease);
    keyboard.on('keydown-U', this.onSpinAttackKey);
    keyboard.on('keydown-R', this.onComboAttackKey);
    // Sector advancement is intentionally locked: only Halcyon Spire is open in this build.
  }

  private buildHalcyonChallenges() {
    const spikeXs = [590, 1080, 1510, 1980];
    for (const x of spikeXs) {
      const spikeKey = this.textures.exists('halcyon_spike_trap_prop') ? 'halcyon_spike_trap_prop' : 'shared_spike_hazard';
      if (!this.textures.exists(spikeKey)) continue;
        const spike = this.physics.add.staticImage(x, this.groundY - 30, spikeKey)
          .setScale(Math.min(112 / this.textures.get(spikeKey).getSourceImage().width, 42 / this.textures.get(spikeKey).getSourceImage().height))
          .setDepth(6);
      const body = spike.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(100, 30);
      body.updateFromGameObject();
      this.physics.add.overlap(
        this.player,
        spike,
        this.onPlayerHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }

    if (this.textures.exists('shared_bounce_pad')) {
      const pad = this.physics.add.staticImage(835, this.groundY - 26, 'shared_bounce_pad')
        .setDisplaySize(92, 46)
        .setDepth(6);
      const body = pad.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(82, 28);
      body.updateFromGameObject();
      this.physics.add.overlap(
        this.player,
        pad,
        () => {
          const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
          if (playerBody.velocity.y > 0 || playerBody.blocked.down) {
            this.player.setVelocityY(-790);
            this.cameras.main.shake(90, 0.002);
            this.cameras.main.flash(120, 80, 210, 255, false);
          }
        },
        undefined,
        this
      );
      this.tweens.add({ targets: pad, y: pad.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  private buildHud() {
    this.hudHero = this.add
      .text(12, 12, `${this.hero.name}  ·  ${this.hero.title}`, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '13px',
        color: '#e0f2fe',
        backgroundColor: '#02061799',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.hudLives = this.add
      .text(12, 36, '', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        color: '#fca5a5',
        backgroundColor: '#02061788',
        padding: { x: 8, y: 3 },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.hudObjective = this.add
      .text(12, 58, '', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
        backgroundColor: '#02061788',
        padding: { x: 8, y: 3 },
        wordWrap: { width: Math.min(this.scale.width - 24, 520) },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.hudWaves = this.add
      .text(this.scale.width - 12, 40, '', {
        fontFamily: 'system-ui,sans-serif', fontSize: '12px', color: '#fde68a',
        backgroundColor: '#020617aa', padding: { x: 8, y: 4 },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.hudBoss = this.add.text(this.scale.width / 2, 82, '', {
      fontFamily: 'system-ui,sans-serif', fontSize: '13px', color: '#fda4af',
      fontStyle: 'bold', backgroundColor: '#450a0acc', padding: { x: 12, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(110).setVisible(false);
    this.add
      .text(this.scale.width - 12, 12, 'MOVE: A/D or ARROWS  JUMP: W/UP/SPACE  J: LIGHT/AIR  K: HEAVY  L: DASH  E: CHARGE  U: SPIN  R: COMBO  ESC: MENU', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '11px',
        color: '#94a3b8',
        backgroundColor: '#02061788',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.refreshHud();
  }

  private refreshHud() {
    const hearts = '♥'.repeat(this.lives) + '♡'.repeat(Math.max(0, 3 - this.lives));
    this.hudLives.setText(`${hearts}  ·  ${this.kills} kills`);
    const pct = Math.floor(this.well.claimProgress * 100);
    const wave = this.threat.waveProgress;
    this.hudWaves.setText(`SIEGE ${wave.current}/${wave.total} · ACTIVE ${this.threat.activeEnemies.length} · DEFEATED ${wave.defeated}`);
    const boss = this.threat.activeEnemies.find((enemy) => enemy.kind === 'ORUN');
    if (boss) {
      const blocks = Math.max(0, Math.ceil((boss.hp / boss.maxHp) * 16));
      this.hudBoss.setText(`ORUN · RIFT-BOUND COLOSSUS  [${'█'.repeat(blocks)}${'░'.repeat(16 - blocks)}]`);
      this.hudBoss.setVisible(true);
    } else {
      this.hudBoss.setVisible(false);
    }
    if (this.objectives?.currentStatus === 'complete') {
      this.hudObjective.setText('SECTOR I OBJECTIVES COMPLETE  ·  WELL STABILIZED');
      this.hudObjective.setColor('#86efac');
    } else if (this.objectives?.currentStatus === 'failed') {
      this.hudObjective.setText(`OBJECTIVE FAILED  ·  ${this.objectives.failureObjective?.title ?? 'Run over'}`);
      this.hudObjective.setColor('#fca5a5');
    } else if (this.objectives?.currentObjective) {
      const objective = this.objectives.currentObjective;
      this.hudObjective.setText(`OBJECTIVE ${this.objectives.currentObjectiveIndex + 1}/${this.objectives.objectiveCount}  ·  ${objective.title}\n${objective.detail}  ${this.objectives.currentProgressLabel}`);
      this.hudObjective.setColor('#fde68a');
    } else if (!this.threat.isClear) {
      this.hudObjective.setText(`${this.sector.name} · Defeat every siege wave before claiming the Well`);
      this.hudObjective.setColor('#fcd34d');
    } else if (this.well.isStabilized) {
      this.hudObjective.setText(`${this.sector.name}  ·  WELL STABILIZED`);
      this.hudObjective.setColor('#86efac');
    } else {
      this.hudObjective.setText(`${this.sector.name}  ·  Claim Well ${pct}%  ·  Hold inside the ring`);
      this.hudObjective.setColor('#94a3b8');
    }
  }

  private spawnPlayer(x: number, y: number) {
    // Keep physics bodies independent from artwork dimensions.
    const customKeys: Record<string, string> = {
      arin: 'halcyon_arin_hero',
      kaela: 'halcyon_kaela_hero',
      varkhul: 'halcyon_varkhul_hero',
    };
    const customKey = customKeys[this.hero.id];
    const useArinAtlas = this.hero.id === 'arin'
      && this.textures.exists('arin')
      && this.textures.get('arin').has('arin_idle_0');
    let bodyWidth = this.hero.bodyW;
    let bodyHeight = this.hero.bodyH;
    let bodyBottomInset = 0;
    if (useArinAtlas) {
      this.player = this.physics.add.sprite(x, y, 'arin', 'arin_idle_0');
      this.player.setOrigin(0.5, 1);
      this.player.setScale(0.43);
      bodyBottomInset = 4;
      if (this.anims.exists('arin_idle')) this.player.play('arin_idle');
    } else if (customKey && this.textures.exists(customKey)) {
      this.player = this.physics.add.sprite(x, y, customKey);
      this.player.setOrigin(0.5, 1);
      this.player.setScale(0.31);
    } else {
      const tex =
        this.hero.id === 'kaela' ? 'hero_kaela' : this.hero.id === 'varkhul' ? 'hero_varkhul' : 'hero_arin_fb';
      const key = this.textures.exists(tex) ? tex : 'player';
      this.player = this.physics.add.sprite(x, y, key);
      this.player.setOrigin(0.5, 1);
      this.player.setScale(this.hero.scale * 1.35);
      this.player.setTint(this.hero.color);
      bodyWidth *= 0.7;
      bodyHeight *= 0.75;
    }
    if (this.sector.id === 'halcyon') {
      this.setPlayerBodySize(bodyWidth, bodyHeight, bodyBottomInset);
    } else {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (useArinAtlas || (customKey && this.textures.exists(customKey))) {
        body.setSize(this.hero.bodyW, this.hero.bodyH);
        body.setOffset((this.player.width - this.hero.bodyW) / 2, this.player.height - this.hero.bodyH - bodyBottomInset);
      } else {
        body.setSize(this.hero.bodyW * 0.7, this.hero.bodyH * 0.75);
        body.setOffset((this.player.width - body.width) / 2, this.player.height - body.height);
      }
    }
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.02);
    this.player.setDepth(10);
  }

  private setPlayerBodySize(worldWidth: number, worldHeight: number, bottomInset = 0) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const scaleX = Math.abs(this.player.scaleX) || 1;
    const scaleY = Math.abs(this.player.scaleY) || 1;
    const sourceWidth = worldWidth / scaleX;
    const sourceHeight = worldHeight / scaleY;
    body.setSize(sourceWidth, sourceHeight, false);
    body.setOffset(
      (this.player.width - sourceWidth) / 2,
      this.player.height - sourceHeight - bottomInset / scaleY
    );
  }

  private cycleSector() {
    if (this.ended) return;
    const next = nextSector(this.sector.id as SectorId);
    this.registry.set('sector', next.id);
    this.cleanup();
    this.cameras.main.fadeOut(200, 2, 6, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ hero: this.hero.id, sector: next.id });
    });
  }

  private tryJump() {
    if (!this.player?.body || this.ended) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.player.setVelocityY(-this.hero.jump);
      if (this.hero.id === 'arin' && this.anims.exists('arin_jump')) this.player.play('arin_jump');
    }
  }

  private tryAttack(attackId: ArinAttackId = 'light') {
    if (this.ended) return;
    if (this.championCombat) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const grounded = body.blocked.down || body.touching.down;
      this.championCombat.start(attackId === 'light' && !grounded ? 'air' : attackId);
      return;
    }
    if (this.arinCombat) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const grounded = body.blocked.down || body.touching.down;
      this.arinCombat.start(attackId === 'light' && !grounded ? 'air' : attackId);
      return;
    }
    if (this.attacking) return;
  }

  private onPlayerHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, enemyObj) => {
    if (this.ended || this.time.now < this.invulnUntil) return;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    if (!enemy.active || (this.threat.isEnemySprite(enemy) && !this.threat.isContactThreat(enemy))) return;
    this.arinCombat?.interrupt();
    this.championCombat?.interrupt();
    this.lives -= 1;
    this.invulnUntil = this.time.now + 1200;
    this.refreshHud();
    this.player.setTint(0xf87171);
    this.cameras.main.shake(120, 0.008);
    const knock = enemy.x < this.player.x ? 180 : -180;
    this.player.setVelocity(knock, -220);
    this.time.delayedCall(200, () => {
      if (this.player?.active) {
        if (this.hero.id !== 'arin') this.player.setTint(this.hero.color);
        else this.player.clearTint();
      }
    });
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        if (this.player?.active) this.player.setAlpha(1);
      },
    });
    if (this.lives <= 0) this.failRun();
  };

  private showBanner(message: string) {
    const text = this.add.text(this.scale.width / 2, 130, message, {
      fontFamily: 'system-ui,sans-serif', fontSize: '16px', color: '#e0f2fe',
      fontStyle: 'bold', backgroundColor: '#082f49dd', padding: { x: 16, y: 9 }, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, y: 112, duration: 320, hold: 2600, yoyo: true, onComplete: () => text.destroy() });
  }

  private failRun() {
    if (this.ended) return;
    this.arinCombat?.interrupt();
    this.objectives?.fail();
    this.ended = true;
    this.showEndCard(false);
  }

  private winRun() {
    if (this.ended) return;
    this.ended = true;
    this.showEndCard(true);
  }

  private showEndCard(won: boolean) {
    const { width: w, height: h } = this.scale;
    const failureObjective = won ? undefined : this.objectives?.failureObjective;
    this.add.rectangle(w / 2, h / 2, w, h, 0x020617, 0.72).setScrollFactor(0).setDepth(200);
    this.add
      .text(w / 2, h * 0.32, won ? (this.objectives ? 'SECTOR I COMPLETE' : 'WELL STABILIZED') : failureObjective ? 'OBJECTIVE FAILED' : 'OVERRUN', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '28px',
        color: won ? '#86efac' : '#fca5a5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
    this.add
      .text(w / 2, h * 0.44, `${this.sector.name}${failureObjective ? `\nFailed at: ${failureObjective.title}` : ''}\n${this.kills} kills  ·  ${this.hero.name}`, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#cbd5e1',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
    const retry = this.add
      .text(w / 2, h * 0.6, 'RETRY', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '16px',
        color: '#0f172a',
        backgroundColor: '#38bdf8',
        padding: { x: 24, y: 10 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => {
      this.cleanup();
      this.scene.restart({ hero: this.hero.id, sector: this.sector.id });
    });
    const menu = this.add
      .text(w / 2, h * 0.72, 'MENU', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => {
      this.cleanup();
      this.scene.start('Menu');
    });
    if (won && typeof navigator !== 'undefined' && navigator.share) {
      const share = this.add
        .text(w / 2, h * 0.84, 'SHARE RUN', {
          fontFamily: 'system-ui,sans-serif',
          fontSize: '13px',
          color: '#7dd3fc',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201)
        .setInteractive({ useHandCursor: true });
      share.on('pointerdown', () => {
        navigator
          .share({
            title: 'The Great Invasion',
            text: `Stabilized ${this.sector.name} as ${this.hero.name} — ${this.kills} kills!`,
            url: window.location.href,
          })
          .catch(() => undefined);
      });
    }
  }

  private cleanup() {
    if (this.resourcesCleaned) return;
    this.resourcesCleaned = true;
    this.input.keyboard?.off('keydown-ESC', this.onEscapeKey);
    this.input.keyboard?.off('keydown-SPACE', this.onJumpKey);
    this.input.keyboard?.off('keydown-J', this.onLightAttackKey);
    this.input.keyboard?.off('keydown-K', this.onHeavyAttackKey);
    this.input.keyboard?.off('keydown-L', this.onDashAttackKey);
    this.input.keyboard?.off('keydown-U', this.onSpinAttackKey);
    this.input.keyboard?.off('keydown-R', this.onComboAttackKey);
    this.input.keyboard?.off('keydown-E', this.onChargeStart);
    this.input.keyboard?.off('keyup-E', this.onChargeRelease);
    this.arinCombat?.destroy();
    this.arinCombat = undefined;
    this.championCombat?.destroy();
    this.championCombat = undefined;
    this.threat?.destroy();
    this.well?.destroy();
  }

  private handleThreatEvent = (event: ThreatEvent) => {
    if (!this.objectives) return;
    if (event.type === 'wave-cleared') {
      this.recordObjectiveEvent({ type: 'wave-cleared', waveIndex: event.waveIndex });
    } else if (event.kind === 'ORUN') {
      this.recordObjectiveEvent({ type: 'enemy-defeated', enemyKind: event.kind });
    }
  };

  private recordObjectiveEvent(event: ObjectiveEvent) {
    if (!this.objectives) return;
    const completed = this.objectives.record(event);
    if (!completed.length) return;
    for (const objective of completed) {
      this.queueObjectiveNotice(`OBJECTIVE COMPLETE\n${objective.title}`);
    }
    const next = this.objectives.currentObjective;
    this.queueObjectiveNotice(next ? `NEXT OBJECTIVE\n${next.title}` : 'SECTOR I OBJECTIVES COMPLETE');
    this.refreshHud();
  }

  private queueObjectiveNotice(message: string) {
    this.objectiveNotices.push(message);
    if (!this.objectiveNoticeShowing) this.showNextObjectiveNotice();
  }

  private showNextObjectiveNotice() {
    const message = this.objectiveNotices.shift();
    if (!message) {
      this.objectiveNoticeShowing = false;
      return;
    }
    this.objectiveNoticeShowing = true;
    const text = this.add.text(this.scale.width / 2, 130, message, {
      fontFamily: 'system-ui,sans-serif', fontSize: '15px', color: '#e0f2fe',
      fontStyle: 'bold', backgroundColor: '#082f49ee', padding: { x: 16, y: 9 }, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(155).setAlpha(0);
    this.tweens.add({
      targets: text,
      alpha: 1,
      y: 112,
      duration: 260,
      hold: 1500,
      yoyo: true,
      onComplete: () => {
        text.destroy();
        this.objectiveNoticeShowing = false;
        this.showNextObjectiveNotice();
      },
    });
  }

  update(_time: number, delta: number) {
    if (this.ended || !this.player?.body) return;
    this.arinCombat?.update(delta);
    this.threat.update(delta, this.player.x, this.groundY);
    const siegeClear = this.threat.isClear;
    this.threat.setClaimPressure(siegeClear ? this.well.claimProgress : 0);
    if (siegeClear) {
      this.well.update(delta, this.player.x, this.player.y);
      if (!this.waveClearAnnounced) {
        this.waveClearAnnounced = true;
        this.recordObjectiveEvent({ type: 'all-waves-cleared' });
        this.cameras.main.flash(450, 90, 210, 255, false);
        if (!this.objectives) this.showBanner('ALL WAVES DEFEATED — STABILIZE THE AETHER WELL');
      }
      this.recordObjectiveEvent({ type: 'well-progress', progress: this.well.claimProgress });
      if (this.well.isStabilized && this.objectives?.currentStatus === 'active') {
        this.recordObjectiveEvent({ type: 'well-stabilized' });
      }
    }
    if (this.well.isStabilized && siegeClear) this.winRun();
    this.refreshHud();
    if (this.attacking) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const up = this.cursors.up.isDown || this.wasd.w.isDown;
    const speed = this.hero.speed;
    if (left) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      if (body.blocked.down && this.hero.id === 'arin' && this.anims.exists('arin_run')) {
        this.player.play('arin_run', true);
      }
    } else if (right) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      if (body.blocked.down && this.hero.id === 'arin' && this.anims.exists('arin_run')) {
        this.player.play('arin_run', true);
      }
    } else {
      this.player.setVelocityX(0);
      if (body.blocked.down && this.hero.id === 'arin' && this.anims.exists('arin_idle')) {
        this.player.play('arin_idle', true);
      }
    }
    if (up && (body.blocked.down || body.touching.down)) this.tryJump();
  }
}
