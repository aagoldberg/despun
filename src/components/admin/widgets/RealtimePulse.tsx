"use client";

import { useEffect, useState } from "react";

interface RealtimePulseProps {
  count: number;
  label?: string;
}

export default function RealtimePulse({ count, label = "active now" }: RealtimePulseProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 rounded-lg">
      <div className="relative">
        <div
          className={`w-3 h-3 bg-emerald-500 rounded-full ${
            pulse ? "animate-ping" : ""
          }`}
        />
        <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full" />
      </div>
      <div>
        <span className="text-2xl font-bold text-emerald-700">{count}</span>
        <span className="text-sm text-emerald-600 ml-2">{label}</span>
      </div>
    </div>
  );
}
