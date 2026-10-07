import Game3D from "@/components/Game3D";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[#0a0e17] text-white">
      <Game3D />
      <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
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
