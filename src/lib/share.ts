/**
 * Share utilities for Despun
 * Handles Web Share API, social platform URLs, and share tracking
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
  storyId?: string;
}

/**
 * Generate a shareable URL with UTM parameters
 */
export function generateShareUrl(
  baseUrl: string,
  source: string,
  storyId?: string
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "share");
  if (storyId) {
    url.searchParams.set("utm_content", storyId);
  }
  return url.toString();
}

/**
 * Check if Web Share API is available
 */
export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/**
 * Share using native Web Share API
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!canUseWebShare()) return false;

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    });
    return true;
  } catch (err) {
    // User cancelled or error occurred
    if (err instanceof Error && err.name !== "AbortError") {
      console.error("Share failed:", err);
    }
    return false;
  }
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl(data: ShareData): string {
  const shareUrl = generateShareUrl(data.url, "twitter", data.storyId);
  const params = new URLSearchParams({
    text: `${data.text}\n\n`,
    url: shareUrl,
    hashtags: "Despun",
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(data: ShareData): string {
  const shareUrl = generateShareUrl(data.url, "facebook", data.storyId);
  const params = new URLSearchParams({
    u: shareUrl,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(data: ShareData): string {
  const shareUrl = generateShareUrl(data.url, "linkedin", data.storyId);
  const params = new URLSearchParams({
    url: shareUrl,
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate Reddit share URL
 */
export function getRedditShareUrl(data: ShareData): string {
  const shareUrl = generateShareUrl(data.url, "reddit", data.storyId);
  const params = new URLSearchParams({
    url: shareUrl,
    title: data.title,
  });
  return `https://www.reddit.com/submit?${params.toString()}`;
}

/**
 * Generate email share URL
 */
export function getEmailShareUrl(data: ShareData): string {
  const shareUrl = generateShareUrl(data.url, "email", data.storyId);
  const subject = encodeURIComponent(data.title);
  const body = encodeURIComponent(`${data.text}\n\nRead more: ${shareUrl}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      console.error("Copy failed:", err);
      return false;
    }
  }
}
