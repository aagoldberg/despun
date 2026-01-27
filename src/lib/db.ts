import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Cache the database connection
let dbInstance: NeonQueryFunction<false, false> | null = null;

// Lazy initialization - only connect when needed (not at build time)
function getDb(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }
  if (!dbInstance) {
    dbInstance = neon(process.env.DATABASE_URL);
  }
  return dbInstance;
}

// Retry wrapper for database operations with exponential backoff
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
      const isRetryable = error instanceof Error &&
        (error.message.includes("fetch failed") ||
         error.message.includes("ECONNRESET") ||
         error.message.includes("socket disconnected"));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function isDBAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await getDb()`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Clearview cache storage - supports tiered analysis (Deep Dive + Quick Take)
export interface ClearviewStory {
  id: string;
  topic: string;
  tier: "deep-dive" | "quick-take";
  category: "politics" | "economy" | "international" | "tech" | "culture" | "other";
  summary: string;
  whatHappened?: string; // Deep Dive only
  sources: {
    name: string;
    lean: string;
    title: string;
    url: string;
    framing: string;
    manipulationTechniques?: string[]; // Deep Dive only
  }[];
  perspectives: {
    lean: string;
    viewpoint: string;
  }[];
  keyTakeaway: string;
  // Deep Dive only fields
  expertConsensus?: {
    type: string;
    exists: boolean;
    statement?: string;
    confidenceLevel: string;
    sources?: string[];
    dissent?: string;
  };
  debateType?: string;
  debateQuestion?: string;
  commonGround?: string[];
  factualDisputes?: {
    claim: string;
    leftPosition: string;
    rightPosition: string;
    evidenceStatus: string;
  }[];
  whyItMatters?: {
    left: {
      coreValue: string;
      motivation: string;
      stance: string;
      emotionalAppeal: string;
    };
    right: {
      coreValue: string;
      motivation: string;
      stance: string;
      emotionalAppeal: string;
    };
    bottomLine: string;
  };
  deeperAnalysis?: {
    unstatedConcerns: {
      left: string[];
      right: string[];
    };
    economicDimension?: string;
    culturalDimension?: string;
    politicalGame: string;
    whatGetsIgnored?: string;
  };
}

export interface ClearviewCache {
  id?: number;
  stories: ClearviewStory[];
  generatedAt: string;
}

export async function initClearviewTable() {
  try {
    await getDb()`
      CREATE TABLE IF NOT EXISTS despun_clearview (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        generated_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error("Failed to create clearview table:", error);
  }
}

export async function saveClearviewData(stories: ClearviewStory[]): Promise<void> {
  try {
    const data = JSON.stringify({ stories });
    const generatedAt = new Date().toISOString();

    await withRetry(async () => {
      // Delete old entries (keep 3 days of history)
      await getDb()`DELETE FROM despun_clearview WHERE generated_at < NOW() - INTERVAL '3 days'`;

      // Insert new entry
      await getDb()`
        INSERT INTO despun_clearview (data, generated_at)
        VALUES (${data}::jsonb, ${generatedAt})
      `;
    });
  } catch (error) {
    console.error("Failed to save clearview data:", error);
  }
}

export async function getClearviewData(maxAgeHours: number = 4): Promise<ClearviewCache | null> {
  try {
    // Calculate the cutoff time
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    const result = await withRetry(async () => {
      const [row] = await getDb()`
        SELECT id, data, generated_at
        FROM despun_clearview
        WHERE generated_at > ${cutoffTime}
        ORDER BY generated_at DESC
        LIMIT 1
      `;
      return row;
    });

    if (result) {
      const data = typeof result.data === "string" ? JSON.parse(result.data) : result.data;
      return {
        id: result.id,
        stories: data.stories || [],
        generatedAt: result.generated_at.toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get clearview data:", error);
    return null;
  }
}

export async function getArchivedClearviewData(excludeLatestId?: number): Promise<ClearviewCache[]> {
  try {
    const result = await withRetry(async () => {
      // Get older entries from the past 3 days, excluding the current one
      if (excludeLatestId) {
        return await getDb()`
          SELECT id, data, generated_at
          FROM despun_clearview
          WHERE id != ${excludeLatestId}
          ORDER BY generated_at DESC
          LIMIT 5
        `;
      }
      return await getDb()`
        SELECT id, data, generated_at
        FROM despun_clearview
        ORDER BY generated_at DESC
        OFFSET 1
        LIMIT 5
      `;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.map((row: any) => {
      const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return {
        stories: data.stories || [],
        generatedAt: row.generated_at.toISOString(),
      };
    });
  } catch (error) {
    console.error("Failed to get archived clearview data:", error);
    return [];
  }
}
