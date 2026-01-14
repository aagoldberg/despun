"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { debounce, generateSlug } from "@/lib/utils";

interface Story {
  id: string;
  topic: string;
  whatHappened?: string;
  summary?: string;
  debateType?: string;
}

interface SearchDialogProps {
  stories: Story[];
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDialog({ stories, isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Story[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search function
  const search = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      const q = searchQuery.toLowerCase();
      const filtered = stories.filter((story) => {
        const topic = story.topic.toLowerCase();
        const content = (story.whatHappened || story.summary || "").toLowerCase();
        return topic.includes(q) || content.includes(q);
      });

      setResults(filtered.slice(0, 10));
    },
    [stories]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((q: string) => search(q), 200),
    [search]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative min-h-full flex items-start justify-center p-4 pt-[10vh]">
        <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Search stories..."
              className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none text-lg"
            />
            <kbd className="hidden sm:block px-2 py-1 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                No stories found for &quot;{query}&quot;
              </div>
            )}

            {results.map((story) => (
              <Link
                key={story.id}
                href={`/story/${story.id}/${generateSlug(story.topic)}`}
                onClick={onClose}
                className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {story.topic}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">
                      {story.whatHappened || story.summary}
                    </p>
                  </div>
                  {story.debateType && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                      {story.debateType}
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center">
                <p className="text-zinc-400 mb-2">Start typing to search stories</p>
                <p className="text-xs text-zinc-400">Search by topic or content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchButton({ onClick }: { onClick: () => void }) {
  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClick();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClick]);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
      aria-label="Search stories"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-zinc-200 dark:bg-zinc-700 rounded">
        ⌘K
      </kbd>
    </button>
  );
}
