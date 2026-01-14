import { NextRequest, NextResponse } from "next/server";
import { saveNewsletterSignup } from "@/lib/analytics-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source, visitorId, sessionId } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get UTM params from referer or request
    const referer = request.headers.get("referer") || "";
    const url = new URL(referer || request.url);

    const signup = {
      email: email.toLowerCase().trim(),
      signup_source: source || "homepage",
      referrer: referer || undefined,
      utm_source: url.searchParams.get("utm_source") || undefined,
      utm_medium: url.searchParams.get("utm_medium") || undefined,
      utm_campaign: url.searchParams.get("utm_campaign") || undefined,
      visitor_id: visitorId || undefined,
      session_id: sessionId || undefined,
    };

    const success = await saveNewsletterSignup(signup);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Successfully subscribed to the newsletter!",
      });
    } else {
      // Most likely duplicate email
      return NextResponse.json({
        success: false,
        error: "This email is already subscribed",
      }, { status: 409 });
    }
  } catch (error) {
    console.error("Newsletter signup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
