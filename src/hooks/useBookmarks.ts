"use client";

import { useState, useEffect, useCallback } from "react";
import { storage } from "@/lib/utils";

const BOOKMARKS_KEY = "despun-bookmarks";

export interface BookmarkedStory {
  id: string;
  topic: string;
  summary: string;
  savedAt: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedStory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = storage.get<BookmarkedStory[]>(BOOKMARKS_KEY, []);
    setBookmarks(saved);
    setIsLoaded(true);
  }, []);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((newBookmarks: BookmarkedStory[]) => {
    storage.set(BOOKMARKS_KEY, newBookmarks);
    setBookmarks(newBookmarks);
  }, []);

  // Check if a story is bookmarked
  const isBookmarked = useCallback(
    (storyId: string) => {
      return bookmarks.some((b) => b.id === storyId);
    },
    [bookmarks]
  );

  // Add a bookmark
  const addBookmark = useCallback(
    (story: { id: string; topic: string; summary?: string; whatHappened?: string }) => {
      if (isBookmarked(story.id)) return;

      const newBookmark: BookmarkedStory = {
        id: story.id,
        topic: story.topic,
        summary: story.summary || story.whatHappened || "",
        savedAt: new Date().toISOString(),
      };

      saveBookmarks([newBookmark, ...bookmarks]);
    },
    [bookmarks, isBookmarked, saveBookmarks]
  );

  // Remove a bookmark
  const removeBookmark = useCallback(
    (storyId: string) => {
      saveBookmarks(bookmarks.filter((b) => b.id !== storyId));
    },
    [bookmarks, saveBookmarks]
  );

  // Toggle a bookmark
  const toggleBookmark = useCallback(
    (story: { id: string; topic: string; summary?: string; whatHappened?: string }) => {
      if (isBookmarked(story.id)) {
        removeBookmark(story.id);
      } else {
        addBookmark(story);
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  return {
    bookmarks,
    isLoaded,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks,
    bookmarkCount: bookmarks.length,
  };
}
