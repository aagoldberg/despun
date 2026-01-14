import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Lazy database connection (same pattern as db.ts)
let dbInstance: NeonQueryFunction<false, false> | null = null;

function getDb(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }
  if (!dbInstance) {
    dbInstance = neon(process.env.DATABASE_URL);
  }
  return dbInstance;
}

// Retry wrapper for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("fetch failed") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("socket disconnected"));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AnalyticsEvent {
  id?: number;
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
  country?: string;
  region?: string;
  city?: string;
  scroll_depth?: number;
  time_on_page?: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface Session {
  id?: number;
  session_id: string;
  visitor_id?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  page_count: number;
  stories_viewed: number;
  stories_expanded: number;
  sources_clicked: number;
  entry_page?: string;
  exit_page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  is_bounce: boolean;
  is_return_visitor: boolean;
}

export interface DailyMetrics {
  id?: number;
  date: string;
  pageviews: number;
  unique_visitors: number;
  sessions: number;
  new_visitors: number;
  return_visitors: number;
  avg_session_duration: number;
  avg_pages_per_session: number;
  bounce_rate: number;
  avg_scroll_depth: number;
  total_story_views: number;
  total_story_expands: number;
  total_source_clicks: number;
  traffic_sources: Record<string, number>;
  device_breakdown: Record<string, number>;
  geo_breakdown: Record<string, number>;
}

export interface StoryPerformance {
  id?: number;
  story_id: string;
  story_topic: string;
  date: string;
  views: number;
  unique_viewers: number;
  expands: number;
  expand_rate: number;
  avg_time_on_story: number;
  avg_scroll_depth: number;
  source_clicks: number;
  source_clicks_breakdown: Record<string, number>;
}

export interface NewsletterSignup {
  id?: number;
  email: string;
  signup_source?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  visitor_id?: string;
  session_id?: string;
  status: "active" | "unsubscribed" | "bounced";
  confirmed_at?: string;
  unsubscribed_at?: string;
  created_at?: string;
}

