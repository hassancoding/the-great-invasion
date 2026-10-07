'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZONE_CONFIG, COMBAT_CONFIG, WEAPONS, type WeaponId } from '@/config/gameConfig';
import { DEFAULT_ORDERS } from '@/game/command/squadOrders';
import { type WeatherState } from '@/game/world/weather';
import { IRON_GATE_EVENTS, type IronGateEvent } from '@/game/events/ironGateEvents';
import { shareResult } from '@/services/sharing/ShareService';
import { analytics } from '@/services/analytics/AnalyticsService';
import { audio } from '@/game/audio/AudioService';
import { WeaponSlotButton } from '@/components/WeaponSlots';
import { IronGateMenu } from '@/components/ironGate/IronGateMenu';
import { IronGateResults } from '@/components/ironGate/IronGateResults';
import { type Unit, type Bullet, type Phase } from '@/game/ironGate/helpers';
import { useIronGateBattle } from '@/game/ironGate/useIronGateBattle';

const ROUND_SECONDS = COMBAT_CONFIG.roundSeconds;

export default function Game3DApp() {
  const mountRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef({ active: false, dx: 0, dy: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const fireHeldRef = useRef(false);
  const playerRef = useRef<{
    x: number; z: number; yaw: number; hp: number; weapon: WeaponId;
    ammo: Record<WeaponId, number>;
    reserve: Record<WeaponId, number>;
    reloadUntil: number; reloadStart: number; lastShot: number; sprint: boolean;
  }>({
    x: 0, z: 18, yaw: 0, hp: 100, weapon: 'ar',
    ammo: { ar: WEAPONS.ar.magSize, sg: WEAPONS.sg.magSize },
    reserve: { ar: WEAPONS.ar.reserveStart, sg: WEAPONS.sg.reserveStart },
    reloadUntil: 0, reloadStart: 0, lastShot: 0, sprint: false,
  });
  const radarRef = useRef<HTMLCanvasElement>(null);
  const unitsRef = useRef<Unit[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const zoneRef = useRef({ x: 0, z: 0, r: ZONE_CONFIG.startRadius, targetR: ZONE_CONFIG.startRadius, phase: 0, shrinkT: 0 });
  const timeRef = useRef(0);
  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const shotsRef = useRef(0);
  const hitsRef = useRef(0);
  const feedIdRef = useRef(0);
  const ordersRef = useRef(DEFAULT_ORDERS);
  const weatherRef = useRef<WeatherState>('OVERCAST');
  const outsideWarnRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('menu');
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState({
    hp: 100, ammo: WEAPONS.ar.magSize, reserve: WEAPONS.ar.reserveStart, weapon: 'ar' as WeaponId,
    ammoAr: WEAPONS.ar.magSize, resAr: WEAPONS.ar.reserveStart, ammoSg: WEAPONS.sg.magSize, resSg: WEAPONS.sg.reserveStart,
    score: 0, kills: 0, enemies: 12, timeLeft: ROUND_SECONDS, zoneText: 'ZONE STABLE', outside: false,
    event: 'OPERATION IRON GATE', reloading: false, reloadProgress: 0,
  });
  const [weaponSlot, setWeaponSlot] = useState<WeaponId>('ar');
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [weather, setWeather] = useState<WeatherState>('OVERCAST');
  const [results, setResults] = useState<{ score: number; kills: number; accuracy: number; survived: number; placement: string; message: string } | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [killFeed, setKillFeed] = useState<{ id: number; text: string }[]>([]);
  const [hitmark, setHitmark] = useState(false);
  const [dmgFlash, setDmgFlash] = useState(0);
  const [personalBest, setPersonalBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [, setEvents] = useState<IronGateEvent[]>(() => IRON_GATE_EVENTS.map((e) => ({ ...e })));

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
    const acc = shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 100) : 0;
    const placement = won ? 'VICTORY' : 'ELIMINATED';
    const score = scoreRef.current + (won ? 1500 : 0) + survived * 8 + killsRef.current * 120;
    scoreRef.current = score;
    setResults({ score, kills: killsRef.current, accuracy: acc, survived, placement, message: won ? 'You secured Iron Gate.' : 'Mission failed. Redeploy?' });
    setShareMsg(`I scored ${score.toLocaleString()} in The Great Invasion — Iron Gate (${killsRef.current} kills). Can you beat me?`);
    let record = false;
    try {
      const prev = Number(localStorage.getItem('tgi_iron_pb') || '0');
      if (score > prev) {
        localStorage.setItem('tgi_iron_pb', String(score));
        setPersonalBest(score);
        record = true;
        setIsNewRecord(true);
      } else setIsNewRecord(false);
    } catch { setIsNewRecord(false); }
    setPhase('results');
    analytics.track(won ? 'game_completed' : 'game_failed');
    try { audio.play(record ? 'record' : won ? 'levelup' : 'fail'); } catch {}
  }, []);

  useIronGateBattle({
    phase, endRound, mountRef, stickRef, keysRef, fireHeldRef, playerRef,
    unitsRef, bulletsRef, zoneRef, timeRef, scoreRef, killsRef, shotsRef, hitsRef,
    radarRef, feedIdRef, ordersRef, weatherRef, outsideWarnRef,
    setHud, setWeaponSlot, setEvents, setKillFeed, setHitmark, setDmgFlash, setWeather, setOrders,
  } as Parameters<typeof useIronGateBattle>[0]);

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
        try { audio.unlock(); } catch {}
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
    await shareResult(shareMsg || 'I played The Great Invasion — Iron Gate.');
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
    let dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    let dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const m = Math.hypot(dx, dy) || 1;
    if (m > 1) { dx /= m; dy /= m; }
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
        <div className="text-8xl font-black tabular-nums">{countdown > 0 ? countdown : 'GO'}</div>
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
              <div className={`h-full ${hud.hp < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${hud.hp}%` }} />
            </div>
            <span>{hud.hp} HP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-300">{hud.weapon === 'ar' ? 'AR' : 'SG'}</span>
            {hud.reloading ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                RELOAD {Math.round(hud.reloadProgress * 100)}%
              </span>
            ) : (
              <span>{hud.ammo}/{hud.reserve}</span>
            )}
          </div>
          {hud.reloading && (
            <div className="w-28 h-1 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${hud.reloadProgress * 100}%` }} />
            </div>
          )}
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
      {dmgFlash > 0 && (
        <div key={dmgFlash} className="absolute inset-0 pointer-events-none z-20 bg-red-600/25 animate-pulse" style={{ animationDuration: '0.2s' }} />
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className={`w-5 h-5 border rounded-full transition-all ${hitmark ? 'border-amber-400 scale-125 opacity-100' : 'border-white/70 opacity-70'}`} />
        {hitmark && <div className="absolute w-8 h-8 border-2 border-amber-400 rotate-45 opacity-90" />}
        {hud.reloading && (
          <svg className="absolute w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(15,23,42,0.7)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - hud.reloadProgress)}`} className="transition-[stroke-dashoffset] duration-100" />
          </svg>
        )}
      </div>
      <div className="absolute top-28 left-3 z-20 space-y-1 pointer-events-none">
        {killFeed.map((k) => (
          <div key={k.id} className="text-[11px] font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">{k.text}</div>
        ))}
      </div>
      <div className="absolute bottom-36 left-3 z-20 sm:bottom-6 pointer-events-none">
        <canvas ref={radarRef} width={112} height={112} className="w-28 h-28 rounded-full border border-cyan-500/40 shadow-lg shadow-black/40" />
      </div>
      <div data-ui className="absolute bottom-36 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-auto sm:bottom-6">
        <WeaponSlotButton id="ar" active={weaponSlot === 'ar'} ammo={hud.ammoAr} reserve={hud.resAr} reloading={hud.reloading} reloadProgress={hud.reloadProgress} onSelect={() => { playerRef.current.weapon = 'ar'; playerRef.current.reloadUntil = 0; playerRef.current.reloadStart = 0; setWeaponSlot('ar'); try { audio.play('click'); } catch {} }} />
        <WeaponSlotButton id="sg" active={weaponSlot === 'sg'} ammo={hud.ammoSg} reserve={hud.resSg} reloading={hud.reloading} reloadProgress={hud.reloadProgress} onSelect={() => { playerRef.current.weapon = 'sg'; playerRef.current.reloadUntil = 0; playerRef.current.reloadStart = 0; setWeaponSlot('sg'); try { audio.play('click'); } catch {} }} />
      </div>
      <div data-ui className="absolute top-28 right-3 z-20 flex flex-col gap-1 text-[10px] font-mono">
        <div className="bg-black/50 px-2 py-1 rounded">α {orders.ALPHA}</div>
        <div className="bg-black/50 px-2 py-1 rounded">β {orders.BRAVO}</div>
      </div>
      <div data-ui className="absolute bottom-6 left-4 z-20 w-28 h-28 rounded-full bg-white/10 border border-white/20 touch-none sm:hidden" onPointerDown={onStickStart} onPointerMove={(e) => stickRef.current.active && updateStick(e)} onPointerUp={onStickEnd} onPointerCancel={onStickEnd}>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40">MOVE</div>
      </div>
      <button data-ui className="absolute bottom-8 right-4 z-20 w-20 h-20 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 font-bold text-sm sm:hidden touch-none" onPointerDown={(e) => { e.preventDefault(); fireHeldRef.current = true; }} onPointerUp={() => { fireHeldRef.current = false; }} onPointerCancel={() => { fireHeldRef.current = false; }}>FIRE</button>
      <button data-ui className={`absolute bottom-28 right-6 z-20 px-3 py-2 rounded-lg text-xs font-semibold sm:hidden flex items-center gap-1.5 ${hud.reloading ? 'bg-amber-700/90 text-amber-100' : 'bg-slate-800/90'}`} onClick={() => {
        const p = playerRef.current;
        const weapon = p.weapon;
        const w = WEAPONS[weapon];
        if (p.ammo[weapon] < w.magSize && p.reserve[weapon] > 0 && timeRef.current >= p.reloadUntil) {
          p.reloadStart = timeRef.current;
          p.reloadUntil = timeRef.current + w.reloadTime;
          const take = Math.min(w.magSize - p.ammo[weapon], p.reserve[weapon]);
          p.reserve[weapon] -= take;
          try { audio.play('reload'); } catch {}
          window.setTimeout(() => { p.ammo[weapon] = Math.min(w.magSize, p.ammo[weapon] + take); }, w.reloadTime * 1000);
        }
      }}>{hud.reloading ? (<><span className="inline-block w-3 h-3 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />{Math.round(hud.reloadProgress * 100)}%</>) : 'RELOAD'}</button>
    </div>
  );
}
