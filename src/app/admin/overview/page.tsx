"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import MetricCard from "@/components/admin/metrics/MetricCard";
import MetricGrid from "@/components/admin/metrics/MetricGrid";
import LineChart from "@/components/admin/charts/LineChart";
import DateRangePicker from "@/components/admin/DateRangePicker";
import RealtimePulse from "@/components/admin/widgets/RealtimePulse";

interface MetricValue {
  value: number;
  change: number;
}

interface OverviewData {
  metrics: {
    pageviews: MetricValue;
    uniqueVisitors: MetricValue;
    sessions: MetricValue;
    avgSessionDuration: MetricValue;
    bounceRate: MetricValue;
    storyExpands: MetricValue;
  };
  trafficByDay: { date: string; pageviews: number; visitors: number; sessions: number }[];
  realtimeVisitors: number;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();
      const days = parseInt(dateRange.replace("d", ""), 10);

      const response = await fetch(`/api/admin/analytics/overview?days=${days}`, {
        headers: {
          Authorization: `Bearer ${authKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh realtime visitors every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
          <p className="text-zinc-500 mt-1">Monitor your key performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <RealtimePulse count={data?.realtimeVisitors || 0} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <MetricGrid columns={6}>
        <MetricCard
          title="Page Views"
          value={data?.metrics.pageviews.value || 0}
          change={data?.metrics.pageviews.change}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <MetricCard
          title="Unique Visitors"
          value={data?.metrics.uniqueVisitors.value || 0}
          change={data?.metrics.uniqueVisitors.change}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Sessions"
          value={data?.metrics.sessions.value || 0}
          change={data?.metrics.sessions.change}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <MetricCard
          title="Avg. Duration"
          value={formatDuration(data?.metrics.avgSessionDuration.value || 0)}
          change={data?.metrics.avgSessionDuration.change}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Bounce Rate"
          value={`${data?.metrics.bounceRate.value || 0}%`}
          change={data?.metrics.bounceRate.change ? -data.metrics.bounceRate.change : undefined}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
        <MetricCard
          title="Story Expands"
          value={data?.metrics.storyExpands.value || 0}
          change={data?.metrics.storyExpands.change}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          }
        />
      </MetricGrid>

      {/* Traffic Chart */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Traffic Over Time</h2>
        {loading ? (
          <div className="h-[300px] bg-zinc-50 rounded-lg animate-pulse" />
        ) : (
          <LineChart
            data={data?.trafficByDay || []}
            xAxisKey="date"
            lines={[
              { dataKey: "pageviews", name: "Page Views", color: "#6366f1" },
              { dataKey: "visitors", name: "Visitors", color: "#8b5cf6" },
              { dataKey: "sessions", name: "Sessions", color: "#a855f7" },
            ]}
            height={300}
          />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Top Actions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Page Views</span>
              <span className="font-semibold">{data?.metrics.pageviews.value.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Story Expands</span>
              <span className="font-semibold">{data?.metrics.storyExpands.value.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Expand Rate</span>
              <span className="font-semibold">
                {data && data.metrics.pageviews.value > 0
                  ? `${((data.metrics.storyExpands.value / data.metrics.pageviews.value) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Engagement Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Total Sessions</span>
              <span className="font-semibold">{data?.metrics.sessions.value.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Avg. Session Time</span>
              <span className="font-semibold">{formatDuration(data?.metrics.avgSessionDuration.value || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Bounce Rate</span>
              <span className="font-semibold">{data?.metrics.bounceRate.value || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