export interface ABTest {
  id?: number;
  test_name: string;
  test_description?: string;
  variants: { id: string; name: string }[];
  target_metric: string;
  traffic_allocation: number;
  status: "draft" | "running" | "paused" | "completed";
  started_at?: string;
  ended_at?: string;
  winner_variant?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ABTestResult {
  id?: number;
  test_id: number;
  variant_id: string;
  date: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  metrics?: Record<string, unknown>;
}

export interface SystemHealth {
  id?: number;
  timestamp: string;
  api_response_time_avg?: number;
  api_response_time_p95?: number;
  api_error_rate?: number;
  api_requests_total?: number;
  cache_hit_rate?: number;
  cache_size_mb?: number;
  rss_feeds_status?: Record<string, { status: string; last_fetch?: string; error?: string }>;
  rss_feeds_healthy?: number;
  rss_feeds_total?: number;
  llm_requests?: number;
  llm_avg_latency?: number;
  llm_errors?: number;
  llm_tokens_used?: number;
  db_query_time_avg?: number;
  db_connections_active?: number;
}

export interface SEOMetrics {
  id?: number;
  date: string;
  organic_visitors: number;
  organic_pageviews: number;
  search_impressions?: number;
  search_clicks?: number;
  avg_position?: number;
  social_shares?: Record<string, number>;
  backlinks_count?: number;
  referring_domains?: number;
  top_queries?: { query: string; impressions: number; clicks: number; position: number }[];
}

// ============================================================================
// TABLE INITIALIZATION
// ============================================================================

export async function initAnalyticsTables(): Promise<void> {
  const db = getDb();

  try {
    // Analytics Events Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        visitor_id VARCHAR(64),
        page_path VARCHAR(255),
        story_id VARCHAR(100),
        referrer VARCHAR(500),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country VARCHAR(2),
        region VARCHAR(100),
        city VARCHAR(100),
        scroll_depth INTEGER,
        time_on_page INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Sessions Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) UNIQUE NOT NULL,
        visitor_id VARCHAR(64),
        started_at TIMESTAMP NOT NULL,
        ended_at TIMESTAMP,
        duration_seconds INTEGER,
        page_count INTEGER DEFAULT 1,
        stories_viewed INTEGER DEFAULT 0,
        stories_expanded INTEGER DEFAULT 0,
        sources_clicked INTEGER DEFAULT 0,
        entry_page VARCHAR(255),
        exit_page VARCHAR(255),
        referrer VARCHAR(500),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country VARCHAR(2),
        is_bounce BOOLEAN DEFAULT FALSE,
        is_return_visitor BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Daily Metrics Table (pre-aggregated)
    await db`
      CREATE TABLE IF NOT EXISTS despun_daily_metrics (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        pageviews INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        sessions INTEGER DEFAULT 0,
        new_visitors INTEGER DEFAULT 0,
        return_visitors INTEGER DEFAULT 0,
        avg_session_duration DECIMAL(10,2),
        avg_pages_per_session DECIMAL(10,2),
        bounce_rate DECIMAL(5,2),
        avg_scroll_depth DECIMAL(5,2),
        total_story_views INTEGER DEFAULT 0,
        total_story_expands INTEGER DEFAULT 0,
        total_source_clicks INTEGER DEFAULT 0,
        traffic_sources JSONB,
        device_breakdown JSONB,
        geo_breakdown JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Story Performance Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_story_performance (
        id SERIAL PRIMARY KEY,
        story_id VARCHAR(100) NOT NULL,
        story_topic VARCHAR(500),
        date DATE NOT NULL,
        views INTEGER DEFAULT 0,
        unique_viewers INTEGER DEFAULT 0,
        expands INTEGER DEFAULT 0,
        expand_rate DECIMAL(5,2),
        avg_time_on_story DECIMAL(10,2),
        avg_scroll_depth DECIMAL(5,2),
        source_clicks INTEGER DEFAULT 0,
        source_clicks_breakdown JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(story_id, date)
      )
    `;

    // Newsletter Signups Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_newsletter_signups (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        signup_source VARCHAR(100),
        referrer VARCHAR(500),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        visitor_id VARCHAR(64),
        session_id VARCHAR(64),
        status VARCHAR(20) DEFAULT 'active',
        confirmed_at TIMESTAMP,
        unsubscribed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // A/B Tests Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_ab_tests (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(100) UNIQUE NOT NULL,
        test_description TEXT,
        variants JSONB NOT NULL,
        target_metric VARCHAR(100),
        traffic_allocation DECIMAL(3,2),
        status VARCHAR(20) DEFAULT 'draft',
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        winner_variant VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // A/B Test Results Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_ab_test_results (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES despun_ab_tests(id),
        variant_id VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        visitors INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5,4),
        metrics JSONB,
        UNIQUE(test_id, variant_id, date)
      )
    `;

    // System Health Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_system_health (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL,
        api_response_time_avg INTEGER,
        api_response_time_p95 INTEGER,
        api_error_rate DECIMAL(5,4),
        api_requests_total INTEGER,
        cache_hit_rate DECIMAL(5,4),
        cache_size_mb DECIMAL(10,2),
        rss_feeds_status JSONB,
        rss_feeds_healthy INTEGER,
        rss_feeds_total INTEGER,
        llm_requests INTEGER,
        llm_avg_latency INTEGER,
        llm_errors INTEGER,
        llm_tokens_used INTEGER,
        db_query_time_avg INTEGER,
        db_connections_active INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // SEO Metrics Table
    await db`
      CREATE TABLE IF NOT EXISTS despun_seo_metrics (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        organic_visitors INTEGER DEFAULT 0,
        organic_pageviews INTEGER DEFAULT 0,
        search_impressions INTEGER,
        search_clicks INTEGER,
        avg_position DECIMAL(5,2),
        social_shares JSONB,
        backlinks_count INTEGER,
        referring_domains INTEGER,
        top_queries JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for better query performance
    await db`CREATE INDEX IF NOT EXISTS idx_events_type ON despun_analytics_events(event_type)`;
    await db`CREATE INDEX IF NOT EXISTS idx_events_session ON despun_analytics_events(session_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_events_visitor ON despun_analytics_events(visitor_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_events_created ON despun_analytics_events(created_at)`;
    await db`CREATE INDEX IF NOT EXISTS idx_events_story ON despun_analytics_events(story_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON despun_sessions(visitor_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_sessions_started ON despun_sessions(started_at)`;
    await db`CREATE INDEX IF NOT EXISTS idx_daily_date ON despun_daily_metrics(date)`;
    await db`CREATE INDEX IF NOT EXISTS idx_story_perf_date ON despun_story_performance(date)`;
    await db`CREATE INDEX IF NOT EXISTS idx_story_perf_story ON despun_story_performance(story_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_system_health_ts ON despun_system_health(timestamp)`;

    console.log("Analytics tables initialized successfully");
  } catch (error) {
    console.error("Failed to initialize analytics tables:", error);
    throw error;
  }
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

