"use client";

import { useEffect } from "react";
import Link from "next/link";
import { initTracking, trackStoryView, trackStoryExpand, trackSourceClick, trackShare } from "@/lib/tracking";
import { getStoryReadingTime } from "@/lib/utils";
import ShareButton from "@/components/ShareButton";
import BookmarkButton from "@/components/BookmarkButton";
import NewsletterSignup from "@/components/NewsletterSignup";

interface StoryCluster {
  id: string;
  topic: string;
  summary?: string;
  whatHappened: string;
  keyTakeaway?: string;
  sources: Array<{
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques: string[];
  }>;
  perspectives: Array<{
    lean: string;
    viewpoint: string;
  }>;
  expertConsensus?: {
    type: string;
    exists: boolean;
    statement?: string;
    confidenceLevel?: string;
    sources?: string[];
    dissent?: string;
  };
  debateType?: string;
  commonGround?: string[];
  factualDisputes?: Array<{
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: string;
  }>;
  whyItMatters?: {
    left: {
      coreValue: string;
      motivation: string;
      stance: string;
      emotionalAppeal: string;
    };
    right: {
      coreValue: string;
      motivation: string;
      stance: string;
      emotionalAppeal: string;
    };
    bottomLine: string;
  };
  deeperAnalysis?: {
    unstatedConcerns: {
      left: string[];
      right: string[];
    };
    economicDimension?: string;
    culturalDimension?: string;
    politicalGame: string;
    whatGetsIgnored?: string;
  };
}

interface Props {
  story: StoryCluster;
  generatedAt: string | null;
}

const LEAN_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  "Far Left": { color: "text-blue-700 dark:text-blue-200", bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-200 dark:border-blue-800" },
  "Left": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  "Center": { color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800", border: "border-zinc-200 dark:border-zinc-700" },
  "Right": { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800" },
  "Far Right": { color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-rose-200 dark:border-rose-800" },
};

function getLeanConfig(lean: string) {
  return LEAN_CONFIG[lean] || LEAN_CONFIG["Center"];
}

function BiasBadge({ lean }: { lean: string }) {
  const config = getLeanConfig(lean);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} border ${config.border}`}>
      {lean}
    </span>
  );
}

export default function StoryPageClient({ story, generatedAt }: Props) {
  const readingTime = getStoryReadingTime(story);
  const leftPerspective = story.perspectives.find(p => p.lean.toLowerCase().includes("left"));
  const rightPerspective = story.perspectives.find(p => p.lean.toLowerCase().includes("right"));

  useEffect(() => {
    const cleanup = initTracking();
    trackStoryView(story.id, story.topic);
    trackStoryExpand(story.id, story.topic);
    return cleanup;
  }, [story.id, story.topic]);

  const handleSourceClick = (sourceName: string, url: string) => {
    trackSourceClick(story.id, sourceName, url);
  };

  const handleShare = (platform: string, success: boolean) => {
    trackShare(story.id, platform, success);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">Despun</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton
              storyId={story.id}
              title={story.topic}
              summary={story.whatHappened}
              onShare={handleShare}
            />
            <BookmarkButton story={story} />
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-bold uppercase tracking-widest">
              {story.debateType || "Analysis"}
            </span>
            <span className="text-sm text-zinc-400">{readingTime} min read</span>
            {generatedAt && (
              <span className="text-sm text-zinc-400">
                {new Date(generatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight mb-6">
            {story.topic}
          </h1>

          {/* Source count */}
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>{story.sources.length} sources analyzed</span>
          </div>
        </header>

        {/* Core Facts */}
        <section className="mb-10">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              The Core Facts
            </h2>
            <p className="text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {story.whatHappened}
            </p>
          </div>
        </section>

        {/* Perspectives */}
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
            How Each Side Sees It
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {leftPerspective && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Left Focus</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-blue-500/20 pl-4">
                  &quot;{leftPerspective.viewpoint}&quot;
                </p>
              </div>
            )}
            {rightPerspective && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Right Focus</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-rose-500/20 pl-4">
                  &quot;{rightPerspective.viewpoint}&quot;
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Expert Consensus */}
        {story.expertConsensus?.exists && story.expertConsensus.statement && (
          <section className="mb-10">
            <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-2">
                Expert Consensus
              </h2>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                {story.expertConsensus.statement}
              </p>
            </div>
          </section>
        )}

        {/* Why It Matters */}
        {story.whyItMatters && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Why Each Side Cares
            </h2>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 mb-4">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                <span className="text-amber-600 dark:text-amber-400 font-bold">The real fight:</span> {story.whyItMatters.bottomLine}
              </p>
            </div>
          </section>
        )}

        {/* Key Takeaway */}
        {story.keyTakeaway && (
          <section className="mb-10 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
              Key Takeaway
            </h2>
            <p className="text-zinc-800 dark:text-zinc-200 font-medium">
              {story.keyTakeaway}
            </p>
          </section>
        )}

        {/* Sources */}
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Source Analysis
          </h2>
          <div className="grid gap-4">
            {story.sources.map((source, i) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{source.name}</span>
                  <BiasBadge lean={source.lean} />
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  onClick={() => handleSourceClick(source.name, source.url)}
                >
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                    {source.title}
                  </p>
                </a>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-400 font-medium">Framing:</span> {source.framing}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <NewsletterSignup source="story-page" className="mb-10" />

        {/* Back to home */}
        <div className="text-center pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Today&apos;s Briefing
          </Link>
        </div>
      </article>
    </div>
  );
}
