import Phaser from 'phaser';
import { COMBAT, PHYSICS, TILE } from '../config';
import { LEVELS, levelPixelHeight, levelPixelWidth } from '../data/levels';
import {
  ENEMY_STATS,
  emptyStats,
  planApexElite,
  planSurge,
  type EnemyKind,
  type ThreatStats,
  type WavePlan,
} from '../systems/ThreatDirector';
import { Audio } from '../systems/AudioManager';
import {
  applyPlayCamera,
  setupEnemyBody,
  setupPlayerBody,
} from '../utils/visualHelpers';
import {
  bumpRunCount,
  getPb,
  onFullClear,
  setDailyBest,
  setPb,
  todayKey,
} from '../systems/Progression';

type SectorMode = 'explore' | 'claiming' | 'surge';
type RunMode = 'campaign' | 'daily';
type EnemyGo = Phaser.Physics.Arcade.Sprite & {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  dir: 1 | -1;
  stun: number;
  chargeCd: number;
  charging: boolean;
};

export class PlayScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private crystals!: Phaser.Physics.Arcade.Group;
  private well!: Phaser.Physics.Arcade.Sprite;

  private levelIndex = 0;
  private lives = 3;
  private score = 0;
  private crystalsCount = 0;
  private timeAlive = 0;
  private invuln = 0;
  private coyote = 0;
  private jumpBuf = 0;
  private attackTimer = 0;
  private attackKind: 'light' | 'heavy' | null = null;
  private sectorMode: SectorMode = 'explore';
  private claimProgress = 0;
  private threat: ThreatStats = emptyStats();
  private surgePlan: WavePlan | null = null;
  private banner = '';
  private bannerTimer = 0;
  private facing: 1 | -1 = 1;

  // P4 movement
  private dashTimer = 0;
  private dashCd = 0;
  private wallCoyote = 0;
  private wallDir: 1 | -1 = 0 as 1 | -1;
  private combo = 0;
  private comboTimer = 0;

  private runMode: RunMode = 'campaign';
  private heroKey = 'arin';

  private hudScore!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private hudBanner!: Phaser.GameObjects.Text;
  private hudCombo!: Phaser.GameObjects.Text;
  private claimBar!: Phaser.GameObjects.Rectangle;
  private claimBg!: Phaser.GameObjects.Rectangle;

  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;
  private touchAttack = false;
  private touchHeavy = false;
  private touchDash = false;

  constructor() {
    super('Play');
  }

  create(data?: { mode?: RunMode; hero?: string }) {
    Audio.unlock();
    this.runMode = data?.mode === 'daily' ? 'daily' : 'campaign';
    this.heroKey = data?.hero === 'kaela' ? 'kaela' : 'arin';
    this.levelIndex = 0;
    this.lives = 3;
    this.score = 0;
    this.crystalsCount = 0;
    this.timeAlive = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.threat = emptyStats();
    this.loadSector(0);
    this.buildHud();
    this.buildMobileControls();
    this.bindInput();
  }

  private loadSector(index: number) {
    this.levelIndex = index;
    const def = LEVELS[Math.min(index, LEVELS.length - 1)];
    const worldW = levelPixelWidth(def);
    const worldH = levelPixelHeight(def);

    this.children.removeAll();
    this.physics.world.setBounds(0, 0, worldW, worldH + 80);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBackgroundColor('#060b1a');

    const skyKey = index >= 2 ? 'sky_ashfall' : 'sky';
    this.add
      .image(0, 0, skyKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDisplaySize(this.scale.width, this.scale.height);

    this.platforms = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.crystals = this.physics.add.group();

    let spawn = { x: TILE * 2, y: worldH - TILE * 3 };

    for (let r = 0; r < def.rows.length; r++) {
      const row = def.rows[r].padEnd(def.width, '.');
      for (let c = 0; c < def.width; c++) {
        const ch = row[c];
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        if (ch === '#') {
          const tileKey =
            index >= 2 ? 'tile_ashfall' : index >= 1 ? 'tile_verdant' : 'tile_skybound';
          (this.platforms.create(x, y, tileKey) as Phaser.Physics.Arcade.Sprite).refreshBody();
        } else if (ch === 'C') {
          const crystal = this.crystals.create(x, y - 4, 'crystal') as Phaser.Physics.Arcade.Sprite;
          crystal.setOrigin(0.5, 0.5).setScale(0.85).setDepth(5);
          (crystal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
          this.tweens.add({ targets: crystal, y: crystal.y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        } else if (ch === 'E') this.spawnEnemy('graveling', x, y);
        else if (ch === 'L') this.spawnEnemy('legionnaire', x, y);
        else if (ch === 'H') this.spawnEnemy('hulk', x, y);
        else if (ch === 'O') this.spawnEnemy('elite', x, y);
        else if (ch === 'G') {
          this.well = this.physics.add.sprite(x, y - TILE / 2, 'well');
          this.well.setImmovable(true);
          (this.well.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        } else if (ch === 'P') spawn = { x, y: y - TILE / 2 };
        else if (ch === 'B') {
          const pad = this.platforms.create(x, y + 8, 'tile') as Phaser.Physics.Arcade.Sprite;
          pad.setTint(0x38bdf8);
          pad.setData('bounce', true);
          pad.refreshBody();
        }
      }
    }

    const tex = this.textures.exists(this.heroKey) ? this.heroKey : 'arin';
    this.player = this.physics.add.sprite(spawn.x, spawn.y, tex);
    setupPlayerBody(this.player);
    if (this.anims.exists('arin_idle')) this.player.play('arin_idle');
    if (this.heroKey === 'kaela') this.player.setTint(0xa7f3d0);

    this.physics.add.collider(this.player, this.platforms, this.onLandPlatform, undefined, this);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.crystals, this.collectCrystal, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemy, undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    applyPlayCamera(this.cameras.main);

    this.sectorMode = 'explore';
    this.claimProgress = 0;
    this.banner = def.name;
    this.bannerTimer = 1.8;
    Audio.setMusic('explore');
    Audio.sfxWellHum();
    this.attackTimer = 0;
    this.attackKind = null;
    this.invuln = 0.5;
    this.facing = 1;
    this.dashTimer = 0;
    this.dashCd = 0;

    this.buildHud();
    this.buildMobileControls();
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number) {
    const st = ENEMY_STATS[kind];
    const e = this.enemies.create(x, y - TILE / 2, kind) as EnemyGo;
    e.kind = kind;
    e.hp = st.hp;
    e.maxHp = st.hp;
    e.dir = 1;
    e.stun = 0;
    e.chargeCd = kind === 'elite' ? 1.2 : 0;
    e.charging = false;
    setupEnemyBody(e, kind);
    e.setVelocityX(st.speed * e.dir * 0.5);
    const animKey =
      kind === 'graveling'
        ? 'graveling_walk'
        : kind === 'legionnaire'
          ? 'legionnaire_walk'
          : kind === 'hulk'
            ? 'hulk_walk'
            : 'elite_idle';
    if (this.anims.exists(animKey)) e.play(animKey);
    return e;
  }

  private bindInput() {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private buildHud() {
    const style = { fontFamily: 'system-ui,sans-serif', fontSize: '14px', color: '#e0f2fe' };
    this.hudScore = this.add.text(12, 10, '', style).setScrollFactor(0).setDepth(100);
    this.hudLives = this.add.text(12, 30, '', style).setScrollFactor(0).setDepth(100);
    this.hudCombo = this.add
      .text(12, 50, '', { fontFamily: 'system-ui,sans-serif', fontSize: '13px', color: '#fde68a' })
      .setScrollFactor(0)
      .setDepth(100);
    this.hudBanner = this.add
      .text(this.scale.width / 2, 48, '', {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '18px',
        color: '#f0f9ff',
        backgroundColor: '#0c4a6e88',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.claimBg = this.add
      .rectangle(this.scale.width / 2, 78, 160, 10, 0x1e293b)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    this.claimBar = this.add
      .rectangle(this.scale.width / 2 - 78, 78, 0, 8, 0x38bdf8)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);
  }

  private buildMobileControls() {
    if (this.sys.game.device.os.desktop) return;
    const y = this.scale.height - 56;
    const mk = (x: number, label: string, on: () => void, off: () => void) => {
      const t = this.add
        .text(x, y, label, {
          fontFamily: 'system-ui',
          fontSize: '13px',
          color: '#fff',
          backgroundColor: '#0ea5e988',
          padding: { x: 12, y: 10 },
        })
        .setScrollFactor(0)
        .setDepth(120)
        .setInteractive();
      t.on('pointerdown', on);
      t.on('pointerup', off);
      t.on('pointerout', off);
    };
    mk(36, '\u25C0', () => (this.touchLeft = true), () => (this.touchLeft = false));
    mk(100, '\u25B6', () => (this.touchRight = true), () => (this.touchRight = false));
    mk(this.scale.width - 260, 'DASH', () => (this.touchDash = true), () => (this.touchDash = false));
    mk(this.scale.width - 185, 'JUMP', () => (this.touchJump = true), () => (this.touchJump = false));
    mk(this.scale.width - 110, 'SLASH', () => (this.touchAttack = true), () => (this.touchAttack = false));
    mk(this.scale.width - 40, 'HEAVY', () => (this.touchHeavy = true), () => (this.touchHeavy = false));
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(0.05, dtMs / 1000);
    this.timeAlive += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.combo = 0;
    if (this.bannerTimer <= 0 && this.sectorMode === 'explore') this.banner = '';
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateWell(dt);
    this.updateAttack(dt);
    this.refreshHud();
  }

  private updatePlayer(dt: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const left = !!(this.cursors?.left?.isDown || this.keyA?.isDown || this.touchLeft);
    const right = !!(this.cursors?.right?.isDown || this.keyD?.isDown || this.touchRight);
    const jumpPressed = !!(
      (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
      (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW)) ||
      (this.cursors?.space && Phaser.Input.Keyboard.JustDown(this.cursors.space)) ||
      this.touchJump
    );
    const dashPressed =
      (this.keyShift && Phaser.Input.Keyboard.JustDown(this.keyShift)) || this.touchDash;

    if (jumpPressed) this.jumpBuf = PHYSICS.jumpBufferMs / 1000;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    if (body.blocked.down) this.coyote = PHYSICS.coyoteMs / 1000;
    else this.coyote = Math.max(0, this.coyote - dt);

    // Wall sense
    if (!body.blocked.down && (body.blocked.left || body.blocked.right)) {
      this.wallCoyote = PHYSICS.wallCoyoteMs / 1000;
      this.wallDir = body.blocked.left ? -1 : 1;
    } else {
      this.wallCoyote = Math.max(0, this.wallCoyote - dt);
    }

    // Active dash
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.player.setVelocityX(this.facing * PHYSICS.dashSpeed);
      this.player.setVelocityY(0);
      body.setAllowGravity(false);
      if (this.dashTimer <= 0) {
        body.setAllowGravity(true);
        this.touchDash = false;
      }
      return;
    }

    // Wall slide
    const onWall = !body.blocked.down && (body.blocked.left || body.blocked.right);
    if (onWall && body.velocity.y > 0) {
      body.setVelocityY(Math.min(body.velocity.y, PHYSICS.wallSlideGravity));
    }

    let vx = 0;
    if (left) vx -= PHYSICS.playerSpeed;
    if (right) vx += PHYSICS.playerSpeed;
    this.player.setVelocityX(vx);
    if (vx > 0) {
      this.facing = 1;
      this.player.setFlipX(false);
    } else if (vx < 0) {
      this.facing = -1;
      this.player.setFlipX(true);
    }

    if (this.attackTimer <= 0) {
      if (!body.blocked.down && this.anims.exists('arin_jump')) {
        if (this.player.anims.currentAnim?.key !== 'arin_jump') this.player.play('arin_jump', true);
      } else if (Math.abs(vx) > 20 && this.anims.exists('arin_run')) {
        if (this.player.anims.currentAnim?.key !== 'arin_run') this.player.play('arin_run', true);
      } else if (this.anims.exists('arin_idle')) {
        if (this.player.anims.currentAnim?.key !== 'arin_idle') this.player.play('arin_idle', true);
      }
    }

    // Ground jump
    if (this.jumpBuf > 0 && this.coyote > 0) {
      this.player.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpBuf = 0;
      this.coyote = 0;
      this.touchJump = false;
      Audio.sfxJump();
    }
    // Wall jump
    else if (this.jumpBuf > 0 && this.wallCoyote > 0) {
      const push = -this.wallDir || this.facing;
      this.player.setVelocityX(push * PHYSICS.wallJumpPush);
      this.player.setVelocityY(PHYSICS.wallJumpUp);
      this.facing = push as 1 | -1;
      this.player.setFlipX(this.facing < 0);
      this.jumpBuf = 0;
      this.wallCoyote = 0;
      this.touchJump = false;
      Audio.sfxJump();
    }

    // Dash
    if (dashPressed && this.dashCd <= 0) {
      this.startDash();
      this.touchDash = false;
    }

    if (this.attackTimer <= 0) {
      if ((this.keyJ && Phaser.Input.Keyboard.JustDown(this.keyJ)) || this.touchAttack) {
        this.startAttack('light');
        this.touchAttack = false;
      } else if ((this.keyK && Phaser.Input.Keyboard.JustDown(this.keyK)) || this.touchHeavy) {
        this.startAttack('heavy');
        this.touchHeavy = false;
      }
    }

    if (this.player.y > levelPixelHeight(LEVELS[this.levelIndex]) + 60) this.hurt(true);
  }

  private startDash() {
    this.dashTimer = PHYSICS.dashDuration;
    this.dashCd = PHYSICS.dashCooldown;
    this.invuln = Math.max(this.invuln, PHYSICS.dashInvuln);
    Audio.sfxDash();
    // brief trail
    const g = this.add.rectangle(this.player.x, this.player.y, 28, 44, 0x38bdf8, 0.35).setDepth(9);
    this.tweens.add({ targets: g, alpha: 0, x: g.x - this.facing * 30, duration: 160, onComplete: () => g.destroy() });
    // dash-strike hitbox
    const hx = this.player.x + this.facing * 28;
    const hitRect = new Phaser.Geom.Rectangle(hx - 20, this.player.y - 24, 40, 48);
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as EnemyGo;
      if (!e.active) return;
      if (Phaser.Geom.Rectangle.Overlaps(hitRect, e.getBounds())) {
        this.damageEnemy(e, COMBAT.dashStrikeDamage, false);
      }
    });
  }

  private startAttack(kind: 'light' | 'heavy') {
    this.attackKind = kind;
    this.attackTimer = kind === 'heavy' ? COMBAT.heavyDuration : COMBAT.lightDuration;
    if (kind === 'heavy') {
      Audio.sfxHeavy();
      if (this.anims.exists('arin_heavy')) this.player.play('arin_heavy', true);
    } else {
      Audio.sfxSlash();
      if (this.anims.exists('arin_attack')) this.player.play('arin_attack', true);
    }
    const reach = kind === 'heavy' ? COMBAT.heavyReach : COMBAT.lightReach;
    const dmg = kind === 'heavy' ? COMBAT.heavyDamage : COMBAT.lightDamage;
    const mult = 1 + Math.min(this.combo, 8) * 0.05;
    const hx = this.player.x + this.facing * (reach / 2 + 10);
    const hy = this.player.y - 10;
    const hitRect = new Phaser.Geom.Rectangle(hx - reach / 2, hy - 20, reach, 40);
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as EnemyGo;
      if (!e.active || e.stun > 0.05) return;
      if (Phaser.Geom.Rectangle.Overlaps(hitRect, e.getBounds())) {
        if (kind === 'heavy') this.threat.heavyHits += 1;
        else this.threat.slashHits += 1;
        let applied = Math.max(1, Math.round(dmg * mult));
        if ((e.kind === 'hulk' || e.kind === 'elite') && kind === 'light') applied = 1;
        this.damageEnemy(e, applied, false);
      }
    });
    const g = this.add.graphics().setDepth(20);
    g.lineStyle(kind === 'heavy' ? 5 : 3, 0x67e8f9, 0.9);
    g.beginPath();
    g.arc(
      this.player.x + this.facing * 12,
      this.player.y - 8,
      reach * 0.7,
      this.facing > 0 ? -1 : 2,
      this.facing > 0 ? 1 : 4
    );
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
  }

  private updateAttack(dt: number) {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    if (this.attackTimer <= 0) this.attackKind = null;
  }

  private updateEnemies(dt: number) {
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as EnemyGo;
      if (!e.active) return;
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun > 0) {
        e.setVelocityX(0);
        return;
      }
      const st = ENEMY_STATS[e.kind];
      if (e.kind === 'elite') {
        e.chargeCd = Math.max(0, e.chargeCd - dt);
        const dx = this.player.x - e.x;
        if (Math.abs(dx) > 8) e.dir = dx > 0 ? 1 : -1;
        if (e.chargeCd <= 0 && Math.abs(dx) < 180) {
          e.charging = true;
          e.chargeCd = 2.4;
          if (this.anims.exists('elite_charge')) e.play('elite_charge', true);
          Audio.sfxReaverCharge();
        }
        e.setVelocityX(e.dir * (e.charging ? st.speed * 2.4 : st.speed * 0.85));
        e.setFlipX(e.dir < 0);
        if (e.charging && e.chargeCd < 1.9) {
          e.charging = false;
          if (this.anims.exists('elite_idle')) e.play('elite_idle', true);
        }
      } else {
        e.setVelocityX(e.dir * st.speed * 0.6);
        e.setFlipX(e.dir < 0);
        const body = e.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.left) e.dir = 1;
        if (body.blocked.right) e.dir = -1;
      }
    });
  }

  private updateWell(dt: number) {
    if (!this.well) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.well.x, this.well.y);
    if (this.sectorMode === 'explore') {
      if (dist < 40) {
        this.sectorMode = 'claiming';
        this.claimProgress = 0;
        this.banner = 'STABILIZING WELL\u2026';
        Audio.setMusic('well');
        Audio.sfxWellCharge();
        this.bannerTimer = 99;
      }
      return;
    }
    if (this.sectorMode === 'claiming') {
      if (dist < 56) {
        this.claimProgress = Math.min(1, this.claimProgress + dt / COMBAT.claimSeconds);
        if (this.claimProgress >= 1) this.beginSurge();
      } else {
        this.claimProgress = Math.max(0, this.claimProgress - dt * 0.5);
        if (this.claimProgress <= 0) {
          this.sectorMode = 'explore';
          this.banner = '';
        }
      }
      return;
    }
    if (this.sectorMode === 'surge') {
      if (!this.enemies.getChildren().some((o) => (o as EnemyGo).active)) {
        this.score += 200;
        this.winSector();
      }
    }
  }

  private beginSurge() {
    this.sectorMode = 'surge';
    this.claimProgress = 1;
    this.surgePlan = planApexElite(this.threat, this.levelIndex) ?? planSurge(this.threat, this.levelIndex);
    this.banner = this.surgePlan.label;
    this.bannerTimer = this.surgePlan.label.includes('REAVER') ? 2.8 : 2.2;
    this.cameras.main.shake(200, 0.008);
    Audio.sfxSurge();
    Audio.sfxWellStable();
    const isBoss = this.surgePlan.label.includes('REAVER') || this.surgePlan.kinds.includes('elite');
    Audio.setMusic(isBoss ? 'boss' : 'combat');
    Audio.addTensionLayer();
    this.enemies.clear(true, true);
    this.surgePlan.kinds.forEach((kind, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      this.spawnEnemy(kind, this.well.x + side * (60 + i * 40), this.well.y + 20);
    });
  }

  private damageEnemy(e: EnemyGo, dmg: number, fromStomp: boolean) {
    e.hp -= dmg;
    e.stun = fromStomp ? 0.2 : 0.15;
    if (fromStomp) Audio.sfxStomp();
    else Audio.sfxHit();
    e.setTint(0xffffff);
    this.time.delayedCall(80, () => e.clearTint());
    e.x += this.facing * (fromStomp ? 6 : 10);
    if (e.hp <= 0) {
      this.threat.kills += 1;
      if (fromStomp) this.threat.stomps += 1;
      const bonus = Math.floor(ENEMY_STATS[e.kind].score * (1 + this.combo * 0.08));
      this.score += bonus;
      this.combo += 1;
      this.comboTimer = COMBAT.comboWindow;
      if (e.kind === 'elite') {
        this.banner = 'REAVER DOWN';
        this.bannerTimer = 1.6;
      }
      e.destroy();
    }
  }

  private onPlayerEnemy(_p: any, enemyObj: any) {
    const e = enemyObj as EnemyGo;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.dashTimer > 0) return; // invuln frames during dash
    if (body.velocity.y > 0 && this.player.y < e.y - 8) {
      this.player.setVelocityY(PHYSICS.jumpVelocity * 0.7);
      this.damageEnemy(e, e.kind === 'hulk' || e.kind === 'elite' ? 2 : 99, true);
    } else if (this.invuln <= 0 && e.stun <= 0) this.hurt(false);
  }

  private onLandPlatform(_p: any, platform: any) {
    if ((platform as Phaser.Physics.Arcade.Sprite).getData('bounce')) {
      this.player.setVelocityY(PHYSICS.jumpVelocity * 1.35);
      Audio.sfxBounce();
    }
  }

  private collectCrystal(_p: any, crystal: any) {
    (crystal as Phaser.Physics.Arcade.Sprite).destroy();
    this.crystalsCount += 1;
    this.threat.crystals += 1;
    this.score += 50;
    Audio.sfxCrystal();
  }

  private hurt(instant: boolean) {
    if (this.invuln > 0 && !instant) return;
    this.lives -= 1;
    this.invuln = 1.2;
    this.combo = 0;
    this.cameras.main.shake(160, 0.012);
    Audio.sfxHurt();
    this.player.setTint(0xf87171);
    this.time.delayedCall(200, () => {
      if (this.heroKey === 'kaela') this.player.setTint(0xa7f3d0);
      else this.player.clearTint();
    });
    if (this.lives <= 0) {
      this.endRun(false);
      return;
    }
    if (this.well) this.player.setPosition(this.well.x - 40, this.well.y - 20);
    this.player.setVelocity(0, 0);
  }

  private winSector() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.score += 150;
      this.loadSector(this.levelIndex + 1);
    } else this.endRun(true);
  }

  private endRun(won: boolean) {
    const pb = setPb(this.score);
    let unlockedKaela = false;
    if (won) {
      const u = onFullClear(this.score);
      unlockedKaela = u.kaela;
    }
    if (this.runMode === 'daily') {
      setDailyBest(this.score);
    }
    bumpRunCount();
    const stars = this.score >= 2500 ? 3 : this.score >= 1400 ? 2 : this.score >= 600 ? 1 : 0;
    this.scene.start('Results', {
      score: this.score,
      stars,
      won,
      pb,
      level: this.levelIndex + 1,
      crystals: this.crystalsCount,
      mode: this.runMode,
      unlockedKaela,
      dateKey: this.runMode === 'daily' ? todayKey() : undefined,
    });
  }

  private refreshHud() {
    const dashReady = this.dashCd <= 0 ? 'DASH ready' : `DASH ${this.dashCd.toFixed(1)}s`;
    this.hudScore?.setText(`Score ${this.score.toLocaleString()}  \u00b7  \u2726 ${this.crystalsCount}`);
    this.hudLives?.setText(`\u2764 ${this.lives}  \u00b7  ${LEVELS[this.levelIndex]?.name ?? ''}  \u00b7  ${dashReady}`);
    this.hudCombo?.setText(this.combo >= 2 ? `COMBO x${this.combo}` : '');
    this.hudBanner?.setText(this.banner).setVisible(!!this.banner);
    this.claimBg?.setVisible(this.sectorMode === 'claiming');
    this.claimBar?.setVisible(this.sectorMode === 'claiming');
    if (this.sectorMode === 'claiming') this.claimBar?.setSize(156 * this.claimProgress, 8);
  }
}
