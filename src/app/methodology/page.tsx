import Link from "next/link";

export const metadata = {
  title: "Methodology | Despun",
  description: "How Despun collects, analyzes, and presents the news from across the political spectrum.",
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">Despun</span>
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/methodology" className="text-zinc-900 dark:text-zinc-100">
              Methodology
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Methodology</h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
            How Despun collects, analyzes, and presents the news.
          </p>
        </header>

        <div className="space-y-16">
          {/* Source Selection */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">1</span>
              </div>
              <h2 className="text-2xl font-bold">Source Selection</h2>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              We aggregate headlines from <strong className="text-zinc-800 dark:text-zinc-200">48 news sources</strong> across a 7-point political spectrum, pulling fresh content from each source via RSS feeds. This ensures broad coverage and multiple perspectives on each story.
            </p>

            {/* Source spectrum visualization */}
            <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Left</span>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Center</span>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Right</span>
              </div>
              <div className="h-3 rounded-full bg-gradient-to-r from-blue-600 via-zinc-300 to-rose-600 dark:via-zinc-600" />
              <div className="flex justify-between mt-2 text-[10px] text-zinc-400">
                <span>Far Left</span>
                <span>Left</span>
                <span>Center-Left</span>
                <span>Center</span>
                <span>Center-Right</span>
                <span>Right</span>
                <span>Far Right</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Far Left */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-blue-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-bold uppercase tracking-wider">Far Left</span>
                  <span className="text-xs text-zinc-400">5 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Jacobin</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Intercept</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Common Dreams</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Democracy Now</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Nation</span>
                </div>
              </div>

              {/* Left */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs font-bold uppercase tracking-wider">Left</span>
                  <span className="text-xs text-zinc-400">8 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Guardian</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">HuffPost</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Vox</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Mother Jones</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Slate</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">MSNBC</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Daily Beast</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Salon</span>
                </div>
              </div>

              {/* Center-Left */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-sky-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded text-xs font-bold uppercase tracking-wider">Center-Left</span>
                  <span className="text-xs text-zinc-400">9 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">NPR</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Atlantic</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">CNN</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">NBC News</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">CBS News</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">ABC News</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">New York Times</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Washington Post</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Politico</span>
                </div>
              </div>

              {/* Center */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-zinc-400">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold uppercase tracking-wider">Center</span>
                  <span className="text-xs text-zinc-400">9 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">PBS NewsHour</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">AP News</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Reuters</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Hill</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">USA Today</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">BBC News</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Axios</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Bloomberg</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Business Insider</span>
                </div>
              </div>

              {/* Center-Right */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-orange-400">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded text-xs font-bold uppercase tracking-wider">Center-Right</span>
                  <span className="text-xs text-zinc-400">3 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Wall Street Journal</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Economist</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">RealClearPolitics</span>
                </div>
              </div>

              {/* Right */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-rose-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded text-xs font-bold uppercase tracking-wider">Right</span>
                  <span className="text-xs text-zinc-400">9 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Fox News</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">NY Post</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Washington Examiner</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Daily Wire</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Federalist</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Washington Times</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">The Blaze</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">American Conservative</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">National Review</span>
                </div>
              </div>

              {/* Far Right */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border-l-4 border-rose-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded text-xs font-bold uppercase tracking-wider">Far Right</span>
                  <span className="text-xs text-zinc-400">5 sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Breitbart</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Newsmax</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Daily Caller</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Gateway Pundit</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium">Epoch Times</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <strong className="text-zinc-700 dark:text-zinc-300">How we classify bias:</strong> Our classifications are based on AllSides Media Bias Ratings and the Ad Fontes Media Bias Chart. These aren&apos;t perfect—individual articles and authors can vary—but they provide a useful baseline for understanding where sources typically fall on the spectrum.
              </p>
            </div>
          </section>

          {/* Story Clustering */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">2</span>
              </div>
              <h2 className="text-2xl font-bold">Story Clustering</h2>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              We use AI to identify when multiple sources are covering the same story. This involves:
            </p>
            <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-3">
                <span className="text-zinc-400">—</span>
                <span>Semantic analysis to match headlines about the same event</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-400">—</span>
                <span>Filtering out stories only covered by a single source</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-400">—</span>
                <span>Prioritizing stories with coverage across the political spectrum</span>
              </li>
            </ul>
          </section>

          {/* Analysis Process */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">3</span>
              </div>
              <h2 className="text-2xl font-bold">Analysis Process</h2>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              For each clustered story, we use Claude (Anthropic&apos;s AI) to generate:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Core Facts</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  A neutral summary of what actually happened, stripped of editorial framing and opinion.
                </p>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Framing Analysis</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  How each source is presenting the story—what they emphasize, what language they use, what context they include or omit.
                </p>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Perspective Synthesis</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Why people on different sides of the political spectrum care about this issue and what drives their views.
                </p>
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Debate Classification</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Whether the disagreement is about facts (what happened), policy (what to do), or values (what matters).
                </p>
              </div>
            </div>
          </section>

          {/* Expert Consensus */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">4</span>
              </div>
              <h2 className="text-2xl font-bold">Expert Consensus</h2>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              When relevant, we identify whether expert consensus exists on the underlying facts. This includes:
            </p>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Scientific consensus (CDC, WHO, peer review)
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Legal consensus (courts, legal scholars)
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Economic data (CBO, Federal Reserve)
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Statistical data (BLS, Census, FBI)
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Intelligence assessments (FBI, CIA, DNI)
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Historical record (historians, archives)
              </li>
            </ul>
          </section>

          {/* Limitations */}
          <section className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/30">
            <h2 className="text-2xl font-bold mb-4 text-amber-900 dark:text-amber-200">Known Limitations</h2>
            <ul className="space-y-3 text-amber-800 dark:text-amber-300">
              <li className="flex gap-3">
                <span className="text-amber-500 font-bold">!</span>
                <span><strong>AI can make mistakes.</strong> Always verify important claims with primary sources.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500 font-bold">!</span>
                <span><strong>Bias classifications are imperfect.</strong> Sources can vary in bias by topic or author.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500 font-bold">!</span>
                <span><strong>We only analyze headlines and snippets.</strong> Full article context may differ.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500 font-bold">!</span>
                <span><strong>Not all perspectives are represented.</strong> Our source list continues to expand.</span>
              </li>
            </ul>
          </section>
        </div>

        <footer className="mt-24 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <div className="flex justify-center gap-6">
            <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              Home
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
