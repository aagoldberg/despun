import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://despun.news";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/saved`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.3,
    },
  ];

  // Try to fetch dynamic story pages
  try {
    const response = await fetch(`${SITE_URL}/api/clearview`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.stories) {
        const storyPages: MetadataRoute.Sitemap = data.stories.map(
          (story: { id: string; topic: string }) => {
            const slug = story.topic
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .slice(0, 60);

            return {
              url: `${SITE_URL}/story/${story.id}/${slug}`,
              lastModified: new Date(data.generatedAt || Date.now()),
              changeFrequency: "daily" as const,
              priority: 0.8,
            };
          }
        );

        return [...staticPages, ...storyPages];
      }
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return staticPages;
}
