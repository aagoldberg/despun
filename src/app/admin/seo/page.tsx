"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import MetricCard from "@/components/admin/metrics/MetricCard";
import MetricGrid from "@/components/admin/metrics/MetricGrid";
import DateRangePicker from "@/components/admin/DateRangePicker";

interface SEOData {
  organic: {
    visitors: number;
    percentage: number;
  };
  searchConsole: {
    available: boolean;
    message: string;
  };
  social: {
    available: boolean;
    message: string;
  };
  backlinks: {
    available: boolean;
    message: string;
  };
  tips: string[];
}

export default function SEOPage() {
  const [data, setData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();
      const days = parseInt(dateRange.replace("d", ""), 10);

      const response = await fetch(`/api/admin/seo/metrics?days=${days}`, {
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
          <h1 className="text-2xl font-bold text-zinc-900">SEO & Discovery</h1>
          <p className="text-zinc-500 mt-1">Track organic growth and search visibility</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <MetricGrid columns={3}>
        <MetricCard
          title="Organic Visitors"
          value={data?.organic.visitors || 0}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Organic Traffic %"
          value={`${data?.organic.percentage || 0}%`}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <MetricCard
          title="Search Console"
          value={data?.searchConsole.available ? "Connected" : "Not Connected"}
          loading={loading}
          icon={
            <div className={`w-3 h-3 rounded-full ${
              data?.searchConsole.available ? "bg-emerald-500" : "bg-zinc-300"
            }`} />
          }
        />
      </MetricGrid>

      {/* Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900">Google Search Console</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-4">{data?.searchConsole.message}</p>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Learn how to connect
          </button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900">Social Sharing</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-4">{data?.social.message}</p>
          <span className="text-sm text-zinc-400">Coming soon</span>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900">Backlinks</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-4">{data?.backlinks.message}</p>
          <span className="text-sm text-zinc-400">Requires Ahrefs/Moz</span>
        </div>
      </div>

      {/* SEO Tips */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
        <h2 className="text-lg font-semibold text-indigo-900 mb-4">SEO Optimization Tips</h2>
        <ul className="space-y-3">
          {data?.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3 text-indigo-700">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Organic Traffic Breakdown */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Organic Traffic Overview</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-zinc-600">Organic Search</span>
              <span className="text-sm font-medium">{data?.organic.percentage || 0}%</span>
            </div>
            <div className="h-4 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${data?.organic.percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-zinc-500 mt-4">
          {data?.organic.percentage || 0}% of your traffic comes from organic search.
          {(data?.organic.percentage || 0) < 30 && " Consider improving SEO to increase organic discovery."}
          {(data?.organic.percentage || 0) >= 30 && (data?.organic.percentage || 0) < 50 && " Good organic presence. Keep creating quality content."}
          {(data?.organic.percentage || 0) >= 50 && " Excellent organic traffic! Your SEO strategy is working well."}
        </p>
      </div>
    </div>
  );
}
