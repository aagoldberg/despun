import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import { getOverviewMetrics, initAnalyticsTables } from "@/lib/analytics-db";

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

    const metrics = await getOverviewMetrics(days);

    return NextResponse.json({
      success: true,
      data: {
        sessions: metrics.sessions,
        avgSessionDuration: Math.round(metrics.avgSessionDuration),
        bounceRate: Math.round(metrics.bounceRate * 10) / 10,
        pageviews: metrics.pageviews,
        pagesPerSession: metrics.sessions > 0
          ? Math.round((metrics.pageviews / metrics.sessions) * 10) / 10
          : 0,
        storyExpands: metrics.storyExpands,
        engagementRate: metrics.pageviews > 0
          ? Math.round((metrics.storyExpands / metrics.pageviews) * 100 * 10) / 10
          : 0,
      },
    });
  } catch (error) {
    console.error("User behavior API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user behavior data" },
      { status: 500 }
    );
  }
}
