"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import MetricCard from "@/components/admin/metrics/MetricCard";
import MetricGrid from "@/components/admin/metrics/MetricGrid";
import DateRangePicker from "@/components/admin/DateRangePicker";

interface UserBehaviorData {
  sessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageviews: number;
  pagesPerSession: number;
  storyExpands: number;
  engagementRate: number;
}

export default function UsersPage() {
  const [data, setData] = useState<UserBehaviorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();
      const days = parseInt(dateRange.replace("d", ""), 10);

      const response = await fetch(`/api/admin/users/behavior?days=${days}`, {
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
  }, [dateRange]);

  useEffect(() => {
    fetchData();
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
          <h1 className="text-2xl font-bold text-zinc-900">User Behavior</h1>
          <p className="text-zinc-500 mt-1">Understand how users interact with your content</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Behavior Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          title="Total Sessions"
          value={data?.sessions || 0}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <MetricCard
          title="Avg. Session Duration"
          value={formatDuration(data?.avgSessionDuration || 0)}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Pages per Session"
          value={data?.pagesPerSession || 0}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <MetricCard
          title="Bounce Rate"
          value={`${data?.bounceRate || 0}%`}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
      </MetricGrid>

      {/* Engagement Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Engagement Metrics</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-600">Story Engagement Rate</span>
                <span className="font-semibold">{data?.engagementRate || 0}%</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data?.engagementRate || 0, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-600">Bounce Rate</span>
                <span className="font-semibold">{data?.bounceRate || 0}%</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data?.bounceRate || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Session Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <span className="text-zinc-600">Total Page Views</span>
              <span className="font-semibold text-zinc-900">{data?.pageviews.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <span className="text-zinc-600">Story Expands</span>
              <span className="font-semibold text-zinc-900">{data?.storyExpands.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <span className="text-zinc-600">Total Sessions</span>
              <span className="font-semibold text-zinc-900">{data?.sessions.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-600">Avg. Duration</span>
              <span className="font-semibold text-zinc-900">{formatDuration(data?.avgSessionDuration || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
        <h2 className="text-lg font-semibold text-indigo-900 mb-4">Optimization Tips</h2>
        <ul className="space-y-2 text-indigo-700">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Aim for an engagement rate above 20% - this indicates users are finding stories compelling enough to expand</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>A bounce rate below 50% is good - higher rates may indicate content or UX issues</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Average session duration above 2 minutes suggests strong content engagement</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