export async function saveEvent(event: Omit<AnalyticsEvent, "id" | "created_at">): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_analytics_events (
          event_type, session_id, visitor_id, page_path, story_id,
          referrer, utm_source, utm_medium, utm_campaign,
          device_type, browser, os, country, region, city,
          scroll_depth, time_on_page, metadata
        ) VALUES (
          ${event.event_type}, ${event.session_id}, ${event.visitor_id || null},
          ${event.page_path || null}, ${event.story_id || null},
          ${event.referrer || null}, ${event.utm_source || null},
          ${event.utm_medium || null}, ${event.utm_campaign || null},
          ${event.device_type || null}, ${event.browser || null},
          ${event.os || null}, ${event.country || null},
          ${event.region || null}, ${event.city || null},
          ${event.scroll_depth || null}, ${event.time_on_page || null},
          ${event.metadata ? JSON.stringify(event.metadata) : null}::jsonb
        )
      `;
    });
  } catch (error) {
    console.error("Failed to save event:", error);
  }
}

export async function saveBatchEvents(events: Omit<AnalyticsEvent, "id" | "created_at">[]): Promise<void> {
  if (events.length === 0) return;

  try {
    await withRetry(async () => {
      const db = getDb();
      for (const event of events) {
        await db`
          INSERT INTO despun_analytics_events (
            event_type, session_id, visitor_id, page_path, story_id,
            referrer, utm_source, utm_medium, utm_campaign,
            device_type, browser, os, country, region, city,
            scroll_depth, time_on_page, metadata
          ) VALUES (
            ${event.event_type}, ${event.session_id}, ${event.visitor_id || null},
            ${event.page_path || null}, ${event.story_id || null},
            ${event.referrer || null}, ${event.utm_source || null},
            ${event.utm_medium || null}, ${event.utm_campaign || null},
            ${event.device_type || null}, ${event.browser || null},
            ${event.os || null}, ${event.country || null},
            ${event.region || null}, ${event.city || null},
            ${event.scroll_depth || null}, ${event.time_on_page || null},
            ${event.metadata ? JSON.stringify(event.metadata) : null}::jsonb
          )
        `;
      }
    });
  } catch (error) {
    console.error("Failed to save batch events:", error);
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export async function upsertSession(session: Omit<Session, "id" | "created_at" | "updated_at">): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_sessions (
          session_id, visitor_id, started_at, ended_at, duration_seconds,
          page_count, stories_viewed, stories_expanded, sources_clicked,
          entry_page, exit_page, referrer, utm_source, utm_medium,
          device_type, browser, os, country, is_bounce, is_return_visitor
        ) VALUES (
          ${session.session_id}, ${session.visitor_id || null},
          ${session.started_at}, ${session.ended_at || null},
          ${session.duration_seconds || null}, ${session.page_count},
          ${session.stories_viewed}, ${session.stories_expanded},
          ${session.sources_clicked}, ${session.entry_page || null},
          ${session.exit_page || null}, ${session.referrer || null},
          ${session.utm_source || null}, ${session.utm_medium || null},
          ${session.device_type || null}, ${session.browser || null},
          ${session.os || null}, ${session.country || null},
          ${session.is_bounce}, ${session.is_return_visitor}
        )
        ON CONFLICT (session_id) DO UPDATE SET
          ended_at = EXCLUDED.ended_at,
          duration_seconds = EXCLUDED.duration_seconds,
          page_count = EXCLUDED.page_count,
          stories_viewed = EXCLUDED.stories_viewed,
          stories_expanded = EXCLUDED.stories_expanded,
          sources_clicked = EXCLUDED.sources_clicked,
          exit_page = EXCLUDED.exit_page,
          is_bounce = EXCLUDED.is_bounce,
          updated_at = NOW()
      `;
    });
  } catch (error) {
    console.error("Failed to upsert session:", error);
  }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export async function getOverviewMetrics(days: number = 7): Promise<{
  pageviews: number;
  uniqueVisitors: number;
  sessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  storyExpands: number;
  previousPageviews: number;
  previousUniqueVisitors: number;
  previousSessions: number;
  previousAvgSessionDuration: number;
  previousBounceRate: number;
  previousStoryExpands: number;
}> {
  try {
    const db = getDb();

    // Current period
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);
    const currentStartStr = currentStart.toISOString();

    // Previous period
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - days * 2);
    const previousStartStr = previousStart.toISOString();
    const previousEndStr = currentStartStr;

    const [current] = await db`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'pageview') as pageviews,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) FILTER (WHERE event_type = 'story_expand') as story_expands
      FROM despun_analytics_events
      WHERE created_at >= ${currentStartStr}
    `;

    const [previous] = await db`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'pageview') as pageviews,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) FILTER (WHERE event_type = 'story_expand') as story_expands
      FROM despun_analytics_events
      WHERE created_at >= ${previousStartStr} AND created_at < ${previousEndStr}
    `;

    const [sessionStats] = await db`
      SELECT
        AVG(duration_seconds) as avg_duration,
        AVG(CASE WHEN is_bounce THEN 1 ELSE 0 END) * 100 as bounce_rate
      FROM despun_sessions
      WHERE started_at >= ${currentStartStr}
    `;

    const [prevSessionStats] = await db`
      SELECT
        AVG(duration_seconds) as avg_duration,
        AVG(CASE WHEN is_bounce THEN 1 ELSE 0 END) * 100 as bounce_rate
      FROM despun_sessions
      WHERE started_at >= ${previousStartStr} AND started_at < ${previousEndStr}
    `;

    return {
      pageviews: Number(current?.pageviews || 0),
      uniqueVisitors: Number(current?.unique_visitors || 0),
      sessions: Number(current?.sessions || 0),
      avgSessionDuration: Number(sessionStats?.avg_duration || 0),
      bounceRate: Number(sessionStats?.bounce_rate || 0),
      storyExpands: Number(current?.story_expands || 0),
      previousPageviews: Number(previous?.pageviews || 0),
      previousUniqueVisitors: Number(previous?.unique_visitors || 0),
      previousSessions: Number(previous?.sessions || 0),
      previousAvgSessionDuration: Number(prevSessionStats?.avg_duration || 0),
      previousBounceRate: Number(prevSessionStats?.bounce_rate || 0),
      previousStoryExpands: Number(previous?.story_expands || 0),
    };
  } catch (error) {
    console.error("Failed to get overview metrics:", error);
    return {
      pageviews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      storyExpands: 0,
      previousPageviews: 0,
      previousUniqueVisitors: 0,
      previousSessions: 0,
      previousAvgSessionDuration: 0,
      previousBounceRate: 0,
      previousStoryExpands: 0,
    };
  }
}

