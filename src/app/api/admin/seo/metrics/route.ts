import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import { getTrafficSources, initAnalyticsTables } from "@/lib/analytics-db";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await ensureTables();

    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    const trafficSources = await getTrafficSources(days);

    // Calculate organic vs total
    const organicSource = trafficSources.find((s) => s.source === "Organic Search");
    const totalVisitors = trafficSources.reduce((sum, s) => sum + s.visitors, 0);
    const organicVisitors = organicSource?.visitors || 0;
    const organicPercentage = totalVisitors > 0
      ? Math.round((organicVisitors / totalVisitors) * 100)
      : 0;

    // Placeholder data for features that would need external integrations
    return NextResponse.json({
      success: true,
      data: {
        organic: {
          visitors: organicVisitors,
          percentage: organicPercentage,
        },
        searchConsole: {
          available: false,
          message: "Connect Google Search Console for search metrics",
        },
        social: {
          available: false,
          message: "Social sharing tracking coming soon",
        },
        backlinks: {
          available: false,
          message: "Backlink tracking requires external integration",
        },
        tips: [
          "Add meta descriptions to improve click-through rates",
          "Ensure all pages have unique, descriptive titles",
          "Build quality backlinks through content partnerships",
          "Share stories on social media to increase reach",
          "Monitor Google Search Console for search performance",
        ],
      },
    });
  } catch (error) {
    console.error("SEO metrics API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SEO data" },
      { status: 500 }
    );
  }
}
