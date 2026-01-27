import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { saveClearviewData, initClearviewTable, isDBAvailable } from "@/lib/db";
import { extractArticles, ExtractedArticle } from "@/lib/extract";

// This endpoint is called by Vercel Cron to refresh Clearview data
// It bypasses the cache and always generates fresh content

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; RageCheck/1.0)",
  },
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface FeedSource {
  name: string;
  lean: "Far Left" | "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right";
  feedUrl: string;
}

// Sources across the political spectrum (48 sources, 7-point spectrum)
const FEED_SOURCES: FeedSource[] = [
  // Far Left (5)
  { name: "Jacobin", lean: "Far Left", feedUrl: "https://jacobin.com/feed" },
  { name: "The Intercept", lean: "Far Left", feedUrl: "https://theintercept.com/feed/?rss" },
  { name: "Common Dreams", lean: "Far Left", feedUrl: "https://www.commondreams.org/rss.xml" },
  { name: "Democracy Now", lean: "Far Left", feedUrl: "https://www.democracynow.org/democracynow.rss" },
  { name: "The Nation", lean: "Far Left", feedUrl: "https://www.thenation.com/feed/?post_type=article" },

  // Left (8)
  { name: "The Guardian", lean: "Left", feedUrl: "https://www.theguardian.com/us-news/rss" },
  { name: "HuffPost", lean: "Left", feedUrl: "https://www.huffpost.com/section/politics/feed" },
  { name: "Vox", lean: "Left", feedUrl: "https://www.vox.com/rss/index.xml" },
  { name: "Mother Jones", lean: "Left", feedUrl: "https://www.motherjones.com/feed/" },
  { name: "Slate", lean: "Left", feedUrl: "https://slate.com/feeds/all.rss" },
  { name: "MSNBC", lean: "Left", feedUrl: "https://www.msnbc.com/feeds/latest" },
  { name: "The Daily Beast", lean: "Left", feedUrl: "https://feeds.thedailybeast.com/rss/articles" },
  { name: "Salon", lean: "Left", feedUrl: "https://www.salon.com/feed/" },

  // Center-Left (9)
  { name: "NPR", lean: "Center-Left", feedUrl: "https://feeds.npr.org/1001/rss.xml" },
  { name: "The Atlantic", lean: "Center-Left", feedUrl: "https://www.theatlantic.com/feed/all/" },
  { name: "CNN", lean: "Center-Left", feedUrl: "http://rss.cnn.com/rss/cnn_topstories.rss" },
  { name: "NBC News", lean: "Center-Left", feedUrl: "https://feeds.nbcnews.com/nbcnews/public/news" },
  { name: "CBS News", lean: "Center-Left", feedUrl: "https://www.cbsnews.com/latest/rss/main" },
  { name: "ABC News", lean: "Center-Left", feedUrl: "https://abcnews.go.com/abcnews/topstories" },
  { name: "New York Times", lean: "Center-Left", feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
  { name: "Washington Post", lean: "Center-Left", feedUrl: "https://feeds.washingtonpost.com/rss/politics" },
  { name: "Politico", lean: "Center-Left", feedUrl: "https://www.politico.com/rss/politicopicks.xml" },

  // Center (9)
  { name: "PBS NewsHour", lean: "Center", feedUrl: "https://www.pbs.org/newshour/feeds/rss/headlines" },
  { name: "AP News", lean: "Center", feedUrl: "https://feedx.net/rss/ap.xml" },
  { name: "Reuters", lean: "Center", feedUrl: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best" },
  { name: "The Hill", lean: "Center", feedUrl: "https://thehill.com/feed/" },
  { name: "USA Today", lean: "Center", feedUrl: "https://rssfeeds.usatoday.com/usatoday-NewsTopStories" },
  { name: "BBC News", lean: "Center", feedUrl: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml" },
  { name: "Axios", lean: "Center", feedUrl: "https://api.axios.com/feed/" },
  { name: "Bloomberg", lean: "Center", feedUrl: "https://feeds.bloomberg.com/politics/news.rss" },
  { name: "Business Insider", lean: "Center", feedUrl: "https://www.businessinsider.com/sai/rss" },

  // Center-Right (3)
  { name: "Wall Street Journal", lean: "Center-Right", feedUrl: "https://feeds.a.dj.com/rss/RSSOpinion.xml" },
  { name: "The Economist", lean: "Center-Right", feedUrl: "https://www.economist.com/united-states/rss.xml" },
  { name: "RealClearPolitics", lean: "Center-Right", feedUrl: "https://feeds.feedburner.com/realclearpolitics/qlMj" },

  // Right (9)
  { name: "Fox News", lean: "Right", feedUrl: "https://moxie.foxnews.com/google-publisher/politics.xml" },
  { name: "NY Post", lean: "Right", feedUrl: "https://nypost.com/feed/" },
  { name: "Washington Examiner", lean: "Right", feedUrl: "https://www.washingtonexaminer.com/feed" },
  { name: "Daily Wire", lean: "Right", feedUrl: "https://www.dailywire.com/feeds/rss.xml" },
  { name: "The Federalist", lean: "Right", feedUrl: "https://thefederalist.com/feed/" },
  { name: "Washington Times", lean: "Right", feedUrl: "https://www.washingtontimes.com/rss/headlines/news/politics/" },
  { name: "The Blaze", lean: "Right", feedUrl: "https://www.theblaze.com/feeds/feed.rss" },
  { name: "American Conservative", lean: "Right", feedUrl: "https://www.theamericanconservative.com/feed/" },
  { name: "National Review", lean: "Right", feedUrl: "https://www.nationalreview.com/feed/" },

  // Far Right (5)
  { name: "Breitbart", lean: "Far Right", feedUrl: "https://feeds.feedburner.com/breitbart" },
  { name: "Newsmax", lean: "Far Right", feedUrl: "https://www.newsmax.com/rss/Newsfront/1/" },
  { name: "Daily Caller", lean: "Far Right", feedUrl: "https://dailycaller.com/feed/" },
  { name: "Gateway Pundit", lean: "Far Right", feedUrl: "https://www.thegatewaypundit.com/feed/" },
  { name: "Epoch Times", lean: "Far Right", feedUrl: "https://www.theepochtimes.com/c-us/feed" },
];

interface RawHeadline {
  source: string;
  lean: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt: string;
}

interface HeadlineCluster {
  topic: string;
  headlineIndices: number[];
}

interface ArticleWithMeta {
  source: string;
  lean: string;
  title: string;
  url: string;
  articleText: string;
  extractionSuccess: boolean;
}

async function fetchAllHeadlines(): Promise<RawHeadline[]> {
  const headlines: RawHeadline[] = [];
  const seenUrls = new Set<string>();

  const results = await Promise.allSettled(
    FEED_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.feedUrl);
        // Fetch ALL items from each feed (no slice limit)
        return feed.items
          .filter((item) => item.title && item.link)
          .map((item) => ({
            source: source.name,
            lean: source.lean,
            title: item.title || "Untitled",
            url: item.link || "",
            snippet: item.contentSnippet || item.content || "",
            publishedAt: item.pubDate || new Date().toISOString(),
          }));
      } catch (error) {
        console.error(`Failed to fetch ${source.name}:`, error);
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const headline of result.value) {
        // Deduplicate by URL
        if (!seenUrls.has(headline.url)) {
          seenUrls.add(headline.url);
          headlines.push(headline);
        }
      }
    }
  }

  console.log(`Cron: Fetched ${headlines.length} unique headlines from ${FEED_SOURCES.length} sources`);
  return headlines;
}

