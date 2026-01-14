"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useBookmarks } from "@/hooks/useBookmarks";
import { generateSlug, formatRelativeTime } from "@/lib/utils";
import { initTracking } from "@/lib/tracking";

export default function SavedPage() {
  const { bookmarks, isLoaded, removeBookmark, clearBookmarks } = useBookmarks();

  useEffect(() => {
    const cleanup = initTracking();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-lg tracking-tight">Despun</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Saved Stories
          </h1>
          <p className="text-zinc-500">
            Stories you&apos;ve bookmarked for later reading.
          </p>
        </header>

        {!isLoaded ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-zinc-400">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading saved stories...
            </div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No saved stories yet
            </h3>
            <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
              Click the bookmark icon on any story to save it for later.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Browse Stories
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-zinc-500">
                {bookmarks.length} saved {bookmarks.length === 1 ? "story" : "stories"}
              </span>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all saved stories?")) {
                    clearBookmarks();
                  }
                }}
                className="text-sm text-zinc-400 hover:text-rose-500 transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/story/${bookmark.id}/${generateSlug(bookmark.topic)}`}
                      className="flex-1 group"
                    >
                      <h3 className="font-medium text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                        {bookmark.topic}
                      </h3>
                      {bookmark.summary && (
                        <p className="text-sm text-zinc-500 line-clamp-2">
                          {bookmark.summary}
                        </p>
                      )}
                      <span className="text-xs text-zinc-400 mt-2 block">
                        Saved {formatRelativeTime(bookmark.savedAt)}
                      </span>
                    </Link>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                      aria-label="Remove bookmark"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Back link */}
        <div className="text-center pt-12">
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
      </main>
    </div>
  );
}
