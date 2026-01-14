/**
 * Client-side analytics tracking library for Despun.
 * Provides session management, event tracking, and scroll/time monitoring.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const VISITOR_ID_KEY = "despun_visitor_id";
const SESSION_ID_KEY = "despun_session_id";
const SESSION_START_KEY = "despun_session_start";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const TRACK_ENDPOINT = "/api/track";

// ============================================================================
// ID GENERATION
// ============================================================================

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// ============================================================================
// SESSION & VISITOR MANAGEMENT
// ============================================================================

/**
 * Get or create a persistent visitor ID.
 * Stored in localStorage for cross-session identification.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

/**
 * Get or create a session ID.
 * Sessions expire after 30 minutes of inactivity.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const now = Date.now();
  const sessionStart = sessionStorage.getItem(SESSION_START_KEY);
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  // Check if session has expired
  if (sessionStart && now - parseInt(sessionStart, 10) > SESSION_TIMEOUT) {
    sessionId = null;
  }

  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, now.toString());
  } else {
    // Refresh session timestamp on activity
    sessionStorage.setItem(SESSION_START_KEY, now.toString());
  }

  return sessionId;
}

/**
 * Check if this is a return visitor.
 */
export function isReturnVisitor(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VISITOR_ID_KEY) !== null;
}

// ============================================================================
// UTM PARAMETERS
// ============================================================================

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Extract UTM parameters from current URL.
 */
export function getUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_term: params.get("utm_term") || undefined,
    utm_content: params.get("utm_content") || undefined,
  };
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

interface DeviceInfo {
  device_type: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
}

/**
 * Basic device detection from user agent.
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return { device_type: "desktop", browser: "unknown", os: "unknown" };
  }

  const ua = navigator.userAgent.toLowerCase();

  // Device type detection
  let device_type: "desktop" | "mobile" | "tablet" = "desktop";
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device_type = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    device_type = "mobile";
  }

  // Browser detection
  let browser = "unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // OS detection
  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return { device_type, browser, os };
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

interface TrackEventData {
  event_type: string;
  page_path?: string;
  story_id?: string;
  scroll_depth?: number;
  time_on_page?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Send tracking event to the server.
 */
async function sendEvent(data: TrackEventData): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();

    const payload = {
      ...data,
      visitor_id: visitorId,
      session_id: sessionId,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      page_path: data.page_path || (typeof window !== "undefined" ? window.location.pathname : undefined),
      ...deviceInfo,
      ...utmParams,
    };

    // Use sendBeacon if available for better reliability on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TRACK_ENDPOINT, JSON.stringify(payload));
    } else {
      await fetch(TRACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't impact user experience
    console.debug("Tracking error:", error);
  }
}

/**
 * Track a page view.
 */
export function trackPageView(path?: string): void {
  sendEvent({
    event_type: "pageview",
    page_path: path || (typeof window !== "undefined" ? window.location.pathname : undefined),
  });
}

/**
 * Track a custom event.
 */
export function trackEvent(name: string, metadata?: Record<string, unknown>): void {
  sendEvent({
    event_type: name,
    metadata,
  });
}

/**
 * Track a story view (when story becomes visible).
 */
export function trackStoryView(storyId: string, topic?: string): void {
  sendEvent({
    event_type: "story_view",
    story_id: storyId,
    metadata: { topic },
  });
}

/**
 * Track a story expand (when user clicks to expand details).
 */
export function trackStoryExpand(storyId: string, topic?: string): void {
  sendEvent({
    event_type: "story_expand",
    story_id: storyId,
    metadata: { topic },
  });
}

/**
 * Track a source click (when user clicks on a news source link).
 */
export function trackSourceClick(storyId: string, sourceName: string, url: string): void {
  sendEvent({
    event_type: "source_click",
    story_id: storyId,
    metadata: { source_name: sourceName, url },
  });
}

/**
 * Track scroll depth.
 */
export function trackScrollDepth(depth: number): void {
  sendEvent({
    event_type: "scroll_depth",
    scroll_depth: depth,
  });
}

/**
 * Track time on page.
 */
export function trackTimeOnPage(seconds: number): void {
  sendEvent({
    event_type: "time_on_page",
    time_on_page: seconds,
  });
}

/**
 * Track newsletter signup.
 */
export function trackNewsletterSignup(source: string): void {
  sendEvent({
    event_type: "newsletter_signup",
    metadata: { signup_source: source },
  });
}

/**
 * Track share event.
 */
export function trackShare(storyId: string, platform: string, success: boolean): void {
  sendEvent({
    event_type: "share",
    story_id: storyId,
    metadata: { platform, success },
  });
}

// ============================================================================
// SCROLL DEPTH TRACKING
// ============================================================================

let maxScrollDepth = 0;
let scrollTrackingEnabled = false;
let scrollMilestones = new Set<number>();

/**
 * Initialize scroll depth tracking.
 * Tracks at 25%, 50%, 75%, and 100% milestones.
 */
export function initScrollTracking(): () => void {
  if (typeof window === "undefined" || scrollTrackingEnabled) {
    return () => {};
  }

  scrollTrackingEnabled = true;
  maxScrollDepth = 0;
  scrollMilestones = new Set<number>();

  const handleScroll = throttle(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;

      // Track milestones
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !scrollMilestones.has(milestone)) {
          scrollMilestones.add(milestone);
          trackScrollDepth(milestone);
        }
      }
    }
  }, 500);

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", handleScroll);
    scrollTrackingEnabled = false;
  };
}

// ============================================================================
// TIME ON PAGE TRACKING
// ============================================================================

let pageStartTime = 0;
let timeTrackingEnabled = false;

/**
 * Initialize time on page tracking.
 * Sends time when page becomes hidden or unloads.
 */
export function initTimeTracking(): () => void {
  if (typeof window === "undefined" || timeTrackingEnabled) {
    return () => {};
  }

  timeTrackingEnabled = true;
  pageStartTime = Date.now();

  const sendTimeOnPage = () => {
    const seconds = Math.round((Date.now() - pageStartTime) / 1000);
    if (seconds > 0) {
      trackTimeOnPage(seconds);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      sendTimeOnPage();
    }
  };

  const handleBeforeUnload = () => {
    sendTimeOnPage();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    timeTrackingEnabled = false;
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Throttle function to limit execution rate.
 */
function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================================================
// ANALYTICS COMPONENT INITIALIZATION
// ============================================================================

/**
 * Initialize all tracking.
 * Call this once when the app loads.
 */
export function initTracking(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // Track initial page view
  trackPageView();

  // Initialize scroll and time tracking
  const cleanupScroll = initScrollTracking();
  const cleanupTime = initTimeTracking();

  return () => {
    cleanupScroll();
    cleanupTime();
  };
}