/**
 * Phase 1: Quick clustering of headlines into story groups
 */
async function clusterHeadlines(headlines: RawHeadline[]): Promise<HeadlineCluster[]> {
  if (!client) {
    throw new Error("LLM not available");
  }

  const headlinesSummary = headlines
    .map((h, i) => `[${i}] ${h.source} (${h.lean}): "${h.title}"`)
    .join("\n");

  const prompt = `Quickly group these news headlines into 3-5 major story clusters. Only include stories covered by 2+ sources.

Headlines:
${headlinesSummary}

Respond with ONLY this JSON (no explanation):
{
  "clusters": [
    {
      "topic": "Brief topic name",
      "headlineIndices": [0, 5, 12]
    }
  ]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse clustering response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.clusters || [];
}

/**
 * Phase 2: Extract full articles for clustered headlines
 */
async function extractClusteredArticles(
  headlines: RawHeadline[],
  clusters: HeadlineCluster[]
): Promise<Map<string, ArticleWithMeta[]>> {
  const storyArticles = new Map<string, ArticleWithMeta[]>();

  // Collect all URLs to extract
  const allUrls: string[] = [];
  const urlToHeadline = new Map<string, RawHeadline>();

  for (const cluster of clusters) {
    for (const idx of cluster.headlineIndices) {
      if (headlines[idx]) {
        const headline = headlines[idx];
        if (headline.url && !urlToHeadline.has(headline.url)) {
          allUrls.push(headline.url);
          urlToHeadline.set(headline.url, headline);
        }
      }
    }
  }

  console.log(`Cron: Extracting ${allUrls.length} articles for ${clusters.length} story clusters...`);

  // Extract all articles in parallel with concurrency limit
  const extractedArticles = await extractArticles(allUrls, 10);

  // Organize by cluster
  for (const cluster of clusters) {
    const articles: ArticleWithMeta[] = [];

    for (const idx of cluster.headlineIndices) {
      if (headlines[idx]) {
        const headline = headlines[idx];
        const extracted: ExtractedArticle = extractedArticles.get(headline.url) || {
          title: headline.title,
          text: "",
          success: false,
          error: "Not extracted",
        };

        articles.push({
          source: headline.source,
          lean: headline.lean,
          title: headline.title,
          url: headline.url,
          articleText: extracted.success ? extracted.text.slice(0, 8000) : "", // Limit to 8k chars per article
          extractionSuccess: extracted.success,
        });
      }
    }

    storyArticles.set(cluster.topic, articles);
  }

  return storyArticles;
}

/**
 * Phase 3: Detailed analysis with full article content
 */
async function analyzeWithArticles(
  storyArticles: Map<string, ArticleWithMeta[]>
) {
  if (!client) {
    throw new Error("LLM not available");
  }

  // Build the prompt with full article content
  let storySummaries = "";
  let storyIndex = 1;

  for (const [topic, articles] of storyArticles) {
    storySummaries += `\n=== STORY ${storyIndex}: ${topic} ===\n`;

    for (const article of articles) {
      storySummaries += `\n--- ${article.source} (${article.lean}) ---\n`;
      storySummaries += `Headline: "${article.title}"\n`;
      storySummaries += `URL: ${article.url}\n`;

      if (article.articleText) {
        storySummaries += `Article Content:\n${article.articleText}\n`;
      } else {
        storySummaries += `[Article could not be extracted - analyze based on headline]\n`;
      }
    }
    storyIndex++;
  }

  const prompt = `You are analyzing news articles from sources across the political spectrum. You have access to the FULL ARTICLE TEXT, not just headlines. Use this to provide deep, accurate analysis of how each source frames the story.

${storySummaries}

For each story, provide detailed analysis based on the ACTUAL ARTICLE CONTENT you've read. Pay attention to:
- Specific language choices and loaded terms
- What facts are emphasized vs minimized
- What context is included vs omitted
- The emotional tone and appeals used
- Any manipulation techniques in the actual text

Respond with this exact JSON structure:
{
  "stories": [
    {
      "id": "story-1",
      "topic": "Brief topic name (e.g., 'Immigration Policy Changes')",
      "summary": "2-3 sentence neutral summary of what actually happened, just the facts",
      "whatHappened": "Detailed explanation of the actual events, stripped of spin",
      "sources": [
        {
          "name": "Source Name",
          "lean": "Political lean",
          "title": "Their headline",
          "url": "article url",
          "framing": "How they're framing/spinning this story - cite specific passages",
          "manipulationTechniques": ["technique1", "technique2"]
        }
      ],
      "perspectives": [
        {
          "lean": "Left",
          "viewpoint": "How the left generally sees this issue and why"
        },
        {
          "lean": "Right",
          "viewpoint": "How the right generally sees this issue and why"
        }
      ],
      "keyTakeaway": "One sentence helping the reader understand the story without the spin",
      "expertConsensus": {
        "type": "scientific|legal|historical|economic|intelligence|statistical|professional|international|none",
        "exists": true/false,
        "statement": "What expert consensus says (if applicable)",
        "confidenceLevel": "high|moderate|low|contested",
        "sources": ["CDC", "Supreme Court", "Bureau of Labor Statistics", "FBI/CIA", "historians", etc.],
        "dissent": "Notable minority expert view if relevant"
      },
      "debateType": "factual|policy|values|mixed",
      "debateQuestion": "The actual question being debated",
      "commonGround": ["Facts both sides agree on"],
      "factualDisputes": [
        {
          "claim": "The disputed claim",
          "leftPosition": "What left-leaning sources claim",
          "rightPosition": "What right-leaning sources claim",
          "evidenceStatus": "supported|mixed|unsupported|misleading"
        }
      ],
      "whyItMatters": {
        "left": {
          "coreValue": "The underlying value at stake",
          "motivation": "Plain-language explanation of why this matters to them",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "What emotion this activates"
        },
        "right": {
          "coreValue": "The underlying value at stake",
          "motivation": "Plain-language explanation of why this matters to them",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "What emotion this activates"
        },
        "bottomLine": "One sentence explaining what this fight is really about"
      },
      "deeperAnalysis": {
        "unstatedConcerns": {
          "left": ["Concerns driving the left that aren't openly discussed"],
          "right": ["Concerns driving the right that aren't openly discussed"]
        },
        "economicDimension": "Economic anxieties and interests at play",
        "culturalDimension": "Cultural/identity concerns beneath the surface",
        "politicalGame": "How politicians and media are exploiting this issue",
        "whatGetsIgnored": "Nuances, solutions, or common ground that gets ignored"
      }
    }
  ]
}

CRITICAL:
- Base your framing analysis on ACTUAL QUOTES and passages from the articles, not just headlines
- Every story MUST include expertConsensus, whyItMatters, and deeperAnalysis
- Be specific about manipulation techniques - cite examples from the text
- If you couldn't read an article, note that and analyze based on the headline only`;

  // Use streaming for large responses
  let fullText = "";
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
    }
  }

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse analysis");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // Try to fix common JSON issues
    const fixedJson = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ' ');

    try {
      parsed = JSON.parse(fixedJson);
    } catch {
      console.error("Cron: JSON parse failed. First 500 chars:", jsonMatch[0].slice(0, 500));
      throw parseError;
    }
  }

  const stories = parsed.stories || [];
  const storiesWithWhy = stories.filter((s: { whyItMatters?: unknown }) => s.whyItMatters);
  console.log(`Cron: ${storiesWithWhy.length}/${stories.length} stories have whyItMatters`);

  return stories;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request or admin request
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  // Accept either CRON_SECRET or ADMIN_KEY
  const providedToken = authHeader?.replace("Bearer ", "");
  const isAuthorized =
    (cronSecret && providedToken === cronSecret) ||
    (adminKey && providedToken === adminKey);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Cron: Starting Clearview refresh with full article extraction...");

    if (!client) {
      return NextResponse.json(
        { success: false, error: "LLM not available" },
        { status: 503 }
      );
    }

    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 503 }
      );
    }

    await initClearviewTable();

    // Fetch headlines
    const headlines = await fetchAllHeadlines();

    if (headlines.length < 5) {
      return NextResponse.json(
        { success: false, error: "Not enough headlines" },
        { status: 503 }
      );
    }

    // Phase 1: Quick clustering of headlines
    console.log("Cron: Phase 1 - Clustering headlines...");
    const clusters = await clusterHeadlines(headlines);
    console.log(`Cron: Found ${clusters.length} story clusters`);

    // Phase 2: Extract full articles for clustered stories
    console.log("Cron: Phase 2 - Extracting full articles...");
    const storyArticles = await extractClusteredArticles(headlines, clusters);

    // Count successful extractions
    let successCount = 0;
    let totalCount = 0;
    for (const articles of storyArticles.values()) {
      for (const article of articles) {
        totalCount++;
        if (article.extractionSuccess) successCount++;
      }
    }
    console.log(`Cron: Extracted ${successCount}/${totalCount} articles successfully`);

    // Phase 3: Detailed analysis with full article content
    console.log("Cron: Phase 3 - Analyzing with full article content...");
    const stories = await analyzeWithArticles(storyArticles);
    console.log(`Cron: Generated ${stories.length} story clusters`);

    // Save to database
    await saveClearviewData(stories);
    console.log("Cron: Saved to database");

    return NextResponse.json({
      success: true,
      message: "Clearview data refreshed with full article analysis",
      storiesCount: stories.length,
      articlesExtracted: successCount,
      articlesTotal: totalCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron: Clearview refresh failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      },
      { status: 500 }
    );
  }
}
