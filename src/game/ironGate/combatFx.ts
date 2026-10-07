import * as THREE from 'three';

/** Lightweight combat VFX: muzzle flash, impact sparks, death topple, camera recoil */

export type RecoilState = {
  kickYaw: number;
  kickPitch: number;
  punch: number;
};

export function createRecoilState(): RecoilState {
  return { kickYaw: 0, kickPitch: 0, punch: 0 };
}

/** Apply weapon kick — AR snappy, SG heavy */
export function applyRecoil(recoil: RecoilState, weapon: 'ar' | 'sg') {
  if (weapon === 'sg') {
    recoil.kickYaw += (Math.random() - 0.5) * 0.09;
    recoil.kickPitch += 0.07 + Math.random() * 0.04;
    recoil.punch = Math.min(1, recoil.punch + 0.55);
  } else {
    recoil.kickYaw += (Math.random() - 0.5) * 0.028;
    recoil.kickPitch += 0.018 + Math.random() * 0.012;
    recoil.punch = Math.min(1, recoil.punch + 0.22);
  }
}

export function decayRecoil(recoil: RecoilState, dt: number) {
  const damp = Math.exp(-10 * dt);
  recoil.kickYaw *= damp;
  recoil.kickPitch *= damp;
  recoil.punch = Math.max(0, recoil.punch - dt * 3.2);
}

export type MuzzleFlash = {
  light: THREE.PointLight;
  core: THREE.Mesh;
  age: number;
  life: number;
};

export function spawnMuzzleFlash(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  yaw: number,
  weapon: 'ar' | 'sg'
): MuzzleFlash {
  const life = weapon === 'sg' ? 0.09 : 0.05;
  const intensity = weapon === 'sg' ? 4.5 : 2.8;
  const light = new THREE.PointLight(0xffcc66, intensity, 12, 2);
  const ox = Math.sin(yaw) * 1.1;
  const oz = Math.cos(yaw) * 1.1;
  light.position.set(x + ox, y, z + oz);
  scene.add(light);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(weapon === 'sg' ? 0.35 : 0.18, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.95 })
  );
  core.position.copy(light.position);
  scene.add(core);

  return { light, core, age: 0, life };
}

export function updateMuzzleFlashes(flashes: MuzzleFlash[], scene: THREE.Scene, dt: number) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.age += dt;
    const t = f.age / f.life;
    if (t >= 1) {
      scene.remove(f.light);
      scene.remove(f.core);
      (f.core.material as THREE.Material).dispose();
      f.core.geometry.dispose();
      flashes.splice(i, 1);
      continue;
    }
    f.light.intensity *= 0.82;
    const mat = f.core.material as THREE.MeshBasicMaterial;
    mat.opacity = 1 - t;
    f.core.scale.setScalar(1 + t * 1.8);
  }
}

export type ImpactSpark = {
  mesh: THREE.Points;
  vel: Float32Array;
  age: number;
  life: number;
};

export function spawnImpact(
  scene: THREE.Scene,
  x: number,
  y: number,
  z: number,
  kind: 'hit' | 'kill' | 'world' = 'hit'
): ImpactSpark {
  const count = kind === 'kill' ? 18 : kind === 'world' ? 8 : 12;
  const positions = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    const a = Math.random() * Math.PI * 2;
    const up = 2 + Math.random() * 6;
    const out = 3 + Math.random() * 8;
    vel[i * 3] = Math.cos(a) * out;
    vel[i * 3 + 1] = up;
    vel[i * 3 + 2] = Math.sin(a) * out;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const color = kind === 'kill' ? 0xff4444 : kind === 'world' ? 0xfbbf24 : 0xffe066;
  const mat = new THREE.PointsMaterial({
    color,
    size: kind === 'kill' ? 0.28 : 0.18,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const mesh = new THREE.Points(geo, mat);
  scene.add(mesh);
  return { mesh, vel, age: 0, life: kind === 'kill' ? 0.55 : 0.35 };
}

export function updateImpacts(impacts: ImpactSpark[], scene: THREE.Scene, dt: number) {
  for (let i = impacts.length - 1; i >= 0; i--) {
    const s = impacts[i];
    s.age += dt;
    const t = s.age / s.life;
    if (t >= 1) {
      scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      (s.mesh.material as THREE.Material).dispose();
      impacts.splice(i, 1);
      continue;
    }
    const pos = s.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let j = 0; j < s.vel.length / 3; j++) {
      arr[j * 3] += s.vel[j * 3] * dt;
      arr[j * 3 + 1] += s.vel[j * 3 + 1] * dt;
      arr[j * 3 + 2] += s.vel[j * 3 + 2] * dt;
      s.vel[j * 3 + 1] -= 18 * dt;
    }
    pos.needsUpdate = true;
    (s.mesh.material as THREE.PointsMaterial).opacity = 1 - t;
  }
}

export type DeathFx = {
  mesh: THREE.Group;
  age: number;
  life: number;
  startRot: number;
  side: number;
};

/** Tip unit over then sink — replaces instant disappear */
export function startDeathReaction(unitMesh: THREE.Group, aimY: number): DeathFx {
  return {
    mesh: unitMesh,
    age: 0,
    life: 0.85,
    startRot: aimY,
    side: Math.random() > 0.5 ? 1 : -1,
  };
}

export function updateDeaths(deaths: DeathFx[], scene: THREE.Scene, dt: number) {
  for (let i = deaths.length - 1; i >= 0; i--) {
    const d = deaths[i];
    d.age += dt;
    const t = Math.min(1, d.age / d.life);
    const fall = Math.min(1, t * 1.6);
    d.mesh.rotation.z = d.side * fall * (Math.PI / 2) * 0.92;
    d.mesh.rotation.x = fall * 0.25;
    if (t > 0.45) {
      const sink = (t - 0.45) / 0.55;
      d.mesh.position.y = -sink * 1.4;
    }
    const s = 1 - t * 0.15;
    d.mesh.scale.setScalar(s);
    if (t >= 1) {
      scene.remove(d.mesh);
      deaths.splice(i, 1);
    }
  }
}
