'use client';

/**
 * OPERATION IRON GATE — 3D Tactical Battle Royale (primary mode)
 * Inspired by PUBG / Free Fire / tactical COD feel — browser-optimized.
 *
 * Core loop: Deploy → Fight in shrinking zone → Kill / Survive → Score → Share → Replay
 * Controls: WASD / virtual stick move · Click / tap fire · R reload · 1-6 squad · Shift sprint
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ZONE_CONFIG, COMBAT_CONFIG, WEAPONS, type WeaponId } from '@/config/gameConfig';
import {
  DEFAULT_ORDERS,
  applySquadOrder,
  type SquadOrder,
} from '@/game/command/squadOrders';
import { WEATHER, cycleWeather, type WeatherState } from '@/game/world/weather';
import { IRON_GATE_EVENTS, type IronGateEvent } from '@/game/events/ironGateEvents';
import { shareResult } from '@/services/sharing/ShareService';
import { analytics } from '@/services/analytics/AnalyticsService';
import { audio } from '@/game/audio/AudioService';
import { WeaponSlotButton } from '@/components/WeaponSlots';
import { IronGateMenu } from '@/components/ironGate/IronGateMenu';
import { IronGateResults } from '@/components/ironGate/IronGateResults';
import {
  ENEMY_NAMES,
  makeUnitMesh,
  clamp,
  dist2,
  type Unit,
  type Bullet,
  type Phase,
} from '@/game/ironGate/helpers';

const ROUND_SECONDS = COMBAT_CONFIG.roundSeconds;
const PLAYER_SPEED = COMBAT_CONFIG.playerSpeed;
const SPRINT_MULT = COMBAT_CONFIG.sprintMult;
const ENEMY_SPEED = COMBAT_CONFIG.enemySpeed;
const BULLET_SPEED = COMBAT_CONFIG.bulletSpeed;
const ZONE_DAMAGE_PER_SEC = COMBAT_CONFIG.zoneDamagePerSec;

export default function Game3DApp() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef({ active: false, dx: 0, dy: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const fireHeldRef = useRef(false);
  const playerRef = useRef({
    x: 0,
    z: 18,
    yaw: 0,
    hp: 100,
    weapon: 'ar' as WeaponId,
    ammo: { ar: WEAPONS.ar.magSize, sg: WEAPONS.sg.magSize },
    reserve: { ar: WEAPONS.ar.reserveStart, sg: WEAPONS.sg.reserveStart },
    reloadUntil: 0,
    reloadStart: 0,
    lastShot: 0,
    sprint: false,
  });
  const radarRef = useRef<HTMLCanvasElement>(null);
  const unitsRef = useRef<Unit[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const zoneRef = useRef({
    x: 0,
    z: 0,
    r: ZONE_CONFIG.startRadius,
    targetR: ZONE_CONFIG.startRadius,
    phase: 0,
    shrinkT: 0,
  });
  const timeRef = useRef(0);
  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const shotsRef = useRef(0);
  const hitsRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('menu');
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState({
    hp: 100,
    ammo: WEAPONS.ar.magSize,
    reserve: WEAPONS.ar.reserveStart,
    weapon: 'ar' as WeaponId,
    ammoAr: WEAPONS.ar.magSize,
    resAr: WEAPONS.ar.reserveStart,
    ammoSg: WEAPONS.sg.magSize,
    resSg: WEAPONS.sg.reserveStart,
    score: 0,
    kills: 0,
    enemies: 12,
    timeLeft: ROUND_SECONDS,
    zoneText: 'ZONE STABLE',
    outside: false,
    event: 'OPERATION IRON GATE',
    reloading: false,
    reloadProgress: 0,
  });
  const [weaponSlot, setWeaponSlot] = useState<WeaponId>('ar');
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [weather, setWeather] = useState<WeatherState>('OVERCAST');
  const [results, setResults] = useState<{
    score: number;
    kills: number;
    accuracy: number;
    survived: number;
    placement: string;
    message: string;
  } | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [killFeed, setKillFeed] = useState<{ id: number; text: string }[]>([]);
  const [hitmark, setHitmark] = useState(false);
  const [dmgFlash, setDmgFlash] = useState(0);
  const [personalBest, setPersonalBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const feedIdRef = useRef(0);
  const ordersRef = useRef(DEFAULT_ORDERS);
  const weatherRef = useRef<WeatherState>('OVERCAST');
  const lastHpRef = useRef(100);
  const outsideWarnRef = useRef(0);
  const [events, setEvents] = useState<IronGateEvent[]>(() =>
    IRON_GATE_EVENTS.map((e) => ({ ...e }))
  );

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('tgi_iron_pb') || '0');
      if (!Number.isNaN(v)) setPersonalBest(v);
    } catch {}
    audio.loadPrefs();
  }, []);

  const endRound = useCallback((won: boolean) => {
    const survived = Math.floor(timeRef.current);
    const acc =
      shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 100) : 0;
    const placement = won
      ? 'VICTORY'
      : unitsRef.current.filter((u) => u.team === 'enemy' && !u.dead).length === 0
        ? 'LAST STANDING'
        : 'ELIMINATED';
    const score =
      scoreRef.current + (won ? 1500 : 0) + survived * 8 + killsRef.current * 120;
    scoreRef.current = score;
    const message =
      placement === 'VICTORY'
        ? 'You secured Iron Gate.'
        : placement === 'LAST STANDING'
          ? 'Last operator standing.'
          : 'Mission failed. Redeploy?';
    setResults({
      score,
      kills: killsRef.current,
      accuracy: acc,
      survived,
      placement,
      message,
    });
    setShareMsg(
      `I scored ${score.toLocaleString()} in The Great Invasion — Iron Gate (${killsRef.current} kills). Can you beat me?`
    );
    let record = false;
    try {
      const prev = Number(localStorage.getItem('tgi_iron_pb') || '0');
      if (score > prev) {
        localStorage.setItem('tgi_iron_pb', String(score));
        setPersonalBest(score);
        record = true;
        setIsNewRecord(true);
      } else {
        setIsNewRecord(false);
      }
    } catch {
      setIsNewRecord(false);
    }
    setPhase('results');
    analytics.track(won ? 'game_completed' : 'game_failed');
    try {
      audio.play(record ? 'record' : won ? 'levelup' : 'fail');
    } catch {
      
    }
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !mountRef.current) return;

    let dead = false;
    let raf = 0;
    const mount = mountRef.current;
    const w = mount.clientWidth || 360;
    const h = mount.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.FogExp2(0x0b1220, 0.012);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 400);
    camera.position.set(0, 18, 28);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const amb = new THREE.AmbientLight(0x6a7a9a, 0.55);
    scene.add(amb);
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
    sun.position.set(40, 60, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(130, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a2433, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(200, 40, 0x2a3a4e, 0x152030);
    (grid.material as THREE.Material).opacity = 0.45;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const coverMat = new THREE.MeshStandardMaterial({ color: 0x3d4a5c, roughness: 0.8 });
    for (let i = 0; i < 18; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2 + Math.random() * 3, 1.2 + Math.random() * 2, 2 + Math.random() * 3),
        coverMat
      );
      const a = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 70;
      box.position.set(Math.cos(a) * r, (box.geometry as THREE.BoxGeometry).parameters.height / 2, Math.sin(a) * r);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
    }

    const obj = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.4, 24),
      new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.4,
      })
    );
    obj.position.set(0, 0.2, -8);
    scene.add(obj);

    const zoneRingGeo = new THREE.RingGeometry(99.5, 100.5, 64);
    const zoneRingMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const zoneRing = new THREE.Mesh(zoneRingGeo, zoneRingMat);
    zoneRing.rotation.x = -Math.PI / 2;
    zoneRing.position.y = 0.15;
    scene.add(zoneRing);

    const playerMesh = makeUnitMesh(0x3b82f6, true);
    playerMesh.position.set(0, 0, 18);
    scene.add(playerMesh);

    const units: Unit[] = [];
    for (let i = 0; i < 4; i++) {
      const mesh = makeUnitMesh(0x22c55e);
      const x = -6 + i * 3;
      const z = 22;
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      units.push({
        id: i,
        mesh,
        team: 'ally',
        hp: 80,
        maxHp: 80,
        dead: false,
        x,
        z,
        vx: 0,
        vz: 0,
        aimY: 0,
        lastShot: 0,
        name: i < 2 ? 'Alpha' : 'Bravo',
        state: 'advance',
      });
    }
    for (let i = 0; i < 12; i++) {
      const mesh = makeUnitMesh(0xef4444);
      const a = (i / 12) * Math.PI * 2;
      const r = 35 + (i % 3) * 12;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r - 10;
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      units.push({
        id: 100 + i,
        mesh,
        team: 'enemy',
        hp: 70,
        maxHp: 70,
        dead: false,
        x,
        z,
        vx: 0,
        vz: 0,
        aimY: 0,
        lastShot: 0,
        name: ENEMY_NAMES[i % ENEMY_NAMES.length],
        state: 'advance',
      });
    }
    unitsRef.current = units;
    bulletsRef.current = [];

    playerRef.current = {
      x: 0,
      z: 18,
      yaw: 0,
      hp: 100,
      weapon: 'ar',
      ammo: { ar: WEAPONS.ar.magSize, sg: WEAPONS.sg.magSize },
      reserve: { ar: WEAPONS.ar.reserveStart, sg: WEAPONS.sg.reserveStart },
      reloadUntil: 0,
      reloadStart: 0,
      lastShot: 0,
      sprint: false,
    };
    setWeaponSlot('ar');
    zoneRef.current = {
      x: 0,
      z: 0,
      r: ZONE_CONFIG.startRadius,
      targetR: ZONE_CONFIG.startRadius,
      phase: 0,
      shrinkT: ZONE_CONFIG.phases[0].wait,
    };
    timeRef.current = 0;
    scoreRef.current = 0;
    killsRef.current = 0;
    shotsRef.current = 0;
    hitsRef.current = 0;
    setEvents(IRON_GATE_EVENTS.map((e) => ({ ...e })));

    const spawnBullet = (
      x: number,
      z: number,
      yaw: number,
      from: Bullet['from'],
      damage: number,
      speed = BULLET_SPEED,
      life = 1.4,
      radius = 0.12
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 6, 6),
        new THREE.MeshBasicMaterial({ color: from === 'enemy' ? 0xff4444 : 0xfbbf24 })
      );
      mesh.position.set(x, 1.2, z);
      scene.add(mesh);
      bulletsRef.current.push({
        mesh,
        vx: Math.sin(yaw) * speed,
        vz: Math.cos(yaw) * speed,
        life,
        from,
        damage,
      });
    };

    const tryPlayerFire = (t: number) => {
      const p = playerRef.current;
      const w = WEAPONS[p.weapon];
      if (t < p.reloadUntil) return;
      if (p.ammo[p.weapon] <= 0) {
        if (p.reserve[p.weapon] > 0 && t >= p.reloadUntil) {
          p.reloadStart = t;
          p.reloadUntil = t + w.reloadTime;
          const take = Math.min(w.magSize, p.reserve[p.weapon]);
          p.reserve[p.weapon] -= take;
          try { audio.play('reload'); } catch {}
          window.setTimeout(() => {
            p.ammo[p.weapon] = Math.min(w.magSize, p.ammo[p.weapon] + take);
          }, w.reloadTime * 1000);
        }
        return;
      }
      if (t - p.lastShot < w.fireCooldown) return;
      p.lastShot = t;
      p.ammo[p.weapon] -= 1;
      shotsRef.current += 1;
      for (let i = 0; i < w.pellets; i++) {
        const spread = (Math.random() - 0.5) * w.spread * 2;
        spawnBullet(p.x, p.z, p.yaw + spread, 'player', w.damage, w.bulletSpeed, w.life, p.weapon === 'sg' ? 0.1 : 0.12);
      }
      try {
        audio.play('shoot');
      } catch {
        
      }
    };

    const switchWeapon = (id: WeaponId) => {
      const p = playerRef.current;
      if (p.weapon === id) return;
      p.weapon = id;
      p.reloadUntil = 0;
      p.reloadStart = 0;
      setWeaponSlot(id);
      try { audio.play('click'); } catch {}
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyR') {
        const p = playerRef.current;
        const w = WEAPONS[p.weapon];
        if (p.ammo[p.weapon] < w.magSize && p.reserve[p.weapon] > 0 && timeRef.current >= p.reloadUntil) {
          p.reloadStart = timeRef.current;
          p.reloadUntil = timeRef.current + w.reloadTime;
          const need = w.magSize - p.ammo[p.weapon];
          const take = Math.min(need, p.reserve[p.weapon]);
          p.reserve[p.weapon] -= take;
          try { audio.play('reload'); } catch {}
          window.setTimeout(() => {
            p.ammo[p.weapon] = Math.min(w.magSize, p.ammo[p.weapon] + take);
          }, w.reloadTime * 1000);
        }
      }
      if (e.code === 'KeyQ' || e.code === 'Digit1') switchWeapon('ar');
      if (e.code === 'KeyE' || e.code === 'Digit2') switchWeapon('sg');
      if (e.code === 'KeyT') setWeather((wth) => cycleWeather(wth));
      if (e.code.startsWith('Digit') && e.code >= 'Digit3' && e.code <= 'Digit8') {
        setOrders((prev) => applySquadOrder(prev, e.code));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-ui]')) return;
      fireHeldRef.current = true;
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      playerRef.current.yaw = Math.atan2(nx * 2.2, 1 - ny * 0.6);
    };
    const onPointerUp = () => {
      fireHeldRef.current = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!fireHeldRef.current && e.buttons === 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      playerRef.current.yaw = Math.atan2(nx * 2.2, 1 - ny * 0.6);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    let last = performance.now();
    let hudAcc = 0;

    const tick = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      timeRef.current += dt;
      const t = timeRef.current;
      const p = playerRef.current;
      const zone = zoneRef.current;

      zone.shrinkT -= dt;
      if (zone.shrinkT <= 0 && zone.phase < ZONE_CONFIG.phases.length) {
        const ph = ZONE_CONFIG.phases[zone.phase];
        zone.targetR = ph.radius;
        zone.phase += 1;
        zone.shrinkT = ph.shrink + (ZONE_CONFIG.phases[zone.phase]?.wait ?? 20);
      }
      zone.r += (zone.targetR - zone.r) * Math.min(1, dt * 0.35);
      const ringScale = zone.r / 100;
      zoneRing.scale.set(ringScale, ringScale, ringScale);

      const keys = keysRef.current;
      let mx = 0;
      let mz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
      if (stickRef.current.active) {
        mx += stickRef.current.dx;
        mz += stickRef.current.dy;
      }
      const len = Math.hypot(mx, mz) || 1;
      mx /= len;
      mz /= len;
      const sprint = !!(keys['ShiftLeft'] || keys['ShiftRight']);
      p.sprint = sprint;
      const spd = PLAYER_SPEED * (sprint ? SPRINT_MULT : 1) * WEATHER[weatherRef.current].movement;
      p.x += mx * spd * dt;
      p.z += mz * spd * dt;
      p.x = clamp(p.x, -120, 120);
      p.z = clamp(p.z, -120, 120);
      playerMesh.position.set(p.x, 0, p.z);
      playerMesh.rotation.y = p.yaw;

      if (fireHeldRef.current || keys['Space']) {
        let best = 999;
        let bestYaw = p.yaw;
        for (const u of units) {
          if (u.dead || u.team !== 'enemy') continue;
          const d = dist2(u.x, u.z, p.x, p.z);
          if (d < 40 && d < best) {
            best = d;
            bestYaw = Math.atan2(u.x - p.x, u.z - p.z);
          }
        }
        if (best < 40) {
          const diff = bestYaw - p.yaw;
          const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
          p.yaw += wrapped * COMBAT_CONFIG.mobileAimAssist;
        }
        tryPlayerFire(t);
      }

      const distCenter = dist2(p.x, p.z, zone.x, zone.z);
      const outside = distCenter > zone.r;
      if (outside) {
        p.hp -= ZONE_DAMAGE_PER_SEC * dt;
        if (t - outsideWarnRef.current > 1.2) {
          outsideWarnRef.current = t;
          try { audio.play('zone'); } catch {}
        }
      }

      let aliveEnemies = 0;
      for (const u of units) {
        if (u.dead) continue;
        if (u.team === 'enemy') aliveEnemies += 1;

        const toPlayer = dist2(u.x, u.z, p.x, p.z);
        if (u.team === 'enemy') {
          if (toPlayer < 28) u.state = 'engage';
          else u.state = 'advance';
        } else {
          const order: SquadOrder = u.name === 'Alpha' ? ordersRef.current.ALPHA : ordersRef.current.BRAVO;
          if (order === 'FOLLOW') u.state = 'advance';
          else if (order === 'DEFEND' || order === 'HOLD') u.state = 'idle';
          else if (order === 'FLANK_LEFT') u.state = 'flank';
          else u.state = 'advance';
        }

        let tx = u.x;
        let tz = u.z;
        if (u.team === 'enemy') {
          if (u.state === 'engage' || u.state === 'advance') {
            tx = p.x;
            tz = p.z;
          }
        } else {
          if (u.state === 'advance') {
            tx = p.x + (u.id % 2 === 0 ? -4 : 4);
            tz = p.z - 3;
          } else if (u.state === 'flank') {
            tx = p.x - 12;
            tz = p.z - 8;
          }
        }

        const dx = tx - u.x;
        const dz = tz - u.z;
        const d = Math.hypot(dx, dz) || 1;
        const speed = u.team === 'enemy' ? ENEMY_SPEED : PLAYER_SPEED * 0.85;
        if (d > 2.5) {
          u.x += (dx / d) * speed * dt;
          u.z += (dz / d) * speed * dt;
        }
        u.aimY = Math.atan2(dx, dz);
        u.mesh.position.set(u.x, 0, u.z);
        u.mesh.rotation.y = u.aimY;

        const engageDist = u.team === 'enemy' ? 32 : 40;
        const tdist = dist2(u.x, u.z, p.x, p.z);
        if (tdist < engageDist && t - u.lastShot > (u.team === 'enemy' ? 0.55 : 0.4)) {
          u.lastShot = t;
          const yaw = Math.atan2(p.x - u.x, p.z - u.z);
          const spread = (Math.random() - 0.5) * 0.18;
          spawnBullet(
            u.x,
            u.z,
            yaw + spread,
            u.team === 'enemy' ? 'enemy' : 'ally',
            u.team === 'enemy' ? 12 : 22
          );
        }

        if (dist2(u.x, u.z, zone.x, zone.z) > zone.r) {
          u.hp -= ZONE_DAMAGE_PER_SEC * 0.7 * dt;
        }
        if (u.hp <= 0) {
          u.dead = true;
          u.mesh.visible = false;
          if (u.team === 'enemy') {
            killsRef.current += 1;
            scoreRef.current += 120;
          }
        }
      }

      const bullets = bulletsRef.current;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.life -= dt;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.z += b.vz * dt;
        if (b.life <= 0) {
          scene.remove(b.mesh);
          b.mesh.geometry.dispose();
          (b.mesh.material as THREE.Material).dispose();
          bullets.splice(i, 1);
          continue;
        }
        if (b.from === 'enemy') {
          if (dist2(b.mesh.position.x, b.mesh.position.z, p.x, p.z) < 1.1) {
            p.hp -= b.damage;
            setDmgFlash((n) => n + 1);
            try { audio.play('damage'); if (navigator.vibrate) navigator.vibrate(40); } catch {}
            scene.remove(b.mesh);
            bullets.splice(i, 1);
            continue;
          }
        }
        for (const u of units) {
          if (u.dead) continue;
          if (b.from === 'enemy' && u.team === 'enemy') continue;
          if (b.from !== 'enemy' && u.team !== 'enemy') continue;
          if (dist2(b.mesh.position.x, b.mesh.position.z, u.x, u.z) < 1.15) {
            u.hp -= b.damage;
            if (b.from === 'player') {
              hitsRef.current += 1;
              scoreRef.current += 15;
              setHitmark(true);
              window.setTimeout(() => setHitmark(false), 90);
              try { audio.play('hit'); } catch {}
            }
            scene.remove(b.mesh);
            bullets.splice(i, 1);
            if (u.hp <= 0) {
              u.dead = true;
              u.mesh.visible = false;
              if (u.team === 'enemy') {
                killsRef.current += 1;
                scoreRef.current += 120;
                const kid = ++feedIdRef.current;
                const name = u.name;
                setKillFeed((f) => [{ id: kid, text: `ELIMINATED ${name}` }, ...f].slice(0, 4));
                window.setTimeout(() => setKillFeed((f) => f.filter((x) => x.id !== kid)), 2800);
                setHitmark(true);
                window.setTimeout(() => setHitmark(false), 120);
                try {
                  audio.play('claim');
                  if (navigator.vibrate) navigator.vibrate(30);
                } catch {
                  
                }
              }
            }
            break;
          }
        }
      }

      const camPos = new THREE.Vector3(
        p.x - Math.sin(p.yaw) * 12,
        14,
        p.z - Math.cos(p.yaw) * 12 + 8
      );
      camera.position.lerp(camPos, 1 - Math.pow(0.001, dt));
      camera.lookAt(p.x, 1.2, p.z);

      const vis = WEATHER[weatherRef.current].visibility;
      scene.fog = new THREE.FogExp2(0x0b1220, 0.008 + (1 - vis) * 0.025);

      for (const ev of events) {
        if (!ev.triggered && t >= ev.time) {
          ev.triggered = true;
          setHud((hh) => ({ ...hh, event: ev.title }));
        }
      }

      hudAcc += dt;
      if (hudAcc > 0.1) {
        hudAcc = 0;
        const timeLeft = Math.max(0, ROUND_SECONDS - Math.floor(t));
        setHud({
          hp: Math.max(0, Math.round(p.hp)),
          ammo: p.ammo[p.weapon],
          reserve: p.reserve[p.weapon],
          weapon: p.weapon,
          ammoAr: p.ammo.ar,
          resAr: p.reserve.ar,
          ammoSg: p.ammo.sg,
          resSg: p.reserve.sg,
          score: Math.round(scoreRef.current + t * 5),
          kills: killsRef.current,
          enemies: aliveEnemies,
          timeLeft,
          zoneText: outside
            ? '⚠ OUTSIDE ZONE'
            : zone.phase === 0
              ? 'ZONE STABLE'
              : `ZONE PHASE ${zone.phase} · R${Math.round(zone.r)}`,
          outside,
          event:
            events.find((e) => e.triggered && t - e.time < 4)?.title ??
            'OPERATION IRON GATE',
          reloading: t < p.reloadUntil,
          reloadProgress:
            t < p.reloadUntil && p.reloadUntil > p.reloadStart
              ? Math.min(1, (t - p.reloadStart) / (p.reloadUntil - p.reloadStart))
              : 0,
        });

        const rcv = radarRef.current;
        if (rcv) {
          const ctx = rcv.getContext('2d');
          if (ctx) {
            const S = rcv.width;
            const range = COMBAT_CONFIG.radarRange;
            ctx.clearRect(0, 0, S, S);
            ctx.fillStyle = 'rgba(8,14,24,0.82)';
            ctx.beginPath();
            ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56,189,248,0.45)';
            ctx.lineWidth = 2;
            ctx.stroke();
            const zr = (zone.r / range) * (S / 2);
            ctx.strokeStyle = 'rgba(34,211,238,0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(
              S / 2 - (p.x - zone.x) / range * (S / 2),
              S / 2 - (p.z - zone.z) / range * (S / 2),
              Math.max(4, zr),
              0,
              Math.PI * 2
            );
            ctx.stroke();
            const plot = (x: number, z: number, color: string, size = 3) => {
              const px = S / 2 + ((x - p.x) / range) * (S / 2);
              const py = S / 2 + ((z - p.z) / range) * (S / 2);
              if (px < 2 || px > S - 2 || py < 2 || py > S - 2) return;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fill();
            };
            for (const u of units) {
              if (u.dead) continue;
              if (u.team === 'enemy') plot(u.x, u.z, '#ef4444', 2.5);
              else plot(u.x, u.z, '#22c55e', 2.5);
            }
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(S / 2, S / 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#7dd3fc';
            ctx.beginPath();
            ctx.moveTo(S / 2, S / 2);
            ctx.lineTo(S / 2 + Math.sin(p.yaw) * 10, S / 2 + Math.cos(p.yaw) * 10);
            ctx.stroke();
          }
        }
      }

      if (p.hp <= 0) {
        dead = true;
        endRound(false);
        return;
      }
      if (aliveEnemies === 0) {
        dead = true;
        endRound(true);
        return;
      }
      if (t >= ROUND_SECONDS) {
        dead = true;
        endRound(aliveEnemies <= 3);
        return;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m?.dispose();
        }
      });
    };
  }, [phase, endRound]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        window.clearInterval(id);
        setPhase('playing');
        analytics.track('game_started');
        try {
          audio.unlock();
        } catch {
          
        }
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [phase]);

  const startMission = () => {
    setResults(null);
    setIsNewRecord(false);
    setKillFeed([]);
    setPhase('countdown');
  };

  const handleShare = async () => {
    const text =
      shareMsg ||
      `I played The Great Invasion — Iron Gate. Can you beat my score?`;
    await shareResult(text);
    analytics.track('share_clicked');
  };

  const onStickStart = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    stickRef.current.active = true;
    updateStick(e);
  };
  const updateStick = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (e.clientX - cx) / (rect.width / 2);
    let dy = (e.clientY - cy) / (rect.height / 2);
    const m = Math.hypot(dx, dy) || 1;
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    stickRef.current.dx = dx;
    stickRef.current.dy = dy;
  };
  const onStickEnd = () => {
    stickRef.current.active = false;
    stickRef.current.dx = 0;
    stickRef.current.dy = 0;
  };

  if (phase === 'menu') {
    return <IronGateMenu personalBest={personalBest} onDeploy={startMission} />;
  }

  if (phase === 'countdown') {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0a0e17] flex flex-col items-center justify-center text-white">
        <p className="text-sky-400 text-sm tracking-widest mb-4">ENTERING COMBAT</p>
        <div className="text-8xl font-black tabular-nums">
          {countdown > 0 ? countdown : 'GO'}
        </div>
      </div>
    );
  }

  if (phase === 'results' && results) {
    return (
      <IronGateResults
        results={results}
        isNewRecord={isNewRecord}
        personalBest={personalBest}
        shareMsg={shareMsg}
        onRedeploy={startMission}
        onShare={handleShare}
        onMenu={() => setPhase('menu')}
      />
    );
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0a0e17] text-white select-none">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none z-10">
        <div className="space-y-1 font-mono text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${hud.hp < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${hud.hp}%` }}
              />
            </div>
            <span>{hud.hp} HP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-300">{hud.weapon === 'ar' ? 'AR' : 'SG'}</span>
            {hud.reloading ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <span
                  className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"
                />
                RELOAD {Math.round(hud.reloadProgress * 100)}%
              </span>
            ) : (
              <span>
                {hud.ammo}/{hud.reserve}
              </span>
            )}
          </div>
          {hud.reloading && (
            <div className="w-28 h-1 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{ width: `${hud.reloadProgress * 100}%` }}
              />
            </div>
          )}
          <div className={hud.outside ? 'text-red-400 font-bold animate-pulse' : 'text-cyan-400'}>
            {hud.zoneText}
          </div>
        </div>
        <div className="text-right font-mono text-xs sm:text-sm space-y-1">
          <div className="text-sky-400 font-bold text-lg tabular-nums">{hud.score}</div>
          <div>KILLS {hud.kills}</div>
          <div>HOSTILES {hud.enemies}</div>
          <div className="text-slate-400">{hud.timeLeft}s</div>
        </div>
      </div>

      <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none z-10">
        <div className="px-4 py-1.5 rounded-full bg-black/60 text-xs tracking-wide border border-slate-700">
          {hud.event}
        </div>
      </div>

      
      {dmgFlash > 0 && (
        <div
          key={dmgFlash}
          className="absolute inset-0 pointer-events-none z-20 bg-red-600/25 animate-pulse"
          style={{ animationDuration: '0.2s' }}
        />
      )}

      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div
          className={`w-5 h-5 border rounded-full transition-all ${
            hitmark ? 'border-amber-400 scale-125 opacity-100' : 'border-white/70 opacity-70'
          }`}
        />
        {hitmark && (
          <div className="absolute w-8 h-8 border-2 border-amber-400 rotate-45 opacity-90" />
        )}
        {hud.reloading && (
          <svg className="absolute w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(15,23,42,0.7)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - hud.reloadProgress)}`}
              className="transition-[stroke-dashoffset] duration-100"
            />
          </svg>
        )}
      </div>

      
      <div className="absolute top-28 left-3 z-20 space-y-1 pointer-events-none">
        {killFeed.map((k) => (
          <div
            key={k.id}
            className="text-[11px] font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30"
          >
            {k.text}
          </div>
        ))}
      </div>

      {}
      <div className="absolute bottom-36 left-3 z-20 sm:bottom-6 pointer-events-none">
        <canvas
          ref={radarRef}
          width={112}
          height={112}
          className="w-28 h-28 rounded-full border border-cyan-500/40 shadow-lg shadow-black/40"
        />
      </div>

      {}
      <div data-ui className="absolute bottom-36 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-auto sm:bottom-6">
        <WeaponSlotButton
          id="ar"
          active={weaponSlot === 'ar'}
          ammo={hud.ammoAr}
          reserve={hud.resAr}
          reloading={hud.reloading}
          reloadProgress={hud.reloadProgress}
          onSelect={() => {
            playerRef.current.weapon = 'ar';
            playerRef.current.reloadUntil = 0;
            playerRef.current.reloadStart = 0;
            setWeaponSlot('ar');
            try { audio.play('click'); } catch {}
          }}
        />
        <WeaponSlotButton
          id="sg"
          active={weaponSlot === 'sg'}
          ammo={hud.ammoSg}
          reserve={hud.resSg}
          reloading={hud.reloading}
          reloadProgress={hud.reloadProgress}
          onSelect={() => {
            playerRef.current.weapon = 'sg';
            playerRef.current.reloadUntil = 0;
            playerRef.current.reloadStart = 0;
            setWeaponSlot('sg');
            try { audio.play('click'); } catch {}
          }}
        />
      </div>

      <div
        data-ui
        className="absolute top-28 right-3 z-20 flex flex-col gap-1 text-[10px] font-mono"
      >
        <div className="bg-black/50 px-2 py-1 rounded">α {orders.ALPHA}</div>
        <div className="bg-black/50 px-2 py-1 rounded">β {orders.BRAVO}</div>
      </div>

      <div
        data-ui
        className="absolute bottom-6 left-4 z-20 w-28 h-28 rounded-full bg-white/10 border border-white/20 touch-none sm:hidden"
        onPointerDown={onStickStart}
        onPointerMove={(e) => stickRef.current.active && updateStick(e)}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40">
          MOVE
        </div>
      </div>
      <button
        data-ui
        className="absolute bottom-8 right-4 z-20 w-20 h-20 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 font-bold text-sm sm:hidden touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          fireHeldRef.current = true;
        }}
        onPointerUp={() => {
          fireHeldRef.current = false;
        }}
        onPointerCancel={() => {
          fireHeldRef.current = false;
        }}
      >
        FIRE
      </button>
      <button
        data-ui
        className={`absolute bottom-28 right-6 z-20 px-3 py-2 rounded-lg text-xs font-semibold sm:hidden flex items-center gap-1.5 ${
          hud.reloading ? 'bg-amber-700/90 text-amber-100' : 'bg-slate-800/90'
        }`}
        onClick={() => {
          const p = playerRef.current;
          const w = WEAPONS[p.weapon];
          if (p.ammo[p.weapon] < w.magSize && p.reserve[p.weapon] > 0 && timeRef.current >= p.reloadUntil) {
            p.reloadStart = timeRef.current;
            p.reloadUntil = timeRef.current + w.reloadTime;
            const need = w.magSize - p.ammo[p.weapon];
            const take = Math.min(need, p.reserve[p.weapon]);
            p.reserve[p.weapon] -= take;
            try { audio.play('reload'); } catch {}
            window.setTimeout(() => {
              p.ammo[p.weapon] = Math.min(w.magSize, p.ammo[p.weapon] + take);
            }, w.reloadTime * 1000);
          }
        }}
      >
        {hud.reloading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
            {Math.round(hud.reloadProgress * 100)}%
          </>
        ) : (
          'RELOAD'
        )}
      </button>
    </div>
  );
}
