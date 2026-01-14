"use client";

import { useBookmarks } from "@/hooks/useBookmarks";

interface BookmarkButtonProps {
  story: {
    id: string;
    topic: string;
    summary?: string;
    whatHappened?: string;
  };
  showLabel?: boolean;
  className?: string;
}

export default function BookmarkButton({
  story,
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, isLoaded } = useBookmarks();
  const bookmarked = isBookmarked(story.id);

  if (!isLoaded) {
    return (
      <button
        className={`p-2 text-zinc-300 dark:text-zinc-700 rounded-lg ${className}`}
        disabled
        aria-label="Loading bookmarks"
      >
        <BookmarkIcon filled={false} />
      </button>
    );
  }

  return (
    <button
      onClick={() => toggleBookmark(story)}
      className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${
        bookmarked
          ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      } ${className}`}
      aria-label={bookmarked ? "Remove bookmark" : "Save for later"}
      title={bookmarked ? "Remove bookmark" : "Save for later"}
    >
      <BookmarkIcon filled={bookmarked} />
      {showLabel && (
        <span className="text-xs font-medium">
          {bookmarked ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16.586a1 1 0 01-1.707.707L12 16l-5.293 5.293A1 1 0 015 20.586V4z" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}
