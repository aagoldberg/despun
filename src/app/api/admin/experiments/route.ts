import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";
import {
  getABTests,
  createABTest,
  updateABTestStatus,
  deleteABTest,
  getABTestById,
  getABTestResults,
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

    const tests = await getABTests();

    return NextResponse.json({
      success: true,
      data: { tests },
    });
  } catch (error) {
    console.error("Experiments API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch experiments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await ensureTables();

    const body = await request.json();

    const { test_name, test_description, variants, target_metric, traffic_allocation } = body;

    if (!test_name || !variants || !target_metric) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const id = await createABTest({
      test_name,
      test_description,
      variants,
      target_metric,
      traffic_allocation: traffic_allocation || 0.5,
      status: "draft",
    });

    if (id === null) {
      return NextResponse.json(
        { success: false, error: "Failed to create test" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Create experiment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await ensureTables();

    const body = await request.json();
    const { id, status, winner_variant } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validStatuses = ["draft", "running", "paused", "completed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const success = await updateABTestStatus(id, status, winner_variant);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to update experiment" },
        { status: 500 }
      );
    }

    const updatedTest = await getABTestById(id);

    return NextResponse.json({
      success: true,
      data: { test: updatedTest },
    });
  } catch (error) {
    console.error("Update experiment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update experiment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    await ensureTables();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing test ID" },
        { status: 400 }
      );
    }

    const success = await deleteABTest(parseInt(id, 10));

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete experiment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete experiment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete experiment" },
      { status: 500 }
    );
  }
}
