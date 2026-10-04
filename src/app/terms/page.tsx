export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0e17] text-slate-300 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>By playing The Great Invasion you agree to these terms.</p>
        <p>The game is provided free of charge and &quot;as is&quot;. We make no warranties about availability or accuracy of scores.</p>
        <p>Do not attempt to cheat, exploit, or attack the service. Obvious cheating may result in scores being removed from leaderboards.</p>
        <p>Advertising may appear. You may choose to watch optional rewarded ads for temporary in-game benefits; these never provide permanent pay-to-win advantages.</p>
        <p>We may update these terms. Continued play after changes constitutes acceptance.</p>
      </div>
      <a href="/" className="inline-block mt-8 text-blue-400 hover:underline">← Back to game</a>
    </main>
  );
}
