/**
 * Rapier WASM physics for Iron Gate.
 * Real rigid-body collisions, gravity, character controller, ballistic projectiles.
 * Paired with Three.js rendering (best web combo for mobile performance).
 */
import RAPIER from '@dimforge/rapier3d-compat';

export type PhysBullet = {
  body: RAPIER.RigidBody;
  from: 'player' | 'enemy' | 'ally';
  damage: number;
  life: number;
  meshId: number;
};

export type IronGatePhysics = {
  world: RAPIER.World;
  playerBody: RAPIER.RigidBody;
  playerCollider: RAPIER.Collider;
  controller: RAPIER.KinematicCharacterController;
  step: (dt: number) => void;
  movePlayer: (dx: number, dz: number, yaw: number, sprint: boolean, dt: number) => { x: number; z: number };
  getPlayerPos: () => { x: number; y: number; z: number };
  spawnProjectile: (
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    speed: number,
    from: PhysBullet['from'],
    damage: number,
    life: number
  ) => RAPIER.RigidBody;
  stepProjectiles: (dt: number) => PhysBullet[];
  removeProjectile: (body: RAPIER.RigidBody) => void;
  dispose: () => void;
};

const BUILDING_SPECS: Array<{ x: number; z: number; w: number; d: number; h: number }> = [
  { x: -28, z: -25, w: 10, d: 8, h: 6 },
  { x: 32, z: -18, w: 8, d: 12, h: 5 },
  { x: -35, z: 20, w: 12, d: 7, h: 4.5 },
  { x: 25, z: 30, w: 9, d: 9, h: 7 },
  { x: -18, z: 40, w: 7, d: 10, h: 5 },
  { x: 40, z: 5, w: 6, d: 14, h: 4 },
  { x: 0, z: -45, w: 16, d: 6, h: 5.5 },
  { x: -50, z: -5, w: 8, d: 8, h: 8 },
  { x: 48, z: -35, w: 10, d: 6, h: 3.5 },
  { x: -10, z: 55, w: 11, d: 5, h: 4 },
];

let initPromise: Promise<void> | null = null;

export function ensureRapier(): Promise<void> {
  if (!initPromise) {
    initPromise = RAPIER.init();
  }
  return initPromise;
}

export function createIronGatePhysics(spawnX = 0, spawnZ = 18): IronGatePhysics {
  const gravity = { x: 0, y: -18, z: 0 };
  const world = new RAPIER.World(gravity);

  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(140, 0.5, 140), groundBody);

  for (const b of BUILDING_SPECS) {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(b.x, b.h / 2, b.z)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(b.w / 2, b.h / 2, b.d / 2), body);
  }

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 95;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 1.75, z));
    world.createCollider(RAPIER.ColliderDesc.cuboid(9, 1.75, 0.6), body);
  }

  for (const [tx, tz] of [
    [-55, -55],
    [55, -50],
    [-50, 55],
    [52, 48],
  ] as const) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(tx, 4, tz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.7, 4, 0.7), body);
  }

  const playerBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawnX, 1.0, spawnZ)
  );
  const playerCollider = world.createCollider(
    RAPIER.ColliderDesc.capsule(0.55, 0.35).setFriction(0.8).setDensity(0),
    playerBody
  );

  const controller = world.createCharacterController(0.08);
  controller.setApplyImpulsesToDynamicBodies(true);
  controller.enableAutostep(0.35, 0.2, true);
  controller.enableSnapToGround(0.4);
  controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
  controller.setMinSlopeSlideAngle((30 * Math.PI) / 180);

  const projectiles: PhysBullet[] = [];
  let meshIdSeq = 0;

  const PLAYER_SPEED = 11;
  const SPRINT_MULT = 1.55;

  const movePlayer = (dx: number, dz: number, _yaw: number, sprint: boolean, dt: number) => {
    const len = Math.hypot(dx, dz) || 1;
    const nx = dx / len;
    const nz = dz / len;
    const spd = PLAYER_SPEED * (sprint ? SPRINT_MULT : 1);
    const desired = { x: nx * spd * dt, y: -0.5 * dt, z: nz * spd * dt };

    controller.computeColliderMovement(playerCollider, desired);
    const mov = controller.computedMovement();
    const t = playerBody.translation();
    playerBody.setNextKinematicTranslation({
      x: t.x + mov.x,
      y: Math.max(1.0, t.y + mov.y),
      z: t.z + mov.z,
    });
    const nt = playerBody.translation();
    return { x: nt.x, z: nt.z };
  };

  const getPlayerPos = () => {
    const t = playerBody.translation();
    return { x: t.x, y: t.y, z: t.z };
  };

  const spawnProjectile = (
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    speed: number,
    from: PhysBullet['from'],
    damage: number,
    life: number
  ) => {
    const len = Math.hypot(dirX, dirY, dirZ) || 1;
    const vx = (dirX / len) * speed;
    const vy = (dirY / len) * speed;
    const vz = (dirZ / len) * speed;

    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setLinvel(vx, vy, vz)
        .setCcdEnabled(true)
        .setGravityScale(0.35)
        .setCanSleep(false)
        .setLinearDamping(0.02)
    );
    world.createCollider(
      RAPIER.ColliderDesc.ball(0.08)
        .setDensity(0.4)
        .setFriction(0.1)
        .setRestitution(0.05)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body
    );
    projectiles.push({ body, from, damage, life, meshId: ++meshIdSeq });
    return body;
  };

  const stepProjectiles = (dt: number) => {
    const alive: PhysBullet[] = [];
    for (const p of projectiles) {
      p.life -= dt;
      if (p.life <= 0 || !p.body.isValid()) {
        if (p.body.isValid()) world.removeRigidBody(p.body);
        continue;
      }
      alive.push(p);
    }
    projectiles.length = 0;
    projectiles.push(...alive);
    return projectiles;
  };

  const removeProjectile = (body: RAPIER.RigidBody) => {
    const idx = projectiles.findIndex((p) => p.body === body);
    if (idx >= 0) projectiles.splice(idx, 1);
    if (body.isValid()) world.removeRigidBody(body);
  };

  const step = (dt: number) => {
    world.timestep = Math.min(dt, 1 / 30);
    world.step();
  };

  const dispose = () => {
    for (const p of projectiles) {
      if (p.body.isValid()) world.removeRigidBody(p.body);
    }
    projectiles.length = 0;
    world.free();
  };

  return {
    world,
    playerBody,
    playerCollider,
    controller,
    step,
    movePlayer,
    getPlayerPos,
    spawnProjectile,
    stepProjectiles,
    removeProjectile,
    dispose,
  };
}
