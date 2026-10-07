'use client';

export function IronGateMenu({
  personalBest,
  onDeploy,
}: {
  personalBest: number;
  onDeploy: () => void;
}) {
  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0a0e17] text-white flex flex-col items-center justify-center px-4">
      <p className="text-sky-400 text-xs font-bold tracking-[0.25em] mb-2">TACTICAL BATTLE ROYALE</p>
      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center mb-2">THE GREAT INVASION</h1>
      <p className="text-slate-400 text-center max-w-md mb-6 text-sm">
        Operation Iron Gate — Survive the zone. Command your squad. Eliminate hostiles.
      </p>
      {personalBest > 0 && (
        <p className="text-slate-400 text-sm mb-4">
          Personal Best: <span className="text-sky-400 font-bold">{personalBest.toLocaleString()}</span>
        </p>
      )}
      <button
        onClick={onDeploy}
        className="w-full max-w-xs py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] transition font-bold text-lg shadow-lg shadow-sky-900/40 mb-3"
      >
        DEPLOY
      </button>
      <div className="text-slate-500 text-xs text-center max-w-sm space-y-1 mt-2">
        <p>Desktop: WASD · Click fire · Q/E or 1/2 weapons · R reload · 3–8 squad · T weather</p>
        <p>Mobile: Stick · FIRE · tap AR/SG slots · RELOAD</p>
      </div>
    </div>
  );
}
