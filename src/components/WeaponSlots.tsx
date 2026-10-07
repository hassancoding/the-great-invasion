import type { WeaponId } from '@/config/gameConfig';

export function ArIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="40" height="20" viewBox="0 0 80 40" fill="none" className={className} aria-hidden>
      <path d="M4 14 L14 14 L16 18 L16 26 L6 28 L4 24 Z" fill="currentColor" opacity="0.9" />
      <rect x="14" y="15" width="28" height="10" rx="1.5" fill="currentColor" />
      <path d="M22 11 L22 15 L34 15 L34 12 L30 11 Z" fill="currentColor" opacity="0.85" />
      <rect x="26" y="8" width="5" height="4" rx="0.8" fill="currentColor" opacity="0.75" />
      <path d="M24 25 L24 34 L32 36 L34 25 Z" fill="currentColor" opacity="0.8" />
      <rect x="42" y="16" width="18" height="7" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="60" y="17.5" width="16" height="3.5" rx="1" fill="currentColor" opacity="0.95" />
      <rect x="75" y="16.5" width="4" height="5.5" rx="0.8" fill="currentColor" />
      <rect x="58" y="12" width="2" height="5" rx="0.4" fill="currentColor" opacity="0.7" />
      <path d="M18 25 L18 33 L24 33 L22 25 Z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

export function SgIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="40" height="20" viewBox="0 0 80 40" fill="none" className={className} aria-hidden>
      <path d="M3 16 L12 14 L15 18 L15 28 L5 30 L3 24 Z" fill="currentColor" opacity="0.9" />
      <rect x="14" y="15" width="22" height="11" rx="2" fill="currentColor" />
      <rect x="36" y="16" width="12" height="9" rx="1.5" fill="currentColor" opacity="0.85" />
      <rect x="48" y="17" width="24" height="6" rx="2" fill="currentColor" opacity="0.95" />
      <rect x="71" y="15.5" width="6" height="9" rx="1.5" fill="currentColor" />
      <rect x="48" y="24" width="20" height="2.5" rx="1" fill="currentColor" opacity="0.55" />
      <path d="M16 26 L14 35 L22 35 L24 26 Z" fill="currentColor" opacity="0.8" />
      <rect x="28" y="17" width="6" height="3" rx="0.5" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export function WeaponSlotButton({
  id,
  active,
  ammo,
  reserve,
  reloading,
  reloadProgress,
  onSelect,
}: {
  id: WeaponId;
  active: boolean;
  ammo: number;
  reserve: number;
  reloading: boolean;
  reloadProgress: number;
  onSelect: () => void;
}) {
  const isAr = id === 'ar';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition min-w-[6.5rem] ${
        active
          ? isAr
            ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-900/40'
            : 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-900/40'
          : 'bg-black/60 border-slate-600 text-slate-300'
      } ${reloading && active ? 'opacity-90' : ''}`}
    >
      {isAr ? <ArIcon className="shrink-0 drop-shadow-sm" /> : <SgIcon className="shrink-0 drop-shadow-sm" />}
      <div className="text-left leading-tight">
        <div className="tracking-wide">{isAr ? 'AR' : 'SG'}</div>
        <div className="text-[10px] font-mono opacity-80 font-normal">
          {ammo}/{reserve}
        </div>
      </div>
      {reloading && active && (
        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-black/40 rounded overflow-hidden">
          <div className="h-full bg-amber-300" style={{ width: `${reloadProgress * 100}%` }} />
        </div>
      )}
    </button>
  );
}
