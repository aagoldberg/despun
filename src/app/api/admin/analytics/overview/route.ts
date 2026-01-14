import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import {
  getOverviewMetrics,
  getTrafficByDay,
  getRealtimeVisitors,
  initAnalyticsTables,
} from "@/lib/analytics-db";

// Ensure tables exist
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
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    const [metrics, trafficByDay, realtimeVisitors] = await Promise.all([
      getOverviewMetrics(days),
      getTrafficByDay(days),
      getRealtimeVisitors(30),
    ]);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          pageviews: {
            value: metrics.pageviews,
            change: calcChange(metrics.pageviews, metrics.previousPageviews),
          },
          uniqueVisitors: {
            value: metrics.uniqueVisitors,
            change: calcChange(metrics.uniqueVisitors, metrics.previousUniqueVisitors),
          },
          sessions: {
            value: metrics.sessions,
            change: calcChange(metrics.sessions, metrics.previousSessions),
          },
          avgSessionDuration: {
            value: Math.round(metrics.avgSessionDuration),
            change: calcChange(metrics.avgSessionDuration, metrics.previousAvgSessionDuration),
          },
          bounceRate: {
            value: Math.round(metrics.bounceRate * 10) / 10,
            change: calcChange(metrics.bounceRate, metrics.previousBounceRate),
          },
          storyExpands: {
            value: metrics.storyExpands,
            change: calcChange(metrics.storyExpands, metrics.previousStoryExpands),
          },
        },
        trafficByDay,
        realtimeVisitors,
      },
    });
  } catch (error) {
    console.error("Overview API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
}
