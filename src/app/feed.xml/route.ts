import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://despun.news";

interface StoryCluster {
  id: string;
  topic: string;
  summary?: string;
  whatHappened: string;
  keyTakeaway?: string;
}

interface CacheEntry {
  stories: StoryCluster[];
  generatedAt: string;
}

export async function GET() {
  try {
    // Fetch stories from the clearview API
    const response = await fetch(`${SITE_URL}/api/clearview`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    let stories: StoryCluster[] = [];
    let generatedAt = new Date().toISOString();

    if (response.ok) {
      const data: { success: boolean; stories?: StoryCluster[]; generatedAt?: string } = await response.json();
      if (data.success && data.stories) {
        stories = data.stories;
        generatedAt = data.generatedAt || generatedAt;
      }
    }

    const rssDate = new Date(generatedAt).toUTCString();

    const rssItems = stories
      .map((story) => {
        const slug = encodeURIComponent(
          story.topic
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60)
        );
        const storyUrl = `${SITE_URL}/story/${story.id}/${slug}`;
        const description = story.whatHappened || story.summary || story.keyTakeaway || "";

        return `
    <item>
      <title><![CDATA[${story.topic}]]></title>
      <link>${storyUrl}</link>
      <guid isPermaLink="true">${storyUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${rssDate}</pubDate>
    </item>`;
      })
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Despun - News Without the Spin</title>
    <link>${SITE_URL}</link>
    <description>We synthesize today's top stories from across the political spectrum to extract core facts and reveal framing differences.</description>
    <language>en-us</language>
    <lastBuildDate>${rssDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-image.svg</url>
      <title>Despun</title>
      <link>${SITE_URL}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);

    // Return empty feed on error
    const emptyRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Despun - News Without the Spin</title>
    <link>${SITE_URL}</link>
    <description>We synthesize today's top stories from across the political spectrum.</description>
    <language>en-us</language>
  </channel>
</rss>`;

    return new NextResponse(emptyRss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
}
