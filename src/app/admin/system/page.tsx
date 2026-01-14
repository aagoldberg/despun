"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import MetricCard from "@/components/admin/metrics/MetricCard";
import MetricGrid from "@/components/admin/metrics/MetricGrid";

interface FeedStatus {
  name: string;
  url: string;
  healthy: boolean;
  error?: string;
}

interface SystemData {
  current: {
    timestamp: string;
    rssFeeds: {
      healthy: number;
      total: number;
      feeds: FeedStatus[];
    };
    database: {
      healthy: boolean;
      latency: number;
    };
    api: {
      status: string;
    };
  };
  history: unknown[];
}

export default function SystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();

      const response = await fetch("/api/admin/system/health", {
        headers: { Authorization: `Bearer ${authKey}` },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const overallHealth = data
    ? data.current.rssFeeds.healthy === data.current.rssFeeds.total &&
      data.current.database.healthy
    : false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">System Health</h1>
          <p className="text-zinc-500 mt-1">Monitor infrastructure and service status</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Overall Status */}
      <div className={`rounded-xl border p-6 ${
        overallHealth
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            overallHealth ? "bg-emerald-500" : "bg-amber-500"
          }`}>
            {overallHealth ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${overallHealth ? "text-emerald-900" : "text-amber-900"}`}>
              {overallHealth ? "All Systems Operational" : "Some Issues Detected"}
            </h2>
            <p className={overallHealth ? "text-emerald-700" : "text-amber-700"}>
              Last checked: {data ? new Date(data.current.timestamp).toLocaleString() : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <MetricGrid columns={3}>
        <MetricCard
          title="RSS Feeds"
          value={`${data?.current.rssFeeds.healthy || 0}/${data?.current.rssFeeds.total || 0}`}
          loading={loading}
          icon={
            <div className={`w-3 h-3 rounded-full ${
              data?.current.rssFeeds.healthy === data?.current.rssFeeds.total
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`} />
          }
        />
        <MetricCard
          title="Database"
          value={data?.current.database.healthy ? "Connected" : "Error"}
          loading={loading}
          icon={
            <div className={`w-3 h-3 rounded-full ${
              data?.current.database.healthy ? "bg-emerald-500" : "bg-rose-500"
            }`} />
          }
        />
        <MetricCard
          title="DB Latency"
          value={`${data?.current.database.latency || 0}ms`}
          loading={loading}
          icon={
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </MetricGrid>

      {/* RSS Feed Status */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">RSS Feed Status</h2>
        </div>
        <div className="divide-y divide-zinc-200">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="h-4 bg-zinc-100 rounded w-32 animate-pulse" />
                <div className="h-6 bg-zinc-100 rounded w-20 animate-pulse" />
              </div>
            ))
          ) : (
            data?.current.rssFeeds.feeds.map((feed) => (
              <div key={feed.name} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-zinc-900">{feed.name}</span>
                  <p className="text-xs text-zinc-500 truncate max-w-md">{feed.url}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  feed.healthy
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    feed.healthy ? "bg-emerald-500" : "bg-rose-500"
                  }`} />
                  {feed.healthy ? "Healthy" : feed.error || "Error"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Environment</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-zinc-500">API Status</p>
            <p className="font-medium text-zinc-900">Operational</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Database</p>
            <p className="font-medium text-zinc-900">Neon PostgreSQL</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">AI Provider</p>
            <p className="font-medium text-zinc-900">Anthropic Claude</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Platform</p>
            <p className="font-medium text-zinc-900">Vercel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
