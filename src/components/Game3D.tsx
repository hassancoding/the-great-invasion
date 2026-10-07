'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ZONE_CONFIG } from '@/config/gameConfig';
import { DEFAULT_ORDERS, applySquadOrder, type SquadOrder } from '@/game/command/squadOrders';
import { WEATHER, cycleWeather, type WeatherState } from '@/game/world/weather';
import { IRON_GATE_EVENTS, type IronGateEvent } from '@/game/events/ironGateEvents';
import { shareResult, buildShareLinks } from '@/services/sharing/ShareService';
import { analytics } from '@/services/analytics/AnalyticsService';
import { audio } from '@/game/audio/AudioService';

type Phase = 'menu' | 'countdown' | 'playing' | 'results';
type Unit = { id: number; mesh: THREE.Group; team: 'player' | 'ally' | 'enemy'; hp: number; maxHp: number; dead: boolean; x: number; z: number; aimY: number; lastShot: number; name: string; state: string };
type Bullet = { mesh: THREE.Mesh; vx: number; vz: number; life: number; from: 'player' | 'enemy' | 'ally'; damage: number };

const ENEMY_NAMES = ['Viper','Razor','Havoc','Reaper','Ghost','Titan','Fang','Blaze','Onyx','Cobra','Wolf','Dagger'];
const ROUND_SECONDS = 120;
const PLAYER_SPEED = 14;
const SPRINT_MULT = 1.55;
const ENEMY_SPEED = 9;
const BULLET_SPEED = 55;
const FIRE_COOLDOWN = 0.14;
const RELOAD_TIME = 1.6;
const MAG_SIZE = 30;
const RESERVE_START = 90;
const ZONE_DMG = 12;

function makeUnitMesh(color: number, isPlayer = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 4, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.65 }));
  body.position.y = 1; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), new THREE.MeshStandardMaterial({ color: isPlayer ? 0xf0d0b0 : 0xc4a484 }));
  head.position.y = 1.85; g.add(head);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  gun.position.set(0.35, 1.15, 0.45); g.add(gun);
  return g;
}
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function dist2(ax: number, az: number, bx: number, bz: number) { return Math.hypot(ax - bx, az - bz); }

