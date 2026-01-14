import { NextRequest, NextResponse } from "next/server";

export interface AdminAuthResult {
  authorized: boolean;
  error?: string;
}

/**
 * Verify admin authorization from request headers.
 * Accepts Bearer token in Authorization header matching ADMIN_KEY env var.
 */
export function verifyAdminAuth(request: NextRequest): AdminAuthResult {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return {
      authorized: false,
      error: "Admin authentication not configured",
    };
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      authorized: false,
      error: "Missing authorization header",
    };
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== adminKey) {
    return {
      authorized: false,
      error: "Invalid admin key",
    };
  }

  return { authorized: true };
}

/**
 * Verify admin key directly (for login endpoint).
 */
export function verifyAdminKey(key: string): boolean {
  const adminKey = process.env.ADMIN_KEY;
  return !!adminKey && key === adminKey;
}

/**
 * Helper to create unauthorized response.
 */
export function unauthorizedResponse(error: string = "Unauthorized"): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

/**
 * Wrapper for admin route handlers that require authentication.
 */
export function withAdminAuth<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T | { success: false; error: string }>> {
  return async (request: NextRequest) => {
    const auth = verifyAdminAuth(request);

    if (!auth.authorized) {
      return unauthorizedResponse(auth.error) as NextResponse<{ success: false; error: string }>;
    }

    return handler(request);
  };
}

/**
 * Generate a simple session token for client-side storage.
 * This is a simplified approach - in production you might want JWT or similar.
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Cookie name for admin session.
 */
export const ADMIN_SESSION_COOKIE = "despun_admin_session";

/**
 * Create response with admin session cookie.
 */
export function setAdminSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/admin",
  });
  return response;
}

/**
 * Clear admin session cookie.
 */
export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
