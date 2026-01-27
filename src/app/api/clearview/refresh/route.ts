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
  sourceCount: number;
  spectrumSpread: number;
  category: "politics" | "economy" | "international" | "tech" | "culture" | "other";
}

interface TieredClusters {
  deepDives: HeadlineCluster[];
  quickTakes: HeadlineCluster[];
}

interface ArticleWithMeta {
  source: string;
  lean: string;
  title: string;
  url: string;
  articleText: string;
  extractionSuccess: boolean;
}

// Story type matching the main route
interface StoryCluster {
  id: string;
  topic: string;
  tier: "deep-dive" | "quick-take";
  summary: string;
  whatHappened?: string;
  sources: {
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques?: string[];
  }[];
  perspectives: {
    lean: string;
    viewpoint: string;
  }[];
  keyTakeaway: string;
  category: "politics" | "economy" | "international" | "tech" | "culture" | "other";
  expertConsensus?: {
    type: string;
    exists: boolean;
    statement?: string;
    confidenceLevel: string;
    sources?: string[];
    dissent?: string;
  };
  debateType?: string;
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: {
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: string;
  }[];
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

async function fetchAllHeadlines(): Promise<RawHeadline[]> {
  const headlines: RawHeadline[] = [];
  const seenUrls = new Set<string>();

  const results = await Promise.allSettled(
    FEED_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.feedUrl);
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

async function clusterHeadlines(headlines: RawHeadline[]): Promise<HeadlineCluster[]> {
  if (!client) {
    throw new Error("LLM not available");
  }

  const headlinesSummary = headlines
    .map((h, i) => `[${i}] ${h.source} (${h.lean}): "${h.title}"`)
    .join("\n");

  const prompt = `Group these news headlines into story clusters. Include ALL stories with 2+ sources.

Headlines:
${headlinesSummary}

For each cluster, count:
- sourceCount: total number of sources covering this story
- spectrumSpread: how many DIFFERENT political leans are represented (1-7 scale, where 7 means coverage from Far Left to Far Right)
- category: politics, economy, international, tech, culture, or other

Respond with ONLY this JSON (no explanation):
{
  "clusters": [
    {
      "topic": "Brief topic name",
      "headlineIndices": [0, 5, 12],
      "sourceCount": 6,
      "spectrumSpread": 4,
      "category": "politics"
    }
  ]
}

Include ALL story clusters with 2+ sources. Do not limit to a specific number.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
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

function selectTiers(clusters: HeadlineCluster[]): TieredClusters {
  const deepDives: HeadlineCluster[] = [];
  const quickTakes: HeadlineCluster[] = [];

  const sorted = [...clusters].sort((a, b) => {
    const scoreA = a.sourceCount + a.spectrumSpread;
    const scoreB = b.sourceCount + b.spectrumSpread;
    return scoreB - scoreA;
  });

  for (const cluster of sorted) {
    if (cluster.sourceCount >= 4 && cluster.spectrumSpread >= 3) {
      deepDives.push(cluster);
    } else {
      quickTakes.push(cluster);
    }
  }

  // Category floor
  const keyCategories: Array<"politics" | "economy" | "international"> = ["politics", "economy", "international"];

  for (const category of keyCategories) {
    const hasDeepDive = deepDives.some(c => c.category === category);
    if (!hasDeepDive) {
      const idx = quickTakes.findIndex(c => c.category === category);
      if (idx !== -1) {
        const promoted = quickTakes.splice(idx, 1)[0];
        deepDives.push(promoted);
        console.log(`Cron: Promoted "${promoted.topic}" to Deep Dive for category coverage (${category})`);
      }
    }
  }

  // Cap Deep Dives at 8
  if (deepDives.length > 8) {
    const demoted = deepDives.splice(8);
    quickTakes.unshift(...demoted);
    console.log(`Cron: Demoted ${demoted.length} stories to Quick Take (cap at 8 Deep Dives)`);
  }

  return { deepDives, quickTakes };
}

async function extractDeepDiveArticles(
  headlines: RawHeadline[],
  clusters: HeadlineCluster[]
): Promise<Map<string, ArticleWithMeta[]>> {
  const storyArticles = new Map<string, ArticleWithMeta[]>();

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

  console.log(`Cron: Extracting ${allUrls.length} articles for ${clusters.length} Deep Dive clusters...`);

  const extractedArticles = await extractArticles(allUrls, 10);

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
          articleText: extracted.success ? extracted.text.slice(0, 8000) : "",
          extractionSuccess: extracted.success,
        });
      }
    }

    storyArticles.set(cluster.topic, articles);
  }

  return storyArticles;
}

async function analyzeDeepDives(
  storyArticles: Map<string, ArticleWithMeta[]>,
  clusters: HeadlineCluster[]
): Promise<StoryCluster[]> {
  if (!client || storyArticles.size === 0) {
    return [];
  }

  let storySummaries = "";
  let storyIndex = 1;

  const categoryMap = new Map<string, string>();
  for (const cluster of clusters) {
    categoryMap.set(cluster.topic, cluster.category);
  }

  for (const [topic, articles] of storyArticles) {
    storySummaries += `\n=== STORY ${storyIndex}: ${topic} (Category: ${categoryMap.get(topic) || "other"}) ===\n`;

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

  const prompt = `You are analyzing news articles from sources across the political spectrum. You have access to the FULL ARTICLE TEXT. Provide deep analysis of how each source frames each story.

${storySummaries}

For each story, provide detailed analysis based on the ACTUAL ARTICLE CONTENT. Pay attention to:
- Specific language choices and loaded terms
- What facts are emphasized vs minimized
- What context is included vs omitted
- The emotional tone and appeals used
- Manipulation techniques in the actual text

Respond with this exact JSON structure:
{
  "stories": [
    {
      "id": "story-1",
      "topic": "Brief topic name",
      "tier": "deep-dive",
      "category": "politics|economy|international|tech|culture|other",
      "summary": "2-3 sentence neutral summary of what actually happened",
      "whatHappened": "Detailed explanation of actual events, stripped of spin",
      "sources": [
        {
          "name": "Source Name",
          "lean": "Political lean",
          "title": "Their headline",
          "url": "article url",
          "framing": "How they're framing this story - cite specific passages",
          "manipulationTechniques": ["technique1", "technique2"]
        }
      ],
      "perspectives": [
        { "lean": "Left", "viewpoint": "How the left sees this and why" },
        { "lean": "Right", "viewpoint": "How the right sees this and why" }
      ],
      "keyTakeaway": "One sentence helping reader understand without spin",
      "expertConsensus": {
        "type": "scientific|legal|historical|economic|intelligence|statistical|professional|international|none",
        "exists": true/false,
        "statement": "What expert consensus says",
        "confidenceLevel": "high|moderate|low|contested",
        "sources": ["relevant sources"],
        "dissent": "Notable minority view if any"
      },
      "debateType": "factual|policy|values|mixed",
      "debateQuestion": "The actual question being debated",
      "commonGround": ["Facts both sides agree on"],
      "factualDisputes": [
        {
          "claim": "Disputed claim",
          "leftPosition": "Left's claim",
          "rightPosition": "Right's claim",
          "evidenceStatus": "supported|mixed|unsupported|misleading"
        }
      ],
      "whyItMatters": {
        "left": {
          "coreValue": "Underlying value at stake",
          "motivation": "Plain-language why this matters to them",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "Emotion activated"
        },
        "right": {
          "coreValue": "Underlying value at stake",
          "motivation": "Plain-language why this matters to them",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "Emotion activated"
        },
        "bottomLine": "One sentence: what this fight is really about"
      },
      "deeperAnalysis": {
        "unstatedConcerns": {
          "left": ["Unspoken concerns driving the left"],
          "right": ["Unspoken concerns driving the right"]
        },
        "economicDimension": "Economic interests at play",
        "culturalDimension": "Cultural concerns beneath the surface",
        "politicalGame": "How politicians/media exploit this",
        "whatGetsIgnored": "Nuance and common ground that gets ignored"
      }
    }
  ]
}

CRITICAL:
- Base framing analysis on ACTUAL QUOTES from articles
- Every story MUST include ALL fields shown above
- Be specific about manipulation techniques - cite examples`;

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
    throw new Error("Failed to parse Deep Dive analysis");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    const fixedJson = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ' ');

    try {
      parsed = JSON.parse(fixedJson);
    } catch {
      console.error("Cron: Deep Dive JSON parse failed");
      throw parseError;
    }
  }

  const stories = (parsed.stories || []).map((s: StoryCluster) => ({
    ...s,
    tier: "deep-dive" as const,
  }));

  console.log(`Cron: Analyzed ${stories.length} Deep Dive stories`);
  return stories;
}

async function analyzeQuickTakes(
  headlines: RawHeadline[],
  clusters: HeadlineCluster[]
): Promise<StoryCluster[]> {
  if (!client || clusters.length === 0) {
    return [];
  }

  let storySummaries = "";
  let storyIndex = 1;

  for (const cluster of clusters) {
    storySummaries += `\n=== STORY ${storyIndex}: ${cluster.topic} (Category: ${cluster.category}) ===\n`;

    for (const idx of cluster.headlineIndices) {
      if (headlines[idx]) {
        const h = headlines[idx];
        storySummaries += `- ${h.source} (${h.lean}): "${h.title}" [${h.url}]\n`;
      }
    }
    storyIndex++;
  }

  const prompt = `Provide brief analysis of these news stories based on HEADLINES ONLY. This is a Quick Take - be concise.

${storySummaries}

Respond with this JSON structure:
{
  "stories": [
    {
      "id": "story-1",
      "topic": "Brief topic name",
      "tier": "quick-take",
      "category": "politics|economy|international|tech|culture|other",
      "summary": "1-2 sentence neutral summary",
      "sources": [
        {
          "name": "Source Name",
          "lean": "Political lean",
          "title": "Their headline",
          "url": "article url",
          "framing": "Brief note on how they're framing this (based on headline)"
        }
      ],
      "perspectives": [
        { "lean": "Left", "viewpoint": "Brief left perspective" },
        { "lean": "Right", "viewpoint": "Brief right perspective" }
      ],
      "keyTakeaway": "One sentence summary without spin"
    }
  ]
}

Keep it brief - this is Quick Take analysis based on headlines only.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Quick Take analysis");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    const fixedJson = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ' ');

    try {
      parsed = JSON.parse(fixedJson);
    } catch {
      console.error("Cron: Quick Take JSON parse failed");
      throw parseError;
    }
  }

  const stories = (parsed.stories || []).map((s: StoryCluster) => ({
    ...s,
    tier: "quick-take" as const,
  }));

  console.log(`Cron: Analyzed ${stories.length} Quick Take stories`);
  return stories;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  const providedToken = authHeader?.replace("Bearer ", "");
  const isAuthorized =
    (cronSecret && providedToken === cronSecret) ||
    (adminKey && providedToken === adminKey);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Cron: Starting Clearview refresh with tiered analysis...");

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

    // Phase 1: Cluster headlines with metrics
    console.log("Cron: Phase 1 - Clustering headlines with metrics...");
    const clusters = await clusterHeadlines(headlines);
    console.log(`Cron: Found ${clusters.length} total story clusters`);

    // Phase 2: Select tiers
    console.log("Cron: Phase 2 - Selecting tiers...");
    const { deepDives, quickTakes } = selectTiers(clusters);
    console.log(`Cron: Selected ${deepDives.length} Deep Dives, ${quickTakes.length} Quick Takes`);

    // Phase 3: Extract articles for Deep Dives only
    console.log("Cron: Phase 3 - Extracting articles for Deep Dives...");
    const deepDiveArticles = await extractDeepDiveArticles(headlines, deepDives);

    let successCount = 0;
    let totalCount = 0;
    for (const articles of deepDiveArticles.values()) {
      for (const article of articles) {
        totalCount++;
        if (article.extractionSuccess) successCount++;
      }
    }
    console.log(`Cron: Extracted ${successCount}/${totalCount} articles successfully`);

    // Phase 4: Analyze both tiers in parallel
    console.log("Cron: Phase 4 - Analyzing stories...");
    const [deepDiveStories, quickTakeStories] = await Promise.all([
      analyzeDeepDives(deepDiveArticles, deepDives),
      analyzeQuickTakes(headlines, quickTakes),
    ]);

    // Combine results
    const allStories = [...deepDiveStories, ...quickTakeStories];

    // Save to database
    await saveClearviewData(allStories);
    console.log("Cron: Saved to database");

    return NextResponse.json({
      success: true,
      message: "Clearview data refreshed with tiered analysis",
      deepDiveCount: deepDiveStories.length,
      quickTakeCount: quickTakeStories.length,
      totalStories: allStories.length,
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
