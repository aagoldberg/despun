import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import { getSystemHealthHistory, initAnalyticsTables } from "@/lib/analytics-db";

let tablesInitialized = false;
async function ensureTables(): Promise<void> {
  if (!tablesInitialized && process.env.DATABASE_URL) {
    try {
      await initAnalyticsTables();
      tablesInitialized = true;
    } catch (error) {
      console.error("Failed to initialize tables:", error);
    }
  }
}

// RSS feed sources to check (subset from main app)
const RSS_FEEDS = [
  { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
  { name: "AP News", url: "https://feedx.net/rss/ap.xml" },
  { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/politics.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/us-news/rss" },
];

async function checkRSSFeed(url: string): Promise<{ healthy: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Despun Health Check" },
    });

    clearTimeout(timeout);

    if (response.ok) {
      return { healthy: true };
    }
    return { healthy: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await ensureTables();

    // Check RSS feed health
    const feedResults = await Promise.all(
      RSS_FEEDS.map(async (feed) => ({
        name: feed.name,
        url: feed.url,
        ...(await checkRSSFeed(feed.url)),
      }))
    );

    const healthyFeeds = feedResults.filter((f) => f.healthy).length;

    // Check database connectivity
    let dbHealthy = false;
    let dbLatency = 0;
    if (process.env.DATABASE_URL) {
      try {
        const start = Date.now();
        const history = await getSystemHealthHistory(1);
        dbLatency = Date.now() - start;
        dbHealthy = true;
      } catch {
        dbHealthy = false;
      }
    }

    // Get historical metrics
    const history = await getSystemHealthHistory(24);

    return NextResponse.json({
      success: true,
      data: {
        current: {
          timestamp: new Date().toISOString(),
          rssFeeds: {
            healthy: healthyFeeds,
            total: RSS_FEEDS.length,
            feeds: feedResults,
          },
          database: {
            healthy: dbHealthy,
            latency: dbLatency,
          },
          api: {
            status: "operational",
          },
        },
        history,
      },
    });
  } catch (error) {
    console.error("System health API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch system health" },
      { status: 500 }
    );
  }
}
