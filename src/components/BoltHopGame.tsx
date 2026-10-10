'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_NAME, GAME_TAGLINE } from '@/config/platformerConfig';
import { BoltHopEngine } from '@/game/platformer/engine';
import type { GamePhase, RunStats } from '@/game/platformer/types';

type Hud = {
  coins: number;
  score: number;
  time: number;
  level: number;
  levelName: string;
  lives: number;
  banner: string;
  claimProgress: number;
};

type Results = RunStats & { stars: number; message: string; pb: number };

export default function BoltHopGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BoltHopEngine | null>(null);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [hud, setHud] = useState<Hud>({
    coins: 0,
    score: 0,
    time: 0,
    level: 1,
    levelName: '',
    lives: 3,
    banner: '',
    claimProgress: 0,
  });
  const [results, setResults] = useState<Results | null>(null);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new BoltHopEngine(canvas, {
      onPhase: setPhase,
      onHud: setHud,
      onResults: setResults,
    });
    engineRef.current = engine;
    void engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    setResults(null);
    engineRef.current?.play();
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.setPhase('playing');
  }, []);

  const continueRun = useCallback(async () => {
    if (continuing) return;
    setContinuing(true);
    try {
      const ok = await engineRef.current?.continueWithReward();
      if (ok) setResults(null);
    } finally {
      setContinuing(false);
    }
  }, [continuing]);

  const share = useCallback(async () => {
    if (!results) return;
    const stars = '★'.repeat(results.stars) + '☆'.repeat(Math.max(0, 3 - results.stars));
    const text = `${GAME_NAME}: held the Well — ${results.score.toLocaleString()} pts ${stars} (Lv ${results.level}). Can you hold the line?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: GAME_NAME, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Result copied!');
      }
    } catch {}
  }, [results]);

  const touch = (side: 'left' | 'right' | 'jump' | 'attack' | 'heavy', down: boolean) => {
    engineRef.current?.setTouch(side, down);
  };

  const showGameHud = phase === 'playing' || phase === 'paused';

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-950 select-none touch-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {phase === 'menu' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-24 pointer-events-none">
          <button
            type="button"
            onClick={play}
            className="pointer-events-auto rounded-2xl bg-cyan-500 px-12 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-900/40 active:scale-95 transition"
          >
            PLAY
          </button>
          <p className="mt-3 text-xs text-sky-100/70 pointer-events-none">{GAME_TAGLINE}</p>
        </div>
      )}

      {showGameHud && (
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex justify-between text-white text-sm font-semibold drop-shadow">
          <div>
            <div className="text-cyan-300">◆ {hud.coins}</div>
            <div className="text-xs text-white/80">{hud.levelName}</div>
          </div>
          <div className="text-center min-w-[40%]">
            <div className="tabular-nums">{hud.score.toLocaleString()}</div>
            <div className="text-xs text-white/70">{hud.time.toFixed(1)}s</div>
            {hud.banner ? (
              <div className="mt-1 text-[11px] font-bold tracking-wide text-cyan-200 animate-pulse">
                {hud.banner}
              </div>
            ) : null}
            {hud.claimProgress > 0 && hud.claimProgress < 1 ? (
              <div className="mx-auto mt-1 h-1.5 w-28 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-[width] duration-100"
                  style={{ width: `${Math.floor(hud.claimProgress * 100)}%` }}
                />
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <div className="text-rose-300">{'❤'.repeat(Math.max(0, hud.lives))}</div>
            <div className="text-xs text-white/70">Lv {hud.level}/5</div>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <button
          type="button"
          onClick={() => engineRef.current?.setPhase('paused')}
          className="absolute top-3 right-14 z-20 h-9 w-9 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-bold active:bg-white/25"
          aria-label="Pause"
        >
          II
        </button>
      )}

      {phase === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center text-white">
            <h2 className="text-xl font-bold">Paused</h2>
            <p className="mt-1 text-sm text-slate-400">
              Lv {hud.level} · {hud.score.toLocaleString()} pts
            </p>
            <button type="button" onClick={resume} className="mt-6 w-full rounded-2xl bg-cyan-500 py-3 font-bold active:scale-[0.98]">RESUME</button>
            <button type="button" onClick={play} className="mt-2 w-full rounded-2xl bg-slate-800 py-3 font-semibold border border-slate-600">RESTART</button>
          </div>
        </div>
      )}

      {showGameHud && phase !== 'paused' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 flex justify-between items-end pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button type="button" className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 text-xl text-white active:bg-white/30" onPointerDown={(e) => { e.preventDefault(); touch('left', true); }} onPointerUp={() => touch('left', false)} onPointerLeave={() => touch('left', false)} onPointerCancel={() => touch('left', false)} aria-label="Left">◀</button>
            <button type="button" className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 text-xl text-white active:bg-white/30" onPointerDown={(e) => { e.preventDefault(); touch('right', true); }} onPointerUp={() => touch('right', false)} onPointerLeave={() => touch('right', false)} onPointerCancel={() => touch('right', false)} aria-label="Right">▶</button>
          </div>
          <div className="flex gap-2 items-end pointer-events-auto">
            <button type="button" className="h-14 w-14 rounded-2xl bg-violet-500/80 border border-violet-200/30 text-[11px] font-bold text-white active:scale-95" onPointerDown={(e) => { e.preventDefault(); touch('heavy', true); }} onPointerUp={() => touch('heavy', false)} onPointerLeave={() => touch('heavy', false)} onPointerCancel={() => touch('heavy', false)} aria-label="Heavy">HEAVY</button>
            <button type="button" className="h-14 w-14 rounded-2xl bg-sky-500/85 border border-sky-100/30 text-[11px] font-bold text-white active:scale-95" onPointerDown={(e) => { e.preventDefault(); touch('attack', true); }} onPointerUp={() => touch('attack', false)} onPointerLeave={() => touch('attack', false)} onPointerCancel={() => touch('attack', false)} aria-label="Slash">SLASH</button>
            <button type="button" className="h-16 w-16 rounded-full bg-cyan-500/90 border-2 border-cyan-100/40 text-xs font-bold text-white active:scale-95 shadow-lg" onPointerDown={(e) => { e.preventDefault(); touch('jump', true); }} onPointerUp={() => touch('jump', false)} onPointerLeave={() => touch('jump', false)} onPointerCancel={() => touch('jump', false)} aria-label="Jump">JUMP</button>
          </div>
        </div>
      )}

      {(phase === 'won' || phase === 'lost') && results && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center text-white shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-cyan-400">{GAME_NAME}</p>
            <h2 className="mt-2 text-2xl font-bold">{results.message}</h2>
            <p className="mt-4 text-4xl font-black text-amber-300 tabular-nums">{results.score.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mt-1">Best {results.pb.toLocaleString()} · {'★'.repeat(results.stars)}{'☆'.repeat(Math.max(0, 3 - results.stars))}</p>
            <p className="text-xs text-slate-500 mt-2">Crystals {results.coins} · Time {results.time.toFixed(1)}s · Falls {results.deaths}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={play} className="rounded-2xl bg-cyan-500 py-3 font-bold active:scale-[0.98]">PLAY AGAIN</button>
              {phase === 'lost' && (
                <button type="button" onClick={continueRun} disabled={continuing} className="rounded-2xl bg-violet-600 py-3 font-semibold disabled:opacity-60">{continuing ? 'Loading…' : '▶ CONTINUE (Ad)'}</button>
              )}
              <button type="button" onClick={share} className="rounded-2xl bg-slate-800 py-3 font-semibold border border-slate-600">SHARE RESULT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
