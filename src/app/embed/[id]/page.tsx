import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://despun.news";

interface Story {
  id: string;
  topic: string;
  whatHappened: string;
  sources: Array<{ lean: string }>;
}

async function getStory(id: string): Promise<Story | null> {
  try {
    const response = await fetch(`${SITE_URL}/api/clearview`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success || !data.stories) return null;

    return data.stories.find((s: Story) => s.id === id) || null;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Despun Embed",
  robots: "noindex, nofollow",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmbedPage({ params }: PageProps) {
  const { id } = await params;
  const story = await getStory(id);

  if (!story) {
    return (
      <div className="p-4 text-center text-zinc-500 bg-zinc-50 rounded-lg">
        Story not found
      </div>
    );
  }

  // Calculate bias distribution
  const counts = { left: 0, center: 0, right: 0 };
  story.sources.forEach((s) => {
    const lean = s.lean.toLowerCase();
    if (lean.includes("left")) counts.left++;
    else if (lean.includes("right")) counts.right++;
    else counts.center++;
  });
  const total = story.sources.length;

  const slug = story.topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return (
    <html>
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #18181b;
          }
          .card {
            background: white;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 16px;
            max-width: 400px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .badge {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 8px;
            background: #f4f4f5;
            color: #71717a;
            border-radius: 4px;
          }
          .spectrum {
            display: flex;
            height: 6px;
            width: 80px;
            border-radius: 3px;
            overflow: hidden;
            background: #f4f4f5;
          }
          .spectrum-left { background: #3b82f6; }
          .spectrum-center { background: #71717a; }
          .spectrum-right { background: #f43f5e; }
          .topic {
            font-size: 16px;
            font-weight: 600;
            color: #18181b;
            margin-bottom: 8px;
            text-decoration: none;
          }
          .topic:hover { color: #6366f1; }
          .summary {
            font-size: 13px;
            color: #52525b;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .footer {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f4f4f5;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .branding {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #71717a;
            text-decoration: none;
          }
          .branding:hover { color: #18181b; }
          .logo {
            width: 16px;
            height: 16px;
            background: #18181b;
            border-radius: 3px;
          }
          .sources {
            font-size: 11px;
            color: #a1a1aa;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="header">
            <span className="badge">Analysis</span>
            <div className="spectrum">
              <div className="spectrum-left" style={{ width: `${(counts.left / total) * 100}%` }} />
              <div className="spectrum-center" style={{ width: `${(counts.center / total) * 100}%` }} />
              <div className="spectrum-right" style={{ width: `${(counts.right / total) * 100}%` }} />
            </div>
          </div>

          <a
            href={`${SITE_URL}/story/${story.id}/${slug}`}
            target="_blank"
            rel="noopener"
            className="topic"
          >
            {story.topic}
          </a>

          <p className="summary">{story.whatHappened}</p>

          <div className="footer">
            <a href={SITE_URL} target="_blank" rel="noopener" className="branding">
              <div className="logo" />
              <span>Powered by Despun</span>
            </a>
            <span className="sources">{total} sources</span>
          </div>
        </div>
      </body>
    </html>
  );
}
