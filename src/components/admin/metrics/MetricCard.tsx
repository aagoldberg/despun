"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  loading = false,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-emerald-600" : "text-rose-600";
  const changeBg = isPositive ? "bg-emerald-50" : "bg-rose-50";

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-pulse">
        <div className="h-4 bg-zinc-200 rounded w-24 mb-4"></div>
        <div className="h-8 bg-zinc-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-zinc-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>

      <div className="mb-2">
        <span className="text-3xl font-bold text-zinc-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
            {isPositive ? (
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-xs text-zinc-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
