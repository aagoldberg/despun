import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { saveClearviewData, initClearviewTable, isDBAvailable } from "@/lib/db";

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

  console.log(`Fetched ${headlines.length} unique headlines from ${FEED_SOURCES.length} sources`);
  return headlines;
}

async function clusterAndAnalyze(headlines: RawHeadline[]) {
  if (!client) {
    throw new Error("LLM not available");
  }

  const headlinesSummary = headlines
    .map((h, i) => `[${i}] ${h.source} (${h.lean}): "${h.title}"`)
    .join("\n");

  const prompt = `You are analyzing today's news headlines from sources across the political spectrum to help readers understand what's actually happening vs how stories are being framed.

Here are today's headlines:

${headlinesSummary}

Your task:
1. Identify the TOP 3-5 major news stories that multiple sources are covering (group related headlines)
2. For each story, provide:
   - A neutral, factual summary of what actually happened
   - How each source is framing/spinning the story
   - What manipulation techniques (if any) each source is using
   - The key perspectives from different political viewpoints
   - CRITICAL: Identify if there's scientific/expert consensus on the underlying facts
   - Distinguish between factual disputes vs policy/values debates
   - WHY each side cares about this issue (psychological/political motivations)

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
          "framing": "How they're framing/spinning this story",
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
      "debateQuestion": "The actual question being debated (e.g., 'Should vaccines be mandated?' not 'Are vaccines safe?')",
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
          "coreValue": "The underlying value at stake (equality, fairness, protection, progress, etc.)",
          "motivation": "Plain-language explanation of why this matters to them - write like you're explaining to a friend",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "What emotion this activates (fear, hope, anger, pride, moral outrage, etc.)"
        },
        "right": {
          "coreValue": "The underlying value at stake (liberty, tradition, security, order, etc.)",
          "motivation": "Plain-language explanation of why this matters to them - write like you're explaining to a friend",
          "stance": "offensive|defensive|mobilizing",
          "emotionalAppeal": "What emotion this activates"
        },
        "bottomLine": "One sentence explaining what this fight is really about at its core"
      },
      "deeperAnalysis": {
        "unstatedConcerns": {
          "left": ["Concerns driving the left that aren't openly discussed - the quiet parts"],
          "right": ["Concerns driving the right that aren't openly discussed - the quiet parts"]
        },
        "economicDimension": "Economic anxieties and interests at play that don't fit neatly into the political framing",
        "culturalDimension": "Cultural/identity concerns beneath the surface - what people feel but won't say",
        "politicalGame": "How politicians and media are exploiting this issue for tribal gain - be honest and specific",
        "whatGetsIgnored": "Nuances, solutions, or common ground that gets ignored because it doesn't fit the narrative"
      }
    }
  ]
}

CRITICAL GUIDELINES:
- Only include stories covered by 2+ sources
- Be genuinely neutral in your summaries
- Identify manipulation techniques like: loaded language, fear-mongering, omission of context, false equivalence, appeal to emotion, etc.
- Include the actual URLs from the headlines data
- If a story only has one source, skip it
- REQUIRED: Every story MUST include the expertConsensus object - never omit it

EXPERT CONSENSUS RULES:
- Identify the most relevant type of expert consensus for each story:
  - "scientific": Medical, climate, physics, biology (sources: CDC, WHO, peer-reviewed journals)
  - "legal": Constitutional law, court rulings (sources: Supreme Court, legal scholars, bar associations)
  - "historical": What historians document happened (sources: historians, archives, documentation)
  - "economic": Economic effects, trade, fiscal policy (sources: CBO, economists, Federal Reserve)
  - "intelligence": National security, foreign interference (sources: FBI, CIA, DNI assessments)
  - "statistical": Crime rates, demographics, measurable data (sources: BLS, Census, FBI UCR)
  - "professional": Industry standards, best practices (sources: professional associations)
  - "international": International law, treaties (sources: UN, ICC, international courts)
  - "none": No clear expert domain applies or genuinely contested among experts
- If experts broadly agree, set exists to true and state the consensus clearly
- Include "dissent" only if there's a notable minority expert view worth mentioning
- debateType should be:
  - "factual" if the debate is about what happened/is true
  - "policy" if the facts are agreed but the debate is about what to do
  - "values" if it's about competing moral/ethical priorities
  - "mixed" if it involves multiple types
- For factualDisputes, honestly assess whether claims are supported by evidence
- evidenceStatus "misleading" means the claim contains some truth but is framed deceptively
- Don't create false balance: if one side's claims contradict expert consensus, say so

WHY IT MATTERS - POLITICAL PSYCHOLOGY RULES:
- REQUIRED: Every story MUST include the whyItMatters object
- Write motivations in plain, accessible language - like explaining to a smart friend who doesn't follow politics
- Use moral foundations theory as a guide:
  - Left typically prioritizes: Care/Harm, Fairness/Equality, Liberty from oppression
  - Right typically prioritizes: Loyalty/Tradition, Authority/Stability, Sanctity/Purity, Liberty from government
- Stance meanings:
  - "offensive" = They're pushing for change, trying to advance their position
  - "defensive" = They're protecting something they feel is under threat
  - "mobilizing" = They're rallying their base, making this a tribal identity issue
- emotionalAppeal should identify the primary emotion being activated (fear, anger, hope, pride, disgust, moral outrage, anxiety, righteous indignation)
- bottomLine should cut through the noise and state what this fight is REALLY about in one honest sentence
- Be empathetic to both sides - help readers understand WHY reasonable people disagree, not just THAT they disagree

DEEPER ANALYSIS - THE REAL GAME:
- REQUIRED: Every story MUST include the deeperAnalysis object
- unstatedConcerns: What's REALLY driving each side that they won't say openly?
  - Left example: "Fear that enforcement is selectively racist" or "Worry that cruelty is the point"
  - Right example: "Anxiety about cultural/demographic change" or "Feeling that elites dismiss their concerns"
- economicDimension: What economic interests or anxieties are at play? Who gains, who loses economically?
- culturalDimension: What identity/cultural anxieties exist beneath the policy debate? Be honest about what people feel but won't say
- politicalGame: Be BLUNT about how politicians and media exploit this issue. Who benefits from keeping the fight going? Why doesn't it get solved?
- whatGetsIgnored: What nuance, common ground, or practical solutions get ignored because they don't fit the tribal narrative?
- Write this section like you're being brutally honest with a friend about how the game really works`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse analysis");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const stories = parsed.stories || [];

  // Log which stories have whyItMatters
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
    console.log("Cron: Starting Clearview refresh...");

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
    console.log(`Cron: Fetched ${headlines.length} headlines`);

    if (headlines.length < 5) {
      return NextResponse.json(
        { success: false, error: "Not enough headlines" },
        { status: 503 }
      );
    }

    // Generate fresh analysis
    const stories = await clusterAndAnalyze(headlines);
    console.log(`Cron: Generated ${stories.length} story clusters`);

    // Save to database
    await saveClearviewData(stories);
    console.log("Cron: Saved to database");

    return NextResponse.json({
      success: true,
      message: "Clearview data refreshed",
      storiesCount: stories.length,
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
