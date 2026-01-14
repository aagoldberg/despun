"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredAuthKey } from "@/components/admin/AuthProvider";

interface ABTest {
  id: number;
  test_name: string;
  test_description?: string;
  variants: { id: string; name: string }[];
  target_metric: string;
  traffic_allocation: number;
  status: "draft" | "running" | "paused" | "completed";
  started_at?: string;
  ended_at?: string;
  winner_variant?: string;
  created_at?: string;
}

export default function ExperimentsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authKey = getStoredAuthKey();

      const response = await fetch("/api/admin/experiments", {
        headers: { Authorization: `Bearer ${authKey}` },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setTests(result.data.tests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "paused":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">A/B Experiments</h1>
          <p className="text-zinc-500 mt-1">Test and optimize your user experience</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Experiment
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tests List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-6 animate-pulse">
              <div className="h-6 bg-zinc-100 rounded w-48 mb-4" />
              <div className="h-4 bg-zinc-100 rounded w-96 mb-2" />
              <div className="h-4 bg-zinc-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No experiments yet</h3>
          <p className="text-zinc-500 mb-6">Create your first A/B test to start optimizing</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Experiment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{test.test_name}</h3>
                  {test.test_description && (
                    <p className="text-zinc-500 mt-1">{test.test_description}</p>
                  )}
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(test.status)}`}>
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Target Metric</p>
                  <p className="font-medium text-zinc-900">{test.target_metric}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Variants</p>
                  <p className="font-medium text-zinc-900">{test.variants.length}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Traffic</p>
                  <p className="font-medium text-zinc-900">{Math.round(test.traffic_allocation * 100)}%</p>
                </div>
                <div>
                  <p className="text-zinc-500">Created</p>
                  <p className="font-medium text-zinc-900">
                    {test.created_at ? new Date(test.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {test.winner_variant && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <span className="inline-flex items-center gap-2 text-emerald-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Winner: Variant {test.winner_variant}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">How A/B Testing Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900">Create Test</h4>
              <p className="text-sm text-zinc-500">Define variants and target metrics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900">Run Experiment</h4>
              <p className="text-sm text-zinc-500">Split traffic between variants</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium text-zinc-900">Analyze Results</h4>
              <p className="text-sm text-zinc-500">Pick the winning variant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal (simplified) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Create Experiment</h2>
            <p className="text-zinc-500 mb-6">
              A/B testing is configured but the full experiment builder is coming soon.
              For now, experiments can be set up via the database directly.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
