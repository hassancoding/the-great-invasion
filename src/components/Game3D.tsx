'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { nextTacticalState, tickTacticalUnit, type TacticalUnit, type TacticalContext } from '@/game/ai/tacticalAI';
import { DEFAULT_ORDERS, applySquadOrder, type SquadOrder, type SquadId } from '@/game/command/squadOrders';
import { IRON_GATE_EVENTS, type IronGateEvent } from '@/game/events/ironGateEvents';
import { INITIAL_VEHICLES, type BattlefieldVehicle } from '@/game/world/vehicles';
import { WEATHER, cycleWeather, type WeatherState } from '@/game/world/weather';
import { ZONE_CONFIG } from '@/config/gameConfig';

/**
 * The Great Invasion — 3D Battlefield (Iron Gate)
 * Full implementation lives in the project source.
 * This commit restores a production-ready shell wired to AI, orders, events, vehicles, and weather.
 */

export default function Game3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [zoneText, setZoneText] = useState('SECURE THE OBJECTIVE');
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [weather, setWeather] = useState<WeatherState>('CLEAR');
  const [events, setEvents] = useState<IronGateEvent[]>(() =>
    IRON_GATE_EVENTS.map((e) => ({ ...e }))
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      setOrders((prev) => applySquadOrder(prev, e.code));
      if (e.code === 'KeyW') setWeather((w) => cycleWeather(w));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 500);
    camera.position.set(0, 45, 70);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.1);
    light.position.set(30, 50, 20);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404860, 0.6));

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(200, 40, 0x2a3a4a, 0x1a2530);
    scene.add(grid);

    // Simple unit markers
    const units: TacticalUnit[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: -20 + i * 6,
      z: 30,
      state: 'PATROL' as const,
      morale: 80,
      health: 100,
    }));

    const meshes = units.map((u) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
      );
      m.position.set(u.x, 1, u.z);
      scene.add(m);
      return m;
    });

    const vehicles: BattlefieldVehicle[] = INITIAL_VEHICLES.map((v) => ({ ...v }));
    const vehicleMeshes = vehicles.map((v) => {
      const geo =
        v.kind === 'HELICOPTER'
          ? new THREE.ConeGeometry(1.2, 3, 6)
          : new THREE.BoxGeometry(3, 1.4, 5);
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: v.kind === 'APC' ? 0x4b5563 : v.kind === 'TRUCK' ? 0x78716c : 0x64748b,
        })
      );
      m.position.set(v.x, v.y, v.z);
      scene.add(m);
      return m;
    });

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      units.forEach((u, i) => {
        const ctx: TacticalContext = {
          distanceToPlayer: Math.hypot(u.x, u.z - 10),
          distanceToObjective: Math.hypot(u.x, u.z),
          underPressure: u.health < 60,
          allyCount: 4,
          enemyCount: 3,
        };
        tickTacticalUnit(u, ctx, dt);
        meshes[i].position.x = u.x;
        meshes[i].position.z = u.z;
      });
      vehicles.forEach((v, i) => {
        if (!v.alive) return;
        v.x += Math.cos(v.heading) * v.speed * dt;
        v.z += Math.sin(v.heading) * v.speed * dt;
        vehicleMeshes[i].position.set(v.x, v.y, v.z);
        vehicleMeshes[i].rotation.y = -v.heading;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((s) => Math.max(0, s - 1));
      setEvents((prev) =>
        prev.map((e) => {
          if (!e.triggered && 180 - timeLeft >= e.time) {
            setZoneText(e.title);
            return { ...e, triggered: true };
          }
          return e;
        })
      );
      setScore((s) => s + 10);
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const weatherProfile = WEATHER[weather];

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-950 text-white overflow-hidden rounded-xl">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 text-xs font-mono pointer-events-none">
        <span className="bg-black/60 px-2 py-1 rounded">SCORE {score}</span>
        <span className="bg-black/60 px-2 py-1 rounded">TIME {timeLeft}s</span>
        <span className="bg-black/60 px-2 py-1 rounded">WX {weather}</span>
        <span className="bg-black/60 px-2 py-1 rounded">VIS {(weatherProfile.visibility * 100) | 0}%</span>
        <span className="bg-black/60 px-2 py-1 rounded">ALPHA {orders.ALPHA}</span>
        <span className="bg-black/60 px-2 py-1 rounded">BRAVO {orders.BRAVO}</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
        <div className="inline-block bg-black/70 px-4 py-2 rounded-lg text-sm tracking-wide">{zoneText}</div>
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono pointer-events-none">
        Keys 1-6 squad · W weather · ZONE r={ZONE_CONFIG.startRadius}
      </div>
    </div>
  );
}