export async function getTrafficByDay(days: number = 30): Promise<
  { date: string; pageviews: number; visitors: number; sessions: number }[]
> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await getDb()`
      SELECT
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE event_type = 'pageview') as pageviews,
        COUNT(DISTINCT visitor_id) as visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return result.map((row) => ({
      date: row.date.toISOString().split("T")[0],
      pageviews: Number(row.pageviews),
      visitors: Number(row.visitors),
      sessions: Number(row.sessions),
    }));
  } catch (error) {
    console.error("Failed to get traffic by day:", error);
    return [];
  }
}

export async function getTrafficSources(days: number = 30): Promise<
  { source: string; visitors: number; percentage: number }[]
> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await getDb()`
      SELECT
        CASE
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          WHEN referrer LIKE '%google%' OR referrer LIKE '%bing%' OR referrer LIKE '%duckduckgo%' THEN 'Organic Search'
          WHEN referrer LIKE '%twitter%' OR referrer LIKE '%facebook%' OR referrer LIKE '%linkedin%' OR referrer LIKE '%reddit%' THEN 'Social'
          ELSE 'Referral'
        END as source,
        COUNT(DISTINCT visitor_id) as visitors
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()} AND event_type = 'pageview'
      GROUP BY source
      ORDER BY visitors DESC
    `;

    const total = result.reduce((sum, row) => sum + Number(row.visitors), 0);

    return result.map((row) => ({
      source: row.source,
      visitors: Number(row.visitors),
      percentage: total > 0 ? Math.round((Number(row.visitors) / total) * 100) : 0,
    }));
  } catch (error) {
    console.error("Failed to get traffic sources:", error);
    return [];
  }
}

export async function getDeviceBreakdown(days: number = 30): Promise<
  { device: string; visitors: number; percentage: number }[]
> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await getDb()`
      SELECT
        COALESCE(device_type, 'Unknown') as device,
        COUNT(DISTINCT visitor_id) as visitors
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()} AND event_type = 'pageview'
      GROUP BY device_type
      ORDER BY visitors DESC
    `;

    const total = result.reduce((sum, row) => sum + Number(row.visitors), 0);

    return result.map((row) => ({
      device: row.device,
      visitors: Number(row.visitors),
      percentage: total > 0 ? Math.round((Number(row.visitors) / total) * 100) : 0,
    }));
  } catch (error) {
    console.error("Failed to get device breakdown:", error);
    return [];
  }
}

export async function getGeoBreakdown(days: number = 30): Promise<
  { country: string; visitors: number; percentage: number }[]
> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await getDb()`
      SELECT
        COALESCE(country, 'Unknown') as country,
        COUNT(DISTINCT visitor_id) as visitors
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()} AND event_type = 'pageview'
      GROUP BY country
      ORDER BY visitors DESC
      LIMIT 10
    `;

    const total = result.reduce((sum, row) => sum + Number(row.visitors), 0);

    return result.map((row) => ({
      country: row.country,
      visitors: Number(row.visitors),
      percentage: total > 0 ? Math.round((Number(row.visitors) / total) * 100) : 0,
    }));
  } catch (error) {
    console.error("Failed to get geo breakdown:", error);
    return [];
  }
}

export async function getTopStories(days: number = 30, limit: number = 10): Promise<
  {
    storyId: string;
    topic: string;
    views: number;
    expands: number;
    expandRate: number;
    sourceClicks: number;
  }[]
> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await getDb()`
      SELECT
        story_id,
        MAX(metadata->>'topic') as topic,
        COUNT(*) FILTER (WHERE event_type = 'story_view') as views,
        COUNT(*) FILTER (WHERE event_type = 'story_expand') as expands,
        COUNT(*) FILTER (WHERE event_type = 'source_click') as source_clicks
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()}
        AND story_id IS NOT NULL
      GROUP BY story_id
      ORDER BY views DESC
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      storyId: row.story_id,
      topic: row.topic || "Unknown",
      views: Number(row.views),
      expands: Number(row.expands),
      expandRate: Number(row.views) > 0 ? Math.round((Number(row.expands) / Number(row.views)) * 100) : 0,
      sourceClicks: Number(row.source_clicks),
    }));
  } catch (error) {
    console.error("Failed to get top stories:", error);
    return [];
  }
}

