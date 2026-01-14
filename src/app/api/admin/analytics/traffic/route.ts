import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import {
  getTrafficByDay,
  getTrafficSources,
  getDeviceBreakdown,
  getGeoBreakdown,
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

    const [trafficByDay, trafficSources, deviceBreakdown, geoBreakdown] = await Promise.all([
      getTrafficByDay(days),
      getTrafficSources(days),
      getDeviceBreakdown(days),
      getGeoBreakdown(days),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trafficByDay,
        trafficSources,
        deviceBreakdown,
        geoBreakdown,
      },
    });
  } catch (error) {
    console.error("Traffic API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch traffic data" },
      { status: 500 }
    );
  }
}
