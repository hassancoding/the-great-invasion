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

type SectorMode = 'explore' | 'claiming' | 'surge';

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
  private wasOnGround = false;

  private hudScore!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private hudBanner!: Phaser.GameObjects.Text;
  private claimBar!: Phaser.GameObjects.Rectangle;
  private claimBg!: Phaser.GameObjects.Rectangle;

  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;
  private touchAttack = false;
  private touchHeavy = false;

  constructor() {
    super('Play');
  }

  create() {
    Audio.unlock();
    this.levelIndex = 0;
    this.lives = 3;
    this.score = 0;
    this.crystalsCount = 0;
    this.timeAlive = 0;
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

    this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0).setDisplaySize(this.scale.width, this.scale.height);

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
          const t = this.platforms.create(x, y, 'tile') as Phaser.Physics.Arcade.Sprite;
          t.refreshBody();
        } else if (ch === 'C') {
          const crystal = this.crystals.create(x, y, 'crystal') as Phaser.Physics.Arcade.Sprite;
          crystal.setBounceY(0.2);
          (crystal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        } else if (ch === 'E') this.spawnEnemy('graveling', x, y);
        else if (ch === 'L') this.spawnEnemy('legionnaire', x, y);
        else if (ch === 'H') this.spawnEnemy('hulk', x, y);
        else if (ch === 'O') this.spawnEnemy('elite', x, y);
        else if (ch === 'G') {
          this.well = this.physics.add.sprite(x, y - 16, 'well');
          this.well.setImmovable(true);
          (this.well.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        } else if (ch === 'P') spawn = { x, y: y - 8 };
        else if (ch === 'B') {
          // bounce pad as glowing tile
          const pad = this.platforms.create(x, y + 8, 'tile') as Phaser.Physics.Arcade.Sprite;
          pad.setTint(0x38bdf8);
          pad.setData('bounce', true);
          pad.refreshBody();
        }
      }
    }

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'arin');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(28, 48);
    this.player.setOffset(34, 40);
    this.player.setDepth(10);

    this.physics.add.collider(this.player, this.platforms, this.onLandPlatform, undefined, this);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.crystals, this.collectCrystal, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemy, undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 40);

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

    this.buildHud();
    this.buildMobileControls();
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number) {
    const st = ENEMY_STATS[kind];
    const e = this.enemies.create(x, y - 4, kind) as EnemyGo;
    e.kind = kind;
    e.hp = st.hp;
    e.maxHp = st.hp;
    e.dir = 1;
    e.stun = 0;
    e.chargeCd = kind === 'elite' ? 1.2 : 0;
    e.charging = false;
    e.setSize(st.w * 0.7, st.h * 0.85);
    e.setCollideWorldBounds(true);
    e.setBounce(0);
    e.setVelocityX(st.speed * e.dir * 0.5);
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
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private buildHud() {
    const style = { fontFamily: 'system-ui,sans-serif', fontSize: '14px', color: '#e0f2fe' };
    this.hudScore = this.add.text(12, 10, '', style).setScrollFactor(0).setDepth(100);
    this.hudLives = this.add.text(12, 30, '', style).setScrollFactor(0).setDepth(100);
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
          fontSize: '14px',
          color: '#fff',
          backgroundColor: '#0ea5e988',
          padding: { x: 14, y: 12 },
        })
        .setScrollFactor(0)
        .setDepth(120)
        .setInteractive();
      t.on('pointerdown', on);
      t.on('pointerup', off);
      t.on('pointerout', off);
    };
    mk(40, '◀', () => (this.touchLeft = true), () => (this.touchLeft = false));
    mk(110, '▶', () => (this.touchRight = true), () => (this.touchRight = false));
    mk(this.scale.width - 200, 'JUMP', () => (this.touchJump = true), () => (this.touchJump = false));
    mk(this.scale.width - 120, 'SLASH', () => (this.touchAttack = true), () => (this.touchAttack = false));
    mk(this.scale.width - 40, 'HEAVY', () => (this.touchHeavy = true), () => (this.touchHeavy = false));
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(0.05, dtMs / 1000);
    this.timeAlive += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
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

    if (jumpPressed) this.jumpBuf = PHYSICS.jumpBufferMs / 1000;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    if (body.blocked.down) this.coyote = PHYSICS.coyoteMs / 1000;
    else this.coyote = Math.max(0, this.coyote - dt);

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

    if (this.jumpBuf > 0 && this.coyote > 0) {
      this.player.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpBuf = 0;
      this.coyote = 0;
      this.touchJump = false;
      Audio.sfxJump();
    }

    // attacks
    if (this.attackTimer <= 0) {
      if ((this.keyJ && Phaser.Input.Keyboard.JustDown(this.keyJ)) || this.touchAttack) {
        this.startAttack('light');
        this.touchAttack = false;
      } else if ((this.keyK && Phaser.Input.Keyboard.JustDown(this.keyK)) || this.touchHeavy) {
        this.startAttack('heavy');
        this.touchHeavy = false;
      }
    }

    if (this.player.y > levelPixelHeight(LEVELS[this.levelIndex]) + 60) {
      this.hurt(true);
    }

    this.wasOnGround = body.blocked.down;
  }

  private startAttack(kind: 'light' | 'heavy') {
    this.attackKind = kind;
    this.attackTimer = kind === 'heavy' ? COMBAT.heavyDuration : COMBAT.lightDuration;
    if (kind === 'heavy') Audio.sfxHeavy(); else Audio.sfxSlash();
    // hitbox sweep
    const reach = kind === 'heavy' ? COMBAT.heavyReach : COMBAT.lightReach;
    const dmg = kind === 'heavy' ? COMBAT.heavyDamage : COMBAT.lightDamage;
    const hx = this.player.x + this.facing * (reach / 2 + 10);
    const hy = this.player.y - 10;
    const hitRect = new Phaser.Geom.Rectangle(hx - reach / 2, hy - 20, reach, 40);

    this.enemies.getChildren().forEach((obj) => {
      const e = obj as EnemyGo;
      if (!e.active || e.stun > 0.05) return;
      if (Phaser.Geom.Rectangle.Overlaps(hitRect, e.getBounds())) {
        if (kind === 'heavy') this.threat.heavyHits += 1;
        else this.threat.slashHits += 1;
        let applied = dmg;
        if ((e.kind === 'hulk' || e.kind === 'elite') && kind === 'light') applied = 1;
        this.damageEnemy(e, applied, false);
      }
    });

    // slash VFX
    const g = this.add.graphics().setDepth(20);
    g.lineStyle(kind === 'heavy' ? 5 : 3, 0x67e8f9, 0.9);
    g.beginPath();
    g.arc(this.player.x + this.facing * 12, this.player.y - 8, reach * 0.7, this.facing > 0 ? -1 : 2, this.facing > 0 ? 1 : 4);
    g.strokePath();
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 180,
      onComplete: () => g.destroy(),
    });
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
        }
        const speed = e.charging ? st.speed * 2.4 : st.speed * 0.85;
        e.setVelocityX(e.dir * speed);
        e.setFlipX(e.dir < 0);
        if (e.charging && e.chargeCd < 1.9) e.charging = false;
      } else {
        e.setVelocityX(e.dir * st.speed * 0.6);
        e.setFlipX(e.dir < 0);
        // turn at edges — simple
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
        this.banner = 'STABILIZING WELL…';
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
      const alive = this.enemies.getChildren().some((o) => (o as EnemyGo).active);
      if (!alive) {
        this.score += 200;
        this.winSector();
      }
    }
  }

  private beginSurge() {
    this.sectorMode = 'surge';
    this.claimProgress = 1;
    const apex = planApexElite(this.threat, this.levelIndex);
    this.surgePlan = apex ?? planSurge(this.threat, this.levelIndex);
    this.banner = this.surgePlan.label;
    this.bannerTimer = this.surgePlan.label.includes('REAVER') ? 2.8 : 2.2;
    this.cameras.main.shake(200, 0.008);
    Audio.sfxSurge();
    Audio.sfxWellStable();
    const isBoss = this.surgePlan.label.includes('REAVER') || this.surgePlan.kinds.includes('elite');
    Audio.setMusic(isBoss ? 'boss' : 'combat');
    Audio.addTensionLayer();

    this.enemies.clear(true, true);
    const kinds = this.surgePlan.kinds;
    kinds.forEach((kind, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const x = this.well.x + side * (60 + i * 40);
      this.spawnEnemy(kind, x, this.well.y + 20);
    });
  }

  private damageEnemy(e: EnemyGo, dmg: number, fromStomp: boolean) {
    e.hp -= dmg;
    e.stun = fromStomp ? 0.2 : 0.15;
    if (fromStomp) Audio.sfxStomp(); else Audio.sfxHit();
    if (e.kind === 'elite' && e.charging) Audio.sfxReaverCharge();
    e.setTint(0xffffff);
    this.time.delayedCall(80, () => e.clearTint());
    e.x += this.facing * (fromStomp ? 6 : 10);
    if (e.hp <= 0) {
      this.threat.kills += 1;
      if (fromStomp) this.threat.stomps += 1;
      this.score += ENEMY_STATS[e.kind].score;
      if (e.kind === 'elite') {
        this.banner = 'REAVER DOWN';
        this.bannerTimer = 1.6;
      }
      e.destroy();
    }
  }

  private onPlayerEnemy(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    const e = enemyObj as EnemyGo;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 0 && this.player.y < e.y - 8) {
      this.player.setVelocityY(PHYSICS.jumpVelocity * 0.7);
      const dmg = e.kind === 'hulk' || e.kind === 'elite' ? 2 : 99;
      this.damageEnemy(e, dmg, true);
    } else if (this.invuln <= 0 && e.stun <= 0) {
      this.hurt(false);
    }
  }

  private onLandPlatform(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    platform: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    const p = platform as Phaser.Physics.Arcade.Sprite;
    if (p.getData('bounce')) {
      this.player.setVelocityY(PHYSICS.jumpVelocity * 1.35);
      Audio.sfxBounce();
    }
  }

  private collectCrystal(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    crystal: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) {
    const c = crystal as Phaser.Physics.Arcade.Sprite;
    c.destroy();
    this.crystalsCount += 1;
    this.threat.crystals += 1;
    this.score += 50;
    Audio.sfxCrystal();
  }

  private hurt(instant: boolean) {
    if (this.invuln > 0 && !instant) return;
    this.lives -= 1;
    this.invuln = 1.2;
    this.cameras.main.shake(160, 0.012);
    Audio.sfxHurt();
    this.player.setTint(0xf87171);
    this.time.delayedCall(200, () => this.player.clearTint());
    if (this.lives <= 0) {
      this.endRun(false);
      return;
    }
    // soft respawn at well or spawn
    if (this.well) {
      this.player.setPosition(this.well.x - 40, this.well.y - 20);
    }
    this.player.setVelocity(0, 0);
  }

  private winSector() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.score += 150;
      this.loadSector(this.levelIndex + 1);
    } else {
      this.endRun(true);
    }
  }

  private endRun(won: boolean) {
    const PB_KEY = 'tgi_riftlands_pb';
    let pb = 0;
    try {
      pb = Number(localStorage.getItem(PB_KEY) || 0);
      if (this.score > pb) {
        pb = this.score;
        localStorage.setItem(PB_KEY, String(pb));
      }
    } catch {}
    const stars = this.score >= 2500 ? 3 : this.score >= 1400 ? 2 : this.score >= 600 ? 1 : 0;
    this.scene.start('Results', {
      score: this.score,
      stars,
      won,
      pb,
      level: this.levelIndex + 1,
      crystals: this.crystalsCount,
    });
  }

  private refreshHud() {
    this.hudScore?.setText(`Score ${this.score.toLocaleString()}  ·  ✦ ${this.crystalsCount}`);
    this.hudLives?.setText(`❤ ${this.lives}  ·  ${LEVELS[this.levelIndex]?.name ?? ''}`);
    this.hudBanner?.setText(this.banner).setVisible(!!this.banner);
    const showClaim = this.sectorMode === 'claiming' || (this.sectorMode === 'surge' && this.claimProgress >= 1);
    this.claimBg?.setVisible(this.sectorMode === 'claiming');
    this.claimBar?.setVisible(this.sectorMode === 'claiming');
    if (this.sectorMode === 'claiming') {
      this.claimBar?.setSize(156 * this.claimProgress, 8);
    }
  }
}
