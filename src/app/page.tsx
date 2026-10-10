'use client';

import Link from 'next/link';
import BoltHopGame from '@/components/BoltHopGame';

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[#050814] text-white">
      <BoltHopGame />
      <footer className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto text-center text-[10px] text-slate-600 pb-1">
          <Link href="/privacy" className="hover:text-slate-400 mx-1">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-slate-400 mx-1">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}
