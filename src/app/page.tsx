import GameUI from "@/components/GameUI";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0e17] text-white">
      {/* Top banner ad placeholder */}
      <div
        id="ad-banner-top"
        className="w-full h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-center text-slate-600 text-xs"
      >
        {/* Ad banner reserved */}
      </div>

      <div className="max-w-2xl mx-auto pt-6 pb-24">
        <GameUI />
      </div>

      <footer className="fixed bottom-12 left-0 right-0 text-center text-xs text-slate-600 pb-2 pointer-events-auto">
        <Link href="/privacy" className="hover:text-slate-400 mx-2">Privacy</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-slate-400 mx-2">Terms</Link>
      </footer>

      {/* Bottom safe area / banner placeholder */}
      <div
        id="ad-banner-bottom"
        className="fixed bottom-0 left-0 right-0 h-12 bg-slate-900/40 border-t border-slate-800 flex items-center justify-center text-slate-600 text-xs pointer-events-none"
      >
        {/* Ad banner reserved */}
      </div>
    </main>
  );
}
