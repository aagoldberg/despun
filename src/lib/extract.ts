import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export interface ExtractedArticle {
  title: string;
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Extract article content from a URL using Mozilla Readability
 */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        title: "",
        text: "",
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();

    // Check for Cloudflare challenge
    if (html.includes("Just a moment...") || html.includes("cf_chl_opt")) {
      return {
        title: "",
        text: "",
        success: false,
        error: "Blocked by Cloudflare",
      };
    }

    // Parse with linkedom
    const { document } = parseHTML(html);

    // Remove script and style elements
    const scripts = document.querySelectorAll("script, style, noscript, iframe");
    scripts.forEach((el: Element) => el.remove());

    // Use Readability to extract content
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return {
        title: document.title || "",
        text: "",
        success: false,
        error: "Could not extract article content",
      };
    }

    // Clean up text
    const cleanText = article.textContent
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length < 100) {
      return {
        title: article.title || "",
        text: cleanText,
        success: false,
        error: "Article too short (may be paywalled)",
      };
    }

    return {
      title: article.title || document.title || "Untitled",
      text: cleanText,
      success: true,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      return {
        title: "",
        text: "",
        success: false,
        error: "Request timed out",
      };
    }

    return {
      title: "",
      text: "",
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract multiple articles in parallel with concurrency limit
 */
export async function extractArticles(
  urls: string[],
  concurrency: number = 5
): Promise<Map<string, ExtractedArticle>> {
  const results = new Map<string, ExtractedArticle>();

  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await extractArticle(url);
        return { url, result };
      })
    );

    for (const { url, result } of batchResults) {
      results.set(url, result);
    }
  }

  return results;
}
