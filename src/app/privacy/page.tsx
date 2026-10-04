export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0e17] text-slate-300 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>The Great Invasion is a free browser game. We collect minimal data.</p>
        <p><strong className="text-white">What we store locally:</strong> Your personal best score, achievements, and daily challenge progress are saved in your browser (localStorage). This data never leaves your device unless you later enable online leaderboards.</p>
        <p><strong className="text-white">Analytics:</strong> Anonymous gameplay events (game started, score, share clicked) may be collected to improve the game. No personal identifiers are required.</p>
        <p><strong className="text-white">Advertising:</strong> Third-party ad networks may set cookies or use device identifiers according to their own policies when ads are enabled.</p>
        <p><strong className="text-white">No accounts required.</strong> You can play fully anonymously.</p>
        <p>Contact: privacy@thegreatinvasion.game (placeholder)</p>
      </div>
      <a href="/" className="inline-block mt-8 text-blue-400 hover:underline">← Back to game</a>
    </main>
  );
}
