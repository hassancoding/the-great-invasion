'use client';

import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import * as THREE from 'three';
import { ZONE_CONFIG, COMBAT_CONFIG, WEAPONS, type WeaponId } from '@/config/gameConfig';
import { applySquadOrder, type SquadOrder } from '@/game/command/squadOrders';
import { WEATHER, cycleWeather, type WeatherState } from '@/game/world/weather';
import { IRON_GATE_EVENTS, type IronGateEvent } from '@/game/events/ironGateEvents';
import { audio } from '@/game/audio/AudioService';
import {
  ENEMY_NAMES,
  makeUnitMesh,
  clamp,
  dist2,
  type Unit,
  type Bullet,
} from '@/game/ironGate/helpers';

const ROUND_SECONDS = COMBAT_CONFIG.roundSeconds;
const PLAYER_SPEED = COMBAT_CONFIG.playerSpeed;
const SPRINT_MULT = COMBAT_CONFIG.sprintMult;
const ENEMY_SPEED = COMBAT_CONFIG.enemySpeed;
const BULLET_SPEED = COMBAT_CONFIG.bulletSpeed;
const ZONE_DAMAGE_PER_SEC = COMBAT_CONFIG.zoneDamagePerSec;

type PlayerState = {
  x: number; z: number; yaw: number; hp: number; weapon: WeaponId;
  ammo: Record<WeaponId, number>;
  reserve: Record<WeaponId, number>;
  reloadUntil: number; reloadStart: number; lastShot: number; sprint: boolean;
};

type ZoneState = { x: number; z: number; r: number; targetR: number; phase: number; shrinkT: number };

