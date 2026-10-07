import * as THREE from 'three';

export type Phase = 'menu' | 'countdown' | 'playing' | 'results';

export type Unit = {
  id: number;
  mesh: THREE.Group;
  team: 'player' | 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  dead: boolean;
  x: number;
  z: number;
  aimY: number;
  lastShot: number;
  name: string;
  state: string;
};

export type Bullet = {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  life: number;
  from: 'player' | 'enemy' | 'ally';
  damage: number;
};

export const ENEMY_NAMES = [
  'Viper', 'Razor', 'Havoc', 'Reaper', 'Ghost', 'Titan',
  'Fang', 'Blaze', 'Onyx', 'Cobra', 'Wolf', 'Dagger',
];

export function makeUnitMesh(color: number, isPlayer = false): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.1, 4, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.15 })
  );
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 10),
    new THREE.MeshStandardMaterial({ color: isPlayer ? 0xf0d0b0 : 0xc4a484 })
  );
  head.position.y = 1.85;
  g.add(head);
  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  gun.position.set(0.35, 1.15, 0.45);
  g.add(gun);
  return g;
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function dist2(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}