export default function Game3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef({ active: false, dx: 0, dy: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const fireHeldRef = useRef(false);
  const playerRef = useRef({ x: 0, z: 18, yaw: 0, hp: 100, ammo: MAG_SIZE, reserve: RESERVE_START, reloadUntil: 0, lastShot: 0 });
  const unitsRef = useRef<Unit[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const zoneRef = useRef({ x: 0, z: 0, r: ZONE_CONFIG.startRadius, targetR: ZONE_CONFIG.startRadius, phase: 0, shrinkT: 0 });
  const timeRef = useRef(0);
  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const shotsRef = useRef(0);
  const hitsRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('menu');
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState({ hp: 100, ammo: MAG_SIZE, reserve: RESERVE_START, score: 0, kills: 0, enemies: 12, timeLeft: ROUND_SECONDS, zoneText: 'ZONE STABLE', outside: false, event: 'OPERATION IRON GATE', reloading: false });
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [weather, setWeather] = useState<WeatherState>('OVERCAST');
  const [results, setResults] = useState<{ score: number; kills: number; accuracy: number; survived: number; placement: string; message: string } | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [events, setEvents] = useState(() => IRON_GATE_EVENTS.map((e) => ({ ...e })));

  const endRound = useCallback((won: boolean) => {
    const survived = Math.floor(timeRef.current);
    const acc = shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 100) : 0;
    const placement = won ? 'VICTORY' : 'ELIMINATED';
    const score = scoreRef.current + (won ? 1500 : 0) + survived * 8 + killsRef.current * 120;
    scoreRef.current = score;
    setResults({ score, kills: killsRef.current, accuracy: acc, survived, placement, message: won ? 'You secured Iron Gate.' : 'Mission failed. Redeploy?' });
    setShareMsg(`I scored ${score.toLocaleString()} in The Great Invasion — Iron Gate (${killsRef.current} kills). Can you beat me?`);
    setPhase('results');
    analytics.track(won ? 'game_completed' : 'game_failed');
    try { audio.play(won ? 'levelup' : 'fail'); } catch {}
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
    const ground = new THREE.Mesh(new THREE.CircleGeometry(130, 48), new THREE.MeshStandardMaterial({ color: 0x1a2433, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(200, 40, 0x2a3a4e, 0x152030);
    (grid.material as THREE.Material).opacity = 0.45;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x3d4a5c, roughness: 0.8 });
    for (let i = 0; i < 18; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random() * 3, 1.2 + Math.random() * 2, 2 + Math.random() * 3), coverMat);
      const a = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 70;
      box.position.set(Math.cos(a) * r, (box.geometry as THREE.BoxGeometry).parameters.height / 2, Math.sin(a) * r);
      box.castShadow = true;
      scene.add(box);
    }
    const obj = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.4 }));
    obj.position.set(0, 0.2, -8);
    scene.add(obj);
    const zoneRing = new THREE.Mesh(new THREE.RingGeometry(99.5, 100.5, 64), new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
    zoneRing.rotation.x = -Math.PI / 2;
    zoneRing.position.y = 0.15;
    scene.add(zoneRing);
    const playerMesh = makeUnitMesh(0x3b82f6, true);
    playerMesh.position.set(0, 0, 18);
    scene.add(playerMesh);
    const units: Unit[] = [];
    for (let i = 0; i < 4; i++) {
      const mesh = makeUnitMesh(0x22c55e);
      const x = -6 + i * 3, z = 22;
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      units.push({ id: i, mesh, team: 'ally', hp: 80, maxHp: 80, dead: false, x, z, aimY: 0, lastShot: 0, name: i < 2 ? 'Alpha' : 'Bravo', state: 'advance' });
    }
    for (let i = 0; i < 12; i++) {
      const mesh = makeUnitMesh(0xef4444);
      const a = (i / 12) * Math.PI * 2;
      const r = 35 + (i % 3) * 12;
      const x = Math.cos(a) * r, z = Math.sin(a) * r - 10;
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      units.push({ id: 100 + i, mesh, team: 'enemy', hp: 70, maxHp: 70, dead: false, x, z, aimY: 0, lastShot: 0, name: ENEMY_NAMES[i % ENEMY_NAMES.length], state: 'advance' });
    }
    unitsRef.current = units;
    bulletsRef.current = [];
    playerRef.current = { x: 0, z: 18, yaw: 0, hp: 100, ammo: MAG_SIZE, reserve: RESERVE_START, reloadUntil: 0, lastShot: 0 };
    zoneRef.current = { x: 0, z: 0, r: ZONE_CONFIG.startRadius, targetR: ZONE_CONFIG.startRadius, phase: 0, shrinkT: ZONE_CONFIG.phases[0].wait };
    timeRef.current = 0; scoreRef.current = 0; killsRef.current = 0; shotsRef.current = 0; hitsRef.current = 0;
    setEvents(IRON_GATE_EVENTS.map((e) => ({ ...e })));

    const spawnBullet = (x: number, z: number, yaw: number, from: Bullet['from'], damage: number) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: from === 'enemy' ? 0xff4444 : 0xfbbf24 }));
      mesh.position.set(x, 1.2, z);
      scene.add(mesh);
      bulletsRef.current.push({ mesh, vx: Math.sin(yaw) * BULLET_SPEED, vz: Math.cos(yaw) * BULLET_SPEED, life: 1.4, from, damage });
    };
    const tryPlayerFire = (t: number) => {
      const p = playerRef.current;
      if (t < p.reloadUntil) return;
      if (p.ammo <= 0) {
        if (p.reserve > 0) { p.reloadUntil = t + RELOAD_TIME; const take = Math.min(MAG_SIZE, p.reserve); p.reserve -= take; p.ammo = take; }
        return;
      }
      if (t - p.lastShot < FIRE_COOLDOWN) return;
      p.lastShot = t; p.ammo -= 1; shotsRef.current += 1;
      spawnBullet(p.x, p.z, p.yaw, 'player', 28);
      try { audio.play('click'); } catch {}
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyR') {
        const p = playerRef.current;
        if (p.ammo < MAG_SIZE && p.reserve > 0 && timeRef.current >= p.reloadUntil) {
          p.reloadUntil = timeRef.current + RELOAD_TIME;
          const take = Math.min(MAG_SIZE - p.ammo, p.reserve);
          p.reserve -= take;
          window.setTimeout(() => { p.ammo = Math.min(MAG_SIZE, p.ammo + take); }, RELOAD_TIME * 1000);
        }
      }
      setOrders((prev) => applySquadOrder(prev, e.code));
      if (e.code === 'KeyQ') setWeather((w) => cycleWeather(w));
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
      const spd = PLAYER_SPEED * (sprint ? SPRINT_MULT : 1) * WEATHER[weather].movement;
      p.x = clamp(p.x + mx * spd * dt, -120, 120);
      p.z = clamp(p.z + mz * spd * dt, -120, 120);
      playerMesh.position.set(p.x, 0, p.z);
      playerMesh.rotation.y = p.yaw;
      if (fireHeldRef.current || keys['Space']) tryPlayerFire(t);
      const outside = dist2(p.x, p.z, zone.x, zone.z) > zone.r;
      if (outside) p.hp -= ZONE_DMG * dt;
      let aliveEnemies = 0;
      for (const u of units) {
        if (u.dead) continue;
        if (u.team === 'enemy') aliveEnemies += 1;
        const toPlayer = dist2(u.x, u.z, p.x, p.z);
        if (u.team === 'enemy') u.state = toPlayer < 28 ? 'engage' : 'advance';
        else {
          const order: SquadOrder = u.name === 'Alpha' ? orders.ALPHA : orders.BRAVO;
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
          const yaw = Math.atan2(p.x - u.x, p.z - u.z) + (Math.random() - 0.5) * 0.18;
          spawnBullet(u.x, u.z, yaw, u.team === 'enemy' ? 'enemy' : 'ally', u.team === 'enemy' ? 12 : 22);
        }
        if (dist2(u.x, u.z, zone.x, zone.z) > zone.r) u.hp -= ZONE_DMG * 0.7 * dt;
        if (u.hp <= 0) {
          u.dead = true; u.mesh.visible = false;
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
        if (b.from === 'enemy' && dist2(b.mesh.position.x, b.mesh.position.z, p.x, p.z) < 1.1) { p.hp -= b.damage; scene.remove(b.mesh); bullets.splice(i, 1); continue; }
        for (const u of units) {
          if (u.dead) continue;
          if (b.from === 'enemy' && u.team === 'enemy') continue;
          if (b.from !== 'enemy' && u.team !== 'enemy') continue;
          if (dist2(b.mesh.position.x, b.mesh.position.z, u.x, u.z) < 1.15) {
            u.hp -= b.damage;
            if (b.from === 'player') { hitsRef.current += 1; scoreRef.current += 15; }
            scene.remove(b.mesh); bullets.splice(i, 1);
            if (u.hp <= 0) {
              u.dead = true; u.mesh.visible = false;
              if (u.team === 'enemy') { killsRef.current += 1; scoreRef.current += 120; try { audio.play('claim'); } catch {} }
            }
            break;
          }
        }
      }
      const camPos = new THREE.Vector3(p.x - Math.sin(p.yaw) * 12, 14, p.z - Math.cos(p.yaw) * 12 + 8);
      camera.position.lerp(camPos, 1 - Math.pow(0.001, dt));
      camera.lookAt(p.x, 1.2, p.z);
      const vis = WEATHER[weather].visibility;
      scene.fog = new THREE.FogExp2(0x0b1220, 0.008 + (1 - vis) * 0.025);
      for (const ev of events) {
        if (!ev.triggered && t >= ev.time) { ev.triggered = true; setHud((hh) => ({ ...hh, event: ev.title })); }
      }
      hudAcc += dt;
      if (hudAcc > 0.1) {
        hudAcc = 0;
        setHud({
          hp: Math.max(0, Math.round(p.hp)), ammo: p.ammo, reserve: p.reserve,
          score: Math.round(scoreRef.current + t * 5), kills: killsRef.current, enemies: aliveEnemies,
          timeLeft: Math.max(0, ROUND_SECONDS - Math.floor(t)),
          zoneText: outside ? '⚠ OUTSIDE ZONE' : zone.phase === 0 ? 'ZONE STABLE' : `ZONE PHASE ${zone.phase} · R${Math.round(zone.r)}`,
          outside, event: events.find((e) => e.triggered && t - e.time < 4)?.title ?? 'OPERATION IRON GATE',
          reloading: t < p.reloadUntil,
        });
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
  }, [phase, weather, orders, events, endRound]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1; setCountdown(n);
      if (n <= 0) { window.clearInterval(id); setPhase('playing'); analytics.track('game_started'); try { audio.unlock(); } catch {} }
    }, 800);
    return () => window.clearInterval(id);
  }, [phase]);

  const startMission = () => { setResults(null); setPhase('countdown'); };
  const handleShare = async () => { await shareResult(shareMsg || 'I played The Great Invasion — Iron Gate.'); analytics.track('share_clicked'); };
  const onStickStart = (e: React.PointerEvent) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); stickRef.current.active = true; updateStick(e); };
  const updateStick = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    let dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    let dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const m = Math.hypot(dx, dy) || 1;
    if (m > 1) { dx /= m; dy /= m; }
    stickRef.current.dx = dx; stickRef.current.dy = dy;
  };
  const onStickEnd = () => { stickRef.current.active = false; stickRef.current.dx = 0; stickRef.current.dy = 0; };

  if (phase === 'menu') {
    return (
      <div className="relative min-h-[100dvh] w-full bg-[#0a0e17] text-white flex flex-col items-center justify-center px-4">
        <p className="text-sky-400 text-xs font-bold tracking-[0.25em] mb-2">TACTICAL BATTLE ROYALE</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center mb-2">THE GREAT INVASION</h1>
        <p className="text-slate-400 text-center max-w-md mb-8 text-sm">Operation Iron Gate — Survive the shrinking zone. Command your squad. Eliminate the enemy force.</p>
        <button onClick={startMission} className="w-full max-w-xs py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 font-bold text-lg mb-3">DEPLOY</button>
        <div className="text-slate-500 text-xs text-center max-w-sm space-y-1 mt-4">
          <p>Desktop: WASD · Click fire · R reload · Shift sprint · 1–6 squad</p>
          <p>Mobile: Stick move · FIRE button</p>
        </div>
      </div>
    );
  }
  if (phase === 'countdown') {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0a0e17] flex flex-col items-center justify-center text-white">
        <p className="text-sky-400 text-sm tracking-widest mb-4">ENTERING COMBAT</p>
        <div className="text-8xl font-black tabular-nums">{countdown > 0 ? countdown : 'GO'}</div>
      </div>
    );
  }
  if (phase === 'results' && results) {
    const links = buildShareLinks(shareMsg);
    return (
      <div className="min-h-[100dvh] w-full bg-[#0a0e17] text-white flex flex-col items-center justify-center px-4 py-8">
        <p className={`text-sm font-bold tracking-widest mb-2 ${results.placement === 'VICTORY' ? 'text-emerald-400' : 'text-red-400'}`}>{results.placement}</p>
        <h2 className="text-3xl font-black mb-1">MISSION REPORT</h2>
        <p className="text-slate-400 mb-6 text-center">{results.message}</p>
        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mb-6">
          <div className="text-5xl font-black text-sky-400 tabular-nums mb-1">{results.score.toLocaleString()}</div>
          <div className="text-slate-500 text-sm mb-4">SCORE</div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><div className="text-white font-bold text-xl">{results.kills}</div><div className="text-slate-500">Kills</div></div>
            <div><div className="text-white font-bold text-xl">{results.accuracy}%</div><div className="text-slate-500">Accuracy</div></div>
            <div><div className="text-white font-bold text-xl">{results.survived}s</div><div className="text-slate-500">Survived</div></div>
          </div>
        </div>
        <button onClick={startMission} className="w-full max-w-xs py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 font-bold text-lg mb-3">REDEPLOY</button>
        <button onClick={handleShare} className="w-full max-w-xs py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold mb-3">Share Result</button>
        <div className="flex gap-3 text-xs text-slate-400 mb-6">
          <a href={links.whatsapp} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a>
          <a href={links.twitter} target="_blank" rel="noreferrer" className="hover:text-white">X</a>
          <a href={links.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
        </div>
        <button onClick={() => setPhase('menu')} className="text-slate-500 text-sm hover:text-slate-300">Main Menu</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0a0e17] text-white select-none">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none z-10">
        <div className="space-y-1 font-mono text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded overflow-hidden">
              <div className={`h-full ${hud.hp < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${hud.hp}%` }} />
            </div>
            <span>{hud.hp} HP</span>
          </div>
          <div>{hud.reloading ? 'RELOADING…' : `AMMO ${hud.ammo} / ${hud.reserve}`}</div>
          <div className={hud.outside ? 'text-red-400 font-bold animate-pulse' : 'text-cyan-400'}>{hud.zoneText}</div>
        </div>
        <div className="text-right font-mono text-xs sm:text-sm space-y-1">
          <div className="text-sky-400 font-bold text-lg tabular-nums">{hud.score}</div>
          <div>KILLS {hud.kills}</div>
          <div>HOSTILES {hud.enemies}</div>
          <div className="text-slate-400">{hud.timeLeft}s</div>
        </div>
      </div>
      <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none z-10">
        <div className="px-4 py-1.5 rounded-full bg-black/60 text-xs tracking-wide border border-slate-700">{hud.event}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-5 h-5 border border-white/70 rounded-full opacity-70" />
      </div>
      <div data-ui className="absolute top-28 right-3 z-20 flex flex-col gap-1 text-[10px] font-mono">
        <div className="bg-black/50 px-2 py-1 rounded">α {orders.ALPHA}</div>
        <div className="bg-black/50 px-2 py-1 rounded">β {orders.BRAVO}</div>
      </div>
      <div data-ui className="absolute bottom-6 left-4 z-20 w-28 h-28 rounded-full bg-white/10 border border-white/20 touch-none sm:hidden" onPointerDown={onStickStart} onPointerMove={(e) => stickRef.current.active && updateStick(e)} onPointerUp={onStickEnd} onPointerCancel={onStickEnd}>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40">MOVE</div>
      </div>
      <button data-ui className="absolute bottom-8 right-4 z-20 w-20 h-20 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 font-bold text-sm sm:hidden touch-none" onPointerDown={(e) => { e.preventDefault(); fireHeldRef.current = true; }} onPointerUp={() => { fireHeldRef.current = false; }} onPointerCancel={() => { fireHeldRef.current = false; }}>FIRE</button>
      <button data-ui className="absolute bottom-28 right-6 z-20 px-3 py-2 rounded-lg bg-slate-800/90 text-xs font-semibold sm:hidden" onClick={() => {
        const p = playerRef.current;
        if (p.ammo < MAG_SIZE && p.reserve > 0) {
          p.reloadUntil = timeRef.current + RELOAD_TIME;
          const take = Math.min(MAG_SIZE - p.ammo, p.reserve);
          p.reserve -= take;
          window.setTimeout(() => { p.ammo = Math.min(MAG_SIZE, p.ammo + take); }, RELOAD_TIME * 1000);
        }
      }}>RELOAD</button>
    </div>
  );
}
