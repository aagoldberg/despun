import { NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { getClearviewData, saveClearviewData, initClearviewTable, isDBAvailable, getArchivedClearviewData } from "@/lib/db";
import { extractArticles, ExtractedArticle } from "@/lib/extract";

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

// Story analysis - full Deep Dive format
interface StoryCluster {
  id: string;
  topic: string;
  tier: "deep-dive" | "quick-take";
  summary: string;
  whatHappened?: string; // Deep Dive only
  sources: {
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques?: string[]; // Deep Dive only
  }[];
  perspectives: {
    lean: string;
    viewpoint: string;
  }[];
  keyTakeaway: string;
  category: "politics" | "economy" | "international" | "tech" | "culture" | "other";
  // Deep Dive only fields
  expertConsensus?: {
    type: "scientific" | "legal" | "historical" | "economic" | "intelligence" | "statistical" | "professional" | "international" | "none";
    exists: boolean;
    statement?: string;
    confidenceLevel: "high" | "moderate" | "low" | "contested";
    sources?: string[];
    dissent?: string;
  };
  debateType?: "factual" | "policy" | "values" | "mixed";
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: {
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: "supported" | "mixed" | "unsupported" | "misleading";
  }[];
  whyItMatters?: {
    left: {
      coreValue: string;
      motivation: string;
      stance: "offensive" | "defensive" | "mobilizing";
      emotionalAppeal: string;
    };
    right: {
      coreValue: string;
      motivation: string;
      stance: "offensive" | "defensive" | "mobilizing";
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

interface ArchivedBriefing {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stories: any[];
  generatedAt: string;
}

interface ClearviewResponse {
  success: boolean;
  stories: StoryCluster[];
  deepDiveCount: number;
  quickTakeCount: number;
  generatedAt: string;
  archived?: ArchivedBriefing[];
  error?: string;
}

// Cache duration in hours
const CACHE_HOURS = 4;

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

  console.log(`Fetched ${headlines.length} unique headlines from ${FEED_SOURCES.length} sources`);
  return headlines;
}

// Enhanced cluster with metrics for tier selection
interface HeadlineCluster {
  topic: string;
  headlineIndices: number[];
  sourceCount: number;
  spectrumSpread: number; // How many different political leans (1-7)
  category: "politics" | "economy" | "international" | "tech" | "culture" | "other";
}

/**
 * Phase 1: Cluster headlines with metrics for tier selection
 */
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

interface TieredClusters {
  deepDives: HeadlineCluster[];
  quickTakes: HeadlineCluster[];
}

/**
 * Select which clusters get Deep Dive vs Quick Take treatment
 */
function selectTiers(clusters: HeadlineCluster[]): TieredClusters {
  const deepDives: HeadlineCluster[] = [];
  const quickTakes: HeadlineCluster[] = [];

  // Sort by coverage score (sourceCount + spectrumSpread)
  const sorted = [...clusters].sort((a, b) => {
    const scoreA = a.sourceCount + a.spectrumSpread;
    const scoreB = b.sourceCount + b.spectrumSpread;
    return scoreB - scoreA;
  });

  for (const cluster of sorted) {
    // Deep Dive if: sourceCount >= 4 AND spectrumSpread >= 3
    if (cluster.sourceCount >= 4 && cluster.spectrumSpread >= 3) {
      deepDives.push(cluster);
    } else {
      quickTakes.push(cluster);
    }
  }

  // Category floor: ensure at least one Deep Dive (or promote top Quick Take) from key categories
  const keyCategories: Array<"politics" | "economy" | "international"> = ["politics", "economy", "international"];

  for (const category of keyCategories) {
    const hasDeepDive = deepDives.some(c => c.category === category);
    if (!hasDeepDive) {
      // Find top Quick Take from this category to promote
      const idx = quickTakes.findIndex(c => c.category === category);
      if (idx !== -1) {
        const promoted = quickTakes.splice(idx, 1)[0];
        deepDives.push(promoted);
        console.log(`Promoted "${promoted.topic}" to Deep Dive for category coverage (${category})`);
      }
    }
  }

  // Cap Deep Dives at 8 for cost control
  if (deepDives.length > 8) {
    const demoted = deepDives.splice(8);
    quickTakes.unshift(...demoted);
    console.log(`Demoted ${demoted.length} stories to Quick Take (cap at 8 Deep Dives)`);
  }

  return { deepDives, quickTakes };
}

interface ArticleWithMeta {
  source: string;
  lean: string;
  title: string;
  url: string;
  articleText: string;
  extractionSuccess: boolean;
}

/**
 * Extract full articles for Deep Dive clusters only
 */
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

  console.log(`Extracting ${allUrls.length} articles for ${clusters.length} Deep Dive clusters...`);

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

/**
 * Analyze Deep Dive stories with full article content
 */
async function analyzeDeepDives(
  storyArticles: Map<string, ArticleWithMeta[]>,
  clusters: HeadlineCluster[]
): Promise<StoryCluster[]> {
  if (!client || storyArticles.size === 0) {
    return [];
  }

  let storySummaries = "";
  let storyIndex = 1;

  // Create a map for quick category lookup
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
      console.error("Deep Dive JSON parse failed");
      throw parseError;
    }
  }

  const stories = (parsed.stories || []).map((s: StoryCluster) => ({
    ...s,
    tier: "deep-dive" as const,
  }));

  console.log(`Analyzed ${stories.length} Deep Dive stories`);
  return stories;
}

/**
 * Analyze Quick Take stories (headlines only, lighter analysis)
 */
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
      console.error("Quick Take JSON parse failed");
      throw parseError;
    }
  }

  const stories = (parsed.stories || []).map((s: StoryCluster) => ({
    ...s,
    tier: "quick-take" as const,
  }));

  console.log(`Analyzed ${stories.length} Quick Take stories`);
  return stories;
}