export async function getRealtimeVisitors(minutes: number = 30): Promise<number> {
  try {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const [result] = await getDb()`
      SELECT COUNT(DISTINCT session_id) as active_visitors
      FROM despun_analytics_events
      WHERE created_at >= ${startTime.toISOString()}
    `;

    return Number(result?.active_visitors || 0);
  } catch (error) {
    console.error("Failed to get realtime visitors:", error);
    return 0;
  }
}

export async function getRealtimeActivity(minutes: number = 30): Promise<
  { time: string; visitors: number }[]
> {
  try {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const result = await getDb()`
      SELECT
        DATE_TRUNC('minute', created_at) as time,
        COUNT(DISTINCT session_id) as visitors
      FROM despun_analytics_events
      WHERE created_at >= ${startTime.toISOString()}
      GROUP BY DATE_TRUNC('minute', created_at)
      ORDER BY time ASC
    `;

    return result.map((row) => ({
      time: row.time.toISOString(),
      visitors: Number(row.visitors),
    }));
  } catch (error) {
    console.error("Failed to get realtime activity:", error);
    return [];
  }
}

// ============================================================================
// GROWTH METRICS (AARRR)
// ============================================================================

export async function getGrowthMetrics(days: number = 30): Promise<{
  acquisition: {
    newVisitors: number;
    totalVisitors: number;
    growthRate: number;
  };
  activation: {
    activatedUsers: number;
    activationRate: number;
  };
  retention: {
    returnVisitors: number;
    retentionRate: number;
  };
  referral: {
    referredVisitors: number;
    viralCoefficient: number;
  };
}> {
  try {
    const db = getDb();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - days * 2);

    // Acquisition
    const [acquisition] = await db`
      SELECT
        COUNT(DISTINCT visitor_id) as total_visitors,
        COUNT(DISTINCT CASE WHEN is_return_visitor = false THEN visitor_id END) as new_visitors
      FROM despun_sessions
      WHERE started_at >= ${startDate.toISOString()}
    `;

    const [prevAcquisition] = await db`
      SELECT COUNT(DISTINCT visitor_id) as total_visitors
      FROM despun_sessions
      WHERE started_at >= ${previousStart.toISOString()}
        AND started_at < ${startDate.toISOString()}
    `;

    // Activation (users who expanded at least one story)
    const [activation] = await db`
      SELECT
        COUNT(DISTINCT visitor_id) as activated_users
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()}
        AND event_type = 'story_expand'
    `;

    // Retention
    const [retention] = await db`
      SELECT
        COUNT(DISTINCT CASE WHEN is_return_visitor = true THEN visitor_id END) as return_visitors
      FROM despun_sessions
      WHERE started_at >= ${startDate.toISOString()}
    `;

    // Referral
    const [referral] = await db`
      SELECT
        COUNT(DISTINCT visitor_id) as referred_visitors
      FROM despun_analytics_events
      WHERE created_at >= ${startDate.toISOString()}
        AND utm_source IS NOT NULL
        AND utm_medium = 'referral'
    `;

    const totalVisitors = Number(acquisition?.total_visitors || 0);
    const newVisitors = Number(acquisition?.new_visitors || 0);
    const prevTotal = Number(prevAcquisition?.total_visitors || 1);
    const activatedUsers = Number(activation?.activated_users || 0);
    const returnVisitors = Number(retention?.return_visitors || 0);
    const referredVisitors = Number(referral?.referred_visitors || 0);

    return {
      acquisition: {
        newVisitors,
        totalVisitors,
        growthRate: prevTotal > 0 ? Math.round(((totalVisitors - prevTotal) / prevTotal) * 100) : 0,
      },
      activation: {
        activatedUsers,
        activationRate: totalVisitors > 0 ? Math.round((activatedUsers / totalVisitors) * 100) : 0,
      },
      retention: {
        returnVisitors,
        retentionRate: totalVisitors > 0 ? Math.round((returnVisitors / totalVisitors) * 100) : 0,
      },
      referral: {
        referredVisitors,
        viralCoefficient: totalVisitors > 0 ? Number((referredVisitors / totalVisitors).toFixed(2)) : 0,
      },
    };
  } catch (error) {
    console.error("Failed to get growth metrics:", error);
    return {
      acquisition: { newVisitors: 0, totalVisitors: 0, growthRate: 0 },
      activation: { activatedUsers: 0, activationRate: 0 },
      retention: { returnVisitors: 0, retentionRate: 0 },
      referral: { referredVisitors: 0, viralCoefficient: 0 },
    };
  }
}

