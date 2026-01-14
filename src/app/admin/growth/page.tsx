"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import MetricCard from "@/components/admin/metrics/MetricCard";
import MetricGrid from "@/components/admin/metrics/MetricGrid";
import FunnelChart from "@/components/admin/charts/FunnelChart";
import LineChart from "@/components/admin/charts/LineChart";
import DateRangePicker from "@/components/admin/DateRangePicker";

interface GrowthData {
  aarrr: {
    acquisition: { newVisitors: number; totalVisitors: number; growthRate: number };
    activation: { activatedUsers: number; activationRate: number };
    retention: { returnVisitors: number; retentionRate: number };
    referral: { referredVisitors: number; viralCoefficient: number };
  };
  retentionCohorts: { cohort: string; week0: number; week1: number; week2: number; week3: number }[];
  newsletter: {
    totalSignups: number;
    recentSignups: number;
    signupsBySource: { source: string; count: number }[];
    signupsByDay: { date: string; count: number }[];
  };
}

export default function GrowthPage() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();
      const days = parseInt(dateRange.replace("d", ""), 10);

      const response = await fetch(`/api/admin/growth/metrics?days=${days}`, {
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

  const funnelData = data ? [
    { name: "Visitors", value: data.aarrr.acquisition.totalVisitors, color: "#6366f1" },
    { name: "Activated", value: data.aarrr.activation.activatedUsers, color: "#8b5cf6" },
    { name: "Retained", value: data.aarrr.retention.returnVisitors, color: "#a855f7" },
    { name: "Referred", value: data.aarrr.referral.referredVisitors, color: "#d946ef" },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Growth Metrics</h1>
          <p className="text-zinc-500 mt-1">Track your AARRR funnel and growth indicators</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* AARRR Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          title="Acquisition"
          value={data?.aarrr.acquisition.newVisitors || 0}
          change={data?.aarrr.acquisition.growthRate}
          changeLabel="growth rate"
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <MetricCard
          title="Activation Rate"
          value={`${data?.aarrr.activation.activationRate || 0}%`}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <MetricCard
          title="Retention Rate"
          value={`${data?.aarrr.retention.retentionRate || 0}%`}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
        <MetricCard
          title="Viral Coefficient"
          value={data?.aarrr.referral.viralCoefficient || 0}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          }
        />
      </MetricGrid>

      {/* AARRR Funnel */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Growth Funnel (AARRR)</h2>
        {loading ? (
          <div className="h-[300px] bg-zinc-50 rounded-lg animate-pulse" />
        ) : (
          <FunnelChart data={funnelData} height={300} />
        )}
      </div>

      {/* Retention Cohorts */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Retention Cohorts</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Cohort</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Week 0</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Week 1</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Week 2</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Week 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 bg-zinc-100 rounded w-24 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-zinc-100 rounded w-12 ml-auto animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-zinc-100 rounded w-12 ml-auto animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-zinc-100 rounded w-12 ml-auto animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-zinc-100 rounded w-12 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : data?.retentionCohorts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No cohort data available yet
                  </td>
                </tr>
              ) : (
                data?.retentionCohorts.map((cohort) => (
                  <tr key={cohort.cohort}>
                    <td className="px-4 py-3 text-sm text-zinc-900">{cohort.cohort}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 text-right">{cohort.week0}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
                        cohort.week0 > 0 && (cohort.week1 / cohort.week0) >= 0.3
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}>
                        {cohort.week1} ({cohort.week0 > 0 ? Math.round((cohort.week1 / cohort.week0) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600">
                        {cohort.week2} ({cohort.week0 > 0 ? Math.round((cohort.week2 / cohort.week0) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600">
                        {cohort.week3} ({cohort.week0 > 0 ? Math.round((cohort.week3 / cohort.week0) * 100) : 0}%)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Newsletter Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Newsletter Signups</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-zinc-600">Total Signups</span>
              <span className="font-semibold">{data?.newsletter.totalSignups || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Recent Signups</span>
              <span className="font-semibold">{data?.newsletter.recentSignups || 0}</span>
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] bg-zinc-50 rounded-lg animate-pulse" />
          ) : (
            <LineChart
              data={data?.newsletter.signupsByDay || []}
              xAxisKey="date"
              lines={[{ dataKey: "count", name: "Signups", color: "#6366f1" }]}
              height={200}
              showLegend={false}
            />
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Signup Sources</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          ) : data?.newsletter.signupsBySource.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No signup data available</p>
          ) : (
            <div className="space-y-3">
              {data?.newsletter.signupsBySource.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-zinc-600">{source.source}</span>
                  <span className="font-semibold">{source.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