export async function GET() {
  try {
    const dbAvailable = await isDBAvailable();
    let archived: ArchivedBriefing[] = [];

    if (dbAvailable) {
      await initClearviewTable();
      const cached = await getClearviewData(CACHE_HOURS);

      if (cached && cached.stories.length > 0) {
        console.log("Returning cached Clearview data from DB");

        const archivedData = await getArchivedClearviewData(cached.id);
        archived = archivedData.map(a => ({
          stories: a.stories,
          generatedAt: a.generatedAt,
        }));

        const deepDiveCount = cached.stories.filter((s: { tier?: string }) => s.tier === "deep-dive").length;
        const quickTakeCount = cached.stories.filter((s: { tier?: string }) => s.tier === "quick-take").length;

        return NextResponse.json({
          success: true,
          stories: cached.stories,
          deepDiveCount,
          quickTakeCount,
          generatedAt: cached.generatedAt,
          archived,
          cached: true,
        });
      }
    }

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Analysis service unavailable" },
        { status: 503 }
      );
    }

    console.log("Generating fresh Clearview analysis...");

    // Fetch all headlines
    const headlines = await fetchAllHeadlines();

    if (headlines.length < 5) {
      return NextResponse.json(
        { success: false, error: "Not enough headlines available" },
        { status: 503 }
      );
    }

    // Phase 1: Cluster headlines with metrics
    console.log("Phase 1: Clustering headlines with metrics...");
    const clusters = await clusterHeadlines(headlines);
    console.log(`Found ${clusters.length} total story clusters`);

    // Phase 2: Select tiers
    console.log("Phase 2: Selecting tiers...");
    const { deepDives, quickTakes } = selectTiers(clusters);
    console.log(`Selected ${deepDives.length} Deep Dives, ${quickTakes.length} Quick Takes`);

    // Phase 3: Extract articles for Deep Dives only
    console.log("Phase 3: Extracting articles for Deep Dives...");
    const deepDiveArticles = await extractDeepDiveArticles(headlines, deepDives);

    let successCount = 0;
    let totalCount = 0;
    for (const articles of deepDiveArticles.values()) {
      for (const article of articles) {
        totalCount++;
        if (article.extractionSuccess) successCount++;
      }
    }
    console.log(`Extracted ${successCount}/${totalCount} articles successfully`);

    // Phase 4: Analyze both tiers (can run in parallel)
    console.log("Phase 4: Analyzing stories...");
    const [deepDiveStories, quickTakeStories] = await Promise.all([
      analyzeDeepDives(deepDiveArticles, deepDives),
      analyzeQuickTakes(headlines, quickTakes),
    ]);

    // Combine results: Deep Dives first, then Quick Takes
    const allStories = [...deepDiveStories, ...quickTakeStories];

    // Save to database
    if (dbAvailable) {
      await saveClearviewData(allStories);
      console.log("Saved Clearview data to DB");

      const archivedData = await getArchivedClearviewData();
      archived = archivedData.map(a => ({
        stories: a.stories,
        generatedAt: a.generatedAt,
      }));
    }

    const response: ClearviewResponse = {
      success: true,
      stories: allStories,
      deepDiveCount: deepDiveStories.length,
      quickTakeCount: quickTakeStories.length,
      generatedAt: new Date().toISOString(),
      archived,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Clearview API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed"
      },
      { status: 500 }
    );
  }
}
