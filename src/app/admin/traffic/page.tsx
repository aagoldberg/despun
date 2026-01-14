"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";
import LineChart from "@/components/admin/charts/LineChart";
import PieChart from "@/components/admin/charts/PieChart";
import BarChart from "@/components/admin/charts/BarChart";
import DateRangePicker from "@/components/admin/DateRangePicker";

interface TrafficData {
  trafficByDay: { date: string; pageviews: number; visitors: number; sessions: number }[];
  trafficSources: { source: string; visitors: number; percentage: number }[];
  deviceBreakdown: { device: string; visitors: number; percentage: number }[];
  geoBreakdown: { country: string; visitors: number; percentage: number }[];
}

export default function TrafficPage() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();
      const days = parseInt(dateRange.replace("d", ""), 10);

      const response = await fetch(`/api/admin/analytics/traffic?days=${days}`, {
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

  const totalVisitors = data?.trafficSources.reduce((sum, s) => sum + s.visitors, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Traffic Analytics</h1>
          <p className="text-zinc-500 mt-1">Understand where your visitors come from</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Traffic Over Time */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Traffic Over Time</h2>
        {loading ? (
          <div className="h-[350px] bg-zinc-50 rounded-lg animate-pulse" />
        ) : (
          <LineChart
            data={data?.trafficByDay || []}
            xAxisKey="date"
            lines={[
              { dataKey: "pageviews", name: "Page Views", color: "#6366f1" },
              { dataKey: "visitors", name: "Visitors", color: "#10b981" },
            ]}
            height={350}
          />
        )}
      </div>

      {/* Traffic Sources & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Traffic Sources</h2>
          {loading ? (
            <div className="h-[300px] bg-zinc-50 rounded-lg animate-pulse" />
          ) : (
            <>
              <PieChart
                data={data?.trafficSources.map((s) => ({ name: s.source, value: s.visitors })) || []}
                height={300}
              />
              <div className="mt-4 space-y-2">
                {data?.trafficSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">{source.source}</span>
                    <span className="font-medium">{source.visitors.toLocaleString()} ({source.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Device Breakdown</h2>
          {loading ? (
            <div className="h-[300px] bg-zinc-50 rounded-lg animate-pulse" />
          ) : (
            <>
              <PieChart
                data={data?.deviceBreakdown.map((d) => ({ name: d.device, value: d.visitors })) || []}
                height={300}
              />
              <div className="mt-4 space-y-2">
                {data?.deviceBreakdown.map((device) => (
                  <div key={device.device} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">{device.device}</span>
                    <span className="font-medium">{device.visitors.toLocaleString()} ({device.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Top Countries</h2>
        {loading ? (
          <div className="h-[300px] bg-zinc-50 rounded-lg animate-pulse" />
        ) : (
          <BarChart
            data={data?.geoBreakdown.map((g) => ({ name: g.country, value: g.visitors })) || []}
            height={300}
            horizontal
          />
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-zinc-500">Total Visitors</p>
            <p className="text-2xl font-bold text-zinc-900">{totalVisitors.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Top Source</p>
            <p className="text-2xl font-bold text-zinc-900">{data?.trafficSources[0]?.source || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Top Device</p>
            <p className="text-2xl font-bold text-zinc-900">{data?.deviceBreakdown[0]?.device || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Top Country</p>
            <p className="text-2xl font-bold text-zinc-900">{data?.geoBreakdown[0]?.country || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
