import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import { getTopStories, initAnalyticsTables } from "@/lib/analytics-db";

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
    const limitParam = url.searchParams.get("limit");
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const topStories = await getTopStories(days, limit);

    // Calculate aggregated metrics
    const totalViews = topStories.reduce((sum, s) => sum + s.views, 0);
    const totalExpands = topStories.reduce((sum, s) => sum + s.expands, 0);
    const totalSourceClicks = topStories.reduce((sum, s) => sum + s.sourceClicks, 0);
    const avgExpandRate = topStories.length > 0
      ? topStories.reduce((sum, s) => sum + s.expandRate, 0) / topStories.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        stories: topStories,
        summary: {
          totalViews,
          totalExpands,
          totalSourceClicks,
          avgExpandRate: Math.round(avgExpandRate * 10) / 10,
          storyCount: topStories.length,
        },
      },
    });
  } catch (error) {
    console.error("Content performance API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content data" },
      { status: 500 }
    );
  }
}
