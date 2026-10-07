'use client';

import { buildShareLinks } from '@/services/sharing/ShareService';

export function IronGateResults({
  results,
  isNewRecord,
  personalBest,
  shareMsg,
  onRedeploy,
  onShare,
  onMenu,
}: {
  results: {
    score: number;
    kills: number;
    accuracy: number;
    survived: number;
    placement: string;
    message: string;
  };
  isNewRecord: boolean;
  personalBest: number;
  shareMsg: string;
  onRedeploy: () => void;
  onShare: () => void;
  onMenu: () => void;
}) {
  const links = buildShareLinks(shareMsg);
  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0e17] text-white flex flex-col items-center justify-center px-4 py-8">
      <p className={`text-sm font-bold tracking-widest mb-2 ${results.placement === 'VICTORY' ? 'text-emerald-400' : 'text-red-400'}`}>
        {results.placement}
      </p>
      {isNewRecord && (
        <div className="mb-3 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm animate-bounce">
          🏆 NEW PERSONAL BEST
        </div>
      )}
      <h2 className="text-3xl font-black mb-1">MISSION REPORT</h2>
      <p className="text-slate-400 mb-6 text-center">{results.message}</p>
      <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mb-6">
        <div className="text-5xl font-black text-sky-400 tabular-nums mb-1">{results.score.toLocaleString()}</div>
        <div className="text-slate-500 text-sm mb-1">SCORE</div>
        {personalBest > 0 && (
          <div className="text-slate-400 text-xs mb-4">
            Best: <span className="text-sky-300 font-semibold">{personalBest.toLocaleString()}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <div className="text-white font-bold text-xl">{results.kills}</div>
            <div className="text-slate-500">Kills</div>
          </div>
          <div>
            <div className="text-white font-bold text-xl">{results.accuracy}%</div>
            <div className="text-slate-500">Accuracy</div>
          </div>
          <div>
            <div className="text-white font-bold text-xl">{results.survived}s</div>
            <div className="text-slate-500">Survived</div>
          </div>
        </div>
      </div>
      <button onClick={onRedeploy} className="w-full max-w-xs py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 font-bold text-lg mb-3">
        REDEPLOY
      </button>
      <button onClick={onShare} className="w-full max-w-xs py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold mb-3">
        Share Result
      </button>
      <div className="flex gap-3 text-xs text-slate-400 mb-6">
        <a href={links.whatsapp} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a>
        <a href={links.twitter} target="_blank" rel="noreferrer" className="hover:text-white">X</a>
        <a href={links.facebook} target="_blank" rel="noreferrer" className="hover:text-white">Facebook</a>
      </div>
      <button onClick={onMenu} className="text-slate-500 text-sm hover:text-slate-300">Main Menu</button>
    </div>
  );
}
