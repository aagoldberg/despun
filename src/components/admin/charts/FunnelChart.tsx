"use client";

interface FunnelStep {
  name: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
  height?: number;
}

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

export default function FunnelChart({ data, height = 300 }: FunnelChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-50 rounded-lg"
        style={{ height }}
      >
        <span className="text-zinc-400">No data available</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3" style={{ minHeight: height }}>
      {data.map((step, index) => {
        const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
        const conversionRate =
          index > 0 && data[index - 1].value > 0
            ? ((step.value / data[index - 1].value) * 100).toFixed(1)
            : null;

        return (
          <div key={step.name} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-zinc-700">{step.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">
                  {step.value.toLocaleString()}
                </span>
                {conversionRate && (
                  <span className="text-xs text-zinc-400">({conversionRate}%)</span>
                )}
              </div>
            </div>
            <div className="h-10 bg-zinc-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500 flex items-center justify-center"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: step.color || COLORS[index % COLORS.length],
                  minWidth: widthPercent > 0 ? "40px" : "0",
                }}
              >
                {widthPercent > 20 && (
                  <span className="text-white text-xs font-medium">
                    {widthPercent.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