export async function getRetentionCohorts(weeks: number = 8): Promise<
  { cohort: string; week0: number; week1: number; week2: number; week3: number }[]
> {
  try {
    const db = getDb();
    const cohorts: { cohort: string; week0: number; week1: number; week2: number; week3: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const cohortStart = new Date();
      cohortStart.setDate(cohortStart.getDate() - (i + 1) * 7);
      const cohortEnd = new Date();
      cohortEnd.setDate(cohortEnd.getDate() - i * 7);

      const [result] = await db`
        WITH cohort_users AS (
          SELECT DISTINCT visitor_id
          FROM despun_sessions
          WHERE started_at >= ${cohortStart.toISOString()}
            AND started_at < ${cohortEnd.toISOString()}
            AND is_return_visitor = false
        )
        SELECT
          COUNT(*) as week0,
          COUNT(*) FILTER (
            WHERE visitor_id IN (
              SELECT DISTINCT visitor_id FROM despun_sessions
              WHERE started_at >= ${cohortEnd.toISOString()}
                AND started_at < ${new Date(cohortEnd.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}
            )
          ) as week1,
          COUNT(*) FILTER (
            WHERE visitor_id IN (
              SELECT DISTINCT visitor_id FROM despun_sessions
              WHERE started_at >= ${new Date(cohortEnd.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                AND started_at < ${new Date(cohortEnd.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()}
            )
          ) as week2,
          COUNT(*) FILTER (
            WHERE visitor_id IN (
              SELECT DISTINCT visitor_id FROM despun_sessions
              WHERE started_at >= ${new Date(cohortEnd.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()}
                AND started_at < ${new Date(cohortEnd.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString()}
            )
          ) as week3
        FROM cohort_users
      `;

      cohorts.push({
        cohort: cohortStart.toISOString().split("T")[0],
        week0: Number(result?.week0 || 0),
        week1: Number(result?.week1 || 0),
        week2: Number(result?.week2 || 0),
        week3: Number(result?.week3 || 0),
      });
    }

    return cohorts;
  } catch (error) {
    console.error("Failed to get retention cohorts:", error);
    return [];
  }
}

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

