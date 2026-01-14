import { Metadata } from "next";
import { notFound } from "next/navigation";
import StoryPageClient from "./StoryPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://despun.news";

interface StoryCluster {
  id: string;
  topic: string;
  summary?: string;
  whatHappened: string;
  keyTakeaway?: string;
  sources: Array<{
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques: string[];
  }>;
  perspectives: Array<{
    lean: string;
    viewpoint: string;
  }>;
  expertConsensus?: {
    type: string;
    exists: boolean;
    statement?: string;
    confidenceLevel?: string;
    sources?: string[];
    dissent?: string;
  };
  debateType?: string;
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: Array<{
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: string;
  }>;
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

async function getStory(id: string): Promise<{ story: StoryCluster | null; generatedAt: string | null }> {
  try {
    const response = await fetch(`${SITE_URL}/api/clearview`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return { story: null, generatedAt: null };
    }

    const data = await response.json();

    if (!data.success || !data.stories) {
      return { story: null, generatedAt: null };
    }

    const story = data.stories.find((s: StoryCluster) => s.id === id) || null;
    return { story, generatedAt: data.generatedAt || null };
  } catch (error) {
    console.error("Error fetching story:", error);
    return { story: null, generatedAt: null };
  }
}

interface PageProps {
  params: Promise<{ id: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { story } = await getStory(id);

  if (!story) {
    return {
      title: "Story Not Found | Despun",
      description: "This story could not be found.",
    };
  }

  const description = story.whatHappened || story.summary || story.keyTakeaway || "";

  return {
    title: `${story.topic} | Despun`,
    description: description.slice(0, 160),
    openGraph: {
      type: "article",
      title: story.topic,
      description: description.slice(0, 160),
      url: `${SITE_URL}/story/${story.id}/${encodeURIComponent(story.topic.toLowerCase().replace(/\s+/g, "-").slice(0, 60))}`,
      siteName: "Despun",
      images: [
        {
          url: "/og-image.svg",
          width: 1200,
          height: 630,
          alt: story.topic,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: story.topic,
      description: description.slice(0, 160),
      images: ["/og-image.svg"],
    },
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const { story, generatedAt } = await getStory(id);

  if (!story) {
    notFound();
  }

  return <StoryPageClient story={story} generatedAt={generatedAt} />;
}