export function useIronGateBattle(opts: {
  phase: string;
  endRound: (won: boolean) => void;
  mountRef: MutableRefObject<HTMLDivElement | null>;
  stickRef: MutableRefObject<{ active: boolean; dx: number; dy: number }>;
  keysRef: MutableRefObject<Record<string, boolean>>;
  fireHeldRef: MutableRefObject<boolean>;
  playerRef: MutableRefObject<PlayerState>;
  unitsRef: MutableRefObject<Unit[]>;
  bulletsRef: MutableRefObject<Bullet[]>;
  zoneRef: MutableRefObject<ZoneState>;
  timeRef: MutableRefObject<number>;
  scoreRef: MutableRefObject<number>;
  killsRef: MutableRefObject<number>;
  shotsRef: MutableRefObject<number>;
  hitsRef: MutableRefObject<number>;
  radarRef: MutableRefObject<HTMLCanvasElement | null>;
  feedIdRef: MutableRefObject<number>;
  ordersRef: MutableRefObject<{ ALPHA: SquadOrder; BRAVO: SquadOrder }>;
  weatherRef: MutableRefObject<WeatherState>;
  outsideWarnRef: MutableRefObject<number>;
  setHud: Dispatch<SetStateAction<any>>;
  setWeaponSlot: Dispatch<SetStateAction<WeaponId>>;
  setEvents: Dispatch<SetStateAction<IronGateEvent[]>>;
  setKillFeed: Dispatch<SetStateAction<{ id: number; text: string }[]>>;
  setHitmark: Dispatch<SetStateAction<boolean>>;
  setDmgFlash: Dispatch<SetStateAction<number>>;
  setWeather: Dispatch<SetStateAction<WeatherState>>;
  setOrders: Dispatch<SetStateAction<any>>;
}) {
  const {
    phase, endRound, mountRef, stickRef, keysRef, fireHeldRef, playerRef,
    unitsRef, bulletsRef, zoneRef, timeRef, scoreRef, killsRef, shotsRef, hitsRef,
    radarRef, feedIdRef, ordersRef, weatherRef, outsideWarnRef,
    setHud, setWeaponSlot, setEvents, setKillFeed, setHitmark, setDmgFlash, setWeather, setOrders,
  } = opts;

  useEffect(() => {
    if (phase !== 'playing' || !mountRef.current) return;

    let events = IRON_GATE_EVENTS.map((e) => ({ ...e }));
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x6a7a9a, 0.55));
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
    sun.position.set(40, 60, 20);
    sun.castShadow = true;
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
      scene.add(box);
    }

    const obj = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.4 })
    );
    obj.position.set(0, 0.2, -8);
    scene.add(obj);

    const zoneRing = new THREE.Mesh(
      new THREE.RingGeometry(99.5, 100.5, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
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
      units.push({ id: i, mesh, team: 'ally', hp: 80, maxHp: 80, dead: false, x, z, aimY: 0, lastShot: 0, name: i < 2 ? 'Alpha' : 'Bravo', state: 'advance' });
    }
    for (let i = 0; i < 12; i++) {
      const mesh = makeUnitMesh(0xef4444);
      const a = (i / 12) * Math.PI * 2;
      const r = 35 + (i % 3) * 12;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r - 10;
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      units.push({ id: 100 + i, mesh, team: 'enemy', hp: 70, maxHp: 70, dead: false, x, z, aimY: 0, lastShot: 0, name: ENEMY_NAMES[i % ENEMY_NAMES.length], state: 'advance' });
    }
    unitsRef.current = units;
    bulletsRef.current = [];

    playerRef.current = {
      x: 0, z: 18, yaw: 0, hp: 100, weapon: 'ar',
      ammo: { ar: WEAPONS.ar.magSize, sg: WEAPONS.sg.magSize },
      reserve: { ar: WEAPONS.ar.reserveStart, sg: WEAPONS.sg.reserveStart },
      reloadUntil: 0, reloadStart: 0, lastShot: 0, sprint: false,
    };
    setWeaponSlot('ar');
    zoneRef.current = { x: 0, z: 0, r: ZONE_CONFIG.startRadius, targetR: ZONE_CONFIG.startRadius, phase: 0, shrinkT: ZONE_CONFIG.phases[0].wait };
    timeRef.current = 0; scoreRef.current = 0; killsRef.current = 0; shotsRef.current = 0; hitsRef.current = 0;
    setEvents(IRON_GATE_EVENTS.map((e) => ({ ...e })));
    events = IRON_GATE_EVENTS.map((e) => ({ ...e }));

    const spawnBullet = (x: number, z: number, yaw: number, from: Bullet['from'], damage: number, speed: number = BULLET_SPEED, life: number = 1.4, radius: number = 0.12) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 6, 6),
        new THREE.MeshBasicMaterial({ color: from === 'enemy' ? 0xff4444 : 0xfbbf24 })
      );
      mesh.position.set(x, 1.2, z);
      scene.add(mesh);
      bulletsRef.current.push({ mesh, vx: Math.sin(yaw) * speed, vz: Math.cos(yaw) * speed, life, from, damage });
    };

    const tryPlayerFire = (t: number) => {
      const p = playerRef.current;
      const weapon = p.weapon;
      const wp = WEAPONS[weapon];
      if (t < p.reloadUntil) return;
      if (p.ammo[weapon] <= 0) {
        if (p.reserve[weapon] > 0 && t >= p.reloadUntil) {
          p.reloadStart = t;
          p.reloadUntil = t + wp.reloadTime;
          const take = Math.min(wp.magSize, p.reserve[weapon]);
          p.reserve[weapon] -= take;
          try { audio.play('reload'); } catch {}
          window.setTimeout(() => { p.ammo[weapon] = Math.min(wp.magSize, p.ammo[weapon] + take); }, wp.reloadTime * 1000);
        }
        return;
      }
      if (t - p.lastShot < wp.fireCooldown) return;
      p.lastShot = t;
      p.ammo[weapon] -= 1;
      shotsRef.current += 1;
      for (let i = 0; i < wp.pellets; i++) {
        spawnBullet(p.x, p.z, p.yaw + (Math.random() - 0.5) * wp.spread * 2, 'player', wp.damage, wp.bulletSpeed, wp.life, p.weapon === 'sg' ? 0.1 : 0.12);
      }
      try { audio.play('shoot'); } catch {}
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
        const weapon = p.weapon;
        const wp = WEAPONS[weapon];
        if (p.ammo[weapon] < wp.magSize && p.reserve[weapon] > 0 && timeRef.current >= p.reloadUntil) {
          p.reloadStart = timeRef.current;
          p.reloadUntil = timeRef.current + wp.reloadTime;
          const take = Math.min(wp.magSize - p.ammo[weapon], p.reserve[weapon]);
          p.reserve[weapon] -= take;
          try { audio.play('reload'); } catch {}
          window.setTimeout(() => { p.ammo[weapon] = Math.min(wp.magSize, p.ammo[weapon] + take); }, wp.reloadTime * 1000);
        }
      }
      if (e.code === 'KeyQ' || e.code === 'Digit1') switchWeapon('ar');
      if (e.code === 'KeyE' || e.code === 'Digit2') switchWeapon('sg');
      if (e.code === 'KeyT') setWeather((wth) => cycleWeather(wth));
      if (e.code.startsWith('Digit') && e.code >= 'Digit3' && e.code <= 'Digit8') {
        setOrders((prev: { ALPHA: SquadOrder; BRAVO: SquadOrder }) => applySquadOrder(prev, e.code));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-ui]')) return;
      fireHeldRef.current = true;
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      playerRef.current.yaw = Math.atan2(nx * 2.2, 1 - ny * 0.6);
    };
    const onPointerUp = () => { fireHeldRef.current = false; };
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
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
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
      let mx = 0, mz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
      if (stickRef.current.active) { mx += stickRef.current.dx; mz += stickRef.current.dy; }
      const len = Math.hypot(mx, mz) || 1;
      mx /= len; mz /= len;
      const sprint = !!(keys['ShiftLeft'] || keys['ShiftRight']);
      const spd = PLAYER_SPEED * (sprint ? SPRINT_MULT : 1) * WEATHER[weatherRef.current].movement;
      p.x = clamp(p.x + mx * spd * dt, -120, 120);
      p.z = clamp(p.z + mz * spd * dt, -120, 120);
      playerMesh.position.set(p.x, 0, p.z);
      playerMesh.rotation.y = p.yaw;

      if (fireHeldRef.current || keys['Space']) {
        let best = 999, bestYaw = p.yaw;
        for (const u of units) {
          if (u.dead || u.team !== 'enemy') continue;
          const d = dist2(u.x, u.z, p.x, p.z);
          if (d < 40 && d < best) { best = d; bestYaw = Math.atan2(u.x - p.x, u.z - p.z); }
        }
        if (best < 40) {
          const diff = bestYaw - p.yaw;
          p.yaw += Math.atan2(Math.sin(diff), Math.cos(diff)) * COMBAT_CONFIG.mobileAimAssist;
        }
        tryPlayerFire(t);
      }

      const outside = dist2(p.x, p.z, zone.x, zone.z) > zone.r;
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
        if (u.team === 'enemy') u.state = toPlayer < 28 ? 'engage' : 'advance';
        else {
          const order: SquadOrder = u.name === 'Alpha' ? ordersRef.current.ALPHA : ordersRef.current.BRAVO;
          u.state = order === 'DEFEND' || order === 'HOLD' ? 'idle' : order === 'FLANK_LEFT' ? 'flank' : 'advance';
        }
        let tx = u.x, tz = u.z;
        if (u.team === 'enemy' && (u.state === 'engage' || u.state === 'advance')) { tx = p.x; tz = p.z; }
        else if (u.team === 'ally') {
          if (u.state === 'advance') { tx = p.x + (u.id % 2 === 0 ? -4 : 4); tz = p.z - 3; }
          else if (u.state === 'flank') { tx = p.x - 12; tz = p.z - 8; }
        }
        const dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz) || 1;
        const speed = u.team === 'enemy' ? ENEMY_SPEED : PLAYER_SPEED * 0.85;
        if (d > 2.5) { u.x += (dx / d) * speed * dt; u.z += (dz / d) * speed * dt; }
        u.aimY = Math.atan2(dx, dz);
        u.mesh.position.set(u.x, 0, u.z);
        u.mesh.rotation.y = u.aimY;
        if (dist2(u.x, u.z, p.x, p.z) < (u.team === 'enemy' ? 32 : 40) && t - u.lastShot > (u.team === 'enemy' ? 0.55 : 0.4)) {
          u.lastShot = t;
          spawnBullet(u.x, u.z, Math.atan2(p.x - u.x, p.z - u.z) + (Math.random() - 0.5) * 0.18, u.team === 'enemy' ? 'enemy' : 'ally', u.team === 'enemy' ? 12 : 22);
        }
        if (dist2(u.x, u.z, zone.x, zone.z) > zone.r) u.hp -= ZONE_DAMAGE_PER_SEC * 0.7 * dt;
        if (u.hp <= 0) {
          u.dead = true;
          u.mesh.visible = false;
          if (u.team === 'enemy') { killsRef.current += 1; scoreRef.current += 120; }
        }
      }

      const bullets = bulletsRef.current;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.life -= dt;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.z += b.vz * dt;
        if (b.life <= 0) { scene.remove(b.mesh); bullets.splice(i, 1); continue; }
        if (b.from === 'enemy' && dist2(b.mesh.position.x, b.mesh.position.z, p.x, p.z) < 1.1) {
          p.hp -= b.damage;
          setDmgFlash((n) => n + 1);
          try { audio.play('damage'); if (navigator.vibrate) navigator.vibrate(40); } catch {}
          scene.remove(b.mesh);
          bullets.splice(i, 1);
          continue;
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
                try { audio.play('claim'); if (navigator.vibrate) navigator.vibrate(30); } catch {}
              }
            }
            break;
          }
        }
      }

      const camPos = new THREE.Vector3(p.x - Math.sin(p.yaw) * 12, 14, p.z - Math.cos(p.yaw) * 12 + 8);
      camera.position.lerp(camPos, 1 - Math.pow(0.001, dt));
      camera.lookAt(p.x, 1.2, p.z);
      scene.fog = new THREE.FogExp2(0x0b1220, 0.008 + (1 - WEATHER[weatherRef.current].visibility) * 0.025);

      for (const ev of events) {
        if (!ev.triggered && t >= ev.time) {
          ev.triggered = true;
          setHud((hh: any) => ({ ...hh, event: ev.title }));
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
          zoneText: outside ? '⚠ OUTSIDE ZONE' : zone.phase === 0 ? 'ZONE STABLE' : `ZONE PHASE ${zone.phase} · R${Math.round(zone.r)}`,
          outside,
          event: events.find((e) => e.triggered && t - e.time < 4)?.title ?? 'OPERATION IRON GATE',
          reloading: t < p.reloadUntil,
          reloadProgress: t < p.reloadUntil && p.reloadUntil > p.reloadStart ? Math.min(1, (t - p.reloadStart) / (p.reloadUntil - p.reloadStart)) : 0,
        });

        const rcv = radarRef.current;
        if (rcv) {
          const ctx = rcv.getContext('2d');
          if (ctx) {
            const S = rcv.width;
            const range = COMBAT_CONFIG.radarRange;
            ctx.clearRect(0, 0, S, S);
            ctx.fillStyle = 'rgba(8,14,24,0.82)';
            ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(56,189,248,0.45)'; ctx.lineWidth = 2; ctx.stroke();
            const zr = (zone.r / range) * (S / 2);
            ctx.strokeStyle = 'rgba(34,211,238,0.5)'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(S / 2 - (p.x - zone.x) / range * (S / 2), S / 2 - (p.z - zone.z) / range * (S / 2), Math.max(4, zr), 0, Math.PI * 2);
            ctx.stroke();
            const plot = (x: number, z: number, color: string, size = 3) => {
              const px = S / 2 + ((x - p.x) / range) * (S / 2);
              const py = S / 2 + ((z - p.z) / range) * (S / 2);
              if (px < 2 || px > S - 2 || py < 2 || py > S - 2) return;
              ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
            };
            for (const u of units) {
              if (u.dead) continue;
              plot(u.x, u.z, u.team === 'enemy' ? '#ef4444' : '#22c55e', 2.5);
            }
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(S / 2, S / 2, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#7dd3fc'; ctx.beginPath();
            ctx.moveTo(S / 2, S / 2);
            ctx.lineTo(S / 2 + Math.sin(p.yaw) * 10, S / 2 + Math.cos(p.yaw) * 10);
            ctx.stroke();
          }
        }
      }

      if (p.hp <= 0) { dead = true; endRound(false); return; }
      if (aliveEnemies === 0) { dead = true; endRound(true); return; }
      if (t >= ROUND_SECONDS) { dead = true; endRound(aliveEnemies <= 3); return; }

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
    };
  }, [phase, endRound]);
}
