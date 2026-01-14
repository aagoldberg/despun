import { NextRequest, NextResponse } from "next/server";
import { verifyAdminKey } from "@/lib/adminAuth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing admin key" },
        { status: 400 }
      );
    }

    if (!verifyAdminKey(key)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin key" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
