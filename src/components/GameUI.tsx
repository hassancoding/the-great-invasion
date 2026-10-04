"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getGameStore } from "@/game/state/gameStore";
import MapCanvas from "@/game/rendering/MapCanvas";
import { GAME_CONFIG } from "@/config/gameConfig";
import { GameState, Achievement } from "@/types/game";
import { loadDailyChallenge } from "@/services/daily/DailyChallengeService";
import { getAchievements } from "@/services/achievements/AchievementService";
import { getLocalLeaderboard } from "@/services/leaderboard/LeaderboardService";
import { shareResult } from "@/services/sharing/ShareService";
import { analytics } from "@/services/analytics/AnalyticsService";
import { adService } from "@/services/ads/AdService";
import { audio } from "@/game/audio/AudioService";

type MenuView = "main" | "howto" | "achievements" | "leaderboard" | "daily" | "settings";

export default function GameUI() {
  const store = getGameStore();
  const [uiState, setUiState] = useState<GameState>("MENU");
  const [menuView, setMenuView] = useState<MenuView>("main");
  const [tick, setTick] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: 360, h: 280 });
  const [unlockedToast, setUnlockedToast] = useState<Achievement[]>([]);
  const [dailyInfo, setDailyInfo] = useState(() => {
    if (typeof window === "undefined") {
      return { date: "", seed: 0, mapId: "", targetTerritories: 12, timeLimit: 60, bestScore: null as number | null, playerScore: null as number | null };
    }
    return loadDailyChallenge();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const w = Math.min(containerRef.current.clientWidth - 16, 520);
      setCanvasSize({ w, h: Math.round(w / GAME_CONFIG.mapAspect) });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    adService.initialize();
    audio.loadPrefs();
    analytics.track("menu_viewed");
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        if (uiState === "MENU" && menuView === "main") { e.preventDefault(); startGame(false); }
        else if (uiState === "RESULTS" || uiState === "GAME_OVER") { e.preventDefault(); handlePlayAgain(); }
      }
      if (e.key === "Escape") {
        if (uiState === "MENU" && menuView !== "main") setMenuView("main");
        else if (uiState === "PLAYING") store.pause();
        else if (uiState === "PAUSED") store.resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const loop = (time: number) => {
      if (lastTimeRef.current && store.state === "PLAYING") store.tick(time - lastTimeRef.current);
      lastTimeRef.current = time;
      setTick((t) => t + 1);
      setUiState(store.state);
      if (store.state === "RESULTS" && store.lastUnlocked.length > 0) {
        setUnlockedToast(store.lastUnlocked);
        store.clearUnlocked();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [store]);

  const handleClaim = useCallback((id: number) => { store.claimTerritory(id); }, [store]);

  const startGame = (isDaily = false) => {
    audio.unlock();
    audio.play("click");
    setMenuView("main");
    setUnlockedToast([]);
    if (isDaily) {
      const d = loadDailyChallenge();
      setDailyInfo(d);
      store.initGame(true, d.seed);
    } else {
      store.initGame(false);
    }
    setTimeout(() => store.startPlaying(), GAME_CONFIG.countdownDuration * 1000);
  };

  const handleShare = async () => {
    analytics.track("share_clicked");
    const result = await shareResult(store.getShareMessage());
    if (result.method === "clipboard" && result.success) alert("Result copied to clipboard!");
  };

  const handlePlayAgain = () => {
    analytics.track("replay_clicked");
    adService.showInterstitial();
    startGame(store.isDaily);
  };

  if (uiState === "MENU") {
    if (menuView === "howto") {
      return (
        <div className="flex flex-col items-center px-4 py-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
          <div className="text-slate-300 text-left space-y-3 text-sm leading-relaxed">
            <p><strong className="text-blue-400">Expand your nation.</strong> Tap territories adjacent to your blue regions.</p>
            <p><strong className="text-amber-400">Stop the rivals.</strong> Capture their territories for bonus points.</p>
            <p><strong className="text-emerald-400">Build streaks.</strong> Rapid claims multiply your score.</p>
            <p><strong className="text-purple-400">Survive the clock.</strong> Control as much map as possible in 60 seconds.</p>
          </div>
          <button onClick={() => setMenuView("main")} className="mt-8 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold">Back</button>
        </div>
      );
    }
    if (menuView === "achievements") {
      const list = getAchievements();
      return (
        <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
          <div className="w-full space-y-2 max-h-[60vh] overflow-y-auto">
            {list.map((a) => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border ${a.unlocked ? "bg-slate-800/80 border-slate-600" : "bg-slate-900/50 border-slate-800 opacity-50"}`}>
                <span className="text-2xl">{a.icon}</span>
                <div className="text-left"><div className="font-semibold text-white text-sm">{a.name}</div><div className="text-xs text-slate-400">{a.description}</div></div>
              </div>
            ))}
          </div>
          <button onClick={() => setMenuView("main")} className="mt-6 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold">Back</button>
        </div>
      );
    }
    if (menuView === "leaderboard") {
      const board = getLocalLeaderboard();
      return (
        <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-white mb-1">Leaderboard</h2>
          <p className="text-slate-500 text-xs mb-4">Local best scores</p>
          <div className="w-full space-y-1.5 max-h-[55vh] overflow-y-auto">
            {board.length === 0 && <p className="text-slate-500 text-sm py-8">No scores yet. Play a game!</p>}
            {board.map((e) => (
              <div key={e.rank + e.date + e.score} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-3"><span className="text-slate-500 font-mono w-6 text-right">#{e.rank}</span><span className="text-white text-sm font-medium">{e.name}</span></div>
                <div className="text-right"><div className="text-blue-400 font-bold tabular-nums">{e.score.toLocaleString()}</div><div className="text-xs text-slate-500">{e.territories} regions</div></div>
              </div>
            ))}
          </div>
          <button onClick={() => setMenuView("main")} className="mt-6 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold">Back</button>
        </div>
      );
    }
    if (menuView === "daily") {
      return (
        <div className="flex flex-col items-center px-4 py-8 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Daily Challenge</h2>
          <p className="text-slate-400 text-sm mb-6">Same map for every player today ({dailyInfo.date})</p>
          <div className="bg-slate-900/80 rounded-2xl p-5 w-full border border-slate-700 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-slate-500">Time Limit</div><div className="text-white font-bold text-lg">{dailyInfo.timeLimit}s</div></div>
              <div><div className="text-slate-500">Your Best</div><div className="text-blue-400 font-bold text-lg">{dailyInfo.bestScore?.toLocaleString() ?? "—"}</div></div>
            </div>
          </div>
          <button onClick={() => startGame(true)} className="w-full max-w-xs py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-lg font-bold mb-3">PLAY CHALLENGE</button>
          <button onClick={() => setMenuView("main")} className="text-slate-500 text-sm">Back</button>
        </div>
      );
    }
    if (menuView === "settings") {
      return (
        <div className="flex flex-col items-center px-4 py-8 max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700">
              <span className="text-white font-medium">Sound Effects</span>
              <button onClick={() => { const next = !audio.isSoundEnabled(); audio.setSoundEnabled(next); if (next) { audio.unlock(); audio.play("click"); } setTick((t) => t + 1); }} className={`px-4 py-2 rounded-lg font-semibold text-sm ${audio.isSoundEnabled() ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"}`}>{audio.isSoundEnabled() ? "ON" : "OFF"}</button>
            </div>
          </div>
          <button onClick={() => setMenuView("main")} className="mt-8 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold">Back</button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1">THE GREAT</h1>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-blue-400 mb-3">INVASION</h1>
        <p className="text-slate-400 text-base mb-8">{GAME_CONFIG.tagline}</p>
        <button onClick={() => startGame(false)} className="w-full max-w-xs py-4 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-white text-xl font-bold shadow-lg shadow-blue-900/40 mb-3">PLAY</button>
        <button onClick={() => { setDailyInfo(loadDailyChallenge()); setMenuView("daily"); }} className="w-full max-w-xs py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold mb-4">Daily Challenge</button>
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          <button onClick={() => setMenuView("leaderboard")} className="px-4 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-sm hover:bg-slate-700">Leaderboard</button>
          <button onClick={() => setMenuView("achievements")} className="px-4 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-sm hover:bg-slate-700">Achievements</button>
          <button onClick={() => setMenuView("howto")} className="px-4 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-sm hover:bg-slate-700">How to Play</button>
          <button onClick={() => setMenuView("settings")} className="px-4 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-sm hover:bg-slate-700">Settings</button>
        </div>
        {store.personalBest.score > 0 && (<p className="mt-8 text-slate-500 text-sm">Personal Best: <span className="text-blue-400 font-semibold">{store.personalBest.score.toLocaleString()}</span></p>)}
      </div>
    );
  }

  if (uiState === "COUNTDOWN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-5xl font-black text-blue-400 animate-pulse">GET READY</div>
        <p className="text-slate-400 mt-4 text-center px-4">Tap adjacent territories to expand.<br />Stop the rival nations.</p>
      </div>
    );
  }

  if (uiState === "PLAYING" || uiState === "PAUSED") {
    const held = store.getPlayerTerritoryCount();
    const total = store.territories.length;
    return (
      <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
        <div className="w-full flex justify-between items-center mb-3 px-1">
          <div className="text-left"><div className="text-xs text-slate-400 uppercase tracking-wider">Score</div><div className="text-2xl font-bold text-white tabular-nums">{store.session.score.toLocaleString()}</div></div>
          <div className="text-center"><div className="text-xs text-slate-400 uppercase tracking-wider">Time</div><div className={`text-2xl font-bold tabular-nums ${store.timeLeft < 10 ? "text-red-400" : "text-white"}`}>{Math.ceil(store.timeLeft)}s</div></div>
          <div className="text-right"><div className="text-xs text-slate-400 uppercase tracking-wider">Held</div><div className="text-2xl font-bold text-blue-400 tabular-nums">{held}/{total}</div></div>
        </div>
        {store.session.streak > 1 && <div className="mb-2 text-amber-400 font-semibold text-sm animate-pulse">🔥 {store.session.streak} STREAK</div>}
        <div ref={containerRef} className="w-full flex justify-center">
          <MapCanvas territories={store.territories} nations={store.nations} onClaim={handleClaim} width={canvasSize.w} height={canvasSize.h} interactive={uiState === "PLAYING"} />
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs">
          {store.nations.map((n) => (
            <div key={n.id} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: n.color }} />
              <span className="text-slate-400">{n.isPlayer ? "You" : n.name.split(" ")[0]} ({n.territories.length})</span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3 text-center">Tap adjacent territories to expand</p>
      </div>
    );
  }

  if (uiState === "RESULTS" || uiState === "GAME_OVER") {
    const held = store.getPlayerTerritoryCount();
    const total = store.territories.length || 1;
    const pct = Math.round((held / total) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        {store.session.isNewRecord && <div className="mb-3 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm animate-bounce">🏆 NEW RECORD</div>}
        {unlockedToast.map((a) => (<div key={a.id} className="mb-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">{a.icon} {a.name} unlocked</div>))}
        <h2 className="text-3xl font-black text-white mb-1">MISSION COMPLETE</h2>
        <p className="text-slate-400 mb-5">Your forces held the line</p>
        <div className="bg-slate-900/80 rounded-2xl p-6 w-full max-w-sm border border-slate-700 mb-6">
          <div className="text-5xl font-black text-blue-400 tabular-nums mb-1">{store.session.score.toLocaleString()}</div>
          <div className="text-slate-400 text-sm mb-4">SCORE</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-white font-bold text-lg">{held}</div><div className="text-slate-500">Territories</div></div>
            <div><div className="text-white font-bold text-lg">{pct}%</div><div className="text-slate-500">Map Control</div></div>
            <div><div className="text-white font-bold text-lg">{store.session.contestedWins}</div><div className="text-slate-500">Contested Wins</div></div>
            <div><div className="text-white font-bold text-lg">{store.session.maxStreak}</div><div className="text-slate-500">Best Streak</div></div>
          </div>
          {store.personalBest.score > 0 && (<div className="mt-4 pt-4 border-t border-slate-700 text-slate-400 text-sm">Personal Best: <span className="text-blue-300 font-semibold">{store.personalBest.score.toLocaleString()}</span></div>)}
        </div>
        <button onClick={handlePlayAgain} className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-white text-lg font-bold shadow-lg mb-3">PLAY AGAIN</button>
        <button onClick={handleShare} className="w-full max-w-xs py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold mb-3">Share Result</button>
        <button onClick={() => store.resetToMenu()} className="text-slate-500 text-sm hover:text-slate-300">Back to Menu</button>
      </div>
    );
  }

  return null;
}
