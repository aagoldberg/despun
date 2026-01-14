"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import MetricCard from "@/components/admin/metrics/MetricCard";
import MetricGrid from "@/components/admin/metrics/MetricGrid";
import BarChart from "@/components/admin/charts/BarChart";
import DateRangePicker from "@/components/admin/DateRangePicker";

interface Story {
  storyId: string;
  topic: string;
  views: number;
  expands: number;
  expandRate: number;
  sourceClicks: number;
}

interface ContentData {
  stories: Story[];
  summary: {
    totalViews: number;
    totalExpands: number;
    totalSourceClicks: number;
    avgExpandRate: number;
    storyCount: number;
  };
}

export default function ContentPage() {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();
      const days = parseInt(dateRange.replace("d", ""), 10);

      const response = await fetch(`/api/admin/content/performance?days=${days}`, {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content Performance</h1>
          <p className="text-zinc-500 mt-1">See which stories resonate with your audience</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Metrics */}
      <MetricGrid columns={5}>
        <MetricCard
          title="Total Story Views"
          value={data?.summary.totalViews || 0}
          loading={loading}
        />
        <MetricCard
          title="Total Expands"
          value={data?.summary.totalExpands || 0}
          loading={loading}
        />
        <MetricCard
          title="Avg Expand Rate"
          value={`${data?.summary.avgExpandRate || 0}%`}
          loading={loading}
        />
        <MetricCard
          title="Source Clicks"
          value={data?.summary.totalSourceClicks || 0}
          loading={loading}
        />
        <MetricCard
          title="Stories Tracked"
          value={data?.summary.storyCount || 0}
          loading={loading}
        />
      </MetricGrid>

      {/* Top Stories Chart */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Top Stories by Views</h2>
        {loading ? (
          <div className="h-[400px] bg-zinc-50 rounded-lg animate-pulse" />
        ) : (
          <BarChart
            data={data?.stories.slice(0, 10).map((s) => ({
              name: s.topic.length > 30 ? s.topic.substring(0, 30) + "..." : s.topic,
              value: s.views,
            })) || []}
            height={400}
            horizontal
          />
        )}
      </div>

      {/* Stories Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">All Stories</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Expands
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Expand Rate
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Source Clicks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-48 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-16 ml-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-16 ml-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-16 ml-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : data?.stories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No story data available yet
                  </td>
                </tr>
              ) : (
                data?.stories.map((story) => (
                  <tr key={story.storyId} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 text-sm text-zinc-900">{story.topic}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 text-right">{story.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 text-right">{story.expands.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        story.expandRate >= 30 ? "bg-emerald-50 text-emerald-700" :
                        story.expandRate >= 15 ? "bg-amber-50 text-amber-700" :
                        "bg-zinc-100 text-zinc-600"
                      }`}>
                        {story.expandRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 text-right">{story.sourceClicks.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
