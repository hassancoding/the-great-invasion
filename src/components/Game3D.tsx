'use client';

import dynamic from 'next/dynamic';

const Game3DApp = dynamic(() => import('./Game3DApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[100dvh] w-full bg-[#0a0e17] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-sky-400 text-xs tracking-widest mb-2">OPERATION IRON GATE</div>
        <div className="text-lg font-bold animate-pulse">LOADING BATTLEFIELD…</div>
      </div>
    </div>
  ),
});

export default function Game3D() {
  return <Game3DApp />;
}
