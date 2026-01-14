/**
 * Utility functions for Despun
 */

/**
 * Calculate reading time for a piece of content
 * Average reading speed is ~200-250 words per minute
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

/**
 * Calculate reading time from a story object
 */
export function getStoryReadingTime(story: {
  whatHappened?: string;
  summary?: string;
  keyTakeaway?: string;
  perspectives?: { viewpoint: string }[];
  sources?: { framing: string }[];
}): number {
  let totalText = "";

  if (story.whatHappened) totalText += story.whatHappened + " ";
  if (story.summary) totalText += story.summary + " ";
  if (story.keyTakeaway) totalText += story.keyTakeaway + " ";

  if (story.perspectives) {
    story.perspectives.forEach(p => {
      totalText += p.viewpoint + " ";
    });
  }

  if (story.sources) {
    story.sources.forEach(s => {
      totalText += s.framing + " ";
    });
  }

  return calculateReadingTime(totalText);
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if code is running on client side
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Local storage helpers with SSR safety
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (!isClient()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isClient()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  },

  remove(key: string): void {
    if (!isClient()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};