export async function saveSystemHealth(health: Omit<SystemHealth, "id" | "created_at">): Promise<void> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_system_health (
          timestamp, api_response_time_avg, api_response_time_p95,
          api_error_rate, api_requests_total, cache_hit_rate, cache_size_mb,
          rss_feeds_status, rss_feeds_healthy, rss_feeds_total,
          llm_requests, llm_avg_latency, llm_errors, llm_tokens_used,
          db_query_time_avg, db_connections_active
        ) VALUES (
          ${health.timestamp}, ${health.api_response_time_avg || null},
          ${health.api_response_time_p95 || null}, ${health.api_error_rate || null},
          ${health.api_requests_total || null}, ${health.cache_hit_rate || null},
          ${health.cache_size_mb || null},
          ${health.rss_feeds_status ? JSON.stringify(health.rss_feeds_status) : null}::jsonb,
          ${health.rss_feeds_healthy || null}, ${health.rss_feeds_total || null},
          ${health.llm_requests || null}, ${health.llm_avg_latency || null},
          ${health.llm_errors || null}, ${health.llm_tokens_used || null},
          ${health.db_query_time_avg || null}, ${health.db_connections_active || null}
        )
      `;
    });
  } catch (error) {
    console.error("Failed to save system health:", error);
  }
}

export async function getSystemHealthHistory(hours: number = 24): Promise<SystemHealth[]> {
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const result = await getDb()`
      SELECT *
      FROM despun_system_health
      WHERE timestamp >= ${startTime.toISOString()}
      ORDER BY timestamp ASC
    `;

    return result.map((row) => ({
      id: row.id,
      timestamp: row.timestamp.toISOString(),
      api_response_time_avg: row.api_response_time_avg,
      api_response_time_p95: row.api_response_time_p95,
      api_error_rate: Number(row.api_error_rate),
      api_requests_total: row.api_requests_total,
      cache_hit_rate: Number(row.cache_hit_rate),
      cache_size_mb: Number(row.cache_size_mb),
      rss_feeds_status: row.rss_feeds_status,
      rss_feeds_healthy: row.rss_feeds_healthy,
      rss_feeds_total: row.rss_feeds_total,
      llm_requests: row.llm_requests,
      llm_avg_latency: row.llm_avg_latency,
      llm_errors: row.llm_errors,
      llm_tokens_used: row.llm_tokens_used,
      db_query_time_avg: row.db_query_time_avg,
      db_connections_active: row.db_connections_active,
    }));
  } catch (error) {
    console.error("Failed to get system health history:", error);
    return [];
  }
}

// ============================================================================
// NEWSLETTER
// ============================================================================

export async function saveNewsletterSignup(signup: Omit<NewsletterSignup, "id" | "created_at" | "status">): Promise<boolean> {
  try {
    await withRetry(async () => {
      await getDb()`
        INSERT INTO despun_newsletter_signups (
          email, signup_source, referrer, utm_source, utm_medium,
          utm_campaign, visitor_id, session_id
        ) VALUES (
          ${signup.email}, ${signup.signup_source || null},
          ${signup.referrer || null}, ${signup.utm_source || null},
          ${signup.utm_medium || null}, ${signup.utm_campaign || null},
          ${signup.visitor_id || null}, ${signup.session_id || null}
        )
      `;
    });
    return true;
  } catch (error) {
    // Likely duplicate email
    console.error("Failed to save newsletter signup:", error);
    return false;
  }
}

export async function getNewsletterStats(days: number = 30): Promise<{
  totalSignups: number;
  recentSignups: number;
  signupsBySource: { source: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
}> {
  try {
    const db = getDb();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totals] = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= ${startDate.toISOString()}) as recent
      FROM despun_newsletter_signups
      WHERE status = 'active'
    `;

    const bySource = await db`
      SELECT
        COALESCE(signup_source, 'Unknown') as source,
        COUNT(*) as count
      FROM despun_newsletter_signups
      WHERE created_at >= ${startDate.toISOString()} AND status = 'active'
      GROUP BY signup_source
      ORDER BY count DESC
    `;

    const byDay = await db`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM despun_newsletter_signups
      WHERE created_at >= ${startDate.toISOString()} AND status = 'active'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      totalSignups: Number(totals?.total || 0),
      recentSignups: Number(totals?.recent || 0),
      signupsBySource: bySource.map((row) => ({
        source: row.source,
        count: Number(row.count),
      })),
      signupsByDay: byDay.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        count: Number(row.count),
      })),
    };
  } catch (error) {
    console.error("Failed to get newsletter stats:", error);
    return {
      totalSignups: 0,
      recentSignups: 0,
      signupsBySource: [],
      signupsByDay: [],
    };
  }
}

// ============================================================================
// A/B TESTING
// ============================================================================

export async function createABTest(test: Omit<ABTest, "id" | "created_at" | "updated_at">): Promise<number | null> {
  try {
    const [result] = await withRetry(async () => {
      return await getDb()`
        INSERT INTO despun_ab_tests (
          test_name, test_description, variants, target_metric,
          traffic_allocation, status, started_at, ended_at, winner_variant
        ) VALUES (
          ${test.test_name}, ${test.test_description || null},
          ${JSON.stringify(test.variants)}::jsonb, ${test.target_metric},
          ${test.traffic_allocation}, ${test.status},
          ${test.started_at || null}, ${test.ended_at || null},
          ${test.winner_variant || null}
        )
        RETURNING id
      `;
    });
    return result?.id || null;
  } catch (error) {
    console.error("Failed to create A/B test:", error);
    return null;
  }
}

export async function getABTests(): Promise<ABTest[]> {
  try {
    const result = await getDb()`
      SELECT *
      FROM despun_ab_tests
      ORDER BY created_at DESC
    `;

    return result.map((row) => ({
      id: row.id,
      test_name: row.test_name,
      test_description: row.test_description,
      variants: row.variants,
      target_metric: row.target_metric,
      traffic_allocation: Number(row.traffic_allocation),
      status: row.status,
      started_at: row.started_at?.toISOString(),
      ended_at: row.ended_at?.toISOString(),
      winner_variant: row.winner_variant,
      created_at: row.created_at?.toISOString(),
      updated_at: row.updated_at?.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to get A/B tests:", error);
    return [];
  }
}

export async function getABTestResults(testId: number): Promise<ABTestResult[]> {
  try {
    const result = await getDb()`
      SELECT *
      FROM despun_ab_test_results
      WHERE test_id = ${testId}
      ORDER BY date ASC, variant_id ASC
    `;

    return result.map((row) => ({
      id: row.id,
      test_id: row.test_id,
      variant_id: row.variant_id,
      date: row.date.toISOString().split("T")[0],
      visitors: row.visitors,
      conversions: row.conversions,
      conversion_rate: Number(row.conversion_rate),
      metrics: row.metrics,
    }));
  } catch (error) {
    console.error("Failed to get A/B test results:", error);
    return [];
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

export async function cleanupOldData(retentionDays: number = 90): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await getDb()`
      DELETE FROM despun_analytics_events
      WHERE created_at < ${cutoffDate.toISOString()}
    `;

    await getDb()`
      DELETE FROM despun_sessions
      WHERE created_at < ${cutoffDate.toISOString()}
    `;

    await getDb()`
      DELETE FROM despun_system_health
      WHERE created_at < ${cutoffDate.toISOString()}
    `;

    console.log(`Cleaned up analytics data older than ${retentionDays} days`);
  } catch (error) {
    console.error("Failed to cleanup old data:", error);
  }
}
