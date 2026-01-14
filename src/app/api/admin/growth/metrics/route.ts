import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import {
  getGrowthMetrics,
  getRetentionCohorts,
  getNewsletterStats,
  initAnalyticsTables,
} from "@/lib/analytics-db";

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

    const [growthMetrics, retentionCohorts, newsletterStats] = await Promise.all([
      getGrowthMetrics(days),
      getRetentionCohorts(8),
      getNewsletterStats(days),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        aarrr: growthMetrics,
        retentionCohorts,
        newsletter: newsletterStats,
      },
    });
  } catch (error) {
    console.error("Growth metrics API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch growth data" },
      { status: 500 }
    );
  }
}
