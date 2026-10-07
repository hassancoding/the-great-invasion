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

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(key: string, color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const id = `${key}_${color}_${opts.roughness ?? 0.7}_${opts.metalness ?? 0.1}_${opts.emissive ?? 0}`;
  let m = matCache.get(id);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.7,
      metalness: opts.metalness ?? 0.1,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      flatShading: opts.flatShading ?? false,
    });
    matCache.set(id, m);
  }
  return m;
}

/** Tactical operator: helmet, vest, limbs, rifle — readable at third-person range */
export function makeUnitMesh(color: number, isPlayer = false): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat('body', color, { roughness: 0.55, metalness: 0.2 });
  const darkMat = mat('dark', 0x1a1f2a, { roughness: 0.75, metalness: 0.25 });
  const skinMat = mat('skin', isPlayer ? 0xe8c4a0 : 0xc9a882, { roughness: 0.85 });
  const vestMat = mat('vest', isPlayer ? 0x2563eb : color === 0x22c55e ? 0x166534 : 0x7f1d1d, {
    roughness: 0.45,
    metalness: 0.35,
  });
  const helmetMat = mat('helm', isPlayer ? 0x1e3a5f : 0x2a2a2a, { roughness: 0.4, metalness: 0.5 });

  for (const side of [-1, 1] as const) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 3, 6), darkMat);
    leg.position.set(side * 0.18, 0.45, 0);
    leg.castShadow = true;
    g.add(leg);
  }

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.4), bodyMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  g.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.42), vestMat);
  vest.position.y = 1.2;
  vest.castShadow = true;
  g.add(vest);

  for (const side of [-1, 1] as const) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.45, 3, 6), bodyMat);
    arm.position.set(side * 0.48, 1.15, 0.05);
    arm.rotation.z = side * 0.12;
    arm.castShadow = true;
    g.add(arm);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.15, 6), skinMat);
  neck.position.y = 1.62;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), skinMat);
  head.position.y = 1.85;
  head.castShadow = true;
  g.add(head);

  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), helmetMat);
  helm.position.y = 1.92;
  g.add(helm);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.12),
    mat('visor', isPlayer ? 0x38bdf8 : 0x111111, {
      roughness: 0.2,
      metalness: 0.8,
      emissive: isPlayer ? 0x0ea5e9 : 0x000000,
      emissiveIntensity: isPlayer ? 0.35 : 0,
    })
  );
  visor.position.set(0, 1.88, 0.22);
  g.add(visor);

  const rifle = new THREE.Group();
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.28), darkMat);
  stock.position.set(0, 0, -0.25);
  rifle.add(stock);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.35), mat('recv', 0x2a2a2a, { metalness: 0.6, roughness: 0.35 }));
  rifle.add(receiver);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.55, 6), mat('bar', 0x111111, { metalness: 0.7, roughness: 0.3 }));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.4;
  rifle.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), darkMat);
  mag.position.set(0, -0.12, 0.05);
  rifle.add(mag);
  rifle.position.set(0.42, 1.12, 0.35);
  rifle.rotation.y = -0.08;
  g.add(rifle);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.5, 16),
    new THREE.MeshBasicMaterial({
      color: isPlayer ? 0x38bdf8 : color,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.04;
  g.add(marker);

  return g;
}

/** Build a richer tactical arena: terrain bands, buildings, crates, towers */
export function buildBattlefield(scene: THREE.Scene): THREE.Group {
  const root = new THREE.Group();
  root.name = 'battlefield';

  const groundOuter = new THREE.Mesh(
    new THREE.CircleGeometry(140, 64),
    mat('gOut', 0x0f1720, { roughness: 0.98, metalness: 0.02 })
  );
  groundOuter.rotation.x = -Math.PI / 2;
  groundOuter.position.y = -0.05;
  groundOuter.receiveShadow = true;
  root.add(groundOuter);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(110, 64),
    mat('gMid', 0x1c2838, { roughness: 0.92, metalness: 0.05 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const playArea = new THREE.Mesh(
    new THREE.CircleGeometry(85, 48),
    mat('gPlay', 0x243044, { roughness: 0.88, metalness: 0.06 })
  );
  playArea.rotation.x = -Math.PI / 2;
  playArea.position.y = 0.01;
  playArea.receiveShadow = true;
  root.add(playArea);

  const roadMat = mat('road', 0x1a222e, { roughness: 0.7, metalness: 0.15 });
  for (const [w, d, x, z] of [
    [8, 160, 0, 0],
    [160, 8, 0, 0],
  ] as const) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), roadMat);
    road.position.set(x, 0.03, z);
    road.receiveShadow = true;
    root.add(road);
  }

  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 0.2, 32),
    mat('plaza', 0x3a4558, { roughness: 0.65, metalness: 0.2 })
  );
  plaza.position.set(0, 0.08, -8);
  plaza.receiveShadow = true;
  root.add(plaza);

  const objMat = mat('obj', 0x1d4ed8, {
    roughness: 0.3,
    metalness: 0.5,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.45,
  });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.35, 24), objMat);
  pad.position.set(0, 0.25, -8);
  pad.castShadow = true;
  root.add(pad);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 2.2, 0.35),
      mat('pillar', 0x334155, { roughness: 0.5, metalness: 0.4 })
    );
    pillar.position.set(Math.cos(a) * 4.2, 1.1, -8 + Math.sin(a) * 4.2);
    pillar.castShadow = true;
    root.add(pillar);
  }

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 4, 8),
    mat('beacon', 0x38bdf8, { emissive: 0x0ea5e9, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.6 })
  );
  beacon.position.set(0, 2.2, -8);
  root.add(beacon);

  const buildingSpecs: Array<{ x: number; z: number; w: number; d: number; h: number; rot?: number }> = [
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

  const wallMat = mat('wall', 0x4a5568, { roughness: 0.75, metalness: 0.12 });
  const roofMat = mat('roof', 0x2d3748, { roughness: 0.55, metalness: 0.25 });
  const winMat = mat('win', 0x0c4a6e, {
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0x0369a1,
    emissiveIntensity: 0.25,
  });

  for (const b of buildingSpecs) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat);
    body.position.y = b.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.4, 0.25, b.d + 0.4), roofMat);
    roof.position.y = b.h + 0.12;
    roof.castShadow = true;
    group.add(roof);

    const floors = Math.max(1, Math.floor(b.h / 2.2));
    for (let f = 0; f < floors; f++) {
      for (const side of [-1, 1] as const) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.08), winMat);
        win.position.set(side * (b.w / 2 + 0.02), 1.2 + f * 2.0, 0);
        group.add(win);
      }
      const winF = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.9), winMat);
      winF.position.set(0, 1.2 + f * 2.0, b.d / 2 + 0.02);
      group.add(winF);
    }

    group.position.set(b.x, 0, b.z);
    if (b.rot) group.rotation.y = b.rot;
    root.add(group);
  }

  for (const [tx, tz] of [
    [-55, -55],
    [55, -50],
    [-50, 55],
    [52, 48],
  ] as const) {
    const tower = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 8, 1.2),
      mat('tower', 0x3f4a5c, { roughness: 0.6, metalness: 0.3 })
    );
    post.position.y = 4;
    post.castShadow = true;
    tower.add(post);
    const platform = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 3.5), roofMat);
    platform.position.y = 8.1;
    platform.castShadow = true;
    tower.add(platform);
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.8, 3.6),
      mat('rail', 0x64748b, { roughness: 0.5, metalness: 0.4 })
    );
    rail.position.y = 8.6;
    tower.add(rail);
    tower.position.set(tx, 0, tz);
    root.add(tower);
  }

  const crateMat = mat('crate', 0x8b6914, { roughness: 0.85, metalness: 0.05 });
  const barrelMat = mat('barrel', 0x374151, { roughness: 0.4, metalness: 0.55 });
  const bagMat = mat('bag', 0x5c4a32, { roughness: 0.95, metalness: 0 });
  const barrierMat = mat('barrier', 0xc2410c, { roughness: 0.5, metalness: 0.2 });

  const rng = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  };
  const rnd = rng(42);

  for (let i = 0; i < 28; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 14 + rnd() * 68;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x, z + 8) < 12) continue;

    const kind = rnd();
    if (kind < 0.35) {
      const stack = new THREE.Group();
      const n = 1 + Math.floor(rnd() * 3);
      for (let c = 0; c < n; c++) {
        const size = 1.1 + rnd() * 0.5;
        const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.85, size), crateMat);
        crate.position.y = size * 0.425 + c * size * 0.85;
        crate.rotation.y = rnd() * 0.4;
        crate.castShadow = true;
        crate.receiveShadow = true;
        stack.add(crate);
      }
      stack.position.set(x, 0, z);
      root.add(stack);
    } else if (kind < 0.55) {
      for (let b = 0; b < 2 + Math.floor(rnd() * 2); b++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.2, 10), barrelMat);
        barrel.position.set(x + (b - 0.5) * 0.95, 0.6, z + (rnd() - 0.5));
        barrel.castShadow = true;
        root.add(barrel);
      }
    } else if (kind < 0.8) {
      const wall = new THREE.Group();
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          const bag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.5), bagMat);
          bag.position.set(col * 0.75 - 1.1, 0.2 + row * 0.4, 0);
          bag.castShadow = true;
          wall.add(bag);
        }
      }
      wall.position.set(x, 0, z);
      wall.rotation.y = a + Math.PI / 2;
      root.add(wall);
    } else {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.0, 0.55), barrierMat);
      barrier.position.set(x, 0.5, z);
      barrier.rotation.y = a;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      root.add(barrier);
    }
  }

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 95;
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(18, 3.5, 1.2),
      mat('perim', 0x2c3544, { roughness: 0.8, metalness: 0.1 })
    );
    seg.position.set(Math.cos(a) * r, 1.75, Math.sin(a) * r);
    seg.lookAt(0, 1.75, 0);
    seg.castShadow = true;
    root.add(seg);
  }

  const rockMat = mat('rock', 0x3d4654, { roughness: 0.95, metalness: 0.05, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 20 + rnd() * 75;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.4 + rnd() * 1.2, 0),
      rockMat
    );
    rock.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    rock.rotation.set(rnd(), rnd(), rnd());
    rock.castShadow = true;
    root.add(rock);
  }

  scene.add(root);
  return root;
}

/** Cinematic lighting + sky for Iron Gate */
export function setupAtmosphere(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  scene.background = new THREE.Color(0x0a1220);
  scene.fog = new THREE.FogExp2(0x0a1220, 0.0085);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(0x87a0c8, 0x1a1520, 0.55);
  scene.add(hemi);

  const amb = new THREE.AmbientLight(0x4a5a70, 0.35);
  scene.add(amb);

  const sun = new THREE.DirectionalLight(0xffe6c0, 1.35);
  sun.position.set(55, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x6080a0, 0.35);
  fill.position.set(-40, 30, -20);
  scene.add(fill);

  const objLight = new THREE.PointLight(0x3b82f6, 1.2, 28, 2);
  objLight.position.set(0, 3, -8);
  scene.add(objLight);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(180, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x152238,
      side: THREE.BackSide,
      fog: false,
    })
  );
  scene.add(sky);

  return { sun, hemi };
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function dist2(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}
