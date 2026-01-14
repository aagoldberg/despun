import { NextRequest, NextResponse } from "next/server";
import { saveEvent, initAnalyticsTables } from "@/lib/analytics-db";

// Rate limiting map (in-memory, per-instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // events per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Ensure tables exist (lazy initialization)
let tablesInitialized = false;

async function ensureTables(): Promise<void> {
  if (!tablesInitialized && process.env.DATABASE_URL) {
    try {
      await initAnalyticsTables();
      tablesInitialized = true;
    } catch (error) {
      console.error("Failed to initialize analytics tables:", error);
    }
  }
}

interface TrackingPayload {
  event_type: string;
  session_id: string;
  visitor_id?: string;
  page_path?: string;
  story_id?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  scroll_depth?: number;
  time_on_page?: number;
  metadata?: Record<string, unknown>;
}

const VALID_EVENT_TYPES = [
  "pageview",
  "story_view",
  "story_expand",
  "source_click",
  "scroll_depth",
  "time_on_page",
  "newsletter_signup",
  "custom",
];

function validatePayload(data: unknown): data is TrackingPayload {
  if (!data || typeof data !== "object") return false;

  const payload = data as Record<string, unknown>;

  // Required fields
  if (typeof payload.event_type !== "string") return false;
  if (typeof payload.session_id !== "string") return false;

  // Validate event type
  if (!VALID_EVENT_TYPES.includes(payload.event_type)) return false;

  // Optional field type validation
  if (payload.visitor_id !== undefined && typeof payload.visitor_id !== "string") return false;
  if (payload.page_path !== undefined && typeof payload.page_path !== "string") return false;
  if (payload.story_id !== undefined && typeof payload.story_id !== "string") return false;
  if (payload.scroll_depth !== undefined && typeof payload.scroll_depth !== "number") return false;
  if (payload.time_on_page !== undefined && typeof payload.time_on_page !== "number") return false;

  return true;
}

function sanitizeString(str: string | undefined, maxLength: number = 500): string | undefined {
  if (!str) return undefined;
  return str.slice(0, maxLength).replace(/[<>]/g, "");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0].trim() || "unknown";

    // Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limited" },
        { status: 429 }
      );
    }

    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Validate payload
    if (!validatePayload(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Ensure database tables exist
    await ensureTables();

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      // Silently succeed if no database configured (development mode)
      return NextResponse.json({ success: true });
    }

    // Save event with sanitized data
    await saveEvent({
      event_type: body.event_type,
      session_id: sanitizeString(body.session_id, 64) || "",
      visitor_id: sanitizeString(body.visitor_id, 64),
      page_path: sanitizeString(body.page_path, 255),
      story_id: sanitizeString(body.story_id, 100),
      referrer: sanitizeString(body.referrer, 500),
      utm_source: sanitizeString(body.utm_source, 100),
      utm_medium: sanitizeString(body.utm_medium, 100),
      utm_campaign: sanitizeString(body.utm_campaign, 100),
      device_type: sanitizeString(body.device_type, 20),
      browser: sanitizeString(body.browser, 50),
      os: sanitizeString(body.os, 50),
      scroll_depth: body.scroll_depth,
      time_on_page: body.time_on_page,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track API error:", error);
    // Return success to not break client
    return NextResponse.json({ success: true });
  }
}

// Also support OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
