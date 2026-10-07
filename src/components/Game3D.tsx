'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ZONE_CONFIG, COMBAT_CONFIG, WEAPONS, type WeaponId } from '@/config/gameConfig';
import { shareResult, buildShareLinks } from '@/services/sharing/ShareService';
import { analytics } from '@/services/analytics/AnalyticsService';
import { audio } from '@/game/audio/AudioService';
import { WeaponSlotButton } from '@/components/WeaponSlots';

/** Compact playable Iron Gate — full Game3DApp continues in local repo */
export default function Game3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'menu' | 'playing' | 'results'>('menu');
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [hp, setHp] = useState(100);
  const [weapon, setWeapon] = useState<WeaponId>('ar');
  const [ammo, setAmmo] = useState({ ar: 30, sg: 8 });
  const [reserve, setReserve] = useState({ ar: 90, sg: 24 });
  const fireRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const stateRef = useRef({ x: 0, z: 18, yaw: 0, hp: 100, t: 0, kills: 0, score: 0 });

  const end = useCallback((won: boolean) => {
    setScore(stateRef.current.score + stateRef.current.kills * 120 + (won ? 1500 : 0));
    setKills(stateRef.current.kills);
    setPhase('results');
    analytics.track(won ? 'game_completed' : 'game_failed');
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || !mountRef.current) return;
    let dead = false;
    let raf = 0;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x6a7a9a, 0.6));
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
    sun.position.set(30, 50, 20);
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(100, 40), new THREE.MeshStandardMaterial({ color: 0x1a2433 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 4, 8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    player.position.set(0, 1, 18);
    scene.add(player);
    const enemies: { mesh: THREE.Mesh; x: number; z: number; hp: number; dead: boolean }[] = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      const a = (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * 40, z = Math.sin(a) * 40 - 5;
      m.position.set(x, 1, z);
      scene.add(m);
      enemies.push({ mesh: m, x, z, hp: 70, dead: false });
    }
    let zoneR = ZONE_CONFIG.startRadius;
    const zoneRing = new THREE.Mesh(new THREE.RingGeometry(99, 100, 48), new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
    zoneRing.rotation.x = -Math.PI / 2;
    scene.add(zoneRing);
    stateRef.current = { x: 0, z: 18, yaw: 0, hp: 100, t: 0, kills: 0, score: 0 };
    setHp(100);
    setAmmo({ ar: WEAPONS.ar.magSize, sg: WEAPONS.sg.magSize });
    setReserve({ ar: WEAPONS.ar.reserveStart, sg: WEAPONS.sg.reserveStart });

    const onKey = (e: KeyboardEvent) => { keysRef.current[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    const onDown = () => { fireRef.current = true; };
    const onUp = () => { fireRef.current = false; };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    let last = performance.now();
    let lastShot = 0;
    const tick = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      s.t += dt;
      zoneR = Math.max(8, zoneR - dt * 1.2);
      zoneRing.scale.setScalar(zoneR / 100);
      const keys = keysRef.current;
      let mx = 0, mz = 0;
      if (keys['KeyW']) mz -= 1; if (keys['KeyS']) mz += 1; if (keys['KeyA']) mx -= 1; if (keys['KeyD']) mx += 1;
      const len = Math.hypot(mx, mz) || 1;
      s.x += (mx / len) * 14 * dt; s.z += (mz / len) * 14 * dt;
      player.position.set(s.x, 1, s.z);
      if (Math.hypot(s.x, s.z) > zoneR) { s.hp -= 12 * dt; setHp(Math.max(0, Math.round(s.hp))); }
      if ((fireRef.current || keys['Space']) && now / 1000 - lastShot > 0.15) {
        lastShot = now / 1000;
        try { audio.play('shoot'); } catch {}
        for (const e of enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - s.x, e.z - s.z) < 25) {
            e.hp -= 28;
            if (e.hp <= 0) { e.dead = true; e.mesh.visible = false; s.kills += 1; s.score += 120; setKills(s.kills); try { audio.play('claim'); } catch {} }
          }
        }
      }
      for (const e of enemies) {
        if (e.dead) continue;
        const dx = s.x - e.x, dz = s.z - e.z, d = Math.hypot(dx, dz) || 1;
        e.x += (dx / d) * 8 * dt; e.z += (dz / d) * 8 * dt;
        e.mesh.position.set(e.x, 1, e.z);
        if (d < 2) { s.hp -= 15 * dt; setHp(Math.max(0, Math.round(s.hp))); }
      }
      camera.position.set(s.x, 16, s.z + 18);
      camera.lookAt(s.x, 1, s.z);
      const alive = enemies.filter((e) => !e.dead).length;
      setScore(Math.round(s.score + s.t * 5));
      if (s.hp <= 0) { dead = true; end(false); return; }
      if (alive === 0) { dead = true; end(true); return; }
      if (s.t > 100) { dead = true; end(alive <= 2); return; }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    try { audio.unlock(); } catch {}
    return () => {
      dead = true; cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
      window.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [phase, end]);

  if (phase === 'menu') {
    return (
      <div className="min-h-[100dvh] bg-[#0a0e17] text-white flex flex-col items-center justify-center px-4">
        <p className="text-sky-400 text-xs font-bold tracking-[0.25em] mb-2">TACTICAL BATTLE ROYALE</p>
        <h1 className="text-4xl font-black mb-2">THE GREAT INVASION</h1>
        <p className="text-slate-400 text-sm mb-6 text-center max-w-md">Operation Iron Gate — Survive the zone. Eliminate hostiles.</p>
        <button onClick={() => { setPhase('playing'); analytics.track('game_started'); }} className="w-full max-w-xs py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 font-bold text-lg">DEPLOY</button>
        <p className="text-slate-500 text-xs mt-4">WASD move · Click / Space fire · Q/E weapons</p>
      </div>
    );
  }
  if (phase === 'results') {
    const msg = `I scored ${score.toLocaleString()} in The Great Invasion (${kills} kills). Can you beat me?`;
    const links = buildShareLinks(msg);
    return (
      <div className="min-h-[100dvh] bg-[#0a0e17] text-white flex flex-col items-center justify-center px-4">
        <h2 className="text-3xl font-black mb-2">MISSION REPORT</h2>
        <div className="text-5xl font-black text-sky-400 mb-4">{score.toLocaleString()}</div>
        <p className="text-slate-400 mb-6">{kills} kills</p>
        <button onClick={() => setPhase('playing')} className="w-full max-w-xs py-4 rounded-2xl bg-sky-600 font-bold mb-3">REDEPLOY</button>
        <button onClick={() => shareResult(msg)} className="w-full max-w-xs py-3 rounded-xl bg-slate-800 font-semibold mb-3">Share</button>
        <div className="flex gap-3 text-xs text-slate-400">
          <a href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={links.twitter} target="_blank" rel="noreferrer">X</a>
        </div>
        <button onClick={() => setPhase('menu')} className="text-slate-500 text-sm mt-4">Menu</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[#0a0e17] text-white">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-3 left-3 font-mono text-xs z-10 pointer-events-none">
        <div>HP {hp}</div>
        <div>{weapon.toUpperCase()} {ammo[weapon]}/{reserve[weapon]}</div>
        <div className="text-sky-400 font-bold">{score}</div>
        <div>KILLS {kills}</div>
      </div>
      <div data-ui className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
        <WeaponSlotButton id="ar" active={weapon === 'ar'} ammo={ammo.ar} reserve={reserve.ar} reloading={false} reloadProgress={0} onSelect={() => setWeapon('ar')} />
        <WeaponSlotButton id="sg" active={weapon === 'sg'} ammo={ammo.sg} reserve={reserve.sg} reloading={false} reloadProgress={0} onSelect={() => setWeapon('sg')} />
      </div>
    </div>
  );
}
