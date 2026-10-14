import Phaser from 'phaser';

/**
 * Play sandbox — Arin sprite when atlas present.
 */
export class PlayScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
  };
  private attacking = false;

  constructor() {
    super('Play');
  }

  create(data?: { hero?: string }) {
    const hero = data?.hero || this.registry.get('hero') || 'arin';
    this.registry.set('hero', hero);

    const worldW = 2000;
    const worldH = 540;
    this.cameras.main.setBackgroundColor('#0c4a6e');
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10);
    sky.fillGradientStyle(0x38bdf8, 0x38bdf8, 0x0c4a6e, 0x020617, 1);
    sky.fillRect(0, 0, this.scale.width, this.scale.height);

    const platforms = this.physics.add.staticGroup();
    for (let x = 16; x < worldW; x += 32) {
      platforms.create(x, worldH - 16, 'tile');
    }
    for (const [px, py, n] of [
      [200, 400, 6],
      [480, 320, 5],
      [800, 380, 8],
      [1200, 300, 6],
      [1600, 360, 7],
    ] as const) {
      for (let i = 0; i < n; i++) platforms.create(px + i * 32, py, 'tile');
    }

    // Prefer Arin atlas
    const useArin =
      hero === 'arin' &&
      this.textures.exists('arin') &&
      this.textures.get('arin').has('arin_idle_0');

    if (useArin) {
      this.player = this.physics.add.sprite(120, worldH - 80, 'arin', 'arin_idle_0');
      this.player.setOrigin(0.5, 1);
      this.player.setScale(0.85);
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setSize(48, 90);
      body.setOffset(
        (this.player.width - 48) / 2,
        this.player.height - 90 - 4
      );
      if (this.anims.exists('arin_idle')) this.player.play('arin_idle');
    } else {
      this.player = this.physics.add.sprite(120, worldH - 80, 'player');
      this.player.setOrigin(0.5, 1);
    }

    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.02);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, platforms);

    const enemy = this.physics.add.sprite(600, worldH - 80, 'enemy');
    enemy.setImmovable(true);
    (enemy.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    enemy.setDepth(8);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.1);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      a: this.input.keyboard!.addKey('A'),
      d: this.input.keyboard!.addKey('D'),
      w: this.input.keyboard!.addKey('W'),
    };

    const heroLabel = String(hero).toUpperCase();
    this.add
      .text(12, 12, `${heroLabel}  ·  Arrows/WASD · SPACE jump · J attack · ESC menu`, {
        fontFamily: 'system-ui,sans-serif',
        fontSize: '13px',
        color: '#e0f2fe',
        backgroundColor: '#02061788',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Menu'));
    this.input.keyboard!.on('keydown-SPACE', () => this.tryJump());
    this.input.keyboard!.on('keydown-J', () => this.tryAttack());
    this.input.keyboard!.on('keydown-K', () => this.tryAttack());
  }

  private tryJump() {
    if (!this.player?.body) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      this.player.setVelocityY(-520);
      if (this.anims.exists('arin_jump')) this.player.play('arin_jump');
    }
  }

  private tryAttack() {
    if (this.attacking) return;
    this.attacking = true;
    if (this.anims.exists('arin_attack')) {
      this.player.play('arin_attack');
      this.player.once('animationcomplete', () => {
        this.attacking = false;
        if (this.anims.exists('arin_idle')) this.player.play('arin_idle');
      });
    } else {
      this.time.delayedCall(200, () => {
        this.attacking = false;
      });
    }
  }

  update() {
    if (!this.player?.body || this.attacking) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const up = this.cursors.up.isDown || this.wasd.w.isDown;

    if (left) {
      this.player.setVelocityX(-240);
      this.player.setFlipX(true);
      if (body.blocked.down && this.anims.exists('arin_run')) this.player.play('arin_run', true);
    } else if (right) {
      this.player.setVelocityX(240);
      this.player.setFlipX(false);
      if (body.blocked.down && this.anims.exists('arin_run')) this.player.play('arin_run', true);
    } else {
      this.player.setVelocityX(0);
      if (body.blocked.down && this.anims.exists('arin_idle')) this.player.play('arin_idle', true);
    }

    if (up && body.blocked.down) this.tryJump();
  }
}
